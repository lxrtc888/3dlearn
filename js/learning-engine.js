/**
 * 学习引擎（前端轻量版）
 * - 管理步骤、探索动作、练习结果
 * - 计算掌握度并生成总结
 */
window.LearningEngine = {
    sessions: {},
    metricsKey: 'learning-metrics-v1',
    metricsBuffer: [],

    createSession(sceneId) {
        const pathConfig = window.LearningPathConfig?.[sceneId];
        const quizList = window.QuizBank?.[sceneId] || [];
        if (!pathConfig) {
            console.warn('[LearningEngine] 未找到学习路径配置:', sceneId);
            return null;
        }

        const session = {
            sceneId,
            createdAt: Date.now(),
            completedSteps: new Set(),
            exploreActions: new Set(),
            quizAnswers: {},
            quizResults: [],
            stepCount: pathConfig.steps.length,
            requiredExplore: pathConfig.exploreActions.length,
            requiredQuiz: pathConfig.completionRules.minQuizAnswered,
            quizTotal: quizList.length
        };

        this.sessions[sceneId] = session;
        this.logEvent(sceneId, 'session_create', { quizTotal: session.quizTotal });
        return session;
    },

    getSession(sceneId) {
        if (!this.sessions[sceneId]) {
            this.createSession(sceneId);
        }
        return this.sessions[sceneId];
    },

    completeStep(sceneId, stepId) {
        const session = this.getSession(sceneId);
        if (!session) return;
        session.completedSteps.add(stepId);
        this.logEvent(sceneId, 'step_complete', { stepId });
    },

    recordExplore(sceneId, actionId) {
        const session = this.getSession(sceneId);
        if (!session) return;
        session.exploreActions.add(actionId);
        this.logEvent(sceneId, 'explore_action', { actionId });
    },

    submitAnswer(sceneId, question, selectedAnswer) {
        const session = this.getSession(sceneId);
        if (!session) return { isCorrect: false, reason: 'session-missing' };

        const isCorrect = selectedAnswer === question.correctAnswer;
        const errorTag = isCorrect ? '' : (question.errorTags?.[selectedAnswer] || 'generic');
        const result = {
            questionId: question.id,
            selectedAnswer,
            isCorrect,
            errorTag,
            level: question.level
        };

        session.quizAnswers[question.id] = selectedAnswer;
        session.quizResults = session.quizResults.filter(item => item.questionId !== question.id);
        session.quizResults.push(result);
        this.logEvent(sceneId, 'quiz_submit_single', {
            questionId: question.id,
            level: question.level,
            isCorrect
        });
        return result;
    },

    hasCompletedStep(sceneId, stepId) {
        const session = this.getSession(sceneId);
        if (!session) return false;
        return session.completedSteps.has(stepId);
    },

    canAccessStep(sceneId, stepId) {
        const pathConfig = window.LearningPathConfig?.[sceneId];
        const session = this.getSession(sceneId);
        if (!pathConfig || !session) return false;
        const stepIds = pathConfig.steps.map(step => step.id);
        const targetIdx = stepIds.indexOf(stepId);
        if (targetIdx <= 0) return true;
        for (let i = 0; i < targetIdx; i += 1) {
            if (!session.completedSteps.has(stepIds[i])) return false;
        }
        return true;
    },

    canStartQuiz(sceneId) {
        const pathConfig = window.LearningPathConfig?.[sceneId];
        const session = this.getSession(sceneId);
        if (!pathConfig || !session) return false;
        const rules = pathConfig.completionRules || {};
        const minExplore = rules.minExplores || 0;
        const requiredSteps = rules.requiredStepIds || [];
        const stepsOk = requiredSteps.every(step => session.completedSteps.has(step));
        const exploreOk = session.exploreActions.size >= minExplore;
        return stepsOk && exploreOk;
    },

    getScore(sceneId) {
        const session = this.getSession(sceneId);
        if (!session) return 0;

        const pathConfig = window.LearningPathConfig?.[sceneId];
        const rules = pathConfig?.completionRules;
        const minSteps = rules?.minCompletedSteps || session.stepCount;
        const minExplore = rules?.minExplores || session.requiredExplore;
        const minQuiz = rules?.minQuizAnswered || session.requiredQuiz;

        const stepRatio = Math.min(session.completedSteps.size / Math.max(minSteps, 1), 1);
        const exploreRatio = Math.min(session.exploreActions.size / Math.max(minExplore, 1), 1);

        const answered = session.quizResults.length;
        const correct = session.quizResults.filter(item => item.isCorrect).length;
        const quizCompletionRatio = Math.min(answered / Math.max(minQuiz, 1), 1);
        const quizCorrectRatio = answered > 0 ? correct / answered : 0;

        const processScore = Math.round(stepRatio * 20);
        const exploreScore = Math.round(exploreRatio * 20);
        const quizScore = Math.round((quizCompletionRatio * 0.4 + quizCorrectRatio * 0.6) * 60);
        return Math.max(0, Math.min(100, processScore + exploreScore + quizScore));
    },

    getWeakPoints(sceneId) {
        const session = this.getSession(sceneId);
        if (!session) return [];
        const wrong = session.quizResults.filter(item => !item.isCorrect);
        const tags = wrong.map(item => item.errorTag).filter(Boolean);
        return [...new Set(tags)];
    },

    getSummary(sceneId) {
        const score = this.getScore(sceneId);
        const weakPoints = this.getWeakPoints(sceneId);
        let level = '需强化';
        let suggestion = '建议回到步骤 2-4，再次操作参数并完成练习。';

        if (score >= 90) {
            level = '已掌握';
            suggestion = '你已掌握核心规律，建议挑战更高难度场景。';
        } else if (score >= 70) {
            level = '基本掌握';
            suggestion = '建议针对薄弱点做 1 轮强化练习。';
        }

        const summary = { score, level, weakPoints, suggestion };
        this.logEvent(sceneId, 'summary_generate', summary);
        return summary;
    },

    resetSession(sceneId) {
        this.logEvent(sceneId, 'session_reset', {});
        delete this.sessions[sceneId];
    },

    logEvent(sceneId, event, payload = {}) {
        const record = {
            at: Date.now(),
            sceneId,
            event,
            payload
        };
        this.metricsBuffer.push(record);
        if (this.metricsBuffer.length > 300) {
            this.metricsBuffer = this.metricsBuffer.slice(-300);
        }
        try {
            localStorage.setItem(this.metricsKey, JSON.stringify(this.metricsBuffer));
        } catch (error) {
            // 存储失败不影响主流程
        }
    },

    readMetrics() {
        if (this.metricsBuffer.length > 0) return this.metricsBuffer;
        try {
            const raw = localStorage.getItem(this.metricsKey);
            this.metricsBuffer = raw ? JSON.parse(raw) : [];
        } catch (error) {
            this.metricsBuffer = [];
        }
        return this.metricsBuffer;
    }
};
