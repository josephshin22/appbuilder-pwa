import { derived, writable, get } from 'svelte/store';
import config from '$lib/data/config';
import { initFirebaseAnalytics } from '$lib/data/analytics/firebaseListener';
import type { AnalyticsListener } from '$lib/data/analytics/index';

interface AnalyticsStore {
    initialized: boolean;
    listeners: AnalyticsListener[];
}
export const analyticsStore = () => {
    const internal = writable<AnalyticsStore>({ initialized: false, listeners: [] });

    const external = derived(internal, ($internal: AnalyticsStore) => ({ ...$internal }));

    const init = async () => {
        // loop through the list of providers and create interfaces
        // find the provider that is enabled, initialize it and use for future logging 
        for (const provider of config.analytics.providers) {
            console.log(`ID: ${provider.id}, Name: ${provider.name}, Type: ${provider.type}`);    
        }
        const listeners: AnalyticsListener[] = [];
        const firebaseItem = await initFirebaseAnalytics();  
        if (firebaseItem) {
            listeners.push(firebaseItem);
        }
        internal.set({initialized:true, listeners});
    };

    const log = (eventName: string, eventParams?: any) => {
        const listeners = get(internal).listeners;
        for (const listener of listeners) {
            listener.log(eventName, eventParams);
        }
    };
    return {
        init,
        subscribe: external.subscribe,
        log
    };
};

export const analytics = analyticsStore();
