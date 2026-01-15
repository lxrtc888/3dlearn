/**
 * SceneManager - 负责 Three.js 场景的生命周期管理
 */
class SceneManager {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.animationId = null;
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        
        // 场景对象引用
        this.interactableObjects = [];
        this.labels = [];
        this.clock = new THREE.Clock();
        
        // 当前活跃的场景实例
        this.currentSceneInstance = null;

        // 绑定事件
        this.resizeHandler = this.onResize.bind(this);
        this.clickHandler = this.onClick.bind(this);
        this.hoverHandler = this.onHover.bind(this);

        window.addEventListener('resize', this.resizeHandler);
        // 初始化时监听
        this.container.addEventListener('click', this.clickHandler);
        this.container.addEventListener('mousemove', this.hoverHandler);
    }

    /**
     * 初始化 Three.js 基础环境
     */
    init() {
        // 创建渲染器
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.container.appendChild(this.renderer.domElement);

        // 创建空场景
        this.scene = new THREE.Scene();
        
        // 创建相机 (默认位置，具体场景会覆盖)
        const aspect = this.container.clientWidth / this.container.clientHeight;
        this.camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 1000);
        this.camera.position.set(0, 5, 20);

        // 控制器
        this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;

        // 默认灯光
        this.setupDefaultLights();

        // 启动循环
        this.animate();
    }

    setupDefaultLights() {
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
        this.scene.add(ambientLight);
        
        const dirLight = new THREE.DirectionalLight(0xffffff, 1);
        dirLight.position.set(10, 20, 10);
        dirLight.castShadow = true;
        dirLight.shadow.mapSize.width = 2048;
        dirLight.shadow.mapSize.height = 2048;
        this.scene.add(dirLight);
    }

    /**
     * 加载特定场景模块
     * @param {Object} SceneClass - 场景类定义
     */
    loadScene(SceneClass) {
        this.clearScene();
        
        // 初始化基础环境 (如果被销毁的话)
        if (!this.renderer) this.init();
        else {
            // 重置相机和灯光
            this.scene = new THREE.Scene();
            this.setupDefaultLights();
            this.camera.position.set(0, 5, 20);
            this.controls.reset();
        }

        // 实例化场景逻辑
        this.currentSceneInstance = new SceneClass(this.scene, this.camera, this.renderer);
        
        // 调用场景的初始化方法
        if (this.currentSceneInstance.init) {
            this.currentSceneInstance.init();
        }

        // 获取可交互对象
        if (this.currentSceneInstance.getInteractables) {
            this.interactableObjects = this.currentSceneInstance.getInteractables();
        }
    }

    /**
     * 清理当前场景
     */
    clearScene() {
        // 停止动画
        if (this.currentSceneInstance && this.currentSceneInstance.dispose) {
            this.currentSceneInstance.dispose();
        }

        // 清除标签
        this.labels.forEach(l => {
            if (l.container && l.container.parentNode) {
                l.container.parentNode.removeChild(l.container);
            }
        });
        this.labels = [];
        this.interactableObjects = [];
        this.currentSceneInstance = null;

        // 隐藏UI面板
        const infoPanel = document.getElementById('info-panel');
        if (infoPanel) infoPanel.classList.remove('visible');
        
        const controlsDiv = document.getElementById('scene-controls');
        if (controlsDiv) {
            controlsDiv.style.display = 'none';
            controlsDiv.innerHTML = '';
        }
    }

    /**
     * 动画循环
     */
    animate() {
        this.animationId = requestAnimationFrame(this.animate.bind(this));
        
        const time = this.clock.getElapsedTime();
        const delta = this.clock.getDelta();

        if (this.controls) this.controls.update();

        // 更新当前场景逻辑
        if (this.currentSceneInstance && this.currentSceneInstance.animate) {
            this.currentSceneInstance.animate(time, delta);
        }

        if (this.renderer && this.scene && this.camera) {
            this.renderer.render(this.scene, this.camera);
        }

        // 更新标签位置
        this.updateLabels();
    }

    /**
     * 创建3D标签
     */
    createLabel(text, position, icon = 'info-circle') {
        const container = document.createElement('div'); 
        container.className = 'scene-label-container';
        
        const div = document.createElement('div'); 
        div.className = 'scene-label'; 
        div.innerHTML = `<i class="fas fa-${icon}"></i>${text}`; 
        container.appendChild(div);
        
        const line = document.createElement('div'); 
        line.className = 'label-line'; 
        container.appendChild(line);
        
        this.container.appendChild(container);
        
        this.labels.push({ 
            container, 
            line, 
            position: position.clone(), 
            element: div 
        });

        return div;
    }

    updateLabels() {
        if (!this.camera || this.labels.length === 0) return;
        
        const w = this.container.clientWidth;
        const h = this.container.clientHeight;

        // 临时变量复用
        const tempV = new THREE.Vector3();

        this.labels.forEach(l => {
            tempV.copy(l.position).project(this.camera);
            
            // 检查是否在视野内
            if (tempV.z > 1 || Math.abs(tempV.x) > 1.1 || Math.abs(tempV.y) > 1.1) {
                l.container.style.opacity = 0;
                return;
            }

            l.container.style.opacity = 1;
            l.container.style.left = (tempV.x * 0.5 + 0.5) * w + 'px';
            l.container.style.top = (-(tempV.y * 0.5) + 0.5) * h + 'px';
            
            // 动态调整线长
            const labelHeight = l.element.offsetHeight;
            l.line.style.height = (labelHeight + 20) + 'px';
            l.line.style.top = '0px'; // 线条从原点向上延伸到标签
        });
    }

    onResize() {
        if (!this.renderer || !this.camera) return;
        const w = this.container.clientWidth;
        const h = this.container.clientHeight;
        this.renderer.setSize(w, h);
        this.camera.aspect = w / h;
        this.camera.updateProjectionMatrix();
    }

    onClick(event) {
        if (!this.currentSceneInstance || this.interactableObjects.length === 0) return;

        // 计算鼠标坐标 (归一化)
        const rect = this.container.getBoundingClientRect();
        this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        this.raycaster.setFromCamera(this.mouse, this.camera);
        const intersects = this.raycaster.intersectObjects(this.interactableObjects, true); // 递归检测

        if (intersects.length > 0) {
            // 找到第一个有点击处理的对象
            let target = intersects[0].object;
            // 向上查找直到找到有userData.onClick的对象，或者到达根
            while(target) {
                if (target.userData && target.userData.onClick) {
                    target.userData.onClick(target);
                    break;
                }
                target = target.parent;
            }
        } else {
            // 点击空白处
            if (this.currentSceneInstance.onBackgroundClick) {
                this.currentSceneInstance.onBackgroundClick();
            }
        }
    }
    
    onHover(event) {
         if (!this.currentSceneInstance || this.interactableObjects.length === 0) return;
         
        const rect = this.container.getBoundingClientRect();
        this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        
        this.raycaster.setFromCamera(this.mouse, this.camera);
        const intersects = this.raycaster.intersectObjects(this.interactableObjects, true);
        
        let hovered = false;
        if (intersects.length > 0) {
             let target = intersects[0].object;
             while(target) {
                if (target.userData && target.userData.onClick) {
                    hovered = true;
                    break;
                }
                target = target.parent;
            }
        }
        
        this.container.style.cursor = hovered ? 'pointer' : 'default';
    }
}
