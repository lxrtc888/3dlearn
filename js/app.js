/**
 * AI协作教学系统 - 主程序
 * ============================================
 * 使用 CasesConfig 进行案例管理
 * 使用 CodeSnippets 获取代码片段
 * ============================================
 */

// 全局状态
const state = {
    currentTopic: null,
    activeTab: 'scene',
    pptIndex: 0,
    sceneManager: null,
};

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    // 初始化场景管理器
    state.sceneManager = new SceneManager('scene-canvas-container');
    state.sceneManager.init();

    // 绑定基础事件
    bindEvents();

    // 欢迎语
    setTimeout(() => {
        addMessage('ai', '👋 欢迎回到神经元课堂。');
        // 使用配置中心生成案例列表
        const caseList = window.CasesConfig ? window.CasesConfig.getWelcomeList() : '案例加载中...';
        addMessage('ai', '我是您的 AI 助教。今天准备了一些非常酷的演示：<br>' + caseList);
    }, 800);
});

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
}


// --- 聊天逻辑 ---
function handleSend() {
    const userInput = document.getElementById('user-input');
    const text = userInput.value.trim();
    if (!text) return;
    addMessage('user', text);
    userInput.value = '';

    analyzeIntent(text);
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
 * 分析用户意图 - 使用配置中心匹配案例
 */
function analyzeIntent(text) {
    // 使用配置中心匹配
    const matchedCase = window.CasesConfig ? window.CasesConfig.matchCase(text) : null;

    if (!matchedCase) {
        setTimeout(() => addMessage('ai', '🤔 请尝试输入关键词，例如"大模型3D"、"双缝干涉"或"原理课件"。'), 600);
        return;
    }

    // 生成确认卡片
    setTimeout(() => showConfirmCard(matchedCase), 600);
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
    } else {
        addMessage('ai', `✅ <b>全息场景构建完成。</b><br>您可以拖动旋转视角。<br>部分场景支持点击交互。`);
        switchTab('scene');

        // 使用配置中心获取场景类
        try {
            const SceneClass = window.CasesConfig ? window.CasesConfig.getSceneClass(caseConfig.id) : null;

            if (SceneClass) {
                // 隐藏占位符
                document.getElementById('placeholder-text').style.display = 'none';
                // 加载场景
                state.sceneManager.loadScene(SceneClass);

                // 给新加载的场景注入 SceneManager 的能力 (用于创建 labels)
                if (state.sceneManager.currentSceneInstance && state.sceneManager.currentSceneInstance.createLabels) {
                    state.sceneManager.currentSceneInstance.createLabels(state.sceneManager);
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
