/**
 * DNA双螺旋结构场景 - 遗传密码可视化
 * ============================================
 * 核心知识点：
 * - 双螺旋结构：两条反向平行的多核苷酸链
 * - 碱基配对：A-T, G-C
 * - 脱氧核糖-磷酸骨架
 * ============================================
 */
window.DNAScene = class DNAScene {
    constructor(scene, camera, renderer) {
        this.scene = scene;
        this.camera = camera;
        this.renderer = renderer;
        
        this.mainGroup = null;
        this.interactables = [];
        this.highlighted = null;
        
        // DNA组件
        this.helix1 = [];
        this.helix2 = [];
        this.basePairs = [];
        
        // 碱基颜色
        this.baseColors = {
            A: 0xff4444, // 腺嘌呤 - 红
            T: 0x44ff44, // 胸腺嘧啶 - 绿
            G: 0x4444ff, // 鸟嘌呤 - 蓝
            C: 0xffff44  // 胞嘧啶 - 黄
        };
        
        // DNA序列
        this.sequence = 'ATGCTAGCATGCATGC';
        
        this.isAutoPlaying = false;
        this.defaultCameraPos = { x: 15, y: 5, z: 15 };
    }

    init() {
        this.camera.position.set(15, 5, 15);
        this.camera.lookAt(0, 0, 0);
        
        this.scene.background = new THREE.Color(0x050515);
        this.scene.fog = new THREE.FogExp2(0x050515, 0.015);
        
        this.setupLights();
        this.setupScene();
        this.setupUI();
    }

    setupLights() {
        const ambient = new THREE.AmbientLight(0x303040, 0.8);
        this.scene.add(ambient);
        
        const mainLight = new THREE.DirectionalLight(0xffffff, 0.6);
        mainLight.position.set(10, 20, 10);
        this.scene.add(mainLight);
        
        // 彩色氛围光
        const redLight = new THREE.PointLight(0xff4444, 1, 20);
        redLight.position.set(-8, 5, 0);
        this.scene.add(redLight);
        
        const blueLight = new THREE.PointLight(0x4444ff, 1, 20);
        blueLight.position.set(8, -5, 0);
        this.scene.add(blueLight);
    }

    setupScene() {
        this.mainGroup = new THREE.Group();
        this.scene.add(this.mainGroup);
        
        // 创建DNA双螺旋
        this.createDoubleHelix();
        
        // 创建图例
        this.createLegend();
        
        // 创建背景粒子
        this.createBackgroundParticles();
    }

    createDoubleHelix() {
        const helixRadius = 3;
        const helixHeight = 20;
        const turns = 2;
        const stepsPerTurn = 10;
        const totalSteps = turns * stepsPerTurn;
        
        // 骨架材质（磷酸-脱氧核糖）
        const backboneMat = new THREE.MeshStandardMaterial({
            color: 0x888888,
            metalness: 0.3,
            roughness: 0.7
        });
        
        for (let i = 0; i < totalSteps; i++) {
            const t = i / totalSteps;
            const angle = t * turns * Math.PI * 2;
            const y = t * helixHeight - helixHeight / 2;
            
            // 链1的位置
            const x1 = Math.cos(angle) * helixRadius;
            const z1 = Math.sin(angle) * helixRadius;
            
            // 链2的位置（反向平行）
            const x2 = Math.cos(angle + Math.PI) * helixRadius;
            const z2 = Math.sin(angle + Math.PI) * helixRadius;
            
            // 脱氧核糖（球体）
            const sugarGeo = new THREE.SphereGeometry(0.3, 16, 16);
            
            const sugar1 = new THREE.Mesh(sugarGeo, backboneMat);
            sugar1.position.set(x1, y, z1);
            this.helix1.push(sugar1);
            this.mainGroup.add(sugar1);
            
            const sugar2 = new THREE.Mesh(sugarGeo, backboneMat);
            sugar2.position.set(x2, y, z2);
            this.helix2.push(sugar2);
            this.mainGroup.add(sugar2);
            
            // 磷酸连接（连接相邻糖分子）
            if (i > 0) {
                this.createPhosphateLink(this.helix1[i-1].position, sugar1.position, backboneMat);
                this.createPhosphateLink(this.helix2[i-1].position, sugar2.position, backboneMat);
            }
            
            // 碱基对
            const baseIndex = i % this.sequence.length;
            const base1 = this.sequence[baseIndex];
            const base2 = this.getComplementaryBase(base1);
            
            this.createBasePair(
                new THREE.Vector3(x1, y, z1),
                new THREE.Vector3(x2, y, z2),
                base1,
                base2,
                i
            );
        }
    }

    getComplementaryBase(base) {
        const pairs = { A: 'T', T: 'A', G: 'C', C: 'G' };
        return pairs[base];
    }

    createPhosphateLink(pos1, pos2, material) {
        const direction = new THREE.Vector3().subVectors(pos2, pos1);
        const length = direction.length();
        
        const geometry = new THREE.CylinderGeometry(0.1, 0.1, length, 8);
        const link = new THREE.Mesh(geometry, material);
        
        link.position.copy(pos1).add(direction.multiplyScalar(0.5));
        link.quaternion.setFromUnitVectors(
            new THREE.Vector3(0, 1, 0),
            direction.clone().normalize()
        );
        
        this.mainGroup.add(link);
    }

    createBasePair(pos1, pos2, base1, base2, index) {
        const midPoint = new THREE.Vector3().addVectors(pos1, pos2).multiplyScalar(0.5);
        const direction = new THREE.Vector3().subVectors(pos2, pos1);
        const halfLength = direction.length() / 2;
        
        // 碱基1
        const base1Geo = new THREE.BoxGeometry(0.6, 0.3, halfLength - 0.3);
        const base1Mat = new THREE.MeshStandardMaterial({
            color: this.baseColors[base1],
            emissive: this.baseColors[base1],
            emissiveIntensity: 0.3
        });
        const base1Mesh = new THREE.Mesh(base1Geo, base1Mat);
        
        const offset1 = direction.clone().normalize().multiplyScalar(-halfLength / 2);
        base1Mesh.position.copy(midPoint).add(offset1);
        base1Mesh.lookAt(pos2);
        
        base1Mesh.userData = {
            hoverTitle: this.getBaseName(base1),
            hoverDesc: `碱基 ${base1}`,
            hoverIcon: 'fa-dna',
            name: this.getBaseName(base1),
            description: this.getBaseDescription(base1),
            onClick: (t) => { this.highlightObject(t); this.showInfoPanel(t); }
        };
        this.interactables.push(base1Mesh);
        this.mainGroup.add(base1Mesh);
        
        // 碱基2
        const base2Geo = new THREE.BoxGeometry(0.6, 0.3, halfLength - 0.3);
        const base2Mat = new THREE.MeshStandardMaterial({
            color: this.baseColors[base2],
            emissive: this.baseColors[base2],
            emissiveIntensity: 0.3
        });
        const base2Mesh = new THREE.Mesh(base2Geo, base2Mat);
        
        const offset2 = direction.clone().normalize().multiplyScalar(halfLength / 2);
        base2Mesh.position.copy(midPoint).add(offset2);
        base2Mesh.lookAt(pos1);
        
        this.mainGroup.add(base2Mesh);
        
        // 氢键（虚线连接）
        const hydrogenBondGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.5, 8);
        const hydrogenBondMat = new THREE.MeshBasicMaterial({ 
            color: 0xffffff,
            transparent: true,
            opacity: 0.5
        });
        
        const numBonds = (base1 === 'G' || base1 === 'C') ? 3 : 2;
        for (let i = 0; i < numBonds; i++) {
            const bond = new THREE.Mesh(hydrogenBondGeo, hydrogenBondMat);
            bond.position.copy(midPoint);
            bond.position.y += (i - (numBonds - 1) / 2) * 0.15;
            bond.rotation.z = Math.PI / 2;
            this.mainGroup.add(bond);
        }
        
        this.basePairs.push({ base1: base1Mesh, base2: base2Mesh });
    }

    getBaseName(base) {
        const names = {
            A: '腺嘌呤 (Adenine)',
            T: '胸腺嘧啶 (Thymine)',
            G: '鸟嘌呤 (Guanine)',
            C: '胞嘧啶 (Cytosine)'
        };
        return names[base];
    }

    getBaseDescription(base) {
        const descriptions = {
            A: `<p class="text-lg font-bold text-red-400 mb-3">🔴 腺嘌呤 (A)</p>
                <p class="text-gray-300 mb-3">嘌呤碱基，与胸腺嘧啶(T)配对，形成2个氢键。</p>
                <div class="bg-gray-800 rounded p-3">
                    <p class="text-sm text-white">配对规则：A ═══ T（2个氢键）</p>
                </div>`,
            T: `<p class="text-lg font-bold text-green-400 mb-3">🟢 胸腺嘧啶 (T)</p>
                <p class="text-gray-300 mb-3">嘧啶碱基，与腺嘌呤(A)配对，形成2个氢键。</p>
                <div class="bg-gray-800 rounded p-3">
                    <p class="text-sm text-white">配对规则：T ═══ A（2个氢键）</p>
                    <p class="text-sm text-gray-400 mt-2">DNA特有，RNA中被尿嘧啶(U)取代</p>
                </div>`,
            G: `<p class="text-lg font-bold text-blue-400 mb-3">🔵 鸟嘌呤 (G)</p>
                <p class="text-gray-300 mb-3">嘌呤碱基，与胞嘧啶(C)配对，形成3个氢键。</p>
                <div class="bg-gray-800 rounded p-3">
                    <p class="text-sm text-white">配对规则：G ≡≡≡ C（3个氢键）</p>
                    <p class="text-sm text-yellow-400 mt-2">💡 G-C配对更稳定</p>
                </div>`,
            C: `<p class="text-lg font-bold text-yellow-400 mb-3">🟡 胞嘧啶 (C)</p>
                <p class="text-gray-300 mb-3">嘧啶碱基，与鸟嘌呤(G)配对，形成3个氢键。</p>
                <div class="bg-gray-800 rounded p-3">
                    <p class="text-sm text-white">配对规则：C ≡≡≡ G（3个氢键）</p>
                </div>`
        };
        return descriptions[base];
    }

    createLegend() {
        // 创建图例精灵
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 200;
        const ctx = canvas.getContext('2d');
        
        ctx.fillStyle = 'rgba(20, 20, 40, 0.9)';
        ctx.roundRect(0, 0, 256, 200, 10);
        ctx.fill();
        
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 16px Arial';
        ctx.fillText('碱基配对规则', 60, 30);
        
        const bases = [
            { name: 'A - 腺嘌呤', color: '#ff4444', y: 60 },
            { name: 'T - 胸腺嘧啶', color: '#44ff44', y: 90 },
            { name: 'G - 鸟嘌呤', color: '#4444ff', y: 120 },
            { name: 'C - 胞嘧啶', color: '#ffff44', y: 150 }
        ];
        
        bases.forEach(b => {
            ctx.fillStyle = b.color;
            ctx.fillRect(20, b.y - 12, 20, 20);
            ctx.fillStyle = '#ccc';
            ctx.font = '14px Arial';
            ctx.fillText(b.name, 50, b.y + 2);
        });
        
        ctx.fillStyle = '#888';
        ctx.font = '12px Arial';
        ctx.fillText('A═T (2氢键) G≡C (3氢键)', 30, 180);
        
        const texture = new THREE.CanvasTexture(canvas);
        const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture }));
        sprite.scale.set(6, 4.5, 1);
        sprite.position.set(-10, 5, 0);
        this.scene.add(sprite);
    }

    createBackgroundParticles() {
        const particleCount = 300;
        const positions = new Float32Array(particleCount * 3);
        
        for (let i = 0; i < particleCount; i++) {
            positions[i * 3] = (Math.random() - 0.5) * 50;
            positions[i * 3 + 1] = (Math.random() - 0.5) * 40;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 50;
        }
        
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        
        const material = new THREE.PointsMaterial({
            color: 0x6688aa,
            size: 0.15,
            transparent: true,
            opacity: 0.5
        });
        
        this.bgParticles = new THREE.Points(geometry, material);
        this.scene.add(this.bgParticles);
    }

    setupUI() {
        const controlsDiv = document.getElementById('scene-controls');
        controlsDiv.style.display = 'flex';
        controlsDiv.innerHTML = `
            <button class="control-btn" id="btn-unwind">
                <i class="fas fa-expand-alt"></i> 解旋展开
            </button>
            <button class="control-btn" id="btn-wind">
                <i class="fas fa-compress-alt"></i> 恢复螺旋
            </button>
            <button class="control-btn" id="btn-highlight-at">
                <i class="fas fa-link"></i> 高亮 A-T
            </button>
            <button class="control-btn" id="btn-highlight-gc">
                <i class="fas fa-link"></i> 高亮 G-C
            </button>
            <button class="control-btn" id="btn-reset-view">
                <i class="fas fa-video"></i> 重置视角
            </button>
        `;
        
        document.getElementById('btn-unwind').onclick = () => this.unwindHelix();
        document.getElementById('btn-wind').onclick = () => this.windHelix();
        document.getElementById('btn-highlight-at').onclick = () => this.highlightPairs('AT');
        document.getElementById('btn-highlight-gc').onclick = () => this.highlightPairs('GC');
        document.getElementById('btn-reset-view').onclick = () => this.resetView();
    }

    unwindHelix() {
        // 解旋动画
        gsap.to(this.mainGroup.scale, { x: 1.5, z: 1.5, duration: 1, ease: 'power2.out' });
        this.showGuide('🔓 DNA解旋：复制和转录时需要解开双螺旋');
    }

    windHelix() {
        gsap.to(this.mainGroup.scale, { x: 1, z: 1, duration: 1, ease: 'power2.out' });
        this.showGuide('🔒 DNA恢复双螺旋结构');
    }

    highlightPairs(type) {
        this.basePairs.forEach(pair => {
            const base = this.sequence[this.basePairs.indexOf(pair) % this.sequence.length];
            const isTarget = (type === 'AT' && (base === 'A' || base === 'T')) ||
                           (type === 'GC' && (base === 'G' || base === 'C'));
            
            gsap.to(pair.base1.scale, {
                x: isTarget ? 1.5 : 1,
                y: isTarget ? 1.5 : 1,
                z: isTarget ? 1.5 : 1,
                duration: 0.3
            });
        });
        
        const bondName = type === 'AT' ? 'A-T（2个氢键）' : 'G-C（3个氢键）';
        this.showGuide(`🔗 高亮 ${bondName} 碱基对`);
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
            this.showGuide('🧬 DNA双螺旋：生命的遗传密码');
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
            this.highlighted.material.emissiveIntensity = 0.3;
        }
        if (target.material?.emissive) {
            target.material.emissiveIntensity = 1;
        }
        this.highlighted = target;
    }

    showInfoPanel(target) {
        const panel = document.getElementById('info-panel');
        document.getElementById('info-title').innerHTML = `<i class="fas fa-dna mr-2"></i>${target.userData.name}`;
        document.getElementById('info-content').innerHTML = target.userData.description;
        panel.classList.add('visible');
    }

    animate(time, delta) {
        // DNA缓慢旋转
        this.mainGroup.rotation.y = time * 0.1;
        
        // 背景粒子
        if (this.bgParticles) {
            this.bgParticles.rotation.y = time * 0.02;
        }
    }

    getInteractables() {
        return this.interactables;
    }

    dispose() {
        if (this.mainGroup) this.scene.remove(this.mainGroup);
        if (this.bgParticles) this.scene.remove(this.bgParticles);
    }

    onBackgroundClick() {
        const panel = document.getElementById('info-panel');
        if (panel) panel.classList.remove('visible');
        
        // 恢复所有碱基大小
        this.basePairs.forEach(pair => {
            gsap.to(pair.base1.scale, { x: 1, y: 1, z: 1, duration: 0.3 });
        });
    }

    createLabels(manager) {
        manager.createLabel('5\' 端', new THREE.Vector3(3, 10, 0), 'arrow-up');
        manager.createLabel('3\' 端', new THREE.Vector3(-3, -10, 0), 'arrow-down');
    }
};
