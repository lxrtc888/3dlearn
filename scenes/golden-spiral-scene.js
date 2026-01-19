/**
 * 黄金螺旋与斐波那契场景 - Golden Spiral & Fibonacci
 * ============================================
 * 核心原理：
 * - 斐波那契数列：1, 1, 2, 3, 5, 8, 13, 21...
 * - 相邻两数之比趋近于黄金比例 φ ≈ 1.618
 * - 黄金螺旋：基于斐波那契方块的1/4圆弧
 * - 自然界应用：向日葵、鹦鹉螺、银河系
 * ============================================
 */
window.GoldenSpiralScene = class GoldenSpiralScene {
    constructor(scene, camera, renderer) {
        this.scene = scene;
        this.camera = camera;
        this.renderer = renderer;

        this.mainGroup = null;
        this.interactables = [];
        this.highlighted = null;

        // 场景元素
        this.squares = [];              // 斐波那契方块
        this.spiralLine = null;         // 螺旋线
        this.ratioDisplay = null;       // 比值显示
        this.natureOverlay = null;      // 自然界叠加图

        // 斐波那契数列
        this.fibonacci = [1, 1];
        this.maxFibIndex = 10;

        // 场景参数
        this.params = {
            currentIndex: 0,             // 当前显示到第几个
            showSpiral: false,           // 是否显示螺旋
            showRatios: true,            // 是否显示比值
            animationSpeed: 1.0,
            scale: 0.8                   // 整体缩放
        };

        // 颜色方案
        this.colors = [
            0xff6b6b, 0xffa94d, 0xffd43b, 0x69db7c,
            0x38d9a9, 0x4dabf7, 0x748ffc, 0xda77f2,
            0xf783ac, 0xff8787
        ];

        // 默认相机位置
        this.defaultCameraPos = { x: 0, y: 30, z: 40 };
    }

    /**
     * 初始化场景
     */
    init() {
        // 生成斐波那契数列
        for (let i = 2; i <= this.maxFibIndex; i++) {
            this.fibonacci[i] = this.fibonacci[i - 1] + this.fibonacci[i - 2];
        }

        // 设置相机
        this.camera.position.set(
            this.defaultCameraPos.x,
            this.defaultCameraPos.y,
            this.defaultCameraPos.z
        );
        this.camera.lookAt(0, 0, 0);

        // 背景 - 温暖的渐变色
        this.scene.background = new THREE.Color(0x1a1a2e);
        this.scene.fog = new THREE.FogExp2(0x1a1a2e, 0.008);

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
        const ambient = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(ambient);

        // 主方向光
        const mainLight = new THREE.DirectionalLight(0xffffff, 0.8);
        mainLight.position.set(20, 30, 20);
        this.scene.add(mainLight);

        // 金色补光
        const goldLight = new THREE.PointLight(0xffd700, 0.5, 50);
        goldLight.position.set(0, 10, 0);
        this.scene.add(goldLight);
    }

    /**
     * 创建场景
     */
    setupScene() {
        this.mainGroup = new THREE.Group();
        this.scene.add(this.mainGroup);

        // 创建网格地面
        const grid = new THREE.GridHelper(60, 60, 0x333355, 0x222244);
        grid.position.y = -0.1;
        this.mainGroup.add(grid);

        // 创建数列显示
        this.createSequenceDisplay();

        // 创建比值显示
        this.createRatioDisplay();
    }

    /**
     * 创建数列显示
     */
    createSequenceDisplay() {
        // 数列显示在顶部
        this.sequenceGroup = new THREE.Group();
        this.sequenceGroup.position.set(0, 15, 0);
        this.mainGroup.add(this.sequenceGroup);
    }

    /**
     * 创建比值显示
     */
    createRatioDisplay() {
        // 比值显示面板
        const bgGeo = new THREE.PlaneGeometry(10, 3);
        const bgMat = new THREE.MeshBasicMaterial({
            color: 0x000000,
            transparent: true,
            opacity: 0.7
        });
        this.ratioDisplay = new THREE.Mesh(bgGeo, bgMat);
        this.ratioDisplay.position.set(15, 10, 0);
        this.mainGroup.add(this.ratioDisplay);
    }

    /**
     * 添加一个斐波那契方块
     */
    addSquare() {
        if (this.params.currentIndex > this.maxFibIndex) return;

        const index = this.params.currentIndex;
        const size = this.fibonacci[index] * this.params.scale;
        const color = this.colors[index % this.colors.length];

        // 计算位置（螺旋式排列）
        const position = this.calculateSquarePosition(index, size);

        // 创建方块
        const squareGroup = new THREE.Group();

        // 方块面
        const geo = new THREE.PlaneGeometry(size, size);
        const mat = new THREE.MeshStandardMaterial({
            color: color,
            transparent: true,
            opacity: 0.8,
            side: THREE.DoubleSide
        });
        const square = new THREE.Mesh(geo, mat);
        square.rotation.x = -Math.PI / 2;
        squareGroup.add(square);

        // 方块边框
        const edges = new THREE.EdgesGeometry(new THREE.BoxGeometry(size, 0.1, size));
        const lineMat = new THREE.LineBasicMaterial({ color: 0xffffff });
        const outline = new THREE.LineSegments(edges, lineMat);
        squareGroup.add(outline);

        // 数字标签（使用简单的球体表示）
        const labelGeo = new THREE.SphereGeometry(size * 0.1, 16, 16);
        const labelMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
        const label = new THREE.Mesh(labelGeo, labelMat);
        label.position.y = 0.5;
        squareGroup.add(label);

        squareGroup.position.copy(position);
        squareGroup.userData = {
            index: index,
            size: size,
            fibNumber: this.fibonacci[index]
        };

        // 动画入场
        squareGroup.scale.setScalar(0);
        gsap.to(squareGroup.scale, {
            x: 1, y: 1, z: 1,
            duration: 0.5,
            ease: 'back.out(1.7)'
        });

        this.squares.push(squareGroup);
        this.mainGroup.add(squareGroup);

        this.params.currentIndex++;

        // 更新螺旋线
        if (this.params.showSpiral) {
            this.updateSpiral();
        }

        // 添加交互
        this.interactables.push({
            object: square,
            info: {
                title: `斐波那契 #${index + 1}`,
                content: `
                    <p>📐 <strong>第 ${index + 1} 个斐波那契数</strong></p>
                    <p class="text-2xl text-yellow-400">${this.fibonacci[index]}</p>
                    <br>
                    ${index > 0 ? `
                    <p>📊 <strong>比值计算：</strong></p>
                    <p>${this.fibonacci[index]} ÷ ${this.fibonacci[index - 1]} = 
                       <span class="text-cyan-400">${(this.fibonacci[index] / this.fibonacci[index - 1]).toFixed(6)}</span></p>
                    <br>
                    <p>💡 随着数列增长，比值趋近于：</p>
                    <p class="text-yellow-400 text-xl">φ = 1.618033988...</p>
                    ` : `
                    <p>💡 这是数列的起始数</p>
                    `}
                `
            }
        });
    }

    /**
     * 计算方块位置
     */
    calculateSquarePosition(index, size) {
        if (index === 0) {
            return new THREE.Vector3(0, 0, 0);
        }

        // 获取前一个方块的位置和大小
        const prevSquare = this.squares[index - 1];
        const prevSize = prevSquare.userData.size;
        const prevPos = prevSquare.position.clone();

        // 根据索引决定放置方向（顺时针螺旋）
        const direction = index % 4;
        let newPos = prevPos.clone();

        switch (direction) {
            case 1: // 右边
                newPos.x += (prevSize + size) / 2;
                break;
            case 2: // 下边
                newPos.z += (prevSize + size) / 2;
                break;
            case 3: // 左边
                newPos.x -= (prevSize + size) / 2;
                break;
            case 0: // 上边
                if (index > 0) {
                    newPos.z -= (prevSize + size) / 2;
                }
                break;
        }

        return newPos;
    }

    /**
     * 更新螺旋线
     */
    updateSpiral() {
        // 移除旧螺旋线
        if (this.spiralLine) {
            this.mainGroup.remove(this.spiralLine);
            this.spiralLine.geometry.dispose();
            this.spiralLine.material.dispose();
        }

        if (this.squares.length < 2) return;

        // 生成螺旋点
        const points = [];
        const segments = 20; // 每个方块的圆弧分段数

        for (let i = 0; i < this.squares.length; i++) {
            const square = this.squares[i];
            const size = square.userData.size;
            const center = square.position.clone();

            // 计算圆弧的起始和结束角度
            const direction = i % 4;
            let startAngle, endAngle;
            let arcCenter = center.clone();

            switch (direction) {
                case 0: // 从下到左
                    startAngle = Math.PI / 2;
                    endAngle = Math.PI;
                    arcCenter.x -= size / 2;
                    arcCenter.z += size / 2;
                    break;
                case 1: // 从左到上
                    startAngle = Math.PI;
                    endAngle = Math.PI * 1.5;
                    arcCenter.x -= size / 2;
                    arcCenter.z -= size / 2;
                    break;
                case 2: // 从上到右
                    startAngle = Math.PI * 1.5;
                    endAngle = Math.PI * 2;
                    arcCenter.x += size / 2;
                    arcCenter.z -= size / 2;
                    break;
                case 3: // 从右到下
                    startAngle = 0;
                    endAngle = Math.PI / 2;
                    arcCenter.x += size / 2;
                    arcCenter.z += size / 2;
                    break;
            }

            // 生成圆弧点
            for (let j = 0; j <= segments; j++) {
                const t = j / segments;
                const angle = startAngle + (endAngle - startAngle) * t;
                const x = arcCenter.x + Math.cos(angle) * size;
                const z = arcCenter.z + Math.sin(angle) * size;
                points.push(new THREE.Vector3(x, 0.2, z));
            }
        }

        // 创建螺旋线
        const lineGeo = new THREE.BufferGeometry().setFromPoints(points);
        const lineMat = new THREE.LineBasicMaterial({
            color: 0xffd700,
            linewidth: 3
        });
        this.spiralLine = new THREE.Line(lineGeo, lineMat);
        this.mainGroup.add(this.spiralLine);

        // 动画效果
        gsap.from(this.spiralLine.scale, {
            x: 0, y: 0, z: 0,
            duration: 1,
            ease: 'power2.out'
        });
    }

    /**
     * 切换螺旋显示
     */
    toggleSpiral() {
        this.params.showSpiral = !this.params.showSpiral;
        
        if (this.params.showSpiral) {
            this.updateSpiral();
        } else if (this.spiralLine) {
            this.mainGroup.remove(this.spiralLine);
            this.spiralLine.geometry.dispose();
            this.spiralLine.material.dispose();
            this.spiralLine = null;
        }
    }

    /**
     * 自动演化
     */
    autoEvolve() {
        let delay = 0;
        const addInterval = 800;

        for (let i = this.params.currentIndex; i <= this.maxFibIndex; i++) {
            setTimeout(() => {
                this.addSquare();
            }, delay);
            delay += addInterval;
        }

        // 最后显示螺旋
        setTimeout(() => {
            if (!this.params.showSpiral) {
                this.toggleSpiral();
                const btn = document.getElementById('btn-spiral');
                if (btn) btn.classList.add('active');
            }
        }, delay + 500);
    }

    /**
     * 重置场景
     */
    resetScene() {
        // 移除所有方块
        this.squares.forEach(square => {
            this.mainGroup.remove(square);
            square.traverse(obj => {
                if (obj.geometry) obj.geometry.dispose();
                if (obj.material) obj.material.dispose();
            });
        });
        this.squares = [];

        // 移除螺旋线
        if (this.spiralLine) {
            this.mainGroup.remove(this.spiralLine);
            this.spiralLine.geometry.dispose();
            this.spiralLine.material.dispose();
            this.spiralLine = null;
        }

        this.params.currentIndex = 0;
        this.params.showSpiral = false;
        this.interactables = [];

        // 重置UI按钮状态
        const spiralBtn = document.getElementById('btn-spiral');
        if (spiralBtn) spiralBtn.classList.remove('active');
    }

    /**
     * 设置UI
     */
    setupUI() {
        const controlsDiv = document.getElementById('scene-controls');
        if (!controlsDiv) return;

        controlsDiv.style.display = 'flex';
        controlsDiv.innerHTML = `
            <button class="control-btn primary" id="btn-add">
                <i class="fas fa-plus"></i> 添加方块
            </button>
            <button class="control-btn" id="btn-auto">
                <i class="fas fa-play"></i> 自动演化
            </button>
            <button class="control-btn" id="btn-spiral">
                <i class="fas fa-redo"></i> 螺旋线
            </button>
            <button class="control-btn" id="btn-sunflower">
                <i class="fas fa-sun"></i> 向日葵
            </button>
            <button class="control-btn" id="btn-shell">
                <i class="fas fa-circle-notch"></i> 鹦鹉螺
            </button>
            <button class="control-btn" id="btn-galaxy">
                <i class="fas fa-star"></i> 银河
            </button>
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
        // 添加方块
        document.getElementById('btn-add')?.addEventListener('click', () => {
            this.addSquare();
        });

        // 自动演化
        document.getElementById('btn-auto')?.addEventListener('click', () => {
            this.autoEvolve();
        });

        // 螺旋线
        document.getElementById('btn-spiral')?.addEventListener('click', () => {
            this.toggleSpiral();
            document.getElementById('btn-spiral').classList.toggle('active');
        });

        // 自然界叠加按钮
        document.getElementById('btn-sunflower')?.addEventListener('click', () => {
            this.showNatureOverlay('sunflower');
        });

        document.getElementById('btn-shell')?.addEventListener('click', () => {
            this.showNatureOverlay('shell');
        });

        document.getElementById('btn-galaxy')?.addEventListener('click', () => {
            this.showNatureOverlay('galaxy');
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
     * 显示自然界叠加
     */
    showNatureOverlay(type) {
        const panel = document.getElementById('info-panel');
        const title = document.getElementById('info-title');
        const content = document.getElementById('info-content');

        if (!panel || !title || !content) return;

        const info = {
            sunflower: {
                title: '🌻 向日葵',
                content: `
                    <p><strong>向日葵种子的斐波那契奥秘</strong></p>
                    <br>
                    <p>向日葵的种子排列呈现两组螺旋：</p>
                    <ul style="margin-left: 1rem; margin-top: 0.5rem;">
                        <li>• 顺时针螺旋：通常是 <span class="text-yellow-400">34</span> 条</li>
                        <li>• 逆时针螺旋：通常是 <span class="text-yellow-400">55</span> 条</li>
                    </ul>
                    <br>
                    <p>34 和 55 都是斐波那契数！</p>
                    <p>它们的比值：55/34 ≈ <span class="text-cyan-400">1.618</span></p>
                    <br>
                    <p>💡 这种排列方式能让种子最有效率地填充空间。</p>
                `
            },
            shell: {
                title: '🐚 鹦鹉螺',
                content: `
                    <p><strong>鹦鹉螺壳的黄金螺旋</strong></p>
                    <br>
                    <p>鹦鹉螺的壳截面几乎完美吻合黄金螺旋。</p>
                    <br>
                    <p>📐 <strong>生长规律：</strong></p>
                    <p>每一圈的大小与前一圈的比例接近 φ ≈ 1.618</p>
                    <br>
                    <p>🧬 <strong>为什么？</strong></p>
                    <p>这是自然选择的结果——黄金比例使得</p>
                    <p>生物体在生长时保持相似的形状，</p>
                    <p>这是最"经济"的生长方式。</p>
                `
            },
            galaxy: {
                title: '🌌 银河系',
                content: `
                    <p><strong>银河系的旋臂</strong></p>
                    <br>
                    <p>银河系的旋臂也遵循对数螺旋，</p>
                    <p>与黄金螺旋有着惊人的相似。</p>
                    <br>
                    <p>🌠 <strong>从微观到宏观：</strong></p>
                    <ul style="margin-left: 1rem; margin-top: 0.5rem;">
                        <li>• DNA双螺旋</li>
                        <li>• 飓风的形状</li>
                        <li>• 银河系旋臂</li>
                    </ul>
                    <br>
                    <p>💡 黄金比例似乎是宇宙的"设计语言"！</p>
                    <br>
                    <p class="text-yellow-400">"上帝是数学家"</p>
                `
            }
        };

        const data = info[type];
        title.textContent = data.title;
        content.innerHTML = data.content;
        panel.classList.add('visible');
    }

    /**
     * 显示初始引导
     */
    showInitialGuide() {
        const panel = document.getElementById('info-panel');
        const title = document.getElementById('info-title');
        const content = document.getElementById('info-content');

        if (panel && title && content) {
            title.textContent = '🌀 黄金螺旋';
            content.innerHTML = `
                <p><strong>斐波那契数列</strong></p>
                <p class="text-yellow-400 text-lg">1, 1, 2, 3, 5, 8, 13, 21, 34, 55...</p>
                <br>
                <p>每个数 = 前两个数之和</p>
                <br>
                <p><strong>黄金比例 φ</strong></p>
                <p>相邻两数之比趋近于：</p>
                <p class="text-cyan-400 text-xl">φ = 1.618033988...</p>
                <br>
                <p><strong>实验步骤：</strong></p>
                <p>1. 点击"添加方块"逐个构建</p>
                <p>2. 或点击"自动演化"</p>
                <p>3. 开启"螺旋线"观察</p>
                <p>4. 叠加自然界实例对比</p>
            `;
            panel.classList.add('visible');
        }
    }

    /**
     * 动画更新（场景管理器调用）
     */
    animate(time, delta) {
        // 方块微微浮动
        this.squares.forEach((square, i) => {
            square.position.y = 0.1 + Math.sin(time * 2 + i * 0.5) * 0.1;
        });

        // 螺旋线发光效果
        if (this.spiralLine) {
            const pulse = 0.7 + 0.3 * Math.sin(time * 3);
            this.spiralLine.material.opacity = pulse;
        }
    }

    /**
     * 处理点击
     */
    onMouseClick(raycaster) {
        const meshes = this.interactables.map(item => item.object);
        const intersects = raycaster.intersectObjects(meshes, false);

        if (intersects.length > 0) {
            const clickedMesh = intersects[0].object;
            const item = this.interactables.find(i => i.object === clickedMesh);

            if (item) {
                const panel = document.getElementById('info-panel');
                const title = document.getElementById('info-title');
                const content = document.getElementById('info-content');

                if (panel && title && content) {
                    title.textContent = item.info.title;
                    content.innerHTML = item.info.content;
                    panel.classList.add('visible');
                }
            }
        }
    }

    /**
     * 处理鼠标移动
     */
    onMouseMove(raycaster) {
        const meshes = this.interactables.map(item => item.object);
        const intersects = raycaster.intersectObjects(meshes, false);

        if (this.highlighted) {
            this.highlighted.material.emissive?.setHex(0x000000);
            this.highlighted = null;
        }

        if (intersects.length > 0) {
            this.highlighted = intersects[0].object;
            if (this.highlighted.material.emissive) {
                this.highlighted.material.emissive.setHex(0x222222);
            }
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

        // 清除螺旋线
        if (this.spiralLine) {
            this.mainGroup.remove(this.spiralLine);
            this.spiralLine.geometry.dispose();
            this.spiralLine.material.dispose();
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

        this.squares = [];
        this.interactables = [];
    }
};
