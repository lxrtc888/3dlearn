/**
 * V6发动机场景
 * 赛博朋克风格的机械美学展示
 */
import { BaseScene } from './BaseScene.js';

export default class EngineScene extends BaseScene {
    constructor(container, camera, scene, renderer, controls) {
        super(container, camera, scene, renderer, controls);
        
        this.engineGroup = null;
        this.pistons = [];
        this.crankshaft = null;
        this.sparkPlugs = [];
    }
    
    async setup() {
        // 设置相机
        this.camera.position.set(0, 5, 20);
        this.controls.target.set(0, 0, 0);
        
        // 赛博朋克风格光照
        const ambientLight = new THREE.AmbientLight(0x4a5568, 0.3);
        this.scene.add(ambientLight);
        this.objects.push(ambientLight);
        
        // 蓝色聚光灯
        const spotlight = new THREE.SpotLight(0x3b82f6, 5);
        spotlight.position.set(0, 15, 0);
        spotlight.angle = Math.PI / 4;
        spotlight.penumbra = 0.5;
        spotlight.castShadow = true;
        this.scene.add(spotlight);
        this.objects.push(spotlight);
        
        // 侧面粉色光
        const sideLight1 = new THREE.PointLight(0xff1744, 2, 20);
        sideLight1.position.set(10, 5, 5);
        this.scene.add(sideLight1);
        this.objects.push(sideLight1);
        
        const sideLight2 = new THREE.PointLight(0x00e5ff, 2, 20);
        sideLight2.position.set(-10, 5, -5);
        this.scene.add(sideLight2);
        this.objects.push(sideLight2);
        
        // 创建发动机
        this.createEngine();
        
        // 添加雾效
        this.scene.fog = new THREE.FogExp2(0x0a0a0a, 0.02);
    }
    
    /**
     * 创建发动机组件
     */
    createEngine() {
        this.engineGroup = new THREE.Group();
        this.scene.add(this.engineGroup);
        this.objects.push(this.engineGroup);
        
        // 创建气缸体
        this.createEngineBlock();
        
        // 创建6个活塞
        this.createPistons();
        
        // 创建曲轴
        this.createCrankshaft();
        
        // 创建火花塞
        this.createSparkPlugs();
        
        // 添加装饰管道
        this.createPipes();
    }
    
    /**
     * 创建气缸体
     */
    createEngineBlock() {
        const blockGeometry = new THREE.BoxGeometry(7, 3.5, 3);
        
        // 玻璃材质气缸体
        const glassMaterial = new THREE.MeshPhysicalMaterial({
            color: 0x0f172a,
            transmission: 0.8,
            opacity: 0.3,
            transparent: true,
            roughness: 0.1,
            metalness: 0.9,
            clearcoat: 1,
            clearcoatRoughness: 0.1
        });
        
        const glassBlock = new THREE.Mesh(blockGeometry, glassMaterial);
        this.engineGroup.add(glassBlock);
        this.objects.push(glassBlock);
        
        // 边缘线框
        const edges = new THREE.EdgesGeometry(blockGeometry);
        const lineMaterial = new THREE.LineBasicMaterial({ 
            color: 0x3b82f6,
            linewidth: 2
        });
        const wireframe = new THREE.LineSegments(edges, lineMaterial);
        this.engineGroup.add(wireframe);
        this.objects.push(wireframe);
        
        // 添加交互
        glassBlock.userData.onClick = () => {
            this.showInfoModal(
                'V6 气缸体',
                `
                <p class="text-gray-300 mb-3">V型6缸发动机的核心结构,采用透明玻璃材质展现内部机械运作。</p>
                <p class="text-gray-300 mb-3"><strong class="text-white">V6布局特点:</strong></p>
                <ul class="list-disc list-inside text-gray-300 mb-3 space-y-1">
                    <li>两组气缸呈V字型排列,角度通常为60°或90°</li>
                    <li>结构紧凑,振动平衡性好</li>
                    <li>广泛应用于轿车和跑车</li>
                </ul>
                <div class="bg-blue-900/30 p-3 rounded-lg border border-blue-500/30">
                    <p class="text-blue-300 text-sm">⚡ 赛博朋克风格的机械美学</p>
                </div>
                `,
                'fa-cube'
            );
        };
        this.interactableObjects.push(glassBlock);
        
        this.createLabel('V6 气缸体', new THREE.Vector3(0, 2.5, 0), 'fa-cube');
    }
    
    /**
     * 创建活塞组
     */
    createPistons() {
        const pistonGeometry = new THREE.CylinderGeometry(0.5, 0.5, 1.2, 32);
        const pistonMaterial = new THREE.MeshStandardMaterial({
            color: 0x94a3b8,
            metalness: 0.9,
            roughness: 0.2,
            emissive: 0x475569,
            emissiveIntensity: 0.1
        });
        
        // V型排列
        for (let i = 0; i < 6; i++) {
            const piston = new THREE.Mesh(pistonGeometry, pistonMaterial.clone());
            
            // 计算位置 (左右交替,前中后三组)
            const side = i % 2 === 0 ? 1 : -1;
            const z = (Math.floor(i / 2) - 1) * 2;
            const angle = side * 0.3; // V型角度
            
            piston.position.set(z, 0, side * 0.8);
            piston.rotation.x = angle;
            
            this.engineGroup.add(piston);
            this.pistons.push(piston);
            this.objects.push(piston);
            
            // 连杆
            const rodGeometry = new THREE.CylinderGeometry(0.1, 0.1, 2.5, 16);
            const rodMaterial = new THREE.MeshStandardMaterial({
                color: 0x475569,
                metalness: 0.8,
                roughness: 0.3
            });
            const rod = new THREE.Mesh(rodGeometry, rodMaterial);
            rod.position.y = -1.5;
            piston.add(rod);
            this.objects.push(rod);
            
            // 添加交互
            piston.userData.cylinderNumber = i + 1;
            piston.userData.onClick = (obj) => {
                this.showInfoModal(
                    `活塞 #${obj.userData.cylinderNumber}`,
                    `
                    <p class="text-gray-300 mb-3">第 ${obj.userData.cylinderNumber} 号气缸活塞,在气缸内做往复直线运动。</p>
                    <p class="text-gray-300 mb-3"><strong class="text-white">四冲程工作循环:</strong></p>
                    <ol class="list-decimal list-inside text-gray-300 mb-3 space-y-1">
                        <li><span class="text-blue-400">进气:</span> 活塞下行,吸入混合气</li>
                        <li><span class="text-green-400">压缩:</span> 活塞上行,压缩混合气</li>
                        <li><span class="text-red-400">做功:</span> 火花塞点火,爆炸推动活塞下行</li>
                        <li><span class="text-yellow-400">排气:</span> 活塞上行,排出废气</li>
                    </ol>
                    <div class="bg-gradient-to-r from-blue-900/30 to-purple-900/30 p-3 rounded-lg border border-blue-500/30">
                        <p class="text-blue-300 text-sm">🔥 观察活塞的等离子燃烧效果!</p>
                    </div>
                    `,
                    'fa-compress-arrows-alt'
                );
            };
            this.interactableObjects.push(piston);
        }
        
        // 为第一个活塞添加标签
        this.createLabel('活塞 #1', new THREE.Vector3(-2, 1.5, 0.8), 'fa-compress-arrows-alt');
    }
    
    /**
     * 创建曲轴
     */
    createCrankshaft() {
        const crankGroup = new THREE.Group();
        
        // 主轴
        const shaftGeometry = new THREE.CylinderGeometry(0.3, 0.3, 8, 32);
        const shaftMaterial = new THREE.MeshStandardMaterial({
            color: 0x1e293b,
            metalness: 1,
            roughness: 0.2,
            emissive: 0x3b82f6,
            emissiveIntensity: 0.2
        });
        const shaft = new THREE.Mesh(shaftGeometry, shaftMaterial);
        shaft.rotation.z = Math.PI / 2;
        crankGroup.add(shaft);
        this.objects.push(shaft);
        
        // 曲柄臂
        for (let i = 0; i < 6; i++) {
            const armGeometry = new THREE.BoxGeometry(0.4, 0.8, 0.2);
            const arm = new THREE.Mesh(armGeometry, shaftMaterial.clone());
            const x = (i - 2.5) * 1.3;
            arm.position.set(x, -0.4, 0);
            crankGroup.add(arm);
            this.objects.push(arm);
        }
        
        crankGroup.position.y = -3;
        this.engineGroup.add(crankGroup);
        this.crankshaft = crankGroup;
        this.objects.push(crankGroup);
        
        this.createLabel('曲轴', new THREE.Vector3(0, -3.5, 0), 'fa-cog');
    }
    
    /**
     * 创建火花塞
     */
    createSparkPlugs() {
        for (let i = 0; i < 6; i++) {
            const side = i % 2 === 0 ? 1 : -1;
            const z = (Math.floor(i / 2) - 1) * 2;
            
            const plugGeometry = new THREE.CylinderGeometry(0.15, 0.15, 0.8, 16);
            const plugMaterial = new THREE.MeshStandardMaterial({
                color: 0xfbbf24,
                metalness: 0.8,
                roughness: 0.3,
                emissive: 0xfbbf24,
                emissiveIntensity: 0
            });
            
            const plug = new THREE.Mesh(plugGeometry, plugMaterial);
            plug.position.set(z, 2.2, side * 1.2);
            plug.rotation.x = side * Math.PI / 6;
            
            this.engineGroup.add(plug);
            this.sparkPlugs.push(plug);
            this.objects.push(plug);
        }
    }
    
    /**
     * 创建装饰管道
     */
    createPipes() {
        const pipeGeometry = new THREE.TorusGeometry(0.5, 0.08, 16, 32, Math.PI);
        const pipeMaterial = new THREE.MeshStandardMaterial({
            color: 0x64748b,
            metalness: 0.7,
            roughness: 0.4
        });
        
        // 左侧管道
        const pipe1 = new THREE.Mesh(pipeGeometry, pipeMaterial);
        pipe1.position.set(-3, 1, 1.5);
        pipe1.rotation.y = Math.PI / 2;
        this.engineGroup.add(pipe1);
        this.objects.push(pipe1);
        
        // 右侧管道
        const pipe2 = new THREE.Mesh(pipeGeometry, pipeMaterial.clone());
        pipe2.position.set(3, 1, -1.5);
        pipe2.rotation.y = -Math.PI / 2;
        this.engineGroup.add(pipe2);
        this.objects.push(pipe2);
    }
    
    /**
     * 动画更新
     */
    animate(time) {
        // 整体缓慢旋转
        this.engineGroup.rotation.y = Math.sin(time * 0.2) * 0.2;
        
        // 曲轴旋转
        if (this.crankshaft) {
            this.crankshaft.rotation.x = time * 5;
        }
        
        // 活塞运动 (模拟点火顺序: 1-4-2-5-3-6)
        const firingOrder = [0, 3, 1, 4, 2, 5];
        this.pistons.forEach((piston, i) => {
            const offset = firingOrder[i] * (Math.PI * 2 / 6);
            const phase = time * 10 + offset;
            
            // 往复运动
            const y = Math.sin(phase) * 0.6;
            piston.position.y = y;
            
            // 燃烧效果 (在压缩上止点时点火)
            const isFiring = Math.sin(phase) > 0.8;
            if (isFiring) {
                piston.material.emissive.setHex(0xff3366);
                piston.material.emissiveIntensity = 2 * (Math.sin(phase) - 0.8) * 5;
                
                // 火花塞闪光
                if (this.sparkPlugs[i]) {
                    this.sparkPlugs[i].material.emissiveIntensity = 1;
                }
            } else {
                piston.material.emissive.setHex(0x475569);
                piston.material.emissiveIntensity = 0.1;
                
                if (this.sparkPlugs[i]) {
                    this.sparkPlugs[i].material.emissiveIntensity = 0;
                }
            }
        });
    }
    
    /**
     * 获取场景提示
     */
    getTips() {
        return '🚗 <b>V6 赛博引擎</b><br>点击气缸体、活塞等部件查看详细说明。观察活塞的点火顺序和等离子燃烧效果。';
    }
}

