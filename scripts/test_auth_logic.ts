import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, getDocs, collection, query, where } from 'firebase/firestore';
import { getAuth, signInAnonymously } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyDi3fe3uYPUtsaihI9aVwl9OdZoW2CdhVs",
  authDomain: "firealarmsystem-6fdc2.firebaseapp.com",
  databaseURL: "https://firealarmsystem-6fdc2-default-rtdb.firebaseio.com",
  projectId: "firealarmsystem-6fdc2",
  storageBucket: "firealarmsystem-6fdc2.firebasestorage.app",
  messagingSenderId: "108775827318",
  appId: "1:108775827318:web:05d1d4a4b0469beebd3c57",
  measurementId: "G-YLWKXZRY9M"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

async function testUserLogin(inputUsername: string, inputPassword: string) {
  if (!auth.currentUser) {
    await signInAnonymously(auth);
  }
  const finalUsername = inputUsername.trim();
  const finalPassword = inputPassword.trim();
  const id = finalUsername.toLowerCase().replace(/\s+/g, '-');

  let targetUserData: any = null;
  let targetDocId = id;

  // 1. Direct doc lookup
  const directDoc = await getDoc(doc(db, 'users', id));
  if (directDoc.exists()) {
    targetUserData = { id: directDoc.id, ...directDoc.data() };
    targetDocId = directDoc.id;
  } else {
    // 2. Query by username
    const qSnap = await getDocs(query(collection(db, 'users'), where('username', '==', finalUsername)));
    if (!qSnap.empty) {
      targetUserData = { id: qSnap.docs[0].id, ...qSnap.docs[0].data() };
      targetDocId = qSnap.docs[0].id;
    } else {
      // 3. Fallback scan
      const allSnap = await getDocs(collection(db, 'users'));
      const matched = allSnap.docs.find(d => {
        const data = d.data();
        const u = (data.username || '').toString().trim().toLowerCase();
        const n = (data.name || '').toString().trim().toLowerCase();
        return d.id.toLowerCase() === id || u === finalUsername.toLowerCase() || n === finalUsername.toLowerCase();
      });
      if (matched) {
        targetUserData = { id: matched.id, ...matched.data() };
        targetDocId = matched.id;
      }
    }
  }

  if (!targetUserData) {
    return { success: false, reason: 'User not found' };
  }

  const storedPassword = (targetUserData.password != null) ? String(targetUserData.password).trim() : '';
  if (storedPassword && storedPassword !== finalPassword) {
    return { success: false, reason: 'Invalid password' };
  }

  return { success: true, user: targetUserData };
}

async function run() {
  console.log("Testing tmrbe2006 with correct password (123):");
  const res1 = await testUserLogin('tmrbe2006', '123');
  console.log("Result 1:", res1.success, res1.user?.name, res1.user?.role);

  console.log("Testing tmrbe2006 with wrong password (999):");
  const res2 = await testUserLogin('tmrbe2006', '999');
  console.log("Result 2:", res2.success, res2.reason);

  console.log("Testing uppercase input (Tmrbe2006):");
  const res3 = await testUserLogin('Tmrbe2006', '123');
  console.log("Result 3:", res3.success, res3.user?.name);
}

run().then(() => process.exit(0));
