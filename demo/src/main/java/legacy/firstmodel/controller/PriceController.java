package legacy.firstmodel.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import legacy.firstmodel.dto.HistoryResponse;
import legacy.firstmodel.dto.PriceResponse;
import legacy.firstmodel.service.PriceService;

@RestController
@RequestMapping("/prices")
public class PriceController {

    @Autowired
    private PriceService priceService;

    @GetMapping("/{symbol}")
    public ResponseEntity<PriceResponse> getLivePrice(@PathVariable String symbol) {
        PriceResponse price = priceService.getLivePrice(symbol);
        return ResponseEntity.ok(price);
    }

    @GetMapping("/{symbol}/history")
    public ResponseEntity<HistoryResponse> getHistory(@PathVariable String symbol) {
        HistoryResponse history = priceService.getHistory(symbol);
        return ResponseEntity.ok(history);
    }
}
