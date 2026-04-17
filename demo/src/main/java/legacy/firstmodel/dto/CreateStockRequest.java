package legacy.firstmodel.dto;
//import javax.validation.constraints.NotBlank;
//import javax.validation.constraints.DecimalMin;

public class CreateStockRequest {
    //@NotBlank(message = "Stock symbol is required")
    private String symbol;
    private String companyName;
    private String stockName;
    //@DecimalMin(value = "0.0", inclusive = false, message = "Price must be greater than zero")
    private double price;
    public CreateStockRequest() {
    }

    public CreateStockRequest(String symbol,String companyName, String stockName, double price) {
        this.symbol = symbol;
        this.companyName = companyName;
        this.stockName = stockName;
        this.price = price;
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

    public double getPrice() {
        return price;
    }

    public void setPrice(double price) {
        this.price = price;
    }

    
    


}