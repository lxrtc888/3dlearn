# Voice Tutor TTS Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade the existing left-side looping teacher video into a text-input AI voice tutor that speaks AI replies using Volcano/Doubao TTS, shows subtitles, and plays the video only while audio is speaking.

**Architecture:** Keep the current static frontend and existing `AIService` chat flow. Add a focused `VoiceTutor` frontend module that manages teacher state, subtitles, audio playback, and video playback; add a backend `/api/tts` proxy that calls Volcano/Doubao TTS with server-side environment variables so secrets never reach the browser.

**Tech Stack:** Vanilla HTML/CSS/JS, existing `js/app.js`, existing `functions/api/*` serverless style, Volcano/Doubao TTS REST API, browser `<audio>` playback, current `assets/Avatar IV Video.mp4`.

---

## File Structure

- Create: `js/voice-tutor.js`
  - Owns teacher state, subtitles, audio playback, video playback, TTS request flow, and graceful fallback.
- Modify: `app.html`
  - Add subtitle/status controls under `#teacher-video`.
  - Load `js/voice-tutor.js` before `js/app.js`.
- Modify: `css/main.css`
  - Add visual states for idle/thinking/speaking/error, subtitle text, enable voice button, stop button, and mobile behavior.
- Modify: `js/app.js`
  - Initialize `VoiceTutor`.
  - Set thinking state while AI responds.
  - Call `VoiceTutor.speak(result.message)` after successful AI replies and scene introductions.
- Create: `functions/api/tts.js`
  - Server-side TTS proxy using Volcano/Doubao credentials from environment variables.
- Modify: `.gitignore`
  - Already includes `docs/火山TTS引擎key及指南.txt`; verify before implementation.
- Test/Verify: `node --check js/voice-tutor.js js/app.js`
  - This project has no package-based test runner; use syntax checks and manual browser verification.

---

### Task 1: Teacher UI Skeleton

**Files:**
- Modify: `app.html`
- Modify: `css/main.css`

- [ ] **Step 1: Add teacher status and subtitle markup**

In `app.html`, replace the current teacher section:

```html
<div id="teacher-section">
    <video id="teacher-video" autoplay loop muted playsinline>
        <source src="assets/Avatar IV Video.mp4" type="video/mp4">
        您的浏览器不支持视频播放
    </video>
</div>
```

with:

```html
<div id="teacher-section" class="teacher-state-idle">
    <video id="teacher-video" muted playsinline preload="auto">
        <source src="assets/Avatar IV Video.mp4" type="video/mp4">
        您的浏览器不支持视频播放
    </video>
    <div id="teacher-status" class="teacher-status">
        <span class="teacher-status-dot"></span>
        <span id="teacher-status-text">小静待机中</span>
    </div>
    <div id="teacher-subtitle" class="teacher-subtitle" aria-live="polite"></div>
    <div class="teacher-actions">
        <button id="btn-enable-voice" class="teacher-action-btn" type="button">
            <i class="fas fa-volume-up"></i>
            <span>启用语音老师</span>
        </button>
        <button id="btn-stop-voice" class="teacher-action-btn secondary" type="button" hidden>
            <i class="fas fa-stop"></i>
            <span>停止朗读</span>
        </button>
    </div>
</div>
```

- [ ] **Step 2: Add teacher styles**

Append to `css/main.css` near the teacher section styles:

```css
.teacher-state-idle #teacher-video,
.teacher-state-thinking #teacher-video,
.teacher-state-error #teacher-video {
    filter: saturate(0.92) brightness(0.92);
}

.teacher-state-speaking #teacher-video {
    filter: saturate(1.08) brightness(1.04);
}

.teacher-status {
    position: absolute;
    left: 12px;
    top: 12px;
    display: inline-flex;
    align-items: center;
    gap: 7px;
    padding: 7px 10px;
    border-radius: 999px;
    background: rgba(3, 7, 18, 0.64);
    border: 1px solid rgba(148, 163, 184, 0.28);
    color: #e2e8f0;
    font-size: 12px;
    line-height: 1;
    backdrop-filter: blur(10px);
}

.teacher-status-dot {
    width: 8px;
    height: 8px;
    border-radius: 999px;
    background: #94a3b8;
    box-shadow: 0 0 0 3px rgba(148, 163, 184, 0.16);
}

.teacher-state-thinking .teacher-status-dot {
    background: #f59e0b;
    box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.2);
}

.teacher-state-speaking .teacher-status-dot {
    background: #22c55e;
    box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.22), 0 0 18px rgba(34, 197, 94, 0.5);
}

.teacher-state-error .teacher-status-dot {
    background: #ef4444;
    box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.2);
}

.teacher-subtitle {
    position: absolute;
    left: 12px;
    right: 12px;
    bottom: 56px;
    min-height: 42px;
    max-height: 86px;
    overflow: hidden;
    padding: 9px 11px;
    border-radius: 12px;
    background: rgba(3, 7, 18, 0.72);
    border: 1px solid rgba(148, 163, 184, 0.24);
    color: #f8fafc;
    font-size: 13px;
    line-height: 1.55;
    backdrop-filter: blur(10px);
    opacity: 0;
    transform: translateY(6px);
    transition: opacity 0.18s ease, transform 0.18s ease;
}

.teacher-subtitle.visible {
    opacity: 1;
    transform: translateY(0);
}

.teacher-actions {
    position: absolute;
    left: 12px;
    right: 12px;
    bottom: 12px;
    display: flex;
    gap: 8px;
}

.teacher-action-btn {
    min-height: 36px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    flex: 1;
    border: 1px solid rgba(56, 189, 248, 0.32);
    border-radius: 999px;
    background: rgba(14, 165, 233, 0.18);
    color: #e0f2fe;
    font-size: 12px;
    transition: background 0.18s ease, border-color 0.18s ease;
}

.teacher-action-btn:hover {
    background: rgba(14, 165, 233, 0.28);
    border-color: rgba(125, 211, 252, 0.5);
}

.teacher-action-btn.secondary {
    border-color: rgba(248, 113, 113, 0.32);
    background: rgba(127, 29, 29, 0.24);
    color: #fee2e2;
}
```

- [ ] **Step 3: Verify layout does not break existing page**

Run:

```powershell
node --check js/app.js
```

Expected: no syntax errors.

Manual check after server starts in later task: teacher video area still appears, with status/subtitle controls layered over it.

---

### Task 2: VoiceTutor Frontend Module

**Files:**
- Create: `js/voice-tutor.js`
- Modify: `app.html`

- [ ] **Step 1: Create `js/voice-tutor.js`**

Add:

```javascript
(function () {
    const DEFAULT_STATUS = {
        idle: '小静待机中',
        thinking: '小静正在思考...',
        speaking: '小静正在讲解',
        error: '语音暂时不可用'
    };

    const VoiceTutor = {
        video: null,
        subtitle: null,
        statusText: null,
        enableBtn: null,
        stopBtn: null,
        audio: null,
        voiceEnabled: false,
        state: 'idle',

        init() {
            this.video = document.getElementById('teacher-video');
            this.subtitle = document.getElementById('teacher-subtitle');
            this.statusText = document.getElementById('teacher-status-text');
            this.enableBtn = document.getElementById('btn-enable-voice');
            this.stopBtn = document.getElementById('btn-stop-voice');

            if (!this.video || !this.subtitle || !this.statusText) {
                console.warn('[VoiceTutor] teacher UI not found');
                return;
            }

            this.video.muted = true;
            this.video.pause();

            if (this.enableBtn) {
                this.enableBtn.addEventListener('click', () => {
                    this.voiceEnabled = true;
                    this.enableBtn.hidden = true;
                    this.setState('idle');
                });
            }

            if (this.stopBtn) {
                this.stopBtn.addEventListener('click', () => this.stop());
            }

            this.setState('idle');
        },

        setState(nextState, label) {
            this.state = nextState;
            const section = document.getElementById('teacher-section');
            if (section) {
                section.classList.remove(
                    'teacher-state-idle',
                    'teacher-state-thinking',
                    'teacher-state-speaking',
                    'teacher-state-error'
                );
                section.classList.add(`teacher-state-${nextState}`);
            }

            if (this.statusText) {
                this.statusText.textContent = label || DEFAULT_STATUS[nextState] || DEFAULT_STATUS.idle;
            }
        },

        setThinking() {
            this.stopAudioOnly();
            this.hideSubtitle();
            this.pauseVideo();
            this.setState('thinking');
        },

        async speak(text) {
            const cleanText = this.normalizeText(text);
            if (!cleanText) {
                this.setState('idle');
                return;
            }

            this.showSubtitle(cleanText);

            if (!this.voiceEnabled) {
                this.setState('idle', '点击启用语音老师');
                if (this.enableBtn) this.enableBtn.hidden = false;
                return;
            }

            try {
                this.setState('thinking', '正在生成语音...');
                const audioBlob = await this.fetchTTS(cleanText);
                await this.playBlob(audioBlob);
            } catch (error) {
                console.error('[VoiceTutor] speak failed:', error);
                this.pauseVideo();
                this.setState('error');
            }
        },

        async fetchTTS(text) {
            const response = await fetch('/api/tts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text })
            });

            if (!response.ok) {
                const message = await response.text().catch(() => '');
                throw new Error(`TTS request failed: ${response.status} ${message}`);
            }

            return await response.blob();
        },

        playBlob(blob) {
            return new Promise((resolve, reject) => {
                this.stopAudioOnly();
                const url = URL.createObjectURL(blob);
                const audio = new Audio(url);
                this.audio = audio;

                audio.onplay = () => {
                    this.setState('speaking');
                    this.playVideo();
                    if (this.stopBtn) this.stopBtn.hidden = false;
                };

                audio.onended = () => {
                    URL.revokeObjectURL(url);
                    this.audio = null;
                    this.pauseVideo();
                    this.setState('idle');
                    if (this.stopBtn) this.stopBtn.hidden = true;
                    resolve();
                };

                audio.onerror = () => {
                    URL.revokeObjectURL(url);
                    this.audio = null;
                    this.pauseVideo();
                    if (this.stopBtn) this.stopBtn.hidden = true;
                    reject(new Error('Audio playback failed'));
                };

                audio.play().catch((error) => {
                    URL.revokeObjectURL(url);
                    this.audio = null;
                    this.pauseVideo();
                    if (this.enableBtn) this.enableBtn.hidden = false;
                    reject(error);
                });
            });
        },

        playVideo() {
            if (!this.video) return;
            this.video.loop = true;
            this.video.play().catch(() => {});
        },

        pauseVideo() {
            if (!this.video) return;
            this.video.pause();
        },

        showSubtitle(text) {
            if (!this.subtitle) return;
            this.subtitle.textContent = text;
            this.subtitle.classList.add('visible');
        },

        hideSubtitle() {
            if (!this.subtitle) return;
            this.subtitle.textContent = '';
            this.subtitle.classList.remove('visible');
        },

        stopAudioOnly() {
            if (!this.audio) return;
            this.audio.pause();
            this.audio.currentTime = 0;
            this.audio = null;
            if (this.stopBtn) this.stopBtn.hidden = true;
        },

        stop() {
            this.stopAudioOnly();
            this.pauseVideo();
            this.setState('idle');
        },

        normalizeText(text) {
            const div = document.createElement('div');
            div.innerHTML = String(text || '');
            return div.textContent.replace(/\s+/g, ' ').trim().slice(0, 260);
        }
    };

    window.VoiceTutor = VoiceTutor;
})();
```

- [ ] **Step 2: Load `voice-tutor.js` in `app.html`**

Add before `js/app.js`:

```html
<script src="js/voice-tutor.js?v=1"></script>
```

Expected location: after `js/learning-engine.js` and before `js/scene-loader.js` or before `js/app.js`.

- [ ] **Step 3: Run syntax check**

Run:

```powershell
node --check js\voice-tutor.js
node --check js\app.js
```

Expected: both commands exit with code 0.

---

### Task 3: Wire VoiceTutor Into Existing Chat Flow

**Files:**
- Modify: `js/app.js`

- [ ] **Step 1: Initialize VoiceTutor**

In the `DOMContentLoaded` callback, after `bindEvents();`, add:

```javascript
if (window.VoiceTutor) {
    window.VoiceTutor.init();
}
```

- [ ] **Step 2: Set thinking state during AI chat**

In `handleAIChat(text)`, after `state.isAIChatting = true;`, add:

```javascript
window.VoiceTutor?.setThinking();
```

- [ ] **Step 3: Speak successful AI replies**

In `handleAIChat(text)`, after:

```javascript
addMessage('ai', result.message);
```

add:

```javascript
window.VoiceTutor?.speak(result.message);
```

- [ ] **Step 4: Reset VoiceTutor on failed AI reply**

In `handleAIChat(text)`, after failed reply handling:

```javascript
addMessage('ai', '😅 ' + result.message);
```

add:

```javascript
window.VoiceTutor?.setState('error', '老师暂时无法语音回应');
```

- [ ] **Step 5: Speak scene introduction**

In the scene introduction block, after:

```javascript
addMessage('ai', '🎓 ' + result.message);
```

add:

```javascript
window.VoiceTutor?.speak(result.message);
```

- [ ] **Step 6: Run syntax check**

Run:

```powershell
node --check js\app.js
```

Expected: command exits with code 0.

---

### Task 4: Volcano/Doubao TTS Backend Proxy

**Files:**
- Create: `functions/api/tts.js`

- [ ] **Step 1: Create API function**

Add:

```javascript
function jsonResponse(body, status = 200, extraHeaders = {}) {
    return new Response(JSON.stringify(body), {
        status,
        headers: {
            'Content-Type': 'application/json; charset=utf-8',
            ...extraHeaders
        }
    });
}

function buildCorsHeaders(origin = '*') {
    return {
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Max-Age': '86400'
    };
}

function cleanText(input) {
    return String(input || '')
        .replace(/<[^>]*>/g, '')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 260);
}

function requireEnv(env, key) {
    const value = env[key];
    if (!value) {
        throw new Error(`缺少环境变量 ${key}`);
    }
    return value;
}

export async function onRequestOptions(context) {
    const origin = context.request.headers.get('Origin') || '*';
    return new Response(null, {
        status: 204,
        headers: buildCorsHeaders(origin)
    });
}

export async function onRequestPost(context) {
    const { request, env } = context;
    const origin = request.headers.get('Origin') || '*';
    const corsHeaders = buildCorsHeaders(origin);

    let body;
    try {
        body = await request.json();
    } catch (error) {
        return jsonResponse({ error: '请求体不是合法 JSON' }, 400, corsHeaders);
    }

    const text = cleanText(body.text);
    if (!text) {
        return jsonResponse({ error: 'text 不能为空' }, 400, corsHeaders);
    }

    try {
        const endpoint = env.VOLCANO_TTS_ENDPOINT || 'https://openspeech.bytedance.com/api/v1/tts';
        const appId = requireEnv(env, 'VOLCANO_TTS_APP_ID');
        const accessToken = requireEnv(env, 'VOLCANO_TTS_ACCESS_TOKEN');
        const cluster = env.VOLCANO_TTS_CLUSTER || 'volcano_tts';
        const voiceType = env.VOLCANO_TTS_VOICE_TYPE || 'BV001_streaming';

        const reqid =
            typeof crypto !== 'undefined' && crypto.randomUUID
                ? crypto.randomUUID()
                : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

        const payload = {
            app: {
                appid: appId,
                token: accessToken,
                cluster
            },
            user: {
                uid: '3dlearn-web'
            },
            audio: {
                voice_type: body.voice || voiceType,
                encoding: 'mp3',
                speed_ratio: Number(body.speed || 1),
                volume_ratio: 1,
                pitch_ratio: 1
            },
            request: {
                reqid,
                text,
                operation: 'query'
            }
        };

        const upstream = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer;${accessToken}`
            },
            body: JSON.stringify(payload)
        });

        const data = await upstream.json().catch(() => null);
        if (!upstream.ok || !data || !data.data) {
            return jsonResponse(
                {
                    error: '火山 TTS 合成失败',
                    status: upstream.status,
                    details: data?.message || data?.error || 'unknown'
                },
                502,
                corsHeaders
            );
        }

        const binary = Uint8Array.from(atob(data.data), char => char.charCodeAt(0));
        return new Response(binary, {
            status: 200,
            headers: {
                ...corsHeaders,
                'Content-Type': 'audio/mpeg',
                'Cache-Control': 'no-store'
            }
        });
    } catch (error) {
        return jsonResponse(
            { error: 'TTS 服务配置错误', details: error.message || String(error) },
            500,
            corsHeaders
        );
    }
}
```

- [ ] **Step 2: Verify key file is ignored**

Run:

```powershell
git check-ignore -v docs\火山TTS引擎key及指南.txt
```

Expected: output contains `.gitignore` and the ignored file path.

- [ ] **Step 3: Syntax scan**

Run:

```powershell
Select-String -Path functions\api\tts.js -Pattern 'VOLCANO_TTS_ACCESS_TOKEN|onRequestPost|audio/mpeg'
```

Expected: all three patterns are found.

---

### Task 5: Manual Integration Verification

**Files:**
- No code changes unless verification finds issues.

- [ ] **Step 1: Start local server**

Run:

```powershell
python serve.py
```

Expected: server starts at `http://localhost:8000`.

- [ ] **Step 2: Open app**

Open:

```text
http://localhost:8000/app.html
```

Expected:
- Left teacher video is visible.
- Video is paused in idle state.
- “启用语音老师” button is visible.
- Chat input still works.

- [ ] **Step 3: Verify text-only fallback before backend config**

Ask:

```text
介绍一下双缝干涉
```

Expected:
- AI text reply appears.
- Teacher subtitle shows the text.
- If `/api/tts` is unavailable locally, UI shows error state but text chat still works.

- [ ] **Step 4: Verify production TTS after environment variables are configured**

Configure serverless environment:

```text
VOLCANO_TTS_APP_ID
VOLCANO_TTS_ACCESS_TOKEN
VOLCANO_TTS_CLUSTER
VOLCANO_TTS_VOICE_TYPE
```

Expected:
- AI reply produces audible speech.
- Video plays while speech audio is playing.
- Video pauses after speech ends.
- No API key appears in browser devtools source files.

---

### Task 6: Documentation Update

**Files:**
- Modify: `docs/语音数字人TTS上线方案.md`

- [ ] **Step 1: Add implementation status section**

Append:

```markdown
## 11. 实施状态

- 已确定第一版主 TTS：火山豆包 TTS。
- 已新增前端语音老师控制模块：`js/voice-tutor.js`。
- 已新增后端 TTS 代理接口：`functions/api/tts.js`。
- 已将本地 key 指南文件加入 `.gitignore`，避免公开提交。
- 第一版范围仍保持：文字输入、TTS 播报、视频播放联动、字幕显示，不做语音输入和口型同步。
```

- [ ] **Step 2: Confirm docs still render as Markdown**

Run:

```powershell
Get-Content -Encoding UTF8 docs\语音数字人TTS上线方案.md -TotalCount 30
```

Expected: Markdown heading and status content display correctly.

---

## Self-Review

- Spec coverage: The plan covers text input, TTS output, retained video, no lip sync, no speech-to-text, Mainland TTS provider choice, subtitle display, backend proxy, secret handling, and fallback behavior.
- Placeholder scan: No `TBD`, `TODO`, or unspecified implementation steps remain.
- Type consistency: Frontend methods are consistently named `init`, `setState`, `setThinking`, `speak`, and `stop`; backend environment variables are consistently named `VOLCANO_TTS_*`.

