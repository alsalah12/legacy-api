import React, { useMemo, useState } from "react";
import "./BuySell.css";
import AppSidebar from "./components/AppSidebar";
import AppTopBar from "./components/AppTopBar";
import AppContentLayout from "./components/AppContentLayout";
import PageHeader from "./components/PageHeader";
import { formatCurrency, formatPercent, usePortfolioData } from "./services/holdingsData";

const PAGE_SIZE = 4;

function buildTradeState(mode, stock) {
  return {
    mode,
    stock,
    quantity: "1",
    executionPrice: 0,
    quoteWarning: "",
    priceLoading: false,
    submitting: false,
    localError: "",
  };
}

export default function BuySell() {
  const {
    availableStocks,
    ensureLivePrices,
    getExecutionPrice,
    buyStock,
    sellStock,
    totals,
    tradeMessage,
    tradeError,
    clearTradeFeedback,
  } = usePortfolioData();
  const [sectorFilter, setSectorFilter] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [tradeState, setTradeState] = useState(() => buildTradeState(null, null));

  const availableSymbols = useMemo(
    () => availableStocks.map((stock) => stock.symbol).filter(Boolean),
    [availableStocks]
  );
  const availableSymbolsKey = useMemo(() => availableSymbols.join("|"), [availableSymbols]);

  React.useEffect(() => {
    if (!availableSymbolsKey) return;
    ensureLivePrices(availableSymbols, { includeBackendFallback: true });
  }, [availableSymbols, availableSymbolsKey, ensureLivePrices]);

  const closeTradeDialog = React.useCallback(() => {
    setTradeState(buildTradeState(null, null));
  }, []);

  const openTradeDialog = React.useCallback(
    async (mode, stock) => {
      clearTradeFeedback();

      setTradeState({
        ...buildTradeState(mode, stock),
        priceLoading: true,
      });

      const quote = await getExecutionPrice(stock.symbol);

      setTradeState((current) => {
        if (current.stock?.symbol !== stock.symbol || current.mode !== mode) {
          return current;
        }

        return {
          ...current,
          executionPrice: quote.ok ? quote.price : 0,
          quoteWarning: quote.warning || "",
          priceLoading: false,
          localError: quote.ok ? "" : "Execution price is unavailable right now.",
        };
      });
    },
    [clearTradeFeedback, getExecutionPrice]
  );

  const handleTradeQuantityChange = (event) => {
    const nextValue = event.target.value;
    setTradeState((current) => ({
      ...current,
      quantity: nextValue,
      localError: "",
    }));
  };

  const handleTradeSubmit = async (event) => {
    event.preventDefault();

    const stock = tradeState.stock;
    const quantity = Number(tradeState.quantity);
    const totalCost = quantity * tradeState.executionPrice;

    if (!stock) return;

    if (!Number.isInteger(quantity) || quantity <= 0) {
      setTradeState((current) => ({
        ...current,
        localError: "Please enter a whole-share quantity greater than zero.",
      }));
      return;
    }

    if (!Number.isFinite(tradeState.executionPrice) || tradeState.executionPrice <= 0) {
      setTradeState((current) => ({
        ...current,
        localError: "Execution price is unavailable right now.",
      }));
      return;
    }

    if (tradeState.mode === "buy" && totalCost > totals.availableFunds) {
      setTradeState((current) => ({
        ...current,
        localError: "Insufficient available funds for this purchase.",
      }));
      return;
    }

    if (tradeState.mode === "sell" && quantity > Number(stock.quantityOwned || 0)) {
      setTradeState((current) => ({
        ...current,
        localError: "Insufficient owned quantity for this sale.",
      }));
      return;
    }

    setTradeState((current) => ({
      ...current,
      submitting: true,
      localError: "",
    }));

    const result =
      tradeState.mode === "buy"
        ? await buyStock(stock.symbol, quantity, { executionPrice: tradeState.executionPrice })
        : await sellStock(stock.symbol, quantity, { executionPrice: tradeState.executionPrice });

    if (result?.ok) {
      closeTradeDialog();
      return;
    }

    setTradeState((current) => ({
      ...current,
      submitting: false,
    }));
  };

  const sectorOptions = useMemo(() => {
    return ["ALL", ...new Set(availableStocks.map((stock) => stock.sector))];
  }, [availableStocks]);

  const filteredStocks = useMemo(() => {
    let results = [...availableStocks];

    if (sectorFilter !== "ALL") {
      results = results.filter((stock) => stock.sector === sectorFilter);
    }

    if (searchTerm.trim()) {
      const query = searchTerm.toLowerCase();
      results = results.filter(
        (stock) =>
          stock.symbol.toLowerCase().includes(query) ||
          stock.name.toLowerCase().includes(query) ||
          stock.sector.toLowerCase().includes(query)
      );
    }

    return results;
  }, [availableStocks, sectorFilter, searchTerm]);

  const totalPages = Math.max(1, Math.ceil(filteredStocks.length / PAGE_SIZE));

  React.useEffect(() => {
    setCurrentPage((previousPage) => Math.min(previousPage, totalPages));
  }, [totalPages]);

  const paginatedStocks = useMemo(() => {
    const startIndex = (currentPage - 1) * PAGE_SIZE;
    return filteredStocks.slice(startIndex, startIndex + PAGE_SIZE);
  }, [filteredStocks, currentPage]);

  const rangeStart = filteredStocks.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(currentPage * PAGE_SIZE, filteredStocks.length);
  const tradeQuantity = Number(tradeState.quantity);
  const estimatedTotal = Number.isFinite(tradeQuantity) && tradeQuantity > 0
    ? tradeQuantity * tradeState.executionPrice
    : 0;
  const inlineTradeError = tradeState.localError || tradeError;
  const isTradeDialogOpen = Boolean(tradeState.mode && tradeState.stock);
  const tradeActionLabel = tradeState.mode === "sell" ? "Sell" : "Buy";

  return (
    <div className="buy-sell-page">
      <AppTopBar />
      <AppSidebar />
      <AppContentLayout>
        <PageHeader title="Buy & Sell Stocks" />

        <section className="stocks-card">
          <div className="status-stack" aria-live="polite">
            {tradeMessage ? <div className="status-pill status-pill-success">{tradeMessage}</div> : null}
            {inlineTradeError ? <div className="status-pill status-pill-error">{inlineTradeError}</div> : null}
            {tradeState.quoteWarning ? <div className="status-pill status-pill-warning">{tradeState.quoteWarning}</div> : null}
          </div>

          <div className="table-header">
            <h2 className="app-section-title">Available Stocks</h2>
            <span>{filteredStocks.length} results</span>
          </div>

          <div className="controls-row">
            <select value={sectorFilter} onChange={(event) => setSectorFilter(event.target.value)} className="select-input">
              {sectorOptions.map((sector) => (
                <option key={sector} value={sector}>
                  {sector === "ALL" ? "All Sectors" : sector}
                </option>
              ))}
            </select>

            <input
              type="text"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search by ticker, company, or sector"
              className="search-input"
            />

            <button
              type="button"
              className="refresh-button"
              onClick={() =>
                ensureLivePrices(availableStocks.map((stock) => stock.symbol).filter(Boolean), {
                  forceRefresh: true,
                  includeBackendFallback: true,
                })
              }
            >
              Refresh live prices
            </button>
          </div>

          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Stock</th>
                  <th>Bid Price</th>
                  <th>Performance</th>
                  <th>Owned</th>
                  <th>Sector</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {paginatedStocks.map((stock, index) => (
                  <tr key={stock.id || `${stock.symbol}-${index}`}>
                    <td>{(currentPage - 1) * PAGE_SIZE + index + 1}</td>
                    <td>
                      <div className="stock-cell">
                        <strong>{stock.symbol}</strong>
                        <span>{stock.name}</span>
                      </div>
                    </td>
                    <td>{formatCurrency(stock.currentBidPrice)}</td>
                    <td>
                      <span className={stock.profitLossPercent > 0 ? "positive-text" : stock.profitLossPercent < 0 ? "negative-text" : ""}>
                        {formatPercent(stock.profitLossPercent)}
                      </span>
                    </td>
                    <td>{stock.quantityOwned}</td>
                    <td>{stock.sector}</td>
                    <td>
                      <div className="action-group">
                        <button
                          type="button"
                          className="action-button buy-button"
                          onClick={() => openTradeDialog("buy", stock)}
                        >
                          Buy
                        </button>
                        <button
                          type="button"
                          className="action-button sell-button"
                          disabled={stock.quantityOwned === 0}
                          onClick={() => openTradeDialog("sell", stock)}
                        >
                          Sell
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {paginatedStocks.length === 0 && (
                  <tr>
                    <td colSpan="7" className="empty-state">
                      No stocks match your current filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="table-footer">
            <span className="table-count">
              {rangeStart}–{rangeEnd} of {filteredStocks.length}
            </span>

            <div className="pagination-controls">
              <button
                type="button"
                className="pagination-button"
                onClick={() => setCurrentPage((page) => Math.max(page - 1, 1))}
                disabled={currentPage === 1}
              >
                Previous
              </button>
              <span className="page-indicator">
                Page {currentPage} of {totalPages}
              </span>
              <button
                type="button"
                className="pagination-button"
                onClick={() => setCurrentPage((page) => Math.min(page + 1, totalPages))}
                disabled={currentPage === totalPages}
              >
                Next
              </button>
            </div>
          </div>
        </section>

        {isTradeDialogOpen ? (
          <div className="trade-modal-backdrop" onClick={closeTradeDialog}>
            <div
              className="trade-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="trade-dialog-title"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="trade-modal-header">
                <div>
                  <h2 id="trade-dialog-title">{tradeActionLabel} {tradeState.stock.symbol}</h2>
                  <p>{tradeState.stock.name}</p>
                </div>
                <button type="button" className="trade-modal-close" onClick={closeTradeDialog}>
                  ×
                </button>
              </div>

              <form className="trade-modal-form" onSubmit={handleTradeSubmit}>
                <label className="trade-modal-field">
                  <span>Quantity</span>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={tradeState.quantity}
                    onChange={handleTradeQuantityChange}
                    disabled={tradeState.submitting || tradeState.priceLoading}
                  />
                </label>

                <div className="trade-summary-card">
                  <div>
                    <span>Execution Price</span>
                    <strong>
                      {tradeState.priceLoading ? "Loading..." : formatCurrency(tradeState.executionPrice)}
                    </strong>
                  </div>
                  <div>
                    <span>Estimated Total</span>
                    <strong>{formatCurrency(estimatedTotal)}</strong>
                  </div>
                  <div>
                    <span>{tradeState.mode === "buy" ? "Available Funds" : "Quantity Owned"}</span>
                    <strong>
                      {tradeState.mode === "buy"
                        ? formatCurrency(totals.availableFunds)
                        : Number(tradeState.stock.quantityOwned || 0)}
                    </strong>
                  </div>
                </div>

                {inlineTradeError ? <div className="trade-inline-error">{inlineTradeError}</div> : null}

                <div className="trade-modal-actions">
                  <button type="button" className="trade-modal-secondary" onClick={closeTradeDialog}>
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className={`trade-modal-primary ${tradeState.mode === "sell" ? "sell" : "buy"}`}
                    disabled={tradeState.submitting || tradeState.priceLoading}
                  >
                    {tradeState.submitting ? `${tradeActionLabel}ing...` : `${tradeActionLabel} Stock`}
                  </button>
                </div>
              </form>
            </div>
          </div>
        ) : null}
      </AppContentLayout>
    </div>
  );
}
