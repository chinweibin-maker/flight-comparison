/**
 * FlightGlobal Pro v15.0 - GDS 实时仿真引擎
 * 开发环境: Vercel Serverless (Node.js)
 * 特性: 零依赖、动态定价、签证雷达、价格趋势预测
 */

module.exports = async (req, res) => {
    // --- 1. CORS 全域放行 (确保 GitHub Pages 访问无阻) ---
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // 处理预检请求
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    // --- 2. 参数解析与校验 ---
    const { origin, destination, date } = req.query;

    if (!origin || !destination || !date) {
        return res.status(400).json({ 
            error: "MISSING_PARAMS", 
            message: "喵！参数没传齐：需要 origin, destination, date (YYYY-MM-DD)" 
        });
    }

    try {
        // --- 3. 动态算法核心 (BIS Dynamic Logic) ---

        // A. 模拟航线距离 (基于 IATA 代码字符差值)
        const getDistance = (s1, s2) => {
            let diff = 0;
            for (let i = 0; i < 3; i++) {
                diff += Math.abs((s1.charCodeAt(i) || 0) - (s2.charCodeAt(i) || 0));
            }
            return diff * 50; // 模拟公里数
        };
        const distanceKM = getDistance(origin.toUpperCase(), destination.toUpperCase());

        // B. 需求压力因子 (离起飞越近越贵)
        const today = new Date();
        const flightDate = new Date(date);
        const daysLeft = Math.max(1, Math.ceil((flightDate - today) / (1000 * 60 * 60 * 24)));
        
        // 阶梯定价：1-7天涨价200%，8-14天涨价150%，15天以上基础价
        const demandFactor = daysLeft < 7 ? 2.2 : (daysLeft < 14 ? 1.5 : 1.0);
        
        // C. 全球航司数据库 (8家航司配置)
        const airlineDB = [
            { id: 'SQ', name: 'Singapore Airlines', base: 600, type: 'Full', luggage: '30kg Check-in', meal: 'Premium' },
            { id: 'MH', name: 'Malaysia Airlines', base: 500, type: 'Full', luggage: '25kg Check-in', meal: 'Standard' },
            { id: 'AK', name: 'AirAsia', base: 150, type: 'LCC', luggage: '7kg Carry-on', meal: 'Paid' },
            { id: 'EK', name: 'Emirates', base: 850, type: 'Luxury', luggage: '35kg Check-in', meal: 'Gourmet' },
            { id: 'NH', name: 'ANA Airways', base: 750, type: 'Full', luggage: '46kg Check-in', meal: 'Japanese' },
            { id: 'CX', name: 'Cathay Pacific', base: 550, type: 'Full', luggage: '23kg Check-in', meal: 'Standard' },
            { id: 'JL', name: 'Japan Airlines', base: 700, type: 'Full', luggage: '46kg Check-in', meal: 'Premium' },
            { id: 'QR', name: 'Qatar Airways', base: 880, type: 'Luxury', luggage: '35kg Check-in', meal: 'Fine Dining' }
        ];

        // --- 4. 构造 Amadeus 标准格式数据 ---
        const flightOffers = airlineDB.map((air, index) => {
            // 最终价格计算公式：(基础价 + 距离权重) * 需求因子 + 随机波动
            const volatility = Math.floor(Math.random() * 50);
            const finalPrice = ((air.base + (distanceKM * 0.1)) * demandFactor + volatility).toFixed(2);

            return {
                id: `offer_${index + 1}`,
                type: "flight-offer",
                validatingAirlineCodes: [air.id],
                airlineName: air.name, // 扩展字段方便前端展示
                price: {
                    total: finalPrice,
                    currency: "MYR",
                    base: (finalPrice * 0.8).toFixed(2)
                },
                itineraries: [{
                    duration: `PT${Math.floor(distanceKM / 800) + 1}H${15 + index * 5}M`,
                    segments: [{
                        departure: { iataCode: origin.toUpperCase(), at: `${date}T${8 + index}:00:00` },
                        arrival: { iataCode: destination.toUpperCase(), at: `${date}T${13 + index}:30:00` },
                        carrierCode: air.id,
                        numberOfStops: 0
                    }]
                }],
                travelerPricings: [{
                    fareDetailsBySegment: [{
                        cabin: "ECONOMY",
                        includedCheckedBags: { quantity: air.type === 'LCC' ? 0 : 1 },
                        amenities: [
                            { description: `Luggage: ${air.luggage}`, isIncluded: true },
                            { description: `Meal: ${air.meal}`, isIncluded: air.type !== 'LCC' }
                        ]
                    }]
                }]
            };
        });

        // --- 5. 智慧预测与签证雷达 (Meta 数据) ---
        
        // 签证建议
        let visaNote = "请检查目的地签证要求。";
        const dest = destination.toUpperCase();
        if (["PVG", "PEK", "CAN", "SHA"].includes(dest)) {
            visaNote = "目的地为中国！马来西亚护照持有者 15 天内免签喵！";
        }

        // 买入指数 (基于提前天数和模拟波幅)
        let buyIndex = "HOLD"; // 观望
        if (daysLeft > 21) buyIndex = "BUY"; // 早期低价
        if (daysLeft < 3) buyIndex = "CRITICAL"; // 极高价格

        // --- 6. 响应输出 ---
        res.status(200).json({
            data: flightOffers,
            meta: {
                count: flightOffers.length,
                visaRadar: visaNote,
                prediction: {
                    index: buyIndex,
                    advice: daysLeft > 14 ? "当前处于价格波谷，建议立即预订喵！" : "票源极度紧张，价格持续走高喵！"
                },
                generatedAt: new Date().toISOString()
            }
        });

    } catch (err) {
        res.status(500).json({ 
            error: "INTERNAL_ENGINE_CRASH", 
            details: err.message 
        });
    }
};
