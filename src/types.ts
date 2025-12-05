export type EventType =
    | 'engagement'
    | 'marriage'
    | 'groom_prep'
    | 'bride_prep'
    | 'birthday'
    | 'baby_shower'
    | 'wedding'
    | 'custom';

export interface CostItem {
    id: string;
    name: string;
    quantity: number;
    price: number;
    total: number; // Can be manually set or calculated
    isManualTotal: boolean;
    isChecked: boolean;
}

export interface Section {
    id: string;
    title: string;
    items: CostItem[];
    isCollapsed: boolean;
}

export interface EventData {
    id: string;
    type: EventType;
    customName?: string;
    location?: 'home' | 'hall'; // Specific to engagement
    hallCost?: number; // If hall selected
    sections: Section[];
    createdAt: number;
    lastModified: number;
}

export interface AppState {
    currentEvent: EventData | null;
    savedEvents: EventData[]; // History
    isFirstVisit: boolean;
}
