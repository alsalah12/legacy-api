package legacy.firstmodel.model;
import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;

@Entity
@Table(name = "Stock Transactions")
public class StockTransaction {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "symbol", nullable = false, unique = true, length = 10)
    private String symbol;

    @Column(name = "company_name")
    private String companyName;

    @Column(name = "stock_name")
    private String stockName;

    @Column(name = "purchase_price")
    private Double purchasePrice;

    @Column(name = "purchase_date")
    private LocalDateTime purchaseDate;

    @Column(name = "currency")
    private String currency;

    public StockTransaction() {
    }

    public StockTransaction(String symbol, String companyName, String stockName, Double purchasePrice, LocalDateTime purchaseDate, String currency){ {
        this.symbol = symbol;
        this.companyName = companyName;
        this.stockName = stockName;
        this.purchasePrice = purchasePrice;
        this.purchaseDate = purchaseDate;
        this.currency = currency;
    }}

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getSymbol() {
        return symbol;
    }

    public void setSymbol(String symbol) {
        this.symbol = symbol;
    }

    public String getCompanyName() {
        return companyName;
    }

    public void setCompanyName(String companyName) {
        this.companyName = companyName;
    }

    public String getStockName() {
        return stockName;
    }

    public void setStockName(String stockName) {
        this.stockName = stockName;
    }

    public Double getPurchasePrice() {
        return purchasePrice;
    }

    public void setPurchasePrice(Double purchasePrice) {
        this.purchasePrice = purchasePrice;
    }

    public LocalDateTime getPurchaseDate() {
        return purchaseDate;
    }

    public void setPurchaseDate(LocalDateTime purchaseDate) {
        this.purchaseDate = purchaseDate;
    }

    public String getCurrency() {
        return currency;
    }

    public void setCurrency(String currency) {
        this.currency = currency;
    }
    

}

    