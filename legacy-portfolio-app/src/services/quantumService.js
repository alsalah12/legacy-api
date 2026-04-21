import apiClient from "./api";

/**
 * Centralized API call for quantum-inspired optimization.
 * Keeps request/response handling out of UI components.
 */
export async function runQuantumOptimization(payload) {
  const { data } = await apiClient.post("/quantum/optimize", payload);
  return data;
}
