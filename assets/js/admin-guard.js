import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

/**
 * Ensures only authenticated admin users can stay on the page.
 * If not an admin, signs out and redirects to /admin/index.html.
 * Returns the user object when successful.
 */
export async function requireAdmin(auth, db) {
  return new Promise((resolve, reject) => {
    onAuthStateChanged(auth, async (user) => {
      if (!user) {
        // Not logged in
        window.location.href = '/admin/index.html';
        reject('No user');
        return;
      }

      // Check admin document in Firestore
      const adminRef = doc(db, 'admins', user.uid);
      const adminSnap = await getDoc(adminRef);
      
      if (!adminSnap.exists()) {
        // Logged in but not an admin → sign out and redirect
        await signOut(auth);
        window.location.href = '/admin/index.html';
        reject('Not admin');
        return;
      }

      // All good – user is admin
      resolve(user);
    });
  });
}