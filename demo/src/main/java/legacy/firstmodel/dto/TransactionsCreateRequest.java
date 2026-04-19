package legacy.firstmodel.dto;

import java.math.BigDecimal;

public class TransactionsCreateRequest {
    private String companyName;
    private String symbol;
    private BigDecimal stockPrice;
    private Integer quantity;
    private BigDecimal totalPrice;
    private String transactionType;

    public TransactionsCreateRequest() {}

    public String getCompanyName() { return companyName; }
    public void setCompanyName(String companyName) { this.companyName = companyName; }

    public String getSymbol() { return symbol; }
    public void setSymbol(String symbol) { this.symbol = symbol; }

    public BigDecimal getStockPrice() { return stockPrice; }
    public void setStockPrice(BigDecimal stockPrice) { this.stockPrice = stockPrice; }

    public Integer getQuantity() { return quantity; }
    public void setQuantity(Integer quantity) { this.quantity = quantity; }

    public BigDecimal getTotalPrice() { return totalPrice; }
    public void setTotalPrice(BigDecimal totalPrice) { this.totalPrice = totalPrice; }

    public String getTransactionType() { return transactionType; }
    public void setTransactionType(String transactionType) { this.transactionType = transactionType; }
}