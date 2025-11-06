import React, { useState, useEffect } from 'react';
import Card from '../components/Card';
import Button from '../components/Button';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { Plus, Edit, Trash2, Printer, Download } from 'lucide-react';
import type { Color, Model, MaterialType, Barcode, Item, Size, Category, Season } from '../types';
import { exportToExcel } from '../utils/export';
import PrintWrapper from '../components/PrintWrapper';

type MasterType = 'colors' | 'models' | 'materialTypes' | 'barcodes' | 'items' | 'sizes' | 'categories' | 'seasons' | 'users';
type MasterItem = Color | Model | MaterialType | Barcode | Item | Size | Category | Season;

const masterConfig: {
    colors: { title: string; fields: (keyof Color)[], prefix: string };
    models: { title: string; fields: (keyof Model)[], prefix: string };
    materialTypes: { title: string; fields: (keyof MaterialType)[], prefix: string };
    barcodes: { title: string; fields: (keyof Barcode)[], prefix: string };
    items: { title: string; fields: (keyof Item)[], prefix: string };
    sizes: { title: string; fields: (keyof Size)[], prefix: string };
    categories: { title: string; fields: (keyof Category)[], prefix: string };
    seasons: { title: string; fields: (keyof Season)[], prefix: string };
} = {
    colors: { title: 'الألوان', fields: ['id', 'name'], prefix: 'C' },
    models: { title: 'الموديلات', fields: ['id', 'name', 'description'], prefix: 'M' },
    materialTypes: { title: 'أنواع المواد', fields: ['id', 'name'], prefix: 'MT' },
    barcodes: { title: 'الباركودات', fields: ['id', 'name', 'modelId'], prefix: 'B' },
    items: { title: 'الأصناف', fields: ['id', 'name', 'type', 'notes'], prefix: 'I' },
    sizes: { title: 'المقاسات', fields: ['id', 'name'], prefix: 'S' },
    categories: { title: 'الفئات', fields: ['id', 'name'], prefix: 'CAT' },
    seasons: { title: 'المواسم', fields: ['id', 'name'], prefix: 'SE' },
};

const MasterEditor: React.FC<{ type: MasterType }> = ({ type }) => {
    const { data, addOrUpdateItem, deleteItem } = useData();
    const { currentUser } = useAuth();
    const permissions = currentUser?.permissions;
    const items = data[type as keyof typeof masterConfig] as MasterItem[];
    const { title, fields, prefix } = masterConfig[type as keyof typeof masterConfig];

    const [currentItem, setCurrentItem] = useState<Partial<MasterItem>>({});
    const [isEditing, setIsEditing] = useState(false);
    const [isPrinting, setIsPrinting] = useState(false);

    useEffect(() => {
        if (isPrinting) {
            setTimeout(() => {
                window.print();
                setIsPrinting(false);
            }, 100);
        }
    }, [isPrinting]);

    const getFieldLabel = (field: string): string => {
        const labels: Record<string, string> = {
            id: 'الكود', name: 'الاسم', description: 'الوصف', modelId: 'الموديل المرتبط',
            type: 'النوع', notes: 'ملاحظات'
        };
        return labels[field] || field.toString();
    };

    const handleSave = () => {
        if (!currentItem.name) return;

        if (isEditing) {
            if (!permissions?.canEdit) { alert('ليس لديك صلاحية التعديل.'); return; }
        } else {
            if (!permissions?.canAdd) { alert('ليس لديك صلاحية الإضافة.'); return; }
        }
        
        let idToSave: string;

        if (isEditing && currentItem.id) {
            idToSave = currentItem.id;
        } else {
            const numericIds = items
                .map(i => parseInt(i.id.replace(prefix, ''), 10))
                .filter(n => !isNaN(n));
            const maxId = numericIds.length > 0 ? Math.max(...numericIds) : 0;
            idToSave = `${prefix}${(maxId + 1).toString().padStart(3, '0')}`;
        }
        
        const finalItem = { ...currentItem, id: idToSave, name: currentItem.name } as MasterItem;
        addOrUpdateItem(type as any, finalItem);
        setCurrentItem({});
        setIsEditing(false);
    };
    
    const handleEdit = (item: MasterItem) => {
        setCurrentItem(item);
        setIsEditing(true);
    };

    const handleDelete = (id: string) => {
        if (!permissions?.canDelete) { alert('ليس لديك صلاحية الحذف.'); return; }
        if(window.confirm(`هل أنت متأكد من حذف هذا العنصر؟`)) {
            deleteItem(type as any, id);
        }
    };

    const handlePrint = () => {
        if (!permissions?.canPrint) { alert('ليس لديك صلاحية الطباعة.'); return; }
        setIsPrinting(true);
    };

    const handleExport = () => {
        if (!permissions?.canExport) { alert('ليس لديك صلاحية التصدير.'); return; }
        const dataToExport = items.map(item => {
            const row: Record<string, any> = {};
            fields.forEach(field => {
                row[getFieldLabel(field as string)] = (item as any)[field];
            });
            return row;
        });
        exportToExcel(`${type}-list`, dataToExport);
    };

    const renderTable = (isPrint = false) => (
        <div className="overflow-x-auto border dark:border-gray-700 rounded-lg">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                        {fields.map(field => <th key={field as string} className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">{getFieldLabel(field as string)}</th>)}
                        {!isPrint && <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">إجراءات</th>}
                    </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {items.map(item => (
                        <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                            {fields.map(field => <td key={`${item.id}-${field as string}`} className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">{(item as any)[field]}</td>)}
                            {!isPrint && 
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium flex space-x-2 space-x-reverse">
                                    <button onClick={() => handleEdit(item)} className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300" disabled={!permissions?.canEdit}><Edit size={18}/></button>
                                    <button onClick={() => handleDelete(item.id)} className="text-red-600 hover:text-red-900 dark:text-red-500 dark:hover:text-red-400" disabled={!permissions?.canDelete}><Trash2 size={18}/></button>
                                </td>
                            }
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
    
    return (
        <div>
            {isPrinting && <PrintWrapper title={`قائمة ${title}`}>{renderTable(true)}</PrintWrapper>}
            <div className={isPrinting ? 'hidden' : ''}>
                <Card>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="md:col-span-1">
                            <h3 className="font-bold text-lg mb-4">{isEditing ? `تعديل ${title}` : `إضافة ${title}`}</h3>
                            <div className="space-y-4">
                                {fields.filter(f => f !== 'id').map(field => (
                                    <div key={field as string}>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{getFieldLabel(field as string)}</label>
                                        <input
                                            type="text"
                                            value={(currentItem as any)[field] || ''}
                                            onChange={e => setCurrentItem({...currentItem, [field]: e.target.value})}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2.5"
                                        />
                                    </div>
                                ))}
                                <div className="flex space-x-2 space-x-reverse">
                                    <Button onClick={handleSave} icon={isEditing ? <Edit size={16} /> : <Plus size={16} />}>{isEditing ? 'تحديث' : 'إضافة'}</Button>
                                    {isEditing && <Button variant="secondary" onClick={() => { setCurrentItem({}); setIsEditing(false); }}>إلغاء</Button>}
                                </div>
                            </div>
                        </div>
                        <div className="md:col-span-2">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="font-bold text-lg">{`قائمة ${title}`}</h3>
                                <div className="flex space-x-2 space-x-reverse">
                                    <Button onClick={handlePrint} variant="secondary" icon={<Printer size={16}/>} disabled={!permissions?.canPrint}>طباعة</Button>
                                    <Button onClick={handleExport} variant="secondary" icon={<Download size={16}/>} disabled={!permissions?.canExport}>تصدير Excel</Button>
                                </div>
                            </div>
                            {renderTable()}
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
};


const MastersPage: React.FC = () => {
    const [activeTab, setActiveTab] = useState<MasterType>('colors');
    
    const tabs: { key: MasterType, label: string }[] = [
        { key: 'colors', label: 'الألوان' },
        { key: 'models', label: 'الموديلات' },
        { key: 'items', label: 'الأصناف' },
        { key: 'sizes', label: 'المقاسات' },
        { key: 'categories', label: 'الفئات' },
        { key: 'seasons', label: 'المواسم' },
        { key: 'materialTypes', label: 'أنواع المواد' },
        { key: 'barcodes', label: 'الباركودات' },
    ];
    
    return (
        <div>
            <div className="mb-4 border-b border-gray-200 dark:border-gray-700">
                <nav className="-mb-px flex space-x-4 space-x-reverse overflow-x-auto" aria-label="Tabs">
                    {tabs.map(tab => (
                        <button key={tab.key} onClick={() => setActiveTab(tab.key)} className={`${ activeTab === tab.key ? 'border-blue-500 text-blue-600 dark:text-blue-400' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:border-gray-600'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}>
                            {tab.label}
                        </button>
                    ))}
                </nav>
            </div>
            <div>
                <MasterEditor type={activeTab} />
            </div>
        </div>
    );
};

export default MastersPage;