const express = require("express");
const router = express.Router();
const passport = require("passport");
const wrapAsync = require("../utils/wrapAsync.js");
const { saveRedirectUrl, isLoggedIn, isWorker } = require("../middleware.js");
const { userSchema, profileSchema } = require("../schema.js");
const userController = require("../controllers/user.js");

const validateUser = (req, res, next) => {
  const { error } = userSchema.validate(req.body);
  if (error) {
    const msg = error.details.map((el) => el.message).join(", ");
    req.flash("error", msg);
    return res.redirect("/signup");
  }
  next();
};

const validateProfile = (req, res, next) => {
  const { error } = profileSchema.validate(req.body);
  if (error) {
    const msg = error.details.map((el) => el.message).join(", ");
    req.flash("error", msg);
    return res.redirect("/profile");
  }
  next();
};

router
  .route("/signup")
  .get(userController.renderSignupForm);

router.post("/users", validateUser, wrapAsync(userController.signup));

router
  .route("/login")
  .get(userController.renderLoginForm);

router.post(
  "/login",
  saveRedirectUrl,
  passport.authenticate("local", {
    failureFlash: true,
    failureRedirect: "/login",
  }),
  userController.login
);

router.get("/logout", userController.logout);

router
  .route("/profile")
  .get(isLoggedIn, isWorker, wrapAsync(userController.renderProfile))
  .post(isLoggedIn, isWorker, validateProfile, wrapAsync(userController.updateProfile));

module.exports = router;