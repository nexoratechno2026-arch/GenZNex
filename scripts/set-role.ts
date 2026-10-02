import { initializeApp, getApps } from "firebase-admin/app";
import { getAuth, UserRecord } from "firebase-admin/auth";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

// Ensure emulator is targeted when running locally
process.env.FIREBASE_AUTH_EMULATOR_HOST = process.env.FIREBASE_AUTH_EMULATOR_HOST || "127.0.0.1:9099";
process.env.FIRESTORE_EMULATOR_HOST = process.env.FIRESTORE_EMULATOR_HOST || "127.0.0.1:8080";

const app = getApps().length === 0
  ? initializeApp({ projectId: "demo-genznex" })
  : getApps()[0];

const auth = getAuth(app);
const db = getFirestore(app);

async function main() {
  const args = process.argv.slice(2);
  if (args.length < 2) {
    console.log(`
Usage: npm run set-role -- <uid-or-email> <student|trainer|admin>
Example: npm run set-role -- user123 trainer
    `);
    process.exit(1);
  }

  const [target, role] = args;
  const validRoles = ["student", "trainer", "admin"];

  if (!validRoles.includes(role)) {
    console.error(`❌ Invalid role: '${role}'. Must be one of: ${validRoles.join(", ")}`);
    process.exit(1);
  }

  try {
    let userRecord: UserRecord;
    if (target.includes("@")) {
      userRecord = await auth.getUserByEmail(target);
    } else {
      userRecord = await auth.getUser(target);
    }

    console.log(`🔍 Found user: ${userRecord.email || userRecord.phoneNumber} (UID: ${userRecord.uid})`);
    
    // Set Custom User Claims
    await auth.setCustomUserClaims(userRecord.uid, { role });
    console.log(`🔑 Assigned custom claim: { role: "${role}" }`);

    // Synchronize Firestore user document
    await db.collection("users").doc(userRecord.uid).set(
      {
        uid: userRecord.uid,
        email: userRecord.email || "",
        phoneNumber: userRecord.phoneNumber || "",
        role: role,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    console.log(`✅ User profile in Firestore updated with role: ${role}`);
    console.log(`✨ Role assignment successful!`);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("❌ Failed to set user role:", message);
    process.exit(1);
  }
}

main();
