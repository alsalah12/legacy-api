package legacy.firstmodel.model;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "transactions")
public class Transactions {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "date_time", nullable = false)
    private LocalDateTime dateTime;

    @Column(name = "company_name", nullable = false)
    private String companyName;

    @Column(name = "symbol", nullable = false)
    private String symbol;

    @Column(name = "stock_price", nullable = false)
    private BigDecimal stockPrice;

    @Column(name = "quantity", nullable = false)
    private Integer quantity;

    @Column(name = "total_price", nullable = false)
    private BigDecimal totalPrice;

    @Column(name = "transaction_type", nullable = false)
    private String transactionType; // BUY or SELL

    // Constructors, getters, setters
    public Transactions() {}

    public Transactions(LocalDateTime dateTime, String companyName, String symbol, BigDecimal stockPrice,
                        Integer quantity, BigDecimal totalPrice, String transactionType) {
        this.dateTime = dateTime;
        this.companyName = companyName;
        this.symbol = symbol;
        this.stockPrice = stockPrice;
        this.quantity = quantity;
        this.totalPrice = totalPrice;
        this.transactionType = transactionType;
    }

    // Getters and setters
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