package legacy.firstmodel.controller;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import legacy.firstmodel.dto.BuyRequest;
import legacy.firstmodel.dto.ErrorResponse;
import legacy.firstmodel.dto.HoldingsCreateRequest;
import legacy.firstmodel.dto.HoldingsResponse;
import legacy.firstmodel.dto.SellRequest;
import legacy.firstmodel.exception.InsufficientFundsException;
import legacy.firstmodel.exception.InvalidTransactionException;
import legacy.firstmodel.model.Holdings;
import legacy.firstmodel.model.Portfolio;
import legacy.firstmodel.model.Transactions;
import legacy.firstmodel.service.HoldingsService;
import legacy.firstmodel.service.PortfolioService;
import legacy.firstmodel.service.TransactionsService;

@RestController
@RequestMapping("/holdings")
public class HoldingsController {

    @Autowired
    private HoldingsService holdingsService;

    @Autowired
    private TransactionsService transactionsService;

    @Autowired
    private PortfolioService portfolioService;

// @RestController
// @RequestMapping("/holdings")
// public class HoldingsController {

//     @Autowired
//     private HoldingsService holdingsService;

    @PostMapping
    public ResponseEntity<HoldingsResponse> createHoldings(@RequestBody HoldingsCreateRequest request) {
        Holdings holdings = new Holdings(
            request.getCompanyName(),
            request.getSymbol(),
            request.getQuantityOwned(),
            request.getBidPrice(),
            request.getTotalValue(),
            request.getTotalInvested(),
            request.getProfitLoss(),
            request.getProfitPercentageChange()
        );
        Holdings created = holdingsService.createHoldings(holdings);
        HoldingsResponse response = new HoldingsResponse(
            created.getId(),
            created.getCompanyName(),
            created.getSymbol(),
            created.getQuantityOwned(),
            created.getBidPrice(),
            created.getTotalValue(),
            created.getTotalInvested(),
            created.getProfitLoss(),
            created.getProfitPercentageChange()
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    public ResponseEntity<List<HoldingsResponse>> getAllHoldings() {
        List<Holdings> holdings = holdingsService.getAllHoldings();
        List<HoldingsResponse> responses = holdings.stream()
            .map(h -> new HoldingsResponse(
                h.getId(),
                h.getCompanyName(),
                h.getSymbol(),
                h.getQuantityOwned(),
                h.getBidPrice(),
                h.getTotalValue(),
                h.getTotalInvested(),
                h.getProfitLoss(),
                h.getProfitPercentageChange()
            ))
            .collect(Collectors.toList());
        return ResponseEntity.ok(responses);
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getHoldingsById(@PathVariable Long id) {
        Optional<Holdings> holdings = holdingsService.getHoldingsById(id);
        if (holdings.isPresent()) {
            Holdings h = holdings.get();
            HoldingsResponse response = new HoldingsResponse(
                h.getId(),
                h.getCompanyName(),
                h.getSymbol(),
                h.getQuantityOwned(),
                h.getBidPrice(),
                h.getTotalValue(),
                h.getTotalInvested(),
                h.getProfitLoss(),
                h.getProfitPercentageChange()
            );
            return ResponseEntity.ok(response);
        } else {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(new ErrorResponse("NOT_FOUND", "Holdings not found"));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<HoldingsResponse> updateHoldings(@PathVariable Long id, @RequestBody HoldingsCreateRequest request) {
        Optional<Holdings> existing = holdingsService.getHoldingsById(id);
        if (existing.isPresent()) {
            Holdings holdings = existing.get();
            holdings.setCompanyName(request.getCompanyName());
            holdings.setSymbol(request.getSymbol());
            holdings.setQuantityOwned(request.getQuantityOwned());
            holdings.setBidPrice(request.getBidPrice());
            holdings.setTotalValue(request.getTotalValue());
            holdings.setTotalInvested(request.getTotalInvested());
            holdings.setProfitLoss(request.getProfitLoss());
            holdings.setProfitPercentageChange(request.getProfitPercentageChange());
            Holdings updated = holdingsService.updateHoldings(holdings);
            HoldingsResponse response = new HoldingsResponse(
                updated.getId(),
                updated.getCompanyName(),
                updated.getSymbol(),
                updated.getQuantityOwned(),
                updated.getBidPrice(),
                updated.getTotalValue(),
                updated.getTotalInvested(),
                updated.getProfitLoss(),
                updated.getProfitPercentageChange()
            );
            return ResponseEntity.ok(response);
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteHoldings(@PathVariable Long id) {
        Optional<Holdings> holdings = holdingsService.getHoldingsById(id);
        if (holdings.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(new ErrorResponse("NOT_FOUND", "Holdings not found"));
        }
        holdingsService.deleteHoldingsById(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/buy")
    public ResponseEntity<?> buyStock(@RequestBody BuyRequest request) {
        try {
            // Get portfolio
            Optional<Portfolio> portfolioOpt = portfolioService.getAllPortfolios().stream().findFirst();
            if (portfolioOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(new ErrorResponse("NOT_FOUND", "Portfolio not found"));
            }
            Portfolio portfolio = portfolioOpt.get();

            // Calculate total cost
            BigDecimal totalCost = request.getPrice().multiply(BigDecimal.valueOf(request.getQuantity()));
            if (portfolio.getBalance().compareTo(totalCost) < 0) {
                throw new InsufficientFundsException("Insufficient balance for purchase");
            }

            // Update or create holdings
            Holdings holdings = holdingsService.getHoldingsBySymbol(request.getSymbol());
            if (holdings == null) {
                holdings = new Holdings(request.getSymbol(), request.getSymbol(), request.getQuantity(), request.getPrice(),
                    totalCost, totalCost, BigDecimal.ZERO, BigDecimal.ZERO);
            } else {
                int newQuantity = holdings.getQuantityOwned() + request.getQuantity();
                BigDecimal newTotalInvested = holdings.getTotalInvested().add(totalCost);
                BigDecimal newTotalValue = holdings.getBidPrice().multiply(BigDecimal.valueOf(newQuantity));
                holdings.setQuantityOwned(newQuantity);
                holdings.setTotalInvested(newTotalInvested);
                holdings.setTotalValue(newTotalValue);
                // Recalculate profit/loss
                holdings.setProfitLoss(newTotalValue.subtract(newTotalInvested));
                holdings.setProfitPercentageChange(holdings.getProfitLoss().divide(newTotalInvested, 4, BigDecimal.ROUND_HALF_UP).multiply(BigDecimal.valueOf(100)));
            }
            holdingsService.createHoldings(holdings);

            // Create transaction
            Transactions transaction = new Transactions(LocalDateTime.now(), request.getSymbol(), request.getSymbol(),
                request.getPrice(), request.getQuantity(), totalCost, "BUY");
            transactionsService.createTransaction(transaction);

            // Update portfolio
            portfolio.setBalance(portfolio.getBalance().subtract(totalCost));
            portfolio.setTotalInvested(portfolio.getTotalInvested().add(totalCost));
            portfolioService.updatePortfolio(portfolio);

            HoldingsResponse response = new HoldingsResponse(
                holdings.getId(),
                holdings.getCompanyName(),
                holdings.getSymbol(),
                holdings.getQuantityOwned(),
                holdings.getBidPrice(),
                holdings.getTotalValue(),
                holdings.getTotalInvested(),
                holdings.getProfitLoss(),
                holdings.getProfitPercentageChange()
            );
            return ResponseEntity.ok(response);
        } catch (InsufficientFundsException ex) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(new ErrorResponse("INSUFFICIENT_FUNDS", ex.getMessage()));
        } catch (Exception ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(new ErrorResponse("ERROR", ex.getMessage()));
        }
    }

    @PostMapping("/sell")
    public ResponseEntity<?> sellStock(@RequestBody SellRequest request) {
        try {
            Holdings holdings = holdingsService.getHoldingsBySymbol(request.getSymbol());
            if (holdings == null || holdings.getQuantityOwned() < request.getQuantity()) {
                throw new InvalidTransactionException("Insufficient holdings for sale");
            }

            // Calculate total proceeds
            BigDecimal totalProceeds = request.getPrice().multiply(BigDecimal.valueOf(request.getQuantity()));

            // Update holdings
            int newQuantity = holdings.getQuantityOwned() - request.getQuantity();
            BigDecimal soldInvested = holdings.getTotalInvested().divide(BigDecimal.valueOf(holdings.getQuantityOwned()), 4, BigDecimal.ROUND_HALF_UP).multiply(BigDecimal.valueOf(request.getQuantity()));
            BigDecimal newTotalInvested = holdings.getTotalInvested().subtract(soldInvested);
            BigDecimal newTotalValue = holdings.getBidPrice().multiply(BigDecimal.valueOf(newQuantity));
            holdings.setQuantityOwned(newQuantity);
            holdings.setTotalInvested(newTotalInvested);
            holdings.setTotalValue(newTotalValue);
            holdings.setProfitLoss(newTotalValue.subtract(newTotalInvested));
            holdings.setProfitPercentageChange(newTotalInvested.compareTo(BigDecimal.ZERO) > 0 ? holdings.getProfitLoss().divide(newTotalInvested, 4, BigDecimal.ROUND_HALF_UP).multiply(BigDecimal.valueOf(100)) : BigDecimal.ZERO);

            if (newQuantity == 0) {
                holdingsService.deleteHoldingsById(holdings.getId());
            } else {
                holdingsService.updateHoldings(holdings);
            }

            // Create transaction
            Transactions transaction = new Transactions(LocalDateTime.now(), request.getSymbol(), request.getSymbol(),
                request.getPrice(), request.getQuantity(), totalProceeds, "SELL");
            transactionsService.createTransaction(transaction);

            // Update portfolio
            Optional<Portfolio> portfolioOpt = portfolioService.getAllPortfolios().stream().findFirst();
            if (portfolioOpt.isPresent()) {
                Portfolio portfolio = portfolioOpt.get();
                portfolio.setBalance(portfolio.getBalance().add(totalProceeds));
                portfolio.setTotalInvested(portfolio.getTotalInvested().subtract(soldInvested));
                portfolioService.updatePortfolio(portfolio);
            }

            return ResponseEntity.ok("Stock sold successfully");
        } catch (InvalidTransactionException ex) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(new ErrorResponse("INVALID_TRANSACTION", ex.getMessage()));
        } catch (Exception ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(new ErrorResponse("ERROR", ex.getMessage()));
        }
    }
}
