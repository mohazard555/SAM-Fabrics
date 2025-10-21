import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { Database, LogIn } from 'lucide-react';
import Button from '../components/Button';

const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const { data } = useData();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const foundUser = data.users.find(u => u.username === username);

    if (foundUser && foundUser.password === password) {
      setError('');
      login(foundUser);
    } else {
      setError('اسم المستخدم أو كلمة المرور غير صحيحة.');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
      <div className="p-8 bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md">
        <div className="flex flex-col items-center mb-6">
          <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-3 rounded-lg mb-4">
            <Database className="text-white h-10 w-10" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">SAM Pro</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">نظام إدارة تكاليف الأقمشة</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label 
              htmlFor="username" 
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              اسم المستخدم
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-3"
              autoComplete="username"
            />
          </div>
          <div>
            <label 
              htmlFor="password" 
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              كلمة المرور
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-3"
              autoComplete="current-password"
            />
          </div>
          
          {error && <p className="text-sm text-red-600 dark:text-red-400 text-center">{error}</p>}

          <div>
            <Button type="submit" className="w-full" icon={<LogIn size={18} />}>
              تسجيل الدخول
            </Button>
          </div>
        </form>
         <p className="mt-6 text-xs text-gray-400 dark:text-gray-500 text-center">
            &copy; {new Date().getFullYear()} SAM Pro. كل الحقوق محفوظة.
          </p>
      </div>
    </div>
  );
};

export default LoginPage;