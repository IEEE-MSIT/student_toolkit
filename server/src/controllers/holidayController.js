import Holiday from "../models/Holidays.js";

export const getHolidays = async (req, res) => {
    try {
        const { type, upcoming } = req.query;

        const query = {};

        // Filter by type
        if (type) {
            query.type = type;
        }

        // Show only upcoming holidays
        if (upcoming === "true") {
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            query.date = { $gte: today };
        }

        const result = await Holiday.find(query).sort({ date: 1 });

        res.json({
            success: true,
            count: result.length,
            holidays: result,
        });
    } catch (err) {
        console.error(err);

        res.status(500).json({
            success: false,
            message: "Failed to fetch holidays",
        });
    }
};