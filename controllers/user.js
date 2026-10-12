const User = require("../models/user.js");

module.exports.renderSignupForm = (req, res) => {
  res.render("users/signup.ejs");
};

module.exports.signup = async (req, res, next) => {
  try {
    let { username, email, password, role, phone, businessName, skills } = req.body;

    const parsedSkills =
      typeof skills === "string"
        ? skills
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
        : Array.isArray(skills)
        ? skills
        : [];

    const newUser = new User({
      email,
      username,
      role,
      phone: phone || "",
      businessName: role === "business" ? businessName || "" : "",
      skills: role === "worker" ? parsedSkills : [],
    });

    const registeredUser = await User.register(newUser, password);
    req.login(registeredUser, (err) => {
      if (err) return next(err);
      req.flash("success", "Welcome to PeakShift!");
      const redirectUrl = registeredUser.role === "business" ? "/dashboard" : "/listings";
      res.redirect(redirectUrl);
    });
  } catch (e) {
    console.log(e.stack);
    req.flash("error", e.message);
    res.redirect("/signup");
  }
};

module.exports.renderLoginForm = (req, res) => {
  res.render("users/login.ejs");
};

module.exports.login = (req, res) => {
  req.flash("success", "Welcome back!");
  let redirectUrl = res.locals.redirectUrl;
  if (!redirectUrl || redirectUrl === "/login") {
    redirectUrl = req.user.role === "business" ? "/dashboard" : "/listings";
  }
  res.redirect(redirectUrl);
};

module.exports.logout = (req, res, next) => {
  if (!req.isAuthenticated()) {
    req.flash("error", "You are not logged in!");
    return res.redirect("/listings");
  }
  req.logout((err) => {
    if (err) return next(err);
    req.flash("success", "You are logged out!");
    res.redirect("/listings");
  });
};

module.exports.renderProfile = async (req, res) => {
  const user = await User.findById(req.user._id);
  res.render("users/profile.ejs", { user });
};

module.exports.updateProfile = async (req, res) => {
  const { homeLocation, lat, lng } = req.body;
  const user = await User.findById(req.user._id);

  if (!user) {
    req.flash("error", "User not found!");
    return res.redirect("/login");
  }

  user.homeLocation = homeLocation;

  if (lat && lng && !isNaN(parseFloat(lat)) && !isNaN(parseFloat(lng))) {
    user.geometry = {
      type: "Point",
      coordinates: [parseFloat(lng), parseFloat(lat)],
    };
  } else if (homeLocation) {
    const geocodeLocation = require("../utils/geocode.js");
    const geo = await geocodeLocation(homeLocation);
    if (geo) {
      user.geometry = geo;
    }
  }

  await user.save();
  req.flash("success", "Profile and home location updated successfully!");
  res.redirect("/profile");
};

