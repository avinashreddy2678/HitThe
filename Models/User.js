import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  profileDp: {
    type: String,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    sparse: true,
  },
  password: {
    type: String,
  },
  emailVerified: {
    type: Boolean,
  },
  createdAt: {
    type: Date,
  },
  googleId: { type: String, unique: true, sparse: true },
  Rooms: {
    type: [mongoose.Types.ObjectId],
    ref: "Rooms",
  },
});
export default mongoose.models.User || mongoose.model("User", UserSchema);
