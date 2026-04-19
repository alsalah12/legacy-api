package legacy.firstmodel.model;

import jakarta.persistence.*;
import java.math.BigDecimal;

@Entity
@Table(name = "holdings")
public class Holdings {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "company_name", nullable = false)
    private String companyName;

    @Column(name = "symbol", nullable = false, unique = true)
    private String symbol;

    @Column(name = "quantity_owned", nullable = false)
    private Integer quantityOwned;

    @Column(name = "bid_price", nullable = false)
    private BigDecimal bidPrice;

    @Column(name = "total_value", nullable = false)
    private BigDecimal totalValue;

    @Column(name = "total_invested", nullable = false)
    private BigDecimal totalInvested;

    @Column(name = "profit_loss", nullable = false)
    private BigDecimal profitLoss;

    @Column(name = "profit_percentage_change", nullable = false)
    private BigDecimal profitPercentageChange;

    // Constructors, getters, setters
    public Holdings() {}

    public Holdings(String companyName, String symbol, Integer quantityOwned, BigDecimal bidPrice,
                    BigDecimal totalValue, BigDecimal totalInvested, BigDecimal profitLoss, BigDecimal profitPercentageChange) {
        this.companyName = companyName;
        this.symbol = symbol;
        this.quantityOwned = quantityOwned;
        this.bidPrice = bidPrice;
        this.totalValue = totalValue;
        this.totalInvested = totalInvested;
        this.profitLoss = profitLoss;
        this.profitPercentageChange = profitPercentageChange;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getCompanyName() { return companyName; }
    public void setCompanyName(String companyName) { this.companyName = companyName; }

    public String getSymbol() { return symbol; }
    public void setSymbol(String symbol) { this.symbol = symbol; }

    public Integer getQuantityOwned() { return quantityOwned; }
    public void setQuantityOwned(Integer quantityOwned) { this.quantityOwned = quantityOwned; }

    public BigDecimal getBidPrice() { return bidPrice; }
    public void setBidPrice(BigDecimal bidPrice) { this.bidPrice = bidPrice; }

    public BigDecimal getTotalValue() { return totalValue; }
    public void setTotalValue(BigDecimal totalValue) { this.totalValue = totalValue; }

    public BigDecimal getTotalInvested() { return totalInvested; }
    public void setTotalInvested(BigDecimal totalInvested) { this.totalInvested = totalInvested; }

    public BigDecimal getProfitLoss() { return profitLoss; }
    public void setProfitLoss(BigDecimal profitLoss) { this.profitLoss = profitLoss; }

    public BigDecimal getProfitPercentageChange() { return profitPercentageChange; }
    public void setProfitPercentageChange(BigDecimal profitPercentageChange) { this.profitPercentageChange = profitPercentageChange; }
}