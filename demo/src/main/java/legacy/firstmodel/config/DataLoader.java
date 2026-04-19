package legacy.firstmodel.config;

import java.math.BigDecimal;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import legacy.firstmodel.model.Holdings;
import legacy.firstmodel.model.Portfolio;
import legacy.firstmodel.model.Stock;
import legacy.firstmodel.model.Transactions;
import legacy.firstmodel.repository.HoldingsRepository;
import legacy.firstmodel.repository.PortfolioRepository;
import legacy.firstmodel.repository.StockRepository;
import legacy.firstmodel.repository.TransactionsRepository;

@Component
public class DataLoader implements CommandLineRunner {

    @Autowired
    private StockRepository stockRepository;

    @Autowired
    private HoldingsRepository holdingsRepository;

    @Autowired
    private TransactionsRepository transactionsRepository;

    @Autowired
    private PortfolioRepository portfolioRepository;

    @Override
    public void run(String... args) throws Exception {
        if (stockRepository.count() == 0) {
            stockRepository.save(new Stock("Apple Inc.", "AAPL", BigDecimal.valueOf(150.00), BigDecimal.valueOf(151.00), BigDecimal.valueOf(5.5), 0));
            stockRepository.save(new Stock("Microsoft Corporation", "MSFT", BigDecimal.valueOf(300.00), BigDecimal.valueOf(301.00), BigDecimal.valueOf(3.2), 0));
            stockRepository.save(new Stock("Amazon.com Inc.", "AMZN", BigDecimal.valueOf(100.00), BigDecimal.valueOf(101.00), BigDecimal.valueOf(-2.1), 0));
            stockRepository.save(new Stock("Alphabet Inc.", "GOOGL", BigDecimal.valueOf(200.00), BigDecimal.valueOf(202.00), BigDecimal.valueOf(1.0), 0));
            stockRepository.save(new Stock("Tesla Inc.", "TSLA", BigDecimal.valueOf(400.00), BigDecimal.valueOf(410.00), BigDecimal.valueOf(4.0), 0));
            stockRepository.save(new Stock("Meta Platforms Inc.", "META", BigDecimal.valueOf(250.00), BigDecimal.valueOf(255.00), BigDecimal.valueOf(2.0), 0));
            stockRepository.save(new Stock("NVIDIA Corporation", "NVDA", BigDecimal.valueOf(350.00), BigDecimal.valueOf(360.00), BigDecimal.valueOf(3.0), 0));
            stockRepository.save(new Stock("JPMorgan Chase & Co.", "JPM", BigDecimal.valueOf(120.00), BigDecimal.valueOf(122.00), BigDecimal.valueOf(1.5), 0));
            stockRepository.save(new Stock("Johnson & Johnson", "JNJ", BigDecimal.valueOf(160.00), BigDecimal.valueOf(161.00), BigDecimal.valueOf(0.5), 0));
            stockRepository.save(new Stock("Visa Inc.", "V", BigDecimal.valueOf(220.00), BigDecimal.valueOf(225.00), BigDecimal.valueOf(2.3), 0));
        }

        if (portfolioRepository.count() == 0) {
            portfolioRepository.save(new Portfolio(BigDecimal.valueOf(100.00), BigDecimal.valueOf(3600), BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.valueOf(10000.00)));
        }

        if (holdingsRepository.count() == 0) {
            holdingsRepository.save(new Holdings("Apple Inc.", "AAPL", 7, BigDecimal.valueOf(150.00), BigDecimal.valueOf(2100.00), BigDecimal.valueOf(2100.00), BigDecimal.valueOf(10.0), BigDecimal.valueOf(0.0)));
            holdingsRepository.save(new Holdings("Microsoft Corporation", "MSFT", 5, BigDecimal.valueOf(300.00), BigDecimal.valueOf(1500.00), BigDecimal.valueOf(1500.00), BigDecimal.valueOf(3.3), BigDecimal.valueOf(0.0)));
        }

        // Load default transactions (empty for now)
        // transactionsRepository.save(...);
    }
}
