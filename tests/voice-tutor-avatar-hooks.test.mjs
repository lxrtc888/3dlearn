import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';

const WELCOME_TEXT = '\u6b22\u8fce\u8bed';

async function loadVoiceTutor(moduleFile, options = {}) {
    const source = await readFile(new URL('../js/' + moduleFile, import.meta.url), 'utf8');
    const elements = new Map();
    const calls = [];
    const windowListeners = new Map();
    let browserSpeechFailures = options.rejectBrowserSpeechTimes || 0;
    let audioPlayFailures = Object.prototype.hasOwnProperty.call(options, 'rejectAudioPlayTimes')
        ? options.rejectAudioPlayTimes
        : (options.rejectAudioPlay ? Number.POSITIVE_INFINITY : 0);

    class FakeAudio {
        constructor(url) {
            this.url = url;
            this.currentTime = 0;
            FakeAudio.last = this;
        }

        play() {
            calls.push(['audio.play']);
            if (audioPlayFailures > 0) {
                audioPlayFailures -= 1;
                const error = new Error('playback blocked');
                error.name = 'NotAllowedError';
                return Promise.reject(error);
            }
            queueMicrotask(() => this.onplay?.());
            return Promise.resolve();
        }

        pause() {
            calls.push(['audio.pause']);
        }
    }

    const context = {
        window: {
            addEventListener(name, handler) {
                const listeners = windowListeners.get(name) || [];
                listeners.push(handler);
                windowListeners.set(name, listeners);
            },
            removeEventListener(name, handler) {
                const listeners = windowListeners.get(name) || [];
                windowListeners.set(name, listeners.filter((listener) => listener !== handler));
            },
            speechSynthesis: options.enableBrowserSpeech ? {
                cancel() {
                    calls.push(['speech.cancel']);
                },
                speak(utterance) {
                    calls.push(['speech.speak', utterance.text]);
                    queueMicrotask(() => {
                        if (browserSpeechFailures > 0) {
                            browserSpeechFailures -= 1;
                            utterance.onerror?.(new Error('browser speech blocked'));
                            return;
                        }
                        utterance.onstart?.();
                        utterance.onend?.();
                    });
                }
            } : undefined,
            SpeechSynthesisUtterance: options.enableBrowserSpeech ? class SpeechSynthesisUtterance {
                constructor(text) {
                    this.text = text;
                }
            } : undefined,
            AvatarTutor: {
                prepareSpeech() {
                    calls.push(['prepareSpeech']);
                },
                startSpeech() {
                    calls.push(['startSpeech']);
                },
                stopSpeech() {
                    calls.push(['stopSpeech']);
                },
                attachAudio(audio) {
                    calls.push(['attachAudio', audio]);
                },
                detachAudio() {
                    calls.push(['detachAudio']);
                }
            }
        },
        fetch() {
            calls.push(['fetch']);
            if (options.rejectFetch) {
                return Promise.reject(new Error('tts service unavailable'));
            }
            return Promise.resolve({
                ok: true,
                blob: async () => new Blob(['audio'])
            });
        },
        document: {
            getElementById(id) {
                if (!elements.has(id)) {
                    elements.set(id, {
                        id,
                        hidden: false,
                        muted: false,
                        loop: false,
                        textContent: '',
                        pause() {
                            calls.push([`${id}.pause`]);
                        },
                        play() {
                            calls.push([`${id}.play`]);
                            return Promise.resolve();
                        },
                        addEventListener() {},
                        classList: {
                            add() {},
                            remove() {}
                        }
                    });
                }
                return elements.get(id);
            },
            createElement() {
                return {
                    _innerHTML: '',
                    textContent: '',
                    set innerHTML(value) {
                        this._innerHTML = String(value || '');
                        this.textContent = this._innerHTML.replace(/<[^>]*>/g, '');
                    },
                    get innerHTML() {
                        return this._innerHTML;
                    }
                };
            }
        },
        Audio: FakeAudio,
        AbortController,
        Blob,
        URL: {
            createObjectURL() {
                return 'blob:test-audio';
            },
            revokeObjectURL(url) {
                calls.push(['revokeObjectURL', url]);
            }
        },
        console,
        queueMicrotask,
        setTimeout,
        clearTimeout
    };
    context.window.window = context.window;

    vm.createContext(context);
    vm.runInContext(source, context);
    context.window.VoiceTutor.init();

    return {
        calls,
        FakeAudio,
        VoiceTutor: context.window.VoiceTutor,
        dispatchWindowEvent(name) {
            for (const listener of windowListeners.get(name) || []) {
                listener({ type: name });
            }
        }
    };
}

test('voice-tutor-live.js starts enabled without requiring a user click', async () => {
    const { VoiceTutor } = await loadVoiceTutor('voice-tutor-live.js');

    assert.equal(VoiceTutor.voiceEnabled, true);
    assert.equal(VoiceTutor.enableBtn.hidden, true);
});

test('voice-tutor-live.js queues normal TTS audio when startup autoplay is blocked', async () => {
    const { calls, dispatchWindowEvent, VoiceTutor } = await loadVoiceTutor('voice-tutor-live.js', {
        rejectAudioPlayTimes: 1,
        enableBrowserSpeech: true
    });

    VoiceTutor.voiceEnabled = true;
    VoiceTutor.enableBtn.hidden = true;
    const playPromise = VoiceTutor.playBlob(new Blob(['audio']), 0, WELCOME_TEXT);
    playPromise.catch(() => {});
    await new Promise((resolve) => setTimeout(resolve, 0));

    assert.equal(calls.some(([name]) => name === 'speech.speak'), false);
    assert.equal(calls.filter(([name]) => name === 'audio.play').length, 1);
    assert.equal(VoiceTutor.pendingSpeechText, WELCOME_TEXT);
    assert.ok(VoiceTutor.pendingSpeechBlob);
    assert.equal(VoiceTutor.state, 'idle');

    dispatchWindowEvent('pointerdown');
    await new Promise((resolve) => setTimeout(resolve, 0));
    if (VoiceTutor.audio?.onended) VoiceTutor.audio.onended();
    await new Promise((resolve) => setTimeout(resolve, 0));

    assert.equal(calls.filter(([name]) => name === 'audio.play').length, 2);
    assert.equal(calls.some(([name]) => name === 'speech.speak'), false);
    assert.equal(VoiceTutor.pendingSpeechText, null);
    assert.equal(VoiceTutor.pendingSpeechBlob, null);
    assert.equal(VoiceTutor.state, 'idle');
});

test('voice-tutor-live.js does not use mechanical browser speech when TTS service fails', async () => {
    const { calls, VoiceTutor } = await loadVoiceTutor('voice-tutor-live.js', {
        rejectFetch: true,
        enableBrowserSpeech: true
    });

    await VoiceTutor.speak(WELCOME_TEXT, { deferSubtitleUntilAudio: true });

    assert.equal(calls.some(([name]) => name === 'speech.speak'), false);
    assert.equal(VoiceTutor.pendingSpeechText, null);
    assert.equal(VoiceTutor.pendingSpeechBlob, null);
    assert.equal(VoiceTutor.state, 'error');
});

test('voice-tutor-live.js queues startup TTS audio and retries on first user gesture', async () => {
    const { calls, dispatchWindowEvent, VoiceTutor } = await loadVoiceTutor('voice-tutor-live.js', {
        rejectAudioPlayTimes: 1,
        enableBrowserSpeech: true
    });

    const speakPromise = VoiceTutor.speak(WELCOME_TEXT, { deferSubtitleUntilAudio: true });
    speakPromise.catch(() => {});
    await new Promise((resolve) => setTimeout(resolve, 0));

    assert.equal(calls.filter(([name]) => name === 'audio.play').length, 1);
    assert.equal(calls.some(([name]) => name === 'speech.speak'), false);
    assert.equal(VoiceTutor.state, 'idle');
    assert.equal(VoiceTutor.pendingSpeechText, WELCOME_TEXT);
    assert.ok(VoiceTutor.pendingSpeechBlob);

    dispatchWindowEvent('pointerdown');
    await new Promise((resolve) => setTimeout(resolve, 0));
    if (VoiceTutor.audio?.onended) VoiceTutor.audio.onended();
    await new Promise((resolve) => setTimeout(resolve, 0));

    assert.equal(calls.filter(([name]) => name === 'audio.play').length, 2);
    assert.equal(calls.some(([name]) => name === 'speech.speak'), false);
    assert.equal(VoiceTutor.pendingSpeechText, null);
    assert.equal(VoiceTutor.pendingSpeechBlob, null);
    assert.equal(VoiceTutor.state, 'idle');
});
for (const moduleFile of ['voice-tutor.js', 'voice-tutor-live.js']) {
    test(`${moduleFile} attaches and detaches AvatarTutor around audio playback`, async () => {
        const { calls, FakeAudio, VoiceTutor } = await loadVoiceTutor(moduleFile);

        const playPromise = VoiceTutor.playBlob(new Blob(['audio']), 0);
        await new Promise((resolve) => setTimeout(resolve, 0));

        FakeAudio.last.onended();
        await playPromise;

        const attachCallIndex = calls.findIndex(([name]) => name === 'attachAudio');
        const detachCallIndex = calls.findIndex(([name]) => name === 'detachAudio');

        assert.notEqual(attachCallIndex, -1);
        assert.notEqual(detachCallIndex, -1);
        assert.equal(calls[attachCallIndex][1], FakeAudio.last);
        assert.equal(attachCallIndex < detachCallIndex, true);
    });
}