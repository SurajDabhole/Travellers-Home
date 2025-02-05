const Listing = require("../models/listing.js");
const Review = require("../models/review.js");

module.exports.createReview = async (req, res, next) => {
  // next is here
  console.log("params:", req.params);
  console.log("review", req.body.review);
  let listing = await Listing.findById(req.params.id); // No try...catch needed
  if (!listing) {
    throw new ExpressError(404, "Listing not found"); // Throw ExpressError
  }
  let newReview = new Review(req.body.review);
  newReview.author = req.user._id;
  listing.reviews.push(newReview);
  await newReview.save();
  await listing.save();
  req.flash("success", "New Review Created!");
  res.redirect(`/listings/${listing._id}`);
};

module.exports.destroyReview = async (req, res, next) => {
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
};
