# ═══════════════════════════════════════════════════════════════════
# PriviTraffic AI — Main Pipeline
# Orchestrates all 5 layers end-to-end
# ═══════════════════════════════════════════════════════════════════

import sys
import os
import json
import time
import numpy as np

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from layers.layer1_cv import Layer1Pipeline
from layers.layer2_ml import Layer2Pipeline
from layers.layer3_dl import Layer3Pipeline
from layers.layer4_bns import Layer4Pipeline
from layers.layer5_decision import DecisionEngine
from security.ids import TelemetryIDS


class PriviTrafficPipeline:
    """
    🚦🔐 PriviTraffic AI — Complete Pipeline

    Privacy-Preserving Smart Traffic Intelligence
    using Bayesian Neuro-Symbolic Learning.

    Architecture:
        Video + Sensors
              ↓
        TensorFlow + OpenCV (Layer 1)
              ↓
        RF | XGBoost | SVM | Isolation Forest (Layer 2)
              ↓
        MLP | LSTM | BNN (Layer 3)
              ↓
        Bayesian Neuro-Symbolic Engine (Layer 4)
              ↓
        Decision + Privacy Rules (Layer 5)
              ↓
        Dashboard
    """

    def __init__(self):
        self.layer1 = Layer1Pipeline()
        self.layer2 = Layer2Pipeline()
        self.layer3 = Layer3Pipeline()
        self.layer4 = Layer4Pipeline()
        self.decision_engine = DecisionEngine()
        self.ids = TelemetryIDS()
        self.zones = ["Zone A", "Zone B", "Zone C", "Zone D"]

    def run_single(self, zone="Zone A", frame=None):
        """Run the complete pipeline once for a single zone."""
        # Layer 1: Computer Vision + Privacy
        l1_out = self.layer1.process(frame)

        # Layer 2: Classical ML
        l2_out = self.layer2.process(l1_out)

        # Layer 3: Deep Learning
        l3_out = self.layer3.process(l1_out)

        # Security: Intrusion Detection System
        ids_out = self.ids.analyze(l1_out, l2_out["isolation_forest"], zone=zone)
        
        # Layer 4: BNS Engine
        # Pass ids_out to BNS for security guardrails
        l4_out = self.layer4.process(l1_out, l2_out, l3_out, ids_out=ids_out)

        # Layer 5: Decision
        decision = self.decision_engine.make_decision(
            l1_out, l2_out, l3_out, l4_out, zone=zone)
            
        # Merge security info into decision
        decision["security_status"] = ids_out

        return {
            "layer1": l1_out,
            "layer2": l2_out,
            "layer3": l3_out,
            "layer4": l4_out,
            "security": ids_out,
            "decision": decision,
        }

    def run_all_zones(self):
        """Run pipeline for all zones simultaneously."""
        results = {}
        for zone in self.zones:
            results[zone] = self.run_single(zone=zone)
        return results

    def get_dashboard_data(self):
        """Get formatted data for the dashboard."""
        zone_results = self.run_all_zones()

        dashboard = {
            "timestamp": time.time(),
            "zones": {},
            "global_summary": {},
        }

        safety_scores = []
        privacy_risks = []

        for zone, result in zone_results.items():
            d = result["decision"]
            dashboard["zones"][zone] = {
                "safety_score": d["safety_score"],
                "privacy_risk": d["privacy_risk"],
                "congestion_level": d["congestion_level"],
                "accident_risk": d["accident_risk"],
                "bnn_prediction": d["bnn_prediction"],
                "privacy_status": d["privacy_status"],
                "anomaly_detected": d["anomaly_detected"],
                "lstm_forecast": d["lstm_forecast"],
                "recommendations": d["recommendations"],
                "is_emergency": d["is_emergency"],
                "risk_level": d["risk_level"],
                "security_status": d.get("security_status", {}),
                "vehicle_count": result["layer1"]["vehicle_count"],
                "pedestrian_count": result["layer1"]["pedestrian_count"],
                "lane_density": result["layer1"]["lane_density"],
            }
            safety_scores.append(d["safety_score"])
            privacy_risks.append(d["privacy_risk"])

        dashboard["global_summary"] = {
            "avg_safety": round(np.mean(safety_scores), 1),
            "avg_privacy_risk": round(np.mean(privacy_risks), 1),
            "total_zones": len(self.zones),
            "emergency_zones": sum(
                1 for z in dashboard["zones"].values() if z["is_emergency"]),
        }

        return dashboard


if __name__ == "__main__":
    pipeline = PriviTrafficPipeline()
    result = pipeline.run_single("Zone A")
    print(json.dumps(result["decision"], indent=2, default=str))
