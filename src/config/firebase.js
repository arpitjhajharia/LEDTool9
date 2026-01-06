import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';

const externalConfig = {
    apiKey: "AIzaSyDNkESdvnoQpkqDx8ToD_4-NVK7yZKBz0c",
    authDomain: "led-tool2.firebaseapp.com",
    projectId: "led-tool2",
    storageBucket: "led-tool2.firebasestorage.app",
    messagingSenderId: "709256165160",
    appId: "1:709256165160:web:66f8a77b0f9cb21276421d"
};

let firebaseConfig;
let appId = 'admire-signage-external';

// Support for dynamic config if provided via window (legacy style)
if (typeof window !== 'undefined' && window.__firebase_config) {
    firebaseConfig = JSON.parse(window.__firebase_config);
    appId = typeof window.__app_id !== 'undefined' ? window.__app_id : appId;
} else {
    firebaseConfig = externalConfig;
}

let app, auth, db, isConfigured = true;

if (!firebaseConfig.apiKey || firebaseConfig.apiKey.includes("REPLACE_WITH")) {
    isConfigured = false;
} else {
    try {
        if (!firebase.apps.length) {
            app = firebase.initializeApp(firebaseConfig);
        } else {
            app = firebase.app();
        }
        auth = firebase.auth();
        db = firebase.firestore();
    } catch (e) {
        console.error("Firebase Init Failed:", e);
        isConfigured = false;
    }
}

export { auth, db, isConfigured, appId };
