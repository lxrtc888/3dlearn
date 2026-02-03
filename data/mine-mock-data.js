/**
 * 智慧煤矿Mock数据配置
 * ============================================
 * 包含矿山基础信息、工作面数据、安全监测、人员定位等
 * ============================================
 */

window.MineMockData = {
    // 矿山基础信息
    mineInfo: {
        name: "智联煤业集团数字矿山",
        type: "井工煤矿",
        depth: 350,  // 米
        area: 12.5,  // 平方公里
        reserves: 1.2, // 亿吨
        employees: 856,
        dailyCapacity: 15000 // 吨/日
    },
    
    // 4个采煤工作面数据
    workfaces: [
        {
            id: "WF-1101",
            name: "1101综采工作面",
            status: "作业中",
            depth: -280,
            length: 220,
            coalHeight: 3.5,
            dailyOutput: 4800,
            progress: 68.5,
            equipment: {
                shearer: { status: "运行", speed: 8.5, position: 45 },
                support: { count: 120, pressure: 32 },
                conveyor: { status: "运行", speed: 1.2 }
            },
            personnel: 28,
            gasLevel: 0.42,
            temperature: 26.5
        },
        {
            id: "WF-1102",
            name: "1102综采工作面",
            status: "作业中",
            depth: -310,
            length: 200,
            coalHeight: 3.2,
            dailyOutput: 4200,
            progress: 52.3,
            equipment: {
                shearer: { status: "运行", speed: 7.8, position: 78 },
                support: { count: 110, pressure: 30 },
                conveyor: { status: "运行", speed: 1.1 }
            },
            personnel: 25,
            gasLevel: 0.38,
            temperature: 27.2
        },
        {
            id: "WF-1103",
            name: "1103综采工作面",
            status: "检修",
            depth: -295,
            length: 180,
            coalHeight: 3.0,
            dailyOutput: 0,
            progress: 41.8,
            equipment: {
                shearer: { status: "停机", speed: 0, position: 0 },
                support: { count: 100, pressure: 28 },
                conveyor: { status: "停机", speed: 0 }
            },
            personnel: 12,
            gasLevel: 0.25,
            temperature: 25.8
        },
        {
            id: "WF-1104",
            name: "1104综采工作面",
            status: "作业中",
            depth: -320,
            length: 210,
            coalHeight: 3.8,
            dailyOutput: 5100,
            progress: 75.2,
            equipment: {
                shearer: { status: "运行", speed: 9.2, position: 120 },
                support: { count: 115, pressure: 34 },
                conveyor: { status: "运行", speed: 1.3 }
            },
            personnel: 30,
            gasLevel: 0.55,
            temperature: 28.1
        }
    ],
    
    // 安全监测数据
    safety: {
        // 瓦斯监测点
        gasSensors: [
            { id: "GS-001", location: "1101回风巷", value: 0.42, limit: 1.0, status: "normal" },
            { id: "GS-002", location: "1101进风巷", value: 0.18, limit: 1.0, status: "normal" },
            { id: "GS-003", location: "1102回风巷", value: 0.38, limit: 1.0, status: "normal" },
            { id: "GS-004", location: "1102进风巷", value: 0.15, limit: 1.0, status: "normal" },
            { id: "GS-005", location: "1103回风巷", value: 0.25, limit: 1.0, status: "normal" },
            { id: "GS-006", location: "1104回风巷", value: 0.55, limit: 1.0, status: "normal" },
            { id: "GS-007", location: "1104工作面", value: 0.82, limit: 1.0, status: "warning" },
            { id: "GS-008", location: "总回风巷", value: 0.35, limit: 1.0, status: "normal" }
        ],
        
        // 一氧化碳监测
        coSensors: [
            { id: "CO-001", location: "1101工作面", value: 8, limit: 24, status: "normal" },
            { id: "CO-002", location: "1102工作面", value: 6, limit: 24, status: "normal" },
            { id: "CO-003", location: "1104工作面", value: 12, limit: 24, status: "normal" }
        ],
        
        // 温度监测
        temperature: [
            { location: "1101工作面", value: 26.5, limit: 30 },
            { location: "1102工作面", value: 27.2, limit: 30 },
            { location: "1103工作面", value: 25.8, limit: 30 },
            { location: "1104工作面", value: 28.1, limit: 30 }
        ],
        
        // 通风数据
        ventilation: {
            mainFan: { status: "运行", airVolume: 12500, pressure: 2800 },
            auxiliaryFan: { status: "备用", airVolume: 0, pressure: 0 }
        }
    },
    
    // 生产调度数据
    production: {
        today: {
            output: 12580,
            target: 15000,
            progress: 83.9,
            efficiency: 95.2
        },
        month: {
            output: 285000,
            target: 380000,
            progress: 75.0,
            daysRemaining: 8
        },
        year: {
            output: 3250000,
            target: 4500000,
            progress: 72.2
        }
    },
    
    // 人员定位数据
    personnel: {
        totalUnderground: 156,
        totalSurface: 85,
        distribution: [
            { zone: "1101工作面", count: 28, color: "#00ff88" },
            { zone: "1102工作面", count: 25, color: "#00ff88" },
            { zone: "1103工作面", count: 12, color: "#ffcc00" },
            { zone: "1104工作面", count: 30, color: "#00ff88" },
            { zone: "运输巷", count: 18, color: "#4a90d9" },
            { zone: "掘进区", count: 22, color: "#4a90d9" },
            { zone: "机电硐室", count: 8, color: "#4a90d9" },
            { zone: "其他区域", count: 13, color: "#888888" }
        ],
        keyPersonnel: [
            { name: "张矿长", role: "值班矿长", location: "调度室" },
            { name: "李安全", role: "安全员", location: "1104工作面" },
            { name: "王技术", role: "技术员", location: "1101工作面" }
        ]
    },
    
    // 主要设备状态
    equipment: {
        surface: [
            { name: "主井提升机", status: "运行", health: 98 },
            { name: "副井提升机", status: "运行", health: 95 },
            { name: "选煤厂", status: "运行", health: 92 },
            { name: "压风机", status: "运行", health: 88 }
        ],
        underground: [
            { name: "1101采煤机", status: "运行", health: 92 },
            { name: "1102采煤机", status: "运行", health: 88 },
            { name: "1103采煤机", status: "检修", health: 65 },
            { name: "1104采煤机", status: "运行", health: 95 },
            { name: "主运皮带", status: "运行", health: 90 },
            { name: "辅运皮带", status: "运行", health: 87 }
        ]
    },
    
    // 报警记录
    alarms: {
        current: [
            { 
                id: "ALM-001", 
                type: "warning", 
                message: "1104工作面瓦斯浓度接近预警值",
                location: "1104工作面",
                time: "14:32:15",
                value: 0.82
            }
        ],
        history: [
            { type: "info", message: "1103工作面开始检修", time: "08:00:00" },
            { type: "warning", message: "主运皮带速度异常", time: "10:15:30" },
            { type: "info", message: "主运皮带恢复正常", time: "10:45:00" }
        ]
    },
    
    // 环境监测（地表）
    environment: {
        pm25: 35,
        pm10: 58,
        noise: 72,
        dust: 0.8,
        weather: "晴",
        temperature: 18,
        humidity: 45
    }
};
