const express = require("express");
const router = express.Router({ mergeParams: true });
const wrapAsync = require("../utils/wrapAsync.js");
const ExpressError = require("../utils/ExpressError.js");
const { reviewSchema } = require("../schema.js");
const Listing = require("../models/listing.js");
const Review = require("../models/review.js");

// server side validation for review schema
const validateReview = (req, res, next) => {
  let { error } = reviewSchema.validate(req.body);
  if (error) {
    const msg = error.details.map((el) => el.message).join(",");
    throw new ExpressError(400, msg); // Pass the error to the Express error handler
  } else {
    next();
  }
};

// Reviews -> POST Route
router.post(
  "/",
  validateReview,
  wrapAsync(async (req, res, next) => {
    // next is here
    console.log("params:", req.params);
    console.log("review", req.body.review);
    let listing = await Listing.findById(req.params.id); // No try...catch needed
    if (!listing) {
      throw new ExpressError(404, "Listing not found"); // Throw ExpressError
    }
    let newReview = new Review(req.body.review);
    listing.reviews.push(newReview);
    await newReview.save();
    await listing.save();
    req.flash("success", "New Review Created!");
    res.redirect(`/listings/${listing._id}`);
  })
);

// Reviews -> Delete Route
router.delete(
  "/:reviewId",
  wrapAsync(async (req, res, next) => {
    let { id, reviewId } = req.params;

    try {
      const listing = await Listing.findByIdAndUpdate(id, {
        $pull: { reviews: reviewId },
      });
      if (!listing) {
        throw new ExpressError(404, "Listing not found");
      }
      const review = await Review.findByIdAndDelete(reviewId);
      if (!review) {
        throw new ExpressError(404, "Review not found");
      }
      req.flash("success", "Review Deleted!");
      res.redirect(`/listings/${id}`);
    } catch (err) {
      if (err.name === "CastError") {
        err = new ExpressError(400, "Invalid ID");
      }
      next(err); // Pass the error to the error handler
    }
  })
);

module.exports = router;
