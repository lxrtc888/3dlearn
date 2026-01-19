/**
 * 光合作用与呼吸作用 3D教学场景
 * ============================================
 * 展示植物和动物的能量交换
 * 
 * 教学内容：
 * 1. 光合作用：光能→化学能
 * 2. 呼吸作用：化学能→ATP
 * 3. 叶绿体与线粒体结构
 * 4. 碳循环与氧循环
 * 5. 分子运动可视化
 * 
 * 目标学生：初中-高中
 * ============================================
 */

class PhotosynthesisScene {
    constructor(scene, camera, renderer) {
        this.scene = scene;
        this.camera = camera;
        this.renderer = renderer;
        
        this.name = 'PhotosynthesisScene';
        this.mainGroup = null;
        
        // 场景元素
        this.chloroplast = null;      // 叶绿体
        this.mitochondria = null;     // 线粒体
        this.molecules = [];          // 分子集合
        this.arrows = [];             // 流程箭头
        
        // 动画状态
        this.isPlaying = true;
        this.animationTime = 0;
        this.currentStep = 0;
        this.totalSteps = 6;
        
        // 分子颜色
        this.colors = {
            co2: 0x888888,        // 二氧化碳 - 灰色
            o2: 0x4fc3f7,         // 氧气 - 浅蓝
            h2o: 0x2196f3,        // 水 - 蓝色
            glucose: 0xffeb3b,    // 葡萄糖 - 黄色
            atp: 0xff5722,        // ATP - 橙红
            adp: 0xff9800,        // ADP - 橙色
            nadph: 0x9c27b0,      // NADPH - 紫色
            light: 0xffff00,      // 光 - 亮黄
            chloroplast: 0x4caf50, // 叶绿体 - 绿色
            mitochondria: 0xe91e63 // 线粒体 - 粉红
        };
        
        // 步骤信息
        this.stepInfo = [
            {
                title: '1. 光能吸收',
                desc: '叶绿体中的叶绿素吸收太阳光能，激发电子跃迁',
                highlight: 'chloroplast'
            },
            {
                title: '2. 水的光解',
                desc: '光能分解水分子：2H₂O → 4H⁺ + 4e⁻ + O₂↑',
                highlight: 'water'
            },
            {
                title: '3. ATP与NADPH合成',
                desc: '电子传递产生ATP和NADPH，储存化学能',
                highlight: 'atp'
            },
            {
                title: '4. 碳固定（卡尔文循环）',
                desc: 'CO₂ + ATP + NADPH → 葡萄糖(C₆H₁₂O₆)',
                highlight: 'glucose'
            },
            {
                title: '5. 细胞呼吸启动',
                desc: '葡萄糖进入线粒体，开始有氧呼吸',
                highlight: 'mitochondria'
            },
            {
                title: '6. ATP大量生成',
                desc: 'C₆H₁₂O₆ + 6O₂ → 6CO₂ + 6H₂O + 38ATP',
                highlight: 'respiration'
            }
        ];
    }

    init() {
        this.mainGroup = new THREE.Group();
        this.scene.add(this.mainGroup);
        
        // 创建背景
        this.createBackground();
        
        // 创建叶绿体
        this.createChloroplast();
        
        // 创建线粒体
        this.createMitochondria();
        
        // 创建分子
        this.createMolecules();
        
        // 创建流程箭头
        this.createFlowArrows();
        
        // 创建碳循环示意
        this.createCarbonCycle();
        
        // 创建公式标签
        this.createFormulaLabels();
        
        // 设置相机
        if (this.camera) {
            this.camera.position.set(0, 2, 15);
            this.camera.lookAt(0, 0, 0);
        }
        
        // 设置灯光
        this.setupLighting();
        
        // 创建UI
        this.setupUI();
        
        console.log('PhotosynthesisScene initialized');
    }

    /**
     * 创建背景
     */
    createBackground() {
        // 渐变背景
        const bgGeometry = new THREE.PlaneGeometry(60, 40);
        const bgMaterial = new THREE.ShaderMaterial({
            uniforms: {
                colorTop: { value: new THREE.Color(0x1a237e) },
                colorBottom: { value: new THREE.Color(0x004d40) }
            },
            vertexShader: `
                varying vec2 vUv;
                void main() {
                    vUv = uv;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform vec3 colorTop;
                uniform vec3 colorBottom;
                varying vec2 vUv;
                void main() {
                    gl_FragColor = vec4(mix(colorBottom, colorTop, vUv.y), 1.0);
                }
            `,
            side: THREE.DoubleSide
        });
        const bg = new THREE.Mesh(bgGeometry, bgMaterial);
        bg.position.z = -15;
        this.mainGroup.add(bg);
        
        // 环境粒子
        this.createAmbientParticles();
    }

    /**
     * 创建环境粒子
     */
    createAmbientParticles() {
        const count = 300;
        const positions = new Float32Array(count * 3);
        const colors = new Float32Array(count * 3);
        
        for (let i = 0; i < count; i++) {
            positions[i * 3] = (Math.random() - 0.5) * 30;
            positions[i * 3 + 1] = (Math.random() - 0.5) * 20;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 10;
            
            // 绿色调粒子
            colors[i * 3] = 0.2 + Math.random() * 0.3;
            colors[i * 3 + 1] = 0.5 + Math.random() * 0.5;
            colors[i * 3 + 2] = 0.2 + Math.random() * 0.3;
        }
        
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        
        const material = new THREE.PointsMaterial({
            size: 0.08,
            vertexColors: true,
            transparent: true,
            opacity: 0.6
        });
        
        this.ambientParticles = new THREE.Points(geometry, material);
        this.mainGroup.add(this.ambientParticles);
    }

    /**
     * 创建叶绿体（左侧）
     */
    createChloroplast() {
        this.chloroplast = new THREE.Group();
        this.chloroplast.position.set(-5, 0, 0);
        
        // 叶绿体外膜（椭球形）
        const outerGeometry = new THREE.SphereGeometry(2.5, 32, 32);
        outerGeometry.scale(1.5, 1, 0.8);
        const outerMaterial = new THREE.MeshPhongMaterial({
            color: this.colors.chloroplast,
            transparent: true,
            opacity: 0.4,
            side: THREE.DoubleSide
        });
        const outer = new THREE.Mesh(outerGeometry, outerMaterial);
        this.chloroplast.add(outer);
        
        // 类囊体（内部膜结构）
        this.createThylakoids();
        
        // 基粒（类囊体堆叠）
        this.createGrana();
        
        // 叶绿体标签
        const label = this.createLabel('叶绿体', this.colors.chloroplast);
        label.position.set(0, 3.2, 0);
        this.chloroplast.add(label);
        
        // 交互信息
        this.chloroplast.userData = {
            name: '叶绿体 (Chloroplast)',
            info: `<b>叶绿体</b> - 光合作用的场所<br><br>
                <b>结构特点：</b><br>
                • 双层膜结构<br>
                • 内含类囊体膜（光反应）<br>
                • 基质（暗反应/卡尔文循环）<br><br>
                <b>主要功能：</b><br>
                6CO₂ + 6H₂O + 光能 → C₆H₁₂O₆ + 6O₂`,
            hoverTitle: '叶绿体',
            hoverDesc: '光合作用的场所',
            hoverIcon: 'fa-leaf',
            isInteractive: true
        };
        
        this.mainGroup.add(this.chloroplast);
    }

    /**
     * 创建类囊体
     */
    createThylakoids() {
        const thylakoidGroup = new THREE.Group();
        
        for (let i = 0; i < 5; i++) {
            const geometry = new THREE.TorusGeometry(0.8 + i * 0.15, 0.08, 8, 32);
            const material = new THREE.MeshPhongMaterial({
                color: 0x2e7d32,
                emissive: 0x1b5e20,
                emissiveIntensity: 0.2
            });
            const torus = new THREE.Mesh(geometry, material);
            torus.rotation.x = Math.PI / 2;
            torus.position.y = -0.8 + i * 0.4;
            thylakoidGroup.add(torus);
        }
        
        thylakoidGroup.userData = {
            name: '类囊体膜',
            info: '<b>类囊体膜</b><br><br>光反应发生的场所，含有叶绿素和光合色素，进行光能捕获和电子传递。',
            isInteractive: true
        };
        
        this.chloroplast.add(thylakoidGroup);
    }

    /**
     * 创建基粒
     */
    createGrana() {
        const granaGroup = new THREE.Group();
        
        // 堆叠的圆盘
        for (let stack = 0; stack < 2; stack++) {
            const stackGroup = new THREE.Group();
            stackGroup.position.set(stack === 0 ? -0.8 : 0.8, 0, 0);
            
            for (let i = 0; i < 6; i++) {
                const geometry = new THREE.CylinderGeometry(0.4, 0.4, 0.1, 16);
                const material = new THREE.MeshPhongMaterial({
                    color: 0x388e3c,
                    emissive: 0x1b5e20,
                    emissiveIntensity: 0.3
                });
                const disk = new THREE.Mesh(geometry, material);
                disk.position.y = -0.5 + i * 0.15;
                stackGroup.add(disk);
            }
            
            granaGroup.add(stackGroup);
        }
        
        granaGroup.userData = {
            name: '基粒',
            info: '<b>基粒 (Granum)</b><br><br>类囊体堆叠形成的结构，光合色素集中的地方，光反应的主要场所。',
            isInteractive: true
        };
        
        this.chloroplast.add(granaGroup);
    }

    /**
     * 创建线粒体（右侧）
     */
    createMitochondria() {
        this.mitochondria = new THREE.Group();
        this.mitochondria.position.set(5, 0, 0);
        
        // 线粒体外膜（椭球形）
        const outerGeometry = new THREE.SphereGeometry(2, 32, 32);
        outerGeometry.scale(1.5, 1, 0.8);
        const outerMaterial = new THREE.MeshPhongMaterial({
            color: this.colors.mitochondria,
            transparent: true,
            opacity: 0.35,
            side: THREE.DoubleSide
        });
        const outer = new THREE.Mesh(outerGeometry, outerMaterial);
        this.mitochondria.add(outer);
        
        // 内膜嵴（褶皱结构）
        this.createCristae();
        
        // 线粒体标签
        const label = this.createLabel('线粒体', this.colors.mitochondria);
        label.position.set(0, 2.8, 0);
        this.mitochondria.add(label);
        
        // 交互信息
        this.mitochondria.userData = {
            name: '线粒体 (Mitochondria)',
            info: `<b>线粒体</b> - 细胞的"能量工厂"<br><br>
                <b>结构特点：</b><br>
                • 双层膜结构<br>
                • 内膜形成嵴（增大表面积）<br>
                • 基质含有酶和DNA<br><br>
                <b>主要功能：</b><br>
                C₆H₁₂O₆ + 6O₂ → 6CO₂ + 6H₂O + 38ATP`,
            hoverTitle: '线粒体',
            hoverDesc: '细胞呼吸的场所',
            hoverIcon: 'fa-bolt',
            isInteractive: true
        };
        
        this.mainGroup.add(this.mitochondria);
    }

    /**
     * 创建线粒体内膜嵴
     */
    createCristae() {
        const cristaeGroup = new THREE.Group();
        
        // 多个褶皱
        for (let i = 0; i < 6; i++) {
            const curve = new THREE.CatmullRomCurve3([
                new THREE.Vector3(-1.5, -0.8 + i * 0.3, 0),
                new THREE.Vector3(-0.5, -0.6 + i * 0.3, 0.3),
                new THREE.Vector3(0.5, -0.8 + i * 0.3, -0.2),
                new THREE.Vector3(1.5, -0.6 + i * 0.3, 0.1)
            ]);
            
            const geometry = new THREE.TubeGeometry(curve, 20, 0.08, 8, false);
            const material = new THREE.MeshPhongMaterial({
                color: 0xad1457,
                emissive: 0x880e4f,
                emissiveIntensity: 0.2
            });
            const tube = new THREE.Mesh(geometry, material);
            cristaeGroup.add(tube);
        }
        
        cristaeGroup.userData = {
            name: '线粒体内膜嵴',
            info: '<b>内膜嵴 (Cristae)</b><br><br>内膜向内折叠形成，大大增加了表面积。电子传递链和ATP合酶位于此处，是有氧呼吸产生ATP的主要场所。',
            isInteractive: true
        };
        
        this.mitochondria.add(cristaeGroup);
    }

    /**
     * 创建分子
     */
    createMolecules() {
        // CO₂分子（进入叶绿体）
        this.createCO2Molecules();
        
        // O₂分子（从叶绿体释放）
        this.createO2Molecules();
        
        // H₂O分子
        this.createH2OMolecules();
        
        // 葡萄糖分子
        this.createGlucoseMolecules();
        
        // ATP分子
        this.createATPMolecules();
        
        // 光子
        this.createPhotons();
    }

    /**
     * 创建CO₂分子
     */
    createCO2Molecules() {
        for (let i = 0; i < 6; i++) {
            const co2 = this.createMolecule('CO₂', this.colors.co2, 0.15);
            co2.position.set(-10 - i * 0.5, 2 + Math.random() * 2, Math.random() * 2 - 1);
            co2.userData = {
                type: 'co2',
                phase: Math.random() * Math.PI * 2,
                speed: 0.3 + Math.random() * 0.2,
                targetX: -6,
                name: '二氧化碳 CO₂',
                info: '<b>二氧化碳 CO₂</b><br><br>光合作用的原料之一，在暗反应（卡尔文循环）中被固定，最终转化为葡萄糖。',
                isInteractive: true
            };
            this.molecules.push(co2);
            this.mainGroup.add(co2);
        }
    }

    /**
     * 创建O₂分子
     */
    createO2Molecules() {
        for (let i = 0; i < 6; i++) {
            const o2 = this.createMolecule('O₂', this.colors.o2, 0.12);
            o2.position.set(-5 + Math.random(), -1 + Math.random() * 0.5, Math.random() * 2 - 1);
            o2.userData = {
                type: 'o2',
                phase: Math.random() * Math.PI * 2,
                speed: 0.4 + Math.random() * 0.3,
                released: false,
                name: '氧气 O₂',
                info: '<b>氧气 O₂</b><br><br>光合作用的副产物！来自水的光解：2H₂O → 4H⁺ + 4e⁻ + O₂↑<br>这就是地球大气中氧气的来源。',
                isInteractive: true
            };
            this.molecules.push(o2);
            this.mainGroup.add(o2);
        }
    }

    /**
     * 创建H₂O分子
     */
    createH2OMolecules() {
        for (let i = 0; i < 4; i++) {
            const h2o = this.createMolecule('H₂O', this.colors.h2o, 0.1);
            h2o.position.set(-7 - i * 0.3, -3 + Math.random(), Math.random() - 0.5);
            h2o.userData = {
                type: 'h2o',
                phase: Math.random() * Math.PI * 2,
                speed: 0.25,
                name: '水 H₂O',
                info: '<b>水 H₂O</b><br><br>光合作用的原料之一。在光反应中被光解，提供电子和氢离子，同时释放O₂。',
                isInteractive: true
            };
            this.molecules.push(h2o);
            this.mainGroup.add(h2o);
        }
    }

    /**
     * 创建葡萄糖分子
     */
    createGlucoseMolecules() {
        for (let i = 0; i < 3; i++) {
            const glucose = this.createMolecule('C₆H₁₂O₆', this.colors.glucose, 0.25);
            glucose.position.set(-3 + i * 0.5, 0, 0);
            glucose.visible = false; // 初始隐藏，在卡尔文循环后显示
            glucose.userData = {
                type: 'glucose',
                phase: Math.random() * Math.PI * 2,
                speed: 0.15,
                name: '葡萄糖 C₆H₁₂O₆',
                info: '<b>葡萄糖 C₆H₁₂O₆</b><br><br>光合作用的产物！储存了化学能。可用于：<br>• 呼吸作用产生ATP<br>• 合成淀粉储存<br>• 合成纤维素等',
                isInteractive: true
            };
            this.molecules.push(glucose);
            this.mainGroup.add(glucose);
        }
    }

    /**
     * 创建ATP分子
     */
    createATPMolecules() {
        // 叶绿体中的ATP
        for (let i = 0; i < 4; i++) {
            const atp = this.createMolecule('ATP', this.colors.atp, 0.18);
            atp.position.set(-5 + Math.random() * 2, Math.random() - 0.5, 0.5);
            atp.userData = {
                type: 'atp',
                source: 'chloroplast',
                phase: Math.random() * Math.PI * 2,
                speed: 0.2,
                name: 'ATP (三磷酸腺苷)',
                info: '<b>ATP</b> - 细胞的"能量货币"<br><br>结构：腺嘌呤 + 核糖 + 3个磷酸基团<br><br>ATP → ADP + Pi + 能量<br><br>一个葡萄糖完全氧化可产生约38个ATP！',
                isInteractive: true
            };
            this.molecules.push(atp);
            this.mainGroup.add(atp);
        }
        
        // 线粒体中的ATP（更多）
        for (let i = 0; i < 8; i++) {
            const atp = this.createMolecule('ATP', this.colors.atp, 0.18);
            atp.position.set(5 + (Math.random() - 0.5) * 2, (Math.random() - 0.5) * 1.5, 0.5);
            atp.visible = false; // 呼吸作用步骤后显示
            atp.userData = {
                type: 'atp',
                source: 'mitochondria',
                phase: Math.random() * Math.PI * 2,
                speed: 0.25,
                name: 'ATP (三磷酸腺苷)',
                info: '<b>ATP</b> - 细胞呼吸的主要产物<br><br>线粒体是产生ATP的主要场所，通过电子传递链和氧化磷酸化，一个葡萄糖可产生约34个ATP！',
                isInteractive: true
            };
            this.molecules.push(atp);
            this.mainGroup.add(atp);
        }
    }

    /**
     * 创建光子
     */
    createPhotons() {
        this.photons = [];
        for (let i = 0; i < 10; i++) {
            const photon = new THREE.Group();
            
            // 光子核心
            const coreGeometry = new THREE.SphereGeometry(0.08, 8, 8);
            const coreMaterial = new THREE.MeshBasicMaterial({
                color: this.colors.light
            });
            const core = new THREE.Mesh(coreGeometry, coreMaterial);
            photon.add(core);
            
            // 光晕
            const glowGeometry = new THREE.SphereGeometry(0.15, 8, 8);
            const glowMaterial = new THREE.MeshBasicMaterial({
                color: this.colors.light,
                transparent: true,
                opacity: 0.4
            });
            const glow = new THREE.Mesh(glowGeometry, glowMaterial);
            photon.add(glow);
            
            photon.position.set(-12 + Math.random() * 2, 5 + Math.random() * 3, Math.random() * 4 - 2);
            photon.userData = {
                phase: Math.random() * Math.PI * 2,
                speed: 0.8 + Math.random() * 0.5,
                name: '光子',
                info: '<b>光子</b> - 光能的载体<br><br>太阳光子被叶绿素捕获，激发电子跃迁到高能态，开启光合作用的光反应！'
            };
            
            this.photons.push(photon);
            this.mainGroup.add(photon);
        }
    }

    /**
     * 创建分子模型
     */
    createMolecule(formula, color, size) {
        const group = new THREE.Group();
        
        // 分子球体
        const geometry = new THREE.SphereGeometry(size, 16, 16);
        const material = new THREE.MeshPhongMaterial({
            color: color,
            emissive: color,
            emissiveIntensity: 0.3,
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
            opacity: 0.2,
            side: THREE.BackSide
        });
        const glow = new THREE.Mesh(glowGeometry, glowMaterial);
        group.add(glow);
        
        return group;
    }

    /**
     * 创建流程箭头
     */
    createFlowArrows() {
        // 光 → 叶绿体
        this.createArrow(
            new THREE.Vector3(-10, 4, 0),
            new THREE.Vector3(-7, 2, 0),
            this.colors.light,
            '光能'
        );
        
        // 叶绿体 → 线粒体（葡萄糖）
        this.createArrow(
            new THREE.Vector3(-2.5, 0, 0),
            new THREE.Vector3(3, 0, 0),
            this.colors.glucose,
            '葡萄糖'
        );
        
        // 线粒体 → ATP
        this.createArrow(
            new THREE.Vector3(7, 0, 0),
            new THREE.Vector3(10, 0, 0),
            this.colors.atp,
            'ATP'
        );
    }

    /**
     * 创建箭头
     */
    createArrow(start, end, color, labelText) {
        const direction = end.clone().sub(start);
        const length = direction.length();
        direction.normalize();
        
        const arrowHelper = new THREE.ArrowHelper(
            direction, start, length, color, 0.4, 0.2
        );
        arrowHelper.userData = { label: labelText };
        this.arrows.push(arrowHelper);
        this.mainGroup.add(arrowHelper);
    }

    /**
     * 创建碳循环示意
     */
    createCarbonCycle() {
        const cycleGroup = new THREE.Group();
        cycleGroup.position.set(0, -4, 0);
        
        // 循环曲线
        const curve = new THREE.EllipseCurve(0, 0, 8, 1.5, 0, Math.PI * 2, false, 0);
        const points = curve.getPoints(50);
        const geometry = new THREE.BufferGeometry().setFromPoints(
            points.map(p => new THREE.Vector3(p.x, p.y, 0))
        );
        const material = new THREE.LineDashedMaterial({
            color: 0x66bb6a,
            dashSize: 0.3,
            gapSize: 0.15,
            transparent: true,
            opacity: 0.6
        });
        const ellipse = new THREE.Line(geometry, material);
        ellipse.computeLineDistances();
        cycleGroup.add(ellipse);
        
        // 标签
        const co2Label = this.createLabel('CO₂', 0x888888);
        co2Label.position.set(-8, 0, 0);
        co2Label.scale.setScalar(0.7);
        cycleGroup.add(co2Label);
        
        const o2Label = this.createLabel('O₂', this.colors.o2);
        o2Label.position.set(8, 0, 0);
        o2Label.scale.setScalar(0.7);
        cycleGroup.add(o2Label);
        
        cycleGroup.userData = {
            name: '碳-氧循环',
            info: '<b>碳-氧循环</b><br><br>植物通过光合作用吸收CO₂释放O₂<br>动物通过呼吸作用吸收O₂释放CO₂<br><br>这就是生态系统中物质循环的基础！',
            isInteractive: true
        };
        
        this.mainGroup.add(cycleGroup);
    }

    /**
     * 创建公式标签
     */
    createFormulaLabels() {
        // 光合作用公式
        const photoFormula = this.createLabel(
            '6CO₂ + 6H₂O + 光能 → C₆H₁₂O₆ + 6O₂',
            0x4caf50
        );
        photoFormula.position.set(-5, 4.5, 0);
        photoFormula.scale.setScalar(0.8);
        this.mainGroup.add(photoFormula);
        
        // 呼吸作用公式
        const respFormula = this.createLabel(
            'C₆H₁₂O₆ + 6O₂ → 6CO₂ + 6H₂O + 38ATP',
            0xe91e63
        );
        respFormula.position.set(5, 4.5, 0);
        respFormula.scale.setScalar(0.8);
        this.mainGroup.add(respFormula);
    }

    /**
     * 创建文字标签
     */
    createLabel(text, color) {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = 512;
        canvas.height = 128;
        
        context.fillStyle = 'transparent';
        context.fillRect(0, 0, canvas.width, canvas.height);
        
        context.font = 'bold 36px Arial';
        context.fillStyle = '#' + color.toString(16).padStart(6, '0');
        context.textAlign = 'center';
        context.fillText(text, 256, 80);
        
        const texture = new THREE.CanvasTexture(canvas);
        const material = new THREE.SpriteMaterial({ 
            map: texture, 
            transparent: true 
        });
        const sprite = new THREE.Sprite(material);
        sprite.scale.set(4, 1, 1);
        
        return sprite;
    }

    /**
     * 设置灯光
     */
    setupLighting() {
        const ambient = new THREE.AmbientLight(0x404040, 0.5);
        this.scene.add(ambient);
        
        // 主光源（模拟阳光）
        const sunLight = new THREE.DirectionalLight(0xffffcc, 0.8);
        sunLight.position.set(-10, 10, 5);
        this.scene.add(sunLight);
        
        // 叶绿体区域绿光
        const greenLight = new THREE.PointLight(0x4caf50, 0.5, 10);
        greenLight.position.set(-5, 0, 3);
        this.mainGroup.add(greenLight);
        
        // 线粒体区域红光
        const redLight = new THREE.PointLight(0xe91e63, 0.5, 10);
        redLight.position.set(5, 0, 3);
        this.mainGroup.add(redLight);
    }

    /**
     * 设置UI
     */
    setupUI() {
        const controlsDiv = document.getElementById('scene-controls');
        if (!controlsDiv) return;
        
        controlsDiv.style.display = 'flex';
        controlsDiv.innerHTML = `
            <div class="photosynthesis-controls">
                <div class="control-group">
                    <label>教学步骤</label>
                    <div class="step-nav">
                        <button class="step-btn" id="btn-prev-step"><i class="fas fa-chevron-left"></i></button>
                        <div class="step-indicators" id="step-indicators">
                            ${[1,2,3,4,5,6].map(s => `<span class="step-dot ${s === 1 ? 'active' : ''}" data-step="${s-1}">${s}</span>`).join('')}
                        </div>
                        <button class="step-btn" id="btn-next-step"><i class="fas fa-chevron-right"></i></button>
                    </div>
                </div>
                <div class="control-group">
                    <button class="action-btn" id="btn-auto-play">
                        <i class="fas fa-play"></i> 自动演示
                    </button>
                    <button class="action-btn" id="btn-reset-photo">
                        <i class="fas fa-undo"></i> 重置
                    </button>
                </div>
                <div class="step-info" id="step-info">
                    <div class="step-title">${this.stepInfo[0].title}</div>
                    <div class="step-desc">${this.stepInfo[0].desc}</div>
                </div>
            </div>
        `;
        
        // 绑定事件
        document.getElementById('btn-prev-step')?.addEventListener('click', () => {
            this.goToStep(this.currentStep - 1);
        });
        
        document.getElementById('btn-next-step')?.addEventListener('click', () => {
            this.goToStep(this.currentStep + 1);
        });
        
        document.querySelectorAll('.step-dot').forEach(dot => {
            dot.addEventListener('click', (e) => {
                const step = parseInt(e.target.dataset.step);
                this.goToStep(step);
            });
        });
        
        document.getElementById('btn-auto-play')?.addEventListener('click', () => {
            this.startAutoPlay();
        });
        
        document.getElementById('btn-reset-photo')?.addEventListener('click', () => {
            this.resetScene();
        });
    }

    /**
     * 切换到指定步骤
     */
    goToStep(step) {
        if (step < 0) step = 0;
        if (step >= this.totalSteps) step = this.totalSteps - 1;
        
        this.currentStep = step;
        
        // 更新步骤指示器
        document.querySelectorAll('.step-dot').forEach((dot, i) => {
            dot.classList.toggle('active', i === step);
            dot.classList.toggle('completed', i < step);
        });
        
        // 更新步骤信息
        const info = this.stepInfo[step];
        const stepTitle = document.querySelector('.step-title');
        const stepDesc = document.querySelector('.step-desc');
        if (stepTitle) stepTitle.textContent = info.title;
        if (stepDesc) stepDesc.textContent = info.desc;
        
        // 执行步骤动画
        this.executeStep(step);
    }

    /**
     * 执行步骤动画
     */
    executeStep(step) {
        // 根据步骤高亮不同元素
        switch(step) {
            case 0: // 光能吸收
                this.highlightChloroplast();
                break;
            case 1: // 水的光解
                this.animateWaterSplitting();
                break;
            case 2: // ATP合成
                this.showATPProduction();
                break;
            case 3: // 葡萄糖合成
                this.showGlucoseProduction();
                break;
            case 4: // 呼吸作用
                this.highlightMitochondria();
                break;
            case 5: // ATP大量生成
                this.showRespirationATP();
                break;
        }
    }

    /**
     * 高亮叶绿体
     */
    highlightChloroplast() {
        // 叶绿体脉动效果
        if (this.chloroplast) {
            this.chloroplast.scale.set(1.1, 1.1, 1.1);
            setTimeout(() => {
                this.chloroplast.scale.set(1, 1, 1);
            }, 500);
        }
    }

    /**
     * 水分解动画
     */
    animateWaterSplitting() {
        // O₂分子向上释放
        this.molecules.filter(m => m.userData.type === 'o2').forEach((o2, i) => {
            o2.userData.released = true;
        });
    }

    /**
     * 显示ATP产生
     */
    showATPProduction() {
        this.molecules.filter(m => m.userData.type === 'atp' && m.userData.source === 'chloroplast')
            .forEach(atp => {
                atp.visible = true;
            });
    }

    /**
     * 显示葡萄糖产生
     */
    showGlucoseProduction() {
        this.molecules.filter(m => m.userData.type === 'glucose').forEach((glucose, i) => {
            glucose.visible = true;
            glucose.position.set(-4 + i * 0.5, 0, 0);
        });
    }

    /**
     * 高亮线粒体
     */
    highlightMitochondria() {
        if (this.mitochondria) {
            this.mitochondria.scale.set(1.1, 1.1, 1.1);
            setTimeout(() => {
                this.mitochondria.scale.set(1, 1, 1);
            }, 500);
        }
    }

    /**
     * 显示呼吸作用ATP
     */
    showRespirationATP() {
        this.molecules.filter(m => m.userData.type === 'atp' && m.userData.source === 'mitochondria')
            .forEach(atp => {
                atp.visible = true;
            });
    }

    /**
     * 开始自动播放
     */
    startAutoPlay() {
        this.isPlaying = true;
        let step = 0;
        
        const playNext = () => {
            if (step >= this.totalSteps || !this.isPlaying) {
                return;
            }
            
            this.goToStep(step);
            step++;
            
            setTimeout(playNext, 3000);
        };
        
        this.showGuide('🌱 开始光合作用与呼吸作用的精彩旅程！');
        playNext();
    }

    /**
     * 重置场景
     */
    resetScene() {
        this.currentStep = 0;
        this.goToStep(0);
        
        // 重置分子位置
        this.molecules.forEach(m => {
            if (m.userData.type === 'glucose') {
                m.visible = false;
            }
            if (m.userData.type === 'atp' && m.userData.source === 'mitochondria') {
                m.visible = false;
            }
            if (m.userData.type === 'o2') {
                m.userData.released = false;
            }
        });
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
        }, 4000);
    }

    /**
     * 动画更新
     */
    animate(time, delta) {
        this.animationTime = time;
        
        // 环境粒子漂浮
        if (this.ambientParticles) {
            this.ambientParticles.rotation.y = time * 0.02;
        }
        
        // 光子动画
        this.photons.forEach(photon => {
            photon.position.x += photon.userData.speed * delta * 10;
            photon.position.y -= photon.userData.speed * delta * 5;
            
            // 重置位置
            if (photon.position.x > -5 || photon.position.y < -2) {
                photon.position.set(-12 + Math.random() * 2, 5 + Math.random() * 3, Math.random() * 4 - 2);
            }
            
            // 闪烁效果
            const scale = 0.8 + Math.sin(time * 10 + photon.userData.phase) * 0.3;
            photon.scale.setScalar(scale);
        });
        
        // 分子动画
        this.molecules.forEach(mol => {
            const phase = mol.userData.phase;
            const speed = mol.userData.speed || 0.1;
            
            // 漂浮效果
            mol.position.y += Math.sin(time * 2 + phase) * 0.002;
            
            // CO₂移动向叶绿体
            if (mol.userData.type === 'co2' && mol.position.x < mol.userData.targetX) {
                mol.position.x += speed * delta * 2;
            }
            
            // O₂释放动画
            if (mol.userData.type === 'o2' && mol.userData.released) {
                mol.position.y += delta * 0.5;
                mol.position.x += (Math.random() - 0.5) * 0.05;
                if (mol.position.y > 6) {
                    mol.position.y = -1;
                    mol.userData.released = false;
                }
            }
            
            // 脉动效果
            const pulse = 1 + Math.sin(time * 3 + phase) * 0.1;
            mol.scale.setScalar(pulse);
        });
        
        // 叶绿体和线粒体轻微旋转
        if (this.chloroplast) {
            this.chloroplast.rotation.y = Math.sin(time * 0.5) * 0.1;
        }
        if (this.mitochondria) {
            this.mitochondria.rotation.y = Math.sin(time * 0.5 + 1) * 0.1;
        }
    }

    /**
     * 获取可交互对象
     */
    getInteractables() {
        const interactables = [this.chloroplast, this.mitochondria];
        this.molecules.filter(m => m.userData.isInteractive).forEach(m => interactables.push(m));
        return interactables.filter(Boolean);
    }

    /**
     * 清理
     */
    dispose() {
        this.isPlaying = false;
    }
}

// 注册到全局
window.PhotosynthesisScene = PhotosynthesisScene;
