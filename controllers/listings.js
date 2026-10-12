const Listing = require("../models/listing.js");
const User = require("../models/user.js");
const Booking = require("../models/booking.js");
const geocodeLocation = require("../utils/geocode.js");
const escapeRegex = require("../utils/escapeRegex.js");
const timeHelpers = require("../utils/time.js");
const { haversineDistance } = require("../utils/geo.js");
const { notify } = require("../utils/notifications.js");
const { listingsFilterSchema } = require("../schema.js");

module.exports.index = async (req, res, next) => {
  // Validate query params with schema; fallback gracefully on validation errors
  const { error, value: validatedQuery } = listingsFilterSchema.validate(req.query, {
    stripUnknown: true,
  });

  const queryParams = error ? req.query : validatedQuery;
  const {
    q,
    skill,
    minPrice,
    when,
    sort = "soonest",
    radius,
    lat,
    lng,
    page = 1,
  } = queryParams;

  const PAGE_SIZE = 6;
  const now = new Date();

  let filter = {
    status: "open",
    startAt: { $gt: now },
  };

  // 1. Text search across title, location, roleType, description
  if (q && q.trim()) {
    const safeQ = escapeRegex(q.trim());
    filter.$or = [
      { title: { $regex: safeQ, $options: "i" } },
      { location: { $regex: safeQ, $options: "i" } },
      { roleType: { $regex: safeQ, $options: "i" } },
      { description: { $regex: safeQ, $options: "i" } },
    ];
  }

  // 2. Skill tag filter
  if (skill && skill.trim()) {
    const safeSkill = escapeRegex(skill.trim());
    filter.skillTags = { $regex: safeSkill, $options: "i" };
  }

  // 3. Minimum pay filter
  if (minPrice && !isNaN(Number(minPrice))) {
    filter.price = { $gte: Number(minPrice) };
  }

  // 4. When filter (interpreted in IST)
  if (when === "next2h") {
    filter.startAt = {
      $gt: now,
      $lte: new Date(now.getTime() + 2 * 60 * 60 * 1000),
    };
  } else if (when === "today") {
    const nowIST = new Date(now.getTime() + 5.5 * 3600 * 1000);
    const endOfTodayIST = new Date(
      Date.UTC(nowIST.getUTCFullYear(), nowIST.getUTCMonth(), nowIST.getUTCDate(), 23, 59, 59, 999) -
        5.5 * 3600 * 1000
    );
    filter.startAt = {
      $gt: now,
      $lte: endOfTodayIST,
    };
  } else if (when === "tomorrow") {
    const nowIST = new Date(now.getTime() + 5.5 * 3600 * 1000);
    const startOfTomorrowIST = new Date(
      Date.UTC(nowIST.getUTCFullYear(), nowIST.getUTCMonth(), nowIST.getUTCDate() + 1, 0, 0, 0, 0) -
        5.5 * 3600 * 1000
    );
    const endOfTomorrowIST = new Date(
      Date.UTC(nowIST.getUTCFullYear(), nowIST.getUTCMonth(), nowIST.getUTCDate() + 1, 23, 59, 59, 999) -
        5.5 * 3600 * 1000
    );
    filter.startAt = {
      $gte: startOfTomorrowIST,
      $lte: endOfTomorrowIST,
    };
  }

  // 5. Geolocation / Radius filter via $geoWithin + $centerSphere
  const queryLat = parseFloat(lat);
  const queryLng = parseFloat(lng);
  const hasQueryCoords = !isNaN(queryLat) && !isNaN(queryLng);

  let userCoords = null;
  if (hasQueryCoords) {
    userCoords = [queryLng, queryLat];
  } else if (
    req.user &&
    req.user.geometry &&
    req.user.geometry.coordinates &&
    req.user.geometry.coordinates.length === 2
  ) {
    userCoords = req.user.geometry.coordinates;
  }

  const validRadii = [2, 5, 10, 20];
  const radiusNum = Number(radius);
  const selectedRadius = validRadii.includes(radiusNum)
    ? radiusNum
    : (hasQueryCoords ? 20 : null);

  if (hasQueryCoords && selectedRadius) {
    // Earth radius ~6378.1 km
    const radiusInRadians = selectedRadius / 6378.1;
    filter.geometry = {
      $geoWithin: {
        $centerSphere: [[queryLng, queryLat], radiusInRadians],
      },
    };
  }

  const currentPage = Math.max(1, parseInt(page) || 1);
  let totalCount = 0;
  let totalPages = 1;
  let allListings = [];

  try {
    totalCount = await Listing.countDocuments(filter);
    totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

    if (sort === "nearest" && userCoords) {
      // Fetch matching listings to sort by haversine distance
      const matchingListings = await Listing.find(filter);

      matchingListings.forEach((listing) => {
        if (listing.geometry && listing.geometry.coordinates) {
          listing.distanceKm = haversineDistance(userCoords, listing.geometry.coordinates);
        } else {
          listing.distanceKm = null;
        }
      });

      matchingListings.sort((a, b) => {
        if (a.distanceKm == null) return 1;
        if (b.distanceKm == null) return -1;
        return a.distanceKm - b.distanceKm;
      });

      allListings = matchingListings.slice(
        (currentPage - 1) * PAGE_SIZE,
        currentPage * PAGE_SIZE
      );
    } else {
      let sortOption = { startAt: 1 };
      if (sort === "highestPay") {
        sortOption = { price: -1 };
      }

      allListings = await Listing.find(filter)
        .sort(sortOption)
        .skip((currentPage - 1) * PAGE_SIZE)
        .limit(PAGE_SIZE);

      if (userCoords) {
        allListings.forEach((listing) => {
          if (listing.geometry && listing.geometry.coordinates) {
            listing.distanceKm = haversineDistance(userCoords, listing.geometry.coordinates);
          } else {
            listing.distanceKm = null;
          }
        });
      }
    }
  } catch (err) {
    return next(err);
  }

  res.render("listings/index.ejs", {
    allListings,
    query: req.query,
    currentPage,
    totalPages,
    userCoords,
    selectedRadius,
  });
};

module.exports.renderNewForm = (req, res) => {
  res.render("listings/new.ejs");
};

module.exports.createListing = async (req, res) => {
  normalizeShiftFields(req.body.listing);

  req.body.listing.startAt = timeHelpers.parseIndiaTime(req.body.listing.startAt);
  req.body.listing.endAt = timeHelpers.parseIndiaTime(req.body.listing.endAt);

  const newListing = new Listing(req.body.listing);
  newListing.owner = req.user._id;
  newListing.filledCount = 0;
  newListing.status = "open";

  const { lat, lng } = req.body.listing;
  if (lat && lng) {
    newListing.geometry = {
      type: "Point",
      coordinates: [parseFloat(lng), parseFloat(lat)],
    };
  } else {
    const geometry = await geocodeLocation(req.body.listing.location);
    if (geometry) {
      newListing.geometry = geometry;
    }
  }

  await newListing.save();

  // Notify nearby workers within 5 km who share a skill tag (max 20 recipients)
  if (
    newListing.geometry &&
    newListing.geometry.coordinates &&
    newListing.geometry.coordinates.length === 2 &&
    newListing.skillTags &&
    newListing.skillTags.length > 0
  ) {
    try {
      const maxDistRad = 5 / 6378.1; // 5 km in radians
      const matchingWorkers = await User.find({
        role: "worker",
        geometry: {
          $geoWithin: {
            $centerSphere: [newListing.geometry.coordinates, maxDistRad],
          },
        },
        skills: { $in: newListing.skillTags },
      }).limit(20);

      for (const worker of matchingWorkers) {
        await notify(
          worker._id,
          `New shift near you: ${newListing.title} (${newListing.location})`,
          `/listings/${newListing._id}`
        );
      }
    } catch (err) {
      console.error("Error notifying nearby workers:", err);
    }
  }

  req.flash("success", "Shift request posted successfully!");
  res.redirect(`/listings/${newListing._id}`);
};

module.exports.myListings = async (req, res) => {
  const myListings = await Listing.find({
    owner: req.user._id,
  }).sort({ startAt: 1 });
  res.render("listings/my.ejs", { myListings });
};

module.exports.wishlistPage = async (req, res) => {
  const user = await User.findById(req.user._id).populate({
    path: "wishlist",
  });
  const wishlistListings = user.wishlist || [];
  res.render("listings/wishlist.ejs", { wishlistListings });
};

module.exports.toggleWishlist = async (req, res) => {
  const { id } = req.params;
  const user = await User.findById(req.user._id);
  const index = user.wishlist.findIndex((listingId) => listingId.equals(id));

  if (index === -1) {
    user.wishlist.push(id);
    await user.save();
    req.flash("success", "Shift saved to your watchlist!");
  } else {
    user.wishlist.splice(index, 1);
    await user.save();
    req.flash("success", "Shift removed from your watchlist.");
  }
  res.redirect(req.get("Referrer") || `/listings/${id}`);
};

module.exports.renderEditForm = async (req, res) => {
  let { id } = req.params;
  const listing = await Listing.findById(id);
  if (!listing) {
    req.flash("error", "Shift request does not exist!");
    return res.redirect("/listings");
  }
  if (listing.status === "cancelled") {
    req.flash("error", "This shift is cancelled and cannot be edited.");
    return res.redirect(`/listings/${id}`);
  }

  res.render("listings/edit.ejs", { listing });
};

module.exports.updateListing = async (req, res) => {
  let { id } = req.params;
  const listing = await Listing.findById(id);
  if (!listing) {
    req.flash("error", "Shift request you tried to update does not exist!");
    return res.redirect("/listings");
  }

  if (listing.status === "cancelled") {
    req.flash("error", "This shift has been cancelled and cannot be edited.");
    return res.redirect(`/listings/${id}`);
  }

  // Edit lock: after any worker accepts, only the description is editable
  if (listing.filledCount > 0) {
    listing.description = req.body.listing.description;
    await listing.save();
    req.flash("success", "Shift description updated. Timing, pay, and slots are locked because workers have accepted.");
    return res.redirect(`/listings/${id}`);
  }

  const locationChanged = req.body.listing.location !== listing.location;

  normalizeShiftFields(req.body.listing);
  if (req.body.listing.startAt) {
    req.body.listing.startAt = timeHelpers.parseIndiaTime(req.body.listing.startAt);
  }
  if (req.body.listing.endAt) {
    req.body.listing.endAt = timeHelpers.parseIndiaTime(req.body.listing.endAt);
  }

  Object.assign(listing, req.body.listing);

  const { lat, lng } = req.body.listing;
  if (lat && lng) {
    listing.geometry = {
      type: "Point",
      coordinates: [parseFloat(lng), parseFloat(lat)],
    };
  } else if (locationChanged) {
    const geometry = await geocodeLocation(listing.location);
    if (geometry) {
      listing.geometry = geometry;
    }
  }

  await listing.save();

  // Notify affected workers about shift updates
  const updatedBookings = await Booking.find({
    listing: id,
    status: { $in: ["accepted", "checked_in"] },
  });
  for (const b of updatedBookings) {
    await notify(
      b.worker,
      `Shift updated: "${listing.title}" details have changed`,
      `/bookings/my`
    );
  }

  req.flash("success", "Shift request updated successfully!");
  res.redirect(`/listings/${id}`);
};

module.exports.cancelListing = async (req, res) => {
  let { id } = req.params;
  const listing = await Listing.findById(id);
  if (!listing) {
    req.flash("error", "Shift request not found!");
    return res.redirect("/listings");
  }

  if (listing.status === "cancelled") {
    req.flash("error", "Shift request is already cancelled.");
    return res.redirect(`/listings/${id}`);
  }

  listing.status = "cancelled";
  await listing.save();

  // Find accepted worker bookings to notify before cancelling
  const acceptedBookings = await Booking.find({
    listing: id,
    status: "accepted",
  });
  for (const b of acceptedBookings) {
    await notify(
      b.worker,
      `Shift cancelled: "${listing.title}" was cancelled by the business`,
      `/bookings/my`
    );
  }

  // Cancel all accepted worker bookings for this shift
  await Booking.updateMany(
    { listing: id, status: "accepted" },
    { status: "cancelled" }
  );

  req.flash("success", "Shift cancelled. All accepted worker bookings have been cancelled.");
  res.redirect(`/listings/${id}`);
};

module.exports.showListing = async (req, res) => {
  let { id } = req.params;

  const listing = await Listing.findById(id).populate("owner");
  if (!listing) {
    req.flash("error", "Shift request does not exist!");
    return res.redirect("/listings");
  }

  let isWishlisted = false;
  if (req.user) {
    const user = await User.findById(req.user._id);
    if (user && user.wishlist) {
      isWishlisted = user.wishlist.some((listingId) => listingId.equals(id));
    }
  }

  // If business owner viewing, fetch accepted workers
  let acceptedBookings = [];
  if (req.user && listing.owner && listing.owner.equals(req.user._id)) {
    acceptedBookings = await Booking.find({ listing: id, status: "accepted" }).populate("worker");
  }

  res.render("listings/show.ejs", { listing, isWishlisted, acceptedBookings });
};

function normalizeShiftFields(listing) {
  if (!listing) return;
  if (typeof listing.skillTags === "string") {
    listing.skillTags = listing.skillTags
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);
  }
  if (!listing.roleType) listing.roleType = "Peak-hour helper";
  if (!listing.workersNeeded) listing.workersNeeded = 1;
}
