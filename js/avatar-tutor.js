const DEFAULT_LOCAL_VRM_URL = 'assets/teacher.vrm';
const DOWNLOADED_VRM_URL = 'assets/3114543216632463565.vrm';
const DEFAULT_SAMPLE_VRM_URL = 'https://cdn.jsdelivr.net/gh/pixiv/three-vrm@dev/packages/three-vrm/examples/models/VRM1_Constraint_Twist_Sample.vrm';
const DEFAULT_MODULES = {
    three: 'three',
    gltfLoader: 'three/addons/loaders/GLTFLoader.js',
    threeVrm: '@pixiv/three-vrm'
};
const AVATAR_FRAME = {
    targetHeight: 1.82,
    targetCenterY: 0.22,
    cameraY: 0.98,
    cameraDistance: 1.81,
    lookAtY: 0.78
};
const MOUTH_NOISE_FLOOR = 0.018;
const MOUTH_GAIN = 7.6;

const AvatarTutor = {
    stage: null,
    canvas: null,
    loading: null,
    switcher: null,
    section: null,
    renderer: null,
    scene: null,
    camera: null,
    clock: null,
    loader: null,
    VRMUtils: null,
    vrm: null,
    analyser: null,
    audioContext: null,
    audioSource: null,
    audioData: null,
    fallbackAvatar: null,
    mouthOpen: 0,
    targetMouthOpen: 0,
    blinkValue: 0,
    blinkTimer: 1.8,
    fallbackStartedAt: 0,
    vrmBaseY: 0,
    speechGestureMode: 'idle',
    speechGestureStartedAt: 0,
    speechGestureBlend: 0,
    activeAvatarIndex: 0,
    loadingAvatarIndex: null,
    loadSeq: 0,
    resizeHandler: null,
    ready: false,
    running: false,

    init() {
        this.section = document.getElementById('teacher-section');
        this.stage = document.getElementById('teacher-avatar-stage');
        this.canvas = document.getElementById('teacher-avatar-canvas');
        this.loading = document.getElementById('teacher-avatar-loading');
        this.switcher = document.getElementById('teacher-avatar-switcher');

        if (!this.section || !this.stage || !this.canvas) return;

        this.loadingAvatarIndex = this.activeAvatarIndex;
        this.renderAvatarSwitcher();
        if (this.isDirectFileMode()) {
            this.showDirectFileNotice();
            this.loadingAvatarIndex = null;
            this.updateAvatarSwitcher();
            return;
        }
        this.load().catch((error) => {
            console.warn('[AvatarTutor] VRM unavailable, keeping 3D loading state:', error);
            this.useFallback(error);
        });
    },

    async load() {
        const loadId = ++this.loadSeq;
        this.loadingAvatarIndex = this.activeAvatarIndex;
        this.updateAvatarSwitcher();

        if (!window.WebGLRenderingContext) {
            throw new Error('WebGL is not supported');
        }

        const moduleUrls = {
            ...DEFAULT_MODULES,
            ...(window.AVATAR_TUTOR_MODULES || {})
        };

        const [THREE, gltfModule, vrmModule] = await this.withTimeout(
            Promise.all([
                import(moduleUrls.three),
                import(moduleUrls.gltfLoader),
                import(moduleUrls.threeVrm)
            ]),
            'VRM runtime modules'
        );

        const { GLTFLoader } = gltfModule;
        const { VRMLoaderPlugin, VRMUtils } = vrmModule;

        this.THREE = THREE;
        this.VRMUtils = VRMUtils;
        this.clock = new THREE.Clock();
        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            alpha: true,
            antialias: true
        });
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        this.renderer.outputColorSpace = THREE.SRGBColorSpace || this.renderer.outputColorSpace;

        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(28, 1, 0.1, 20);
        this.camera.position.set(0, 0.85, 2.35);
        this.camera.lookAt(0, 0.65, 0);

        const ambient = new THREE.AmbientLight(0xffffff, 0.34);
        const keyLight = new THREE.DirectionalLight(0xffffff, 0.62);
        keyLight.position.set(1.6, 2.2, 2.4);
        const fillLight = new THREE.DirectionalLight(0x7dd3fc, 0.18);
        fillLight.position.set(-2, 1.4, 1.8);
        this.scene.add(ambient, keyLight, fillLight);

        const loader = new GLTFLoader();
        loader.register((parser) => new VRMLoaderPlugin(parser));
        this.loader = loader;

        try {
            const gltf = await this.loadFirstAvailableVrm(loader, this.getVrmUrls(this.activeAvatarIndex));
            if (loadId !== this.loadSeq) return;
            this.applyLoadedVrm(gltf);
        } finally {
            if (loadId === this.loadSeq) {
                this.loadingAvatarIndex = null;
                this.updateAvatarSwitcher();
            }
        }
    },

    getAvatarOptions() {
        const configuredOptions = Array.isArray(window.TEACHER_VRM_OPTIONS)
            ? window.TEACHER_VRM_OPTIONS
                .map((option, index) => this.normalizeAvatarOption(option, index))
                .filter(Boolean)
            : [];

        if (configuredOptions.length > 0) return configuredOptions;

        const bundledTeacherUrl = String(window.TEACHER_VRM_URL || DOWNLOADED_VRM_URL).trim() || DOWNLOADED_VRM_URL;

        return [
            {
                id: 'downloaded',
                label: '1',
                title: '\u65b0\u8001\u5e08',
                urls: [bundledTeacherUrl],
                profile: {
                    rotationY: Math.PI,
                    poseMode: 'vrm1Relaxed'
                }
            }
        ];
    },
    normalizeAvatarOption(option, index) {
        if (!option) return null;
        const urls = Array.isArray(option.urls)
            ? option.urls
            : [option.url || option.vrmUrl].filter(Boolean);
        const cleanUrls = urls.map((url) => String(url || '').trim()).filter(Boolean);
        if (cleanUrls.length === 0) return null;

        return {
            id: String(option.id || `avatar-${index + 1}`),
            label: String(option.label || index + 1),
            title: String(option.title || option.name || `\u8001\u5e08 ${index + 1}`),
            urls: cleanUrls,
            profile: {
                rotationY: Number(option.rotationY || option.profile?.rotationY || 0),
                poseMode: String(option.poseMode || option.profile?.poseMode || 'guided')
            }
        };
    },

    getVrmUrls(index = this.activeAvatarIndex) {
        const options = this.getAvatarOptions();
        return options[index]?.urls || options[0]?.urls || [];
    },

    getAvatarProfile(index = this.activeAvatarIndex) {
        const options = this.getAvatarOptions();
        return {
            rotationY: 0,
            poseMode: 'guided',
            ...(options[index]?.profile || {})
        };
    },

    renderAvatarSwitcher() {
        if (!this.switcher) return;
        const options = this.getAvatarOptions();
        this.switcher.hidden = options.length <= 1;
        this.switcher.textContent = '';

        options.forEach((option, index) => {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'teacher-avatar-option';
            button.dataset.avatarIndex = String(index);
            button.title = option.title;
            button.setAttribute('aria-label', `\u5207\u6362\u5230${option.title}`);
            button.innerHTML = `<i class="fas fa-user"></i><span>${option.label}</span>`;
            button.addEventListener('click', () => this.switchAvatar(index));
            this.switcher.appendChild(button);
        });

        this.updateAvatarSwitcher();
    },

    updateAvatarSwitcher() {
        if (!this.switcher) return;
        this.switcher.querySelectorAll('[data-avatar-index]').forEach((button) => {
            const index = Number(button.dataset.avatarIndex);
            button.classList.toggle('active', index === this.activeAvatarIndex);
            button.classList.toggle('loading', index === this.loadingAvatarIndex);
            button.disabled = index === this.loadingAvatarIndex;
            button.setAttribute('aria-pressed', String(index === this.activeAvatarIndex));
        });
    },

    async switchAvatar(index) {
        const options = this.getAvatarOptions();
        const nextIndex = Number(index);
        if (!Number.isInteger(nextIndex) || !options[nextIndex]) return;
        if (nextIndex === this.activeAvatarIndex && this.ready && this.vrm) return;
        if (!this.loader) {
            this.activeAvatarIndex = nextIndex;
            this.loadingAvatarIndex = nextIndex;
            this.updateAvatarSwitcher();
            return;
        }

        const previousIndex = this.activeAvatarIndex;
        const hasCurrentVrm = Boolean(this.vrm);
        const loadId = ++this.loadSeq;
        this.loadingAvatarIndex = nextIndex;
        this.detachAudio();
        this.updateAvatarSwitcher();

        if (this.stage) this.stage.hidden = false;
        if (this.canvas) this.canvas.hidden = false;
        if (this.loading) {
            this.loading.hidden = false;
            this.loading.textContent = `${options[nextIndex].title}\u52a0\u8f7d\u4e2d`;
        }

        try {
            const gltf = await this.loadFirstAvailableVrm(this.loader, this.getVrmUrls(nextIndex));
            if (loadId !== this.loadSeq) return;
            this.activeAvatarIndex = nextIndex;
            this.applyLoadedVrm(gltf);
        } catch (error) {
            if (loadId !== this.loadSeq) return;
            console.warn('[AvatarTutor] Avatar switch failed:', error);
            if (hasCurrentVrm) {
                this.activeAvatarIndex = previousIndex;
                this.ready = true;
                if (this.loading) this.loading.hidden = true;
            } else {
                this.useFallback(error);
            }
        } finally {
            if (loadId === this.loadSeq) {
                this.loadingAvatarIndex = null;
                this.updateAvatarSwitcher();
            }
        }
    },

    async loadFirstAvailableVrm(loader, urls) {
        let lastError;

        for (const url of urls) {
            try {
                if (this.loading) {
                    this.loading.textContent = url === DEFAULT_SAMPLE_VRM_URL
                        ? '\u6b63\u5728\u52a0\u8f7d\u793a\u4f8b VRM'
                        : '3D\u8001\u5e08\u52a0\u8f7d\u4e2d';
                }
                const timeoutMs = this.getVrmTimeoutMs(url);
                return await this.withTimeout(loader.loadAsync(url), `teacher VRM model: ${url}`, timeoutMs);
            } catch (error) {
                lastError = error;
                console.warn(`[AvatarTutor] VRM candidate failed: ${url}`, error);
            }
        }

        throw lastError || new Error('No VRM model URL is available');
    },

    getVrmTimeoutMs(url) {
        return url === DEFAULT_SAMPLE_VRM_URL ? 45000 : 90000;
    },

    isDirectFileMode() {
        return window.location?.protocol === 'file:';
    },

    showDirectFileNotice() {
        if (this.stage) this.stage.hidden = false;
        if (this.canvas) this.canvas.hidden = true;
        if (this.loading) {
            this.loading.hidden = false;
            this.loading.textContent = '\u8bf7\u8fd0\u884c start.bat \u540e\u6253\u5f00 http://localhost:8000/app.html';
        }
        if (this.switcher) {
            this.switcher.hidden = false;
            this.switcher.querySelectorAll('[data-avatar-index]').forEach((button) => {
                button.disabled = true;
                button.title = '\u8bf7\u901a\u8fc7\u672c\u5730\u670d\u52a1\u6253\u5f00\u540e\u5207\u6362\u5f62\u8c61';
            });
        }
        if (this.section) {
            this.section.classList.add('teacher-avatar-direct-file');
        }
    },

    applyLoadedVrm(gltf) {
        this.VRMUtils?.removeUnnecessaryVertices?.(gltf.scene);
        this.VRMUtils?.removeUnnecessaryJoints?.(gltf.scene);

        const nextVrm = gltf.userData.vrm;
        if (!nextVrm) throw new Error('Loaded file does not contain VRM data');

        this.clearCurrentVrm();
        this.vrm = nextVrm;
        this.vrm.scene.rotation.y = this.getAvatarProfile().rotationY;
        this.vrm.scene.position.set(0, 0, 0);
        this.scene.add(this.vrm.scene);
        this.frameVrm();
        this.applyRestingPose(0);

        if (this.fallbackAvatar) this.fallbackAvatar.hidden = true;
        if (this.stage) this.stage.hidden = false;
        if (this.canvas) this.canvas.hidden = false;
        this.ready = true;
        if (this.section) {
            this.section.classList.add('teacher-avatar-ready');
            this.section.classList.remove('teacher-avatar-fallback-ready', 'teacher-avatar-loading-only');
        }
        this.notifyReady();
        if (this.loading) this.loading.hidden = true;

        if (!this.resizeHandler) {
            this.resizeHandler = () => this.resize();
            window.addEventListener('resize', this.resizeHandler);
        }
        this.resize();

        const shouldStartLoop = !this.running;
        this.running = true;
        if (shouldStartLoop) this.animate();
    },

    clearCurrentVrm() {
        if (!this.vrm?.scene) return;
        if (this.scene) this.scene.remove(this.vrm.scene);
        this.disposeObject3D(this.vrm.scene);
        this.vrm = null;
        this.mouthOpen = 0;
        this.targetMouthOpen = 0;
    },

    disposeObject3D(root) {
        root?.traverse?.((object) => {
            if (typeof object.geometry?.dispose === 'function') {
                object.geometry.dispose();
            }
            const materials = Array.isArray(object.material) ? object.material : [object.material];
            materials.filter(Boolean).forEach((material) => {
                Object.values(material).forEach((value) => {
                    if (typeof value?.dispose === 'function') {
                        value.dispose();
                    }
                });
                if (typeof material.dispose === 'function') {
                    material.dispose();
                }
            });
        });
    },

    frameVrm() {
        if (!this.vrm || !this.THREE || !this.camera) return;

        this.vrm.scene.updateMatrixWorld(true);
        const box = new this.THREE.Box3().setFromObject(this.vrm.scene);
        const size = box.getSize(new this.THREE.Vector3());
        const center = box.getCenter(new this.THREE.Vector3());
        const targetHeight = AVATAR_FRAME.targetHeight;

        if (Number.isFinite(size.y) && size.y > 0) {
            const scale = targetHeight / size.y;
            this.vrm.scene.scale.setScalar(scale);
            this.vrm.scene.updateMatrixWorld(true);
        }

        const framedBox = new this.THREE.Box3().setFromObject(this.vrm.scene);
        const framedCenter = framedBox.getCenter(new this.THREE.Vector3());
        const targetCenterY = AVATAR_FRAME.targetCenterY;

        this.vrm.scene.position.x += -framedCenter.x;
        this.vrm.scene.position.y += targetCenterY - framedCenter.y;
        this.vrm.scene.position.z += -framedCenter.z;
        this.vrmBaseY = this.vrm.scene.position.y;

        this.camera.position.set(0, AVATAR_FRAME.cameraY, AVATAR_FRAME.cameraDistance);
        this.camera.lookAt(0, AVATAR_FRAME.lookAtY, 0);
    },

    withTimeout(promise, label, timeoutMs = 12000) {
        let timeoutId;
        const timeout = new Promise((_, reject) => {
            timeoutId = setTimeout(() => reject(new Error(`${label} load timed out`)), timeoutMs);
        });

        return Promise.race([promise, timeout]).finally(() => clearTimeout(timeoutId));
    },

    useFallback() {
        if (this.stage) this.stage.hidden = false;
        if (this.canvas) this.canvas.hidden = true;
        if (this.fallbackAvatar) {
            this.fallbackAvatar.hidden = true;
            this.fallbackAvatar.remove?.();
            this.fallbackAvatar = null;
        }
        if (this.loading) {
            this.loading.hidden = false;
            this.loading.textContent = '3D\u5f62\u8c61\u52a0\u8f7d\u4e2d\uff0c\u8bf7\u7a0d\u5019...';
        }
        if (this.section) {
            this.section.classList.add('teacher-avatar-loading-only');
            this.section.classList.remove('teacher-avatar-ready', 'teacher-avatar-fallback-ready');
        }

        this.vrm = null;
        this.ready = true;
        this.notifyReady();
        this.fallbackStartedAt = 0;
        this.running = false;
    },

    notifyReady() {
        const EventClass = window.CustomEvent || window.Event;
        if (typeof EventClass !== 'function') return;
        window.dispatchEvent?.(new EventClass('avatar-tutor-ready'));
    },

    ensureFallbackAvatar(error) {
        if (this.fallbackAvatar || !this.stage) return;

        const root = document.createElement('div');
        root.className = 'teacher-avatar-fallback';
        root.style.setProperty('--avatar-mouth', '0.000');
        root.style.setProperty('--avatar-mouth-scale', '0.250');
        root.style.setProperty('--avatar-eye-scale', '1.000');
        root.style.setProperty('--avatar-breath', '0.000');

        const figure = document.createElement('div');
        figure.className = 'teacher-avatar-fallback-figure';

        const glow = document.createElement('div');
        glow.className = 'teacher-avatar-fallback-glow';

        const head = document.createElement('div');
        head.className = 'teacher-avatar-fallback-head';

        const hair = document.createElement('div');
        hair.className = 'teacher-avatar-fallback-hair';

        const face = document.createElement('div');
        face.className = 'teacher-avatar-fallback-face';

        const leftEye = document.createElement('div');
        leftEye.className = 'teacher-avatar-fallback-eye left';

        const rightEye = document.createElement('div');
        rightEye.className = 'teacher-avatar-fallback-eye right';

        const mouth = document.createElement('div');
        mouth.className = 'teacher-avatar-fallback-mouth';

        const torso = document.createElement('div');
        torso.className = 'teacher-avatar-fallback-torso';

        const collar = document.createElement('div');
        collar.className = 'teacher-avatar-fallback-collar';

        const note = document.createElement('div');
        note.className = 'teacher-avatar-fallback-note';
        const errorMessage = String(error?.message || '');
        note.textContent = /teacher\.vrm|404|Not Found/i.test(errorMessage)
            ? '\u672a\u627e\u5230 VRM: assets/teacher.vrm'
            : '\u5185\u7f6e 3D \u8001\u5e08';

        face.appendChild(leftEye);
        face.appendChild(rightEye);
        face.appendChild(mouth);
        head.appendChild(hair);
        head.appendChild(face);
        torso.appendChild(collar);
        figure.appendChild(glow);
        figure.appendChild(head);
        figure.appendChild(torso);
        root.appendChild(figure);
        root.appendChild(note);
        this.stage.appendChild(root);

        this.fallbackAvatar = root;
    },

    disable() {
        this.ready = false;
        this.running = false;
        this.detachAudio();
        if (this.section) {
            this.section.classList.remove('teacher-avatar-ready', 'teacher-avatar-fallback-ready', 'teacher-avatar-loading-only');
        }
        if (this.stage) this.stage.hidden = true;
        if (this.fallbackAvatar) this.fallbackAvatar.hidden = true;
    },

    attachAudio(audio) {
        this.detachAudio({ keepSpeechGesture: true });
        if (!audio || !this.ready) return;

        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (!AudioContextClass) return;

        try {
            this.audioContext = this.audioContext || new AudioContextClass();
            this.audioSource = this.audioContext.createMediaElementSource(audio);
            this.analyser = this.audioContext.createAnalyser();
            this.analyser.fftSize = 512;
            this.audioData = new Uint8Array(this.analyser.frequencyBinCount);
            this.audioSource.connect(this.analyser);
            this.analyser.connect(this.audioContext.destination);
            this.audioContext.resume?.();
        } catch (error) {
            console.warn('[AvatarTutor] Audio analysis unavailable:', error);
            this.detachAudio();
        }
    },

    detachAudio(options = {}) {
        try {
            this.audioSource?.disconnect();
            this.analyser?.disconnect();
        } catch {
            // Nodes may already be disconnected by the browser.
        }
        this.audioSource = null;
        this.analyser = null;
        this.audioData = null;
        if (!options.keepSpeechGesture) {
            this.stopSpeech();
        }
    },

    prepareSpeech() {
        if (!this.ready) return;
        this.speechGestureMode = 'preparing';
        this.speechGestureStartedAt = this.nowSeconds();
        this.setMouthOpen(0.2);
    },

    startSpeech() {
        if (!this.ready) return;
        this.speechGestureMode = 'speaking';
        this.speechGestureStartedAt = this.nowSeconds();
    },

    cancelSpeechPreparation() {
        if (this.speechGestureMode !== 'preparing') return;
        this.stopSpeech();
    },

    stopSpeech() {
        this.speechGestureMode = 'idle';
        this.setMouthOpen(0);
    },

    nowSeconds() {
        return (window.performance?.now?.() || Date.now()) / 1000;
    },

    setMouthOpen(value) {
        this.targetMouthOpen = Math.max(0, Math.min(1, Number(value) || 0));
        this.updateFallbackExpression(this.targetMouthOpen);
    },

    resize() {
        if (!this.renderer || !this.camera || !this.stage) return;
        const rect = this.stage.getBoundingClientRect();
        const width = Math.max(1, Math.floor(rect.width));
        const height = Math.max(1, Math.floor(rect.height));
        this.renderer.setSize(width, height, false);
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
    },

    animate() {
        if (!this.running) return;
        requestAnimationFrame(() => this.animate());

        const delta = Math.min(this.clock?.getDelta?.() || 0.016, 0.05);
        const elapsed = this.clock?.elapsedTime || ((Date.now() - this.fallbackStartedAt) / 1000);
        this.updateAudioMouth();
        this.updatePreparedMouth(elapsed);
        this.updateIdleMotion(delta, elapsed);
        this.updateFallbackMotion(elapsed);
        this.applyExpressions(delta);

        this.vrm?.update?.(delta);
        if (this.renderer && this.scene && this.camera) {
            this.renderer.render(this.scene, this.camera);
        }
    },

    updateAudioMouth() {
        if (!this.analyser || !this.audioData) return;

        this.analyser.getByteTimeDomainData(this.audioData);
        let sum = 0;
        for (const sample of this.audioData) {
            const normalized = (sample - 128) / 128;
            sum += normalized * normalized;
        }
        const rms = Math.sqrt(sum / this.audioData.length);
        this.setMouthOpen(Math.max(0, Math.min(1, (rms - MOUTH_NOISE_FLOOR) * MOUTH_GAIN)));
    },

    updatePreparedMouth(elapsed) {
        if ((this.speechGestureMode !== 'preparing' && this.speechGestureMode !== 'speaking') || this.analyser) return;
        const warmup = 0.1 + Math.max(0, Math.sin(elapsed * 5.8)) * 0.12;
        this.setMouthOpen(warmup);
    },

    updateIdleMotion(delta, elapsed) {
        if (!this.vrm) return;

        this.blinkTimer -= delta;
        if (this.blinkTimer <= 0) {
            this.blinkValue = 1;
            this.blinkTimer = 2.2 + Math.random() * 2.4;
        }
        this.blinkValue = Math.max(0, this.blinkValue - delta * 7);

        const breath = Math.sin(elapsed * 1.8) * 0.012;
        this.vrm.scene.position.y = this.vrmBaseY + breath;

        this.applyRestingPose(elapsed, delta);
        this.applyTorsoIdleMotion(elapsed);

        const head = this.vrm.humanoid?.getNormalizedBoneNode?.('head');
        if (head) {
            const speechBlend = this.speechGestureBlend;
            const nod = Math.sin(elapsed * 2.4) * 0.028 * speechBlend;
            const tilt = Math.sin(elapsed * 1.3 + 0.5) * 0.02 * speechBlend;
            head.rotation.y = Math.sin(elapsed * 0.42) * 0.045 + tilt;
            head.rotation.x = Math.sin(elapsed * 0.36) * 0.022 + speechBlend * 0.03 + nod;
        }
    },

    applyTorsoIdleMotion(elapsed) {
        const spine = this.vrm?.humanoid?.getNormalizedBoneNode?.('spine');
        if (spine) {
            spine.rotation.x = Math.sin(elapsed * 0.52) * 0.008;
            spine.rotation.y = Math.sin(elapsed * 0.34) * 0.018;
        }

        const chest = this.vrm?.humanoid?.getNormalizedBoneNode?.('chest')
            || this.vrm?.humanoid?.getNormalizedBoneNode?.('upperChest');
        if (chest) {
            chest.rotation.x = Math.sin(elapsed * 0.48 + 0.4) * 0.01;
            chest.rotation.y = Math.sin(elapsed * 0.31 + 0.8) * 0.014;
        }
    },

    applyRestingPose(elapsed = 0, delta = 0.016) {
        const poseMode = this.getAvatarProfile().poseMode;
        const sway = Math.sin(elapsed * 0.8) * 0.018;
        const isSpeechGesture = this.speechGestureMode === 'preparing' || this.speechGestureMode === 'speaking';
        const tempo = this.speechGestureMode === 'speaking' ? 3.1 : 1.9;

        if (poseMode === 'native') return;

        const targetBlend = isSpeechGesture ? 1 : 0;
        const blendSpeed = isSpeechGesture ? 3.2 : 1.6;
        this.speechGestureBlend += (targetBlend - this.speechGestureBlend) * Math.min(1, delta * blendSpeed);
        if (Math.abs(this.speechGestureBlend - targetBlend) < 0.002) {
            this.speechGestureBlend = targetBlend;
        }
        const speechBlend = this.speechGestureBlend;
        const gestureAmount = speechBlend * (this.speechGestureMode === 'speaking' ? 0.12 : 0.08);
        const gesture = Math.sin(elapsed * tempo);
        const leftExplain = Math.sin(elapsed * tempo + Math.PI) * gestureAmount;
        const rightExplain = gesture * gestureAmount;
        const openClose = Math.sin(elapsed * tempo * 0.5) * speechBlend * 0.45;

        if (poseMode === 'vrm1Relaxed') {
            // VRM1.0 归一化骨骼：上臂 Z 轴符号与 VRM0 相反，正值让手臂自然下垂贴身。
            // 讲解姿势：左手始终自然下垂；右手偶尔抬起做手势、随后回落，与下垂交替。
            const idleSway = Math.sin(elapsed * 0.8) * 0.02;

            // 左手：始终自然下垂，仅极轻微呼吸摆动，不随讲话上抬。
            this.setBoneRotation('leftUpperArm', 0.05, 0.0, 1.28 + idleSway);
            this.setBoneRotation('leftLowerArm', 0.0, -0.06, 0.12);
            this.setBoneRotation('leftHand', 0.0, 0.0, 0.0);

            // 右手：手势包络 g 在 0（下垂）与 1（抬起）之间缓慢起伏，半个周期归零，
            // 形成"抬起讲解→放下"的交替；乘 speechBlend 使其只在讲话时出现并平滑淡入淡出。
            const g = Math.max(0, Math.sin(elapsed * 1.15)) * speechBlend;
            const gWave = Math.sin(elapsed * tempo * 1.4) * g;

            this.setBoneRotation('rightUpperArm', 0.05 + g * 0.26, -0.12 * g, -1.28 + g * 0.42 + idleSway);
            this.setBoneRotation('rightLowerArm', 0.0, 0.06 + g * 0.9 + gWave * 0.12, -0.12 - g * 0.24);
            this.setBoneRotation('rightHand', -0.08 * g, 0.14 * g, 0.1 * g + gWave * 0.08);
            return;
        }

        if (poseMode === 'vrm0Relaxed') {
            const lerp = (rest, speak) => rest + (speak - rest) * speechBlend;
            const wave = Math.sin(elapsed * tempo) * speechBlend;
            const waveAlt = Math.sin(elapsed * tempo + Math.PI * 0.55) * speechBlend;
            const waveSlow = Math.sin(elapsed * tempo * 0.5 + 0.7) * speechBlend;

            this.setBoneRotation(
                'leftUpperArm',
                lerp(0.12, 0.42) + waveSlow * 0.03,
                lerp(0.0, -0.1),
                lerp(-1.25, -0.98) - sway * 0.4 + wave * 0.05
            );
            this.setBoneRotation(
                'rightUpperArm',
                lerp(0.12, 0.42) - waveSlow * 0.03,
                lerp(0.0, 0.1),
                lerp(1.25, 0.98) + sway * 0.4 - waveAlt * 0.05
            );
            this.setBoneRotation(
                'leftLowerArm',
                lerp(0.0, -0.1),
                lerp(0.05, 1.05) + wave * 0.14,
                lerp(-0.1, -0.32) + wave * 0.08
            );
            this.setBoneRotation(
                'rightLowerArm',
                lerp(0.0, -0.1),
                lerp(-0.05, -1.05) - waveAlt * 0.14,
                lerp(0.1, 0.32) - waveAlt * 0.08
            );
            this.setBoneRotation('leftHand', lerp(0.0, -0.12), lerp(0.0, 0.16) + wave * 0.08, wave * 0.1);
            this.setBoneRotation('rightHand', lerp(0.0, -0.12), lerp(0.0, -0.16) - waveAlt * 0.08, -waveAlt * 0.1);
            return;
        }

        this.setBoneRotation('leftUpperArm', 0.14 + speechBlend * 0.04, 0.03 + speechBlend * 0.07, -1.02 - sway * 0.35);
        this.setBoneRotation('rightUpperArm', 0.14 + speechBlend * 0.04, -0.03 - speechBlend * 0.07, 1.02 + sway * 0.35);
        this.setBoneRotation('leftLowerArm', -0.14 - speechBlend * 0.08, 0.16 + speechBlend * (0.18 + openClose * 0.04), -0.12 + speechBlend * 0.22 + leftExplain * 0.42);
        this.setBoneRotation('rightLowerArm', -0.14 - speechBlend * 0.08, -0.16 - speechBlend * (0.18 + openClose * 0.04), 0.12 - speechBlend * 0.22 + rightExplain * 0.42);
        this.setBoneRotation('leftHand', 0.02, speechBlend * (0.1 + openClose * 0.04), 0.02 + leftExplain * 0.24);
        this.setBoneRotation('rightHand', 0.02, -speechBlend * (0.1 + openClose * 0.04), -0.02 + rightExplain * 0.24);
    },

    setBoneRotation(name, x, y, z) {
        const bone = this.vrm?.humanoid?.getNormalizedBoneNode?.(name);
        if (!bone) return;
        bone.rotation.x = x;
        bone.rotation.y = y;
        bone.rotation.z = z;
    },

    applyExpressions(delta) {
        this.mouthOpen += (this.targetMouthOpen - this.mouthOpen) * Math.min(1, delta * 16);
        this.setExpression(['aa', 'A', 'mouthOpen'], this.mouthOpen);
        this.setExpression(['ih', 'ee', 'ou', 'oh', 'I', 'E', 'U', 'O'], 0);
        this.setExpression(['blink', 'Blink'], this.blinkValue);
        this.updateFallbackExpression(this.mouthOpen);
    },

    updateFallbackMotion(elapsed) {
        if (!this.fallbackAvatar) return;
        const breath = Math.sin(elapsed * 1.8) * 8;
        this.fallbackAvatar.style.setProperty('--avatar-breath', breath.toFixed(3));
    },

    updateFallbackExpression(mouthValue = this.mouthOpen) {
        if (!this.fallbackAvatar) return;
        const mouth = Math.max(0, Math.min(1, Number(mouthValue) || 0));
        const mouthScale = 0.25 + mouth * 1.9;
        const eyeScale = 1 - Math.max(0, Math.min(1, this.blinkValue)) * 0.82;
        this.fallbackAvatar.style.setProperty('--avatar-mouth', mouth.toFixed(3));
        this.fallbackAvatar.style.setProperty('--avatar-mouth-scale', mouthScale.toFixed(3));
        this.fallbackAvatar.style.setProperty('--avatar-eye-scale', eyeScale.toFixed(3));
    },

    setExpression(names, value) {
        const expressionManager = this.vrm?.expressionManager;
        const blendShapeProxy = this.vrm?.blendShapeProxy;

        for (const name of names) {
            try {
                expressionManager?.setValue?.(name, value);
                blendShapeProxy?.setValue?.(name, value);
            } catch {
                // VRM models expose different expression presets; unsupported names are harmless.
            }
        }
    }
};

window.AvatarTutor = AvatarTutor;

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => AvatarTutor.init(), { once: true });
} else {
    AvatarTutor.init();
}



