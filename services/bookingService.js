const Listing = require("../models/listing.js");
const Booking = require("../models/booking.js");
const { PLATFORM_FEE_RATE } = require("../config/index.js");

/**
 * Worker accepts an open shift slot.
 * Worker sends NO times — accepting claims the exact posted shift window.
 */
async function acceptShift(listingId, workerId) {
  const listing = await Listing.findById(listingId);
  if (!listing) {
    throw new Error("Shift request does not exist.");
  }

  const now = new Date();

  // 1. Reject if the shift isn't open
  if (listing.status !== "open") {
    throw new Error("This shift is no longer open for acceptance.");
  }

  // 2. Reject if already started
  if (listing.startAt <= now) {
    throw new Error("This shift has already started.");
  }

  // 3. Reject if the user owns it
  if (listing.owner && listing.owner.equals(workerId)) {
    throw new Error("You cannot accept your own shift request.");
  }

  // 4. Reject if the worker has an overlapping accepted booking
  const overlap = await Booking.findOne({
    worker: workerId,
    status: "accepted",
    startAt: { $lt: listing.endAt },
    endAt: { $gt: listing.startAt },
  });

  if (overlap) {
    throw new Error("You already accepted an overlapping shift during this time.");
  }

  // 5. Claim the slot with ONE atomic findOneAndUpdate
  const claimedListing = await Listing.findOneAndUpdate(
    {
      _id: listingId,
      status: "open",
      startAt: { $gt: now },
      $expr: { $lt: ["$filledCount", "$workersNeeded"] },
    },
    { $inc: { filledCount: 1 } },
    { new: true }
  );

  if (!claimedListing) {
    throw new Error("This shift just filled.");
  }

  // If full, set status "filled"
  if (claimedListing.filledCount >= claimedListing.workersNeeded) {
    claimedListing.status = "filled";
    await claimedListing.save();
  }

  // 6. Calculate hours and fees
  const diffMs = claimedListing.endAt.getTime() - claimedListing.startAt.getTime();
  const hours = Math.max(1, Math.round(diffMs / (1000 * 60 * 60)));
  const payAmount = hours * claimedListing.price;
  const platformFee = Math.round(payAmount * (PLATFORM_FEE_RATE || 0.10));

  // 7. Create the booking; if that fails, decrement filledCount
  try {
    const booking = await Booking.create({
      listing: claimedListing._id,
      worker: workerId,
      startAt: claimedListing.startAt,
      endAt: claimedListing.endAt,
      hours,
      payAmount,
      platformFee,
      status: "accepted",
    });
    return booking;
  } catch (err) {
    await Listing.findByIdAndUpdate(listingId, {
      $inc: { filledCount: -1 },
      status: "open",
    });
    throw err;
  }
}

/**
 * Worker cancels their accepted shift.
 * Only allowed before the shift startAt; decrements filledCount and reopens the listing.
 */
async function cancelShiftByWorker(bookingId, workerId) {
  const booking = await Booking.findById(bookingId).populate("listing");
  if (!booking) {
    throw new Error("Shift booking not found.");
  }

  if (!booking.worker || !booking.worker.equals(workerId)) {
    throw new Error("You do not have permission to cancel this shift.");
  }

  if (booking.status !== "accepted") {
    throw new Error("Only accepted shifts can be cancelled.");
  }

  const now = new Date();
  if (booking.startAt <= now) {
    throw new Error("Shifts cannot be cancelled after they have started.");
  }

  booking.status = "cancelled";
  await booking.save();

  // Decrement filledCount and reopen shift
  if (booking.listing) {
    const currentListing = await Listing.findById(booking.listing._id);
    if (currentListing) {
      currentListing.filledCount = Math.max(0, currentListing.filledCount - 1);
      // If listing was filled, reopen it if still in the future
      if (currentListing.status === "filled" && currentListing.startAt > now) {
        currentListing.status = "open";
      }
      await currentListing.save();
    }
  }

  return booking;
}

module.exports = {
  acceptShift,
  cancelShiftByWorker,
};
