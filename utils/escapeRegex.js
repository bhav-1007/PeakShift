// Escape special characters in user input before using it in a regular expression
function escapeRegex(text) {
  if (typeof text !== "string") return "";
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
}

module.exports = escapeRegex;
