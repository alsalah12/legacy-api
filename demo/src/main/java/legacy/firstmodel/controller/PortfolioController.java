package legacy.firstmodel.controller;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import legacy.firstmodel.dto.ErrorResponse;
import legacy.firstmodel.dto.PortfolioResponse;
import legacy.firstmodel.model.Portfolio;
import legacy.firstmodel.service.PortfolioService;

@RestController
@RequestMapping("/portfolio")
public class PortfolioController {

    @Autowired
    private PortfolioService portfolioService;

    @PostMapping
    public ResponseEntity<PortfolioResponse> createPortfolio(@RequestBody Portfolio portfolio) {
        Portfolio created = portfolioService.createPortfolio(portfolio);
        PortfolioResponse response = new PortfolioResponse(
            created.getId(),
            created.getTotalValue(),
            created.getTotalInvested(),
            created.getTotalProfit(),
            created.getTotalReturnPercent(),
            created.getBalance()
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    public ResponseEntity<List<PortfolioResponse>> getAllPortfolios() {
        List<Portfolio> portfolios = portfolioService.getAllPortfolios();
        List<PortfolioResponse> responses = portfolios.stream()
            .map(p -> new PortfolioResponse(
                p.getId(),
                p.getTotalValue(),
                p.getTotalInvested(),
                p.getTotalProfit(),
                p.getTotalReturnPercent(),
                p.getBalance()
            ))
            .collect(Collectors.toList());
        return ResponseEntity.ok(responses);
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getPortfolioById(@PathVariable Long id) {
        Optional<Portfolio> portfolio = portfolioService.getPortfolioById(id);
        if (portfolio.isPresent()) {
            Portfolio p = portfolio.get();
            PortfolioResponse response = new PortfolioResponse(
                p.getId(),
                p.getTotalValue(),
                p.getTotalInvested(),
                p.getTotalProfit(),
                p.getTotalReturnPercent(),
                p.getBalance()
            );
            return ResponseEntity.ok(response);
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
            p.setTotalValue(portfolio.getTotalValue());
            p.setTotalInvested(portfolio.getTotalInvested());
            p.setTotalProfit(portfolio.getTotalProfit());
            p.setTotalReturnPercent(portfolio.getTotalReturnPercent());
            p.setBalance(portfolio.getBalance());
            Portfolio updated = portfolioService.updatePortfolio(p);
            PortfolioResponse response = new PortfolioResponse(
                updated.getId(),
                updated.getTotalValue(),
                updated.getTotalInvested(),
                updated.getTotalProfit(),
                updated.getTotalReturnPercent(),
                updated.getBalance()
            );
            return ResponseEntity.ok(response);
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
    public ResponseEntity<PortfolioResponse> deposit(@PathVariable Long id, @RequestBody BigDecimal amount) {
        Optional<Portfolio> portfolioOpt = portfolioService.getPortfolioById(id);
        if (portfolioOpt.isPresent()) {
            Portfolio portfolio = portfolioOpt.get();
            portfolio.setBalance(portfolio.getBalance().add(amount));
            Portfolio updated = portfolioService.updatePortfolio(portfolio);
            PortfolioResponse response = new PortfolioResponse(
                updated.getId(),
                updated.getTotalValue(),
                updated.getTotalInvested(),
                updated.getTotalProfit(),
                updated.getTotalReturnPercent(),
                updated.getBalance()
            );
            return ResponseEntity.ok(response);
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping("/{id}/withdraw")
    public ResponseEntity<?> withdraw(@PathVariable Long id, @RequestBody BigDecimal amount) {
        Optional<Portfolio> portfolioOpt = portfolioService.getPortfolioById(id);
        if (portfolioOpt.isPresent()) {
            Portfolio portfolio = portfolioOpt.get();
            if (portfolio.getBalance().compareTo(amount) < 0) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(new ErrorResponse("INSUFFICIENT_FUNDS", "Insufficient balance"));
            }
            portfolio.setBalance(portfolio.getBalance().subtract(amount));
            Portfolio updated = portfolioService.updatePortfolio(portfolio);
            PortfolioResponse response = new PortfolioResponse(
                updated.getId(),
                updated.getTotalValue(),
                updated.getTotalInvested(),
                updated.getTotalProfit(),
                updated.getTotalReturnPercent(),
                updated.getBalance()
            );
            return ResponseEntity.ok(response);
        } else {
            return ResponseEntity.notFound().build();
        }
    }
}