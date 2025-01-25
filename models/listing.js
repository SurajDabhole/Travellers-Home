const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const listingSchema = new Schema({
  title: {
    type: String,
    required: true,
  },
  description: String,
  image: {
    type: String,
    default: "https://unsplash.com/photos/a-bed-sitting-in-a-bedroom-next-to-a-doorway-S5-6KnLQw30",
  },
  price: String,
  location: String,
  country: String,
});

const Listing = mongoose.model("Listing", listingSchema);

module.exports = Listing;

/*
Listing schema to store all the registered properties(houses,villas,hotels etc.)
 and information related to those properties
*/
