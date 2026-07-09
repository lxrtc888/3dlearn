/**
 * AI辅导服务模块
 * ============================================
 * 接入智谱清言 GLM-4 flash 模型
 * 提供场景讲解、问答、操作提示功能
 * ============================================
 */

window.AIService = {
    // API配置
    API_URL: '/api/ai/chat',
    MODEL: 'glm-4-flash',  // 注意：必须使用 glm-4-flash，不是 glm-4
    
    // 对话历史（保持上下文）
    conversationHistory: [],
    
    // 当前场景信息
    currentSceneInfo: null,
    
    /**
     * 设置当前场景信息
     */
    setSceneContext(sceneConfig) {
        if (!sceneConfig) {
            this.currentSceneInfo = null;
            this.conversationHistory = [];
            return;
        }
        
        this.currentSceneInfo = {
            id: sceneConfig.id,
            title: sceneConfig.title,
            description: sceneConfig.description,
            difficulty: sceneConfig.difficulty,
            intro: sceneConfig.intro
        };
        
        // 重置对话历史，添加系统提示
        this.conversationHistory = [];
    },
    
    /**
     * 构建系统提示词
     */
    buildSystemPrompt() {
        let systemPrompt = `你是"3D神经元课堂"的AI智能助教老师，名字叫小静。你的角色是帮助学生通过交互式3D场景学习知识。

你的特点：
- 亲切友好，有耐心，善于用通俗易懂的语言解释复杂概念
- 善于引导学生主动思考，而不是直接给答案
- 会根据学生的问题提供操作提示，比如"试试点击XXX部件看看"
- 适时给予鼓励和正面反馈
- 回答简洁明了，避免长篇大论，一般不超过150字

重要规则：
- 只回答与当前场景相关的学科知识问题
- 如果学生问的问题与当前场景无关，友好地引导回来
- 不要透露你是AI或大模型，保持"老师"的角色设定
- 回答用中文，语气自然亲切`;

        // 如果有当前场景，添加场景上下文
        if (this.currentSceneInfo) {
            const scene = this.currentSceneInfo;
            systemPrompt += `

【当前教学场景】
场景名称：${scene.title}
场景描述：${scene.description}`;

            if (scene.intro) {
                systemPrompt += `
学习目标：
${scene.intro.objectives ? scene.intro.objectives.map((o, i) => `${i+1}. ${o}`).join('\n') : ''}

知识要点：${scene.intro.keyPoints ? scene.intro.keyPoints.join('、') : ''}

操作提示：${scene.intro.tips || ''}`;
            }

            systemPrompt += `

你需要围绕这个场景进行讲解和答疑。当学生问问题时：
1. 如果是关于场景内容的问题，详细但简洁地解答
2. 如果学生在操作上有困难，给出具体的操作指引
3. 主动引导学生探索场景中的互动元素`;
        } else {
            systemPrompt += `

当前没有加载具体场景。请引导学生选择一个感兴趣的3D场景开始学习，或者回答一些通用的学习问题。`;
        }
        
        return systemPrompt;
    },
    
    /**
     * 发送消息并获取AI回复
     */
    async chat(userMessage) {
        // 添加用户消息到历史
        this.conversationHistory.push({
            role: 'user',
            content: userMessage
        });
        
        // 限制历史长度，避免token过多
        if (this.conversationHistory.length > 10) {
            this.conversationHistory = this.conversationHistory.slice(-10);
        }
        
        // 构建消息数组
        const messages = [
            {
                role: 'system',
                content: this.buildSystemPrompt()
            },
            ...this.conversationHistory
        ];
        
        try {
            const response = await fetch(this.API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: this.MODEL,
                    messages: messages,
                    temperature: 0.7,
                    max_tokens: 500
                })
            });
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                console.error('AI API Error:', response.status, errorData);
                throw new Error(`API请求失败: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data.choices && data.choices[0] && data.choices[0].message) {
                const aiReply = data.choices[0].message.content;
                
                // 添加AI回复到历史
                this.conversationHistory.push({
                    role: 'assistant',
                    content: aiReply
                });
                
                return {
                    success: true,
                    message: aiReply
                };
            } else {
                throw new Error('API返回格式异常');
            }
        } catch (error) {
            console.error('AI Chat Error:', error);
            return {
                success: false,
                message: '抱歉，我暂时无法回应。请稍后再试。',
                error: error.message
            };
        }
    },
    
    /**
     * 获取场景开场白
     */
    async getSceneIntroduction() {
        if (!this.currentSceneInfo) {
            return {
                success: true,
                message: '👋 欢迎来到3D神经元课堂！请选择一个场景开始学习吧。'
            };
        }
        
        const prompt = `学生刚刚进入了"${this.currentSceneInfo.title}"场景，请用2-3句话简短地欢迎他，并简要介绍这个场景的学习内容和主要操作方式，激发学习兴趣。`;
        
        return await this.chat(prompt);
    },
    
    /**
     * 获取操作提示
     */
    async getOperationHint(action) {
        const prompt = `学生在场景中${action}，请给出简短的操作指引或知识点提示，不超过50字。`;
        return await this.chat(prompt);
    },
    
    /**
     * 清除对话历史
     */
    clearHistory() {
        this.conversationHistory = [];
    }
};
