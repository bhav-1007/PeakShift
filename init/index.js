if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

const mongoose = require("mongoose");
const initData = require("./data.js");
const Listing = require("../models/listing.js");
const User = require("../models/user.js");

const dbUrl = process.env.ATLAS_URL || "mongodb://127.0.0.1:27017/PeakShift";

const initDB = async () => {
  await Listing.deleteMany({});

  // Find existing demo business user or create one
  let demoUser = await User.findOne({ username: "demobusiness" });
  if (!demoUser) {
    demoUser = await User.register(
      new User({ username: "demobusiness", email: "business@peakshift.demo" }),
      "demopassword123"
    );
  }

  const listings = initData.data.map((obj) => ({
    ...obj,
    owner: demoUser._id,
  }));
  await Listing.insertMany(listings);
  console.log("Data was initialized");
};

// Only execute when run directly via CLI (e.g. `npm run seed`)
if (require.main === module) {
  mongoose
    .connect(dbUrl)
    .then(async () => {
      console.log("Connected to MongoDB for seeding");
      await initDB();
      await mongoose.disconnect();
      console.log("Database seeded successfully");
    })
    .catch((err) => {
      console.error("Seeding error:", err);
      process.exit(1);
    });
}

module.exports = initDB;
