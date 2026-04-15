package legacy.firstmodel.model;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;

@Entity
public class UserStock {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String name;
    private String symbol;
    private double price;

    public UserStock() {
    }

    // public Stock(String name, String symbol, double price) {
    //     this.name = name;
    //     this.symbol = symbol;
    //     this.price = price;
    // }

   
   
    
}


