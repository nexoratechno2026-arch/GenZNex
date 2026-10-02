import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getAuth, connectAuthEmulator, Auth } from "firebase/auth";
import { getFirestore, connectFirestoreEmulator, Firestore } from "firebase/firestore";
import { getFunctions, connectFunctionsEmulator, Functions } from "firebase/functions";
import { getStorage, connectStorageEmulator, FirebaseStorage } from "firebase/storage";
import { firebaseConfig, emulatorConfig } from "./config";

// Global cache to prevent multiple emulator connections during Next.js Hot Reloading
declare global {
  // eslint-disable-next-line no-var
  var _firebaseApp: FirebaseApp | undefined;
  // eslint-disable-next-line no-var
  var _emulatorsConnected: boolean | undefined;
}

const app: FirebaseApp =
  globalThis._firebaseApp ||
  (getApps().length > 0 ? getApp() : initializeApp(firebaseConfig));

if (process.env.NODE_ENV !== "production") {
  globalThis._firebaseApp = app;
}

const auth: Auth = getAuth(app);
const db: Firestore = getFirestore(app);
const functions: Functions = getFunctions(app);
const storage: FirebaseStorage = getStorage(app);

// Connect emulators in local/development environment
if (emulatorConfig.useEmulator && !globalThis._emulatorsConnected) {
  try {
    connectAuthEmulator(auth, emulatorConfig.authUrl, { disableWarnings: true });
    connectFirestoreEmulator(db, emulatorConfig.firestoreHost, emulatorConfig.firestorePort);
    connectFunctionsEmulator(functions, emulatorConfig.functionsHost, emulatorConfig.functionsPort);
    connectStorageEmulator(storage, emulatorConfig.storageHost, emulatorConfig.storagePort);
    globalThis._emulatorsConnected = true;
    if (typeof window !== "undefined") {
      // eslint-disable-next-line no-console
      console.log(
        "%c[Firebase]%c Connected to local Emulator Suite (Auth: 9099, Firestore: 8080, Functions: 5001, Storage: 9199)",
        "color: #10b981; font-weight: bold;",
        "color: inherit;"
      );
    }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn("[Firebase] Emulator connection notice:", err);
  }
}

export { app, auth, db, functions, storage };
export const getFirebaseFirestore = () => db;
export const getFirebaseFunctions = () => functions;
export const getFirebaseAuth = () => auth;

