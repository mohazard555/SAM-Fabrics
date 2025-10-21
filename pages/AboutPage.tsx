import React from 'react';
import Card from '../components/Card';
import { Info, MoveRight, User, AlertTriangle } from 'lucide-react';

const AboutPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto">
      <Card>
        <div className="flex items-center mb-6">
          <div className="bg-blue-100 dark:bg-blue-900/50 p-3 rounded-full mr-4">
            <Info className="h-8 w-8 text-blue-600 dark:text-blue-400" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">حول نظام SAM Pro</h1>
        </div>
        
        <div className="space-y-6 text-gray-700 dark:text-gray-300 leading-relaxed">
          <div className="p-4 bg-gray-50 dark:bg-gray-700/50 border-r-4 border-blue-500 rounded-lg">
            <h2 className="font-bold text-xl mb-2 text-gray-800 dark:text-gray-200">طبيعة عمل البرنامج</h2>
            <p>
              تم تطوير هذا الموقع ليعمل على الاستخدام المحلي فقط (Offline First). هذا يعني أن جميع بياناتك تُحفظ بشكل آمن داخل المتصفح على جهازك الحالي ولا يتم إرسالها إلى أي خادم خارجي، مما يضمن خصوصية وسرعة فائقة في الأداء.
            </p>
          </div>

          <div className="p-4 bg-yellow-50 dark:bg-yellow-900/50 border-r-4 border-yellow-500 rounded-lg">
            <div className="flex items-start">
              <AlertTriangle className="h-6 w-6 text-yellow-600 dark:text-yellow-400 mr-3 mt-1 flex-shrink-0" />
              <div>
                <h2 className="font-bold text-xl mb-2 text-yellow-800 dark:text-yellow-200">ملاحظة هامة حول حفظ البيانات</h2>
                <p className="text-yellow-700 dark:text-yellow-300">
                  يتم حفظ بياناتك تلقائيًا في ذاكرة المتصفح (Local Storage). هذا يعني أن البيانات ستضيع إذا قمت بمسح بيانات التصفح، أو استخدمت وضع التصفح المتخفي، أو غيرت المتصفح. <strong className="font-semibold">نوصي بشدة بتصدير بياناتك بانتظام كنسخة احتياطية.</strong>
                </p>
              </div>
            </div>
          </div>
          
          <div className="p-4 bg-gray-50 dark:bg-gray-700/50 border-r-4 border-green-500 rounded-lg">
            <h2 className="font-bold text-xl mb-2 text-gray-800 dark:text-gray-200">كيفية نقل البيانات لجهاز آخر</h2>
            <p>
              في حال أردت استخدام النظام على جهاز آخر أو أخذ نسخة احتياطية من بياناتك، يمكنك فعل ذلك بسهولة عبر خطوات بسيطة:
            </p>
            <ol className="list-decimal list-inside mt-4 space-y-2 pr-4">
              <li>
                اذهب إلى صفحة <span className="font-semibold text-gray-900 dark:text-gray-100">"الإعدادات"</span>.
              </li>
              <li>
                ضمن قسم <span className="font-semibold text-gray-900 dark:text-gray-100">"إدارة البيانات"</span>، اضغط على زر <span className="font-semibold text-gray-900 dark:text-gray-100">"تصدير البيانات"</span>. سيتم حفظ ملف يحتوي على كامل بياناتك على جهازك.
              </li>
              <li>
                انقل هذا الملف إلى الجهاز الجديد.
              </li>
              <li>
                على الجهاز الجديد، افتح النظام، اذهب إلى <span className="font-semibold text-gray-900 dark:text-gray-100">"الإعدادات"</span> ثم اضغط على <span className="font-semibold text-gray-900 dark:text-gray-100">"استيراد البيانات"</span> واختر الملف الذي قمت بتصديره.
              </li>
            </ol>
             <div className="mt-4 flex items-center justify-center text-sm text-gray-600 dark:text-gray-400">
                <span>الجهاز الحالي</span>
                <MoveRight className="h-5 w-5 mx-2 text-gray-400" />
                <span className="font-mono bg-gray-200 dark:bg-gray-600 dark:text-gray-200 px-2 py-1 rounded">backup.json</span>
                <MoveRight className="h-5 w-5 mx-2 text-gray-400" />
                <span>الجهاز الآخر</span>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
                <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-full mr-4">
                    <User className="h-8 w-8 text-gray-600 dark:text-gray-300" />
                </div>
                <div>
                    <h2 className="font-bold text-xl mb-1 text-gray-800 dark:text-gray-200">المطور</h2>
                    <p className="text-gray-800 dark:text-gray-100 font-semibold">Mohannad Ahmad</p>
                    <p className="text-gray-600 dark:text-gray-400">Tel: +963998171954</p>
                </div>
            </div>
        </div>
      </Card>
    </div>
  );
};

export default AboutPage;