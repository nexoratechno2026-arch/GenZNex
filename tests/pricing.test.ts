import { calculatePaymentBreakdown, validateCouponRules } from "../src/lib/services/pricing";
import { CouponDoc } from "../src/types/schema";

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    throw new Error(message);
  }
  console.log(`   ✅ PASS: ${message}`);
}

async function runPricingTests() {
  console.log("💰 Running GenZNex Phase 3 Pricing & Calculation Unit Tests...\n");

  // 1. Basic GST calculation without coupon
  console.log("🧪 Test 1: Full price course (₹1,999 = 199900 paise) + 18% GST");
  const result1 = calculatePaymentBreakdown(199900, 0, 18);
  assert(result1.basePriceInPaise === 199900, "Base price is 199900 paise");
  assert(result1.discountInPaise === 0, "Discount is 0");
  assert(result1.taxableAmountInPaise === 199900, "Taxable amount is 199900 paise");
  // 199900 * 0.18 = 35982 paise (₹359.82)
  assert(result1.gstInPaise === 35982, "18% GST is 35982 paise (₹359.82)");
  assert(result1.totalInPaise === 235882, "Total is 235882 paise (₹2358.82)");

  // 2. Percentage coupon with cap
  console.log("\n🧪 Test 2: Percentage coupon (20% off capped at ₹500 = 50000 paise) on ₹3,499 (349900 paise)");
  const couponCapped: CouponDoc = {
    id: "GENZ20",
    code: "GENZ20",
    type: "percent",
    value: 20,
    maxDiscountInPaise: 50000,
    minOrderInPaise: 99900,
    validityDates: {
      startsAt: Date.now() - 1000,
      expiresAt: Date.now() + 100000,
    },
    usageLimit: 100,
    perUserLimit: 1,
    applicableCourses: [],
    applicableCategories: [],
    isActive: true,
    usedCount: 0,
    createdAt: null,
    updatedAt: null,
  };

  const validationCapped = validateCouponRules(couponCapped, 349900, "course_nextjs");
  assert(validationCapped.isValid === true, "Coupon is valid");
  // 20% of 349900 is 69980, which is > 50000, so discount should cap at 50000
  assert(validationCapped.discountInPaise === 50000, "Discount capped at 50000 paise (₹500)");

  const breakdownCapped = calculatePaymentBreakdown(349900, validationCapped.discountInPaise, 18);
  assert(breakdownCapped.taxableAmountInPaise === 299900, "Taxable amount is 299900 paise");
  // 299900 * 0.18 = 53982 paise
  assert(breakdownCapped.gstInPaise === 53982, "GST on discounted amount is 53982 paise");
  assert(breakdownCapped.totalInPaise === 353882, "Total payable is 353882 paise");

  // 3. Flat coupon exceeding base price
  console.log("\n🧪 Test 3: Flat coupon ₹500 on ₹499 course (must cap at base price, no negative total)");
  const couponFlat: CouponDoc = {
    ...couponCapped,
    type: "flat",
    value: 50000, // ₹500
    minOrderInPaise: 0,
  };
  const validationFlat = validateCouponRules(couponFlat, 49900, "course_mini");
  assert(validationFlat.isValid === true, "Coupon valid");
  assert(validationFlat.discountInPaise === 49900, "Discount capped at 49900 (does not exceed course price)");

  const breakdownFlat = calculatePaymentBreakdown(49900, validationFlat.discountInPaise, 18);
  assert(breakdownFlat.taxableAmountInPaise === 0, "Taxable is 0");
  assert(breakdownFlat.gstInPaise === 0, "GST is 0 for free total");
  assert(breakdownFlat.totalInPaise === 0, "Total is 0 (100% free via flat discount)");

  // 4. 100% Free Coupon
  console.log("\n🧪 Test 4: 100% Free Coupon (FREE100)");
  const couponFree: CouponDoc = {
    ...couponCapped,
    code: "FREE100",
    value: 100,
    maxDiscountInPaise: undefined,
    minOrderInPaise: 0,
  };
  const validationFree = validateCouponRules(couponFree, 299900, "course_dev");
  assert(validationFree.isValid === true, "100% coupon is valid");
  assert(validationFree.discountInPaise === 299900, "Discount equals full course price");
  const breakdownFree = calculatePaymentBreakdown(299900, validationFree.discountInPaise, 18);
  assert(breakdownFree.totalInPaise === 0, "Total is 0 paise");

  // 5. Expired Coupon
  console.log("\n🧪 Test 5: Expired coupon rejection");
  const couponExpired: CouponDoc = {
    ...couponCapped,
    validityDates: {
      startsAt: Date.now() - 20000,
      expiresAt: Date.now() - 1000,
    },
  };
  const validationExpired = validateCouponRules(couponExpired, 199900, "course_dev");
  assert(validationExpired.isValid === false, "Expired coupon is rejected");
  assert(validationExpired.errorMessage?.includes("expired") === true, "Error message contains 'expired'");

  // 6. Minimum Order Value Check
  console.log("\n🧪 Test 6: Minimum order threshold rejection");
  const couponMinOrder: CouponDoc = {
    ...couponCapped,
    minOrderInPaise: 200000, // ₹2000
  };
  const validationMinOrder = validateCouponRules(couponMinOrder, 149900, "course_dev");
  assert(validationMinOrder.isValid === false, "Order below minimum rejected");
  assert(validationMinOrder.errorMessage?.includes("Minimum order") === true, "Error message mentions minimum order");

  // 7. Course Applicability Check
  console.log("\n🧪 Test 7: Ineligible course rejection");
  const couponRestricted: CouponDoc = {
    ...couponCapped,
    applicableCourses: ["course_allowed_only"],
  };
  const validationRestricted = validateCouponRules(couponRestricted, 199900, "course_disallowed");
  assert(validationRestricted.isValid === false, "Ineligible course rejected");

  // 8. Usage Limit Reached
  console.log("\n🧪 Test 8: Total usage limit exhausted");
  const couponExhausted: CouponDoc = {
    ...couponCapped,
    usageLimit: 50,
    usedCount: 50,
  };
  const validationExhausted = validateCouponRules(couponExhausted, 199900, "course_dev");
  assert(validationExhausted.isValid === false, "Exhausted coupon rejected");

  // 9. Per-User Limit Reached
  console.log("\n🧪 Test 9: Per-user usage limit reached");
  const validationPerUser = validateCouponRules(couponCapped, 199900, "course_dev", undefined, 1);
  assert(validationPerUser.isValid === false, "Per-user limit exceeded rejected");

  console.log("\n🎉 ALL 9 PRICING & CALCULATION TESTS PASSED 100%!\n");
}

runPricingTests().catch((err) => {
  console.error("❌ Pricing tests failed:", err);
  process.exit(1);
});
