import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';

async function loadAvatarTutor(overrides = {}) {
    const source = await readFile(new URL('../js/avatar-tutor.js', import.meta.url), 'utf8');
    const listeners = new Map();
    const classListCalls = [];

    const context = {
        console: overrides.console || console,
        setTimeout,
        clearTimeout,
        requestAnimationFrame() {},
        window: {
            WebGLRenderingContext: function WebGLRenderingContext() {},
            addEventListener() {},
            performance: {
                now: () => 0
            },
            ...overrides.window
        },
        document: {
            readyState: 'loading',
            addEventListener(name, handler) {
                listeners.set(name, handler);
            },
            getElementById() {
                return null;
            },
            ...overrides.document
        }
    };
    context.window.window = context.window;
    context.window.document = context.document;

    vm.createContext(context);
    vm.runInContext(source, context);

    return {
        AvatarTutor: context.window.AvatarTutor,
        classListCalls,
        listeners
    };
}

test('AvatarTutor exposes only the bundled front-facing teacher by default', async () => {
    const { AvatarTutor } = await loadAvatarTutor();

    assert.deepEqual(Array.from(AvatarTutor.getAvatarOptions(), (option) => option.id), [
        'downloaded'
    ]);
    assert.deepEqual(Array.from(AvatarTutor.getVrmUrls(0)), ['assets/3114543216632463565.vrm']);
    assert.equal(AvatarTutor.getAvatarProfile(0).rotationY, Math.PI);
});

test('AvatarTutor leaves the video fallback unobstructed while VRM is loading', async () => {
    const stage = { hidden: true };
    const section = { classList: { add() {}, remove() {} } };
    const { AvatarTutor } = await loadAvatarTutor({
        window: {
            location: { protocol: 'http:' }
        },
        document: {
            getElementById(id) {
                return {
                    'teacher-section': section,
                    'teacher-avatar-stage': stage,
                    'teacher-avatar-canvas': { hidden: false },
                    'teacher-avatar-loading': { hidden: false, textContent: '' },
                    'teacher-avatar-switcher': null
                }[id] || null;
            }
        }
    });

    AvatarTutor.load = () => new Promise(() => {});
    AvatarTutor.init();

    assert.equal(stage.hidden, true);
});
test('AvatarTutor keeps non-loading avatar options selectable during loading', async () => {
    const { AvatarTutor } = await loadAvatarTutor();
    const buttons = [0, 1].map((index) => ({
        dataset: { avatarIndex: String(index) },
        disabled: false,
        classList: {
            toggles: [],
            toggle(name, value) {
                this.toggles.push([name, value]);
            }
        },
        attributes: {},
        setAttribute(name, value) {
            this.attributes[name] = value;
        }
    }));

    AvatarTutor.switcher = {
        querySelectorAll() {
            return buttons;
        }
    };
    AvatarTutor.activeAvatarIndex = 0;
    AvatarTutor.loadingAvatarIndex = 0;

    AvatarTutor.updateAvatarSwitcher();

    assert.equal(buttons[0].disabled, true);
    assert.equal(buttons[1].disabled, false);
});
test('AvatarTutor reveals the avatar stage when the initial VRM loads', async () => {
    const loadedScene = {
        rotation: {},
        position: { set() {} },
        updateMatrixWorld() {},
        scale: { setScalar() {} }
    };
    const addedScenes = [];
    const classes = new Set();
    const { AvatarTutor } = await loadAvatarTutor();

    AvatarTutor.stage = { hidden: true };
    AvatarTutor.canvas = { hidden: true };
    AvatarTutor.loading = { hidden: false };
    AvatarTutor.section = {
        classList: {
            add(...names) {
                names.forEach((name) => classes.add(name));
            },
            remove(...names) {
                names.forEach((name) => classes.delete(name));
            }
        }
    };
    AvatarTutor.scene = {
        add(scene) {
            addedScenes.push(scene);
        }
    };
    AvatarTutor.frameVrm = () => {};
    AvatarTutor.applyRestingPose = () => {};
    AvatarTutor.notifyReady = () => {};
    AvatarTutor.resize = () => {};
    AvatarTutor.animate = () => {};

    AvatarTutor.applyLoadedVrm({
        scene: loadedScene,
        userData: {
            vrm: { scene: loadedScene }
        }
    });

    assert.equal(AvatarTutor.stage.hidden, false);
    assert.equal(AvatarTutor.canvas.hidden, false);
    assert.equal(AvatarTutor.loading.hidden, true);
    assert.equal(classes.has('teacher-avatar-ready'), true);
    assert.deepEqual(addedScenes, [loadedScene]);
});
test('AvatarTutor switchAvatar loads the selected VRM source', async () => {
    const loadedUrls = [];
    const removedScenes = [];
    const loadedScene = {
        rotation: {},
        position: { set() {} },
        updateMatrixWorld() {},
        scale: { setScalar() {} }
    };
    const existingScene = {};
    const { AvatarTutor } = await loadAvatarTutor({
        window: {
            TEACHER_VRM_OPTIONS: [
                {
                    id: 'downloaded',
                    url: 'assets/176039414170160856.vrm',
                    rotationY: Math.PI,
                    poseMode: 'vrm0Relaxed'
                },
                {
                    id: 'alternate',
                    url: 'assets/alternate-teacher.vrm'
                }
            ]
        }
    });

    AvatarTutor.ready = true;
    AvatarTutor.running = true;
    AvatarTutor.loader = {};
    AvatarTutor.section = {
        classList: {
            add(...names) {
                names.forEach((name) => AvatarTutor._testClasses.add(name));
            },
            remove(...names) {
                names.forEach((name) => AvatarTutor._testClasses.delete(name));
            }
        }
    };
    AvatarTutor._testClasses = new Set(['teacher-avatar-ready']);
    AvatarTutor.stage = { hidden: true };
    AvatarTutor.canvas = { hidden: false };
    AvatarTutor.loading = { hidden: true, textContent: '' };
    AvatarTutor.fallbackAvatar = {
        hidden: false,
        style: {
            setProperty() {}
        }
    };
    AvatarTutor.scene = {
        add(scene) {
            assert.equal(scene, loadedScene);
        },
        remove(scene) {
            removedScenes.push(scene);
        }
    };
    AvatarTutor.vrm = { scene: existingScene };
    AvatarTutor.frameVrm = () => {};
    AvatarTutor.applyRestingPose = () => {};
    AvatarTutor.loadFirstAvailableVrm = async (_loader, urls) => {
        loadedUrls.push(Array.from(urls));
        return {
            scene: loadedScene,
            userData: {
                vrm: { scene: loadedScene }
            }
        };
    };

    await AvatarTutor.switchAvatar(1);

    assert.deepEqual(loadedUrls, [['assets/alternate-teacher.vrm']]);
    assert.deepEqual(removedScenes, [existingScene]);
    assert.equal(AvatarTutor.activeAvatarIndex, 1);
    assert.equal(AvatarTutor.stage.hidden, false);
    assert.equal(AvatarTutor.canvas.hidden, false);
    assert.equal(AvatarTutor.fallbackAvatar.hidden, true);
});

test('AvatarTutor keeps the current avatar visible when the next avatar fails to load', async () => {
    const removedScenes = [];
    const existingScene = { name: 'current-vrm-scene' };
    const { AvatarTutor } = await loadAvatarTutor({
        console: {
            ...console,
            warn() {}
        },
        window: {
            TEACHER_VRM_OPTIONS: [
                {
                    id: 'downloaded',
                    url: 'assets/176039414170160856.vrm',
                    rotationY: Math.PI,
                    poseMode: 'vrm0Relaxed'
                },
                {
                    id: 'alternate',
                    url: 'assets/alternate-teacher.vrm'
                }
            ]
        }
    });

    AvatarTutor.ready = true;
    AvatarTutor.running = true;
    AvatarTutor.loader = {};
    AvatarTutor.section = {
        classList: {
            add() {},
            remove() {}
        }
    };
    AvatarTutor.canvas = { hidden: false };
    AvatarTutor.loading = { hidden: true, textContent: '' };
    AvatarTutor.fallbackAvatar = {
        hidden: true,
        style: {
            setProperty() {}
        }
    };
    AvatarTutor.scene = {
        remove(scene) {
            removedScenes.push(scene);
        }
    };
    AvatarTutor.vrm = { scene: existingScene };
    AvatarTutor.loadFirstAvailableVrm = async () => {
        throw new Error('selected avatar cannot be parsed');
    };
    AvatarTutor.useFallback = () => {
        throw new Error('fallback should not replace an already visible avatar');
    };

    await AvatarTutor.switchAvatar(1);

    assert.equal(AvatarTutor.vrm.scene, existingScene);
    assert.deepEqual(removedScenes, []);
    assert.equal(AvatarTutor.activeAvatarIndex, 0);
    assert.equal(AvatarTutor.ready, true);
});

test('AvatarTutor keeps a loading state instead of showing the built-in low-poly fallback', async () => {
    const classes = new Set();
    const appended = [];
    const { AvatarTutor } = await loadAvatarTutor({
        document: {
            createElement(tagName) {
                const element = {
                    tagName,
                    className: '',
                    textContent: '',
                    hidden: false,
                    style: { setProperty() {} },
                    appendChild(child) {
                        appended.push(child);
                    }
                };
                return element;
            }
        }
    });

    AvatarTutor.stage = {
        hidden: true,
        appendChild(child) {
            appended.push(child);
        }
    };
    AvatarTutor.canvas = { hidden: false };
    AvatarTutor.loading = { hidden: true, textContent: '' };
    AvatarTutor.section = {
        classList: {
            add(...names) {
                names.forEach((name) => classes.add(name));
            },
            remove(...names) {
                names.forEach((name) => classes.delete(name));
            }
        }
    };
    AvatarTutor.notifyReady = () => {};
    AvatarTutor.animate = () => {};

    AvatarTutor.useFallback(new Error('VRM parse failed'));

    assert.equal(AvatarTutor.stage.hidden, false);
    assert.equal(AvatarTutor.canvas.hidden, true);
    assert.equal(AvatarTutor.loading.hidden, false);
    assert.match(AvatarTutor.loading.textContent, /3D/);
    assert.equal(AvatarTutor.fallbackAvatar, null);
    assert.equal(appended.some((element) => element.className === 'teacher-avatar-fallback'), false);
    assert.equal(classes.has('teacher-avatar-fallback-ready'), false);
    assert.equal(classes.has('teacher-avatar-ready'), false);
    assert.equal(classes.has('teacher-avatar-loading-only'), true);
    assert.equal(AvatarTutor.ready, true);
});

test('AvatarTutor ensureFallbackAvatar does not create a built-in low-poly avatar', async () => {
    const appended = [];
    const { AvatarTutor } = await loadAvatarTutor({
        document: {
            createElement(tagName) {
                return {
                    tagName,
                    className: '',
                    textContent: '',
                    hidden: false,
                    style: { setProperty() {} },
                    appendChild(child) {
                        appended.push(child);
                    }
                };
            }
        }
    });

    AvatarTutor.stage = {
        appendChild(child) {
            appended.push(child);
        }
    };

    AvatarTutor.ensureFallbackAvatar(new Error('forced fallback'));

    assert.equal(AvatarTutor.fallbackAvatar, null);
    assert.equal(appended.some((element) => element.className === 'teacher-avatar-fallback'), false);
});
test('AvatarTutor skips material values with non-function dispose properties', async () => {
    const calls = [];
    const { AvatarTutor } = await loadAvatarTutor();
    const root = {
        traverse(callback) {
            callback({
                geometry: {
                    dispose() {
                        calls.push('geometry');
                    }
                },
                material: {
                    map: {
                        dispose() {
                            calls.push('map');
                        }
                    },
                    userData: {
                        dispose: 'not-a-function'
                    },
                    dispose() {
                        calls.push('material');
                    }
                }
            });
        }
    };

    assert.doesNotThrow(() => AvatarTutor.disposeObject3D(root));
    assert.deepEqual(calls, ['geometry', 'map', 'material']);
});

test('AvatarTutor gives large local VRM models enough time to parse', async () => {
    const { AvatarTutor } = await loadAvatarTutor();

    assert.equal(AvatarTutor.getVrmTimeoutMs('assets/3114543216632463565.vrm'), 90000);
    assert.equal(AvatarTutor.getVrmTimeoutMs('assets/teacher.vrm'), 90000);
    assert.equal(
        AvatarTutor.getVrmTimeoutMs('https://cdn.jsdelivr.net/gh/pixiv/three-vrm@dev/packages/three-vrm/examples/models/VRM1_Constraint_Twist_Sample.vrm'),
        45000
    );
});






