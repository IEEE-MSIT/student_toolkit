import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Routes, Route, Navigate, Outlet, useLocation } from "react-router-dom";
import { Toaster } from "react-hot-toast";

import { ThemeProvider } from "./contexts/ThemeContext.jsx";
import { useAuthStore } from "./store/useAuthStore";

import ProtectedRoute from "./components/auth/ProtectedRoute.jsx";
import Sidebar from "./components/layout/Sidebar.jsx";
import Topbar from "./components/layout/Topbar.jsx";

import LoginPage from "./pages/LoginPage.jsx";
import GitHubCallbackPage from "./pages/GitHubCallbackPage.jsx";
import DashboardPage from "./pages/DashboardPage.jsx";
import ToolsPage from "./pages/ToolsPage.jsx";
import SettingsPage from "./pages/SettingsPage.jsx";
import NotFoundPage from "./pages/NotFoundPage.jsx";
import GpaPlannerPage from "./pages/tools/GpaPlannerPage.jsx";

import PercentagePage from "./pages/tools/PercentagePage.jsx";
import ImageCompressorPage from "./pages/tools/ImageCompressorPage.jsx";
import AttendancePage from "./pages/tools/AttendancePage.jsx";
import TimeTablePage from "./pages/tools/TimeTablePage.jsx";
import QRGeneratorPage from "./pages/tools/QRGeneratorPage.jsx";
import QRScannerPage from "./pages/tools/QRScannerPage.jsx";
import UnitConverterPage from "./pages/tools/UnitConverterPage.jsx";
import PDFMergerPage from "./pages/tools/PDFMergerPage.jsx";
import CalendarPage from "./pages/tools/CalendarPage.jsx";

function AppLayout() {
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Close mobile sidebar on route change
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-background dark:bg-background-dark text-foreground dark:text-slate-100 transition-colors duration-300">
      <div className="flex min-h-screen">
        <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

        <div className="flex-1">
          <Topbar onMenuClick={() => setIsSidebarOpen(true)} />

          <main className="px-6 py-6 sm:px-10">
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.24 }}
              >
                <Outlet />
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      </div>
    </div>
  );
}

function App() {
  const { restoreSession, isLoading } = useAuthStore();

  useEffect(() => {
    void restoreSession();
  }, [restoreSession]);

  if (isLoading) {
    return null;
  }

  return (
    <ThemeProvider>
      <>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/auth/github/callback"
            element={<GitHubCallbackPage />}
          />

          {/* Protected Routes */}
          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/tools" element={<ToolsPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/calendar" element={<CalendarPage />} />
              <Route path="/tools/gpa" element={<GpaPlannerPage />} />
              <Route path="/tools/cgpa" element={<Navigate to="/tools/gpa" replace />} />
              <Route path="/tools/sgpa" element={<Navigate to="/tools/gpa" replace />} />
              <Route path="/tools/percentage" element={<PercentagePage />} />
              <Route path="/tools/image" element={<ImageCompressorPage />} />
              <Route path="/tools/attendance" element={<AttendancePage />} />
              <Route path="/tools/timetable" element={<TimeTablePage />} />
              <Route path="/tools/qr-gen" element={<QRGeneratorPage />} />
              <Route path="/tools/qr-scan" element={<QRScannerPage />} />
              <Route path="/tools/converter" element={<UnitConverterPage />} />
              <Route path="/tools/pdf" element={<PDFMergerPage />} />
            </Route>
          </Route>

          {/* 404 */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>

        <Toaster position="top-center" />
      </>
    </ThemeProvider>
  );
}

export default App;