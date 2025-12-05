import React, { createContext, useContext, useEffect, useState } from 'react';
import { AppState, EventData, EventType, Section } from '../types';
import { generateId, encodeData, decodeData } from '../utils/helpers';

interface StoreContextType {
    state: AppState;
    startNewEvent: (type: EventType, customName?: string, subType?: string) => void;
    loadEvent: (code: string) => boolean;
    updateEvent: (event: EventData) => void;
    generateSaveCode: () => string;

    resetApp: () => void;
    setVisited: (visited: boolean) => void;
}

const StoreContext = createContext<StoreContextType | null>(null);

const STORAGE_KEY = 'event_cost_calculator_v1';

const INITIAL_STATE: AppState = {
    currentEvent: null,
    savedEvents: [],
    isFirstVisit: true,
};

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [state, setState] = useState<AppState>(INITIAL_STATE);

    // Load from local storage on mount
    useEffect(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                setState({ ...parsed, isFirstVisit: false });
            } catch (e) {
                console.error("Failed to load local data", e);
            }
        }
    }, []);

    // Save to local storage on change
    useEffect(() => {
        if (!state.isFirstVisit) { // minimal check
            localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        }
    }, [state]);

    const startNewEvent = (type: EventType, customName?: string, subType?: string) => {
        const newEvent: EventData = {
            id: generateId(),
            type,
            customName,
            location: subType as any,
            sections: [],
            createdAt: Date.now(),
            lastModified: Date.now(),
        };

        // Default sections based on type/subtype
        let defaultSections: Section[] = [];

        if (type === 'engagement') {
            if (subType === 'hall') {
                defaultSections = [
                    {
                        id: generateId(), title: 'القاعة', items: [
                            { id: generateId(), name: 'حجز القاعة', quantity: 1, price: 0, total: 0, isManualTotal: false, isChecked: true },
                            { id: generateId(), name: 'تأمين القاعة', quantity: 1, price: 0, total: 0, isManualTotal: false, isChecked: true }
                        ], isCollapsed: false
                    },
                    { id: generateId(), title: 'تصوير', items: [], isCollapsed: false },
                    { id: generateId(), title: 'مواصلات', items: [], isCollapsed: true },
                ];
            } else {
                // Home
                defaultSections = [
                    {
                        id: generateId(), title: 'تجهيز البيت', items: [
                            { id: generateId(), name: 'ديكور', quantity: 1, price: 0, total: 0, isManualTotal: false, isChecked: true },
                            { id: generateId(), name: 'كراسي', quantity: 10, price: 0, total: 0, isManualTotal: false, isChecked: true },
                            { id: generateId(), name: 'إضاءة', quantity: 1, price: 0, total: 0, isManualTotal: false, isChecked: true },
                        ], isCollapsed: false
                    },
                    { id: generateId(), title: 'بوفيه', items: [], isCollapsed: false },
                    { id: generateId(), title: 'فستان ومكياج', items: [], isCollapsed: false },
                ];
            }
        } else {
            // General defaults
            defaultSections = [
                { id: generateId(), title: 'التجهيزات الأساسية', items: [], isCollapsed: false },
                { id: generateId(), title: 'المأكولات', items: [], isCollapsed: false },
                { id: generateId(), title: 'المشروبات', items: [], isCollapsed: false },
                { id: generateId(), title: 'المواصلات', items: [], isCollapsed: false },
            ];
        }

        newEvent.sections = defaultSections;

        setState(prev => ({
            ...prev,
            currentEvent: newEvent,
            isFirstVisit: false,
        }));
    };

    const updateEvent = (updatedEvent: EventData) => {
        setState(prev => ({
            ...prev,
            currentEvent: updatedEvent
        }));
    };

    const generateSaveCode = () => {
        return encodeData(state);
    };

    const loadEvent = (code: string) => {
        const data = decodeData(code);
        if (data && (data.currentEvent || data.savedEvents)) {
            setState(data);
            return true;
        }
        return false;
    };

    const resetApp = () => {
        setState({ ...INITIAL_STATE, isFirstVisit: false });
    };

    const setVisited = (visited: boolean) => {
        setState(prev => ({ ...prev, isFirstVisit: !visited }));
    };

    return (
        <StoreContext.Provider value={{
            state,
            startNewEvent,
            loadEvent,
            updateEvent,
            generateSaveCode,
            resetApp,
            setVisited
        }}>
            {children}
        </StoreContext.Provider>
    );
};

export const useStore = () => {
    const context = useContext(StoreContext);
    if (!context) throw new Error("useStore must be used within StoreProvider");
    return context;
};
