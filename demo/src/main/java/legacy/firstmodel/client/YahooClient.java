package legacy.firstmodel.client;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import legacy.firstmodel.dto.HistoryResponse;
import legacy.firstmodel.dto.HistoryResponse.HistoryDataPoint;
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
    public HistoryResponse getHistory(String symbol) {
        if ("YOUR_RAPIDAPI_KEY_HERE".equals(rapidApiKey)) {
            throw new RuntimeException("Please configure your RapidAPI key in application.properties");
        }

        try {
            String url = "https://yahoo-finance15.p.rapidapi.com/api/v1/markets/stock/history?symbol=" + symbol.toUpperCase() + "&interval=5m&diffandsplits=false";

            String response = restClient.get()
                .uri(url)
                .header("x-rapidapi-key", rapidApiKey)
                .header("x-rapidapi-host", "yahoo-finance15.p.rapidapi.com")
                .header("Content-Type", "application/json")
                .retrieve()
                .body(String.class);

            JsonNode root = objectMapper.readTree(response);
            JsonNode bodyNode = root.get("body");

            if (bodyNode != null && bodyNode.isObject()) {
                List<HistoryDataPoint> allDataPoints = new ArrayList<>();
                
                // Collect all data points from the object
                bodyNode.fields().forEachRemaining(entry -> {
                    JsonNode point = entry.getValue();
                    if (point != null) {
                        String date = point.has("date") ? point.get("date").asText() : null;
                        String closePrice = point.has("close") ? point.get("close").asText() : null;
                        if (date != null && closePrice != null) {
                            allDataPoints.add(new HistoryDataPoint(date, closePrice));
                        }
                    }
                });

                // Sample 60 points equally spaced
                List<HistoryDataPoint> dataPoints = new ArrayList<>();
                int totalPoints = allDataPoints.size();
                if (totalPoints > 0) {
                    int samplingInterval = Math.max(1, totalPoints / 60);
                    for (int i = 0; i < totalPoints; i += samplingInterval) {
                        if (dataPoints.size() < 60) {
                            dataPoints.add(allDataPoints.get(i));
                        }
                    }
                }

                return new HistoryResponse(symbol.toUpperCase(), dataPoints);
            }

            throw new RuntimeException("History data not available for symbol: " + symbol);
        } catch (Exception ex) {
            throw new RuntimeException("Unable to fetch history: " + ex.getMessage());
        }
    }
}
