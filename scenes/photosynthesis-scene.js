/**
 * 光合作用与呼吸作用 3D教学场景 v2.0
 * ============================================
 * 全新重构版本 - 清晰的结构与动态流程
 * 
 * 参考设计：剖面图+动态分子流+分步教学
 * ============================================
 */

class PhotosynthesisScene {
    constructor(scene, camera, renderer) {
        this.scene = scene;
        this.camera = camera;
        this.renderer = renderer;
        
        this.name = 'PhotosynthesisScene';
        this.mainGroup = null;
        
        // 核心元素
        this.chloroplast = null;      // 叶绿体（左侧）
        this.mitochondria = null;     // 线粒体（右侧）
        this.molecules = [];          // 所有分子
        this.flowArrows = [];         // 流程箭头
        this.labels = [];             // 标签
        
        // 动画状态
        this.isAutoPlaying = false;
        this.animationTime = 0;
        this.currentPhase = 0;        // 0=概览, 1=光反应, 2=暗反应, 3=呼吸作用
        
        // 颜色方案 - 清晰区分
        this.colors = {
            // 结构颜色
            chloroplastOuter: 0x2e7d32,   // 叶绿体外膜 - 深绿
            chloroplastInner: 0x4caf50,   // 叶绿体内膜 - 绿
            thylakoid: 0x81c784,          // 类囊体 - 浅绿
            grana: 0x388e3c,              // 基粒 - 翠绿
            stroma: 0xa5d6a7,             // 基质 - 淡绿
            
            mitochondriaOuter: 0xc2185b,  // 线粒体外膜 - 深粉
            mitochondriaInner: 0xe91e63,  // 线粒体内膜 - 粉红
            cristae: 0xf06292,            // 嵴 - 浅粉
            matrix: 0xf8bbd9,             // 基质 - 淡粉
            
            // 分子颜色
            light: 0xffeb3b,       // 光 - 黄色
            h2o: 0x2196f3,         // 水 - 蓝色
            co2: 0x9e9e9e,         // CO₂ - 灰色
            o2: 0x00bcd4,          // O₂ - 青色
            glucose: 0xff9800,     // 葡萄糖 - 橙色
            atp: 0xf44336,         // ATP - 红色
            nadph: 0x9c27b0,       // NADPH - 紫色
            
            // UI颜色
            arrow: 0x00e676,       // 箭头 - 亮绿
            highlight: 0xffeb3b,   // 高亮 - 黄
            text: 0xffffff         // 文字 - 白
        };
        
        // 教学阶段
        this.phases = [
            {
                id: 0,
                title: '🌍 整体概览',
                subtitle: '光合作用与呼吸作用的关系',
                description: '植物通过光合作用将光能转化为化学能（葡萄糖），再通过呼吸作用释放能量（ATP）。这两个过程构成了生命的能量循环！',
                focus: 'overview'
            },
            {
                id: 1,
                title: '☀️ 光反应',
                subtitle: '发生在类囊体膜上',
                description: '光能被叶绿素吸收 → 水分子光解产生O₂ → 电子传递产生ATP和NADPH',
                formula: '2H₂O + 光能 → O₂↑ + 4H⁺ + 4e⁻ → ATP + NADPH',
                focus: 'lightReaction'
            },
            {
                id: 2,
                title: '🌑 暗反应（卡尔文循环）',
                subtitle: '发生在叶绿体基质中',
                description: 'CO₂被固定 → 利用ATP和NADPH还原 → 合成葡萄糖C₆H₁₂O₆',
                formula: '6CO₂ + ATP + NADPH → C₆H₁₂O₆',
                focus: 'darkReaction'
            },
            {
                id: 3,
                title: '🔥 细胞呼吸',
                subtitle: '发生在线粒体中',
                description: '葡萄糖被氧化分解 → 电子传递链产生大量ATP → 为生命活动提供能量',
                formula: 'C₆H₁₂O₆ + 6O₂ → 6CO₂ + 6H₂O + 38ATP',
                focus: 'respiration'
            }
        ];
        
        // 相机默认位置
        this.defaultCameraPos = { x: 0, y: 2, z: 18 };
    }

    init() {
        this.mainGroup = new THREE.Group();
        this.scene.add(this.mainGroup);
        
        // 设置环境
        this.setupEnvironment();
        this.setupLighting();
        
        // 创建主要结构
        this.createChloroplastCrossSection();  // 叶绿体剖面
        this.createMitochondriaCrossSection(); // 线粒体剖面
        
        // 创建分子和箭头
        this.createMolecules();
        this.createFlowSystem();
        
        // 创建信息标签
        this.createStructureLabels();
        
        // 设置相机
        if (this.camera) {
            this.camera.position.set(this.defaultCameraPos.x, this.defaultCameraPos.y, this.defaultCameraPos.z);
            this.camera.lookAt(0, 0, 0);
        }
        
        // 创建UI
        this.setupUI();
        this.createInfoPanel();
        
        // 初始引导
        setTimeout(() => {
            this.showGuide('🌱 欢迎来到光合作用与呼吸作用的世界！');
            this.updatePhaseDisplay();
        }, 500);
        
        console.log('PhotosynthesisScene v2.0 initialized');
    }

    /**
     * 设置环境
     */
    setupEnvironment() {
        // 深色背景
        this.scene.background = new THREE.Color(0x0a0a18);
        this.scene.fog = new THREE.FogExp2(0x0a0a18, 0.015);
        
        // 网格地面
        const grid = new THREE.GridHelper(40, 40, 0x1a3a1a, 0x0d1f0d);
        grid.position.y = -6;
        this.mainGroup.add(grid);
    }

    /**
     * 设置灯光
     */
    setupLighting() {
        // 环境光
        const ambient = new THREE.AmbientLight(0x404050, 0.6);
        this.scene.add(ambient);
        
        // 主光源（从上方，模拟阳光）
        const sunLight = new THREE.DirectionalLight(0xffffcc, 0.8);
        sunLight.position.set(-5, 15, 10);
        this.scene.add(sunLight);
        
        // 叶绿体区域绿光
        const greenLight = new THREE.PointLight(0x4caf50, 0.6, 15);
        greenLight.position.set(-6, 2, 5);
        this.mainGroup.add(greenLight);
        
        // 线粒体区域红光
        const pinkLight = new THREE.PointLight(0xe91e63, 0.6, 15);
        pinkLight.position.set(6, 2, 5);
        this.mainGroup.add(pinkLight);
    }

    /**
     * 创建叶绿体剖面图（左侧）
     */
    createChloroplastCrossSection() {
        this.chloroplast = new THREE.Group();
        this.chloroplast.position.set(-6, 0, 0);
        
        // 外膜（椭圆剖面）
        const outerShape = new THREE.Shape();
        outerShape.ellipse(0, 0, 3.5, 2.2, 0, Math.PI * 2);
        const outerGeometry = new THREE.ExtrudeGeometry(outerShape, { depth: 0.3, bevelEnabled: false });
        const outerMaterial = new THREE.MeshPhongMaterial({
            color: this.colors.chloroplastOuter,
            transparent: true,
            opacity: 0.5,
            side: THREE.DoubleSide
        });
        const outerMembrane = new THREE.Mesh(outerGeometry, outerMaterial);
        outerMembrane.rotation.x = -Math.PI / 2;
        outerMembrane.position.y = 1;
        this.chloroplast.add(outerMembrane);
        
        // 基质（内部填充）
        const stromaGeometry = new THREE.CylinderGeometry(3.2, 3.2, 0.4, 32, 1, false, 0, Math.PI * 2);
        stromaGeometry.scale(1.1, 1, 0.7);
        const stromaMaterial = new THREE.MeshPhongMaterial({
            color: this.colors.stroma,
            transparent: true,
            opacity: 0.3
        });
        const stroma = new THREE.Mesh(stromaGeometry, stromaMaterial);
        stroma.position.y = 0;
        stroma.userData = {
            name: '叶绿体基质 (Stroma)',
            info: '<b>基质</b>是叶绿体内部的液态部分<br><br><b>暗反应（卡尔文循环）</b>在此进行：<br>• CO₂固定<br>• ATP和NADPH参与还原<br>• 合成葡萄糖',
            hoverTitle: '基质',
            hoverDesc: '暗反应（卡尔文循环）场所',
            hoverIcon: 'fa-circle',
            isInteractive: true
        };
        this.chloroplast.add(stroma);
        
        // 创建基粒（类囊体堆叠）
        this.createGranaStacks();
        
        // 创建类囊体连接
        this.createThylakoidConnections();
        
        // 标题标签
        const titleLabel = this.create3DLabel('叶绿体', this.colors.chloroplastOuter, { fontSize: 40, width: 200 });
        titleLabel.position.set(0, 3.5, 0);
        this.chloroplast.add(titleLabel);
        
        // 交互信息
        this.chloroplast.userData = {
            name: '叶绿体 (Chloroplast)',
            info: `<b>叶绿体</b> - 光合作用的"工厂"<br><br>
                <b>结构组成：</b><br>
                • 外膜和内膜（双层膜）<br>
                • 类囊体膜（光反应场所）<br>
                • 基粒（类囊体堆叠）<br>
                • 基质（暗反应场所）<br><br>
                <b>总反应式：</b><br>
                6CO₂ + 6H₂O + 光能 → C₆H₁₂O₆ + 6O₂`,
            hoverTitle: '叶绿体',
            hoverDesc: '光合作用的场所',
            hoverIcon: 'fa-leaf',
            isInteractive: true
        };
        
        this.mainGroup.add(this.chloroplast);
    }

    /**
     * 创建基粒堆叠
     */
    createGranaStacks() {
        const granaGroup = new THREE.Group();
        
        // 三个基粒堆
        const positions = [
            { x: -1.5, y: 0, z: 0 },
            { x: 0, y: 0, z: 0.5 },
            { x: 1.5, y: 0, z: -0.3 }
        ];
        
        positions.forEach((pos, idx) => {
            const stack = new THREE.Group();
            stack.position.set(pos.x, pos.y, pos.z);
            
            // 每个基粒由5-7层类囊体组成
            const layers = 5 + Math.floor(Math.random() * 3);
            for (let i = 0; i < layers; i++) {
                const diskGeometry = new THREE.CylinderGeometry(0.5, 0.5, 0.12, 16);
                const diskMaterial = new THREE.MeshPhongMaterial({
                    color: this.colors.grana,
                    emissive: this.colors.grana,
                    emissiveIntensity: 0.2
                });
                const disk = new THREE.Mesh(diskGeometry, diskMaterial);
                disk.position.y = -0.6 + i * 0.15;
                stack.add(disk);
            }
            
            stack.userData = {
                name: `基粒 ${idx + 1}`,
                info: '<b>基粒 (Granum)</b><br><br>由多层类囊体堆叠而成，是<b>光反应</b>的主要场所。<br><br>含有：<br>• 叶绿素（吸收光能）<br>• 光系统I和II<br>• 电子传递链<br>• ATP合酶',
                hoverTitle: '基粒',
                hoverDesc: '类囊体堆叠，光反应场所',
                hoverIcon: 'fa-layer-group',
                isInteractive: true
            };
            
            granaGroup.add(stack);
        });
        
        this.chloroplast.add(granaGroup);
        this.granaGroup = granaGroup;
    }

    /**
     * 创建类囊体连接
     */
    createThylakoidConnections() {
        const connectionsMaterial = new THREE.MeshPhongMaterial({
            color: this.colors.thylakoid,
            transparent: true,
            opacity: 0.6
        });
        
        // 连接基粒的片层
        for (let i = 0; i < 3; i++) {
            const curve = new THREE.CatmullRomCurve3([
                new THREE.Vector3(-1.5, -0.3 + i * 0.3, 0),
                new THREE.Vector3(-0.5, -0.2 + i * 0.3, 0.3),
                new THREE.Vector3(0.5, -0.3 + i * 0.3, 0.4),
                new THREE.Vector3(1.5, -0.2 + i * 0.3, 0)
            ]);
            
            const tubeGeometry = new THREE.TubeGeometry(curve, 20, 0.06, 8, false);
            const tube = new THREE.Mesh(tubeGeometry, connectionsMaterial);
            this.chloroplast.add(tube);
        }
    }

    /**
     * 创建线粒体剖面图（右侧）
     */
    createMitochondriaCrossSection() {
        this.mitochondria = new THREE.Group();
        this.mitochondria.position.set(6, 0, 0);
        
        // 外膜（椭圆剖面）
        const outerShape = new THREE.Shape();
        outerShape.ellipse(0, 0, 3, 2, 0, Math.PI * 2);
        const outerGeometry = new THREE.ExtrudeGeometry(outerShape, { depth: 0.3, bevelEnabled: false });
        const outerMaterial = new THREE.MeshPhongMaterial({
            color: this.colors.mitochondriaOuter,
            transparent: true,
            opacity: 0.5,
            side: THREE.DoubleSide
        });
        const outerMembrane = new THREE.Mesh(outerGeometry, outerMaterial);
        outerMembrane.rotation.x = -Math.PI / 2;
        outerMembrane.position.y = 1;
        this.mitochondria.add(outerMembrane);
        
        // 基质
        const matrixGeometry = new THREE.CylinderGeometry(2.7, 2.7, 0.4, 32);
        matrixGeometry.scale(1.1, 1, 0.75);
        const matrixMaterial = new THREE.MeshPhongMaterial({
            color: this.colors.matrix,
            transparent: true,
            opacity: 0.3
        });
        const matrix = new THREE.Mesh(matrixGeometry, matrixMaterial);
        matrix.userData = {
            name: '线粒体基质 (Matrix)',
            info: '<b>基质</b>是线粒体内膜围成的空间<br><br><b>三羧酸循环（柠檬酸循环）</b>在此进行：<br>• 丙酮酸氧化分解<br>• 产生NADH和FADH₂<br>• 释放CO₂',
            hoverTitle: '基质',
            hoverDesc: '三羧酸循环场所',
            hoverIcon: 'fa-circle',
            isInteractive: true
        };
        this.mitochondria.add(matrix);
        
        // 创建内膜嵴
        this.createCristae();
        
        // 标题标签
        const titleLabel = this.create3DLabel('线粒体', this.colors.mitochondriaOuter, { fontSize: 40, width: 200 });
        titleLabel.position.set(0, 3.2, 0);
        this.mitochondria.add(titleLabel);
        
        // 交互信息
        this.mitochondria.userData = {
            name: '线粒体 (Mitochondria)',
            info: `<b>线粒体</b> - 细胞的"能量工厂"<br><br>
                <b>结构组成：</b><br>
                • 外膜（通透性高）<br>
                • 内膜（折叠成嵴）<br>
                • 嵴（电子传递链）<br>
                • 基质（三羧酸循环）<br><br>
                <b>总反应式：</b><br>
                C₆H₁₂O₆ + 6O₂ → 6CO₂ + 6H₂O + 38ATP`,
            hoverTitle: '线粒体',
            hoverDesc: '细胞呼吸的场所',
            hoverIcon: 'fa-bolt',
            isInteractive: true
        };
        
        this.mainGroup.add(this.mitochondria);
    }

    /**
     * 创建内膜嵴
     */
    createCristae() {
        const cristaeGroup = new THREE.Group();
        
        // 褶皱状内膜
        for (let i = 0; i < 5; i++) {
            const curve = new THREE.CatmullRomCurve3([
                new THREE.Vector3(-2, -0.5 + i * 0.25, 0),
                new THREE.Vector3(-1, -0.3 + i * 0.25, 0.4),
                new THREE.Vector3(0, -0.5 + i * 0.25, -0.3),
                new THREE.Vector3(1, -0.3 + i * 0.25, 0.2),
                new THREE.Vector3(2, -0.5 + i * 0.25, 0)
            ]);
            
            const geometry = new THREE.TubeGeometry(curve, 30, 0.1, 8, false);
            const material = new THREE.MeshPhongMaterial({
                color: this.colors.cristae,
                emissive: this.colors.cristae,
                emissiveIntensity: 0.15
            });
            const tube = new THREE.Mesh(geometry, material);
            cristaeGroup.add(tube);
        }
        
        cristaeGroup.userData = {
            name: '内膜嵴 (Cristae)',
            info: '<b>嵴</b>是内膜向内折叠形成的结构<br><br>大大增加了表面积，是<b>氧化磷酸化</b>的场所：<br>• 电子传递链<br>• ATP合酶<br>• 产生大量ATP（约34个/葡萄糖）',
            hoverTitle: '内膜嵴',
            hoverDesc: '电子传递链和ATP合成场所',
            hoverIcon: 'fa-wave-square',
            isInteractive: true
        };
        
        this.mitochondria.add(cristaeGroup);
        this.cristaeGroup = cristaeGroup;
    }

    /**
     * 创建分子
     */
    createMolecules() {
        // 光子（太阳光）
        this.createPhotonGroup();
        
        // 水分子 H₂O
        this.createMoleculeGroup('H₂O', this.colors.h2o, 5, { x: -10, y: 2, z: 0 }, 'water');
        
        // 二氧化碳 CO₂
        this.createMoleculeGroup('CO₂', this.colors.co2, 6, { x: -10, y: -1, z: 0 }, 'co2');
        
        // 氧气 O₂（光合作用产物）
        this.createMoleculeGroup('O₂', this.colors.o2, 6, { x: -6, y: 1, z: 2 }, 'o2');
        
        // 葡萄糖
        this.createMoleculeGroup('葡萄糖', this.colors.glucose, 3, { x: 0, y: 0, z: 0 }, 'glucose');
        
        // ATP（光反应产物）
        this.createMoleculeGroup('ATP', this.colors.atp, 4, { x: -4, y: 0.5, z: 1 }, 'atp_light');
        
        // ATP（呼吸作用产物）
        this.createMoleculeGroup('ATP', this.colors.atp, 8, { x: 8, y: 0, z: 2 }, 'atp_resp');
        
        // NADPH
        this.createMoleculeGroup('NADPH', this.colors.nadph, 3, { x: -5, y: 0, z: 1 }, 'nadph');
    }

    /**
     * 创建光子群
     */
    createPhotonGroup() {
        this.photons = [];
        
        for (let i = 0; i < 12; i++) {
            const photon = new THREE.Group();
            
            // 核心
            const coreGeometry = new THREE.SphereGeometry(0.1, 8, 8);
            const coreMaterial = new THREE.MeshBasicMaterial({ color: this.colors.light });
            const core = new THREE.Mesh(coreGeometry, coreMaterial);
            photon.add(core);
            
            // 光晕
            const glowGeometry = new THREE.SphereGeometry(0.2, 8, 8);
            const glowMaterial = new THREE.MeshBasicMaterial({
                color: this.colors.light,
                transparent: true,
                opacity: 0.4
            });
            const glow = new THREE.Mesh(glowGeometry, glowMaterial);
            photon.add(glow);
            
            // 光线（射线效果）
            const rayGeometry = new THREE.CylinderGeometry(0.02, 0.02, 0.5, 4);
            const rayMaterial = new THREE.MeshBasicMaterial({ color: this.colors.light, transparent: true, opacity: 0.6 });
            for (let r = 0; r < 4; r++) {
                const ray = new THREE.Mesh(rayGeometry, rayMaterial);
                ray.rotation.z = (Math.PI / 4) * r;
                ray.position.y = 0.15;
                photon.add(ray);
            }
            
            photon.position.set(-14 + Math.random() * 2, 6 + Math.random() * 2, Math.random() * 4 - 2);
            photon.userData = {
                phase: Math.random() * Math.PI * 2,
                speed: 1.5 + Math.random() * 0.5,
                name: '光子 (Photon)',
                info: '<b>光子</b> - 光能的载体<br><br>太阳光子被叶绿素捕获，激发电子跃迁到高能态，启动光合作用！',
                type: 'photon'
            };
            
            this.photons.push(photon);
            this.mainGroup.add(photon);
        }
    }

    /**
     * 创建分子组
     */
    createMoleculeGroup(label, color, count, startPos, type) {
        for (let i = 0; i < count; i++) {
            const mol = this.createMolecule(label, color, type);
            mol.position.set(
                startPos.x + (Math.random() - 0.5) * 2,
                startPos.y + (Math.random() - 0.5) * 1,
                startPos.z + (Math.random() - 0.5) * 2
            );
            mol.userData.type = type;
            mol.userData.phase = Math.random() * Math.PI * 2;
            mol.userData.basePos = mol.position.clone();
            
            // 某些分子初始隐藏
            if (type === 'glucose' || type === 'atp_resp' || type === 'o2') {
                mol.visible = false;
            }
            
            this.molecules.push(mol);
            this.mainGroup.add(mol);
        }
    }

    /**
     * 创建单个分子
     */
    createMolecule(label, color, type) {
        const group = new THREE.Group();
        
        // 分子球
        const size = type === 'glucose' ? 0.3 : 0.18;
        const geometry = new THREE.SphereGeometry(size, 16, 16);
        const material = new THREE.MeshPhongMaterial({
            color: color,
            emissive: color,
            emissiveIntensity: 0.4,
            transparent: true,
            opacity: 0.9
        });
        const sphere = new THREE.Mesh(geometry, material);
        group.add(sphere);
        
        // 光晕
        const glowGeometry = new THREE.SphereGeometry(size * 1.5, 8, 8);
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: color,
            transparent: true,
            opacity: 0.25,
            side: THREE.BackSide
        });
        const glow = new THREE.Mesh(glowGeometry, glowMaterial);
        group.add(glow);
        
        // 分子标签
        const molLabel = this.create3DLabel(label, color, { fontSize: 24, width: 100 });
        molLabel.position.y = size + 0.3;
        molLabel.scale.setScalar(0.5);
        group.add(molLabel);
        
        // 交互信息
        const infoMap = {
            'water': { name: '水 H₂O', info: '<b>水 H₂O</b><br><br>光合作用的原料，在光反应中被光解：<br>2H₂O → 4H⁺ + 4e⁻ + O₂↑' },
            'co2': { name: '二氧化碳 CO₂', info: '<b>二氧化碳 CO₂</b><br><br>光合作用的原料，在暗反应中被固定，最终合成葡萄糖。' },
            'o2': { name: '氧气 O₂', info: '<b>氧气 O₂</b><br><br>光合作用的副产物！来自水的光解，这就是地球大气氧气的来源。' },
            'glucose': { name: '葡萄糖 C₆H₁₂O₆', info: '<b>葡萄糖</b><br><br>光合作用的产物，储存了化学能。可用于呼吸作用产生ATP。' },
            'atp_light': { name: 'ATP', info: '<b>ATP</b> - 光反应产物<br><br>用于暗反应中CO₂的还原。' },
            'atp_resp': { name: 'ATP', info: '<b>ATP</b> - 呼吸作用产物<br><br>一个葡萄糖完全氧化可产生约38个ATP！' },
            'nadph': { name: 'NADPH', info: '<b>NADPH</b><br><br>光反应产物，为暗反应提供还原力（电子和H⁺）。' }
        };
        
        const info = infoMap[type] || { name: label, info: label };
        group.userData = {
            ...info,
            hoverTitle: info.name,
            hoverDesc: '点击查看详情',
            hoverIcon: 'fa-atom',
            isInteractive: true
        };
        
        return group;
    }

    /**
     * 创建流程系统（箭头和路径）
     */
    createFlowSystem() {
        // 光 → 叶绿体
        this.createFlowArrow(
            new THREE.Vector3(-10, 4, 0),
            new THREE.Vector3(-7, 2, 0),
            this.colors.light,
            '光能'
        );
        
        // H₂O → 叶绿体
        this.createFlowArrow(
            new THREE.Vector3(-10, 2, 0),
            new THREE.Vector3(-8, 1, 0),
            this.colors.h2o,
            'H₂O'
        );
        
        // CO₂ → 叶绿体
        this.createFlowArrow(
            new THREE.Vector3(-10, -1, 0),
            new THREE.Vector3(-8, -0.5, 0),
            this.colors.co2,
            'CO₂'
        );
        
        // 叶绿体 → O₂（向上释放）
        this.createFlowArrow(
            new THREE.Vector3(-6, 2, 0),
            new THREE.Vector3(-6, 4.5, 0),
            this.colors.o2,
            'O₂↑'
        );
        
        // 叶绿体 → 葡萄糖 → 线粒体
        this.createFlowArrow(
            new THREE.Vector3(-3, 0, 0),
            new THREE.Vector3(3, 0, 0),
            this.colors.glucose,
            '葡萄糖'
        );
        
        // 线粒体 → ATP
        this.createFlowArrow(
            new THREE.Vector3(8.5, 0, 0),
            new THREE.Vector3(11, 0, 0),
            this.colors.atp,
            'ATP × 38'
        );
        
        // 线粒体 → CO₂（循环回）
        this.createFlowArrow(
            new THREE.Vector3(6, 2.5, 0),
            new THREE.Vector3(6, 4.5, 0),
            this.colors.co2,
            'CO₂↑'
        );
    }

    /**
     * 创建流程箭头
     */
    createFlowArrow(start, end, color, label) {
        const direction = end.clone().sub(start);
        const length = direction.length();
        direction.normalize();
        
        // 箭头
        const arrow = new THREE.ArrowHelper(direction, start, length, color, 0.3, 0.15);
        this.flowArrows.push(arrow);
        this.mainGroup.add(arrow);
        
        // 标签
        const midpoint = start.clone().add(end).multiplyScalar(0.5);
        const arrowLabel = this.create3DLabel(label, color, { fontSize: 24, width: 120 });
        arrowLabel.position.copy(midpoint);
        arrowLabel.position.y += 0.4;
        arrowLabel.position.z += 0.5;
        this.mainGroup.add(arrowLabel);
    }

    /**
     * 创建结构标签
     */
    createStructureLabels() {
        // 叶绿体内部结构标签
        const chloroLabels = [
            { text: '类囊体膜', pos: { x: -1.5, y: 1.5, z: 1 }, color: this.colors.thylakoid },
            { text: '基粒', pos: { x: 0, y: -1.2, z: 1 }, color: this.colors.grana },
            { text: '基质', pos: { x: 2, y: 0.5, z: 1 }, color: this.colors.stroma }
        ];
        
        chloroLabels.forEach(item => {
            const label = this.create3DLabel(item.text, item.color, { fontSize: 20, width: 100 });
            label.position.set(item.pos.x, item.pos.y, item.pos.z);
            label.scale.setScalar(0.6);
            this.chloroplast.add(label);
        });
        
        // 线粒体内部结构标签
        const mitoLabels = [
            { text: '内膜嵴', pos: { x: 0, y: -1, z: 1 }, color: this.colors.cristae },
            { text: '基质', pos: { x: 1.5, y: 0.5, z: 1 }, color: this.colors.matrix }
        ];
        
        mitoLabels.forEach(item => {
            const label = this.create3DLabel(item.text, item.color, { fontSize: 20, width: 100 });
            label.position.set(item.pos.x, item.pos.y, item.pos.z);
            label.scale.setScalar(0.6);
            this.mitochondria.add(label);
        });
    }

    /**
     * 创建3D文字标签
     */
    create3DLabel(text, color, options = {}) {
        const { fontSize = 32, width = 256, height = 64 } = options;
        
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = width;
        canvas.height = height;
        
        context.fillStyle = 'transparent';
        context.fillRect(0, 0, canvas.width, canvas.height);
        
        context.font = `bold ${fontSize}px Arial, sans-serif`;
        context.fillStyle = '#' + new THREE.Color(color).getHexString();
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        
        // 描边
        context.strokeStyle = '#000000';
        context.lineWidth = 2;
        context.strokeText(text, width / 2, height / 2);
        context.fillText(text, width / 2, height / 2);
        
        const texture = new THREE.CanvasTexture(canvas);
        texture.needsUpdate = true;
        
        const material = new THREE.SpriteMaterial({ map: texture, transparent: true });
        const sprite = new THREE.Sprite(material);
        sprite.scale.set(width / 64, height / 64, 1);
        
        return sprite;
    }

    /**
     * 设置UI控制面板
     */
    setupUI() {
        const controlsDiv = document.getElementById('scene-controls');
        if (!controlsDiv) return;
        
        controlsDiv.style.display = 'flex';
        controlsDiv.innerHTML = `
            <div class="photosynthesis-controls-v2">
                <div class="phase-nav">
                    <button class="phase-btn ${this.currentPhase === 0 ? 'active' : ''}" data-phase="0">
                        <i class="fas fa-globe"></i> 概览
                    </button>
                    <button class="phase-btn ${this.currentPhase === 1 ? 'active' : ''}" data-phase="1">
                        <i class="fas fa-sun"></i> 光反应
                    </button>
                    <button class="phase-btn ${this.currentPhase === 2 ? 'active' : ''}" data-phase="2">
                        <i class="fas fa-moon"></i> 暗反应
                    </button>
                    <button class="phase-btn ${this.currentPhase === 3 ? 'active' : ''}" data-phase="3">
                        <i class="fas fa-fire"></i> 呼吸作用
                    </button>
                </div>
                <div class="action-btns">
                    <button class="action-btn" id="btn-auto-demo">
                        <i class="fas fa-play"></i> 自动演示
                    </button>
                    <button class="action-btn" id="btn-reset-photo">
                        <i class="fas fa-undo"></i> 重置
                    </button>
                    <button class="action-btn" id="btn-reset-view">
                        <i class="fas fa-video"></i> 视角
                    </button>
                </div>
            </div>
        `;
        
        // 绑定事件
        document.querySelectorAll('.phase-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const phase = parseInt(e.currentTarget.dataset.phase);
                this.goToPhase(phase);
            });
        });
        
        document.getElementById('btn-auto-demo')?.addEventListener('click', () => {
            this.startAutoDemo();
        });
        
        document.getElementById('btn-reset-photo')?.addEventListener('click', () => {
            this.reset();
        });
        
        document.getElementById('btn-reset-view')?.addEventListener('click', () => {
            this.resetView();
        });
    }

    /**
     * 创建信息面板（右侧）
     */
    createInfoPanel() {
        const container = document.getElementById('view-scene');
        if (!container) return;
        
        // 移除旧面板
        const oldPanel = document.getElementById('photo-info-panel');
        if (oldPanel) oldPanel.remove();
        
        const panel = document.createElement('div');
        panel.id = 'photo-info-panel';
        panel.className = 'photo-info-panel';
        panel.innerHTML = `
            <div class="panel-header">
                <span class="panel-icon"><i class="fas fa-leaf"></i></span>
                <span class="panel-title">整体概览</span>
            </div>
            <div class="panel-subtitle">光合作用与呼吸作用的关系</div>
            <div class="panel-content">
                <p>植物通过光合作用将光能转化为化学能（葡萄糖），再通过呼吸作用释放能量（ATP）。</p>
            </div>
            <div class="panel-formula"></div>
        `;
        container.appendChild(panel);
        
        this.addPanelStyles();
    }

    /**
     * 添加面板样式
     */
    addPanelStyles() {
        if (document.getElementById('photo-panel-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'photo-panel-styles';
        style.textContent = `
            .photo-info-panel {
                position: absolute;
                right: 20px;
                top: 80px;
                width: 280px;
                background: rgba(20, 30, 40, 0.92);
                border: 1px solid rgba(76, 175, 80, 0.4);
                border-radius: 12px;
                padding: 16px;
                color: #fff;
                z-index: 100;
                box-shadow: 0 8px 32px rgba(0,0,0,0.4);
            }
            .panel-header {
                display: flex;
                align-items: center;
                gap: 10px;
                margin-bottom: 8px;
            }
            .panel-icon {
                width: 36px;
                height: 36px;
                background: linear-gradient(135deg, #4caf50, #2e7d32);
                border-radius: 8px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 18px;
            }
            .panel-title {
                font-size: 18px;
                font-weight: bold;
                color: #4caf50;
            }
            .panel-subtitle {
                font-size: 13px;
                color: #81c784;
                margin-bottom: 12px;
                padding-bottom: 12px;
                border-bottom: 1px solid rgba(76, 175, 80, 0.2);
            }
            .panel-content {
                font-size: 14px;
                line-height: 1.6;
                color: #ccc;
            }
            .panel-formula {
                margin-top: 12px;
                padding: 10px;
                background: rgba(76, 175, 80, 0.15);
                border-radius: 8px;
                font-family: 'Courier New', monospace;
                font-size: 13px;
                color: #81c784;
                text-align: center;
            }
            .panel-formula:empty {
                display: none;
            }
            
            /* 控制面板样式 */
            .photosynthesis-controls-v2 {
                display: flex;
                flex-direction: column;
                gap: 12px;
                padding: 10px;
            }
            .phase-nav {
                display: flex;
                gap: 8px;
                flex-wrap: wrap;
            }
            .phase-btn {
                padding: 8px 14px;
                background: rgba(255,255,255,0.1);
                border: 1px solid rgba(255,255,255,0.2);
                border-radius: 8px;
                color: #aaa;
                cursor: pointer;
                transition: all 0.3s;
                font-size: 13px;
            }
            .phase-btn:hover {
                background: rgba(76, 175, 80, 0.3);
                border-color: #4caf50;
                color: #fff;
            }
            .phase-btn.active {
                background: linear-gradient(135deg, #4caf50, #2e7d32);
                border-color: #4caf50;
                color: #fff;
            }
            .action-btns {
                display: flex;
                gap: 8px;
            }
            .action-btn {
                padding: 8px 14px;
                background: rgba(255,255,255,0.08);
                border: 1px solid rgba(255,255,255,0.15);
                border-radius: 8px;
                color: #ccc;
                cursor: pointer;
                transition: all 0.3s;
                font-size: 13px;
            }
            .action-btn:hover {
                background: rgba(255,255,255,0.15);
                color: #fff;
            }
        `;
        document.head.appendChild(style);
    }

    /**
     * 切换到指定阶段
     */
    goToPhase(phase) {
        if (phase < 0 || phase >= this.phases.length) return;
        
        this.currentPhase = phase;
        this.updatePhaseDisplay();
        this.executePhaseAnimation(phase);
        
        // 更新按钮状态
        document.querySelectorAll('.phase-btn').forEach((btn, i) => {
            btn.classList.toggle('active', i === phase);
        });
    }

    /**
     * 更新阶段显示
     */
    updatePhaseDisplay() {
        const phase = this.phases[this.currentPhase];
        const panel = document.getElementById('photo-info-panel');
        if (!panel) return;
        
        const iconMap = {
            0: 'fa-globe',
            1: 'fa-sun',
            2: 'fa-moon',
            3: 'fa-fire'
        };
        
        panel.querySelector('.panel-icon').innerHTML = `<i class="fas ${iconMap[this.currentPhase]}"></i>`;
        panel.querySelector('.panel-title').textContent = phase.title;
        panel.querySelector('.panel-subtitle').textContent = phase.subtitle;
        panel.querySelector('.panel-content').innerHTML = `<p>${phase.description}</p>`;
        panel.querySelector('.panel-formula').textContent = phase.formula || '';
    }

    /**
     * 执行阶段动画
     */
    executePhaseAnimation(phase) {
        // 重置所有可见性
        this.molecules.forEach(m => {
            if (m.userData.type === 'glucose' || m.userData.type === 'atp_resp' || m.userData.type === 'o2') {
                m.visible = false;
            }
        });
        
        switch (phase) {
            case 0: // 概览
                this.animateOverview();
                break;
            case 1: // 光反应
                this.animateLightReaction();
                break;
            case 2: // 暗反应
                this.animateDarkReaction();
                break;
            case 3: // 呼吸作用
                this.animateRespiration();
                break;
        }
    }

    /**
     * 概览动画
     */
    animateOverview() {
        // 相机移动到全景位置
        if (typeof gsap !== 'undefined') {
            gsap.to(this.camera.position, {
                x: 0, y: 3, z: 20,
                duration: 1,
                ease: 'power2.out'
            });
        }
        this.showGuide('🌍 光合作用：叶绿体 | 呼吸作用：线粒体');
    }

    /**
     * 光反应动画
     */
    animateLightReaction() {
        // 聚焦叶绿体
        if (typeof gsap !== 'undefined') {
            gsap.to(this.camera.position, {
                x: -6, y: 2, z: 12,
                duration: 1,
                ease: 'power2.out'
            });
            
            // 高亮基粒
            if (this.granaGroup) {
                this.granaGroup.children.forEach(stack => {
                    stack.children.forEach(disk => {
                        gsap.to(disk.material, {
                            emissiveIntensity: 0.6,
                            duration: 0.5,
                            yoyo: true,
                            repeat: 3
                        });
                    });
                });
            }
        }
        
        // 显示O₂释放
        this.molecules.filter(m => m.userData.type === 'o2').forEach(m => {
            m.visible = true;
            m.userData.rising = true;
        });
        
        this.showGuide('☀️ 光反应：光能 → ATP + NADPH + O₂↑');
    }

    /**
     * 暗反应动画
     */
    animateDarkReaction() {
        // 聚焦叶绿体基质
        if (typeof gsap !== 'undefined') {
            gsap.to(this.camera.position, {
                x: -4, y: 1, z: 14,
                duration: 1,
                ease: 'power2.out'
            });
        }
        
        // 显示葡萄糖生成
        this.molecules.filter(m => m.userData.type === 'glucose').forEach((m, i) => {
            setTimeout(() => {
                m.visible = true;
                m.position.set(-4 + i * 0.8, 0, 0);
                if (typeof gsap !== 'undefined') {
                    gsap.from(m.scale, { x: 0, y: 0, z: 0, duration: 0.5 });
                }
            }, i * 300);
        });
        
        this.showGuide('🌑 暗反应：CO₂ + ATP + NADPH → 葡萄糖');
    }

    /**
     * 呼吸作用动画
     */
    animateRespiration() {
        // 聚焦线粒体
        if (typeof gsap !== 'undefined') {
            gsap.to(this.camera.position, {
                x: 6, y: 2, z: 12,
                duration: 1,
                ease: 'power2.out'
            });
            
            // 高亮嵴
            if (this.cristaeGroup) {
                this.cristaeGroup.children.forEach(tube => {
                    gsap.to(tube.material, {
                        emissiveIntensity: 0.5,
                        duration: 0.5,
                        yoyo: true,
                        repeat: 3
                    });
                });
            }
        }
        
        // 显示葡萄糖和ATP
        this.molecules.filter(m => m.userData.type === 'glucose').forEach(m => {
            m.visible = true;
            m.position.set(3, 0, 0);
        });
        
        this.molecules.filter(m => m.userData.type === 'atp_resp').forEach((m, i) => {
            setTimeout(() => {
                m.visible = true;
                if (typeof gsap !== 'undefined') {
                    gsap.from(m.scale, { x: 0, y: 0, z: 0, duration: 0.3 });
                }
            }, i * 100);
        });
        
        this.showGuide('🔥 呼吸作用：葡萄糖 + O₂ → CO₂ + H₂O + 38ATP');
    }

    /**
     * 开始自动演示
     */
    startAutoDemo() {
        if (this.isAutoPlaying) {
            this.isAutoPlaying = false;
            return;
        }
        
        this.isAutoPlaying = true;
        let phase = 0;
        
        const playNext = () => {
            if (!this.isAutoPlaying || phase >= this.phases.length) {
                this.isAutoPlaying = false;
                return;
            }
            
            this.goToPhase(phase);
            phase++;
            
            setTimeout(playNext, 4000);
        };
        
        this.showGuide('🎬 开始自动演示...');
        playNext();
    }

    /**
     * 重置场景
     */
    reset() {
        this.isAutoPlaying = false;
        this.currentPhase = 0;
        this.goToPhase(0);
        this.resetView();
        this.showGuide('🔄 场景已重置');
    }

    /**
     * 重置视角
     */
    resetView() {
        if (typeof gsap !== 'undefined') {
            gsap.to(this.camera.position, {
                x: this.defaultCameraPos.x,
                y: this.defaultCameraPos.y,
                z: this.defaultCameraPos.z,
                duration: 0.8,
                ease: 'power2.out'
            });
        } else {
            this.camera.position.set(this.defaultCameraPos.x, this.defaultCameraPos.y, this.defaultCameraPos.z);
        }
        this.camera.lookAt(0, 0, 0);
    }

    /**
     * 显示引导消息
     */
    showGuide(message) {
        const container = document.getElementById('view-scene');
        if (!container) return;
        
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

    /**
     * 动画更新
     */
    animate(time, delta) {
        this.animationTime = time;
        
        // 光子动画
        if (this.photons) {
            this.photons.forEach(photon => {
                photon.position.x += photon.userData.speed * delta * 8;
                photon.position.y -= photon.userData.speed * delta * 3;
                
                // 重置位置
                if (photon.position.x > -5 || photon.position.y < 0) {
                    photon.position.set(-14 + Math.random() * 2, 6 + Math.random() * 2, Math.random() * 4 - 2);
                }
                
                // 闪烁
                const scale = 0.8 + Math.sin(time * 8 + photon.userData.phase) * 0.3;
                photon.scale.setScalar(scale);
            });
        }
        
        // 分子动画
        this.molecules.forEach(mol => {
            if (!mol.visible) return;
            
            const phase = mol.userData.phase || 0;
            
            // 漂浮
            mol.position.y = (mol.userData.basePos?.y || 0) + Math.sin(time * 2 + phase) * 0.1;
            
            // O₂上升
            if (mol.userData.type === 'o2' && mol.userData.rising) {
                mol.position.y += delta * 0.8;
                if (mol.position.y > 5) {
                    mol.position.y = 1;
                }
            }
            
            // 脉动
            const pulse = 1 + Math.sin(time * 3 + phase) * 0.1;
            mol.scale.setScalar(pulse);
        });
        
        // 叶绿体轻微呼吸
        if (this.chloroplast) {
            this.chloroplast.rotation.y = Math.sin(time * 0.3) * 0.05;
        }
        if (this.mitochondria) {
            this.mitochondria.rotation.y = Math.sin(time * 0.3 + 1) * 0.05;
        }
    }

    /**
     * 获取可交互对象
     */
    getInteractables() {
        const interactables = [];
        
        if (this.chloroplast) interactables.push(this.chloroplast);
        if (this.mitochondria) interactables.push(this.mitochondria);
        if (this.granaGroup) {
            this.granaGroup.children.forEach(g => interactables.push(g));
        }
        if (this.cristaeGroup) interactables.push(this.cristaeGroup);
        
        this.molecules.filter(m => m.userData.isInteractive && m.visible).forEach(m => {
            interactables.push(m);
        });
        
        return interactables;
    }

    /**
     * 清理
     */
    dispose() {
        this.isAutoPlaying = false;
        
        const panel = document.getElementById('photo-info-panel');
        if (panel) panel.remove();
        
        if (this.mainGroup) {
            this.scene.remove(this.mainGroup);
        }
    }
}

// 注册到全局
window.PhotosynthesisScene = PhotosynthesisScene;
