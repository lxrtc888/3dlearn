/**
 * 曼德博分形场景 - Mandelbrot Set Visualization
 * ============================================
 * "简单的公式 z = z² + c 产生无限复杂的图案"
 * 
 * 核心概念：
 * 1. 迭代公式：z_{n+1} = z_n² + c
 * 2. 判断收敛：|z| < 2 则在集合内
 * 3. 自相似性：无限放大永远有新细节
 * 4. 分形维度：介于整数维度之间
 * 
 * 可视化内容：
 * - 复平面上的曼德博集合
 * - 交互式缩放探索
 * - 迭代次数着色
 * - 多种配色方案
 * - 朱利亚集合切换
 * ============================================
 */
window.MandelbrotScene = class MandelbrotScene {
    constructor(scene, camera, renderer) {
        this.scene = scene;
        this.camera = camera;
        this.renderer = renderer;

        this.mainGroup = null;
        this.interactables = [];
        this.highlighted = null;

        // 分形纹理
        this.fractalTexture = null;
        this.fractalMesh = null;
        this.canvas = null;
        this.ctx = null;

        // 视图参数
        this.params = {
            centerX: -0.5,               // 复平面中心x
            centerY: 0,                  // 复平面中心y
            zoom: 1,                     // 缩放级别
            maxIterations: 100,          // 最大迭代次数
            colorScheme: 'rainbow',      // 配色方案
            fractalType: 'mandelbrot',   // 分形类型
            juliaC: { x: -0.7, y: 0.27 }, // Julia集参数
            animateJulia: false          // 动画Julia参数
        };

        // 历史记录（用于返回上一级）
        this.history = [];

        // 预设位置
        this.presetLocations = {
            'overview': { x: -0.5, y: 0, zoom: 1, name: '全景' },
            'seahorse': { x: -0.743643887037151, y: 0.131825904205330, zoom: 10000, name: '海马谷' },
            'elephant': { x: 0.281717921930775, y: 0.5771052841488505, zoom: 5000, name: '象牙谷' },
            'spiral': { x: -0.761574, y: -0.0847596, zoom: 2000, name: '螺旋世界' },
            'lightning': { x: -0.170337, y: -1.06506, zoom: 500, name: '闪电之芽' },
            'flower': { x: -1.25066, y: 0.02012, zoom: 1000, name: '分形之花' }
        };

        // 配色方案
        this.colorSchemes = {
            'rainbow': (iter, max) => this.rainbowColor(iter, max),
            'fire': (iter, max) => this.fireColor(iter, max),
            'ocean': (iter, max) => this.oceanColor(iter, max),
            'psychedelic': (iter, max) => this.psychedelicColor(iter, max),
            'monochrome': (iter, max) => this.monochromeColor(iter, max)
        };

        // 默认相机位置
        this.defaultCameraPos = { x: 0, y: 0, z: 10 };
        
        this.isAutoPlaying = true;
        this.needsRedraw = true;
        this.isRendering = false;

        // 分辨率
        this.resolution = 512;
    }

    /**
     * 初始化场景
     */
    init() {
        // 设置正交相机
        this.camera.position.set(0, 0, 10);
        this.camera.lookAt(0, 0, 0);

        // 背景
        this.scene.background = new THREE.Color(0x000000);

        // 创建场景
        this.setupScene();

        // 设置UI
        this.setupUI();

        // 初始引导
        this.showInitialGuide();

        // 首次渲染
        this.renderFractal();
    }

    /**
     * 创建场景
     */
    setupScene() {
        this.mainGroup = new THREE.Group();
        this.scene.add(this.mainGroup);

        // 创建Canvas用于分形渲染
        this.canvas = document.createElement('canvas');
        this.canvas.width = this.resolution;
        this.canvas.height = this.resolution;
        this.ctx = this.canvas.getContext('2d');

        // 创建纹理
        this.fractalTexture = new THREE.CanvasTexture(this.canvas);
        this.fractalTexture.minFilter = THREE.LinearFilter;
        this.fractalTexture.magFilter = THREE.LinearFilter;

        // 创建平面显示分形
        const geometry = new THREE.PlaneGeometry(16, 12);
        const material = new THREE.MeshBasicMaterial({
            map: this.fractalTexture
        });
        this.fractalMesh = new THREE.Mesh(geometry, material);
        this.mainGroup.add(this.fractalMesh);

        // 添加边框
        const borderGeometry = new THREE.EdgesGeometry(geometry);
        const borderMaterial = new THREE.LineBasicMaterial({ 
            color: 0x4a90d9,
            transparent: true,
            opacity: 0.5
        });
        const border = new THREE.LineSegments(borderGeometry, borderMaterial);
        this.fractalMesh.add(border);

        // 信息标签
        this.createInfoLabel();
    }

    /**
     * 创建信息标签
     */
    createInfoLabel() {
        this.infoSprite = null;
        this.updateInfoLabel();
    }

    /**
     * 更新信息标签
     */
    updateInfoLabel() {
        if (this.infoSprite) {
            this.mainGroup.remove(this.infoSprite);
        }

        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, 512, 64);
        
        ctx.fillStyle = '#00ff88';
        ctx.font = '18px monospace';
        ctx.textAlign = 'center';
        
        const zoomText = this.params.zoom >= 1000000 
            ? `${(this.params.zoom / 1000000).toFixed(1)}M` 
            : this.params.zoom >= 1000 
                ? `${(this.params.zoom / 1000).toFixed(1)}K`
                : this.params.zoom.toFixed(1);
        
        ctx.fillText(
            `位置: (${this.params.centerX.toFixed(6)}, ${this.params.centerY.toFixed(6)}) | 缩放: ${zoomText}x`,
            256, 40
        );

        const texture = new THREE.CanvasTexture(canvas);
        const material = new THREE.SpriteMaterial({ map: texture, transparent: true });
        this.infoSprite = new THREE.Sprite(material);
        this.infoSprite.position.set(0, -7, 0);
        this.infoSprite.scale.set(12, 1.5, 1);
        this.mainGroup.add(this.infoSprite);
    }

    /**
     * 渲染分形
     */
    renderFractal() {
        if (this.isRendering) return;
        this.isRendering = true;

        const width = this.canvas.width;
        const height = this.canvas.height;
        const imageData = this.ctx.createImageData(width, height);
        const data = imageData.data;

        const aspectRatio = width / height;
        const viewWidth = 3 / this.params.zoom;
        const viewHeight = viewWidth / aspectRatio;

        const xMin = this.params.centerX - viewWidth / 2;
        const yMin = this.params.centerY - viewHeight / 2;
        const xStep = viewWidth / width;
        const yStep = viewHeight / height;

        const maxIter = this.params.maxIterations;
        const colorFunc = this.colorSchemes[this.params.colorScheme];

        // 分块渲染以避免阻塞
        let y = 0;
        const renderChunk = () => {
            const chunkSize = 32;
            const endY = Math.min(y + chunkSize, height);

            for (; y < endY; y++) {
                for (let x = 0; x < width; x++) {
                    const cx = xMin + x * xStep;
                    const cy = yMin + (height - 1 - y) * yStep;

                    let iterations;
                    if (this.params.fractalType === 'mandelbrot') {
                        iterations = this.mandelbrotIteration(cx, cy, maxIter);
                    } else {
                        iterations = this.juliaIteration(cx, cy, maxIter);
                    }

                    const pixelIndex = (y * width + x) * 4;
                    
                    if (iterations === maxIter) {
                        // 在集合内部 - 黑色
                        data[pixelIndex] = 0;
                        data[pixelIndex + 1] = 0;
                        data[pixelIndex + 2] = 0;
                    } else {
                        // 在集合外部 - 着色
                        const color = colorFunc(iterations, maxIter);
                        data[pixelIndex] = color.r;
                        data[pixelIndex + 1] = color.g;
                        data[pixelIndex + 2] = color.b;
                    }
                    data[pixelIndex + 3] = 255;
                }
            }

            if (y < height) {
                requestAnimationFrame(renderChunk);
            } else {
                this.ctx.putImageData(imageData, 0, 0);
                this.fractalTexture.needsUpdate = true;
                this.updateInfoLabel();
                this.isRendering = false;
                this.needsRedraw = false;
            }
        };

        renderChunk();
    }

    /**
     * 曼德博迭代
     */
    mandelbrotIteration(cx, cy, maxIter) {
        let x = 0;
        let y = 0;
        let iteration = 0;

        while (x * x + y * y <= 4 && iteration < maxIter) {
            const xTemp = x * x - y * y + cx;
            y = 2 * x * y + cy;
            x = xTemp;
            iteration++;
        }

        // 平滑着色
        if (iteration < maxIter) {
            const log_zn = Math.log(x * x + y * y) / 2;
            const nu = Math.log(log_zn / Math.log(2)) / Math.log(2);
            iteration = iteration + 1 - nu;
        }

        return iteration;
    }

    /**
     * Julia集迭代
     */
    juliaIteration(zx, zy, maxIter) {
        const cx = this.params.juliaC.x;
        const cy = this.params.juliaC.y;
        let iteration = 0;

        while (zx * zx + zy * zy <= 4 && iteration < maxIter) {
            const xTemp = zx * zx - zy * zy + cx;
            zy = 2 * zx * zy + cy;
            zx = xTemp;
            iteration++;
        }

        if (iteration < maxIter) {
            const log_zn = Math.log(zx * zx + zy * zy) / 2;
            const nu = Math.log(log_zn / Math.log(2)) / Math.log(2);
            iteration = iteration + 1 - nu;
        }

        return iteration;
    }

    /**
     * 彩虹配色
     */
    rainbowColor(iter, max) {
        const hue = (iter / max * 360 + 240) % 360;
        return this.hslToRgb(hue, 100, 50);
    }

    /**
     * 火焰配色
     */
    fireColor(iter, max) {
        const t = iter / max;
        return {
            r: Math.floor(Math.min(255, t * 3 * 255)),
            g: Math.floor(Math.max(0, Math.min(255, (t - 0.33) * 3 * 255))),
            b: Math.floor(Math.max(0, Math.min(255, (t - 0.66) * 3 * 255)))
        };
    }

    /**
     * 海洋配色
     */
    oceanColor(iter, max) {
        const t = iter / max;
        return {
            r: Math.floor(t * 50),
            g: Math.floor(t * 150 + 50),
            b: Math.floor(t * 200 + 55)
        };
    }

    /**
     * 迷幻配色
     */
    psychedelicColor(iter, max) {
        const t = iter / max * Math.PI * 2;
        return {
            r: Math.floor(Math.sin(t) * 127 + 128),
            g: Math.floor(Math.sin(t + 2.094) * 127 + 128),
            b: Math.floor(Math.sin(t + 4.188) * 127 + 128)
        };
    }

    /**
     * 单色配色
     */
    monochromeColor(iter, max) {
        const v = Math.floor((iter / max) * 255);
        return { r: v, g: v, b: v };
    }

    /**
     * HSL转RGB
     */
    hslToRgb(h, s, l) {
        s /= 100;
        l /= 100;
        const k = n => (n + h / 30) % 12;
        const a = s * Math.min(l, 1 - l);
        const f = n => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
        return {
            r: Math.floor(255 * f(0)),
            g: Math.floor(255 * f(8)),
            b: Math.floor(255 * f(4))
        };
    }

    /**
     * 缩放到指定位置
     */
    zoomTo(x, y, zoomFactor = 2) {
        // 保存历史
        this.history.push({
            centerX: this.params.centerX,
            centerY: this.params.centerY,
            zoom: this.params.zoom
        });

        // 更新参数
        this.params.centerX = x;
        this.params.centerY = y;
        this.params.zoom *= zoomFactor;

        // 增加迭代次数以显示更多细节
        this.params.maxIterations = Math.min(500, 100 + Math.log2(this.params.zoom) * 20);

        this.needsRedraw = true;
        this.renderFractal();
    }

    /**
     * 返回上一级
     */
    zoomOut() {
        if (this.history.length > 0) {
            const prev = this.history.pop();
            this.params.centerX = prev.centerX;
            this.params.centerY = prev.centerY;
            this.params.zoom = prev.zoom;
            this.params.maxIterations = Math.min(500, 100 + Math.log2(this.params.zoom) * 20);
            this.needsRedraw = true;
            this.renderFractal();
        } else {
            this.showToast('已经是最初视图了');
        }
    }

    /**
     * 加载预设位置
     */
    loadPreset(presetName) {
        const preset = this.presetLocations[presetName];
        if (preset) {
            this.history = [];
            this.params.centerX = preset.x;
            this.params.centerY = preset.y;
            this.params.zoom = preset.zoom;
            this.params.maxIterations = Math.min(500, 100 + Math.log2(this.params.zoom) * 20);
            this.needsRedraw = true;
            this.renderFractal();
            this.showToast(`🔭 前往: ${preset.name}`);
        }
    }

    /**
     * 设置UI
     */
    setupUI() {
        // 底部操作按钮
        const controlsDiv = document.getElementById('scene-controls');
        if (controlsDiv) {
            controlsDiv.style.display = 'flex';
            controlsDiv.innerHTML = `
                <button class="control-btn" id="btn-overview">
                    <i class="fas fa-globe"></i> 全景
                </button>
                <button class="control-btn" id="btn-seahorse">
                    <i class="fas fa-horse"></i> 海马谷
                </button>
                <button class="control-btn" id="btn-spiral">
                    <i class="fas fa-spinner"></i> 螺旋
                </button>
                <button class="control-btn" id="btn-zoom-in">
                    <i class="fas fa-search-plus"></i> 放大
                </button>
                <button class="control-btn" id="btn-zoom-out">
                    <i class="fas fa-search-minus"></i> 缩小
                </button>
                <button class="control-btn" id="btn-back">
                    <i class="fas fa-undo"></i> 返回
                </button>
                <button class="control-btn" id="btn-toggle-type">
                    <i class="fas fa-exchange-alt"></i> Julia集
                </button>
                <button class="control-btn" id="btn-reset-view">
                    <i class="fas fa-video"></i> 重置视角
                </button>
            `;

            // 底部按钮事件
            document.getElementById('btn-overview')?.addEventListener('click', () => this.loadPreset('overview'));
            document.getElementById('btn-seahorse')?.addEventListener('click', () => this.loadPreset('seahorse'));
            document.getElementById('btn-spiral')?.addEventListener('click', () => this.loadPreset('spiral'));
            document.getElementById('btn-zoom-in')?.addEventListener('click', () => {
                this.zoomTo(this.params.centerX, this.params.centerY, 2);
            });
            document.getElementById('btn-zoom-out')?.addEventListener('click', () => {
                this.zoomTo(this.params.centerX, this.params.centerY, 0.5);
            });
            document.getElementById('btn-back')?.addEventListener('click', () => this.zoomOut());
            document.getElementById('btn-toggle-type')?.addEventListener('click', () => {
                if (this.params.fractalType === 'mandelbrot') {
                    this.params.fractalType = 'julia';
                    this.history = [];
                    this.params.centerX = 0;
                    this.params.centerY = 0;
                    this.params.zoom = 1;
                    this.showToast('切换到 Julia 集');
                } else {
                    this.params.fractalType = 'mandelbrot';
                    this.history = [];
                    this.params.centerX = -0.5;
                    this.params.centerY = 0;
                    this.params.zoom = 1;
                    this.showToast('切换到 Mandelbrot 集');
                }
                this.renderFractal();
            });
            document.getElementById('btn-reset-view')?.addEventListener('click', () => this.resetCamera());
        }

        const panel = document.getElementById('control-panel');
        if (!panel) return;

        panel.innerHTML = `
            <div class="control-section">
                <h4><i class="fas fa-map-marker-alt"></i> 经典位置</h4>
                <div class="preset-grid">
                    <button class="location-btn" data-preset="overview">
                        <i class="fas fa-globe"></i> 全景
                    </button>
                    <button class="location-btn" data-preset="seahorse">
                        <i class="fas fa-horse"></i> 海马谷
                    </button>
                    <button class="location-btn" data-preset="elephant">
                        <i class="fas fa-chess-knight"></i> 象牙谷
                    </button>
                    <button class="location-btn" data-preset="spiral">
                        <i class="fas fa-spinner"></i> 螺旋
                    </button>
                    <button class="location-btn" data-preset="lightning">
                        <i class="fas fa-bolt"></i> 闪电
                    </button>
                    <button class="location-btn" data-preset="flower">
                        <i class="fas fa-seedling"></i> 之花
                    </button>
                </div>
            </div>
            
            <div class="control-section">
                <h4><i class="fas fa-palette"></i> 配色方案</h4>
                <select id="color-scheme" class="styled-select">
                    <option value="rainbow">🌈 彩虹</option>
                    <option value="fire">🔥 火焰</option>
                    <option value="ocean">🌊 海洋</option>
                    <option value="psychedelic">🎨 迷幻</option>
                    <option value="monochrome">⬛ 单色</option>
                </select>
            </div>
            
            <div class="control-section">
                <h4><i class="fas fa-shapes"></i> 分形类型</h4>
                <div class="type-buttons">
                    <button id="btn-mandelbrot" class="type-btn active">
                        曼德博集
                    </button>
                    <button id="btn-julia" class="type-btn">
                        朱利亚集
                    </button>
                </div>
            </div>
            
            <div class="control-section julia-params" style="display:none;">
                <h4><i class="fas fa-sliders-h"></i> Julia参数 c</h4>
                <div class="julia-slider">
                    <label>实部: <span id="julia-real-val">${this.params.juliaC.x.toFixed(2)}</span></label>
                    <input type="range" id="julia-real" 
                           min="-1.5" max="1.5" step="0.01"
                           value="${this.params.juliaC.x}" 
                           class="styled-slider">
                </div>
                <div class="julia-slider">
                    <label>虚部: <span id="julia-imag-val">${this.params.juliaC.y.toFixed(2)}</span></label>
                    <input type="range" id="julia-imag" 
                           min="-1.5" max="1.5" step="0.01"
                           value="${this.params.juliaC.y}" 
                           class="styled-slider">
                </div>
            </div>
            
            <div class="control-section">
                <h4><i class="fas fa-search"></i> 缩放控制</h4>
                <div class="zoom-buttons">
                    <button id="btn-zoom-in" class="zoom-btn">
                        <i class="fas fa-search-plus"></i> 放大
                    </button>
                    <button id="btn-zoom-out" class="zoom-btn">
                        <i class="fas fa-search-minus"></i> 缩小
                    </button>
                    <button id="btn-back" class="zoom-btn">
                        <i class="fas fa-undo"></i> 返回
                    </button>
                </div>
            </div>
            
            <div class="control-section">
                <button id="btn-reset" class="control-btn primary full">
                    <i class="fas fa-redo"></i> 重置视图
                </button>
            </div>
            
            <style>
                .preset-grid {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 8px;
                }
                .location-btn {
                    padding: 10px 8px;
                    border: 2px solid #a855f7;
                    background: rgba(168, 85, 247, 0.1);
                    color: #a855f7;
                    border-radius: 8px;
                    cursor: pointer;
                    transition: all 0.3s;
                    font-size: 11px;
                }
                .location-btn:hover {
                    background: rgba(168, 85, 247, 0.3);
                    transform: scale(1.05);
                }
                .styled-select {
                    width: 100%;
                    padding: 10px;
                    border: 2px solid #00ff88;
                    background: rgba(0, 255, 136, 0.1);
                    color: #ffffff;
                    border-radius: 8px;
                    font-size: 14px;
                    cursor: pointer;
                }
                .styled-select option {
                    background: #1a1a2e;
                    color: #ffffff;
                }
                .type-buttons {
                    display: flex;
                    gap: 10px;
                }
                .type-btn {
                    flex: 1;
                    padding: 10px;
                    border: 2px solid #4a90d9;
                    background: rgba(74, 144, 217, 0.1);
                    color: #4a90d9;
                    border-radius: 8px;
                    cursor: pointer;
                    transition: all 0.3s;
                }
                .type-btn.active {
                    background: #4a90d9;
                    color: #ffffff;
                }
                .julia-slider {
                    margin-bottom: 10px;
                }
                .julia-slider label {
                    display: block;
                    margin-bottom: 5px;
                    font-size: 12px;
                    color: #aaa;
                }
                .styled-slider {
                    width: 100%;
                    height: 8px;
                    border-radius: 4px;
                    background: linear-gradient(to right, #a855f7, #00ff88);
                    outline: none;
                    -webkit-appearance: none;
                }
                .styled-slider::-webkit-slider-thumb {
                    -webkit-appearance: none;
                    width: 18px;
                    height: 18px;
                    border-radius: 50%;
                    background: #ffffff;
                    cursor: pointer;
                    box-shadow: 0 0 10px rgba(168, 85, 247, 0.5);
                }
                .zoom-buttons {
                    display: flex;
                    gap: 8px;
                }
                .zoom-btn {
                    flex: 1;
                    padding: 10px;
                    border: none;
                    border-radius: 8px;
                    background: rgba(255,255,255,0.1);
                    color: #ffffff;
                    cursor: pointer;
                    transition: all 0.3s;
                    font-size: 12px;
                }
                .zoom-btn:hover {
                    background: rgba(255,255,255,0.2);
                }
                .control-btn.full {
                    width: 100%;
                }
                .control-btn.primary {
                    background: linear-gradient(135deg, #a855f7, #00ff88);
                }
            </style>
        `;

        this.bindUIEvents();
    }

    /**
     * 绑定UI事件
     */
    bindUIEvents() {
        // 预设位置
        document.querySelectorAll('.location-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.loadPreset(btn.dataset.preset);
            });
        });

        // 配色方案
        const colorSelect = document.getElementById('color-scheme');
        if (colorSelect) {
            colorSelect.addEventListener('change', (e) => {
                this.params.colorScheme = e.target.value;
                this.renderFractal();
            });
        }

        // 分形类型切换
        const mandelbrotBtn = document.getElementById('btn-mandelbrot');
        const juliaBtn = document.getElementById('btn-julia');
        const juliaParams = document.querySelector('.julia-params');

        if (mandelbrotBtn) {
            mandelbrotBtn.addEventListener('click', () => {
                this.params.fractalType = 'mandelbrot';
                mandelbrotBtn.classList.add('active');
                juliaBtn.classList.remove('active');
                juliaParams.style.display = 'none';
                this.history = [];
                this.params.centerX = -0.5;
                this.params.centerY = 0;
                this.params.zoom = 1;
                this.renderFractal();
            });
        }

        if (juliaBtn) {
            juliaBtn.addEventListener('click', () => {
                this.params.fractalType = 'julia';
                juliaBtn.classList.add('active');
                mandelbrotBtn.classList.remove('active');
                juliaParams.style.display = 'block';
                this.history = [];
                this.params.centerX = 0;
                this.params.centerY = 0;
                this.params.zoom = 1;
                this.renderFractal();
            });
        }

        // Julia参数
        const juliaReal = document.getElementById('julia-real');
        const juliaImag = document.getElementById('julia-imag');

        if (juliaReal) {
            juliaReal.addEventListener('input', (e) => {
                this.params.juliaC.x = parseFloat(e.target.value);
                document.getElementById('julia-real-val').textContent = this.params.juliaC.x.toFixed(2);
                if (this.params.fractalType === 'julia') {
                    this.renderFractal();
                }
            });
        }

        if (juliaImag) {
            juliaImag.addEventListener('input', (e) => {
                this.params.juliaC.y = parseFloat(e.target.value);
                document.getElementById('julia-imag-val').textContent = this.params.juliaC.y.toFixed(2);
                if (this.params.fractalType === 'julia') {
                    this.renderFractal();
                }
            });
        }

        // 缩放按钮
        const zoomInBtn = document.getElementById('btn-zoom-in');
        if (zoomInBtn) {
            zoomInBtn.addEventListener('click', () => {
                this.zoomTo(this.params.centerX, this.params.centerY, 2);
            });
        }

        const zoomOutBtn = document.getElementById('btn-zoom-out');
        if (zoomOutBtn) {
            zoomOutBtn.addEventListener('click', () => {
                this.zoomTo(this.params.centerX, this.params.centerY, 0.5);
            });
        }

        const backBtn = document.getElementById('btn-back');
        if (backBtn) {
            backBtn.addEventListener('click', () => {
                this.zoomOut();
            });
        }

        // 重置
        const resetBtn = document.getElementById('btn-reset');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                this.loadPreset('overview');
            });
        }
    }

    /**
     * 显示提示
     */
    showToast(message) {
        const toast = document.createElement('div');
        toast.innerHTML = message;
        toast.style.cssText = `
            position: fixed;
            top: 80px;
            left: 50%;
            transform: translateX(-50%);
            background: linear-gradient(135deg, rgba(168, 85, 247, 0.9), rgba(0, 255, 136, 0.9));
            color: #ffffff;
            padding: 12px 24px;
            border-radius: 25px;
            font-size: 14px;
            z-index: 1000;
            animation: fadeInOut 2s ease-in-out;
        `;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 2000);
    }

    /**
     * 显示初始引导
     */
    showInitialGuide() {
        const panel = document.getElementById('info-panel');
        if (panel) {
            panel.innerHTML = `
                <div style="padding: 15px;">
                    <h3 style="color: #a855f7; margin-bottom: 10px;">
                        <i class="fas fa-infinity"></i> 曼德博分形
                    </h3>
                    <p style="color: #aaa; font-size: 13px; line-height: 1.6;">
                        <strong style="color: #00ff88;">数学公式：</strong><br>
                        z_{n+1} = z_n² + c
                    </p>
                    <div style="margin: 15px 0; padding: 10px; background: rgba(168,85,247,0.1); border-radius: 8px;">
                        <p style="color: #a855f7; font-size: 12px;">
                            🔍 无限放大，永远有新细节<br>
                            🎨 边界处的复杂性最高<br>
                            🌀 自相似性：局部和整体相似
                        </p>
                    </div>
                    <p style="color: #888; font-size: 12px;">
                        💡 点击预设位置探索分形之美！
                    </p>
                </div>
            `;
        }
    }

    /**
     * 动画更新
     */
    animate(time, delta) {
        // 分形渲染是按需的，不需要每帧更新
    }

    /**
     * 鼠标移动处理
     */
    onMouseMove(event) {
        // 可扩展：显示鼠标位置对应的复数
    }

    /**
     * 点击处理
     */
    onClick(event) {
        // 点击放大
        const rect = this.renderer.domElement.getBoundingClientRect();
        const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        // 转换为复平面坐标
        const aspectRatio = rect.width / rect.height;
        const viewWidth = 3 / this.params.zoom;
        const viewHeight = viewWidth / aspectRatio;

        const clickX = this.params.centerX + x * viewWidth / 2;
        const clickY = this.params.centerY + y * viewHeight / 2;

        this.zoomTo(clickX, clickY, 2);
    }

    /**
     * 重置相机
     */
    resetCamera() {
        this.camera.position.set(0, 0, 10);
        this.camera.lookAt(0, 0, 0);
    }

    /**
     * 销毁场景
     */
    dispose() {
        if (this.mainGroup) {
            this.mainGroup.traverse((child) => {
                if (child.geometry) child.geometry.dispose();
                if (child.material) {
                    if (Array.isArray(child.material)) {
                        child.material.forEach(m => m.dispose());
                    } else {
                        if (child.material.map) child.material.map.dispose();
                        child.material.dispose();
                    }
                }
            });
            this.scene.remove(this.mainGroup);
        }

        if (this.fractalTexture) {
            this.fractalTexture.dispose();
        }

        // 添加动画样式
        if (!document.querySelector('#mandelbrot-animations')) {
            const animStyle = document.createElement('style');
            animStyle.id = 'mandelbrot-animations';
            animStyle.textContent = `
                @keyframes fadeInOut {
                    0% { opacity: 0; transform: translate(-50%, -20px); }
                    20% { opacity: 1; transform: translate(-50%, 0); }
                    80% { opacity: 1; transform: translate(-50%, 0); }
                    100% { opacity: 0; transform: translate(-50%, -20px); }
                }
            `;
            document.head.appendChild(animStyle);
        }
    }
};
