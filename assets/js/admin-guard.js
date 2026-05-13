import { getAuth, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import { getFirestore, doc, getDoc } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

/**
 * Returns the user object if the current user is an admin.
 * If not an admin, returns null (the user remains logged in but can't access the page).
 * Only throws on unexpected errors.
 */
export async function requireAdmin(auth, db) {
  const user = await new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      unsubscribe();
      resolve(u);
    });
  });

  if (!user) {
    console.warn('admin-guard: No user logged in.');
    return null;
  }

  console.log('admin-guard: User UID =', user.uid);

  const adminRef = doc(db, 'admins', user.uid);
  const adminSnap = await getDoc(adminRef);

  if (!adminSnap.exists()) {
    console.error('admin-guard: No admin document for UID', user.uid);
    return null;
  }

  console.log('admin-guard: Admin check passed.');
  return user;
}
