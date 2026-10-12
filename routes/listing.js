const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync.js");
const ExpressError = require("../utils/ExpressError.js");
const { listingSchema } = require("../schema.js");
const { isLoggedIn, isOwner, isBusiness } = require("../middleware.js");
const listingController = require("../controllers/listings.js");
const Listing = require("../models/listing.js");
const timeHelpers = require("../utils/time.js");

const validateListing = async (req, res, next) => {
  if (req.params.id) {
    const existing = await Listing.findById(req.params.id);
    if (existing && existing.filledCount > 0) {
      if (!req.body.listing || !req.body.listing.description) {
        throw new ExpressError(400, "Shift description is required");
      }
      return next();
    }
  }

  // Pre-parse datetime-local inputs into Date objects so Joi validates correctly
  if (req.body.listing) {
    if (req.body.listing.startAt) {
      req.body.listing.startAt = timeHelpers.parseIndiaTime(req.body.listing.startAt);
    }
    if (req.body.listing.endAt) {
      req.body.listing.endAt = timeHelpers.parseIndiaTime(req.body.listing.endAt);
    }
  }

  let { error } = listingSchema.validate(req.body);
  if (error) {
    let msg = error.details.map((el) => el.message).join(",");
    throw new ExpressError(400, msg);
  }
  next();
};

router
  .route("/")
  .get(wrapAsync(listingController.index))
  .post(
    isLoggedIn,
    isBusiness,
    wrapAsync(validateListing),
    wrapAsync(listingController.createListing)
  );

router.get("/new", isLoggedIn, isBusiness, listingController.renderNewForm);

// Keep these ABOVE "/:id"
router.get("/my", isLoggedIn, isBusiness, wrapAsync(listingController.myListings));
router.get("/wishlist", isLoggedIn, wrapAsync(listingController.wishlistPage));
router.post("/:id/wishlist", isLoggedIn, wrapAsync(listingController.toggleWishlist));

router
  .route("/:id/edit")
  .get(isLoggedIn, isBusiness, isOwner, wrapAsync(listingController.renderEditForm));

router.post(
  "/:id/cancel",
  isLoggedIn,
  isBusiness,
  isOwner,
  wrapAsync(listingController.cancelListing)
);

router
  .route("/:id")
  .put(
    isLoggedIn,
    isBusiness,
    isOwner,
    wrapAsync(validateListing),
    wrapAsync(listingController.updateListing)
  )
  .delete(isLoggedIn, isBusiness, isOwner, wrapAsync(listingController.cancelListing))
  .get(wrapAsync(listingController.showListing));

module.exports = router;
