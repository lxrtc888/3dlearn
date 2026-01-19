/**
 * 交通流与幽灵堵车场景 - Traffic Flow & Phantom Traffic Jam
 * ============================================
 * 核心原理：
 * - 车辆遵循简单规则：前方有空间加速，前方有车减速
 * - 一辆车轻踩刹车 → 后车反应 → 刹车波向后传播
 * - 波动放大效应：微小扰动可能导致完全停滞
 * ============================================
 */
window.TrafficFlowScene = class TrafficFlowScene {
    constructor(scene, camera, renderer) {
        this.scene = scene;
        this.camera = camera;
        this.renderer = renderer;

        this.mainGroup = null;
        this.interactables = [];
        this.highlighted = null;

        // 场景元素
        this.road = null;               // 环形公路
        this.cars = [];                 // 车辆数组
        this.speedIndicators = [];      // 速度指示器

        // 场景参数
        this.params = {
            carCount: 25,                // 车辆数量
            roadRadius: 15,              // 环形公路半径
            maxSpeed: 0.03,              // 最大速度
            minFollowDistance: 2.5,      // 最小跟车距离
            acceleration: 0.001,         // 加速度
            deceleration: 0.003,         // 减速度
            isRunning: true,             // 是否运行
            showSpeedColors: true        // 显示速度颜色
        };

        // 默认相机位置
        this.defaultCameraPos = { x: 0, y: 35, z: 25 };
    }

    /**
     * 初始化场景
     */
    init() {
        // 设置相机
        this.camera.position.set(
            this.defaultCameraPos.x,
            this.defaultCameraPos.y,
            this.defaultCameraPos.z
        );
        this.camera.lookAt(0, 0, 0);

        // 背景
        this.scene.background = new THREE.Color(0x1a2a1a);
        this.scene.fog = new THREE.FogExp2(0x1a2a1a, 0.01);

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
        // 环境光
        const ambient = new THREE.AmbientLight(0xffffff, 0.4);
        this.scene.add(ambient);

        // 主方向光
        const mainLight = new THREE.DirectionalLight(0xffffff, 0.8);
        mainLight.position.set(20, 40, 20);
        mainLight.castShadow = true;
        this.scene.add(mainLight);

        // 暖色补光
        const warmLight = new THREE.DirectionalLight(0xffaa66, 0.3);
        warmLight.position.set(-20, 20, -20);
        this.scene.add(warmLight);
    }

    /**
     * 创建场景
     */
    setupScene() {
        this.mainGroup = new THREE.Group();
        this.scene.add(this.mainGroup);

        // 创建地面
        this.createGround();

        // 创建环形公路
        this.createRoad();

        // 创建车辆
        this.createCars();

        // 创建中央指示器
        this.createCenterDisplay();
    }

    /**
     * 创建地面
     */
    createGround() {
        const groundGeo = new THREE.PlaneGeometry(80, 80);
        const groundMat = new THREE.MeshStandardMaterial({
            color: 0x2d4a2d,
            roughness: 0.9
        });
        const ground = new THREE.Mesh(groundGeo, groundMat);
        ground.rotation.x = -Math.PI / 2;
        ground.position.y = -0.1;
        ground.receiveShadow = true;
        this.mainGroup.add(ground);
    }

    /**
     * 创建环形公路
     */
    createRoad() {
        const radius = this.params.roadRadius;
        
        // 公路面
        const roadGeo = new THREE.RingGeometry(radius - 2.5, radius + 2.5, 64);
        const roadMat = new THREE.MeshStandardMaterial({
            color: 0x333333,
            roughness: 0.8
        });
        this.road = new THREE.Mesh(roadGeo, roadMat);
        this.road.rotation.x = -Math.PI / 2;
        this.road.position.y = 0.01;
        this.mainGroup.add(this.road);

        // 道路边线（白色）
        const innerLineGeo = new THREE.RingGeometry(radius - 2.4, radius - 2.2, 64);
        const lineMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
        const innerLine = new THREE.Mesh(innerLineGeo, lineMat);
        innerLine.rotation.x = -Math.PI / 2;
        innerLine.position.y = 0.02;
        this.mainGroup.add(innerLine);

        const outerLine = new THREE.Mesh(
            new THREE.RingGeometry(radius + 2.2, radius + 2.4, 64),
            lineMat
        );
        outerLine.rotation.x = -Math.PI / 2;
        outerLine.position.y = 0.02;
        this.mainGroup.add(outerLine);

        // 虚线中线
        for (let i = 0; i < 32; i++) {
            const angle = (i / 32) * Math.PI * 2;
            const dashGeo = new THREE.PlaneGeometry(0.8, 0.15);
            const dash = new THREE.Mesh(dashGeo, lineMat);
            dash.position.set(
                Math.cos(angle) * radius,
                0.02,
                Math.sin(angle) * radius
            );
            dash.rotation.x = -Math.PI / 2;
            dash.rotation.z = -angle + Math.PI / 2;
            this.mainGroup.add(dash);
        }
    }

    /**
     * 创建车辆
     */
    createCars() {
        const count = this.params.carCount;
        const radius = this.params.roadRadius;

        for (let i = 0; i < count; i++) {
            const angle = (i / count) * Math.PI * 2;
            const car = this.createCar();
            
            car.position.set(
                Math.cos(angle) * radius,
                0.3,
                Math.sin(angle) * radius
            );
            car.rotation.y = -angle + Math.PI / 2;

            // 车辆数据（保留 bodyMesh 和 tailLight 引用）
            car.userData.angle = angle;
            car.userData.speed = this.params.maxSpeed * (0.8 + Math.random() * 0.2);
            car.userData.targetSpeed = this.params.maxSpeed;
            car.userData.index = i;

            this.cars.push(car);
            this.mainGroup.add(car);
        }
    }

    /**
     * 创建单辆车
     */
    createCar() {
        const carGroup = new THREE.Group();

        // 车身
        const bodyGeo = new THREE.BoxGeometry(1.8, 0.6, 1);
        const bodyMat = new THREE.MeshStandardMaterial({
            color: 0x4488ff,
            metalness: 0.6,
            roughness: 0.3
        });
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        body.position.y = 0.3;
        carGroup.add(body);
        carGroup.userData.bodyMesh = body;

        // 车顶
        const roofGeo = new THREE.BoxGeometry(1, 0.4, 0.8);
        const roof = new THREE.Mesh(roofGeo, bodyMat);
        roof.position.set(-0.2, 0.7, 0);
        carGroup.add(roof);

        // 车灯（后方红色）
        const tailLightGeo = new THREE.BoxGeometry(0.1, 0.15, 0.3);
        const tailLightMat = new THREE.MeshBasicMaterial({ color: 0xff0000 });
        const tailLight = new THREE.Mesh(tailLightGeo, tailLightMat);
        tailLight.position.set(-0.95, 0.3, 0);
        carGroup.add(tailLight);
        carGroup.userData.tailLight = tailLight;

        // 轮子
        const wheelGeo = new THREE.CylinderGeometry(0.2, 0.2, 0.15, 8);
        const wheelMat = new THREE.MeshStandardMaterial({ color: 0x222222 });
        
        [[0.5, 0.2, 0.55], [0.5, 0.2, -0.55], 
         [-0.5, 0.2, 0.55], [-0.5, 0.2, -0.55]].forEach(pos => {
            const wheel = new THREE.Mesh(wheelGeo, wheelMat);
            wheel.rotation.x = Math.PI / 2;
            wheel.position.set(...pos);
            carGroup.add(wheel);
        });

        return carGroup;
    }

    /**
     * 创建中央显示器
     */
    createCenterDisplay() {
        // 中央圆形显示区
        const displayGeo = new THREE.CircleGeometry(5, 32);
        const displayMat = new THREE.MeshBasicMaterial({
            color: 0x111122,
            transparent: true,
            opacity: 0.8
        });
        const display = new THREE.Mesh(displayGeo, displayMat);
        display.rotation.x = -Math.PI / 2;
        display.position.y = 0.03;
        this.mainGroup.add(display);

        // 速度图例
        this.createSpeedLegend();
    }

    /**
     * 创建速度图例
     */
    createSpeedLegend() {
        // 这里可以添加速度颜色图例
        // 简化版本通过UI显示
    }

    /**
     * 触发刹车事件
     */
    triggerBrake(carIndex = null) {
        // 如果没有指定车辆，随机选择一辆
        if (carIndex === null) {
            carIndex = Math.floor(Math.random() * this.cars.length);
        }

        const car = this.cars[carIndex];
        
        // 急刹车
        car.userData.speed = 0;
        car.userData.targetSpeed = 0;

        // 刹车灯闪亮
        if (car.userData.tailLight) {
            car.userData.tailLight.material.emissive = new THREE.Color(0xff0000);
            car.userData.tailLight.material.emissiveIntensity = 2;
        }

        // 1秒后恢复
        setTimeout(() => {
            car.userData.targetSpeed = this.params.maxSpeed;
            if (car.userData.tailLight) {
                car.userData.tailLight.material.emissiveIntensity = 0;
            }
        }, 1000);

        // 显示说明
        this.showBrakeInfo(carIndex);
    }

    /**
     * 显示刹车说明
     */
    showBrakeInfo(carIndex) {
        const panel = document.getElementById('info-panel');
        const title = document.getElementById('info-title');
        const content = document.getElementById('info-content');

        if (panel && title && content) {
            title.textContent = '🚗 刹车触发！';
            content.innerHTML = `
                <p><strong>第 ${carIndex + 1} 号车踩了刹车</strong></p>
                <br>
                <p>观察发生了什么：</p>
                <ul style="margin-left: 1rem; margin-top: 0.5rem;">
                    <li>• 后面的车需要减速</li>
                    <li>• 减速像"波浪"一样向后传播</li>
                    <li>• 每辆车的反应时间让波浪放大</li>
                </ul>
                <br>
                <p>🔴 <strong>这就是"幽灵堵车"！</strong></p>
                <p>没有事故，没有障碍物，</p>
                <p>仅仅因为一辆车轻踩刹车，</p>
                <p>就可能导致后方完全堵塞。</p>
                <br>
                <p>💡 <strong>如何避免：</strong></p>
                <p>保持合理车距，平稳驾驶！</p>
            `;
            panel.classList.add('visible');
        }
    }

    /**
     * 更新车辆物理
     */
    updateCars(delta) {
        if (!this.params.isRunning) return;

        const count = this.cars.length;
        const radius = this.params.roadRadius;

        for (let i = 0; i < count; i++) {
            const car = this.cars[i];
            const nextCar = this.cars[(i + 1) % count];

            // 计算与前车的距离
            let angleDiff = nextCar.userData.angle - car.userData.angle;
            if (angleDiff < 0) angleDiff += Math.PI * 2;
            const distance = angleDiff * radius;

            // 根据距离调整目标速度
            if (distance < this.params.minFollowDistance) {
                // 太近，需要减速
                car.userData.targetSpeed = Math.max(0, nextCar.userData.speed * 0.8);
            } else if (distance > this.params.minFollowDistance * 2) {
                // 有空间，可以加速
                car.userData.targetSpeed = this.params.maxSpeed;
            } else {
                // 保持跟车
                car.userData.targetSpeed = nextCar.userData.speed;
            }

            // 速度逐渐趋向目标速度
            if (car.userData.speed < car.userData.targetSpeed) {
                car.userData.speed += this.params.acceleration;
            } else if (car.userData.speed > car.userData.targetSpeed) {
                car.userData.speed -= this.params.deceleration;
            }
            car.userData.speed = Math.max(0, Math.min(this.params.maxSpeed, car.userData.speed));

            // 更新角度位置
            car.userData.angle += car.userData.speed * delta * 60;
            if (car.userData.angle > Math.PI * 2) {
                car.userData.angle -= Math.PI * 2;
            }

            // 更新3D位置
            car.position.x = Math.cos(car.userData.angle) * radius;
            car.position.z = Math.sin(car.userData.angle) * radius;
            car.rotation.y = -car.userData.angle + Math.PI / 2;

            // 更新颜色（速度可视化）
            if (this.params.showSpeedColors) {
                const speedRatio = car.userData.speed / this.params.maxSpeed;
                const hue = speedRatio * 0.33; // 0=红, 0.33=绿
                const color = new THREE.Color().setHSL(hue, 1, 0.5);
                car.userData.bodyMesh.material.color = color;
            }
        }
    }

    /**
     * 计算平均速度
     */
    getAverageSpeed() {
        let total = 0;
        this.cars.forEach(car => {
            total += car.userData.speed;
        });
        return total / this.cars.length;
    }

    /**
     * 增加车辆
     */
    addCar() {
        if (this.cars.length >= 40) return; // 最大限制

        const car = this.createCar();
        const angle = Math.random() * Math.PI * 2;
        const radius = this.params.roadRadius;

        car.position.set(
            Math.cos(angle) * radius,
            0.3,
            Math.sin(angle) * radius
        );
        car.rotation.y = -angle + Math.PI / 2;

        // 保留 bodyMesh 和 tailLight 引用
        car.userData.angle = angle;
        car.userData.speed = this.params.maxSpeed * 0.5;
        car.userData.targetSpeed = this.params.maxSpeed;
        car.userData.index = this.cars.length;

        this.cars.push(car);
        this.mainGroup.add(car);

        // 重新分配索引
        this.cars.sort((a, b) => a.userData.angle - b.userData.angle);
        this.cars.forEach((c, i) => c.userData.index = i);
    }

    /**
     * 减少车辆
     */
    removeCar() {
        if (this.cars.length <= 10) return; // 最小限制

        const car = this.cars.pop();
        this.mainGroup.remove(car);
        car.traverse(obj => {
            if (obj.geometry) obj.geometry.dispose();
            if (obj.material) obj.material.dispose();
        });
    }

    /**
     * 设置UI
     */
    setupUI() {
        const controlsDiv = document.getElementById('scene-controls');
        if (!controlsDiv) return;

        controlsDiv.style.display = 'flex';
        controlsDiv.innerHTML = `
            <button class="control-btn primary" id="btn-brake">
                <i class="fas fa-hand-paper"></i> 触发刹车
            </button>
            <button class="control-btn" id="btn-play">
                <i class="fas fa-pause"></i> 暂停
            </button>
            <button class="control-btn" id="btn-add-car">
                <i class="fas fa-plus"></i> 加车
            </button>
            <button class="control-btn" id="btn-remove-car">
                <i class="fas fa-minus"></i> 减车
            </button>
            <div class="control-slider-group">
                <label>车距: <span id="distance-value">${this.params.minFollowDistance.toFixed(1)}</span></label>
                <input type="range" id="distance-slider" min="1" max="5" step="0.2" 
                       value="${this.params.minFollowDistance}" class="styled-slider">
            </div>
            <button class="control-btn" id="btn-reset">
                <i class="fas fa-redo"></i> 重置
            </button>
            <button class="control-btn" id="btn-reset-view">
                <i class="fas fa-video"></i> 视角
            </button>
        `;

        this.bindUIEvents();
    }

    /**
     * 绑定UI事件
     */
    bindUIEvents() {
        // 触发刹车
        document.getElementById('btn-brake')?.addEventListener('click', () => {
            this.triggerBrake();
        });

        // 播放/暂停
        document.getElementById('btn-play')?.addEventListener('click', () => {
            this.params.isRunning = !this.params.isRunning;
            const btn = document.getElementById('btn-play');
            btn.innerHTML = this.params.isRunning ? 
                '<i class="fas fa-pause"></i> 暂停' : 
                '<i class="fas fa-play"></i> 播放';
        });

        // 增加车辆
        document.getElementById('btn-add-car')?.addEventListener('click', () => {
            this.addCar();
        });

        // 减少车辆
        document.getElementById('btn-remove-car')?.addEventListener('click', () => {
            this.removeCar();
        });

        // 车距调节
        document.getElementById('distance-slider')?.addEventListener('input', (e) => {
            this.params.minFollowDistance = parseFloat(e.target.value);
            document.getElementById('distance-value').textContent = 
                this.params.minFollowDistance.toFixed(1);
        });

        // 重置
        document.getElementById('btn-reset')?.addEventListener('click', () => {
            this.resetScene();
        });

        // 重置视角
        document.getElementById('btn-reset-view')?.addEventListener('click', () => {
            gsap.to(this.camera.position, {
                x: this.defaultCameraPos.x,
                y: this.defaultCameraPos.y,
                z: this.defaultCameraPos.z,
                duration: 1,
                ease: 'power2.out'
            });
        });
    }

    /**
     * 重置场景
     */
    resetScene() {
        const count = this.cars.length;
        const radius = this.params.roadRadius;

        // 重新均匀分布车辆
        this.cars.forEach((car, i) => {
            const angle = (i / count) * Math.PI * 2;
            car.userData.angle = angle;
            car.userData.speed = this.params.maxSpeed;
            car.userData.targetSpeed = this.params.maxSpeed;

            car.position.set(
                Math.cos(angle) * radius,
                0.3,
                Math.sin(angle) * radius
            );
            car.rotation.y = -angle + Math.PI / 2;

            // 重置颜色
            car.userData.bodyMesh.material.color.setHex(0x00ff00);
        });

        this.params.isRunning = true;
        const btn = document.getElementById('btn-play');
        if (btn) btn.innerHTML = '<i class="fas fa-pause"></i> 暂停';
    }

    /**
     * 显示初始引导
     */
    showInitialGuide() {
        const panel = document.getElementById('info-panel');
        const title = document.getElementById('info-title');
        const content = document.getElementById('info-content');

        if (panel && title && content) {
            title.textContent = '🚗 幽灵堵车';
            content.innerHTML = `
                <p><strong>为什么没事故也会堵车？</strong></p>
                <br>
                <p>观察环形公路上的车辆：</p>
                <ul style="margin-left: 1rem; margin-top: 0.5rem;">
                    <li>• 🟢 绿色 = 正常速度</li>
                    <li>• 🟡 黄色 = 减速中</li>
                    <li>• 🔴 红色 = 几乎停止</li>
                </ul>
                <br>
                <p><strong>实验步骤：</strong></p>
                <p>1. 点击"触发刹车"让一辆车减速</p>
                <p>2. 观察"刹车波"如何向后传播</p>
                <p>3. 尝试调整车距看看效果</p>
                <br>
                <p>💡 这就是高速公路上"幽灵堵车"的原因！</p>
            `;
            panel.classList.add('visible');
        }
    }

    /**
     * 动画更新（场景管理器调用）
     */
    animate(time, delta) {
        this.updateCars(delta);
    }

    /**
     * 处理点击
     */
    onMouseClick(raycaster) {
        // 点击车辆触发该车刹车
        const carMeshes = this.cars.map(car => car.userData.bodyMesh);
        const intersects = raycaster.intersectObjects(carMeshes, false);

        if (intersects.length > 0) {
            const clickedMesh = intersects[0].object;
            const carIndex = this.cars.findIndex(car => car.userData.bodyMesh === clickedMesh);
            if (carIndex !== -1) {
                this.triggerBrake(carIndex);
            }
        }
    }

    /**
     * 处理鼠标移动
     */
    onMouseMove(raycaster) {
        const carMeshes = this.cars.map(car => car.userData.bodyMesh);
        const intersects = raycaster.intersectObjects(carMeshes, false);

        if (this.highlighted) {
            this.highlighted = null;
        }

        if (intersects.length > 0) {
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

        this.cars = [];
        this.interactables = [];
    }
};
