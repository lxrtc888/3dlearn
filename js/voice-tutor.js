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
        audioUrl: null,
        requestSeq: 0,
        abortController: null,
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
            this.requestSeq += 1;
            if (this.abortController) {
                this.abortController.abort();
                this.abortController = null;
            }
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

            const requestId = ++this.requestSeq;
            this.showSubtitle(cleanText);

            if (!this.voiceEnabled) {
                this.setState('idle', '点击启用语音老师');
                if (this.enableBtn) this.enableBtn.hidden = false;
                return;
            }

            try {
                if (this.abortController) {
                    this.abortController.abort();
                }
                this.abortController = new AbortController();
                this.setState('thinking', '正在生成语音...');
                const audioBlob = await this.fetchTTS(cleanText, this.abortController.signal);
                if (requestId !== this.requestSeq) return;
                this.abortController = null;
                await this.playBlob(audioBlob, requestId);
            } catch (error) {
                if (error.name === 'AbortError' || requestId !== this.requestSeq) {
                    return;
                }
                if (error.voiceTutorRetryEnable) {
                    return;
                }
                console.error('[VoiceTutor] speak failed:', error);
                this.pauseVideo();
                this.setState('error');
            } finally {
                if (requestId === this.requestSeq) {
                    this.abortController = null;
                }
            }
        },

        async fetchTTS(text, signal) {
            const response = await fetch('/api/tts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text }),
                signal
            });

            if (!response.ok) {
                const message = await response.text().catch(() => '');
                throw new Error(`TTS request failed: ${response.status} ${message}`);
            }

            return await response.blob();
        },

        playBlob(blob, requestId) {
            return new Promise((resolve, reject) => {
                this.stopAudioOnly();
                const url = URL.createObjectURL(blob);
                this.audioUrl = url;
                const audio = new Audio(url);
                this.audio = audio;
                window.AvatarTutor?.attachAudio?.(audio);
                const isStale = () => requestId !== this.requestSeq;
                const cleanup = () => {
                    if (this.audioUrl === url) {
                        this.revokeAudioUrl();
                    } else {
                        URL.revokeObjectURL(url);
                    }
                    if (this.audio === audio) {
                        window.AvatarTutor?.detachAudio?.();
                        this.audio = null;
                    }
                };
                const cleanupStale = () => {
                    audio.pause();
                    audio.currentTime = 0;
                    cleanup();
                };

                audio.onplay = () => {
                    if (isStale()) {
                        cleanupStale();
                        resolve();
                        return;
                    }
                    this.setState('speaking');
                    this.playVideo();
                    if (this.stopBtn) this.stopBtn.hidden = false;
                };

                audio.onended = () => {
                    if (isStale()) {
                        cleanup();
                        resolve();
                        return;
                    }
                    cleanup();
                    this.pauseVideo();
                    this.setState('idle');
                    if (this.stopBtn) this.stopBtn.hidden = true;
                    resolve();
                };

                audio.onerror = () => {
                    if (isStale()) {
                        cleanup();
                        resolve();
                        return;
                    }
                    cleanup();
                    this.pauseVideo();
                    if (this.stopBtn) this.stopBtn.hidden = true;
                    reject(new Error('Audio playback failed'));
                };

                audio.play().catch((error) => {
                    if (isStale()) {
                        cleanup();
                        resolve();
                        return;
                    }
                    cleanup();
                    this.pauseVideo();
                    this.voiceEnabled = false;
                    if (this.enableBtn) this.enableBtn.hidden = false;
                    this.setState('idle', '点击启用语音老师');
                    error.voiceTutorRetryEnable = true;
                    reject(error);
                });
            });
        },

        revokeAudioUrl() {
            if (!this.audioUrl) return;
            URL.revokeObjectURL(this.audioUrl);
            this.audioUrl = null;
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
            if (this.audio) {
                window.AvatarTutor?.detachAudio?.();
                this.audio.pause();
                this.audio.currentTime = 0;
                this.audio = null;
            }
            this.revokeAudioUrl();
            if (this.stopBtn) this.stopBtn.hidden = true;
        },

        stop() {
            this.requestSeq += 1;
            if (this.abortController) {
                this.abortController.abort();
                this.abortController = null;
            }
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
