const Listing = require("./models/listing.js");
const Booking = require("./models/booking.js");

module.exports.isLoggedIn = (req, res, next) => {
  if (!req.isAuthenticated()) {
    req.session.redirectUrl = req.originalUrl;
    req.flash("error", "You must be signed in to do that!");
    return res.redirect("/login");
  }
  next();
};

module.exports.saveRedirectUrl = (req, res, next) => {
  if (req.session.redirectUrl) {
    res.locals.redirectUrl = req.session.redirectUrl;
  }
  next();
};

module.exports.isBusiness = (req, res, next) => {
  if (!req.isAuthenticated()) {
    req.session.redirectUrl = req.originalUrl;
    req.flash("error", "You must be signed in to do that!");
    return res.redirect("/login");
  }
  if (req.user.role !== "business") {
    req.flash("error", "Only business accounts can perform this action.");
    return res.redirect("/listings");
  }
  next();
};

module.exports.isWorker = (req, res, next) => {
  if (!req.isAuthenticated()) {
    req.session.redirectUrl = req.originalUrl;
    req.flash("error", "You must be signed in to do that!");
    return res.redirect("/login");
  }
  if (req.user.role !== "worker") {
    req.flash("error", "Only workers can perform this action.");
    return res.redirect("/listings");
  }
  next();
};

module.exports.isOwner = async (req, res, next) => {
  let { id } = req.params;
  let listing = await Listing.findById(id);
  if (!listing) {
    req.flash("error", "Shift request not found!");
    return res.redirect("/listings");
  }
  if (!listing.owner || !listing.owner.equals(req.user._id)) {
    req.flash("error", "You don't have permission to do that!");
    return res.redirect(`/listings/${id}`);
  }
  next();
};

module.exports.isGuestOnBooking = async (req, res, next) => {
  const { bookingId } = req.params;
  const booking = await Booking.findById(bookingId);

  if (!booking) {
    req.flash("error", "Shift acceptance not found!");
    return res.redirect("/bookings/my");
  }

  if (!booking.guest || !booking.guest.equals(req.user._id)) {
    req.flash("error", "You don't have permission to do that!");
    return res.redirect("/bookings/my");
  }

  next();
};
