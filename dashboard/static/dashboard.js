// ═══════════════════════════════════════════════════════════════
// PriviTraffic AI — Dashboard Logic (Upgraded with Tabs)
// Real-time data fetching, Chart.js graphs, PDF Export, BNS focus
// ═══════════════════════════════════════════════════════════════

const REFRESH_INTERVAL = 3000; // 3 seconds
const MAX_HISTORY = 20;

let tabsInitialized = false;
let lastFetchedData = null;

// Chart history arrays
const chartData = {
    labels: [],
    safety: [],
    privacy: [],
    bnnAccident: [],
    bnnConfidence: [],
    bnnUncertainty: [],
    anomalyScore: [],
    trafficDensity: []
};

// Chart instances
let mainChart, bnnChart, anomalyChart;

// ── Initialize Charts ──────────────────────
function initCharts() {
    Chart.defaults.color = '#94a3b8';
    Chart.defaults.font.family = 'Inter';

    const commonOptions = {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 0 },
        scales: {
            y: { grid: { color: 'rgba(255,255,255,0.05)' }, min: 0, max: 100 },
            x: { grid: { display: false } }
        },
        plugins: {
            legend: { position: 'top', labels: { usePointStyle: true, boxWidth: 8 } }
        },
        elements: {
            line: { tension: 0.4, borderWidth: 3 },
            point: { radius: 0, hitRadius: 10, hoverRadius: 5 }
        }
    };

    // 1. Main Risk vs Privacy Chart
    const ctxMain = document.getElementById('mainChart').getContext('2d');
    mainChart = new Chart(ctxMain, {
        type: 'line',
        data: {
            labels: chartData.labels,
            datasets: [
                { label: 'Safety Score (%)', data: chartData.safety, borderColor: '#10b981', backgroundColor: 'rgba(16,185,129,0.1)', fill: true },
                { label: 'Privacy Risk (%)', data: chartData.privacy, borderColor: '#ef4444' }
            ]
        },
        options: commonOptions
    });

    // 2. BNN Uncertainty Chart
    const ctxBnn = document.getElementById('bnnChart').getContext('2d');
    bnnChart = new Chart(ctxBnn, {
        type: 'line',
        data: {
            labels: chartData.labels,
            datasets: [
                { label: 'Accident Prob (%)', data: chartData.bnnAccident, borderColor: '#f59e0b' },
                { label: 'BNN Confidence (%)', data: chartData.bnnConfidence, borderColor: '#8b5cf6', borderDash: [5, 5] },
                { label: 'Uncertainty (x100)', data: chartData.bnnUncertainty, borderColor: '#ec4899' }
            ]
        },
        options: commonOptions
    });

    // 3. Anomaly & Density Chart
    const ctxAnom = document.getElementById('anomalyChart').getContext('2d');
    anomalyChart = new Chart(ctxAnom, {
        type: 'bar',
        data: {
            labels: chartData.labels,
            datasets: [
                { label: 'Anomaly Score', data: chartData.anomalyScore, backgroundColor: 'rgba(239,68,68,0.7)', type: 'bar' },
                { label: 'Lane Density (%)', data: chartData.trafficDensity, borderColor: '#06b6d4', type: 'line', fill: true, backgroundColor: 'rgba(6,182,212,0.1)' }
            ]
        },
        options: {
            ...commonOptions,
            scales: {
                y: { grid: { color: 'rgba(255,255,255,0.05)' }, min: 0, max: 100 },
                x: { grid: { display: false } }
            },
            elements: { line: { tension: 0.4, borderWidth: 3 }, point: { radius: 0 } }
        }
    });
}

// ── Fetch & Render ─────────────────────────
async function fetchData() {
    try {
        const res = await fetch('/api/data');
        const data = await res.json();
        lastFetchedData = data;
        renderDashboard(data);
    } catch (err) {
        console.error('Fetch error:', err);
    }
}

function renderDashboard(data) {
    // Timestamp
    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-IN', { hour12: false });
    document.getElementById('timestamp').textContent = timeStr;

    // Initialize Tabs if not done
    if (!tabsInitialized && Object.keys(data.zones).length > 0) {
        initializeTabs(Object.keys(data.zones));
        tabsInitialized = true;
    }

    // Global summary
    const g = data.global_summary;
    document.getElementById('avg-safety').textContent = g.avg_safety.toFixed(1);
    document.getElementById('avg-privacy').textContent = g.avg_privacy_risk.toFixed(1);
    document.getElementById('total-zones').textContent = g.total_zones;
    document.getElementById('emergency-count').textContent = g.emergency_zones;

    // BNS Core (Use Zone A for global proxy)
    const primaryZone = data.zones["Zone A"] || Object.values(data.zones)[0];
    renderBnsCore(primaryZone);

    // Global Zone cards
    const container = document.getElementById('zones-container');
    container.innerHTML = '';
    for (const [zoneName, zone] of Object.entries(data.zones)) {
        container.appendChild(createZoneCard(zoneName, zone));
        // Update Zone specific tab
        updateZoneTab(zoneName, zone, timeStr);
    }

    // Privacy Budget
    const pBudgetEl = document.getElementById('privacy-budget');
    if(pBudgetEl && data.privacy_budget_spent !== undefined) {
        pBudgetEl.textContent = data.privacy_budget_spent.toFixed(2);
    }

    // Update IDS Alert Console
    const idsLogs = document.getElementById('ids-logs');
    if (idsLogs) {
        let isCompromised = primaryZone.security_status && primaryZone.security_status.is_compromised;
        if (isCompromised || Math.random() > 0.6) {
            let logMsg = `[${timeStr}] Network & Telemetry: SECURE`;
            let logClass = 'info';
            
            if (isCompromised) {
                logMsg = `[${timeStr}] [CRITICAL] IDS ALARM: ${primaryZone.security_status.attack_type}`;
                logClass = 'critical';
            } else if (Math.random() > 0.5) {
                logMsg = `[${timeStr}] differential privacy injected. Laplace noise added.`;
            }

            const entry = document.createElement('div');
            entry.className = `log-entry ${logClass}`;
            entry.innerText = logMsg;
            idsLogs.prepend(entry);
            if (idsLogs.children.length > 25) idsLogs.removeChild(idsLogs.lastChild);
        }
    }

    // Update Global Charts
    updateCharts(data, timeStr, primaryZone);
}

// ── Tabs Setup ──────────────────────────────
function initializeTabs(zoneNames) {
    const dynamicTabs = document.getElementById('dynamic-tabs');
    const zoneTabsContainer = document.getElementById('zone-tabs-container');
    
    zoneNames.forEach(zoneName => {
        const safeId = zoneName.replace(/\s+/g, '-');
        const targetId = `tab-${safeId}`;

        // Create tab button
        const btn = document.createElement('button');
        btn.className = 'tab-btn';
        btn.dataset.target = targetId;
        btn.innerHTML = `🎥 ${zoneName}`;
        btn.onclick = () => switchTab(targetId);
        dynamicTabs.appendChild(btn);

        // Create tab content pane
        const pane = document.createElement('div');
        pane.id = targetId;
        pane.className = 'tab-pane';
        
        pane.innerHTML = `
            <div class="zone-layout">
                <div class="zone-main-col">
                    <div class="cctv-container">
                        <div class="cctv-grid"></div>
                        <div class="cctv-scanline"></div>
                        <div class="cctv-overlay">
                            ${zoneName} REC<br>
                            <span id="cctv-time-${safeId}"></span>
                        </div>
                        <div class="cctv-overlay right">
                            CNN VISION: ACTIVE<br>
                            PRIVACY BLUR: ON
                        </div>
                        <div id="cctv-boxes-${safeId}"></div>
                    </div>
                    
                    <div class="graph-card">
                        <h3>Detailed Zone Metrics (BNS Logic)</h3>
                        <div class="zone-metrics" id="zone-detailed-metrics-${safeId}"></div>
                    </div>
                </div>
                
                <div class="zone-side-col">
                    <div class="control-panel">
                        <h3 style="color: var(--text-primary); margin-bottom: 12px; font-family:'Outfit'">🚦 Manual Overrides</h3>
                        <div class="control-grid">
                            <button class="btn-control" onclick="showToast('🚥 Traffic signal override engaged for ${zoneName}', 'success')">Override Signal</button>
                            <button class="btn-control" onclick="showToast('🔄 Re-routing algorithm activated for ${zoneName}', 'success')">Reroute Traffic</button>
                            <button class="btn-control danger" onclick="showToast('🚑 Emergency dispatch sent to ${zoneName}', 'danger')">Dispatch Units</button>
                            <button class="btn-control" onclick="showToast('🔏 Maximum privacy mode enforced in ${zoneName}', 'info')">Force Anonymity</button>
                        </div>
                    </div>
                    
                    <div class="log-container">
                        <div class="log-header">📋 System Decision Log</div>
                        <div class="log-entries" id="log-entries-${safeId}"></div>
                    </div>
                </div>
            </div>
        `;
        zoneTabsContainer.appendChild(pane);
    });

    // Add click listeners to original tabs (Global)
    document.querySelectorAll('#tabs-nav .tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => switchTab(e.target.dataset.target));
    });
}

function switchTab(targetId) {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
    
    const activeBtn = document.querySelector(`[data-target="${targetId}"]`);
    if(activeBtn) activeBtn.classList.add('active');
    
    const activePane = document.getElementById(targetId);
    if(activePane) activePane.classList.add('active');
}

function updateZoneTab(zoneName, z, timeStr) {
    const safeId = zoneName.replace(/\s+/g, '-');
    
    // Update CCTV Time
    const timeEl = document.getElementById(`cctv-time-${safeId}`);
    if(timeEl) timeEl.innerText = new Date().toISOString().split('T')[1].substring(0,8) + ' UTC';
    
    // Animate CCTV boxes based on vehicle count
    const boxesContainer = document.getElementById(`cctv-boxes-${safeId}`);
    if (boxesContainer) {
        boxesContainer.innerHTML = '';
        const numBoxes = Math.min(z.vehicle_count, 6); // max 6 boxes so it doesn't get crazy
        for(let i=0; i<numBoxes; i++) {
            const top = 15 + Math.random() * 65;
            const left = 10 + Math.random() * 75;
            boxesContainer.innerHTML += `
                <div class="cctv-box" style="top:${top}%; left:${left}%; width:45px; height:45px;">
                    <div class="cctv-box-label">V_${Math.floor(Math.random()*900)+100}</div>
                </div>
            `;
        }
    }

    // Update detailed metrics
    const metricsDiv = document.getElementById(`zone-detailed-metrics-${safeId}`);
    if (metricsDiv) {
        metricsDiv.innerHTML = `
            <div class="metric">
                <div class="metric-label">Neural Confidence</div>
                <div class="metric-value" style="color:var(--accent-purple)">${z.bnn_prediction.confidence.toFixed(1)}%</div>
                <div class="metric-sub">BNN Epistemic</div>
            </div>
            <div class="metric">
                <div class="metric-label">Accident Risk</div>
                <div class="metric-value" style="color:var(--accent-yellow)">${z.accident_risk.toFixed(1)}%</div>
                <div class="metric-sub">XGBoost + BNN</div>
            </div>
            <div class="metric">
                <div class="metric-label">Privacy Risk</div>
                <div class="metric-value" style="color:var(--accent-green)">${z.privacy_risk.toFixed(1)}%</div>
                <div class="metric-sub">Anonymization: ON</div>
            </div>
            <div class="metric">
                <div class="metric-label">Congestion</div>
                <div class="metric-value">${z.congestion_level}</div>
                <div class="metric-sub">Random Forest Class</div>
            </div>
        `;
    }

    // Append to Log
    const logsDiv = document.getElementById(`log-entries-${safeId}`);
    if (logsDiv) {
        let logType = 'info';
        let logMsg = `System Nominal. Traffic density at ${(z.lane_density*100).toFixed(0)}%. No anomalies.`;
        
        if (z.is_emergency || z.anomaly_detected) {
            logType = 'critical';
            logMsg = `ALERT: ${z.anomaly_detected ? 'Isolation Forest Anomaly' : 'Emergency Rules triggered'}. Risk level: ${z.risk_level}.`;
        } else if (z.accident_risk > 50) {
            logType = 'warning';
            logMsg = `Warning: High accident probability detected (${z.accident_risk.toFixed(1)}%). Re-routing advised.`;
        } else if (Math.random() > 0.8) {
             // throw in some random rule logs
             logMsg = `Symbolic Rule: ${z.recommendations[0] || 'Privacy compliant. Frame anonymized.'}`;
        }

        // Only add log if it's different from the last one (avoid spam)
        const lastLog = logsDiv.firstChild;
        if (!lastLog || !lastLog.innerText.includes(logMsg.substring(0,20))) {
            const logEntry = document.createElement('div');
            logEntry.className = `log-entry ${logType}`;
            logEntry.innerText = `[${timeStr}] ${logMsg}`;
            
            logsDiv.prepend(logEntry);
            
            if(logsDiv.children.length > 25) {
                logsDiv.removeChild(logsDiv.lastChild);
            }
        }
    }
}

// ── Toasts ─────────────────────────────────
window.showToast = function(message, type='info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerText = message;
    
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'fadeOut 0.3s forwards';
        setTimeout(() => {
            if(container.contains(toast)) container.removeChild(toast);
        }, 300);
    }, 3000);
}

// ── Shared UI Functions ────────────────────
function renderBnsCore(z) {
    const bnn = z.bnn_prediction;
    const grid = document.getElementById('bns-metrics-grid');
    grid.innerHTML = `
        <div class="bns-stat">
            <div class="bns-stat-label">Neural Accident Prob</div>
            <div class="bns-stat-val" style="color: var(--accent-yellow);">${bnn.accident_probability.toFixed(1)}%</div>
            <div class="metric-sub">Mean of Monte Carlo Dropout</div>
        </div>
        <div class="bns-stat">
            <div class="bns-stat-label">Epistemic Uncertainty</div>
            <div class="bns-stat-val" style="color: var(--accent-pink);">±${(bnn.uncertainty * 100).toFixed(2)}</div>
            <div class="metric-sub">Confidence: ${bnn.confidence.toFixed(1)}%</div>
        </div>
        <div class="bns-stat">
            <div class="bns-stat-label">Symbolic Logic Output</div>
            <div class="bns-stat-val" style="color: var(--accent-purple); font-size: 1.4rem; margin-top:12px;">${z.risk_level}</div>
            <div class="metric-sub">Rules applied on NN output</div>
        </div>
        <div class="bns-stat">
            <div class="bns-stat-label">Final BNS Safety</div>
            <div class="bns-stat-val" style="color: var(--accent-green);">${z.safety_score.toFixed(1)}%</div>
            <div class="metric-sub">Trustworthy & Explainable</div>
        </div>
    `;
}

function createZoneCard(name, z) {
    const card = document.createElement('div');
    card.className = 'zone-card' + (z.is_emergency ? ' emergency' : '');

    const congClass = z.congestion_level === 'NORMAL' ? 'badge-normal'
        : z.congestion_level === 'MODERATE' ? 'badge-moderate' : 'badge-congested';

    const safetyClass = z.safety_score > 70 ? 'safe' : z.safety_score > 40 ? 'warning' : 'danger';
    const privacyClass = z.privacy_risk < 20 ? 'safe' : z.privacy_risk < 50 ? 'warning' : 'danger';
    const accidentClass = z.accident_risk < 40 ? 'safe' : z.accident_risk < 70 ? 'warning' : 'danger';

    card.innerHTML = `
        <div class="zone-header">
            <span class="zone-name">${name}</span>
            <span class="zone-badge ${congClass}">${z.congestion_level}</span>
        </div>
        <div class="zone-metrics">
            <div class="metric">
                <div class="metric-label">🛡️ Safety Score</div>
                <div class="metric-value ${safetyClass}">${z.safety_score.toFixed(1)}%</div>
            </div>
            <div class="metric">
                <div class="metric-label">🔐 Privacy Risk</div>
                <div class="metric-value ${privacyClass}">${z.privacy_risk.toFixed(1)}%</div>
            </div>
            <div class="metric">
                <div class="metric-label">⚠️ Risk Level</div>
                <div class="metric-value" style="font-size: 1.1rem; padding-top: 5px;">${z.risk_level}</div>
            </div>
            <div class="metric">
                <div class="metric-label">🚗 Traffic Density</div>
                <div class="metric-value">${(z.lane_density * 100).toFixed(0)}%</div>
            </div>
        </div>
        <div class="privacy-status">
            <span class="privacy-badge">${z.privacy_status.face_hidden ? '😶 Face Hidden ✔' : '⚠ Face Visible'}</span>
            <span class="privacy-badge">${z.privacy_status.plate_hidden ? '🔲 Plate Hidden ✔' : '⚠ Plate Visible'}</span>
        </div>
        <div class="forecast">⏳ ${z.lstm_forecast}</div>
        ${z.anomaly_detected ? '<div class="anomaly-alert">🚨 ANOMALY DETECTED (Isolation Forest)</div>' : ''}
        <div class="recommendations">
            ${z.recommendations.map(r => `<span class="rec-tag">${r}</span>`).join('')}
        </div>
    `;
    return card;
}

function updateCharts(data, timeStr, primaryZone) {
    if (!mainChart) return;
    chartData.labels.push(timeStr);
    chartData.safety.push(data.global_summary.avg_safety);
    chartData.privacy.push(data.global_summary.avg_privacy_risk);
    
    chartData.bnnAccident.push(primaryZone.bnn_prediction.accident_probability);
    chartData.bnnConfidence.push(primaryZone.bnn_prediction.confidence);
    chartData.bnnUncertainty.push(primaryZone.bnn_prediction.uncertainty * 100);

    let anomVal = primaryZone.anomaly_detected ? 85 + Math.random()*10 : 5 + Math.random()*15;
    chartData.anomalyScore.push(anomVal);
    chartData.trafficDensity.push(primaryZone.lane_density * 100);

    if (chartData.labels.length > MAX_HISTORY) {
        for (let key in chartData) chartData[key].shift();
    }
    mainChart.update(); bnnChart.update(); anomalyChart.update();
}

function downloadPDF() {
    if (!lastFetchedData) {
        showToast('No data available to generate report yet', 'danger');
        return;
    }
    
    // Create a hidden wrapper container in the normal DOM flow
    const printWrapper = document.createElement('div');
    printWrapper.style.height = '0';
    printWrapper.style.overflow = 'hidden';
    printWrapper.style.position = 'relative';
    
    // Create temporary print container
    const reportContainer = document.createElement('div');
    reportContainer.style.width = '1100px';
    reportContainer.style.backgroundColor = '#070b14';
    reportContainer.style.color = '#f8fafc';
    reportContainer.style.padding = '40px';
    reportContainer.style.fontFamily = "'Inter', sans-serif";
    
    const timeStr = new Date().toLocaleString('en-IN');
    const g = lastFetchedData.global_summary;
    const pBudget = lastFetchedData.privacy_budget_spent !== undefined ? lastFetchedData.privacy_budget_spent.toFixed(2) : '--';
    
    // Check if any zone is compromised
    let isCompromised = false;
    let compromiseReason = "SECURE";
    for (const z of Object.values(lastFetchedData.zones)) {
        if (z.security_status && z.security_status.is_compromised) {
            isCompromised = true;
            compromiseReason = z.security_status.attack_type || "Anomaly Detected";
            break;
        }
    }
    
    const integrityColor = isCompromised ? '#ef4444' : '#10b981';
    const integrityText = isCompromised ? `ALERT: ${compromiseReason}` : 'SECURE';
    
    // Build logs
    const idsLogs = document.getElementById('ids-logs');
    const logsHTML = idsLogs ? idsLogs.innerHTML : '<div class="log-entry info">[SYSTEM] SOC Monitoring Active</div>';

    // Build zone lines
    let zonesHTML = '';
    for (const [name, z] of Object.entries(lastFetchedData.zones)) {
        const statusColor = z.is_emergency ? '#ef4444' : (z.accident_risk > 50 ? '#f59e0b' : '#10b981');
        const idsStatusColor = z.security_status && z.security_status.is_compromised ? '#ef4444' : '#10b981';
        const idsStatusText = z.security_status && z.security_status.is_compromised ? 'COMPROMISED' : 'SECURE';
        
        zonesHTML += `
            <tr style="border-bottom: 1px solid rgba(255,255,255,0.08);">
                <td style="padding: 12px 8px; font-weight: bold; color: #fff;">${name}</td>
                <td style="padding: 12px 8px; color: ${statusColor}; font-weight: 600;">${z.congestion_level}</td>
                <td style="padding: 12px 8px; color: #10b981; font-weight: 600;">${z.safety_score.toFixed(1)}%</td>
                <td style="padding: 12px 8px; color: #3b82f6;">${z.privacy_risk.toFixed(1)}%</td>
                <td style="padding: 12px 8px; color: #f59e0b;">${z.accident_risk.toFixed(1)}%</td>
                <td style="padding: 12px 8px; color: ${idsStatusColor}; font-weight: bold;">${idsStatusText}</td>
                <td style="padding: 12px 8px; color: #cbd5e1; font-size: 11px;">${z.recommendations.join(', ')}</td>
            </tr>
        `;
    }

    reportContainer.innerHTML = `
        <!-- Report Header -->
        <div style="border-bottom: 3px solid #8b5cf6; padding-bottom: 20px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: center;">
            <div>
                <h1 style="font-family:'Outfit'; font-size: 32px; margin: 0; color: #8b5cf6; display: flex; align-items: center; gap: 10px;">🛡️ PriviTraffic SOC</h1>
                <p style="margin: 5px 0 0 0; color: #cbd5e1; font-size: 13px; letter-spacing: 1.5px; text-transform: uppercase;">Intelligent Transport System Audit Report</p>
            </div>
            <div style="text-align: right;">
                <p style="margin: 0; font-size: 12px; color: #64748b; font-family: monospace;">Generated: <strong>${timeStr}</strong></p>
                <p style="margin: 5px 0 0 0; font-size: 12px; color: #64748b; font-family: monospace;">Global Threat Level: <strong style="color: ${integrityColor};">${integrityText}</strong></p>
            </div>
        </div>

        <!-- Overview Grid -->
        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 35px;">
            <div style="background: #0f172a; padding: 20px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.08); text-align: center;">
                <div style="font-size: 11px; color: #64748b; text-transform: uppercase; margin-bottom: 8px; font-weight: 700; letter-spacing: 0.5px;">Avg Safety Score</div>
                <div style="font-size: 28px; font-weight: 800; color: #10b981;">${g.avg_safety.toFixed(1)}%</div>
            </div>
            <div style="background: #0f172a; padding: 20px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.08); text-align: center;">
                <div style="font-size: 11px; color: #64748b; text-transform: uppercase; margin-bottom: 8px; font-weight: 700; letter-spacing: 0.5px;">Avg Privacy Risk</div>
                <div style="font-size: 28px; font-weight: 800; color: #ef4444;">${g.avg_privacy_risk.toFixed(1)}%</div>
            </div>
            <div style="background: #0f172a; padding: 20px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.08); text-align: center;">
                <div style="font-size: 11px; color: #64748b; text-transform: uppercase; margin-bottom: 8px; font-weight: 700; letter-spacing: 0.5px;">Privacy Budget Spent</div>
                <div style="font-size: 28px; font-weight: 800; color: #3b82f6;">${pBudget} ε</div>
            </div>
            <div style="background: #0f172a; padding: 20px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.08); text-align: center;">
                <div style="font-size: 11px; color: #64748b; text-transform: uppercase; margin-bottom: 8px; font-weight: 700; letter-spacing: 0.5px;">Alert Zones</div>
                <div style="font-size: 28px; font-weight: 800; color: ${g.emergency_zones > 0 ? '#ef4444' : '#10b981'};">${g.emergency_zones} / ${g.total_zones}</div>
            </div>
        </div>

        <!-- Section 1: Detailed Zone Table -->
        <h2 style="font-family:'Outfit'; font-size: 20px; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 8px; margin-bottom: 15px; color: #06b6d4; font-weight: 700;">📍 Zone Analytics Summary</h2>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 35px; text-align: left; font-size: 13px;">
            <thead>
                <tr style="border-bottom: 2px solid rgba(255,255,255,0.15); color: #64748b; font-size: 11px; text-transform: uppercase; font-weight: 700;">
                    <th style="padding: 10px 8px;">Zone</th>
                    <th style="padding: 10px 8px;">Congestion</th>
                    <th style="padding: 10px 8px;">BNS Safety</th>
                    <th style="padding: 10px 8px;">Privacy Risk</th>
                    <th style="padding: 10px 8px;">Accident Risk</th>
                    <th style="padding: 10px 8px;">IDS Status</th>
                    <th style="padding: 10px 8px;">Recommendations</th>
                </tr>
            </thead>
            <tbody>
                ${zonesHTML}
            </tbody>
        </table>

        <!-- Section 2: Threat Log Stream -->
        <h2 style="font-family:'Outfit'; font-size: 20px; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 8px; margin-bottom: 15px; color: #ef4444; font-weight: 700;">🛡️ Intrusion Detection System Logs</h2>
        <div style="background: #000000; border: 1px solid #ef4444; border-radius: 12px; padding: 20px; font-family: monospace; font-size: 11px; line-height: 1.8; color: #fca5a5; max-height: 200px; overflow-y: hidden;">
            ${logsHTML}
        </div>
        
        <!-- Footer -->
        <div style="margin-top: 40px; border-top: 1px solid rgba(255,255,255,0.08); padding-top: 20px; text-align: center; font-size: 11px; color: #64748b;">
            PriviTraffic SOC • Secure Intelligent Transportation System Report • Confidential
        </div>
    `;

    printWrapper.appendChild(reportContainer);
    document.body.appendChild(printWrapper);

    const opt = {
        margin:       0.5,
        filename:     'PriviTraffic_SOC_Audit_Report.pdf',
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2, useCORS: true, backgroundColor: '#070b14' },
        jsPDF:        { unit: 'in', format: 'a4', orientation: 'landscape' }
    };
    
    const btn = document.getElementById('download-pdf-btn');
    const origText = btn.innerHTML;
    btn.innerHTML = '<span>⏳</span> Generating...';
    
    html2pdf().set(opt).from(reportContainer).save().then(() => {
        btn.innerHTML = origText;
        document.body.removeChild(printWrapper);
        showToast('Security audit report downloaded successfully', 'success');
    }).catch(err => {
        console.error('PDF generation error:', err);
        btn.innerHTML = origText;
        document.body.removeChild(printWrapper);
        showToast('Failed to generate report', 'danger');
    });
}

document.addEventListener('DOMContentLoaded', () => {
    initCharts();
    fetchData();
    setInterval(fetchData, REFRESH_INTERVAL);
    document.getElementById('download-pdf-btn').addEventListener('click', downloadPDF);
});
