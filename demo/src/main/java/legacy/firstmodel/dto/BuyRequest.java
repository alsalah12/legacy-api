package legacy.firstmodel.dto;

import java.math.BigDecimal;

public class BuyRequest {
    private String symbol;
    private Integer quantity;
    private BigDecimal price;

    // Constructors, getters, setters
    public BuyRequest() {}

    public BuyRequest(String symbol, Integer quantity, BigDecimal price) {
        this.symbol = symbol;
        this.quantity = quantity;
        this.price = price;
    }

    public String getSymbol() { return symbol; }
    public void setSymbol(String symbol) { this.symbol = symbol; }

    public Integer getQuantity() { return quantity; }
    public void setQuantity(Integer quantity) { this.quantity = quantity; }

    public BigDecimal getPrice() { return price; }
    public void setPrice(BigDecimal price) { this.price = price; }
}