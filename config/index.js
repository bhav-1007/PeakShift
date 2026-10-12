module.exports = {
  PLATFORM_FEE_RATE: 0.10, // 10% platform fee
  CHECKIN_OPENS_MIN_BEFORE: Number(process.env.CHECKIN_OPENS_MIN_BEFORE) || 30, // 30 minutes before shift start
  CHECKIN_RADIUS_M: Number(process.env.CHECKIN_RADIUS_M) || 300, // 300 meters from shift coordinates
};
