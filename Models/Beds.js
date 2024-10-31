import mongoose from "mongoose";

const BedModel = mongoose.Schema({
  BedNumber: {
    type: Number,
  },
});

export default mongoose.models("Beds") || mongoose.model("Beds", BedModel);
