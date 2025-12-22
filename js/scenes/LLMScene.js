/**
 * 大语言模型(LLM)注意力网络场景
 * 交互式展示Transformer的注意力机制
 */
import { BaseScene } from './BaseScene.js';

export default class LLMScene extends BaseScene {
    constructor(container, camera, scene, renderer, controls) {
        super(container, camera, scene, renderer, controls);
        
        this.llmGroup = null;
        this.tokenNodes = [];
        this.attentionLines = [];
        this.selectedToken = null;
        
        // 示例句子
        this.sentence = [
            "The", "animal", "didn't", "cross", 
            "the", "street", "because", "it", 
            "was", "too", "tired", "."
        ];
        
        // Token颜色
        this.colors = [
            0x3b82f6, 0x10b981, 0x8b5cf6, 0xf59e0b,
            0xef4444, 0xec4899, 0x06b6d4, 0x3b82f6,
            0x10b981, 0xf59e0b, 0xef4444, 0x64748b
        ];
        
        // 注意力关系映射 (模拟真实的注意力分数)
        this.attentionMap = {
            7: [ // "it"
                { target: 1, strength: 0.85, label: 'animal' },   // 高度关注 "animal"
                { target: 5, strength: 0.45, label: 'street' },   // 中度关注 "street"
                { target: 10, strength: 0.35, label: 'tired' }    // 关注 "tired"
            ],
            1: [ // "animal"
                { target: 7, strength: 0.65, label: 'it' },
                { target: 3, strength: 0.40, label: 'cross' }
            ],
            10: [ // "tired"
                { target: 7, strength: 0.75, label: 'it' },
                { target: 1, strength: 0.55, label: 'animal' }
            ],
            6: [ // "because"
                { target: 3, strength: 0.60, label: 'cross' },
                { target: 7, strength: 0.50, label: 'it' }
            ]
        };
    }
    
    async setup() {
        // 设置相机
        this.camera.position.set(0, 0, 40);
        this.controls.target.set(0, 0, 0);
        this.controls.enableZoom = true;
        
        // 光照
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);
        this.objects.push(ambientLight);
        
        // 多个点光源营造氛围
        const lights = [
            { color: 0x3b82f6, pos: [10, 10, 10] },
            { color: 0x10b981, pos: [-10, 10, -10] },
            { color: 0x8b5cf6, pos: [0, -10, 5] }
        ];
        
        lights.forEach(lightData => {
            const light = new THREE.PointLight(lightData.color, 0.5, 50);
            light.position.set(...lightData.pos);
            this.scene.add(light);
            this.objects.push(light);
        });
        
        // 创建网络
        this.createNetwork();
        
        // 添加星空背景
        this.createStarfield();
    }
    
    /**
     * 创建Token网络
     */
    createNetwork() {
        this.llmGroup = new THREE.Group();
        this.scene.add(this.llmGroup);
        this.objects.push(this.llmGroup);
        
        // 创建Token节点
        this.createTokenNodes();
        
        // 创建注意力连接线
        this.createAttentionLines();
        
        // 创建中心说明面板
        this.createInfoPanel();
    }
    
    /**
     * 创建Token节点
     */
    createTokenNodes() {
        const radius = 15;
        
        this.sentence.forEach((word, i) => {
            // 环形排列
            const angle = (i / this.sentence.length) * Math.PI * 2 - Math.PI / 2;
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;
            const z = 0;
            
            // 创建节点组
            const nodeGroup = new THREE.Group();
            nodeGroup.position.set(x, y, z);
            
            // 主球体
            const geometry = new THREE.SphereGeometry(1.2, 32, 32);
            const material = new THREE.MeshStandardMaterial({
                color: this.colors[i],
                emissive: this.colors[i],
                emissiveIntensity: 0.3,
                roughness: 0.3,
                metalness: 0.7
            });
            
            const sphere = new THREE.Mesh(geometry, material);
            nodeGroup.add(sphere);
            this.objects.push(sphere);
            
            // 外层光环
            const ringGeo = new THREE.TorusGeometry(1.5, 0.1, 16, 32);
            const ringMat = new THREE.MeshBasicMaterial({
                color: this.colors[i],
                transparent: true,
                opacity: 0.4
            });
            const ring = new THREE.Mesh(ringGeo, ringMat);
            ring.rotation.x = Math.PI / 2;
            nodeGroup.add(ring);
            this.objects.push(ring);
            
            // 用户数据
            sphere.userData = {
                id: i,
                word: word,
                baseColor: this.colors[i],
                group: nodeGroup,
                ring: ring
            };
            
            // 点击事件
            sphere.userData.onClick = (obj) => {
                this.highlightTokenAndAttention(obj);
            };
            
            this.llmGroup.add(nodeGroup);
            this.tokenNodes.push(sphere);
            this.interactableObjects.push(sphere);
            
            // 创建文字标签
            this.createTokenLabel(word, i, nodeGroup);
        });
    }
    
    /**
     * 创建Token文字标签
     */
    createTokenLabel(word, index, nodeGroup) {
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 128;
        const ctx = canvas.getContext('2d');
        
        // 背景
        ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
        ctx.roundRect(10, 10, 236, 108, 10);
        ctx.fill();
        
        // 文字
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 48px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(word, 128, 52);
        
        // 索引
        ctx.fillStyle = '#94a3b8';
        ctx.font = '24px Arial';
        ctx.fillText(`#${index}`, 128, 90);
        
        const texture = new THREE.CanvasTexture(canvas);
        const spriteMaterial = new THREE.SpriteMaterial({
            map: texture,
            transparent: true
        });
        
        const sprite = new THREE.Sprite(spriteMaterial);
        sprite.scale.set(4, 2, 1);
        sprite.position.y = 2.5;
        nodeGroup.add(sprite);
        this.objects.push(sprite);
    }
    
    /**
     * 创建注意力连接线
     */
    createAttentionLines() {
        Object.keys(this.attentionMap).forEach(sourceId => {
            const sourceIdx = parseInt(sourceId);
            const sourceNode = this.tokenNodes[sourceIdx];
            const targets = this.attentionMap[sourceId];
            
            targets.forEach(rel => {
                const targetNode = this.tokenNodes[rel.target];
                
                // 使用贝塞尔曲线创建优雅的连接
                const start = sourceNode.userData.group.position.clone();
                const end = targetNode.userData.group.position.clone();
                const mid = start.clone().add(end).multiplyScalar(0.5);
                
                // 根据强度调整曲线高度
                mid.z += 8 * rel.strength;
                
                const curve = new THREE.QuadraticBezierCurve3(start, mid, end);
                const points = curve.getPoints(50);
                
                // 创建管状几何体
                const tubeGeometry = new THREE.TubeGeometry(
                    new THREE.CatmullRomCurve3(points),
                    50, // 段数
                    0.1 * rel.strength, // 半径随强度变化
                    8, // 径向段数
                    false
                );
                
                const tubeMaterial = new THREE.MeshBasicMaterial({
                    color: 0xffffff,
                    transparent: true,
                    opacity: 0,
                    emissive: 0x60a5fa,
                    emissiveIntensity: 0
                });
                
                const tube = new THREE.Mesh(tubeGeometry, tubeMaterial);
                tube.visible = false;
                tube.userData = {
                    source: sourceIdx,
                    target: rel.target,
                    strength: rel.strength,
                    label: rel.label
                };
                
                this.llmGroup.add(tube);
                this.attentionLines.push(tube);
                this.objects.push(tube);
            });
        });
    }
    
    /**
     * 创建中心信息面板
     */
    createInfoPanel() {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');
        
        // 背景
        ctx.fillStyle = 'rgba(15, 23, 42, 0.95)';
        ctx.fillRect(0, 0, 512, 256);
        
        // 标题
        ctx.fillStyle = '#3b82f6';
        ctx.font = 'bold 36px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Attention Mechanism', 256, 80);
        
        // 说明
        ctx.fillStyle = '#94a3b8';
        ctx.font = '24px Arial';
        ctx.fillText('点击 Token 查看注意力连接', 256, 140);
        
        ctx.fillStyle = '#64748b';
        ctx.font = '20px Arial';
        ctx.fillText('Click tokens to see attention weights', 256, 180);
        
        const texture = new THREE.CanvasTexture(canvas);
        const material = new THREE.SpriteMaterial({
            map: texture,
            transparent: true
        });
        
        const sprite = new THREE.Sprite(material);
        sprite.scale.set(10, 5, 1);
        sprite.position.set(0, 0, -5);
        this.llmGroup.add(sprite);
        this.objects.push(sprite);
    }
    
    /**
     * 高亮Token和注意力连接
     */
    highlightTokenAndAttention(clickedNode) {
        this.selectedToken = clickedNode;
        const selectedId = clickedNode.userData.id;
        const word = clickedNode.userData.word;
        
        // 1. 重置所有节点
        this.tokenNodes.forEach(node => {
            node.material.emissiveIntensity = 0.3;
            node.scale.set(1, 1, 1);
            node.userData.ring.material.opacity = 0.4;
        });
        
        // 隐藏所有连接线
        this.attentionLines.forEach(line => {
            line.visible = false;
            line.material.opacity = 0;
        });
        
        // 2. 高亮选中的节点
        clickedNode.material.emissiveIntensity = 1;
        gsap.to(clickedNode.scale, {
            x: 1.5, y: 1.5, z: 1.5,
            duration: 0.3,
            ease: 'back.out(1.7)'
        });
        clickedNode.userData.ring.material.opacity = 0.8;
        
        // 3. 显示相关的注意力线条
        const connections = [];
        this.attentionLines.forEach(line => {
            if (line.userData.source === selectedId) {
                line.visible = true;
                
                // 动画显示
                gsap.to(line.material, {
                    opacity: line.userData.strength * 0.8,
                    emissiveIntensity: line.userData.strength,
                    duration: 0.5
                });
                
                // 高亮目标节点
                const targetNode = this.tokenNodes[line.userData.target];
                targetNode.material.emissiveIntensity = 0.7;
                gsap.to(targetNode.scale, {
                    x: 1.2, y: 1.2, z: 1.2,
                    duration: 0.3
                });
                targetNode.userData.ring.material.opacity = 0.6;
                
                connections.push({
                    target: line.userData.label,
                    strength: (line.userData.strength * 100).toFixed(0)
                });
            }
        });
        
        // 4. 显示信息弹框
        if (connections.length > 0) {
            const connectionsHtml = connections.map(conn => 
                `<li><span class="text-blue-400">${conn.target}</span>: <strong>${conn.strength}%</strong></li>`
            ).join('');
            
            this.showInfoModal(
                `Token: "${word}"`,
                `
                <p class="text-gray-300 mb-3">这个Token正在"关注"以下词汇:</p>
                <ul class="list-disc list-inside text-gray-300 mb-4 space-y-2">
                    ${connectionsHtml}
                </ul>
                <div class="bg-blue-900/30 p-3 rounded-lg border border-blue-500/30">
                    <p class="text-blue-300 text-sm">💡 <strong>自注意力机制</strong>允许模型理解词与词之间的关系,从而捕捉上下文语义。</p>
                </div>
                <p class="text-gray-400 text-sm mt-3">线条粗细和亮度表示注意力权重大小</p>
                `,
                'fa-project-diagram'
            );
        } else {
            // 没有连接的Token
            this.showInfoModal(
                `Token: "${word}"`,
                `
                <p class="text-gray-300 mb-3">这个Token在当前示例中没有显示注意力连接。</p>
                <p class="text-gray-400 text-sm">在真实的Transformer中,每个Token都会与句子中的所有其他Token计算注意力分数。</p>
                `,
                'fa-circle'
            );
        }
    }
    
    /**
     * 重置视图
     */
    resetView() {
        this.selectedToken = null;
        
        this.tokenNodes.forEach(node => {
            gsap.to(node.scale, { x: 1, y: 1, z: 1, duration: 0.3 });
            node.material.emissiveIntensity = 0.3;
            node.userData.ring.material.opacity = 0.4;
        });
        
        this.attentionLines.forEach(line => {
            line.visible = false;
            line.material.opacity = 0;
        });
    }
    
    /**
     * 创建星空背景
     */
    createStarfield() {
        const starsGeometry = new THREE.BufferGeometry();
        const starCount = 1000;
        const positions = new Float32Array(starCount * 3);
        
        for (let i = 0; i < starCount * 3; i++) {
            positions[i] = (Math.random() - 0.5) * 200;
        }
        
        starsGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        
        const starsMaterial = new THREE.PointsMaterial({
            color: 0xffffff,
            size: 0.3,
            transparent: true,
            opacity: 0.6
        });
        
        const stars = new THREE.Points(starsGeometry, starsMaterial);
        this.scene.add(stars);
        this.objects.push(stars);
    }
    
    /**
     * 点击处理 - 重写以支持空白区域重置
     */
    handleClick(mouse, raycaster) {
        raycaster.setFromCamera(mouse, this.camera);
        const intersects = raycaster.intersectObjects(this.interactableObjects);
        
        if (intersects.length > 0) {
            const target = intersects[0].object;
            if (target.userData.onClick) {
                target.userData.onClick(target);
            }
        } else {
            // 点击空白处重置
            this.resetView();
        }
    }
    
    /**
     * 动画更新
     */
    animate(time) {
        // 整体网络缓慢旋转
        this.llmGroup.rotation.z = Math.sin(time * 0.1) * 0.05;
        this.llmGroup.rotation.y = Math.cos(time * 0.08) * 0.05;
        
        // Token节点轻微浮动
        this.tokenNodes.forEach((node, i) => {
            if (node !== this.selectedToken) {
                const group = node.userData.group;
                group.position.z = Math.sin(time * 2 + i) * 0.5;
            }
            
            // 光环旋转
            node.userData.ring.rotation.z += 0.01;
        });
        
        // 选中Token脉冲效果
        if (this.selectedToken) {
            this.selectedToken.material.emissiveIntensity = 0.8 + Math.sin(time * 4) * 0.2;
        }
        
        // 连接线流动效果
        this.attentionLines.forEach(line => {
            if (line.visible) {
                // 可以添加流动光效
            }
        });
    }
    
    /**
     * 获取场景提示
     */
    getTips() {
        return '🧠 <b>LLM 注意力网络</b><br>点击任意 Token 球体查看它与其他词的注意力关系。点击空白处重置视图。';
    }
}

