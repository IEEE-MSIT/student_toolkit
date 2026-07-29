import Holiday from "../models/Holidays.js";
import AcademicCalendar from "../models/AcademicCalendar.js";

export const getCalendarEvents = async (req, res) => {
    try {
        const holidays = await Holiday.find().sort({ date: 1 });
        const academicCalendar = await AcademicCalendar.find().sort({
            startDate: 1,
        });

        const holidayEvents = holidays.map((holiday) => ({
            id: `holiday-${holiday._id}`,
            title: holiday.name,
            start: holiday.date,
            end: holiday.date,
            type: "Holiday",
            allDay: true,
        }));

        const academicEvents = academicCalendar.map((event) => ({
            id: `academic-${event._id}`,
            title: event.title,
            start: event.startDate,
            end: event.endDate,
            type: event.type,
            description: event.description || "",
            allDay: true,
        }));

        res.json({
            success: true,
            events: [...holidayEvents, ...academicEvents],
        });
    } catch (err) {
        console.error(err);

        res.status(500).json({
            success: false,
            message: "Unable to fetch calendar events",
        });
    }
};