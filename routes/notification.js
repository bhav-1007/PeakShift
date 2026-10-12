const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync.js");
const { isLoggedIn } = require("../middleware.js");
const notificationController = require("../controllers/notifications.js");

router.get("/notifications/unread-count", wrapAsync(notificationController.getUnreadCount));
router.get("/notifications", isLoggedIn, wrapAsync(notificationController.renderNotifications));
router.post("/notifications/mark-all-read", isLoggedIn, wrapAsync(notificationController.markAllRead));
router.post("/notifications/:id/read", isLoggedIn, wrapAsync(notificationController.markOneRead));

module.exports = router;
