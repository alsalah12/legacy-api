// package legacy.firstmodel.controller;

// import java.math.BigDecimal;
// import java.math.RoundingMode;
// import java.time.LocalDateTime;
// import java.util.List;
// import java.util.Optional;
// import java.util.stream.Collectors;

// import org.springframework.beans.factory.annotation.Autowired;
// import org.springframework.http.HttpStatus;
// import org.springframework.http.ResponseEntity;
// import org.springframework.web.bind.annotation.*;

// import legacy.firstmodel.dto.BuyRequest;
// import legacy.firstmodel.dto.ErrorResponse;
// import legacy.firstmodel.dto.HoldingsCreateRequest;
// import legacy.firstmodel.dto.HoldingsResponse;
// import legacy.firstmodel.dto.SellRequest;
// import legacy.firstmodel.exception.InsufficientFundsException;
// import legacy.firstmodel.exception.InvalidTransactionException;
// import legacy.firstmodel.model.Holdings;
// import legacy.firstmodel.model.Portfolio;
// import legacy.firstmodel.model.Stock;
// import legacy.firstmodel.model.Transactions;
// import legacy.firstmodel.service.HoldingsService;
// import legacy.firstmodel.service.PortfolioService;
// import legacy.firstmodel.service.PriceService;
// import legacy.firstmodel.service.StockService;
// import legacy.firstmodel.service.TransactionsService;

// @RestController
// @RequestMapping("/holdings")
// public class HoldingsController1 {

//     @Autowired
//     private HoldingsService holdingsService;

//     @Autowired
//     private TransactionsService transactionsService;

//     @Autowired
//     private PortfolioService portfolioService;

//     @Autowired
//     private PriceService priceService;

//     @Autowired
//     private StockService stockService;

//     private java.math.BigDecimal getLivePriceOrStored(String symbol, java.math.BigDecimal storedPrice) {
//         try {
//             return priceService.getLivePrice(symbol).getPrice();
//         } catch (Exception ex) {
//             return storedPrice;
//         }
//     }

// // @RestController
// // @RequestMapping("/holdings")
// // public class HoldingsController {

// //     @Autowired
// //     private HoldingsService holdingsService;

//     @PostMapping
//     public ResponseEntity<?> createHoldings(@RequestBody HoldingsCreateRequest request) {
//         // Fetch company name from Stock table
//         Stock stock = stockService.getStockBySymbol(request.getSymbol());
//         if (stock == null) {
//             return ResponseEntity.status(HttpStatus.BAD_REQUEST)
//                 .body(new ErrorResponse("STOCK_NOT_FOUND", "Stock symbol not found: " + request.getSymbol()));
//         }
//         String companyName = stock.getCompanyName();

//         // Get live price
//         BigDecimal livePrice = getLivePriceOrStored(request.getSymbol(), request.getBidPrice());

//         // Calculate total invested based on user's bid price
//         BigDecimal totalInvested = request.getBidPrice().multiply(BigDecimal.valueOf(request.getQuantityOwned()));

//         // Calculate total value based on live price
//         BigDecimal totalValue = livePrice.multiply(BigDecimal.valueOf(request.getQuantityOwned()));

//         // Calculate profit/loss
//         BigDecimal profitLoss = totalValue.subtract(totalInvested);

//         // Calculate profit percentage change
//         BigDecimal profitPercentageChange = totalInvested.compareTo(BigDecimal.ZERO) > 0
//             ? profitLoss.divide(totalInvested, 4, RoundingMode.HALF_UP).multiply(BigDecimal.valueOf(100))
//             : BigDecimal.ZERO;

//         Holdings holdings = new Holdings(
//             companyName,
//             request.getSymbol(),
//             request.getQuantityOwned(),
//             livePrice, // Use live price as bidPrice in entity
//             totalValue,
//             totalInvested,
//             profitLoss,
//             profitPercentageChange
//         );

//         Holdings created = holdingsService.createHoldings(holdings);
//         HoldingsResponse response = new HoldingsResponse(
//             created.getId(),
//             created.getCompanyName(),
//             created.getSymbol(),
//             created.getQuantityOwned(),
//             created.getBidPrice(),
//             created.getTotalValue(),
//             created.getTotalInvested(),
//             created.getProfitLoss(),
//             created.getProfitPercentageChange()
//         );
//         return ResponseEntity.status(HttpStatus.CREATED).body(response);
//     }

//     @GetMapping
//     public ResponseEntity<List<HoldingsResponse>> getAllHoldings() {
//         List<Holdings> holdings = holdingsService.getAllHoldings();
//         List<HoldingsResponse> responses = holdings.stream()
//             .map(h -> {
//                 java.math.BigDecimal livePrice = getLivePriceOrStored(h.getSymbol(), h.getBidPrice());
//                 java.math.BigDecimal totalValue = livePrice.multiply(BigDecimal.valueOf(h.getQuantityOwned()));
//                 java.math.BigDecimal profitLoss = totalValue.subtract(h.getTotalInvested());
//                 java.math.BigDecimal profitPercentageChange = h.getTotalInvested().compareTo(BigDecimal.ZERO) > 0
//                     ? profitLoss.divide(h.getTotalInvested(), 4, java.math.RoundingMode.HALF_UP).multiply(BigDecimal.valueOf(100))
//                     : BigDecimal.ZERO;
//                 return new HoldingsResponse(
//                     h.getId(),
//                     h.getCompanyName(),
//                     h.getSymbol(),
//                     h.getQuantityOwned(),
//                     livePrice,
//                     totalValue,
//                     h.getTotalInvested(),
//                     profitLoss,
//                     profitPercentageChange
//                 );
//             })
//             .collect(Collectors.toList());
//         return ResponseEntity.ok(responses);
//     }

//     @GetMapping("/{id}")
//     public ResponseEntity<?> getHoldingsById(@PathVariable Long id) {
//         Optional<Holdings> holdings = holdingsService.getHoldingsById(id);
//         if (holdings.isPresent()) {
//             Holdings h = holdings.get();
//             java.math.BigDecimal livePrice = getLivePriceOrStored(h.getSymbol(), h.getBidPrice());
//             java.math.BigDecimal totalValue = livePrice.multiply(BigDecimal.valueOf(h.getQuantityOwned()));
//             java.math.BigDecimal profitLoss = totalValue.subtract(h.getTotalInvested());
//             java.math.BigDecimal profitPercentageChange = h.getTotalInvested().compareTo(BigDecimal.ZERO) > 0
//                 ? profitLoss.divide(h.getTotalInvested(), 4, java.math.RoundingMode.HALF_UP).multiply(BigDecimal.valueOf(100))
//                 : BigDecimal.ZERO;
//             HoldingsResponse response = new HoldingsResponse(
//                 h.getId(),
//                 h.getCompanyName(),
//                 h.getSymbol(),
//                 h.getQuantityOwned(),
//                 livePrice,
//                 totalValue,
//                 h.getTotalInvested(),
//                 profitLoss,
//                 profitPercentageChange
//             );
//             return ResponseEntity.ok(response);
//         } else {
//             return ResponseEntity.status(HttpStatus.NOT_FOUND)
//                 .body(new ErrorResponse("NOT_FOUND", "Holdings not found"));
//         }
//     }

//     @PutMapping("/{id}")
//     public ResponseEntity<HoldingsResponse> updateHoldings(@PathVariable Long id, @RequestBody HoldingsCreateRequest request) {
//         Optional<Holdings> existing = holdingsService.getHoldingsById(id);
//         if (existing.isPresent()) {
//             Holdings holdings = existing.get();
//             holdings.setCompanyName(request.getCompanyName());
//             holdings.setSymbol(request.getSymbol());
//             holdings.setQuantityOwned(request.getQuantityOwned());
//             holdings.setBidPrice(request.getBidPrice());
//             holdings.setTotalValue(request.getTotalValue());
//             holdings.setTotalInvested(request.getTotalInvested());
//             holdings.setProfitLoss(request.getProfitLoss());
//             holdings.setProfitPercentageChange(request.getProfitPercentageChange());
//             Holdings updated = holdingsService.updateHoldings(holdings);
//             HoldingsResponse response = new HoldingsResponse(
//                 updated.getId(),
//                 updated.getCompanyName(),
//                 updated.getSymbol(),
//                 updated.getQuantityOwned(),
//                 updated.getBidPrice(),
//                 updated.getTotalValue(),
//                 updated.getTotalInvested(),
//                 updated.getProfitLoss(),
//                 updated.getProfitPercentageChange()
//             );
//             return ResponseEntity.ok(response);
//         } else {
//             return ResponseEntity.notFound().build();
//         }
//     }

//     @DeleteMapping("/{id}")
//     public ResponseEntity<?> deleteHoldings(@PathVariable Long id) {
//         Optional<Holdings> holdings = holdingsService.getHoldingsById(id);
//         if (holdings.isEmpty()) {
//             return ResponseEntity.status(HttpStatus.NOT_FOUND)
//                 .body(new ErrorResponse("NOT_FOUND", "Holdings not found"));
//         }
//         holdingsService.deleteHoldingsById(id);
//         return ResponseEntity.noContent().build();
//     }

//     @PostMapping("/buy")
//     public ResponseEntity<?> buyStock(@RequestBody BuyRequest request) {
//         try {
//             // Get portfolio
//             Optional<Portfolio> portfolioOpt = portfolioService.getAllPortfolios().stream().findFirst();
//             if (portfolioOpt.isEmpty()) {
//                 return ResponseEntity.status(HttpStatus.NOT_FOUND).body(new ErrorResponse("NOT_FOUND", "Portfolio not found"));
//             }
//             Portfolio portfolio = portfolioOpt.get();

//             // Determine live price for the trade
//             BigDecimal price = getLivePriceOrStored(request.getSymbol(), request.getPrice());
//             BigDecimal totalCost = price.multiply(BigDecimal.valueOf(request.getQuantity()));
//             if (portfolio.getBalance().compareTo(totalCost) < 0) {
//                 throw new InsufficientFundsException("Insufficient balance for purchase");
//             }

//             // Update or create holdings
//             Holdings holdings = holdingsService.getHoldingsBySymbol(request.getSymbol());
//             if (holdings == null) {
//                 holdings = new Holdings(request.getSymbol(), request.getSymbol(), request.getQuantity(), price,
//                     totalCost, totalCost, BigDecimal.ZERO, BigDecimal.ZERO);
//             } else {
//                 int newQuantity = holdings.getQuantityOwned() + request.getQuantity();
//                 BigDecimal newTotalInvested = holdings.getTotalInvested().add(totalCost);
//                 BigDecimal newTotalValue = price.multiply(BigDecimal.valueOf(newQuantity));
//                 holdings.setQuantityOwned(newQuantity);
//                 holdings.setBidPrice(price);
//                 holdings.setTotalInvested(newTotalInvested);
//                 holdings.setTotalValue(newTotalValue);
//                 // Recalculate profit/loss
//                 holdings.setProfitLoss(newTotalValue.subtract(newTotalInvested));
//                 holdings.setProfitPercentageChange(holdings.getProfitLoss().divide(newTotalInvested, 4, RoundingMode.HALF_UP).multiply(BigDecimal.valueOf(100)));
//             }
//             holdingsService.createHoldings(holdings);

//             // Create transaction
//             Transactions transaction = new Transactions(LocalDateTime.now(), request.getSymbol(), request.getSymbol(),
//                 price, request.getQuantity(), totalCost, "BUY");
//             transactionsService.createTransaction(transaction);

//             // Update portfolio
//             portfolio.setBalance(portfolio.getBalance().subtract(totalCost));
//             portfolio.setTotalInvested(portfolio.getTotalInvested().add(totalCost));
//             portfolioService.updatePortfolio(portfolio);

//             HoldingsResponse response = new HoldingsResponse(
//                 holdings.getId(),
//                 holdings.getCompanyName(),
//                 holdings.getSymbol(),
//                 holdings.getQuantityOwned(),
//                 holdings.getBidPrice(),
//                 holdings.getTotalValue(),
//                 holdings.getTotalInvested(),
//                 holdings.getProfitLoss(),
//                 holdings.getProfitPercentageChange()
//             );
//             return ResponseEntity.ok(response);
//         } catch (InsufficientFundsException ex) {
//             return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(new ErrorResponse("INSUFFICIENT_FUNDS", ex.getMessage()));
//         } catch (Exception ex) {
//             return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(new ErrorResponse("ERROR", ex.getMessage()));
//         }
//     }

//     @PostMapping("/sell")
//     public ResponseEntity<?> sellStock(@RequestBody SellRequest request) {
//         try {
//             Holdings holdings = holdingsService.getHoldingsBySymbol(request.getSymbol());
//             if (holdings == null || holdings.getQuantityOwned() < request.getQuantity()) {
//                 throw new InvalidTransactionException("Insufficient holdings for sale");
//             }

//             BigDecimal price = getLivePriceOrStored(request.getSymbol(), request.getPrice());
//             BigDecimal totalProceeds = price.multiply(BigDecimal.valueOf(request.getQuantity()));

//             // Update holdings
//             int newQuantity = holdings.getQuantityOwned() - request.getQuantity();
//             BigDecimal soldInvested = holdings.getTotalInvested().divide(BigDecimal.valueOf(holdings.getQuantityOwned()), 4, RoundingMode.HALF_UP).multiply(BigDecimal.valueOf(request.getQuantity()));
//             BigDecimal newTotalInvested = holdings.getTotalInvested().subtract(soldInvested);
//             BigDecimal newTotalValue = price.multiply(BigDecimal.valueOf(newQuantity));
//             holdings.setQuantityOwned(newQuantity);
//             holdings.setBidPrice(price);
//             holdings.setTotalInvested(newTotalInvested);
//             holdings.setTotalValue(newTotalValue);
//             holdings.setProfitLoss(newTotalValue.subtract(newTotalInvested));
//             holdings.setProfitPercentageChange(newTotalInvested.compareTo(BigDecimal.ZERO) > 0 ? holdings.getProfitLoss().divide(newTotalInvested, 4, RoundingMode.HALF_UP).multiply(BigDecimal.valueOf(100)) : BigDecimal.ZERO);

//             if (newQuantity == 0) {
//                 holdingsService.deleteHoldingsById(holdings.getId());
//             } else {
//                 holdingsService.updateHoldings(holdings);
//             }

//             // Create transaction
//             Transactions transaction = new Transactions(LocalDateTime.now(), request.getSymbol(), request.getSymbol(),
//                 price, request.getQuantity(), totalProceeds, "SELL");
//             transactionsService.createTransaction(transaction);

//             // Update portfolio
//             Optional<Portfolio> portfolioOpt = portfolioService.getAllPortfolios().stream().findFirst();
//             if (portfolioOpt.isPresent()) {
//                 Portfolio portfolio = portfolioOpt.get();
//                 portfolio.setBalance(portfolio.getBalance().add(totalProceeds));
//                 portfolio.setTotalInvested(portfolio.getTotalInvested().subtract(soldInvested));
//                 portfolioService.updatePortfolio(portfolio);
//             }

//             return ResponseEntity.ok("Stock sold successfully");
//         } catch (InvalidTransactionException ex) {
//             return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(new ErrorResponse("INVALID_TRANSACTION", ex.getMessage()));
//         } catch (Exception ex) {
//             return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(new ErrorResponse("ERROR", ex.getMessage()));
//         }
//     }
// }
