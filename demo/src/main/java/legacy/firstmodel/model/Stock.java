package legacy.firstmodel.model;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.Column;

@Entity
@Table(name = "stocks")
public class Stock {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "symbol", nullable = false, unique = true, length = 10)
    private String symbol;

    @Column(name = "company_name")
    private String companyName;

    @Column(name = "stock_name")
    private String stockName;


    @Column(name = "price", precision = 10, scale = 2)
    private double price;

    public Stock() {
    }
    
    

    public Stock(String symbol, String companyName, String stockName, double price){
        this.symbol = symbol;
        this.companyName = companyName;
        this.stockName = stockName;
        this.price = price;
    }
    


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


    public double getPrice() {
        return price;
    }

    public void setPrice(double price) {
        this.price = price;
    }

}


   

    
    

