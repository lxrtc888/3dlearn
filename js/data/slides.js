/**
 * PPT幻灯片数据
 * LLM原理课件 - 8页
 */
export const slides = [
    {
        title: "大语言模型 (LLM) 原理",
        subtitle: "从 Transformer 到智能涌现的奇幻之旅",
        content: `
            <div class="flex flex-col h-full justify-center items-center text-center">
                <div class="mb-10 relative">
                    <div class="w-40 h-40 bg-blue-100 rounded-full flex items-center justify-center relative z-10">
                        <i class="fas fa-brain text-7xl text-blue-600"></i>
                    </div>
                    <div class="absolute inset-0 bg-blue-200 blur-3xl opacity-40 z-0"></div>
                </div>
                <h2 class="text-5xl font-extrabold mb-6 text-gray-900">解构 AI 的"大脑"</h2>
                <p class="text-2xl text-gray-600 max-w-3xl leading-relaxed">
                    探索 GPT、Claude 等顶尖模型背后的核心技术。了解它们如何理解语言、生成内容，以及展现出惊人的推理能力。
                </p>
            </div>
        `
    },
    {
        title: "第一步：数字化 (Tokenization)",
        subtitle: "机器如何"阅读"人类语言",
        content: `
            <div class="flex flex-col h-full justify-center">
                <p class="mb-10 text-2xl text-gray-700">计算机无法直接理解文本，它只能处理数字。**Tokenization** 是将文本切分为计算机可识别的最小单位（Token）的过程。</p>
                <div class="bg-white p-10 rounded-2xl shadow-xl border border-gray-100 flex flex-col items-center gap-8">
                    <div class="text-4xl font-serif text-gray-900 bg-gray-50 px-6 py-3 rounded-lg">"我喜欢人工智能"</div>
                    <i class="fas fa-arrow-down text-4xl text-blue-500 animate-bounce"></i>
                    <div class="flex gap-6">
                        <div class="flex flex-col items-center gap-3">
                            <div class="w-20 h-20 bg-blue-100 border-2 border-blue-300 rounded-xl flex items-center justify-center text-blue-700 font-mono text-2xl font-bold shadow-sm">15</div>
                            <span class="text-lg text-gray-600 font-medium">我</span>
                        </div>
                        <div class="flex flex-col items-center gap-3">
                            <div class="w-20 h-20 bg-green-100 border-2 border-green-300 rounded-xl flex items-center justify-center text-green-700 font-mono text-2xl font-bold shadow-sm">209</div>
                            <span class="text-lg text-gray-600 font-medium">喜欢</span>
                        </div>
                        <div class="flex flex-col items-center gap-3">
                            <div class="w-20 h-20 bg-purple-100 border-2 border-purple-300 rounded-xl flex items-center justify-center text-purple-700 font-mono text-2xl font-bold shadow-sm">884</div>
                            <span class="text-lg text-gray-600 font-medium">人工智能</span>
                        </div>
                    </div>
                </div>
            </div>
        `
    },
    {
        title: "核心引擎：Transformer",
        subtitle: "现代 AI 的基石架构 (2017)",
        content: `
            <div class="flex items-center gap-12 h-full">
                <div class="flex-1">
                    <p class="text-2xl text-gray-700 mb-8 leading-relaxed">Google 提出的 Transformer 架构彻底改变了自然语言处理。它抛弃了传统的循环结构，实现了高效的并行计算。</p>
                    <div class="highlight-box bg-blue-50 border-blue-500">
                        <h4 class="text-2xl font-bold text-blue-800 mb-4 flex items-center"><i class="fas fa-star mr-3"></i>关键突破：并行化</h4>
                        <p class="text-xl text-blue-900">传统的 RNN/LSTM 需要按顺序一个词一个词地处理。Transformer 可以同时处理整个句子中的所有词，极大地提高了训练速度，使得训练超大规模模型成为可能。</p>
                    </div>
                </div>
                <div class="flex-1 flex justify-center relative">
                    <div class="w-80 h-80 bg-white rounded-3xl shadow-2xl border border-gray-100 flex flex-col items-center justify-center p-6 relative z-10">
                        <div class="flex-1 w-full bg-gray-100 rounded-xl mb-2 flex items-center justify-center text-lg font-bold text-gray-500">Output Probabilities</div>
                        <div class="flex-1 w-full bg-purple-100 rounded-xl mb-2 flex items-center justify-center text-xl font-bold text-purple-700 border border-purple-300">Decoder Block x N</div>
                        <div class="flex-1 w-full bg-blue-100 rounded-xl mb-2 flex items-center justify-center text-xl font-bold text-blue-700 border border-blue-300">Encoder Block x N</div>
                        <div class="flex-1 w-full bg-gray-100 rounded-xl flex items-center justify-center text-lg font-bold text-gray-500">Input Embeddings</div>
                    </div>
                    <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-tr from-blue-200 to-purple-200 rounded-full blur-3xl opacity-30 z-0"></div>
                </div>
            </div>
        `
    },
    {
        title: "灵魂所在：注意力机制 (Attention)",
        subtitle: "让模型学会"划重点"",
        content: `
            <div class="h-full flex flex-col justify-center">
                <p class="text-2xl text-gray-700 mb-10 text-center max-w-4xl mx-auto">
                    **自注意力 (Self-Attention)** 是 Transformer 的核心。它允许模型在处理每个词时，计算它与句子中其他所有词的相关性，从而捕捉长距离依赖和上下文信息。
                </p>
                <div class="bg-white p-10 rounded-2xl shadow-xl border border-gray-100">
                    <div class="text-3xl font-serif text-center mb-8 text-gray-900">"The <span class="text-blue-600 font-bold border-b-4 border-blue-400">animal</span> didn't cross the street because <span class="text-blue-600 font-bold border-b-4 border-blue-400">it</span> was too tired."</div>
                    <div class="flex justify-center items-center gap-16">
                        <div class="text-center">
                            <div class="text-xl font-bold text-gray-500 mb-2">查询 (Query)</div>
                            <div class="px-6 py-3 bg-blue-100 text-blue-800 rounded-lg font-bold text-2xl shadow-sm">it</div>
                        </div>
                        <i class="fas fa-arrows-alt-h text-4xl text-gray-300"></i>
                         <div class="text-center relative">
                            <div class="text-xl font-bold text-gray-500 mb-2">键 (Key) & 值 (Value)</div>
                            <div class="flex gap-2">
                                <div class="px-4 py-3 bg-gray-100 text-gray-400 rounded-lg text-xl">The</div>
                                <div class="px-4 py-3 bg-blue-600 text-white rounded-lg font-bold text-xl shadow-md transform scale-110 z-10">animal</div>
                                <div class="px-4 py-3 bg-gray-100 text-gray-400 rounded-lg text-xl">...</div>
                                <div class="px-4 py-3 bg-blue-200 text-blue-800 rounded-lg font-bold text-xl">street</div>
                            </div>
                            <div class="absolute -top-6 left-1/2 -translate-x-1/2 text-blue-600 font-bold">高相关性!</div>
                        </div>
                    </div>
                    <p class="text-center text-lg text-gray-500 mt-8">模型计算出 "it" 与 "animal" 的相关性最高，从而理解了代词的指代。</p>
                </div>
            </div>
        `
    },
    {
        title: "预训练 (Pre-training)",
        subtitle: "海量阅读，构建世界知识",
        content: `
             <div class="flex items-center gap-12 h-full">
                <div class="flex-1 flex justify-center">
                    <i class="fas fa-book-reader text-[12rem] text-blue-200"></i>
                </div>
                <div class="flex-1">
                    <p class="text-2xl text-gray-700 mb-8 leading-relaxed">在这一阶段，模型阅读了互联网上数以万亿计的文本数据（书籍、网页、代码）。</p>
                    <div class="highlight-box bg-green-50 border-green-500">
                        <h4 class="text-2xl font-bold text-green-800 mb-4"><i class="fas fa-tasks mr-3"></i>自监督学习任务：预测下一个词</h4>
                        <p class="text-xl text-green-900">模型不断尝试根据前面的文本预测下一个 Token。通过无数次的试错和修正，它学会了语法、事实知识、逻辑推理甚至一定的常识。</p>
                        <div class="mt-6 bg-white p-4 rounded-lg font-mono text-lg text-center shadow-sm">
                            今天天气真 <span class="text-green-600 font-bold">[?]</span> -> 预测为：<span class="text-green-600 font-bold">好</span> (概率 85%)
                        </div>
                    </div>
                     <p class="text-xl text-gray-600">预训练后的模型是一个"博学者"，但它还不知道如何恰当地与人对话。</p>
                </div>
            </div>
        `
    },
    {
        title: "微调 (Fine-tuning) & 指令跟随",
        subtitle: "从"续写机器"到"得力助手"",
        content: `
            <div class="h-full flex flex-col justify-center">
                <p class="text-2xl text-gray-700 mb-10 text-center max-w-4xl mx-auto">
                    为了让模型能够理解和执行人类的指令（如"翻译这段话"、"写一个摘要"），我们需要对其进行微调。
                </p>
                <div class="flex justify-center gap-16">
                    <div class="w-1/3 bg-white p-8 rounded-2xl shadow-xl border border-gray-100 opacity-60">
                        <h4 class="text-2xl font-bold text-gray-500 mb-4 text-center">预训练模型 (Base Model)</h4>
                        <div class="bg-gray-50 p-4 rounded-lg text-gray-600 mb-4">
                            <span class="font-bold">输入：</span>把这句话翻译成英文：你好。<br>
                            <span class="font-bold">输出：</span>今天天气不错。你吃饭了吗？... (续写模式)
                        </div>
                        <div class="text-center text-red-500 font-bold"><i class="fas fa-times-circle mr-2"></i>不听指令</div>
                    </div>
                    <div class="flex items-center text-blue-500 text-4xl"><i class="fas fa-arrow-right"></i></div>
                     <div class="w-1/3 bg-white p-8 rounded-2xl shadow-xl border border-blue-200 transform scale-105 z-10">
                        <h4 class="text-2xl font-bold text-blue-800 mb-4 text-center">指令微调模型 (Instruct Model)</h4>
                         <div class="bg-blue-50 p-4 rounded-lg text-blue-900 mb-4">
                            <span class="font-bold">输入：</span>把这句话翻译成英文：你好。<br>
                            <span class="font-bold">输出：</span>Hello. (对话模式)
                        </div>
                        <div class="text-center text-green-600 font-bold"><i class="fas fa-check-circle mr-2"></i>完美执行</div>
                    </div>
                </div>
                <p class="text-center text-xl text-gray-500 mt-10">使用高质量的"指令-回答"数据对进行有监督学习。</p>
            </div>
        `
    },
    {
        title: "人类反馈强化学习 (RLHF)",
        subtitle: "对齐人类价值观：更有用、更安全",
        content: `
            <div class="h-full flex flex-col justify-center">
                <p class="text-2xl text-gray-700 mb-10 text-center max-w-4xl mx-auto">
                    这是 ChatGPT 成功的关键一步。通过引入人类的反馈，让模型的回答不仅正确，而且符合人类的偏好和伦理准则。
                </p>
                <div class="grid grid-cols-3 gap-8 text-center">
                     <div class="bg-white p-8 rounded-2xl shadow-lg border border-gray-100">
                        <div class="text-4xl text-blue-500 mb-4"><i class="fas fa-comments"></i></div>
                        <h4 class="text-xl font-bold mb-2">1. 收集人类偏好数据</h4>
                        <p class="text-gray-600">让人类对模型的多个回答进行排名，告诉模型哪个更好。</p>
                    </div>
                    <div class="bg-white p-8 rounded-2xl shadow-lg border border-gray-100">
                        <div class="text-4xl text-purple-500 mb-4"><i class="fas fa-trophy"></i></div>
                        <h4 class="text-xl font-bold mb-2">2. 训练奖励模型 (RM)</h4>
                        <p class="text-gray-600">训练一个小的 AI 模型来模拟人类的评分标准。</p>
                    </div>
                    <div class="bg-white p-8 rounded-2xl shadow-lg border border-gray-100">
                        <div class="text-4xl text-green-500 mb-4"><i class="fas fa-robot"></i></div>
                        <h4 class="text-xl font-bold mb-2">3. 强化学习优化 (PPO)</h4>
                        <p class="text-gray-600">利用奖励模型的反馈，通过强化学习算法不断调整 LLM 的参数。</p>
                    </div>
                </div>
            </div>
        `
    },
    {
        title: "总结与展望：通往 AGI 之路",
        subtitle: "大模型作为未来的基础设施",
        content: `
             <div class="flex items-center gap-12 h-full">
                <div class="flex-1">
                    <h3 class="text-3xl font-bold text-gray-800 mb-6">核心要素回顾</h3>
                    <ul class="space-y-4 text-2xl text-gray-700">
                        <li class="flex items-center"><i class="fas fa-database text-blue-500 w-10"></i> <span>**海量数据**：知识的来源</span></li>
                        <li class="flex items-center"><i class="fas fa-microchip text-purple-500 w-10"></i> <span>**强大算力**：训练的基础</span></li>
                        <li class="flex items-center"><i class="fas fa-code-branch text-green-500 w-10"></i> <span>**Transformer**：高效的架构</span></li>
                        <li class="flex items-center"><i class="fas fa-hand-holding-heart text-red-500 w-10"></i> <span>**RLHF**：人类的对齐</span></li>
                    </ul>
                    <h3 class="text-3xl font-bold text-gray-800 mt-10 mb-6">未来趋势：AI Agent</h3>
                    <p class="text-xl text-gray-600 leading-relaxed">
                        未来的 LLM 将不仅仅是聊天机器人，它们将进化为能够使用工具、自主规划、解决复杂任务的**智能体 (Agents)**，成为我们生活和工作中的得力助手。
                    </p>
                </div>
                <div class="flex-1 flex justify-center relative">
                     <div class="relative z-10 animate-float">
                        <i class="fas fa-rocket text-[10rem] text-transparent bg-clip-text bg-gradient-to-tr from-blue-600 to-purple-600"></i>
                    </div>
                    <div class="absolute inset-0 bg-gradient-to-tr from-blue-100 to-purple-100 rounded-full blur-3xl opacity-50 z-0"></div>
                </div>
            </div>
        `
    }
];

