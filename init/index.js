if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

const mongoose = require("mongoose");
const initData = require("./data.js");
const Listing = require("../models/listing.js");
const User = require("../models/user.js");
const Booking = require("../models/booking.js");

const dbUrl = process.env.ATLAS_URL || "mongodb://127.0.0.1:27017/PeakShift";

const initDB = async () => {
  // Wipe dev database collections
  await Listing.deleteMany({});
  await User.deleteMany({});
  await Booking.deleteMany({});

  // 1. Create 2 Business Users
  const biz1 = await User.register(
    new User({
      username: "biz_cloudkitchen",
      email: "kitchen@peakshift.demo",
      role: "business",
      businessName: "Cloud Kitchen Co.",
      phone: "9876543210",
    }),
    "bizpass123"
  );

  const biz2 = await User.register(
    new User({
      username: "biz_cafebistro",
      email: "cafe@peakshift.demo",
      role: "business",
      businessName: "Metro Cafe & Bistro",
      phone: "9876543211",
    }),
    "bizpass123"
  );

  // 2. Create 4 Worker Users
  await User.register(
    new User({
      username: "worker_arun",
      email: "arun@peakshift.demo",
      role: "worker",
      skills: ["packing", "food safety", "dispatch"],
      phone: "9123456780",
    }),
    "workerpass123"
  );

  await User.register(
    new User({
      username: "worker_priya",
      email: "priya@peakshift.demo",
      role: "worker",
      skills: ["counter", "queue handling", "POS"],
      phone: "9123456781",
    }),
    "workerpass123"
  );

  await User.register(
    new User({
      username: "worker_rahul",
      email: "rahul@peakshift.demo",
      role: "worker",
      skills: ["delivery", "inventory", "cleaning"],
      phone: "9123456782",
    }),
    "workerpass123"
  );

  await User.register(
    new User({
      username: "worker_sneha",
      email: "sneha@peakshift.demo",
      role: "worker",
      skills: ["cashier", "cleaning", "customer service"],
      phone: "9123456783",
    }),
    "workerpass123"
  );

  // 3. Assign listings to the two businesses
  const businesses = [biz1._id, biz2._id];
  const listings = initData.data.map((obj, index) => ({
    ...obj,
    owner: businesses[index % businesses.length],
  }));
  await Listing.insertMany(listings);

  console.log("=================================================");
  console.log("Dev Database Wiped and Reseeded Successfully!");
  console.log("Demo Passwords:");
  console.log("  Businesses (password: 'bizpass123'):");
  console.log("    - biz_cloudkitchen (kitchen@peakshift.demo)");
  console.log("    - biz_cafebistro   (cafe@peakshift.demo)");
  console.log("  Workers (password: 'workerpass123'):");
  console.log("    - worker_arun      (arun@peakshift.demo)");
  console.log("    - worker_priya     (priya@peakshift.demo)");
  console.log("    - worker_rahul     (rahul@peakshift.demo)");
  console.log("    - worker_sneha     (sneha@peakshift.demo)");
  console.log("=================================================");
};

// Only execute when run directly via CLI (e.g. `npm run seed`)
if (require.main === module) {
  mongoose
    .connect(dbUrl)
    .then(async () => {
      console.log("Connected to MongoDB for seeding");
      await initDB();
      await mongoose.disconnect();
      console.log("Database seeded and connection closed.");
    })
    .catch((err) => {
      console.error("Seeding error:", err);
      process.exit(1);
    });
}

module.exports = initDB;
