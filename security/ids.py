import numpy as np

class TelemetryIDS:
    """Intrusion Detection System for Traffic Telemetry.
    Detects sensor spoofing, rate-of-change anomalies, and impossible traffic states.
    """
    def __init__(self):
        self.last_state = {}

    def analyze(self, current_features, iso_forest_result, zone="Zone A"):
        """Analyze current telemetry for malicious data injection."""
        vehicle_count = current_features.get("vehicle_count", 0)
        lane_density = current_features.get("lane_density", 0.0)
        
        last = self.last_state.get(zone, {})
        last_vehicle_count = last.get("vehicle_count", vehicle_count)
        
        # Rule 1: Impossible Physics (High count, zero density)
        physics_violation = (vehicle_count > 15 and lane_density < 0.1)
        
        # Rule 2: Rate of Change Anomaly (Sudden jump in count > 20 in one tick)
        rate_of_change = abs(vehicle_count - last_vehicle_count)
        roc_violation = rate_of_change > 20
        
        # Rule 3: Isolation Forest Anomaly
        ml_anomaly = iso_forest_result.get("anomaly_detected", False)
        
        is_compromised = physics_violation or roc_violation or ml_anomaly
        
        attack_types = []
        if physics_violation: attack_types.append("Physics Contradiction (Spoofing)")
        if roc_violation: attack_types.append("Rate-of-Change Anomaly (Data Injection)")
        if ml_anomaly: attack_types.append("Isolation Forest Anomaly")
        
        self.last_state[zone] = current_features.copy()
        
        return {
            "sensor_integrity": "COMPROMISED" if is_compromised else "SECURE",
            "attack_type": " | ".join(attack_types) if is_compromised else None,
            "is_compromised": is_compromised
        }
