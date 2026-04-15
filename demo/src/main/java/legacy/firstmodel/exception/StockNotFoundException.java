package legacy.firstmodel.exception;

public class StockNotFoundException extends RuntimeException {
    public StockNotFoundException(String message) {
        super("Stock not found: " + message);
    }
}
