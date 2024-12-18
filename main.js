// 创建场景
const scene = new THREE.Scene();

// 创建相机 - 使用透视相机，设置视角、宽高比、近平面和远平面
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(10, 5, 10); // 设置相机位置
camera.lookAt(0, 0, 0); // 相机朝向原点

// 创建WebGL渲染器并配置
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight); // 设置渲染尺寸
renderer.shadowMap.enabled = true; // 启用阴影
renderer.shadowMap.type = THREE.PCFSoftShadowMap; // 使用PCF柔和阴影
renderer.outputEncoding = THREE.sRGBEncoding; // 设置sRGB颜色空间
document.body.appendChild(renderer.domElement); // 将渲染器添加到页面

// 添加轨道控制器 - 允许用户交互控制相机
const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true; // 启用阻尼效果使相机移动更平滑
controls.dampingFactor = 0.05; // 设置阻尼系数

// 添加环境光 - 提供整体柔和照明
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

// 添加平行光 - 模拟太阳光
const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(5, 5, 5);
directionalLight.castShadow = true; // 启用阴影投射
scene.add(directionalLight);

// 添加点光源 - 提供补充照明
const pointLight = new THREE.PointLight(0xffffff, 0.3);
pointLight.position.set(-5, 3, -5);
scene.add(pointLight);

// 添加聚光灯 - 创建聚焦效果
const spotLight = new THREE.SpotLight(0xffffff, 0.7);
spotLight.position.set(0, 5, 0);
spotLight.angle = Math.PI / 6; // 设置光照角度
spotLight.penumbra = 0.1; // 设置边缘渐变
spotLight.decay = 1; // 设置衰减
spotLight.distance = 100; // 设置照射距离
spotLight.castShadow = true; // 启用阴影投射
scene.add(spotLight);

// 配置平行光的阴影参数
directionalLight.shadow.mapSize.width = 1024; // 设置阴影贴图分辨率
directionalLight.shadow.mapSize.height = 1024;
directionalLight.shadow.camera.near = 1; // 设置阴影相机参数
directionalLight.shadow.camera.far = 20;
directionalLight.shadow.camera.left = -10;
directionalLight.shadow.camera.right = 10;
directionalLight.shadow.camera.top = 10;
directionalLight.shadow.camera.bottom = -10;
directionalLight.shadow.bias = -0.001; // 设置阴影偏移以减少阴影伪影

// 配置聚光灯的阴影参数
spotLight.shadow.mapSize.width = 1024;
spotLight.shadow.mapSize.height = 1024;
spotLight.shadow.camera.near = 1;
spotLight.shadow.camera.far = 20;
spotLight.shadow.bias = -0.001;

// 创建地面平面
const planeGeometry = new THREE.PlaneGeometry(10, 10);
const planeMaterial = new THREE.MeshPhongMaterial({ 
    color: 0xcccccc,
    side: THREE.DoubleSide // 使平面双面可见
});
const plane = new THREE.Mesh(planeGeometry, planeMaterial);
plane.rotation.x = Math.PI / 2; // 使平面水平放置
plane.position.y = -2; // 设置平面位置
plane.receiveShadow = true; // 使平面接收阴影
scene.add(plane);

// 创建GUI控制界面
const gui = new dat.GUI();

// 设置 GUI 中文
dat.GUI.TEXT_CLOSED = '关闭控制器';
dat.GUI.TEXT_OPEN = '打开控制器';

// 声明汽车变量
let car;

// 创建加载管理器 - 用于处理模型加载过程
const loadingManager = new THREE.LoadingManager();

// 创建加载进度UI
const loadingElem = document.createElement('div');
loadingElem.style.position = 'fixed';
loadingElem.style.top = '50%';
loadingElem.style.left = '50%';
loadingElem.style.transform = 'translate(-50%, -50%)';
loadingElem.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
loadingElem.style.padding = '20px';
loadingElem.style.borderRadius = '10px';
loadingElem.style.zIndex = '1000';
loadingElem.innerHTML = `
    <div style="text-align: center;">
        <div style="color: white; font-family: Arial; font-size: 24px;">加载中...</div>
        <div style="margin-top: 10px;">
            <div style="width: 200px; height: 5px; background: #333; border-radius: 5px;">
                <div id="progress-bar" style="width: 0%; height: 100%; background: #fff; border-radius: 5px; transition: width 0.3s;"></div>
            </div>
        </div>
    </div>
`;
document.body.appendChild(loadingElem);

// 配置加载管理器的事件处理
loadingManager.onStart = (url, loaded, total) => {
    console.log('开始加载模型...');
    loadingElem.style.display = 'block';
};

loadingManager.onProgress = (url, loaded, total) => {
    const percent = (loaded / total * 100).toFixed(2);
    const progressBar = document.getElementById('progress-bar');
    if (progressBar) {
        progressBar.style.width = `${percent}%`;
    }
    console.log(`加载进度: ${percent}%`);
};

loadingManager.onLoad = () => {
    console.log('加载完成');
    loadingElem.style.display = 'none';
};

loadingManager.onError = (url) => {
    console.error('加载出错:', url);
    loadingElem.innerHTML = `
        <div style="color: red; text-align: center;">
            加载出错!<br>
            <small style="color: #999;">请检查控制台获取详细信息</small>
        </div>
    `;
};

// 创建GLTF模型加载器
const loader = new THREE.GLTFLoader(loadingManager);

// 配置Draco压缩解码器
const dracoLoader = new THREE.DRACOLoader();
dracoLoader.setDecoderPath('https://www.gstatic.com/draco/v1/decoders/');
dracoLoader.setDecoderConfig({
    type: 'js',
    parallel: true,
    scripts: true
});
loader.setDRACOLoader(dracoLoader);

// 创建临时占位模型
const placeholder = new THREE.Mesh(
    new THREE.BoxGeometry(1, 1, 1),
    new THREE.MeshPhongMaterial({ color: 0x888888 })
);
placeholder.position.set(0, 0, 0);
scene.add(placeholder);

// 加载汽车模型
loader.load(
    './models/car.glb',
    function (gltf) {
        scene.remove(placeholder); // 移除占位模型
        car = gltf.scene;
        
        // 优化模型材质和几何体
        car.traverse((node) => {
            if (node.isMesh) {
                if (node.geometry) {
                    node.geometry.computeVertexNormals(); // 计算顶点法线
                    if (node.geometry.attributes.uv2) {
                        delete node.geometry.attributes.uv2; // 删除未使用的UV2
                    }
                }
                if (node.material) {
                    node.material.metalness = 0.7; // 设置金属度
                    node.material.roughness = 0.3; // 设置粗糙度
                    if (node.material.map) {
                        node.material.map.encoding = THREE.sRGBEncoding; // 设置纹理编码
                    }
                }
                node.castShadow = true; // 启用阴影投射
                node.receiveShadow = true; // 启用阴影接收
            }
        });

        // 调整模型大小和位置
        const box = new THREE.Box3().setFromObject(car);
        const size = box.getSize(new THREE.Vector3());
        const scale = 2 / Math.max(size.x, size.y, size.z);
        car.scale.multiplyScalar(scale);
        
        const center = box.getCenter(new THREE.Vector3());
        car.position.y = -box.min.y * scale;
        
        scene.add(car);
        
        // 调整聚光灯目标
        spotLight.target = car;
        spotLight.position.set(0, 10, 0);
        
        // 添加汽车控制GUI
        const carFolder = gui.addFolder('汽车控制');
        carFolder.add(car.rotation, 'y', 0, Math.PI * 2).name('旋转');
        carFolder.add(car.position, 'y', 0, 5).name('高度');
        carFolder.add(car.scale, 'x', 0.1, 2).name('缩放 X').onChange((value) => {
            car.scale.x = value;
        });
        carFolder.add(car.scale, 'y', 0.1, 2).name('缩放 Y').onChange((value) => {
            car.scale.y = value;
        });
        carFolder.add(car.scale, 'z', 0.1, 2).name('缩放 Z').onChange((value) => {
            car.scale.z = value;
        });

        // 添加颜色控制
        const carColors = {
            body: '#ff0000',  // 默认红色
            updateBodyColor: function() {
                car.traverse((node) => {
                    if (node.isMesh && node.material) {
                        // 检查材质名称或节点名称，只改变外部材质
                        const name = (node.material.name || node.name).toLowerCase();
                        if (name.includes('body') || 
                            name.includes('exterior') || 
                            name.includes('outside') ||
                            name.includes('car_body') ||
                            name.includes('chassis')) {
                            node.material.color = new THREE.Color(carColors.body);
                        }
                        // 其他部分（内饰）保持原样
                    }
                });
            }
        };
        
        // 添加颜色控制到GUI
        const colorFolder = carFolder.addFolder('颜色控制');
        colorFolder.addColor(carColors, 'body').name('车身外观颜色').onChange(carColors.updateBodyColor);
        colorFolder.open();
        
        carFolder.open();
    },
    undefined,
    function (error) {
        console.error('模型加载出错:', error);
    }
);

// 添加聚光灯控制GUI
const spotLightFolder = gui.addFolder('聚光灯控制');
spotLightFolder.add(spotLight, 'intensity', 0, 2).name('光照强度');
spotLightFolder.add(spotLight, 'angle', 0, Math.PI / 2).name('光照角度');
spotLightFolder.add(spotLight, 'penumbra', 0, 1).name('边缘柔和度');
spotLightFolder.add(spotLight.position, 'y', 0, 10).name('灯光高度');
spotLightFolder.open();

// 设置自动旋转参数
const autoRotate = {
    enabled: true,
    speed: 0.005
};

// 添加控制GUI
const controlsFolder = gui.addFolder('旋转控制');
controlsFolder.add(autoRotate, 'enabled').name('开启旋转');
controlsFolder.add(autoRotate, 'speed', 0, 0.05).name('旋转速度');
controlsFolder.open();

// 添加阴影控制GUI
const shadowFolder = gui.addFolder('阴影控制');
shadowFolder.add(directionalLight.shadow, 'bias', -0.01, 0.01, 0.001).name('平行光阴影');
shadowFolder.add(spotLight.shadow, 'bias', -0.01, 0.01, 0.001).name('聚光灯阴影');
shadowFolder.add(plane.position, 'y', -5, 0).name('地面位置');
shadowFolder.open();

// 动画循环函数
function animate() {
    requestAnimationFrame(animate);
    controls.update(); // 更新控制器

    // 如果汽车存在且启用了自动旋转，则旋转汽车
    if (car && autoRotate.enabled) {
        car.rotation.y += autoRotate.speed;
    }

    renderer.render(scene, camera);
}

animate();

// 监听窗口大小变化
window.addEventListener('resize', onWindowResize, false);

// 窗口大小变化处理函数
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
} 