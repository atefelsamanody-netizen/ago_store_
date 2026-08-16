import { getApp, getApps, initializeApp } from "firebase/app";

import { getFirestore } from "firebase/firestore";

import { getStorage } from "firebase/storage";

/* =========================================================

   FIREBASE CONFIG

========================================================= */

const firebaseConfig = {

  apiKey: "AIzaSyBKFn810HZLDfh2XN_iVZPfU5pMf-2c3_Q",

  authDomain:

    "agobrand-fa8e8.firebaseapp.com",

  databaseURL:

    "https://agobrand-fa8e8-default-rtdb.europe-west1.firebasedatabase.app",

  projectId:

    "agobrand-fa8e8",

  storageBucket:

    "agobrand-fa8e8.firebasestorage.app",

  messagingSenderId:

    "581871100676",

  appId:

    "1:581871100676:web:8032bc394e8ab2089d6651",

  measurementId:

    "G-4LXK3K0W8N",

};

/* =========================================================

   FIREBASE APP

========================================================= */

const app =

  getApps().length > 0

    ? getApp()

    : initializeApp(firebaseConfig);

/* =========================================================

   FIRESTORE

========================================================= */

export const db =

  getFirestore(app);

/* =========================================================

   FIREBASE STORAGE

========================================================= */

export const storage =

  getStorage(app);

/* =========================================================

   DEFAULT EXPORT

========================================================= */

export default app;