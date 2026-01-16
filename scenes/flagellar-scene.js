/**
 * 细菌鞭毛马达场景 - 生物纳米机器可视化
 * ============================================
 * 核心知识点：
 * - 鞭毛马达的精密结构（比人造马达更高效）
 * - 质子动力原理（利用离子梯度驱动）
 * - 各环/层的功能分工
 * ============================================
 * 结构组成（从下到上）：
 * 1. C环（细胞质环）- 开关复合体
 * 2. MS环 - 转子主体
 * 3. 定子（MotA/MotB）- 提供动力
 * 4. 内膜
 * 5. 肽聚糖层
 * 6. P环、L环 - 轴承作用
 * 7. 外膜
 * 8. 钩（Hook）- 万向节
 * 9. 鞭毛丝（Filament）- 螺旋推进器
 * ============================================
 */
window.FlagellarScene = class FlagellarScene {
    constructor(scene, camera, renderer) {
        this.scene = scene;
        this.camera = camera;
        this.renderer = renderer;
        
        this.mainGroup = null;
        this.interactables = [];
        this.highlighted = null;
        
        // 场景元素
        this.flagellum = null;      // 鞭毛丝
        this.hook = null;           // 钩
        this.rod = null;            // 杆
        this.rings = {};            // 各种环
        this.membranes = {};        // 膜层
        this.stators = [];          // 定子
        this.protons = [];          // 质子粒子
        
        // 动画状态
        this.isRotating = true;
        this.rotationSpeed = 0.02;
        this.protonFlow = true;
        
        this.isAutoPlaying = false;
        this.defaultCameraPos = { x: 12, y: 8, z: 12 };
    }

    init() {
        this.camera.position.set(12, 8, 12);
        this.camera.lookAt(0, 0, 0);
        
        // 深蓝色背景模拟细胞内环境
        this.scene.background = new THREE.Color(0x0a1628);
        this.scene.fog = new THREE.FogExp2(0x0a1628, 0.015);
        
        this.setupLights();
        this.setupScene();
        this.createControls();
    }

    setupLights() {
        // 主光源 - 模拟显微镜光源
        const ambient = new THREE.AmbientLight(0x404060, 0.4);
        this.scene.add(ambient);
        
        // 顶部主光
        const mainLight = new THREE.DirectionalLight(0xffffff, 0.8);
        mainLight.position.set(5, 15, 5);
        mainLight.castShadow = true;
        this.scene.add(mainLight);
        
        // 侧面补光 - 突出层次
        const sideLight = new THREE.DirectionalLight(0x88ccff, 0.4);
        sideLight.position.set(-10, 5, 10);
        this.scene.add(sideLight);
        
        // 底部补光
        const bottomLight = new THREE.DirectionalLight(0xff8844, 0.2);
        bottomLight.position.set(0, -10, 0);
        this.scene.add(bottomLight);
        
        // 点光源 - 突出核心结构
        const coreLight = new THREE.PointLight(0x44aaff, 0.5, 15);
        coreLight.position.set(0, -2, 0);
        this.scene.add(coreLight);
    }

    setupScene() {
        this.mainGroup = new THREE.Group();
        this.scene.add(this.mainGroup);
        
        // 从下到上构建鞭毛马达
        this.createCRing();           // C环（最底部）
        this.createMSRing();          // MS环
        this.createStators();         // 定子
        this.createInnerMembrane();   // 内膜
        this.createPeptidoglycan();   // 肽聚糖层
        this.createPRing();           // P环
        this.createLRing();           // L环
        this.createOuterMembrane();   // 外膜
        this.createRod();             // 杆
        this.createHook();            // 钩
        this.createFlagellum();       // 鞭毛丝
        this.createProtons();         // 质子
        this.createLabels();          // 标签
        
        // 添加装饰性元素
        this.createDecorations();
    }

    // ==================== 结构创建 ====================

    createCRing() {
        // C环 - 细胞质环，开关复合体
        const group = new THREE.Group();
        
        // 主体环
        const ringGeo = new THREE.TorusGeometry(2.5, 0.4, 16, 48);
        const ringMat = new THREE.MeshStandardMaterial({
            color: 0x2d8f4e,
            metalness: 0.3,
            roughness: 0.6
        });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.rotation.x = Math.PI / 2;
        group.add(ring);
        
        // 内部结构 - 开关蛋白
        for (let i = 0; i < 12; i++) {
            const angle = (i / 12) * Math.PI * 2;
            const switchGeo = new THREE.BoxGeometry(0.3, 0.6, 0.3);
            const switchMat = new THREE.MeshStandardMaterial({ color: 0x1a5f30 });
            const switchMesh = new THREE.Mesh(switchGeo, switchMat);
            switchMesh.position.set(
                Math.cos(angle) * 2.2,
                -0.3,
                Math.sin(angle) * 2.2
            );
            group.add(switchMesh);
        }
        
        group.position.y = -5;
        group.userData = {
            hoverTitle: 'C环（细胞质环）',
            hoverDesc: '开关复合体，控制旋转方向',
            hoverIcon: 'fa-circle-notch',
            name: 'C环',
            description: `
                <p class="text-lg font-bold text-green-400 mb-3">🔄 C环（Cytoplasmic Ring）</p>
                <p class="text-gray-300 mb-3">位于细胞质中的开关复合体</p>
                <div class="bg-gray-800 rounded p-3 mb-3">
                    <p class="text-sm text-white">主要功能：</p>
                    <p class="text-sm text-gray-400">• 控制马达旋转方向（顺/逆时针）</p>
                    <p class="text-sm text-gray-400">• 响应化学信号进行趋化</p>
                    <p class="text-sm text-gray-400">• 由FliG、FliM、FliN蛋白组成</p>
                </div>
                <p class="text-sm text-yellow-400">💡 细菌通过切换C环状态来"游泳"或"翻滚"</p>
            `,
            onClick: (t) => { this.highlightObject(t); this.showInfoPanel(t); }
        };
        
        this.rings.cRing = group;
        this.interactables.push(group);
        this.mainGroup.add(group);
    }

    createMSRing() {
        // MS环 - 转子主体
        const group = new THREE.Group();
        
        // M环
        const mRingGeo = new THREE.TorusGeometry(1.8, 0.35, 16, 48);
        const mRingMat = new THREE.MeshStandardMaterial({
            color: 0xd35400,
            metalness: 0.4,
            roughness: 0.5
        });
        const mRing = new THREE.Mesh(mRingGeo, mRingMat);
        mRing.rotation.x = Math.PI / 2;
        mRing.position.y = 0.4;
        group.add(mRing);
        
        // S环
        const sRingGeo = new THREE.TorusGeometry(1.5, 0.3, 16, 48);
        const sRingMat = new THREE.MeshStandardMaterial({
            color: 0xe67e22,
            metalness: 0.4,
            roughness: 0.5
        });
        const sRing = new THREE.Mesh(sRingGeo, sRingMat);
        sRing.rotation.x = Math.PI / 2;
        sRing.position.y = -0.3;
        group.add(sRing);
        
        // 连接盘
        const discGeo = new THREE.CylinderGeometry(1.8, 1.5, 0.5, 32);
        const discMat = new THREE.MeshStandardMaterial({
            color: 0xc0392b,
            metalness: 0.3,
            roughness: 0.6
        });
        const disc = new THREE.Mesh(discGeo, discMat);
        group.add(disc);
        
        group.position.y = -3.5;
        group.userData = {
            hoverTitle: 'MS环（转子）',
            hoverDesc: '马达的核心旋转部件',
            hoverIcon: 'fa-sync-alt',
            name: 'MS环',
            description: `
                <p class="text-lg font-bold text-orange-400 mb-3">⚙️ MS环（Motor-Switch Ring）</p>
                <p class="text-gray-300 mb-3">嵌入内膜的转子核心</p>
                <div class="bg-gray-800 rounded p-3 mb-3">
                    <p class="text-sm text-white">结构组成：</p>
                    <p class="text-sm text-gray-400">• M环 - 位于膜内</p>
                    <p class="text-sm text-gray-400">• S环 - 位于周质空间</p>
                    <p class="text-sm text-gray-400">• 由FliF蛋白组成</p>
                </div>
                <p class="text-sm text-blue-400">🔬 转速可达每分钟10万转！</p>
            `,
            onClick: (t) => { this.highlightObject(t); this.showInfoPanel(t); }
        };
        
        this.rings.msRing = group;
        this.interactables.push(group);
        this.mainGroup.add(group);
    }

    createStators() {
        // 定子 - MotA/MotB复合体，提供动力
        const statorGroup = new THREE.Group();
        
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            const stator = new THREE.Group();
            
            // 定子主体
            const bodyGeo = new THREE.CylinderGeometry(0.25, 0.25, 1.5, 12);
            const bodyMat = new THREE.MeshStandardMaterial({
                color: 0x9b59b6,
                metalness: 0.5,
                roughness: 0.4
            });
            const body = new THREE.Mesh(bodyGeo, bodyMat);
            stator.add(body);
            
            // 质子通道指示
            const channelGeo = new THREE.CylinderGeometry(0.08, 0.08, 1.6, 8);
            const channelMat = new THREE.MeshBasicMaterial({
                color: 0x00ffff,
                transparent: true,
                opacity: 0.6
            });
            const channel = new THREE.Mesh(channelGeo, channelMat);
            stator.add(channel);
            
            stator.position.set(
                Math.cos(angle) * 2.3,
                -2.5,
                Math.sin(angle) * 2.3
            );
            
            this.stators.push(stator);
            statorGroup.add(stator);
        }
        
        statorGroup.userData = {
            hoverTitle: '定子（MotA/MotB）',
            hoverDesc: '质子通道，提供旋转动力',
            hoverIcon: 'fa-bolt',
            name: '定子',
            description: `
                <p class="text-lg font-bold text-purple-400 mb-3">⚡ 定子（Stator Units）</p>
                <p class="text-gray-300 mb-3">固定在细胞膜上的动力单元</p>
                <div class="bg-gray-800 rounded p-3 mb-3">
                    <p class="text-sm text-white">工作原理：</p>
                    <p class="text-sm text-gray-400">• MotA/MotB形成质子通道</p>
                    <p class="text-sm text-gray-400">• H⁺离子流过时驱动转子旋转</p>
                    <p class="text-sm text-gray-400">• 约8-11个定子单元协同工作</p>
                </div>
                <p class="text-sm text-cyan-400">💫 效率接近100%，远超人造马达！</p>
            `,
            onClick: (t) => { this.highlightObject(t); this.showInfoPanel(t); }
        };
        
        this.interactables.push(statorGroup);
        this.mainGroup.add(statorGroup);
    }

    createInnerMembrane() {
        // 内膜 - 半透明层
        const membraneGeo = new THREE.CylinderGeometry(4, 4, 0.3, 64, 1, true);
        const membraneMat = new THREE.MeshStandardMaterial({
            color: 0xc0392b,
            transparent: true,
            opacity: 0.4,
            side: THREE.DoubleSide
        });
        const membrane = new THREE.Mesh(membraneGeo, membraneMat);
        membrane.position.y = -2;
        
        // 内部填充
        const fillGeo = new THREE.RingGeometry(2.5, 4, 64);
        const fillMat = new THREE.MeshStandardMaterial({
            color: 0xc0392b,
            transparent: true,
            opacity: 0.3,
            side: THREE.DoubleSide
        });
        const fillTop = new THREE.Mesh(fillGeo, fillMat);
        fillTop.rotation.x = -Math.PI / 2;
        fillTop.position.y = -1.85;
        this.mainGroup.add(fillTop);
        
        const fillBottom = new THREE.Mesh(fillGeo, fillMat);
        fillBottom.rotation.x = -Math.PI / 2;
        fillBottom.position.y = -2.15;
        this.mainGroup.add(fillBottom);
        
        membrane.userData = {
            hoverTitle: '内膜',
            hoverDesc: '细菌的内层细胞膜',
            hoverIcon: 'fa-layer-group',
            name: '内膜',
            description: `
                <p class="text-lg font-bold text-red-400 mb-3">🧬 内膜（Inner Membrane）</p>
                <p class="text-gray-300 mb-3">细菌的内层磷脂双分子层</p>
                <div class="bg-gray-800 rounded p-3">
                    <p class="text-sm text-gray-400">• MS环和定子嵌入其中</p>
                    <p class="text-sm text-gray-400">• 维持质子梯度</p>
                    <p class="text-sm text-gray-400">• 厚度约7-8纳米</p>
                </div>
            `,
            onClick: (t) => { this.highlightObject(t); this.showInfoPanel(t); }
        };
        
        this.membranes.inner = membrane;
        this.interactables.push(membrane);
        this.mainGroup.add(membrane);
    }

    createPeptidoglycan() {
        // 肽聚糖层 - 网格状
        const pgGroup = new THREE.Group();
        
        // 主体层
        const layerGeo = new THREE.CylinderGeometry(4.2, 4.2, 0.8, 64, 1, true);
        const layerMat = new THREE.MeshStandardMaterial({
            color: 0xbdc3c7,
            transparent: true,
            opacity: 0.5,
            wireframe: false
        });
        const layer = new THREE.Mesh(layerGeo, layerMat);
        pgGroup.add(layer);
        
        // 网格装饰
        const wireGeo = new THREE.CylinderGeometry(4.25, 4.25, 0.8, 32, 4, true);
        const wireMat = new THREE.MeshBasicMaterial({
            color: 0x95a5a6,
            wireframe: true
        });
        const wire = new THREE.Mesh(wireGeo, wireMat);
        pgGroup.add(wire);
        
        pgGroup.position.y = -0.8;
        pgGroup.userData = {
            hoverTitle: '肽聚糖层',
            hoverDesc: '细胞壁的主要成分',
            hoverIcon: 'fa-th',
            name: '肽聚糖层',
            description: `
                <p class="text-lg font-bold text-gray-300 mb-3">🧱 肽聚糖层（Peptidoglycan）</p>
                <p class="text-gray-300 mb-3">位于内外膜之间的网状结构</p>
                <div class="bg-gray-800 rounded p-3">
                    <p class="text-sm text-gray-400">• 提供机械强度</p>
                    <p class="text-sm text-gray-400">• P环固定于此</p>
                    <p class="text-sm text-gray-400">• 革兰氏阴性菌较薄</p>
                </div>
            `,
            onClick: (t) => { this.highlightObject(t); this.showInfoPanel(t); }
        };
        
        this.membranes.peptidoglycan = pgGroup;
        this.interactables.push(pgGroup);
        this.mainGroup.add(pgGroup);
    }

    createPRing() {
        // P环 - 位于肽聚糖层
        const ringGeo = new THREE.TorusGeometry(0.8, 0.2, 16, 32);
        const ringMat = new THREE.MeshStandardMaterial({
            color: 0x3498db,
            metalness: 0.5,
            roughness: 0.4
        });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.rotation.x = Math.PI / 2;
        ring.position.y = -0.5;
        
        ring.userData = {
            hoverTitle: 'P环',
            hoverDesc: '肽聚糖层中的轴承环',
            hoverIcon: 'fa-ring',
            name: 'P环',
            description: `
                <p class="text-lg font-bold text-blue-400 mb-3">💎 P环（Peptidoglycan Ring）</p>
                <p class="text-gray-300 mb-3">嵌入肽聚糖层的轴承结构</p>
                <div class="bg-gray-800 rounded p-3">
                    <p class="text-sm text-gray-400">• 与L环一起支撑杆的旋转</p>
                    <p class="text-sm text-gray-400">• 由FlgI蛋白组成</p>
                    <p class="text-sm text-gray-400">• 减少摩擦，提高效率</p>
                </div>
            `,
            onClick: (t) => { this.highlightObject(t); this.showInfoPanel(t); }
        };
        
        this.rings.pRing = ring;
        this.interactables.push(ring);
        this.mainGroup.add(ring);
    }

    createLRing() {
        // L环 - 位于外膜
        const ringGeo = new THREE.TorusGeometry(0.7, 0.18, 16, 32);
        const ringMat = new THREE.MeshStandardMaterial({
            color: 0x1abc9c,
            metalness: 0.5,
            roughness: 0.4
        });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.rotation.x = Math.PI / 2;
        ring.position.y = 0.2;
        
        ring.userData = {
            hoverTitle: 'L环',
            hoverDesc: '外膜中的轴承环',
            hoverIcon: 'fa-ring',
            name: 'L环',
            description: `
                <p class="text-lg font-bold text-teal-400 mb-3">💍 L环（Lipopolysaccharide Ring）</p>
                <p class="text-gray-300 mb-3">嵌入外膜的轴承结构</p>
                <div class="bg-gray-800 rounded p-3">
                    <p class="text-sm text-gray-400">• 与P环协同支撑杆</p>
                    <p class="text-sm text-gray-400">• 由FlgH蛋白组成</p>
                    <p class="text-sm text-gray-400">• 是杆穿过外膜的通道</p>
                </div>
            `,
            onClick: (t) => { this.highlightObject(t); this.showInfoPanel(t); }
        };
        
        this.rings.lRing = ring;
        this.interactables.push(ring);
        this.mainGroup.add(ring);
    }

    createOuterMembrane() {
        // 外膜
        const membraneGeo = new THREE.CylinderGeometry(4.5, 4.5, 0.25, 64, 1, true);
        const membraneMat = new THREE.MeshStandardMaterial({
            color: 0x2980b9,
            transparent: true,
            opacity: 0.35,
            side: THREE.DoubleSide
        });
        const membrane = new THREE.Mesh(membraneGeo, membraneMat);
        membrane.position.y = 0.3;
        
        // 填充
        const fillGeo = new THREE.RingGeometry(1, 4.5, 64);
        const fillMat = new THREE.MeshStandardMaterial({
            color: 0x2980b9,
            transparent: true,
            opacity: 0.25,
            side: THREE.DoubleSide
        });
        const fillTop = new THREE.Mesh(fillGeo, fillMat);
        fillTop.rotation.x = -Math.PI / 2;
        fillTop.position.y = 0.42;
        this.mainGroup.add(fillTop);
        
        membrane.userData = {
            hoverTitle: '外膜',
            hoverDesc: '细菌的外层保护膜',
            hoverIcon: 'fa-shield-alt',
            name: '外膜',
            description: `
                <p class="text-lg font-bold text-blue-500 mb-3">🛡️ 外膜（Outer Membrane）</p>
                <p class="text-gray-300 mb-3">革兰氏阴性菌特有的外层膜</p>
                <div class="bg-gray-800 rounded p-3">
                    <p class="text-sm text-gray-400">• L环嵌入其中</p>
                    <p class="text-sm text-gray-400">• 含有脂多糖（LPS）</p>
                    <p class="text-sm text-gray-400">• 保护细菌免受有害物质</p>
                </div>
            `,
            onClick: (t) => { this.highlightObject(t); this.showInfoPanel(t); }
        };
        
        this.membranes.outer = membrane;
        this.interactables.push(membrane);
        this.mainGroup.add(membrane);
    }

    createRod() {
        // 杆 - 连接MS环和钩
        const rodGroup = new THREE.Group();
        
        // 近端杆
        const proximalGeo = new THREE.CylinderGeometry(0.35, 0.4, 2.5, 16);
        const proximalMat = new THREE.MeshStandardMaterial({
            color: 0xf39c12,
            metalness: 0.6,
            roughness: 0.3
        });
        const proximal = new THREE.Mesh(proximalGeo, proximalMat);
        proximal.position.y = -2;
        rodGroup.add(proximal);
        
        // 远端杆
        const distalGeo = new THREE.CylinderGeometry(0.3, 0.35, 2, 16);
        const distalMat = new THREE.MeshStandardMaterial({
            color: 0xe67e22,
            metalness: 0.6,
            roughness: 0.3
        });
        const distal = new THREE.Mesh(distalGeo, distalMat);
        distal.position.y = 0;
        rodGroup.add(distal);
        
        rodGroup.userData = {
            hoverTitle: '杆（Rod）',
            hoverDesc: '传递扭矩的驱动轴',
            hoverIcon: 'fa-arrows-alt-v',
            name: '杆',
            description: `
                <p class="text-lg font-bold text-yellow-400 mb-3">📍 杆（Rod）</p>
                <p class="text-gray-300 mb-3">连接转子和鞭毛的驱动轴</p>
                <div class="bg-gray-800 rounded p-3 mb-3">
                    <p class="text-sm text-white">结构组成：</p>
                    <p class="text-sm text-gray-400">• 近端杆 - FlgB, FlgC, FlgF</p>
                    <p class="text-sm text-gray-400">• 远端杆 - FlgG</p>
                    <p class="text-sm text-gray-400">• 穿过P环和L环</p>
                </div>
                <p class="text-sm text-orange-400">🔧 将转子的旋转传递给鞭毛</p>
            `,
            onClick: (t) => { this.highlightObject(t); this.showInfoPanel(t); }
        };
        
        this.rod = rodGroup;
        this.interactables.push(rodGroup);
        this.mainGroup.add(rodGroup);
    }

    createHook() {
        // 钩 - 万向节结构
        const hookGroup = new THREE.Group();
        
        // 钩主体 - 弯曲的圆柱
        const curve = new THREE.CatmullRomCurve3([
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(0.1, 0.5, 0),
            new THREE.Vector3(0.3, 1, 0.1),
            new THREE.Vector3(0.2, 1.5, 0)
        ]);
        
        const hookGeo = new THREE.TubeGeometry(curve, 20, 0.25, 12, false);
        const hookMat = new THREE.MeshStandardMaterial({
            color: 0xf1c40f,
            metalness: 0.5,
            roughness: 0.4
        });
        const hook = new THREE.Mesh(hookGeo, hookMat);
        hook.position.y = 1;
        hookGroup.add(hook);
        
        hookGroup.userData = {
            hoverTitle: '钩（Hook）',
            hoverDesc: '柔性万向节，传递旋转',
            hoverIcon: 'fa-link',
            name: '钩',
            description: `
                <p class="text-lg font-bold text-yellow-300 mb-3">🔗 钩（Hook）</p>
                <p class="text-gray-300 mb-3">连接杆和鞭毛丝的柔性结构</p>
                <div class="bg-gray-800 rounded p-3">
                    <p class="text-sm text-gray-400">• 作为万向节传递扭矩</p>
                    <p class="text-sm text-gray-400">• 由FlgE蛋白组成</p>
                    <p class="text-sm text-gray-400">• 长度约55纳米</p>
                    <p class="text-sm text-gray-400">• 允许鞭毛以不同角度旋转</p>
                </div>
            `,
            onClick: (t) => { this.highlightObject(t); this.showInfoPanel(t); }
        };
        
        this.hook = hookGroup;
        this.interactables.push(hookGroup);
        this.mainGroup.add(hookGroup);
    }

    createFlagellum() {
        // 鞭毛丝 - 螺旋结构
        const flagellumGroup = new THREE.Group();
        
        // 创建螺旋曲线
        const points = [];
        const turns = 4;
        const height = 8;
        const radius = 0.8;
        
        for (let i = 0; i <= 200; i++) {
            const t = i / 200;
            const angle = t * turns * Math.PI * 2;
            const y = t * height;
            const r = radius * (1 - t * 0.3); // 逐渐变细
            points.push(new THREE.Vector3(
                Math.cos(angle) * r,
                y,
                Math.sin(angle) * r
            ));
        }
        
        const curve = new THREE.CatmullRomCurve3(points);
        const flagGeo = new THREE.TubeGeometry(curve, 100, 0.12, 8, false);
        const flagMat = new THREE.MeshStandardMaterial({
            color: 0xecf0f1,
            metalness: 0.3,
            roughness: 0.6
        });
        const flagellum = new THREE.Mesh(flagGeo, flagMat);
        flagellum.position.y = 2.5;
        flagellumGroup.add(flagellum);
        
        flagellumGroup.userData = {
            hoverTitle: '鞭毛丝（Filament）',
            hoverDesc: '螺旋推进器，推动细菌前进',
            hoverIcon: 'fa-wind',
            name: '鞭毛丝',
            description: `
                <p class="text-lg font-bold text-gray-200 mb-3">🌀 鞭毛丝（Flagellar Filament）</p>
                <p class="text-gray-300 mb-3">细菌的"螺旋桨"</p>
                <div class="bg-gray-800 rounded p-3 mb-3">
                    <p class="text-sm text-white">结构特点：</p>
                    <p class="text-sm text-gray-400">• 由FliC（鞭毛蛋白）组成</p>
                    <p class="text-sm text-gray-400">• 呈左手螺旋结构</p>
                    <p class="text-sm text-gray-400">• 长度可达20微米</p>
                    <p class="text-sm text-gray-400">• 直径约20纳米</p>
                </div>
                <p class="text-sm text-green-400">🚀 旋转产生推力，使细菌前进</p>
            `,
            onClick: (t) => { this.highlightObject(t); this.showInfoPanel(t); }
        };
        
        this.flagellum = flagellumGroup;
        this.interactables.push(flagellumGroup);
        this.mainGroup.add(flagellumGroup);
    }

    createProtons() {
        // 创建质子粒子
        const protonGeo = new THREE.SphereGeometry(0.08, 8, 8);
        const protonMat = new THREE.MeshBasicMaterial({
            color: 0x00ffff,
            transparent: true,
            opacity: 0.8
        });
        
        for (let i = 0; i < 24; i++) {
            const proton = new THREE.Mesh(protonGeo, protonMat.clone());
            const statorIndex = i % 8;
            const angle = (statorIndex / 8) * Math.PI * 2;
            
            proton.position.set(
                Math.cos(angle) * 2.3,
                -1 - Math.random() * 2,
                Math.sin(angle) * 2.3
            );
            
            proton.userData = {
                statorIndex,
                angle,
                offset: Math.random() * Math.PI * 2,
                speed: 0.02 + Math.random() * 0.02
            };
            
            this.protons.push(proton);
            this.mainGroup.add(proton);
        }
    }

    createLabels() {
        // 3D标签
        const labels = [
            { text: '鞭毛丝', pos: new THREE.Vector3(2, 8, 0), color: '#ecf0f1' },
            { text: '钩', pos: new THREE.Vector3(1.5, 2, 0), color: '#f1c40f' },
            { text: '外膜', pos: new THREE.Vector3(5, 0.3, 0), color: '#2980b9' },
            { text: '肽聚糖层', pos: new THREE.Vector3(5, -0.8, 0), color: '#95a5a6' },
            { text: '内膜', pos: new THREE.Vector3(5, -2, 0), color: '#c0392b' },
            { text: 'MS环', pos: new THREE.Vector3(3, -3.5, 0), color: '#e67e22' },
            { text: 'C环', pos: new THREE.Vector3(4, -5, 0), color: '#2d8f4e' }
        ];
        
        labels.forEach(label => {
            const canvas = document.createElement('canvas');
            canvas.width = 256;
            canvas.height = 64;
            const ctx = canvas.getContext('2d');
            
            ctx.fillStyle = 'rgba(0,0,0,0.6)';
            ctx.roundRect(0, 0, 256, 64, 8);
            ctx.fill();
            
            ctx.fillStyle = label.color;
            ctx.font = 'bold 28px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(label.text, 128, 32);
            
            const texture = new THREE.CanvasTexture(canvas);
            const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
                map: texture,
                transparent: true
            }));
            sprite.scale.set(2, 0.5, 1);
            sprite.position.copy(label.pos);
            this.mainGroup.add(sprite);
        });
    }

    createDecorations() {
        // 细胞质背景粒子
        const particleGeo = new THREE.BufferGeometry();
        const positions = [];
        
        for (let i = 0; i < 200; i++) {
            positions.push(
                (Math.random() - 0.5) * 20,
                (Math.random() - 0.5) * 20 - 5,
                (Math.random() - 0.5) * 20
            );
        }
        
        particleGeo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        const particleMat = new THREE.PointsMaterial({
            color: 0x446688,
            size: 0.1,
            transparent: true,
            opacity: 0.5
        });
        const particles = new THREE.Points(particleGeo, particleMat);
        this.scene.add(particles);
    }

    // ==================== 动画和交互 ====================

    update(delta) {
        if (!this.mainGroup) return;
        
        // 旋转动画
        if (this.isRotating) {
            // 转子部件旋转
            if (this.rings.msRing) {
                this.rings.msRing.rotation.y += this.rotationSpeed;
            }
            if (this.rings.cRing) {
                this.rings.cRing.rotation.y += this.rotationSpeed;
            }
            if (this.rod) {
                this.rod.rotation.y += this.rotationSpeed;
            }
            if (this.hook) {
                this.hook.rotation.y += this.rotationSpeed;
            }
            if (this.flagellum) {
                this.flagellum.rotation.y += this.rotationSpeed;
            }
        }
        
        // 质子流动动画
        if (this.protonFlow) {
            this.protons.forEach(proton => {
                const data = proton.userData;
                data.offset += data.speed;
                
                // 质子沿定子通道移动
                const yPos = -1 + Math.sin(data.offset) * 1.5;
                proton.position.y = yPos;
                
                // 脉冲效果
                const scale = 0.8 + Math.sin(data.offset * 2) * 0.3;
                proton.scale.setScalar(scale);
                proton.material.opacity = 0.5 + Math.sin(data.offset) * 0.3;
            });
        }
    }

    createControls() {
        const controlsDiv = document.getElementById('scene-controls');
        controlsDiv.style.display = 'flex';
        controlsDiv.innerHTML = `
            <button class="control-btn ${this.isRotating ? 'active' : ''}" id="btn-rotate">
                <i class="fas fa-sync-alt mr-1"></i>
                <span>${this.isRotating ? '停止旋转' : '开始旋转'}</span>
            </button>
            <button class="control-btn" id="btn-speed-down">
                <i class="fas fa-minus mr-1"></i>
                <span>减速</span>
            </button>
            <button class="control-btn" id="btn-speed-up">
                <i class="fas fa-plus mr-1"></i>
                <span>加速</span>
            </button>
            <button class="control-btn ${this.protonFlow ? 'active' : ''}" id="btn-proton">
                <i class="fas fa-bolt mr-1"></i>
                <span>质子流</span>
            </button>
            <button class="control-btn" id="btn-reset-view">
                <i class="fas fa-home mr-1"></i>
                <span>重置视角</span>
            </button>
        `;
        
        // 绑定事件
        document.getElementById('btn-rotate').addEventListener('click', () => this.toggleRotation());
        document.getElementById('btn-speed-down').addEventListener('click', () => this.adjustSpeed(-0.01));
        document.getElementById('btn-speed-up').addEventListener('click', () => this.adjustSpeed(0.01));
        document.getElementById('btn-proton').addEventListener('click', () => this.toggleProtonFlow());
        document.getElementById('btn-reset-view').addEventListener('click', () => this.resetView());
    }

    toggleRotation() {
        this.isRotating = !this.isRotating;
        const btn = document.getElementById('btn-rotate');
        if (btn) {
            btn.classList.toggle('active', this.isRotating);
            btn.querySelector('span').textContent = this.isRotating ? '停止旋转' : '开始旋转';
        }
    }

    adjustSpeed(delta) {
        this.rotationSpeed = Math.max(0.005, Math.min(0.1, this.rotationSpeed + delta));
    }

    toggleProtonFlow() {
        this.protonFlow = !this.protonFlow;
        const btn = document.getElementById('btn-proton');
        if (btn) {
            btn.classList.toggle('active', this.protonFlow);
        }
        
        // 隐藏/显示质子
        this.protons.forEach(p => {
            p.visible = this.protonFlow;
        });
    }

    resetView() {
        if (this.camera) {
            gsap.to(this.camera.position, {
                x: this.defaultCameraPos.x,
                y: this.defaultCameraPos.y,
                z: this.defaultCameraPos.z,
                duration: 1,
                ease: 'power2.out'
            });
        }
    }

    startAutoPlay() {
        this.isAutoPlaying = true;
        this.isRotating = true;
        this.protonFlow = true;
        
        // 缓慢旋转展示整体结构
        gsap.to(this.mainGroup.rotation, {
            y: Math.PI * 2,
            duration: 20,
            ease: 'none',
            repeat: -1
        });
    }

    highlightObject(object) {
        // 清除之前的高亮
        if (this.highlighted) {
            this.highlighted.traverse(child => {
                if (child.isMesh && child.userData.originalEmissive !== undefined) {
                    child.material.emissive.setHex(child.userData.originalEmissive);
                }
            });
        }
        
        // 高亮新对象
        this.highlighted = object;
        object.traverse(child => {
            if (child.isMesh && child.material.emissive) {
                child.userData.originalEmissive = child.material.emissive.getHex();
                child.material.emissive.setHex(0x444444);
            }
        });
    }

    showInfoPanel(object) {
        const panel = document.getElementById('info-panel');
        const title = document.getElementById('info-title');
        const content = document.getElementById('info-content');
        
        if (panel && object.userData.name) {
            title.textContent = object.userData.name;
            content.innerHTML = object.userData.description;
            panel.classList.add('visible');
        }
    }
};
