const Listing = require("../models/listing.js");

module.exports.renderHome = async (req, res, next) => {
  let featuredListings = [];
  let stats = { openShifts: 0, avgPay: 0, cities: 0 };
  let topReviews = [];

  try {
    featuredListings = await Listing.find({ deleted: false })
      .sort({ createdAt: -1 })
      .limit(4);

    const openShifts = await Listing.countDocuments({ deleted: false });

    const payAgg = await Listing.aggregate([
      { $match: { deleted: false } },
      { $group: { _id: null, avgPay: { $avg: "$price" } } },
    ]);
    const avgPay = payAgg.length > 0 ? Math.round(payAgg[0].avgPay) : 0;

    const cities = await Listing.distinct("location", { deleted: false });

    stats = { openShifts, avgPay, cities: cities.length };

    // Pull real reviews across all shifts, surface the highest-rated ones
    const listingsWithReviews = await Listing.find({ deleted: false }).populate("reviews");
    let allReviews = [];
    listingsWithReviews.forEach((listing) => {
      listing.reviews.forEach((review) => {
        allReviews.push({
          rating: review.rating,
          comment: review.comment,
          author: review.author,
          listingTitle: listing.title,
        });
      });
    });
    topReviews = allReviews
      .filter((r) => r.rating >= 4)
      .sort((a, b) => b.rating - a.rating)
      .slice(0, 3);
  } catch (err) {
    return next(err);
  }

  res.render("home.ejs", { featuredListings, stats, topReviews });
};