const Listing = require("../models/listing.js");

module.exports.renderHome = async (req, res, next) => {
  let featuredListings = [];
  let stats = { openShifts: 0, avgPay: 0 };

  try {
    const now = new Date();
    const openFilter = {
      status: "open",
      startAt: { $gt: now },
    };

    featuredListings = await Listing.find(openFilter)
      .sort({ startAt: 1 })
      .limit(4);

    const openShifts = await Listing.countDocuments(openFilter);

    const payAgg = await Listing.aggregate([
      { $match: openFilter },
      { $group: { _id: null, avgPay: { $avg: "$price" } } },
    ]);
    const avgPay = payAgg.length > 0 ? Math.round(payAgg[0].avgPay) : 0;

    stats = { openShifts, avgPay };
  } catch (err) {
    return next(err);
  }

  res.render("home.ejs", { featuredListings, stats });
};