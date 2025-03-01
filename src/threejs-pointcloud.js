function initThreeJS(container) {
    const ply_file_path = 'assets/rose.ply';  // 或者使用你需要的 .ply 文件路径
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100000);
    const renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    container.appendChild(renderer.domElement);

    // 添加 OrbitControls 控件以实现鼠标控制
    const controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;

    // 创建蓝色立方体（示例代码，可选）
    const cubeGeometry = new THREE.BoxGeometry(1, 1, 1);
    const cubeMaterial = new THREE.MeshBasicMaterial({ color: 0x0000ff });
    const cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
    // scene.add(cube); // 如果不需要显示立方体，则可注释掉

    // 加载 .ply 文件
    const loader = new THREE.PLYLoader();
    console.log("开始加载 PLY 文件:", ply_file_path);
    loader.load(ply_file_path, function (geometry) {
        console.info(".ply file loaded");
        geometry.computeVertexNormals();

        let material;
        if (geometry.attributes.color) {
            console.log("PLY file contains color information");
            material = new THREE.PointsMaterial({ size: 0.003, vertexColors: true });
        } else {
            console.log("PLY file does not contain color information, using default red color");
            material = new THREE.PointsMaterial({ size: 0.1, color: 0xff0000 });
        }
        const points = new THREE.Points(geometry, material);
        scene.add(points);
        console.log('Geometry:', geometry);
        if (!geometry.attributes.position) {
            console.error('Geometry 中缺少 position 属性');
            return;
        }
        const positions = geometry.attributes.position;
        console.log('点数量:', positions.count);
        const positionsArray = positions.array;
        for (let i = 0; i < 10; i++) {
            const x = positionsArray[i * 3];
            const y = positionsArray[i * 3 + 1];
            const z = positionsArray[i * 3 + 2];
            console.log(`Point ${i}: x=${x}, y=${y}, z=${z}`);
        }

        // 自动调整相机位置以适应点云
        const box = new THREE.Box3().setFromObject(points);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        const fov = camera.fov * (Math.PI / 180);
        let cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2));
        camera.position.set(center.x, center.y, center.z + cameraZ);
        camera.position.z = 5;
        camera.lookAt(center);
        controls.target.set(center.x, center.y, center.z);
    }, undefined, function (error) {
        console.error('加载 PLY 文件时出错:', error);
    });

    // 渲染循环
    function animate() {
        requestAnimationFrame(animate);
        controls.update();
        renderer.render(scene, camera);
    }
    animate();
}

const container = document.getElementById("app");
initThreeJS(container);
