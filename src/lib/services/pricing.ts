import { CouponDoc, PaymentAmountBreakdown } from "../../types/schema";

export interface PricingCalculationResult {
  basePriceInPaise: number;
  discountInPaise: number;
  taxableAmountInPaise: number;
  gstInPaise: number;
  totalInPaise: number;
  isFree: boolean;
  couponApplied?: {
    code: string;
    discountInPaise: number;
    description: string;
  };
}

export interface CouponValidationResult {
  isValid: boolean;
  errorMessage?: string;
  discountInPaise: number;
}

/**
 * Validate a coupon against course criteria and usage constraints.
 */
export function validateCouponRules(
  coupon: CouponDoc | null | undefined,
  coursePriceInPaise: number,
  courseId: string,
  categoryId?: string,
  userPastRedemptionsCount = 0
): CouponValidationResult {
  if (!coupon) {
    return { isValid: false, errorMessage: "Coupon not found", discountInPaise: 0 };
  }

  if (!coupon.isActive) {
    return { isValid: false, errorMessage: "This coupon is currently inactive", discountInPaise: 0 };
  }

  const now = Date.now();
  const startsAt =
    typeof coupon.validityDates?.startsAt === "object" && coupon.validityDates.startsAt !== null && "toMillis" in coupon.validityDates.startsAt
      ? (coupon.validityDates.startsAt as { toMillis: () => number }).toMillis()
      : typeof coupon.validityDates?.startsAt === "number"
      ? coupon.validityDates.startsAt
      : 0;

  const expiresAt =
    typeof coupon.validityDates?.expiresAt === "object" && coupon.validityDates.expiresAt !== null && "toMillis" in coupon.validityDates.expiresAt
      ? (coupon.validityDates.expiresAt as { toMillis: () => number }).toMillis()
      : typeof coupon.validityDates?.expiresAt === "number"
      ? coupon.validityDates.expiresAt
      : Infinity;

  if (now < startsAt) {
    return { isValid: false, errorMessage: "Coupon is not yet active", discountInPaise: 0 };
  }

  if (now > expiresAt) {
    return { isValid: false, errorMessage: "Coupon has expired", discountInPaise: 0 };
  }

  if (coupon.minOrderInPaise > 0 && coursePriceInPaise < coupon.minOrderInPaise) {
    const minRupees = Math.round(coupon.minOrderInPaise / 100);
    return {
      isValid: false,
      errorMessage: `Minimum order value of ₹${minRupees} required to use this coupon`,
      discountInPaise: 0,
    };
  }

  if (coupon.applicableCourses && coupon.applicableCourses.length > 0) {
    if (!coupon.applicableCourses.includes(courseId)) {
      return { isValid: false, errorMessage: "This coupon is not valid for this course", discountInPaise: 0 };
    }
  }

  if (coupon.applicableCategories && coupon.applicableCategories.length > 0 && categoryId) {
    if (!coupon.applicableCategories.includes(categoryId)) {
      return { isValid: false, errorMessage: "This coupon is not valid for this course category", discountInPaise: 0 };
    }
  }

  if (coupon.usageLimit > 0 && (coupon.usedCount || 0) >= coupon.usageLimit) {
    return { isValid: false, errorMessage: "Coupon usage limit has been reached", discountInPaise: 0 };
  }

  if (coupon.perUserLimit > 0 && userPastRedemptionsCount >= coupon.perUserLimit) {
    return { isValid: false, errorMessage: "You have already used this coupon", discountInPaise: 0 };
  }

  // Calculate discount in integer paise
  let discountInPaise = 0;
  if (coupon.type === "percent") {
    const computed = Math.round((coursePriceInPaise * coupon.value) / 100);
    if (coupon.maxDiscountInPaise && coupon.maxDiscountInPaise > 0) {
      discountInPaise = Math.min(computed, coupon.maxDiscountInPaise);
    } else {
      discountInPaise = computed;
    }
  } else if (coupon.type === "flat") {
    discountInPaise = Math.round(coupon.value);
  }

  // Discount cannot exceed the course price
  discountInPaise = Math.min(coursePriceInPaise, Math.max(0, discountInPaise));

  return {
    isValid: true,
    discountInPaise,
  };
}

/**
 * Compute the complete price breakdown with GST.
 * All math in integer paise to avoid rounding discrepancies.
 */
export function calculatePaymentBreakdown(
  basePriceInPaise: number,
  discountInPaise = 0,
  gstRatePercent = 18
): PaymentAmountBreakdown {
  const safeBase = Math.max(0, Math.round(basePriceInPaise));
  const safeDiscount = Math.min(safeBase, Math.max(0, Math.round(discountInPaise)));
  const taxableAmountInPaise = Math.max(0, safeBase - safeDiscount);

  // If taxable is 0 (e.g. 100% coupon or ₹0 course), GST is 0
  const gstInPaise = taxableAmountInPaise === 0
    ? 0
    : Math.round((taxableAmountInPaise * gstRatePercent) / 100);

  const totalInPaise = taxableAmountInPaise + gstInPaise;

  return {
    basePriceInPaise: safeBase,
    discountInPaise: safeDiscount,
    taxableAmountInPaise,
    gstInPaise,
    totalInPaise,
  };
}
