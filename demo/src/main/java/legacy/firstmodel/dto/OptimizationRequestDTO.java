package legacy.firstmodel.dto;

import java.math.BigDecimal;

/**
 * Request payload for quantum-inspired portfolio optimization.
 */
public class OptimizationRequestDTO {
    private String riskTolerance;
    private String targetObjective;
    private Integer maxHoldings;
    private BigDecimal cashAvailable;

    public OptimizationRequestDTO() {
    }

    public String getRiskTolerance() {
        return riskTolerance;
    }

    public void setRiskTolerance(String riskTolerance) {
        this.riskTolerance = riskTolerance;
    }

    public String getTargetObjective() {
        return targetObjective;
    }

    public void setTargetObjective(String targetObjective) {
        this.targetObjective = targetObjective;
    }

    public Integer getMaxHoldings() {
        return maxHoldings;
    }

    public void setMaxHoldings(Integer maxHoldings) {
        this.maxHoldings = maxHoldings;
    }

    public BigDecimal getCashAvailable() {
        return cashAvailable;
    }

    public void setCashAvailable(BigDecimal cashAvailable) {
        this.cashAvailable = cashAvailable;
    }
}
