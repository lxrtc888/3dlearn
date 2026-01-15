/**
 * V6 发动机场景 - 赛博机械美学 (增强交互版)
 * ============================================
 * 核心原理：
 * - 四冲程循环：进气、压缩、做功、排气
 * - V型布局：减小发动机长度，平衡运转
 * - 点火顺序：确保平稳动力输出
 * ============================================
 */
window.EngineScene = class EngineScene {
    constructor(scene, camera, renderer) {
        this.scene = scene;
        this.camera = camera;
        this.renderer = renderer;

        this.engineGroup = null;
        this.pistons = [];
        this.crankshaft = null;
        this.turboFans = [];
        this.sparkEffects = [];
        this.exhaustParticles = null;

        this.params = {
            rpm: 2000,
            isRunning: true,
            selectedPiston: null
        };

        this.interactables = [];
    }

    init() {
        this.camera.position.set(8, 8, 12);
        this.camera.lookAt(0, 0, 0);
        
        this.scene.background = new THREE.Color(0x050508);
        this.scene.fog = new THREE.FogExp2(0x050508, 0.02);

        // 多光源
        const ambient = new THREE.AmbientLight(0x222233, 0.4);
        this.scene.add(ambient);

        const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
        dirLight.position.set(5, 10, 5);
        this.scene.add(dirLight);

        const redLight = new THREE.PointLight(0xff3300, 2, 15);
        redLight.position.set(-5, 2, 0);
        this.scene.add(redLight);

        const blueLight = new THREE.PointLight(0x0066ff, 2, 15);
        blueLight.position.set(5, 2, 0);
        this.scene.add(blueLight);

        this.setupScene();
        this.setupExhaustParticles();
        this.setupUI();
    }

    setupScene() {
        this.engineGroup = new THREE.Group();
        this.scene.add(this.engineGroup);

        // 材质定义
        const blockMat = new THREE.MeshPhysicalMaterial({
            color: 0x1a1a1a,
            metalness: 0.95,
            roughness: 0.15,
            clearcoat: 0.3
        });

        const cylinderMat = new THREE.MeshPhysicalMaterial({
            color: 0x222222,
            metalness: 0.9,
            roughness: 0.2,
            transmission: 0.3,
            transparent: true,
            opacity: 0.7
        });

        const pistonMat = new THREE.MeshStandardMaterial({
            color: 0xaaaaaa,
            metalness: 1.0,
            roughness: 0.15
        });

        const rodMat = new THREE.MeshStandardMaterial({
            color: 0x666666,
            metalness: 0.9,
            roughness: 0.3
        });

        // 1. 发动机缸体外壳
        const blockGeo = new THREE.BoxGeometry(6, 3, 4);
        const block = new THREE.Mesh(blockGeo, blockMat);
        block.position.y = -1;
        block.userData = { 
            name: '发动机缸体', 
            desc: 'V6发动机的核心结构，采用铝合金铸造，内部有6个气缸呈V型排列。' 
        };
        block.userData.onClick = () => this.showInfo(block.userData);
        this.engineGroup.add(block);
        this.interactables.push(block);

        // 2. 六个气缸 (V型60度布局)
        const firingOrder = [1, 4, 2, 5, 3, 6]; // 点火顺序
        const strokeNames = ['进气', '压缩', '做功', '排气'];

        for (let i = 0; i < 6; i++) {
            const bank = i % 2; // 0=左列, 1=右列
            const posInBank = Math.floor(i / 2); // 在该列的位置
            
            const angle = bank === 0 ? Math.PI / 6 : -Math.PI / 6; // 30度倾斜
            const xOffset = (posInBank - 1) * 2;
            const zOffset = bank === 0 ? -0.8 : 0.8;

            const cylGroup = new THREE.Group();
            cylGroup.position.set(xOffset, 0, zOffset);
            cylGroup.rotation.z = angle;

            // 气缸壁 (透明)
            const cylinder = new THREE.Mesh(
                new THREE.CylinderGeometry(0.7, 0.7, 2.8, 32, 1, true),
                cylinderMat.clone()
            );
            cylinder.position.y = 1;
            cylGroup.add(cylinder);

            // 活塞
            const piston = new THREE.Mesh(
                new THREE.CylinderGeometry(0.65, 0.65, 0.6, 32),
                pistonMat.clone()
            );
            piston.position.y = 0.5;

            // 活塞环 (装饰)
            for (let r = 0; r < 3; r++) {
                const ring = new THREE.Mesh(
                    new THREE.TorusGeometry(0.66, 0.03, 8, 32),
                    new THREE.MeshBasicMaterial({ color: 0x333333 })
                );
                ring.rotation.x = Math.PI / 2;
                ring.position.y = 0.15 - r * 0.15;
                piston.add(ring);
            }

            // 连杆
            const rod = new THREE.Mesh(
                new THREE.CylinderGeometry(0.12, 0.15, 2.2, 16),
                rodMat
            );
            rod.position.y = -1.4;
            piston.add(rod);

            // 燃烧室火焰效果
            const flameGeo = new THREE.SphereGeometry(0.5, 16, 16);
            const flameMat = new THREE.MeshBasicMaterial({
                color: 0xff6600,
                transparent: true,
                opacity: 0,
                blending: THREE.AdditiveBlending
            });
            const flame = new THREE.Mesh(flameGeo, flameMat);
            flame.position.y = 0.5;
            piston.add(flame);

            // 火花塞
            const sparkPlug = new THREE.Mesh(
                new THREE.CylinderGeometry(0.08, 0.12, 0.5, 8),
                new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.9 })
            );
            sparkPlug.position.y = 2.5;
            cylGroup.add(sparkPlug);

            // 数据绑定
            piston.userData = {
                id: i,
                cylinderNum: i + 1,
                firingOrder: firingOrder.indexOf(i + 1) + 1,
                flame: flame,
                bank: bank === 0 ? '左列' : '右列'
            };
            piston.userData.name = `气缸 #${i + 1}`;
            piston.userData.desc = `${piston.userData.bank}第${posInBank + 1}缸，点火顺序第${piston.userData.firingOrder}位。`;
            piston.userData.onClick = () => this.selectPiston(piston);

            cylGroup.add(piston);
            this.engineGroup.add(cylGroup);
            this.pistons.push({ mesh: piston, group: cylGroup, rodMesh: rod });
            this.interactables.push(piston);
        }

        // 3. 曲轴
        const crankGroup = new THREE.Group();
        
        const mainShaft = new THREE.Mesh(
            new THREE.CylinderGeometry(0.3, 0.3, 6, 16),
            new THREE.MeshStandardMaterial({ color: 0x444444, metalness: 0.95, roughness: 0.2 })
        );
        mainShaft.rotation.z = Math.PI / 2;
        crankGroup.add(mainShaft);

        // 曲轴偏心配重
        for (let i = 0; i < 3; i++) {
            const weight = new THREE.Mesh(
                new THREE.CylinderGeometry(0.6, 0.6, 0.3, 16),
                new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.9 })
            );
            weight.rotation.z = Math.PI / 2;
            weight.position.set(-2 + i * 2, 0.4, 0);
            crankGroup.add(weight);
        }

        crankGroup.position.y = -2;
        crankGroup.userData = { 
            name: '曲轴', 
            desc: '将活塞的往复运动转换为旋转运动，驱动车轮。每转两圈完成一个工作循环。' 
        };
        crankGroup.userData.onClick = () => this.showInfo(crankGroup.userData);
        this.engineGroup.add(crankGroup);
        this.crankshaft = crankGroup;
        this.interactables.push(crankGroup);

        // 4. 双涡轮增压器
        this.createTurbo(new THREE.Vector3(-3.5, 1, 0), '左涡轮');
        this.createTurbo(new THREE.Vector3(3.5, 1, 0), '右涡轮');

        // 5. 进气歧管
        const intakeGeo = new THREE.TorusGeometry(1.5, 0.2, 8, 16, Math.PI);
        const intakeMat = new THREE.MeshStandardMaterial({ 
            color: 0x2222aa, 
            metalness: 0.7, 
            roughness: 0.4 
        });
        const intake = new THREE.Mesh(intakeGeo, intakeMat);
        intake.rotation.x = Math.PI / 2;
        intake.rotation.z = Math.PI;
        intake.position.set(0, 2.5, -1.5);
        intake.userData = { 
            name: '进气歧管', 
            desc: '将经过涡轮增压的空气均匀分配到各个气缸。' 
        };
        intake.userData.onClick = () => this.showInfo(intake.userData);
        this.engineGroup.add(intake);
        this.interactables.push(intake);
    }

    createTurbo(pos, name) {
        const turboGroup = new THREE.Group();
        turboGroup.position.copy(pos);

        // 涡轮壳体
        const housing = new THREE.Mesh(
            new THREE.SphereGeometry(0.8, 16, 16),
            new THREE.MeshPhysicalMaterial({
                color: 0x333333,
                metalness: 0.95,
                roughness: 0.2,
                clearcoat: 0.5
            })
        );
        turboGroup.add(housing);

        // 涡轮叶片
        const bladeGroup = new THREE.Group();
        for (let i = 0; i < 8; i++) {
            const blade = new THREE.Mesh(
                new THREE.BoxGeometry(0.05, 0.5, 0.2),
                new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.9 })
            );
            blade.position.y = 0.2;
            blade.rotation.y = (i / 8) * Math.PI * 2;
            bladeGroup.add(blade);
        }
        bladeGroup.position.z = 0.4;
        turboGroup.add(bladeGroup);

        // 入口管
        const inlet = new THREE.Mesh(
            new THREE.CylinderGeometry(0.3, 0.4, 1, 16),
            new THREE.MeshStandardMaterial({ color: 0x222222 })
        );
        inlet.rotation.x = Math.PI / 2;
        inlet.position.z = 1;
        turboGroup.add(inlet);

        turboGroup.userData = { 
            name: name, 
            desc: '利用排气能量驱动涡轮，压缩进气，提升发动机功率30-50%！',
            bladeGroup: bladeGroup
        };
        turboGroup.userData.onClick = () => this.showInfo(turboGroup.userData);
        
        this.engineGroup.add(turboGroup);
        this.turboFans.push(bladeGroup);
        this.interactables.push(turboGroup);
    }

    setupExhaustParticles() {
        // 排气粒子效果
        const count = 100;
        const geo = new THREE.BufferGeometry();
        const positions = new Float32Array(count * 3);
        const colors = new Float32Array(count * 3);

        for (let i = 0; i < count; i++) {
            positions[i * 3] = 0;
            positions[i * 3 + 1] = -3;
            positions[i * 3 + 2] = 3;
            colors[i * 3] = 0.3;
            colors[i * 3 + 1] = 0.3;
            colors[i * 3 + 2] = 0.3;
        }

        geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

        const mat = new THREE.PointsMaterial({
            size: 0.1,
            vertexColors: true,
            transparent: true,
            opacity: 0.5,
            blending: THREE.AdditiveBlending
        });

        this.exhaustParticles = new THREE.Points(geo, mat);
        this.engineGroup.add(this.exhaustParticles);
    }

    selectPiston(piston) {
        this.params.selectedPiston = piston;
        
        // 重置所有活塞
        this.pistons.forEach(p => {
            p.mesh.material.emissive = new THREE.Color(0x000000);
        });

        // 高亮选中的
        piston.material.emissive = new THREE.Color(0x333300);

        this.showInfo({
            name: piston.userData.name,
            desc: piston.userData.desc,
            isPiston: true,
            pistonData: piston.userData
        });
    }

    showInfo(data) {
        const info = document.getElementById('info-content');
        if (info) {
            let extraContent = '';
            
            if (data.isPiston) {
                const pd = data.pistonData;
                extraContent = `
                    <div class="grid grid-cols-2 gap-2 mb-4 text-center text-xs">
                        <div class="bg-red-900/30 p-2 rounded border border-red-500/30">
                            <div class="text-gray-400">气缸编号</div>
                            <div class="text-xl font-bold text-red-400">#${pd.cylinderNum}</div>
                        </div>
                        <div class="bg-orange-900/30 p-2 rounded border border-orange-500/30">
                            <div class="text-gray-400">点火顺序</div>
                            <div class="text-xl font-bold text-orange-400">${pd.firingOrder}</div>
                        </div>
                    </div>
                    <div class="bg-gray-800/50 p-3 rounded-lg mb-4">
                        <div class="text-xs text-gray-400 mb-2">四冲程循环</div>
                        <div class="flex justify-between text-xs">
                            <span class="text-blue-400">① 进气</span>
                            <span class="text-green-400">② 压缩</span>
                            <span class="text-red-400">③ 做功</span>
                            <span class="text-gray-400">④ 排气</span>
                        </div>
                    </div>
                `;
            }

            info.innerHTML = `
                <div class="mb-4">
                    <div class="text-2xl font-bold text-white mb-2">${data.name}</div>
                    <div class="text-gray-300 text-sm leading-relaxed">${data.desc}</div>
                </div>
                ${extraContent}
                <div class="bg-gradient-to-r from-red-900/30 to-orange-900/30 p-4 rounded-lg border border-red-500/30 mb-4">
                    <div class="flex justify-between items-center mb-2">
                        <span class="text-red-400 font-bold"><i class="fas fa-tachometer-alt"></i> 转速 RPM</span>
                        <span id="rpm-display" class="font-mono text-2xl text-white">${this.params.rpm}</span>
                    </div>
                    <input type="range" min="800" max="9000" value="${this.params.rpm}" 
                        class="w-full h-2 bg-gray-700 rounded-lg accent-red-600" id="rpm-slider">
                </div>
                <div class="grid grid-cols-3 gap-2 text-center text-xs">
                    <div class="bg-gray-800 p-2 rounded">
                        <div class="text-gray-500">排量</div>
                        <div class="text-white font-mono">3.0L</div>
                    </div>
                    <div class="bg-gray-800 p-2 rounded">
                        <div class="text-gray-500">功率</div>
                        <div class="text-white font-mono">340HP</div>
                    </div>
                    <div class="bg-gray-800 p-2 rounded">
                        <div class="text-gray-500">扭矩</div>
                        <div class="text-white font-mono">450Nm</div>
                    </div>
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
    }

    setupUI() {
        const infoTitle = document.getElementById('info-title');
        if (infoTitle) infoTitle.innerText = "V6 双涡轮增压发动机";

        this.showInfo({ 
            name: 'V6 涡轮增压发动机', 
            desc: '高性能3.0升V6发动机，采用双涡轮增压技术，最大功率340马力。点击各个部件了解工作原理！' 
        });

        document.getElementById('info-panel').classList.add('visible');

        // 底部提示
        const controlsDiv = document.getElementById('scene-controls');
        if (controlsDiv) {
            controlsDiv.style.display = 'flex';
            controlsDiv.innerHTML = `
                <div class="tip-pill"><i class="fas fa-mouse-pointer"></i> 点击部件查看说明</div>
                <div class="tip-pill"><i class="fas fa-sliders-h"></i> 调节转速观察动画</div>
            `;
        }
    }

    animate(time, delta) {
        if (!this.params.isRunning) return;

        // 转速转为角速度
        const rpmFactor = this.params.rpm / 60;
        const cycleSpeed = time * rpmFactor * Math.PI * 2;

        // 曲轴旋转
        if (this.crankshaft) {
            this.crankshaft.rotation.x = cycleSpeed;
        }

        // 涡轮旋转
        this.turboFans.forEach(fan => {
            fan.rotation.z = cycleSpeed * 2;
        });

        // 活塞运动
        const firingOrder = [0, 4, 2, 5, 1, 3]; // 实际索引
        this.pistons.forEach((obj, i) => {
            const offset = firingOrder[i] * (Math.PI / 3);
            const cycle = cycleSpeed + offset;

            // 活塞简谐运动
            const pistonY = Math.sin(cycle) * 0.7;
            obj.mesh.position.y = 0.5 + pistonY;

            // 连杆摆动
            const rodAngle = Math.cos(cycle) * 0.12;
            obj.mesh.children[3].rotation.z = rodAngle; // rod是第4个子对象

            // 燃烧效果 - 做功冲程
            const flame = obj.mesh.userData.flame;
            const isFiring = Math.sin(cycle) > 0.85 && Math.cos(cycle) < 0;
            
            if (isFiring) {
                flame.material.opacity = 0.8 + Math.random() * 0.2;
                flame.scale.setScalar(1 + Math.random() * 0.3);
            } else {
                flame.material.opacity *= 0.85;
            }
        });

        // 发动机整体微震
        const vibration = (this.params.rpm / 9000) * 0.02;
        this.engineGroup.position.y = Math.sin(cycleSpeed * 6) * vibration;
        this.engineGroup.rotation.z = Math.sin(cycleSpeed * 3) * vibration * 0.5;

        // 排气粒子
        if (this.exhaustParticles) {
            const positions = this.exhaustParticles.geometry.attributes.position.array;
            for (let i = 0; i < positions.length / 3; i++) {
                const idx = i * 3;
                positions[idx + 2] += 0.1 * (this.params.rpm / 2000);
                positions[idx + 1] += (Math.random() - 0.5) * 0.02;
                
                if (positions[idx + 2] > 6) {
                    positions[idx] = (Math.random() - 0.5) * 0.5;
                    positions[idx + 1] = -3 + (Math.random() - 0.5) * 0.3;
                    positions[idx + 2] = 3;
                }
            }
            this.exhaustParticles.geometry.attributes.position.needsUpdate = true;
        }
    }

    getInteractables() {
        return this.interactables;
    }

    dispose() {
        this.scene.remove(this.engineGroup);
    }
}
