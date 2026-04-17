package legacy.firstmodel.repository;

import legacy.firstmodel.model.Holdings;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface HoldingsRepository extends JpaRepository<Holdings, Long> {
    Holdings findBySymbol(String symbol);
}