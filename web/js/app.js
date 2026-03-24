// Auth Verification
const VALID_ACCESS_KEY = "OCTO-2026-PRO";

function checkAuth() {
    if (localStorage.getItem('octothorp_authenticated') === 'true') {
        const overlay = document.getElementById('login-overlay');
        if(overlay) overlay.style.display = 'none';
        
        const app = document.getElementById('app-container');
        if(app) app.style.display = 'flex'; // Restore the split layout
        
        initNavigation();
        loadView('dashboard');
    } else {
        const overlay = document.getElementById('login-overlay');
        if(overlay) overlay.style.display = 'flex';
        
        const app = document.getElementById('app-container');
        if(app) app.style.display = 'none';
    }
}

window.attemptLogin = function() {
    const val = document.getElementById('access-key-input').value;
    if (val === VALID_ACCESS_KEY) {
        localStorage.setItem('octothorp_authenticated', 'true');
        checkAuth();
    } else {
        const err = document.getElementById('login-error');
        err.style.display = 'block';
        setTimeout(() => err.style.display = 'none', 3000);
    }
}

window.logout = function() {
    localStorage.removeItem('octothorp_authenticated');
    checkAuth();
}

// Wait for DOM
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
});

let currentView = 'dashboard';
window.currentTimeFilter = 'weekly';
window.currentSourceFilter = 'solar';

function initNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            navItems.forEach(nav => nav.classList.remove('active'));
            e.target.classList.add('active');
            
            const view = e.target.getAttribute('data-view');
            loadView(view);
        });
    });
}

function updatePageTitle(title) {
    document.getElementById('page-title').textContent = title;
}

function reloadCurrentViewCharts() {
    let tF = window.currentTimeFilter;
    let sF = window.currentSourceFilter;
    if (currentView === 'dashboard') initDashboardCharts(tF, sF);
    else if (currentView === 'power-consumption') initPowerConsumptionCharts(tF, sF);
    else if (currentView === 'current') initCurrentCharts(tF, sF);
    else if (currentView === 'voltage') initVoltageCharts(tF, sF);
    else if (currentView === 'power') initPowerCharts(tF, sF);
    else if (currentView === 'monitoring') initMonitoringCharts(tF, sF);
    else if (currentView === 'sector-1' || currentView === 'sector-2' || currentView === 'sector-3') initDashboardCharts(tF, sF);
}

window.handleTimeFilterChange = function(val) {
    window.currentTimeFilter = val;
    reloadCurrentViewCharts();
};

window.handleSourceFilterChange = function(val) {
    window.currentSourceFilter = val;
    reloadCurrentViewCharts();
};

function loadView(view) {
    currentView = view;
    const container = document.getElementById('view-container');
    container.innerHTML = ''; // Clear current view
    
    // Default Title
    let title = view.replace('-', ' ');
    
    switch(view) {
        case 'dashboard':
            updatePageTitle('dashboard');
            container.innerHTML = getDashboardHTML();
            initDashboardCharts();
            break;
        case 'power-consumption':
            updatePageTitle('Power consumsion');
            container.innerHTML = getPowerConsumptionHTML();
            initPowerConsumptionCharts();
            break;
        case 'current':
            updatePageTitle('CURRENT');
            container.innerHTML = getCurrentDetailedHTML();
            initCurrentCharts();
            break;
        case 'voltage':
            updatePageTitle('VOLTAGE');
            container.innerHTML = getVoltageDetailedHTML();
            initVoltageCharts();
            break;
        case 'power':
            updatePageTitle('POWER');
            container.innerHTML = getPowerDetailedHTML();
            initPowerCharts();
            break;
        case 'main-panel':
            updatePageTitle('main panel');
            container.innerHTML = getMainPanelHTML();
            break;
        case 'sector-1':
            loadSector(1);
            break;
        case 'sector-2':
            loadSector(2);
            break;
        case 'sector-3':
            loadSector(3);
            break;
        case 'monitoring':
            updatePageTitle('MONITORING');
            container.innerHTML = getMonitoringHTML();
            initMonitoringCharts();
            break;
        case 'console':
            updatePageTitle('CONSOLE');
            container.innerHTML = getConsoleHTML();
            break;
        default:
            container.innerHTML = '<h1>View Note Found</h1>';
    }
}

/* ========== HTML TEMPLATES ========== */

function getFilterDropdownHTML(selected = 'weekly') {
    return `
        <div style="display:flex; gap:15px; margin-bottom: 15px;">
            <div class="dropdown-wrapper">
                <select class="dropdown-select" id="source-filter" onchange="window.handleSourceFilterChange(this.value)">
                    <option value="solar" ${window.currentSourceFilter === 'solar' ? 'selected' : ''}>Solar Power</option>
                    <option value="eb" ${window.currentSourceFilter === 'eb' ? 'selected' : ''}>EB Power</option>
                    <option value="generator" ${window.currentSourceFilter === 'generator' ? 'selected' : ''}>Generator Power</option>
                </select>
            </div>
            <div class="dropdown-wrapper">
                <select class="dropdown-select" id="time-filter" onchange="window.handleTimeFilterChange(this.value)">
                    <option value="today" ${window.currentTimeFilter === 'today' ? 'selected' : ''}>Today</option>
                    <option value="weekly" ${window.currentTimeFilter === 'weekly' ? 'selected' : ''}>weekly</option>
                    <option value="monthly" ${window.currentTimeFilter === 'monthly' ? 'selected' : ''}>monthly</option>
                    <option value="yearly" ${window.currentTimeFilter === 'yearly' ? 'selected' : ''}>yearly</option>
                </select>
            </div>
        </div>
    `;
}

function getDashboardHTML() {
    return `
        ${getFilterDropdownHTML()}
        
        <div class="dashboard-grid">
            <!-- Left Column -->
            <div class="col-left" style="display:flex; flex-direction:column; gap:20px;">
                <div class="chart-wrapper">
                    <h3 class="chart-section-title">Total power consumtion:</h3>
                    <div class="chart-card clickable-card" style="height: 300px; position:relative;" onclick="loadView('power-consumption')">
                        <canvas id="totalPowerChart"></canvas>
                    </div>
                </div>
                <div class="chart-wrapper" style="margin-top: 10px;">
                    <h3 class="chart-section-title">Air Quality Index:</h3>
                    <div class="chart-card" style="height: 300px; position:relative;">
                        <canvas id="aqiChart"></canvas>
                    </div>
                </div>
            </div>
            
            <!-- Right Column -->
            <div class="col-right" style="display:flex; flex-direction:column; gap:20px;">
                <div class="chart-card" style="height: 335px; position:relative;">
                    <canvas id="tempChart"></canvas>
                </div>
                
                <h3 class="chart-section-title" style="text-align:center; margin-top: 10px; font-weight:700; color:#ccc;">Temprature</h3>
                
                <div class="chart-card" style="height: 335px; position:relative; display:flex; justify-content:center; align-items:center;">
                    <canvas id="pieChart"></canvas>
                </div>
            </div>
        </div>
    `;
}

function getMainPanelHTML() {
    return `
        <div style="display: flex; gap: 30px; justify-content: center; margin-top: 40px; height: 500px;">
            <div class="chart-card clickable-card" style="flex:1; display:flex; align-items:center; justify-content:center; position:relative; overflow:hidden;" onclick="loadSector(1)">
                <h2 style="color:white; z-index:2; position:absolute;">Sector - 1</h2>
                <div style="position:absolute; bottom:0; left:0; width:80%; height:30%; background:#1c3763; clip-path: polygon(0 100%, 100% 100%, 80% 30%, 50% 10%, 20% 60%, 0 40%); opacity:0.8;"></div>
            </div>
            <div class="chart-card clickable-card" style="flex:1; display:flex; align-items:center; justify-content:center; position:relative; overflow:hidden;" onclick="loadSector(2)">
                <h2 style="color:white; z-index:2; position:absolute;">Sector - 2</h2>
                <div style="position:absolute; top:30%; right:10px; font-size:40px; color:#aaa; font-weight:bold;">#</div>
            </div>
            <div class="chart-card clickable-card" style="flex:1; display:flex; align-items:center; justify-content:center; position:relative; overflow:hidden;" onclick="loadSector(3)">
                <h2 style="color:white; z-index:2; position:absolute;">Sector - 3</h2>
                <div style="position:absolute; bottom:10px; right:10px; width:40px; height:80px; background:#ccc; border-radius: 40px 40px 0 0;"></div>
            </div>
        </div>
    `;
}

function getMonitoringHTML() {
    // simplified version for now
     return `
        ${getFilterDropdownHTML()}
        <div style="display: grid; grid-template-columns: 1fr 1fr; grid-gap: 30px; margin-top: 20px;">
             <div class="chart-wrapper" style="text-align:center;">
                 <div class="chart-card" style="height: 250px; position:relative; margin-bottom: 5px;">
                     <canvas id="mon1"></canvas>
                 </div>
                 <h3 style="color:#8e95a5; font-size:16px;">3- phase Reactive Power/ACTIVE POWER</h3>
             </div>
             <div class="chart-wrapper" style="text-align:center;">
                 <div class="chart-card" style="height: 250px; position:relative; margin-bottom: 5px;">
                     <canvas id="mon2"></canvas>
                 </div>
                 <h3 style="color:#8e95a5; font-size:16px;">MAXIMUM DEMAND</h3>
             </div>
             <div class="chart-wrapper" style="text-align:center;">
                 <div class="chart-card" style="height: 250px; position:relative; margin-bottom: 5px;">
                     <canvas id="mon3"></canvas>
                 </div>
                 <h3 style="color:#8e95a5; font-size:16px;">AVERAGE</h3>
             </div>
             <div class="chart-wrapper" style="text-align:center;">
                 <div class="chart-card" style="height: 250px; position:relative; margin-bottom: 5px;">
                     <canvas id="mon4"></canvas>
                 </div>
                 <h3 style="color:#8e95a5; font-size:16px;">RUN TIME</h3>
             </div>
        </div>
    `;
}

function getPowerConsumptionHTML() {
    return `
        <div style="display:flex; justify-content:space-between; align-items:center;">
            <a href="#" onclick="loadView('dashboard')" style="color:#4bd8d6; text-decoration:none; font-weight:bold; font-size:16px;">&lt; Back to Dashboard</a>
            ${getFilterDropdownHTML()}
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; grid-gap: 30px; margin-top: 20px;">
             <!-- Current -->
             <div class="chart-wrapper" style="text-align:center;">
                 <h3 style="color:#8e95a5; font-size:20px; font-weight:500; margin-bottom: 10px;">CURRENT</h3>
                 <div class="chart-card clickable-card" style="height: 280px; position:relative;" onclick="loadView('current')">
                     <canvas id="pcCurrent"></canvas>
                 </div>
             </div>
             <!-- Power -->
             <div class="chart-wrapper" style="text-align:center;">
                 <h3 style="color:#8e95a5; font-size:20px; font-weight:500; margin-bottom: 10px;">POWER</h3>
                 <div class="chart-card clickable-card" style="height: 280px; position:relative;" onclick="loadView('power')">
                     <canvas id="pcPower"></canvas>
                 </div>
             </div>
             <!-- Voltage -->
             <div class="chart-wrapper" style="text-align:center;">
                 <div class="chart-card clickable-card" style="height: 280px; position:relative; margin-bottom: 10px;" onclick="loadView('voltage')">
                     <canvas id="pcVoltage"></canvas>
                 </div>
                 <h3 style="color:#8e95a5; font-size:20px; font-weight:500;">VOLTAGE</h3>
             </div>
             <!-- Average -->
             <div class="chart-wrapper" style="text-align:center;">
                 <div class="chart-card" style="height: 280px; position:relative; margin-bottom: 10px;">
                     <canvas id="pcAverage"></canvas>
                 </div>
                 <h3 style="color:#8e95a5; font-size:20px; font-weight:500;">AVERAGE</h3>
             </div>
        </div>
    `;
}

function getCurrentDetailedHTML() {
    return `
        <div style="display:flex; justify-content:space-between; align-items:center;">
            <a href="#" onclick="loadView('power-consumption')" style="color:#4bd8d6; text-decoration:none; font-weight:bold; font-size:16px;">&lt; Back to Power Consumption</a>
            ${getFilterDropdownHTML()}
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; grid-gap: 30px; margin-top: 20px;">
             <div class="chart-wrapper" style="text-align:center;">
                 <div class="chart-card" style="height: 280px; position:relative; margin-bottom: 10px;">
                     <canvas id="curR"></canvas>
                 </div>
                 <h3 style="color:#8e95a5; font-size:20px; font-weight:700;">R-Phase Line Current</h3>
             </div>
             <div class="chart-wrapper" style="text-align:center;">
                 <div class="chart-card" style="height: 280px; position:relative; margin-bottom: 10px;">
                     <canvas id="curB"></canvas>
                 </div>
                 <h3 style="color:#8e95a5; font-size:20px; font-weight:700;">B-Phase Line Current</h3>
             </div>
             <div class="chart-wrapper" style="text-align:center;">
                 <div class="chart-card" style="height: 280px; position:relative; margin-bottom: 10px;">
                     <canvas id="curY"></canvas>
                 </div>
                 <h3 style="color:#8e95a5; font-size:20px; font-weight:700;">Y-Phase Line Current</h3>
             </div>
             <div class="chart-wrapper" style="text-align:center;">
                 <div class="chart-card" style="height: 280px; position:relative; margin-bottom: 10px;">
                     <canvas id="curHarmonic"></canvas>
                 </div>
                 <h3 style="color:#8e95a5; font-size:20px; font-weight:700;">Current Harmonic Distortion</h3>
             </div>
        </div>
    `;
}

function getVoltageDetailedHTML() {
    return `
        <div style="display:flex; justify-content:space-between; align-items:center;">
            <a href="#" onclick="loadView('power-consumption')" style="color:#4bd8d6; text-decoration:none; font-weight:bold; font-size:16px;">&lt; Back to Power Consumption</a>
            ${getFilterDropdownHTML()}
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; grid-gap: 30px; margin-top: 20px;">
             <div class="chart-wrapper" style="text-align:center;">
                 <div class="chart-card" style="height: 280px; position:relative; margin-bottom: 10px;">
                     <canvas id="volRY"></canvas>
                 </div>
                 <h3 style="color:#8e95a5; font-size:20px; font-weight:700;">RY Voltage</h3>
             </div>
             <div class="chart-wrapper" style="text-align:center;">
                 <div class="chart-card" style="height: 280px; position:relative; margin-bottom: 10px;">
                     <canvas id="volYB"></canvas>
                 </div>
                 <h3 style="color:#8e95a5; font-size:20px; font-weight:700;">YB Voltage</h3>
             </div>
             <div class="chart-wrapper" style="text-align:center;">
                 <div class="chart-card" style="height: 280px; position:relative; margin-bottom: 10px;">
                     <canvas id="volBR"></canvas>
                 </div>
                 <h3 style="color:#8e95a5; font-size:20px; font-weight:700;">BR Voltage</h3>
             </div>
             <div class="chart-wrapper" style="text-align:center;">
                 <div class="chart-card" style="height: 280px; position:relative; margin-bottom: 10px;">
                     <canvas id="volHarmonic"></canvas>
                 </div>
                 <h3 style="color:#8e95a5; font-size:20px; font-weight:700;">Voltage Harmonic Distortion</h3>
             </div>
        </div>
    `;
}

function getPowerDetailedHTML() {
    return `
        <div style="display:flex; justify-content:space-between; align-items:center;">
            <a href="#" onclick="loadView('power-consumption')" style="color:#4bd8d6; text-decoration:none; font-weight:bold; font-size:16px;">&lt; Back to Power Consumption</a>
            ${getFilterDropdownHTML()}
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; grid-gap: 30px; margin-top: 20px;">
             <div class="chart-wrapper" style="text-align:center;">
                 <div class="chart-card" style="height: 280px; position:relative; margin-bottom: 10px;">
                     <canvas id="powActive"></canvas>
                 </div>
                 <h3 style="color:#8e95a5; font-size:20px; font-weight:700;">ACTIVE POWER</h3>
             </div>
             <div class="chart-wrapper" style="text-align:center;">
                 <div class="chart-card" style="height: 280px; position:relative; margin-bottom: 10px;">
                     <canvas id="powFactor"></canvas>
                 </div>
                 <h3 style="color:#8e95a5; font-size:20px; font-weight:700;">Power Factor</h3>
             </div>
             <div class="chart-wrapper" style="text-align:center;">
                 <div class="chart-card" style="height: 280px; position:relative; margin-bottom: 10px;">
                     <canvas id="powReactive"></canvas>
                 </div>
                 <h3 style="color:#8e95a5; font-size:20px; font-weight:700;">Reactive Power</h3>
             </div>
             <div class="chart-wrapper" style="text-align:center;">
                 <div class="chart-card" style="height: 280px; position:relative; margin-bottom: 10px;">
                     <canvas id="powHarmonic"></canvas>
                 </div>
                 <h3 style="color:#8e95a5; font-size:20px; font-weight:700;">Power Harmonic Distortion</h3>
             </div>
        </div>
    `;
}

function getConsoleHTML() {
    return `
        <div class="console-box">
            <!-- Console content scrollable area -->
            <div style="height: 2000px;"></div>
        </div>
    `;
}

/* ========== INTERACTIVITY ========== */
function loadSector(id) {
    updatePageTitle('sector - ' + id);
    const container = document.getElementById('view-container');
    container.innerHTML = getDashboardHTML();
    
    // Slight mockup difference to show they changed views, ideally we would fetch custom data for sector 2/3 here
    initDashboardCharts();
}
