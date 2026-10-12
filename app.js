if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

const express = require("express");
const app = express();
const mongoose = require("mongoose");
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const session = require("express-session");
const { MongoStore } = require("connect-mongo");
const flash = require("connect-flash");
const passport = require("passport");
const LocalStrategy = require("passport-local");

const ExpressError = require("./utils/ExpressError.js");
const wrapAsync = require("./utils/wrapAsync.js");
const User = require("./models/user.js");
const Listing = require("./models/listing.js");
const Booking = require("./models/booking.js");
const { recomputeUserTrust } = require("./utils/trust.js");

const listingRouter = require("./routes/listing.js");
const reviewRouter = require("./routes/review.js");
const bookingRouter = require("./routes/booking.js");
const dashboardRouter = require("./routes/dashboard.js");
const userRouter = require("./routes/user.js");
const earningsRouter = require("./routes/earnings.js");
const notificationRouter = require("./routes/notification.js");
const { notify } = require("./utils/notifications.js");
const homeController = require("./controllers/home.js");

const dbUrl = process.env.ATLAS_URL;

app.engine("ejs", ejsMate);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.use(express.static(path.join(__dirname, "public")));

async function main() {
  await mongoose.connect(dbUrl);
}
main()
  .then(() => console.log("connected to PeakShift DB"))
  .catch((err) => console.log("DB connection error:", err));

const store = MongoStore.create({
  mongoUrl: dbUrl,
  touchAfter: 24 * 60 * 60, // time in seconds
  crypto: {
    secret: process.env.SESSION_SECRET,
  },
});

store.on("error", function (e) {
  console.log("SESSION STORE ERROR", e);
});

const sessionOptions = {
  store,
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: true,
  cookie: {
    httpOnly: true,
    expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
    maxAge: 1000 * 60 * 60 * 24 * 7,
  },
};
app.use(session(sessionOptions));
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

const timeHelpers = require("./utils/time.js");

app.use((req, res, next) => {
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  res.locals.currentUser = req.user;
  res.locals.timeHelpers = timeHelpers;
  next();
});

// Periodic sweep: expire past open shifts and mark un-checked-in bookings as no_show
async function periodicSweep() {
  try {
    const now = new Date();
    // 1. Expire open shifts past startAt
    await Listing.updateMany(
      { status: "open", startAt: { $lte: now } },
      { $set: { status: "expired" } }
    );

    // 2. "accepted" bookings with no check-in 30 minutes after start become "no_show"
    const noShowCutoff = new Date(now.getTime() - 30 * 60 * 1000);
    const noShowBookings = await Booking.find({
      status: "accepted",
      startAt: { $lte: noShowCutoff },
    });
    if (noShowBookings.length > 0) {
      await Booking.updateMany(
        { _id: { $in: noShowBookings.map((b) => b._id) } },
        { $set: { status: "no_show" } }
      );
      for (const b of noShowBookings) {
        await recomputeUserTrust(b.worker);
        await notify(
          b.worker,
          "You were marked as no-show for a shift due to missed check-in",
          "/bookings/my"
        );
      }
    }
  } catch (err) {
    console.error("Periodic sweep error:", err);
  }
}
setInterval(periodicSweep, 5 * 60 * 1000);
periodicSweep();

app.get("/", wrapAsync(homeController.renderHome));
app.use("/listings", listingRouter);
app.use("/", reviewRouter);
app.use("/", bookingRouter);
app.use("/", dashboardRouter);
app.use("/", userRouter);
app.use("/", earningsRouter);
app.use("/", notificationRouter);

app.all("/*splat", (req, res, next) => {
  next(new ExpressError(404, "Page Not Found"));
});

app.use((err, req, res, next) => {
  let { statusCode = 500, message = "Something went wrong" } = err;
  res.status(statusCode).render("error.ejs", { err: { statusCode, message } });
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`PeakShift server is listening on http://127.0.0.1:${PORT}`);
});