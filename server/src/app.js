import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import connectDatabase from './config/database.js';
import apiRouter from './routes/apiRoutes.js';
import userRoutes from './routes/userRoutes.js';
import errorHandler from './middleware/errorHandler.js';
import holidayRoutes from "./routes/holidayRoutes.js";
import academicRouter from "./routes/academicRouter.js";
import calendarRoutes from "./routes/calendarRoutes.js";
import seedSubjectCatalog from "./utils/seedSubjectCatalog.js";
dotenv.config({});


const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api', apiRouter);
app.use('/api/user', userRoutes);
app.use("/api/holidays", holidayRoutes);
app.use("/api/academic-calendar", academicRouter);
app.use("/api/calendar", calendarRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'Student Toolkit API is running' });
});

app.post('/wakey-wakey-mf', (req, res) => {
  console.log(req.body);
  res.send('Awake Bro.');
});

app.use(errorHandler);

const PORT = process.env.PORT || 4000;

connectDatabase()
  .then(() => {
    return seedSubjectCatalog();
  })
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server listening on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error('Database connection error:', error);
    process.exit(1);
  });

export default app;
