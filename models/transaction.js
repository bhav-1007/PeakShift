const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const transactionSchema = new Schema({
  booking: {
    type: Schema.Types.ObjectId,
    ref: "Booking",
    required: true,
    unique: true, // Guarantees idempotency / prevents double payout on repeated clicks
  },
  worker: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  business: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  gross: {
    type: Number,
    required: true,
  },
  platformFee: {
    type: Number,
    required: true,
  },
  workerNet: {
    type: Number,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

transactionSchema.index({ worker: 1, createdAt: -1 });
transactionSchema.index({ business: 1, createdAt: -1 });

module.exports = mongoose.model("Transaction", transactionSchema);
