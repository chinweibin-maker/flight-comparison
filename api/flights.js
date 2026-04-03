module.exports = async (req, res) => {
    // 1. 彻底解决跨域，确保 GitHub Pages 能访问
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    // 2. 获取你前端传来的“全球”参数
    const { origin, destination, date } = req.query;

    if (!origin || !destination || !date) {
        return res.status(400).json({ error: "喵！参数没传齐：需要 origin, destination, date" });
    }

    try {
        // --- 核心：动态智能引擎 (BIS Logic) ---
        
        // 算法 A：根据日期计算“提前天数”影响价格 (越近越贵)
        const daysToFlight = Math.max(1, (new Date(date) - new Date()) / (1000 * 60 * 60 * 24));
        const demandFactor = 1 + (30 / daysToFlight); // 提前 1 天买比提前 30 天贵得多

        // 算法 B：根据 IATA 代码的字符计算“航线距离”模拟值
        const distanceFactor = Math.abs(origin.charCodeAt(0) - destination.charCodeAt(0)) * 50;

        // 3. 生成全球动态航班列表
        const airlines = [
            { code: 'SQ', name: 'Singapore Airlines', base: 600, speed: 0 },
            { code: 'MH', name: 'Malaysia Airlines', base: 500, speed: 15 },
            { code: 'AK', name: 'AirAsia', base: 200, speed: 5 },
            { code: 'EK', name: 'Emirates', base: 900, speed: -20 },
            { code: 'CX', name: 'Cathay Pacific', base: 550, speed: 10 },
            { code: 'QR', name: 'Qatar Airways', base: 850, speed: -10 },
            { code: 'NH', name: 'ANA Airways', base: 700, speed: -5 }
        ];

        const dynamicFlights = airlines.map((air, index) => {
            // 实时价格计算：(基础分 + 距离分) * 需求系数 + 随机微调
            const finalPrice = Math.floor((air.base + distanceFactor) * demandFactor + (Math.random() * 50));
            
            return {
                id: `FL-${index}-${Date.now()}`,
                validatingAirlineCodes: [air.code],
                price: { 
                    total: finalPrice.toFixed(2), 
                    currency: "MYR" 
                },
                itineraries: [{
                    duration: `PT${Math.floor(5 + index)}H${10 + index * 5}M`,
                    segments: [{
                        departure: { at: `${date}T${7 + index}:30:00` },
                        arrival: { at: `${date}T${12 + index}:45:00` }
                    }]
                }]
            };
        });

        // 4. 返回真正的动态数据
        res.status(200).json({
            data: dynamicFlights,
            meta: { 
                origin, 
                destination, 
                computedDate: date,
                engine: "MeowAir Real-time Dynamic v2.0" 
            }
        });

    } catch (err) {
        res.status(500).json({ error: "引擎崩溃", message: err.message });
    }
};
