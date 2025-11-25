import { doc, setDoc, getDoc } from "firebase/firestore";
import { auth, db } from "../firebase";

// Save vision board for current user
export async function saveVisionBoard(data) {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("No user logged in");
  await setDoc(doc(db, "visionBoards", uid), data);
}

// Load vision board for current user
export async function loadVisionBoard() {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("No user logged in");
  const snap = await getDoc(doc(db, "visionBoards", uid));
  return snap.exists() ? snap.data() : null;
}