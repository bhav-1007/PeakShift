const Notification = require("../models/notification.js");

module.exports.getUnreadCount = async (req, res) => {
  if (!req.user) {
    return res.json({ unreadCount: 0 });
  }
  const unreadCount = await Notification.countDocuments({
    user: req.user._id,
    read: false,
  });
  res.json({ unreadCount });
};

module.exports.renderNotifications = async (req, res) => {
  const notifications = await Notification.find({
    user: req.user._id,
  }).sort({ createdAt: -1 });

  res.render("notifications/index.ejs", { notifications });
};

module.exports.markAllRead = async (req, res) => {
  await Notification.updateMany(
    { user: req.user._id, read: false },
    { $set: { read: true } }
  );
  req.flash("success", "All notifications marked as read.");
  res.redirect("/notifications");
};

module.exports.markOneRead = async (req, res) => {
  const { id } = req.params;
  const notif = await Notification.findOne({ _id: id, user: req.user._id });
  if (notif) {
    notif.read = true;
    await notif.save();
    return res.redirect(notif.link || "/notifications");
  }
  res.redirect("/notifications");
};
