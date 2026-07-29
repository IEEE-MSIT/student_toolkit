import { FiSearch, FiSettings, FiMoon, FiSun, FiMenu } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { useTheme } from '../../contexts/ThemeContext';

function Topbar({ onMenuClick }) {
  const { user } = useAuthStore();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  return (
    <header className="flex items-center justify-between gap-4 border-b border-border dark:border-border-dark bg-surface dark:bg-surface-dark px-6 py-4 shadow-card transition-colors duration-300">
      <div className="flex items-center gap-3">
        {/* Hamburger Menu Button for Mobile */}
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 -ml-2 rounded-xl text-foreground dark:text-white hover:bg-background dark:hover:bg-surface-dark-elevated transition-colors"
          aria-label="Open menu"
        >
          <FiMenu className="h-6 w-6" />
        </button>

        <div>
          <p className="text-sm text-foreground-muted dark:text-slate-400">
            Welcome, {user?.name || user?.username || 'Scholar'}
            {user?.username ? ` · @${user.username}` : ''}
          </p>
          <h2 className="text-xl font-serif font-semibold text-foreground dark:text-white">Your Academic Hub</h2>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <button
          onClick={toggleTheme}
          className="rounded-full bg-primary-light dark:bg-surface-dark-elevated p-3 text-primary dark:text-secondary hover:bg-primary hover:text-white dark:hover:bg-secondary dark:hover:text-white transition-all duration-200"
          title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
        >
          {theme === 'light' ? <FiMoon className="h-5 w-5" /> : <FiSun className="h-5 w-5" />}
        </button>
        <button
          onClick={() => navigate('/settings')}
          className="rounded-full bg-primary-light dark:bg-surface-dark-elevated p-3 text-primary dark:text-secondary hover:bg-primary hover:text-white dark:hover:bg-secondary dark:hover:text-white transition-all duration-200"
          title="Settings"
        >
          <FiSettings className="h-5 w-5" />
        </button>
      </div>
    </header>
  );
}

export default Topbar;