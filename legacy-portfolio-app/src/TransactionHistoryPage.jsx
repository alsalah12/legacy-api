import React, { useMemo, useState } from "react";
import "./TransactionHistoryPage.css";
import AppSidebar from "./components/AppSidebar";
import AppTopBar from "./components/AppTopBar";
import AppContentLayout from "./components/AppContentLayout";
import PageHeader from "./components/PageHeader";
import { formatCurrency, usePortfolioData } from "./services/holdingsData";

function parseTransactionTimestamp(dateString, timeString = "00:00") {
	const [day, month, year] = String(dateString || "").split("/").map(Number);
	const [hours, minutes] = String(timeString || "00:00").split(":").map(Number);

	if (!day || !month || !year) return 0;
	return new Date(year, month - 1, day, hours || 0, minutes || 0).getTime();
}

function formatDate(dateString) {
	if (!dateString) return "N/A";
	return dateString;
}

function formatTime(timeString) {
	if (!timeString) return "--:--";
	return timeString;
}

// This page shows a searchable, filterable transaction history table.
export default function TransactionHistoryPage() {
	const { transactions: transactionsToUse } = usePortfolioData();
	const [searchTerm, setSearchTerm] = useState("");
	const [typeFilter, setTypeFilter] = useState("ALL");
	const [statusFilter, setStatusFilter] = useState("ALL");
	const [sortOrder, setSortOrder] = useState("MOST_RECENT");

	// The backend transactions table is the source of truth for every row on this screen.
	const filteredTransactions = useMemo(() => {
		// Start with a copy so sorting/filtering does not mutate the original array.
		let results = [...transactionsToUse];

		// Search matches against ticker, company, or sector text.
		if (searchTerm.trim()) {
			const lower = searchTerm.toLowerCase();
			results = results.filter(
				(transaction) =>
					transaction.symbol.toLowerCase().includes(lower) ||
					transaction.companyName.toLowerCase().includes(lower) ||
					transaction.sector.toLowerCase().includes(lower)
			);
		}

		// Type filter narrows the list to BUY or SELL records.
		if (typeFilter !== "ALL") {
			results = results.filter((transaction) => transaction.transactionType === typeFilter);
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
				return parseTransactionTimestamp(b.date, b.time) - parseTransactionTimestamp(a.date, a.time);
			}

			if (sortOrder === "OLDEST") {
				return parseTransactionTimestamp(a.date, a.time) - parseTransactionTimestamp(b.date, b.time);
			}

			if (sortOrder === "HIGHEST_VALUE") {
				return b.totalPrice - a.totalPrice;
			}

			if (sortOrder === "LOWEST_VALUE") {
				return a.totalPrice - b.totalPrice;
			}

			return 0;
		});

		return results;
	}, [searchTerm, typeFilter, statusFilter, sortOrder, transactionsToUse]);

	// Analytics values are derived once from the API data because the base data is static.
	const analytics = useMemo(() => {
		// Split the data into buys and sells for separate totals.
		const buys = transactionsToUse.filter((transaction) => transaction.transactionType === "BUY");
		const sells = transactionsToUse.filter((transaction) => transaction.transactionType === "SELL");

		// Add up the value of each buy and sell set.
		const totalBought = buys.reduce((sum, transaction) => sum + transaction.totalPrice, 0);
		const totalSold = sells.reduce((sum, transaction) => sum + transaction.totalPrice, 0);

		// Count how many transactions belong to each sector.
		const sectorCounts = transactionsToUse.reduce((accumulator, transaction) => {
			accumulator[transaction.sector] =
				(accumulator[transaction.sector] || 0) + 1;
			return accumulator;
		}, {});

		// Pick the sector with the highest count, or fall back to N/A.
		const mostActiveSector =
			Object.entries(sectorCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "N/A";

		// Count how many times each stock ticker appears.
		const stockCounts = transactionsToUse.reduce((accumulator, transaction) => {
			accumulator[transaction.symbol] =
				(accumulator[transaction.symbol] || 0) + 1;
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
	}, [transactionsToUse]);

	return (
		// Main two-column page wrapper.
		<div className="transaction-page">
			{/* Sticky top bar shared across authenticated pages. */}
			<AppTopBar />

			{/* Shared sidebar keeps navigation identical on every page. */}
			<AppSidebar />

			{/* Right content column that contains the header, filters, table, and insights. */}
			<AppContentLayout>
				<PageHeader title="Transaction History" />

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
							<h2 className="app-section-title">Transactions</h2>
							<span>{filteredTransactions.length} results</span>
						</div>

						<div className="table-wrapper">
							<table>
								<thead>
									<tr>
										<th>Date / Time</th>
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
											<td>
												<div className="date-time-cell">
													<strong>{formatDate(transaction.date)}</strong>
													<span>{formatTime(transaction.time)}</span>
												</div>
											</td>
											<td>
												<div className="stock-cell">
													<strong>{transaction.symbol}</strong>
													<span>{transaction.companyName}</span>
												</div>
											</td>
											<td>
												<span
													className={`pill ${
														transaction.transactionType === "BUY" ? "pill-buy" : "pill-sell"
													}`}
												>
													{transaction.transactionType}
												</span>
											</td>
											<td>{formatCurrency(transaction.stockPrice)}</td>
											<td>{transaction.quantity}</td>
											<td
												className={
													transaction.transactionType === "BUY" ? "negative-text" : "positive-text"
												}
											>
												{transaction.transactionType === "BUY" ? "-" : "+"}
												{formatCurrency(transaction.totalPrice)}
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
							<h2 className="app-section-title">Investment Insights</h2>
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
			</AppContentLayout>
		</div>
	);
}
