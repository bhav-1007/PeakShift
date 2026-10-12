const Booking = require("../models/booking.js");
const Review = require("../models/review.js");
const { recomputeUserTrust } = require("../utils/trust.js");

module.exports.createReview = async (req, res) => {
  const { bookingId } = req.params;
  const booking = await Booking.findById(bookingId).populate("listing");

  if (!booking) {
    req.flash("error", "Shift booking not found.");
    return res.redirect("/");
  }

  if (booking.status !== "completed") {
    req.flash("error", "Reviews are only allowed after the shift is completed.");
    return res.redirect(req.user.role === "business" ? "/dashboard" : "/bookings/my");
  }

  // Verify only worker or business can review, and identify reviewee
  const isWorker = booking.worker.equals(req.user._id);
  const isBusiness =
    booking.listing &&
    booking.listing.owner &&
    booking.listing.owner.equals(req.user._id);

  if (!isWorker && !isBusiness) {
    req.flash("error", "Only the worker or business for this shift can leave a review.");
    return res.redirect("/");
  }

  const reviewee = isWorker ? booking.listing.owner : booking.worker;
  const redirectUrl = isWorker ? "/bookings/my" : "/dashboard";

  // Check one review per author per booking
  const existingReview = await Review.findOne({
    booking: booking._id,
    author: req.user._id,
  });

  if (existingReview) {
    req.flash("error", "You have already reviewed this shift.");
    return res.redirect(redirectUrl);
  }

  const { rating, comment } = req.body.review;

  try {
    await Review.create({
      booking: booking._id,
      author: req.user._id,
      reviewee,
      rating: Number(rating),
      comment: (comment || "").trim(),
    });
  } catch (err) {
    if (err.code === 11000) {
      req.flash("error", "You have already reviewed this shift.");
      return res.redirect(redirectUrl);
    }
    throw err;
  }

  // Recompute trust score and rating metrics for reviewee
  await recomputeUserTrust(reviewee);

  req.flash("success", "Shift rating submitted successfully!");
  res.redirect(redirectUrl);
};