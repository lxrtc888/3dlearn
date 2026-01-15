/**
 * SceneManager - 负责 Three.js 场景的生命周期管理
 * v3.0 - Blender风格专业UI
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
        
        // 当前悬停对象
        this.hoveredObject = null;
        
        // Gizmo相关
        this.gizmoRenderer = null;
        this.gizmoScene = null;
        this.gizmoCamera = null;

        // 绑定事件
        this.resizeHandler = this.onResize.bind(this);
        this.clickHandler = this.onClick.bind(this);
        this.hoverHandler = this.onHover.bind(this);
        this.mouseLeaveHandler = this.onMouseLeave.bind(this);

        window.addEventListener('resize', this.resizeHandler);
        this.container.addEventListener('click', this.clickHandler);
        this.container.addEventListener('mousemove', this.hoverHandler);
        this.container.addEventListener('mouseleave', this.mouseLeaveHandler);
        
        // 创建提示框和Blender UI
        this.createTooltip();
        this.createBlenderUI();
    }

    /**
     * 创建悬停提示框元素
     */
    createTooltip() {
        if (document.getElementById('hover-tooltip')) return;
        
        const tooltip = document.createElement('div');
        tooltip.id = 'hover-tooltip';
        tooltip.innerHTML = `
            <div class="tooltip-title"></div>
            <div class="tooltip-desc"></div>
        `;
        document.body.appendChild(tooltip);
    }

    /**
     * 创建Blender风格UI
     */
    createBlenderUI() {
        const viewScene = document.getElementById('view-scene');
        if (!viewScene || viewScene.querySelector('.viewport-header')) return;
        
        // 顶部信息栏
        const header = document.createElement('div');
        header.className = 'viewport-header';
        header.innerHTML = `
            <div class="view-mode">
                <i class="fas fa-cube"></i>
                <span>Object Mode</span>
            </div>
            <div class="view-info" id="view-angle-info">透视视图</div>
            <div class="scene-stats">
                <span><i class="fas fa-cube"></i> <span id="stat-objects">0</span> 对象</span>
                <span><i class="fas fa-dot-circle"></i> <span id="stat-vertices">0</span> 顶点</span>
                <span><i class="fas fa-clock"></i> <span id="stat-fps">60</span> FPS</span>
            </div>
        `;
        viewScene.appendChild(header);
        
        // 视角快捷按钮
        const viewPresets = document.createElement('div');
        viewPresets.className = 'view-presets';
        viewPresets.innerHTML = `
            <button class="view-preset-btn" data-view="front">前</button>
            <button class="view-preset-btn" data-view="back">后</button>
            <button class="view-preset-btn" data-view="left">左</button>
            <button class="view-preset-btn" data-view="right">右</button>
            <button class="view-preset-btn" data-view="top">顶</button>
            <button class="view-preset-btn active" data-view="persp">透视</button>
        `;
        viewScene.appendChild(viewPresets);
        
        // 绑定视角按钮事件
        viewPresets.querySelectorAll('.view-preset-btn').forEach(btn => {
            btn.onclick = () => this.setViewPreset(btn.dataset.view);
        });
        
        // 右侧工具栏
        const tools = document.createElement('div');
        tools.className = 'viewport-tools';
        tools.innerHTML = `
            <button class="tool-btn active" title="选择" data-tool="select"><i class="fas fa-mouse-pointer"></i></button>
            <button class="tool-btn" title="移动" data-tool="move"><i class="fas fa-arrows-alt"></i></button>
            <button class="tool-btn" title="旋转" data-tool="rotate"><i class="fas fa-sync-alt"></i></button>
            <button class="tool-btn" title="缩放" data-tool="scale"><i class="fas fa-expand-arrows-alt"></i></button>
            <div class="tool-divider"></div>
            <button class="tool-btn" title="重置视角" id="tool-reset-view"><i class="fas fa-home"></i></button>
            <button class="tool-btn" title="聚焦选中" id="tool-focus"><i class="fas fa-crosshairs"></i></button>
            <div class="tool-divider"></div>
            <button class="tool-btn" title="线框模式" id="tool-wireframe"><i class="fas fa-border-all"></i></button>
            <button class="tool-btn" title="网格开关" id="tool-grid"><i class="fas fa-th"></i></button>
        `;
        viewScene.appendChild(tools);
        
        // 绑定工具栏事件
        document.getElementById('tool-reset-view').onclick = () => this.resetToDefaultView();
        document.getElementById('tool-wireframe').onclick = (e) => this.toggleWireframe(e.currentTarget);
        document.getElementById('tool-grid').onclick = (e) => this.toggleGrid(e.currentTarget);
        
        // 坐标轴指示器容器
        const gizmo = document.createElement('div');
        gizmo.className = 'axis-gizmo';
        gizmo.id = 'axis-gizmo';
        viewScene.appendChild(gizmo);
        
        // 底部状态栏
        const footer = document.createElement('div');
        footer.className = 'viewport-footer';
        footer.innerHTML = `
            <div class="camera-info">
                <span><i class="fas fa-video"></i> Cam: <span id="cam-pos">0, 0, 0</span></span>
                <span><i class="fas fa-bullseye"></i> Target: <span id="cam-target">0, 0, 0</span></span>
            </div>
            <div class="hint">
                <i class="fas fa-mouse"></i> 左键旋转 · 滚轮缩放 · 右键平移
            </div>
        `;
        viewScene.appendChild(footer);
        
        // 初始化坐标轴指示器
        this.initGizmo();
    }
    
    /**
     * 初始化坐标轴指示器
     */
    initGizmo() {
        const container = document.getElementById('axis-gizmo');
        if (!container) return;
        
        // 创建Gizmo渲染器
        this.gizmoRenderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
        this.gizmoRenderer.setSize(80, 80);
        this.gizmoRenderer.setClearColor(0x000000, 0);
        container.appendChild(this.gizmoRenderer.domElement);
        
        // 创建Gizmo场景
        this.gizmoScene = new THREE.Scene();
        this.gizmoCamera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
        this.gizmoCamera.position.set(0, 0, 5);
        
        // 创建坐标轴
        const axisLength = 1.5;
        const axes = new THREE.Group();
        
        // X轴 (红色)
        const xMat = new THREE.MeshBasicMaterial({ color: 0xff4444 });
        const xAxis = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, axisLength, 8), xMat);
        xAxis.rotation.z = -Math.PI / 2;
        xAxis.position.x = axisLength / 2;
        axes.add(xAxis);
        
        const xCone = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.3, 8), xMat);
        xCone.rotation.z = -Math.PI / 2;
        xCone.position.x = axisLength;
        axes.add(xCone);
        
        // Y轴 (绿色)
        const yMat = new THREE.MeshBasicMaterial({ color: 0x44ff44 });
        const yAxis = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, axisLength, 8), yMat);
        yAxis.position.y = axisLength / 2;
        axes.add(yAxis);
        
        const yCone = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.3, 8), yMat);
        yCone.position.y = axisLength;
        axes.add(yCone);
        
        // Z轴 (蓝色)
        const zMat = new THREE.MeshBasicMaterial({ color: 0x4444ff });
        const zAxis = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, axisLength, 8), zMat);
        zAxis.rotation.x = Math.PI / 2;
        zAxis.position.z = axisLength / 2;
        axes.add(zAxis);
        
        const zCone = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.3, 8), zMat);
        zCone.rotation.x = Math.PI / 2;
        zCone.position.z = axisLength;
        axes.add(zCone);
        
        // 原点球
        const centerMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
        const center = new THREE.Mesh(new THREE.SphereGeometry(0.1, 16, 16), centerMat);
        axes.add(center);
        
        this.gizmoAxes = axes;
        this.gizmoScene.add(axes);
    }
    
    /**
     * 更新坐标轴指示器
     */
    updateGizmo() {
        if (!this.gizmoRenderer || !this.camera || !this.gizmoAxes) return;
        
        // 同步主相机的旋转
        this.gizmoAxes.quaternion.copy(this.camera.quaternion).invert();
        
        this.gizmoRenderer.render(this.gizmoScene, this.gizmoCamera);
    }
    
    /**
     * 更新状态栏信息
     */
    updateViewportInfo() {
        if (!this.camera) return;
        
        // 相机位置
        const camPos = document.getElementById('cam-pos');
        if (camPos) {
            camPos.textContent = `${this.camera.position.x.toFixed(1)}, ${this.camera.position.y.toFixed(1)}, ${this.camera.position.z.toFixed(1)}`;
        }
        
        // 目标位置
        const camTarget = document.getElementById('cam-target');
        if (camTarget && this.controls) {
            const t = this.controls.target;
            camTarget.textContent = `${t.x.toFixed(1)}, ${t.y.toFixed(1)}, ${t.z.toFixed(1)}`;
        }
        
        // FPS
        const fpsEl = document.getElementById('stat-fps');
        if (fpsEl) {
            const delta = this.clock.getDelta();
            const fps = delta > 0 ? Math.round(1 / delta) : 60;
            fpsEl.textContent = Math.min(fps, 120);
        }
    }
    
    /**
     * 设置预设视角
     */
    setViewPreset(view) {
        if (!this.camera || !this.controls) return;
        
        const presets = {
            front: { pos: [0, 0, 30], target: [0, 0, 0] },
            back: { pos: [0, 0, -30], target: [0, 0, 0] },
            left: { pos: [-30, 0, 0], target: [0, 0, 0] },
            right: { pos: [30, 0, 0], target: [0, 0, 0] },
            top: { pos: [0, 30, 0], target: [0, 0, 0] },
            persp: { pos: [15, 12, 25], target: [0, 0, 0] }
        };
        
        const preset = presets[view];
        if (!preset) return;
        
        // 更新按钮状态
        document.querySelectorAll('.view-preset-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.view === view);
        });
        
        // 更新视角信息
        const viewInfo = document.getElementById('view-angle-info');
        const viewNames = { front: '前视图', back: '后视图', left: '左视图', right: '右视图', top: '顶视图', persp: '透视视图' };
        if (viewInfo) viewInfo.textContent = viewNames[view];
        
        // 动画过渡
        gsap.to(this.camera.position, {
            x: preset.pos[0], y: preset.pos[1], z: preset.pos[2],
            duration: 0.6,
            ease: 'power2.out'
        });
        gsap.to(this.controls.target, {
            x: preset.target[0], y: preset.target[1], z: preset.target[2],
            duration: 0.6,
            ease: 'power2.out'
        });
    }
    
    resetToDefaultView() {
        this.setViewPreset('persp');
    }
    
    toggleWireframe(btn) {
        btn.classList.toggle('active');
        // 切换线框模式逻辑
    }
    
    toggleGrid(btn) {
        btn.classList.toggle('active');
        // 切换网格显示逻辑
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
        
        // 创建相机
        const aspect = this.container.clientWidth / this.container.clientHeight;
        this.camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 1000);
        this.camera.position.set(0, 10, 30);

        // 控制器 - 确保所有控制功能启用
        this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.08;
        this.controls.enableZoom = true;
        this.controls.enableRotate = true;
        this.controls.enablePan = true;
        this.controls.minDistance = 5;
        this.controls.maxDistance = 100;
        this.controls.maxPolarAngle = Math.PI * 0.9;

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
     */
    loadScene(SceneClass) {
        this.clearScene();
        
        if (!this.renderer) {
            this.init();
        } else {
            // 重置场景
            this.scene = new THREE.Scene();
            this.setupDefaultLights();
            this.camera.position.set(0, 10, 30);
            this.camera.lookAt(0, 0, 0);
            
            // 确保controls正确更新
            if (this.controls) {
                this.controls.target.set(0, 0, 0);
                this.controls.update();
            }
        }

        try {
            this.currentSceneInstance = new SceneClass(this.scene, this.camera, this.renderer);
            
            if (this.currentSceneInstance.init) {
                this.currentSceneInstance.init();
            }

            if (this.currentSceneInstance.getInteractables) {
                this.interactableObjects = this.currentSceneInstance.getInteractables();
            }
            
            // 显示初始教学引导
            this.showInitialGuides();
            
            console.log('Scene loaded successfully:', SceneClass.name || 'Unknown');
        } catch (e) {
            console.error('Failed to load scene:', e);
        }
    }

    /**
     * 清理当前场景
     */
    clearScene() {
        if (this.currentSceneInstance && this.currentSceneInstance.dispose) {
            this.currentSceneInstance.dispose();
        }

        this.labels.forEach(l => {
            if (l.container && l.container.parentNode) {
                l.container.parentNode.removeChild(l.container);
            }
        });
        this.labels = [];
        this.interactableObjects = [];
        this.currentSceneInstance = null;
        this.hoveredObject = null;

        this.hideTooltip();

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

        if (this.currentSceneInstance && this.currentSceneInstance.animate) {
            this.currentSceneInstance.animate(time, delta);
        }

        if (this.renderer && this.scene && this.camera) {
            this.renderer.render(this.scene, this.camera);
        }

        this.updateLabels();
        
        // 更新Blender UI
        this.updateGizmo();
        
        // 每30帧更新一次状态栏（优化性能）
        if (Math.floor(time * 60) % 30 === 0) {
            this.updateViewportInfo();
        }
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
        const tempV = new THREE.Vector3();

        this.labels.forEach(l => {
            tempV.copy(l.position).project(this.camera);
            
            if (tempV.z > 1 || Math.abs(tempV.x) > 1.1 || Math.abs(tempV.y) > 1.1) {
                l.container.style.opacity = 0;
                return;
            }

            l.container.style.opacity = 1;
            l.container.style.left = (tempV.x * 0.5 + 0.5) * w + 'px';
            l.container.style.top = (-(tempV.y * 0.5) + 0.5) * h + 'px';
            
            const labelHeight = l.element.offsetHeight;
            l.line.style.height = (labelHeight + 20) + 'px';
            l.line.style.top = '0px';
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

        const rect = this.container.getBoundingClientRect();
        this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        this.raycaster.setFromCamera(this.mouse, this.camera);
        const intersects = this.raycaster.intersectObjects(this.interactableObjects, true);

        if (intersects.length > 0) {
            let target = intersects[0].object;
            while(target) {
                if (target.userData && target.userData.onClick) {
                    target.userData.onClick(target);
                    break;
                }
                target = target.parent;
            }
        } else {
            if (this.currentSceneInstance.onBackgroundClick) {
                this.currentSceneInstance.onBackgroundClick();
            }
        }
    }
    
    /**
     * 悬停事件 - 显示提示框
     */
    onHover(event) {
        if (!this.currentSceneInstance || this.interactableObjects.length === 0) {
            this.hideTooltip();
            return;
        }
         
        const rect = this.container.getBoundingClientRect();
        this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        
        this.raycaster.setFromCamera(this.mouse, this.camera);
        const intersects = this.raycaster.intersectObjects(this.interactableObjects, true);
        
        if (intersects.length > 0) {
            let target = intersects[0].object;
            // 向上查找有 hoverTitle 或 onClick 的对象
            while(target) {
                if (target.userData && (target.userData.hoverTitle || target.userData.onClick)) {
                    // 检查是否是新对象
                    if (this.hoveredObject !== target) {
                        this.hoveredObject = target;
                    }
                    
                    // 显示提示框
                    if (target.userData.hoverTitle) {
                        this.showTooltip(event, target.userData);
                    }
                    
                    this.container.style.cursor = 'pointer';
                    return;
                }
                target = target.parent;
            }
        }
        
        // 没有悬停对象
        this.hoveredObject = null;
        this.hideTooltip();
        this.container.style.cursor = 'default';
    }

    /**
     * 鼠标离开容器
     */
    onMouseLeave() {
        this.hideTooltip();
        this.hoveredObject = null;
    }

    /**
     * 显示悬停提示框
     */
    showTooltip(event, data) {
        const tooltip = document.getElementById('hover-tooltip');
        if (!tooltip) return;
        
        const titleEl = tooltip.querySelector('.tooltip-title');
        const descEl = tooltip.querySelector('.tooltip-desc');
        
        titleEl.innerHTML = `
            <i class="fas ${data.hoverIcon || 'fa-info-circle'}"></i>
            <span>${data.hoverTitle}</span>
        `;
        descEl.textContent = data.hoverDesc || '';
        
        // 计算位置（避免超出屏幕）
        let x = event.clientX + 15;
        let y = event.clientY + 15;
        
        const tooltipRect = tooltip.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        
        if (x + tooltipRect.width > viewportWidth - 20) {
            x = event.clientX - tooltipRect.width - 15;
        }
        if (y + tooltipRect.height > viewportHeight - 20) {
            y = event.clientY - tooltipRect.height - 15;
        }
        
        tooltip.style.left = x + 'px';
        tooltip.style.top = y + 'px';
        tooltip.classList.add('visible');
    }

    /**
     * 隐藏悬停提示框
     */
    hideTooltip() {
        const tooltip = document.getElementById('hover-tooltip');
        if (tooltip) {
            tooltip.classList.remove('visible');
        }
    }

    /**
     * 显示教学引导提示
     */
    showGuide(message, duration = 3500) {
        const guide = document.createElement('div');
        guide.className = 'scene-guide-message';
        guide.innerHTML = message;
        this.container.appendChild(guide);
        
        setTimeout(() => guide.classList.add('visible'), 100);
        setTimeout(() => {
            guide.classList.remove('visible');
            setTimeout(() => guide.remove(), 300);
        }, duration);
    }

    /**
     * 显示初始教学引导
     */
    showInitialGuides() {
        setTimeout(() => {
            this.showGuide('🖱️ 拖动旋转 · 滚轮缩放 · 右键平移');
        }, 1200);
        setTimeout(() => {
            this.showGuide('👆 点击蓝色部件查看详细说明');
        }, 5000);
    }
}
