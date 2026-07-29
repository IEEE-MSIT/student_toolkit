import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useAuthStore } from "../store/useAuthStore";
import api from "../services/api/axiosInstance";

const getErrorMessage = (error, fallback) =>
  error?.response?.data?.message || error?.data?.message || fallback;

const USERNAME_REGEX = /^[a-z0-9_]{3,30}$/;

function SettingsPage() {
  const { user, updateUser, logout } = useAuthStore();
  const [formData, setFormData] = useState({
    name: "",
    username: "",
    email: "",
    college: "",
    branch: "",
    semester: "",
    rollNumber: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [usernameStatus, setUsernameStatus] = useState({
    tone: "muted",
    message: "Lowercase letters, numbers, and underscores only.",
  });

  useEffect(() => {
    setFormData({
      name: user?.name || "",
      username: user?.username || "",
      email: user?.email || "",
      college: user?.college || "",
      branch: user?.branch || "",
      semester: user?.semester || "",
      rollNumber: user?.rollNumber || "",
    });
  }, [user]);

  useEffect(() => {
    const trimmedUsername = formData.username.trim().toLowerCase();

    if (!trimmedUsername) {
      setUsernameStatus({
        tone: "muted",
        message: "Lowercase letters, numbers, and underscores only.",
      });
      return;
    }

    if (!USERNAME_REGEX.test(trimmedUsername)) {
      setUsernameStatus({
        tone: "error",
        message: "Use 3-30 lowercase letters, numbers, or underscores.",
      });
      return;
    }

    if (trimmedUsername === user?.username) {
      setUsernameStatus({
        tone: "success",
        message: "This is your current username.",
      });
      return;
    }

    const timeoutId = setTimeout(async () => {
      try {
        setUsernameStatus({
          tone: "muted",
          message: "Checking username availability...",
        });

        const response = await api.get("/user/username-availability", {
          params: { username: trimmedUsername },
        });

        setUsernameStatus({
          tone: response.data?.available ? "success" : "error",
          message:
            response.data?.message ||
            (response.data?.available
              ? "Username is available."
              : "Username is already taken."),
        });
      } catch (error) {
        setUsernameStatus({
          tone: "error",
          message: getErrorMessage(error, "Failed to validate username."),
        });
      }
    }, 350);

    return () => clearTimeout(timeoutId);
  }, [formData.username, user?.username]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((previous) => ({
      ...previous,
      [name]: name === "username" ? value.toLowerCase().replace(/\s+/g, "_") : value,
    }));
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const response = await api.post("/user/profile", {
        ...formData,
        semester: formData.semester || undefined,
      });

      updateUser(response.data?.user || {});
      toast.success("Profile updated successfully!");
    } catch (error) {
      const errorMessage = getErrorMessage(error, "Failed to update profile");

      if (error?.response?.status === 401 || error?.status === 401) {
        logout();
        window.location.href = "/login";
        toast.error("Session expired. Please log in again.");
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const usernameToneClass =
    usernameStatus.tone === "success"
      ? "text-emerald-600 dark:text-emerald-400"
      : usernameStatus.tone === "error"
        ? "text-red-600 dark:text-red-400"
        : "text-foreground-muted dark:text-slate-500";

  return (
    <section className="space-y-8">
      <div className="rounded-2xl border border-border bg-surface p-8 shadow-card transition-colors duration-300 dark:border-border-dark dark:bg-surface-dark">
        <h1 className="text-3xl font-serif font-bold text-foreground dark:text-white">
          Settings
        </h1>
        <p className="mt-2 text-sm text-foreground-muted dark:text-slate-400">
          Manage your profile, semester, and public username.
        </p>
      </div>

      <div className="max-w-3xl space-y-6 rounded-2xl border border-border bg-surface p-8 shadow-card transition-colors duration-300 dark:border-border-dark dark:bg-surface-dark">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-semibold text-foreground dark:text-slate-300">
              Full Name
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-foreground outline-none transition-all focus:border-primary dark:border-border-dark dark:bg-surface-dark-elevated dark:text-white dark:focus:border-secondary"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-foreground dark:text-slate-300">
              Username
            </label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              placeholder="your_unique_username"
              className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-foreground outline-none transition-all focus:border-primary dark:border-border-dark dark:bg-surface-dark-elevated dark:text-white dark:focus:border-secondary"
            />
            <p className={`mt-1 text-xs ${usernameToneClass}`}>{usernameStatus.message}</p>
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-foreground dark:text-slate-300">
            Email
          </label>
          <input
            type="email"
            name="email"
            value={formData.email}
            disabled
            className="w-full cursor-not-allowed rounded-xl border border-border bg-background px-4 py-2.5 text-foreground opacity-50 outline-none dark:border-border-dark dark:bg-surface-dark-elevated dark:text-white"
          />
          <p className="mt-1 text-xs text-foreground-muted dark:text-slate-500">
            Email cannot be changed
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-semibold text-foreground dark:text-slate-300">
              College
            </label>
            <input
              type="text"
              name="college"
              placeholder="e.g., MSIT"
              value={formData.college}
              onChange={handleChange}
              className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-foreground outline-none transition-all focus:border-primary dark:border-border-dark dark:bg-surface-dark-elevated dark:text-white dark:focus:border-secondary"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-foreground dark:text-slate-300">
              Branch
            </label>
            <input
              type="text"
              name="branch"
              placeholder="e.g., CSE"
              value={formData.branch}
              onChange={handleChange}
              className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-foreground outline-none transition-all focus:border-primary dark:border-border-dark dark:bg-surface-dark-elevated dark:text-white dark:focus:border-secondary"
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-semibold text-foreground dark:text-slate-300">
              Semester
            </label>
            <select
              name="semester"
              value={formData.semester}
              onChange={handleChange}
              className="w-full cursor-pointer rounded-xl border border-border bg-background px-4 py-2.5 text-foreground outline-none transition-all focus:border-primary dark:border-border-dark dark:bg-surface-dark-elevated dark:text-white dark:focus:border-secondary"
            >
              <option value="">Select semester</option>
              {Array.from({ length: 8 }, (_, index) => (
                <option key={index + 1} value={index + 1}>
                  Semester {index + 1}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-foreground dark:text-slate-300">
              Roll Number
            </label>
            <input
              type="text"
              name="rollNumber"
              placeholder="e.g., 2023001"
              value={formData.rollNumber}
              onChange={handleChange}
              className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-foreground outline-none transition-all focus:border-primary dark:border-border-dark dark:bg-surface-dark-elevated dark:text-white dark:focus:border-secondary"
            />
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={isLoading || usernameStatus.tone === "error"}
          className="w-full rounded-full bg-primary px-6 py-3 font-semibold text-white shadow-glow transition-all duration-200 hover:bg-primary-hover disabled:opacity-50"
        >
          {isLoading ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </section>
  );
}

export default SettingsPage;
