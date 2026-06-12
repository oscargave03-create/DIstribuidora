import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

const isConfigured = !!(
  firebaseConfig && 
  firebaseConfig.apiKey && 
  firebaseConfig.apiKey !== "" && 
  firebaseConfig.projectId && 
  firebaseConfig.projectId !== ""
);

let app: any = null;
let db: any = null;
let auth: any = null;

if (isConfigured) {
  try {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
    auth = getAuth(app);
  } catch (error) {
    console.error("Failed to initialize Firebase SDK:", error);
  }
}

export { app, db, auth, isConfigured };
