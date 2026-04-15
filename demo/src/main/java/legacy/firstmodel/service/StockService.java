package legacy.firstmodel.service;

import java.util.List;
import java.util.Optional;
import org.springframework.stereotype.Service;


import legacy.firstmodel.model.Stock;
import legacy.firstmodel.repository.StockRepository;

@Service
public class StockService {
    public final StockRepository stockRepository;

    public StockService(StockRepository stockRepository) {
        this.stockRepository = stockRepository;
    }
    public Stock createStock(Stock stock) {
        return stockRepository.save(stock);
    }
    public List<Stock> getAllStocks() {
        return stockRepository.findAll();
    }
    public Optional<Stock> getStockById(Long id) {
        return stockRepository.findById(id);
    }
    public void deleteStockById(Long id) {
        stockRepository.deleteById(id);
    }
}
