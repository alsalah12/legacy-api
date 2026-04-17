import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./TransactionHistoryPage.css";

const mockTransactions = [
{
id: 1,
date: "2025-03-01",
ticker: "GOOGL",
company: "Google",
type: "BUY",
pricePerShare: 200,
quantity: 3,
totalValue: 600,
sector: "Tech",
status: "Completed",
},
{
id: 2,
date: "2025-03-11",
ticker: "AAPL",
company: "Apple",
type: "SELL",
pricePerShare: 190,
quantity: 1,
totalValue: 190,
sector: "Tech",
status: "Completed",
},
{
id: 3,
date: "2025-03-14",
ticker: "AAPL",
company: "Apple",
type: "BUY",
pricePerShare: 185,
quantity: 5,
totalValue: 925,
sector: "Tech",
status: "Pending",
},
{
id: 4,
date: "2025-03-21",
ticker: "NVDA",
company: "NVIDIA",
type: "BUY",
pricePerShare: 300,
quantity: 2,
totalValue: 600,
sector: "Tech",
status: "Completed",
},
{
id: 5,
date: "2025-03-25",
ticker: "TSLA",
company: "Tesla",
type: "SELL",
pricePerShare: 210,
quantity: 2,
totalValue: 420,
sector: "Auto",
status: "Completed",
},
];

function formatCurrency(value) {
return new Intl.NumberFormat("en-GB", {
style: "currency",
currency: "USD",
maximumFractionDigits: 0,
}).format(value);
}

function formatDate(dateString) {
return new Date(dateString).toLocaleDateString("en-GB");
}

export default function TransactionHistoryPage() {
const navigate = useNavigate();
const [searchTerm, setSearchTerm] = useState("");
const [typeFilter, setTypeFilter] = useState("ALL");
const [statusFilter, setStatusFilter] = useState("ALL");
const [sortOrder, setSortOrder] = useState("MOST_RECENT");

const filteredTransactions = useMemo(() => {
let results = [...mockTransactions];

if (searchTerm.trim()) {
const lower = searchTerm.toLowerCase();
results = results.filter(
(transaction) =>
transaction.ticker.toLowerCase().includes(lower) ||
transaction.company.toLowerCase().includes(lower) ||
transaction.sector.toLowerCase().includes(lower)
);
}

if (typeFilter !== "ALL") {
results = results.filter((transaction) => transaction.type === typeFilter);
}

if (statusFilter !== "ALL") {
results = results.filter(
(transaction) => transaction.status === statusFilter
);
}

results.sort((a, b) => {
if (sortOrder === "MOST_RECENT") {
return new Date(b.date) - new Date(a.date);
}
if (sortOrder === "OLDEST") {
return new Date(a.date) - new Date(b.date);
}
if (sortOrder === "HIGHEST_VALUE") {
return b.totalValue - a.totalValue;
}
if (sortOrder === "LOWEST_VALUE") {
return a.totalValue - b.totalValue;
}
return 0;
});

return results;
}, [searchTerm, typeFilter, statusFilter, sortOrder]);

const analytics = useMemo(() => {
const buys = mockTransactions.filter((t) => t.type === "BUY");
const sells = mockTransactions.filter((t) => t.type === "SELL");

const totalBought = buys.reduce((sum, t) => sum + t.totalValue, 0);
const totalSold = sells.reduce((sum, t) => sum + t.totalValue, 0);

const sectorCounts = mockTransactions.reduce((acc, transaction) => {
acc[transaction.sector] = (acc[transaction.sector] || 0) + 1;
return acc;
}, {});

const mostActiveSector =
Object.entries(sectorCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "N/A";

const stockCounts = mockTransactions.reduce((acc, transaction) => {
acc[transaction.ticker] = (acc[transaction.ticker] || 0) + 1;
return acc;
}, {});

const mostTradedStock =
Object.entries(stockCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "N/A";

return {
totalBought,
totalSold,
mostActiveSector,
mostTradedStock,
};
}, []);

return (
<div className="transaction-page">
<aside className="sidebar">
<div className="brand">LEGACY</div>

<nav className="sidebar-nav">
<button type="button" className="nav-item" onClick={() => navigate("/dashboard")}>Dashboard</button>
<button type="button" className="nav-item">Performance</button>
<button type="button" className="nav-item">Buy & Sell</button>
<button type="button" className="nav-item active">Transaction History</button>
</nav>
</aside>

<main className="main-content">
<header className="topbar">
<div>
<h1>Transaction History</h1>
<p className="subtitle">Review your buys, sells, and pending orders</p>
</div>

<div className="balance-card">
<span className="balance-label">Balance</span>
<strong>$1bn ADA</strong>
</div>
</header>

<section className="controls-card">
<div className="controls-row">
<input
type="text"
placeholder="Search by ticker, company, or sector"
value={searchTerm}
onChange={(e) => setSearchTerm(e.target.value)}
className="search-input"
/>

<select
value={typeFilter}
onChange={(e) => setTypeFilter(e.target.value)}
className="select-input"
>
<option value="ALL">All Types</option>
<option value="BUY">Buy</option>
<option value="SELL">Sell</option>
</select>

<select
value={statusFilter}
onChange={(e) => setStatusFilter(e.target.value)}
className="select-input"
>
<option value="ALL">All Statuses</option>
<option value="Completed">Completed</option>
<option value="Pending">Pending</option>
</select>

<select
value={sortOrder}
onChange={(e) => setSortOrder(e.target.value)}
className="select-input"
>
<option value="MOST_RECENT">Most Recent</option>
<option value="OLDEST">Oldest</option>
<option value="HIGHEST_VALUE">Highest Value</option>
<option value="LOWEST_VALUE">Lowest Value</option>
</select>
</div>
</section>

<div className="content-grid">
<section className="table-card">
<div className="table-header">
<h2>Transactions</h2>
<span>{filteredTransactions.length} results</span>
</div>

<div className="table-wrapper">
<table>
<thead>
<tr>
<th>Date</th>
<th>Stock</th>
<th>Type</th>
<th>Price / Share</th>
<th>Quantity</th>
<th>Total Value</th>
<th>Sector</th>
<th>Status</th>
</tr>
</thead>
<tbody>
{filteredTransactions.map((transaction) => (
<tr key={transaction.id}>
<td>{formatDate(transaction.date)}</td>
<td>
<div className="stock-cell">
<strong>{transaction.ticker}</strong>
<span>{transaction.company}</span>
</div>
</td>
<td>
<span
className={`pill ${
transaction.type === "BUY" ? "pill-buy" : "pill-sell"
}`}
>
{transaction.type}
</span>
</td>
<td>{formatCurrency(transaction.pricePerShare)}</td>
<td>{transaction.quantity}</td>
<td
className={
transaction.type === "BUY" ? "positive-text" : "negative-text"
}
>
{transaction.type === "BUY" ? "+" : "-"}
{formatCurrency(transaction.totalValue)}
</td>
<td>{transaction.sector}</td>
<td>
<span
className={`pill ${
transaction.status === "Completed"
? "pill-completed"
: "pill-pending"
}`}
>
{transaction.status}
</span>
</td>
</tr>
))}

{filteredTransactions.length === 0 && (
<tr>
<td colSpan="8" className="empty-state">
No transactions match your filters.
</td>
</tr>
)}
</tbody>
</table>
</div>
</section>

<aside className="analytics-card">
<h2>Investment Insights</h2>

<div className="insight-block">
<span className="insight-label">Total bought</span>
<strong>{formatCurrency(analytics.totalBought)}</strong>
</div>

<div className="insight-block">
<span className="insight-label">Total sold</span>
<strong>{formatCurrency(analytics.totalSold)}</strong>
</div>

<div className="insight-block">
<span className="insight-label">Most active sector</span>
<strong>{analytics.mostActiveSector}</strong>
</div>

<div className="insight-block">
<span className="insight-label">Most traded stock</span>
<strong>{analytics.mostTradedStock}</strong>
</div>
</aside>
</div>
</main>
</div>
);
}