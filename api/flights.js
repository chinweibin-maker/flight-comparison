const fetch = require('node-fetch');

module.exports = async (req, res) => {
    // --- 关键：允许跨域 (CORS) ---
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    const { origin, destination, date } = req.query;

    // 参数校验逻辑
    if (!origin || !destination || !date) {
        return res.status(400).json({ error: "参数不全喵！需要 origin, destination 和 date" });
    }

    try {
        /**
         * 💡 这里是模拟的实时航班数据
         * 前端 script.js 会根据这个 data 数组来画图表和列表
         */
        const mockData = {
            data: [
                {
                    id: "1",
                    validatingAirlineCodes: ["SQ"],
                    price: { total: "1250.00", currency: "MYR" },
                    itineraries: [{
                        duration: "PT5H30M",
                        segments: [{ departure: { at: `${date}T08:30:00` }, arrival: { at: `${date}T14:00:00` } }]
                    }]
                },
                {
                    id: "2",
                    validatingAirlineCodes: ["MH"],
                    price: { total: "1080.00", currency: "MYR" },
                    itineraries: [{
                        duration: "PT5H45M",
                        segments: [{ departure: { at: `${date}T10:00:00` }, arrival: { at: `${date}T15:45:00` } }]
                    }]
                },
                {
                    id: "3",
                    validatingAirlineCodes: ["AK"],
                    price: { total: "580.00", currency: "MYR" },
                    itineraries: [{
                        duration: "PT5H35M",
                        segments: [{ departure: { at: `${date}T13:00:00` }, arrival: { at: `${date}T18:35:00` } }]
                    }]
                },
                {
                    id: "4",
                    validatingAirlineCodes: ["EK"],
                    price: { total: "2450.00", currency: "MYR" },
                    itineraries: [{
                        duration: "PT10H20M",
                        segments: [
                            { departure: { at: `${date}T01:00:00` }, arrival: { at: `${date}T06:00:00` } },
                            { departure: { at: `${date}T08:00:00` }, arrival: { at: `${date}T11:20:00` } }
                        ]
                    }]
                }
            ]
        };

        res.status(200).json(mockData);

    } catch (error) {
        res.status(500).json({ error: "服务器内部故障", details: error.message });
    }
};
