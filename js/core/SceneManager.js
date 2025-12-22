/**
 * 场景管理器
 * 负责场景的加载、切换、动画循环和资源管理
 */
export class SceneManager {
    constructor(container) {
        this.container = container;
        this.currentScene = null;
        this.sceneCache = {};
        
        // Three.js 核心对象
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.raycaster = null;
        this.mouse = new THREE.Vector2();
        
        // 动画
        this.animationId = null;
        this.clock = new THREE.Clock();
        
        // 事件处理器引用
        this.resizeHandler = null;
        this.clickHandler = null;
        
        this.initThreeJS();
    }
    
    /**
     * 初始化 Three.js 基础设施
     */
    initThreeJS() {
        // 创建场景
        this.scene = new THREE.Scene();
        
        // 创建相机
        const aspect = this.container.clientWidth / this.container.clientHeight;
        this.camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 1000);
        this.camera.position.set(0, 5, 20);
        
        // 创建渲染器
        this.renderer = new THREE.WebGLRenderer({ 
            antialias: true, 
            alpha: true 
        });
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.container.appendChild(this.renderer.domElement);
        
        // 创建控制器
        this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        
        // 创建射线投射器
        this.raycaster = new THREE.Raycaster();
        
        // 设置窗口大小调整处理
        this.resizeHandler = () => this.handleResize();
        window.addEventListener('resize', this.resizeHandler);
        
        // 设置点击事件
        this.clickHandler = (event) => this.handleClick(event);
        this.container.addEventListener('click', this.clickHandler);
    }
    
    /**
     * 处理窗口大小调整
     */
    handleResize() {
        if (!this.container || !this.renderer) return;
        
        const w = this.container.clientWidth;
        const h = this.container.clientHeight;
        
        this.renderer.setSize(w, h);
        this.camera.aspect = w / h;
        this.camera.updateProjectionMatrix();
    }
    
    /**
     * 处理点击事件
     */
    handleClick(event) {
        if (!this.currentScene) return;
        
        const rect = this.container.getBoundingClientRect();
        this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        
        this.currentScene.handleClick(this.mouse, this.raycaster);
    }
    
    /**
     * 加载场景
     * @param {string} sceneName - 场景名称 (Engine, Quantum, Hydraulic, LLM)
     */
    async loadScene(sceneName) {
        try {
            // 停止当前动画
            if (this.animationId) {
                cancelAnimationFrame(this.animationId);
                this.animationId = null;
            }
            
            // 清理旧场景
            if (this.currentScene) {
                this.currentScene.dispose();
                this.currentScene = null;
            }
            
            // 清空Three.js场景
            while(this.scene.children.length > 0) {
                this.scene.remove(this.scene.children[0]);
            }
            
            // 重置相机和控制器
            this.camera.position.set(0, 5, 20);
            this.controls.target.set(0, 0, 0);
            this.controls.update();
            
            // 动态导入场景模块
            let SceneClass;
            const module = await import(`../scenes/${sceneName}Scene.js`);
            SceneClass = module.default || module[`${sceneName}Scene`];
            
            // 创建新场景实例
            this.currentScene = new SceneClass(
                this.container,
                this.camera,
                this.scene,
                this.renderer,
                this.controls
            );
            
            // 初始化场景
            await this.currentScene.setup();
            this.currentScene.initialized = true;
            
            // 启动动画循环
            this.startAnimation();
            
            // 显示场景提示
            const tips = this.currentScene.getTips();
            if (tips) {
                // 可以在聊天框显示提示
                if (window.addMessage) {
                    window.addMessage('ai', tips);
                }
            }
            
            return this.currentScene;
            
        } catch (error) {
            console.error(`加载场景 ${sceneName} 失败:`, error);
            throw error;
        }
    }
    
    /**
     * 启动动画循环
     */
    startAnimation() {
        const animate = () => {
            this.animationId = requestAnimationFrame(animate);
            
            const time = this.clock.getElapsedTime();
            
            // 更新控制器
            this.controls.update();
            
            // 更新当前场景
            if (this.currentScene && this.currentScene.initialized) {
                this.currentScene.animate(time);
                this.currentScene.updateLabels();
            }
            
            // 渲染场景
            this.renderer.render(this.scene, this.camera);
        };
        
        animate();
    }
    
    /**
     * 获取当前场景的控制按钮
     */
    getCurrentControls() {
        if (this.currentScene) {
            return this.currentScene.getControls();
        }
        return null;
    }
    
    /**
     * 清理管理器
     */
    dispose() {
        // 停止动画
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        
        // 清理当前场景
        if (this.currentScene) {
            this.currentScene.dispose();
        }
        
        // 移除事件监听
        if (this.resizeHandler) {
            window.removeEventListener('resize', this.resizeHandler);
        }
        if (this.clickHandler) {
            this.container.removeEventListener('click', this.clickHandler);
        }
        
        // 清理渲染器
        if (this.renderer) {
            this.renderer.dispose();
            if (this.renderer.domElement && this.renderer.domElement.parentNode) {
                this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
            }
        }
    }
}

