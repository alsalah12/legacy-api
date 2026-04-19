package legacy.firstmodel.controller;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import legacy.firstmodel.dto.ErrorResponse;
import legacy.firstmodel.dto.StockCreateRequest;
import legacy.firstmodel.dto.StockResponse;
import legacy.firstmodel.model.Stock;
import legacy.firstmodel.service.PriceService;
import legacy.firstmodel.service.StockService;

@RestController
@RequestMapping("/stocks")
public class StockController {

    private final StockService stockService;
    private final PriceService priceService;

    public StockController(StockService stockService, PriceService priceService) {
        this.stockService = stockService;
        this.priceService = priceService;
    }

    private java.math.BigDecimal getLivePriceOrStored(String symbol, java.math.BigDecimal storedPrice) {
        return priceService.getLivePrice(symbol).getPrice();
    }

    @PostMapping
    public ResponseEntity<StockResponse> createStock(@RequestBody StockCreateRequest request) {
        Stock stock = new Stock(
            request.getCompanyName(),
            request.getSymbol(),
            request.getBidPrice(),
            request.getAskPrice(),
            request.getPerformance(),
            request.getQuantityOwned()
        );
        Stock createdStock = stockService.createStock(stock);
        StockResponse response = new StockResponse(
            createdStock.getId(),
            createdStock.getCompanyName(),
            createdStock.getSymbol(),
            createdStock.getBidPrice(),
            createdStock.getAskPrice(),
            createdStock.getPerformance(),
            createdStock.getQuantityOwned()
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    public ResponseEntity<List<StockResponse>> getAllStocks() {
        List<Stock> stocks = stockService.getAllStocks();
        List<StockResponse> responses = stocks.stream()
            .map(s -> {
                java.math.BigDecimal livePrice = getLivePriceOrStored(s.getSymbol(), s.getBidPrice());
                return new StockResponse(
                    s.getId(),
                    s.getCompanyName(),
                    s.getSymbol(),
                    livePrice,
                    s.getAskPrice(),
                    s.getPerformance(),
                    s.getQuantityOwned()
                );
            })
            .collect(Collectors.toList());
        return ResponseEntity.ok(responses);
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getStockById(@PathVariable Long id) {
        Optional<Stock> stock = stockService.getStockById(id);
        if (stock.isPresent()) {
            Stock s = stock.get();
            java.math.BigDecimal livePrice = getLivePriceOrStored(s.getSymbol(), s.getBidPrice());
            StockResponse response = new StockResponse(
                s.getId(),
                s.getCompanyName(),
                s.getSymbol(),
                livePrice,
                s.getAskPrice(),
                s.getPerformance(),
                s.getQuantityOwned()
            );
            return ResponseEntity.ok(response);
        } else {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(new ErrorResponse("NOT_FOUND", "Stock not found"));
        }
    }

    @GetMapping("/symbol/{symbol}")
    public ResponseEntity<?> getStockBySymbol(@PathVariable String symbol) {
        Stock stock = stockService.getStockBySymbol(symbol);
        if (stock != null) {
            java.math.BigDecimal livePrice = getLivePriceOrStored(stock.getSymbol(), stock.getBidPrice());
            StockResponse response = new StockResponse(
                stock.getId(),
                stock.getCompanyName(),
                stock.getSymbol(),
                livePrice,
                stock.getAskPrice(),
                stock.getPerformance(),
                stock.getQuantityOwned()
            );
            return ResponseEntity.ok(response);
        } else {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(new ErrorResponse("NOT_FOUND", "Stock not found"));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<StockResponse> updateStock(@PathVariable Long id, @RequestBody StockCreateRequest request) {
        Optional<Stock> existing = stockService.getStockById(id);
        if (existing.isPresent()) {
            Stock stock = existing.get();
            stock.setCompanyName(request.getCompanyName());
            stock.setSymbol(request.getSymbol());
            stock.setBidPrice(request.getBidPrice());
            stock.setAskPrice(request.getAskPrice());
            stock.setPerformance(request.getPerformance());
            stock.setQuantityOwned(request.getQuantityOwned());
            Stock updated = stockService.updateStock(stock);
            StockResponse response = new StockResponse(
                updated.getId(),
                updated.getCompanyName(),
                updated.getSymbol(),
                updated.getBidPrice(),
                updated.getAskPrice(),
                updated.getPerformance(),
                updated.getQuantityOwned()
            );
            return ResponseEntity.ok(response);
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteStock(@PathVariable Long id) {
        Optional<Stock> stock = stockService.getStockById(id);
        if (stock.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(new ErrorResponse("NOT_FOUND", "Stock not found"));
        }
        stockService.deleteStockById(id);
        return ResponseEntity.noContent().build();
    }
}
