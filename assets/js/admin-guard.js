import { getAuth, onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import { getFirestore, doc, getDoc } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

/**
 * Verifies the current user is an admin by checking Firestore 'admins' collection.
 * @returns {Promise<object>} the authenticated user object
 * @throws If not logged in or not an admin – caller should handle the redirect.
 */
export async function requireAdmin(auth, db) {
  return new Promise((resolve, reject) => {
    // Wait for Firebase Auth to initialise
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      unsubscribe(); // only run once

      if (!user) {
        console.warn('🔒 requireAdmin: No user logged in. Redirecting to login.');
        window.location.href = '/admin/index.html';
        reject(new Error('Not logged in'));
        return;
      }

      console.log('✅ requireAdmin: User logged in, UID:', user.uid);

      // Check if the user's UID exists in the 'admins' collection
      try {
        const adminRef = doc(db, 'admins', user.uid);
        const adminSnap = await getDoc(adminRef);

        if (adminSnap.exists()) {
          console.log('✅ requireAdmin: Admin document found. Access granted.');
          resolve(user);
        } else {
          console.error('❌ requireAdmin: No admin document for UID', user.uid);
          // The user is logged in but not an admin → sign them out and redirect
          await signOut(auth);
          console.warn('🔒 Signed out non‑admin user. Redirecting to login.');
          window.location.href = '/admin/index.html';
          reject(new Error('Not an admin'));
        }
      } catch (err) {
        console.error('❌ requireAdmin: Firestore error:', err);
        reject(err);
      }
    });
  });
}