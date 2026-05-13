import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";

const firebaseConfig = {
  apiKey: "AIzaSyCbTfB_VxZosV15LUdgyoUrHL6-dz6FohM",
  authDomain: "school-cf387.firebaseapp.comm",
  projectId: "school-cf387",
  storageBucket: "school-cf387.firebasestorage.app",
  messagingSenderId: "594859618434",
  appId: "1:594859618434:web:065c17831015ca0073049b"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);