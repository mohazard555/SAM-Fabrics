import React, { useState } from 'react';
import { Database, FileText, Settings, BarChart2, Layers, Archive, Info } from 'lucide-react';
import DailyReportPage from './pages/DailyReportPage';
import MastersPage from './pages/MastersPage';
import ReportsPage from './pages/ReportsPage';
import SettingsPage from './pages/SettingsPage';
import Header from './components/Header';
import InventoryPage from './pages/InventoryPage';
import AboutPage from './pages/AboutPage';
import { useAuth } from './contexts/AuthContext';
import LoginPage from './pages/LoginPage';

type Page = 'daily-report' | 'masters' | 'reports' | 'settings' | 'inventory' | 'about';

const App: React.FC = () => {
  const [activePage, setActivePage] = useState<Page>('daily-report');
  const { currentUser } = useAuth();

  if (!currentUser) {
    return <LoginPage />;
  }

  const renderPage = () => {
    switch (activePage) {
      case 'daily-report':
        return <DailyReportPage />;
      case 'masters':
        return <MastersPage />;
      case 'reports':
        return <ReportsPage />;
      case 'inventory':
        return <InventoryPage />;
      case 'settings':
        return <SettingsPage />;
      case 'about':
        return <AboutPage />;
      default:
        return <DailyReportPage />;
    }
  };

  const NavItem = ({ page, icon, label }: { page: Page, icon: React.ReactNode, label: string }) => (
    <button
      onClick={() => setActivePage(page)}
      className={`flex items-center w-full text-right px-4 py-3 rounded-lg transition-colors duration-200 ${
        activePage === page
          ? 'bg-blue-600 text-white shadow-md'
          : 'text-gray-600 hover:bg-blue-100 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white hover:text-blue-700'
      }`}
    >
      {icon}
      <span className="mr-3">{label}</span>
    </button>
  );

  return (
    <div className="flex h-screen bg-gray-50 text-gray-800 dark:bg-gray-900 dark:text-gray-200">
      <aside className="w-64 bg-white dark:bg-gray-800 shadow-lg p-4 flex flex-col no-print">
        <div className="flex items-center mb-8">
          <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-2 rounded-lg">
            <Database className="text-white h-8 w-8" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mr-3">SAM Pro</h1>
        </div>
        <nav className="flex flex-col space-y-2">
          <NavItem page="daily-report" icon={<FileText size={20} />} label="التقرير اليومي" />
          <NavItem page="masters" icon={<Layers size={20} />} label="القوائم المرجعية" />
          <NavItem page="reports" icon={<BarChart2 size={20} />} label="التقارير" />
          <NavItem page="inventory" icon={<Archive size={20} />} label="المخزون" />
          <NavItem page="settings" icon={<Settings size={20} />} label="الإعدادات" />
          <NavItem page="about" icon={<Info size={20} />} label="حول" />
        </nav>
        <div className="mt-auto text-center text-xs text-gray-400 dark:text-gray-500">
          <p>&copy; {new Date().getFullYear()} SAM Pro. كل الحقوق محفوظة.</p>
        </div>
      </aside>

      <main className="flex-1 flex flex-col">
        <Header />
        <div className="flex-1 p-6 overflow-y-auto">
          {renderPage()}
        </div>
      </main>
    </div>
  );
};

export default App;