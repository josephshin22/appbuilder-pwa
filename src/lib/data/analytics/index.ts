// Initialize firebase analytics and create an instance of AnalyticsItem
// Need to create an init function that can be called from index.ts?

export interface AnalyticsListener {
    id: number;
    name: string;
    type: string;
    initialized: boolean;
    init(): void;
    log(...args: any[]): void;  
}


