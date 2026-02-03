/**
 * 智慧煤矿数字孪生场景
 * ============================================
 * 企业级煤矿安全监测与生产调度3D可视化
 * 
 * 功能模块：
 * 1. 矿区全景（地表设施、运输系统）
 * 2. 井下系统（巷道、4个工作面）
 * 3. 安全监测（瓦斯传感器、报警系统）
 * 4. 生产调度（产量数据、设备状态）
 * ============================================
 */

window.SmartMineScene = class SmartMineScene {
    constructor(scene, camera, renderer) {
        this.scene = scene;
        this.camera = camera;
        this.renderer = renderer;

        // 场景对象组
        this.mainGroup = null;
        this.surfaceGroup = null;      // 地表层
        this.undergroundGroup = null;  // 井下层
        this.interactables = [];

        // Mock数据
        this.mineData = window.MineMockData || {};

        // 场景参数
        this.params = {
            isRunning: true,
            currentView: 'overview',    // overview, underground, workface
            showGasHeatmap: true,
            showPersonnel: true,
            showConveyor: true,
            animationSpeed: 1.0
        };

        // 颜色主题
        this.colors = {
            background: 0x0a1628,
            ground: 0x2d4a3e,
            building: 0x4a5568,
            tunnel: 0x3d3d3d,
            coal: 0x1a1a1a,
            safe: 0x00ff88,
            warning: 0xffcc00,
            danger: 0xff4444,
            primary: 0x1e90ff,
            grid: 0x1a2a4a
        };

        // 相机预设位置
        this.cameraPresets = {
            overview: { pos: { x: 80, y: 60, z: 80 }, target: { x: 0, y: -10, z: 0 } },
            underground: { pos: { x: 0, y: -20, z: 60 }, target: { x: 0, y: -25, z: 0 } },
            workface: { pos: { x: 30, y: -25, z: 20 }, target: { x: 0, y: -28, z: 0 } }
        };

        // 动画对象
        this.trucks = [];
        this.conveyorParticles = [];
        this.gasSensors = [];
        this.personnelMarkers = [];
        this.workfaceMeshes = [];
        
        // 报警状态
        this.alarmActive = false;
        this.alarmInterval = null;
    }

    /**
     * 初始化场景
     */
    init() {
        // 设置相机
        const preset = this.cameraPresets.overview;
        this.camera.position.set(preset.pos.x, preset.pos.y, preset.pos.z);
        this.camera.lookAt(preset.target.x, preset.target.y, preset.target.z);

        // 背景
        this.scene.background = new THREE.Color(this.colors.background);
        this.scene.fog = new THREE.FogExp2(this.colors.background, 0.006);

        // 创建主组
        this.mainGroup = new THREE.Group();
        this.scene.add(this.mainGroup);

        // 光照系统
        this.setupLights();

        // 创建场景内容
        this.createTerrain();
        this.createSurfaceBuildings();
        this.createUnderground();
        this.createTruckSystem();
        this.createGasSensors();
        this.createPersonnelMarkers();

        // 创建UI
        this.setupUI();
        this.createTeachingPanel();
        this.createDataPanel();

        // 初始引导
        this.showInitialGuide();
    }

    /**
     * 设置光照
     */
    setupLights() {
        // 环境光
        const ambient = new THREE.AmbientLight(0xffffff, 0.3);
        this.scene.add(ambient);

        // 主方向光（模拟太阳）
        const sunLight = new THREE.DirectionalLight(0xffffff, 0.8);
        sunLight.position.set(50, 100, 50);
        sunLight.castShadow = true;
        sunLight.shadow.mapSize.width = 2048;
        sunLight.shadow.mapSize.height = 2048;
        this.scene.add(sunLight);

        // 半球光（天空/地面）
        const hemiLight = new THREE.HemisphereLight(0x87ceeb, 0x3d2817, 0.4);
        this.scene.add(hemiLight);

        // 井下补光
        const undergroundLight = new THREE.PointLight(0xffaa44, 1, 100);
        undergroundLight.position.set(0, -25, 0);
        this.scene.add(undergroundLight);
    }

    /**
     * 创建地形
     */
    createTerrain() {
        // 地表组
        this.surfaceGroup = new THREE.Group();
        this.surfaceGroup.name = 'surface';
        this.mainGroup.add(this.surfaceGroup);

        // 网格地面
        const gridHelper = new THREE.GridHelper(200, 40, this.colors.grid, this.colors.grid);
        gridHelper.position.y = 0;
        gridHelper.material.opacity = 0.3;
        gridHelper.material.transparent = true;
        this.surfaceGroup.add(gridHelper);

        // 主地面
        const groundGeom = new THREE.PlaneGeometry(200, 200);
        const groundMat = new THREE.MeshStandardMaterial({
            color: this.colors.ground,
            roughness: 0.9,
            metalness: 0.1
        });
        const ground = new THREE.Mesh(groundGeom, groundMat);
        ground.rotation.x = -Math.PI / 2;
        ground.position.y = -0.1;
        ground.receiveShadow = true;
        this.surfaceGroup.add(ground);

        // 山体背景（简化）
        this.createMountains();

        // 道路网络
        this.createRoads();
    }

    /**
     * 创建山体背景
     */
    createMountains() {
        const mountainGroup = new THREE.Group();

        // 创建多个山体
        const mountainPositions = [
            { x: -60, z: -70, scale: 1.2 },
            { x: -30, z: -80, scale: 0.8 },
            { x: 20, z: -75, scale: 1.0 },
            { x: 60, z: -65, scale: 0.9 },
            { x: 80, z: -80, scale: 1.1 }
        ];

        mountainPositions.forEach(pos => {
            const geometry = new THREE.ConeGeometry(15 * pos.scale, 25 * pos.scale, 6);
            const material = new THREE.MeshStandardMaterial({
                color: 0x4a5d4a,
                roughness: 0.8,
                flatShading: true
            });
            const mountain = new THREE.Mesh(geometry, material);
            mountain.position.set(pos.x, 12 * pos.scale, pos.z);
            mountain.rotation.y = Math.random() * Math.PI;
            mountainGroup.add(mountain);
        });

        this.surfaceGroup.add(mountainGroup);
    }

    /**
     * 创建道路网络
     */
    createRoads() {
        const roadMaterial = new THREE.MeshStandardMaterial({
            color: 0x3a3a3a,
            roughness: 0.7
        });

        // 主干道
        const mainRoad = new THREE.Mesh(
            new THREE.PlaneGeometry(8, 100),
            roadMaterial
        );
        mainRoad.rotation.x = -Math.PI / 2;
        mainRoad.position.set(0, 0.05, 20);
        this.surfaceGroup.add(mainRoad);

        // 环形道路
        const ringRoad = new THREE.Mesh(
            new THREE.PlaneGeometry(80, 6),
            roadMaterial
        );
        ringRoad.rotation.x = -Math.PI / 2;
        ringRoad.position.set(0, 0.05, -20);
        this.surfaceGroup.add(ringRoad);

        // 支路
        const branchRoad = new THREE.Mesh(
            new THREE.PlaneGeometry(6, 40),
            roadMaterial
        );
        branchRoad.rotation.x = -Math.PI / 2;
        branchRoad.position.set(-30, 0.05, 0);
        this.surfaceGroup.add(branchRoad);
    }

    /**
     * 创建地表建筑
     */
    createSurfaceBuildings() {
        // 井架（主井）
        this.createPitHead(-15, 0, 'main', '主井');
        
        // 井架（副井）
        this.createPitHead(15, 0, 'auxiliary', '副井');

        // 选煤厂
        this.createCoalPlant(-40, -25);

        // 办公楼
        this.createBuilding(35, 15, 12, 8, 15, '调度中心', 0x4a6fa5);

        // 变电站
        this.createBuilding(-45, 20, 10, 6, 8, '变电站', 0x5a5a6a);

        // 仓库
        this.createBuilding(45, -15, 20, 8, 6, '材料仓库', 0x6a6a5a);
    }

    /**
     * 创建井架
     */
    createPitHead(x, z, type, label) {
        const pitGroup = new THREE.Group();
        pitGroup.position.set(x, 0, z);

        // 井架主体（四脚架构）
        const frameColor = type === 'main' ? 0xff4444 : 0x4488ff;
        
        // 四根支柱
        const legGeom = new THREE.CylinderGeometry(0.3, 0.5, 20, 8);
        const legMat = new THREE.MeshStandardMaterial({ color: frameColor, metalness: 0.6 });
        
        const legPositions = [
            { x: -3, z: -3 }, { x: 3, z: -3 },
            { x: -3, z: 3 }, { x: 3, z: 3 }
        ];

        legPositions.forEach(pos => {
            const leg = new THREE.Mesh(legGeom, legMat);
            leg.position.set(pos.x, 10, pos.z);
            pitGroup.add(leg);
        });

        // 顶部平台
        const topPlatform = new THREE.Mesh(
            new THREE.BoxGeometry(8, 1, 8),
            new THREE.MeshStandardMaterial({ color: 0x555555, metalness: 0.4 })
        );
        topPlatform.position.y = 20;
        pitGroup.add(topPlatform);

        // 提升机房
        const machineRoom = new THREE.Mesh(
            new THREE.BoxGeometry(6, 4, 6),
            new THREE.MeshStandardMaterial({ color: 0x666666 })
        );
        machineRoom.position.y = 22;
        pitGroup.add(machineRoom);

        // 滚筒（提升轮）
        const drum = new THREE.Mesh(
            new THREE.CylinderGeometry(2, 2, 1, 16),
            new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.8 })
        );
        drum.rotation.z = Math.PI / 2;
        drum.position.set(0, 24, 0);
        drum.userData.isDrum = true;
        pitGroup.add(drum);
        this.interactables.push(drum);

        // 井口平台
        const platform = new THREE.Mesh(
            new THREE.BoxGeometry(12, 0.5, 12),
            new THREE.MeshStandardMaterial({ color: 0x444444 })
        );
        platform.position.y = 0.25;
        pitGroup.add(platform);

        // 井筒（向下延伸）
        const shaft = new THREE.Mesh(
            new THREE.CylinderGeometry(3, 3, 40, 16, 1, true),
            new THREE.MeshStandardMaterial({ 
                color: 0x2a2a2a, 
                side: THREE.DoubleSide,
                transparent: true,
                opacity: 0.8
            })
        );
        shaft.position.y = -20;
        pitGroup.add(shaft);

        // 标签
        pitGroup.userData = {
            name: label,
            type: type,
            description: `${label}提升系统<br>深度：350米<br>状态：正常运行`
        };

        this.surfaceGroup.add(pitGroup);
        this.interactables.push(pitGroup);
    }

    /**
     * 创建选煤厂
     */
    createCoalPlant(x, z) {
        const plantGroup = new THREE.Group();
        plantGroup.position.set(x, 0, z);

        // 主厂房
        const mainBuilding = new THREE.Mesh(
            new THREE.BoxGeometry(25, 15, 20),
            new THREE.MeshStandardMaterial({ color: 0x5a6a7a })
        );
        mainBuilding.position.y = 7.5;
        plantGroup.add(mainBuilding);

        // 煤仓（圆柱形）
        for (let i = 0; i < 3; i++) {
            const silo = new THREE.Mesh(
                new THREE.CylinderGeometry(4, 4, 12, 16),
                new THREE.MeshStandardMaterial({ color: 0x4a4a4a })
            );
            silo.position.set(-5 + i * 8, 6, 15);
            plantGroup.add(silo);
        }

        // 皮带机栈桥
        const conveyor = new THREE.Mesh(
            new THREE.BoxGeometry(40, 2, 3),
            new THREE.MeshStandardMaterial({ color: 0x666666 })
        );
        conveyor.position.set(20, 8, 0);
        conveyor.rotation.y = -0.3;
        plantGroup.add(conveyor);

        plantGroup.userData = {
            name: '选煤厂',
            description: '日处理能力：15000吨<br>洗选回收率：92%<br>状态：正常运行'
        };

        this.surfaceGroup.add(plantGroup);
        this.interactables.push(plantGroup);
    }

    /**
     * 创建通用建筑
     */
    createBuilding(x, z, width, depth, height, name, color) {
        const building = new THREE.Mesh(
            new THREE.BoxGeometry(width, height, depth),
            new THREE.MeshStandardMaterial({ color: color })
        );
        building.position.set(x, height / 2, z);
        building.userData = { name: name };
        this.surfaceGroup.add(building);
        this.interactables.push(building);
    }

    /**
     * 创建井下系统
     */
    createUnderground() {
        this.undergroundGroup = new THREE.Group();
        this.undergroundGroup.name = 'underground';
        this.undergroundGroup.position.y = -25;
        this.mainGroup.add(this.undergroundGroup);

        // 井下网格
        const gridHelper = new THREE.GridHelper(150, 30, 0x333333, 0x222222);
        gridHelper.material.opacity = 0.4;
        gridHelper.material.transparent = true;
        this.undergroundGroup.add(gridHelper);

        // 创建巷道网络
        this.createTunnels();

        // 创建4个工作面
        this.createWorkfaces();

        // 创建皮带运输系统
        this.createConveyorSystem();
    }

    /**
     * 创建巷道网络
     */
    createTunnels() {
        const tunnelMaterial = new THREE.MeshStandardMaterial({
            color: this.colors.tunnel,
            roughness: 0.8,
            side: THREE.DoubleSide
        });

        // 主运输巷（东西向）
        const mainTunnel = this.createTunnel(100, 4, 3.5);
        mainTunnel.position.set(0, 0, 0);
        this.undergroundGroup.add(mainTunnel);

        // 总回风巷
        const returnTunnel = this.createTunnel(100, 3.5, 3);
        returnTunnel.position.set(0, 0, -20);
        this.undergroundGroup.add(returnTunnel);

        // 连接巷道（南北向）
        for (let i = -2; i <= 2; i++) {
            if (i === 0) continue;
            const crossTunnel = this.createTunnel(20, 3, 3);
            crossTunnel.rotation.y = Math.PI / 2;
            crossTunnel.position.set(i * 20, 0, -10);
            this.undergroundGroup.add(crossTunnel);
        }
    }

    /**
     * 创建单条巷道
     */
    createTunnel(length, width, height) {
        const tunnelGroup = new THREE.Group();

        // 巷道外壳（拱形截面简化为矩形）
        const tunnelGeom = new THREE.BoxGeometry(length, height, width);
        const tunnelMat = new THREE.MeshStandardMaterial({
            color: 0x3d3d3d,
            roughness: 0.9,
            side: THREE.BackSide
        });
        const tunnel = new THREE.Mesh(tunnelGeom, tunnelMat);
        tunnel.position.y = height / 2;
        tunnelGroup.add(tunnel);

        // 巷道照明（点光源）
        for (let i = -length/2 + 10; i < length/2; i += 20) {
            const light = new THREE.PointLight(0xffaa44, 0.3, 15);
            light.position.set(i, height - 0.5, 0);
            tunnelGroup.add(light);
        }

        return tunnelGroup;
    }

    /**
     * 创建4个工作面
     */
    createWorkfaces() {
        const workfaceData = this.mineData.workfaces || [];
        
        const positions = [
            { x: -40, z: 15, rotation: 0 },
            { x: -40, z: -35, rotation: 0 },
            { x: 40, z: 15, rotation: Math.PI },
            { x: 40, z: -35, rotation: Math.PI }
        ];

        workfaceData.forEach((wf, index) => {
            if (index >= positions.length) return;
            
            const pos = positions[index];
            const workface = this.createWorkface(wf, pos);
            this.undergroundGroup.add(workface);
            this.workfaceMeshes.push(workface);
        });
    }

    /**
     * 创建单个工作面
     */
    createWorkface(data, position) {
        const wfGroup = new THREE.Group();
        wfGroup.position.set(position.x, 0, position.z);
        wfGroup.rotation.y = position.rotation;

        // 工作面区域
        const faceGeom = new THREE.BoxGeometry(25, 3.5, 8);
        const faceMat = new THREE.MeshStandardMaterial({
            color: data.status === '作业中' ? 0x2a4a2a : 0x4a3a2a,
            roughness: 0.9
        });
        const face = new THREE.Mesh(faceGeom, faceMat);
        face.position.y = 1.75;
        wfGroup.add(face);

        // 采煤机（简化模型）
        if (data.status === '作业中') {
            const shearer = new THREE.Mesh(
                new THREE.BoxGeometry(4, 2, 3),
                new THREE.MeshStandardMaterial({ color: 0xffcc00, metalness: 0.6 })
            );
            shearer.position.set(-10 + (data.equipment?.shearer?.position || 0) / 5, 1, 0);
            shearer.userData.isShearer = true;
            wfGroup.add(shearer);
        }

        // 液压支架（简化为一排方块）
        for (let i = -10; i <= 10; i += 2) {
            const support = new THREE.Mesh(
                new THREE.BoxGeometry(1.5, 3, 6),
                new THREE.MeshStandardMaterial({ color: 0x666666, metalness: 0.5 })
            );
            support.position.set(i, 1.5, 0);
            wfGroup.add(support);
        }

        // 状态指示灯
        const statusColor = data.status === '作业中' ? 0x00ff00 : 
                           data.status === '检修' ? 0xffcc00 : 0xff0000;
        const indicator = new THREE.Mesh(
            new THREE.SphereGeometry(0.5, 16, 16),
            new THREE.MeshBasicMaterial({ color: statusColor })
        );
        indicator.position.set(0, 4.5, 0);
        wfGroup.add(indicator);

        // 点光源
        const light = new THREE.PointLight(statusColor, 0.5, 20);
        light.position.set(0, 3, 0);
        wfGroup.add(light);

        wfGroup.userData = {
            name: data.name,
            id: data.id,
            data: data,
            description: `
                状态：${data.status}<br>
                日产量：${data.dailyOutput} 吨<br>
                进度：${data.progress}%<br>
                人员：${data.personnel} 人<br>
                瓦斯：${data.gasLevel}%
            `
        };

        this.interactables.push(wfGroup);
        return wfGroup;
    }

    /**
     * 创建皮带运输系统
     */
    createConveyorSystem() {
        // 主运皮带
        const conveyorPath = [
            new THREE.Vector3(-45, 0.5, 0),
            new THREE.Vector3(0, 0.5, 0),
            new THREE.Vector3(45, 0.5, 0)
        ];

        const curve = new THREE.CatmullRomCurve3(conveyorPath);
        const tubeGeom = new THREE.TubeGeometry(curve, 50, 0.8, 8, false);
        const tubeMat = new THREE.MeshStandardMaterial({
            color: 0x333333,
            roughness: 0.6
        });
        const conveyor = new THREE.Mesh(tubeGeom, tubeMat);
        this.undergroundGroup.add(conveyor);

        // 创建运输粒子
        this.createConveyorParticles(conveyorPath);
    }

    /**
     * 创建运输粒子（模拟煤流）
     */
    createConveyorParticles(path) {
        const particleCount = 30;
        const particleGeom = new THREE.SphereGeometry(0.3, 8, 8);
        const particleMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a });

        for (let i = 0; i < particleCount; i++) {
            const particle = new THREE.Mesh(particleGeom, particleMat);
            particle.userData = {
                progress: i / particleCount,
                speed: 0.002 + Math.random() * 0.001
            };
            this.conveyorParticles.push(particle);
            this.undergroundGroup.add(particle);
        }
    }

    /**
     * 创建矿卡运输系统
     */
    createTruckSystem() {
        // 创建3辆矿卡
        const truckColors = [0xffcc00, 0xff8800, 0xffaa00];
        
        for (let i = 0; i < 3; i++) {
            const truck = this.createTruck(truckColors[i]);
            truck.userData = {
                progress: i / 3,
                speed: 0.001 + Math.random() * 0.0005,
                direction: i % 2 === 0 ? 1 : -1
            };
            this.trucks.push(truck);
            this.surfaceGroup.add(truck);
        }
    }

    /**
     * 创建矿卡模型
     */
    createTruck(color) {
        const truckGroup = new THREE.Group();

        // 车身
        const body = new THREE.Mesh(
            new THREE.BoxGeometry(4, 2, 2.5),
            new THREE.MeshStandardMaterial({ color: color })
        );
        body.position.y = 1.5;
        truckGroup.add(body);

        // 车斗
        const bucket = new THREE.Mesh(
            new THREE.BoxGeometry(5, 2.5, 2.8),
            new THREE.MeshStandardMaterial({ color: 0x555555 })
        );
        bucket.position.set(-1.5, 2.5, 0);
        truckGroup.add(bucket);

        // 驾驶室
        const cabin = new THREE.Mesh(
            new THREE.BoxGeometry(2, 1.5, 2.2),
            new THREE.MeshStandardMaterial({ color: 0x333333 })
        );
        cabin.position.set(2, 2.5, 0);
        truckGroup.add(cabin);

        // 轮子
        const wheelGeom = new THREE.CylinderGeometry(0.6, 0.6, 0.4, 16);
        const wheelMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a });
        
        [[-1.5, -1.3], [-1.5, 1.3], [2, -1.3], [2, 1.3]].forEach(pos => {
            const wheel = new THREE.Mesh(wheelGeom, wheelMat);
            wheel.rotation.x = Math.PI / 2;
            wheel.position.set(pos[0], 0.6, pos[1]);
            truckGroup.add(wheel);
        });

        return truckGroup;
    }

    /**
     * 创建瓦斯传感器
     */
    createGasSensors() {
        const sensorData = this.mineData.safety?.gasSensors || [];
        
        // 传感器分布位置（与工作面对应）
        const sensorPositions = [
            { x: -35, z: 15 }, { x: -45, z: 15 },
            { x: -35, z: -35 }, { x: -45, z: -35 },
            { x: 35, z: 15 }, { x: 45, z: 15 },
            { x: 35, z: -35 }, { x: 45, z: -35 }
        ];

        sensorData.forEach((sensor, index) => {
            if (index >= sensorPositions.length) return;
            
            const pos = sensorPositions[index];
            const sensorMesh = this.createSensor(sensor, pos);
            this.undergroundGroup.add(sensorMesh);
            this.gasSensors.push(sensorMesh);
        });
    }

    /**
     * 创建单个传感器
     */
    createSensor(data, position) {
        const sensorGroup = new THREE.Group();
        sensorGroup.position.set(position.x, 3, position.z);

        // 传感器外壳
        const housing = new THREE.Mesh(
            new THREE.BoxGeometry(0.8, 0.6, 0.4),
            new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.5 })
        );
        sensorGroup.add(housing);

        // 状态指示灯
        const statusColor = data.status === 'normal' ? 0x00ff00 : 
                           data.status === 'warning' ? 0xffcc00 : 0xff0000;
        const indicator = new THREE.Mesh(
            new THREE.SphereGeometry(0.15, 16, 16),
            new THREE.MeshBasicMaterial({ color: statusColor })
        );
        indicator.position.set(0, 0.4, 0);
        indicator.userData.isIndicator = true;
        sensorGroup.add(indicator);

        // 点光源（警告时发光）
        if (data.status === 'warning') {
            const light = new THREE.PointLight(0xffcc00, 0.5, 10);
            light.position.set(0, 0.5, 0);
            sensorGroup.add(light);
        }

        sensorGroup.userData = {
            name: `瓦斯传感器 ${data.id}`,
            sensorData: data,
            description: `
                位置：${data.location}<br>
                浓度：${data.value}%<br>
                限值：${data.limit}%<br>
                状态：${data.status === 'normal' ? '正常' : data.status === 'warning' ? '预警' : '报警'}
            `
        };

        this.interactables.push(sensorGroup);
        return sensorGroup;
    }

    /**
     * 创建人员定位标记
     */
    createPersonnelMarkers() {
        const distribution = this.mineData.personnel?.distribution || [];
        
        distribution.forEach((zone, index) => {
            // 根据区域名称确定位置
            const positions = this.getZonePositions(zone.zone, zone.count);
            
            positions.forEach(pos => {
                const marker = new THREE.Mesh(
                    new THREE.SphereGeometry(0.3, 8, 8),
                    new THREE.MeshBasicMaterial({ 
                        color: parseInt(zone.color.replace('#', '0x')),
                        transparent: true,
                        opacity: 0.8
                    })
                );
                marker.position.set(pos.x, pos.y, pos.z);
                marker.userData.isPersonnel = true;
                this.personnelMarkers.push(marker);
                this.undergroundGroup.add(marker);
            });
        });
    }

    /**
     * 获取区域内的随机位置
     */
    getZonePositions(zoneName, count) {
        const positions = [];
        let baseX = 0, baseZ = 0;
        
        // 根据区域名称确定基础位置
        if (zoneName.includes('1101')) { baseX = -40; baseZ = 15; }
        else if (zoneName.includes('1102')) { baseX = -40; baseZ = -35; }
        else if (zoneName.includes('1103')) { baseX = 40; baseZ = 15; }
        else if (zoneName.includes('1104')) { baseX = 40; baseZ = -35; }
        else if (zoneName.includes('运输')) { baseX = 0; baseZ = 0; }
        else if (zoneName.includes('掘进')) { baseX = 0; baseZ = -20; }
        else { baseX = Math.random() * 40 - 20; baseZ = Math.random() * 20 - 10; }

        for (let i = 0; i < count; i++) {
            positions.push({
                x: baseX + (Math.random() - 0.5) * 15,
                y: 1.5 + Math.random() * 0.5,
                z: baseZ + (Math.random() - 0.5) * 8
            });
        }

        return positions;
    }

    /**
     * 设置UI
     */
    setupUI() {
        const controlsDiv = document.getElementById('scene-controls');
        if (!controlsDiv) return;

        controlsDiv.style.display = 'flex';
        controlsDiv.innerHTML = `
            <button class="control-btn active" id="btn-overview">
                <i class="fas fa-eye"></i> 俯瞰全景
            </button>
            <button class="control-btn" id="btn-underground">
                <i class="fas fa-level-down-alt"></i> 进入井下
            </button>
            <button class="control-btn" id="btn-workface">
                <i class="fas fa-hard-hat"></i> 工作面
            </button>
            <button class="control-btn" id="btn-safety">
                <i class="fas fa-shield-alt"></i> 安全监测
            </button>
            <button class="control-btn" id="btn-production">
                <i class="fas fa-chart-line"></i> 生产调度
            </button>
            <button class="control-btn" id="btn-alarm">
                <i class="fas fa-bell"></i> 报警演示
            </button>
            <button class="control-btn" id="btn-reset">
                <i class="fas fa-redo"></i> 重置
            </button>
            <button class="control-btn" id="btn-guide">
                <i class="fas fa-question-circle"></i> 说明
            </button>
        `;

        // 绑定事件
        document.getElementById('btn-overview')?.addEventListener('click', () => {
            this.switchView('overview');
            this.updateViewButtons('btn-overview');
        });
        document.getElementById('btn-underground')?.addEventListener('click', () => {
            this.switchView('underground');
            this.updateViewButtons('btn-underground');
        });
        document.getElementById('btn-workface')?.addEventListener('click', () => {
            this.switchView('workface');
            this.updateViewButtons('btn-workface');
        });
        document.getElementById('btn-safety')?.addEventListener('click', () => this.showSafetyPanel());
        document.getElementById('btn-production')?.addEventListener('click', () => this.showProductionPanel());
        document.getElementById('btn-alarm')?.addEventListener('click', () => this.triggerGasAlarm());
        document.getElementById('btn-reset')?.addEventListener('click', () => this.resetScene());
        document.getElementById('btn-guide')?.addEventListener('click', () => this.toggleTeachingPanel());
    }

    /**
     * 更新视图按钮状态
     */
    updateViewButtons(activeId) {
        ['btn-overview', 'btn-underground', 'btn-workface'].forEach(id => {
            const btn = document.getElementById(id);
            if (btn) btn.classList.toggle('active', id === activeId);
        });
    }

    /**
     * 切换视角
     */
    switchView(viewName) {
        const preset = this.cameraPresets[viewName];
        if (!preset) return;

        this.params.currentView = viewName;

        gsap.to(this.camera.position, {
            x: preset.pos.x,
            y: preset.pos.y,
            z: preset.pos.z,
            duration: 1.5,
            ease: 'power2.inOut'
        });

        // 更新层可见性
        if (this.surfaceGroup) {
            this.surfaceGroup.visible = viewName !== 'workface';
        }

        this.showGuide(this.getViewDescription(viewName));
    }

    /**
     * 获取视图描述
     */
    getViewDescription(viewName) {
        const descriptions = {
            overview: '🌍 矿区全景：可以看到地表设施、井架和运输系统',
            underground: '⛏️ 井下视角：查看巷道网络、工作面和运输系统',
            workface: '🔧 工作面视角：近距离观察采煤设备和支护系统'
        };
        return descriptions[viewName] || '';
    }

    /**
     * 创建教学面板
     */
    createTeachingPanel() {
        let panel = document.getElementById('mine-teaching-panel');
        if (panel) return;

        panel = document.createElement('div');
        panel.id = 'mine-teaching-panel';
        panel.style.cssText = `
            position: absolute;
            left: 20px;
            top: 80px;
            width: 300px;
            background: rgba(10, 22, 40, 0.95);
            border: 1px solid rgba(30, 144, 255, 0.3);
            border-radius: 12px;
            padding: 20px;
            color: #fff;
            font-size: 14px;
            z-index: 100;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
            max-height: calc(100vh - 200px);
            overflow-y: auto;
        `;

        panel.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                <div style="color: #1e90ff; font-size: 18px; font-weight: bold;">
                    <i class="fas fa-mountain"></i> 智慧煤矿
                </div>
                <button id="close-mine-teaching" style="background: none; border: none; color: #888; cursor: pointer; font-size: 16px;">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            
            <div style="background: rgba(30, 144, 255, 0.1); border-radius: 8px; padding: 12px; margin-bottom: 16px;">
                <div style="color: #1e90ff; font-size: 13px; margin-bottom: 8px;">
                    <i class="fas fa-info-circle"></i> 数字孪生系统
                </div>
                <div style="color: #e0e0e0; line-height: 1.6; font-size: 13px;">
                    实时展示矿山<span style="color: #00ff88;">安全监测</span>与<span style="color: #ffcc00;">生产调度</span>数据
                </div>
            </div>
            
            <div style="margin-bottom: 16px;">
                <div style="color: #1e90ff; font-size: 13px; margin-bottom: 8px;">
                    <i class="fas fa-layer-group"></i> 场景结构
                </div>
                <ul style="color: #aaa; line-height: 1.8; padding-left: 18px; margin: 0; font-size: 13px;">
                    <li><span style="color: #00ff88;">地表层</span>：井架、选煤厂、运输</li>
                    <li><span style="color: #4a90d9;">井下层</span>：巷道、工作面、皮带机</li>
                    <li><span style="color: #ff6b6b;">监测层</span>：瓦斯、人员、设备</li>
                </ul>
            </div>
            
            <div style="margin-bottom: 16px;">
                <div style="color: #ffcc00; font-size: 13px; margin-bottom: 8px;">
                    <i class="fas fa-hard-hat"></i> 4个采煤工作面
                </div>
                <div style="color: #aaa; line-height: 1.6; font-size: 13px;">
                    点击工作面查看<b>产量</b>、<b>人员</b>、<b>瓦斯</b>等实时数据
                </div>
            </div>
            
            <div style="background: rgba(255, 68, 68, 0.1); border-radius: 8px; padding: 12px;">
                <div style="color: #ff4444; font-size: 13px; margin-bottom: 6px;">
                    <i class="fas fa-exclamation-triangle"></i> 安全监测
                </div>
                <div style="color: #ccc; line-height: 1.6; font-size: 13px;">
                    点击<b>"报警演示"</b>模拟瓦斯超限报警流程
                </div>
            </div>
        `;

        document.getElementById('scene-canvas-container')?.appendChild(panel);
        
        document.getElementById('close-mine-teaching').onclick = () => {
            panel.style.display = 'none';
        };
    }

    /**
     * 切换教学面板
     */
    toggleTeachingPanel() {
        // 使用MobilePanelManager处理移动端面板切换
        if (window.MobilePanelManager) {
            window.MobilePanelManager.togglePanel('mine-teaching-panel');
        } else {
            const panel = document.getElementById('mine-teaching-panel');
            if (panel) {
                panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
            }
        }
    }

    /**
     * 创建数据面板
     */
    createDataPanel() {
        let panel = document.getElementById('mine-data-panel');
        if (panel) return;

        panel = document.createElement('div');
        panel.id = 'mine-data-panel';
        panel.style.cssText = `
            position: absolute;
            right: 20px;
            top: 80px;
            width: 280px;
            background: rgba(10, 22, 40, 0.95);
            border: 1px solid rgba(30, 144, 255, 0.3);
            border-radius: 12px;
            padding: 16px;
            color: #fff;
            font-size: 13px;
            z-index: 100;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
        `;

        document.getElementById('scene-canvas-container')?.appendChild(panel);
        this.updateDataPanel();
    }

    /**
     * 更新数据面板
     */
    updateDataPanel() {
        const panel = document.getElementById('mine-data-panel');
        if (!panel) return;

        const production = this.mineData.production || {};
        const personnel = this.mineData.personnel || {};
        const safety = this.mineData.safety || {};

        const warningCount = safety.gasSensors?.filter(s => s.status === 'warning').length || 0;

        panel.innerHTML = `
            <div style="color: #1e90ff; font-size: 16px; margin-bottom: 12px; font-weight: bold;">
                <i class="fas fa-chart-bar"></i> 实时数据
            </div>
            
            <!-- 生产数据 -->
            <div style="background: rgba(0, 255, 136, 0.1); padding: 12px; border-radius: 8px; margin-bottom: 12px;">
                <div style="color: #00ff88; font-size: 12px; margin-bottom: 8px;">
                    <i class="fas fa-industry"></i> 今日生产
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                    <span style="color: #888;">产量</span>
                    <span style="color: #fff; font-weight: bold;">${production.today?.output || 0} 吨</span>
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                    <span style="color: #888;">目标</span>
                    <span style="color: #888;">${production.today?.target || 0} 吨</span>
                </div>
                <div style="background: #333; height: 6px; border-radius: 3px; overflow: hidden;">
                    <div style="background: linear-gradient(90deg, #00ff88, #4ecdc4); height: 100%; width: ${production.today?.progress || 0}%;"></div>
                </div>
                <div style="text-align: right; color: #00ff88; font-size: 12px; margin-top: 4px;">
                    ${production.today?.progress || 0}%
                </div>
            </div>
            
            <!-- 人员分布 -->
            <div style="background: rgba(74, 144, 217, 0.1); padding: 12px; border-radius: 8px; margin-bottom: 12px;">
                <div style="color: #4a90d9; font-size: 12px; margin-bottom: 8px;">
                    <i class="fas fa-users"></i> 井下人员
                </div>
                <div style="text-align: center;">
                    <span style="font-size: 28px; font-weight: bold; color: #fff;">${personnel.totalUnderground || 0}</span>
                    <span style="color: #888; font-size: 12px;"> 人</span>
                </div>
            </div>
            
            <!-- 安全状态 -->
            <div style="background: rgba(${warningCount > 0 ? '255, 204, 0' : '0, 255, 136'}, 0.1); padding: 12px; border-radius: 8px;">
                <div style="color: ${warningCount > 0 ? '#ffcc00' : '#00ff88'}; font-size: 12px; margin-bottom: 8px;">
                    <i class="fas fa-shield-alt"></i> 安全状态
                </div>
                <div style="display: flex; justify-content: space-between;">
                    <span style="color: #888;">瓦斯预警</span>
                    <span style="color: ${warningCount > 0 ? '#ffcc00' : '#00ff88'}; font-weight: bold;">
                        ${warningCount > 0 ? warningCount + ' 处' : '正常'}
                    </span>
                </div>
                <div style="display: flex; justify-content: space-between; margin-top: 4px;">
                    <span style="color: #888;">设备状态</span>
                    <span style="color: #00ff88;">正常运行</span>
                </div>
            </div>
        `;
    }

    /**
     * 显示安全监测面板
     */
    showSafetyPanel() {
        const safety = this.mineData.safety || {};
        const gasSensors = safety.gasSensors || [];

        let content = '<div style="color: #ff4444; font-size: 16px; margin-bottom: 12px;"><i class="fas fa-shield-alt"></i> 安全监测详情</div>';
        
        gasSensors.forEach(sensor => {
            const statusColor = sensor.status === 'normal' ? '#00ff88' : sensor.status === 'warning' ? '#ffcc00' : '#ff4444';
            const percentage = (sensor.value / sensor.limit) * 100;
            
            content += `
                <div style="background: rgba(255,255,255,0.05); padding: 10px; border-radius: 8px; margin-bottom: 8px;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                        <span style="color: #fff;">${sensor.location}</span>
                        <span style="color: ${statusColor};">${sensor.value}%</span>
                    </div>
                    <div style="background: #333; height: 4px; border-radius: 2px; overflow: hidden;">
                        <div style="background: ${statusColor}; height: 100%; width: ${Math.min(percentage, 100)}%;"></div>
                    </div>
                </div>
            `;
        });

        this.showModal('安全监测', content);
    }

    /**
     * 显示生产调度面板
     */
    showProductionPanel() {
        const workfaces = this.mineData.workfaces || [];
        
        let content = '<div style="color: #00ff88; font-size: 16px; margin-bottom: 12px;"><i class="fas fa-chart-line"></i> 生产调度详情</div>';
        
        workfaces.forEach(wf => {
            const statusColor = wf.status === '作业中' ? '#00ff88' : wf.status === '检修' ? '#ffcc00' : '#888';
            
            content += `
                <div style="background: rgba(255,255,255,0.05); padding: 12px; border-radius: 8px; margin-bottom: 8px;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                        <span style="color: #fff; font-weight: bold;">${wf.name}</span>
                        <span style="color: ${statusColor};">${wf.status}</span>
                    </div>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 12px;">
                        <div><span style="color: #888;">日产量:</span> <span style="color: #fff;">${wf.dailyOutput} 吨</span></div>
                        <div><span style="color: #888;">进度:</span> <span style="color: #fff;">${wf.progress}%</span></div>
                        <div><span style="color: #888;">人员:</span> <span style="color: #fff;">${wf.personnel} 人</span></div>
                        <div><span style="color: #888;">瓦斯:</span> <span style="color: ${wf.gasLevel > 0.5 ? '#ffcc00' : '#00ff88'};">${wf.gasLevel}%</span></div>
                    </div>
                </div>
            `;
        });

        this.showModal('生产调度', content);
    }

    /**
     * 显示模态框
     */
    showModal(title, content) {
        let modal = document.getElementById('mine-modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'mine-modal';
            modal.style.cssText = `
                position: absolute;
                left: 50%;
                top: 50%;
                transform: translate(-50%, -50%);
                width: 400px;
                max-height: 80vh;
                background: rgba(10, 22, 40, 0.98);
                border: 1px solid rgba(30, 144, 255, 0.5);
                border-radius: 12px;
                padding: 20px;
                color: #fff;
                z-index: 200;
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.8);
                overflow-y: auto;
            `;
            document.getElementById('scene-canvas-container')?.appendChild(modal);
        }

        modal.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                <div style="color: #1e90ff; font-size: 18px; font-weight: bold;">${title}</div>
                <button id="close-mine-modal" style="background: none; border: none; color: #888; cursor: pointer; font-size: 18px;">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            ${content}
        `;
        
        modal.style.display = 'block';
        document.getElementById('close-mine-modal').onclick = () => {
            modal.style.display = 'none';
        };
    }

    /**
     * 触发瓦斯报警演示
     */
    triggerGasAlarm() {
        if (this.alarmActive) {
            this.stopAlarm();
            return;
        }

        this.alarmActive = true;
        this.showGuide('⚠️ 瓦斯超限报警演示开始！1104工作面瓦斯浓度超过预警值');

        // 找到1104工作面
        const workface = this.workfaceMeshes[3];
        if (workface) {
            // 闪烁动画
            this.alarmInterval = setInterval(() => {
                workface.traverse(child => {
                    if (child.material && child.material.color) {
                        const isRed = child.material.color.getHex() === 0xff0000;
                        child.material.color.setHex(isRed ? 0x2a4a2a : 0xff0000);
                    }
                });
            }, 500);
        }

        // 更新报警按钮
        const btn = document.getElementById('btn-alarm');
        if (btn) {
            btn.innerHTML = '<i class="fas fa-bell-slash"></i> 停止报警';
            btn.classList.add('active');
        }

        // 5秒后自动停止
        setTimeout(() => this.stopAlarm(), 5000);
    }

    /**
     * 停止报警
     */
    stopAlarm() {
        this.alarmActive = false;
        
        if (this.alarmInterval) {
            clearInterval(this.alarmInterval);
            this.alarmInterval = null;
        }

        // 恢复工作面颜色
        const workface = this.workfaceMeshes[3];
        if (workface) {
            workface.traverse(child => {
                if (child.material && child.material.color && child !== workface.children[0]) {
                    // 保持原色
                }
            });
        }

        // 恢复按钮
        const btn = document.getElementById('btn-alarm');
        if (btn) {
            btn.innerHTML = '<i class="fas fa-bell"></i> 报警演示';
            btn.classList.remove('active');
        }

        this.showGuide('✅ 报警演示结束，系统恢复正常');
    }

    /**
     * 重置场景
     */
    resetScene() {
        this.stopAlarm();
        this.switchView('overview');
        this.updateViewButtons('btn-overview');
        this.showGuide('🔄 场景已重置');
    }

    /**
     * 显示引导消息
     */
    showGuide(message) {
        const container = document.getElementById('scene-canvas-container');
        if (!container) return;

        const oldGuide = container.querySelector('.mine-guide-message');
        if (oldGuide) oldGuide.remove();

        const guide = document.createElement('div');
        guide.className = 'mine-guide-message';
        guide.innerHTML = message;
        guide.style.cssText = `
            position: absolute;
            bottom: 100px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(30, 144, 255, 0.15);
            border: 1px solid rgba(30, 144, 255, 0.4);
            padding: 12px 24px;
            border-radius: 8px;
            color: #1e90ff;
            font-size: 14px;
            z-index: 100;
            opacity: 0;
            transition: opacity 0.3s;
            max-width: 600px;
            text-align: center;
        `;
        container.appendChild(guide);

        setTimeout(() => guide.style.opacity = '1', 100);
        setTimeout(() => {
            guide.style.opacity = '0';
            setTimeout(() => guide.remove(), 300);
        }, 4000);
    }

    /**
     * 显示初始引导
     */
    showInitialGuide() {
        setTimeout(() => {
            this.showGuide('🏭 欢迎来到智慧煤矿数字孪生系统，点击设施查看详情');
        }, 1000);
    }

    /**
     * 动画循环
     */
    animate(time, delta) {
        if (!this.params.isRunning) return;

        // 矿卡动画
        this.animateTrucks(time);

        // 皮带运输动画
        this.animateConveyor(time);

        // 人员标记浮动
        this.animatePersonnel(time);

        // 定期更新数据面板
        if (Math.floor(time / 2000) !== this._lastDataUpdate) {
            this._lastDataUpdate = Math.floor(time / 2000);
            this.updateDataPanel();
        }
    }

    /**
     * 矿卡动画
     */
    animateTrucks(time) {
        this.trucks.forEach(truck => {
            truck.userData.progress += truck.userData.speed * truck.userData.direction;
            
            if (truck.userData.progress > 1) {
                truck.userData.progress = 1;
                truck.userData.direction = -1;
            } else if (truck.userData.progress < 0) {
                truck.userData.progress = 0;
                truck.userData.direction = 1;
            }

            // 沿主干道移动
            const x = -40 + truck.userData.progress * 80;
            truck.position.set(x, 0, 20);
            truck.rotation.y = truck.userData.direction > 0 ? 0 : Math.PI;
        });
    }

    /**
     * 皮带运输动画
     */
    animateConveyor(time) {
        this.conveyorParticles.forEach(particle => {
            particle.userData.progress += particle.userData.speed;
            if (particle.userData.progress > 1) {
                particle.userData.progress = 0;
            }

            const x = -45 + particle.userData.progress * 90;
            particle.position.set(x, 0.5, 0);
        });
    }

    /**
     * 人员标记动画
     */
    animatePersonnel(time) {
        this.personnelMarkers.forEach((marker, index) => {
            // 轻微浮动
            marker.position.y = 1.5 + Math.sin(time * 0.002 + index * 0.5) * 0.2;
        });
    }

    /**
     * 获取可交互对象
     */
    getInteractables() {
        return this.interactables;
    }

    /**
     * 销毁场景
     */
    dispose() {
        this.stopAlarm();

        // 清理UI
        ['mine-teaching-panel', 'mine-data-panel', 'mine-modal'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.remove();
        });

        // 清理场景对象
        if (this.mainGroup) {
            this.mainGroup.traverse(child => {
                if (child.geometry) child.geometry.dispose();
                if (child.material) {
                    if (Array.isArray(child.material)) {
                        child.material.forEach(m => m.dispose());
                    } else {
                        child.material.dispose();
                    }
                }
            });
            this.scene.remove(this.mainGroup);
        }

        this.interactables = [];
        this.trucks = [];
        this.conveyorParticles = [];
        this.gasSensors = [];
        this.personnelMarkers = [];
        this.workfaceMeshes = [];
    }
};
