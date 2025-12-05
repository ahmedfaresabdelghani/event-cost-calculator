import React from 'react';
import { CostItem } from '../../../types';
import { generateId, formatCurrency } from '../../../utils/helpers';
import { Button } from '../../ui/Button';
import { Plus, Trash2, CheckCircle2, Circle } from 'lucide-react';

interface Props {
    items: CostItem[];
    onUpdate: (items: CostItem[]) => void;
}

export const ItemTable: React.FC<Props> = ({ items, onUpdate }) => {

    const handleAddItem = () => {
        const newItem: CostItem = {
            id: generateId(),
            name: '',
            quantity: 1,
            price: 0,
            total: 0,
            isManualTotal: false,
            isChecked: true,
        };
        onUpdate([...items, newItem]);
    };

    const handleChange = (id: string, field: keyof CostItem, value: any) => {
        const newItems = items.map(item => {
            if (item.id === id) {
                const updated = { ...item, [field]: value };
                // Recalculate total if not manual
                if (!updated.isManualTotal && (field === 'price' || field === 'quantity')) {
                    updated.total = updated.price * updated.quantity;
                }
                return updated;
            }
            return item;
        });
        onUpdate(newItems);
    };

    const handleDelete = (id: string) => {
        if (confirm('هل أنت متأكد من حذف هذا البند؟')) {
            onUpdate(items.filter(i => i.id !== id));
        }
    };

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-sm text-right">
                <thead className="text-gray-500 font-medium border-b border-gray-100">
                    <tr>
                        <th className="py-2 px-2 w-10"></th>
                        <th className="py-2 px-2">الصنف</th>
                        <th className="py-2 px-2 w-20">العدد</th>
                        <th className="py-2 px-2 w-24">سعر الوحدة</th>
                        <th className="py-2 px-2 w-28">الإجمالي</th>
                        <th className="py-2 px-2 w-10"></th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                    {items.map(item => (
                        <tr key={item.id} className={`group ${item.isChecked ? '' : 'opacity-50 grayscale'}`}>
                            <td className="py-2 px-1">
                                <button
                                    onClick={() => handleChange(item.id, 'isChecked', !item.isChecked)}
                                    className={`text-gray-400 hover:text-rose-500 transition-colors ${item.isChecked ? 'text-rose-500' : ''}`}
                                >
                                    {item.isChecked ? <CheckCircle2 className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
                                </button>
                            </td>
                            <td className="py-2 px-1">
                                <input
                                    type="text"
                                    value={item.name}
                                    onChange={(e) => handleChange(item.id, 'name', e.target.value)}
                                    placeholder="اسم البند..."
                                    className="w-full bg-transparent border-none focus:ring-0 p-1 placeholder-gray-300 font-medium"
                                />
                            </td>
                            <td className="py-2 px-1">
                                <input
                                    type="number"
                                    min="1"
                                    value={item.quantity}
                                    onChange={(e) => handleChange(item.id, 'quantity', Number(e.target.value))}
                                    className="w-full bg-transparent border-b border-transparent focus:border-rose-300 p-1 text-center outline-none"
                                />
                            </td>
                            <td className="py-2 px-1">
                                <input
                                    type="number"
                                    min="0"
                                    value={item.price}
                                    onChange={(e) => handleChange(item.id, 'price', Number(e.target.value))}
                                    className="w-full bg-transparent border-b border-transparent focus:border-rose-300 p-1 text-center outline-none"
                                />
                            </td>
                            <td className="py-2 px-1">
                                <div className="font-bold text-gray-700 tabular-nums">
                                    {formatCurrency(item.total)}
                                </div>
                            </td>
                            <td className="py-2 px-1 text-center">
                                <button
                                    onClick={() => handleDelete(item.id)}
                                    className="p-1 rounded text-gray-300 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </td>
                        </tr>
                    ))}
                    <tr>
                        <td colSpan={6} className="pt-2">
                            <Button variant="ghost" size="sm" onClick={handleAddItem} className="text-gray-400 hover:text-rose-600 w-full justify-start border border-dashed border-gray-200">
                                <Plus className="w-4 h-4 ml-2" />
                                إضافة بند جديد
                            </Button>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    );
};
