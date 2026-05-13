import { auth } from "./firebase-config.js";

/** Allowed admin UIDs – update with the exact UID from Authentication */
const ADMIN_UIDS = [
  'WkrE95GhBqZgg69lR61qjfRc8uo2'   // your current UID
];

export async function requireAdmin() {
  await auth.authStateReady();
  const user = auth.currentUser;

  if (!user) {
    console.warn("admin-guard: No user logged in.");
    return null;
  }

  console.log("admin-guard: User UID =", user.uid);
  if (ADMIN_UIDS.includes(user.uid)) {
    console.log("admin-guard: Hard-coded admin match. Access granted.");
    return user;
  }

  console.warn("admin-guard: UID not in hard-coded list.");
  return null;
}