const Joi = require("joi");

module.exports.listingSchema = Joi.object({
  listing: Joi.object({
    title: Joi.string().required(),
    description: Joi.string().required(),
    price: Joi.number().required().min(0),
    roleType: Joi.string().allow("").optional(),
    workersNeeded: Joi.number().integer().min(1).optional(),
    startAt: Joi.date().greater("now").required().messages({
      "date.greater": "Shift start time must be in the future",
      "any.required": "Shift start time is required",
    }),
    endAt: Joi.date().greater(Joi.ref("startAt")).required().messages({
      "date.greater": "Shift end time must be after the start time",
      "any.required": "Shift end time is required",
    }),
    skillTags: Joi.alternatives().try(
      Joi.array().items(Joi.string().allow("")),
      Joi.string().allow("")
    ).optional(),
    location: Joi.string().required(),
    lat: Joi.number().optional(),
    lng: Joi.number().optional(),
  })
    .custom((value, helpers) => {
      if (value.startAt && value.endAt) {
        const diffMs = new Date(value.endAt) - new Date(value.startAt);
        const diffHours = diffMs / (1000 * 60 * 60);
        if (diffHours < 1 || diffHours > 12) {
          return helpers.message("Shift length must be between 1 and 12 hours");
        }
      }
      return value;
    })
    .required(),
});

module.exports.reviewSchema = Joi.object({
  review: Joi.object({
    rating: Joi.number().required().min(1).max(5),
    comment: Joi.string().allow("").optional(),
  }).required(),
});

module.exports.userSchema = Joi.object({
  username: Joi.string().required(),
  email: Joi.string().email().required(),
  password: Joi.string().required(),
  role: Joi.string().valid("worker", "business").required(),
  phone: Joi.string().allow("").optional(),
  businessName: Joi.when("role", {
    is: "business",
    then: Joi.string().required(),
    otherwise: Joi.string().allow("").optional(),
  }),
  skills: Joi.alternatives().try(
    Joi.array().items(Joi.string().allow("")),
    Joi.string().allow("")
  ).optional(),
});

module.exports.profileSchema = Joi.object({
  homeLocation: Joi.string().required().messages({
    "any.required": "Home location is required",
    "string.empty": "Home location cannot be empty",
  }),
  lat: Joi.number().optional().allow(null, ""),
  lng: Joi.number().optional().allow(null, ""),
});

module.exports.listingsFilterSchema = Joi.object({
  q: Joi.string().allow("").optional(),
  skill: Joi.string().allow("").optional(),
  minPrice: Joi.number().min(0).allow("").optional(),
  when: Joi.string().valid("next2h", "today", "tomorrow", "").optional(),
  sort: Joi.string().valid("soonest", "nearest", "highestPay", "").optional(),
  radius: Joi.number().valid(2, 5, 10, 20).allow("").optional(),
  lat: Joi.number().min(-90).max(90).allow("").optional(),
  lng: Joi.number().min(-180).max(180).allow("").optional(),
  page: Joi.number().integer().min(1).optional(),
});

