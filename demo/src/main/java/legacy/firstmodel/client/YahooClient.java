package legacy.firstmodel.client;

import java.math.BigDecimal;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import legacy.firstmodel.dto.PriceResponse;

@Component
public class YahooClient {

    private final RestClient restClient = RestClient.builder().build();
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Value("${rapidapi.key:YOUR_RAPIDAPI_KEY_HERE}")
    private String rapidApiKey;

    public PriceResponse getLivePrice(String symbol) {
        if ("YOUR_RAPIDAPI_KEY_HERE".equals(rapidApiKey)) {
            throw new RuntimeException("Please configure your RapidAPI key in application.properties");
        }

        try {
            String url = "https://yahoo-finance15.p.rapidapi.com/api/v1/markets/quote?type=STOCKS&ticker=" + symbol.toUpperCase();

            String response = restClient.get()
                .uri(url)
                .header("x-rapidapi-key", rapidApiKey)
                .header("x-rapidapi-host", "yahoo-finance15.p.rapidapi.com")
                .header("Content-Type", "application/json")
                .retrieve()
                .body(String.class);

            JsonNode root = objectMapper.readTree(response);
            JsonNode body = root.get("body");

            if (body != null) {
                JsonNode quote = body.get("primaryData");
                String priceString = quote.get("lastSalePrice").asText();
                BigDecimal price = new BigDecimal(priceString.replace("$", "").replace(",", ""));
                return new PriceResponse(symbol.toUpperCase(), price);
            }

            throw new RuntimeException("Price not available for symbol: " + symbol);
        } catch (Exception ex) {
            throw new RuntimeException("Unable to fetch live price: " + ex.getMessage());
        }
    }
}