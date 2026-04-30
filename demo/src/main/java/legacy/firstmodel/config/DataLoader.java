package legacy.firstmodel.config;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import legacy.firstmodel.model.Holdings;
import legacy.firstmodel.model.Portfolio;
import legacy.firstmodel.model.Stock;
import legacy.firstmodel.repository.HoldingsRepository;
import legacy.firstmodel.repository.PortfolioRepository;
import legacy.firstmodel.repository.StockRepository;

@Component
public class DataLoader implements CommandLineRunner {

    private static final BigDecimal DEMO_AVAILABLE_CASH = BigDecimal.valueOf(12500.00);

    @Autowired
    private StockRepository stockRepository;

    @Autowired
    private HoldingsRepository holdingsRepository;

    @Autowired
    private PortfolioRepository portfolioRepository;

    @Value("${app.demo.reset-holdings-on-startup:true}")
    private boolean resetDemoHoldingsOnStartup;

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
            portfolioRepository.save(buildDemoPortfolio());
        }

        if (resetDemoHoldingsOnStartup) {
            holdingsRepository.deleteAll();
        }

        if (resetDemoHoldingsOnStartup || holdingsRepository.count() == 0) {
            holdingsRepository.saveAll(buildDemoHoldings());
        }

        if (resetDemoHoldingsOnStartup && portfolioRepository.count() > 0) {
            Portfolio demoPortfolio = buildDemoPortfolio();
            Portfolio existingPortfolio = portfolioRepository.findAll().get(0);
            existingPortfolio.setTotalValue(demoPortfolio.getTotalValue());
            existingPortfolio.setTotalInvested(demoPortfolio.getTotalInvested());
            existingPortfolio.setTotalProfit(demoPortfolio.getTotalProfit());
            existingPortfolio.setTotalReturnPercent(demoPortfolio.getTotalReturnPercent());
            existingPortfolio.setBalance(demoPortfolio.getBalance());
            portfolioRepository.save(existingPortfolio);
        }

        // Load default transactions (empty for now)
        // transactionsRepository.save(...);
    }

    private List<Holdings> buildDemoHoldings() {
        return List.of(
            createDemoHolding("Apple Inc.", "AAPL", 18, BigDecimal.valueOf(150.00), BigDecimal.valueOf(142.00)),
            createDemoHolding("Microsoft Corporation", "MSFT", 12, BigDecimal.valueOf(300.00), BigDecimal.valueOf(286.00))
        );
    }

    private Portfolio buildDemoPortfolio() {
        BigDecimal totalValue = BigDecimal.ZERO;
        BigDecimal totalInvested = BigDecimal.ZERO;

        for (Holdings holding : buildDemoHoldings()) {
            totalValue = totalValue.add(holding.getTotalValue());
            totalInvested = totalInvested.add(holding.getTotalInvested());
        }

        BigDecimal totalProfit = totalValue.subtract(totalInvested);
        BigDecimal totalReturnPercent = totalInvested.compareTo(BigDecimal.ZERO) > 0
            ? totalProfit.divide(totalInvested, 4, RoundingMode.HALF_UP).multiply(BigDecimal.valueOf(100))
            : BigDecimal.ZERO;

        return new Portfolio(totalValue, totalInvested, totalProfit, totalReturnPercent, DEMO_AVAILABLE_CASH);
    }

    private Holdings createDemoHolding(String companyName, String symbol, int quantityOwned, BigDecimal currentBidPrice, BigDecimal purchasePrice) {
        BigDecimal quantity = BigDecimal.valueOf(quantityOwned);
        BigDecimal totalValue = currentBidPrice.multiply(quantity);
        BigDecimal totalInvested = purchasePrice.multiply(quantity);
        BigDecimal profitLoss = totalValue.subtract(totalInvested);
        BigDecimal profitPercentageChange = totalInvested.compareTo(BigDecimal.ZERO) > 0
            ? profitLoss.divide(totalInvested, 4, RoundingMode.HALF_UP).multiply(BigDecimal.valueOf(100))
            : BigDecimal.ZERO;

        return new Holdings(
            companyName,
            symbol,
            quantityOwned,
            currentBidPrice,
            totalValue,
            totalInvested,
            profitLoss,
            profitPercentageChange
        );
    }
}
