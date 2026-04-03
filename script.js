/**
 * FlightGlobal Pro v13.0 - 真实全栈版
 * API 接入点：Vercel Serverless Function
 */

// 1. 修改为你真实的 Vercel 后端地址 (注意后缀 /api/flights)
const API_BASE = "https://flight-comparison-pi.vercel.app/api/flights";

// 航司 IATA 代码映射全名字典
const AIRLINE_MAP = {
    'SQ': 'Singapore Airlines',
    'MH': 'Malaysia Airlines',
    'EK': 'Emirates',
    'QR': 'Qatar Airways',
    'AK': 'AirAsia',
    'CX': 'Cathay Pacific',
    'NH': 'ANA Airways',
    'UL': 'SriLankan Airlines',
    'FY': 'Firefly',
    'OD': 'Batik Air'
};

let flightData = []; // 存储从后端拿到的航班数据
let priceChart = null;

// --- 页面初始化 ---
document.addEventListener('DOMContentLoaded', () => {
    // 默认日期设为今天
    const today = new Date().toISOString().split('T')[0];
    const dateInput = document.getElementById('dep-date');
    if (dateInput) dateInput.value = today;
    
    initEventListeners();
    console.log("FlightGlobal Pro 引擎已就绪...");
});

function initEventListeners() {
    // 搜索按钮逻辑
    const searchBtn = document.getElementById('search-btn');
    if (searchBtn) {
        searchBtn.addEventListener('click', fetchFlights);
    }
    
    // 排序切换逻辑
    const sortSelect = document.getElementById('sort-select');
    if (sortSelect) {
        sortSelect.addEventListener('change', sortAndRender);
    }
    
    // 主题切换逻辑
    const themeBtn = document.getElementById('theme-toggle');
    if (themeBtn) {
        themeBtn.addEventListener('click', toggleTheme);
    }
}

// --- 核心功能：异步获取数据 ---
async function fetchFlights() {
    const origin = document.getElementById('origin').value.toUpperCase();
    const dest = document.getElementById('destination').value.toUpperCase();
    const date = document.getElementById('dep-date').value;
    const loader = document.getElementById('loading-overlay');

    if (!origin || !dest || !date) {
        alert("喵！请填全出发地、目的地和日期哦！");
        return;
    }

    // 显示 Loading 动画
    if (loader) loader.classList.remove('hidden');

    try {
        // 向你的 Vercel 后端发起请求
        const response = await fetch(`${API_BASE}?origin=${origin}&destination=${dest}&date=${date}`);
        
        if (!response.ok) {
            throw new Error(`HTTP 错误！状态码: ${response.status}`);
        }

        const json = await response.json();
        
        // 解析符合 Amadeus 结构的后端数据
        flightData = (json.data || []).map(item => ({
            id: item.id,
            airline: AIRLINE_MAP[item.validatingAirlineCodes[0]] || `Airline ${item.validatingAirlineCodes[0]}`,
            airlineCode: item.validatingAirlineCodes[0],
            price: parseFloat(item.price.total),
            currency: item.price.currency,
            duration: parseISO8601Duration(item.itineraries[0].duration),
            segments: item.itineraries[0].segments.length,
            departure: item.itineraries[0].segments[0].departure.at,
            arrival: item.itineraries[0].segments[item.itineraries[0].segments.length - 1].arrival.at,
            rawDate: date,
            originCity: origin,
            destCity: dest
        }));

        // 执行排序并渲染界面
        sortAndRender();

    } catch (error) {
        console.error("API 连接失败:", error);
        alert("无法连接到后端 API，请检查 Vercel 链接或网络。");
    } finally {
        // 隐藏 Loading 动画
        if (loader) loader.classList.add('hidden');
    }
}

// --- 数据解析助手 ---
function parseISO8601Duration(pt) {
    const hours = pt.match(/(\d+)H/);
    const mins = pt.match(/(\d+)M/);
    const h = hours ? parseInt(hours[1]) : 0;
    const m = mins ? parseInt(mins[1]) : 0;
    return {
        totalMinutes: (h * 60) + m,
        text: `${h}h ${m}m`
    };
}

function formatTime(isoStr) {
    return new Date(isoStr).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
}

// --- 排序与渲染逻辑 ---
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
    if (!container) return;

    if (flightData.length === 0) {
        container.innerHTML = '<div class="empty-state"><i class="fas fa-search-minus"></i><p>未找到相关航线的航班数据喵</p></div>';
        return;
    }

    container.innerHTML = flightData.map(f => {
        // 动态生成 Google Flights 预订链接，让你的“预订”按钮变真实
        const gFlightsUrl = `https://www.google.com/flights?q=${f.originCity}+to+${f.destCity}+${f.rawDate}`;

        return `
            <div class="flight-item card">
                <div class="airline-info">
                    <strong>${f.airline}</strong><br>
                    <small style="color:var(--text-muted)">${f.airlineCode} Flight</small>
                </div>
                <div class="time-info">
                    <b>${formatTime(f.departure)} — ${formatTime(f.arrival)}</b>
                    <span style="font-size: 0.8rem; color:var(--text-muted)">
                        ${f.duration.text} | ${f.segments === 1 ? '直飞 (Non-stop)' : (f.segments - 1) + '次中转'}
                    </span>
                </div>
                <div class="price-info">
                    <div class="price-val">${f.currency} ${f.price.toLocaleString()}</div>
                    <small style="color:var(--text-muted)">含税总价</small>
                </div>
                <div style="text-align:right;">
                    <button class="primary-btn" style="padding: 0.6rem 1rem; font-size: 0.9rem;" 
                        onclick="window.open('${gFlightsUrl}', '_blank')">
                        立即预订
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

// --- 图表渲染 (Chart.js) ---
function renderChart() {
    const canvas = document.getElementById('priceChart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    // 只取前 7 个价格最低的航司进行对比
    const top7 = flightData.slice(0, 7);
    
    if (priceChart) priceChart.destroy();

    priceChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: top7.map(f => f.airlineCode),
            datasets: [{
                label: '实时航司价格对比 (报价货币)',
                data: top7.map(f => f.price),
                backgroundColor: 'rgba(37, 99, 235, 0.7)',
                borderColor: '#2563eb',
                borderWidth: 1,
                borderRadius: 8
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

// --- 主题切换逻辑 ---
function toggleTheme() {
    const body = document.body;
    const currentTheme = body.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    body.setAttribute('data-theme', newTheme);
    
    const icon = document.querySelector('#theme-toggle i');
    if (icon) {
        icon.className = newTheme === 'light' ? 'fas fa-moon' : 'fas fa-sun';
    }
    
    // 重新渲染图表以适配主题色切换
    if (priceChart) renderChart();
}
