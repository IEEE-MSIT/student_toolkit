import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    githubId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    username: {
      type: String,
      unique: true,
      sparse: true,
      lowercase: true,
      trim: true,
      minlength: 3,
      maxlength: 30,
      match: /^[a-z0-9_]+$/,
    },
    name: String,
    college: String,
    branch: String,
    semester: {
      type: Number,
      min: 1,
      max: 8,
    },
    rollNumber: String,
    theme: {
      type: String,
      enum: ['light', 'dark'],
      default: 'light',
    },
    avatar: String,
    bio: String,
  },
  { timestamps: true }
);

const User = mongoose.model('User', userSchema);

export default User;
