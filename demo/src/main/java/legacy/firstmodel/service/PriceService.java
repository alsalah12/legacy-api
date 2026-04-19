package legacy.firstmodel.service;

import legacy.firstmodel.client.YahooClient;
import legacy.firstmodel.dto.HistoryResponse;
import legacy.firstmodel.dto.PriceResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class PriceService {

    @Autowired
    private YahooClient yahooClient;

    public PriceResponse getLivePrice(String symbol) {
        return yahooClient.getLivePrice(symbol);
    }

    public HistoryResponse getHistory(String symbol) {
        return yahooClient.getHistory(symbol);
    }
}