package legacy.firstmodel.service;

import legacy.firstmodel.model.Transactions;
import legacy.firstmodel.repository.TransactionsRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class TransactionsService {

    @Autowired
    private TransactionsRepository transactionsRepository;

    public Transactions createTransaction(Transactions transaction) {
        return transactionsRepository.save(transaction);
    }

    public List<Transactions> getAllTransactions() {
        return transactionsRepository.findAll();
    }

    public Optional<Transactions> getTransactionById(Long id) {
        return transactionsRepository.findById(id);
    }

    public List<Transactions> getTransactionsBySymbol(String symbol) {
        return transactionsRepository.findBySymbol(symbol);
    }

    public Transactions updateTransaction(Transactions transaction) {
        return transactionsRepository.save(transaction);
    }

    public void deleteTransactionById(Long id) {
        transactionsRepository.deleteById(id);
    }
}