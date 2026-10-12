const Notification = require("../models/notification.js");

/**
 * Creates a notification for a user.
 * @param {ObjectId|string} userId
 * @param {string} message
 * @param {string} [link]
 * @returns {Promise<Notification|null>}
 */
async function notify(userId, message, link = "/") {
  if (!userId || !message) return null;
  try {
    return await Notification.create({
      user: userId,
      message,
      link,
    });
  } catch (err) {
    console.error("Error creating notification:", err);
    return null;
  }
}

module.exports = {
  notify,
};
