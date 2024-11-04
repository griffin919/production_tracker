import { initializeApp } from 'firebase/app'
import { getDatabase } from 'firebase/database'

export default defineNuxtPlugin((nuxtApp) => {
    const config = useRuntimeConfig()

    const firebaseConfig = {
        // apiKey: config.public.apiKey,
        // authDomain: config.public.authDomain,
        // projectId: config.public.projectId,
        // storageBucket: config.public.storageBucket,
        // messagingSenderId: config.public.messagingSenderId,
        // appId: config.public.appId,
        // measurementId: config.public.measurementId

        apiKey: "AIzaSyBytl-ZoY_nCg5z_92wdwAo3xw1yN7Qy9s",
        authDomain: "production-tracker-c1d6b.firebaseapp.com",
        databaseURL: "https://production-tracker-c1d6b-default-rtdb.firebaseio.com",
        projectId: "production-tracker-c1d6b",
        storageBucket: "production-tracker-c1d6b.firebasestorage.app",
        messagingSenderId: "1001680946203",
        appId: "1:1001680946203:web:d7abde61b0071e58de24be"
    };

    const firebaseApp = initializeApp(firebaseConfig)

    const database = getDatabase(firebaseApp)

    return {
        provide: {
            database: database
        }
    }

})