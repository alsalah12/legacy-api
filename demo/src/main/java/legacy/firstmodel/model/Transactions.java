package legacy.firstmodel.model;

import jakarta.persistence.*;
import java.math.BigDecimal;

@Entity
@Table(name = "transactions")
public class Transactions {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "transaction_date", nullable = false)
    private String date;

    @Column(name = "transaction_time", nullable = false)
    private String time;

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

    public Transactions(String date, String time, String companyName, String symbol, BigDecimal stockPrice,
                        Integer quantity, BigDecimal totalPrice, String transactionType) {
        this.date = date;
        this.time = time;
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

    public String getDate() { return date; }
    public void setDate(String date) { this.date = date; }

    public String getTime() { return time; }
    public void setTime(String time) { this.time = time; }

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