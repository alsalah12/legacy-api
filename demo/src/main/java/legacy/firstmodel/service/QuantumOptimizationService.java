package legacy.firstmodel.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import legacy.firstmodel.dto.AllocationDTO;
import legacy.firstmodel.dto.HistoryResponse;
import legacy.firstmodel.dto.HoldingsResponse;
import legacy.firstmodel.dto.OptimizationRequestDTO;
import legacy.firstmodel.dto.OptimizationResponseDTO;
import legacy.firstmodel.dto.RecommendationDTO;

/**
 * Backend-only optimization engine. It can be replaced later with an external
 * optimizer (for example a Python/Qiskit service) without changing the API
 * contract exposed to the frontend.
 */
@Service
public class QuantumOptimizationService {

    private static final BigDecimal HUNDRED = BigDecimal.valueOf(100);
    private static final BigDecimal EPSILON = new BigDecimal("0.000001");
    private static final BigDecimal RISK_FREE_RATE = new BigDecimal("0.02");

    @Autowired
    private HoldingsService holdingsService;

    @Autowired
    private PriceService priceService;

    public OptimizationResponseDTO optimize(OptimizationRequestDTO request) {
        List<HoldingsResponse> holdings = holdingsService.getAllHoldingsResponses();
        if (holdings.isEmpty()) {
            throw new IllegalArgumentException("No holdings found to optimize.");
        }

        BigDecimal cashAvailable = safe(request.getCashAvailable());
        String riskTolerance = normalize(request.getRiskTolerance(), "medium");
        String targetObjective = normalize(request.getTargetObjective(), "balanced");
        int maxHoldings = Math.max(1, request.getMaxHoldings() == null ? holdings.size() : request.getMaxHoldings());

        BigDecimal currentPortfolioValue = holdings.stream()
            .map(this::resolveHoldingValue)
            .reduce(BigDecimal.ZERO, BigDecimal::add)
            .setScale(2, RoundingMode.HALF_UP);

        BigDecimal investableValue = currentPortfolioValue.add(cashAvailable);

        List<AssetMetrics> metrics = buildAssetMetrics(holdings, currentPortfolioValue, riskTolerance, targetObjective);

        List<AssetMetrics> selectedAssets = metrics.stream()
            .sorted(Comparator.comparing(AssetMetrics::score).reversed())
            .limit(Math.min(maxHoldings, metrics.size()))
            .collect(Collectors.toList());

        Map<String, BigDecimal> targetWeightBySymbol = computeTargetWeights(metrics, selectedAssets);

        List<AllocationDTO> currentAllocations = buildCurrentAllocations(metrics, currentPortfolioValue);
        List<AllocationDTO> optimizedAllocations = buildOptimizedAllocations(metrics, targetWeightBySymbol, investableValue);

        List<RecommendationDTO> recommendations = buildRecommendations(metrics, targetWeightBySymbol);

        BigDecimal expectedReturn = weightedExpectedReturn(metrics, targetWeightBySymbol)
            .multiply(HUNDRED)
            .setScale(2, RoundingMode.HALF_UP);

        BigDecimal expectedRisk = weightedExpectedRisk(metrics, targetWeightBySymbol)
            .multiply(HUNDRED)
            .setScale(2, RoundingMode.HALF_UP);

        BigDecimal sharpeRatio = calculateSharpeRatio(expectedReturn, expectedRisk);

        return new OptimizationResponseDTO(
            currentPortfolioValue,
            investableValue.setScale(2, RoundingMode.HALF_UP),
            expectedReturn,
            expectedRisk,
            sharpeRatio,
            recommendations,
            currentAllocations,
            optimizedAllocations
        );
    }

    private List<AssetMetrics> buildAssetMetrics(
        List<HoldingsResponse> holdings,
        BigDecimal currentPortfolioValue,
        String riskTolerance,
        String targetObjective
    ) {
        BigDecimal lambda = lambdaForRiskTolerance(riskTolerance);

        List<AssetMetrics> metrics = new ArrayList<>();
        for (HoldingsResponse holding : holdings) {
            BigDecimal value = resolveHoldingValue(holding);
            BigDecimal currentWeight = currentPortfolioValue.compareTo(BigDecimal.ZERO) > 0
                ? value.divide(currentPortfolioValue, 8, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

            RiskReturnEstimate estimate = estimateRiskReturn(holding);
            BigDecimal objectiveReturn = adjustReturnForObjective(estimate.expectedReturn(), targetObjective);
            BigDecimal objectiveRisk = adjustRiskForObjective(estimate.riskScore(), targetObjective);
            BigDecimal score = objectiveReturn.subtract(lambda.multiply(objectiveRisk));

            metrics.add(new AssetMetrics(
                holding.getSymbol(),
                holding.getCompanyName(),
                value,
                currentWeight,
                estimate.expectedReturn(),
                estimate.riskScore(),
                score
            ));
        }

        return metrics;
    }

    /**
     * Quantum-inspired weight assignment:
     *  1) score assets with return - lambda * risk
     *  2) keep top-N assets
     *  3) shift scores to positive space and normalize to 100%
     */
    private Map<String, BigDecimal> computeTargetWeights(List<AssetMetrics> allAssets, List<AssetMetrics> selectedAssets) {
        Map<String, BigDecimal> targetWeightBySymbol = new HashMap<>();
        for (AssetMetrics asset : allAssets) {
            targetWeightBySymbol.put(asset.symbol(), BigDecimal.ZERO);
        }

        if (selectedAssets.isEmpty()) {
            return targetWeightBySymbol;
        }

        BigDecimal minSelectedScore = selectedAssets.stream()
            .map(AssetMetrics::score)
            .min(Comparator.naturalOrder())
            .orElse(BigDecimal.ZERO);

        BigDecimal totalSignal = selectedAssets.stream()
            .map(asset -> asset.score().subtract(minSelectedScore).add(EPSILON))
            .reduce(BigDecimal.ZERO, BigDecimal::add);

        if (totalSignal.compareTo(BigDecimal.ZERO) <= 0) {
            BigDecimal even = BigDecimal.ONE.divide(BigDecimal.valueOf(selectedAssets.size()), 8, RoundingMode.HALF_UP);
            for (AssetMetrics asset : selectedAssets) {
                targetWeightBySymbol.put(asset.symbol(), even);
            }
            return targetWeightBySymbol;
        }

        for (AssetMetrics asset : selectedAssets) {
            BigDecimal signal = asset.score().subtract(minSelectedScore).add(EPSILON);
            BigDecimal normalized = signal.divide(totalSignal, 8, RoundingMode.HALF_UP);
            targetWeightBySymbol.put(asset.symbol(), normalized);
        }

        return targetWeightBySymbol;
    }

    private List<AllocationDTO> buildCurrentAllocations(List<AssetMetrics> assets, BigDecimal portfolioValue) {
        return assets.stream()
            .map(asset -> new AllocationDTO(
                asset.symbol(),
                asset.companyName(),
                asset.currentWeight().multiply(HUNDRED).setScale(2, RoundingMode.HALF_UP),
                asset.currentValue().setScale(2, RoundingMode.HALF_UP)
            ))
            .collect(Collectors.toList());
    }

    private List<AllocationDTO> buildOptimizedAllocations(
        List<AssetMetrics> assets,
        Map<String, BigDecimal> targetWeightBySymbol,
        BigDecimal investableValue
    ) {
        return assets.stream()
            .map(asset -> {
                BigDecimal targetWeight = targetWeightBySymbol.getOrDefault(asset.symbol(), BigDecimal.ZERO);
                BigDecimal targetValue = investableValue.multiply(targetWeight).setScale(2, RoundingMode.HALF_UP);
                return new AllocationDTO(
                    asset.symbol(),
                    asset.companyName(),
                    targetWeight.multiply(HUNDRED).setScale(2, RoundingMode.HALF_UP),
                    targetValue
                );
            })
            .collect(Collectors.toList());
    }

    private List<RecommendationDTO> buildRecommendations(
        List<AssetMetrics> assets,
        Map<String, BigDecimal> targetWeightBySymbol
    ) {
        return assets.stream()
            .map(asset -> {
                BigDecimal currentWeightPercent = asset.currentWeight().multiply(HUNDRED).setScale(2, RoundingMode.HALF_UP);
                BigDecimal targetWeightPercent = targetWeightBySymbol.getOrDefault(asset.symbol(), BigDecimal.ZERO)
                    .multiply(HUNDRED)
                    .setScale(2, RoundingMode.HALF_UP);

                BigDecimal delta = targetWeightPercent.subtract(currentWeightPercent);
                String action;
                if (delta.compareTo(new BigDecimal("2.00")) > 0) {
                    action = "BUY";
                } else if (delta.compareTo(new BigDecimal("-2.00")) < 0) {
                    action = "SELL";
                } else {
                    action = "HOLD";
                }

                return new RecommendationDTO(
                    asset.symbol(),
                    asset.companyName(),
                    action,
                    currentWeightPercent,
                    targetWeightPercent,
                    asset.expectedReturn().multiply(HUNDRED).setScale(2, RoundingMode.HALF_UP),
                    asset.riskScore().multiply(HUNDRED).setScale(2, RoundingMode.HALF_UP),
                    asset.score().setScale(4, RoundingMode.HALF_UP)
                );
            })
            .sorted(Comparator.comparing(RecommendationDTO::getScore).reversed())
            .collect(Collectors.toList());
    }

    private BigDecimal weightedExpectedReturn(List<AssetMetrics> assets, Map<String, BigDecimal> targetWeightBySymbol) {
        return assets.stream()
            .map(asset -> targetWeightBySymbol.getOrDefault(asset.symbol(), BigDecimal.ZERO).multiply(asset.expectedReturn()))
            .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private BigDecimal weightedExpectedRisk(List<AssetMetrics> assets, Map<String, BigDecimal> targetWeightBySymbol) {
        return assets.stream()
            .map(asset -> targetWeightBySymbol.getOrDefault(asset.symbol(), BigDecimal.ZERO).multiply(asset.riskScore()))
            .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private BigDecimal calculateSharpeRatio(BigDecimal expectedReturnPercent, BigDecimal expectedRiskPercent) {
        BigDecimal expectedReturnDecimal = expectedReturnPercent.divide(HUNDRED, 8, RoundingMode.HALF_UP);
        BigDecimal expectedRiskDecimal = expectedRiskPercent.divide(HUNDRED, 8, RoundingMode.HALF_UP);

        if (expectedRiskDecimal.compareTo(BigDecimal.ZERO) <= 0) {
            return BigDecimal.ZERO;
        }

        return expectedReturnDecimal.subtract(RISK_FREE_RATE)
            .divide(expectedRiskDecimal, 4, RoundingMode.HALF_UP);
    }

    private RiskReturnEstimate estimateRiskReturn(HoldingsResponse holding) {
        List<BigDecimal> closes = new ArrayList<>();
        try {
            HistoryResponse history = priceService.getHistory(holding.getSymbol());
            if (history != null && history.getDataPoints() != null) {
                for (HistoryResponse.HistoryDataPoint point : history.getDataPoints()) {
                    BigDecimal close = parseDecimal(point.getClose());
                    if (close.compareTo(BigDecimal.ZERO) > 0) {
                        closes.add(close);
                    }
                }
            }
        } catch (Exception ignored) {
            // Fall back to holding-level metrics when external history is unavailable.
        }

        BigDecimal historicalReturn;
        BigDecimal volatility;

        if (closes.size() >= 2) {
            BigDecimal first = closes.get(0);
            BigDecimal last = closes.get(closes.size() - 1);
            historicalReturn = first.compareTo(BigDecimal.ZERO) > 0
                ? last.subtract(first).divide(first, 8, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

            List<Double> dailyReturns = new ArrayList<>();
            for (int i = 1; i < closes.size(); i++) {
                BigDecimal previous = closes.get(i - 1);
                BigDecimal current = closes.get(i);
                if (previous.compareTo(BigDecimal.ZERO) <= 0) {
                    continue;
                }
                BigDecimal r = current.subtract(previous).divide(previous, 8, RoundingMode.HALF_UP);
                dailyReturns.add(r.doubleValue());
            }

            volatility = standardDeviation(dailyReturns);
            volatility = volatility.multiply(BigDecimal.valueOf(Math.sqrt(252d)));
        } else {
            historicalReturn = safe(holding.getProfitPercentageChange()).divide(HUNDRED, 8, RoundingMode.HALF_UP);
            volatility = safe(holding.getProfitPercentageChange()).abs().divide(new BigDecimal("250"), 8, RoundingMode.HALF_UP);
        }

        BigDecimal positionReturn = safe(holding.getProfitPercentageChange()).divide(HUNDRED, 8, RoundingMode.HALF_UP);
        BigDecimal expectedReturn = historicalReturn.multiply(new BigDecimal("0.65"))
            .add(positionReturn.multiply(new BigDecimal("0.35")));

        BigDecimal riskFloor = new BigDecimal("0.03");
        BigDecimal expectedRisk = volatility.max(riskFloor);

        return new RiskReturnEstimate(expectedReturn, expectedRisk);
    }

    private BigDecimal standardDeviation(List<Double> values) {
        if (values == null || values.isEmpty()) {
            return new BigDecimal("0.05");
        }

        double mean = values.stream().filter(Objects::nonNull).mapToDouble(Double::doubleValue).average().orElse(0d);
        double variance = values.stream()
            .filter(Objects::nonNull)
            .mapToDouble(value -> Math.pow(value - mean, 2))
            .average()
            .orElse(0d);

        return BigDecimal.valueOf(Math.sqrt(variance));
    }

    private BigDecimal lambdaForRiskTolerance(String riskTolerance) {
        return switch (riskTolerance) {
            case "low" -> new BigDecimal("1.35");
            case "high" -> new BigDecimal("0.35");
            default -> new BigDecimal("0.80");
        };
    }

    private BigDecimal adjustReturnForObjective(BigDecimal expectedReturn, String objective) {
        return switch (objective) {
            case "growth" -> expectedReturn.multiply(new BigDecimal("1.25"));
            case "low-risk" -> expectedReturn.multiply(new BigDecimal("0.85"));
            default -> expectedReturn;
        };
    }

    private BigDecimal adjustRiskForObjective(BigDecimal riskScore, String objective) {
        return switch (objective) {
            case "growth" -> riskScore.multiply(new BigDecimal("0.95"));
            case "low-risk" -> riskScore.multiply(new BigDecimal("1.15"));
            default -> riskScore;
        };
    }

    private BigDecimal resolveHoldingValue(HoldingsResponse holding) {
        BigDecimal totalValue = safe(holding.getTotalValue());
        if (totalValue.compareTo(BigDecimal.ZERO) > 0) {
            return totalValue;
        }

        BigDecimal bidPrice = safe(holding.getBidPrice());
        int qty = holding.getQuantityOwned() == null ? 0 : Math.max(0, holding.getQuantityOwned());
        return bidPrice.multiply(BigDecimal.valueOf(qty));
    }

    private BigDecimal parseDecimal(String value) {
        if (value == null || value.isBlank()) {
            return BigDecimal.ZERO;
        }

        try {
            return new BigDecimal(value.trim());
        } catch (NumberFormatException ex) {
            return BigDecimal.ZERO;
        }
    }

    private BigDecimal safe(BigDecimal value) {
        return value == null ? BigDecimal.ZERO : value;
    }

    private String normalize(String value, String fallback) {
        if (value == null || value.isBlank()) {
            return fallback;
        }
        return value.trim().toLowerCase(Locale.ROOT);
    }

    private record RiskReturnEstimate(BigDecimal expectedReturn, BigDecimal riskScore) {
    }

    private record AssetMetrics(
        String symbol,
        String companyName,
        BigDecimal currentValue,
        BigDecimal currentWeight,
        BigDecimal expectedReturn,
        BigDecimal riskScore,
        BigDecimal score
    ) {
    }
}
