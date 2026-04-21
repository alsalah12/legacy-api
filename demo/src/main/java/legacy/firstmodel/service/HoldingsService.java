package legacy.firstmodel.service;

import legacy.firstmodel.dto.BuyRequest;
import legacy.firstmodel.dto.HoldingsCreateRequest;
import legacy.firstmodel.dto.HoldingsResponse;
import legacy.firstmodel.dto.SellRequest;
import legacy.firstmodel.exception.InsufficientFundsException;
import legacy.firstmodel.exception.InvalidTransactionException;
import legacy.firstmodel.exception.StockNotFoundException;
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
import java.util.Locale;
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

    public Optional<HoldingsResponse> getHoldingsResponseBySymbol(String symbol) {
        Holdings holdings = holdingsRepository.findBySymbol(symbol);
        return Optional.ofNullable(holdings).map(this::buildResponse);
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
        String symbol = normalizeSymbol(request.getSymbol());
        int quantity = requireQuantity(request.getQuantity());
        Stock stock = requireStock(symbol);
        Portfolio portfolio = resolvePortfolio(request.getPortfolioId());
        BigDecimal price = requirePrice(getLivePriceOrStored(symbol, request.getPrice()));
        BigDecimal totalCost = price.multiply(BigDecimal.valueOf(quantity));

        if (portfolio.getBalance().compareTo(totalCost) < 0) {
            throw new InsufficientFundsException("Insufficient balance for purchase");
        }

        Holdings holdings = holdingsRepository.findBySymbol(symbol);
        if (holdings == null) {
            holdings = new Holdings(stock.getCompanyName(), symbol, quantity, price,
                totalCost, totalCost, BigDecimal.ZERO, BigDecimal.ZERO);
        } else {
            int newQuantity = holdings.getQuantityOwned() + quantity;
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

        Holdings savedHolding = holdingsRepository.save(holdings);

        java.time.LocalDateTime now = java.time.LocalDateTime.now();
        java.time.format.DateTimeFormatter dateFormatter = java.time.format.DateTimeFormatter.ofPattern("dd/MM/yyyy");
        java.time.format.DateTimeFormatter timeFormatter = java.time.format.DateTimeFormatter.ofPattern("HH:mm");
        Transactions transaction = new Transactions(
            now.format(dateFormatter),
            now.format(timeFormatter),
            stock.getCompanyName(),
            symbol,
            price,
            quantity,
            totalCost,
            "BUY"
        );
        transactionsService.createTransaction(transaction);

        portfolio.setBalance(portfolio.getBalance().subtract(totalCost));
        updatePortfolioMetrics(portfolio);

        return buildResponse(savedHolding);
    }

    public String sellStock(SellRequest request) throws InvalidTransactionException {
        String symbol = normalizeSymbol(request.getSymbol());
        int quantity = requireQuantity(request.getQuantity());
        Holdings holdings = holdingsRepository.findBySymbol(symbol);
        if (holdings == null) {
            throw new StockNotFoundException(symbol);
        }

        if (holdings.getQuantityOwned() < quantity) {
            throw new InvalidTransactionException("Insufficient holdings for sale");
        }

        Stock stock = requireStock(symbol);
        Portfolio portfolio = resolvePortfolio(request.getPortfolioId());
        BigDecimal price = requirePrice(getLivePriceOrStored(symbol, request.getPrice() != null ? request.getPrice() : holdings.getBidPrice()));
        BigDecimal totalProceeds = price.multiply(BigDecimal.valueOf(quantity));

        int newQuantity = holdings.getQuantityOwned() - quantity;
        BigDecimal soldInvested = holdings.getTotalInvested()
            .divide(BigDecimal.valueOf(holdings.getQuantityOwned()), 4, RoundingMode.HALF_UP)
            .multiply(BigDecimal.valueOf(quantity));
        BigDecimal newTotalInvested = holdings.getTotalInvested().subtract(soldInvested);
        BigDecimal newTotalValue = price.multiply(BigDecimal.valueOf(newQuantity));
        holdings.setQuantityOwned(newQuantity);
        holdings.setBidPrice(price);
        holdings.setTotalInvested(newQuantity == 0 ? BigDecimal.ZERO : newTotalInvested.max(BigDecimal.ZERO));
        holdings.setTotalValue(newQuantity == 0 ? BigDecimal.ZERO : newTotalValue.max(BigDecimal.ZERO));
        holdings.setProfitLoss(holdings.getTotalValue().subtract(holdings.getTotalInvested()));
        holdings.setProfitPercentageChange(holdings.getTotalInvested().compareTo(BigDecimal.ZERO) > 0
            ? holdings.getProfitLoss().divide(holdings.getTotalInvested(), 4, RoundingMode.HALF_UP).multiply(BigDecimal.valueOf(100))
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
            stock.getCompanyName(),
            symbol,
            price,
            quantity,
            totalProceeds,
            "SELL"
        );
        transactionsService.createTransaction(transaction);

        portfolio.setBalance(portfolio.getBalance().add(totalProceeds));
        updatePortfolioMetrics(portfolio);

        return "Stock sold successfully";
    }

    private String normalizeSymbol(String symbol) {
        String normalized = symbol == null ? "" : symbol.trim().toUpperCase(Locale.US);
        if (normalized.isBlank()) {
            throw new IllegalArgumentException("Stock symbol is required");
        }
        return normalized;
    }

    private int requireQuantity(Integer quantity) {
        if (quantity == null || quantity <= 0) {
            throw new IllegalArgumentException("Quantity must be greater than zero");
        }
        return quantity;
    }

    private BigDecimal requirePrice(BigDecimal price) {
        if (price == null || price.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Price must be greater than zero");
        }
        return price;
    }

    private Stock requireStock(String symbol) {
        Stock stock = stockService.getStockBySymbol(symbol);
        if (stock == null) {
            throw new StockNotFoundException(symbol);
        }
        return stock;
    }

    private Portfolio resolvePortfolio(Long portfolioId) {
        if (portfolioId != null) {
            Optional<Portfolio> portfolioById = portfolioService.getPortfolioById(portfolioId);
            if (portfolioById.isPresent()) {
                return portfolioById.get();
            }
        }

        return portfolioService.getAllPortfolios().stream()
            .findFirst()
            .orElseThrow(() -> new IllegalStateException("Portfolio not found"));
    }

    private void updatePortfolioMetrics(Portfolio portfolio) {
        BigDecimal holdingsValue = BigDecimal.ZERO;
        BigDecimal holdingsInvested = BigDecimal.ZERO;

        for (Holdings currentHolding : holdingsRepository.findAll()) {
            holdingsValue = holdingsValue.add(safePrice(currentHolding.getTotalValue()));
            holdingsInvested = holdingsInvested.add(safePrice(currentHolding.getTotalInvested()));
        }

        BigDecimal totalProfit = holdingsValue.subtract(holdingsInvested);
        BigDecimal totalReturnPercent = holdingsInvested.compareTo(BigDecimal.ZERO) > 0
            ? totalProfit.divide(holdingsInvested, 4, RoundingMode.HALF_UP).multiply(BigDecimal.valueOf(100))
            : BigDecimal.ZERO;

        portfolio.setTotalValue(holdingsValue.setScale(2, RoundingMode.HALF_UP));
        portfolio.setTotalInvested(holdingsInvested.setScale(2, RoundingMode.HALF_UP));
        portfolio.setTotalProfit(totalProfit.setScale(2, RoundingMode.HALF_UP));
        portfolio.setTotalReturnPercent(totalReturnPercent.setScale(2, RoundingMode.HALF_UP));
        portfolioService.updatePortfolio(portfolio);
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
