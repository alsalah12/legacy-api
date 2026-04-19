// package legacy.firstmodel.dto;

// import java.math.BigDecimal;

// public class HoldingsCreateRequest1 {
//     private String companyName;
//     private String symbol;
//     private Integer quantityOwned;
//     private BigDecimal bidPrice;
//     private BigDecimal totalValue;
//     private BigDecimal totalInvested;
//     private BigDecimal profitLoss;
//     private BigDecimal profitPercentageChange;

//     // Constructors, getters, setters
//     public HoldingsCreateRequest() {}

//     // public HoldingsCreateRequest(String companyName, String symbol, Integer quantityOwned, BigDecimal bidPrice,
//     //                              BigDecimal totalValue, BigDecimal totalInvested, BigDecimal profitLoss, BigDecimal profitPercentageChange) {
//     //     this.companyName = companyName;
//     //     this.symbol = symbol;
//     //     this.quantityOwned = quantityOwned;
//     //     this.bidPrice = bidPrice;
//     //     this.totalValue = totalValue;
//     //     this.totalInvested = totalInvested;
//     //     this.profitLoss = profitLoss;
//     //     this.profitPercentageChange = profitPercentageChange;
//     // }
//     public HoldingsCreateRequest(String symbol, BigDecimal bidPrice, Integer quantityOwned) {
//         this.symbol = symbol;
//         this.bidPrice = bidPrice; 
//         this.quantityOwned = quantityOwned;
//         this.companyName = null;
//         this.totalValue = null;
//         this.totalInvested = null;
//         this.profitLoss = null;
//         this.profitPercentageChange = null;
//     }
//     public String getCompanyName() { return companyName; }
//     public void setCompanyName(String companyName) { this.companyName = companyName; }

//     public String getSymbol() { return symbol; }
//     public void setSymbol(String symbol) { this.symbol = symbol; }

//     public Integer getQuantityOwned() { return quantityOwned; }
//     public void setQuantityOwned(Integer quantityOwned) { this.quantityOwned = quantityOwned; }

//     public BigDecimal getBidPrice() { return bidPrice; }
//     public void setBidPrice(BigDecimal bidPrice) { this.bidPrice = bidPrice; }

//     public BigDecimal getTotalValue() { return totalValue; }
//     public void setTotalValue(BigDecimal totalValue) { this.totalValue = totalValue; }

//     public BigDecimal getTotalInvested() { return totalInvested; }
//     public void setTotalInvested(BigDecimal totalInvested) { this.totalInvested = totalInvested; }

//     public BigDecimal getProfitLoss() { return profitLoss; }
//     public void setProfitLoss(BigDecimal profitLoss) { this.profitLoss = profitLoss; }

//     public BigDecimal getProfitPercentageChange() { return profitPercentageChange; }
//     public void setProfitPercentageChange(BigDecimal profitPercentageChange) { this.profitPercentageChange = profitPercentageChange; }
// }