package legacy.firstmodel.service;

import legacy.firstmodel.dto.BuyRequest;
import legacy.firstmodel.dto.HoldingsCreateRequest;
import legacy.firstmodel.dto.HoldingsResponse;
import legacy.firstmodel.dto.SellRequest;
import legacy.firstmodel.exception.InsufficientFundsException;
import legacy.firstmodel.exception.InvalidTransactionException;
import legacy.firstmodel.model.Holdings;
import legacy.firstmodel.model.Portfolio;
import legacy.firstmodel.model.Stock;
import legacy.firstmodel.model.Transactions;
import legacy.firstmodel.repository.HoldingsRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
public class HoldingsService {

    @Autowired
    private HoldingsRepository holdingsRepository;

    @Autowired
    private StockService stockService;

    @Autowired
    private PriceService priceService;

    @Autowired
    private PortfolioService portfolioService;

    @Autowired
    private TransactionsService transactionsService;

    public HoldingsResponse createHoldings(HoldingsCreateRequest request) {
        Stock stock = stockService.getStockBySymbol(request.getSymbol());
        if (stock == null) {
            throw new IllegalArgumentException("Stock symbol not found: " + request.getSymbol());
        }

        BigDecimal storedPrice = request.getBidPrice() == null ? BigDecimal.ZERO : request.getBidPrice();
        BigDecimal livePrice = getLivePriceOrStored(request.getSymbol(), storedPrice);
        BigDecimal totalInvested = storedPrice.multiply(BigDecimal.valueOf(request.getQuantityOwned()));
        BigDecimal totalValue = livePrice.multiply(BigDecimal.valueOf(request.getQuantityOwned()));
        BigDecimal profitLoss = totalValue.subtract(totalInvested);
        BigDecimal profitPercentageChange = totalInvested.compareTo(BigDecimal.ZERO) > 0
            ? profitLoss.divide(totalInvested, 4, RoundingMode.HALF_UP).multiply(BigDecimal.valueOf(100))
            : BigDecimal.ZERO;

        Holdings holdings = new Holdings(
            stock.getCompanyName(),
            request.getSymbol(),
            request.getQuantityOwned(),
            livePrice,
            totalValue,
            totalInvested,
            profitLoss,
            profitPercentageChange
        );

        Holdings saved = holdingsRepository.save(holdings);
        return buildResponse(saved);
    }

    public List<HoldingsResponse> getAllHoldingsResponses() {
        List<Holdings> holdings = holdingsRepository.findAll();
        List<HoldingsResponse> responses = new ArrayList<>();
        for (Holdings holding : holdings) {
            responses.add(buildResponse(holding));
        }
        return responses;
    }

    public Optional<HoldingsResponse> getHoldingsResponseById(Long id) {
        return holdingsRepository.findById(id).map(this::buildResponse);
    }

    public HoldingsResponse updateHoldings(Long id, HoldingsCreateRequest request) {
        Optional<Holdings> existing = holdingsRepository.findById(id);
        if (existing.isEmpty()) {
            return null;
        }

        Holdings holdings = existing.get();
        if (request.getCompanyName() != null) {
            holdings.setCompanyName(request.getCompanyName());
        }
        if (request.getSymbol() != null) {
            holdings.setSymbol(request.getSymbol());
        }
        if (request.getQuantityOwned() != null) {
            holdings.setQuantityOwned(request.getQuantityOwned());
        }
        if (request.getBidPrice() != null) {
            holdings.setBidPrice(request.getBidPrice());
        }
        if (request.getTotalValue() != null) {
            holdings.setTotalValue(request.getTotalValue());
        }
        if (request.getTotalInvested() != null) {
            holdings.setTotalInvested(request.getTotalInvested());
        }
        if (request.getProfitLoss() != null) {
            holdings.setProfitLoss(request.getProfitLoss());
        }
        if (request.getProfitPercentageChange() != null) {
            holdings.setProfitPercentageChange(request.getProfitPercentageChange());
        }

        Holdings updated = holdingsRepository.save(holdings);
        return buildResponse(updated);
    }

    public void deleteHoldingsById(Long id) {
        holdingsRepository.deleteById(id);
    }

    public HoldingsResponse buyStock(BuyRequest request) throws InsufficientFundsException {
        Optional<Portfolio> portfolioOpt = portfolioService.getAllPortfolios().stream().findFirst();
        if (portfolioOpt.isEmpty()) {
            throw new IllegalStateException("Portfolio not found");
        }

        Portfolio portfolio = portfolioOpt.get();
        BigDecimal price = getLivePriceOrStored(request.getSymbol(), request.getPrice());
        BigDecimal totalCost = price.multiply(BigDecimal.valueOf(request.getQuantity()));

        if (portfolio.getBalance().compareTo(totalCost) < 0) {
            throw new InsufficientFundsException("Insufficient balance for purchase");
        }

        Holdings holdings = holdingsRepository.findBySymbol(request.getSymbol());
        if (holdings == null) {
            Stock stock = stockService.getStockBySymbol(request.getSymbol());
            String companyName = stock != null ? stock.getCompanyName() : request.getSymbol();
            holdings = new Holdings(companyName, request.getSymbol(), request.getQuantity(), price,
                totalCost, totalCost, BigDecimal.ZERO, BigDecimal.ZERO);
        } else {
            int newQuantity = holdings.getQuantityOwned() + request.getQuantity();
            BigDecimal newTotalInvested = holdings.getTotalInvested().add(totalCost);
            BigDecimal newTotalValue = price.multiply(BigDecimal.valueOf(newQuantity));
            holdings.setQuantityOwned(newQuantity);
            holdings.setBidPrice(price);
            holdings.setTotalInvested(newTotalInvested);
            holdings.setTotalValue(newTotalValue);
            holdings.setProfitLoss(newTotalValue.subtract(newTotalInvested));
            holdings.setProfitPercentageChange(newTotalInvested.compareTo(BigDecimal.ZERO) > 0
                ? holdings.getProfitLoss().divide(newTotalInvested, 4, RoundingMode.HALF_UP).multiply(BigDecimal.valueOf(100))
                : BigDecimal.ZERO);
        }

        holdingsRepository.save(holdings);

        Stock stock = stockService.getStockBySymbol(request.getSymbol());
        String companyName = stock != null ? stock.getCompanyName() : request.getSymbol();
        java.time.LocalDateTime now = java.time.LocalDateTime.now();
        java.time.format.DateTimeFormatter dateFormatter = java.time.format.DateTimeFormatter.ofPattern("dd/MM/yyyy");
        java.time.format.DateTimeFormatter timeFormatter = java.time.format.DateTimeFormatter.ofPattern("HH:mm");
        Transactions transaction = new Transactions(
            now.format(dateFormatter),
            now.format(timeFormatter),
            companyName,
            request.getSymbol(),
            price,
            request.getQuantity(),
            totalCost,
            "BUY"
        );
        transactionsService.createTransaction(transaction);

        portfolio.setBalance(portfolio.getBalance().subtract(totalCost));
        portfolio.setTotalInvested(portfolio.getTotalInvested().add(totalCost));
        portfolioService.updatePortfolio(portfolio);

        return buildResponse(holdings);
    }

    public String sellStock(SellRequest request) throws InvalidTransactionException {
        Holdings holdings = holdingsRepository.findBySymbol(request.getSymbol());
        if (holdings == null || holdings.getQuantityOwned() < request.getQuantity()) {
            throw new InvalidTransactionException("Insufficient holdings for sale");
        }

        BigDecimal price = getLivePriceOrStored(request.getSymbol(), request.getPrice() != null ? request.getPrice() : holdings.getBidPrice());
        BigDecimal totalProceeds = price.multiply(BigDecimal.valueOf(request.getQuantity()));

        int newQuantity = holdings.getQuantityOwned() - request.getQuantity();
        BigDecimal soldInvested = holdings.getTotalInvested().divide(BigDecimal.valueOf(holdings.getQuantityOwned()), 4, RoundingMode.HALF_UP)
            .multiply(BigDecimal.valueOf(request.getQuantity()));
        BigDecimal newTotalInvested = holdings.getTotalInvested().subtract(soldInvested);
        BigDecimal newTotalValue = price.multiply(BigDecimal.valueOf(newQuantity));
        holdings.setQuantityOwned(newQuantity);
        holdings.setBidPrice(price);
        holdings.setTotalInvested(newTotalInvested);
        holdings.setTotalValue(newTotalValue);
        holdings.setProfitLoss(newTotalValue.subtract(newTotalInvested));
        holdings.setProfitPercentageChange(newTotalInvested.compareTo(BigDecimal.ZERO) > 0
            ? holdings.getProfitLoss().divide(newTotalInvested, 4, RoundingMode.HALF_UP).multiply(BigDecimal.valueOf(100))
            : BigDecimal.ZERO);

        if (newQuantity == 0) {
            holdingsRepository.deleteById(holdings.getId());
        } else {
            holdingsRepository.save(holdings);
        }

        java.time.LocalDateTime now = java.time.LocalDateTime.now();
        java.time.format.DateTimeFormatter dateFormatter = java.time.format.DateTimeFormatter.ofPattern("dd/MM/yyyy");
        java.time.format.DateTimeFormatter timeFormatter = java.time.format.DateTimeFormatter.ofPattern("HH:mm");
        Transactions transaction = new Transactions(
            now.format(dateFormatter),
            now.format(timeFormatter),
            holdings.getCompanyName(),
            request.getSymbol(),
            price,
            request.getQuantity(),
            totalProceeds,
            "SELL"
        );
        transactionsService.createTransaction(transaction);

        Optional<Portfolio> portfolioOpt = portfolioService.getAllPortfolios().stream().findFirst();
        if (portfolioOpt.isPresent()) {
            Portfolio portfolio = portfolioOpt.get();
            portfolio.setBalance(portfolio.getBalance().add(totalProceeds));
            portfolio.setTotalInvested(portfolio.getTotalInvested().subtract(soldInvested));
            portfolioService.updatePortfolio(portfolio);
        }

        return "Stock sold successfully";
    }

    public Holdings getHoldingsBySymbol(String symbol) {
        return holdingsRepository.findBySymbol(symbol);
    }

    private BigDecimal getLivePriceOrStored(String symbol, BigDecimal storedPrice) {
        try {
            BigDecimal livePrice = priceService.getLivePrice(symbol).getPrice();
            return livePrice != null ? livePrice : safePrice(storedPrice);
        } catch (Exception exception) {
            return safePrice(storedPrice);
        }
    }

    private HoldingsResponse buildResponse(Holdings holdings) {
        BigDecimal storedBidPrice = safePrice(holdings.getBidPrice());
        BigDecimal totalValue = storedBidPrice.multiply(BigDecimal.valueOf(holdings.getQuantityOwned()));
        BigDecimal totalInvested = safePrice(holdings.getTotalInvested());
        BigDecimal profitLoss = totalValue.subtract(totalInvested);
        BigDecimal profitPercentageChange = totalInvested.compareTo(BigDecimal.ZERO) > 0
            ? profitLoss.divide(totalInvested, 4, RoundingMode.HALF_UP).multiply(BigDecimal.valueOf(100))
            : BigDecimal.ZERO;

        return new HoldingsResponse(
            holdings.getId(),
            holdings.getCompanyName(),
            holdings.getSymbol(),
            holdings.getQuantityOwned(),
            storedBidPrice,
            totalValue,
            totalInvested,
            profitLoss,
            profitPercentageChange
        );
    }

    private BigDecimal safePrice(BigDecimal value) {
        return value == null ? BigDecimal.ZERO : value;
    }
}
