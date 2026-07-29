import mongoose from "mongoose";

const subjectCatalogSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    normalizedName: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    credits: {
      type: Number,
      required: true,
      min: 0,
    },
    semesterLabel: {
      type: String,
      required: true,
      trim: true,
    },
    semesterNumber: {
      type: Number,
      required: true,
      min: 1,
      max: 8,
      index: true,
    },
  },
  { timestamps: true }
);

subjectCatalogSchema.pre("validate", function setNormalizedName(next) {
  this.normalizedName = this.name.trim().toLowerCase();
  next();
});

subjectCatalogSchema.index({ code: 1, semesterNumber: 1 });

const SubjectCatalog = mongoose.model("SubjectCatalog", subjectCatalogSchema);

export default SubjectCatalog;
