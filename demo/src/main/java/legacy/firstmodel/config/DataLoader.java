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
        // Load default stocks
        if (stockRepository.count() == 0) {
            stockRepository.save(new Stock("Apple Inc.", "AAPL", BigDecimal.valueOf(150.00), BigDecimal.valueOf(151.00), BigDecimal.valueOf(5.5), 0));
            stockRepository.save(new Stock("Microsoft Corporation", "MSFT", BigDecimal.valueOf(300.00), BigDecimal.valueOf(301.00), BigDecimal.valueOf(3.2), 0));
            stockRepository.save(new Stock("Amazon.com Inc.", "AMZN", BigDecimal.valueOf(100.00), BigDecimal.valueOf(101.00), BigDecimal.valueOf(-2.1), 0));
        }

        // Load default portfolio
        if (portfolioRepository.count() == 0) {
            portfolioRepository.save(new Portfolio(BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.valueOf(10000.00)));
        }

        // Load default holdings (empty for now)
        // holdingsRepository.save(...);

        // Load default transactions (empty for now)
        // transactionsRepository.save(...);
    }
}
