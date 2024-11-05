import mongoose from "mongoose";

const VerificationTableSchema = new mongoose.Schema({
  email: {
    type: String,
    ref: "User",
    require: true,
  },
  userId: {
    type: mongoose.Types.ObjectId,
    ref: "User",
  },
  token: {
    type: String,
    require: true,
  },
  expiresIn: {
    type: Date,
  },
});

export default mongoose.models.VerificationTableSchema ||
  mongoose.model("VerificationTable", VerificationTableSchema);