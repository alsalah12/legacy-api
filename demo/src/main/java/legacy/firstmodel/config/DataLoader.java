package legacy.firstmodel.config;

import javax.smartcardio.CommandAPDU;

import org.springframework.boot.CommandLineRunner;

import legacy.firstmodel.repository.StockRepository;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import legacy.firstmodel.model.Stock;

@Configuration
public class DataLoader {
    @Bean
    CommandLineRunner loadData(StockRepository stockRepository) {
        return args -> {
            stockRepository.save(new Stock("Apple", "Kool Aid", 1000.00));
            stockRepository.save(new Stock("Bottom", "Denim", 500.00));
            stockRepository.save(new Stock("Jeans", "Levi's", 200.00));
        };
    }
}
