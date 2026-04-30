package legacy.firstmodel.dto;

import java.math.BigDecimal;

/**
 * Represents an allocation slice for current or optimized portfolio composition.
 */
public class AllocationDTO {
    private String symbol;
    private String companyName;
    private BigDecimal weight;
    private BigDecimal value;

    public AllocationDTO() {
    }

    public AllocationDTO(String symbol, String companyName, BigDecimal weight, BigDecimal value) {
        this.symbol = symbol;
        this.companyName = companyName;
        this.weight = weight;
        this.value = value;
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

    public BigDecimal getWeight() {
        return weight;
    }

    public void setWeight(BigDecimal weight) {
        this.weight = weight;
    }

    public BigDecimal getValue() {
        return value;
    }

    public void setValue(BigDecimal value) {
        this.value = value;
    }
}
