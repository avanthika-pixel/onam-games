import { initializeApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as fbSignOut,
  onAuthStateChanged,
} from "firebase/auth";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  runTransaction,
  collection,
  onSnapshot,
  serverTimestamp,
} from "firebase/firestore";
import { COMPANY_DOMAIN } from "./config";

// ---- Replace with your Firebase project's web config ----
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

const provider = new GoogleAuthProvider();
provider.setCustomParameters({ hd: COMPANY_DOMAIN });

export function watchAuth(callback) {
  return onAuthStateChanged(auth, callback);
}

export async function loginWithGoogle() {
  const result = await signInWithPopup(auth, provider);
  const email = result.user.email || "";
  if (!email.endsWith(`@${COMPANY_DOMAIN}`)) {
    await fbSignOut(auth);
    throw new Error(
      `Please sign in with your @${COMPANY_DOMAIN} company account.`
    );
  }
  return result.user;
}

export function logout() {
  return fbSignOut(auth);
}

export async function getUserDoc(uid) {
  const snap = await getDoc(doc(db, "users", uid));
  return snap.exists() ? snap.data() : null;
}

export async function joinTeam({ uid, name, email, team }) {
  const displayId = `${name.trim().replace(/\s+/g, "_")}_team${team}`;
  const ref = doc(db, "users", uid);
  await setDoc(ref, {
    name,
    email,
    team,
    displayId,
    bestScores: { boat: 0, pookalam: 0, anniversary: 0 },
    updatedAt: serverTimestamp(),
  });
}

// Only raises a game's best score if the new score is higher.
// Uses a transaction so simultaneous submissions from many players stay safe.
export async function submitScore({ uid, gameId, score }) {
  const ref = doc(db, "users", uid);
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists()) return;
    const data = snap.data();
    const current = data.bestScores?.[gameId] || 0;
    if (score > current) {
      tx.update(ref, {
        [`bestScores.${gameId}`]: score,
        updatedAt: serverTimestamp(),
      });
    }
  });
}

// Live listener over all players, for the leaderboard.
export function watchAllUsers(callback) {
  return onSnapshot(collection(db, "users"), (snap) => {
    const users = [];
    snap.forEach((d) => users.push({ uid: d.id, ...d.data() }));
    callback(users);
  });
}
