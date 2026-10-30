import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, getDoc } from 'firebase/firestore';
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

async function check() {
  try {
    await signInAnonymously(auth);
    console.log("Authenticated anonymously");

    // Check specific doc 'tmrbe2006'
    const directDoc = await getDoc(doc(db, 'users', 'tmrbe2006'));
    if (directDoc.exists()) {
      console.log("Direct doc 'tmrbe2006' exists:", JSON.stringify(directDoc.data(), null, 2));
    } else {
      console.log("Direct doc 'tmrbe2006' does NOT exist by ID");
    }

    // Get all users in collection
    const snap = await getDocs(collection(db, 'users'));
    console.log(`Total users found: ${snap.size}`);
    snap.forEach(d => {
      const data = d.data();
      console.log(`Doc ID: "${d.id}", username: "${data.username}", name: "${data.name}", role: "${data.role}", password: "${data.password ? '***' + data.password.slice(-3) : 'NONE'}" (len: ${data.password?.length})`);
    });
  } catch (err) {
    console.error("Error inspecting users:", err);
  }
}

check().then(() => process.exit(0));
