import { useEffect, useMemo, useState } from "react";
import api from "../../services/api/axiosInstance";

const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

function DashboardTimeTableWidget() {
  const [days, setDays] = useState([]);

  useEffect(() => {
    const fetchTimeTable = async () => {
      try {
        const response = await api.get("/user/timetable");
        setDays(response.data?.days || []);
      } catch (error) {
        setDays([]);
      }
    };

    fetchTimeTable();
  }, []);

  const todaySchedule = useMemo(() => {
    const today = DAY_NAMES[new Date().getDay()];
    const selectedDay = days.find((day) => day.day === today);

    return (selectedDay?.slots || []).filter((slot) => slot.subject?.trim());
  }, [days]);

  return (
    <div className="rounded-2xl border border-border bg-surface p-6 shadow-card transition-colors duration-300 dark:border-border-dark dark:bg-surface-dark">
      <h3 className="mb-4 font-serif font-semibold text-foreground dark:text-white">
        Today's Schedule
      </h3>
      <div className="space-y-3">
        {todaySchedule.length ? (
          todaySchedule.map((slot) => (
            <div
              key={slot.slotNumber}
              className="flex gap-4 rounded-xl border border-border bg-gradient-to-r from-background to-transparent p-3.5 transition-colors duration-300 dark:border-border-dark dark:from-surface-dark-elevated"
            >
              <div className="min-w-max font-mono text-sm font-semibold text-primary dark:text-secondary">
                Period {slot.slotNumber}
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-foreground dark:text-white">
                  {slot.subject}
                </p>
                <p className="mt-0.5 text-xs text-foreground-muted dark:text-slate-400">
                  Synced from your saved timetable
                </p>
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-xl border border-dashed border-border bg-background px-4 py-8 text-center dark:border-border-dark dark:bg-surface-dark-elevated">
            <p className="font-semibold text-foreground dark:text-white">
              No classes saved for today
            </p>
            <p className="mt-1 text-sm text-foreground-muted dark:text-slate-400">
              Add your weekly subjects in the timetable tool to see them here.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default DashboardTimeTableWidget;
