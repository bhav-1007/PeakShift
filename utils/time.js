// Time helpers for PeakShift (Indian Standard Time: UTC+05:30)

// Parse datetime-local input string into a Date interpreted in India Standard Time (+05:30)
function parseIndiaTime(dateStr) {
  if (!dateStr) return null;
  if (dateStr instanceof Date) return dateStr;

  const str = String(dateStr).trim();
  // If string has no timezone offset (like datetime-local '2026-10-12T18:30'), append +05:30
  if (!str.includes("Z") && !str.includes("+") && !str.match(/-\d{2}:\d{2}$/)) {
    const formatted = str.length === 16 ? `${str}:00+05:30` : `${str}+05:30`;
    return new Date(formatted);
  }
  return new Date(str);
}

// Format a Date object to IST string: e.g. "12 Oct 2026, 6:30 PM"
function formatIST(date) {
  if (!date) return "";
  const d = new Date(date);
  return d.toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

// Format time only in IST: e.g. "6:30 PM"
function formatTimeIST(date) {
  if (!date) return "";
  const d = new Date(date);
  return d.toLocaleTimeString("en-IN", {
    timeZone: "Asia/Kolkata",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

// Format date only in IST: e.g. "12 Oct 2026"
function formatDateIST(date) {
  if (!date) return "";
  const d = new Date(date);
  return d.toLocaleDateString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// Format full shift window: e.g. "12 Oct 2026, 6:00 PM – 10:00 PM"
function formatShiftRangeIST(startAt, endAt) {
  if (!startAt || !endAt) return "";
  const startDate = formatDateIST(startAt);
  const startTime = formatTimeIST(startAt);
  const endTime = formatTimeIST(endAt);
  return `${startDate}, ${startTime} – ${endTime}`;
}

// Relative countdown: e.g. "starts in 2h 10m"
function formatStartsIn(date) {
  if (!date) return "";
  const diffMs = new Date(date).getTime() - Date.now();
  if (diffMs <= 0) return "Started";

  const totalMinutes = Math.floor(diffMs / 60000);
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;

  if (days > 0) {
    return `starts in ${days}d ${hours}h`;
  }
  if (hours > 0) {
    return `starts in ${hours}h ${minutes}m`;
  }
  return `starts in ${Math.max(1, minutes)}m`;
}

// Duration in hours between startAt and endAt
function calculateHours(startAt, endAt) {
  if (!startAt || !endAt) return 0;
  const diffMs = new Date(endAt).getTime() - new Date(startAt).getTime();
  return Math.max(1, Math.round(diffMs / (1000 * 60 * 60)));
}

// Format Date for datetime-local input value in IST (+05:30)
function formatForDateTimeLocal(date) {
  if (!date) return "";
  const d = new Date(date);
  // Shift by 5 hours and 30 minutes to get local IST YYYY-MM-DDTHH:mm
  const istTime = new Date(d.getTime() + 5.5 * 60 * 60 * 1000);
  return istTime.toISOString().slice(0, 16);
}

module.exports = {
  parseIndiaTime,
  formatIST,
  formatTimeIST,
  formatDateIST,
  formatShiftRangeIST,
  formatStartsIn,
  calculateHours,
  formatForDateTimeLocal,
};
