import { getAuth, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';

/** List of Firebase Auth UIDs that are allowed to access the admin panel */
const ADMIN_UIDS = [
  '0nMkORaoGDNJkYQu5rar9luocAq1',
  'WkrE95GhBqZgg69lR61qjfRc8uo2'
];

export async function requireAdmin(auth) {
  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe();
      if (!user) {
        console.warn('admin-guard: No user logged in');
        resolve(null);
        return;
      }
      if (ADMIN_UIDS.includes(user.uid)) {
        console.log('admin-guard: Admin matched via hard‑coded list');
        resolve(user);
      } else {
        console.warn('admin-guard: User UID not in admin list');
        resolve(null);
      }
    });
  });
}
