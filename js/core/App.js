/**
 * 主应用程序
 * 协调聊天、场景管理和PPT展示
 */
import { SceneManager } from './SceneManager.js';
import { PPTManager } from './PPTManager.js';
import { codeSnippets } from '../data/codeSnippets.js';

export class App {
    constructor() {
        this.sceneManager = null;
        this.pptManager = null;
        
        this.currentTopic = null;
        this.activeTab = 'scene';
        
        // DOM元素
        this.chatHistory = null;
        this.userInput = null;
        this.sceneContainer = null;
        this.pptContainer = null;
        this.codeContent = null;
        this.sceneControls = null;
    }
    
    /**
     * 初始化应用
     */
    async init() {
        // 获取DOM元素
        this.chatHistory = document.getElementById('chat-history');
        this.userInput = document.getElementById('user-input');
        this.sceneContainer = document.getElementById('scene-canvas-container');
        this.pptContainer = document.getElementById('slide-container');
        this.codeContent = document.getElementById('code-content');
        this.sceneControls = document.getElementById('scene-controls');
        
        // 初始化场景管理器
        this.sceneManager = new SceneManager(this.sceneContainer);
        
        // 初始化PPT管理器
        this.pptManager = new PPTManager(this.pptContainer);
        this.pptManager.init();
        
        // 绑定事件
        this.bindEvents();
        
        // 显示欢迎消息
        this.showWelcomeMessages();
        
        // 将addMessage函数暴露给全局（用于场景提示等）
        window.addMessage = (role, text) => this.addMessage(role, text);
    }
    
    /**
     * 绑定事件
     */
    bindEvents() {
        // 输入框回车发送
        this.userInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.handleSend();
        });
        
        // Tab切换
        const tabButtons = document.querySelectorAll('.tab-btn');
        tabButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tabName = btn.id.replace('tab-', '');
                this.switchTab(tabName);
            });
        });
    }
    
    /**
     * 显示欢迎消息
     */
    showWelcomeMessages() {
        setTimeout(() => {
            this.addMessage('ai', '👋 欢迎回到神经元课堂。');
            this.addMessage('ai', '我是您的 AI 助教。今天准备了一些非常酷的演示：<br>1. <b>[大模型原理]</b> - 交互式 3D 网络 (New!)<br>2. <b>[V6发动机]</b> - 赛博机械美学<br>3. <b>[双缝干涉]</b> - 量子力学"观察者效应"<br>4. <b>[液压系统]</b> - 流体力学<br>5. <b>[原理课件]</b> - 8页详解 PPT');
        }, 800);
    }
    
    /**
     * 处理用户发送消息
     */
    handleSend() {
        const text = this.userInput.value.trim();
        if (!text) return;
        
        this.addMessage('user', text);
        this.userInput.value = '';
        this.analyzeIntent(text);
    }
    
    /**
     * 添加聊天消息
     */
    addMessage(role, text) {
        const div = document.createElement('div');
        div.className = `chat-bubble bubble-${role} flex flex-col`;
        div.innerHTML = text;
        this.chatHistory.appendChild(div);
        this.chatHistory.scrollTop = this.chatHistory.scrollHeight;
    }
    
    /**
     * 分析用户意图
     */
    analyzeIntent(text) {
        let topic = null;
        let type = 'scene';
        let title = '';
        
        if (text.includes('发动机') || text.includes('引擎')) { 
            topic = 'engine'; 
            title = 'V6 赛博引擎'; 
        }
        else if (text.includes('双缝') || text.includes('干涉') || text.includes('量子')) { 
            topic = 'quantum'; 
            title = '双缝干涉 (观察者效应)'; 
        }
        else if (text.includes('液压') || text.includes('水压')) { 
            topic = 'hydraulic'; 
            title = '液压传动系统'; 
        }
        else if (text.includes('大模型') && (text.includes('交互') || text.includes('3D'))) { 
            topic = 'llm'; 
            title = 'LLM 注意力网络 (3D交互)'; 
        }
        else if (text.includes('大模型') || text.includes('PPT') || text.includes('原理') || text.includes('课件')) { 
            topic = 'ppt'; 
            type = 'ppt'; 
            title = 'LLM 原理课件 (8页)'; 
        }
        else {
            setTimeout(() => this.addMessage('ai', '🤔 请尝试输入关键词，例如"大模型3D"、"双缝干涉"或"原理课件"。'), 600);
            return;
        }
        
        // 显示确认卡片
        this.showConfirmCard(topic, type, title);
    }
    
    /**
     * 显示确认卡片
     */
    showConfirmCard(topic, type, title) {
        setTimeout(() => {
            const confirmHtml = `
                <div class="font-bold mb-2 text-blue-300 flex items-center"><i class="fas fa-check-circle mr-2"></i> 资源就绪</div>
                <div class="text-sm text-gray-300 mb-4 bg-black/20 p-3 rounded-lg border border-white/10">
                    <div class="mb-1"><span class="text-gray-500">Subject:</span> <span class="font-medium text-white">${title}</span></div>
                    <div><span class="text-gray-500">Mode:</span> <span class="font-medium text-white">${type === 'ppt' ? 'Interactive Slide' : 'WebGL Simulation'}</span></div>
                </div>
                <button onclick="window.app.startGeneration('${topic}', '${type}')" class="w-full bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-xl transition shadow-lg flex items-center justify-center font-bold tracking-wide group text-base">
                    <i class="fas fa-play mr-2 group-hover:scale-110 transition-transform"></i> 立即加载
                </button>
            `;
            const div = document.createElement('div');
            div.className = 'confirm-card chat-bubble bubble-ai';
            div.innerHTML = confirmHtml;
            this.chatHistory.appendChild(div);
            this.chatHistory.scrollTop = this.chatHistory.scrollHeight;
        }, 600);
    }
    
    /**
     * 开始生成场景/课件
     */
    async startGeneration(topic, type) {
        this.currentTopic = topic;
        this.switchTab('code');
        
        // 显示代码打字效果
        await this.showCodeTyping(topic);
        
        // 完成后跳转到实际内容
        this.finishGeneration(type);
    }
    
    /**
     * 显示代码打字效果
     */
    async showCodeTyping(topic) {
        this.codeContent.innerHTML = '';
        this.codeContent.className = 'cursor';
        
        const snippet = codeSnippets[topic] || codeSnippets['llm'] || "// Loading advanced modules...";
        
        return new Promise((resolve) => {
            let i = 0;
            const typingSpeed = 2;
            
            const typeWriter = () => {
                if (i < snippet.length) {
                    this.codeContent.innerHTML += snippet.charAt(i);
                    i++;
                    document.getElementById('view-code').scrollTop = document.getElementById('view-code').scrollHeight;
                    setTimeout(typeWriter, typingSpeed);
                } else {
                    this.codeContent.classList.remove('cursor');
                    resolve();
                }
            };
            
            typeWriter();
        });
    }
    
    /**
     * 完成生成
     */
    async finishGeneration(type) {
        setTimeout(async () => {
            if (type === 'ppt') {
                this.addMessage('ai', '✅ <b>课件已投屏。</b><br>请使用右下角按钮翻页。');
                this.switchTab('ppt');
                this.pptManager.renderSlide(0);
            } else {
                this.addMessage('ai', '✅ <b>全息场景构建完成。</b><br>您可以拖动旋转视角。<br>部分场景支持点击交互。');
                this.switchTab('scene');
                await this.runScene(this.currentTopic);
            }
        }, 600);
    }
    
    /**
     * 运行3D场景
     */
    async runScene(topic) {
        // 隐藏占位符
        const placeholder = document.getElementById('placeholder-text');
        if (placeholder) placeholder.style.display = 'none';
        
        // 场景名称映射
        const sceneMap = {
            'engine': 'Engine',
            'quantum': 'Quantum',
            'hydraulic': 'Hydraulic',
            'llm': 'LLM'
        };
        
        const sceneName = sceneMap[topic];
        if (!sceneName) return;
        
        try {
            // 加载场景
            await this.sceneManager.loadScene(sceneName);
            
            // 获取并显示场景控制按钮
            const controls = this.sceneManager.getCurrentControls();
            if (controls) {
                this.sceneControls.innerHTML = controls;
                this.sceneControls.style.display = 'flex';
                
                // 绑定观察者按钮（双缝干涉）
                if (topic === 'quantum') {
                    const btnObserver = document.getElementById('btn-observer');
                    if (btnObserver) {
                        btnObserver.addEventListener('click', () => {
                            const scene = this.sceneManager.currentScene;
                            const isActive = scene.toggleObserver();
                            
                            if (isActive) {
                                btnObserver.innerHTML = '<i class="fas fa-eye"></i><span>移除观察者</span>';
                                btnObserver.classList.add('active');
                                this.addMessage('ai', '👁️ <b>观察者介入！</b>波函数坍缩，表现为粒子性。');
                            } else {
                                btnObserver.innerHTML = '<i class="fas fa-eye-slash"></i><span>放置观察者</span>';
                                btnObserver.classList.remove('active');
                                this.addMessage('ai', '🙈 <b>观察者移除。</b>恢复波动性，形成干涉条纹。');
                            }
                        });
                    }
                }
            } else {
                this.sceneControls.style.display = 'none';
            }
        } catch (error) {
            console.error('加载场景失败:', error);
            this.addMessage('ai', '❌ 场景加载失败，请重试。');
        }
    }
    
    /**
     * 切换Tab
     */
    switchTab(tabName) {
        this.activeTab = tabName;
        
        // 更新Tab按钮状态
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        document.getElementById(`tab-${tabName}`).classList.add('active');
        
        // 更新内容视图
        document.querySelectorAll('.content-view').forEach(view => view.classList.remove('active'));
        document.getElementById(`view-${tabName}`).classList.add('active');
    }
}

// 创建全局应用实例
window.app = new App();

