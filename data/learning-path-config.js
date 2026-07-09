/**
 * 学习路径配置
 * 每个场景定义步骤、探索动作与完成规则
 */
window.LearningPathConfig = {
    'quadratic-function': {
        sceneType: 'problem',
        guideMode: 'mixed', // 沉浸场景 + 局部黑板讲解
        uiSafety: {
            requireCloseButton: true,
            mobileCloseTouchTarget: 44
        },
        steps: [
            { id: 'read', title: '📖 读题', objective: '理解参数与图像关系' },
            { id: 'observe-a', title: '🔍 探索a', objective: '观察开口方向和宽窄变化' },
            { id: 'observe-b', title: '🔍 探索b', objective: '观察对称轴左右偏移' },
            { id: 'observe-c', title: '🔍 探索c', objective: '观察上下平移和截距变化' },
            { id: 'practice', title: '🧠 练习', objective: '完成基础/应用/迁移题' },
            { id: 'summary', title: '✅ 总结', objective: '得到掌握度和改进建议' }
        ],
        exploreActions: ['adjust-a', 'adjust-b', 'adjust-c'],
        completionRules: {
            minCompletedSteps: 5,
            minExplores: 3,
            minQuizAnswered: 3,
            requiredStepIds: ['observe-a', 'observe-b', 'observe-c']
        }
    },
    'circuit-ohm': {
        sceneType: 'problem',
        guideMode: 'mixed',
        uiSafety: {
            requireCloseButton: true,
            mobileCloseTouchTarget: 44
        },
        steps: [
            { id: 'read', title: '📖 读题', objective: '理解已知电压与电阻条件' },
            { id: 'observe-series', title: '🔍 串联实验', objective: '观察总电阻增大、电流减小' },
            { id: 'observe-parallel', title: '🔍 并联实验', objective: '观察等效电阻减小、电流增大' },
            { id: 'ohm-verify', title: '🔍 欧姆验证', objective: '调电阻验证 U=IR' },
            { id: 'practice', title: '🧠 练习', objective: '完成连接判断与计算题' },
            { id: 'summary', title: '✅ 总结', objective: '查看掌握度并回练薄弱点' }
        ],
        exploreActions: ['mode-series', 'mode-parallel', 'resistance1', 'resistance2'],
        completionRules: {
            minCompletedSteps: 5,
            minExplores: 3,
            minQuizAnswered: 3,
            requiredStepIds: ['observe-series', 'observe-parallel', 'ohm-verify']
        }
    }
};
