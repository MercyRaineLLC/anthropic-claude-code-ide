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

function toNumberOrNull(value) {
  if (value === '' || value === null || value === undefined) {
    return null;
  }

  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
}

function formatCurrencyOrDash(value) {
  return typeof value === 'number' ? currency.format(value) : '—';
}

function formatPercentOrDash(value) {
  return typeof value === 'number' ? `${value.toFixed(2)}%` : '—';
}

function computeCarrierTargetsFromShipper(shipperCharge) {
  return {
    walkaway20: shipperCharge * 0.8,
    goal225: shipperCharge * 0.775,
    goal25: shipperCharge * 0.75
  };
}

function computeShipperTargetsFromCarrier(carrierPrice) {
  return {
    sellFor20: carrierPrice / 0.8,
    sellFor225: carrierPrice / 0.775,
    sellFor25: carrierPrice / 0.75
  };
}

function computeQuoteMetrics(shipperCharge, carrierPrice) {
  if (typeof shipperCharge !== 'number' || typeof carrierPrice !== 'number') {
    return {
      grossProfit: null,
      marginPct: null
    };
  }

  const grossProfit = shipperCharge - carrierPrice;
  const marginPct = shipperCharge > 0 ? (grossProfit / shipperCharge) * 100 : null;

  return {
    grossProfit,
    marginPct
  };
}

function readLogs() {
  return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
}

function writeLogs(logs) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
}

function normalizeEntry(entry) {
  const shipperCharge = toNumberOrNull(entry.shipperCharge);
  const carrierPrice = toNumberOrNull(entry.carrierPrice);

  const buyTargets = typeof shipperCharge === 'number'
    ? computeCarrierTargetsFromShipper(shipperCharge)
    : {
        walkaway20: null,
        goal225: null,
        goal25: null
      };

  const sellTargets = typeof carrierPrice === 'number'
    ? computeShipperTargetsFromCarrier(carrierPrice)
    : {
        sellFor20: null,
        sellFor225: null,
        sellFor25: null
      };

  const quoteMetrics = computeQuoteMetrics(shipperCharge, carrierPrice);

  return {
    brokerName: entry.brokerName || '',
    shipperCharge,
    carrierPrice,
    ...buyTargets,
    ...sellTargets,
    ...quoteMetrics,
    createdAt: entry.createdAt || new Date().toISOString()
  };
}

function renderResults(entry) {
  const hasShipper = typeof entry.shipperCharge === 'number';
  const hasCarrier = typeof entry.carrierPrice === 'number';

  results.innerHTML = `
    <div class="results-section">
      <h3>Current Quote</h3>
      <div class="results-grid">
        <div class="metric">
          <span class="metric-label">Shipper Charge</span>
          <span class="metric-value">${formatCurrencyOrDash(entry.shipperCharge)}</span>
        </div>
        <div class="metric">
          <span class="metric-label">Carrier Price</span>
          <span class="metric-value">${formatCurrencyOrDash(entry.carrierPrice)}</span>
        </div>
        <div class="metric">
          <span class="metric-label">Gross Profit</span>
          <span class="metric-value">${formatCurrencyOrDash(entry.grossProfit)}</span>
        </div>
        <div class="metric">
          <span class="metric-label">Actual Margin</span>
          <span class="metric-value">${formatPercentOrDash(entry.marginPct)}</span>
        </div>
      </div>
    </div>
    <div class="results-section">
      <h3>Carrier Target From Shipper</h3>
      <div class="results-grid">
        <div class="metric">
          <span class="metric-label">20% Walkaway</span>
          <span class="metric-value">${formatCurrencyOrDash(entry.walkaway20)}</span>
        </div>
        <div class="metric">
          <span class="metric-label">22.5% Goal</span>
          <span class="metric-value">${formatCurrencyOrDash(entry.goal225)}</span>
        </div>
        <div class="metric">
          <span class="metric-label">25% Goal</span>
          <span class="metric-value">${formatCurrencyOrDash(entry.goal25)}</span>
        </div>
      </div>
      ${hasShipper ? '' : '<p class="hint">Enter a shipper charge to calculate these targets.</p>'}
    </div>
    <div class="results-section">
      <h3>Suggested Shipper Charge From Carrier</h3>
      <div class="results-grid">
        <div class="metric">
          <span class="metric-label">Sell for 20%</span>
          <span class="metric-value">${formatCurrencyOrDash(entry.sellFor20)}</span>
          ${hasCarrier ? '<button class="metric-action" type="button" data-fill-shipper="sellFor20">Use This</button>' : ''}
        </div>
        <div class="metric">
          <span class="metric-label">Sell for 22.5%</span>
          <span class="metric-value">${formatCurrencyOrDash(entry.sellFor225)}</span>
          ${hasCarrier ? '<button class="metric-action" type="button" data-fill-shipper="sellFor225">Use This</button>' : ''}
        </div>
        <div class="metric">
          <span class="metric-label">Sell for 25%</span>
          <span class="metric-value">${formatCurrencyOrDash(entry.sellFor25)}</span>
          ${hasCarrier ? '<button class="metric-action" type="button" data-fill-shipper="sellFor25">Use This</button>' : ''}
        </div>
      </div>
      ${hasCarrier ? '' : '<p class="hint">Enter a carrier price to get suggested shipper charges.</p>'}
    </div>
  `;
}

function renderTable() {
  const logs = readLogs();
  tbody.innerHTML = '';

  logs
    .slice()
    .reverse()
    .forEach((storedEntry) => {
      const entry = normalizeEntry(storedEntry);
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${new Date(entry.createdAt).toLocaleString()}</td>
        <td>${entry.brokerName || '—'}</td>
        <td>${formatCurrencyOrDash(entry.carrierPrice)}</td>
        <td>${formatCurrencyOrDash(entry.shipperCharge)}</td>
        <td>${formatCurrencyOrDash(entry.grossProfit)}</td>
        <td>${formatPercentOrDash(entry.marginPct)}</td>
        <td>${formatCurrencyOrDash(entry.walkaway20)}</td>
        <td>${formatCurrencyOrDash(entry.goal225)}</td>
        <td>${formatCurrencyOrDash(entry.goal25)}</td>
        <td>${formatCurrencyOrDash(entry.sellFor20)}</td>
        <td>${formatCurrencyOrDash(entry.sellFor225)}</td>
        <td>${formatCurrencyOrDash(entry.sellFor25)}</td>
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

  const headers = [
    'created_at',
    'broker_name',
    'carrier_price',
    'shipper_charge',
    'gross_profit',
    'margin_pct',
    'walkaway_20',
    'goal_22_5',
    'goal_25',
    'sell_for_20',
    'sell_for_22_5',
    'sell_for_25'
  ];

  const rows = logs.map((storedEntry) => {
    const entry = normalizeEntry(storedEntry);
    return [
      entry.createdAt,
      entry.brokerName,
      entry.carrierPrice,
      entry.shipperCharge,
      entry.grossProfit,
      entry.marginPct,
      entry.walkaway20,
      entry.goal225,
      entry.goal25,
      entry.sellFor20,
      entry.sellFor225,
      entry.sellFor25
    ];
  });

  const csv = [headers, ...rows]
    .map((row) => row.map((cell) => `"${String(cell ?? '').replaceAll('"', '""')}"`).join(','))
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
  const shipperCharge = toNumberOrNull(form.shipperCharge.value);
  const carrierPrice = toNumberOrNull(form.carrierPrice.value);

  if (!brokerName) {
    alert('Please enter a broker name.');
    return;
  }

  if (shipperCharge !== null && shipperCharge < 0) {
    alert('Shipper charge must be a non-negative number.');
    return;
  }

  if (carrierPrice !== null && carrierPrice < 0) {
    alert('Carrier price must be a non-negative number.');
    return;
  }

  if (shipperCharge === null && carrierPrice === null) {
    alert('Enter at least a shipper charge or carrier price to calculate.');
    return;
  }

  const entry = normalizeEntry({
    brokerName,
    shipperCharge,
    carrierPrice,
    createdAt: new Date().toISOString()
  });

  const logs = readLogs();
  logs.push(entry);
  writeLogs(logs);

  renderResults(entry);
  renderTable();
  form.reset();
  form.brokerName.focus();
});

results.addEventListener('click', (event) => {
  const target = event.target;
  if (!(target instanceof HTMLElement)) {
    return;
  }

  const fillKey = target.dataset.fillShipper;
  if (!fillKey) {
    return;
  }

  const carrierPrice = toNumberOrNull(form.carrierPrice.value);
  if (carrierPrice === null) {
    alert('Enter a carrier price first.');
    form.carrierPrice.focus();
    return;
  }

  const sellTargets = computeShipperTargetsFromCarrier(carrierPrice);
  const value = sellTargets[fillKey];
  if (typeof value !== 'number') {
    return;
  }

  form.shipperCharge.value = value.toFixed(2);
  form.shipperCharge.focus();
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

results.textContent = 'Enter broker name and at least one price to calculate targets.';
renderTable();
