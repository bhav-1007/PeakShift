const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync.js");
const { isLoggedIn, isBusiness } = require("../middleware.js");
const dashboardController = require("../controllers/dashboard.js");

router.get("/dashboard", isLoggedIn, isBusiness, wrapAsync(dashboardController.renderDashboard));

module.exports = router;
