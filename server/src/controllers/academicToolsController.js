import mongoose from "mongoose";
import AttendanceCollection from "../models/AttendanceCollection.js";
import GpaPlanner from "../models/GpaPlanner.js";
import SubjectCatalog from "../models/SubjectCatalog.js";
import TimeTable from "../models/TimeTable.js";

const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const escapeRegex = (value = "") =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const isValidUser = (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.user.id)) {
    res.status(401).json({ message: "Invalid session. Please log in again." });
    return false;
  }

  return true;
};

const createDefaultTimetable = () =>
  DAYS.map((day) => ({
    day,
    slots: Array.from({ length: 6 }, (_, index) => ({
      slotNumber: index + 1,
      subject: "",
    })),
  }));

const normalizeScore = (value) => {
  const score = Number(value);
  if (Number.isNaN(score)) {
    return null;
  }

  return Math.max(0, Math.min(100, score));
};

const buildGpaSummary = (semesters = []) => {
  let totalPoints = 0;
  let totalCredits = 0;

  const semesterSummaries = semesters.map((semester) => {
    const semesterCredits = semester.entries.reduce(
      (sum, entry) => sum + entry.credits,
      0
    );
    const semesterMarks = semester.entries.reduce(
      (sum, entry) => sum + entry.credits * entry.score,
      0
    );
    const sgpa =
      semesterCredits > 0
        ? Number(((semesterMarks / semesterCredits) / 10).toFixed(2))
        : 0;

    totalCredits += semesterCredits;
    totalPoints += semesterMarks;

    return {
      semesterNumber: semester.semesterNumber,
      totalCredits: semesterCredits,
      sgpa,
    };
  });

  const cgpa =
    totalCredits > 0 ? Number(((totalPoints / totalCredits) / 10).toFixed(2)) : 0;

  return {
    cgpa,
    totalCredits,
    semesters: semesterSummaries,
  };
};

const sanitizePlannerSemesters = async (semesters = []) => {
  const subjectCodes = semesters.flatMap((semester) =>
    Array.isArray(semester?.entries)
      ? semester.entries
          .map((entry) => entry?.subjectCode?.trim()?.toUpperCase())
          .filter(Boolean)
      : []
  );

  const catalogSubjects = await SubjectCatalog.find({
    code: { $in: [...new Set(subjectCodes)] },
  }).lean();
  const catalogByCode = new Map(catalogSubjects.map((subject) => [subject.code, subject]));

  return semesters
    .map((semester) => {
      const semesterNumber = Number(semester?.semesterNumber);
      const seenCodes = new Set();

      if (!Number.isInteger(semesterNumber) || semesterNumber < 1 || semesterNumber > 8) {
        return null;
      }

      const entries = Array.isArray(semester?.entries)
        ? semester.entries
            .map((entry) => {
              const subjectCode = entry?.subjectCode?.trim()?.toUpperCase();
              const score = normalizeScore(entry?.score);

              if (!subjectCode || score === null || seenCodes.has(subjectCode)) {
                return null;
              }

              const catalogSubject = catalogByCode.get(subjectCode);
              const credits = catalogSubject
                ? catalogSubject.credits
                : Number(entry?.credits);

              if (!credits || Number.isNaN(credits)) {
                return null;
              }

              seenCodes.add(subjectCode);

              return {
                subjectId: catalogSubject?._id,
                subjectCode,
                subjectName:
                  catalogSubject?.name ||
                  entry?.subjectName?.trim() ||
                  subjectCode,
                credits,
                score,
              };
            })
            .filter(Boolean)
        : [];

      return {
        semesterNumber,
        entries,
      };
    })
    .filter(Boolean)
    .sort((left, right) => left.semesterNumber - right.semesterNumber);
};

const sanitizeTimetableDays = (days = []) => {
  const incomingDays = new Map(
    days
      .filter((day) => DAYS.includes(day?.day))
      .map((day) => [day.day, day])
  );

  return DAYS.map((day) => {
    const source = incomingDays.get(day);

    return {
      day,
      slots: Array.from({ length: 6 }, (_, index) => {
        const slotNumber = index + 1;
        const slot = source?.slots?.find((item) => Number(item?.slotNumber) === slotNumber);

        return {
          slotNumber,
          subject: slot?.subject?.trim() || "",
        };
      }),
    };
  });
};

const sanitizeAttendanceRecords = async (records = []) => {
  const subjectCodes = records
    .map((record) => record?.subjectCode?.trim()?.toUpperCase())
    .filter(Boolean);

  const catalogSubjects = await SubjectCatalog.find({
    code: { $in: [...new Set(subjectCodes)] },
  }).lean();
  const catalogByCode = new Map(catalogSubjects.map((subject) => [subject.code, subject]));
  const seenSubjects = new Set();

  return records
    .map((record) => {
      const subjectCode = record?.subjectCode?.trim()?.toUpperCase() || "";
      const subjectName =
        record?.subjectName?.trim() ||
        catalogByCode.get(subjectCode)?.name ||
        "";
      const key = subjectCode || subjectName.toLowerCase();
      const attended = Math.max(0, Number(record?.attended) || 0);
      const total = Math.max(attended, Number(record?.total) || 0);
      const requiredPercentage = Math.max(
        0,
        Math.min(100, Number(record?.requiredPercentage ?? 75) || 75)
      );

      if (!subjectName || seenSubjects.has(key)) {
        return null;
      }

      seenSubjects.add(key);

      return {
        subjectCode,
        subjectName,
        attended,
        total,
        requiredPercentage,
      };
    })
    .filter(Boolean);
};

export const searchSubjects = async (req, res) => {
  try {
    if (!isValidUser(req, res)) {
      return;
    }

    const { query = "", semester } = req.query;
    const trimmedQuery = query.trim();
    const filter = {};

    if (semester) {
      filter.semesterNumber = Number(semester);
    }

    if (trimmedQuery) {
      const pattern = new RegExp(escapeRegex(trimmedQuery), "i");
      filter.$or = [{ code: pattern }, { name: pattern }];
    }

    const subjects = await SubjectCatalog.find(filter)
      .sort({ semesterNumber: 1, code: 1 })
      .limit(trimmedQuery ? 15 : 50)
      .lean();

    res.json({ subjects });
  } catch (error) {
    console.error("Subject search error:", error);
    res.status(500).json({ message: "Failed to search subjects" });
  }
};

export const getGpaPlanner = async (req, res) => {
  try {
    if (!isValidUser(req, res)) {
      return;
    }

    const planner = await GpaPlanner.findOne({ user: req.user.id }).lean();
    const semesters = planner?.semesters || [];

    res.json({
      semesters,
      summary: buildGpaSummary(semesters),
      updatedAt: planner?.updatedAt || null,
    });
  } catch (error) {
    console.error("Get GPA planner error:", error);
    res.status(500).json({ message: "Failed to fetch GPA planner" });
  }
};

export const saveGpaPlanner = async (req, res) => {
  try {
    if (!isValidUser(req, res)) {
      return;
    }

    const semesters = await sanitizePlannerSemesters(req.body?.semesters || []);
    const planner = await GpaPlanner.findOneAndUpdate(
      { user: req.user.id },
      { user: req.user.id, semesters },
      { upsert: true, new: true, runValidators: true }
    ).lean();

    res.json({
      message: "GPA planner saved successfully",
      semesters: planner.semesters,
      summary: buildGpaSummary(planner.semesters),
      updatedAt: planner.updatedAt,
    });
  } catch (error) {
    console.error("Save GPA planner error:", error);
    res.status(400).json({ message: "Failed to save GPA planner" });
  }
};

export const getTimeTable = async (req, res) => {
  try {
    if (!isValidUser(req, res)) {
      return;
    }

    const timeTable = await TimeTable.findOne({ user: req.user.id }).lean();

    res.json({
      days: timeTable?.days?.length ? timeTable.days : createDefaultTimetable(),
      updatedAt: timeTable?.updatedAt || null,
    });
  } catch (error) {
    console.error("Get timetable error:", error);
    res.status(500).json({ message: "Failed to fetch timetable" });
  }
};

export const saveTimeTable = async (req, res) => {
  try {
    if (!isValidUser(req, res)) {
      return;
    }

    const days = sanitizeTimetableDays(req.body?.days || []);
    const timeTable = await TimeTable.findOneAndUpdate(
      { user: req.user.id },
      { user: req.user.id, days },
      { upsert: true, new: true, runValidators: true }
    ).lean();

    res.json({
      message: "Timetable saved successfully",
      days: timeTable.days,
      updatedAt: timeTable.updatedAt,
    });
  } catch (error) {
    console.error("Save timetable error:", error);
    res.status(400).json({ message: "Failed to save timetable" });
  }
};

export const getAttendance = async (req, res) => {
  try {
    if (!isValidUser(req, res)) {
      return;
    }

    const attendance = await AttendanceCollection.findOne({ user: req.user.id }).lean();

    res.json({
      records: attendance?.records || [],
      updatedAt: attendance?.updatedAt || null,
    });
  } catch (error) {
    console.error("Get attendance error:", error);
    res.status(500).json({ message: "Failed to fetch attendance" });
  }
};

export const saveAttendance = async (req, res) => {
  try {
    if (!isValidUser(req, res)) {
      return;
    }

    const records = await sanitizeAttendanceRecords(req.body?.records || []);
    const attendance = await AttendanceCollection.findOneAndUpdate(
      { user: req.user.id },
      { user: req.user.id, records },
      { upsert: true, new: true, runValidators: true }
    ).lean();

    res.json({
      message: "Attendance saved successfully",
      records: attendance.records,
      updatedAt: attendance.updatedAt,
    });
  } catch (error) {
    console.error("Save attendance error:", error);
    res.status(400).json({ message: "Failed to save attendance" });
  }
};
