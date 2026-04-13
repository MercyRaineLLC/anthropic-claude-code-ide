const STORAGE_KEY = 'freight_margin_logs_v1';

const form = document.getElementById('calc-form');
const results = document.getElementById('results');
const tbody = document.getElementById('logTableBody');
const exportBtn = document.getElementById('exportCsv');
const clearBtn = document.getElementById('clearLogs');

const currency = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD'
});

function computeTargets(shipperCharge) {
  return {
    walkaway20: shipperCharge * 0.8,
    goal225: shipperCharge * 0.775,
    goal25: shipperCharge * 0.75
  };
}

function readLogs() {
  return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
}

function writeLogs(logs) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
}

function renderResults(entry) {
  results.innerHTML = `
    <div class="results-grid">
      <div class="metric">
        <span class="metric-label">Shipper Charge</span>
        <span class="metric-value">${currency.format(entry.shipperCharge)}</span>
      </div>
      <div class="metric">
        <span class="metric-label">20% Walkaway</span>
        <span class="metric-value">${currency.format(entry.walkaway20)}</span>
      </div>
      <div class="metric">
        <span class="metric-label">22.5% Goal</span>
        <span class="metric-value">${currency.format(entry.goal225)}</span>
      </div>
      <div class="metric">
        <span class="metric-label">25% Goal</span>
        <span class="metric-value">${currency.format(entry.goal25)}</span>
      </div>
    </div>
  `;
}

function renderTable() {
  const logs = readLogs();
  tbody.innerHTML = '';

  logs
    .slice()
    .reverse()
    .forEach((entry) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${new Date(entry.createdAt).toLocaleString()}</td>
        <td>${entry.brokerName}</td>
        <td>${currency.format(entry.shipperCharge)}</td>
        <td>${currency.format(entry.walkaway20)}</td>
        <td>${currency.format(entry.goal225)}</td>
        <td>${currency.format(entry.walkaway15)}</td>
        <td>${currency.format(entry.goal20)}</td>
        <td>${currency.format(entry.goal25)}</td>
      `;
      tbody.appendChild(tr);
    });
}

function exportToCsv() {
  const logs = readLogs();
  if (!logs.length) {
    alert('No logs to export yet.');
    return;
  }

  const headers = ['created_at', 'broker_name', 'shipper_charge', 'walkaway_20', 'goal_22_5', 'goal_25'];
  const headers = ['created_at', 'broker_name', 'shipper_charge', 'walkaway_15', 'goal_20', 'goal_25'];
  const rows = logs.map((entry) => [
    entry.createdAt,
    entry.brokerName,
    entry.shipperCharge,
    entry.walkaway20,
    entry.goal225,
    entry.walkaway15,
    entry.goal20,
    entry.goal25
  ]);

  const csv = [headers, ...rows]
    .map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(','))
    .join('\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `freight-margin-logs-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

form.addEventListener('submit', (event) => {
  event.preventDefault();

  const brokerName = form.brokerName.value.trim();
  const shipperCharge = Number(form.shipperCharge.value);

  if (!brokerName || Number.isNaN(shipperCharge) || shipperCharge < 0) {
    alert('Please enter a valid broker name and a non-negative shipper charge.');
    return;
  }

  const targets = computeTargets(shipperCharge);
  const entry = {
    brokerName,
    shipperCharge,
    ...targets,
    createdAt: new Date().toISOString()
  };

  const logs = readLogs();
  logs.push(entry);
  writeLogs(logs);

  renderResults(entry);
  renderTable();
  form.reset();
  form.brokerName.focus();
});

clearBtn.addEventListener('click', () => {
  const shouldClear = confirm('Clear all saved logs? This cannot be undone.');
  if (!shouldClear) {
    return;
  }

  writeLogs([]);
  tbody.innerHTML = '';
  results.textContent = 'Logs cleared.';
});

exportBtn.addEventListener('click', exportToCsv);

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('service-worker.js').catch(() => {
      // Ignore registration errors in local environments.
    });
  });
}

results.textContent = 'Enter a shipper charge and save your first quote.';
renderTable();
