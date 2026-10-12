const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync.js");
const { isLoggedIn, isGuestOnBooking, isWorker } = require("../middleware.js");
const bookingController = require("../controllers/bookings.js");

router.post("/listings/:id/bookings", isLoggedIn, isWorker, wrapAsync(bookingController.createBooking));
router.get("/bookings/my", isLoggedIn, isWorker, wrapAsync(bookingController.myBookings));
router.delete(
  "/bookings/:bookingId",
  isLoggedIn,
  isWorker,
  isGuestOnBooking,
  wrapAsync(bookingController.cancelBooking)
);

module.exports = router;
