const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync.js");
const { isLoggedIn, isWorker, isBusiness } = require("../middleware.js");
const earningsController = require("../controllers/earnings.js");

// Worker earnings
router.get("/earnings", isLoggedIn, isWorker, wrapAsync(earningsController.workerEarnings));
router.get("/earnings/my", isLoggedIn, isWorker, wrapAsync(earningsController.workerEarnings));

// Business spend
router.get("/spend", isLoggedIn, isBusiness, wrapAsync(earningsController.businessSpend));
router.get("/earnings/spend", isLoggedIn, isBusiness, wrapAsync(earningsController.businessSpend));

module.exports = router;
