const Transaction = require("../models/transaction.js");

module.exports.workerEarnings = async (req, res) => {
  const transactions = await Transaction.find({ worker: req.user._id })
    .populate({
      path: "booking",
      populate: { path: "listing" },
    })
    .populate("business")
    .sort({ createdAt: -1 });

  const now = new Date();
  const nowIST = new Date(now.getTime() + 5.5 * 3600 * 1000);

  const startOfToday = new Date(
    Date.UTC(nowIST.getUTCFullYear(), nowIST.getUTCMonth(), nowIST.getUTCDate(), 0, 0, 0, 0) -
      5.5 * 3600 * 1000
  );

  const dayOfWeek = nowIST.getUTCDay();
  const diffToMonday = (dayOfWeek + 6) % 7;
  const startOfWeek = new Date(
    Date.UTC(
      nowIST.getUTCFullYear(),
      nowIST.getUTCMonth(),
      nowIST.getUTCDate() - diffToMonday,
      0,
      0,
      0,
      0
    ) -
      5.5 * 3600 * 1000
  );

  const startOfMonth = new Date(
    Date.UTC(nowIST.getUTCFullYear(), nowIST.getUTCMonth(), 1, 0, 0, 0, 0) -
      5.5 * 3600 * 1000
  );

  const totals = {
    todayGross: 0,
    todayNet: 0,
    weekGross: 0,
    weekNet: 0,
    monthGross: 0,
    monthNet: 0,
    allTimeGross: 0,
    allTimeNet: 0,
    allTimeFee: 0,
  };

  transactions.forEach((t) => {
    totals.allTimeGross += t.gross;
    totals.allTimeNet += t.workerNet;
    totals.allTimeFee += t.platformFee;

    if (t.createdAt >= startOfToday) {
      totals.todayGross += t.gross;
      totals.todayNet += t.workerNet;
    }
    if (t.createdAt >= startOfWeek) {
      totals.weekGross += t.gross;
      totals.weekNet += t.workerNet;
    }
    if (t.createdAt >= startOfMonth) {
      totals.monthGross += t.gross;
      totals.monthNet += t.workerNet;
    }
  });

  res.render("earnings/worker.ejs", { transactions, totals });
};

module.exports.businessSpend = async (req, res) => {
  const transactions = await Transaction.find({ business: req.user._id })
    .populate({
      path: "booking",
      populate: { path: "listing" },
    })
    .populate("worker")
    .sort({ createdAt: -1 });

  const now = new Date();
  const nowIST = new Date(now.getTime() + 5.5 * 3600 * 1000);

  const startOfToday = new Date(
    Date.UTC(nowIST.getUTCFullYear(), nowIST.getUTCMonth(), nowIST.getUTCDate(), 0, 0, 0, 0) -
      5.5 * 3600 * 1000
  );

  const dayOfWeek = nowIST.getUTCDay();
  const diffToMonday = (dayOfWeek + 6) % 7;
  const startOfWeek = new Date(
    Date.UTC(
      nowIST.getUTCFullYear(),
      nowIST.getUTCMonth(),
      nowIST.getUTCDate() - diffToMonday,
      0,
      0,
      0,
      0
    ) -
      5.5 * 3600 * 1000
  );

  const startOfMonth = new Date(
    Date.UTC(nowIST.getUTCFullYear(), nowIST.getUTCMonth(), 1, 0, 0, 0, 0) -
      5.5 * 3600 * 1000
  );

  const totals = {
    todayGross: 0,
    todayNet: 0,
    weekGross: 0,
    weekNet: 0,
    monthGross: 0,
    monthNet: 0,
    allTimeGross: 0,
    allTimeNet: 0,
    allTimeFee: 0,
  };

  transactions.forEach((t) => {
    totals.allTimeGross += t.gross;
    totals.allTimeNet += t.workerNet;
    totals.allTimeFee += t.platformFee;

    if (t.createdAt >= startOfToday) {
      totals.todayGross += t.gross;
      totals.todayNet += t.workerNet;
    }
    if (t.createdAt >= startOfWeek) {
      totals.weekGross += t.gross;
      totals.weekNet += t.workerNet;
    }
    if (t.createdAt >= startOfMonth) {
      totals.monthGross += t.gross;
      totals.monthNet += t.workerNet;
    }
  });

  res.render("earnings/business.ejs", { transactions, totals });
};
