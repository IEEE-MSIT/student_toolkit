import express from 'express';
import {
  getUserProfile,
  updateUserProfile,
  checkUsernameAvailability,
} from '../controllers/userController.js';
import {
  getAttendance,
  getGpaPlanner,
  getTimeTable,
  saveAttendance,
  saveGpaPlanner,
  saveTimeTable,
  searchSubjects,
} from '../controllers/academicToolsController.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/profile', authMiddleware, getUserProfile);
router.post('/profile', authMiddleware, updateUserProfile);
router.get('/username-availability', authMiddleware, checkUsernameAvailability);
router.get('/subjects', authMiddleware, searchSubjects);
router.get('/gpa', authMiddleware, getGpaPlanner);
router.put('/gpa', authMiddleware, saveGpaPlanner);
router.get('/timetable', authMiddleware, getTimeTable);
router.put('/timetable', authMiddleware, saveTimeTable);
router.get('/attendance', authMiddleware, getAttendance);
router.put('/attendance', authMiddleware, saveAttendance);

export default router;
