import mongoose from "mongoose";

const plannerEntrySchema = new mongoose.Schema(
  {
    subjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SubjectCatalog",
    },
    subjectCode: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },
    subjectName: {
      type: String,
      required: true,
      trim: true,
    },
    credits: {
      type: Number,
      required: true,
      min: 0,
    },
    score: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
  },
  { _id: false }
);

const plannerSemesterSchema = new mongoose.Schema(
  {
    semesterNumber: {
      type: Number,
      required: true,
      min: 1,
      max: 8,
    },
    entries: {
      type: [plannerEntrySchema],
      default: [],
    },
  },
  { _id: false }
);

const gpaPlannerSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    semesters: {
      type: [plannerSemesterSchema],
      default: [],
    },
  },
  { timestamps: true }
);

const GpaPlanner = mongoose.model("GpaPlanner", gpaPlannerSchema);

export default GpaPlanner;
