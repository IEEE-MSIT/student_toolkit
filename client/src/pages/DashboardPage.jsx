import { format } from 'date-fns';
import ExamCountdownWidget from '../components/dashboard/ExamCountdownWidget.jsx';
import AcademicCalendarWidget from '../components/dashboard/AcademicCalendarWidget.jsx';
import HolidayCalendarWidget from '../components/dashboard/HolidayCalendarWidget.jsx';
import DashboardTimeTableWidget from '../components/dashboard/DashboardTimeTableWidget.jsx';
import { useAuthStore } from '../store/useAuthStore';

function DashboardPage() {
  const today = format(new Date(), 'EEEE, MMMM d');
  const { user } = useAuthStore();

  return (
    <section className="space-y-8">
      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <div className="rounded-2xl border border-border dark:border-border-dark bg-surface dark:bg-surface-dark p-8 shadow-card transition-colors duration-300">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-foreground-muted dark:text-slate-500">Welcome back</p>
              <h1 className="mt-3 text-3xl font-serif font-bold text-foreground dark:text-white">{user?.name || user?.username || 'Scholar'}</h1>
              <p className="mt-2 text-sm text-foreground-muted dark:text-slate-400">Keep track of your academic goals</p>
            </div>
            <div className="rounded-full bg-primary px-5 py-2.5 text-white shadow-glow text-sm font-semibold">{today}</div>
          </div>
        </div>

        <div className="rounded-2xl border border-primary/20 dark:border-secondary/20 bg-gradient-to-br from-primary to-primary-dark p-6 shadow-glow text-white transition-colors duration-300">
          <p className="text-sm opacity-80">Your Focus</p>
          <p className="mt-3 text-3xl font-serif font-bold">Make today count</p>
          <p className="mt-2 text-sm opacity-70">Stay organized, ace your exams</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <ExamCountdownWidget />
        <AcademicCalendarWidget />
        <HolidayCalendarWidget />
      </div>

      <div>
        <h2 className="text-2xl font-serif font-semibold text-foreground dark:text-white mb-4">This Week's Focus</h2>
        <DashboardTimeTableWidget />
      </div>

      <div className="rounded-2xl border border-border dark:border-border-dark bg-surface dark:bg-surface-dark p-8 shadow-card transition-colors duration-300">
        <h2 className="text-2xl font-serif font-semibold text-foreground dark:text-white mb-6">Quick Actions</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <a href="/tools/gpa" className="group rounded-2xl border border-border dark:border-border-dark bg-background dark:bg-surface-dark-elevated p-6 text-center transition-all duration-200 hover:shadow-card-hover hover:border-primary dark:hover:border-secondary hover:-translate-y-1">
            <p className="text-3xl">📊</p>
            <p className="mt-3 font-serif font-semibold text-foreground dark:text-white group-hover:text-primary dark:group-hover:text-secondary transition-colors">GPA Planner</p>
          </a>
          <a href="/tools/attendance" className="group rounded-2xl border border-border dark:border-border-dark bg-background dark:bg-surface-dark-elevated p-6 text-center transition-all duration-200 hover:shadow-card-hover hover:border-primary dark:hover:border-secondary hover:-translate-y-1">
            <p className="text-3xl">✅</p>
            <p className="mt-3 font-serif font-semibold text-foreground dark:text-white group-hover:text-primary dark:group-hover:text-secondary transition-colors">Attendance</p>
          </a>
          <a href="/tools/pdf" className="group rounded-2xl border border-border dark:border-border-dark bg-background dark:bg-surface-dark-elevated p-6 text-center transition-all duration-200 hover:shadow-card-hover hover:border-primary dark:hover:border-secondary hover:-translate-y-1">
            <p className="text-3xl">📄</p>
            <p className="mt-3 font-serif font-semibold text-foreground dark:text-white group-hover:text-primary dark:group-hover:text-secondary transition-colors">Merge PDFs</p>
          </a>
        </div>
      </div>
    </section>
  );
}

export default DashboardPage;
