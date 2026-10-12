const User = require("../models/user.js");
const Booking = require("../models/booking.js");
const Listing = require("../models/listing.js");
const Review = require("../models/review.js");

/**
 * Calculates user trust score:
 * trustScore = round(100 * (0.6 * completed/(completed+noShows) + 0.4 * ratingAvg/5))
 * New users start at 70.
 */
function calculateTrustScore(completedShifts, noShows, ratingAvg) {
  const totalShifts = (completedShifts || 0) + (noShows || 0);
  if (totalShifts === 0) {
    return 70; // new users start at 70
  }
  const shiftRatio = completedShifts / totalShifts;
  const ratingRatio = (ratingAvg || 0) / 5;
  return Math.round(100 * (0.6 * shiftRatio + 0.4 * ratingRatio));
}

/**
 * Recomputes completedShifts, noShows, ratingAvg, ratingCount, and trustScore for a user.
 */
async function recomputeUserTrust(userId) {
  if (!userId) return null;
  const user = await User.findById(userId);
  if (!user) return null;

  let completedShifts = 0;
  let noShows = 0;

  if (user.role === "worker") {
    completedShifts = await Booking.countDocuments({
      worker: userId,
      status: "completed",
    });
    noShows = await Booking.countDocuments({
      worker: userId,
      status: "no_show",
    });
  } else if (user.role === "business") {
    const myListings = await Listing.find({ owner: userId }, "_id");
    const listingIds = myListings.map((l) => l._id);
    completedShifts = await Booking.countDocuments({
      listing: { $in: listingIds },
      status: "completed",
    });
    noShows = 0;
  }

  const reviews = await Review.find({ reviewee: userId });
  const ratingCount = reviews.length;
  let ratingAvg = 0;
  if (ratingCount > 0) {
    const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
    ratingAvg = Number((totalRating / ratingCount).toFixed(2));
  }

  const trustScore = calculateTrustScore(completedShifts, noShows, ratingAvg);

  user.completedShifts = completedShifts;
  user.noShows = noShows;
  user.ratingCount = ratingCount;
  user.ratingAvg = ratingAvg;
  user.trustScore = trustScore;

  await user.save();
  return user;
}

module.exports = {
  calculateTrustScore,
  recomputeUserTrust,
};
