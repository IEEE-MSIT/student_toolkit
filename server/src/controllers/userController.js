import mongoose from "mongoose";
import User from "../models/User.js";

const USERNAME_REGEX = /^[a-z0-9_]{3,30}$/;

const normalizeUsername = (value = "") =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9_]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 30);

const buildUsernameBase = (value = "") => {
  const normalized = normalizeUsername(value);
  return normalized.length >= 3 ? normalized : "student";
};

const isValidSession = (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.user.id)) {
    res
      .status(401)
      .json({ message: "Invalid session. Please log in again." });
    return false;
  }

  return true;
};

export const serializeUser = (user) => ({
  id: user._id,
  username: user.username,
  name: user.name,
  email: user.email,
  college: user.college,
  branch: user.branch,
  semester: user.semester,
  rollNumber: user.rollNumber,
  theme: user.theme,
  avatar: user.avatar,
  bio: user.bio,
});

export const generateUniqueUsername = async (preferredValue, excludeUserId) => {
  const base = buildUsernameBase(preferredValue);
  let username = base;
  let suffix = 1;

  while (true) {
    const existingUser = await User.findOne({
      username,
      ...(excludeUserId ? { _id: { $ne: excludeUserId } } : {}),
    }).lean();

    if (!existingUser) {
      return username;
    }

    const suffixText = String(suffix);
    username = `${base.slice(0, Math.max(3, 30 - suffixText.length))}${suffixText}`;
    suffix += 1;
  }
};

export const ensureUsername = async (user, preferredValue) => {
  if (user.username) {
    return user;
  }

  user.username = await generateUniqueUsername(
    preferredValue || user.name || user.email?.split("@")[0] || user.githubId,
    user._id
  );
  await user.save();
  return user;
};

export const getUserProfile = async (req, res) => {
  try {
    if (!isValidSession(req, res)) {
      return;
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    await ensureUsername(user);
    res.json(serializeUser(user));
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({ message: "Failed to fetch user profile" });
  }
};

export const checkUsernameAvailability = async (req, res) => {
  try {
    if (!isValidSession(req, res)) {
      return;
    }

    const username = normalizeUsername(req.query.username || "");

    if (!USERNAME_REGEX.test(username)) {
      return res.status(400).json({
        available: false,
        message:
          "Username must be 3-30 characters and use only lowercase letters, numbers, or underscores.",
      });
    }

    const existingUser = await User.findOne({
      username,
      _id: { $ne: req.user.id },
    }).lean();

    res.json({
      available: !existingUser,
      username,
      message: existingUser ? "Username is already taken" : "Username is available",
    });
  } catch (error) {
    console.error("Username check error:", error);
    res.status(500).json({ message: "Failed to check username availability" });
  }
};

export const updateUserProfile = async (req, res) => {
  try {
    if (!isValidSession(req, res)) {
      return;
    }

    const { name, username, college, branch, semester, rollNumber, theme } = req.body;
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (username !== undefined) {
      const normalizedUsername = normalizeUsername(username);

      if (!USERNAME_REGEX.test(normalizedUsername)) {
        return res.status(400).json({
          message:
            "Username must be 3-30 characters and use only lowercase letters, numbers, or underscores.",
        });
      }

      const existingUser = await User.findOne({
        username: normalizedUsername,
        _id: { $ne: user._id },
      }).lean();

      if (existingUser) {
        return res.status(409).json({ message: "Username is already taken" });
      }

      user.username = normalizedUsername;
    }

    user.name = name || "";
    user.college = college || "";
    user.branch = branch || "";
    user.semester = semester || undefined;
    user.rollNumber = rollNumber || "";
    user.theme = theme || user.theme;

    await user.save();

    res.json({
      message: "Profile updated successfully",
      user: serializeUser(user),
    });
  } catch (error) {
    console.error("Profile update error:", error);
    res.status(400).json({ message: "Failed to update profile" });
  }
};

export const createUserIfNotExists = async (githubUser) => {
  try {
    let user = await User.findOne({
      githubId: githubUser.id.toString(),
    });

    if (!user) {
      user = await User.create({
        githubId: githubUser.id.toString(),
        email: githubUser.email || `github_${githubUser.id}@example.com`,
        name: githubUser.name || githubUser.login,
        avatar: githubUser.avatar_url,
        bio: githubUser.bio,
      });
    }

    await ensureUsername(
      user,
      githubUser.login || githubUser.name || githubUser.email?.split("@")[0]
    );

    return user;
  } catch (err) {
    console.error(err);
    return null;
  }
};
