import numpy as np
import copy

class DifferentialPrivacyGuard:
    """Applies Laplace noise to numerical metrics to guarantee Differential Privacy."""
    
    def __init__(self, epsilon=1.0, sensitivity=1.0):
        self.epsilon = epsilon
        self.sensitivity = sensitivity
        self.budget_spent = 0.0

    def apply_laplace_noise(self, value):
        """Injects Laplace noise into a single numerical value."""
        scale = self.sensitivity / self.epsilon
        noise = np.random.laplace(0, scale)
        self.budget_spent += self.epsilon
        return max(0, int(round(value + noise)))
        
    def anonymize_dashboard_data(self, data):
        """Sanitizes raw dashboard output before exposing to API/UI."""
        sanitized = copy.deepcopy(data)
        
        for zone, stats in sanitized.get("zones", {}).items():
            if "vehicle_count" in stats:
                stats["vehicle_count"] = self.apply_laplace_noise(stats["vehicle_count"])
            if "pedestrian_count" in stats:
                stats["pedestrian_count"] = self.apply_laplace_noise(stats["pedestrian_count"])
                
        sanitized["privacy_budget_spent"] = round(self.budget_spent, 2)
        return sanitized
