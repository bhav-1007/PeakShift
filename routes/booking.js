const express = require("express");
const router = express.Router();
const multer = require("multer");
const { storage } = require("../cloudConfig.js");
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // max 5MB
});

const wrapAsync = require("../utils/wrapAsync.js");
const {
  isLoggedIn,
  isWorker,
  isWorkerOnBooking,
  isBusiness,
  isBusinessOwnerOfBooking,
  isOwner,
} = require("../middleware.js");
const bookingController = require("../controllers/bookings.js");

// Worker routes
router.post(
  "/listings/:id/bookings",
  isLoggedIn,
  isWorker,
  wrapAsync(bookingController.createBooking)
);

router.get(
  "/bookings/my",
  isLoggedIn,
  isWorker,
  wrapAsync(bookingController.myBookings)
);

router.delete(
  "/bookings/:bookingId",
  isLoggedIn,
  isWorker,
  isWorkerOnBooking,
  wrapAsync(bookingController.cancelBooking)
);

router.post(
  "/bookings/:bookingId/checkin",
  isLoggedIn,
  isWorker,
  isWorkerOnBooking,
  upload.single("selfie"),
  wrapAsync(bookingController.checkIn)
);

// Business routes
router.post(
  "/bookings/:bookingId/complete",
  isLoggedIn,
  isBusiness,
  isBusinessOwnerOfBooking,
  wrapAsync(bookingController.completeBooking)
);

router.post(
  "/listings/:id/complete-all",
  isLoggedIn,
  isBusiness,
  isOwner,
  wrapAsync(bookingController.completeAllForListing)
);

module.exports = router;
