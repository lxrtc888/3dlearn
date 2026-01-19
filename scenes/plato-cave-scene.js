/**
 * 柏拉图洞穴场景 - Plato's Cave Allegory
 * ============================================
 * 核心寓言：
 * - 囚徒被锁在洞穴中，只能看到墙上的影子
 * - 他们以为影子就是真实世界
 * - 一个囚徒逃出洞穴，看到真实世界
 * - 回来告诉其他人，却不被相信
 * ============================================
 */
window.PlatoCaveScene = class PlatoCaveScene {
    constructor(scene, camera, renderer) {
        this.scene = scene;
        this.camera = camera;
        this.renderer = renderer;

        this.mainGroup = null;
        this.interactables = [];
        this.highlighted = null;

        // 场景元素
        this.cave = null;               // 洞穴
        this.prisoners = [];            // 囚徒
        this.fire = null;               // 火把
        this.objects = [];              // 经过的物体
        this.shadows = [];              // 墙上的影子
        this.wall = null;               // 墙壁

        // 视角状态
        this.viewMode = 'prisoner';     // prisoner | observer | outside

        // 场景参数
        this.params = {
            fireIntensity: 1.0,
            objectSpeed: 0.02,
            showGuides: true
        };

        // 物体列表
        this.objectTypes = [
            { name: '马', geometry: 'horse', color: 0x8b4513 },
            { name: '花瓶', geometry: 'vase', color: 0xcc9966 },
            { name: '树', geometry: 'tree', color: 0x228b22 },
            { name: '人', geometry: 'person', color: 0xffcc99 }
        ];

        // 默认相机位置（囚徒视角）
        this.cameraPositions = {
            prisoner: { x: 0, y: 2, z: 8, lookAt: { x: 0, y: 2, z: -10 } },
            observer: { x: 15, y: 8, z: 0, lookAt: { x: 0, y: 2, z: 0 } },
            outside: { x: 0, y: 5, z: 25, lookAt: { x: 0, y: 3, z: 15 } }
        };

        this.defaultCameraPos = this.cameraPositions.prisoner;
    }

    /**
     * 初始化场景
     */
    init() {
        // 设置相机
        this.setCameraView('prisoner');

        // 背景 - 深黑色洞穴
        this.scene.background = new THREE.Color(0x0a0a0a);
        this.scene.fog = new THREE.FogExp2(0x0a0a0a, 0.03);

        // 光照
        this.setupLights();

        // 创建场景
        this.setupScene();

        // 设置UI
        this.setupUI();

        // 初始引导
        this.showInitialGuide();
    }

    /**
     * 设置光照
     */
    setupLights() {
        // 微弱环境光
        const ambient = new THREE.AmbientLight(0x111111, 0.3);
        this.scene.add(ambient);

        // 火把点光源
        this.fireLight = new THREE.PointLight(0xff6622, 2, 30);
        this.fireLight.position.set(0, 4, 5);
        this.scene.add(this.fireLight);

        // 洞外阳光（初始不可见）
        this.sunLight = new THREE.DirectionalLight(0xffffcc, 0);
        this.sunLight.position.set(0, 20, 30);
        this.scene.add(this.sunLight);
    }

    /**
     * 创建场景
     */
    setupScene() {
        this.mainGroup = new THREE.Group();
        this.scene.add(this.mainGroup);

        // 创建洞穴
        this.createCave();

        // 创建囚徒
        this.createPrisoners();

        // 创建火把
        this.createFire();

        // 创建投影墙
        this.createWall();

        // 创建移动物体
        this.createObjects();

        // 创建洞外世界
        this.createOutsideWorld();
    }

    /**
     * 创建洞穴
     */
    createCave() {
        // 洞穴地面
        const floorGeo = new THREE.PlaneGeometry(30, 40);
        const floorMat = new THREE.MeshStandardMaterial({
            color: 0x2a2520,
            roughness: 0.9
        });
        const floor = new THREE.Mesh(floorGeo, floorMat);
        floor.rotation.x = -Math.PI / 2;
        floor.position.y = 0;
        this.mainGroup.add(floor);

        // 洞穴顶部
        const ceilingGeo = new THREE.PlaneGeometry(30, 40);
        const ceilingMat = new THREE.MeshStandardMaterial({
            color: 0x1a1510,
            roughness: 0.95
        });
        const ceiling = new THREE.Mesh(ceilingGeo, ceilingMat);
        ceiling.rotation.x = Math.PI / 2;
        ceiling.position.y = 8;
        this.mainGroup.add(ceiling);

        // 左墙
        const leftWallGeo = new THREE.PlaneGeometry(40, 8);
        const wallMat = new THREE.MeshStandardMaterial({
            color: 0x252015,
            roughness: 0.9
        });
        const leftWall = new THREE.Mesh(leftWallGeo, wallMat);
        leftWall.rotation.y = Math.PI / 2;
        leftWall.position.set(-15, 4, 0);
        this.mainGroup.add(leftWall);

        // 右墙
        const rightWall = new THREE.Mesh(leftWallGeo.clone(), wallMat.clone());
        rightWall.rotation.y = -Math.PI / 2;
        rightWall.position.set(15, 4, 0);
        this.mainGroup.add(rightWall);
    }

    /**
     * 创建投影墙
     */
    createWall() {
        // 囚徒前面的墙壁（用于投影影子）
        const wallGeo = new THREE.PlaneGeometry(20, 8);
        const wallMat = new THREE.MeshStandardMaterial({
            color: 0x3a3530,
            roughness: 0.8
        });
        this.wall = new THREE.Mesh(wallGeo, wallMat);
        this.wall.position.set(0, 4, -12);
        this.mainGroup.add(this.wall);

        // 添加交互
        this.interactables.push({
            object: this.wall,
            info: {
                title: '洞穴墙壁',
                content: `
                    <p>🧱 <strong>囚徒眼中的"世界"</strong></p>
                    <br>
                    <p>囚徒一生只能看到这面墙。</p>
                    <p>墙上的影子是他们认知的全部。</p>
                    <br>
                    <p>💭 <strong>哲学思考：</strong></p>
                    <p>如果你一生只看过影子，</p>
                    <p>你会相信"真实"的存在吗？</p>
                    <br>
                    <p>💡 点击"旁观者视角"看看真相！</p>
                `
            }
        });
    }

    /**
     * 创建囚徒
     */
    createPrisoners() {
        const positions = [-4, 0, 4];
        
        positions.forEach((x, i) => {
            const prisoner = this.createPrisoner();
            prisoner.position.set(x, 0, 6);
            prisoner.rotation.y = Math.PI; // 面向墙壁
            this.prisoners.push(prisoner);
            this.mainGroup.add(prisoner);
        });
    }

    /**
     * 创建单个囚徒
     */
    createPrisoner() {
        const group = new THREE.Group();

        // 身体（坐姿）
        const bodyGeo = new THREE.CylinderGeometry(0.4, 0.5, 1.2, 16);
        const bodyMat = new THREE.MeshStandardMaterial({
            color: 0x555555,
            roughness: 0.8
        });
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        body.position.y = 0.8;
        group.add(body);

        // 头
        const headGeo = new THREE.SphereGeometry(0.35, 16, 16);
        const headMat = new THREE.MeshStandardMaterial({
            color: 0xccaa88,
            roughness: 0.7
        });
        const head = new THREE.Mesh(headGeo, headMat);
        head.position.y = 1.7;
        group.add(head);

        // 锁链（简化为柱子）
        const chainGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.5, 8);
        const chainMat = new THREE.MeshStandardMaterial({ color: 0x888888 });
        const chainL = new THREE.Mesh(chainGeo, chainMat);
        chainL.position.set(-0.5, 1, 0);
        chainL.rotation.z = Math.PI / 4;
        group.add(chainL);

        const chainR = chainL.clone();
        chainR.position.set(0.5, 1, 0);
        chainR.rotation.z = -Math.PI / 4;
        group.add(chainR);

        return group;
    }

    /**
     * 创建火把
     */
    createFire() {
        this.fire = new THREE.Group();

        // 火把架
        const standGeo = new THREE.CylinderGeometry(0.1, 0.15, 3, 8);
        const standMat = new THREE.MeshStandardMaterial({ color: 0x4a3520 });
        const stand = new THREE.Mesh(standGeo, standMat);
        stand.position.y = 1.5;
        this.fire.add(stand);

        // 火焰（多个球体模拟）
        this.fireParticles = [];
        for (let i = 0; i < 5; i++) {
            const flameGeo = new THREE.SphereGeometry(0.2 + Math.random() * 0.2, 8, 8);
            const flameMat = new THREE.MeshBasicMaterial({
                color: new THREE.Color().setHSL(0.08 + Math.random() * 0.05, 1, 0.5 + Math.random() * 0.3),
                transparent: true,
                opacity: 0.8
            });
            const flame = new THREE.Mesh(flameGeo, flameMat);
            flame.position.set(
                (Math.random() - 0.5) * 0.3,
                3 + Math.random() * 0.5,
                (Math.random() - 0.5) * 0.3
            );
            this.fireParticles.push(flame);
            this.fire.add(flame);
        }

        this.fire.position.set(0, 0, 3);
        this.mainGroup.add(this.fire);

        // 添加交互
        this.interactables.push({
            object: stand,
            info: {
                title: '火把',
                content: `
                    <p>🔥 <strong>光源</strong></p>
                    <br>
                    <p>火把是洞穴中唯一的光源。</p>
                    <p>它在囚徒背后燃烧，</p>
                    <p>将经过的物体投影到墙上。</p>
                    <br>
                    <p>📐 <strong>影子的形成：</strong></p>
                    <p>物体 → 遮挡光线 → 墙上产生影子</p>
                    <br>
                    <p>💡 对囚徒来说，影子就是"真实"。</p>
                `
            }
        });
    }

    /**
     * 创建移动物体
     */
    createObjects() {
        this.objectTypes.forEach((type, i) => {
            const obj = this.createObject(type);
            obj.position.set(-12 + i * 8, 3, 0);
            obj.userData = {
                ...type,
                startX: -12 + i * 8,
                direction: 1
            };
            this.objects.push(obj);
            this.mainGroup.add(obj);
        });
    }

    /**
     * 创建单个物体
     */
    createObject(type) {
        const group = new THREE.Group();
        let geo, mat;

        mat = new THREE.MeshStandardMaterial({
            color: type.color,
            roughness: 0.6
        });

        switch (type.geometry) {
            case 'horse':
                // 简化马造型
                geo = new THREE.BoxGeometry(1.5, 1, 0.6);
                const body = new THREE.Mesh(geo, mat);
                group.add(body);
                
                const headGeo = new THREE.BoxGeometry(0.5, 0.6, 0.4);
                const head = new THREE.Mesh(headGeo, mat);
                head.position.set(0.8, 0.3, 0);
                group.add(head);
                break;

            case 'vase':
                geo = new THREE.CylinderGeometry(0.3, 0.5, 1.2, 16);
                group.add(new THREE.Mesh(geo, mat));
                break;

            case 'tree':
                // 树干
                const trunkGeo = new THREE.CylinderGeometry(0.15, 0.2, 1, 8);
                const trunk = new THREE.Mesh(trunkGeo, new THREE.MeshStandardMaterial({ color: 0x4a3520 }));
                trunk.position.y = -0.3;
                group.add(trunk);
                
                // 树冠
                const crownGeo = new THREE.SphereGeometry(0.6, 16, 16);
                const crown = new THREE.Mesh(crownGeo, mat);
                crown.position.y = 0.5;
                group.add(crown);
                break;

            case 'person':
                // 简化人形
                const personBody = new THREE.CylinderGeometry(0.25, 0.3, 0.8, 8);
                group.add(new THREE.Mesh(personBody, mat));
                
                const personHead = new THREE.SphereGeometry(0.25, 16, 16);
                const pHead = new THREE.Mesh(personHead, mat);
                pHead.position.y = 0.6;
                group.add(pHead);
                break;
        }

        return group;
    }

    /**
     * 创建洞外世界
     */
    createOutsideWorld() {
        this.outsideWorld = new THREE.Group();
        this.outsideWorld.position.set(0, 0, 20);

        // 草地
        const grassGeo = new THREE.PlaneGeometry(50, 30);
        const grassMat = new THREE.MeshStandardMaterial({
            color: 0x3d8c40,
            roughness: 0.9
        });
        const grass = new THREE.Mesh(grassGeo, grassMat);
        grass.rotation.x = -Math.PI / 2;
        this.outsideWorld.add(grass);

        // 天空（背景墙）
        const skyGeo = new THREE.PlaneGeometry(50, 20);
        const skyMat = new THREE.MeshBasicMaterial({ color: 0x87ceeb });
        const sky = new THREE.Mesh(skyGeo, skyMat);
        sky.position.set(0, 10, -10);
        this.outsideWorld.add(sky);

        // 太阳
        const sunGeo = new THREE.SphereGeometry(2, 32, 32);
        const sunMat = new THREE.MeshBasicMaterial({ color: 0xffff00 });
        this.sun = new THREE.Mesh(sunGeo, sunMat);
        this.sun.position.set(5, 12, -5);
        this.outsideWorld.add(this.sun);

        // 真实的树
        const realTree = this.createObject({ geometry: 'tree', color: 0x228b22 });
        realTree.scale.setScalar(3);
        realTree.position.set(-5, 1.5, 0);
        this.outsideWorld.add(realTree);

        // 真实的马
        const realHorse = this.createObject({ geometry: 'horse', color: 0x8b4513 });
        realHorse.scale.setScalar(2);
        realHorse.position.set(5, 1, 3);
        this.outsideWorld.add(realHorse);

        this.mainGroup.add(this.outsideWorld);

        // 洞口
        const caveEntranceGeo = new THREE.RingGeometry(2, 4, 32);
        const caveEntranceMat = new THREE.MeshBasicMaterial({
            color: 0x000000,
            side: THREE.DoubleSide
        });
        const caveEntrance = new THREE.Mesh(caveEntranceGeo, caveEntranceMat);
        caveEntrance.position.set(0, 4, 15);
        this.mainGroup.add(caveEntrance);
    }

    /**
     * 更新影子（简化版本）
     */
    updateShadows() {
        // 简化的影子计算
        // 在真实场景中会使用阴影贴图，这里用视觉提示
    }

    /**
     * 切换相机视角
     */
    setCameraView(mode) {
        this.viewMode = mode;
        const pos = this.cameraPositions[mode];

        gsap.to(this.camera.position, {
            x: pos.x,
            y: pos.y,
            z: pos.z,
            duration: 1.5,
            ease: 'power2.inOut'
        });

        // 调整雾和光照
        if (mode === 'outside') {
            gsap.to(this.scene.fog, { density: 0.01, duration: 1 });
            gsap.to(this.sunLight, { intensity: 1.5, duration: 1 });
            gsap.to(this.fireLight, { intensity: 0.5, duration: 1 });
        } else {
            gsap.to(this.scene.fog, { density: 0.03, duration: 1 });
            gsap.to(this.sunLight, { intensity: 0, duration: 1 });
            gsap.to(this.fireLight, { intensity: 2, duration: 1 });
        }

        // 更新说明
        this.showViewModeInfo(mode);
    }

    /**
     * 显示视角说明
     */
    showViewModeInfo(mode) {
        const panel = document.getElementById('info-panel');
        const title = document.getElementById('info-title');
        const content = document.getElementById('info-content');

        if (!panel || !title || !content) return;

        const info = {
            prisoner: {
                title: '👁️ 囚徒视角',
                content: `
                    <p><strong>你是洞穴中的囚徒</strong></p>
                    <br>
                    <p>你一生被锁在这里，</p>
                    <p>只能面对眼前的墙壁。</p>
                    <br>
                    <p>你看到的一切都是<span class="text-yellow-400">影子</span>。</p>
                    <p>你以为影子就是<span class="text-cyan-400">真实世界</span>。</p>
                    <br>
                    <p>💭 如果有人告诉你：</p>
                    <p>"你看到的只是影子，</p>
                    <p>真实的世界在洞外..."</p>
                    <p>你会相信吗？</p>
                `
            },
            observer: {
                title: '📐 旁观者视角',
                content: `
                    <p><strong>现在你能看到全貌</strong></p>
                    <br>
                    <p>🔥 火把在囚徒背后燃烧</p>
                    <p>🏃 物体从火把前经过</p>
                    <p>🌑 影子投射到墙上</p>
                    <br>
                    <p>囚徒看到的"现实"：</p>
                    <p>不过是<span class="text-red-400">影子的舞蹈</span></p>
                    <br>
                    <p>💡 这是一个<span class="text-yellow-400">认识论</span>的隐喻：</p>
                    <p>我们感知到的世界，</p>
                    <p>是否也是某种"影子"？</p>
                `
            },
            outside: {
                title: '☀️ 洞外的世界',
                content: `
                    <p><strong>真实的世界</strong></p>
                    <br>
                    <p>走出洞穴，你会看到：</p>
                    <ul style="margin-left: 1rem; margin-top: 0.5rem;">
                        <li>• ☀️ 真正的太阳（不是火把）</li>
                        <li>• 🌳 真实的树（不是影子）</li>
                        <li>• 🐴 真实的马（立体的）</li>
                    </ul>
                    <br>
                    <p>💭 <strong>柏拉图的启示：</strong></p>
                    <p>哲学家的任务是走出"洞穴"，</p>
                    <p>认识<span class="text-yellow-400">理念世界</span>的真实。</p>
                    <br>
                    <p>🌟 你愿意追寻真相吗？</p>
                `
            }
        };

        const data = info[mode];
        title.textContent = data.title;
        content.innerHTML = data.content;
        panel.classList.add('visible');
    }

    /**
     * 设置UI
     */
    setupUI() {
        const controlsDiv = document.getElementById('scene-controls');
        if (!controlsDiv) return;

        controlsDiv.style.display = 'flex';
        controlsDiv.innerHTML = `
            <button class="control-btn active" id="btn-prisoner">
                <i class="fas fa-user"></i> 囚徒视角
            </button>
            <button class="control-btn" id="btn-observer">
                <i class="fas fa-eye"></i> 旁观者视角
            </button>
            <button class="control-btn" id="btn-outside">
                <i class="fas fa-sun"></i> 洞外世界
            </button>
            <button class="control-btn" id="btn-move-object">
                <i class="fas fa-walking"></i> 移动物体
            </button>
            <button class="control-btn" id="btn-reset-view">
                <i class="fas fa-video"></i> 重置视角
            </button>
        `;

        this.bindUIEvents();
    }

    /**
     * 绑定UI事件
     */
    bindUIEvents() {
        const buttons = ['prisoner', 'observer', 'outside'];
        
        buttons.forEach(mode => {
            document.getElementById(`btn-${mode}`)?.addEventListener('click', () => {
                this.setCameraView(mode);
                
                // 更新按钮状态
                buttons.forEach(m => {
                    const btn = document.getElementById(`btn-${m}`);
                    if (btn) btn.classList.toggle('active', m === mode);
                });
            });
        });

        // 移动物体
        document.getElementById('btn-move-object')?.addEventListener('click', () => {
            this.animateObjects();
        });

        // 重置视角
        document.getElementById('btn-reset-view')?.addEventListener('click', () => {
            this.setCameraView(this.viewMode);
        });
    }

    /**
     * 动画移动物体
     */
    animateObjects() {
        this.objects.forEach((obj, i) => {
            const delay = i * 0.5;
            
            gsap.to(obj.position, {
                x: obj.position.x > 0 ? -10 : 10,
                duration: 3,
                delay: delay,
                ease: 'power1.inOut',
                yoyo: true,
                repeat: 1
            });
        });
    }

    /**
     * 显示初始引导
     */
    showInitialGuide() {
        const panel = document.getElementById('info-panel');
        const title = document.getElementById('info-title');
        const content = document.getElementById('info-content');

        if (panel && title && content) {
            title.textContent = '🏛️ 柏拉图洞穴';
            content.innerHTML = `
                <p><strong>哲学史上最著名的寓言</strong></p>
                <br>
                <p>想象一群人从出生起就被锁在洞穴中：</p>
                <ul style="margin-left: 1rem; margin-top: 0.5rem;">
                    <li>• 他们面向墙壁，无法转身</li>
                    <li>• 背后有火把燃烧</li>
                    <li>• 物体经过时投下影子</li>
                    <li>• 他们以为影子就是世界</li>
                </ul>
                <br>
                <p><strong>三个视角探索：</strong></p>
                <p>1. 👁️ 囚徒视角 - 只能看到影子</p>
                <p>2. 📐 旁观者视角 - 看到真相</p>
                <p>3. ☀️ 洞外世界 - 真实的存在</p>
                <br>
                <p>💡 点击按钮切换视角！</p>
            `;
            panel.classList.add('visible');
        }
    }

    /**
     * 动画更新（场景管理器调用）
     */
    animate(time, delta) {
        // 火焰动画
        this.fireParticles?.forEach((flame, i) => {
            flame.position.y = 3 + Math.sin(time * 5 + i) * 0.2;
            flame.position.x = Math.sin(time * 3 + i * 2) * 0.1;
            flame.scale.setScalar(0.8 + Math.sin(time * 4 + i) * 0.2);
        });

        // 火光闪烁
        if (this.fireLight) {
            this.fireLight.intensity = 1.8 + Math.sin(time * 6) * 0.3;
        }

        // 太阳发光
        if (this.sun) {
            this.sun.scale.setScalar(1 + Math.sin(time * 2) * 0.05);
        }

        // 根据视角更新相机朝向
        const lookAt = this.cameraPositions[this.viewMode]?.lookAt;
        if (lookAt) {
            this.camera.lookAt(lookAt.x, lookAt.y, lookAt.z);
        }
    }

    /**
     * 处理点击
     */
    onMouseClick(raycaster) {
        const meshes = this.interactables.map(item => item.object);
        const intersects = raycaster.intersectObjects(meshes, false);

        if (intersects.length > 0) {
            const clickedMesh = intersects[0].object;
            const item = this.interactables.find(i => i.object === clickedMesh);

            if (item) {
                const panel = document.getElementById('info-panel');
                const title = document.getElementById('info-title');
                const content = document.getElementById('info-content');

                if (panel && title && content) {
                    title.textContent = item.info.title;
                    content.innerHTML = item.info.content;
                    panel.classList.add('visible');
                }
            }
        }
    }

    /**
     * 处理鼠标移动
     */
    onMouseMove(raycaster) {
        const meshes = this.interactables.map(item => item.object);
        const intersects = raycaster.intersectObjects(meshes, false);

        if (this.highlighted) {
            if (this.highlighted.material.emissive) {
                this.highlighted.material.emissive.setHex(0x000000);
            }
            this.highlighted = null;
        }

        if (intersects.length > 0) {
            this.highlighted = intersects[0].object;
            if (this.highlighted.material.emissive) {
                this.highlighted.material.emissive.setHex(0x222222);
            }
            document.body.style.cursor = 'pointer';
        } else {
            document.body.style.cursor = 'default';
        }
    }

    /**
     * 清理资源
     */
    dispose() {
        // 清除UI
        const controlsDiv = document.getElementById('scene-controls');
        if (controlsDiv) {
            controlsDiv.style.display = 'none';
            controlsDiv.innerHTML = '';
        }

        // 移除主组
        if (this.mainGroup) {
            this.scene.remove(this.mainGroup);
            this.mainGroup.traverse(obj => {
                if (obj.geometry) obj.geometry.dispose();
                if (obj.material) {
                    if (Array.isArray(obj.material)) {
                        obj.material.forEach(m => m.dispose());
                    } else {
                        obj.material.dispose();
                    }
                }
            });
        }

        this.prisoners = [];
        this.objects = [];
        this.interactables = [];
    }
};
