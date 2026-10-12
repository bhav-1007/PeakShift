const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const listingSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    image: {
      url: {
        type: String,
      },
      filename: {
        type: String,
      },
    },
    price: {
      type: Number,
      required: true,
    },
    roleType: {
      type: String,
      default: "Peak-hour helper",
    },
    workersNeeded: {
      type: Number,
      default: 1,
      min: 1,
    },
    filledCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    status: {
      type: String,
      enum: ["open", "filled", "cancelled", "expired"],
      default: "open",
    },
    startAt: {
      type: Date,
      required: true,
    },
    endAt: {
      type: Date,
      required: true,
    },
    skillTags: {
      type: [String],
      default: [],
    },
    location: {
      type: String,
      required: true,
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
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
  },
  { timestamps: true }
);

listingSchema.index({ geometry: "2dsphere" });

const Listing = mongoose.model("Listing", listingSchema);
module.exports = Listing;