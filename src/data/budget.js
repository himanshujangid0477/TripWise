export const rates = {
  INR: 1,
  USD: 83,
  EUR: 90,
  GBP: 105,
};

export const categories = [
  "Accommodation",
  "Food",
  "Transport",
  "Activities",
  "Shopping",
  "Other",
];

export const DEFAULT_TOTAL_BUDGET = 12000;

export const initialExpenses = [
  { id: 1, title: "Hotel", category: "Accommodation", amount: 2000, currency: "INR" },
  { id: 2, title: "Food", category: "Food", amount: 800, currency: "INR" },
  { id: 3, title: "Local transport", category: "Transport", amount: 500, currency: "INR" },
];

export const defaultCategoryBudgets = {
  Accommodation: 4000,
  Food: 2500,
  Transport: 2000,
  Activities: 1500,
  Shopping: 1000,
  Other: 1000,
};
