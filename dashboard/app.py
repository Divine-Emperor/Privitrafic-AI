# ═══════════════════════════════════════════════════════════════════
# PriviTraffic AI — Flask Dashboard Server
# ═══════════════════════════════════════════════════════════════════

import sys
import os
import json

# Add parent to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from flask import Flask, render_template, jsonify
from pipeline import PriviTrafficPipeline
from security.privacy import DifferentialPrivacyGuard

app = Flask(__name__,
            template_folder="templates",
            static_folder="static")

pipeline = PriviTrafficPipeline()
privacy_guard = DifferentialPrivacyGuard(epsilon=0.5)


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/api/data")
def api_data():
    """API endpoint: returns full dashboard data as JSON."""
    data = pipeline.get_dashboard_data()
    sanitized_data = privacy_guard.anonymize_dashboard_data(data)
    return jsonify(sanitized_data)


@app.route("/api/zone/<zone_name>")
def api_zone(zone_name):
    """API endpoint: returns data for a single zone."""
    result = pipeline.run_single(zone=zone_name)
    return jsonify(result["decision"])


if __name__ == "__main__":
    print("🚦🔐 PriviTraffic AI Dashboard")
    print("   http://localhost:5005")
    app.run(host="0.0.0.0", port=5005, debug=True)
