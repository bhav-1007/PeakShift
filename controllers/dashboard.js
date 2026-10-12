const Booking = require("../models/booking.js");
const Listing = require("../models/listing.js");
const Review = require("../models/review.js");

module.exports.renderDashboard = async (req, res) => {
  const myListings = await Listing.find({
    owner: req.user._id,
  }).sort({ startAt: -1 });

  const listingIds = myListings.map((listing) => listing._id);
  const bookings = await Booking.find({
    listing: { $in: listingIds },
  })
    .populate("listing")
    .populate("worker")
    .sort({ createdAt: -1 });

  // Query reviews written by business
  const myReviews = await Review.find({ author: req.user._id });
  const reviewedBookingIds = new Set(myReviews.map((r) => r.booking.toString()));

  // Group bookings by listing ID
  const bookingsByListing = {};
  for (const b of bookings) {
    const listId = (b.listing._id || b.listing).toString();
    if (!bookingsByListing[listId]) {
      bookingsByListing[listId] = [];
    }
    bookingsByListing[listId].push(b);
  }

  // Attach roster to each listing
  myListings.forEach((listing) => {
    listing.roster = bookingsByListing[listing._id.toString()] || [];
  });

  const now = new Date();
  const stats = {
    totalListings: myListings.length,
    totalBookings: bookings.length,
    checkedInWorkers: bookings.filter((b) => b.status === "checked_in").length,
    completedWorkers: bookings.filter((b) => b.status === "completed").length,
  };

  res.render("dashboard/index.ejs", { myListings, bookings, stats, reviewedBookingIds, now });
};
