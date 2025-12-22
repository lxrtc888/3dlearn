/**
 * 场景基类
 * 所有3D场景都继承此基类，统一接口和生命周期管理
 */
export class BaseScene {
    constructor(container, camera, scene, renderer, controls) {
        this.container = container;
        this.camera = camera;
        this.scene = scene;
        this.renderer = renderer;
        this.controls = controls;
        
        this.labels = [];
        this.objects = [];
        this.interactableObjects = [];
        this.clickHandlers = new Map();
        this.initialized = false;
    }
    
    /**
     * 场景初始化 - 子类必须实现
     */
    setup() {
        throw new Error('子类必须实现 setup() 方法');
    }
    
    /**
     * 动画更新 - 子类必须实现
     * @param {number} time - 经过的时间
     */
    animate(time) {
        throw new Error('子类必须实现 animate() 方法');
    }
    
    /**
     * 获取场景控制按钮HTML（可选）
     * @returns {string|null} HTML字符串或null
     */
    getControls() {
        return null;
    }
    
    /**
     * 获取场景提示信息（可选）
     * @returns {string|null} 提示文本或null
     */
    getTips() {
        return null;
    }
    
    /**
     * 处理点击事件 - 可被子类重写
     * @param {THREE.Vector2} mouse - 鼠标坐标
     * @param {THREE.Raycaster} raycaster - 射线投射器
     */
    handleClick(mouse, raycaster) {
        raycaster.setFromCamera(mouse, this.camera);
        const intersects = raycaster.intersectObjects(this.interactableObjects);
        
        if (intersects.length > 0) {
            const target = intersects[0].object;
            if (target.userData.onClick) {
                target.userData.onClick(target);
            }
        }
    }
    
    /**
     * 创建交互式标签
     * @param {string} text - 标签文本
     * @param {THREE.Vector3} position - 3D位置
     * @param {string} icon - Font Awesome图标类名
     */
    createLabel(text, position, icon = 'fa-info-circle') {
        const container = document.createElement('div');
        container.className = 'scene-label-container';
        
        const div = document.createElement('div');
        div.className = 'scene-label';
        div.innerHTML = `<i class="fas ${icon}"></i>${text}`;
        container.appendChild(div);
        
        const line = document.createElement('div');
        line.className = 'label-line';
        container.appendChild(line);
        
        this.container.appendChild(container);
        this.labels.push({ container, line, position: position.clone(), element: div });
        
        return container;
    }
    
    /**
     * 更新所有标签位置
     */
    updateLabels() {
        const w = this.container.clientWidth;
        const h = this.container.clientHeight;
        
        this.labels.forEach(label => {
            const pos = label.position.clone().project(this.camera);
            
            // 检查是否在视野外
            if (pos.z > 1 || Math.abs(pos.x) > 1.1 || Math.abs(pos.y) > 1.1) {
                label.container.style.opacity = 0;
                return;
            }
            
            label.container.style.opacity = 1;
            label.container.style.left = (pos.x * 0.5 + 0.5) * w + 'px';
            label.container.style.top = (-(pos.y * 0.5) + 0.5) * h + 'px';
            
            label.line.style.height = (label.element.offsetHeight + 30) + 'px';
            label.line.style.top = '0px';
            label.line.style.left = '50%';
        });
    }
    
    /**
     * 显示信息弹框
     * @param {string} title - 标题
     * @param {string} content - 内容
     * @param {string} icon - 图标
     */
    showInfoModal(title, content, icon = 'fa-lightbulb') {
        // 移除旧弹框
        const oldModal = document.querySelector('.info-modal');
        if (oldModal) oldModal.remove();
        
        const modal = document.createElement('div');
        modal.className = 'info-modal';
        modal.innerHTML = `
            <div class="info-modal-content">
                <div class="info-modal-header">
                    <i class="fas ${icon} text-3xl text-blue-400 mb-3"></i>
                    <h3 class="text-xl font-bold text-white mb-2">${title}</h3>
                    <button class="info-modal-close" onclick="this.closest('.info-modal').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="info-modal-body">
                    ${content}
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // 点击背景关闭
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });
    }
    
    /**
     * 清理场景资源
     */
    dispose() {
        // 清理3D对象
        this.objects.forEach(obj => {
            if (obj.geometry) obj.geometry.dispose();
            if (obj.material) {
                if (Array.isArray(obj.material)) {
                    obj.material.forEach(mat => mat.dispose());
                } else {
                    obj.material.dispose();
                }
            }
            if (obj.parent) obj.parent.remove(obj);
        });
        
        // 清理标签
        this.labels.forEach(label => {
            if (label.container && label.container.parentNode) {
                label.container.parentNode.removeChild(label.container);
            }
        });
        
        // 清理点击处理器
        this.clickHandlers.clear();
        
        // 清空数组
        this.objects = [];
        this.labels = [];
        this.interactableObjects = [];
        this.initialized = false;
    }
}

