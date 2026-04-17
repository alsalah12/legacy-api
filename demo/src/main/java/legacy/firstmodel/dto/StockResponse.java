package legacy.firstmodel.dto;

import java.math.BigDecimal;

public class StockResponse {
    private Long id;
    private String companyName;
    private String symbol;
    private BigDecimal bidPrice;
    private BigDecimal askPrice;
    private BigDecimal performance;
    private Integer quantityOwned;

    // Constructors, getters, setters
    public StockResponse() {}

    public StockResponse(Long id, String companyName, String symbol, BigDecimal bidPrice, BigDecimal askPrice,
                         BigDecimal performance, Integer quantityOwned) {
        this.id = id;
        this.companyName = companyName;
        this.symbol = symbol;
        this.bidPrice = bidPrice;
        this.askPrice = askPrice;
        this.performance = performance;
        this.quantityOwned = quantityOwned;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getCompanyName() { return companyName; }
    public void setCompanyName(String companyName) { this.companyName = companyName; }

    public String getSymbol() { return symbol; }
    public void setSymbol(String symbol) { this.symbol = symbol; }

    public BigDecimal getBidPrice() { return bidPrice; }
    public void setBidPrice(BigDecimal bidPrice) { this.bidPrice = bidPrice; }

    public BigDecimal getAskPrice() { return askPrice; }
    public void setAskPrice(BigDecimal askPrice) { this.askPrice = askPrice; }

    public BigDecimal getPerformance() { return performance; }
    public void setPerformance(BigDecimal performance) { this.performance = performance; }

    public Integer getQuantityOwned() { return quantityOwned; }
    public void setQuantityOwned(Integer quantityOwned) { this.quantityOwned = quantityOwned; }
}