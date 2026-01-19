/**
 * 薛定谔的猫 - 量子叠加态 3D教学场景
 * ============================================
 * 著名的量子力学思想实验
 * 
 * 教学内容：
 * 1. 量子叠加态概念
 * 2. 观测导致波函数坍缩
 * 3. 宏观与微观世界的界限
 * 4. 量子测量问题
 * 
 * 目标学生：高中-大学
 * ============================================
 */

class SchrodingerCatScene {
    constructor(scene, camera, renderer) {
        this.scene = scene;
        this.camera = camera;
        this.renderer = renderer;
        
        this.name = 'SchrodingerCatScene';
        this.mainGroup = null;
        
        // 场景元素
        this.box = null;
        this.boxLid = null;
        this.aliveCat = null;
        this.deadCat = null;
        this.radioactiveAtom = null;
        this.detector = null;
        this.poisonVial = null;
        this.hammer = null;
        
        // 状态
        this.isBoxOpen = false;
        this.isCollapsed = false;
        this.catState = 'superposition'; // 'superposition', 'alive', 'dead'
        this.isPlaying = false;
        this.isAutoPlaying = false;
        this.animationTime = 0;
        
        // 叠加态动画参数
        this.superpositionPhase = 0;
        this.collapseProgress = 0;
        
        // 颜色
        this.colors = {
            boxWood: 0x8B4513,
            catAlive: 0xff9933,
            catDead: 0x666666,
            radioactive: 0x00ff00,
            poison: 0x9400D3,
            metal: 0x888888,
            glow: 0x00ffff
        };
    }

    init() {
        this.mainGroup = new THREE.Group();
        this.scene.add(this.mainGroup);
        
        // 创建环境
        this.createEnvironment();
        
        // 创建实验装置
        this.createBox();
        this.createCats();
        this.createRadioactiveDevice();
        this.createPoisonSystem();
        
        // 创建信息面板
        this.createInfoPanels();
        
        // 设置相机
        if (this.camera) {
            this.camera.position.set(8, 6, 12);
            this.camera.lookAt(0, 0, 0);
        }
        
        // 设置灯光
        this.setupLighting();
        
        // 创建UI
        this.setupUI();
        
        console.log('SchrodingerCatScene initialized');
    }

    /**
     * 创建环境
     */
    createEnvironment() {
        // 实验室地面
        const floorGeometry = new THREE.PlaneGeometry(30, 30);
        const floorMaterial = new THREE.MeshStandardMaterial({
            color: 0x2a2a3a,
            roughness: 0.8
        });
        const floor = new THREE.Mesh(floorGeometry, floorMaterial);
        floor.rotation.x = -Math.PI / 2;
        floor.position.y = -3;
        this.mainGroup.add(floor);
        
        // 网格辅助线
        const gridHelper = new THREE.GridHelper(20, 20, 0x444466, 0x333344);
        gridHelper.position.y = -2.99;
        this.mainGroup.add(gridHelper);
        
        // 环境粒子
        const particleCount = 200;
        const positions = new Float32Array(particleCount * 3);
        
        for (let i = 0; i < particleCount; i++) {
            positions[i * 3] = (Math.random() - 0.5) * 20;
            positions[i * 3 + 1] = Math.random() * 10 - 3;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 20;
        }
        
        const particleGeometry = new THREE.BufferGeometry();
        particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        
        const particleMaterial = new THREE.PointsMaterial({
            size: 0.05,
            color: 0x6666aa,
            transparent: true,
            opacity: 0.4
        });
        
        const particles = new THREE.Points(particleGeometry, particleMaterial);
        this.mainGroup.add(particles);
    }

    /**
     * 创建箱子
     */
    createBox() {
        this.box = new THREE.Group();
        
        // 箱体材质
        const woodMaterial = new THREE.MeshStandardMaterial({
            color: this.colors.boxWood,
            roughness: 0.7,
            metalness: 0.1
        });
        
        // 箱底
        const bottomGeometry = new THREE.BoxGeometry(6, 0.3, 4);
        const bottom = new THREE.Mesh(bottomGeometry, woodMaterial);
        bottom.position.y = -1.5;
        this.box.add(bottom);
        
        // 四面墙
        const wallHeight = 3;
        const wallThickness = 0.2;
        
        // 前后墙
        const frontBackGeometry = new THREE.BoxGeometry(6, wallHeight, wallThickness);
        const frontWall = new THREE.Mesh(frontBackGeometry, woodMaterial);
        frontWall.position.set(0, 0, 2);
        this.box.add(frontWall);
        
        const backWall = new THREE.Mesh(frontBackGeometry, woodMaterial);
        backWall.position.set(0, 0, -2);
        this.box.add(backWall);
        
        // 左右墙
        const sideGeometry = new THREE.BoxGeometry(wallThickness, wallHeight, 4);
        const leftWall = new THREE.Mesh(sideGeometry, woodMaterial);
        leftWall.position.set(-3, 0, 0);
        this.box.add(leftWall);
        
        const rightWall = new THREE.Mesh(sideGeometry, woodMaterial);
        rightWall.position.set(3, 0, 0);
        this.box.add(rightWall);
        
        // 箱盖（可开启）
        this.boxLid = new THREE.Group();
        const lidGeometry = new THREE.BoxGeometry(6.4, 0.3, 4.4);
        const lid = new THREE.Mesh(lidGeometry, woodMaterial);
        this.boxLid.add(lid);
        
        // 盖子上的问号
        const questionMark = this.createQuestionMark();
        questionMark.position.y = 0.2;
        this.boxLid.add(questionMark);
        
        this.boxLid.position.set(0, 1.65, 0);
        this.box.add(this.boxLid);
        
        // 箱子交互
        this.box.userData = {
            name: '薛定谔的箱子',
            info: `<b>薛定谔的箱子</b><br><br>
                在这个密封的箱子里，有一只猫、一个放射性原子、
                一个探测器和一瓶毒药。<br><br>
                在我们打开箱子观察之前，猫处于<b>"既死又活"</b>的叠加态！<br><br>
                <span style="color:#00ffff">点击箱子进行观测...</span>`,
            hoverTitle: '薛定谔的箱子',
            hoverDesc: '点击打开箱子进行观测',
            hoverIcon: 'fa-box',
            isInteractive: true,
            onClick: () => this.observeBox()
        };
        
        this.mainGroup.add(this.box);
    }

    /**
     * 创建问号
     */
    createQuestionMark() {
        const group = new THREE.Group();
        
        // 使用简单几何体组合成问号
        const material = new THREE.MeshStandardMaterial({
            color: 0x00ffff,
            emissive: 0x00ffff,
            emissiveIntensity: 0.5
        });
        
        // 问号曲线部分（用多个球体模拟）
        const positions = [
            [0, 0.8, 0], [0.3, 0.9, 0], [0.4, 0.7, 0], 
            [0.3, 0.5, 0], [0, 0.4, 0], [0, 0.2, 0]
        ];
        
        positions.forEach(pos => {
            const sphere = new THREE.Mesh(
                new THREE.SphereGeometry(0.08, 8, 8),
                material
            );
            sphere.position.set(pos[0], pos[1], pos[2]);
            group.add(sphere);
        });
        
        // 问号点
        const dot = new THREE.Mesh(
            new THREE.SphereGeometry(0.1, 8, 8),
            material
        );
        dot.position.set(0, -0.1, 0);
        group.add(dot);
        
        return group;
    }

    /**
     * 创建猫（活猫和死猫叠加）
     */
    createCats() {
        // 活猫（橙色，卡通风格）
        this.aliveCat = this.createCatModel(this.colors.catAlive, true);
        this.aliveCat.position.set(0.5, -0.5, 0);
        this.aliveCat.userData = {
            name: '活着的猫',
            state: 'alive',
            info: '<b>活着的猫 😺</b><br><br>放射性原子没有衰变，毒药没有释放，猫活着！'
        };
        this.mainGroup.add(this.aliveCat);
        
        // 死猫（灰色）
        this.deadCat = this.createCatModel(this.colors.catDead, false);
        this.deadCat.position.set(0.5, -0.5, 0);
        this.deadCat.rotation.z = Math.PI / 6; // 侧躺
        this.deadCat.userData = {
            name: '死去的猫',
            state: 'dead',
            info: '<b>死去的猫 😿</b><br><br>放射性原子衰变了，触发毒药释放，猫死了...'
        };
        this.mainGroup.add(this.deadCat);
        
        // 初始都半透明（叠加态）
        this.setCatSuperposition();
    }

    /**
     * 创建猫模型
     */
    createCatModel(color, isAlive) {
        const cat = new THREE.Group();
        
        const material = new THREE.MeshStandardMaterial({
            color: color,
            transparent: true,
            opacity: 0.5,
            roughness: 0.6
        });
        
        // 身体
        const bodyGeometry = new THREE.SphereGeometry(0.6, 16, 16);
        bodyGeometry.scale(1.3, 0.8, 0.9);
        const body = new THREE.Mesh(bodyGeometry, material);
        cat.add(body);
        
        // 头
        const headGeometry = new THREE.SphereGeometry(0.4, 16, 16);
        const head = new THREE.Mesh(headGeometry, material);
        head.position.set(0.7, 0.3, 0);
        cat.add(head);
        
        // 耳朵
        const earGeometry = new THREE.ConeGeometry(0.12, 0.25, 4);
        const leftEar = new THREE.Mesh(earGeometry, material);
        leftEar.position.set(0.6, 0.65, 0.15);
        leftEar.rotation.z = -0.2;
        cat.add(leftEar);
        
        const rightEar = new THREE.Mesh(earGeometry, material);
        rightEar.position.set(0.6, 0.65, -0.15);
        rightEar.rotation.z = -0.2;
        cat.add(rightEar);
        
        // 尾巴
        const tailGeometry = new THREE.CylinderGeometry(0.08, 0.05, 0.8, 8);
        const tail = new THREE.Mesh(tailGeometry, material);
        tail.position.set(-0.9, 0.2, 0);
        tail.rotation.z = Math.PI / 4;
        cat.add(tail);
        
        // 眼睛（只有活猫有明亮的眼睛）
        if (isAlive) {
            const eyeMaterial = new THREE.MeshBasicMaterial({
                color: 0x00ff00,
                transparent: true,
                opacity: 0.8
            });
            
            const eyeGeometry = new THREE.SphereGeometry(0.06, 8, 8);
            const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
            leftEye.position.set(0.95, 0.4, 0.15);
            cat.add(leftEye);
            
            const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
            rightEye.position.set(0.95, 0.4, -0.15);
            cat.add(rightEye);
        } else {
            // 死猫眼睛是X形状（用线表示）
            const xMaterial = new THREE.LineBasicMaterial({ color: 0x333333 });
            const xGeometry = new THREE.BufferGeometry().setFromPoints([
                new THREE.Vector3(-0.05, 0.05, 0),
                new THREE.Vector3(0.05, -0.05, 0)
            ]);
            const xLine = new THREE.Line(xGeometry, xMaterial);
            xLine.position.set(0.95, 0.4, 0.15);
            cat.add(xLine);
        }
        
        // 光晕效果
        const glowGeometry = new THREE.SphereGeometry(1.2, 16, 16);
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: color,
            transparent: true,
            opacity: 0.1,
            side: THREE.BackSide
        });
        const glow = new THREE.Mesh(glowGeometry, glowMaterial);
        cat.add(glow);
        cat.userData.glow = glow;
        
        return cat;
    }

    /**
     * 创建放射性装置
     */
    createRadioactiveDevice() {
        // 放射性原子
        this.radioactiveAtom = new THREE.Group();
        
        // 原子核
        const nucleusGeometry = new THREE.SphereGeometry(0.15, 16, 16);
        const nucleusMaterial = new THREE.MeshStandardMaterial({
            color: this.colors.radioactive,
            emissive: this.colors.radioactive,
            emissiveIntensity: 0.5
        });
        const nucleus = new THREE.Mesh(nucleusGeometry, nucleusMaterial);
        this.radioactiveAtom.add(nucleus);
        
        // 放射性符号（三叶草）
        for (let i = 0; i < 3; i++) {
            const leafGeometry = new THREE.CircleGeometry(0.1, 16, 0, Math.PI);
            const leafMaterial = new THREE.MeshBasicMaterial({
                color: this.colors.radioactive,
                transparent: true,
                opacity: 0.6,
                side: THREE.DoubleSide
            });
            const leaf = new THREE.Mesh(leafGeometry, leafMaterial);
            leaf.rotation.x = Math.PI / 2;
            leaf.rotation.z = (i * Math.PI * 2) / 3;
            leaf.position.y = 0.15;
            this.radioactiveAtom.add(leaf);
        }
        
        // 外层电子轨道
        const orbitGeometry = new THREE.TorusGeometry(0.25, 0.01, 8, 32);
        const orbitMaterial = new THREE.MeshBasicMaterial({
            color: this.colors.radioactive,
            transparent: true,
            opacity: 0.4
        });
        const orbit = new THREE.Mesh(orbitGeometry, orbitMaterial);
        orbit.rotation.x = Math.PI / 2;
        this.radioactiveAtom.add(orbit);
        
        this.radioactiveAtom.position.set(-2, 0, 0);
        this.radioactiveAtom.userData = {
            name: '放射性原子',
            info: `<b>放射性原子</b><br><br>
                这个原子有50%的概率在一小时内衰变。<br><br>
                在量子力学中，衰变前原子处于<b>"衰变"与"未衰变"</b>的叠加态！`,
            hoverTitle: '放射性原子',
            hoverDesc: '50%概率衰变',
            hoverIcon: 'fa-radiation',
            isInteractive: true
        };
        
        this.mainGroup.add(this.radioactiveAtom);
        
        // 探测器
        this.detector = new THREE.Group();
        const detectorGeometry = new THREE.BoxGeometry(0.4, 0.3, 0.3);
        const detectorMaterial = new THREE.MeshStandardMaterial({
            color: this.colors.metal,
            metalness: 0.8,
            roughness: 0.2
        });
        const detectorBox = new THREE.Mesh(detectorGeometry, detectorMaterial);
        this.detector.add(detectorBox);
        
        // 探测器指示灯
        const lightGeometry = new THREE.SphereGeometry(0.05, 8, 8);
        const lightMaterial = new THREE.MeshBasicMaterial({
            color: 0xff0000
        });
        this.detectorLight = new THREE.Mesh(lightGeometry, lightMaterial);
        this.detectorLight.position.set(0, 0.2, 0);
        this.detector.add(this.detectorLight);
        
        this.detector.position.set(-2, 0.4, 0.5);
        this.detector.userData = {
            name: '盖革计数器',
            info: '<b>盖革计数器</b><br><br>检测放射性衰变。一旦检测到衰变，就会触发锤子打碎毒药瓶。',
            hoverTitle: '盖革计数器',
            hoverDesc: '检测放射性衰变',
            isInteractive: true
        };
        this.mainGroup.add(this.detector);
    }

    /**
     * 创建毒药系统
     */
    createPoisonSystem() {
        // 毒药瓶
        this.poisonVial = new THREE.Group();
        
        // 瓶身
        const vialGeometry = new THREE.CylinderGeometry(0.1, 0.12, 0.4, 16);
        const vialMaterial = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.4,
            roughness: 0.1
        });
        const vial = new THREE.Mesh(vialGeometry, vialMaterial);
        this.poisonVial.add(vial);
        
        // 毒药液体
        const liquidGeometry = new THREE.CylinderGeometry(0.08, 0.1, 0.3, 16);
        const liquidMaterial = new THREE.MeshStandardMaterial({
            color: this.colors.poison,
            emissive: this.colors.poison,
            emissiveIntensity: 0.3,
            transparent: true,
            opacity: 0.7
        });
        const liquid = new THREE.Mesh(liquidGeometry, liquidMaterial);
        liquid.position.y = -0.03;
        this.poisonVial.add(liquid);
        
        // 骷髅标记
        const skullGeometry = new THREE.SphereGeometry(0.05, 8, 8);
        const skullMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
        const skull = new THREE.Mesh(skullGeometry, skullMaterial);
        skull.position.set(0.12, 0, 0);
        this.poisonVial.add(skull);
        
        this.poisonVial.position.set(-1.5, -0.8, 0.5);
        this.poisonVial.userData = {
            name: '氰化物毒药',
            info: '<b>氰化物毒药</b><br><br>如果锤子打碎瓶子，毒气将释放，猫将死亡。',
            hoverTitle: '毒药瓶',
            hoverDesc: '一旦打碎就会释放致命毒气',
            isInteractive: true
        };
        this.mainGroup.add(this.poisonVial);
        
        // 锤子
        this.hammer = new THREE.Group();
        
        // 锤头
        const hammerHeadGeometry = new THREE.BoxGeometry(0.15, 0.15, 0.25);
        const hammerMaterial = new THREE.MeshStandardMaterial({
            color: this.colors.metal,
            metalness: 0.9,
            roughness: 0.2
        });
        const hammerHead = new THREE.Mesh(hammerHeadGeometry, hammerMaterial);
        this.hammer.add(hammerHead);
        
        // 锤柄
        const handleGeometry = new THREE.CylinderGeometry(0.03, 0.03, 0.5, 8);
        const handleMaterial = new THREE.MeshStandardMaterial({
            color: 0x8B4513
        });
        const handle = new THREE.Mesh(handleGeometry, handleMaterial);
        handle.rotation.z = Math.PI / 2;
        handle.position.x = 0.3;
        this.hammer.add(handle);
        
        this.hammer.position.set(-1.5, 0, 0.5);
        this.hammer.rotation.z = -Math.PI / 6;
        this.hammer.userData = {
            name: '机械锤',
            info: '<b>机械锤</b><br><br>连接到探测器。一旦检测到衰变，锤子会落下打碎毒药瓶。',
            isInteractive: true
        };
        this.mainGroup.add(this.hammer);
    }

    /**
     * 创建信息面板
     */
    createInfoPanels() {
        // 状态指示器
        this.stateLabel = this.createTextSprite('量子叠加态', 0x00ffff);
        this.stateLabel.position.set(0, 3.5, 0);
        this.stateLabel.scale.set(6, 1.5, 1);
        this.mainGroup.add(this.stateLabel);
    }

    /**
     * 创建文字精灵
     */
    createTextSprite(text, color = 0xffffff) {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = 512;
        canvas.height = 128;
        
        context.fillStyle = 'transparent';
        context.fillRect(0, 0, canvas.width, canvas.height);
        
        context.font = 'bold 48px Arial';
        context.fillStyle = '#' + color.toString(16).padStart(6, '0');
        context.textAlign = 'center';
        context.fillText(text, 256, 80);
        
        const texture = new THREE.CanvasTexture(canvas);
        const material = new THREE.SpriteMaterial({ 
            map: texture, 
            transparent: true 
        });
        const sprite = new THREE.Sprite(material);
        
        return sprite;
    }

    /**
     * 设置灯光
     */
    setupLighting() {
        const ambient = new THREE.AmbientLight(0x404060, 0.6);
        this.scene.add(ambient);
        
        const mainLight = new THREE.DirectionalLight(0xffffff, 0.8);
        mainLight.position.set(5, 10, 5);
        mainLight.castShadow = true;
        this.scene.add(mainLight);
        
        // 神秘的紫色点光源
        const mysteryLight = new THREE.PointLight(0x9400D3, 0.4, 15);
        mysteryLight.position.set(0, 2, 0);
        this.mainGroup.add(mysteryLight);
        this.mysteryLight = mysteryLight;
    }

    /**
     * 设置叠加态
     */
    setCatSuperposition() {
        this.catState = 'superposition';
        this.isCollapsed = false;
        
        // 两只猫都半透明
        this.setCatOpacity(this.aliveCat, 0.5);
        this.setCatOpacity(this.deadCat, 0.5);
        
        this.aliveCat.visible = true;
        this.deadCat.visible = true;
        
        // 更新标签
        this.updateStateLabel('量子叠加态: |活⟩ + |死⟩');
    }

    /**
     * 设置猫的透明度
     */
    setCatOpacity(cat, opacity) {
        cat.traverse(child => {
            if (child.material) {
                child.material.opacity = opacity;
                child.material.needsUpdate = true;
            }
        });
    }

    /**
     * 观测箱子（波函数坍缩）
     */
    observeBox() {
        if (this.isCollapsed) {
            // 已经坍缩，重置
            this.resetExperiment();
            return;
        }
        
        this.isCollapsed = true;
        this.collapseProgress = 0;
        
        // 打开箱盖
        this.openBox();
        
        // 随机决定结果
        const isAlive = Math.random() > 0.5;
        this.catState = isAlive ? 'alive' : 'dead';
        
        // 开始坍缩动画
        this.startCollapseAnimation(isAlive);
        
        // 显示结果信息
        this.showResult(isAlive);
    }

    /**
     * 打开箱盖动画
     */
    openBox() {
        this.isBoxOpen = true;
        // 动画在animate中处理
    }

    /**
     * 开始坍缩动画
     */
    startCollapseAnimation(isAlive) {
        this.isPlaying = true;
        
        // 延迟显示最终状态
        setTimeout(() => {
            if (isAlive) {
                this.setCatOpacity(this.aliveCat, 1);
                this.deadCat.visible = false;
                this.updateStateLabel('观测结果: |活⟩ 😺');
            } else {
                this.aliveCat.visible = false;
                this.setCatOpacity(this.deadCat, 1);
                this.updateStateLabel('观测结果: |死⟩ 😿');
                
                // 触发锤子和毒药动画
                this.triggerPoison();
            }
        }, 1500);
    }

    /**
     * 触发毒药释放
     */
    triggerPoison() {
        // 锤子落下动画
        if (this.hammer) {
            this.hammer.rotation.z = Math.PI / 4;
        }
        
        // 探测器灯变绿
        if (this.detectorLight) {
            this.detectorLight.material.color.setHex(0x00ff00);
        }
    }

    /**
     * 显示结果
     */
    showResult(isAlive) {
        const message = isAlive 
            ? '🎉 观测完成！猫活着！放射性原子没有衰变。'
            : '💀 观测完成！猫死了... 放射性原子发生了衰变。';
        
        this.showGuide(message);
    }

    /**
     * 更新状态标签
     */
    updateStateLabel(text) {
        if (this.stateLabel) {
            this.mainGroup.remove(this.stateLabel);
        }
        
        const color = this.catState === 'alive' ? 0x00ff00 : 
                     this.catState === 'dead' ? 0xff4444 : 0x00ffff;
        
        this.stateLabel = this.createTextSprite(text, color);
        this.stateLabel.position.set(0, 3.5, 0);
        this.stateLabel.scale.set(8, 2, 1);
        this.mainGroup.add(this.stateLabel);
    }

    /**
     * 重置实验
     */
    resetExperiment() {
        this.isCollapsed = false;
        this.isBoxOpen = false;
        this.catState = 'superposition';
        this.collapseProgress = 0;
        
        // 重置箱盖
        this.boxLid.rotation.x = 0;
        
        // 重置猫
        this.setCatSuperposition();
        
        // 重置锤子
        if (this.hammer) {
            this.hammer.rotation.z = -Math.PI / 6;
        }
        
        // 重置探测器灯
        if (this.detectorLight) {
            this.detectorLight.material.color.setHex(0xff0000);
        }
        
        this.showGuide('⚛️ 实验重置！猫再次进入叠加态...');
    }

    /**
     * 设置UI
     */
    setupUI() {
        const controlsDiv = document.getElementById('scene-controls');
        if (!controlsDiv) return;
        
        controlsDiv.style.display = 'flex';
        controlsDiv.innerHTML = `
            <div class="schrodinger-controls">
                <button class="action-btn" id="btn-observe">
                    <i class="fas fa-eye"></i> 观测箱子
                </button>
                <button class="action-btn" id="btn-reset-cat">
                    <i class="fas fa-undo"></i> 重置实验
                </button>
                <div class="state-display" id="quantum-state">
                    <span class="state-label">当前状态:</span>
                    <span class="state-value" id="state-text">|ψ⟩ = |活⟩ + |死⟩</span>
                </div>
            </div>
        `;
        
        // 绑定事件
        document.getElementById('btn-observe')?.addEventListener('click', () => {
            this.observeBox();
        });
        
        document.getElementById('btn-reset-cat')?.addEventListener('click', () => {
            this.resetExperiment();
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
        
        // 叠加态动画（猫的透明度交替变化）
        if (this.catState === 'superposition') {
            this.superpositionPhase += delta * 2;
            
            const phase = Math.sin(this.superpositionPhase);
            const aliveOpacity = 0.3 + (phase + 1) * 0.2;
            const deadOpacity = 0.3 + (-phase + 1) * 0.2;
            
            this.setCatOpacity(this.aliveCat, aliveOpacity);
            this.setCatOpacity(this.deadCat, deadOpacity);
            
            // 猫微微飘动
            this.aliveCat.position.y = -0.5 + Math.sin(time * 2) * 0.05;
            this.deadCat.position.y = -0.5 + Math.sin(time * 2 + Math.PI) * 0.05;
        }
        
        // 放射性原子脉动
        if (this.radioactiveAtom) {
            const pulse = 1 + Math.sin(time * 5) * 0.1;
            this.radioactiveAtom.scale.setScalar(pulse);
            this.radioactiveAtom.rotation.y = time * 0.5;
        }
        
        // 问号脉动
        if (this.boxLid && !this.isBoxOpen) {
            const questionMark = this.boxLid.children[1];
            if (questionMark) {
                questionMark.rotation.y = time;
                const scale = 1 + Math.sin(time * 3) * 0.1;
                questionMark.scale.setScalar(scale);
            }
        }
        
        // 箱盖开启动画
        if (this.isBoxOpen && this.boxLid.rotation.x > -Math.PI / 3) {
            this.boxLid.rotation.x -= delta * 2;
            this.boxLid.position.z -= delta * 0.5;
        }
        
        // 神秘光源闪烁
        if (this.mysteryLight) {
            this.mysteryLight.intensity = 0.3 + Math.sin(time * 4) * 0.2;
        }
    }

    /**
     * 开始自动播放
     */
    startAutoPlay() {
        this.isAutoPlaying = true;
        
        setTimeout(() => {
            this.showGuide('🐱 薛定谔的猫：量子力学最著名的思想实验');
        }, 500);
        
        setTimeout(() => {
            this.showGuide('⚛️ 在观测之前，猫处于"既死又活"的叠加态！点击箱子进行观测...');
        }, 4000);
    }

    /**
     * 获取可交互对象
     */
    getInteractables() {
        return [
            this.box, 
            this.radioactiveAtom, 
            this.detector, 
            this.poisonVial
        ].filter(o => o && o.userData.isInteractive);
    }

    /**
     * 清理
     */
    dispose() {
        this.isPlaying = false;
        this.isAutoPlaying = false;
    }
}

// 注册到全局
window.SchrodingerCatScene = SchrodingerCatScene;
