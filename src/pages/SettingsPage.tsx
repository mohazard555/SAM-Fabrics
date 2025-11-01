import React, { useState, useEffect, useRef } from 'react';
import { useData } from '../contexts/DataContext';
import Card from '../components/Card';
import Button from '../components/Button';
import type { UserSettings, AppData, User, Permissions } from '../types';
import { Save, Download, Upload, Plus, Edit, Trash2, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const EMPTY_USER: Omit<User, 'id'> = {
  name: '',
  username: '',
  password: '',
  permissions: {
    canAdd: false,
    canEdit: false,
    canDelete: false,
    canPrint: false,
    canExport: false,
  }
};

const SettingsPage: React.FC = () => {
  const { data, setData, addOrUpdateItem, deleteItem } = useData();
  const { currentUser, login } = useAuth();
  const [settings, setSettings] = useState<UserSettings>(data.settings);
  const [userForm, setUserForm] = useState<Partial<User> | null>(null);
  const importFileRef = useRef<HTMLInputElement>(null);

  const [newUsername, setNewUsername] = useState(currentUser?.username || '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [credentialError, setCredentialError] = useState('');


  useEffect(() => {
    setSettings(data.settings);
  }, [data]);

  const handleSettingsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSettings(prev => ({ ...prev, [name]: value }));
  };
  
  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (loadEvent) => {
        setSettings(prev => ({ ...prev, logoUrl: loadEvent.target?.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveSettings = () => {
    setData(prev => ({ ...prev, settings }));
    alert('تم حفظ الإعدادات العامة بنجاح!');
  };

  const handleExport = () => {
    try {
      const jsonData = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const date = new Date().toISOString().split('T')[0];
      link.download = `sam-pro-backup-${date}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      alert('تم تصدير البيانات بنجاح!');
    } catch (error) {
      console.error("Failed to export data:", error);
      alert('فشل تصدير البيانات.');
    }
  };

  const handleImportClick = () => {
    importFileRef.current?.click();
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const text = event.target?.result;
          if (typeof text !== 'string') throw new Error('File could not be read as text.');
          const importedData = JSON.parse(text) as AppData;
          if (importedData.settings && importedData.users && importedData.dailyReports) {
            if (window.confirm('سيتم استبدال جميع البيانات الحالية بالبيانات الجديدة. هل أنت متأكد؟')) {
              setData(importedData);
              alert('تم استيراد البيانات بنجاح!');
            }
          } else {
            alert('ملف غير صالح. الرجاء التأكد من أنك تستورد ملف تصدير صحيح.');
          }
        } catch (error) {
          console.error("Failed to import data:", error);
          alert('فشل استيراد البيانات. تأكد من أن الملف بصيغة JSON صحيحة.');
        }
      };
      reader.readAsText(file);
      e.target.value = '';
    }
  };

  const handleOpenUserForm = (user?: User) => {
    setUserForm(user || EMPTY_USER);
  };

  const handleUserFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setUserForm(prev => prev ? ({ ...prev, [name]: value }) : null);
  };
  
  const handleUserPermissionsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setUserForm(prev => prev ? ({
      ...prev,
      permissions: { ...prev.permissions!, [name]: checked }
    }) : null);
  };
  
  const handleSaveUser = () => {
    if (!userForm || !userForm.username || !userForm.name) {
      alert("الرجاء إدخال اسم المستخدم والاسم الكامل.");
      return;
    }
    if (!userForm.id && !userForm.password) {
      alert("الرجاء إدخال كلمة المرور للمستخدم الجديد.");
      return;
    }
    
    const userToSave: User = {
      id: userForm.id || `U-${Date.now()}`,
      name: userForm.name,
      username: userForm.username,
      permissions: userForm.permissions as Permissions,
      ...(userForm.password && { password: userForm.password }),
    };

    addOrUpdateItem('users', userToSave);
    setUserForm(null);
  };

  const handleDeleteUser = (userId: string) => {
    if (data.users.length <= 1) {
      alert('لا يمكن حذف آخر مستخدم في النظام.');
      return;
    }
    if (window.confirm('هل أنت متأكد من حذف هذا المستخدم؟')) {
      deleteItem('users', userId);
    }
  };

  const handleSaveCredentials = () => {
    setCredentialError('');
    if (!currentUser) return;

    if (newPassword && newPassword !== confirmPassword) {
      setCredentialError('كلمتا المرور غير متطابقتين.');
      return;
    }
    
    if (confirmPassword && !newPassword) {
        setCredentialError('يرجى ملء حقل كلمة المرور الجديدة أولاً.');
        return;
    }

    if (data.users.some(user => user.username === newUsername && user.id !== currentUser.id)) {
      setCredentialError('اسم المستخدم هذا مستخدم بالفعل.');
      return;
    }

    const originalUser = data.users.find(u => u.id === currentUser.id);
    if (!originalUser) {
        setCredentialError('حدث خطأ: لم يتم العثور على المستخدم.');
        return;
    }

    const userToSave: User = {
      ...originalUser,
      username: newUsername,
      ...(newPassword && { password: newPassword }),
    };

    addOrUpdateItem('users', userToSave);
    login(userToSave); 

    alert('تم تحديث بيانات تسجيل الدخول بنجاح!');
    setNewPassword('');
    setConfirmPassword('');
  };


  const inputClass = "mt-1 block w-full rounded-md border-gray-300 shadow-sm p-3";
  const labelClass = "block text-sm font-medium text-gray-700 dark:text-gray-300";

  return (
    <div className="space-y-6">
      <Card title="الإعدادات العامة">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className={labelClass}>اسم الشركة</label>
            <input type="text" name="companyName" value={settings.companyName} onChange={handleSettingsChange} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>شعار الشركة</label>
            <input type="file" accept="image/*" onChange={handleLogoChange} className="mt-1 block w-full text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 dark:file:bg-blue-900/50 file:text-blue-700 dark:file:text-blue-300 hover:file:bg-blue-100 dark:hover:file:bg-blue-800/50" />
            {settings.logoUrl && <img src={settings.logoUrl} alt="logo preview" className="mt-2 h-16 bg-gray-100 dark:bg-gray-700 p-1 rounded-md" />}
          </div>
          <div className="md:col-span-2">
            <label className={labelClass}>معلومات الاتصال</label>
            <input type="text" name="contactInfo" value={settings.contactInfo} onChange={handleSettingsChange} className={inputClass} />
          </div>
           <div>
            <label className={labelClass}>اسم المدير (للتوقيع)</label>
            <input type="text" name="managerName" value={settings.managerName} onChange={handleSettingsChange} className={inputClass} />
          </div>
        </div>
        <div className="flex justify-end mt-6">
          <Button onClick={handleSaveSettings} icon={<Save size={18}/>}>حفظ الإعدادات العامة</Button>
        </div>
      </Card>
      
      <Card title="تغيير اسم المستخدم وكلمة المرور">
        <div className="space-y-4">
          <div>
            <label className={labelClass}>اسم المستخدم</label>
            <input 
              type="text" 
              value={newUsername} 
              onChange={(e) => setNewUsername(e.target.value)} 
              className={inputClass} 
            />
          </div>
          <div>
            <label className={labelClass}>كلمة المرور الجديدة</label>
            <input 
              type="password" 
              value={newPassword} 
              onChange={(e) => setNewPassword(e.target.value)} 
              className={inputClass} 
              placeholder="اتركها فارغة لعدم التغيير"
              autoComplete="new-password"
            />
          </div>
          <div>
            <label className={labelClass}>تأكيد كلمة المرور الجديدة</label>
            <input 
              type="password" 
              value={confirmPassword} 
              onChange={(e) => setConfirmPassword(e.target.value)} 
              className={inputClass} 
              autoComplete="new-password"
            />
          </div>
          {credentialError && <p className="text-sm text-red-600 dark:text-red-400">{credentialError}</p>}
        </div>
        <div className="flex justify-end mt-6">
          <Button onClick={handleSaveCredentials} icon={<Save size={18}/>}>حفظ التغييرات</Button>
        </div>
      </Card>

      <Card title="إدارة المستخدمين">
        <div className="flex justify-end mb-4">
          <Button onClick={() => handleOpenUserForm()} icon={<Plus size={16} />}>إضافة مستخدم جديد</Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-right text-gray-500 dark:text-gray-400">
            <thead className="text-xs text-gray-700 uppercase bg-gray-100 dark:bg-gray-700 dark:text-gray-300">
              <tr>
                <th scope="col" className="px-4 py-3">الاسم الكامل</th>
                <th scope="col" className="px-4 py-3">اسم المستخدم</th>
                <th scope="col" className="px-4 py-3">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {data.users.map(user => (
                <tr key={user.id} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700">
                  <td className="px-4 py-4">{user.name}</td>
                  <td className="px-4 py-4">{user.username}</td>
                  <td className="px-4 py-4 flex space-x-2 space-x-reverse">
                    <button onClick={() => handleOpenUserForm(user)} className="text-blue-600 hover:text-blue-800"><Edit size={18} /></button>
                    <button onClick={() => handleDeleteUser(user.id)} className="text-red-600 hover:text-red-800"><Trash2 size={18} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      
      {userForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card title={userForm.id ? "تعديل مستخدم" : "إضافة مستخدم جديد"} className="w-full max-w-2xl">
            <button onClick={() => setUserForm(null)} className="absolute top-4 left-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"><X size={24} /></button>
            <div className="space-y-4 pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className={labelClass}>الاسم الكامل</label><input type="text" name="name" value={userForm.name || ''} onChange={handleUserFormChange} className={inputClass} /></div>
                <div><label className={labelClass}>اسم المستخدم</label><input type="text" name="username" value={userForm.username || ''} onChange={handleUserFormChange} className={inputClass} /></div>
              </div>
              <div>
                <label className={labelClass}>كلمة المرور</label>
                <input type="password" name="password" onChange={handleUserFormChange} className={inputClass} placeholder={userForm.id ? "اتركها فارغة لعدم التغيير" : "مطلوبة"} />
              </div>
              <div>
                <h4 className="font-medium mb-2 text-gray-800 dark:text-gray-200">الصلاحيات</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 p-4 border rounded-md dark:border-gray-600">
                  {Object.keys(EMPTY_USER.permissions).map(key => (
                    <div key={key} className="flex items-center">
                      <input id={key} name={key} type="checkbox" checked={userForm.permissions?.[key as keyof Permissions] || false} onChange={handleUserPermissionsChange} className="h-4 w-4 rounded border-gray-300 text-indigo-600" />
                      <label htmlFor={key} className="mr-3 text-sm text-gray-700 dark:text-gray-300">{ {canAdd: 'إضافة', canEdit: 'تعديل', canDelete: 'حذف', canPrint: 'طباعة', canExport: 'تصدير'}[key] || key }</label>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex justify-end space-x-2 space-x-reverse pt-4">
                <Button onClick={() => setUserForm(null)} variant="secondary">إلغاء</Button>
                <Button onClick={handleSaveUser} icon={<Save size={16}/>}>حفظ المستخدم</Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      <Card title="إدارة البيانات">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">استخدم هذه الأدوات لإنشاء نسخة احتياطية من بياناتك أو استعادتها. مفيد لنقل البيانات بين الأجهزة المختلفة.</p>
          <div className="flex items-center space-x-4 space-x-reverse">
              <Button onClick={handleExport} variant="secondary" icon={<Download size={18} />}>تصدير البيانات</Button>
              <Button onClick={handleImportClick} variant="secondary" icon={<Upload size={18} />}>استيراد البيانات</Button>
              <input type="file" ref={importFileRef} onChange={handleImport} accept=".json" className="hidden" />
          </div>
      </Card>

    </div>
  );
};

export default SettingsPage;