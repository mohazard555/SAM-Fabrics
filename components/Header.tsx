import React from 'react';
import { useData } from '../contexts/DataContext';
import { Calendar, User, LogOut, Sun, Moon } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import Button from './Button';
import { useTheme } from '../contexts/ThemeContext';

const Header: React.FC = () => {
  const { data } = useData();
  const { logout, currentUser } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const today = new Date().toLocaleDateString('ar-EG', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <header className="bg-white dark:bg-gray-800 dark:border-b dark:border-gray-700 shadow-sm p-4 flex justify-between items-center no-print">
      <div className="flex items-center">
        {data.settings.logoUrl && (
          <img src={data.settings.logoUrl} alt="Company Logo" className="h-12 ml-6" />
        )}
        <div>
          <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-200">لوحة التحكم</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">مرحباً بك في نظام SAM Pro لإدارة تكاليف الأقمشة</p>
        </div>
      </div>
      <div className="flex items-center space-x-6 space-x-reverse text-sm text-gray-600 dark:text-gray-300">
        <div className="flex items-center space-x-2 space-x-reverse">
          <Calendar size={18} className="text-blue-500" />
          <span>{today}</span>
        </div>
        <div className="flex items-center space-x-2 space-x-reverse">
          <User size={18} className="text-blue-500" />
          <span>{currentUser?.name || 'مستخدم'}</span>
        </div>
        <button
          onClick={toggleTheme}
          className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          aria-label="Toggle theme"
        >
          {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
        </button>
        <Button onClick={logout} variant="secondary" className="!px-3 !py-1.5 text-xs !shadow-none">
          <LogOut size={14} className="ml-1" />
          تسجيل الخروج
        </Button>
      </div>
    </header>
  );
};

export default Header;