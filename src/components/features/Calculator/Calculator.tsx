import React, { useState } from 'react';
import { useStore } from '../../../context/Store';
import { Section as SectionType, CostItem } from '../../../types';
import { generateId } from '../../../utils/helpers';
import { Button } from '../../ui/Button';
import { Section } from './Section';
import { Summary } from './Summary';
import { Plus, Save, LogOut } from 'lucide-react';

export const Calculator: React.FC = () => {
    const { state, updateEvent, generateSaveCode, resetApp } = useStore();
    const { currentEvent } = state;
    const [showAddSection, setShowAddSection] = useState(false);
    const [newSectionName, setNewSectionName] = useState('');

    if (!currentEvent) return null;

    const handleUpdateSection = (sectionId: string, updatedItems: CostItem[]) => {
        const updatedSections = currentEvent.sections.map(s =>
            s.id === sectionId ? { ...s, items: updatedItems } : s
        );
        updateEvent({ ...currentEvent, sections: updatedSections, lastModified: Date.now() });
    };

    const handleAddSection = () => {
        if (!newSectionName.trim()) return;
        const newSection: SectionType = {
            id: generateId(),
            title: newSectionName,
            items: [],
            isCollapsed: false,
        };
        updateEvent({
            ...currentEvent,
            sections: [...currentEvent.sections, newSection],
            lastModified: Date.now()
        });
        setNewSectionName('');
        setShowAddSection(false);
    };

    const handleSave = () => {
        const code = generateSaveCode();
        navigator.clipboard.writeText(code).then(() => {
            alert('تم نسخ كود الاسترجاع! احتفظ به في مكان آمن.');
        });
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-20">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-800">
                    حساب تكلفة: <span className="text-rose-600">{currentEvent.customName || currentTypeLabel(currentEvent.type)}</span>
                </h2>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={handleSave} title="حفظ ونسخ الكود">
                        <Save className="w-4 h-4 ml-2" />
                        حفظ
                    </Button>
                    <Button variant="ghost" size="sm" onClick={resetApp} title="خروج">
                        <LogOut className="w-4 h-4" />
                    </Button>
                </div>
            </div>

            <div className="space-y-4">
                {currentEvent.sections.map(section => (
                    <Section
                        key={section.id}
                        section={section}
                        onUpdate={(items) => handleUpdateSection(section.id, items)}
                    />
                ))}

                {/* Add Section Area */}
                {showAddSection ? (
                    <div className="bg-gray-50 border border-dashed border-gray-300 p-4 rounded-xl flex items-center gap-2 animate-in fade-in">
                        <input
                            autoFocus
                            className="flex-1 p-2 bg-white border rounded-lg outline-none focus:ring-2 focus:ring-rose-200"
                            placeholder="اسم القسم الجديد (مثلاً: DJ، هدايا...)"
                            value={newSectionName}
                            onChange={(e) => setNewSectionName(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleAddSection()}
                        />
                        <Button size="sm" onClick={handleAddSection}>إضافة</Button>
                        <Button size="sm" variant="ghost" onClick={() => setShowAddSection(false)}>إلغاء</Button>
                    </div>
                ) : (
                    <Button variant="outline" className="w-full border-dashed py-6 text-gray-500 hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50" onClick={() => setShowAddSection(true)}>
                        <Plus className="w-5 h-5 ml-2" />
                        إضافة قسم جديد
                    </Button>
                )}
            </div>

            <Summary event={currentEvent} />
        </div>
    );
};

function currentTypeLabel(type: string) {
    const map: Record<string, string> = {
        engagement: 'خطوبة',
        marriage: 'كتب كتاب',
        wedding: 'فرح',
        groom_prep: 'تجهيزات عريس',
        bride_prep: 'تجهيزات عروسة',
        birthday: 'عيد ميلاد',
        baby_shower: 'سبوع',
        custom: 'مناسبة خاصة'
    };
    return map[type] || type;
}
