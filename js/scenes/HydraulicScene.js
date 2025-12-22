/**
 * 液压系统场景
 * 展示帕斯卡定律的流体力学原理
 */
import { BaseScene } from './BaseScene.js';

export default class HydraulicScene extends BaseScene {
    constructor(container, camera, scene, renderer, controls) {
        super(container, camera, scene, renderer, controls);
        
        this.hydraulicGroup = null;
        this.smallPiston = null;
        this.largePiston = null;
        this.fluidLeft = null;
        this.fluidRight = null;
        this.fluidPipe = null;
        this.weight = null;
        
        this.inputForce = 0;
        this.areaRatio = 4; // 大活塞面积是小活塞的4倍
    }
    
    async setup() {
        // 设置相机
        this.camera.position.set(0, 5, 18);
        this.controls.target.set(0, 0, 0);
        
        // 光照
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(ambientLight);
        this.objects.push(ambientLight);
        
        const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
        dirLight.position.set(5, 10, 5);
        dirLight.castShadow = true;
        this.scene.add(dirLight);
        this.objects.push(dirLight);
        
        // 蓝色环境光
        const blueLight = new THREE.PointLight(0x3b82f6, 1, 30);
        blueLight.position.set(0, 5, 0);
        this.scene.add(blueLight);
        this.objects.push(blueLight);
        
        // 创建液压系统
        this.createHydraulicSystem();
        
        // 添加地面
        this.createGround();
    }
    
    /**
     * 创建液压系统
     */
    createHydraulicSystem() {
        this.hydraulicGroup = new THREE.Group();
        this.scene.add(this.hydraulicGroup);
        this.objects.push(this.hydraulicGroup);
        
        // 创建气缸容器
        this.createCylinders();
        
        // 创建液体
        this.createFluid();
        
        // 创建活塞
        this.createPistons();
        
        // 创建重物
        this.createWeight();
        
        // 创建连接管道
        this.createPipe();
        
        // 添加压力指示器
        this.createPressureIndicators();
    }
    
    /**
     * 创建气缸容器
     */
    createCylinders() {
        const glassMaterial = new THREE.MeshPhysicalMaterial({
            color: 0xffffff,
            transmission: 0.9,
            opacity: 0.5,
            transparent: true,
            roughness: 0.1,
            metalness: 0,
            thickness: 0.5
        });
        
        // 小气缸 (直径小)
        const smallCylinderGeo = new THREE.CylinderGeometry(1.2, 1.2, 5, 32, 1, true);
        const smallCylinder = new THREE.Mesh(smallCylinderGeo, glassMaterial);
        smallCylinder.position.x = -4;
        this.hydraulicGroup.add(smallCylinder);
        this.objects.push(smallCylinder);
        
        // 添加边缘
        const smallEdges = new THREE.EdgesGeometry(smallCylinderGeo);
        const edgeMaterial = new THREE.LineBasicMaterial({ color: 0x64748b });
        const smallWireframe = new THREE.LineSegments(smallEdges, edgeMaterial);
        smallCylinder.add(smallWireframe);
        
        // 大气缸 (直径大)
        const largeCylinderGeo = new THREE.CylinderGeometry(2.2, 2.2, 5, 32, 1, true);
        const largeCylinder = new THREE.Mesh(largeCylinderGeo, glassMaterial.clone());
        largeCylinder.position.x = 4;
        this.hydraulicGroup.add(largeCylinder);
        this.objects.push(largeCylinder);
        
        const largeEdges = new THREE.EdgesGeometry(largeCylinderGeo);
        const largeWireframe = new THREE.LineSegments(largeEdges, edgeMaterial.clone());
        largeCylinder.add(largeWireframe);
        
        // 添加交互
        smallCylinder.userData.onClick = () => {
            this.showInfoModal(
                '小气缸 (输入端)',
                `
                <p class="text-gray-300 mb-3">输入活塞工作的气缸,横截面积较小。</p>
                <p class="text-gray-300 mb-3"><strong class="text-white">特点:</strong></p>
                <ul class="list-disc list-inside text-gray-300 mb-3 space-y-1">
                    <li>面积小,需要的输入力小</li>
                    <li>位移大,产生的压力传递到整个系统</li>
                </ul>
                <div class="bg-blue-900/30 p-3 rounded-lg border border-blue-500/30">
                    <p class="text-blue-300 text-sm">📐 面积: A₁ = πr₁²</p>
                </div>
                `,
                'fa-circle'
            );
        };
        this.interactableObjects.push(smallCylinder);
        
        largeCylinder.userData.onClick = () => {
            this.showInfoModal(
                '大气缸 (输出端)',
                `
                <p class="text-gray-300 mb-3">输出活塞工作的气缸,横截面积是小气缸的${this.areaRatio}倍。</p>
                <p class="text-gray-300 mb-3"><strong class="text-white">帕斯卡定律:</strong></p>
                <div class="bg-purple-900/30 p-3 rounded-lg border border-purple-500/30 mb-3">
                    <p class="text-purple-200 text-center font-mono text-lg">F₁/A₁ = F₂/A₂</p>
                    <p class="text-purple-300 text-sm text-center mt-2">压强在密闭流体中处处相等</p>
                </div>
                <p class="text-gray-300 mb-3">因此: <strong class="text-green-400">F₂ = F₁ × (A₂/A₁) = ${this.areaRatio}F₁</strong></p>
                <p class="text-gray-300">小力可以举起重物!</p>
                `,
                'fa-expand'
            );
        };
        this.interactableObjects.push(largeCylinder);
        
        this.createLabel('小气缸 (输入)', new THREE.Vector3(-4, 3, 0), 'fa-compress');
        this.createLabel(`大气缸 (输出 ×${this.areaRatio})`, new THREE.Vector3(4, 4, 0), 'fa-expand');
    }
    
    /**
     * 创建液体
     */
    createFluid() {
        const fluidMaterial = new THREE.MeshStandardMaterial({
            color: 0x3b82f6,
            transparent: true,
            opacity: 0.8,
            metalness: 0.3,
            roughness: 0.2,
            emissive: 0x1e40af,
            emissiveIntensity: 0.2
        });
        
        // 左侧液体
        this.fluidLeft = new THREE.Mesh(
            new THREE.CylinderGeometry(1, 1, 1, 32),
            fluidMaterial
        );
        this.fluidLeft.position.set(-4, -1.5, 0);
        this.hydraulicGroup.add(this.fluidLeft);
        this.objects.push(this.fluidLeft);
        
        // 右侧液体
        this.fluidRight = new THREE.Mesh(
            new THREE.CylinderGeometry(2, 2, 1, 32),
            fluidMaterial.clone()
        );
        this.fluidRight.position.set(4, -1.5, 0);
        this.hydraulicGroup.add(this.fluidRight);
        this.objects.push(this.fluidRight);
        
        // 管道液体
        this.fluidPipe = new THREE.Mesh(
            new THREE.CylinderGeometry(0.6, 0.6, 8, 32),
            fluidMaterial.clone()
        );
        this.fluidPipe.rotation.z = Math.PI / 2;
        this.fluidPipe.position.y = -2.3;
        this.hydraulicGroup.add(this.fluidPipe);
        this.objects.push(this.fluidPipe);
    }
    
    /**
     * 创建活塞
     */
    createPistons() {
        const pistonMaterial = new THREE.MeshStandardMaterial({
            color: 0x64748b,
            metalness: 0.8,
            roughness: 0.3
        });
        
        // 小活塞
        const smallPistonGeo = new THREE.CylinderGeometry(1.1, 1.1, 0.5, 32);
        this.smallPiston = new THREE.Mesh(smallPistonGeo, pistonMaterial);
        this.smallPiston.position.set(-4, 0, 0);
        this.hydraulicGroup.add(this.smallPiston);
        this.objects.push(this.smallPiston);
        
        // 小活塞杆
        const smallRod = new THREE.Mesh(
            new THREE.CylinderGeometry(0.2, 0.2, 2, 16),
            pistonMaterial.clone()
        );
        smallRod.position.y = 1.25;
        this.smallPiston.add(smallRod);
        this.objects.push(smallRod);
        
        // 大活塞
        const largePistonGeo = new THREE.CylinderGeometry(2.1, 2.1, 0.5, 32);
        this.largePiston = new THREE.Mesh(largePistonGeo, pistonMaterial.clone());
        this.largePiston.position.set(4, 0, 0);
        this.hydraulicGroup.add(this.largePiston);
        this.objects.push(this.largePiston);
        
        // 大活塞杆
        const largeRod = new THREE.Mesh(
            new THREE.CylinderGeometry(0.3, 0.3, 1.5, 16),
            pistonMaterial.clone()
        );
        largeRod.position.y = 1;
        this.largePiston.add(largeRod);
        this.objects.push(largeRod);
        
        // 添加交互
        this.smallPiston.userData.onClick = () => {
            this.showInfoModal(
                '输入活塞',
                `
                <p class="text-gray-300 mb-3">接受外力作用的活塞,向下压缩时产生压强。</p>
                <p class="text-gray-300 mb-3">产生的压强 <strong class="text-cyan-400">P = F₁/A₁</strong></p>
                <p class="text-gray-300">这个压强通过液体传递到整个系统。</p>
                `,
                'fa-hand-point-down'
            );
        };
        this.interactableObjects.push(this.smallPiston);
        
        this.createLabel('输入力 F₁', new THREE.Vector3(-4, 2.5, 0), 'fa-arrow-down');
    }
    
    /**
     * 创建重物
     */
    createWeight() {
        const weightGeo = new THREE.BoxGeometry(2.5, 2, 2.5);
        const weightMaterial = new THREE.MeshStandardMaterial({
            color: 0xf59e0b,
            metalness: 0.5,
            roughness: 0.5
        });
        
        this.weight = new THREE.Mesh(weightGeo, weightMaterial);
        this.weight.position.set(4, 2.25, 0);
        this.weight.castShadow = true;
        this.hydraulicGroup.add(this.weight);
        this.objects.push(this.weight);
        
        // 添加重量标签
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(0, 0, 256, 256);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 48px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('1000kg', 128, 128);
        
        const texture = new THREE.CanvasTexture(canvas);
        const labelMaterial = new THREE.MeshBasicMaterial({ map: texture });
        const label = new THREE.Mesh(
            new THREE.PlaneGeometry(2, 2),
            labelMaterial
        );
        label.position.set(0, 0, 1.26);
        this.weight.add(label);
        
        // 交互
        this.weight.userData.onClick = () => {
            this.showInfoModal(
                '重物 (1000kg)',
                `
                <p class="text-gray-300 mb-3">需要被举起的重物,重量为1000kg。</p>
                <p class="text-gray-300 mb-3">如果直接举起,需要约 <strong class="text-red-400">10000N</strong> 的力。</p>
                <p class="text-gray-300 mb-3">通过液压系统,只需要 <strong class="text-green-400">2500N</strong> 的输入力!</p>
                <div class="bg-yellow-900/30 p-3 rounded-lg border border-yellow-500/30">
                    <p class="text-yellow-300 text-sm">⚙️ 这就是液压千斤顶的原理</p>
                </div>
                `,
                'fa-weight-hanging'
            );
        };
        this.interactableObjects.push(this.weight);
        
        this.createLabel('重物 1000kg', new THREE.Vector3(4, 3.5, 0), 'fa-weight-hanging');
    }
    
    /**
     * 创建连接管道
     */
    createPipe() {
        const pipeGeo = new THREE.CylinderGeometry(0.8, 0.8, 8, 32, 1, true);
        const pipeMaterial = new THREE.MeshPhysicalMaterial({
            color: 0xffffff,
            transmission: 0.9,
            opacity: 0.5,
            transparent: true,
            roughness: 0.1,
            metalness: 0
        });
        
        const pipe = new THREE.Mesh(pipeGeo, pipeMaterial);
        pipe.rotation.z = Math.PI / 2;
        pipe.position.y = -2.3;
        this.hydraulicGroup.add(pipe);
        this.objects.push(pipe);
        
        // 管道边缘
        const edges = new THREE.EdgesGeometry(pipeGeo);
        const edgeMaterial = new THREE.LineBasicMaterial({ color: 0x64748b });
        const wireframe = new THREE.LineSegments(edges, edgeMaterial);
        pipe.add(wireframe);
    }
    
    /**
     * 创建压力指示器
     */
    createPressureIndicators() {
        // 可以添加压力表等装饰
    }
    
    /**
     * 创建地面
     */
    createGround() {
        const groundGeo = new THREE.PlaneGeometry(30, 30);
        const groundMaterial = new THREE.MeshStandardMaterial({
            color: 0x1e293b,
            roughness: 0.8,
            metalness: 0.2
        });
        
        const ground = new THREE.Mesh(groundGeo, groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        ground.position.y = -5;
        ground.receiveShadow = true;
        this.scene.add(ground);
        this.objects.push(ground);
        
        // 网格线
        const gridHelper = new THREE.GridHelper(30, 30, 0x475569, 0x334155);
        gridHelper.position.y = -4.99;
        this.scene.add(gridHelper);
        this.objects.push(gridHelper);
    }
    
    /**
     * 动画更新
     */
    animate(time) {
        // 输入活塞的往复运动
        const inputY = Math.sin(time * 2) * 1.5;
        this.smallPiston.position.y = inputY;
        
        // 更新左侧液体高度
        const leftFluidHeight = Math.max(0.1, 2 + inputY);
        this.fluidLeft.scale.y = leftFluidHeight;
        this.fluidLeft.position.y = -2 + leftFluidHeight / 2;
        
        // 根据面积比计算输出活塞位移 (位移比是面积比的倒数)
        const outputY = -inputY / this.areaRatio;
        this.largePiston.position.y = outputY;
        
        // 更新右侧液体高度
        const rightFluidHeight = Math.max(0.1, 2 + outputY);
        this.fluidRight.scale.y = rightFluidHeight;
        this.fluidRight.position.y = -2 + rightFluidHeight / 2;
        
        // 重物跟随大活塞移动
        this.weight.position.y = outputY + 2.25;
        
        // 液体发光效果
        const glow = Math.sin(time * 3) * 0.1 + 0.2;
        this.fluidLeft.material.emissiveIntensity = glow;
        this.fluidRight.material.emissiveIntensity = glow;
        this.fluidPipe.material.emissiveIntensity = glow;
        
        // 整体轻微旋转
        this.hydraulicGroup.rotation.y = Math.sin(time * 0.1) * 0.1;
    }
    
    /**
     * 获取场景提示
     */
    getTips() {
        return '💧 <b>液压传动系统</b><br>点击气缸、活塞、重物查看帕斯卡定律的工作原理。观察小力如何举起重物。';
    }
}

