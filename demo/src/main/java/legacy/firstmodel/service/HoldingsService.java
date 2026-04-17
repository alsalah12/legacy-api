package legacy.firstmodel.service;

import legacy.firstmodel.model.Holdings;
import legacy.firstmodel.repository.HoldingsRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class HoldingsService {

    @Autowired
    private HoldingsRepository holdingsRepository;

    public Holdings createHoldings(Holdings holdings) {
        return holdingsRepository.save(holdings);
    }

    public List<Holdings> getAllHoldings() {
        return holdingsRepository.findAll();
    }

    public Optional<Holdings> getHoldingsById(Long id) {
        return holdingsRepository.findById(id);
    }

    public Holdings getHoldingsBySymbol(String symbol) {
        return holdingsRepository.findBySymbol(symbol);
    }

    public Holdings updateHoldings(Holdings holdings) {
        return holdingsRepository.save(holdings);
    }

    public void deleteHoldingsById(Long id) {
        holdingsRepository.deleteById(id);
    }
}