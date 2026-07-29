import mongoose from "mongoose";

const academicCalendarSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
        },
        startDate: {
            type: Date,
            required: true,
        },
        endDate: {
            type: Date,
            required: true,
        },
        semester: {
            type: String,
            required: true,
        },
        type: {
            type: String,
            required: true,
        },
        description: {
            type: String,
            default: "",
        },
    },
    {
        timestamps: true,
    }
);

export default mongoose.model("AcademicCalendar", academicCalendarSchema);