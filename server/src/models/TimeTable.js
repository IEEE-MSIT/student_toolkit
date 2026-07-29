import mongoose from "mongoose";

const timetableSlotSchema = new mongoose.Schema(
  {
    slotNumber: {
      type: Number,
      required: true,
      min: 1,
    },
    subject: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { _id: false }
);

const timetableDaySchema = new mongoose.Schema(
  {
    day: {
      type: String,
      required: true,
      trim: true,
    },
    slots: {
      type: [timetableSlotSchema],
      default: [],
    },
  },
  { _id: false }
);

const timeTableSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    days: {
      type: [timetableDaySchema],
      default: [],
    },
  },
  { timestamps: true }
);

const TimeTable = mongoose.model("TimeTable", timeTableSchema);

export default TimeTable;
