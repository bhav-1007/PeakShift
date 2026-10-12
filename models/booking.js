const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const bookingSchema = new Schema(
  {
    listing: {
      type: Schema.Types.ObjectId,
      ref: "Listing",
      required: true,
    },
    worker: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    startAt: {
      type: Date,
      required: true,
    },
    endAt: {
      type: Date,
      required: true,
    },
    hours: {
      type: Number,
      required: true,
    },
    payAmount: {
      type: Number,
      required: true,
    },
    platformFee: {
      type: Number,
      required: true,
    },
    checkInAt: {
      type: Date,
    },
    checkInCoords: {
      lat: Number,
      lng: Number,
    },
    checkInDistanceM: {
      type: Number,
    },
    checkInSelfie: {
      url: String,
      filename: String,
    },
    status: {
      type: String,
      enum: ["accepted", "cancelled", "checked_in", "completed", "no_show"],
      default: "accepted",
    },
  },
  { timestamps: true }
);

bookingSchema.index({ listing: 1, status: 1, startAt: 1, endAt: 1 });
bookingSchema.index({ worker: 1, status: 1, startAt: 1 });

module.exports = mongoose.model("Booking", bookingSchema);
