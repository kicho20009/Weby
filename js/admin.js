// Handle showing status messages
function showStatus(message, isError = false) {
    const el = document.getElementById('statusMessage');
    el.textContent = message;
    el.style.display = 'block';
    el.className = 'status ' + (isError ? 'error' : 'success');
    setTimeout(() => { el.style.display = 'none'; }, 4000);
}

// Convert simple CSV string to ChartJS native format
// Expected CSV Format:
// Labels,mon,tues,wed,thur
// Data1,10,20,30,40
// Data2,15,25,35,45
function parseCSVToChartData(csvString) {
    const lines = csvString.trim().split('\n');
    if (lines.length < 2) throw new Error("CSV must have at least labels and one dataset row.");
    
    // First line is labels
    const labelRow = lines[0].split(',');
    const labels = labelRow.slice(1).map(x => x.trim()); // Skip the first cell "Labels"
    
    const datasets = [];
    for (let i = 1; i < lines.length; i++) {
        const row = lines[i].split(',');
        const datalabel = row[0].trim();
        const dataValues = row.slice(1).map(val => Number(val.trim()));
        
        datasets.push({
            label: datalabel || 'Dataset ' + i,
            data: dataValues,
            // the dashboard frontend charts.js handles actual colors based on default overrides,
            // but we supply the raw data structure here.
        });
    }
    
    return { labels, datasets };
}

function saveConfiguration() {
    const sourceId = document.getElementById('sourceSelect').value;
    const chartId = document.getElementById('chartSelect').value;
    const fileInput = document.getElementById('csvUpload');
    const apiUrl = document.getElementById('apiUrl').value.trim();

    if (fileInput.files.length > 0) {
        // Read CSV
        const file = fileInput.files[0];
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const csvString = e.target.result;
                const chartData = parseCSVToChartData(csvString);
                
                const payload = {
                    type: 'csv',
                    data: chartData
                };
                localStorage.setItem('chartData_' + sourceId + '_' + chartId, JSON.stringify(payload));
                showStatus(`Success! CSV mapped to ${sourceId.toUpperCase()} -> ${chartId}`);
                
                // clear file input
                fileInput.value = ''; 
            } catch (err) {
                showStatus(`Failed to parse CSV: ${err.message}`, true);
            }
        };
        reader.readAsText(file);
    } else if (apiUrl !== '') {
        // Save API
        const payload = {
            type: 'api',
            url: apiUrl
        };
        localStorage.setItem('chartData_' + sourceId + '_' + chartId, JSON.stringify(payload));
        showStatus(`Success! API mapped to ${sourceId.toUpperCase()} -> ${chartId}`);
        document.getElementById('apiUrl').value = '';
    } else {
        showStatus("Please provide a CSV file or an API URL.", true);
    }
}

function clearConfiguration() {
    const sourceId = document.getElementById('sourceSelect').value;
    const chartId = document.getElementById('chartSelect').value;
    localStorage.removeItem('chartData_' + sourceId + '_' + chartId);
    showStatus(`Wiped configuration for ${sourceId.toUpperCase()} -> ${chartId}. Restored to mock data.`);
}
