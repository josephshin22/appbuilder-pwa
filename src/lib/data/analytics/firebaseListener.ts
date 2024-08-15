// import { AnalyticsItem } from '$lib/data/analytics/index';
import config from '$lib/data/config';
import type { AnalyticsListener } from '$lib/data/analytics/index';

class FirebaseAnalytics implements AnalyticsListener {
    // retrieve information from config.js

    firebaseAnalytics = null;
    firebaseLogEvent = null;
    initialized: boolean = false;

    constructor(
        public id: number,
        public name: string,
        public type: string,
    ) {}


    init = async () => {
        try {
            // Dynamically import Firebase modules
            const { initializeApp } = await import('firebase/app');
            const { getAnalytics, logEvent } = await import('firebase/analytics');
            const { firebaseConfig } = await import('$lib/data/firebase-config');
            if (firebaseConfig) {
                console.log(
                    `Analytics: Initializing Firebase: projectId=${firebaseConfig.projectId}, appId=${firebaseConfig.appId}`
                );
                const app = initializeApp(firebaseConfig);
                this.firebaseAnalytics = getAnalytics(app);
                this.firebaseLogEvent = logEvent;
            }
            this.initialized = true;
            console.log("initialized: true")
            } catch (error) {
                console.error('Failed to initialize Firebase Analytics:', error);
                // Optionally handle error or retry initialization
        }
    }
    
    // keep this!
    log = (eventName: string, eventParams?: any) => {
        if (this.firebaseAnalytics) {
            console.log('Analytics: Event:', eventName, eventParams);
            this.firebaseLogEvent(this.firebaseAnalytics, eventName, eventParams);
        } else {
            console.warn('Analytics not initialized. Event not logged:', eventName);
        }
    }
}

export async function initFirebaseAnalytics() {
    if (config.firebase.features['firebase-analytics'] && config.analytics.enabled) {
        for (const provider of config.analytics.providers) {
            if (provider.type === 'firebase-analytics') {
                const firebaseInstance = new FirebaseAnalytics(provider.id, provider.name, provider.type);
                firebaseInstance.init();
                return firebaseInstance;
            }
        }
    } else {
        console.warn('Firebase Analytics feature is disabled in config.');
        return null;

        // note: do we still want to update the initialized state to true?
        // Although this isn't referencing a store, so maybe it won't run until it's true..
    }
}


