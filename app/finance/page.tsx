"use client";
import { useState, useEffect } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";
import { Plus, Trash2, DollarSign, TrendingUp, TrendingDown, Receipt } from "lucide-react";

interface Transaction {
  id: string;
  type: "income" | "expense";
  category: string;
  description: string;
  amount: number;
  date: string;
}

const initialTransactions: Transaction[] = [
  { id: "1", type: "income", category: "Crop Sale", description: "Wheat sale – 120 quintals", amount: 72000, date: "2026-03-14" },
  { id: "2", type: "income", category: "Government Subsidy", description: "PM KISAN instalment", amount: 72600, date: "2026-03-14" },
  { id: "3", type: "income", category: "Crop Sale", description: "Vegetable – tomato 150kg", amount: 73200, date: "2026-03-13" },
  { id: "4", type: "expense", category: "Labour", description: "Harvesting labour charges", amount: 91100, date: "2026-03-12" },
  { id: "5", type: "expense", category: "Fertiliser", description: "Urea + DAP purchase", amount: 92600, date: "2026-03-10" },
  { id: "6", type: "expense", category: "Irrigation", description: "Diesel for pump", amount: 91800, date: "2026-03-09" },
  { id: "7", type: "expense", category: "Seeds", description: "Hybrid paddy seeds", amount: 91300, date: "2026-03-08" },
  { id: "8", type: "expense", category: "Pesticide", description: "Fungicide spray", amount: 900, date: "2026-03-07" },
  { id: "9", type: "expense", category: "Equipment", description: "Tractor rental", amount: 91550, date: "2026-03-06" },
];

const incomeCategories = ["Crop Sale", "Government Subsidy", "Livestock", "Rental", "Other"];
const expenseCategories = ["Labour", "Fertiliser", "Seeds", "Pesticide", "Irrigation", "Equipment", "Transport", "Other"];

function CountUp({ end, prefix = "" }: { end: number; prefix?: string }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let start = 0;
    const step = Math.max(1, end / 50);
    const timer = setInterval(() => {
      start += step;
      if (start >= end) { setCount(end); clearInterval(timer); }
      else setCount(Math.floor(start));
    }, 20);
    return () => clearInterval(timer);
  }, [end]);
  return <span>{prefix}{count.toLocaleString("en-IN")}</span>;
}

export default function FinancePage() {
  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions);
  const [tab, setTab] = useState<"all" | "income" | "expense">("all");
  const [form, setForm] = useState({
    type: "expense" as "income" | "expense",
    category: "",
    description: "",
    amount: "",
    date: new Date().toISOString().split("T")[0],
  });
  const [showForm, setShowForm] = useState(false);
  const [toast, setToast] = useState("");

  const totalIncome = transactions.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0) / 1000;
  const totalExpense = transactions.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0) / 1000;
  const netProfit = totalIncome - totalExpense;

  // Expense breakdown by category
  const expenseByCategory: Record<string, number> = {};
  transactions.filter(t => t.type === "expense").forEach(t => {
    expenseByCategory[t.category] = (expenseByCategory[t.category] || 0) + t.amount;
  });
  const chartData = Object.entries(expenseByCategory)
    .sort((a, b) => b[1] - a[1])
    .map(([name, value]) => ({ name, value }));

  const filtered = transactions.filter(t => tab === "all" || t.type === tab);

  function addTransaction() {
    if (!form.category || !form.amount || !form.date) {
      setToast("Please fill all required fields");
      setTimeout(() => setToast(""), 3000);
      return;
    }
    const newTx: Transaction = {
      id: Date.now().toString(),
      type: form.type,
      category: form.category,
      description: form.description,
      amount: parseFloat(form.amount),
      date: form.date,
    };
    setTransactions(prev => [newTx, ...prev]);
    setForm({ type: "expense", category: "", description: "", amount: "", date: new Date().toISOString().split("T")[0] });
    setShowForm(false);
    setToast("Transaction added successfully!");
    setTimeout(() => setToast(""), 3000);
  }

  function deleteTransaction(id: string) {
    setTransactions(prev => prev.filter(t => t.id !== id));
  }

  const categories = form.type === "income" ? incomeCategories : expenseCategories;

  return (
    <div>
      {/* Toast */}
      {toast && (
        <div style={{
          position: "fixed", top: 20, right: 20, zIndex: 1000,
          background: "#16a34a", color: "white", padding: "10px 18px",
          borderRadius: 8, fontSize: 13, fontWeight: 500,
          boxShadow: "0 4px 12px rgba(0,0,0,0.15)"
        }}>{toast}</div>
      )}

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 20 }}>💰</span>
            <div className="page-title" style={{ marginBottom: 2 }}>Farm Finance Tracker</div>
          </div>
          <div className="page-subtitle" style={{ marginBottom: 0 }}>Track your farming expenses and income to maximise profit</div>
        </div>
        <button className="btn btn-green" onClick={() => setShowForm(!showForm)}>
          <Plus size={14} />
          {showForm ? "Close" : "Add Transaction"}
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid-4" style={{ marginBottom: 20 }}>
        <div className="card-sm">
          <div className="stat-label">Total Income</div>
          <div className="stat-value stat-positive">₹<CountUp end={Math.round(totalIncome * 1000)} /></div>
        </div>
        <div className="card-sm">
          <div className="stat-label">Total Expenses</div>
          <div className="stat-value stat-negative">₹<CountUp end={Math.round(totalExpense * 1000)} /></div>
        </div>
        <div className="card-sm">
          <div className="stat-label">Net Profit/Loss</div>
          <div className={`stat-value ${netProfit >= 0 ? "stat-positive" : "stat-negative"}`}>
            {netProfit >= 0 ? "+" : ""}₹<CountUp end={Math.abs(Math.round(netProfit * 1000))} />
          </div>
        </div>
        <div className="card-sm">
          <div className="stat-label">Total Entries</div>
          <div className="stat-value"><CountUp end={transactions.length} /></div>
        </div>
      </div>

      {/* Add Transaction Form */}
      {showForm && (
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="section-title">New Transaction</div>
          <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
            <button
              className={`btn ${form.type === "expense" ? "btn-red" : "btn-outline"}`}
              style={{ minWidth: 90 }}
              onClick={() => setForm(f => ({ ...f, type: "expense", category: "" }))}
            >
              💸 Expense
            </button>
            <button
              className={`btn ${form.type === "income" ? "btn-green" : "btn-outline"}`}
              style={{ minWidth: 90 }}
              onClick={() => setForm(f => ({ ...f, type: "income", category: "" }))}
            >
              💵 Income
            </button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 12 }}>
            <div>
              <label className="form-label">Category *</label>
              <select className="form-select" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                <option value="">Select category...</option>
                {categories.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Amount (₹) *</label>
              <input
                className="form-input"
                type="number"
                placeholder="e.g. 1500"
                value={form.amount}
                onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
              />
            </div>
            <div>
              <label className="form-label">Date *</label>
              <input
                className="form-input"
                type="date"
                value={form.date}
                onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
              />
            </div>
          </div>
          <div style={{ marginBottom: 16 }}>
            <label className="form-label">Description</label>
            <input
              className="form-input"
              placeholder="e.g. Urea fertiliser 50kg"
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            />
          </div>
          <button className="btn btn-green" onClick={addTransaction}>
            ✓ Save Transaction
          </button>
        </div>
      )}

      {/* Expense Breakdown Chart */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="section-title">Expense Breakdown by Category</div>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={chartData} layout="vertical" margin={{ left: 10, right: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
            <XAxis type="number" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false}
              tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
            <YAxis type="category" dataKey="name" tick={{ fontSize: 12, fill: "#374151" }} axisLine={false} tickLine={false} width={80} />
            <Tooltip contentStyle={{ borderRadius: 8, border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)", fontSize: 12 }}
              formatter={(v: number) => [`₹${v.toLocaleString("en-IN")}`, "Amount"]} />
            <Bar dataKey="value" fill="#ef4444" radius={[0, 4, 4, 0]} maxBarSize={20} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Transaction History */}
      <div className="card">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <div className="section-title" style={{ marginBottom: 0 }}>Transaction History</div>
          <div className="toggle-group">
            {(["all","income","expense"] as const).map(t => (
              <button key={t} className={`toggle-btn ${tab === t ? "active" : ""}`} onClick={() => setTab(t)}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <table className="table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Type</th>
              <th>Category</th>
              <th>Description</th>
              <th>Amount</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(tx => (
              <tr key={tx.id}>
                <td style={{ color: "#6b7280" }}>{tx.date}</td>
                <td>
                  <span className={`badge ${tx.type === "income" ? "badge-green" : "badge-red"}`}>
                    {tx.type.toUpperCase()}
                  </span>
                </td>
                <td>{tx.category}</td>
                <td style={{ color: "#6b7280" }}>{tx.description || "—"}</td>
                <td style={{ fontWeight: 600, color: tx.type === "income" ? "#16a34a" : "#dc2626" }}>
                  {tx.type === "income" ? "+" : "-"}₹{tx.amount.toLocaleString("en-IN")}
                </td>
                <td>
                  <button
                    onClick={() => deleteTransaction(tx.id)}
                    style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af" }}
                  >
                    <Trash2 size={14} />
                  </button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={6} style={{ textAlign: "center", color: "#9ca3af", padding: 24 }}>No transactions found</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
