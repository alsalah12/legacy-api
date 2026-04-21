package legacy.firstmodel.controller;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import legacy.firstmodel.dto.ErrorResponse;
import legacy.firstmodel.dto.PortfolioResponse;
import legacy.firstmodel.model.Holdings;
import legacy.firstmodel.model.Portfolio;
import legacy.firstmodel.service.HoldingsService;
import legacy.firstmodel.service.PortfolioService;

@RestController
@RequestMapping("/portfolio")
public class PortfolioController {

    @Autowired
    private PortfolioService portfolioService;

    @Autowired
    private HoldingsService holdingsService;

    private BigDecimal calculatePortfolioTotalValue() {
        return holdingsService.getAllHoldingsResponses().stream()
            .map(holdings -> holdings.getTotalValue() == null ? BigDecimal.ZERO : holdings.getTotalValue())
            .reduce(BigDecimal.ZERO, BigDecimal::add)
            .setScale(2, RoundingMode.HALF_UP);
    }

    private PortfolioResponse buildResponse(Portfolio portfolio) {
        BigDecimal totalValue = calculatePortfolioTotalValue();
        return new PortfolioResponse(
            portfolio.getId(),
            totalValue,
            portfolio.getTotalInvested(),
            portfolio.getTotalProfit(),
            portfolio.getTotalReturnPercent(),
            portfolio.getBalance()
        );
    }

    @PostMapping
    public ResponseEntity<PortfolioResponse> createPortfolio(@RequestBody Portfolio portfolio) {
        portfolio.setTotalValue(calculatePortfolioTotalValue());
        Portfolio created = portfolioService.createPortfolio(portfolio);
        return ResponseEntity.status(HttpStatus.CREATED).body(buildResponse(created));
    }

    @GetMapping
    public ResponseEntity<List<PortfolioResponse>> getAllPortfolios() {
        List<Portfolio> portfolios = portfolioService.getAllPortfolios();
        List<PortfolioResponse> responses = portfolios.stream()
            .map(this::buildResponse)
            .collect(Collectors.toList());
        return ResponseEntity.ok(responses);
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getPortfolioById(@PathVariable Long id) {
        Optional<Portfolio> portfolio = portfolioService.getPortfolioById(id);
        if (portfolio.isPresent()) {
            return ResponseEntity.ok(buildResponse(portfolio.get()));
        } else {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(new ErrorResponse("NOT_FOUND", "Portfolio not found"));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<PortfolioResponse> updatePortfolio(@PathVariable Long id, @RequestBody Portfolio portfolio) {
        Optional<Portfolio> existing = portfolioService.getPortfolioById(id);
        if (existing.isPresent()) {
            Portfolio p = existing.get();
            p.setTotalValue(calculatePortfolioTotalValue());
            p.setTotalInvested(portfolio.getTotalInvested());
            p.setTotalProfit(portfolio.getTotalProfit());
            p.setTotalReturnPercent(portfolio.getTotalReturnPercent());
            p.setBalance(portfolio.getBalance());
            Portfolio updated = portfolioService.updatePortfolio(p);
            return ResponseEntity.ok(buildResponse(updated));
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deletePortfolio(@PathVariable Long id) {
        Optional<Portfolio> portfolio = portfolioService.getPortfolioById(id);
        if (portfolio.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(new ErrorResponse("NOT_FOUND", "Portfolio not found"));
        }
        portfolioService.deletePortfolioById(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}/balance")
    public ResponseEntity<BigDecimal> getBalance(@PathVariable Long id) {
        Optional<Portfolio> portfolio = portfolioService.getPortfolioById(id);
        if (portfolio.isPresent()) {
            return ResponseEntity.ok(portfolio.get().getBalance());
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping("/{id}/deposit")
    public ResponseEntity<?> deposit(@PathVariable Long id, @RequestBody BigDecimal amount) {
        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(new ErrorResponse("BAD_REQUEST", "Amount must be greater than zero"));
        }

        Optional<Portfolio> portfolioOpt = portfolioService.getPortfolioById(id);
        if (portfolioOpt.isPresent()) {
            Portfolio portfolio = portfolioOpt.get();
            portfolio.setBalance(portfolio.getBalance().add(amount));
            Portfolio updated = portfolioService.updatePortfolio(portfolio);
            return ResponseEntity.ok(buildResponse(updated));
        } else {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(new ErrorResponse("NOT_FOUND", "Portfolio not found"));
        }
    }

    @PostMapping("/{id}/withdraw")
    public ResponseEntity<?> withdraw(@PathVariable Long id, @RequestBody BigDecimal amount) {
        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(new ErrorResponse("BAD_REQUEST", "Amount must be greater than zero"));
        }

        Optional<Portfolio> portfolioOpt = portfolioService.getPortfolioById(id);
        if (portfolioOpt.isPresent()) {
            Portfolio portfolio = portfolioOpt.get();
            if (portfolio.getBalance().compareTo(amount) < 0) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(new ErrorResponse("INSUFFICIENT_FUNDS", "Insufficient balance"));
            }
            portfolio.setBalance(portfolio.getBalance().subtract(amount));
            Portfolio updated = portfolioService.updatePortfolio(portfolio);
            return ResponseEntity.ok(buildResponse(updated));
        } else {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(new ErrorResponse("NOT_FOUND", "Portfolio not found"));
        }
    }
}
