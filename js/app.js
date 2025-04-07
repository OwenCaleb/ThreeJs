/**
 * 太阳系模拟器
 * 使用Three.js实现太阳系天体的运动模拟
 */

// 导入Three.js库和OrbitControls
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

// 场景、相机和渲染器
let scene, camera, renderer;

// 控制器
let controls;

// 行星对象
let sun, mercury, venus, earth, mars, jupiter, saturn, uranus, neptune;
let moon; // 地球的卫星
let phobos, deimos; // 火星的卫星

// 轨道线
let orbits = [];
let showOrbits = true;

// 交互控制变量
let timeScale = 0.1;   // 时间缩放
let isPlaying = true;  // 是否正在播放
let selectedPlanet = null; // 当前选中的行星

// 射线投射器 - 用于处理点击事件
let raycaster, mouse;

// 行星数据
const planetData = {
    sun: {
        name: "太阳",
        radius: 696340, // 实际半径（千米）
        displayRadius: 30, // 显示用的半径（缩放前）
        texture: "assets/textures/sun.jpg",
        rotationPeriod: 27, // 天
        glowColor: 0xffff00
    },
    mercury: {
        name: "水星",
        radius: 2439.7, // 实际半径（千米）
        displayRadius: 2.4, // 显示用的半径（缩放前）
        distance: 58, // 缩放后的距离（百万千米）
        realDistance: 57.9, // 实际距离（百万千米）
        orbitalPeriod: 0.24, // 年
        rotationPeriod: 58.6, // 天
        texture: "assets/textures/mercury.jpg",
        inclination: 0.03
    },
    venus: {
        name: "金星",
        radius: 6051.8,
        displayRadius: 6.0,
        distance: 108,
        realDistance: 108.2,
        orbitalPeriod: 0.62,
        rotationPeriod: -243, // 负值表示逆向自转
        texture: "assets/textures/venus.jpg",
        inclination: 0.03
    },
    earth: {
        name: "地球",
        radius: 6371,
        displayRadius: 6.4,
        distance: 150,
        realDistance: 149.6,
        orbitalPeriod: 1.0,
        rotationPeriod: 1.0,
        texture: "assets/textures/earth.jpg",
        inclination: 0.00
    },
    mars: {
        name: "火星",
        radius: 3389.5,
        displayRadius: 3.4,
        distance: 228,
        realDistance: 227.9,
        orbitalPeriod: 1.88,
        rotationPeriod: 1.03,
        texture: "assets/textures/mars.jpg",
        inclination: 0.03
    },
    jupiter: {
        name: "木星",
        radius: 69911,
        displayRadius: 69.9,
        distance: 778,
        realDistance: 778.6,
        orbitalPeriod: 11.86,
        rotationPeriod: 0.41,
        texture: "assets/textures/jupiter.jpg",
        inclination: 0.05
    },
    saturn: {
        name: "土星",
        radius: 58232,
        displayRadius: 58.2,
        distance: 1427,
        realDistance: 1433.5,
        orbitalPeriod: 29.46,
        rotationPeriod: 0.44,
        texture: "assets/textures/saturn.jpg",
        ringsTexture: "assets/textures/saturn_rings.png",
        ringsInnerRadius: 70,
        ringsOuterRadius: 120,
        inclination: 0.08
    },
    uranus: {
        name: "天王星",
        radius: 25362,
        displayRadius: 25.4,
        distance: 2871,
        realDistance: 2872.5,
        orbitalPeriod: 84.01,
        rotationPeriod: -0.72, // 负值表示逆向自转
        texture: "assets/textures/uranus.jpg",
        ringsTexture: "assets/textures/uranus_rings.png",
        ringsInnerRadius: 32,
        ringsOuterRadius: 40,
        inclination: 0.20
    },
    neptune: {
        name: "海王星",
        radius: 24622,
        displayRadius: 24.6,
        distance: 4498,
        realDistance: 4495.1,
        orbitalPeriod: 164.8,
        rotationPeriod: 0.67,
        texture: "assets/textures/neptune.jpg",
        inclination: 0.06
    },
    moon: {
        name: "月球",
        radius: 1737.4,
        displayRadius: 1.7,
        distance: 0.384, // 相对于地球的距离
        realDistance: 0.384, // 距离地球（百万千米）
        orbitalPeriod: 0.073, // 相对于地球的公转周期（月）
        rotationPeriod: 27.3, // 天
        texture: "assets/textures/moon.jpg",
        parentPlanet: "earth"
    },
    phobos: {
        name: "火卫一",
        radius: 11.267,
        displayRadius: 0.5,
        distance: 0.009, // 相对于火星的距离
        realDistance: 0.009, // 距离火星（百万千米）
        orbitalPeriod: 0.0008, // 火星日
        rotationPeriod: 0.0008, // 同步自转
        texture: "assets/textures/phobos.jpg",
        parentPlanet: "mars"
    },
    deimos: {
        name: "火卫二",
        radius: 6.2,
        displayRadius: 0.4,
        distance: 0.023, // 相对于火星的距离
        realDistance: 0.023, // 距离火星（百万千米）
        orbitalPeriod: 0.003, // 火星日
        rotationPeriod: 0.003, // 同步自转
        texture: "assets/textures/deimos.jpg",
        parentPlanet: "mars"
    }
};

// 创建所有天体的映射，用于射线检测
const celestialBodies = {};

// 缩放因子（为了可视化效果）
const distanceScale = 1.2; // 进一步减小距离缩放
const sizeScale = 1.2;   // 增大行星尺寸，使其更容易看到

// 初始化
init();
animate();

/**
 * 初始化场景、相机和渲染器
 */
function init() {
    // 创建场景
    scene = new THREE.Scene();
    
    // 创建相机
    camera = new THREE.PerspectiveCamera(
        60, // 视野角度
        window.innerWidth / window.innerHeight, // 宽高比
        0.1, // 近裁剪面
        10000 // 远裁剪面
    );
    camera.position.set(0, 200, 400);
    
    // 创建渲染器
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    document.body.appendChild(renderer.domElement);
    
    // 创建控制器
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true; // 启用阻尼效果
    controls.dampingFactor = 0.05;
    
    // 初始化射线投射器
    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();
    
    // 添加星空背景
    createStarBackground();
    
    // 创建天体
    createCelestialBodies();
    
    // 添加轨道线
    createOrbits();
    
    // 添加环境光
    const ambientLight = new THREE.AmbientLight(0xaaaaaa); // 大幅增强环境光
    scene.add(ambientLight);
    
    // 添加半球光，提供更自然的环境光照
    const hemisphereLight = new THREE.HemisphereLight(0xffffff, 0x444444, 1);
    scene.add(hemisphereLight);
    
    // 添加点光源（太阳）
    const sunLight = new THREE.PointLight(0xffffff, 2, 5000); // 增加强度和范围
    scene.add(sunLight);
    
    // 事件监听器
    window.addEventListener('resize', onWindowResize);
    window.addEventListener('click', onMouseClick);
    
    // 按钮事件
    document.getElementById('toggle-orbits').addEventListener('click', toggleOrbits);
    document.getElementById('reset-camera').addEventListener('click', resetCamera);
    document.getElementById('toggle-play').addEventListener('click', togglePlay);
    
    // 速度控制
    const speedSlider = document.getElementById('speed-slider');
    speedSlider.addEventListener('input', updateSpeed);
    updateSpeedDisplay();
}

/**
 * 创建星空背景
 */
function createStarBackground() {
    const starsGeometry = new THREE.BufferGeometry();
    const starsMaterial = new THREE.PointsMaterial({
        color: 0xffffff,
        size: 1,
        sizeAttenuation: false
    });
    
    const starsVertices = [];
    for (let i = 0; i < 5000; i++) {
        const x = THREE.MathUtils.randFloatSpread(2000);
        const y = THREE.MathUtils.randFloatSpread(2000);
        const z = THREE.MathUtils.randFloatSpread(2000);
        starsVertices.push(x, y, z);
    }
    
    starsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starsVertices, 3));
    const starField = new THREE.Points(starsGeometry, starsMaterial);
    scene.add(starField);
}

/**
 * 创建天体
 */
function createCelestialBodies() {
    const textureLoader = new THREE.TextureLoader();
    
    // 创建太阳
    const sunGeo = new THREE.SphereGeometry(planetData.sun.displayRadius * sizeScale, 32, 32);
    const sunMat = new THREE.MeshBasicMaterial({
        map: textureLoader.load(planetData.sun.texture),
        emissive: 0xffff00,
        emissiveIntensity: 0.5
    });
    sun = new THREE.Mesh(sunGeo, sunMat);
    scene.add(sun);
    celestialBodies.sun = sun;
    sun.userData.planetData = planetData.sun;
    
    // 添加太阳光晕
    const sunGlowGeo = new THREE.SphereGeometry(planetData.sun.displayRadius * sizeScale * 1.2, 32, 32);
    const sunGlowMat = new THREE.MeshBasicMaterial({
        map: textureLoader.load('assets/textures/glow.png'),
        color: planetData.sun.glowColor,
        transparent: true,
        opacity: 0.5,
        blending: THREE.AdditiveBlending,
        side: THREE.BackSide
    });
    const sunGlow = new THREE.Mesh(sunGlowGeo, sunGlowMat);
    sun.add(sunGlow);
    
    // 创建行星
    mercury = createPlanet(planetData.mercury);
    venus = createPlanet(planetData.venus);
    earth = createPlanet(planetData.earth);
    mars = createPlanet(planetData.mars);
    jupiter = createPlanet(planetData.jupiter);
    saturn = createPlanet(planetData.saturn);
    uranus = createPlanet(planetData.uranus);
    neptune = createPlanet(planetData.neptune);
    
    // 添加卫星
    moon = createSatellite(planetData.moon, earth);
    phobos = createSatellite(planetData.phobos, mars);
    deimos = createSatellite(planetData.deimos, mars);
}

/**
 * 创建行星
 */
function createPlanet(data) {
    const textureLoader = new THREE.TextureLoader();
    
    // 创建行星几何体和材质
    const geometry = new THREE.SphereGeometry(data.displayRadius * sizeScale, 32, 32);
    
    // 使用MeshBasicMaterial，不依赖光照，始终可见
    const material = new THREE.MeshBasicMaterial({
        map: textureLoader.load(data.texture)
    });
    
    // 创建行星网格
    const planet = new THREE.Mesh(geometry, material);
    
    // 设置初始位置
    planet.position.x = data.distance * distanceScale;
    
    // 添加到场景
    scene.add(planet);
    
    // 将行星添加到映射中
    celestialBodies[data.name] = planet;
    planet.userData.planetData = data;
    
    // 为Saturn添加光环
    if (data.ringsTexture) {
        const ringsGeometry = new THREE.RingGeometry(
            data.ringsInnerRadius * sizeScale,
            data.ringsOuterRadius * sizeScale,
            64
        );
        
        const ringsMaterial = new THREE.MeshBasicMaterial({
            map: textureLoader.load(data.ringsTexture),
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.9
        });
        
        const rings = new THREE.Mesh(ringsGeometry, ringsMaterial);
        rings.rotation.x = Math.PI / 2;
        planet.add(rings);
    }
    
    // 添加行星标签，通过精灵显示行星名称
    const nameSprite = createPlanetLabel(data.name);
    nameSprite.position.y = data.displayRadius * sizeScale * 1.5;
    planet.add(nameSprite);
    
    return planet;
}

/**
 * 创建行星名称标签
 */
function createPlanetLabel(name) {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = 256;
    canvas.height = 64;
    
    context.font = '24px Arial';
    context.fillStyle = 'white';
    context.textAlign = 'center';
    context.fillText(name, 128, 32);
    
    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.SpriteMaterial({
        map: texture,
        transparent: true
    });
    
    const sprite = new THREE.Sprite(material);
    sprite.scale.set(30, 10, 1);
    
    return sprite;
}

/**
 * 创建卫星
 */
function createSatellite(data, parentPlanet) {
    const textureLoader = new THREE.TextureLoader();
    
    // 创建卫星几何体和材质
    const geometry = new THREE.SphereGeometry(data.displayRadius * sizeScale, 16, 16);
    // 使用MeshBasicMaterial，确保卫星可见
    const material = new THREE.MeshBasicMaterial({
        map: textureLoader.load(data.texture)
    });
    
    // 创建卫星网格
    const satellite = new THREE.Mesh(geometry, material);
    
    // 设置初始位置
    satellite.position.x = data.distance * distanceScale * 20;
    
    // 创建卫星轨道体系
    const orbitSystem = new THREE.Object3D();
    parentPlanet.add(orbitSystem);
    orbitSystem.add(satellite);
    
    // 将卫星添加到映射中
    celestialBodies[data.name] = satellite;
    satellite.userData.planetData = data;
    
    return satellite;
}

/**
 * 创建轨道线
 */
function createOrbits() {
    Object.values(planetData).forEach(planet => {
        if (planet.distance) {
            const orbitGeometry = new THREE.RingGeometry(
                planet.distance * distanceScale - 0.1, 
                planet.distance * distanceScale + 0.1, 
                128
            );
            
            const orbitMaterial = new THREE.MeshBasicMaterial({
                color: 0xffffff, // 更亮的轨道颜色
                side: THREE.DoubleSide,
                transparent: true,
                opacity: 0.3
            });
            
            const orbit = new THREE.Mesh(orbitGeometry, orbitMaterial);
            orbit.rotation.x = Math.PI / 2;
            scene.add(orbit);
            orbits.push(orbit);
        }
    });
}

/**
 * 更新天体位置和旋转
 */
function updateCelestialBodies(time) {
    if (!isPlaying) return; // 如果暂停，不更新位置
    
    // 太阳自转
    sun.rotation.y += 0.001 / planetData.sun.rotationPeriod * timeScale;
    
    // 更新行星位置和自转
    updatePlanet(mercury, time, planetData.mercury);
    updatePlanet(venus, time, planetData.venus);
    updatePlanet(earth, time, planetData.earth);
    updatePlanet(mars, time, planetData.mars);
    updatePlanet(jupiter, time, planetData.jupiter);
    updatePlanet(saturn, time, planetData.saturn);
    updatePlanet(uranus, time, planetData.uranus);
    updatePlanet(neptune, time, planetData.neptune);
    
    // 更新卫星
    updateSatellite(moon, time);
    updateSatellite(phobos, time);
    updateSatellite(deimos, time);
}

/**
 * 更新行星位置和自转
 */
function updatePlanet(planet, time, data) {
    // 公转 - 计算行星在轨道上的位置
    const angle = time * 2 * Math.PI / data.orbitalPeriod * timeScale;
    planet.position.x = Math.cos(angle) * data.distance * distanceScale;
    planet.position.z = Math.sin(angle) * data.distance * distanceScale;
    
    // 倾斜轨道平面
    if (data.inclination) {
        planet.position.y = Math.sin(angle) * data.distance * distanceScale * data.inclination;
    }
    
    // 自转 - 行星绕自身旋转
    const rotationSpeed = 0.01 / data.rotationPeriod * timeScale;
    planet.rotation.y += rotationSpeed;
}

/**
 * 更新卫星位置和自转
 */
function updateSatellite(satellite, time) {
    if (!satellite) return;
    
    const data = satellite.userData;
    
    // 公转 - 计算卫星在轨道上的位置
    satellite.parent.rotation.y += 0.02 / data.orbitalPeriod * timeScale;
    
    // 自转 - 卫星绕自身旋转
    const rotationSpeed = 0.01 / data.rotationPeriod * timeScale;
    satellite.rotation.y += rotationSpeed;
}

/**
 * 切换轨道显示/隐藏
 */
function toggleOrbits() {
    showOrbits = !showOrbits;
    
    orbits.forEach(orbit => {
        orbit.visible = showOrbits;
    });
}

/**
 * 重置相机位置
 */
function resetCamera() {
    camera.position.set(0, 200, 400); // 调整默认相机位置，使更多行星可见
    controls.target.set(0, 0, 0);
    controls.update();
}

/**
 * 切换播放/暂停状态
 */
function togglePlay() {
    isPlaying = !isPlaying;
    const button = document.getElementById('toggle-play');
    button.textContent = isPlaying ? '暂停' : '播放';
}

/**
 * 更新模拟速度
 */
function updateSpeed() {
    const slider = document.getElementById('speed-slider');
    timeScale = parseFloat(slider.value);
    updateSpeedDisplay();
}

/**
 * 更新速度显示
 */
function updateSpeedDisplay() {
    const speedValue = document.getElementById('speed-value');
    // 将timeScale转换为人类可读的速度值
    const displayValue = (timeScale / 0.1).toFixed(1) + 'x';
    speedValue.textContent = displayValue;
}

/**
 * 处理鼠标点击事件
 */
function onMouseClick(event) {
    // 计算鼠标位置的标准化设备坐标
    // (-1 到 +1 之间)
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    
    // 更新射线，从相机位置通过鼠标点击位置投射
    raycaster.setFromCamera(mouse, camera);
    
    // 计算与哪些物体相交
    const celestialArray = Object.values(celestialBodies);
    const intersects = raycaster.intersectObjects(celestialArray, true);
    
    if (intersects.length > 0) {
        // 获取第一个相交的物体
        let selectedObject = intersects[0].object;
        
        // 调试输出
        console.log("点击物体:", selectedObject);
        console.log("userData:", selectedObject.userData);
        
        // 如果点击的是子物体（如行星环或名称标签），找到父物体
        while (selectedObject && selectedObject.parent !== scene && !selectedObject.userData.planetData) {
            console.log("检查父物体:", selectedObject.parent);
            selectedObject = selectedObject.parent;
        }
        
        // 确认是天体后显示信息
        if (selectedObject && selectedObject.userData && selectedObject.userData.planetData) {
            console.log("显示天体信息:", selectedObject.userData.planetData);
            displayPlanetInfo(selectedObject.userData.planetData);
        } else {
            console.log("无法获取天体信息");
            hidePlanetInfo();
        }
    } else {
        // 如果没有点击任何天体，隐藏信息面板
        hidePlanetInfo();
    }
}

/**
 * 显示天体信息
 */
function displayPlanetInfo(data) {
    const infoPanel = document.getElementById('planet-info');
    const nameElement = document.getElementById('planet-name');
    const radiusElement = document.getElementById('planet-radius');
    const distanceElement = document.getElementById('planet-distance');
    const orbitalElement = document.getElementById('planet-orbital');
    const rotationElement = document.getElementById('planet-rotation');
    
    nameElement.textContent = data.name;
    radiusElement.textContent = data.radius.toLocaleString();
    
    // 处理距离信息
    if (data.realDistance) {
        distanceElement.textContent = data.realDistance.toLocaleString();
    } else {
        distanceElement.textContent = "不适用（恒星）";
    }
    
    // 处理公转周期
    if (data.orbitalPeriod) {
        orbitalElement.textContent = data.orbitalPeriod.toLocaleString();
    } else {
        orbitalElement.textContent = "不适用（恒星）";
    }
    
    // 处理自转周期，负值表示逆向自转
    if (data.rotationPeriod) {
        const absoluteRotation = Math.abs(data.rotationPeriod);
        const direction = data.rotationPeriod < 0 ? "（逆向自转）" : "";
        rotationElement.textContent = absoluteRotation.toLocaleString() + direction;
    } else {
        rotationElement.textContent = "未知";
    }
    
    // 显示信息面板
    infoPanel.classList.add('visible');
    
    // 使信息面板可交互
    infoPanel.style.pointerEvents = 'auto';
    document.getElementById('info').style.pointerEvents = 'auto';
}

/**
 * 隐藏天体信息
 */
function hidePlanetInfo() {
    const infoPanel = document.getElementById('planet-info');
    infoPanel.classList.remove('visible');
    
    // 恢复信息面板的不可交互状态
    document.getElementById('info').style.pointerEvents = 'none';
}

/**
 * 窗口大小变化时调整
 */
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

/**
 * 动画循环
 */
function animate() {
    requestAnimationFrame(animate);
    
    // 更新控制器
    controls.update();
    
    // 计算时间（使用自当前纪元以来的毫秒数除以1000获取秒数）
    const time = Date.now() / 1000;
    
    // 更新天体位置
    updateCelestialBodies(time);
    
    // 渲染场景
    renderer.render(scene, camera);
}