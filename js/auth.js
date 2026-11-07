import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "./firebase-config.js";

export const ADMIN_STATES = {
  SIGNED_OUT: "signed-out",
  CHECKING: "checking",
  ADMIN: "admin",
  NOT_ADMIN: "not-admin",
  ERROR: "error",
};

const AUTH_ERROR_MESSAGES = {
  "auth/invalid-credential": "The email or password is incorrect.",
  "auth/invalid-email": "Please enter a valid email address.",
  "auth/missing-password": "Please enter your password.",
  "auth/too-many-requests": "Too many attempts. Please wait a few minutes and try again.",
  "auth/network-request-failed": "Network error. Please check your connection.",
  "auth/user-disabled": "This account has been disabled.",
};

export function describeAuthError(error) {
  return AUTH_ERROR_MESSAGES[error?.code] || "Sign-in failed. Please try again.";
}

export async function signInAdmin(email, password) {
  return signInWithEmailAndPassword(auth, email, password);
}

export function signOutAdmin() {
  return signOut(auth);
}

export async function isAdminUid(uid) {
  const snapshot = await getDoc(doc(db, "admins", uid));
  return snapshot.exists();
}

export function watchAdminSession(callback) {
  return onAuthStateChanged(auth, async (user) => {
    if (!user) {
      callback({ state: ADMIN_STATES.SIGNED_OUT, user: null });
      return;
    }

    callback({ state: ADMIN_STATES.CHECKING, user });
    try {
      const admin = await isAdminUid(user.uid);
      callback({ state: admin ? ADMIN_STATES.ADMIN : ADMIN_STATES.NOT_ADMIN, user });
    } catch {
      callback({ state: ADMIN_STATES.ERROR, user });
    }
  });
}

export async function getCurrentIdToken() {
  const user = auth.currentUser;
  if (!user) throw new Error("Your session has ended. Please sign in again.");
  return user.getIdToken();
}
