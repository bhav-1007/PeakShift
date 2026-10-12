const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync.js");
const ExpressError = require("../utils/ExpressError.js");
const { listingSchema } = require("../schema.js");
const { isLoggedIn, isOwner, isBusiness } = require("../middleware.js");
const listingController = require("../controllers/listings.js");
const multer = require("multer");
const { storage } = require("../cloudConfig.js");
const upload = multer({ storage });

const validateListing = (req, res, next) => {
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
  .post(isLoggedIn, isBusiness, upload.single("listing[image]"), validateListing, wrapAsync(listingController.createListing));

router.get("/new", isLoggedIn, isBusiness, listingController.renderNewForm);

//Keep these ABOVE "/:id"
router.get("/my", isLoggedIn, isBusiness, wrapAsync(listingController.myListings));
router.get("/wishlist", isLoggedIn, wrapAsync(listingController.wishlistPage));
router.post("/:id/wishlist", isLoggedIn, wrapAsync(listingController.toggleWishlist));
router.get("/trash", isLoggedIn, isBusiness, wrapAsync(listingController.renderTrash));

router
  .route("/:id/edit")
  .get(isLoggedIn, isBusiness, isOwner, wrapAsync(listingController.renderEditForm));

router
  .route("/:id")
  .put(isLoggedIn, isBusiness, isOwner, upload.single("listing[image]"), validateListing, wrapAsync(listingController.updateListing))
  .delete(isLoggedIn, isBusiness, isOwner, wrapAsync(listingController.destroyListing))
  .get(wrapAsync(listingController.showListing)); // keep GET last in chain, still matched by path only

router.post("/:id/restore", isLoggedIn, isBusiness, wrapAsync(listingController.restoreListing));
router.delete("/:id/permanent", isLoggedIn, isBusiness, wrapAsync(listingController.permanentDestroy));

module.exports = router;
