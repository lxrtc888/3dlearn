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
        browserSpeechUtterance: null,
        requestSeq: 0,
        abortController: null,
        pendingSpeechText: null,
        pendingSpeechBlob: null,
        pendingSpeechRetryHandler: null,
        voiceEnabled: true,
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
                this.enableBtn.hidden = true;
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

        clearPendingSpeech() {
            this.pendingSpeechText = null;
            this.pendingSpeechBlob = null;
            this.removePendingSpeechRetry();
        },

        installPendingSpeechRetry() {
            if (this.pendingSpeechRetryHandler) return;
            this.pendingSpeechRetryHandler = () => this.retryPendingSpeechFromGesture();
            ['pointerdown', 'touchstart', 'keydown'].forEach((eventName) => {
                window.addEventListener?.(eventName, this.pendingSpeechRetryHandler, { capture: true });
            });
        },

        removePendingSpeechRetry() {
            if (!this.pendingSpeechRetryHandler) return;
            ['pointerdown', 'touchstart', 'keydown'].forEach((eventName) => {
                window.removeEventListener?.(eventName, this.pendingSpeechRetryHandler, { capture: true });
            });
            this.pendingSpeechRetryHandler = null;
        },

        queueSpeechForUserGesture() {
            return false;
        },

        queueAudioForUserGesture(blob, text) {
            const cleanText = this.normalizeText(text);
            if (!blob || !cleanText) return false;
            this.pendingSpeechText = cleanText;
            this.pendingSpeechBlob = blob;
            this.installPendingSpeechRetry();
            window.AvatarTutor?.stopSpeech?.();
            this.pauseVideo();
            if (this.stopBtn) this.stopBtn.hidden = true;
            this.setState('idle', '\u70b9\u51fb\u9875\u9762\u540e\u7ee7\u7eed\u6717\u8bfb');
            return true;
        },

        retryPendingSpeechFromGesture() {
            const text = this.pendingSpeechText;
            const blob = this.pendingSpeechBlob;
            if (!text || !blob) {
                this.clearPendingSpeech();
                return;
            }
            this.pendingSpeechText = null;
            this.pendingSpeechBlob = null;
            this.removePendingSpeechRetry();
            const requestId = ++this.requestSeq;
            this.showSubtitle(text);
            window.AvatarTutor?.prepareSpeech?.();
            window.AvatarTutor?.startSpeech?.();
            this.setState('speaking');
            this.playVideo();
            if (this.stopBtn) this.stopBtn.hidden = false;
            this.playBlob(blob, requestId, text).catch((error) => {
                console.warn('[VoiceTutor] queued TTS audio retry failed:', error);
                if (requestId === this.requestSeq) {
                    this.queueAudioForUserGesture(blob, text);
                }
            });
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

        async speak(text, options = {}) {
            const cleanText = this.normalizeText(text);
            if (!cleanText) {
                this.setState('idle');
                return;
            }

            const deferSubtitleUntilAudio = options.deferSubtitleUntilAudio === true;
            const onAudioReady = typeof options.onAudioReady === 'function' ? options.onAudioReady : null;
            const onSpeechUnavailable = typeof options.onSpeechUnavailable === 'function' ? options.onSpeechUnavailable : null;
            let speechCallbackDone = false;
            const notifySpeechCallback = (callback) => {
                if (speechCallbackDone || !callback) return;
                speechCallbackDone = true;
                try {
                    callback(cleanText);
                } catch (callbackError) {
                    console.warn('[VoiceTutor] speech callback failed:', callbackError);
                }
            };

            const requestId = ++this.requestSeq;
            if (!deferSubtitleUntilAudio) {
                this.showSubtitle(cleanText);
            }

            if (!this.voiceEnabled) {
                this.setState('idle', '点击启用语音老师');
                if (this.enableBtn) this.enableBtn.hidden = false;
                notifySpeechCallback(onSpeechUnavailable);
                return;
            }

            try {
                window.AvatarTutor?.prepareSpeech?.();
                window.AvatarTutor?.startSpeech?.();
                this.setState('speaking');
                this.playVideo();
                if (this.stopBtn) this.stopBtn.hidden = false;

                if (this.abortController) {
                    this.abortController.abort();
                }
                this.abortController = new AbortController();
                const audioBlob = await this.fetchTTS(cleanText, this.abortController.signal);
                if (requestId !== this.requestSeq) return;
                this.abortController = null;
                if (deferSubtitleUntilAudio) {
                    this.showSubtitle(cleanText);
                }
                notifySpeechCallback(onAudioReady);
                await this.playBlob(audioBlob, requestId, cleanText);
            } catch (error) {
                if (error.name === 'AbortError' || requestId !== this.requestSeq) {
                    return;
                }
                if (error.voiceTutorRetryEnable) {
                    return;
                }
                notifySpeechCallback(onSpeechUnavailable);
                console.error('[VoiceTutor] speak failed:', error);
                window.AvatarTutor?.stopSpeech?.();
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

        playBlob(blob, requestId, fallbackText = '') {
            return new Promise((resolve, reject) => {
                this.stopAudioOnly({ keepSpeechGesture: true, keepStopButton: true });
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
                    window.AvatarTutor?.startSpeech?.();
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
                    if (this.stopBtn) this.stopBtn.hidden = true;
                    if (fallbackText && error.name === 'NotAllowedError' && this.queueAudioForUserGesture(blob, fallbackText)) {
                        resolve();
                        return;
                    }                    window.AvatarTutor?.stopSpeech?.();
                    reject(error);
                });
            });
        },

        revokeAudioUrl() {
            if (!this.audioUrl) return;
            URL.revokeObjectURL(this.audioUrl);
            this.audioUrl = null;
        },

        canUseBrowserSpeech() {
            return Boolean(window.speechSynthesis && window.SpeechSynthesisUtterance);
        },

        playBrowserSpeech(text, requestId) {
            return new Promise((resolve, reject) => {
                if (!this.canUseBrowserSpeech()) {
                    reject(new Error('Browser speech synthesis is unavailable'));
                    return;
                }

                const utterance = new window.SpeechSynthesisUtterance(text);
                this.browserSpeechUtterance = utterance;
                utterance.lang = 'zh-CN';
                utterance.rate = 1;
                utterance.pitch = 1;
                utterance.volume = 1;

                const isStale = () => requestId !== this.requestSeq;
                const cleanup = () => {
                    if (this.browserSpeechUtterance === utterance) {
                        this.browserSpeechUtterance = null;
                    }
                };
                const finish = () => {
                    cleanup();
                    if (isStale()) {
                        resolve();
                        return;
                    }
                    window.AvatarTutor?.stopSpeech?.();
                    this.pauseVideo();
                    this.setState('idle');
                    if (this.stopBtn) this.stopBtn.hidden = true;
                    resolve();
                };

                utterance.onstart = () => {
                    if (isStale()) return;
                    this.setState('speaking');
                    window.AvatarTutor?.startSpeech?.();
                    this.playVideo();
                    if (this.stopBtn) this.stopBtn.hidden = false;
                };
                utterance.onend = finish;
                utterance.onerror = () => {
                    cleanup();
                    window.AvatarTutor?.stopSpeech?.();
                    this.pauseVideo();
                    if (this.stopBtn) this.stopBtn.hidden = true;
                    reject(new Error('Browser speech synthesis failed'));
                };

                window.speechSynthesis.cancel?.();
                this.setState('speaking');
                window.AvatarTutor?.startSpeech?.();
                this.playVideo();
                if (this.stopBtn) this.stopBtn.hidden = false;
                window.speechSynthesis.speak(utterance);
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

        stopAudioOnly(options = {}) {
            const keepSpeechGesture = options.keepSpeechGesture === true;
            const keepStopButton = options.keepStopButton === true;
            if (this.browserSpeechUtterance || window.speechSynthesis?.speaking) {
                window.speechSynthesis?.cancel?.();
                this.browserSpeechUtterance = null;
            }
            if (this.audio) {
                window.AvatarTutor?.detachAudio?.({ keepSpeechGesture });
                this.audio.pause();
                this.audio.currentTime = 0;
                this.audio = null;
            }
            if (!keepSpeechGesture) {
                window.AvatarTutor?.stopSpeech?.();
            }
            this.revokeAudioUrl();
            if (!keepStopButton && this.stopBtn) this.stopBtn.hidden = true;
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

