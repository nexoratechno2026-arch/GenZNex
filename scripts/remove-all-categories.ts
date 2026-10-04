import { initializeApp, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

process.env.FIREBASE_AUTH_EMULATOR_HOST = process.env.FIREBASE_AUTH_EMULATOR_HOST || "127.0.0.1:9099";
process.env.FIRESTORE_EMULATOR_HOST = process.env.FIRESTORE_EMULATOR_HOST || "127.0.0.1:8080";

const app = getApps().length === 0 ? initializeApp({ projectId: "demo-genznex" }) : getApps()[0];
const db = getFirestore(app);

async function main() {
  console.log("🗑️ Removing all documents from /categories collection...");
  const catSnap = await db.collection("categories").get();

  console.log(`Found ${catSnap.size} categories to delete.`);
  const batch = db.batch();
  for (const doc of catSnap.docs) {
    console.log(`   Deleting category: ${doc.id} (${doc.data().name})`);
    batch.delete(doc.ref);
  }

  await batch.commit();
  console.log("✅ All categories have been successfully removed.");
  process.exit(0);
}

main().catch((err) => {
  console.error("Failed to delete categories:", err);
  process.exit(1);
});
