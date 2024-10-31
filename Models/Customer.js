import mongoose from "mongoose";

const customerModel = mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  roomNumber: {
    type: mongoose.Types.ObjectId,
    ref: "Rooms",
  },
  bedNumber: {
    type: mongoose.Types.ObjectId,
    ref: "Beds",
  },
});
export default mongoose.models.Customer ||
  mongoose.model("Customer", customerModel);
