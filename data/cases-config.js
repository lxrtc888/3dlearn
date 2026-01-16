/**
 * 案例配置中心 v3.0
 * ============================================
 * 所有3D演示案例的统一配置文件
 * 包含场景介绍模态框内容
 * ============================================
 */

window.CasesConfig = {
    /**
     * 案例列表
     */
    CASES: [
        {
            id: 'attention',
            title: '注意力机制原理',
            keywords: ['注意力', 'attention', '大模型', 'transformer', 'llm', '自注意力'],
            type: 'scene',
            sceneClass: 'AttentionScene',
            icon: 'fa-brain',
            description: '探索Transformer的自注意力机制',
            difficulty: 3,
            // 介绍模态框内容
            intro: {
                subtitle: 'Transformer Self-Attention 可视化',
                objectives: [
                    '理解词嵌入（Word Embedding）的概念',
                    '掌握 Query-Key-Value 三元组的作用',
                    '了解注意力权重如何聚合信息'
                ],
                keyPoints: ['词向量', 'Q·K点积', 'Softmax', '加权求和'],
                tips: '点击词元节点查看注意力分布，使用步骤按钮逐步学习'
            }
        },
        {
            id: 'engine',
            title: 'V6 赛博引擎',
            keywords: ['发动机', '引擎', 'v6', '气缸', '活塞'],
            type: 'scene',
            sceneClass: 'EngineScene',
            icon: 'fa-cogs',
            description: '赛博朋克风格的V6发动机运转动画',
            difficulty: 2,
            intro: {
                subtitle: '四冲程内燃机工作原理',
                objectives: [
                    '理解四冲程循环：进气→压缩→做功→排气',
                    '了解曲轴如何将往复运动转为旋转',
                    '认识V型发动机的结构优势'
                ],
                keyPoints: ['四冲程', '活塞运动', '曲轴', '点火顺序'],
                tips: '使用步骤按钮分别查看四个冲程，点击部件了解详情'
            }
        },
        {
            id: 'quantum',
            title: '双缝干涉实验',
            keywords: ['双缝', '干涉', '量子', '波函数', '观察者', '波粒二象性'],
            type: 'scene',
            sceneClass: 'QuantumScene',
            icon: 'fa-atom',
            description: '量子力学双缝干涉实验',
            difficulty: 4,
            intro: {
                subtitle: '波粒二象性与观察者效应',
                objectives: [
                    '理解电子的波动性和粒子性',
                    '观察干涉条纹的形成过程',
                    '体验"观察"如何改变实验结果'
                ],
                keyPoints: ['波粒二象性', '干涉条纹', '观察者效应', '量子叠加'],
                tips: '先运行波动实验看干涉，再开启观测看变化！'
            }
        },
        {
            id: 'hydraulic',
            title: '液压传动系统',
            keywords: ['液压', '水压', '帕斯卡', '流体', '千斤顶'],
            type: 'scene',
            sceneClass: 'HydraulicScene',
            icon: 'fa-tint',
            description: '帕斯卡定律可视化',
            difficulty: 2,
            intro: {
                subtitle: '帕斯卡定律与力的放大',
                objectives: [
                    '理解密闭液体传递压强的原理',
                    '掌握力的放大公式：F₂/F₁ = A₂/A₁',
                    '了解液压系统在千斤顶等设备中的应用'
                ],
                keyPoints: ['压强相等', '面积比', '力的放大', '不可压缩'],
                tips: '调节输入力大小，观察输出力的变化倍数'
            }
        },
        {
            id: 'pendulum',
            title: '单摆运动实验',
            keywords: ['单摆', '简谐', '周期', '摆长', '重力加速度', 't=2π'],
            type: 'scene',
            sceneClass: 'PendulumScene',
            icon: 'fa-clock',
            description: '简谐运动与能量守恒可视化',
            difficulty: 2,
            intro: {
                subtitle: '简谐运动与周期规律',
                objectives: [
                    '理解单摆的简谐运动特征',
                    '认识摆长对周期的影响',
                    '观察势能与动能的转化'
                ],
                keyPoints: ['T=2π√(L/g)', '能量守恒', '小角度近似'],
                tips: '拖动摆球或调整参数，观察周期变化'
            }
        },
        {
            id: 'electromagnetic',
            title: '电磁感应实验',
            keywords: ['电磁感应', '法拉第', '楞次', '磁通量', '线圈', '感应电流'],
            type: 'scene',
            sceneClass: 'ElectromagneticScene',
            icon: 'fa-magnet',
            description: '磁通量变化产生感应电动势',
            difficulty: 3,
            intro: {
                subtitle: '法拉第定律与楞次定律',
                objectives: [
                    '理解磁通量变化产生感应电动势',
                    '观察感应电流方向的变化',
                    '掌握楞次定律的“反抗变化”原则'
                ],
                keyPoints: ['ε=-dΦ/dt', '楞次定律', '磁通量变化'],
                tips: '移动磁铁速度和方向，观察电流表变化'
            }
        },
        {
            id: 'cell',
            title: '动物细胞结构',
            keywords: ['细胞', '动物细胞', '细胞核', '线粒体', '内质网', '高尔基体'],
            type: 'scene',
            sceneClass: 'CellScene',
            icon: 'fa-microscope',
            description: '细胞器结构与功能可视化',
            difficulty: 2,
            intro: {
                subtitle: '细胞器协作与生命活动',
                objectives: [
                    '识别主要细胞器的结构',
                    '理解细胞器的分工协作',
                    '建立细胞是“生命基本单位”的概念'
                ],
                keyPoints: ['细胞膜', '细胞核', '线粒体', '内质网', '高尔基体'],
                tips: '点击细胞器查看功能说明，使用分解视图观察结构'
            }
        },
        {
            id: 'dna',
            title: 'DNA双螺旋结构',
            keywords: ['DNA', '双螺旋', '碱基配对', '遗传', '核酸', '基因'],
            type: 'scene',
            sceneClass: 'DNAScene',
            icon: 'fa-dna',
            description: '遗传信息的双螺旋可视化',
            difficulty: 3,
            intro: {
                subtitle: '遗传密码与碱基配对',
                objectives: [
                    '理解双螺旋结构的基本特征',
                    '掌握碱基配对规则 A-T、G-C',
                    '认识DNA复制与遗传信息传递'
                ],
                keyPoints: ['双螺旋', '碱基配对', '氢键', '遗传信息'],
                tips: '切换高亮 A-T 或 G-C，观察氢键数差异'
            }
        },
        {
            id: 'vector3d',
            title: '三维向量与运算',
            keywords: ['向量', '三维', '空间向量', '点积', '叉积', '平行四边形'],
            type: 'scene',
            sceneClass: 'Vector3DScene',
            icon: 'fa-vector-square',
            description: '空间向量可视化与运算展示',
            difficulty: 3,
            intro: {
                subtitle: '向量表示与运算几何意义',
                objectives: [
                    '理解向量在三维坐标中的表示',
                    '掌握向量加法的几何解释',
                    '了解点积与叉积的意义'
                ],
                keyPoints: ['坐标表示', '平行四边形', '点积', '叉积'],
                tips: '点击按钮展示向量加法、叉积和平行四边形'
            }
        },
        {
            id: 'conic',
            title: '圆锥曲线截面',
            keywords: ['圆锥曲线', '椭圆', '抛物线', '双曲线', '圆', '切割'],
            type: 'scene',
            sceneClass: 'ConicScene',
            icon: 'fa-draw-polygon',
            description: '平面截圆锥产生的曲线',
            difficulty: 3,
            intro: {
                subtitle: '切割角度决定曲线形态',
                objectives: [
                    '理解圆锥曲线的几何来源',
                    '区分椭圆、抛物线、双曲线与圆',
                    '掌握离心率与曲线类型的关系'
                ],
                keyPoints: ['切割角度', '离心率', '平面与圆锥交线'],
                tips: '切换不同曲线按钮，观察截面变化'
            }
        },
        {
            id: 'drumflower',
            title: '击鼓传花',
            keywords: ['击鼓传花', '传花', '周期', '余数', '循环', '小学数学', '传递'],
            type: 'scene',
            sceneClass: 'DrumFlowerScene',
            icon: 'fa-drum',
            description: '理解周期性与余数的趣味数学',
            difficulty: 1,
            intro: {
                subtitle: '周期规律与余数应用',
                objectives: [
                    '理解循环与周期的概念',
                    '学会用余数解决"传了N次在谁手里"问题',
                    '掌握周期性问题的通用解法'
                ],
                keyPoints: ['8人围圈', '周期=8', '余数定位置', '循环规律'],
                tips: '点击"题目1"或"题目2"查看完整解题过程！'
            }
        },
        {
            id: 'flagellar',
            title: '细菌鞭毛马达',
            keywords: ['鞭毛', '细菌', '马达', '纳米', '分子机器', '生物马达', 'flagellar', '鞭毛马达'],
            type: 'scene',
            sceneClass: 'FlagellarScene',
            icon: 'fa-bacterium',
            description: '自然界最精密的纳米分子机器',
            difficulty: 3,
            intro: {
                subtitle: '探秘细菌的"发动机"',
                objectives: [
                    '了解鞭毛马达的多层结构组成',
                    '理解质子动力驱动原理',
                    '认识自然界纳米机器的精密设计'
                ],
                keyPoints: ['C环', 'MS环', '定子/转子', 'L环P环', '质子动力'],
                tips: '点击各部件了解详情，观察质子流动如何驱动旋转！'
            }
        },
        {
            id: 'ppt',
            title: '注意力机制课件',
            keywords: ['ppt', '原理', '课件', '幻灯片', '讲解'],
            type: 'ppt',
            sceneClass: null,
            icon: 'fa-chalkboard-teacher',
            description: '从词向量到注意力机制的完整讲解',
            difficulty: 3,
            intro: null // PPT不需要介绍模态框
        }
    ],

    /**
     * 根据用户输入匹配案例
     */
    matchCase(text) {
        const lowerText = text.toLowerCase();
        
        for (const c of this.CASES) {
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
     */
    getSceneClass(caseId) {
        const c = this.CASES.find(item => item.id === caseId);
        if (c && c.sceneClass && window[c.sceneClass]) {
            return window[c.sceneClass];
        }
        return null;
    },

    /**
     * 获取案例介绍信息
     */
    getIntro(caseId) {
        const c = this.CASES.find(item => item.id === caseId);
        if (c && c.intro) {
            return {
                title: c.title,
                icon: c.icon,
                ...c.intro
            };
        }
        return null;
    },

    /**
     * 获取案例列表（用于欢迎消息）
     */
    getWelcomeList() {
        return this.CASES.map((c) => 
            `<span class="inline-block"><i class="fas ${c.icon} mr-1 text-blue-400"></i><b>${c.title.split('(')[0].trim()}</b></span>`
        ).join(' · ');
    }
};
