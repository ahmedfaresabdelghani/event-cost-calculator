import React, { useState } from 'react';
import { useStore } from '../../../context/Store';
import { EventType } from '../../../types';
import { Button } from '../../ui/Button';
import { Card } from '../../ui/Card';
import { Heart, Home, Hotel, PartyPopper, Gift, Baby, Star, Plus } from 'lucide-react';

export const EventSelector: React.FC = () => {
    const { startNewEvent } = useStore();
    const [customName, setCustomName] = useState('');
    const [showCustom, setShowCustom] = useState(false);
    const [showEngagementChoice, setShowEngagementChoice] = useState(false);

    const eventTypes: { type: EventType; label: string; icon: React.ReactNode; color: string }[] = [
        { type: 'engagement', label: 'خطوبة', icon: <Heart className="w-8 h-8" />, color: 'bg-rose-100 text-rose-600' },
        { type: 'marriage', label: 'كتب كتاب', icon: <PartyPopper className="w-8 h-8" />, color: 'bg-blue-100 text-blue-600' },
        { type: 'wedding', label: 'فرح', icon: <Star className="w-8 h-8" />, color: 'bg-purple-100 text-purple-600' },
        { type: 'groom_prep', label: 'تجهيزات عريس', icon: <UserCircle className="w-8 h-8" />, color: 'bg-slate-100 text-slate-600' },
        { type: 'bride_prep', label: 'تجهيزات عروسة', icon: <Sparkles className="w-8 h-8" />, color: 'bg-pink-100 text-pink-600' },
        { type: 'birthday', label: 'عيد ميلاد', icon: <Gift className="w-8 h-8" />, color: 'bg-orange-100 text-orange-600' },
        { type: 'baby_shower', label: 'سبوع', icon: <Baby className="w-8 h-8" />, color: 'bg-green-100 text-green-600' },
    ];

    /* Icons */
    function UserCircle(props: any) {
        return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><circle cx="12" cy="12" r="10" /><circle cx="12" cy="10" r="3" /><path d="M7 20.662V19a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v1.662" /></svg>
    }
    function Sparkles(props: any) {
        return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" /><path d="M5 3v4" /><path d="M9 3v4" /><path d="M3 5h4" /><path d="M3 9h4" /></svg>
    }

    const handleSelect = (type: EventType) => {
        if (type === 'engagement') {
            setShowEngagementChoice(true);
            return;
        }
        startNewEvent(type);
    };

    const handleEngagementChoice = (subType: 'home' | 'hall') => {
        startNewEvent('engagement', undefined, subType);
    };

    const handleCustomSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (customName) startNewEvent('custom', customName);
    };

    return (
        <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
            <div className="text-center mb-8">
                <h2 className="text-2xl font-bold mb-2">عايز تحسب تكلفة إيه؟</h2>
                <p className="text-gray-500">اختار نوع المناسبة عشان نجهزلَك القوائم المناسبة</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {eventTypes.map((evt) => (
                    <Card
                        key={evt.type}
                        className="cursor-pointer hover:shadow-lg transition-all hover:-translate-y-1 group"
                    >
                        <div
                            className="p-6 flex flex-col items-center gap-4 text-center h-full"
                            onClick={() => handleSelect(evt.type)}
                        >
                            <div className={`p-4 rounded-full ${evt.color} group-hover:scale-110 transition-transform`}>
                                {evt.icon}
                            </div>
                            <span className="font-bold text-gray-700">{evt.label}</span>
                        </div>
                    </Card>
                ))}

                <Card className="cursor-pointer border-dashed border-2 border-gray-300 bg-gray-50 hover:bg-white transition-colors">
                    <div
                        className="p-6 flex flex-col items-center justify-center gap-4 text-center h-full"
                        onClick={() => setShowCustom(true)}
                    >
                        <div className="p-4 rounded-full bg-gray-200 text-gray-500">
                            <Plus className="w-8 h-8" />
                        </div>
                        <span className="font-bold text-gray-600">مناسبة جديدة</span>
                    </div>
                </Card>
            </div>

            {/* Modal for Custom Name */}
            {showCustom && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <Card className="w-full max-w-sm p-6 bg-white">
                        <h3 className="text-xl font-bold mb-4">اسم المناسبة؟</h3>
                        <form onSubmit={handleCustomSubmit} className="space-y-4">
                            <input
                                autoFocus
                                type="text"
                                value={customName}
                                onChange={(e) => setCustomName(e.target.value)}
                                placeholder="مثلاً: حفلة تخرج"
                                className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-rose-200 outline-none"
                            />
                            <div className="flex gap-2">
                                <Button type="button" variant="ghost" onClick={() => setShowCustom(false)} className="flex-1">إلغاء</Button>
                                <Button type="submit" className="flex-1">بدء</Button>
                            </div>
                        </form>
                    </Card>
                </div>
            )}

            {/* Modal for Engagement Type */}
            {showEngagementChoice && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <Card className="w-full max-w-md p-6 bg-white">
                        <h3 className="text-xl font-bold mb-6 text-center">الخطوبة هتكون فين؟</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div onClick={() => handleEngagementChoice('home')} className="cursor-pointer border p-4 rounded-xl hover:bg-rose-50 hover:border-rose-200 transition-all text-center">
                                <Home className="w-10 h-10 mx-auto text-rose-500 mb-2" />
                                <span className="font-bold block">في البيت</span>
                            </div>
                            <div onClick={() => handleEngagementChoice('hall')} className="cursor-pointer border p-4 rounded-xl hover:bg-blue-50 hover:border-blue-200 transition-all text-center">
                                <Hotel className="w-10 h-10 mx-auto text-blue-500 mb-2" />
                                <span className="font-bold block">في قاعة</span>
                            </div>
                        </div>
                        <Button variant="ghost" onClick={() => setShowEngagementChoice(false)} className="w-full mt-4">رجوع</Button>
                    </Card>
                </div>
            )}
        </div>
    );
};
