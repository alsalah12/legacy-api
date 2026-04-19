package legacy.firstmodel.controller;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import legacy.firstmodel.dto.ErrorResponse;
import legacy.firstmodel.dto.TransactionsCreateRequest;
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
                t.getDate(),
                t.getTime(),
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
                t.getDate(),
                t.getTime(),
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
                t.getDate(),
                t.getTime(),
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

    @PostMapping
    public ResponseEntity<TransactionsResponse> createTransaction(@RequestBody TransactionsCreateRequest request) {
        java.time.LocalDateTime now = java.time.LocalDateTime.now();
        java.time.format.DateTimeFormatter dateFormatter = java.time.format.DateTimeFormatter.ofPattern("dd/MM/yyyy");
        java.time.format.DateTimeFormatter timeFormatter = java.time.format.DateTimeFormatter.ofPattern("HH:mm");
        Transactions transaction = new Transactions(
            now.format(dateFormatter),
            now.format(timeFormatter),
            request.getCompanyName(),
            request.getSymbol(),
            request.getStockPrice(),
            request.getQuantity(),
            request.getTotalPrice(),
            request.getTransactionType()
        );
        Transactions created = transactionsService.createTransaction(transaction);
        TransactionsResponse response = new TransactionsResponse(
            created.getId(),
            created.getDate(),
            created.getTime(),
            created.getCompanyName(),
            created.getSymbol(),
            created.getStockPrice(),
            created.getQuantity(),
            created.getTotalPrice(),
            created.getTransactionType()
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
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