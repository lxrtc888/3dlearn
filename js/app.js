/**
 * AI协作教学系统 - 主程序
 * ============================================
 * 使用 CasesConfig 进行案例管理
 * 使用 CodeSnippets 获取代码片段
 * 使用 AIService 进行智能对话
 * ============================================
 */

// 全局状态
const state = {
    currentTopic: null,
    activeTab: 'scene',
    pptIndex: 0,
    sceneManager: null,
    isAIChatting: false, // AI正在回复中
    currentSceneConfig: null, // 当前场景配置
};

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    // 初始化场景管理器
    state.sceneManager = new SceneManager('scene-canvas-container');
    state.sceneManager.init();

    // 绑定基础事件
    bindEvents();
    
    // 初始化快捷案例入口
    initQuickCases();

    // 欢迎语
    setTimeout(() => {
        addMessage('ai', '👋 欢迎回到神经元课堂。');
        addMessage('ai', '我是您的 AI 助教。点击右侧案例卡片或输入关键词开始探索！');
    }, 800);
});

/**
 * 初始化快捷案例卡片
 */
function initQuickCases() {
    const container = document.getElementById('quick-cases');
    if (!container || !window.CasesConfig) return;
    
    // 案例类型映射
    const typeMap = {
        'attention': 'ai',
        'engine': 'physics',
        'quantum': 'physics',
        'hydraulic': 'physics',
        'pendulum': 'physics',
        'electromagnetic': 'physics',
        'gravity': 'physics',
        'cell': 'biology',
        'dna': 'biology',
        'flagellar': 'biology',
        'vector3d': 'math',
        'conic': 'math',
        'drumflower': 'math',
        'ppt': 'ai'
    };
    
    // 案例标签映射
    const tagMap = {
        'physics': '物理',
        'biology': '生物',
        'math': '数学',
        'ai': 'AI'
    };
    
    let html = '';
    window.CasesConfig.CASES.forEach(c => {
        const cType = typeMap[c.id] || 'ai';
        const tag = tagMap[cType];
        html += `
            <div class="quick-case-card" data-case-id="${c.id}" data-type="${cType}">
                <div class="quick-case-icon">
                    <i class="fas ${c.icon}"></i>
                </div>
                <div class="quick-case-title">${c.title.split('(')[0].trim()}</div>
                <span class="quick-case-tag">${tag}</span>
            </div>
        `;
    });
    
    container.innerHTML = html;
    
    // 绑定点击事件
    container.querySelectorAll('.quick-case-card').forEach(card => {
        card.addEventListener('click', () => {
            const caseId = card.dataset.caseId;
            const caseConfig = window.CasesConfig.CASES.find(c => c.id === caseId);
            if (caseConfig) {
                // 直接触发场景加载
                startGeneration(caseConfig);
                addMessage('ai', `🚀 正在加载 <b>${caseConfig.title}</b>...`);
            }
        });
    });
}

function bindEvents() {
    // 聊天输入
    const userInput = document.getElementById('user-input');
    const sendBtn = document.getElementById('btn-send');

    userInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleSend();
    });

    sendBtn.addEventListener('click', handleSend);

    // Tab 切换
    document.getElementById('tab-scene').addEventListener('click', () => switchTab('scene'));
    document.getElementById('tab-ppt').addEventListener('click', () => switchTab('ppt'));
    document.getElementById('tab-code').addEventListener('click', () => switchTab('code'));

    // PPT 按钮
    document.getElementById('btn-prev').addEventListener('click', prevSlide);
    document.getElementById('btn-next').addEventListener('click', nextSlide);
    
    // 全屏按钮（移动端）
    const fullscreenBtn = document.getElementById('btn-fullscreen');
    if (fullscreenBtn) {
        fullscreenBtn.addEventListener('click', toggleFullscreen);
    }
}

/**
 * 切换场景全屏模式
 */
function toggleFullscreen() {
    const displaySection = document.getElementById('display-section');
    const fullscreenBtn = document.getElementById('btn-fullscreen');
    const icon = fullscreenBtn?.querySelector('i');
    
    if (!displaySection) return;
    
    const isFullscreen = displaySection.classList.contains('scene-fullscreen');
    
    if (isFullscreen) {
        // 退出全屏
        displaySection.classList.remove('scene-fullscreen');
        if (icon) {
            icon.classList.remove('fa-compress');
            icon.classList.add('fa-expand');
        }
        fullscreenBtn.title = '全屏观看';
        
        // 退出浏览器全屏
        if (document.exitFullscreen) {
            document.exitFullscreen().catch(() => {});
        }
    } else {
        // 进入全屏
        displaySection.classList.add('scene-fullscreen');
        if (icon) {
            icon.classList.remove('fa-expand');
            icon.classList.add('fa-compress');
        }
        fullscreenBtn.title = '退出全屏';
        
        // 尝试浏览器全屏API
        if (displaySection.requestFullscreen) {
            displaySection.requestFullscreen().catch(() => {});
        }
    }
    
    // 通知场景管理器调整大小
    if (state.sceneManager) {
        setTimeout(() => {
            state.sceneManager.handleResize();
        }, 100);
    }
}


// --- 聊天逻辑 ---
function handleSend() {
    const userInput = document.getElementById('user-input');
    const text = userInput.value.trim();
    if (!text) return;
    
    // 防止重复发送
    if (state.isAIChatting) return;
    
    addMessage('user', text);
    userInput.value = '';

    // 先尝试匹配案例关键词
    const matchedCase = window.CasesConfig ? window.CasesConfig.matchCase(text) : null;
    
    if (matchedCase) {
        // 如果匹配到案例，显示确认卡片
        setTimeout(() => showConfirmCard(matchedCase), 600);
    } else if (state.currentSceneConfig && window.AIService) {
        // 如果当前有场景加载，使用AI辅导对话
        handleAIChat(text);
    } else if (window.AIService) {
        // 没有场景时也可以通用对话
        handleAIChat(text);
    } else {
        // 降级处理
        setTimeout(() => addMessage('ai', '🤔 请尝试输入关键词，例如"大模型3D"、"双缝干涉"或"原理课件"。'), 600);
    }
}

/**
 * AI智能对话
 */
async function handleAIChat(text) {
    state.isAIChatting = true;
    
    // 显示"正在思考"提示
    const thinkingId = 'ai-thinking-' + Date.now();
    addThinkingMessage(thinkingId);
    
    try {
        const result = await window.AIService.chat(text);
        
        // 移除"正在思考"提示
        removeThinkingMessage(thinkingId);
        
        if (result.success) {
            addMessage('ai', result.message);
        } else {
            addMessage('ai', '😅 ' + result.message);
        }
    } catch (error) {
        removeThinkingMessage(thinkingId);
        addMessage('ai', '😅 抱歉，网络似乎有点问题，请稍后再试。');
        console.error('AI Chat Error:', error);
    }
    
    state.isAIChatting = false;
}

/**
 * 添加"正在思考"消息
 */
function addThinkingMessage(id) {
    const chatHistory = document.getElementById('chat-history');
    const div = document.createElement('div');
    div.id = id;
    div.className = 'chat-bubble bubble-ai thinking-bubble flex items-center';
    div.innerHTML = `
        <div class="thinking-dots">
            <span></span><span></span><span></span>
        </div>
        <span class="ml-2 text-gray-400">老师正在思考...</span>
    `;
    chatHistory.appendChild(div);
    chatHistory.scrollTop = chatHistory.scrollHeight;
}

/**
 * 移除"正在思考"消息
 */
function removeThinkingMessage(id) {
    const el = document.getElementById(id);
    if (el) el.remove();
}

function addMessage(role, text) {
    const chatHistory = document.getElementById('chat-history');
    const div = document.createElement('div');
    div.className = `chat-bubble bubble-${role} flex flex-col`;
    div.innerHTML = text;
    chatHistory.appendChild(div);
    chatHistory.scrollTop = chatHistory.scrollHeight;
}


/**
 * 显示确认卡片
 */
function showConfirmCard(caseConfig) {
    const chatHistory = document.getElementById('chat-history');
    const confirmHtml = `
        <div class="font-bold mb-2 text-blue-300 flex items-center">
            <i class="fas fa-check-circle mr-2"></i> 资源就绪
        </div>
        <div class="text-sm text-gray-300 mb-4 bg-black/20 p-3 rounded-lg border border-white/10">
            <div class="mb-1">
                <span class="text-gray-500">Subject:</span> 
                <span class="font-medium text-white">
                    <i class="fas ${caseConfig.icon} mr-1"></i>${caseConfig.title}
                </span>
            </div>
            <div>
                <span class="text-gray-500">Mode:</span> 
                <span class="font-medium text-white">
                    ${caseConfig.type === 'ppt' ? 'Interactive Slide' : 'WebGL Simulation'}
                </span>
            </div>
            <div class="mt-2 text-gray-400 text-xs">
                ${caseConfig.description}
            </div>
        </div>
        <button id="btn-load-${caseConfig.id}" class="w-full bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-xl transition shadow-lg flex items-center justify-center font-bold tracking-wide group text-base">
            <i class="fas fa-play mr-2 group-hover:scale-110 transition-transform"></i> 立即加载
        </button>
    `;
    const div = document.createElement('div');
    div.className = 'confirm-card chat-bubble bubble-ai';
    div.innerHTML = confirmHtml;
    chatHistory.appendChild(div);
    chatHistory.scrollTop = chatHistory.scrollHeight;

    // 绑定动态生成的按钮事件
    const btn = div.querySelector('button');
    btn.onclick = () => startGeneration(caseConfig);
}

/**
 * 开始生成 - 代码打字效果
 */
function startGeneration(caseConfig) {
    state.currentTopic = caseConfig.id;
    switchTab('code');

    const codeView = document.getElementById('code-content');
    codeView.innerHTML = '';
    codeView.className = 'cursor';

    // 从代码片段数据获取
    const snippets = window.CodeSnippets || {};
    const snippet = snippets[caseConfig.id] || '// Loading advanced modules...';
    
    let i = 0;
    const typingSpeed = 2;

    function typeWriter() {
        if (i < snippet.length) {
            codeView.innerHTML += snippet.charAt(i);
            i++;
            document.getElementById('view-code').scrollTop = document.getElementById('view-code').scrollHeight;
            setTimeout(typeWriter, typingSpeed);
        } else {
            codeView.classList.remove('cursor');
            finishGeneration(caseConfig);
        }
    }
    typeWriter();
}

/**
 * 完成生成 - 加载场景或PPT
 */
async function finishGeneration(caseConfig) {
    // 模拟等待感
    await new Promise(r => setTimeout(r, 600));

    if (caseConfig.type === 'ppt') {
        addMessage('ai', '✅ <b>课件已投屏。</b><br>请使用右下角按钮翻页。');
        switchTab('ppt');
        renderSlide(0);
        
        // 设置AI上下文（PPT模式）
        state.currentSceneConfig = caseConfig;
        if (window.AIService) {
            window.AIService.setSceneContext(caseConfig);
        }
    } else {
        addMessage('ai', `✅ <b>场景准备就绪。</b>`);
        switchTab('scene');

        // 使用配置中心获取场景类
        try {
            const SceneClass = window.CasesConfig ? window.CasesConfig.getSceneClass(caseConfig.id) : null;

            if (SceneClass) {
                // 隐藏占位符
                document.getElementById('placeholder-text').style.display = 'none';
                
                // 加载场景
                state.sceneManager.loadScene(SceneClass);

                // 创建标签
                if (state.sceneManager.currentSceneInstance && state.sceneManager.currentSceneInstance.createLabels) {
                    state.sceneManager.currentSceneInstance.createLabels(state.sceneManager);
                }
                
                // 设置AI辅导上下文
                state.currentSceneConfig = caseConfig;
                if (window.AIService) {
                    window.AIService.setSceneContext(caseConfig);
                }
                
                // 显示场景介绍模态框
                const intro = window.CasesConfig.getIntro(caseConfig.id);
                if (intro) {
                    showIntroModal(intro);
                }

            } else {
                console.error("Scene Class not found for:", caseConfig.id);
                addMessage('ai', '❌ 未找到对应的场景模块，请检查配置。');
            }
        } catch (e) {
            console.error("Failed to load scene module:", e);
            addMessage('ai', '❌ 场景加载失败，请检查控制台。');
        }
    }
}

/**
 * 显示场景介绍模态框
 */
function showIntroModal(intro) {
    // 移除旧模态框
    const oldModal = document.getElementById('scene-intro-modal');
    if (oldModal) oldModal.remove();
    
    // 创建模态框
    const modal = document.createElement('div');
    modal.id = 'scene-intro-modal';
    modal.className = 'scene-intro-modal';
    
    const objectivesHtml = intro.objectives.map(obj => `<li>${obj}</li>`).join('');
    const keyPointsHtml = intro.keyPoints.map(kp => `<span class="key-point">${kp}</span>`).join('');
    
    modal.innerHTML = `
        <div class="intro-content">
            <div class="intro-header">
                <i class="fas ${intro.icon} intro-icon"></i>
                <div>
                    <h2 class="intro-title">${intro.title}</h2>
                    <p class="intro-subtitle">${intro.subtitle}</p>
                </div>
            </div>
            
            <div class="intro-section">
                <h3><i class="fas fa-bullseye"></i> 学习目标</h3>
                <ul class="objectives-list">
                    ${objectivesHtml}
                </ul>
            </div>
            
            <div class="intro-section">
                <h3><i class="fas fa-lightbulb"></i> 知识要点</h3>
                <div class="key-points">
                    ${keyPointsHtml}
                </div>
            </div>
            
            <div class="intro-tips">
                <i class="fas fa-info-circle"></i>
                ${intro.tips}
            </div>
            
            <button class="intro-start-btn" id="btn-start-scene">
                <i class="fas fa-play"></i> 开始学习
            </button>
        </div>
    `;
    
    // 添加到场景容器
    const sceneContainer = document.getElementById('view-scene');
    sceneContainer.appendChild(modal);
    
    // 显示动画
    requestAnimationFrame(() => {
        modal.classList.add('visible');
    });
    
    // 绑定关闭事件
    document.getElementById('btn-start-scene').onclick = async () => {
        closeIntroModal();
        // 开始自动播放
        if (state.sceneManager.currentSceneInstance && state.sceneManager.currentSceneInstance.startAutoPlay) {
            state.sceneManager.currentSceneInstance.startAutoPlay();
        }
        
        // AI老师发送场景引导消息
        if (window.AIService && state.currentSceneConfig) {
            setTimeout(async () => {
                const result = await window.AIService.getSceneIntroduction();
                if (result.success) {
                    addMessage('ai', '🎓 ' + result.message);
                }
            }, 1000);
        }
    };
}

/**
 * 关闭介绍模态框
 */
function closeIntroModal() {
    const modal = document.getElementById('scene-intro-modal');
    if (modal) {
        modal.classList.remove('visible');
        setTimeout(() => modal.remove(), 400);
    }
}

// 暴露给全局
window.closeIntroModal = closeIntroModal;

// --- Tab 切换 ---
function switchTab(tabName) {
    state.activeTab = tabName;
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById(`tab-${tabName}`).classList.add('active');
    document.querySelectorAll('.content-view').forEach(view => view.classList.remove('active'));
    document.getElementById(`view-${tabName}`).classList.add('active');
}

// --- PPT 逻辑 ---
function renderSlide(index) {
    state.pptIndex = index;
    const container = document.getElementById('slide-container');
    const slides = window.pptSlides; // 获取全局 slide 数据

    if (!slides) {
        container.innerHTML = '<div>PPT 数据加载失败</div>';
        return;
    }

    const slide = slides[index];

    container.innerHTML = `
        <div class="slide-content h-full">
            <div class="slide-header">
                <div class="slide-title">${slide.title}</div>
                <div class="slide-subtitle">${slide.subtitle}</div>
            </div>
            <div class="slide-body">${slide.content}</div>
        </div>
    `;

    document.getElementById('slide-num').innerText = `${index + 1} / ${slides.length}`;
    document.getElementById('btn-prev').disabled = index === 0;
    document.getElementById('btn-next').disabled = index === slides.length - 1;
}

function nextSlide() {
    const slides = window.pptSlides;
    if (slides && state.pptIndex < slides.length - 1) renderSlide(state.pptIndex + 1);
}
function prevSlide() {
    if (state.pptIndex > 0) renderSlide(state.pptIndex - 1);
}

window.nextSlide = nextSlide;
window.prevSlide = prevSlide;
