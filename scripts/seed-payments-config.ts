import { initializeApp, getApps } from "firebase-admin/app";
import { getFirestore, Timestamp } from "firebase-admin/firestore";

process.env.FIRESTORE_EMULATOR_HOST = process.env.FIRESTORE_EMULATOR_HOST || "127.0.0.1:8080";
process.env.FIREBASE_AUTH_EMULATOR_HOST = process.env.FIREBASE_AUTH_EMULATOR_HOST || "127.0.0.1:9099";

const app = getApps().length === 0
  ? initializeApp({ projectId: "demo-genznex" })
  : getApps()[0];

const db = getFirestore(app);


async function seedPaymentsConfig() {
  console.log("💳 Seeding GenZNex Payment Config and Test Coupons...");

  // 1. Platform Payment & GST Config
  const configRef = db.collection("config").doc("payments");
  await configRef.set({
    gstRatePercent: 18,
    businessName: "GenZNex EdTech Private Limited",
    gstin: "27AABCU9603R1ZM",
    businessAddress: "241, East Permanur, Anna Park Backside, Salem-7, Tamil Nadu 636007, India",
    invoicePrefix: "GZN-INV-2026-",
    currentInvoiceSequence: 1000,
    refundWindowDays: 7,
    hsnSacCode: "999293",
    caDisclaimer:
      "Note: Consult a certified Chartered Accountant to confirm GST treatment, state-wise reverse charge, and B2B/B2C tax compliance under Indian GST laws.",
    updatedAt: Timestamp.now(),
  });
  console.log("   ✅ /config/payments initialized.");

  // 2. Seed Test Coupons
  const now = Date.now();
  const oneDay = 24 * 60 * 60 * 1000;
  const thirtyDays = 30 * oneDay;

  const coupons = [
    {
      id: "GENZ20",
      code: "GENZ20",
      type: "percent",
      value: 20, // 20%
      maxDiscountInPaise: 50000, // ₹500 cap
      minOrderInPaise: 99900, // ₹999 min
      validityDates: {
        startsAt: Timestamp.fromMillis(now - oneDay),
        expiresAt: Timestamp.fromMillis(now + thirtyDays),
      },
      usageLimit: 500,
      perUserLimit: 1,
      applicableCourses: [],
      applicableCategories: [],
      isActive: true,
      usedCount: 0,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    },
    {
      id: "FLAT500",
      code: "FLAT500",
      type: "flat",
      value: 50000, // ₹500 flat off (in paise)
      minOrderInPaise: 149900, // ₹1,499 min
      validityDates: {
        startsAt: Timestamp.fromMillis(now - oneDay),
        expiresAt: Timestamp.fromMillis(now + thirtyDays),
      },
      usageLimit: 200,
      perUserLimit: 1,
      applicableCourses: [],
      applicableCategories: [],
      isActive: true,
      usedCount: 0,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    },
    {
      id: "FREE100",
      code: "FREE100",
      type: "percent",
      value: 100, // 100% off (direct free bypass)
      minOrderInPaise: 0,
      validityDates: {
        startsAt: Timestamp.fromMillis(now - oneDay),
        expiresAt: Timestamp.fromMillis(now + thirtyDays),
      },
      usageLimit: 100,
      perUserLimit: 1,
      applicableCourses: [],
      applicableCategories: [],
      isActive: true,
      usedCount: 0,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    },
    {
      id: "EXPIRED90",
      code: "EXPIRED90",
      type: "percent",
      value: 90,
      minOrderInPaise: 0,
      validityDates: {
        startsAt: Timestamp.fromMillis(now - 60 * oneDay),
        expiresAt: Timestamp.fromMillis(now - 10 * oneDay),
      },
      usageLimit: 100,
      perUserLimit: 1,
      applicableCourses: [],
      applicableCategories: [],
      isActive: true,
      usedCount: 100,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    },
  ];

  for (const c of coupons) {
    await db.collection("coupons").doc(c.id).set(c);
    console.log(`   🏷️ Seeded coupon: ${c.code} (${c.type === "percent" ? `${c.value}%` : `₹${c.value / 100}`})`);
  }

  console.log("🎉 Payment configuration and coupons successfully seeded into emulator!\n");
}

seedPaymentsConfig().catch((err) => {
  console.error("❌ Seeding failed:", err);
  process.exit(1);
});
