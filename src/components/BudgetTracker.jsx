
import { useMemo, useState } from "react";
import { Wallet, Plus, Trash2 } from "lucide-react";
import {
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const rates = {
  INR: 1,
  USD: 83,
  EUR: 90,
  GBP: 105,
};

const categories = [
  "Accommodation",
  "Food",
  "Transport",
  "Activities",
  "Shopping",
  "Other",
];

const initialExpenses = [
  { id: 1, title: "Hotel", category: "Accommodation", amount: 2000, currency: "INR" },
  { id: 2, title: "Food", category: "Food", amount: 800, currency: "INR" },
  { id: 3, title: "Local transport", category: "Transport", amount: 500, currency: "INR" },
];
const defaultCategoryBudgets = {
  Accommodation: 4000,
  Food: 2500,
  Transport: 2000,
  Activities: 1500,
  Shopping: 1000,
  Other: 1000,
};
export default function BudgetTracker() {
  const [budget, setBudget] = useState(12000);
  const [expenses, setExpenses] = useState(initialExpenses);
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("INR");
  const [category, setCategory] = useState("Food");
  const [categoryBudgets, setCategoryBudgets] = useState(defaultCategoryBudgets);

  const totalSpent = useMemo(
    () =>
      expenses.reduce(
        (total, expense) => total + expense.amount * rates[expense.currency],
        0
      ),
    [expenses]
  );

  const remaining = budget - totalSpent;
  const spentPercentage = Math.min((totalSpent / budget) * 100, 100);

  const categoryTotals = categories.map((name) => ({
    name,
    total: expenses
      .filter((expense) => expense.category === name)
      .reduce(
        (sum, expense) => sum + expense.amount * rates[expense.currency],
        0
      ),
  }));
  const chartData = categories.map((name) => ({
  name,
  Budget: categoryBudgets[name],
  Actual: Math.round(
    categoryTotals.find((item) => item.name === name).total
  ),
}));
const allocated = Object.values(categoryBudgets).reduce(
  (sum, value) => sum + value,
  0
);
  const addExpense = (event) => {
    event.preventDefault();

    if (!title.trim() || !amount || Number(amount) <= 0) return;

    setExpenses((current) => [
      ...current,
      {
        id: Date.now(),
        title: title.trim(),
        category,
        amount: Number(amount),
        currency,
      },
    ]);

    setTitle("");
    setAmount("");
  };

  const formatINR = (value) =>
    `₹${value.toLocaleString("en-IN", {
      maximumFractionDigits: 2,
    })}`;

  return (
    <section className="budget-section">
      <div className="section-heading">
        <div>
          <span className="section-label">MANAGE YOUR MONEY</span>
          <h2>Trip budget tracker</h2>
        </div>
      </div>

      <div className="budget-summary">
        <div className="budget-card">
          <Wallet size={22} />
          <p>Total budget (INR)</p>
          <input
            type="number"
            min="1"
            value={budget}
            onChange={(e) => setBudget(Math.max(1, Number(e.target.value)))}
          />
        </div>

        <div className="budget-card">
          <p>Total spent</p>
          <h3>{formatINR(totalSpent)}</h3>
        </div>

        <div className="budget-card">
          <p>Remaining balance</p>
          <h3>{formatINR(remaining)}</h3>
        </div>
      </div>

      <div className="budget-progress">
        <div className="budget-progress-heading">
          <strong>Budget usage</strong>
          <span>{spentPercentage.toFixed(1)}%</span>
        </div>
        <div className="progress-track">
          <div
            className="progress-fill"
            style={{ width: `${spentPercentage}%` }}
          />
        </div>
        {remaining < 0 && <p>Budget exceeded by {formatINR(-remaining)}</p>}
      </div>

      <div className="budget-layout">
        <div className="budget-panel">
          <h3>Add an expense</h3>

          <form onSubmit={addExpense} className="expense-form">
            <input
              placeholder="Expense name"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />

            <input
              type="number"
              min="0.01"
              step="0.01"
              placeholder="Amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />

            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
            >
              {Object.keys(rates).map((code) => (
                <option key={code} value={code}>{code}</option>
              ))}
            </select>

            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {categories.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>

            <button type="submit" className="primary-button">
              <Plus size={17} /> Add expense
            </button>
          </form>

          <p className="budget-note">
            Mock exchange rates: 1 USD = ₹83, 1 EUR = ₹90, 1 GBP = ₹105.
          </p>
        </div>

        <div className="budget-panel">
          <h3>Spending by category</h3>

          {categoryTotals.map((item) => (
            <div className="category-chart-row" key={item.name}>
              <div>
                <span>{item.name}</span>
                <strong>{formatINR(item.total)}</strong>
              </div>
              <div className="progress-track">
                <div
                  className="progress-fill"
                  style={{
                    width: `${Math.min(
                      (item.total / Math.max(budget, totalSpent, 1)) * 100,
                      100
                    )}%`,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
<div className="budget-panel budget-chart-panel">
  <h3>Budget vs actual spending</h3>

  <div className="budget-chart">
    <ResponsiveContainer width="100%" height={300}>
      <BarChart
        data={chartData}
        margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
      >
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="currentColor"
          strokeOpacity={0.15}
        />
        <XAxis dataKey="name" tick={{ fill: "currentColor", fontSize: 12 }} />
        <YAxis tick={{ fill: "currentColor", fontSize: 12 }} />
        <Tooltip formatter={(value) => formatINR(value)} />
        <Legend />
        <Bar dataKey="Budget" fill="#94a3b8" radius={[4, 4, 0, 0]} />
        <Bar dataKey="Actual" fill="#2563eb" radius={[4, 4, 0, 0]}>
          {chartData.map((entry) => (
            <Cell
              key={entry.name}
              fill={entry.Actual > entry.Budget ? "#dc2626" : "#2563eb"}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  </div>

  <h3>Set category budgets (INR)</h3>
  <div className="category-budget-grid">
    {categories.map((name) => (
      <label key={name}>
        <span>{name}</span>
        <input
          type="number"
          min="0"
          value={categoryBudgets[name]}
          onChange={(e) =>
            setCategoryBudgets((current) => ({
              ...current,
              [name]: Math.max(0, Number(e.target.value)),
            }))
          }
        />
      </label>
    ))}
  </div>

  <p className="budget-note">
    Allocated {formatINR(allocated)} of {formatINR(budget)} total budget.
    {allocated > budget && " Category budgets exceed the total budget."}
  </p>
</div>
      <div className="budget-panel expense-list">
        <h3>Expense history</h3>

        {expenses.length === 0 ? (
          <p>No expenses added yet.</p>
        ) : (
          expenses.map((expense) => (
            <div className="expense-row" key={expense.id}>
              <div>
                <strong>{expense.title}</strong>
                <small>{expense.category}</small>
              </div>
              <strong>
                {expense.currency} {expense.amount.toLocaleString()}
              </strong>
              <button
                type="button"
                aria-label={`Delete ${expense.title}`}
                onClick={() =>
                  setExpenses((current) =>
                    current.filter((item) => item.id !== expense.id)
                  )
                }
              >
                <Trash2 size={17} />
              </button>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
