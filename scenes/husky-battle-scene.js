/**
 * 双犬奇缘 - Husky Battle Game
 * ============================================
 * 一个类魂系风格的第一人称战斗游戏
 * 
 * 玩法：
 * - 阶段1：投掷石头分离两只"连体"哈士奇
 * - 阶段2：与分离后的狗狗战斗
 * 
 * 控制：
 * - WASD: 移动
 * - 鼠标: 瞄准
 * - 左键: 攻击/投掷
 * - Q: 盾牌弹反
 * - 空格: 翻滚闪避
 * - 1/2: 切换武器
 * ============================================
 */
window.HuskyBattleScene = class HuskyBattleScene {
    constructor(scene, camera, renderer) {
        this.scene = scene;
        this.camera = camera;
        this.renderer = renderer;

        this.mainGroup = null;
        this.interactables = [];

        // 游戏状态
        this.gameState = 'intro';  // intro, phase1, phase2, victory, defeat
        this.difficulty = 'normal';  // easy, normal, hard
        this.isPaused = false;

        // 玩家属性
        this.player = {
            hp: 100,
            maxHp: 100,
            stamina: 100,
            maxStamina: 100,
            position: new THREE.Vector3(0, 1.6, 15),
            velocity: new THREE.Vector3(),
            rotationY: 0,
            rotationX: 0,
            // 道具
            stones: 20,
            sticks: 2,
            // 状态
            isBlocking: false,
            canParry: true,
            parryCD: 0,
            isRolling: false,
            rollCD: 0,
            selectedWeapon: 'stone',  // stone, stick
            isInvincible: false,
            throwPower: 0,
            isCharging: false
        };

        // 狗狗属性
        this.huskies = {
            connected: true,
            headHits: 0,
            bodyHits: 0,
            dogs: [
                { hp: 80, maxHp: 80, state: 'idle', attackCD: 0 },
                { hp: 80, maxHp: 80, state: 'idle', attackCD: 0 }
            ],
            position: new THREE.Vector3(-8, 0, -5),
            hipSwayPhase: 0,
            hipSwaySpeed: 1.5
        };

        // 难度设置
        this.difficultySettings = {
            easy: { playerDamage: 1.5, enemyDamage: 0.7, parryWindow: 500, staminaRegen: 2 },
            normal: { playerDamage: 1.0, enemyDamage: 1.0, parryWindow: 300, staminaRegen: 1.5 },
            hard: { playerDamage: 0.8, enemyDamage: 1.5, parryWindow: 200, staminaRegen: 1 }
        };

        // 投掷物
        this.projectiles = [];

        // 输入状态
        this.keys = {};
        this.isPointerLocked = false;

        // 时间
        this.time = 0;

        // 默认相机
        this.defaultCameraPos = { x: 0, y: 1.6, z: 15 };
    }

    /**
     * 初始化
     */
    init() {
        console.log('HuskyBattleScene init started');

        // 相机设置
        this.camera.position.copy(this.player.position);
        this.camera.rotation.order = 'YXZ';
        this.camera.rotation.set(0, 0, 0);

        // 背景 - 浅蓝天空
        this.scene.background = new THREE.Color(0x87ceeb);
        this.scene.fog = new THREE.Fog(0x87ceeb, 50, 150);

        // 主组
        this.mainGroup = new THREE.Group();
        this.scene.add(this.mainGroup);

        // 光照
        this.setupLights();

        // 场景
        this.createGrassland();
        this.createTree(-12, -10);
        this.createRock(-8, -8);
        this.createDistantTrees();

        // 创建狗狗
        this.createHuskies();

        // 创建UI
        this.createGameUI();

        // 输入监听
        this.setupInputListeners();

        console.log('HuskyBattleScene init completed');
    }

    /**
     * 设置光照
     */
    setupLights() {
        // 环境光
        const ambient = new THREE.AmbientLight(0xffffff, 0.7);
        this.scene.add(ambient);

        // 太阳光
        const sun = new THREE.DirectionalLight(0xffffee, 0.9);
        sun.position.set(50, 100, 50);
        sun.castShadow = true;
        this.scene.add(sun);

        // 半球光
        const hemi = new THREE.HemisphereLight(0xffffbb, 0x080820, 0.4);
        this.scene.add(hemi);
    }

    /**
     * 创建草地 - 自然绿色小草
     */
    createGrassland() {
        // 主地面
        const groundGeom = new THREE.PlaneGeometry(200, 200, 100, 100);
        const groundMat = new THREE.MeshStandardMaterial({
            color: 0x228b22,  // 森林绿
            roughness: 0.9
        });

        // 轻微起伏
        const positions = groundGeom.attributes.position;
        for (let i = 0; i < positions.count; i++) {
            const x = positions.getX(i);
            const y = positions.getY(i);
            const z = Math.sin(x * 0.05) * 0.3 + Math.cos(y * 0.05) * 0.3 + Math.random() * 0.1;
            positions.setZ(i, z);
        }
        groundGeom.computeVertexNormals();

        const ground = new THREE.Mesh(groundGeom, groundMat);
        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = true;
        this.mainGroup.add(ground);

        // 小草 - 使用锥形几何体模拟
        const grassColors = [0x228b22, 0x32cd32, 0x2e8b57, 0x3cb371, 0x00fa9a];
        
        for (let i = 0; i < 2000; i++) {
            const x = (Math.random() - 0.5) * 100;
            const z = (Math.random() - 0.5) * 100;
            
            // 避开玩家出生点
            if (Math.abs(x) < 3 && z > 12 && z < 18) continue;
            
            const grassHeight = 0.2 + Math.random() * 0.3;
            const grassBlade = new THREE.Mesh(
                new THREE.ConeGeometry(0.03, grassHeight, 4),
                new THREE.MeshStandardMaterial({ 
                    color: grassColors[Math.floor(Math.random() * grassColors.length)]
                })
            );
            grassBlade.position.set(x, grassHeight / 2, z);
            grassBlade.rotation.x = (Math.random() - 0.5) * 0.2;
            grassBlade.rotation.z = (Math.random() - 0.5) * 0.2;
            this.mainGroup.add(grassBlade);
        }
    }

    /**
     * 创建大树
     */
    createTree(x, z) {
        const treeGroup = new THREE.Group();

        // 树干 - 用圆柱体
        const trunkGeom = new THREE.CylinderGeometry(0.6, 1, 5, 12);
        const trunkMat = new THREE.MeshStandardMaterial({ color: 0x8b4513 });
        const trunk = new THREE.Mesh(trunkGeom, trunkMat);
        trunk.position.y = 2.5;
        trunk.castShadow = true;
        treeGroup.add(trunk);

        // 树冠 - 多层球体
        const crownMat = new THREE.MeshStandardMaterial({ color: 0x228b22 });
        for (let i = 0; i < 3; i++) {
            const crownGeom = new THREE.SphereGeometry(3.5 - i * 0.6, 12, 12);
            const crown = new THREE.Mesh(crownGeom, crownMat);
            crown.position.y = 6 + i * 1.5;
            crown.scale.y = 0.8;
            crown.castShadow = true;
            treeGroup.add(crown);
        }

        treeGroup.position.set(x, 0, z);
        this.mainGroup.add(treeGroup);
        this.tree = treeGroup;
    }

    /**
     * 创建大石头
     */
    createRock(x, z) {
        const rockGroup = new THREE.Group();

        // 主石头
        const rockGeom = new THREE.DodecahedronGeometry(2.5, 1);
        const rockMat = new THREE.MeshStandardMaterial({ 
            color: 0x696969,
            roughness: 0.95
        });
        const rock = new THREE.Mesh(rockGeom, rockMat);
        rock.position.y = 1.2;
        rock.scale.set(1, 0.6, 1);
        rock.rotation.y = Math.random() * Math.PI;
        rock.castShadow = true;
        rockGroup.add(rock);

        // 小石头
        for (let i = 0; i < 4; i++) {
            const smallRock = new THREE.Mesh(
                new THREE.DodecahedronGeometry(0.4 + Math.random() * 0.3, 0),
                rockMat
            );
            smallRock.position.set(
                (Math.random() - 0.5) * 4,
                0.2,
                (Math.random() - 0.5) * 4
            );
            smallRock.rotation.set(Math.random(), Math.random(), Math.random());
            rockGroup.add(smallRock);
        }

        rockGroup.position.set(x, 0, z);
        this.mainGroup.add(rockGroup);
        this.rock = rockGroup;
    }

    /**
     * 远处的树
     */
    createDistantTrees() {
        const treeMat = new THREE.MeshStandardMaterial({ color: 0x228b22 });
        const trunkMat = new THREE.MeshStandardMaterial({ color: 0x8b4513 });

        for (let i = 0; i < 30; i++) {
            const angle = (i / 30) * Math.PI * 2;
            const dist = 40 + Math.random() * 20;
            const x = Math.cos(angle) * dist;
            const z = Math.sin(angle) * dist;

            const tree = new THREE.Group();
            
            const trunk = new THREE.Mesh(
                new THREE.CylinderGeometry(0.2, 0.3, 2),
                trunkMat
            );
            trunk.position.y = 1;
            tree.add(trunk);

            const crown = new THREE.Mesh(
                new THREE.ConeGeometry(1.5, 3, 8),
                treeMat
            );
            crown.position.y = 3.5;
            tree.add(crown);

            tree.position.set(x, 0, z);
            this.mainGroup.add(tree);
        }
    }

    /**
     * 创建哈士奇狗狗
     */
    createHuskies() {
        console.log('Creating huskies...');
        
        this.huskyGroup = new THREE.Group();

        // 创建两只狗 - 臀部相连的位置
        this.dog1 = this.createRealisticHusky('left');
        this.dog2 = this.createRealisticHusky('right');

        // 位置（臀部快要连接）- 面朝外，屁股朝内
        this.dog1.position.set(-0.6, 0, 0);
        this.dog1.rotation.y = Math.PI / 4;  // 斜向外
        
        this.dog2.position.set(0.6, 0, 0);
        this.dog2.rotation.y = -Math.PI / 4;  // 斜向外

        this.huskyGroup.add(this.dog1);
        this.huskyGroup.add(this.dog2);

        // 大芭蕉叶（遮挡连接处）
        this.bananaLeaf = this.createLargeBananaLeaf();
        this.bananaLeaf.position.set(0, 0.55, -0.2);
        this.huskyGroup.add(this.bananaLeaf);

        // 初始位置
        this.huskyGroup.position.copy(this.huskies.position);
        this.mainGroup.add(this.huskyGroup);

        // 初始化动画参数
        this.dogAnimState = {
            breathPhase: 0,
            headBobPhase: 0,
            tailWagPhase: 0,
            legWalkPhase: 0,
            hipSwayPhase: 0,
            isWalking: false,
            alertLevel: 0  // 0-1, 发现玩家时增加
        };

        console.log('Huskies created at:', this.huskyGroup.position);
    }

    /**
     * 创建真实的哈士奇模型
     */
    createRealisticHusky(side) {
        const dog = new THREE.Group();

        // 哈士奇经典配色
        const colors = {
            white: 0xf5f5f5,       // 白色（腹部、脸部）
            gray: 0x708090,        // 灰色（背部主色）
            darkGray: 0x4a4a4a,    // 深灰色（背部条纹）
            black: 0x1a1a1a,       // 黑色（鼻子、眼眶）
            skin: 0xffb6c1,        // 粉色（舌头、内耳）
            eyeBlue: 0x4169e1      // 蓝色眼睛
        };

        // === 身体主体 ===
        // 躯干 - 椭圆形
        const torsoGeom = new THREE.SphereGeometry(1, 20, 16);
        const torsoMat = new THREE.MeshStandardMaterial({ 
            color: colors.gray,
            roughness: 0.8
        });
        const torso = new THREE.Mesh(torsoGeom, torsoMat);
        torso.scale.set(1.4, 0.8, 0.7);
        torso.position.set(0, 0.7, 0);
        torso.castShadow = true;
        dog.add(torso);
        dog.userData.torso = torso;

        // 腹部（白色）
        const bellyGeom = new THREE.SphereGeometry(0.85, 16, 12);
        const whiteMat = new THREE.MeshStandardMaterial({ 
            color: colors.white,
            roughness: 0.85
        });
        const belly = new THREE.Mesh(bellyGeom, whiteMat);
        belly.scale.set(1.2, 0.5, 0.55);
        belly.position.set(0, 0.5, 0);
        dog.add(belly);

        // 背部深色条纹
        const backGeom = new THREE.SphereGeometry(0.7, 12, 10);
        const darkMat = new THREE.MeshStandardMaterial({ 
            color: colors.darkGray,
            roughness: 0.75
        });
        const back = new THREE.Mesh(backGeom, darkMat);
        back.scale.set(1.3, 0.4, 0.5);
        back.position.set(0, 0.95, 0);
        dog.add(back);

        // === 臀部（重要 - 连接点）===
        const hipGeom = new THREE.SphereGeometry(0.5, 12, 10);
        const hip = new THREE.Mesh(hipGeom, torsoMat);
        hip.scale.set(0.8, 0.85, 0.9);
        hip.position.set(-0.9, 0.65, 0);
        dog.add(hip);
        dog.userData.hip = hip;

        // === 头部组 ===
        const headGroup = new THREE.Group();
        headGroup.position.set(1.1, 0.9, 0);
        dog.add(headGroup);
        dog.userData.headGroup = headGroup;

        // 头颅
        const skullGeom = new THREE.SphereGeometry(0.4, 16, 14);
        const skull = new THREE.Mesh(skullGeom, torsoMat);
        skull.scale.set(1.1, 1, 0.95);
        headGroup.add(skull);

        // 脸部白色
        const faceGeom = new THREE.SphereGeometry(0.35, 12, 10);
        const face = new THREE.Mesh(faceGeom, whiteMat);
        face.scale.set(0.9, 0.8, 0.85);
        face.position.set(0.1, -0.05, 0);
        headGroup.add(face);

        // 头顶深色
        const topHeadGeom = new THREE.SphereGeometry(0.3, 10, 8);
        const topHead = new THREE.Mesh(topHeadGeom, darkMat);
        topHead.scale.set(1, 0.5, 0.9);
        topHead.position.set(-0.05, 0.2, 0);
        headGroup.add(topHead);

        // 口鼻部
        const snoutGeom = new THREE.SphereGeometry(0.22, 12, 10);
        const snout = new THREE.Mesh(snoutGeom, whiteMat);
        snout.scale.set(1.3, 0.8, 0.85);
        snout.position.set(0.35, -0.1, 0);
        headGroup.add(snout);
        dog.userData.snout = snout;

        // 鼻子
        const noseGeom = new THREE.SphereGeometry(0.08, 8, 8);
        const noseMat = new THREE.MeshStandardMaterial({ 
            color: colors.black,
            roughness: 0.3
        });
        const nose = new THREE.Mesh(noseGeom, noseMat);
        nose.scale.set(1.2, 0.9, 1);
        nose.position.set(0.55, -0.08, 0);
        headGroup.add(nose);

        // 眼睛
        const eyeGeom = new THREE.SphereGeometry(0.08, 10, 10);
        const eyeMat = new THREE.MeshStandardMaterial({ 
            color: colors.eyeBlue,
            emissive: colors.eyeBlue,
            emissiveIntensity: 0.15
        });

        const eyeL = new THREE.Mesh(eyeGeom, eyeMat);
        eyeL.position.set(0.2, 0.08, 0.18);
        headGroup.add(eyeL);
        dog.userData.eyeL = eyeL;

        const eyeR = new THREE.Mesh(eyeGeom, eyeMat);
        eyeR.position.set(0.2, 0.08, -0.18);
        headGroup.add(eyeR);
        dog.userData.eyeR = eyeR;

        // 瞳孔
        const pupilGeom = new THREE.SphereGeometry(0.04, 6, 6);
        const pupilMat = new THREE.MeshBasicMaterial({ color: 0x000000 });

        const pupilL = new THREE.Mesh(pupilGeom, pupilMat);
        pupilL.position.set(0.26, 0.08, 0.18);
        headGroup.add(pupilL);

        const pupilR = new THREE.Mesh(pupilGeom, pupilMat);
        pupilR.position.set(0.26, 0.08, -0.18);
        headGroup.add(pupilR);

        // 眼眶深色
        const eyeRimGeom = new THREE.TorusGeometry(0.09, 0.02, 8, 16);
        const eyeRimMat = new THREE.MeshStandardMaterial({ color: colors.darkGray });

        const rimL = new THREE.Mesh(eyeRimGeom, eyeRimMat);
        rimL.position.set(0.2, 0.08, 0.18);
        rimL.rotation.y = Math.PI / 2;
        headGroup.add(rimL);

        const rimR = new THREE.Mesh(eyeRimGeom, eyeRimMat);
        rimR.position.set(0.2, 0.08, -0.18);
        rimR.rotation.y = Math.PI / 2;
        headGroup.add(rimR);

        // 耳朵 - 三角竖耳
        const earGeom = new THREE.ConeGeometry(0.12, 0.25, 4);
        const earMat = new THREE.MeshStandardMaterial({ color: colors.darkGray });

        const earL = new THREE.Mesh(earGeom, earMat);
        earL.position.set(-0.1, 0.35, 0.2);
        earL.rotation.x = 0.15;
        earL.rotation.z = 0.1;
        headGroup.add(earL);
        dog.userData.earL = earL;

        const earR = new THREE.Mesh(earGeom, earMat);
        earR.position.set(-0.1, 0.35, -0.2);
        earR.rotation.x = -0.15;
        earR.rotation.z = 0.1;
        headGroup.add(earR);
        dog.userData.earR = earR;

        // 内耳粉色
        const innerEarGeom = new THREE.ConeGeometry(0.06, 0.12, 4);
        const innerEarMat = new THREE.MeshStandardMaterial({ color: colors.skin });

        const innerEarL = new THREE.Mesh(innerEarGeom, innerEarMat);
        innerEarL.position.set(-0.08, 0.32, 0.2);
        innerEarL.rotation.x = 0.15;
        headGroup.add(innerEarL);

        const innerEarR = new THREE.Mesh(innerEarGeom, innerEarMat);
        innerEarR.position.set(-0.08, 0.32, -0.2);
        innerEarR.rotation.x = -0.15;
        headGroup.add(innerEarR);

        // === 腿部 ===
        const createLeg = (x, z, isFront) => {
            const legGroup = new THREE.Group();
            
            // 大腿
            const upperLegGeom = new THREE.CylinderGeometry(0.1, 0.08, 0.4, 8);
            const legMat = new THREE.MeshStandardMaterial({ color: colors.gray });
            const upperLeg = new THREE.Mesh(upperLegGeom, legMat);
            upperLeg.position.y = -0.2;
            legGroup.add(upperLeg);

            // 小腿
            const lowerLegGeom = new THREE.CylinderGeometry(0.07, 0.06, 0.35, 8);
            const lowerLeg = new THREE.Mesh(lowerLegGeom, whiteMat);
            lowerLeg.position.y = -0.5;
            legGroup.add(lowerLeg);

            // 脚掌
            const pawGeom = new THREE.SphereGeometry(0.08, 8, 6);
            const paw = new THREE.Mesh(pawGeom, whiteMat);
            paw.scale.set(1, 0.6, 1.2);
            paw.position.y = -0.68;
            legGroup.add(paw);

            legGroup.position.set(x, 0.7, z);
            return legGroup;
        };

        // 四条腿
        const legFL = createLeg(0.5, 0.25, true);
        dog.add(legFL);
        dog.userData.legFL = legFL;

        const legFR = createLeg(0.5, -0.25, true);
        dog.add(legFR);
        dog.userData.legFR = legFR;

        const legBL = createLeg(-0.7, 0.28, false);
        dog.add(legBL);
        dog.userData.legBL = legBL;

        const legBR = createLeg(-0.7, -0.28, false);
        dog.add(legBR);
        dog.userData.legBR = legBR;

        // === 尾巴 ===
        const tailGroup = new THREE.Group();
        tailGroup.position.set(-1.1, 0.8, 0);
        dog.add(tailGroup);
        dog.userData.tailGroup = tailGroup;

        // 尾巴根部
        const tailBaseGeom = new THREE.CylinderGeometry(0.08, 0.1, 0.3, 8);
        const tailBase = new THREE.Mesh(tailBaseGeom, torsoMat);
        tailBase.rotation.z = Math.PI / 3;
        tailGroup.add(tailBase);

        // 尾巴中段
        const tailMidGeom = new THREE.CylinderGeometry(0.05, 0.08, 0.25, 8);
        const tailMid = new THREE.Mesh(tailMidGeom, torsoMat);
        tailMid.position.set(-0.2, 0.2, 0);
        tailMid.rotation.z = Math.PI / 2.5;
        tailGroup.add(tailMid);

        // 尾巴尖（蓬松）
        const tailTipGeom = new THREE.SphereGeometry(0.1, 8, 8);
        const tailTip = new THREE.Mesh(tailTipGeom, whiteMat);
        tailTip.scale.set(1.5, 1, 1);
        tailTip.position.set(-0.35, 0.35, 0);
        tailGroup.add(tailTip);

        // 整体缩放
        dog.scale.set(0.9, 0.9, 0.9);

        // 记录初始状态用于动画
        dog.userData.baseHeadY = headGroup.position.y;
        dog.userData.baseTorsoY = torso.position.y;
        dog.userData.side = side;

        return dog;
    }

    /**
     * 创建大芭蕉叶 - 足够遮挡连接处
     */
    createLargeBananaLeaf() {
        const leafGroup = new THREE.Group();

        // 主叶片 - 大且自然弯曲的形状
        const leafColor = 0x2d8a2d;
        const leafMat = new THREE.MeshStandardMaterial({
            color: leafColor,
            side: THREE.DoubleSide,
            roughness: 0.7
        });

        // 叶片主体（用多个椭球组合）
        const mainLeafGeom = new THREE.SphereGeometry(0.8, 16, 12);
        const mainLeaf = new THREE.Mesh(mainLeafGeom, leafMat);
        mainLeaf.scale.set(1.8, 0.08, 1);
        mainLeaf.rotation.x = Math.PI / 10;
        leafGroup.add(mainLeaf);

        // 叶片边缘（略卷曲）
        const edgeGeom = new THREE.SphereGeometry(0.5, 12, 8);
        const edge1 = new THREE.Mesh(edgeGeom, leafMat);
        edge1.scale.set(0.8, 0.05, 0.6);
        edge1.position.set(0.8, 0.05, 0.4);
        edge1.rotation.z = -0.2;
        leafGroup.add(edge1);

        const edge2 = new THREE.Mesh(edgeGeom, leafMat);
        edge2.scale.set(0.8, 0.05, 0.6);
        edge2.position.set(0.8, 0.05, -0.4);
        edge2.rotation.z = -0.2;
        leafGroup.add(edge2);

        // 叶脉
        const veinGeom = new THREE.CylinderGeometry(0.03, 0.02, 1.4, 6);
        const veinMat = new THREE.MeshStandardMaterial({ color: 0x1a6b1a });
        const mainVein = new THREE.Mesh(veinGeom, veinMat);
        mainVein.rotation.z = Math.PI / 2;
        mainVein.position.set(0, 0.05, 0);
        leafGroup.add(mainVein);

        // 侧脉
        for (let i = -3; i <= 3; i++) {
            if (i === 0) continue;
            const sideVein = new THREE.Mesh(
                new THREE.CylinderGeometry(0.015, 0.01, 0.5, 4),
                veinMat
            );
            sideVein.position.set(i * 0.2, 0.04, 0);
            sideVein.rotation.x = Math.PI / 2;
            sideVein.rotation.z = i > 0 ? 0.4 : -0.4;
            leafGroup.add(sideVein);
        }

        // 叶柄
        const stemGeom = new THREE.CylinderGeometry(0.04, 0.05, 0.4, 6);
        const stem = new THREE.Mesh(stemGeom, veinMat);
        stem.position.set(-0.9, -0.1, 0);
        stem.rotation.z = Math.PI / 4;
        leafGroup.add(stem);

        return leafGroup;
    }

    /**
     * 创建游戏UI
     */
    createGameUI() {
        // 移除旧UI
        let ui = document.getElementById('game-ui');
        if (ui) ui.remove();

        // 隐藏默认控制栏
        const controlsDiv = document.getElementById('scene-controls');
        if (controlsDiv) controlsDiv.style.display = 'none';

        ui = document.createElement('div');
        ui.id = 'game-ui';
        ui.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            pointer-events: none;
            font-family: 'Arial', sans-serif;
            z-index: 100;
        `;

        ui.innerHTML = `
            <!-- 顶部状态栏 -->
            <div id="status-bar" style="
                position: absolute;
                top: 20px;
                left: 20px;
                background: rgba(0,0,0,0.7);
                padding: 15px 20px;
                border-radius: 10px;
                color: white;
                pointer-events: auto;
                border: 1px solid rgba(255,255,255,0.1);
            ">
                <div style="margin-bottom: 10px; display: flex; align-items: center; gap: 10px;">
                    <span style="color: #ff6b6b; font-size: 16px;">❤️ HP</span>
                    <div style="
                        width: 150px;
                        height: 18px;
                        background: #333;
                        border-radius: 9px;
                        overflow: hidden;
                        border: 1px solid #555;
                    ">
                        <div id="hp-fill" style="
                            width: 100%;
                            height: 100%;
                            background: linear-gradient(90deg, #ff4444, #ff6b6b);
                            transition: width 0.3s;
                        "></div>
                    </div>
                    <span id="hp-text" style="font-size: 14px; min-width: 60px;">100/100</span>
                </div>
                <div style="display: flex; align-items: center; gap: 10px;">
                    <span style="color: #4ecdc4; font-size: 16px;">⚡ SP</span>
                    <div style="
                        width: 150px;
                        height: 14px;
                        background: #333;
                        border-radius: 7px;
                        overflow: hidden;
                        border: 1px solid #555;
                    ">
                        <div id="sp-fill" style="
                            width: 100%;
                            height: 100%;
                            background: linear-gradient(90deg, #00b894, #4ecdc4);
                            transition: width 0.3s;
                        "></div>
                    </div>
                </div>
            </div>

            <!-- 难度显示 -->
            <div id="difficulty-display" style="
                position: absolute;
                top: 20px;
                right: 20px;
                background: rgba(0,0,0,0.7);
                padding: 12px 18px;
                border-radius: 10px;
                color: white;
                pointer-events: auto;
                border: 1px solid rgba(255,255,255,0.1);
            ">
                难度: <span id="difficulty-text" style="color: #ffd700;">⭐⭐ 普通</span>
                <button id="btn-difficulty" style="
                    margin-left: 12px;
                    padding: 6px 12px;
                    background: linear-gradient(135deg, #667eea, #764ba2);
                    border: none;
                    border-radius: 5px;
                    color: white;
                    cursor: pointer;
                    font-size: 12px;
                ">切换</button>
            </div>

            <!-- 准星 -->
            <div id="crosshair" style="
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                width: 30px;
                height: 30px;
                pointer-events: none;
            ">
                <div style="
                    position: absolute;
                    top: 50%;
                    left: 0;
                    width: 12px;
                    height: 2px;
                    background: rgba(255,255,255,0.9);
                    transform: translateY(-50%);
                    box-shadow: 0 0 3px rgba(0,0,0,0.5);
                "></div>
                <div style="
                    position: absolute;
                    top: 50%;
                    right: 0;
                    width: 12px;
                    height: 2px;
                    background: rgba(255,255,255,0.9);
                    transform: translateY(-50%);
                    box-shadow: 0 0 3px rgba(0,0,0,0.5);
                "></div>
                <div style="
                    position: absolute;
                    left: 50%;
                    top: 0;
                    width: 2px;
                    height: 12px;
                    background: rgba(255,255,255,0.9);
                    transform: translateX(-50%);
                    box-shadow: 0 0 3px rgba(0,0,0,0.5);
                "></div>
                <div style="
                    position: absolute;
                    left: 50%;
                    bottom: 0;
                    width: 2px;
                    height: 12px;
                    background: rgba(255,255,255,0.9);
                    transform: translateX(-50%);
                    box-shadow: 0 0 3px rgba(0,0,0,0.5);
                "></div>
            </div>

            <!-- 敌人状态 -->
            <div id="enemy-status" style="
                position: absolute;
                top: 110px;
                left: 50%;
                transform: translateX(-50%);
                display: none;
                background: rgba(0,0,0,0.75);
                padding: 12px 25px;
                border-radius: 10px;
                color: white;
                text-align: center;
                border: 1px solid rgba(255,100,100,0.3);
            ">
                <div style="display: flex; gap: 30px;">
                    <div>
                        <div style="margin-bottom: 5px; font-size: 13px;">🐕 哈士奇 A</div>
                        <div style="width: 100px; height: 10px; background: #333; border-radius: 5px; overflow: hidden;">
                            <div id="dog1-hp-fill" style="width: 100%; height: 100%; background: #ff6b6b; transition: width 0.3s;"></div>
                        </div>
                    </div>
                    <div>
                        <div style="margin-bottom: 5px; font-size: 13px;">🐕 哈士奇 B</div>
                        <div style="width: 100px; height: 10px; background: #333; border-radius: 5px; overflow: hidden;">
                            <div id="dog2-hp-fill" style="width: 100%; height: 100%; background: #ff6b6b; transition: width 0.3s;"></div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- 底部道具栏 -->
            <div id="inventory-bar" style="
                position: absolute;
                bottom: 30px;
                left: 50%;
                transform: translateX(-50%);
                display: flex;
                gap: 12px;
                background: rgba(0,0,0,0.8);
                padding: 15px 25px;
                border-radius: 15px;
                pointer-events: auto;
                border: 1px solid rgba(255,255,255,0.15);
            ">
                <div id="slot-stone" class="inventory-slot" data-weapon="stone" style="
                    width: 65px;
                    height: 65px;
                    background: rgba(255,215,0,0.15);
                    border: 3px solid #ffd700;
                    border-radius: 10px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    color: white;
                    transition: all 0.2s;
                ">
                    <span style="font-size: 26px;">🪨</span>
                    <span id="stone-count" style="font-size: 13px; font-weight: bold;">x20</span>
                    <span style="font-size: 10px; color: #aaa;">[1]</span>
                </div>
                <div id="slot-stick" class="inventory-slot" data-weapon="stick" style="
                    width: 65px;
                    height: 65px;
                    background: rgba(255,255,255,0.05);
                    border: 2px solid #666;
                    border-radius: 10px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    color: white;
                    transition: all 0.2s;
                ">
                    <span style="font-size: 26px;">🪵</span>
                    <span id="stick-count" style="font-size: 13px;">x2</span>
                    <span style="font-size: 10px; color: #aaa;">[2]</span>
                </div>
                <div style="width: 2px; background: #444; margin: 5px 0;"></div>
                <div id="slot-shield" style="
                    width: 65px;
                    height: 65px;
                    background: rgba(78,205,196,0.1);
                    border: 2px solid #4ecdc4;
                    border-radius: 10px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    color: white;
                    transition: all 0.2s;
                ">
                    <span style="font-size: 26px;">🛡️</span>
                    <span id="shield-status" style="font-size: 11px; color: #4ecdc4;">可用</span>
                    <span style="font-size: 10px; color: #aaa;">[Q]</span>
                </div>
                <div id="slot-roll" style="
                    width: 65px;
                    height: 65px;
                    background: rgba(255,255,255,0.05);
                    border: 2px solid #888;
                    border-radius: 10px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    color: white;
                ">
                    <span style="font-size: 26px;">💨</span>
                    <span style="font-size: 11px;">翻滚</span>
                    <span style="font-size: 10px; color: #aaa;">[空格]</span>
                </div>
            </div>

            <!-- 蓄力指示器 -->
            <div id="throw-indicator" style="
                position: absolute;
                top: 58%;
                left: 50%;
                transform: translateX(-50%);
                color: white;
                font-size: 13px;
                text-align: center;
                display: none;
                background: rgba(0,0,0,0.6);
                padding: 8px 15px;
                border-radius: 8px;
            ">
                <div style="margin-bottom: 5px;">按住蓄力中...</div>
                <div style="width: 120px; height: 10px; background: #333; border-radius: 5px; overflow: hidden; margin: 0 auto;">
                    <div id="throw-power-fill" style="width: 0%; height: 100%; background: linear-gradient(90deg, #ffd700, #ff6b6b); transition: width 0.05s;"></div>
                </div>
            </div>

            <!-- 开始提示 -->
            <div id="game-message" style="
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: rgba(0,0,0,0.9);
                padding: 30px 50px;
                border-radius: 15px;
                color: white;
                text-align: center;
                display: block;
                max-width: 450px;
                border: 2px solid rgba(255,215,0,0.3);
                pointer-events: auto;
            ">
                <div id="message-text" style="margin-bottom: 20px;">
                    <div style="font-size: 28px; margin-bottom: 15px; color: #ffd700;">🐕 双犬奇缘 🐕</div>
                    <div style="font-size: 14px; color: #ccc; line-height: 1.8;">
                        两只神秘的哈士奇出现在草原上...<br>
                        它们的臀部似乎有奇怪的连接！<br><br>
                        <div style="background: rgba(255,255,255,0.1); padding: 10px; border-radius: 8px; margin: 10px 0;">
                            <b style="color: #4ecdc4;">操作说明：</b><br>
                            <span style="color: #aaa;">
                            WASD - 移动 &nbsp;|&nbsp; 鼠标 - 瞄准<br>
                            左键按住 - 蓄力投掷 &nbsp;|&nbsp; Q - 弹反<br>
                            空格 - 翻滚 &nbsp;|&nbsp; 1/2 - 切换武器
                            </span>
                        </div>
                    </div>
                </div>
                <button id="message-btn" style="
                    padding: 12px 40px;
                    background: linear-gradient(135deg, #ffd700, #ffaa00);
                    border: none;
                    border-radius: 8px;
                    color: #333;
                    font-size: 18px;
                    font-weight: bold;
                    cursor: pointer;
                    transition: transform 0.2s;
                ">🎮 开始游戏</button>
            </div>

            <!-- 操作提示 -->
            <div id="control-hint" style="
                position: absolute;
                bottom: 120px;
                left: 50%;
                transform: translateX(-50%);
                color: rgba(255,255,255,0.7);
                font-size: 13px;
                text-align: center;
                display: none;
                background: rgba(0,0,0,0.5);
                padding: 8px 15px;
                border-radius: 6px;
            ">
                点击屏幕锁定鼠标 | WASD移动 | 左键攻击
            </div>
        `;

        const container = document.getElementById('scene-canvas-container');
        if (container) {
            container.appendChild(ui);
        }

        // 绑定UI事件
        this.bindUIEvents();
    }

    /**
     * 绑定UI事件
     */
    bindUIEvents() {
        // 开始按钮
        const messageBtn = document.getElementById('message-btn');
        if (messageBtn) {
            messageBtn.onclick = () => this.startGame();
        }

        // 难度切换
        const diffBtn = document.getElementById('btn-difficulty');
        if (diffBtn) {
            diffBtn.onclick = () => this.cycleDifficulty();
        }

        // 道具栏点击
        document.querySelectorAll('.inventory-slot').forEach(slot => {
            slot.onclick = () => {
                const weapon = slot.dataset.weapon;
                if (weapon) this.selectWeapon(weapon);
            };
        });
    }

    /**
     * 设置输入监听
     */
    setupInputListeners() {
        // 键盘按下
        this.keydownHandler = (e) => {
            this.keys[e.code] = true;

            if (this.gameState === 'phase1' || this.gameState === 'phase2') {
                // 武器切换
                if (e.code === 'Digit1') this.selectWeapon('stone');
                if (e.code === 'Digit2') this.selectWeapon('stick');

                // 弹反
                if (e.code === 'KeyQ' && this.player.canParry) {
                    this.activateParry();
                }

                // 翻滚
                if (e.code === 'Space' && !this.player.isRolling && this.player.stamina >= 20) {
                    e.preventDefault();
                    this.performRoll();
                }
            }
        };

        // 键盘松开
        this.keyupHandler = (e) => {
            this.keys[e.code] = false;
        };

        // 鼠标移动
        this.mousemoveHandler = (e) => {
            if (this.isPointerLocked && (this.gameState === 'phase1' || this.gameState === 'phase2')) {
                const sensitivity = 0.002;
                this.player.rotationY -= e.movementX * sensitivity;
                this.player.rotationX -= e.movementY * sensitivity;
                this.player.rotationX = Math.max(-Math.PI / 2.5, Math.min(Math.PI / 2.5, this.player.rotationX));
            }
        };

        // 鼠标按下
        this.mousedownHandler = (e) => {
            if (e.button === 0 && (this.gameState === 'phase1' || this.gameState === 'phase2')) {
                this.player.isCharging = true;
                this.player.throwPower = 0;
                
                const indicator = document.getElementById('throw-indicator');
                if (indicator) indicator.style.display = 'block';
            }
        };

        // 鼠标松开
        this.mouseupHandler = (e) => {
            if (e.button === 0 && this.player.isCharging) {
                this.player.isCharging = false;
                
                const indicator = document.getElementById('throw-indicator');
                if (indicator) indicator.style.display = 'none';

                if (this.gameState === 'phase1' || this.gameState === 'phase2') {
                    this.performAttack(this.player.throwPower);
                }
                
                this.player.throwPower = 0;
            }
        };

        // 指针锁定变化
        this.lockchangeHandler = () => {
            this.isPointerLocked = document.pointerLockElement !== null;
            
            const hint = document.getElementById('control-hint');
            if (hint) {
                hint.style.display = this.isPointerLocked ? 'none' : 'block';
            }
        };

        // 点击锁定
        this.clickHandler = () => {
            if ((this.gameState === 'phase1' || this.gameState === 'phase2') && !this.isPointerLocked) {
                const container = document.getElementById('scene-canvas-container');
                if (container) container.requestPointerLock?.();
            }
        };

        document.addEventListener('keydown', this.keydownHandler);
        document.addEventListener('keyup', this.keyupHandler);
        document.addEventListener('mousemove', this.mousemoveHandler);
        document.addEventListener('mousedown', this.mousedownHandler);
        document.addEventListener('mouseup', this.mouseupHandler);
        document.addEventListener('pointerlockchange', this.lockchangeHandler);
        
        const container = document.getElementById('scene-canvas-container');
        if (container) {
            container.addEventListener('click', this.clickHandler);
        }
    }

    /**
     * 开始游戏
     */
    startGame() {
        const messageDiv = document.getElementById('game-message');
        if (messageDiv) messageDiv.style.display = 'none';

        const hint = document.getElementById('control-hint');
        if (hint) hint.style.display = 'block';

        this.gameState = 'phase1';

        // 请求指针锁定
        const container = document.getElementById('scene-canvas-container');
        if (container) container.requestPointerLock?.();

        this.showGameTip('🎯 石头后面有动静...瞄准狗狗投掷石头！');
    }

    /**
     * 显示游戏提示
     */
    showGameTip(text) {
        const container = document.getElementById('scene-canvas-container');
        if (!container) return;

        const tip = document.createElement('div');
        tip.style.cssText = `
            position: absolute;
            top: 25%;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0,0,0,0.8);
            padding: 12px 25px;
            border-radius: 10px;
            color: #4ecdc4;
            font-size: 16px;
            z-index: 200;
            opacity: 0;
            transition: opacity 0.3s;
            border: 1px solid rgba(78,205,196,0.3);
        `;
        tip.textContent = text;
        container.appendChild(tip);

        setTimeout(() => tip.style.opacity = '1', 50);
        setTimeout(() => {
            tip.style.opacity = '0';
            setTimeout(() => tip.remove(), 300);
        }, 3000);
    }

    /**
     * 切换难度
     */
    cycleDifficulty() {
        const difficulties = ['easy', 'normal', 'hard'];
        const idx = difficulties.indexOf(this.difficulty);
        this.difficulty = difficulties[(idx + 1) % 3];

        const display = { easy: '⭐ 简单', normal: '⭐⭐ 普通', hard: '⭐⭐⭐ 困难' };
        const text = document.getElementById('difficulty-text');
        if (text) text.textContent = display[this.difficulty];
    }

    /**
     * 选择武器
     */
    selectWeapon(weapon) {
        this.player.selectedWeapon = weapon;

        document.querySelectorAll('.inventory-slot').forEach(slot => {
            if (slot.dataset.weapon === weapon) {
                slot.style.borderColor = '#ffd700';
                slot.style.borderWidth = '3px';
                slot.style.background = 'rgba(255,215,0,0.15)';
            } else if (slot.dataset.weapon) {
                slot.style.borderColor = '#666';
                slot.style.borderWidth = '2px';
                slot.style.background = 'rgba(255,255,255,0.05)';
            }
        });
    }

    /**
     * 执行攻击
     */
    performAttack(power) {
        const weapon = this.player.selectedWeapon;
        const normalizedPower = Math.min(power, 1);

        if (weapon === 'stone' && this.player.stones > 0) {
            this.throwStone(normalizedPower);
            this.player.stones--;
            this.updateInventoryUI();
        } else if (weapon === 'stick' && this.player.sticks > 0) {
            this.meleeAttack();
        }
    }

    /**
     * 投掷石头
     */
    throwStone(power) {
        const stoneGeom = new THREE.DodecahedronGeometry(0.12, 0);
        const stoneMat = new THREE.MeshStandardMaterial({ color: 0x808080 });
        const stone = new THREE.Mesh(stoneGeom, stoneMat);

        // 起始位置
        const dir = new THREE.Vector3(0, 0, -1);
        dir.applyEuler(new THREE.Euler(this.player.rotationX, this.player.rotationY, 0, 'YXZ'));
        
        stone.position.copy(this.camera.position);
        stone.position.add(dir.clone().multiplyScalar(0.8));

        // 速度
        const speed = 20 + power * 25;
        const velocity = dir.multiplyScalar(speed);
        velocity.y += 3 + power * 4;

        this.projectiles.push({
            mesh: stone,
            velocity: velocity,
            damage: 8 + power * 12,
            type: 'stone',
            age: 0
        });

        this.scene.add(stone);
    }

    /**
     * 近战攻击
     */
    meleeAttack() {
        const attackRange = 3.5;
        const huskyWorldPos = this.huskyGroup.getWorldPosition(new THREE.Vector3());
        const dist = this.camera.position.distanceTo(huskyWorldPos);
        
        if (dist < attackRange) {
            this.dealDamageToHuskies(25, 'body');
            this.createHitEffect(huskyWorldPos.clone().add(new THREE.Vector3(0, 0.5, 0)));
            this.showGameTip('💥 近战命中！');
        } else {
            this.showGameTip('距离太远！');
        }
    }

    /**
     * 激活弹反
     */
    activateParry() {
        this.player.isBlocking = true;
        this.player.canParry = false;
        this.player.parryCD = 3000;

        const shield = document.getElementById('shield-status');
        if (shield) {
            shield.textContent = '格挡中';
            shield.style.color = '#ffd700';
        }

        const parryWindow = this.difficultySettings[this.difficulty].parryWindow;
        
        setTimeout(() => {
            this.player.isBlocking = false;
            if (shield) {
                shield.textContent = '冷却中';
                shield.style.color = '#888';
            }
        }, parryWindow);
    }

    /**
     * 执行翻滚
     */
    performRoll() {
        this.player.isRolling = true;
        this.player.isInvincible = true;
        this.player.stamina -= 20;

        // 翻滚方向
        const dir = new THREE.Vector3();
        if (this.keys['KeyW']) dir.z = -1;
        else if (this.keys['KeyS']) dir.z = 1;
        else if (this.keys['KeyA']) dir.x = -1;
        else if (this.keys['KeyD']) dir.x = 1;
        else dir.z = -1;

        dir.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.player.rotationY);
        this.player.velocity.copy(dir.multiplyScalar(12));

        setTimeout(() => {
            this.player.isRolling = false;
            this.player.isInvincible = false;
            this.player.velocity.set(0, 0, 0);
        }, 350);
    }

    /**
     * 更新道具UI
     */
    updateInventoryUI() {
        const stoneCount = document.getElementById('stone-count');
        const stickCount = document.getElementById('stick-count');
        if (stoneCount) stoneCount.textContent = `x${this.player.stones}`;
        if (stickCount) stickCount.textContent = `x${this.player.sticks}`;
    }

    /**
     * 更新状态UI
     */
    updateStatusUI() {
        // HP
        const hpFill = document.getElementById('hp-fill');
        const hpText = document.getElementById('hp-text');
        if (hpFill) hpFill.style.width = `${(this.player.hp / this.player.maxHp) * 100}%`;
        if (hpText) hpText.textContent = `${Math.ceil(this.player.hp)}/${this.player.maxHp}`;

        // SP
        const spFill = document.getElementById('sp-fill');
        if (spFill) spFill.style.width = `${(this.player.stamina / this.player.maxStamina) * 100}%`;

        // 盾牌
        const shield = document.getElementById('shield-status');
        if (shield && !this.player.isBlocking) {
            if (!this.player.canParry) {
                shield.textContent = `${Math.ceil(this.player.parryCD / 1000)}s`;
                shield.style.color = '#888';
            } else {
                shield.textContent = '可用';
                shield.style.color = '#4ecdc4';
            }
        }

        // 敌人血条
        if (!this.huskies.connected) {
            const enemy = document.getElementById('enemy-status');
            if (enemy) enemy.style.display = 'block';

            const dog1Fill = document.getElementById('dog1-hp-fill');
            const dog2Fill = document.getElementById('dog2-hp-fill');
            if (dog1Fill) dog1Fill.style.width = `${Math.max(0, (this.huskies.dogs[0].hp / this.huskies.dogs[0].maxHp) * 100)}%`;
            if (dog2Fill) dog2Fill.style.width = `${Math.max(0, (this.huskies.dogs[1].hp / this.huskies.dogs[1].maxHp) * 100)}%`;
        }
    }

    /**
     * 对狗狗造成伤害
     */
    dealDamageToHuskies(damage, hitLocation) {
        const settings = this.difficultySettings[this.difficulty];
        const finalDamage = damage * settings.playerDamage;

        // 受击反馈动画
        this.playHitReaction(hitLocation);

        if (this.huskies.connected) {
            if (hitLocation === 'head') {
                this.huskies.headHits++;
                this.showGameTip(`💥 头部命中！(${this.huskies.headHits}/2)`);
                this.playHeadHitAnimation();
            } else {
                this.huskies.bodyHits++;
                this.showGameTip(`✓ 身体命中 (${this.huskies.bodyHits}/5)`);
                this.playBodyHitAnimation();
            }

            if (this.huskies.headHits >= 2 || this.huskies.bodyHits >= 5) {
                this.separateHuskies();
            }
        } else {
            // 伤害最近的狗
            const dog1Pos = this.dog1.getWorldPosition(new THREE.Vector3());
            const dog2Pos = this.dog2.getWorldPosition(new THREE.Vector3());
            const d1 = this.camera.position.distanceTo(dog1Pos);
            const d2 = this.camera.position.distanceTo(dog2Pos);
            
            const targetIdx = d1 < d2 ? 0 : 1;
            const targetDog = targetIdx === 0 ? this.dog1 : this.dog2;
            
            this.huskies.dogs[targetIdx].hp -= finalDamage;
            this.playSingleDogHitAnimation(targetDog);

            if (this.huskies.dogs[0].hp <= 0 && this.huskies.dogs[1].hp <= 0) {
                this.victory();
            }
        }
    }

    /**
     * 受击反馈动画 - 整体震动
     */
    playHitReaction(hitLocation) {
        if (!this.huskyGroup) return;

        const intensity = hitLocation === 'head' ? 0.3 : 0.15;
        const originalPos = this.huskyGroup.position.clone();

        // 震动效果
        if (typeof gsap !== 'undefined') {
            gsap.to(this.huskyGroup.position, {
                x: originalPos.x + (Math.random() - 0.5) * intensity,
                z: originalPos.z + (Math.random() - 0.5) * intensity,
                duration: 0.05,
                yoyo: true,
                repeat: 3,
                ease: 'power2.inOut',
                onComplete: () => {
                    this.huskyGroup.position.copy(originalPos);
                }
            });
        }

        // 加速臀部晃动作为疼痛反应
        this.huskies.hipSwaySpeed = 4;
        setTimeout(() => {
            this.huskies.hipSwaySpeed = 2;
        }, 500);
    }

    /**
     * 头部受击动画
     */
    playHeadHitAnimation() {
        const animateHead = (dog) => {
            if (!dog.userData.headGroup) return;
            
            const head = dog.userData.headGroup;
            const originalRotX = head.rotation.x;
            
            if (typeof gsap !== 'undefined') {
                // 头部后仰
                gsap.to(head.rotation, {
                    x: originalRotX - 0.5,
                    duration: 0.1,
                    ease: 'power2.out'
                });
                gsap.to(head.rotation, {
                    x: originalRotX,
                    duration: 0.3,
                    delay: 0.1,
                    ease: 'elastic.out(1, 0.5)'
                });

                // 头部摇晃
                gsap.to(head.rotation, {
                    z: 0.3,
                    duration: 0.1,
                    yoyo: true,
                    repeat: 2
                });
            }
        };

        animateHead(this.dog1);
        animateHead(this.dog2);
    }

    /**
     * 身体受击动画
     */
    playBodyHitAnimation() {
        const animateBody = (dog) => {
            if (!dog.userData.torso) return;
            
            const torso = dog.userData.torso;
            const originalScaleY = torso.scale.y;
            
            if (typeof gsap !== 'undefined') {
                // 身体压缩
                gsap.to(torso.scale, {
                    y: originalScaleY * 0.7,
                    duration: 0.08,
                    ease: 'power2.out'
                });
                gsap.to(torso.scale, {
                    y: originalScaleY,
                    duration: 0.25,
                    delay: 0.08,
                    ease: 'elastic.out(1, 0.4)'
                });
            }
        };

        animateBody(this.dog1);
        animateBody(this.dog2);

        // 腿部弯曲
        [this.dog1, this.dog2].forEach(dog => {
            ['legFL', 'legFR', 'legBL', 'legBR'].forEach(legKey => {
                if (dog.userData[legKey] && typeof gsap !== 'undefined') {
                    gsap.to(dog.userData[legKey].rotation, {
                        x: 0.3,
                        duration: 0.1,
                        yoyo: true,
                        repeat: 1
                    });
                }
            });
        });
    }

    /**
     * 单只狗受击动画（分离后）
     */
    playSingleDogHitAnimation(dog) {
        if (!dog) return;

        // 后退
        const backDir = dog.position.clone().normalize().multiplyScalar(0.3);
        
        if (typeof gsap !== 'undefined') {
            gsap.to(dog.position, {
                x: dog.position.x + backDir.x,
                z: dog.position.z + backDir.z,
                duration: 0.1,
                ease: 'power2.out'
            });
            gsap.to(dog.position, {
                x: dog.position.x,
                z: dog.position.z,
                duration: 0.2,
                delay: 0.1,
                ease: 'power2.in'
            });

            // 身体扭曲
            if (dog.userData.torso) {
                gsap.to(dog.userData.torso.rotation, {
                    z: 0.2,
                    duration: 0.1,
                    yoyo: true,
                    repeat: 1
                });
            }

            // 头部摇晃
            if (dog.userData.headGroup) {
                gsap.to(dog.userData.headGroup.rotation, {
                    y: -0.4,
                    duration: 0.1
                });
                gsap.to(dog.userData.headGroup.rotation, {
                    y: 0,
                    duration: 0.3,
                    delay: 0.1,
                    ease: 'elastic.out'
                });
            }
        }
    }

    /**
     * 分离狗狗
     */
    separateHuskies() {
        this.huskies.connected = false;
        this.gameState = 'phase2';

        // 芭蕉叶掉落
        if (typeof gsap !== 'undefined') {
            gsap.to(this.bananaLeaf.position, { y: -1, duration: 1, ease: 'power2.in' });
            gsap.to(this.bananaLeaf.rotation, { x: Math.PI, z: Math.PI * 2, duration: 1.2 });
            
            // 狗狗分开
            gsap.to(this.dog1.position, { x: -2, z: 1, duration: 0.6 });
            gsap.to(this.dog2.position, { x: 2, z: 1, duration: 0.6 });
            gsap.to(this.dog1.rotation, { y: 0, duration: 0.5 });
            gsap.to(this.dog2.rotation, { y: 0, duration: 0.5 });
        }

        this.showGameTip('⚠️ 狗狗分离了！它们要攻击你了！');

        setTimeout(() => {
            this.huskies.dogs[0].state = 'aggressive';
            this.huskies.dogs[1].state = 'aggressive';
        }, 800);
    }

    /**
     * 胜利
     */
    victory() {
        this.gameState = 'victory';
        document.exitPointerLock?.();
        
        const messageDiv = document.getElementById('game-message');
        const messageText = document.getElementById('message-text');
        const messageBtn = document.getElementById('message-btn');
        
        if (messageDiv && messageText && messageBtn) {
            messageText.innerHTML = `
                <div style="font-size: 32px; color: #ffd700; margin-bottom: 15px;">🏆 胜利！🏆</div>
                <div style="font-size: 15px; color: #aaa;">
                    你成功击败了两只神秘的哈士奇！<br>
                    草原恢复了平静...
                </div>
            `;
            messageBtn.textContent = '🔄 再来一局';
            messageBtn.onclick = () => location.reload();
            messageDiv.style.display = 'block';
        }
    }

    /**
     * 失败
     */
    defeat() {
        this.gameState = 'defeat';
        document.exitPointerLock?.();
        
        const messageDiv = document.getElementById('game-message');
        const messageText = document.getElementById('message-text');
        const messageBtn = document.getElementById('message-btn');
        
        if (messageDiv && messageText && messageBtn) {
            messageText.innerHTML = `
                <div style="font-size: 32px; color: #ff6b6b; margin-bottom: 15px;">💀 败北...</div>
                <div style="font-size: 15px; color: #aaa;">
                    你被哈士奇击倒了...<br>
                    它们的嚎叫回荡在草原上
                </div>
            `;
            messageBtn.textContent = '🔄 重新挑战';
            messageBtn.onclick = () => location.reload();
            messageDiv.style.display = 'block';
        }
    }

    /**
     * 创建命中特效
     */
    createHitEffect(position) {
        for (let i = 0; i < 8; i++) {
            const geom = new THREE.SphereGeometry(0.06, 4, 4);
            const mat = new THREE.MeshBasicMaterial({ color: 0xffff00 });
            const particle = new THREE.Mesh(geom, mat);
            
            particle.position.copy(position);
            particle.userData.velocity = new THREE.Vector3(
                (Math.random() - 0.5) * 4,
                Math.random() * 3 + 1,
                (Math.random() - 0.5) * 4
            );
            particle.userData.life = 0.5;
            
            this.scene.add(particle);
            
            // 自动清理
            const cleanup = () => {
                this.scene.remove(particle);
            };
            setTimeout(cleanup, 500);
        }
    }

    /**
     * 动画更新
     */
    animate(time, delta) {
        this.time = time;
        const dt = delta || 0.016;

        // 非游戏状态不更新
        if (this.gameState === 'intro' || this.gameState === 'victory' || this.gameState === 'defeat') {
            return;
        }

        // 更新玩家
        this.updatePlayer(dt);

        // 更新狗狗
        this.updateHuskies(dt);

        // 更新投掷物
        this.updateProjectiles(dt);

        // 更新冷却
        this.updateCooldowns(dt);

        // 更新蓄力
        this.updateCharging(dt);

        // 更新UI
        this.updateStatusUI();

        // 精力恢复
        if (!this.player.isRolling && this.player.stamina < this.player.maxStamina) {
            const regen = this.difficultySettings[this.difficulty].staminaRegen;
            this.player.stamina = Math.min(this.player.maxStamina, this.player.stamina + regen * dt * 60);
        }
    }

    /**
     * 更新玩家
     */
    updatePlayer(dt) {
        // WASD移动
        if (!this.player.isRolling) {
            const moveSpeed = 6;
            const moveDir = new THREE.Vector3();

            if (this.keys['KeyW']) moveDir.z = -1;
            if (this.keys['KeyS']) moveDir.z = 1;
            if (this.keys['KeyA']) moveDir.x = -1;
            if (this.keys['KeyD']) moveDir.x = 1;

            if (moveDir.length() > 0) {
                moveDir.normalize();
                moveDir.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.player.rotationY);
                this.player.position.add(moveDir.multiplyScalar(moveSpeed * dt));
            }
        } else {
            // 翻滚移动
            this.player.position.add(this.player.velocity.clone().multiplyScalar(dt));
        }

        // 边界限制
        this.player.position.x = Math.max(-45, Math.min(45, this.player.position.x));
        this.player.position.z = Math.max(-45, Math.min(45, this.player.position.z));
        this.player.position.y = 1.6;

        // 更新相机
        this.camera.position.copy(this.player.position);
        this.camera.rotation.order = 'YXZ';
        this.camera.rotation.y = this.player.rotationY;
        this.camera.rotation.x = this.player.rotationX;
    }

    /**
     * 更新狗狗 - 自然动画系统
     */
    updateHuskies(dt) {
        if (!this.dogAnimState) return;

        const anim = this.dogAnimState;
        
        // 更新动画相位
        anim.breathPhase += dt * 2;           // 呼吸
        anim.headBobPhase += dt * 1.5;        // 头部轻微移动
        anim.tailWagPhase += dt * 4;          // 尾巴摇摆
        anim.legWalkPhase += dt * 3;          // 腿部动作

        // 检测与玩家距离，调整警觉度
        const distToPlayer = this.camera.position.distanceTo(this.huskyGroup.position);
        if (distToPlayer < 15) {
            anim.alertLevel = Math.min(1, anim.alertLevel + dt * 0.5);
        } else {
            anim.alertLevel = Math.max(0, anim.alertLevel - dt * 0.3);
        }

        if (this.huskies.connected) {
            // === 连接状态：臀部晃动 ===
            this.huskies.hipSwayPhase += dt * this.huskies.hipSwaySpeed;
            
            // 随机变化晃动速度（有时快有时慢有时几乎停止）
            if (Math.random() < 0.01) {
                const rand = Math.random();
                if (rand < 0.2) {
                    this.huskies.hipSwaySpeed = 0.2;  // 几乎停止
                } else if (rand < 0.5) {
                    this.huskies.hipSwaySpeed = 1.0;  // 慢速
                } else if (rand < 0.8) {
                    this.huskies.hipSwaySpeed = 2.0;  // 正常
                } else {
                    this.huskies.hipSwaySpeed = 3.5;  // 快速
                }
            }

            // 臀部晃动 - 两只狗反向
            const hipSway = Math.sin(this.huskies.hipSwayPhase) * 0.12;
            const hipSwayZ = Math.cos(this.huskies.hipSwayPhase * 0.7) * 0.08;
            
            // 狗1的臀部运动
            if (this.dog1.userData.hip) {
                this.dog1.userData.hip.position.z = hipSway;
                this.dog1.userData.hip.rotation.x = hipSwayZ * 0.3;
            }
            this.dog1.position.z = -0.6 + hipSway * 0.3;
            this.dog1.rotation.z = hipSway * 0.1;

            // 狗2的臀部运动（反向）
            if (this.dog2.userData.hip) {
                this.dog2.userData.hip.position.z = -hipSway;
                this.dog2.userData.hip.rotation.x = -hipSwayZ * 0.3;
            }
            this.dog2.position.z = 0.6 - hipSway * 0.3;
            this.dog2.rotation.z = -hipSway * 0.1;

            // 芭蕉叶跟随晃动
            if (this.bananaLeaf) {
                this.bananaLeaf.rotation.z = hipSway * 0.4;
                this.bananaLeaf.rotation.x = Math.PI / 10 + hipSwayZ * 0.2;
                this.bananaLeaf.position.y = 0.55 + Math.abs(hipSway) * 0.1;
            }

            // 自然动画应用到两只狗
            this.applyNaturalAnimation(this.dog1, anim, dt, 0);
            this.applyNaturalAnimation(this.dog2, anim, dt, Math.PI);

        } else {
            // === 分离状态：战斗AI ===
            this.updateDogAI(0, this.dog1, dt);
            this.updateDogAI(1, this.dog2, dt);
            
            // 战斗动画
            this.applyBattleAnimation(this.dog1, anim, dt, 0);
            this.applyBattleAnimation(this.dog2, anim, dt, Math.PI / 2);
        }

        // 面向玩家
        const toPlayer = this.camera.position.clone().sub(this.huskyGroup.position);
        toPlayer.y = 0;
        if (toPlayer.length() > 0.1) {
            const targetAngle = Math.atan2(toPlayer.x, toPlayer.z);
            // 平滑转向
            const currentAngle = this.huskyGroup.rotation.y;
            const angleDiff = targetAngle - currentAngle;
            this.huskyGroup.rotation.y += angleDiff * dt * 2;
        }
    }

    /**
     * 应用自然动画（连接状态）
     */
    applyNaturalAnimation(dog, anim, dt, phaseOffset) {
        if (!dog.userData) return;

        // 呼吸 - 身体轻微起伏
        const breathAmp = 0.03;
        const breath = Math.sin(anim.breathPhase + phaseOffset) * breathAmp;
        if (dog.userData.torso) {
            dog.userData.torso.scale.y = 0.8 + breath;
            dog.userData.torso.position.y = 0.7 + breath * 0.5;
        }

        // 头部动作 - 轻微摆动和看向玩家
        if (dog.userData.headGroup) {
            const headBob = Math.sin(anim.headBobPhase + phaseOffset) * 0.02;
            const headTurn = Math.sin(anim.headBobPhase * 0.3 + phaseOffset) * 0.1;
            
            dog.userData.headGroup.position.y = 0.9 + headBob;
            dog.userData.headGroup.rotation.y = headTurn * anim.alertLevel;
            dog.userData.headGroup.rotation.z = Math.sin(anim.headBobPhase * 0.5) * 0.03;
        }

        // 耳朵动作 - 警觉时竖起
        if (dog.userData.earL && dog.userData.earR) {
            const earTwitch = Math.sin(anim.headBobPhase * 2 + phaseOffset) * 0.1;
            dog.userData.earL.rotation.x = 0.15 + earTwitch * anim.alertLevel;
            dog.userData.earR.rotation.x = -0.15 - earTwitch * anim.alertLevel;
        }

        // 尾巴摇摆 - 高兴时摇得更快
        if (dog.userData.tailGroup) {
            const wagSpeed = 1 + anim.alertLevel * 2;
            const wag = Math.sin(anim.tailWagPhase * wagSpeed + phaseOffset) * 0.4;
            dog.userData.tailGroup.rotation.z = wag;
            dog.userData.tailGroup.rotation.y = Math.sin(anim.tailWagPhase * wagSpeed * 0.5) * 0.2;
        }

        // 腿部微动（站立时的重心转移）
        const legShift = Math.sin(anim.breathPhase * 0.5 + phaseOffset) * 0.02;
        if (dog.userData.legFL) dog.userData.legFL.position.y = 0.7 + legShift;
        if (dog.userData.legFR) dog.userData.legFR.position.y = 0.7 - legShift;
        if (dog.userData.legBL) dog.userData.legBL.position.y = 0.7 - legShift * 0.5;
        if (dog.userData.legBR) dog.userData.legBR.position.y = 0.7 + legShift * 0.5;
    }

    /**
     * 应用战斗动画（分离状态）
     */
    applyBattleAnimation(dog, anim, dt, phaseOffset) {
        if (!dog.userData) return;

        // 更激进的呼吸
        const breath = Math.sin(anim.breathPhase * 1.5 + phaseOffset) * 0.05;
        if (dog.userData.torso) {
            dog.userData.torso.scale.y = 0.8 + breath;
        }

        // 头部 - 更警觉，跟踪玩家
        if (dog.userData.headGroup) {
            const headBob = Math.sin(anim.headBobPhase * 2 + phaseOffset) * 0.03;
            dog.userData.headGroup.position.y = 0.9 + headBob;
            // 战斗时头部略低
            dog.userData.headGroup.rotation.x = 0.15;
        }

        // 尾巴 - 紧张时压低
        if (dog.userData.tailGroup) {
            dog.userData.tailGroup.rotation.x = 0.3;
            dog.userData.tailGroup.rotation.z = Math.sin(anim.tailWagPhase * 3 + phaseOffset) * 0.2;
        }

        // 腿部 - 走动动画
        const walkCycle = anim.legWalkPhase + phaseOffset;
        const legSwing = 0.4;
        
        if (dog.userData.legFL) {
            dog.userData.legFL.rotation.x = Math.sin(walkCycle) * legSwing;
        }
        if (dog.userData.legFR) {
            dog.userData.legFR.rotation.x = Math.sin(walkCycle + Math.PI) * legSwing;
        }
        if (dog.userData.legBL) {
            dog.userData.legBL.rotation.x = Math.sin(walkCycle + Math.PI) * legSwing * 0.8;
        }
        if (dog.userData.legBR) {
            dog.userData.legBR.rotation.x = Math.sin(walkCycle) * legSwing * 0.8;
        }
    }

    /**
     * 狗狗AI
     */
    updateDogAI(index, dogMesh, dt) {
        const dog = this.huskies.dogs[index];
        if (dog.hp <= 0) {
            dogMesh.visible = false;
            return;
        }

        dog.attackCD -= dt * 1000;

        const dogWorldPos = dogMesh.getWorldPosition(new THREE.Vector3());
        const toPlayer = this.camera.position.clone().sub(dogWorldPos);
        const distance = toPlayer.length();

        if (dog.state === 'aggressive') {
            if (distance < 2.5 && dog.attackCD <= 0) {
                this.dogAttack(index);
                dog.attackCD = 1800 + Math.random() * 800;
            } else if (distance > 2) {
                toPlayer.normalize();
                const speed = 4;
                dogMesh.position.x += toPlayer.x * speed * dt;
                dogMesh.position.z += toPlayer.z * speed * dt;
            }
        }
    }

    /**
     * 狗狗攻击 - 带动画
     */
    dogAttack(index) {
        const attackingDog = index === 0 ? this.dog1 : this.dog2;
        
        // 播放攻击动画
        this.playDogAttackAnimation(attackingDog, () => {
            // 动画完成后判定伤害
            if (this.player.isInvincible) return;

            const settings = this.difficultySettings[this.difficulty];
            let damage = 18 * settings.enemyDamage;

            if (this.player.isBlocking) {
                damage *= 0.55;
                this.showGameTip('🛡️ 弹反成功！');
                this.playParryEffect();
                
                const reflectDamage = damage * 0.5;
                this.huskies.dogs[index].hp -= reflectDamage;
                this.playSingleDogHitAnimation(attackingDog);
                
                if (this.huskies.dogs[index].hp <= 0) {
                    this.showGameTip(`🐕 哈士奇 ${index === 0 ? 'A' : 'B'} 被击败！`);
                    this.playDogDefeatAnimation(attackingDog);
                }
            } else {
                this.showGameTip('💥 被狗狗攻击！');
                this.playPlayerHitEffect();
            }

            this.player.hp -= damage;

            if (this.player.hp <= 0) {
                this.defeat();
            }
        });
    }

    /**
     * 狗狗攻击动画
     */
    playDogAttackAnimation(dog, onComplete) {
        if (!dog.userData) {
            if (onComplete) onComplete();
            return;
        }

        const attackType = Math.random() < 0.6 ? 'bite' : 'lunge';

        if (typeof gsap !== 'undefined') {
            if (attackType === 'bite') {
                // 咬人攻击 - 头部前伸
                const timeline = gsap.timeline({ onComplete });
                
                if (dog.userData.headGroup) {
                    // 蓄力 - 头后缩
                    timeline.to(dog.userData.headGroup.position, {
                        x: 0.8,
                        duration: 0.15,
                        ease: 'power2.in'
                    });
                    // 攻击 - 头前冲
                    timeline.to(dog.userData.headGroup.position, {
                        x: 1.5,
                        duration: 0.1,
                        ease: 'power4.out'
                    });
                    // 张嘴效果（通过snout缩放）
                    if (dog.userData.snout) {
                        timeline.to(dog.userData.snout.scale, {
                            y: 1.3,
                            duration: 0.1
                        }, '-=0.1');
                        timeline.to(dog.userData.snout.scale, {
                            y: 0.8,
                            duration: 0.05
                        });
                    }
                    // 恢复
                    timeline.to(dog.userData.headGroup.position, {
                        x: 1.1,
                        duration: 0.2,
                        ease: 'power2.out'
                    });
                } else {
                    if (onComplete) onComplete();
                }
            } else {
                // 扑击 - 整体前冲
                const timeline = gsap.timeline({ onComplete });
                
                // 蓄力 - 身体后缩，腿弯曲
                timeline.to(dog.position, {
                    z: dog.position.z + 0.3,
                    y: dog.position.y - 0.1,
                    duration: 0.2,
                    ease: 'power2.in'
                });
                
                // 腿部弯曲
                ['legFL', 'legFR', 'legBL', 'legBR'].forEach(legKey => {
                    if (dog.userData[legKey]) {
                        timeline.to(dog.userData[legKey].rotation, {
                            x: -0.4,
                            duration: 0.15
                        }, '-=0.2');
                    }
                });

                // 扑出
                timeline.to(dog.position, {
                    z: dog.position.z - 0.8,
                    y: dog.position.y + 0.2,
                    duration: 0.15,
                    ease: 'power4.out'
                });

                // 落地
                timeline.to(dog.position, {
                    y: 0,
                    duration: 0.1,
                    ease: 'power2.in'
                });

                // 恢复
                timeline.to(dog.position, {
                    z: dog.position.z,
                    duration: 0.3,
                    ease: 'power2.out'
                });

                // 腿部恢复
                ['legFL', 'legFR', 'legBL', 'legBR'].forEach(legKey => {
                    if (dog.userData[legKey]) {
                        timeline.to(dog.userData[legKey].rotation, {
                            x: 0,
                            duration: 0.2
                        }, '-=0.3');
                    }
                });
            }
        } else {
            if (onComplete) onComplete();
        }
    }

    /**
     * 弹反特效
     */
    playParryEffect() {
        // 屏幕闪光
        const flash = document.createElement('div');
        flash.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(78, 205, 196, 0.3);
            pointer-events: none;
            z-index: 1000;
        `;
        document.body.appendChild(flash);
        
        setTimeout(() => flash.remove(), 100);

        // 粒子爆发
        this.createParryParticles();
    }

    /**
     * 弹反粒子
     */
    createParryParticles() {
        const center = this.camera.position.clone();
        center.z -= 1;

        for (let i = 0; i < 15; i++) {
            const geom = new THREE.SphereGeometry(0.05, 4, 4);
            const mat = new THREE.MeshBasicMaterial({ color: 0x4ecdc4 });
            const particle = new THREE.Mesh(geom, mat);
            
            particle.position.copy(center);
            
            const angle = (i / 15) * Math.PI * 2;
            const speed = 3 + Math.random() * 2;
            particle.userData.velocity = new THREE.Vector3(
                Math.cos(angle) * speed,
                Math.random() * 2,
                Math.sin(angle) * speed
            );
            
            this.scene.add(particle);
            
            setTimeout(() => this.scene.remove(particle), 300);
        }
    }

    /**
     * 玩家受击效果
     */
    playPlayerHitEffect() {
        // 屏幕红闪
        const flash = document.createElement('div');
        flash.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(255, 0, 0, 0.25);
            pointer-events: none;
            z-index: 1000;
        `;
        document.body.appendChild(flash);
        
        setTimeout(() => {
            flash.style.background = 'rgba(255, 0, 0, 0.1)';
        }, 50);
        setTimeout(() => flash.remove(), 150);

        // 相机震动
        if (typeof gsap !== 'undefined') {
            const originalPos = this.camera.position.clone();
            gsap.to(this.camera.position, {
                x: originalPos.x + (Math.random() - 0.5) * 0.2,
                y: originalPos.y + (Math.random() - 0.5) * 0.1,
                duration: 0.05,
                yoyo: true,
                repeat: 3
            });
        }
    }

    /**
     * 狗狗被击败动画
     */
    playDogDefeatAnimation(dog) {
        if (!dog) return;

        if (typeof gsap !== 'undefined') {
            // 倒下
            gsap.to(dog.rotation, {
                z: Math.PI / 2,
                duration: 0.5,
                ease: 'power2.in'
            });
            gsap.to(dog.position, {
                y: -0.3,
                duration: 0.5,
                ease: 'power2.in'
            });
        }
    }

    /**
     * 更新投掷物
     */
    updateProjectiles(dt) {
        const gravity = -25;

        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const proj = this.projectiles[i];
            
            proj.velocity.y += gravity * dt;
            proj.mesh.position.add(proj.velocity.clone().multiplyScalar(dt));
            proj.mesh.rotation.x += 6 * dt;
            proj.mesh.rotation.y += 4 * dt;
            proj.age += dt;

            // 碰撞检测
            const huskyWorldPos = this.huskyGroup.getWorldPosition(new THREE.Vector3());
            const toDog = proj.mesh.position.clone().sub(huskyWorldPos);
            
            if (toDog.length() < 2) {
                // 判断头部
                const headOffset = new THREE.Vector3(0.7, 0.7, 0);
                const headPos = huskyWorldPos.clone().add(headOffset);
                const toHead = proj.mesh.position.clone().sub(headPos);
                
                const hitLocation = toHead.length() < 0.6 ? 'head' : 'body';
                
                this.dealDamageToHuskies(proj.damage, hitLocation);
                this.createHitEffect(proj.mesh.position.clone());
                
                this.scene.remove(proj.mesh);
                this.projectiles.splice(i, 1);
                continue;
            }

            // 落地或超时
            if (proj.mesh.position.y < 0.1 || proj.age > 5) {
                this.scene.remove(proj.mesh);
                this.projectiles.splice(i, 1);
            }
        }
    }

    /**
     * 更新冷却
     */
    updateCooldowns(dt) {
        if (!this.player.canParry) {
            this.player.parryCD -= dt * 1000;
            if (this.player.parryCD <= 0) {
                this.player.canParry = true;
            }
        }
    }

    /**
     * 更新蓄力
     */
    updateCharging(dt) {
        if (this.player.isCharging) {
            this.player.throwPower = Math.min(1, this.player.throwPower + dt * 1.5);
            
            const fill = document.getElementById('throw-power-fill');
            if (fill) fill.style.width = `${this.player.throwPower * 100}%`;
        }
    }

    /**
     * 获取可交互对象
     */
    getInteractables() {
        return [];
    }

    /**
     * 清理
     */
    dispose() {
        // 移除事件监听
        document.removeEventListener('keydown', this.keydownHandler);
        document.removeEventListener('keyup', this.keyupHandler);
        document.removeEventListener('mousemove', this.mousemoveHandler);
        document.removeEventListener('mousedown', this.mousedownHandler);
        document.removeEventListener('mouseup', this.mouseupHandler);
        document.removeEventListener('pointerlockchange', this.lockchangeHandler);
        
        const container = document.getElementById('scene-canvas-container');
        if (container) {
            container.removeEventListener('click', this.clickHandler);
        }

        // 清理场景
        if (this.mainGroup) this.scene.remove(this.mainGroup);
        if (this.huskyGroup) this.scene.remove(this.huskyGroup);

        this.projectiles.forEach(p => this.scene.remove(p.mesh));
        this.projectiles = [];

        // 移除UI
        const ui = document.getElementById('game-ui');
        if (ui) ui.remove();

        // 恢复默认控制栏
        const controlsDiv = document.getElementById('scene-controls');
        if (controlsDiv) controlsDiv.style.display = 'flex';

        document.exitPointerLock?.();
    }

    /**
     * 背景点击
     */
    onBackgroundClick() {}
};
