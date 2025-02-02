const express = require("express");
const app = express();
const mongoose = require("mongoose");
const Listing = require("./models/listing.js");
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const wrapAsync = require("./utils/wrapAsync.js");
const ExpressError = require("./utils/ExpressError.js");
const { listingSchema, reviewSchema } = require("./schema.js");
const Review = require("./models/review.js");

async function main() {
  await mongoose.connect("mongodb://127.0.0.1:27017/wanderlust");
}

main()
  .then(() => console.log("Connection Successful"))
  .catch((err) => console.log(err));

app.use(express.urlencoded({ extended: true })); // Parses form data (application/x-www-form-urlencoded)
app.use(methodOverride("_method"));
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.engine("ejs", ejsMate);
app.use(express.static(path.join(__dirname, "/public")));

app.get(
  "/",
  wrapAsync((req, res) => {
    res.send("Hi, I am root");
  })
);

// server side validation for listing schema
const validateListing = (req, res, next) => {
  let { error } = listingSchema.validate(req.body);
  if (result.error) {
    let errMsg = error.details.map((el) => el.message).join(",");
    throw new ExpressError(400, error);
  } else {
    next();
  }
};

// server side validation for review schema
const validateReview = (req, res, next) => {
  let { error } = reviewSchema.validate(req.body); // Use { error } destructuring
  if (error) {
    // Check for error, not result.error
    let errMsg = error.details.map((el) => el.message).join(",");
    throw new ExpressError(400, errMsg); // Pass errMsg, not the whole error object
  } else {
    next();
  }
};

// Index Route
app.get(
  "/listings",
  wrapAsync(async (req, res) => {
    const allListings = await Listing.find({});
    res.render("listings/index.ejs", { allListings });
  })
);

// New Route
app.get(
  "/listings/new",
  wrapAsync((req, res) => {
    res.render("listings/new.ejs");
  })
);

// Show Route
app.get(
  "/listings/:id",
  wrapAsync(async (req, res) => {
    let { id } = req.params;
    const listing = await Listing.findById(id).populate("reviews");
    res.render("listings/show.ejs", { listing });
  })
);

//create route
app.post(
  "/listings",
  validateListing,
  wrapAsync(async (req, res) => {
    // let{title,description,image,price,country,location} = req.body; // we cannot use this syntax because we have stored parameters in a listing object
    const newListing = new Listing(req.body.listing); // we have add the middleware to parse the data for post request : app.use(express.urlencoded({ extended: true }));
    await newListing.save(); // DB operation
    res.redirect("/listings");
  })
);

// Edit Route
app.get(
  "/listings/:id/edit",
  wrapAsync(async (req, res) => {
    let { id } = req.params;
    const listing = await Listing.findById(id);
    res.render("listings/edit.ejs", { listing });
  })
);

// Update Route
app.put(
  "/listings/:id",
  validateListing,
  wrapAsync(async (req, res) => {
    let { id } = req.params;
    await Listing.findByIdAndUpdate(id, { ...req.body.listing });
    res.redirect(`/listings/${id}`);
  })
);

// Delete Route
app.delete(
  "/listings/:id",
  wrapAsync(async (req, res) => {
    let { id } = req.params;
    let deletedListing = await Listing.findByIdAndDelete(id);
    console.log(deletedListing);
    res.redirect("/listings");
  })
);

// Reviews -> POST Route
app.post(
  "/listings/:id/reviews",
  validateReview,
  wrapAsync(async (req, res) => {
    try {
      let listing = await Listing.findById(req.params.id);
      if (!listing) {
        throw new ExpressError(404, "Listing not found");
      }
      let newReview = new Review(req.body.review);
      listing.reviews.push(newReview);
      await newReview.save();
      await listing.save();
      res.redirect(`/listings/${listing._id}`);
    } catch (err) {
      if (err.name === "CastError") {
        // Check if it is a CastError (invalid ID)
        err = new ExpressError(400, "Invalid Listing ID");
      }
      next(err); // Pass the error to your error handling middleware
    }
  })
);


// Reviews -> Delete Route
app.delete(  // Keep this as app.delete
  "/listings/:id/reviews/:reviewId",
  wrapAsync(async (req, res) => {
    let { id, reviewId } = req.params;

    try {
      const listing = await Listing.findByIdAndUpdate(id, { $pull: { reviews: reviewId } });
      if (!listing) {
        throw new ExpressError(404, "Listing not found");
      }
      const review = await Review.findByIdAndDelete(reviewId);
      if (!review) {
        throw new ExpressError(404, "Review not found");
      }
      res.redirect(`/listings/${id}`);
    } catch (err) {
      if (err.name === "CastError") {
        err = new ExpressError(400, "Invalid ID");
      }
      next(err);
    }
  })
);

// app.get("/testListing", async (req, res) => {
//   let sampleListing = new Listing({
//     title: "My new villa",
//     description: "By the beach",
//     price: 1200,
//     location: "Calangute, Goa",
//     country: "India",
//   });

//   await sampleListing.save();
//   console.log("sample was saved");
//   res.send("successful testing");
// });

// If user enter an address which is not valid
app.all("*", (req, res, next) => {
  next(new ExpressError(404, "Page Not Found"));
});

// Error Handling Middleware
app.use((err, req, res, next) => {
  let { statusCode = 500, message = "Something went wrong!" } = err;
  console.log(`Error: ${message}`); // Add this to see the error in the console
  res.status(statusCode).render("error.ejs", { message });
});

app.listen(8080, () => {
  console.log("server is listening to port 8080");
});
