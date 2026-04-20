// React hooks power the page state and memoised calculations.
import React, { useMemo, useState } from "react";
// Page-specific styles for the transaction history screen.
import "./TransactionHistoryPage.css";
import AppSidebar from "./components/AppSidebar";
import AppTopBar from "./components/AppTopBar";

// Static sample transaction data used to populate the table.
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

// Helper to show currency values in a readable format.
function formatCurrency(value) {
	return new Intl.NumberFormat("en-GB", {
		style: "currency",
		currency: "USD",
		maximumFractionDigits: 0,
	}).format(value);
}

// Helper to convert an ISO-style date string into a UK display date.
function formatDate(dateString) {
	return new Date(dateString).toLocaleDateString("en-GB");
}

// This page shows a searchable, filterable transaction history table.
export default function TransactionHistoryPage() {
	// Each piece of state stores one active filter value from the controls panel.
	const [searchTerm, setSearchTerm] = useState("");
	const [typeFilter, setTypeFilter] = useState("ALL");
	const [statusFilter, setStatusFilter] = useState("ALL");
	const [sortOrder, setSortOrder] = useState("MOST_RECENT");

	// useMemo recalculates only when the relevant filters change.
	const filteredTransactions = useMemo(() => {
		// Start with a copy so sorting/filtering does not mutate the original array.
		let results = [...mockTransactions];

		// Search matches against ticker, company, or sector text.
		if (searchTerm.trim()) {
			const lower = searchTerm.toLowerCase();
			results = results.filter(
				(transaction) =>
					transaction.ticker.toLowerCase().includes(lower) ||
					transaction.company.toLowerCase().includes(lower) ||
					transaction.sector.toLowerCase().includes(lower)
			);
		}

		// Type filter narrows the list to BUY or SELL records.
		if (typeFilter !== "ALL") {
			results = results.filter((transaction) => transaction.type === typeFilter);
		}

		// Status filter narrows the list to Completed or Pending records.
		if (statusFilter !== "ALL") {
			results = results.filter(
				(transaction) => transaction.status === statusFilter
			);
		}

		// Sorting changes the order the rows appear in the table.
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

	// Analytics values are derived once from the mock data because the base data is static.
	const analytics = useMemo(() => {
		// Split the data into buys and sells for separate totals.
		const buys = mockTransactions.filter((transaction) => transaction.type === "BUY");
		const sells = mockTransactions.filter((transaction) => transaction.type === "SELL");

		// Add up the value of each buy and sell set.
		const totalBought = buys.reduce((sum, transaction) => sum + transaction.totalValue, 0);
		const totalSold = sells.reduce((sum, transaction) => sum + transaction.totalValue, 0);

		// Count how many transactions belong to each sector.
		const sectorCounts = mockTransactions.reduce((accumulator, transaction) => {
			accumulator[transaction.sector] =
				(accumulator[transaction.sector] || 0) + 1;
			return accumulator;
		}, {});

		// Pick the sector with the highest count, or fall back to N/A.
		const mostActiveSector =
			Object.entries(sectorCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "N/A";

		// Count how many times each stock ticker appears.
		const stockCounts = mockTransactions.reduce((accumulator, transaction) => {
			accumulator[transaction.ticker] =
				(accumulator[transaction.ticker] || 0) + 1;
			return accumulator;
		}, {});

		// Pick the most frequently traded stock.
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
		// Main two-column page wrapper.
		<div className="transaction-page">
			{/* Sticky top bar shared across authenticated pages. */}
			<AppTopBar />

			{/* Shared sidebar keeps navigation identical on every page. */}
			<AppSidebar />

			{/* Right content column that contains the header, filters, table, and insights. */}
			<main className="main-content app-page-main">
				<header className="topbar">
					<div>
						<h1>Transaction History</h1>
					</div>
				</header>

				{/* Filter controls update React state, which then recalculates filteredTransactions. */}
				<section className="controls-card">
					<div className="controls-row">
						<input
							type="text"
							placeholder="Search by ticker, company, or sector"
							value={searchTerm}
							onChange={(event) => setSearchTerm(event.target.value)}
							className="search-input"
						/>

						<select
							value={typeFilter}
							onChange={(event) => setTypeFilter(event.target.value)}
							className="select-input"
						>
							<option value="ALL">All Types</option>
							<option value="BUY">Buy</option>
							<option value="SELL">Sell</option>
						</select>

						<select
							value={statusFilter}
							onChange={(event) => setStatusFilter(event.target.value)}
							className="select-input"
						>
							<option value="ALL">All Statuses</option>
							<option value="Completed">Completed</option>
							<option value="Pending">Pending</option>
						</select>

						<select
							value={sortOrder}
							onChange={(event) => setSortOrder(event.target.value)}
							className="select-input"
						>
							<option value="MOST_RECENT">Most Recent</option>
							<option value="OLDEST">Oldest</option>
							<option value="HIGHEST_VALUE">Highest Value</option>
							<option value="LOWEST_VALUE">Lowest Value</option>
						</select>
					</div>
				</section>

				{/* Main content splits into the table area and a smaller insights card. */}
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
									{/* One row is rendered for every transaction left after filtering. */}
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
													transaction.type === "BUY" ? "negative-text" : "positive-text"
												}
											>
												{transaction.type === "BUY" ? "-" : "+"}
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

									{/* Fallback row shown when no data matches the chosen filters. */}
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

					{/* Right-hand card showing summary insights derived from the full dataset. */}
					<aside className="analytics-card">
						<div className="analytics-header">
							<h2>Investment Insights</h2>
							<span className="analytics-range">Last 30 days</span>
						</div>

						<div className="insight-grid">
							<div className="insight-block">
								<span className="insight-label">Total bought</span>
								<strong className="insight-value negative-text">{formatCurrency(analytics.totalBought)}</strong>
							</div>

							<div className="insight-block">
								<span className="insight-label">Total sold</span>
								<strong className="insight-value positive-text">{formatCurrency(analytics.totalSold)}</strong>
							</div>

							<div className="insight-block">
								<span className="insight-label">Most active sector</span>
								<strong className="insight-value">{analytics.mostActiveSector}</strong>
							</div>

							<div className="insight-block">
								<span className="insight-label">Most traded stock</span>
								<strong className="insight-value">{analytics.mostTradedStock}</strong>
							</div>
						</div>

						<button type="button" className="analytics-footer-link">
							View all reports ...
						</button>
					</aside>
				</div>
			</main>
		</div>
	);
}