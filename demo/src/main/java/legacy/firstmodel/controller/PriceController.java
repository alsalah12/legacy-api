package legacy.firstmodel.controller;

import java.math.BigDecimal;

import org.springframework.beans.factory.annotation.*;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.RestClient;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import legacy.firstmodel.dto.PriceResponse;

@RestController
@RequestMapping("/prices")
public class PriceController {

    private final RestClient restClient = RestClient.builder().build();
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Value("${rapidapi.key:YOUR_RAPIDAPI_KEY_HERE}")
    private String rapidApiKey;

    @GetMapping("/{symbol}")
    public ResponseEntity<?> getLivePrice(@PathVariable String symbol) {
        if ("YOUR_RAPIDAPI_KEY_HERE".equals(rapidApiKey)) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body("Please configure your RapidAPI key in application.properties");
        }

            String url = "https://yahoo-finance15.p.rapidapi.com/api/v1/markets/quote?type=STOCKS&ticker=" + symbol.toUpperCase();

            String response = restClient.get()
                .uri(url)
                .header("x-rapidapi-key", rapidApiKey)
                .header("x-rapidapi-host", "yahoo-finance15.p.rapidapi.com")
                .header("Content-Type", "application/json")
                .retrieve()
                .body(String.class);
            System.err.println("API Response: " + response); // Debug log
            try {
            JsonNode root = objectMapper.readTree(response);
            JsonNode body = root.get("body");

            if (body != null){ //&& body.isArray() && !body.isEmpty()) {
                JsonNode quote = body.get("primaryData");
               // if (quote.has("regularMarketPrice")) {
                String priceString = quote.get("lastSalePrice")
                .asText();
                BigDecimal price = new BigDecimal(priceString.replace("$", "")
                .replace(",", ""));
                return ResponseEntity.ok(new PriceResponse(symbol.toUpperCase(), price));
                    // if (priceNode.has("raw")) {
                    //     double priceDouble = priceNode.get("raw").asDouble();
                    //     BigDecimal price = BigDecimal.valueOf(priceDouble);
                    //     return ResponseEntity.ok(new PriceResponse(symbol.toUpperCase(), price));
                    // }
                //}
            }

            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body("Price not available for symbol: " + symbol);
        } catch (Exception ex) {
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                .body("Unable to fetch live price: " + ex.getMessage());
        }
    }
}

