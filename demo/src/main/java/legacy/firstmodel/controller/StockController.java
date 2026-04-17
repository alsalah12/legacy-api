package legacy.firstmodel.controller;

import java.util.Optional;
import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.HttpStatus;



import legacy.firstmodel.dto.CreateStockRequest;
import legacy.firstmodel.model.Stock;
import legacy.firstmodel.service.StockService;
import legacy.firstmodel.dto.ErrorResponse;

@RestController
@RequestMapping("/stocks")
public class StockController {
    private final StockService stockService;

    public StockController(StockService stockService) {
        this.stockService = stockService;
    }


    
    @PostMapping
    public ResponseEntity<Stock> createStock(@RequestBody CreateStockRequest request){
        Stock stock = new Stock(request.getSymbol(), request.getCompanyName(), request.getStockName(), request.getPrice());
        Stock createdStock = stockService.createStock(stock);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdStock);
    }

    @GetMapping
    public ResponseEntity<List<Stock>> getAllStocks(){
        List<Stock> stocks = stockService.getAllStocks();
        return ResponseEntity.ok(stocks);
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getStockById(@PathVariable Long id){
        Optional<Stock> stock = stockService.getStockById(id);
        if (stock.isPresent()) {
            return ResponseEntity.ok(stock.get());
        } else {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
            .body(new ErrorResponse("NOT FOUND","Stock not found"));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteStock(@PathVariable Long id){
        Optional<Stock> stock = stockService.getStockById(id);
        if (stock.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
            .body(new ErrorResponse("NOT FOUND","Stock not found"));
        }
        stockService.deleteStockById(id);
        return ResponseEntity.noContent().build();
    }
}
