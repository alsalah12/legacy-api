package legacy.firstmodel.dto;

import java.util.List;

public class HistoryResponse {
    private String symbol;
    private List<HistoryDataPoint> dataPoints;

    public HistoryResponse() {}

    public HistoryResponse(String symbol, List<HistoryDataPoint> dataPoints) {
        this.symbol = symbol;
        this.dataPoints = dataPoints;
    }

    public String getSymbol() { return symbol; }
    public void setSymbol(String symbol) { this.symbol = symbol; }

    public List<HistoryDataPoint> getDataPoints() { return dataPoints; }
    public void setDataPoints(List<HistoryDataPoint> dataPoints) { this.dataPoints = dataPoints; }

    public static class HistoryDataPoint {
        private String date;
        private String close;

        public HistoryDataPoint() {}

        public HistoryDataPoint(String date, String close) {
            this.date = date;
            this.close = close;
        }

        public String getDate() { return date; }
        public void setDate(String date) { this.date = date; }

        public String getClose() { return close; }
        public void setClose(String close) { this.close = close; }
    }
}
