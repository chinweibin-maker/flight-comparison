/**
 * FlightGlobal Pro v13.0
 * 核心逻辑文件
 */

const API_BASE = "https://YOUR-VERCEL-URL/api/flights";

// 航司代码映射表
const AIRLINE_MAP = {
    'SQ': 'Singapore Airlines',
    'MH': 'Malaysia Airlines',
    'EK': 'Emirates',
    'QR': 'Qatar Airways',
    'AK': 'AirAsia',
    'CX': 'Cathay Pacific',
    'NH': 'ANA Airways'
};

let flightData = []; // 存储当前航班数据
let priceChart = null;

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('dep-date').value = today;
    
    initEventListeners();
});

function initEventListeners() {
    // 搜索按钮
    document.getElementById('search-btn').addEventListener('click', fetchFlights);
    
    // 排序切换
    document.getElementById('sort-select').addEventListener('change', sortAndRender);
    
    // 主题切换
    document.getElementById('theme-toggle').addEventListener('click', toggleTheme);
}

async function fetchFlights() {
    const origin = document.getElementById('origin').value.toUpperCase();
    const dest = document.getElementById('destination').value.toUpperCase();
    const date = document.getElementById('dep-date').value;
    const loader = document.getElementById('loading-overlay');

    if (!origin || !dest || !date) {
        alert("请完整填写出发地、目的地和日期！");
        return;
    }

    loader.classList.remove('hidden');

    try {
        const response = await fetch(`${API_BASE}?origin=${origin}&destination=${dest}&date=${date}`);
        const data = await response.json();
        
        // 解析 API 数据 (适配 Amadeus 结构)
        flightData = (data.data || []).map(item => ({
            id: item.id,
            airline: AIRLINE_MAP[item.validatingAirlineCodes[0]] || item.validatingAirlineCodes[0],
            airlineCode: item.validatingAirlineCodes[0],
            price: parseFloat(item.price.total),
            currency: item.price.currency,
            duration: parseDuration(item.itineraries[0].duration),
            segments: item.itineraries[0].segments.length,
            departure: item.itineraries[0].segments[0].departure.at,
            arrival: item.itineraries[0].segments[item.itineraries[0].segments.length - 1].arrival.at
        }));

        sortAndRender();

    } catch (error) {
        console.error("Fetch error:", error);
        alert("无法获取实时数据，请检查 API 配置或网络。");
    } finally {
        loader.classList.add('hidden');
    }
}

// 解析 ISO 8601 时长 (如 PT5H30M)
function parseDuration(pt) {
    const hours = pt.match(/(\d+)H/);
    const mins = pt.match(/(\d+)M/);
    const h = hours ? parseInt(hours[1]) : 0;
    const m = mins ? parseInt(mins[1]) : 0;
    return {
        totalMinutes: (h * 60) + m,
        text: `${h}h ${m}m`
    };
}

function sortAndRender() {
    const sortBy = document.getElementById('sort-select').value;
    
    if (sortBy === 'price_asc') {
        flightData.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'duration_asc') {
        flightData.sort((a, b) => a.duration.totalMinutes - b.duration.totalMinutes);
    }

    renderFlights();
    renderChart();
}

function renderFlights() {
    const container = document.getElementById('flight-results');
    if (flightData.length === 0) {
        container.innerHTML = '<div class="empty-state"><p>未找到符合条件的航班</p></div>';
        return;
    }

    container.innerHTML = flightData.map(f => `
        <div class="flight-item card">
            <div class="airline-info">
                ${f.airline}<br>
                <small style="color:var(--text-muted)">${f.airlineCode}</small>
            </div>
            <div class="time-info">
                <b>${formatTime(f.departure)} — ${formatTime(f.arrival)}</b>
                <span style="font-size: 0.8rem; color:var(--text-muted)">
                    ${f.duration.text} | ${f.segments === 1 ? '直飞' : (f.segments - 1) + '次中转'}
                </span>
            </div>
            <div class="price-info">
                <div class="price-val">${f.currency} ${f.price.toFixed(2)}</div>
                <small style="color:var(--text-muted)">含税总价</small>
            </div>
            <div>
                <button class="primary-btn" style="padding: 0.5rem;" onclick="window.open('https://www.google.com/flights?q=${f.airlineCode}')">预订</button>
            </div>
        </div>
    `).join('');
}

function renderChart() {
    const ctx = document.getElementById('priceChart').getContext('2d');
    const top7 = flightData.slice(0, 7);
    
    if (priceChart) priceChart.destroy();

    priceChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: top7.map(f => f.airlineCode),
            datasets: [{
                label: '航司最低价对比',
                data: top7.map(f => f.price),
                backgroundColor: '#2563eb',
                borderRadius: 5
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: { beginAtZero: false, grid: { color: 'rgba(0,0,0,0.05)' } },
                x: { grid: { display: false } }
            }
        }
    });
}

function formatTime(isoStr) {
    return new Date(isoStr).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
}

function toggleTheme() {
    const body = document.body;
    const currentTheme = body.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    body.setAttribute('data-theme', newTheme);
    const icon = document.querySelector('#theme-toggle i');
    icon.className = newTheme === 'light' ? 'fas fa-moon' : 'fas fa-sun';
}
