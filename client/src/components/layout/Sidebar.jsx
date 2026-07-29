import { NavLink } from 'react-router-dom';
import { FiHome, FiBookOpen, FiPercent, FiImage, FiCheckCircle, FiCalendar, FiCode, FiFilter, FiFileText, FiSettings, FiX } from 'react-icons/fi';
import { useAuthStore } from '../../store/useAuthStore';
import { motion, AnimatePresence } from 'framer-motion';

const tools = [
  { label: 'Dashboard', path: '/dashboard', icon: FiHome },
  { group: 'Academic', items: [
    { label: 'GPA Planner', path: '/tools/gpa', icon: FiBookOpen },
    { label: 'Percentage Calc', path: '/tools/percentage', icon: FiPercent },
  ]},
  { group: 'Productivity', items: [
    { label: 'Attendance Tracker', path: '/tools/attendance', icon: FiCheckCircle },
    { label: 'Time Table', path: '/tools/timetable', icon: FiCalendar },
    { label: 'Calendar', path: '/calendar', icon: FiCalendar },
  ]},
  { group: 'Utilities', items: [
    { label: 'PDF Merger', path: '/tools/pdf', icon: FiFileText },
    { label: 'Image Compressor', path: '/tools/image', icon: FiImage },
    { label: 'QR Generator', path: '/tools/qr-gen', icon: FiCode },
    { label: 'QR Scanner', path: '/tools/qr-scan', icon: FiCode },
    { label: 'Unit Converter', path: '/tools/converter', icon: FiFilter },
  ]},
];

function Sidebar({ isOpen, onClose }) {
  const { logout } = useAuthStore();

  return (
    <>
      {/* Mobile Drawer Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar Container */}
      <aside
        className={`
          fixed top-0 bottom-0 left-0 z-50 w-72 border-r border-border dark:border-border-dark bg-surface dark:bg-surface-dark px-4 py-6 shadow-card flex flex-col transition-transform duration-300 lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 lg:z-0
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Close Button (Mobile Only) */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl text-foreground-muted hover:text-foreground dark:hover:text-white hover:bg-background dark:hover:bg-surface-dark-elevated transition-colors lg:hidden"
          aria-label="Close menu"
        >
          <FiX className="h-5 w-5" />
        </button>

        <div className="mb-8">
          <h1 className="text-2xl font-serif font-bold text-foreground dark:text-white">Student Toolkit</h1>
          <p className="text-sm text-foreground-muted dark:text-slate-400 mt-1">IEEE MSIT Engineering Hub</p>
        </div>

        <nav className="flex-1 space-y-2 overflow-y-auto scrollbar-hide">
          {tools.map((item, idx) => {
            if (item.group) {
              return (
                <div key={idx} className="mt-4">
                  <p className="px-4 py-2 text-xs font-semibold uppercase text-foreground-muted dark:text-slate-500 tracking-wider">{item.group}</p>
                  <div className="space-y-1">
                    {item.items.map((subitem) => {
                      const Icon = subitem.icon;
                      return (
                        <NavLink
                          key={subitem.path}
                          to={subitem.path}
                          onClick={onClose}
                          className={({ isActive }) =>
                            `flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-200 ${
                              isActive
                                ? 'bg-primary text-white shadow-glow'
                                : 'text-foreground dark:text-slate-300 hover:bg-primary-light dark:hover:bg-surface-dark-elevated hover:text-primary dark:hover:text-secondary'
                            }`
                          }
                        >
                          <Icon className="h-4 w-4 flex-shrink-0" />
                          {subitem.label}
                        </NavLink>
                      );
                    })}
                  </div>
                </div>
              );
            } else {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? 'bg-primary text-white shadow-glow'
                        : 'text-foreground dark:text-slate-300 hover:bg-primary-light dark:hover:bg-surface-dark-elevated hover:text-primary dark:hover:text-secondary'
                    }`
                  }
                >
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  {item.label}
                </NavLink>
              );
            }
          })}
        </nav>

        <div className="space-y-2 border-t border-border dark:border-border-dark pt-4">
          <NavLink
            to="/settings"
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-primary text-white shadow-glow'
                  : 'text-foreground dark:text-slate-300 hover:bg-primary-light dark:hover:bg-surface-dark-elevated hover:text-primary dark:hover:text-secondary'
              }`
            }
          >
            <FiSettings className="h-4 w-4" />
            Settings
          </NavLink>
          <button
            onClick={() => {
              onClose();
              logout();
            }}
            className="w-full rounded-full border-2 border-border dark:border-border-dark px-4 py-2.5 text-sm font-semibold text-foreground dark:text-white transition-all duration-200 hover:border-red-400 hover:bg-red-50 hover:text-red-600 dark:hover:border-red-500 dark:hover:bg-red-950/30 dark:hover:text-red-400"
          >
            Logout
          </button>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;