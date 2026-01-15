/**
 * 案例配置中心
 * ============================================
 * 所有3D演示案例的统一配置文件
 * 
 * 📌 新增案例步骤：
 * 1. 在 scenes/ 目录创建场景文件（参考 scene-template.js）
 * 2. 在 index.html 中引入场景脚本
 * 3. 在此文件的 CASES 数组中添加配置
 * 4. 如需代码演示，在 code-snippets.js 中添加对应代码
 * ============================================
 */

window.CasesConfig = {
    /**
     * 案例列表
     * 每个案例包含：
     * - id: 唯一标识符（对应场景类名前缀）
     * - title: 显示标题
     * - keywords: 关键词数组（用于聊天意图匹配）
     * - type: 'scene' | 'ppt' 展示类型
     * - sceneClass: window 上的场景类名（type为scene时必填）
     * - icon: FontAwesome 图标类名
     * - description: 简短描述
     * - difficulty: 难度等级 1-5
     */
    CASES: [
        {
            id: 'llm',
            title: 'LLM 注意力网络 (3D交互)',
            keywords: ['大模型', 'llm', 'transformer', '注意力', 'attention'],
            type: 'scene',
            sceneClass: 'LLMScene',
            icon: 'fa-brain',
            description: '探索大语言模型的注意力机制，理解Token之间的关联',
            difficulty: 3,
            // 特殊条件：需要同时包含这些关键词才匹配
            requireAll: ['大模型', ['交互', '3D', '场景']]
        },
        {
            id: 'engine',
            title: 'V6 赛博引擎',
            keywords: ['发动机', '引擎', 'v6', '气缸', '活塞'],
            type: 'scene',
            sceneClass: 'EngineScene',
            icon: 'fa-cogs',
            description: '赛博朋克风格的V6发动机运转动画',
            difficulty: 2
        },
        {
            id: 'quantum',
            title: '双缝干涉 (观察者效应)',
            keywords: ['双缝', '干涉', '量子', '波函数', '观察者'],
            type: 'scene',
            sceneClass: 'QuantumScene',
            icon: 'fa-atom',
            description: '量子力学双缝干涉实验，展示观察者效应',
            difficulty: 4
        },
        {
            id: 'hydraulic',
            title: '液压传动系统',
            keywords: ['液压', '水压', '帕斯卡', '流体'],
            type: 'scene',
            sceneClass: 'HydraulicScene',
            icon: 'fa-tint',
            description: '帕斯卡定律可视化，理解液压传动原理',
            difficulty: 2
        },
        {
            id: 'ppt',
            title: 'LLM 原理课件 (8页)',
            keywords: ['大模型', 'ppt', '原理', '课件', '幻灯片'],
            type: 'ppt',
            sceneClass: null,
            icon: 'fa-chalkboard-teacher',
            description: '从Tokenization到RLHF的完整讲解',
            difficulty: 3
        }
    ],

    /**
     * 根据用户输入匹配案例
     * @param {string} text - 用户输入文本
     * @returns {Object|null} 匹配的案例配置
     */
    matchCase(text) {
        const lowerText = text.toLowerCase();
        
        // 优先检查有特殊匹配条件的案例
        for (const c of this.CASES) {
            if (c.requireAll) {
                // 需要满足所有条件
                const allMatch = c.requireAll.every(condition => {
                    if (Array.isArray(condition)) {
                        // 数组条件：任一匹配即可
                        return condition.some(kw => lowerText.includes(kw.toLowerCase()));
                    }
                    return lowerText.includes(condition.toLowerCase());
                });
                if (allMatch) return c;
            }
        }
        
        // 普通关键词匹配
        for (const c of this.CASES) {
            if (c.requireAll) continue; // 跳过特殊条件的
            for (const kw of c.keywords) {
                if (lowerText.includes(kw.toLowerCase())) {
                    return c;
                }
            }
        }
        
        return null;
    },

    /**
     * 获取案例的场景类
     * @param {string} caseId - 案例ID
     * @returns {Function|null} 场景类构造函数
     */
    getSceneClass(caseId) {
        const c = this.CASES.find(item => item.id === caseId);
        if (c && c.sceneClass && window[c.sceneClass]) {
            return window[c.sceneClass];
        }
        return null;
    },

    /**
     * 获取案例列表（用于欢迎消息）
     * @returns {string} HTML格式的案例列表
     */
    getWelcomeList() {
        return this.CASES.map((c, i) => 
            `${i + 1}. <b>[${c.title.split(' ')[0]}]</b> - ${c.description}`
        ).join('<br>');
    }
};
