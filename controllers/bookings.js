const Booking = require("../models/booking.js");
const Listing = require("../models/listing.js");
const Review = require("../models/review.js");
const Transaction = require("../models/transaction.js");
const bookingService = require("../services/bookingService.js");
const { haversineDistance } = require("../utils/geo.js");
const { recomputeUserTrust } = require("../utils/trust.js");
const { notify } = require("../utils/notifications.js");
const {
  CHECKIN_OPENS_MIN_BEFORE,
  CHECKIN_RADIUS_M,
  PLATFORM_FEE_RATE,
} = require("../config/index.js");

module.exports.createBooking = async (req, res) => {
  const { id } = req.params;
  try {
    const booking = await bookingService.acceptShift(id, req.user._id);
    const listing = await Listing.findById(id);
    if (listing && listing.owner) {
      await notify(
        listing.owner,
        `Worker ${req.user.username} accepted a slot for "${listing.title}"`,
        "/dashboard"
      );
    }
    req.flash("success", "Shift accepted! See your reporting details below.");
    res.redirect("/bookings/my");
  } catch (err) {
    req.flash("error", err.message);
    res.redirect(`/listings/${id}`);
  }
};

module.exports.myBookings = async (req, res) => {
  const bookings = await Booking.find({ worker: req.user._id })
    .populate({ path: "listing", populate: { path: "owner" } })
    .sort({ startAt: 1 });

  const myReviews = await Review.find({ author: req.user._id });
  const reviewedBookingIds = new Set(myReviews.map((r) => r.booking.toString()));

  res.render("bookings/my.ejs", {
    bookings,
    reviewedBookingIds,
    config: { CHECKIN_OPENS_MIN_BEFORE, CHECKIN_RADIUS_M },
  });
};

module.exports.cancelBooking = async (req, res) => {
  try {
    const booking = await bookingService.cancelShiftByWorker(req.params.bookingId, req.user._id);
    if (booking && booking.listing && booking.listing.owner) {
      await notify(
        booking.listing.owner,
        `Worker ${req.user.username} cancelled their accepted slot for "${booking.listing.title}"`,
        "/dashboard"
      );
    }
    req.flash("success", "Shift acceptance cancelled.");
  } catch (err) {
    req.flash("error", err.message);
  }
  res.redirect("/bookings/my");
};

module.exports.checkIn = async (req, res) => {
  const { bookingId } = req.params;
  const booking = await Booking.findById(bookingId).populate("listing");

  if (!booking) {
    req.flash("error", "Shift booking not found.");
    return req.session.save(() => res.redirect("/bookings/my"));
  }

  if (booking.status !== "accepted") {
    req.flash("error", `Cannot check in: this shift is already ${booking.status}.`);
    return req.session.save(() => res.redirect("/bookings/my"));
  }

  const now = new Date();
  const opensBeforeMs = (CHECKIN_OPENS_MIN_BEFORE || 30) * 60 * 1000;
  const windowStart = new Date(booking.startAt.getTime() - opensBeforeMs);
  const windowEnd = booking.endAt;

  // 1. Time checks
  if (now < windowStart) {
    req.flash(
      "error",
      `Too early to check in. Check-in opens ${CHECKIN_OPENS_MIN_BEFORE} minutes before shift start.`
    );
    return req.session.save(() => res.redirect("/bookings/my"));
  }

  if (now > windowEnd) {
    req.flash("error", "Too late to check in. Shift has already ended.");
    return req.session.save(() => res.redirect("/bookings/my"));
  }

  // 2. Geolocation coordinates check
  const { lat, lng } = req.body;
  const userLat = parseFloat(lat);
  const userLng = parseFloat(lng);

  if (isNaN(userLat) || isNaN(userLng)) {
    req.flash("error", "Location missing. Please allow location access to check in.");
    return req.session.save(() => res.redirect("/bookings/my"));
  }

  // 3. Proximity / Radius check against shift location
  let distanceM = 0;
  if (booking.listing && booking.listing.geometry && booking.listing.geometry.coordinates) {
    const distanceKm = haversineDistance([userLng, userLat], booking.listing.geometry.coordinates);
    distanceM = Math.round((distanceKm || 0) * 1000);

    const maxRadius = CHECKIN_RADIUS_M || 300;
    if (distanceM > maxRadius) {
      req.flash(
        "error",
        `Too far from shift location. You are ${distanceM}m away (maximum ${maxRadius}m allowed).`
      );
      return req.session.save(() => res.redirect("/bookings/my"));
    }
  }

  // 4. Update booking
  booking.status = "checked_in";
  booking.checkInAt = now;
  booking.checkInCoords = { lat: userLat, lng: userLng };
  booking.checkInDistanceM = distanceM;

  if (req.file) {
    booking.checkInSelfie = {
      url: req.file.path,
      filename: req.file.filename,
    };
  }

  await booking.save();

  // Notify listing owner that worker checked in
  if (booking.listing && booking.listing.owner) {
    await notify(
      booking.listing.owner,
      `Worker ${req.user.username} checked in for "${booking.listing.title}"`,
      "/dashboard"
    );
  }

  req.flash("success", "Checked in successfully! Have a great shift.");
  req.session.save(() => res.redirect("/bookings/my"));
};

module.exports.completeBooking = async (req, res) => {
  const { bookingId } = req.params;
  const booking = await Booking.findById(bookingId).populate("listing");

  if (!booking) {
    req.flash("error", "Shift booking not found.");
    return res.redirect("/dashboard");
  }

  const now = new Date();
  if (now < booking.endAt) {
    req.flash("error", "Cannot mark completed before shift end time.");
    return res.redirect("/dashboard");
  }

  // Atomic update makes double-clicks safe
  const updated = await Booking.findOneAndUpdate(
    { _id: bookingId, status: "checked_in" },
    { status: "completed" },
    { new: true }
  );

  if (!updated) {
    req.flash("error", "Worker is not checked in or already completed.");
    return res.redirect("/dashboard");
  }

  const gross = updated.payAmount;
  const platformFee = updated.platformFee || Math.round(gross * (PLATFORM_FEE_RATE || 0.1));
  const workerNet = gross - platformFee;

  try {
    await Transaction.create({
      booking: updated._id,
      worker: updated.worker,
      business: req.user._id,
      gross,
      platformFee,
      workerNet,
    });
  } catch (err) {
    // If unique key violation, transaction already exists (double-click safe)
  }

  // Recompute trust scores
  await recomputeUserTrust(updated.worker);
  await recomputeUserTrust(req.user._id);

  // Notify worker of completion and payout
  await notify(
    updated.worker,
    `Shift completed! Simulated payout processed for "${booking.listing ? booking.listing.title : 'your shift'}"`,
    "/earnings"
  );

  req.flash("success", "Worker marked completed. Simulated payout processed.");
  res.redirect("/dashboard");
};

module.exports.completeAllForListing = async (req, res) => {
  const { id } = req.params;
  const listing = await Listing.findById(id);

  if (!listing) {
    req.flash("error", "Shift request not found.");
    return res.redirect("/dashboard");
  }

  const now = new Date();
  if (now < listing.endAt) {
    req.flash("error", "Cannot mark completed before shift end time.");
    return res.redirect("/dashboard");
  }

  const checkedInBookings = await Booking.find({
    listing: id,
    status: "checked_in",
  });

  let completedCount = 0;
  for (const b of checkedInBookings) {
    const updated = await Booking.findOneAndUpdate(
      { _id: b._id, status: "checked_in" },
      { status: "completed" },
      { new: true }
    );
    if (updated) {
      completedCount++;
      const gross = updated.payAmount;
      const platformFee = updated.platformFee || Math.round(gross * (PLATFORM_FEE_RATE || 0.1));
      const workerNet = gross - platformFee;
      try {
        await Transaction.create({
          booking: updated._id,
          worker: updated.worker,
          business: req.user._id,
          gross,
          platformFee,
          workerNet,
        });
      } catch (err) {
        // Double-click idempotency
      }
      await recomputeUserTrust(updated.worker);
      await notify(
        updated.worker,
        `Shift completed! Simulated payout processed for "${listing.title}"`,
        "/earnings"
      );
    }
  }

  if (completedCount > 0) {
    await recomputeUserTrust(req.user._id);
  }

  req.flash("success", `Marked ${completedCount} worker(s) completed. Simulated payouts processed.`);
  res.redirect("/dashboard");
};
