const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const passportLocalMongoose = require("passport-local-mongoose");

const UserSchema = new Schema({
  email: {
    type: String,
    required: true,
    unique: true,
  },
  username: {
    type: String,
    required: true,
    unique: true,
  },
  role: {
    type: String,
    enum: ["worker", "business"],
    required: true,
  },
  phone: {
    type: String,
    default: "",
  },
  businessName: {
    type: String,
    default: "",
  },
  skills: {
    type: [String],
    default: [],
  },
  homeLocation: {
    type: String,
    default: "",
  },
  geometry: {
    type: {
      type: String,
      enum: ["Point"],
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
    },
  },
  isAdmin: {
    type: Boolean,
    default: false,
  },
  ratingAvg: {
    type: Number,
    default: 0,
  },
  ratingCount: {
    type: Number,
    default: 0,
  },
  completedShifts: {
    type: Number,
    default: 0,
  },
  noShows: {
    type: Number,
    default: 0,
  },
  trustScore: {
    type: Number,
    default: 70,
  },
  wishlist: [
    {
      type: Schema.Types.ObjectId,
      ref: "Listing",
    },
  ],
});

UserSchema.plugin(passportLocalMongoose);
UserSchema.index({ geometry: "2dsphere" });

const User = mongoose.model("User", UserSchema);
module.exports = User;

