/**
 * 动物细胞结构场景 - 细胞器可视化
 * ============================================
 * 核心知识点：
 * - 细胞膜：选择透过性
 * - 细胞核：遗传信息中心
 * - 线粒体：能量工厂
 * - 内质网：蛋白质合成与运输
 * ============================================
 */
window.CellScene = class CellScene {
    constructor(scene, camera, renderer) {
        this.scene = scene;
        this.camera = camera;
        this.renderer = renderer;
        
        this.mainGroup = null;
        this.interactables = [];
        this.highlighted = null;
        
        // 细胞组件
        this.cellMembrane = null;
        this.nucleus = null;
        this.mitochondria = [];
        this.endoplasmicReticulum = null;
        this.golgiApparatus = null;
        this.ribosomes = [];
        this.lysosomes = [];
        
        this.isAutoPlaying = false;
        this.defaultCameraPos = { x: 0, y: 5, z: 25 };
    }

    init() {
        this.camera.position.set(0, 5, 25);
        this.camera.lookAt(0, 0, 0);
        
        this.scene.background = new THREE.Color(0x0a1520);
        this.scene.fog = new THREE.FogExp2(0x0a1520, 0.008);
        
        this.setupLights();
        this.setupScene();
        this.setupUI();
    }

    setupLights() {
        const ambient = new THREE.AmbientLight(0x405060, 0.8);
        this.scene.add(ambient);
        
        const mainLight = new THREE.DirectionalLight(0xffffff, 0.6);
        mainLight.position.set(10, 15, 10);
        this.scene.add(mainLight);
        
        // 细胞内部发光效果
        const innerLight = new THREE.PointLight(0x88ccff, 1, 20);
        innerLight.position.set(0, 0, 0);
        this.scene.add(innerLight);
    }

    setupScene() {
        this.mainGroup = new THREE.Group();
        this.scene.add(this.mainGroup);
        
        // 创建细胞膜（半透明球体）
        this.createCellMembrane();
        
        // 创建细胞核
        this.createNucleus();
        
        // 创建线粒体
        this.createMitochondria();
        
        // 创建内质网
        this.createEndoplasmicReticulum();
        
        // 创建高尔基体
        this.createGolgiApparatus();
        
        // 创建核糖体
        this.createRibosomes();
        
        // 创建溶酶体
        this.createLysosomes();
        
        // 创建细胞质（粒子效果）
        this.createCytoplasm();
    }

    createCellMembrane() {
        const geometry = new THREE.SphereGeometry(10, 64, 64);
        const material = new THREE.MeshPhysicalMaterial({
            color: 0x88aacc,
            transparent: true,
            opacity: 0.25,
            roughness: 0.1,
            metalness: 0.1,
            clearcoat: 1,
            clearcoatRoughness: 0.1,
            side: THREE.DoubleSide
        });
        
        this.cellMembrane = new THREE.Mesh(geometry, material);
        this.cellMembrane.userData = {
            hoverTitle: '细胞膜',
            hoverDesc: '选择透过性屏障',
            hoverIcon: 'fa-circle',
            name: '细胞膜',
            description: `
                <p class="text-lg font-bold text-blue-400 mb-3">🔵 细胞膜</p>
                <p class="text-gray-300 mb-3">由磷脂双分子层和蛋白质组成，具有选择透过性。</p>
                <div class="bg-gray-800 rounded p-3 mb-3">
                    <p class="text-sm text-white mb-1">主要功能：</p>
                    <p class="text-sm text-gray-400">• 保护细胞内部结构</p>
                    <p class="text-sm text-gray-400">• 控制物质进出</p>
                    <p class="text-sm text-gray-400">• 细胞识别与通讯</p>
                </div>
                <p class="text-sm text-yellow-400">💡 厚度约7-8纳米</p>
            `,
            onClick: (t) => { this.highlightObject(t); this.showInfoPanel(t); }
        };
        this.interactables.push(this.cellMembrane);
        this.mainGroup.add(this.cellMembrane);
    }

    createNucleus() {
        const nucleusGroup = new THREE.Group();
        
        // 核膜
        const envelopeGeo = new THREE.SphereGeometry(3, 32, 32);
        const envelopeMat = new THREE.MeshPhysicalMaterial({
            color: 0x6644aa,
            transparent: true,
            opacity: 0.6,
            roughness: 0.3
        });
        const envelope = new THREE.Mesh(envelopeGeo, envelopeMat);
        nucleusGroup.add(envelope);
        
        // 核仁
        const nucleolusGeo = new THREE.SphereGeometry(0.8, 16, 16);
        const nucleolusMat = new THREE.MeshStandardMaterial({
            color: 0x4422aa,
            emissive: 0x221155,
            emissiveIntensity: 0.5
        });
        const nucleolus = new THREE.Mesh(nucleolusGeo, nucleolusMat);
        nucleolus.position.set(0.5, 0.5, 0.5);
        nucleusGroup.add(nucleolus);
        
        // 染色质（DNA团块）
        for (let i = 0; i < 5; i++) {
            const chromatinGeo = new THREE.SphereGeometry(0.3 + Math.random() * 0.3, 8, 8);
            const chromatinMat = new THREE.MeshStandardMaterial({ 
                color: 0x8866cc,
                emissive: 0x332244
            });
            const chromatin = new THREE.Mesh(chromatinGeo, chromatinMat);
            chromatin.position.set(
                (Math.random() - 0.5) * 4,
                (Math.random() - 0.5) * 4,
                (Math.random() - 0.5) * 4
            );
            nucleusGroup.add(chromatin);
        }
        
        nucleusGroup.position.set(0, 0, 0);
        this.nucleus = nucleusGroup;
        this.nucleus.userData = {
            hoverTitle: '细胞核',
            hoverDesc: '遗传信息控制中心',
            hoverIcon: 'fa-dna',
            name: '细胞核',
            description: `
                <p class="text-lg font-bold text-purple-400 mb-3">🟣 细胞核</p>
                <p class="text-gray-300 mb-3">细胞的"大脑"，存储遗传信息（DNA），控制细胞活动。</p>
                <div class="bg-gray-800 rounded p-3 mb-3">
                    <p class="text-sm text-white mb-1">组成结构：</p>
                    <p class="text-sm text-gray-400">• 核膜（双层膜，有核孔）</p>
                    <p class="text-sm text-gray-400">• 核仁（合成核糖体RNA）</p>
                    <p class="text-sm text-gray-400">• 染色质（DNA + 蛋白质）</p>
                </div>
                <p class="text-sm text-green-400">✨ 人体细胞核含有46条染色体</p>
            `,
            onClick: (t) => { this.highlightObject(t); this.showInfoPanel(t); }
        };
        this.interactables.push(this.nucleus);
        this.mainGroup.add(this.nucleus);
    }

    createMitochondria() {
        const positions = [
            { x: 5, y: 2, z: 3 },
            { x: -4, y: -3, z: 4 },
            { x: 3, y: -4, z: -3 },
            { x: -5, y: 3, z: -2 },
            { x: 6, y: -1, z: -4 }
        ];
        
        positions.forEach((pos, i) => {
            const mitoGroup = new THREE.Group();
            
            // 外膜
            const outerGeo = new THREE.CapsuleGeometry(0.6, 1.5, 8, 16);
            const outerMat = new THREE.MeshStandardMaterial({
                color: 0xff6644,
                transparent: true,
                opacity: 0.7
            });
            const outer = new THREE.Mesh(outerGeo, outerMat);
            mitoGroup.add(outer);
            
            // 内膜褶皱（嵴）
            for (let j = 0; j < 4; j++) {
                const cristaGeo = new THREE.BoxGeometry(0.8, 0.08, 0.3);
                const cristaMat = new THREE.MeshStandardMaterial({ color: 0xcc4422 });
                const crista = new THREE.Mesh(cristaGeo, cristaMat);
                crista.position.y = -0.6 + j * 0.4;
                crista.rotation.z = (Math.random() - 0.5) * 0.3;
                mitoGroup.add(crista);
            }
            
            mitoGroup.position.set(pos.x, pos.y, pos.z);
            mitoGroup.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
            
            if (i === 0) {
                mitoGroup.userData = {
                    hoverTitle: '线粒体',
                    hoverDesc: '细胞的能量工厂',
                    hoverIcon: 'fa-bolt',
                    name: '线粒体',
                    description: `
                        <p class="text-lg font-bold text-orange-400 mb-3">🔶 线粒体</p>
                        <p class="text-gray-300 mb-3">细胞的"发电站"，通过有氧呼吸产生ATP（能量货币）。</p>
                        <div class="bg-gray-800 rounded p-3 mb-3">
                            <p class="text-sm text-white mb-1">结构特点：</p>
                            <p class="text-sm text-gray-400">• 双层膜结构</p>
                            <p class="text-sm text-gray-400">• 内膜向内折叠形成嵴</p>
                            <p class="text-sm text-gray-400">• 含有自己的DNA</p>
                        </div>
                        <p class="text-sm text-red-400">⚡ 有氧呼吸：C₆H₁₂O₆ + O₂ → CO₂ + H₂O + ATP</p>
                    `,
                    onClick: (t) => { this.highlightObject(t); this.showInfoPanel(t); }
                };
                this.interactables.push(mitoGroup);
            }
            
            this.mitochondria.push(mitoGroup);
            this.mainGroup.add(mitoGroup);
        });
    }

    createEndoplasmicReticulum() {
        const erGroup = new THREE.Group();
        
        // 粗面内质网（网状结构）
        for (let i = 0; i < 15; i++) {
            const tubeGeo = new THREE.TorusGeometry(0.5 + Math.random() * 0.5, 0.08, 8, 16);
            const tubeMat = new THREE.MeshStandardMaterial({
                color: 0x44aaff,
                transparent: true,
                opacity: 0.6
            });
            const tube = new THREE.Mesh(tubeGeo, tubeMat);
            tube.position.set(
                -3 + Math.random() * 2,
                -2 + Math.random() * 4,
                2 + Math.random() * 2
            );
            tube.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
            erGroup.add(tube);
        }
        
        erGroup.userData = {
            hoverTitle: '内质网',
            hoverDesc: '蛋白质合成工厂',
            hoverIcon: 'fa-project-diagram',
            name: '内质网',
            description: `
                <p class="text-lg font-bold text-cyan-400 mb-3">🔷 内质网</p>
                <p class="text-gray-300 mb-3">由膜构成的网状结构，分为粗面和滑面两种。</p>
                <div class="bg-gray-800 rounded p-3 mb-3">
                    <p class="text-sm text-white mb-1">两种类型：</p>
                    <p class="text-sm text-gray-400">• 粗面内质网：附着核糖体，合成蛋白质</p>
                    <p class="text-sm text-gray-400">• 滑面内质网：合成脂质，解毒</p>
                </div>
            `,
            onClick: (t) => { this.highlightObject(t); this.showInfoPanel(t); }
        };
        this.interactables.push(erGroup);
        this.endoplasmicReticulum = erGroup;
        this.mainGroup.add(erGroup);
    }

    createGolgiApparatus() {
        const golgiGroup = new THREE.Group();
        
        // 扁平囊泡堆叠
        for (let i = 0; i < 5; i++) {
            const sacculeGeo = new THREE.CylinderGeometry(1.2, 1, 0.15, 32);
            const sacculeMat = new THREE.MeshStandardMaterial({
                color: 0xffcc44,
                transparent: true,
                opacity: 0.7
            });
            const saccule = new THREE.Mesh(sacculeGeo, sacculeMat);
            saccule.position.y = i * 0.25;
            saccule.scale.x = 1 - i * 0.1;
            golgiGroup.add(saccule);
        }
        
        golgiGroup.position.set(4, -2, 5);
        golgiGroup.rotation.x = Math.PI / 6;
        
        golgiGroup.userData = {
            hoverTitle: '高尔基体',
            hoverDesc: '蛋白质加工包装',
            hoverIcon: 'fa-layer-group',
            name: '高尔基体',
            description: `
                <p class="text-lg font-bold text-yellow-400 mb-3">🟡 高尔基体</p>
                <p class="text-gray-300 mb-3">由扁平囊泡堆叠而成，负责加工、分类和包装蛋白质。</p>
                <div class="bg-gray-800 rounded p-3 mb-3">
                    <p class="text-sm text-white mb-1">主要功能：</p>
                    <p class="text-sm text-gray-400">• 修饰蛋白质（如糖基化）</p>
                    <p class="text-sm text-gray-400">• 分拣和包装</p>
                    <p class="text-sm text-gray-400">• 形成分泌小泡</p>
                </div>
            `,
            onClick: (t) => { this.highlightObject(t); this.showInfoPanel(t); }
        };
        this.interactables.push(golgiGroup);
        this.golgiApparatus = golgiGroup;
        this.mainGroup.add(golgiGroup);
    }

    createRibosomes() {
        const ribosomeMat = new THREE.MeshStandardMaterial({ color: 0x44ff88 });
        
        for (let i = 0; i < 50; i++) {
            const riboGeo = new THREE.SphereGeometry(0.1, 8, 8);
            const ribo = new THREE.Mesh(riboGeo, ribosomeMat);
            
            // 随机分布在细胞质中
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);
            const r = 4 + Math.random() * 5;
            
            ribo.position.set(
                r * Math.sin(phi) * Math.cos(theta),
                r * Math.sin(phi) * Math.sin(theta),
                r * Math.cos(phi)
            );
            
            this.ribosomes.push(ribo);
            this.mainGroup.add(ribo);
        }
    }

    createLysosomes() {
        const lysoPositions = [
            { x: -6, y: 1, z: -3 },
            { x: 5, y: -5, z: 2 },
            { x: -3, y: 5, z: -5 }
        ];
        
        lysoPositions.forEach((pos, i) => {
            const lysoGeo = new THREE.SphereGeometry(0.5, 16, 16);
            const lysoMat = new THREE.MeshStandardMaterial({
                color: 0xaa44ff,
                emissive: 0x441166
            });
            const lyso = new THREE.Mesh(lysoGeo, lysoMat);
            lyso.position.set(pos.x, pos.y, pos.z);
            
            if (i === 0) {
                lyso.userData = {
                    hoverTitle: '溶酶体',
                    hoverDesc: '细胞的消化系统',
                    hoverIcon: 'fa-recycle',
                    name: '溶酶体',
                    description: `
                        <p class="text-lg font-bold text-violet-400 mb-3">🟣 溶酶体</p>
                        <p class="text-gray-300 mb-3">含有多种水解酶的囊泡，负责分解衰老细胞器和外来物质。</p>
                        <div class="bg-gray-800 rounded p-3">
                            <p class="text-sm text-gray-400">• 消化吞入的物质</p>
                            <p class="text-sm text-gray-400">• 清除损坏的细胞器</p>
                            <p class="text-sm text-gray-400">• pH约为4.5-5（酸性）</p>
                        </div>
                    `,
                    onClick: (t) => { this.highlightObject(t); this.showInfoPanel(t); }
                };
                this.interactables.push(lyso);
            }
            
            this.lysosomes.push(lyso);
            this.mainGroup.add(lyso);
        });
    }

    createCytoplasm() {
        // 细胞质粒子效果
        const particleCount = 200;
        const positions = new Float32Array(particleCount * 3);
        
        for (let i = 0; i < particleCount; i++) {
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);
            const r = Math.random() * 9;
            
            positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
            positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
            positions[i * 3 + 2] = r * Math.cos(phi);
        }
        
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        
        const material = new THREE.PointsMaterial({
            color: 0x88aacc,
            size: 0.05,
            transparent: true,
            opacity: 0.4
        });
        
        this.cytoplasm = new THREE.Points(geometry, material);
        this.mainGroup.add(this.cytoplasm);
    }

    setupUI() {
        const controlsDiv = document.getElementById('scene-controls');
        controlsDiv.style.display = 'flex';
        controlsDiv.innerHTML = `
            <button class="control-btn" id="btn-focus-nucleus">
                <i class="fas fa-dna"></i> 聚焦细胞核
            </button>
            <button class="control-btn" id="btn-focus-mito">
                <i class="fas fa-bolt"></i> 聚焦线粒体
            </button>
            <button class="control-btn" id="btn-explode">
                <i class="fas fa-expand-arrows-alt"></i> 分解视图
            </button>
            <button class="control-btn" id="btn-reset">
                <i class="fas fa-compress-arrows-alt"></i> 还原
            </button>
            <button class="control-btn" id="btn-reset-view">
                <i class="fas fa-video"></i> 重置视角
            </button>
        `;
        
        document.getElementById('btn-focus-nucleus').onclick = () => this.focusOn(this.nucleus, '细胞核');
        document.getElementById('btn-focus-mito').onclick = () => this.focusOn(this.mitochondria[0], '线粒体');
        document.getElementById('btn-explode').onclick = () => this.explodeView();
        document.getElementById('btn-reset').onclick = () => this.resetPositions();
        document.getElementById('btn-reset-view').onclick = () => this.resetView();
    }

    focusOn(target, name) {
        if (!target) return;
        
        const pos = target.position;
        gsap.to(this.camera.position, {
            x: pos.x + 8,
            y: pos.y + 5,
            z: pos.z + 8,
            duration: 1,
            ease: 'power2.out'
        });
        
        this.showGuide(`🔍 聚焦：${name}`);
    }

    explodeView() {
        // 分解视图 - 各部分向外移动
        gsap.to(this.nucleus.position, { x: 0, y: 0, z: -5, duration: 0.8 });
        
        this.mitochondria.forEach((m, i) => {
            const angle = (i / this.mitochondria.length) * Math.PI * 2;
            gsap.to(m.position, {
                x: Math.cos(angle) * 12,
                z: Math.sin(angle) * 12,
                duration: 0.8,
                delay: i * 0.1
            });
        });
        
        gsap.to(this.golgiApparatus.position, { x: 10, y: 0, z: 0, duration: 0.8 });
        
        this.showGuide('📊 分解视图：观察各细胞器的结构');
    }

    resetPositions() {
        gsap.to(this.nucleus.position, { x: 0, y: 0, z: 0, duration: 0.8 });
        
        const originalPositions = [
            { x: 5, y: 2, z: 3 },
            { x: -4, y: -3, z: 4 },
            { x: 3, y: -4, z: -3 },
            { x: -5, y: 3, z: -2 },
            { x: 6, y: -1, z: -4 }
        ];
        
        this.mitochondria.forEach((m, i) => {
            gsap.to(m.position, { ...originalPositions[i], duration: 0.8 });
        });
        
        gsap.to(this.golgiApparatus.position, { x: 4, y: -2, z: 5, duration: 0.8 });
        
        this.showGuide('🔄 已还原细胞结构');
    }

    resetView() {
        gsap.to(this.camera.position, {
            x: this.defaultCameraPos.x,
            y: this.defaultCameraPos.y,
            z: this.defaultCameraPos.z,
            duration: 0.8,
            ease: 'power2.out'
        });
        this.camera.lookAt(0, 0, 0);
    }

    startAutoPlay() {
        this.isAutoPlaying = true;
        setTimeout(() => {
            this.showGuide('🔬 动物细胞结构：点击各细胞器了解功能');
        }, 500);
    }

    showGuide(message) {
        const container = document.getElementById('scene-canvas-container');
        const old = container.querySelector('.scene-guide-message');
        if (old) old.remove();
        
        const guide = document.createElement('div');
        guide.className = 'scene-guide-message';
        guide.innerHTML = message;
        container.appendChild(guide);
        
        setTimeout(() => guide.classList.add('visible'), 100);
        setTimeout(() => {
            guide.classList.remove('visible');
            setTimeout(() => guide.remove(), 300);
        }, 3500);
    }

    highlightObject(target) {
        if (this.highlighted?.material?.emissive) {
            this.highlighted.material.emissive.setHex(this.highlighted.userData.originalEmissive || 0);
        }
        this.highlighted = target;
        gsap.to(target.scale, { x: 1.15, y: 1.15, z: 1.15, duration: 0.15, yoyo: true, repeat: 1 });
    }

    showInfoPanel(target) {
        const panel = document.getElementById('info-panel');
        document.getElementById('info-title').innerHTML = `<i class="fas fa-microscope mr-2"></i>${target.userData.name}`;
        document.getElementById('info-content').innerHTML = target.userData.description;
        panel.classList.add('visible');
    }

    animate(time, delta) {
        // 细胞缓慢旋转
        this.mainGroup.rotation.y = time * 0.05;
        
        // 线粒体轻微晃动
        this.mitochondria.forEach((m, i) => {
            m.rotation.x = Math.sin(time + i) * 0.1;
            m.rotation.z = Math.cos(time + i) * 0.1;
        });
        
        // 细胞质粒子流动
        if (this.cytoplasm) {
            this.cytoplasm.rotation.y = time * 0.02;
        }
    }

    getInteractables() {
        return this.interactables;
    }

    dispose() {
        if (this.mainGroup) this.scene.remove(this.mainGroup);
    }

    onBackgroundClick() {
        const panel = document.getElementById('info-panel');
        if (panel) panel.classList.remove('visible');
    }

    createLabels(manager) {
        manager.createLabel('细胞核', new THREE.Vector3(0, 4, 0), 'dna');
        manager.createLabel('细胞膜', new THREE.Vector3(8, 0, 0), 'circle');
    }
};
