/**
 * V6 发动机场景 - 赛博机械美学 (增强交互版)
 * ============================================
 * 核心原理：
 * - 四冲程循环：进气、压缩、做功、排气
 * - V型布局：减小发动机长度，平衡运转
 * - 曲轴连杆：将往复运动转换为旋转运动
 * ============================================
 */
window.EngineScene = class EngineScene {
    constructor(scene, camera, renderer) {
        this.scene = scene;
        this.camera = camera;
        this.renderer = renderer;

        this.mainGroup = null;
        this.interactables = [];
        this.highlighted = null;
        
        // 场景元素
        this.engineBlock = null;
        this.pistons = [];
        this.crankshaft = null;
        this.camshaft = null;
        this.sparkPlugs = [];
        this.exhaustPipes = [];
        this.turboFan = null;
        
        this.params = {
            rpm: 2000,
            isRunning: true,
            selectedCylinder: null
        };
        
        // 自动播放
        this.isAutoPlaying = false;
    }

    init() {
        // 相机
        this.camera.position.set(10, 8, 15);
        this.camera.lookAt(0, 0, 0);
        
        // 背景
        this.scene.background = new THREE.Color(0x050510);
        this.scene.fog = new THREE.FogExp2(0x050510, 0.02);
        
        // 光照
        this.setupLights();
        
        // 地面
        const grid = new THREE.GridHelper(40, 40, 0x333355, 0x1a1a2e);
        grid.position.y = -5;
        this.scene.add(grid);
        
        // 场景
        this.setupScene();
        
        // UI
        this.setupUI();
    }

    setupLights() {
        const ambient = new THREE.AmbientLight(0x222233, 0.5);
        this.scene.add(ambient);
        
        const mainLight = new THREE.DirectionalLight(0xffffff, 0.8);
        mainLight.position.set(10, 20, 10);
        this.scene.add(mainLight);
        
        // 赛博朋克风格光源
        const redLight = new THREE.PointLight(0xff3300, 2, 20);
        redLight.position.set(-8, 3, 0);
        this.scene.add(redLight);
        
        const blueLight = new THREE.PointLight(0x0066ff, 2, 20);
        blueLight.position.set(8, 3, 0);
        this.scene.add(blueLight);
        
        const purpleLight = new THREE.PointLight(0x8844ff, 1.5, 15);
        purpleLight.position.set(0, 8, 5);
        this.scene.add(purpleLight);
    }

    setupScene() {
        this.mainGroup = new THREE.Group();
        this.scene.add(this.mainGroup);
        
        this.createEngineBlock();
        this.createCylinders();
        this.createCrankshaft();
        this.createCamshaft();
        this.createSparkPlugs();
        this.createExhaustSystem();
        this.createTurbo();
        this.createDecorations();
    }

    createEngineBlock() {
        // 发动机缸体
        const blockMat = new THREE.MeshStandardMaterial({
            color: 0x1a1a1a,
            metalness: 0.95,
            roughness: 0.15,
            emissive: 0x111111,
            emissiveIntensity: 0.2
        });
        
        // V型主体
        const blockGeo = new THREE.BoxGeometry(4, 3, 8);
        this.engineBlock = new THREE.Mesh(blockGeo, blockMat);
        this.mainGroup.add(this.engineBlock);
        
        // 左侧气缸排
        const leftBankGeo = new THREE.BoxGeometry(2.5, 2, 7);
        const leftBank = new THREE.Mesh(leftBankGeo, blockMat.clone());
        leftBank.position.set(-2.5, 1.5, 0);
        leftBank.rotation.z = Math.PI / 6; // 30度倾斜
        this.mainGroup.add(leftBank);
        
        // 右侧气缸排
        const rightBank = new THREE.Mesh(leftBankGeo, blockMat.clone());
        rightBank.position.set(2.5, 1.5, 0);
        rightBank.rotation.z = -Math.PI / 6;
        this.mainGroup.add(rightBank);
        
        // 交互
        this.engineBlock.userData = {
            hoverTitle: 'V6缸体',
            hoverDesc: '发动机主体结构',
            hoverIcon: 'fa-cube',
            name: '发动机缸体',
            description: `
                <p class="text-lg font-bold text-gray-400 mb-3">🔧 V6缸体</p>
                <p class="text-gray-300 mb-3">发动机的主体结构，容纳气缸和冷却水道。</p>
                <div class="bg-gray-800 rounded p-3 mb-3">
                    <p class="text-sm text-gray-400">材质: 铝合金</p>
                    <p class="text-sm text-gray-400">V型夹角: 60°</p>
                    <p class="text-sm text-gray-400">排量: 3.0L</p>
                </div>
                <p class="text-sm text-blue-400">💡 V型布局比直列更紧凑</p>
            `,
            onClick: (target) => {
                this.highlightObject(target);
                this.showInfoPanel(target);
            }
        };
        this.interactables.push(this.engineBlock);
        
        leftBank.userData = {
            hoverTitle: '左列气缸',
            hoverDesc: '1-3号缸（蓝色）',
            hoverIcon: 'fa-compress-arrows-alt',
            name: '左侧气缸排',
            description: `
                <p class="text-lg font-bold text-blue-400 mb-3">🔵 左列气缸 (1-3缸)</p>
                <p class="text-gray-300 mb-3">包含3个气缸，与右列交错点火。</p>
                <div class="bg-gray-800 rounded p-3 mb-3">
                    <p class="text-sm text-gray-400">点火顺序: 1-4-2-5-3-6</p>
                    <p class="text-sm text-gray-400">倾斜角度: 30°</p>
                </div>
            `,
            onClick: (target) => {
                this.highlightObject(target);
                this.showInfoPanel(target);
            }
        };
        this.interactables.push(leftBank);
        
        rightBank.userData = {
            hoverTitle: '右列气缸',
            hoverDesc: '4-6号缸（红色）',
            hoverIcon: 'fa-compress-arrows-alt',
            name: '右侧气缸排',
            description: `
                <p class="text-lg font-bold text-red-400 mb-3">🔴 右列气缸 (4-6缸)</p>
                <p class="text-gray-300 mb-3">包含3个气缸，与左列交错点火。</p>
                <div class="bg-gray-800 rounded p-3 mb-3">
                    <p class="text-sm text-gray-400">每个气缸独立工作</p>
                    <p class="text-sm text-gray-400">共享曲轴传递动力</p>
                </div>
            `,
            onClick: (target) => {
                this.highlightObject(target);
                this.showInfoPanel(target);
            }
        };
        this.interactables.push(rightBank);
    }

    createCylinders() {
        // 活塞和气缸
        const pistonMat = new THREE.MeshStandardMaterial({
            color: 0x888899,
            metalness: 0.9,
            roughness: 0.2,
            emissive: 0x333344,
            emissiveIntensity: 0.3
        });
        
        const cylinderMat = new THREE.MeshPhysicalMaterial({
            color: 0x333344,
            metalness: 0.8,
            roughness: 0.3,
            transmission: 0.2,
            transparent: true,
            opacity: 0.8
        });
        
        // 6个气缸（V型排列）
        const positions = [
            // 左列
            { x: -3, z: -2.5, side: 'left', num: 1 },
            { x: -3, z: 0, side: 'left', num: 2 },
            { x: -3, z: 2.5, side: 'left', num: 3 },
            // 右列
            { x: 3, z: -2.5, side: 'right', num: 4 },
            { x: 3, z: 0, side: 'right', num: 5 },
            { x: 3, z: 2.5, side: 'right', num: 6 }
        ];
        
        positions.forEach((pos, i) => {
            const group = new THREE.Group();
            group.position.set(pos.x, 2.5, pos.z);
            group.rotation.z = pos.side === 'left' ? Math.PI / 6 : -Math.PI / 6;
            
            // 气缸壁（透明）
            const cylinderGeo = new THREE.CylinderGeometry(0.8, 0.8, 2.5, 32, 1, true);
            const cylinder = new THREE.Mesh(cylinderGeo, cylinderMat);
            group.add(cylinder);
            
            // 活塞
            const pistonGeo = new THREE.CylinderGeometry(0.75, 0.75, 0.5, 32);
            const piston = new THREE.Mesh(pistonGeo, pistonMat.clone());
            piston.position.y = 0;
            group.add(piston);
            
            // 连杆
            const rodGeo = new THREE.CylinderGeometry(0.1, 0.15, 2, 16);
            const rodMat = new THREE.MeshStandardMaterial({
                color: 0x666677,
                metalness: 0.9,
                roughness: 0.2
            });
            const rod = new THREE.Mesh(rodGeo, rodMat);
            rod.position.y = -1.2;
            piston.add(rod);
            
            // 交互
            piston.userData = {
                hoverTitle: `${pos.num}号活塞`,
                hoverDesc: '四冲程往复运动',
                hoverIcon: 'fa-cog',
                name: `${pos.num}号气缸活塞`,
                cylinderNum: pos.num,
                description: `
                    <p class="text-lg font-bold text-orange-400 mb-3">🔥 ${pos.num}号气缸</p>
                    <p class="text-gray-300 mb-3">四冲程循环中往复运动的核心部件。</p>
                    <div class="bg-gray-800 rounded p-3 mb-3">
                        <p class="text-sm text-cyan-400">进气冲程: 活塞下行，吸入混合气</p>
                        <p class="text-sm text-green-400">压缩冲程: 活塞上行，压缩混合气</p>
                        <p class="text-sm text-red-400">做功冲程: 点火爆炸，推动活塞</p>
                        <p class="text-sm text-purple-400">排气冲程: 活塞上行，排出废气</p>
                    </div>
                    <p class="text-sm text-yellow-400">⚡ 曲轴每转两圈完成一个循环</p>
                `,
                onClick: (target) => {
                    this.highlightObject(target);
                    this.showInfoPanel(target);
                    this.params.selectedCylinder = pos.num;
                }
            };
            
            this.interactables.push(piston);
            this.pistons.push({ group, piston, rod, phase: i * Math.PI / 3 });
            this.mainGroup.add(group);
        });
    }

    createCrankshaft() {
        const group = new THREE.Group();
        group.position.set(0, -1, 0);
        
        // 主轴
        const shaftMat = new THREE.MeshStandardMaterial({
            color: 0x666677,
            metalness: 0.95,
            roughness: 0.1,
            emissive: 0x222233,
            emissiveIntensity: 0.3
        });
        
        const mainShaftGeo = new THREE.CylinderGeometry(0.4, 0.4, 10, 32);
        const mainShaft = new THREE.Mesh(mainShaftGeo, shaftMat);
        mainShaft.rotation.x = Math.PI / 2;
        group.add(mainShaft);
        
        // 曲柄（6个）
        for (let i = 0; i < 6; i++) {
            const crankGeo = new THREE.BoxGeometry(0.8, 0.3, 0.3);
            const crank = new THREE.Mesh(crankGeo, shaftMat);
            crank.position.set(0.6, 0, -4 + i * 1.6);
            crank.rotation.z = i * Math.PI / 3; // 每个曲柄相位差60度
            group.add(crank);
        }
        
        // 飞轮
        const flywheelGeo = new THREE.CylinderGeometry(1.5, 1.5, 0.5, 32);
        const flywheelMat = new THREE.MeshStandardMaterial({
            color: 0x444455,
            metalness: 0.9,
            roughness: 0.2
        });
        const flywheel = new THREE.Mesh(flywheelGeo, flywheelMat);
        flywheel.rotation.x = Math.PI / 2;
        flywheel.position.z = 5.5;
        group.add(flywheel);
        
        // 交互
        mainShaft.userData = {
            hoverTitle: '曲轴',
            hoverDesc: '直线转旋转运动',
            hoverIcon: 'fa-sync',
            name: '曲轴',
            description: `
                <p class="text-lg font-bold text-purple-400 mb-3">🔄 曲轴</p>
                <p class="text-gray-300 mb-3">将活塞的往复运动转换为旋转运动。</p>
                <div class="bg-gray-800 rounded p-3 mb-3">
                    <p class="text-sm text-gray-400">曲柄数: 6个</p>
                    <p class="text-sm text-gray-400">相位差: 60°</p>
                    <p class="text-sm text-gray-400">材质: 锻钢</p>
                </div>
                <p class="text-sm text-green-400">✨ 曲轴是发动机的动力输出轴</p>
            `,
            onClick: (target) => {
                this.highlightObject(target);
                this.showInfoPanel(target);
            }
        };
        this.interactables.push(mainShaft);
        
        flywheel.userData = {
            hoverTitle: '飞轮',
            hoverDesc: '储存能量平滑输出',
            hoverIcon: 'fa-compact-disc',
            name: '飞轮',
            description: `
                <p class="text-lg font-bold text-gray-400 mb-3">⚙️ 飞轮</p>
                <p class="text-gray-300 mb-3">储存旋转能量，平滑动力输出。</p>
                <div class="bg-gray-800 rounded p-3 mb-3">
                    <p class="text-sm text-gray-400">作用: 平衡各缸点火间隙</p>
                    <p class="text-sm text-gray-400">惯量: 提供转动惯性</p>
                </div>
            `,
            onClick: (target) => {
                this.highlightObject(target);
                this.showInfoPanel(target);
            }
        };
        this.interactables.push(flywheel);
        
        this.crankshaft = group;
        this.mainGroup.add(group);
    }

    createCamshaft() {
        const group = new THREE.Group();
        group.position.set(0, 4, 0);
        
        const shaftMat = new THREE.MeshStandardMaterial({
            color: 0x555566,
            metalness: 0.9,
            roughness: 0.2
        });
        
        // 凸轮轴
        const shaftGeo = new THREE.CylinderGeometry(0.2, 0.2, 8, 16);
        const shaft = new THREE.Mesh(shaftGeo, shaftMat);
        shaft.rotation.x = Math.PI / 2;
        group.add(shaft);
        
        // 凸轮
        for (let i = 0; i < 6; i++) {
            const camGeo = new THREE.CylinderGeometry(0.4, 0.4, 0.3, 32);
            const cam = new THREE.Mesh(camGeo, shaftMat);
            cam.rotation.x = Math.PI / 2;
            cam.position.z = -3 + i * 1.2;
            group.add(cam);
        }
        
        shaft.userData = {
            hoverTitle: '凸轮轴',
            hoverDesc: '控制气门开闭时机',
            hoverIcon: 'fa-wave-square',
            name: '凸轮轴',
            description: `
                <p class="text-lg font-bold text-cyan-400 mb-3">🎛️ 凸轮轴</p>
                <p class="text-gray-300 mb-3">控制气门的开闭时机。</p>
                <div class="bg-gray-800 rounded p-3 mb-3">
                    <p class="text-sm text-gray-400">转速: 曲轴的1/2</p>
                    <p class="text-sm text-gray-400">作用: 控制进气门和排气门</p>
                </div>
                <p class="text-sm text-yellow-400">⏱️ 正时链条与曲轴同步</p>
            `,
            onClick: (target) => {
                this.highlightObject(target);
                this.showInfoPanel(target);
            }
        };
        this.interactables.push(shaft);
        
        this.camshaft = group;
        this.mainGroup.add(group);
    }

    createSparkPlugs() {
        const sparkMat = new THREE.MeshStandardMaterial({
            color: 0xffffcc,
            emissive: 0xffaa00,
            emissiveIntensity: 0.5,
            metalness: 0.3,
            roughness: 0.5
        });
        
        // 6个火花塞
        const positions = [
            { x: -3.5, z: -2.5 },
            { x: -3.5, z: 0 },
            { x: -3.5, z: 2.5 },
            { x: 3.5, z: -2.5 },
            { x: 3.5, z: 0 },
            { x: 3.5, z: 2.5 }
        ];
        
        positions.forEach((pos, i) => {
            const group = new THREE.Group();
            group.position.set(pos.x, 4.5, pos.z);
            
            // 火花塞主体
            const plugGeo = new THREE.CylinderGeometry(0.15, 0.2, 0.8, 16);
            const plug = new THREE.Mesh(plugGeo, sparkMat.clone());
            group.add(plug);
            
            // 点火光效（初始隐藏）
            const sparkGeo = new THREE.SphereGeometry(0.3, 16, 16);
            const sparkGlow = new THREE.MeshBasicMaterial({
                color: 0xffff00,
                transparent: true,
                opacity: 0
            });
            const spark = new THREE.Mesh(sparkGeo, sparkGlow);
            spark.position.y = -0.5;
            group.add(spark);
            
            plug.userData = {
                hoverTitle: `${i + 1}号火花塞`,
                hoverDesc: '点火引爆混合气',
                hoverIcon: 'fa-bolt',
                name: `${i + 1}号火花塞`,
                description: `
                    <p class="text-lg font-bold text-yellow-400 mb-3">⚡ 火花塞</p>
                    <p class="text-gray-300 mb-3">在压缩冲程末产生电火花，点燃混合气。</p>
                    <div class="bg-gray-800 rounded p-3 mb-3">
                        <p class="text-sm text-gray-400">电压: 20,000-40,000V</p>
                        <p class="text-sm text-gray-400">点火间隙: 0.8-1.0mm</p>
                    </div>
                    <p class="text-sm text-red-400">🔥 点火时机精确到毫秒级</p>
                `,
                onClick: (target) => {
                    this.highlightObject(target);
                    this.showInfoPanel(target);
                    // 闪烁效果
                    gsap.to(spark.material, {
                        opacity: 1,
                        duration: 0.1,
                        yoyo: true,
                        repeat: 3
                    });
                }
            };
            
            this.interactables.push(plug);
            this.sparkPlugs.push({ group, spark });
            this.mainGroup.add(group);
        });
    }

    createExhaustSystem() {
        const exhaustMat = new THREE.MeshStandardMaterial({
            color: 0x443333,
            metalness: 0.7,
            roughness: 0.4,
            emissive: 0x331111,
            emissiveIntensity: 0.3
        });
        
        // 排气管（两侧）
        const pipeGeo = new THREE.CylinderGeometry(0.3, 0.4, 4, 16);
        
        const leftPipe = new THREE.Mesh(pipeGeo, exhaustMat);
        leftPipe.position.set(-5, 0, 0);
        leftPipe.rotation.z = Math.PI / 4;
        this.mainGroup.add(leftPipe);
        
        const rightPipe = new THREE.Mesh(pipeGeo, exhaustMat);
        rightPipe.position.set(5, 0, 0);
        rightPipe.rotation.z = -Math.PI / 4;
        this.mainGroup.add(rightPipe);
        
        leftPipe.userData = {
            name: '左侧排气管',
            description: `
                <p class="text-lg font-bold text-red-400 mb-3">💨 排气系统</p>
                <p class="text-gray-300 mb-3">将燃烧后的废气排出发动机。</p>
                <div class="bg-gray-800 rounded p-3 mb-3">
                    <p class="text-sm text-gray-400">排气温度: 600-800°C</p>
                    <p class="text-sm text-gray-400">材质: 不锈钢</p>
                </div>
                <p class="text-sm text-orange-400">🌡️ 高温废气需要隔热处理</p>
            `,
            onClick: (target) => {
                this.highlightObject(target);
                this.showInfoPanel(target);
            }
        };
        this.interactables.push(leftPipe);
        
        this.exhaustPipes.push(leftPipe, rightPipe);
    }

    createTurbo() {
        const group = new THREE.Group();
        group.position.set(0, 2, -5);
        
        // 涡轮壳体
        const housingMat = new THREE.MeshStandardMaterial({
            color: 0x333344,
            metalness: 0.9,
            roughness: 0.2
        });
        
        const housingGeo = new THREE.TorusGeometry(1.2, 0.5, 16, 32);
        const housing = new THREE.Mesh(housingGeo, housingMat);
        housing.rotation.y = Math.PI / 2;
        group.add(housing);
        
        // 涡轮叶片
        const bladeMat = new THREE.MeshStandardMaterial({
            color: 0x6688aa,
            metalness: 0.95,
            roughness: 0.1,
            emissive: 0x223344,
            emissiveIntensity: 0.4
        });
        
        const bladeGroup = new THREE.Group();
        for (let i = 0; i < 8; i++) {
            const bladeGeo = new THREE.BoxGeometry(0.1, 0.8, 0.3);
            const blade = new THREE.Mesh(bladeGeo, bladeMat);
            blade.position.y = 0.5;
            blade.rotation.z = (i / 8) * Math.PI * 2;
            const pivot = new THREE.Group();
            pivot.add(blade);
            pivot.rotation.z = (i / 8) * Math.PI * 2;
            bladeGroup.add(pivot);
        }
        bladeGroup.rotation.y = Math.PI / 2;
        group.add(bladeGroup);
        this.turboFan = bladeGroup;
        
        housing.userData = {
            name: '涡轮增压器',
            description: `
                <p class="text-lg font-bold text-blue-400 mb-3">🌀 涡轮增压</p>
                <p class="text-gray-300 mb-3">利用废气能量压缩进气，提升动力。</p>
                <div class="bg-gray-800 rounded p-3 mb-3">
                    <p class="text-sm text-gray-400">增压压力: 0.5-1.5 bar</p>
                    <p class="text-sm text-gray-400">转速: 100,000+ RPM</p>
                    <p class="text-sm text-green-400">动力提升: 30-50%</p>
                </div>
                <p class="text-sm text-cyan-400">⚡ 废气驱动，无需额外能量</p>
            `,
            onClick: (target) => {
                this.highlightObject(target);
                this.showInfoPanel(target);
            }
        };
        this.interactables.push(housing);
        
        this.mainGroup.add(group);
    }

    createDecorations() {
        // RPM 显示
        const rpmCanvas = document.createElement('canvas');
        rpmCanvas.width = 256;
        rpmCanvas.height = 128;
        this.rpmCanvas = rpmCanvas;
        this.updateRPMDisplay();
        
        const rpmTexture = new THREE.CanvasTexture(rpmCanvas);
        const rpmMat = new THREE.SpriteMaterial({ map: rpmTexture, transparent: true });
        const rpmSprite = new THREE.Sprite(rpmMat);
        rpmSprite.scale.set(5, 2.5, 1);
        rpmSprite.position.set(0, 7, 0);
        this.mainGroup.add(rpmSprite);
        this.rpmSprite = rpmSprite;
        this.rpmTexture = rpmTexture;
    }

    updateRPMDisplay() {
        const ctx = this.rpmCanvas.getContext('2d');
        ctx.clearRect(0, 0, 256, 128);
        
        // 背景
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.roundRect(4, 4, 248, 120, 12);
        ctx.fill();
        
        // 边框
        ctx.strokeStyle = '#ff4444';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // RPM 数值
        ctx.fillStyle = '#ff6666';
        ctx.font = 'bold 48px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(this.params.rpm.toString(), 128, 70);
        
        // 单位
        ctx.fillStyle = '#888888';
        ctx.font = '20px Arial';
        ctx.fillText('RPM', 128, 100);
        
        if (this.rpmTexture) {
            this.rpmTexture.needsUpdate = true;
        }
    }

    toggleEngine() {
        this.params.isRunning = !this.params.isRunning;
        
        const btn = document.getElementById('btn-toggle-engine');
        if (btn) {
            btn.innerHTML = this.params.isRunning 
                ? '<i class="fas fa-stop"></i> 停止引擎'
                : '<i class="fas fa-play"></i> 启动引擎';
        }
    }

    adjustRPM(delta) {
        this.params.rpm = Math.max(800, Math.min(8000, this.params.rpm + delta));
        this.updateRPMDisplay();
    }

    setupUI() {
        const controlsDiv = document.getElementById('scene-controls');
        controlsDiv.style.display = 'flex';
        controlsDiv.innerHTML = `
            <button class="control-btn" id="btn-step-intake">
                <i class="fas fa-wind"></i> 进气
            </button>
            <button class="control-btn" id="btn-step-compress">
                <i class="fas fa-compress-alt"></i> 压缩
            </button>
            <button class="control-btn" id="btn-step-ignite">
                <i class="fas fa-fire"></i> 点火
            </button>
            <button class="control-btn" id="btn-step-exhaust">
                <i class="fas fa-smog"></i> 排气
            </button>
            <button class="control-btn active" id="btn-toggle-engine">
                <i class="fas fa-play"></i> 运行
            </button>
            <button class="control-btn" id="btn-reset-view">
                <i class="fas fa-video"></i> 重置视角
            </button>
        `;
        
        // 四冲程教学按钮
        document.getElementById('btn-step-intake').onclick = () => this.showStroke('intake');
        document.getElementById('btn-step-compress').onclick = () => this.showStroke('compress');
        document.getElementById('btn-step-ignite').onclick = () => this.showStroke('ignite');
        document.getElementById('btn-step-exhaust').onclick = () => this.showStroke('exhaust');
        document.getElementById('btn-toggle-engine').onclick = () => this.toggleEngine();
        document.getElementById('btn-reset-view').onclick = () => this.resetView();
        
        // 默认相机位置
        this.defaultCameraPos = { x: 10, y: 8, z: 15 };
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
    
    showStroke(strokeType) {
        // 暂停引擎
        this.params.isRunning = false;
        
        const strokes = {
            intake: {
                name: '进气冲程',
                desc: '🌬️ 活塞下行，进气门打开，混合气进入气缸',
                pistonY: -1.5,
                color: 0x3b82f6
            },
            compress: {
                name: '压缩冲程',
                desc: '💨 活塞上行，气门关闭，混合气被压缩',
                pistonY: 1,
                color: 0x8b5cf6
            },
            ignite: {
                name: '做功冲程',
                desc: '🔥 火花塞点火，燃烧膨胀推动活塞下行',
                pistonY: -1.5,
                color: 0xef4444
            },
            exhaust: {
                name: '排气冲程',
                desc: '💨 活塞上行，排气门打开，废气排出',
                pistonY: 1,
                color: 0x10b981
            }
        };
        
        const stroke = strokes[strokeType];
        this.showEngineGuide(`${stroke.desc}`);
        
        // 更新按钮状态
        ['intake', 'compress', 'ignite', 'exhaust'].forEach(s => {
            const btn = document.getElementById(`btn-step-${s}`);
            if (btn) btn.classList.toggle('active', s === strokeType);
        });
        
        // 动画演示
        this.pistons.forEach((piston, i) => {
            gsap.to(piston.position, {
                y: stroke.pistonY + (i % 2 === 0 ? 0 : 0.5),
                duration: 0.8,
                ease: 'power2.inOut'
            });
        });
    }
    
    showEngineGuide(message) {
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
        }, 4000);
    }
    
    // 开始自动播放
    startAutoPlay() {
        this.isAutoPlaying = true;
        this.params.isRunning = true;
        // 更新按钮状态
        const btn = document.getElementById('btn-toggle-engine');
        if (btn) btn.innerHTML = '<i class="fas fa-pause"></i> 暂停';
        
        // 显示提示
        setTimeout(() => {
            this.showEngineGuide('🔧 V6发动机正在运转，点击各冲程按钮了解工作原理');
        }, 500);
    }
    
    toggleAutoPlay() {
        this.isAutoPlaying = !this.isAutoPlaying;
        this.params.isRunning = this.isAutoPlaying;
    }

    highlightObject(target) {
        if (this.highlighted && this.highlighted.material && this.highlighted.material.emissive) {
            this.highlighted.material.emissive.setHex(
                this.highlighted.userData.originalEmissive || 0
            );
        }
        
        if (target.material && target.material.emissive) {
            target.userData.originalEmissive = target.material.emissive.getHex();
            target.material.emissive.setHex(0x00ffff);
        }
        this.highlighted = target;
        
        gsap.to(target.scale, { x: 1.15, y: 1.15, z: 1.15, duration: 0.2 });
        gsap.to(target.scale, { x: 1, y: 1, z: 1, duration: 0.2, delay: 0.2 });
    }

    showInfoPanel(target) {
        const panel = document.getElementById('info-panel');
        const title = document.getElementById('info-title');
        const content = document.getElementById('info-content');
        
        title.innerHTML = `<i class="fas fa-cogs mr-2"></i>${target.userData.name}`;
        content.innerHTML = target.userData.description;
        
        panel.classList.add('visible');
    }

    createLabels(manager) {
        manager.createLabel('V6发动机', new THREE.Vector3(0, 6, 5), 'car');
        manager.createLabel('涡轮增压', new THREE.Vector3(0, 4, -5), 'fan');
    }

    animate(time, delta) {
        if (!this.params.isRunning) return;
        
        const speed = this.params.rpm / 60 * Math.PI * 2;
        
        // 曲轴旋转
        if (this.crankshaft) {
            this.crankshaft.rotation.z += speed * delta;
        }
        
        // 凸轮轴旋转（1/2速度）
        if (this.camshaft) {
            this.camshaft.rotation.z += speed * delta * 0.5;
        }
        
        // 活塞往复运动
        this.pistons.forEach((p, i) => {
            const phase = time * speed + p.phase;
            const stroke = 0.8;
            p.piston.position.y = Math.sin(phase) * stroke;
        });
        
        // 涡轮旋转
        if (this.turboFan) {
            this.turboFan.rotation.x += speed * delta * 3;
        }
        
        // 火花塞闪烁
        const fireInterval = 60 / this.params.rpm * 1000; // ms
        this.sparkPlugs.forEach((sp, i) => {
            const shouldFire = Math.floor(time * 1000 / fireInterval) % 6 === i;
            sp.spark.material.opacity = shouldFire ? 0.8 : 0;
        });
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
        
        if (this.highlighted && this.highlighted.material && this.highlighted.material.emissive) {
            this.highlighted.material.emissive.setHex(
                this.highlighted.userData.originalEmissive || 0
            );
            this.highlighted = null;
        }
        this.params.selectedCylinder = null;
    }
};
