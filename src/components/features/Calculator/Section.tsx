import React, { useState } from 'react';
import { Section as SectionType, CostItem } from '../../../types';
import { Card } from '../../ui/Card';
import { ChevronDown, Plus } from 'lucide-react';
import { ItemTable } from './ItemTable';
import { formatCurrency } from '../../../utils/helpers';
import { Button } from '../../ui/Button'; // Assuming Button component exists

export const Section: React.FC<{
    section: SectionType;
    onUpdate: (items: CostItem[]) => void;
}> = ({ section, onUpdate }) => {
    const [isOpen, setIsOpen] = useState(!section.isCollapsed); // Default open if not collapsed

    const total = section.items
        .filter(i => i.isChecked)
        .reduce((sum, item) => sum + item.total, 0);

    return (
        <Card className={`transition-all duration-300 ${isOpen ? 'ring-1 ring-rose-100' : 'hover:bg-gray-50'}`}>
            <div
                className="p-4 flex items-center justify-between cursor-pointer select-none border-b border-transparent data-[open=true]:border-gray-100"
                data-open={isOpen}
                onClick={() => setIsOpen(!isOpen)}
            >
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${isOpen ? 'bg-rose-100 text-rose-600' : 'bg-gray-100 text-gray-500'}`}>
                        <ChevronDown className={`w-5 h-5 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
                    </div>
                    <h3 className="font-bold text-lg text-gray-800">{section.title}</h3>
                </div>
                <div className="flex items-center gap-4">
                    <span className="font-bold text-rose-600 bg-rose-50 px-3 py-1 rounded-full text-sm">
                        {formatCurrency(total)}
                    </span>
                </div>
            </div>

            {isOpen && (
                <div className="p-4 animate-in slide-in-from-top-2 duration-200">
                    <ItemTable items={section.items} onUpdate={onUpdate} />
                </div>
            )}
        </Card>
    );
};
