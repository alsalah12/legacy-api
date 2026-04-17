package legacy.firstmodel.dto;
//import javax.validation.constraints.NotBlank;
//import javax.validation.constraints.DecimalMin;

public class CreateStockRequest {
    //@NotBlank(message = "Stock name is required")
    private String name;
    //@NotBlank(message = "Stock symbol is required")
    private String symbol;
    //@DecimalMin(value = "0.0", inclusive = false, message = "Price must be greater than zero")
    private double price;
    public CreateStockRequest() {
    }

    public CreateStockRequest(String symbol,String companyName, String stockName, String currency) {
        this.symbol = symbol;
        this.companyName = companyName;
        this.stockName = stockName;
        this.currency = currency;
    }


    

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getSymbol() {
        return symbol;
    }

    public void setSymbol(String symbol) {
        this.symbol = symbol;
    }

    public double getPrice() {
        return price;
    }

    public void setPrice(double price) {
        this.price = price;
    }
}