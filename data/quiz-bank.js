/**
 * 练习题库配置
 * - 每个场景至少 3 题（基础/应用/迁移）
 * - 支持单选题（single）
 */
window.QuizBank = {
    'quadratic-function': [
        {
            id: 'qf-q1',
            level: 'basic',
            type: 'single',
            question: '当二次函数 y = ax² + bx + c 中 a < 0 时，抛物线的开口方向是？',
            options: [
                { value: 'up', label: '向上开口' },
                { value: 'down', label: '向下开口' },
                { value: 'left', label: '向左开口' },
                { value: 'right', label: '向右开口' }
            ],
            correctAnswer: 'down',
            errorTags: {
                up: 'a-sign',
                left: 'parabola-axis',
                right: 'parabola-axis'
            },
            feedbackTemplate: '回到第2步，固定 b,c 后只调 a，观察开口方向。'
        },
        {
            id: 'qf-q2',
            level: 'application',
            type: 'single',
            question: '若函数图像的对称轴在 y 轴右侧（x > 0），以下对 b 的判断更合理的是？',
            options: [
                { value: 'b-positive', label: 'b > 0' },
                { value: 'b-negative', label: 'b < 0' },
                { value: 'b-zero', label: 'b = 0' },
                { value: 'cannot-decide', label: '无法判断' }
            ],
            correctAnswer: 'b-negative',
            errorTags: {
                'b-positive': 'axis-misunderstanding',
                'b-zero': 'axis-misunderstanding',
                'cannot-decide': 'formula-connection'
            },
            feedbackTemplate: '利用对称轴公式 x = -b/(2a) 联合 a 的符号再判断 b。'
        },
        {
            id: 'qf-q3',
            level: 'transfer',
            type: 'single',
            question: '想让图像整体上移 3 个单位，最直接应如何调整参数？',
            options: [
                { value: 'a-plus-3', label: 'a 增加 3' },
                { value: 'b-plus-3', label: 'b 增加 3' },
                { value: 'c-plus-3', label: 'c 增加 3' },
                { value: 'a-minus-3', label: 'a 减少 3' }
            ],
            correctAnswer: 'c-plus-3',
            errorTags: {
                'a-plus-3': 'param-role',
                'b-plus-3': 'param-role',
                'a-minus-3': 'param-role'
            },
            feedbackTemplate: '第4步重点：c 决定整体上下平移与 y 轴截距。'
        }
    ],
    'circuit-ohm': [
        {
            id: 'co-q1',
            level: 'basic',
            type: 'single',
            question: '相同电阻 R1、R2 与同一电源连接时，哪种连接方式总电阻更大？',
            options: [
                { value: 'series', label: '串联' },
                { value: 'parallel', label: '并联' },
                { value: 'same', label: '一样大' },
                { value: 'unknown', label: '无法判断' }
            ],
            correctAnswer: 'series',
            errorTags: {
                parallel: 'series-parallel',
                same: 'equivalent-r',
                unknown: 'series-parallel'
            },
            feedbackTemplate: '回到步骤2和3切换串/并联，对比 Req 与电流变化。'
        },
        {
            id: 'co-q2',
            level: 'application',
            type: 'single',
            question: '电压 12V、总电阻 6Ω 时，电路电流 I 为多少？',
            options: [
                { value: '1a', label: '1 A' },
                { value: '2a', label: '2 A' },
                { value: '3a', label: '3 A' },
                { value: '0.5a', label: '0.5 A' }
            ],
            correctAnswer: '2a',
            errorTags: {
                '1a': 'ohm-calc',
                '3a': 'ohm-calc',
                '0.5a': 'ohm-calc'
            },
            feedbackTemplate: '使用 I = U/R，先代入 U=12 再除以 R=6。'
        },
        {
            id: 'co-q3',
            level: 'transfer',
            type: 'single',
            question: '如果想让总电流变大，下面哪种操作更有效？',
            options: [
                { value: 'increase-r', label: '增大电阻' },
                { value: 'parallel-mode', label: '改为并联并减小等效电阻' },
                { value: 'turn-off', label: '断开其中一路' },
                { value: 'decrease-u', label: '降低电压' }
            ],
            correctAnswer: 'parallel-mode',
            errorTags: {
                'increase-r': 'equivalent-r',
                'turn-off': 'series-parallel',
                'decrease-u': 'ohm-calc'
            },
            feedbackTemplate: '电流与总电阻成反比，降低 Req 才能增大 I。'
        }
    ]
};
