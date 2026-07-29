import { useEffect, useMemo, useRef, useState } from "react";
import { FiBookOpen, FiPlus, FiSave, FiSearch, FiTrash2 } from "react-icons/fi";
import toast from "react-hot-toast";
import { useAuthStore } from "../../store/useAuthStore";
import api from "../../services/api/axiosInstance";

const SCORE_OPTIONS = Array.from({ length: 11 }, (_, index) => 10 - index);

const createSemester = (semesterNumber) => ({
  semesterNumber,
  entries: [],
});

const getErrorMessage = (error, fallback) =>
  error?.response?.data?.message || error?.data?.message || fallback;

const formatDateTime = (value) => {
  if (!value) {
    return "Not saved yet";
  }

  return new Date(value).toLocaleString();
};

const buildSummary = (semesters = []) => {
  let totalCredits = 0;
  let totalPoints = 0;

  const semesterSummaries = semesters.map((semester) => {
    const credits = semester.entries.reduce((sum, entry) => sum + entry.credits, 0);
    const points = semester.entries.reduce(
      (sum, entry) => sum + entry.credits * Number(entry.score || 0),
      0
    );
    const sgpa = credits ? (points / credits).toFixed(2) : "0.00";

    totalCredits += credits;
    totalPoints += points;

    return {
      semesterNumber: semester.semesterNumber,
      credits,
      sgpa,
    };
  });

  return {
    cgpa: totalCredits ? (totalPoints / totalCredits).toFixed(2) : "0.00",
    totalCredits,
    semesterSummaries,
  };
};

function GpaPlannerPage() {
  const { user } = useAuthStore();
  const [semesters, setSemesters] = useState([]);
  const [searchQueries, setSearchQueries] = useState({});
  const [subjectOptions, setSubjectOptions] = useState({});
  const [searchingSemester, setSearchingSemester] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState(null);
  const searchTimeouts = useRef({});

  useEffect(() => {
    const fetchPlanner = async () => {
      try {
        const response = await api.get("/user/gpa");
        const savedSemesters = response.data?.semesters || [];

        if (savedSemesters.length > 0) {
          setSemesters(savedSemesters);
        } else {
          setSemesters([createSemester(Number(user?.semester) || 1)]);
        }

        setLastSavedAt(response.data?.updatedAt || null);
      } catch (error) {
        toast.error(getErrorMessage(error, "Failed to load GPA planner"));
        setSemesters([createSemester(Number(user?.semester) || 1)]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPlanner();

    return () => {
      Object.values(searchTimeouts.current).forEach((timeoutId) => clearTimeout(timeoutId));
    };
  }, [user?.semester]);

  const summary = useMemo(() => buildSummary(semesters), [semesters]);
  const availableSemesters = Array.from({ length: 8 }, (_, index) => index + 1).filter(
    (semesterNumber) =>
      !semesters.some((semester) => semester.semesterNumber === semesterNumber)
  );

  const handleAddSemester = () => {
    if (!availableSemesters.length) {
      return;
    }

    const semesterNumber = availableSemesters[0];
    setSemesters((current) =>
      [...current, createSemester(semesterNumber)].sort(
        (left, right) => left.semesterNumber - right.semesterNumber
      )
    );
  };

  const handleRemoveSemester = (semesterNumber) => {
    setSemesters((current) => current.filter((semester) => semester.semesterNumber !== semesterNumber));
    setSearchQueries((current) => {
      const next = { ...current };
      delete next[semesterNumber];
      return next;
    });
    setSubjectOptions((current) => {
      const next = { ...current };
      delete next[semesterNumber];
      return next;
    });
  };

  const searchSubjects = (semesterNumber, query) => {
    setSearchQueries((current) => ({
      ...current,
      [semesterNumber]: query,
    }));

    if (searchTimeouts.current[semesterNumber]) {
      clearTimeout(searchTimeouts.current[semesterNumber]);
    }

    if (!query.trim()) {
      setSubjectOptions((current) => ({ ...current, [semesterNumber]: [] }));
      setSearchingSemester(null);
      return;
    }

    searchTimeouts.current[semesterNumber] = setTimeout(async () => {
      try {
        setSearchingSemester(semesterNumber);
        const response = await api.get("/user/subjects", {
          params: {
            query,
            semester: semesterNumber,
          },
        });

        setSubjectOptions((current) => ({
          ...current,
          [semesterNumber]: response.data?.subjects || [],
        }));
      } catch (error) {
        toast.error(getErrorMessage(error, "Failed to search subjects"));
      } finally {
        setSearchingSemester((current) => (current === semesterNumber ? null : current));
      }
    }, 250);
  };

  const addSubjectToSemester = (semesterNumber, subject) => {
    setSemesters((current) =>
      current.map((semester) => {
        if (semester.semesterNumber !== semesterNumber) {
          return semester;
        }

        if (semester.entries.some((entry) => entry.subjectCode === subject.code)) {
          return semester;
        }

        return {
          ...semester,
          entries: [
            ...semester.entries,
            {
              subjectId: subject._id,
              subjectCode: subject.code,
              subjectName: subject.name,
              credits: subject.credits,
              score: 10,
            },
          ],
        };
      })
    );

    setSearchQueries((current) => ({ ...current, [semesterNumber]: "" }));
    setSubjectOptions((current) => ({ ...current, [semesterNumber]: [] }));
  };

  const updateEntryScore = (semesterNumber, subjectCode, score) => {
    setSemesters((current) =>
      current.map((semester) => {
        if (semester.semesterNumber !== semesterNumber) {
          return semester;
        }

        return {
          ...semester,
          entries: semester.entries.map((entry) =>
            entry.subjectCode === subjectCode
              ? { ...entry, score: Number(score) }
              : entry
          ),
        };
      })
    );
  };

  const removeEntry = (semesterNumber, subjectCode) => {
    setSemesters((current) =>
      current.map((semester) =>
        semester.semesterNumber === semesterNumber
          ? {
              ...semester,
              entries: semester.entries.filter((entry) => entry.subjectCode !== subjectCode),
            }
          : semester
      )
    );
  };

  const savePlanner = async () => {
    setIsSaving(true);
    try {
      const response = await api.put("/user/gpa", { semesters });
      setSemesters(response.data?.semesters || []);
      setLastSavedAt(response.data?.updatedAt || null);
      toast.success("GPA planner saved");
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to save GPA planner"));
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
              GPA Planner
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-foreground-muted dark:text-slate-400">
              Search by subject name or code, pull credits from the subject catalog,
              and track semester SGPA together with your overall CGPA.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleAddSemester}
              disabled={!availableSemesters.length}
              className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-5 py-2.5 text-sm font-semibold text-foreground transition-all hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-50 dark:border-border-dark dark:bg-surface-dark-elevated dark:text-white dark:hover:border-secondary dark:hover:text-secondary"
            >
              <FiPlus className="h-4 w-4" />
              Add Semester
            </button>
            <button
              onClick={savePlanner}
              disabled={isSaving}
              className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-glow transition-all hover:bg-primary-hover disabled:opacity-60"
            >
              <FiSave className="h-4 w-4" />
              {isSaving ? "Saving..." : "Save Planner"}
            </button>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[2.1fr_1fr]">
        <div className="space-y-6">
          {semesters.map((semester) => {
            const semesterSummary = summary.semesterSummaries.find(
              (item) => item.semesterNumber === semester.semesterNumber
            );

            return (
              <div
                key={semester.semesterNumber}
                className="rounded-2xl border border-border bg-surface p-6 shadow-card transition-colors duration-300 dark:border-border-dark dark:bg-surface-dark"
              >
                <div className="flex flex-col gap-4 border-b border-border pb-5 dark:border-border-dark lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-foreground-muted dark:text-slate-500">
                      Semester {semester.semesterNumber}
                    </p>
                    <div className="mt-3 flex flex-wrap items-center gap-3">
                      <span className="rounded-full bg-primary-light px-4 py-1.5 text-sm font-semibold text-primary dark:bg-surface-dark-elevated dark:text-secondary">
                        SGPA {semesterSummary?.sgpa || "0.00"}
                      </span>
                      <span className="text-sm text-foreground-muted dark:text-slate-400">
                        {semesterSummary?.credits || 0} credits selected
                      </span>
                    </div>
                  </div>
                  {semesters.length > 1 ? (
                    <button
                      onClick={() => handleRemoveSemester(semester.semesterNumber)}
                      className="inline-flex items-center gap-2 self-start rounded-full bg-red-50 px-4 py-2 text-sm font-semibold text-red-600 transition-all hover:bg-red-100 dark:bg-red-950/20 dark:text-red-400 dark:hover:bg-red-950/30"
                    >
                      <FiTrash2 className="h-4 w-4" />
                      Remove Semester
                    </button>
                  ) : null}
                </div>

                <div className="mt-5 space-y-4">
                  <div className="relative">
                    <FiSearch className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground-muted dark:text-slate-400" />
                    <input
                      type="search"
                      value={searchQueries[semester.semesterNumber] || ""}
                      onChange={(event) =>
                        searchSubjects(semester.semesterNumber, event.target.value)
                      }
                      placeholder={`Search Semester ${semester.semesterNumber} subjects`}
                      className="w-full rounded-2xl border border-border bg-background px-11 py-3 text-sm text-foreground outline-none transition-all focus:border-primary dark:border-border-dark dark:bg-surface-dark-elevated dark:text-white dark:focus:border-secondary"
                    />

                    {(subjectOptions[semester.semesterNumber]?.length > 0 ||
                      searchingSemester === semester.semesterNumber) && (
                      <div className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-10 rounded-2xl border border-border bg-surface p-2 shadow-card dark:border-border-dark dark:bg-surface-dark">
                        {searchingSemester === semester.semesterNumber ? (
                          <p className="px-3 py-2 text-sm text-foreground-muted dark:text-slate-400">
                            Searching subjects...
                          </p>
                        ) : (
                          subjectOptions[semester.semesterNumber].map((subject) => (
                            <button
                              key={subject._id}
                              onClick={() =>
                                addSubjectToSemester(semester.semesterNumber, subject)
                              }
                              className="flex w-full items-start justify-between rounded-xl px-3 py-2.5 text-left transition-all hover:bg-background dark:hover:bg-surface-dark-elevated"
                            >
                              <div>
                                <p className="font-semibold text-foreground dark:text-white">
                                  {subject.name}
                                </p>
                                <p className="mt-1 text-xs text-foreground-muted dark:text-slate-400">
                                  {subject.code} · {subject.credits} credits
                                </p>
                              </div>
                              <FiPlus className="mt-1 h-4 w-4 text-primary dark:text-secondary" />
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </div>

                  {semester.entries.length ? (
                    <div className="overflow-x-auto">
                      <table className="w-full table-auto border-collapse">
                        <thead>
                          <tr className="text-left">
                            <th className="border-b border-border px-3 py-3 text-xs font-semibold uppercase tracking-wider text-foreground-muted dark:border-border-dark dark:text-slate-500">
                              Subject
                            </th>
                            <th className="border-b border-border px-3 py-3 text-xs font-semibold uppercase tracking-wider text-foreground-muted dark:border-border-dark dark:text-slate-500">
                              Code
                            </th>
                            <th className="border-b border-border px-3 py-3 text-xs font-semibold uppercase tracking-wider text-foreground-muted dark:border-border-dark dark:text-slate-500">
                              Credits
                            </th>
                            <th className="border-b border-border px-3 py-3 text-xs font-semibold uppercase tracking-wider text-foreground-muted dark:border-border-dark dark:text-slate-500">
                              Score
                            </th>
                            <th className="border-b border-border px-3 py-3 text-xs font-semibold uppercase tracking-wider text-foreground-muted dark:border-border-dark dark:text-slate-500">
                              Action
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {semester.entries.map((entry) => (
                            <tr key={entry.subjectCode}>
                              <td className="border-b border-border px-3 py-4 text-sm font-medium text-foreground dark:border-border-dark dark:text-white">
                                {entry.subjectName}
                              </td>
                              <td className="border-b border-border px-3 py-4 text-sm text-foreground-muted dark:border-border-dark dark:text-slate-400">
                                {entry.subjectCode}
                              </td>
                              <td className="border-b border-border px-3 py-4 text-sm text-foreground dark:border-border-dark dark:text-slate-200">
                                {entry.credits}
                              </td>
                              <td className="border-b border-border px-3 py-4 dark:border-border-dark">
                                <select
                                  value={entry.score}
                                  onChange={(event) =>
                                    updateEntryScore(
                                      semester.semesterNumber,
                                      entry.subjectCode,
                                      event.target.value
                                    )
                                  }
                                  className="w-28 rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition-all focus:border-primary dark:border-border-dark dark:bg-surface-dark-elevated dark:text-white dark:focus:border-secondary"
                                >
                                  {SCORE_OPTIONS.map((score) => (
                                    <option key={score} value={score}>
                                      {score} points
                                    </option>
                                  ))}
                                </select>
                              </td>
                              <td className="border-b border-border px-3 py-4 dark:border-border-dark">
                                <button
                                  onClick={() =>
                                    removeEntry(semester.semesterNumber, entry.subjectCode)
                                  }
                                  className="rounded-xl bg-red-50 p-2.5 text-red-600 transition-all hover:bg-red-100 dark:bg-red-950/20 dark:text-red-400 dark:hover:bg-red-950/30"
                                  title="Remove subject"
                                >
                                  <FiTrash2 className="h-4 w-4" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-dashed border-border bg-background px-6 py-10 text-center dark:border-border-dark dark:bg-surface-dark-elevated">
                      <FiBookOpen className="mx-auto h-8 w-8 text-foreground-muted dark:text-slate-500" />
                      <p className="mt-3 font-semibold text-foreground dark:text-white">
                        No subjects added yet
                      </p>
                      <p className="mt-1 text-sm text-foreground-muted dark:text-slate-400">
                        Search by code or name to add your semester subjects.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border border-border bg-surface p-6 shadow-card transition-colors duration-300 dark:border-border-dark dark:bg-surface-dark">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-foreground-muted dark:text-slate-500">
              Overall CGPA
            </p>
            <p className="mt-4 text-6xl font-serif font-bold text-primary dark:text-secondary">
              {summary.cgpa}
            </p>
            <p className="mt-3 text-sm text-foreground-muted dark:text-slate-400">
              Across {summary.totalCredits} credits
            </p>
            <p className="mt-2 text-xs text-foreground-muted dark:text-slate-500">
              Last saved: {formatDateTime(lastSavedAt)}
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-surface p-6 shadow-card transition-colors duration-300 dark:border-border-dark dark:bg-surface-dark">
            <h2 className="text-xl font-serif font-semibold text-foreground dark:text-white">
              Semester Snapshot
            </h2>
            <div className="mt-5 space-y-3">
              {summary.semesterSummaries.map((semester) => (
                <div
                  key={semester.semesterNumber}
                  className="rounded-2xl border border-border bg-background p-4 transition-colors dark:border-border-dark dark:bg-surface-dark-elevated"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-semibold text-foreground dark:text-white">
                        Semester {semester.semesterNumber}
                      </p>
                      <p className="mt-1 text-xs text-foreground-muted dark:text-slate-400">
                        {semester.credits} credits
                      </p>
                    </div>
                    <p className="text-2xl font-serif font-bold text-primary dark:text-secondary">
                      {semester.sgpa}
                    </p>
                  </div>
                </div>
              ))}

              {!summary.semesterSummaries.length ? (
                <p className="text-sm text-foreground-muted dark:text-slate-400">
                  Add subjects to see SGPA and CGPA insights here.
                </p>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default GpaPlannerPage;
