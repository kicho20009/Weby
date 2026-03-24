/* Global Chart Configuration to match designs */
Chart.defaults.color = '#8e95a5';
Chart.defaults.font.family = 'Roboto, sans-serif';

const commonLineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: { display: false }
    },
    scales: {
        x: {
            grid: { display: false, drawBorder: false },
            ticks: { font: { size: 10 } }
        },
        y: {
            grid: { color: '#132a58', drawBorder: false },
            ticks: { font: { size: 10 }, padding: 10 },
            border: { display: false },
            suggestedMin: 0
        }
    },
    elements: {
        line: {
            tension: 0.4, // Smoother curves on these lines!
            borderWidth: 2,
            borderColor: '#3978ff' // Bright blue is common in the other pages
        },
        point: {
            radius: 2,
            backgroundColor: '#3978ff'
        }
    }
};

let charts = [];

// ================= ADMIN DATA POPULATION INTERCEPT =================
async function loadChartData(chartId, defaultData, sourceFilter = 'solar') {
    const key = 'chartData_' + sourceFilter + '_' + chartId;
    const stored = localStorage.getItem(key);
    if (!stored) return defaultData;

    try {
        const config = JSON.parse(stored);
        if (config.type === 'csv') {
            console.log(`[Admin] Injecting CSV payload into ${chartId}`);
            // Force dataset styling to match original
            config.data.datasets.forEach((ds, i) => {
                const defaultColors = defaultData.datasets[i] ? defaultData.datasets[i].backgroundColor : '#3978ff';
                const defaultBorder = defaultData.datasets[i] ? defaultData.datasets[i].borderColor : '#3978ff';
                ds.backgroundColor = ds.backgroundColor || defaultColors;
                ds.borderColor = ds.borderColor || defaultBorder;
                ds.borderWidth = ds.borderWidth || (defaultData.datasets[i]? defaultData.datasets[i].borderWidth : 2);
            });
            return config.data;
        } else if (config.type === 'api') {
            console.log(`[Admin] Fetching remote API payload for ${chartId}: ${config.url}`);
            const res = await fetch(config.url);
            const rawData = await res.json();
            // Force dataset styling to match original safely
            rawData.datasets.forEach((ds, i) => {
                const defaultColors = defaultData.datasets[i] ? defaultData.datasets[i].backgroundColor : '#3978ff';
                const defaultBorder = defaultData.datasets[i] ? defaultData.datasets[i].borderColor : '#3978ff';
                ds.backgroundColor = ds.backgroundColor || defaultColors;
                ds.borderColor = ds.borderColor || defaultBorder;
            });
            return rawData;
        }
    } catch(e) {
        console.error(`[Admin] Custom data error for ${chartId}`, e);
    }
    return defaultData;
}
// ====================================================================

function getLabelsForFilter(filter) {
    if (filter === 'today') return ['9am', '12pm', '2pm', '4pm', '6pm', '8pm'];
    if (filter === 'monthly') return ['week-1', 'week-2', 'week-3', 'week-4', 'week-5'];
    if (filter === 'yearly') return ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
    // Default weekly
    return ['mon', 'tues', 'wed', 'thur', 'fri', 'sat', 'sun'];
}

function getDataForFilter(filter, baseData) {
    // Generate some mock variations based on the baseData
    if (filter === 'today') return baseData; // Use the same amount of nodes
    if (filter === 'monthly') return baseData.slice(0, 5).map(x => x? x*3 : null); 
    if (filter === 'yearly') return [ ...baseData.map(x=>x?x*12:null), ...baseData.map(x=>x?x*14:null) ];
    return baseData;
}

// Demand Algorithm
function checkDemandAlert(currentValue, maxCapacity) {
    const percent = (currentValue / maxCapacity) * 100;
    if (percent >= 85) { // Threshold setting
        let alertEl = document.getElementById('demand-alert-banner');
        if (!alertEl) {
            alertEl = document.createElement('div');
            alertEl.id = 'demand-alert-banner';
            // Custom CSS matching the dark mode, flashing orange/red for critical capacity
            alertEl.style.cssText = 'position:fixed; top:20px; right:20px; background:linear-gradient(45deg, #da3633, #a4201e); border: 2px solid #ff7b72; color:white; padding:15px 25px; border-radius:8px; font-weight:bold; box-shadow:0 10px 30px rgba(218, 54, 51, 0.4); z-index:9999; transition: opacity 0.5s; font-family:"Roboto", sans-serif;';
            document.body.appendChild(alertEl);
        }
        alertEl.innerHTML = `⚠️ CRITICAL LOAD: You are operating at ${percent.toFixed(1)}% of your Maximum Demand capacity!`;
        alertEl.style.display = 'block';
        alertEl.style.opacity = '1';
        
        // Auto-hide after 6 seconds
        setTimeout(() => {
            alertEl.style.opacity = '0';
            setTimeout(() => alertEl.style.display = 'none', 500);
        }, 6000);
    }
}

async function initDashboardCharts(timeFilter = 'weekly', sourceFilter = 'solar') {
    // Destroy existing charts to prevent artifacting
    charts.forEach(c => c.destroy());
    charts = [];
    
    // Update simple filter selection UI if it exists over in DOM
    const filterEl = document.getElementById('time-filter');
    if (filterEl && filterEl.value !== timeFilter) filterEl.value = timeFilter;
    const sourceEl = document.getElementById('source-filter');
    if (sourceEl && sourceEl.value !== sourceFilter) sourceEl.value = sourceFilter;
    
    const dynamicLabels = getLabelsForFilter(timeFilter);
    const powBase = [100, 600, 500, 900, 700, 500, 950]; // the 950 physically hits 95% of our 1000kwh max chart size!
    
    // Algorithmic check on the latest recorded timeframe
    checkDemandAlert(powBase[powBase.length - 1], 1000);

    // Total Power Consumption
    const totalPowerDefault = {
        labels: dynamicLabels,
        datasets: [{ data: getDataForFilter(timeFilter, powBase), borderColor: '#4bd8d6', backgroundColor: '#4bd8d6', pointStyle: 'rect' }]
    };
    const totalPowerData = await loadChartData('totalPowerChart', totalPowerDefault, sourceFilter);
    const ctxTotal = document.getElementById('totalPowerChart').getContext('2d');
    const totalPowerChart = new Chart(ctxTotal, {
        type: 'line',
        data: totalPowerData,
        // ... (options omitted for brevity but they are inherited globally) ...
        options: {
            ...commonLineOptions,
            scales: {
                ...commonLineOptions.scales,
                y: { ...commonLineOptions.scales.y, suggestedMax: 1000, title: { display: true, text: 'kwh', color: '#c0c5cf', font: {size:10} } }
            },
            elements: {
                line: { tension: 0, borderWidth: 2, borderColor: '#4bd8d6' },
                point: { radius: 3, backgroundColor: '#4bd8d6', pointStyle: 'rect' }
            }
        }
    });
    
    // Air Quality Index (Line Chart)
    const aqiBase = [18, 26, 23, 35, 36, 23, 20];
    const aqiDefault = {
        labels: dynamicLabels,
        datasets: [{ data: getDataForFilter(timeFilter, aqiBase), borderColor: '#4bd8d6', backgroundColor: '#4bd8d6' }]
    };
    const aqiData = await loadChartData('aqiChart', aqiDefault, sourceFilter);
    const ctxAQI = document.getElementById('aqiChart').getContext('2d');
    const aqiChart = new Chart(ctxAQI, {
        type: 'line',
        data: aqiData,
        options: {
            ...commonLineOptions,
            scales: { ...commonLineOptions.scales, y: { ...commonLineOptions.scales.y, suggestedMax: 40 } },
            elements: {
                line: { tension: 0, borderWidth: 2, borderColor: '#4bd8d6' },
                point: { radius: 1, backgroundColor: '#4bd8d6', pointStyle: 'circle' } 
            }
        }
    });

    // Temperature (Bar Chart)
    const tempBase = [24, 29, 34, 23, null, null, null];
    const tempDefault = {
        labels: dynamicLabels,
        datasets: [{ data: getDataForFilter(timeFilter, tempBase), backgroundColor: '#4bd8d6', barPercentage: 0.9, categoryPercentage: 1.0, borderSkipped: false }]
    };
    const tempData = await loadChartData('tempChart', tempDefault, sourceFilter);
    const ctxTemp = document.getElementById('tempChart').getContext('2d');
    const tempChart = new Chart(ctxTemp, {
        type: 'bar',
        data: tempData,
        options: {
            responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, // inherit clean dashboard layout
            scales: { x: { grid: { display: false }, ticks: { font: { size: 10 } }, border: { display: false } },
                      y: { grid: { color: '#132a58', drawBorder: false }, ticks: { font: { size: 10 }, stepSize: 5 }, min: 20, max: 40, border: { display: false } } }
        }
    });

    // Pie Chart
    const pieDefault = {
        labels: ['profit 14.3%', 'usage 14.3%', 'loss 71.4%'],
        datasets: [{ data: [14.3, 14.3, 71.4], backgroundColor: ['#1e6a99', '#3b9ec8', '#6ee7e7'], borderWidth: 0 }]
    };
    const pieData = await loadChartData('pieChart', pieDefault, sourceFilter);
    const ctxPie = document.getElementById('pieChart').getContext('2d');
    const pieChart = new Chart(ctxPie, {
        type: 'pie',
        data: pieData,
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { display: false }, tooltip: { enabled: false } }, layout: { padding: 30 }
        },
        plugins: [{
            id: 'customLabels',
            afterDraw: (chart) => {
                const ctx = chart.ctx;
                chart.data.labels.forEach((labelText, i) => {
                    const meta = chart.getDatasetMeta(0);
                    const arc = meta.data[i];
                    if(!arc) return;
                    const angle = (arc.startAngle + arc.endAngle) / 2;
                    const lines = labelText.split(' ');
                    ctx.save(); ctx.font = '10px Roboto'; ctx.fillStyle = '#e9eaec'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
                    const radius = arc.outerRadius;
                    const x = chart.chartArea.left + chart.chartArea.width/2 + Math.cos(angle) * (radius + 20);
                    const y = chart.chartArea.top + chart.chartArea.height/2 + Math.sin(angle) * (radius + 20);
                    ctx.fillText(lines[0], x, y - 6);
                    ctx.fillText(lines[1] || "", x, y + 6);
                    ctx.restore();
                });
            }
        }]
    });

    charts.push(totalPowerChart, aqiChart, tempChart, pieChart);
}

// ================= SECONDARY PAGES =================

const generic4DataDefaults = {
    labels: ['2021', '2022', '2023', '2024', '2025'],
    datasets: [{ data: [8, 18, 20, 33, 36], borderColor: '#3978ff', backgroundColor: '#3978ff' }]
};

const generic3LineDataDefaults = {
    labels: ['2021', '2022', '2023', '2024', '2025'],
    datasets: [
        { label: 'red', data: [12, 14, 15, 17, 24], borderColor: '#e6223b', backgroundColor: '#e6223b', pointRadius: 2 },
        { label: 'yellow', data: [10, 12, 16, 17, 20], borderColor: '#f4d03f', backgroundColor: '#f4d03f', pointRadius: 2 },
        { label: 'blue', data: [8, 9, 13, 15, 16], borderColor: '#1f53d1', backgroundColor: '#1f53d1', pointRadius: 2 }
    ]
};

async function createGenericChart(id, yAxisLabel = '', isMulti = false, timeFilter = 'weekly', xLabel = 'Time', sourceFilter = 'solar') {
    const el = document.getElementById(id);
    if (!el) return;
    
    let defaultData = isMulti ? JSON.parse(JSON.stringify(generic3LineDataDefaults)) : JSON.parse(JSON.stringify(generic4DataDefaults));
    
    // Dynamically update default mock based on timefilter so the charts move!
    if (timeFilter !== 'weekly' && defaultData.datasets) {
        defaultData.labels = getLabelsForFilter(timeFilter);
        defaultData.datasets.forEach(ds => {
             // stretch the data exactly out to fit 
             ds.data = getDataForFilter(timeFilter, [...ds.data, ...ds.data]); 
        })
    }
    
    let dataToUse = await loadChartData(id, defaultData, sourceFilter);
    
    // Configure Y axis config
    let yScaleConfig = { ...commonLineOptions.scales.y, max: 40, min: 0 };
    if (yAxisLabel) {
        yScaleConfig.title = { display: true, text: yAxisLabel, color: '#c0c5cf', font: {size: 10} };
    }
    
    // Add X axis label
    let xScaleConfig = { ...commonLineOptions.scales.x };
    xScaleConfig.title = { display: true, text: xLabel, color: '#c0c5cf', font: {size: 10} };

    const ctx = el.getContext('2d');
    charts.push(new Chart(ctx, {
        type: 'line',
        data: dataToUse,
        options: {
            ...commonLineOptions,
            scales: { x: xScaleConfig, y: yScaleConfig }
        }
    }));
}

async function initPowerConsumptionCharts(timeFilter = 'weekly', sourceFilter = 'solar') {
    charts.forEach(c => c.destroy()); charts = [];
    let xlabel = timeFilter === 'yearly' ? 'Months' : 'Time';
    
    await createGenericChart('pcCurrent', 'Amps (A)', false, timeFilter, xlabel, sourceFilter);
    await createGenericChart('pcPower', 'Power (kW)', false, timeFilter, xlabel, sourceFilter);
    await createGenericChart('pcVoltage', 'Volts (V)', false, timeFilter, xlabel, sourceFilter);
    await createGenericChart('pcAverage', 'Avg Units', true, timeFilter, xlabel, sourceFilter);
}

async function initCurrentCharts(timeFilter = 'weekly', sourceFilter = 'solar') {
    charts.forEach(c => c.destroy()); charts = [];
    let xlabel = timeFilter === 'yearly' ? 'Months' : 'Time';
    
    await createGenericChart('curR', 'Amps (A)', false, timeFilter, xlabel, sourceFilter);
    await createGenericChart('curB', 'Amps (A)', false, timeFilter, xlabel, sourceFilter);
    await createGenericChart('curY', 'Amps (A)', false, timeFilter, xlabel, sourceFilter);
    await createGenericChart('curHarmonic', 'Distortion (%)', true, timeFilter, xlabel, sourceFilter);
}

async function initVoltageCharts(timeFilter = 'weekly', sourceFilter = 'solar') {
    charts.forEach(c => c.destroy()); charts = [];
    let xlabel = timeFilter === 'yearly' ? 'Months' : 'Time';
    
    await createGenericChart('volRY', 'Volts (V)', false, timeFilter, xlabel, sourceFilter);
    await createGenericChart('volYB', 'Volts (V)', false, timeFilter, xlabel, sourceFilter);
    await createGenericChart('volBR', 'Volts (V)', false, timeFilter, xlabel, sourceFilter);
    await createGenericChart('volHarmonic', 'Distortion (%)', true, timeFilter, xlabel, sourceFilter);
}

async function initPowerCharts(timeFilter = 'weekly', sourceFilter = 'solar') {
    charts.forEach(c => c.destroy()); charts = [];
    let xlabel = timeFilter === 'yearly' ? 'Months' : 'Time';
    
    await createGenericChart('powActive', 'Active (kW)', true, timeFilter, xlabel, sourceFilter);
    await createGenericChart('powFactor', 'PF Ratio', false, timeFilter, xlabel, sourceFilter); 
    await createGenericChart('powReactive', 'Reactive (kVAR)', true, timeFilter, xlabel, sourceFilter);
    await createGenericChart('powHarmonic', 'Distortion (%)', true, timeFilter, xlabel, sourceFilter);
}

async function initMonitoringCharts(timeFilter = 'weekly', sourceFilter = 'solar') {
    charts.forEach(c => c.destroy()); charts = [];
    let xlabel = timeFilter === 'yearly' ? 'Months' : 'Time';
    
    await createGenericChart('mon1', 'Power', true, timeFilter, xlabel, sourceFilter);
    await createGenericChart('mon2', 'Max Demand', false, timeFilter, xlabel, sourceFilter);
    
    checkDemandAlert(38, 40); // static mock test
    
    await createGenericChart('mon3', 'Avg Units', true, timeFilter, xlabel, sourceFilter);
    await createGenericChart('mon4', 'Hours', false, timeFilter, xlabel, sourceFilter);
}
