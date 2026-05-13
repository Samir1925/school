import { auth } from "./firebase-config.js";

const ALLOWED_UIDS = ['WkrE95GhBqZgg69lR61qjfRc8uo2'];

export async function requireAdmin() {
  await auth.authStateReady();
  const user = auth.currentUser;
  if (!user) return null;
  return ALLOWED_UIDS.includes(user.uid) ? user : null;
}
