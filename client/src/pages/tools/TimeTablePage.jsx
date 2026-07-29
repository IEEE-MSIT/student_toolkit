import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import api from "../../services/api/axiosInstance";

const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const createDefaultDays = () =>
  DAYS.map((day) => ({
    day,
    slots: Array.from({ length: 6 }, (_, index) => ({
      slotNumber: index + 1,
      subject: "",
    })),
  }));

const getErrorMessage = (error, fallback) =>
  error?.response?.data?.message || error?.data?.message || fallback;

const formatDateTime = (value) => {
  if (!value) {
    return "Not saved yet";
  }

  return new Date(value).toLocaleString();
};

function TimeTablePage() {
  const [days, setDays] = useState(createDefaultDays);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState(null);

  useEffect(() => {
    const fetchTimetable = async () => {
      try {
        const response = await api.get("/user/timetable");

        setDays(
          response.data?.days?.length
            ? response.data.days
            : createDefaultDays(),
        );

        setLastSavedAt(response.data?.updatedAt || null);
      } catch (error) {
        toast.error(getErrorMessage(error, "Failed to load timetable"));
        setDays(createDefaultDays());
      } finally {
        setIsLoading(false);
      }
    };

    fetchTimetable();
  }, []);

  const handleChange = (dayName, slotNumber, value) => {
    setDays((current) =>
      current.map((day) =>
        day.day === dayName
          ? {
              ...day,
              slots: day.slots.map((slot) =>
                slot.slotNumber === slotNumber
                  ? { ...slot, subject: value }
                  : slot,
              ),
            }
          : day,
      ),
    );
  };

  const handleSave = async () => {
    setIsSaving(true);

    try {
      const response = await api.put("/user/timetable", { days });

      setDays(response.data?.days || createDefaultDays());
      setLastSavedAt(response.data?.updatedAt || null);

      toast.success("Timetable saved successfully!");
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to save timetable"));
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return null;
  }

  return (
    <section className="space-y-8">
      <div className="rounded-2xl border border-border bg-surface p-8 shadow-card transition-colors duration-300 dark:border-border-dark dark:bg-surface-dark">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-3xl font-serif font-bold text-foreground dark:text-white">
              Time Table Manager
            </h1>

            <p className="mt-2 text-sm text-foreground-muted dark:text-slate-400">
              Save your weekly schedule once and access the same timetable
              anytime.
            </p>
          </div>

          <div className="flex flex-col items-start gap-3 lg:items-end">
            <div className="rounded-2xl border border-border bg-background px-4 py-3 text-sm transition-colors dark:border-border-dark dark:bg-surface-dark-elevated">
              <p className="font-semibold text-foreground dark:text-white">
                {isSaving ? "Saving..." : "Ready to save"}
              </p>

              <p className="mt-1 text-xs text-foreground-muted dark:text-slate-400">
                Last saved: {formatDateTime(lastSavedAt)}
              </p>
            </div>

            <button
              onClick={handleSave}
              disabled={isSaving}
              className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-secondary"
            >
              {isSaving ? "Saving..." : "Save Timetable"}
            </button>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-border bg-surface p-6 shadow-card transition-colors duration-300 dark:border-border-dark dark:bg-surface-dark">
        <table className="w-full table-auto border-collapse">
          <thead>
            <tr>
              <th className="border-b border-border px-4 py-3 text-left font-serif text-sm font-semibold text-foreground dark:border-border-dark dark:text-slate-300">
                Day
              </th>

              {Array.from({ length: 6 }, (_, index) => (
                <th
                  key={index + 1}
                  className="border-b border-border px-4 py-3 text-center font-serif text-sm font-semibold text-foreground dark:border-border-dark dark:text-slate-300"
                >
                  Period {index + 1}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {days.map((day) => (
              <tr
                key={day.day}
                className="transition-colors hover:bg-background/40 dark:hover:bg-surface-dark-elevated/40"
              >
                <td className="border-b border-border px-4 py-3 text-sm font-semibold text-foreground dark:border-border-dark dark:text-slate-200">
                  {day.day}
                </td>

                {day.slots.map((slot) => (
                  <td
                    key={`${day.day}-${slot.slotNumber}`}
                    className="border-b border-border px-2 py-3 dark:border-border-dark"
                  >
                    <input
                      type="text"
                      placeholder="Subject"
                      value={slot.subject || ""}
                      onChange={(event) =>
                        handleChange(
                          day.day,
                          slot.slotNumber,
                          event.target.value,
                        )
                      }
                      className="w-full rounded-lg border border-border bg-background px-2.5 py-2 text-xs text-foreground outline-none transition-all placeholder:text-foreground-muted/50 focus:border-primary dark:border-border-dark dark:bg-surface-dark dark:text-white dark:focus:border-secondary"
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default TimeTablePage;
