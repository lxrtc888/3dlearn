/**
 * V6 发动机场景 - 赛博机械美学 (终极版)
 */
window.EngineScene = class EngineScene {
    constructor(scene, camera, renderer) {
        this.scene = scene;
        this.camera = camera;
        this.renderer = renderer;

        this.engineGroup = null;
        this.pistons = [];
        this.crankshaft = null;
        this.interactables = [];

        this.params = {
            rpm: 2000,
            isRunning: true
        };
    }

    init() {
        this.camera.position.set(6, 6, 10);
        this.scene.background = new THREE.Color(0x050510);

        // 多光源设置
        const dirLight = new THREE.DirectionalLight(0xffffff, 1);
        dirLight.position.set(5, 5, 5);
        this.scene.add(dirLight);

        const redLight = new THREE.PointLight(0xff0000, 2, 20);
        redLight.position.set(-5, 0, 0);
        this.scene.add(redLight);

        this.setupScene();
        this.setupUI();
    }

    setupScene() {
        this.engineGroup = new THREE.Group();
        this.scene.add(this.engineGroup);

        // 材质
        const blockMat = new THREE.MeshPhysicalMaterial({
            color: 0x1a1a1a,
            metalness: 0.9,
            roughness: 0.2,
            transmission: 0.2,
            transparent: true,
            opacity: 0.5,
            wireframe: false
        });

        const pistonMat = new THREE.MeshStandardMaterial({
            color: 0xcccccc,
            metalness: 1.0,
            roughness: 0.2
        });

        const glowMat = new THREE.MeshBasicMaterial({
            color: 0xff3300,
            transparent: true,
            opacity: 0,
            blending: THREE.AdditiveBlending
        });

        // 1. 缸体轮廓 (Wireframe Box)
        const boxGeo = new THREE.BoxGeometry(8, 4, 3.5);
        const wireframe = new THREE.LineSegments(new THREE.EdgesGeometry(boxGeo), new THREE.LineBasicMaterial({ color: 0x444444 }));
        this.engineGroup.add(wireframe);

        // 2. 气缸管道 (透明管)
        // V型夹角布局
        for (let i = 0; i < 6; i++) {
            const side = i % 2 == 0 ? 1 : -1;
            const zOff = (Math.floor(i / 2) - 1) * 1.8;

            const cylGroup = new THREE.Group();
            cylGroup.position.set(zOff, 0, side * 0.5);
            cylGroup.rotation.x = side * Math.PI / 6; // 30度倾斜

            // 气缸壁
            const cyl = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, 2.5, 32, 1, true), new THREE.MeshBasicMaterial({ color: 0x222222, side: THREE.DoubleSide, transparent: true, opacity: 0.3 }));
            cylGroup.add(cyl);

            // 活塞
            const piston = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.8, 32), pistonMat.clone());
            piston.userData = { id: i, initY: 0 };

            // 燃烧室发光层
            const fire = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.2, 32), glowMat.clone());
            fire.position.y = 0.5;
            piston.add(fire);
            piston.userData.fireMesh = fire;

            // 连杆 (简化)
            const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 2), new THREE.MeshStandardMaterial({ color: 0x555555 }));
            rod.position.y = -1.5;
            piston.add(rod);

            // 交互配置
            piston.userData.name = `气缸 #${i + 1}`;
            piston.userData.onClick = () => {
                // 点击暂定（或者显示详细信息）
                gsap.to(piston.material.emissive, { r: 1, duration: 0.1, yoyo: true, repeat: 1 });
            };
            this.interactables.push(piston);

            cylGroup.add(piston);
            this.engineGroup.add(cylGroup);
            this.pistons.push({ mesh: piston, group: cylGroup });
        }
    }

    createLabels(manager) {
        manager.createLabel("双涡轮增压", new THREE.Vector3(0, 3, 0));
    }

    setupUI() {
        const infoTitle = document.getElementById('info-title');
        const infoContent = document.getElementById('info-content');

        if (infoTitle) infoTitle.innerText = "V6 引擎 (Cyber-Tuned)";
        if (infoContent) {
            infoContent.innerHTML = `
                <div class="grid grid-cols-3 gap-2 mb-4 text-center text-xs">
                    <div class="bg-gray-800 p-2 rounded">
                        <div class="text-gray-500">Torque</div>
                        <div class="text-white font-mono">650Nm</div>
                    </div>
                    <div class="bg-gray-800 p-2 rounded">
                        <div class="text-gray-500">Disp</div>
                        <div class="text-white font-mono">3.0L</div>
                    </div>
                    <div class="bg-gray-800 p-2 rounded">
                        <div class="text-gray-500">Turbo</div>
                        <div class="text-white font-mono">Twin</div>
                    </div>
                </div>
                
                <div class="bg-black/30 p-4 rounded-xl border border-red-900/40">
                    <div class="flex justify-between items-center mb-2">
                        <span class="text-red-400 font-bold"><i class="fas fa-tachometer-alt"></i> RPM 控制</span>
                        <span id="rpm-display" class="font-mono text-xl text-white">2000</span>
                    </div>
                    <input type="range" min="800" max="9000" value="2000" class="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-red-600" id="rpm-slider">
                </div>
            `;

            const slider = document.getElementById('rpm-slider');
            if (slider) {
                slider.addEventListener('input', (e) => {
                    this.params.rpm = parseInt(e.target.value);
                    document.getElementById('rpm-display').innerText = this.params.rpm;
                });
            }
        }
        document.getElementById('info-panel').classList.add('visible');
    }

    animate(time, delta) {
        // 缓慢旋转展示
        this.engineGroup.rotation.y = Math.sin(time * 0.1) * 0.1;

        // 计算当前周期
        // RPM 转为 弧度/帧 
        // 60FPS, RPM=60 -> 1 RPS -> 2PI rad/s -> 2PI/60 rad/frame
        const speed = (this.params.rpm / 60) * Math.PI * 2 * delta;

        this.pistons.forEach((obj, i) => {
            // 点火顺序偏移
            const offset = [0, 4, 2, 5, 1, 3][i] * (Math.PI / 3);
            const cycle = (time * (this.params.rpm / 60) * Math.PI * 2) + offset;

            // 活塞简谐运动
            obj.mesh.position.y = Math.sin(cycle) * 0.6;

            // 连杆角度模拟
            obj.mesh.children[1].rotation.z = Math.cos(cycle) * 0.1; // 简单摆动

            // 4冲程燃烧模拟: 只有在做功冲程(向下)且处于顶部附近时点火
            // sin曲线从 1 -> -1 是做功
            // 这里我们简化：sin值刚开始下降时点火
            const phase = cycle % (Math.PI * 2);
            // 闪烁逻辑
            if (Math.sin(cycle) > 0.8 && Math.cos(cycle) < 0) {
                obj.mesh.userData.fireMesh.material.opacity = 0.8 + Math.random() * 0.2;
            } else {
                obj.mesh.userData.fireMesh.material.opacity *= 0.8; // 快速衰减
            }
        });
    }

    getInteractables() {
        return this.interactables;
    }

    dispose() {
        this.scene.remove(this.engineGroup);
    }
}
