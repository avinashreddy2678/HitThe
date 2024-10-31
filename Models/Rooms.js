import mongoose from "mongoose";

const RoomModel = mongoose.Schema({
  RoomNo: {
    type: Number,
    require: true,
    unique: true,
  },
  Beds: {
    type: [mongoose.Types.ObjectId],
  },
});

export default mongoose.models.Rooms || mongoose.model("Rooms", RoomModel);
