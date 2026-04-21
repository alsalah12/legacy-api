package legacy.firstmodel.dto;

import java.math.BigDecimal;

/**
 * Suggested action to move from current to optimized allocation.
 */
public class RecommendationDTO {
    private String symbol;
    private String companyName;
    private String action;
    private BigDecimal currentWeight;
    private BigDecimal targetWeight;
    private BigDecimal expectedReturn;
    private BigDecimal riskScore;
    private BigDecimal score;

    public RecommendationDTO() {
    }

    public RecommendationDTO(
        String symbol,
        String companyName,
        String action,
        BigDecimal currentWeight,
        BigDecimal targetWeight,
        BigDecimal expectedReturn,
        BigDecimal riskScore,
        BigDecimal score
    ) {
        this.symbol = symbol;
        this.companyName = companyName;
        this.action = action;
        this.currentWeight = currentWeight;
        this.targetWeight = targetWeight;
        this.expectedReturn = expectedReturn;
        this.riskScore = riskScore;
        this.score = score;
    }

    public String getSymbol() {
        return symbol;
    }

    public void setSymbol(String symbol) {
        this.symbol = symbol;
    }

    public String getCompanyName() {
        return companyName;
    }

    public void setCompanyName(String companyName) {
        this.companyName = companyName;
    }

    public String getAction() {
        return action;
    }

    public void setAction(String action) {
        this.action = action;
    }

    public BigDecimal getCurrentWeight() {
        return currentWeight;
    }

    public void setCurrentWeight(BigDecimal currentWeight) {
        this.currentWeight = currentWeight;
    }

    public BigDecimal getTargetWeight() {
        return targetWeight;
    }

    public void setTargetWeight(BigDecimal targetWeight) {
        this.targetWeight = targetWeight;
    }

    public BigDecimal getExpectedReturn() {
        return expectedReturn;
    }

    public void setExpectedReturn(BigDecimal expectedReturn) {
        this.expectedReturn = expectedReturn;
    }

    public BigDecimal getRiskScore() {
        return riskScore;
    }

    public void setRiskScore(BigDecimal riskScore) {
        this.riskScore = riskScore;
    }

    public BigDecimal getScore() {
        return score;
    }

    public void setScore(BigDecimal score) {
        this.score = score;
    }
}
