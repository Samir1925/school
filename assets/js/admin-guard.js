import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

export async function requireAdmin() {
  // Wait for auth to be fully initialised
  await auth.authStateReady();

  const user = auth.currentUser;
  if (!user) {
    console.warn("admin-guard: No user logged in.");
    return null;
  }

  console.log("admin-guard: User UID =", user.uid);

  try {
    const adminRef = doc(db, "admins", user.uid);
    const adminSnap = await getDoc(adminRef);
    if (adminSnap.exists()) {
      console.log("admin-guard: Admin document found. Access granted.");
      return user;
    } else {
      console.warn("admin-guard: No admin document for UID", user.uid);
      return null;
    }
  } catch (err) {
    console.error("admin-guard: Firestore error:", err);
    return null;
  }
}