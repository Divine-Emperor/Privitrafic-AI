# 🛡️ PriviTraffic SOC — Secure Intelligent Transportation System

**PriviTraffic SOC** is a Privacy-Preserving, Intrusion-Defended Smart Traffic Management Dashboard. It implements a hybrid **Bayesian Neuro-Symbolic (BNS)** AI pipeline to govern traffic flows while actively defending against cybersecurity threats like telemetry spoofing, data injection attacks, and vehicle tracking re-identification.

This project was built for the **Cybersecurity AI Hackathon**, demonstrating how to secure critical civil infrastructure using machine learning uncertainty and mathematical privacy models.

---

## 🚀 Key Features

* **Intrusion Detection System (IDS)**: Monitors traffic sensor telemetries in real-time, checking for rate-of-change anomalies and physics-defying data injections (e.g., reporting 50 vehicles on a road with 0% density) using an **Isolation Forest** model.
* **Differential Privacy Guard (DP)**: Applies Laplace noise to vehicle and pedestrian counts before exposing them to the API/Dashboard. This mathematically prevents third-party eavesdroppers from performing vehicle re-identification or routing tracking attacks.
* **Bayesian Neuro-Symbolic (BNS) Logic**: Integrates deep learning predictions (BNNs, LSTMs, MLPs) with symbolic logic guardrails. If a neural network is hijacked or tricked, the symbolic logic layer detects state violations and overrides control decisions immediately.
* **Security Operations Center (SOC) Console**: A modern, interactive dark-themed dashboard that monitors traffic metrics, tracks live cybersecurity scan logs, displays privacy budget consumption, and exports PDF reports.

---

## 📂 GitHub Repository Structure

```


    privitrafic_ai/               # Core application source
    ├── traffic/                  # Pre-configured Python virtual environment
    ├── config/                   # Configuration values and threshold limits
    │   └── __init__.py           
    ├── security/                 # Cybersecurity AI modules
    │   ├── __init__.py           
    │   ├── ids.py                # Telemetry Intrusion Detection System
    │   └── privacy.py            # Laplace Differential Privacy Guard
    ├── layers/                   # 5-Layer AI Pipeline
    │   ├── __init__.py
    │   ├── layer1_cv.py          # CV Object Detection & Plate Blur simulation
    │   ├── layer2_ml.py          # Classical ML (Random Forest, XGBoost, Isolation Forest)
    │   ├── layer3_dl.py          # Deep Learning (MLP, LSTM, Bayesian Neural Net)
    │   ├── layer4_bns.py         # Bayesian Neuro-Symbolic Core & Symbolic Rules
    │   └── layer5_decision.py    # Output compiler & Decision engine
    ├── dashboard/                # Flask Server and Web Interface
    │   ├── app.py                # Flask entry point (Running on port 5001)
    │   ├── templates/
    │   │   └── index.html        # HTML layout for SOC dashboard
    │   └── static/
    │       ├── style.css         # Cybersecurity Dark Mode styling
    │       └── dashboard.js      # Live polling, charts.js rendering & log stream
    └── pipeline.py               # Main pipeline execution orchestrator
```

---

## ⚙️ Setup & Installation Instructions

### Prerequisites
* Python 3.12 (standard system Python)
* Virtual environment utilities (`python3-venv` or `pip`)

### Option A: Running with the Pre-configured Virtual Environment (Recommended)
The project comes pre-loaded with a virtual environment named `traffic` inside `privitrafic_ai` containing all necessary packages (TensorFlow, scikit-learn, XGBoost, OpenCV, Flask, NumPy, Pandas, etc.).

1. Navigate to the core application folder:
   ```bash
   cd privitrafic_ai
   ```
2. Start the SOC web server:
   ```bash
   ./traffic/bin/python dashboard/app.py
   ```
3. Open your browser and navigate to:
   ```
   http://localhost:5001
   ```

### Option B: Creating a Fresh Virtual Environment
If you want to recreate the environment manually:
1. Navigate to the project root and create a virtual environment:
   ```bash
   python3 -m venv .venv
   source .venv/bin/activate
   ```
2. Install the package requirements:
   ```bash
   pip install -r requirements.txt
   ```
3. Navigate to the dashboard directory and run the application:
   ```bash
   cd privitrafic_ai
   python dashboard/app.py
   ```

---

## 📖 Code Documentation & Architecture

The system executes in a linear pipeline defined in `pipeline.py` which passes traffic data through five layers before making a secure decision:

```
[Layer 1: CV] ──> [Layer 2: ML & IDS Check] ──> [Layer 3: DL (BNN/LSTM)] ──> [Layer 4: BNS Logic Override] ──> [Layer 5: Decision Output]
```

### 1. `security/ids.py` (Intrusion Detection System)
Analyzes telemetry features from Layer 1 and the Isolation Forest results from Layer 2. If it detects physics contradictions (high vehicle volume + zero density) or rate-of-change telemetry injection spikes, it flags the zone as `COMPROMISED`.

### 2. `security/privacy.py` (Differential Privacy Guard)
Utilizes Laplace noise to distort aggregate counting variables. Epsilon ($\epsilon = 0.5$) is consumed per query, guaranteeing mathematical privacy boundaries against database reconstruction attacks.

### 3. `layers/layer4_bns.py` (Bayesian Neuro-Symbolic Engine)
Fuses the deep learning forecasts with first-order logic safety rules. If the security status indicates the local zone is compromised, the symbolic engine triggers a safety override:
- Drops the safety score immediately to `0%`.
- Replaces normal routing suggestions with `[SYSTEM LOCKDOWN]` procedures.
- Requests manual overrides for local traffic light arrays.

### 4. `dashboard/app.py` (Web API Server)
Fires up the Flask daemon, running on port `5001`. It acts as the gateway for `/` (Dashboard UI) and the sanitized `/api/data` endpoints, housing the `DifferentialPrivacyGuard` initialization.

---
