package legacy.firstmodel.dto;

import java.math.BigDecimal;
import java.util.List;

/**
 * Response returned by quantum-inspired optimization endpoint.
 */
public class OptimizationResponseDTO {
    private BigDecimal currentPortfolioValue;
    private BigDecimal optimizedPortfolioValue;
    private BigDecimal expectedReturn;
    private BigDecimal expectedRisk;
    private BigDecimal sharpeRatio;
    private List<RecommendationDTO> recommendations;
    private List<AllocationDTO> currentAllocations;
    private List<AllocationDTO> optimizedAllocations;

    public OptimizationResponseDTO() {
    }

    public OptimizationResponseDTO(
        BigDecimal currentPortfolioValue,
        BigDecimal optimizedPortfolioValue,
        BigDecimal expectedReturn,
        BigDecimal expectedRisk,
        BigDecimal sharpeRatio,
        List<RecommendationDTO> recommendations,
        List<AllocationDTO> currentAllocations,
        List<AllocationDTO> optimizedAllocations
    ) {
        this.currentPortfolioValue = currentPortfolioValue;
        this.optimizedPortfolioValue = optimizedPortfolioValue;
        this.expectedReturn = expectedReturn;
        this.expectedRisk = expectedRisk;
        this.sharpeRatio = sharpeRatio;
        this.recommendations = recommendations;
        this.currentAllocations = currentAllocations;
        this.optimizedAllocations = optimizedAllocations;
    }

    public BigDecimal getCurrentPortfolioValue() {
        return currentPortfolioValue;
    }

    public void setCurrentPortfolioValue(BigDecimal currentPortfolioValue) {
        this.currentPortfolioValue = currentPortfolioValue;
    }

    public BigDecimal getOptimizedPortfolioValue() {
        return optimizedPortfolioValue;
    }

    public void setOptimizedPortfolioValue(BigDecimal optimizedPortfolioValue) {
        this.optimizedPortfolioValue = optimizedPortfolioValue;
    }

    public BigDecimal getExpectedReturn() {
        return expectedReturn;
    }

    public void setExpectedReturn(BigDecimal expectedReturn) {
        this.expectedReturn = expectedReturn;
    }

    public BigDecimal getExpectedRisk() {
        return expectedRisk;
    }

    public void setExpectedRisk(BigDecimal expectedRisk) {
        this.expectedRisk = expectedRisk;
    }

    public BigDecimal getSharpeRatio() {
        return sharpeRatio;
    }

    public void setSharpeRatio(BigDecimal sharpeRatio) {
        this.sharpeRatio = sharpeRatio;
    }

    public List<RecommendationDTO> getRecommendations() {
        return recommendations;
    }

    public void setRecommendations(List<RecommendationDTO> recommendations) {
        this.recommendations = recommendations;
    }

    public List<AllocationDTO> getCurrentAllocations() {
        return currentAllocations;
    }

    public void setCurrentAllocations(List<AllocationDTO> currentAllocations) {
        this.currentAllocations = currentAllocations;
    }

    public List<AllocationDTO> getOptimizedAllocations() {
        return optimizedAllocations;
    }

    public void setOptimizedAllocations(List<AllocationDTO> optimizedAllocations) {
        this.optimizedAllocations = optimizedAllocations;
    }
}
