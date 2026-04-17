package legacy.firstmodel.controller;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import legacy.firstmodel.dto.ErrorResponse;
import legacy.firstmodel.dto.TransactionsResponse;
import legacy.firstmodel.model.Transactions;
import legacy.firstmodel.service.TransactionsService;

@RestController
@RequestMapping("/transactions")
public class TransactionsController {

    @Autowired
    private TransactionsService transactionsService;

    @GetMapping
    public ResponseEntity<List<TransactionsResponse>> getAllTransactions() {
        List<Transactions> transactions = transactionsService.getAllTransactions();
        List<TransactionsResponse> responses = transactions.stream()
            .map(t -> new TransactionsResponse(
                t.getId(),
                t.getDateTime(),
                t.getCompanyName(),
                t.getSymbol(),
                t.getStockPrice(),
                t.getQuantity(),
                t.getTotalPrice(),
                t.getTransactionType()
            ))
            .collect(Collectors.toList());
        return ResponseEntity.ok(responses);
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getTransactionById(@PathVariable Long id) {
        Optional<Transactions> transaction = transactionsService.getTransactionById(id);
        if (transaction.isPresent()) {
            Transactions t = transaction.get();
            TransactionsResponse response = new TransactionsResponse(
                t.getId(),
                t.getDateTime(),
                t.getCompanyName(),
                t.getSymbol(),
                t.getStockPrice(),
                t.getQuantity(),
                t.getTotalPrice(),
                t.getTransactionType()
            );
            return ResponseEntity.ok(response);
        } else {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(new ErrorResponse("NOT_FOUND", "Transaction not found"));
        }
    }

    @GetMapping("/symbol/{symbol}")
    public ResponseEntity<List<TransactionsResponse>> getTransactionsBySymbol(@PathVariable String symbol) {
        List<Transactions> transactions = transactionsService.getTransactionsBySymbol(symbol);
        List<TransactionsResponse> responses = transactions.stream()
            .map(t -> new TransactionsResponse(
                t.getId(),
                t.getDateTime(),
                t.getCompanyName(),
                t.getSymbol(),
                t.getStockPrice(),
                t.getQuantity(),
                t.getTotalPrice(),
                t.getTransactionType()
            ))
            .collect(Collectors.toList());
        return ResponseEntity.ok(responses);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteTransaction(@PathVariable Long id) {
        Optional<Transactions> transaction = transactionsService.getTransactionById(id);
        if (transaction.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(new ErrorResponse("NOT_FOUND", "Transaction not found"));
        }
        transactionsService.deleteTransactionById(id);
        return ResponseEntity.noContent().build();
    }
}