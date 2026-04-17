package legacy.firstmodel.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class TransactionsResponse {
    private Long id;
    private LocalDateTime dateTime;
    private String companyName;
    private String symbol;
    private BigDecimal stockPrice;
    private Integer quantity;
    private BigDecimal totalPrice;
    private String transactionType;

    // Constructors, getters, setters
    public TransactionsResponse() {}

    public TransactionsResponse(Long id, LocalDateTime dateTime, String companyName, String symbol,
                                BigDecimal stockPrice, Integer quantity, BigDecimal totalPrice, String transactionType) {
        this.id = id;
        this.dateTime = dateTime;
        this.companyName = companyName;
        this.symbol = symbol;
        this.stockPrice = stockPrice;
        this.quantity = quantity;
        this.totalPrice = totalPrice;
        this.transactionType = transactionType;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public LocalDateTime getDateTime() { return dateTime; }
    public void setDateTime(LocalDateTime dateTime) { this.dateTime = dateTime; }

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