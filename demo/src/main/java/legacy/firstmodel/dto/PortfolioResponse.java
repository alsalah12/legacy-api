package legacy.firstmodel.dto;

import java.math.BigDecimal;

public class PortfolioResponse {
    private Long id;
    private BigDecimal totalValue;
    private BigDecimal totalInvested;
    private BigDecimal totalProfit;
    private BigDecimal totalReturnPercent;
    private BigDecimal balance;

    // Constructors, getters, setters
    public PortfolioResponse() {}

    public PortfolioResponse(Long id, BigDecimal totalValue, BigDecimal totalInvested, BigDecimal totalProfit,
                             BigDecimal totalReturnPercent, BigDecimal balance) {
        this.id = id;
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