package legacy.firstmodel.controller;

import java.util.List;
import java.util.Optional;

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
import legacy.firstmodel.exception.StockNotFoundException;
import legacy.firstmodel.service.HoldingsService;

@RestController
@RequestMapping("/holdings")
public class HoldingsController {

    @Autowired
    private HoldingsService holdingsService;

    @PostMapping
    public ResponseEntity<?> createHoldings(@RequestBody HoldingsCreateRequest request) {
        try {
            HoldingsResponse response = holdingsService.createHoldings(request);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(new ErrorResponse("STOCK_NOT_FOUND", ex.getMessage()));
        } catch (Exception ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new ErrorResponse("ERROR", ex.getMessage()));
        }
    }

    @GetMapping
    public ResponseEntity<List<HoldingsResponse>> getAllHoldings() {
        List<HoldingsResponse> responses = holdingsService.getAllHoldingsResponses();
        return ResponseEntity.ok(responses);
    }

    @GetMapping("/symbol/{symbol}")
    public ResponseEntity<?> getHoldingsBySymbol(@PathVariable String symbol) {
        Optional<HoldingsResponse> response = holdingsService.getHoldingsResponseBySymbol(symbol);
        if (response.isPresent()) {
            return ResponseEntity.ok(response.get());
        }
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
            .body(new ErrorResponse("NOT_FOUND", "Holdings not found"));
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getHoldingsById(@PathVariable Long id) {
        Optional<HoldingsResponse> response = holdingsService.getHoldingsResponseById(id);
        if (response.isPresent()) {
            return ResponseEntity.ok(response.get());
        }
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
            .body(new ErrorResponse("NOT_FOUND", "Holdings not found"));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateHoldings(@PathVariable Long id, @RequestBody HoldingsCreateRequest request) {
        HoldingsResponse updated = holdingsService.updateHoldings(id, request);
        if (updated == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(new ErrorResponse("NOT_FOUND", "Holdings not found"));
        }
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteHoldings(@PathVariable Long id) {
        Optional<HoldingsResponse> holdings = holdingsService.getHoldingsResponseById(id);
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
            HoldingsResponse response = holdingsService.buyStock(request);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(new ErrorResponse("BAD_REQUEST", ex.getMessage()));
        } catch (InsufficientFundsException ex) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(new ErrorResponse("INSUFFICIENT_FUNDS", ex.getMessage()));
        } catch (StockNotFoundException ex) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(new ErrorResponse("NOT_FOUND", ex.getMessage()));
        } catch (IllegalStateException ex) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(new ErrorResponse("NOT_FOUND", ex.getMessage()));
        } catch (Exception ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new ErrorResponse("ERROR", ex.getMessage()));
        }
    }

    @PostMapping("/sell")
    public ResponseEntity<?> sellStock(@RequestBody SellRequest request) {
        try {
            String result = holdingsService.sellStock(request);
            return ResponseEntity.ok(result);
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(new ErrorResponse("BAD_REQUEST", ex.getMessage()));
        } catch (StockNotFoundException ex) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(new ErrorResponse("NOT_FOUND", ex.getMessage()));
        } catch (InvalidTransactionException ex) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(new ErrorResponse("INVALID_TRANSACTION", ex.getMessage()));
        } catch (IllegalStateException ex) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(new ErrorResponse("NOT_FOUND", ex.getMessage()));
        } catch (Exception ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new ErrorResponse("ERROR", ex.getMessage()));
        }
    }
}
