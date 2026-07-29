import { useEffect, useMemo, useState } from "react";
import { FiPlus, FiSave, FiTrash2 } from "react-icons/fi";
import toast from "react-hot-toast";
import api from "../../services/api/axiosInstance";

const createRecord = () => ({
  subjectName: "",
  subjectCode: "",
  attended: 0,
  total: 0,
  requiredPercentage: 75,
});

const getErrorMessage = (error, fallback) =>
  error?.response?.data?.message || error?.data?.message || fallback;

const calculateMetrics = (record) => {
  const attended = Number(record.attended) || 0;
  const total = Number(record.total) || 0;
  const requiredPercentage = Number(record.requiredPercentage) || 75;
  const percentage = total > 0 ? (attended / total) * 100 : 0;
  const canSkip = total > 0 ? Math.max(0, Math.floor(attended / (requiredPercentage / 100) - total)) : 0;
  const mustAttend =
    total > 0 && percentage < requiredPercentage
      ? Math.max(
          0,
          Math.ceil((requiredPercentage * total - 100 * attended) / (100 - requiredPercentage))
        )
      : 0;

  return {
    percentage: percentage.toFixed(2),
    canSkip,
    mustAttend,
  };
};

const formatDateTime = (value) => {
  if (!value) {
    return "Not saved yet";
  }

  return new Date(value).toLocaleString();
};

function AttendanceTrackerPage() {
  const [records, setRecords] = useState([createRecord()]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [saveState, setSaveState] = useState("saved");
  const [lastSavedAt, setLastSavedAt] = useState(null);

  useEffect(() => {
    const fetchAttendance = async () => {
      try {
        const response = await api.get("/user/attendance");
        const savedRecords = response.data?.records || [];
        setRecords(savedRecords.length ? savedRecords : [createRecord()]);
        setLastSavedAt(response.data?.updatedAt || null);
      } catch (error) {
        toast.error(getErrorMessage(error, "Failed to load attendance"));
        setRecords([createRecord()]);
      } finally {
        setIsLoading(false);
        setHasUnsavedChanges(false);
      }
    };

    fetchAttendance();
  }, []);

  const overallSummary = useMemo(() => {
    const totals = records.reduce(
      (accumulator, record) => ({
        attended: accumulator.attended + (Number(record.attended) || 0),
        total: accumulator.total + (Number(record.total) || 0),
      }),
      { attended: 0, total: 0 }
    );

    const percentage =
      totals.total > 0 ? ((totals.attended / totals.total) * 100).toFixed(2) : "0.00";

    return {
      attended: totals.attended,
      total: totals.total,
      percentage,
    };
  }, [records]);

  const handleAddRecord = () => {
    setRecords((current) => [...current, createRecord()]);
    setHasUnsavedChanges(true);
    setSaveState("dirty");
  };

  const handleRemoveRecord = (index) => {
    setRecords((current) => {
      const next = current.filter((_, currentIndex) => currentIndex !== index);
      return next.length ? next : [createRecord()];
    });
    setHasUnsavedChanges(true);
    setSaveState("dirty");
  };

  const handleChange = (index, field, value) => {
    setRecords((current) =>
      current.map((record, currentIndex) =>
        currentIndex === index
          ? {
              ...record,
              [field]:
                field === "subjectName" || field === "subjectCode"
                  ? value
                  : Math.max(0, Number(value) || 0),
            }
          : record
      )
    );
    setHasUnsavedChanges(true);
    setSaveState("dirty");
  };

  const saveAttendance = async () => {
    setIsSaving(true);
    setSaveState("saving");

    try {
      const response = await api.put("/user/attendance", { records });
      const savedRecords = response.data?.records || [];
      setRecords(savedRecords.length ? savedRecords : [createRecord()]);
      setLastSavedAt(response.data?.updatedAt || null);
      setHasUnsavedChanges(false);
      setSaveState("saved");
      toast.success("Attendance saved");
    } catch (error) {
      setSaveState("error");
      toast.error(getErrorMessage(error, "Failed to save attendance"));
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
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-3xl font-serif font-bold text-foreground dark:text-white">
              Attendance Tracker
            </h1>
            <p className="mt-2 text-sm text-foreground-muted dark:text-slate-400">
              Update your records smoothly and save them only when you are ready.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="rounded-2xl border border-border bg-background px-4 py-3 text-sm transition-colors dark:border-border-dark dark:bg-surface-dark-elevated">
              <p className="font-semibold text-foreground dark:text-white">
                {saveState === "saving"
                  ? "Saving attendance..."
                  : saveState === "error"
                    ? "Save failed"
                    : hasUnsavedChanges
                      ? "Unsaved changes"
                      : "Attendance saved"}
              </p>
              <p className="mt-1 text-xs text-foreground-muted dark:text-slate-400">
                Last updated: {formatDateTime(lastSavedAt)}
              </p>
            </div>
            <button
              onClick={saveAttendance}
              disabled={isSaving || !hasUnsavedChanges}
              className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-glow transition-all hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
            >
              <FiSave className="h-4 w-4" />
              {isSaving ? "Saving..." : "Save Attendance"}
            </button>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">
        <div className="space-y-4">
          {records.map((record, index) => {
            const metrics = calculateMetrics(record);

            return (
              <div
                key={`${record.subjectCode || record.subjectName || "record"}-${index}`}
                className="rounded-2xl border border-border bg-surface p-6 shadow-card transition-colors duration-300 dark:border-border-dark dark:bg-surface-dark"
              >
                <div className="grid gap-4 lg:grid-cols-[1.4fr_0.8fr_auto]">
                  <div className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <label className="mb-2 block text-sm font-semibold text-foreground dark:text-slate-300">
                          Subject Name
                        </label>
                        <input
                          type="text"
                          placeholder="e.g., Data Structures"
                          value={record.subjectName}
                          onChange={(event) =>
                            handleChange(index, "subjectName", event.target.value)
                          }
                          className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-foreground outline-none transition-all focus:border-primary dark:border-border-dark dark:bg-surface-dark-elevated dark:text-white dark:focus:border-secondary"
                        />
                      </div>
                      <div>
                        <label className="mb-2 block text-sm font-semibold text-foreground dark:text-slate-300">
                          Subject Code
                        </label>
                        <input
                          type="text"
                          placeholder="e.g., CIC-209"
                          value={record.subjectCode}
                          onChange={(event) =>
                            handleChange(index, "subjectCode", event.target.value.toUpperCase())
                          }
                          className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm uppercase text-foreground outline-none transition-all focus:border-primary dark:border-border-dark dark:bg-surface-dark-elevated dark:text-white dark:focus:border-secondary"
                        />
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-3">
                      <div>
                        <label className="mb-2 block text-sm font-semibold text-foreground dark:text-slate-300">
                          Attended
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={record.attended}
                          onChange={(event) =>
                            handleChange(index, "attended", event.target.value)
                          }
                          className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-foreground outline-none transition-all focus:border-primary dark:border-border-dark dark:bg-surface-dark-elevated dark:text-white dark:focus:border-secondary"
                        />
                      </div>
                      <div>
                        <label className="mb-2 block text-sm font-semibold text-foreground dark:text-slate-300">
                          Total
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={record.total}
                          onChange={(event) =>
                            handleChange(index, "total", event.target.value)
                          }
                          className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-foreground outline-none transition-all focus:border-primary dark:border-border-dark dark:bg-surface-dark-elevated dark:text-white dark:focus:border-secondary"
                        />
                      </div>
                      <div>
                        <label className="mb-2 block text-sm font-semibold text-foreground dark:text-slate-300">
                          Required %
                        </label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={record.requiredPercentage}
                          onChange={(event) =>
                            handleChange(index, "requiredPercentage", event.target.value)
                          }
                          className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-foreground outline-none transition-all focus:border-primary dark:border-border-dark dark:bg-surface-dark-elevated dark:text-white dark:focus:border-secondary"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-1">
                    <div className="rounded-xl bg-gradient-to-br from-primary to-primary-dark p-4 text-center text-white shadow-glow">
                      <p className="text-xs font-medium opacity-80">Current %</p>
                      <p className="mt-2 text-3xl font-serif font-bold">{metrics.percentage}%</p>
                    </div>
                    <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4 text-center dark:border-emerald-900/30 dark:bg-emerald-950/20">
                      <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                        Can skip
                      </p>
                      <p className="mt-2 text-3xl font-serif font-bold text-emerald-600 dark:text-emerald-400">
                        {metrics.canSkip}
                      </p>
                    </div>
                    <div className="rounded-xl border border-red-100 bg-red-50 p-4 text-center dark:border-red-900/30 dark:bg-red-950/20">
                      <p className="text-xs font-semibold text-red-700 dark:text-red-400">
                        Must attend
                      </p>
                      <p className="mt-2 text-3xl font-serif font-bold text-red-600 dark:text-red-400">
                        {metrics.mustAttend}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleRemoveRecord(index)}
                    className="self-start rounded-xl bg-red-50 p-3 text-red-600 transition-all hover:bg-red-100 dark:bg-red-950/20 dark:text-red-400 dark:hover:bg-red-950/30"
                    title="Remove subject"
                  >
                    <FiTrash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}

          <button
            onClick={handleAddRecord}
            className="flex items-center gap-2 rounded-full bg-secondary px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:bg-secondary-hover"
          >
            <FiPlus className="h-4 w-4" />
            Add Subject
          </button>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-6 shadow-card transition-colors duration-300 dark:border-border-dark dark:bg-surface-dark">
          <h2 className="text-xl font-serif font-semibold text-foreground dark:text-white">
            Overall Summary
          </h2>
          <div className="mt-6 rounded-2xl bg-gradient-to-br from-primary to-primary-dark p-6 text-center text-white shadow-glow">
            <p className="text-sm opacity-80">Overall Attendance</p>
            <p className="mt-2 text-5xl font-serif font-bold">
              {overallSummary.percentage}%
            </p>
          </div>
          <div className="mt-4 grid gap-3">
            <div className="rounded-xl border border-border bg-background p-4 dark:border-border-dark dark:bg-surface-dark-elevated">
              <p className="text-xs font-semibold uppercase tracking-wider text-foreground-muted dark:text-slate-500">
                Classes Attended
              </p>
              <p className="mt-2 text-3xl font-serif font-bold text-foreground dark:text-white">
                {overallSummary.attended}
              </p>
            </div>
            <div className="rounded-xl border border-border bg-background p-4 dark:border-border-dark dark:bg-surface-dark-elevated">
              <p className="text-xs font-semibold uppercase tracking-wider text-foreground-muted dark:text-slate-500">
                Classes Conducted
              </p>
              <p className="mt-2 text-3xl font-serif font-bold text-foreground dark:text-white">
                {overallSummary.total}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default AttendanceTrackerPage;
