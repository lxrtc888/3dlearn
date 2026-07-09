/**
 * SceneLoader - 场景脚本按需加载器
 * 目标：首屏不加载 45+ 场景脚本，仅在用户点击场景时加载对应文件
 */
(function () {
    const SCENE_ASSET_MAP = {
        attention: ['scenes/attention-scene.js'],
        quantum: ['scenes/quantum-scene.js'],
        hydraulic: ['scenes/hydraulic-scene.js'],
        engine: ['scenes/engine-scene.js'],
        pendulum: ['scenes/pendulum-scene.js'],
        electromagnetic: ['scenes/electromagnetic-scene.js'],
        'circuit-ohm': ['scenes/circuit-ohm-scene.js'],
        cell: ['scenes/cell-scene.js'],
        dna: ['scenes/dna-scene.js'],
        vector3d: ['scenes/vector3d-scene.js'],
        conic: ['scenes/conic-scene.js'],
        'quadratic-function': ['scenes/quadratic-function-scene.js'],
        drumflower: ['scenes/drum-flower-scene.js'],
        flagellar: ['scenes/flagellar-scene.js'],
        gravity: ['scenes/gravity-scene.js'],
        nuclearfission: ['scenes/nuclear-fission-scene.js'],
        migdal: ['scenes/migdal-scene.js'],
        schrodinger: ['scenes/schrodinger-cat-scene.js'],
        tesseract: ['scenes/tesseract-scene.js'],
        photosynthesis: ['scenes/photosynthesis-scene.js'],
        gradientdescent: ['scenes/gradient-descent-scene.js'],
        neuronsignal: ['scenes/neuron-signal-scene.js'],
        sorting: ['scenes/sorting-scene.js'],
        kmeans: ['scenes/kmeans-scene.js'],
        maze: ['scenes/maze-scene.js'],
        entanglement: ['scenes/quantum-entanglement-scene.js'],
        orbital: ['scenes/orbital-mechanics-scene.js'],
        klein: ['scenes/klein-bottle-scene.js'],
        euler: ['scenes/euler-formula-scene.js'],
        fourier: ['scenes/fourier-scene.js'],
        'three-body': ['scenes/three-body-scene.js'],
        mandelbrot: ['scenes/mandelbrot-scene.js'],
        'sir-model': ['scenes/sir-model-scene.js'],
        'dimensional-strike': ['scenes/dimensional-strike-scene.js'],
        boids: ['scenes/boids-scene.js'],
        doppler: ['scenes/doppler-effect-scene.js'],
        entropy: ['scenes/entropy-scene.js'],
        traffic: ['scenes/traffic-flow-scene.js'],
        'golden-spiral': ['scenes/golden-spiral-scene.js'],
        'prisoners-dilemma': ['scenes/prisoners-dilemma-scene.js'],
        'plato-cave': ['scenes/plato-cave-scene.js'],
        lorenz: ['scenes/lorenz-attractor-scene.js'],
        'game-of-life': ['scenes/game-of-life-scene.js'],
        'six-degrees': ['scenes/six-degrees-scene.js'],
        'herd-behavior': ['scenes/herd-behavior-scene.js'],
        'compound-interest': ['scenes/compound-interest-scene.js'],
        'tragedy-of-commons': ['scenes/tragedy-of-commons-scene.js'],
        'husky-battle': ['scenes/husky-battle-scene.js'],
        'geometry-problem': ['scenes/geometry-problem-scene.js'],
        'solid-geometry': ['scenes/solid-geometry-scene.js'],
        smartmine: ['data/mine-mock-data.js', 'scenes/smart-mine-scene.js']
    };

    const loadedAssets = new Set();
    const loadingPromises = new Map();

    function loadScript(src, retries = 1) {
        if (loadedAssets.has(src)) {
            return Promise.resolve();
        }

        if (loadingPromises.has(src)) {
            return loadingPromises.get(src);
        }

        const promise = new Promise((resolve, reject) => {
            const attemptLoad = (remainingRetries) => {
                const script = document.createElement('script');
                script.src = `${src}?v=lazy1`;
                script.async = true;
                script.onload = () => {
                    loadedAssets.add(src);
                    loadingPromises.delete(src);
                    resolve();
                };
                script.onerror = () => {
                    script.remove();
                    if (remainingRetries > 0) {
                        setTimeout(() => attemptLoad(remainingRetries - 1), 220);
                    } else {
                        loadingPromises.delete(src);
                        reject(new Error(`脚本加载失败: ${src}`));
                    }
                };
                document.body.appendChild(script);
            };

            attemptLoad(retries);
        });

        loadingPromises.set(src, promise);
        return promise;
    }

    async function ensureSceneLoaded(caseConfig) {
        if (!caseConfig || caseConfig.type !== 'scene') return;

        const assets = SCENE_ASSET_MAP[caseConfig.id];
        if (!assets || assets.length === 0) return;

        for (const asset of assets) {
            await loadScript(asset, 1);
        }
    }

    async function preloadCases(caseIds = []) {
        for (const caseId of caseIds) {
            const assets = SCENE_ASSET_MAP[caseId];
            if (!assets || assets.length === 0) continue;
            for (const asset of assets) {
                // 预加载失败不阻断主流程
                try {
                    await loadScript(asset, 0);
                } catch (error) {
                    console.warn('[SceneLoader] 预加载失败:', asset, error.message);
                }
            }
        }
    }

    function isSceneReady(caseId) {
        const assets = SCENE_ASSET_MAP[caseId] || [];
        if (assets.length === 0) return true;
        return assets.every(asset => loadedAssets.has(asset));
    }

    window.SceneLoader = {
        ensureSceneLoaded,
        preloadCases,
        isSceneReady
    };
})();
