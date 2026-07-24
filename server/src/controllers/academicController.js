import AcademicCalendar from "../models/AcademicCalendar.js";

export const getAcademicCalendar = async (req, res) => {
    try {
        const events = await AcademicCalendar.find().sort({ startDate: 1 });

        const formattedEvents = events.map((event) => ({
            id: event._id.toString(),
            title: event.title,
            startDate: event.startDate,
            endDate: event.endDate,
            semester: event.semester,
            type: event.type,
            description: event.description,
        }));

        res.json({
            success: true,
            count: formattedEvents.length,
            events: formattedEvents,
        });
    } catch (err) {
        console.error(err);

        res.status(500).json({
            success: false,
            message: "Failed to fetch academic calendar",
        });
    }
};