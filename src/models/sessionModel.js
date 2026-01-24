import mongoose, { Schema } from "mongoose";
const sessionSchema = new mongoose.Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 3600 * 24 * 7,
  },
});
const Session =
  mongoose.models.Session || mongoose.model("Session", sessionSchema);
export default Session;
