// constants/humanity-link-codes.js

/**
 * HumanityLink - ZK Verification Constants
 * Used with zk_humanity_link_all_checks.aleo program
 */

// ===== GEOGRAPHIC =====

/**
 * Country/Region Codes
 * Using ISO 3166-1 numeric standard
 * Full list: https://en.wikipedia.org/wiki/ISO_3166-1_numeric
 */
export const COUNTRY_CODES = {
  // Europe
  NETHERLANDS: 528,
  GERMANY: 276,
  FRANCE: 250,
  BELGIUM: 56,
  SPAIN: 724,
  ITALY: 380,
  GREECE: 300,
  POLAND: 616,
  SWEDEN: 752,
  NORWAY: 578,
  DENMARK: 208,
  FINLAND: 246,
  AUSTRIA: 40,
  SWITZERLAND: 756,
  UK: 826,
  
  // Middle East / Conflict Zones
  SYRIA: 760,
  LEBANON: 422,
  JORDAN: 400,
  TURKEY: 792,
  IRAQ: 368,
  IRAN: 364,
  YEMEN: 887,
  PALESTINE: 275,
  AFGHANISTAN: 4,
  
  // Africa
  SOUTH_SUDAN: 728,
  SOMALIA: 706,
  ETHIOPIA: 231,
  SUDAN: 729,
  ERITREA: 232,
  DEMOCRATIC_REPUBLIC_CONGO: 180,
  NIGERIA: 566,
  CAMEROON: 120,
  CHAD: 148,
  
  // Asia
  MYANMAR: 104,
  BANGLADESH: 50,
  PAKISTAN: 586,
  INDIA: 356,
  
  // Americas
  USA: 840,
  CANADA: 124,
  MEXICO: 484,
  COLOMBIA: 170,
  VENEZUELA: 862,
};

// ===== EMPLOYMENT STATUS =====

export const EMPLOYMENT_STATUS = {
  EMPLOYED: 1,
  UNEMPLOYED: 2,
  SELF_EMPLOYED: 3,
  UNABLE_TO_WORK: 4,      // Due to disability, illness, etc.
  STUDENT: 5,
  RETIRED: 6,
};

export const EMPLOYMENT_STATUS_LABELS = {
  1: "Employed",
  2: "Unemployed",
  3: "Self-Employed",
  4: "Unable to Work",
  5: "Student",
  6: "Retired",
};

// ===== DISPLACEMENT STATUS =====

export const DISPLACEMENT_STATUS = {
  LOCAL: 1,                    // Local resident, not displaced
  IDP: 2,                      // Internally Displaced Person
  REFUGEE: 3,                  // Refugee (crossed international border)
  ASYLUM_SEEKER: 4,            // Applied for asylum, pending decision
  STATELESS: 5,                // No recognized nationality
  RETURNEE: 6,                 // Returned to country of origin
};

export const DISPLACEMENT_STATUS_LABELS = {
  1: "Local Resident",
  2: "Internally Displaced Person (IDP)",
  3: "Refugee",
  4: "Asylum Seeker",
  5: "Stateless",
  6: "Returnee",
};

// ===== VULNERABILITY MARKERS =====

export const VULNERABILITY_STATUS = {
  NONE: 0,                     // No special vulnerability
  ELDERLY: 1,                  // Age 65+
  DISABLED: 2,                 // Physical or mental disability
  UNACCOMPANIED_MINOR: 3,      // Child without parent/guardian
  PREGNANT: 4,                 // Pregnant woman
  CHRONIC_ILLNESS: 5,          // Serious ongoing medical condition
  SINGLE_PARENT: 6,            // Single head of household with dependents
  VICTIM_OF_VIOLENCE: 7,       // GBV, torture, trafficking survivor
  LGBTQ: 8,                    // At-risk LGBTQ+ individual
};

export const VULNERABILITY_STATUS_LABELS = {
  0: "None",
  1: "Elderly (65+)",
  2: "Disabled",
  3: "Unaccompanied Minor",
  4: "Pregnant",
  5: "Chronic Illness",
  6: "Single Parent",
  7: "Victim of Violence",
  8: "LGBTQ+ at Risk",
};

// ===== HOUSING STATUS =====

export const HOUSING_STATUS = {
  HOMELESS: 1,                 // Sleeping rough, no shelter
  TEMPORARY_SHELTER: 2,        // Emergency shelter, hotel
  REFUGEE_CAMP: 3,             // Formal camp setting
  INFORMAL_SETTLEMENT: 4,      // Makeshift housing
  HOSTED: 5,                   // Staying with family/friends
  RENTED: 6,                   // Renting accommodation
  OWNED: 7,                    // Owns home
};

export const HOUSING_STATUS_LABELS = {
  1: "Homeless",
  2: "Temporary Shelter",
  3: "Refugee Camp",
  4: "Informal Settlement",
  5: "Hosted by Family/Friends",
  6: "Rented Accommodation",
  7: "Owned Home",
};

// ===== FOOD SECURITY =====

/**
 * Food Security Levels
 * Based on days without adequate food in past 30 days
 */
export const FOOD_SECURITY_THRESHOLDS = {
  SECURE: 0,                   // 0 days without food
  MILDLY_INSECURE: 3,          // 3+ days without food
  MODERATELY_INSECURE: 7,      // 7+ days without food
  SEVERELY_INSECURE: 15,       // 15+ days without food
  CRISIS: 20,                  // 20+ days without food
};

// ===== INCOME BRACKETS =====

/**
 * Annual Income in EUR
 * Adjust based on local cost of living
 */
export const INCOME_BRACKETS = {
  NO_INCOME: { min: 0, max: 0 },
  EXTREME_POVERTY: { min: 0, max: 5000 },
  LOW: { min: 5001, max: 15000 },
  LOWER_MIDDLE: { min: 15001, max: 25000 },
  MIDDLE: { min: 25001, max: 40000 },
  UPPER_MIDDLE: { min: 40001, max: 60000 },
  HIGH: { min: 60001, max: 999999 },
};

// ===== AID ELIGIBILITY PERIODS =====

/**
 * Minimum days between aid claims (prevent double-dipping)
 */
export const AID_WAITING_PERIODS = {
  EMERGENCY_FOOD: 7,           // Can claim weekly
  MONTHLY_STIPEND: 30,         // Can claim monthly
  QUARTERLY_ASSISTANCE: 90,    // Can claim quarterly
  HOUSING_SUPPORT: 180,        // Can claim every 6 months
  MEDICAL_AID: 0,              // No waiting period for medical
};

// ===== HOUSEHOLD SIZE =====

export const HOUSEHOLD_SIZE_THRESHOLDS = {
  SINGLE: 1,
  COUPLE: 2,
  SMALL_FAMILY: 3,
  MEDIUM_FAMILY: 5,
  LARGE_FAMILY: 7,
  VERY_LARGE_FAMILY: 10,
};

// ===== HELPER FUNCTIONS =====

/**
 * Get country name from ISO code
 */
export function getCountryName(code) {
  const entry = Object.entries(COUNTRY_CODES).find(([_, value]) => value === code);
  return entry ? entry[0].replace(/_/g, ' ') : 'Unknown';
}

/**
 * Get all codes for a specific region
 */
export const REGION_GROUPS = {
  EU: [528, 276, 250, 56, 724, 380, 300, 616, 752, 578, 208, 246, 40, 756, 826],
  MIDDLE_EAST: [760, 422, 400, 792, 368, 364, 887, 275, 4],
  AFRICA: [728, 706, 231, 729, 232, 180, 566, 120, 148],
  ASIA: [104, 50, 586, 356],
};

/**
 * Check if income qualifies for aid
 */
export function qualifiesForAid(annualIncome, maxThreshold = INCOME_BRACKETS.LOWER_MIDDLE.max) {
  return annualIncome <= maxThreshold;
}

/**
 * Get food security level description
 */
export function getFoodSecurityLevel(daysWithoutFood) {
  if (daysWithoutFood >= 20) return "Crisis";
  if (daysWithoutFood >= 15) return "Severely Insecure";
  if (daysWithoutFood >= 7) return "Moderately Insecure";
  if (daysWithoutFood >= 3) return "Mildly Insecure";
  return "Secure";
}

// ===== EXPORT ALL =====

export default {
  COUNTRY_CODES,
  EMPLOYMENT_STATUS,
  EMPLOYMENT_STATUS_LABELS,
  DISPLACEMENT_STATUS,
  DISPLACEMENT_STATUS_LABELS,
  VULNERABILITY_STATUS,
  VULNERABILITY_STATUS_LABELS,
  HOUSING_STATUS,
  HOUSING_STATUS_LABELS,
  FOOD_SECURITY_THRESHOLDS,
  INCOME_BRACKETS,
  AID_WAITING_PERIODS,
  HOUSEHOLD_SIZE_THRESHOLDS,
  REGION_GROUPS,
  getCountryName,
  qualifiesForAid,
  getFoodSecurityLevel,
};