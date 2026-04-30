package legacy.firstmodel.dto;

import java.math.BigDecimal;

public class BuyRequest {
    private String symbol;
    private Integer quantity;
    private BigDecimal price;
    private Long portfolioId;

    // Constructors, getters, setters
    public BuyRequest() {}

    public BuyRequest(String symbol, Integer quantity, BigDecimal price, Long portfolioId) {
        this.symbol = symbol;
        this.quantity = quantity;
        this.price = price;
        this.portfolioId = portfolioId;
    }

    public String getSymbol() { return symbol; }
    public void setSymbol(String symbol) { this.symbol = symbol; }

    public Integer getQuantity() { return quantity; }
    public void setQuantity(Integer quantity) { this.quantity = quantity; }

    public BigDecimal getPrice() { return price; }
    public void setPrice(BigDecimal price) { this.price = price; }

    public Long getPortfolioId() { return portfolioId; }
    public void setPortfolioId(Long portfolioId) { this.portfolioId = portfolioId; }
}