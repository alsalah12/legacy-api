package legacy.firstmodel.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import legacy.firstmodel.dto.ErrorResponse;
import legacy.firstmodel.dto.OptimizationRequestDTO;
import legacy.firstmodel.dto.OptimizationResponseDTO;
import legacy.firstmodel.service.QuantumOptimizationService;

@RestController
@RequestMapping("/quantum")
public class QuantumOptimizationController {

    @Autowired
    private QuantumOptimizationService quantumOptimizationService;

    @PostMapping("/optimize")
    public ResponseEntity<?> optimizePortfolio(@RequestBody OptimizationRequestDTO request) {
        try {
            OptimizationResponseDTO response = quantumOptimizationService.optimize(request);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(new ErrorResponse("INVALID_REQUEST", ex.getMessage()));
        } catch (Exception ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new ErrorResponse("ERROR", "Unable to optimize portfolio at this time."));
        }
    }
}
