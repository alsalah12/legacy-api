package legacy.exception;

public class StockNotFoundException extends RuntimeException {
    public StockNotFoundException(String message) {
        super("Stock not found: " + message);
    }
}
