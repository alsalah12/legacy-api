package legacy.firstmodel.model;

import jakarta.persistence.*;
import java.math.BigDecimal;

@Entity
@Table(name = "portfolio")
public class Portfolio {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "total_value", nullable = false)
    private BigDecimal totalValue;

    @Column(name = "total_invested", nullable = false)
    private BigDecimal totalInvested;

    @Column(name = "total_profit", nullable = false)
    private BigDecimal totalProfit;

    @Column(name = "total_return_percent", nullable = false)
    private BigDecimal totalReturnPercent;

    @Column(name = "balance", nullable = false)
    private BigDecimal balance;

    public Portfolio() {}

    public Portfolio(BigDecimal totalValue, BigDecimal totalInvested, BigDecimal totalProfit,
                     BigDecimal totalReturnPercent, BigDecimal balance) {
        this.totalValue = totalValue;
        this.totalInvested = totalInvested;
        this.totalProfit = totalProfit;
        this.totalReturnPercent = totalReturnPercent;
        this.balance = balance;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public BigDecimal getTotalValue() { return totalValue; }
    public void setTotalValue(BigDecimal totalValue) { this.totalValue = totalValue; }

    public BigDecimal getTotalInvested() { return totalInvested; }
    public void setTotalInvested(BigDecimal totalInvested) { this.totalInvested = totalInvested; }

    public BigDecimal getTotalProfit() { return totalProfit; }
    public void setTotalProfit(BigDecimal totalProfit) { this.totalProfit = totalProfit; }

    public BigDecimal getTotalReturnPercent() { return totalReturnPercent; }
    public void setTotalReturnPercent(BigDecimal totalReturnPercent) { this.totalReturnPercent = totalReturnPercent; }

    public BigDecimal getBalance() { return balance; }
    public void setBalance(BigDecimal balance) { this.balance = balance; }
}