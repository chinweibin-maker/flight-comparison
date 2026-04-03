// 移除 require('node-fetch') 以免环境冲突

module.exports = async (req, res) => {
    // --- 1. 设置跨域头 ---
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // 处理预检请求
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    // --- 2. 获取参数 ---
    const { origin, destination, date } = req.query;

    if (!origin || !destination || !date) {
        return res.status(400).json({ error: "Missing parameters" });
    }

    try {
        // --- 3. 构造完美的 Mock 数据 ---
        // 确保数据结构与前端 script.js 里的解析逻辑 100% 匹配
        const responseData = {
            data: [
                {
                    id: "1",
                    validatingAirlineCodes: ["SQ"],
                    price: { total: "1250.00", currency: "MYR" },
                    itineraries: [{
                        duration: "PT5H30M",
                        segments: [{ 
                            departure: { at: `${date}T08:30:00` }, 
                            arrival: { at: `${date}T14:00:00` } 
                        }]
                    }]
                },
                {
                    id: "2",
                    validatingAirlineCodes: ["MH"],
                    price: { total: "1080.00", currency: "MYR" },
                    itineraries: [{
                        duration: "PT5H45M",
                        segments: [{ 
                            departure: { at: `${date}T10:00:00` }, 
                            arrival: { at: `${date}T15:45:00` } 
                        }]
                    }]
                },
                {
                    id: "3",
                    validatingAirlineCodes: ["AK"],
                    price: { total: "650.00", currency: "MYR" },
                    itineraries: [{
                        duration: "PT5H35M",
                        segments: [{ 
                            departure: { at: `${date}T13:00:00` }, 
                            arrival: { at: `${date}T18:35:00` } 
                        }]
                    }]
                },
                {
                    id: "4",
                    validatingAirlineCodes: ["EK"],
                    price: { total: "2450.00", currency: "MYR" },
                    itineraries: [{
                        duration: "PT10H20M",
                        segments: [
                            { departure: { at: `${date}T01:00:00` }, arrival: { at: `${date}T06:00:00` } }
                        ]
                    }]
                }
            ]
        };

        // --- 4. 返回 JSON ---
        res.status(200).json(responseData);

    } catch (err) {
        // 如果还错，输出错误信息
        res.status(500).json({ error: "Function Crash", message: err.message });
    }
};
