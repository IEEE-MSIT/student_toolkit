import mongoose from "mongoose";

const attendanceRecordSchema = new mongoose.Schema(
  {
    subjectCode: {
      type: String,
      trim: true,
      uppercase: true,
      default: "",
    },
    subjectName: {
      type: String,
      required: true,
      trim: true,
    },
    attended: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    total: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    requiredPercentage: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
      default: 75,
    },
  },
  { _id: false }
);

const attendanceCollectionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    records: {
      type: [attendanceRecordSchema],
      default: [],
    },
  },
  { timestamps: true }
);

const AttendanceCollection = mongoose.model(
  "AttendanceCollection",
  attendanceCollectionSchema
);

export default AttendanceCollection;
