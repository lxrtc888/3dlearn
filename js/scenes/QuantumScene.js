/**
 * 双缝干涉实验场景
 * 展示量子力学中的观察者效应
 */
import { BaseScene } from './BaseScene.js';

export default class QuantumScene extends BaseScene {
    constructor(container, camera, scene, renderer, controls) {
        super(container, camera, scene, renderer, controls);
        
        this.particles = null;
        this.screenMesh = null;
        this.observerMesh = null;
        this.slitMesh = null;
        this.electronGun = null;
        this.observerActive = false;
        
        // 粒子系统参数
        this.particleCount = 1000;
        this.emissionRate = 5; // 每帧发射的粒子数
    }
    
    async setup() {
        // 设置相机位置
        this.camera.position.set(0, 5, 15);
        this.controls.target.set(0, 0, 0);
        
        // 添加环境光
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
        this.scene.add(ambientLight);
        this.objects.push(ambientLight);
        
        // 添加主光源
        const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
        dirLight.position.set(5, 10, 5);
        dirLight.castShadow = true;
        this.scene.add(dirLight);
        this.objects.push(dirLight);
        
        // 添加聚光灯照亮屏幕
        const spotlight = new THREE.SpotLight(0x00ffff, 2);
        spotlight.position.set(0, 5, -8);
        spotlight.angle = Math.PI / 6;
        spotlight.penumbra = 0.3;
        this.scene.add(spotlight);
        this.objects.push(spotlight);
        
        // 创建电子发射源
        this.createElectronGun();
        
        // 创建双缝装置
        this.createDoubleSlit();
        
        // 创建探测屏
        this.createDetectorScreen();
        
        // 创建观察者
        this.createObserver();
        
        // 创建粒子系统
        this.createParticleSystem();
        
        // 添加雾效增强氛围
        this.scene.fog = new THREE.Fog(0x000000, 10, 50);
    }
    
    /**
     * 创建电子发射源
     */
    createElectronGun() {
        const gunGroup = new THREE.Group();
        
        // 主体圆锥
        const coneGeometry = new THREE.ConeGeometry(0.5, 2, 16);
        const coneMaterial = new THREE.MeshStandardMaterial({
            color: 0x60a5fa,
            emissive: 0x2563eb,
            emissiveIntensity: 0.5,
            metalness: 0.7,
            roughness: 0.3
        });
        const cone = new THREE.Mesh(coneGeometry, coneMaterial);
        cone.rotation.x = -Math.PI / 2;
        gunGroup.add(cone);
        this.objects.push(cone);
        
        // 发光环
        const ringGeometry = new THREE.TorusGeometry(0.6, 0.1, 16, 32);
        const ringMaterial = new THREE.MeshStandardMaterial({
            color: 0x00ffff,
            emissive: 0x00ffff,
            emissiveIntensity: 1
        });
        const ring = new THREE.Mesh(ringGeometry, ringMaterial);
        ring.position.z = 0.5;
        ring.rotation.x = Math.PI / 2;
        gunGroup.add(ring);
        this.objects.push(ring);
        
        gunGroup.position.z = 8;
        this.scene.add(gunGroup);
        this.electronGun = gunGroup;
        this.objects.push(gunGroup);
        
        // 添加可点击交互
        cone.userData.onClick = () => {
            this.showInfoModal(
                '电子发射源',
                `
                <p class="text-gray-300 mb-3">电子枪持续向双缝装置发射单个电子。</p>
                <p class="text-gray-300 mb-3">在经典物理中,电子应该表现为粒子,通过其中一条缝。但在量子世界中,未被观测的电子会同时通过两条缝,表现出波的特性。</p>
                <div class="bg-blue-900/30 p-3 rounded-lg border border-blue-500/30">
                    <p class="text-blue-300 text-sm">💡 这就是量子叠加态的神奇之处!</p>
                </div>
                `,
                'fa-atom'
            );
        };
        this.interactableObjects.push(cone);
        
        // 创建标签
        this.createLabel('电子发射源', new THREE.Vector3(0, 1.5, 8), 'fa-radiation');
    }
    
    /**
     * 创建双缝装置
     */
    createDoubleSlit() {
        const slitGroup = new THREE.Group();
        const wallMaterial = new THREE.MeshStandardMaterial({
            color: 0x1e293b,
            metalness: 0.6,
            roughness: 0.4
        });
        
        // 左边墙
        const leftWall = new THREE.Mesh(
            new THREE.BoxGeometry(2.5, 4, 0.3),
            wallMaterial
        );
        leftWall.position.x = -2;
        slitGroup.add(leftWall);
        this.objects.push(leftWall);
        
        // 右边墙
        const rightWall = new THREE.Mesh(
            new THREE.BoxGeometry(2.5, 4, 0.3),
            wallMaterial
        );
        rightWall.position.x = 2;
        slitGroup.add(rightWall);
        this.objects.push(rightWall);
        
        // 中间隔板
        const centerBar = new THREE.Mesh(
            new THREE.BoxGeometry(0.5, 4, 0.3),
            wallMaterial
        );
        slitGroup.add(centerBar);
        this.objects.push(centerBar);
        
        // 发光边缘
        const edgesMaterial = new THREE.LineBasicMaterial({ color: 0x3b82f6 });
        [leftWall, rightWall, centerBar].forEach(wall => {
            const edges = new THREE.EdgesGeometry(wall.geometry);
            const line = new THREE.LineSegments(edges, edgesMaterial);
            wall.add(line);
        });
        
        slitGroup.position.z = 2;
        this.scene.add(slitGroup);
        this.slitMesh = slitGroup;
        this.objects.push(slitGroup);
        
        // 添加可点击交互
        centerBar.userData.onClick = () => {
            this.showInfoModal(
                '双缝装置',
                `
                <p class="text-gray-300 mb-3">两条平行的狭缝,间距约为几微米。</p>
                <p class="text-gray-300 mb-3"><strong class="text-white">关键现象:</strong></p>
                <ul class="list-disc list-inside text-gray-300 mb-3 space-y-1">
                    <li>未观测时:电子以波的形式同时通过两条缝,产生干涉</li>
                    <li>观测后:电子"选择"一条缝通过,表现为粒子</li>
                </ul>
                <div class="bg-purple-900/30 p-3 rounded-lg border border-purple-500/30">
                    <p class="text-purple-300 text-sm">🌊 波粒二象性的经典实验装置</p>
                </div>
                `,
                'fa-grip-lines-vertical'
            );
        };
        this.interactableObjects.push(centerBar);
        
        this.createLabel('双缝装置', new THREE.Vector3(0, 2.5, 2), 'fa-grip-lines-vertical');
    }
    
    /**
     * 创建探测屏
     */
    createDetectorScreen() {
        const screenGeometry = new THREE.PlaneGeometry(10, 6);
        const screenMaterial = new THREE.MeshBasicMaterial({
            color: 0x000000,
            side: THREE.DoubleSide
        });
        
        this.screenMesh = new THREE.Mesh(screenGeometry, screenMaterial);
        this.screenMesh.position.z = -6;
        this.scene.add(this.screenMesh);
        this.objects.push(this.screenMesh);
        
        // 添加框架
        const frameGeometry = new THREE.EdgesGeometry(screenGeometry);
        const frameMaterial = new THREE.LineBasicMaterial({ color: 0x64748b, linewidth: 2 });
        const frame = new THREE.LineSegments(frameGeometry, frameMaterial);
        this.screenMesh.add(frame);
        
        // 添加可点击交互
        this.screenMesh.userData.onClick = () => {
            this.showInfoModal(
                '探测屏幕',
                `
                <p class="text-gray-300 mb-3">记录电子撞击位置的荧光屏。</p>
                <p class="text-gray-300 mb-3"><strong class="text-white">观察结果:</strong></p>
                <ul class="list-disc list-inside text-gray-300 mb-3 space-y-1">
                    <li><span class="text-cyan-400">无观察者:</span> 出现明暗相间的干涉条纹(波动性)</li>
                    <li><span class="text-cyan-400">有观察者:</span> 仅在两条缝后方出现亮条(粒子性)</li>
                </ul>
                <div class="bg-cyan-900/30 p-3 rounded-lg border border-cyan-500/30">
                    <p class="text-cyan-300 text-sm">📊 观察行为改变了实验结果!</p>
                </div>
                `,
                'fa-tv'
            );
        };
        this.interactableObjects.push(this.screenMesh);
        
        this.createLabel('探测屏幕', new THREE.Vector3(5, 3, -6), 'fa-tv');
    }
    
    /**
     * 创建观察者
     */
    createObserver() {
        const observerGroup = new THREE.Group();
        
        // 眼睛
        const eyeGeometry = new THREE.SphereGeometry(0.5, 32, 32);
        const eyeMaterial = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            metalness: 0.3,
            roughness: 0.7
        });
        const eye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        observerGroup.add(eye);
        this.objects.push(eye);
        
        // 瞳孔
        const pupilGeometry = new THREE.SphereGeometry(0.25, 32, 32);
        const pupilMaterial = new THREE.MeshStandardMaterial({
            color: 0x000000,
            emissive: 0x3b82f6,
            emissiveIntensity: 0.5
        });
        const pupil = new THREE.Mesh(pupilGeometry, pupilMaterial);
        pupil.position.z = 0.4;
        observerGroup.add(pupil);
        this.objects.push(pupil);
        
        // 观察光束
        const beamGeometry = new THREE.CylinderGeometry(0.05, 0.3, 4, 16);
        const beamMaterial = new THREE.MeshBasicMaterial({
            color: 0xff0000,
            transparent: true,
            opacity: 0.3
        });
        const beam = new THREE.Mesh(beamGeometry, beamMaterial);
        beam.rotation.z = Math.PI / 2;
        beam.position.set(-2, 0, 0);
        observerGroup.add(beam);
        this.objects.push(beam);
        
        observerGroup.position.set(3, 2, 2);
        observerGroup.lookAt(0, 0, 2);
        observerGroup.visible = false;
        
        this.scene.add(observerGroup);
        this.observerMesh = observerGroup;
        this.objects.push(observerGroup);
        
        this.createLabel('观察者', new THREE.Vector3(3, 3, 2), 'fa-eye');
    }
    
    /**
     * 创建粒子系统
     */
    createParticleSystem() {
        const positions = new Float32Array(this.particleCount * 3);
        const velocities = new Float32Array(this.particleCount * 3);
        const ages = new Float32Array(this.particleCount);
        
        // 初始化所有粒子在发射源位置
        for (let i = 0; i < this.particleCount; i++) {
            const i3 = i * 3;
            positions[i3] = 0;
            positions[i3 + 1] = 0;
            positions[i3 + 2] = 8;
            ages[i] = -Math.random() * 10; // 随机延迟发射
        }
        
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3));
        geometry.setAttribute('age', new THREE.BufferAttribute(ages, 1));
        
        const material = new THREE.PointsMaterial({
            color: 0x00ffff,
            size: 0.15,
            transparent: true,
            opacity: 0.8,
            blending: THREE.AdditiveBlending
        });
        
        this.particles = new THREE.Points(geometry, material);
        this.scene.add(this.particles);
        this.objects.push(this.particles);
    }
    
    /**
     * 切换观察者状态
     */
    toggleObserver() {
        this.observerActive = !this.observerActive;
        this.observerMesh.visible = this.observerActive;
        
        return this.observerActive;
    }
    
    /**
     * 动画更新
     */
    animate(time) {
        // 电子枪发光动画
        if (this.electronGun) {
            const pulse = Math.sin(time * 3) * 0.3 + 0.7;
            this.electronGun.children[1].material.emissiveIntensity = pulse;
        }
        
        // 更新粒子
        this.updateParticles(time);
        
        // 更新探测屏图案
        this.updateScreen();
        
        // 观察者瞳孔发光
        if (this.observerActive && this.observerMesh) {
            const glow = Math.sin(time * 4) * 0.3 + 0.5;
            this.observerMesh.children[1].material.emissiveIntensity = glow;
        }
    }
    
    /**
     * 更新粒子运动
     */
    updateParticles(time) {
        const positions = this.particles.geometry.attributes.position.array;
        const ages = this.particles.geometry.attributes.age.array;
        const speed = 0.15;
        
        for (let i = 0; i < this.particleCount; i++) {
            const i3 = i * 3;
            
            // 更新年龄
            ages[i] += 0.016;
            
            // 如果粒子太老,重置
            if (ages[i] > 0 && positions[i3 + 2] < -7) {
                positions[i3] = (Math.random() - 0.5) * 0.2;
                positions[i3 + 1] = (Math.random() - 0.5) * 0.2;
                positions[i3 + 2] = 8;
                ages[i] = 0;
            }
            
            // 只移动激活的粒子
            if (ages[i] > 0) {
                // 向前移动
                positions[i3 + 2] -= speed;
                
                // 在双缝后添加波动效应(无观察者)
                if (positions[i3 + 2] < 2 && positions[i3 + 2] > -6 && !this.observerActive) {
                    positions[i3] += Math.sin(time * 10 + i) * 0.02;
                    positions[i3 + 1] += Math.cos(time * 10 + i) * 0.01;
                }
            }
        }
        
        this.particles.geometry.attributes.position.needsUpdate = true;
        this.particles.geometry.attributes.age.needsUpdate = true;
    }
    
    /**
     * 更新探测屏图案
     */
    updateScreen() {
        // 创建canvas纹理
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 128;
        const ctx = canvas.getContext('2d');
        
        // 黑色背景
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, 256, 128);
        
        // 绘制检测结果
        ctx.fillStyle = '#00ffff';
        
        if (this.observerActive) {
            // 观察者模式:两条亮带(粒子性)
            ctx.filter = 'blur(4px)';
            ctx.fillRect(60, 20, 15, 88);
            ctx.fillRect(180, 20, 15, 88);
        } else {
            // 无观察者:干涉条纹(波动性)
            ctx.filter = 'blur(6px)';
            for (let k = 0; k < 9; k++) {
                const alpha = k % 2 === 0 ? 0.8 : 0.2;
                ctx.globalAlpha = alpha;
                const width = k % 2 === 0 ? 12 : 8;
                ctx.fillRect(20 + k * 24, 20, width, 88);
            }
        }
        
        // 应用纹理
        const texture = new THREE.CanvasTexture(canvas);
        this.screenMesh.material.map = texture;
        this.screenMesh.material.needsUpdate = true;
    }
    
    /**
     * 获取场景控制按钮
     */
    getControls() {
        return `
            <button class="control-btn" id="btn-observer">
                <i class="fas fa-eye-slash"></i>
                <span>放置观察者</span>
            </button>
        `;
    }
    
    /**
     * 获取场景提示
     */
    getTips() {
        return '💡 <b>交互提示：</b><br>1. 点击场景中的设备查看详细说明<br>2. 点击下方按钮切换观察者状态<br>3. 观察屏幕图案的变化';
    }
}

