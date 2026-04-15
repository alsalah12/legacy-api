package legacy.firstmodel.repository;
import org.springframework.data.jpa.repository.JpaRepository;
import legacy.firstmodel.model.Stock;
public interface StockRepository extends JpaRepository<Stock, Long> {
    
}
