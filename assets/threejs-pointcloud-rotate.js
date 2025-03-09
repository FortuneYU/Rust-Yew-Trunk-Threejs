
import * as THREE from "three";
import { TrackballControls } from "three/examples/jsm/controls/TrackballControls.js";
import { PLYLoader } from "three/examples/jsm/loaders/PLYLoader.js";

export function initThreeJS(container) {
  const ply_file_path = "assets/rose.ply"; // 或者使用你需要的 .ply 文件路径
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    100000
  );
  const renderer = new THREE.WebGLRenderer();
  renderer.setSize(window.innerWidth, window.innerHeight);
  container.appendChild(renderer.domElement);

  // 创建一个信息覆盖层显示相机的位置和 FOV
  const infoDiv = document.createElement("div");
  infoDiv.style.position = "absolute";
  infoDiv.style.top = "80px";
  infoDiv.style.left = "10px";
  infoDiv.style.padding = "5px 10px";
  infoDiv.style.color = "#ffffff";
  infoDiv.style.backgroundColor = "rgba(0, 0, 0, 0.5)";
  infoDiv.style.fontFamily = "monospace";
  document.body.appendChild(infoDiv);

  // // 添加 OrbitControls 控件以实现鼠标控制
  // const controls = new THREE.OrbitControls(camera, renderer.domElement);
  // controls.enableDamping = true;
  // controls.dampingFactor = 0.05;

  // 创建 TrackballControls 控制器
  const controls = new TrackballControls(camera, renderer.domElement);
  // 修改旋转速度（默认 1.0，调低可以减少鼠标移动的幅度）
  controls.rotateSpeed = 5;

  // 修改缩放和平移速度（可选）
  controls.zoomSpeed = 1.2;
  controls.panSpeed = 0.8;

  // 用于自动旋转的全局变量
  let autoCenter = null; // 点云中心
  let autoRadius = 5; // 点云与相机的距离
  let autoAngle = 0; // 当前角度

  // 添加坐标轴辅助线（X：红色，Y：绿色，Z：蓝色）
  const axesHelper = new THREE.AxesHelper(10); // 坐标轴长度 10
  scene.add(axesHelper);
  // 添加坐标轴文本标注
  function createTextSprite(text, color) {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    canvas.width = 256;
    canvas.height = 128;
    ctx.fillStyle = color;
    ctx.font = "Bold 40px Arial";
    ctx.fillText(text, 50, 60);

    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.SpriteMaterial({ map: texture });
    const sprite = new THREE.Sprite(material);
    sprite.scale.set(2, 1, 1); // 调整缩放以适应文字
    return sprite;
  }

  // 创建 X, Y, Z 轴的标注
  const labelX = createTextSprite("X", "red");
  const labelY = createTextSprite("Y", "green");
  const labelZ = createTextSprite("Z", "blue");
  // 添加标注到场景
  scene.add(labelX, labelY, labelZ);

  // 设置标注的位置（略微偏移，使其不遮挡坐标轴）
  labelX.position.set(11, 0, 0);
  labelY.position.set(0, 11, 0);
  labelZ.position.set(0, 0, 11);

  // ---------------------------
  // 1. 添加 CameraHelper 显示相机视锥（FOV）
  const cameraHelper = new THREE.CameraHelper(camera);
  scene.add(cameraHelper);

  // ---------------------------
  // 2. 添加相机图标（使用 Sprite）
  const textureLoader = new THREE.TextureLoader();
  // 声明全局变量
  let cameraSprite = null;

  textureLoader.load("assets/camera_icon.png", function (texture) {
    const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
    cameraSprite = new THREE.Sprite(spriteMaterial);
    // 调整图标大小，这里设置为 5 个单位
    cameraSprite.scale.set(0.05, 0.05, 0.05);
    // 方式1：直接将图标添加到场景，并在每帧更新其位置与相机同步
    cameraSprite.position.copy(camera.position);
    scene.add(cameraSprite);

    // 方式2：将图标作为相机的子对象，这样图标会随相机一起移动
    //camera.add(cameraSprite);
    // 如果需要微调图标在相机坐标系中的位置，可以设置：
    cameraSprite.position.set(0, 0, 0); // 可根据需要调整
  });

  // 创建蓝色立方体（示例代码，可选）
  const cubeGeometry = new THREE.BoxGeometry(1, 1, 1);
  const cubeMaterial = new THREE.MeshBasicMaterial({ color: 0x0000ff });
  const cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
  // scene.add(cube); // 如果不需要显示立方体，则可注释掉

  // 加载 .ply 文件
  const loader = new PLYLoader();
  console.log("开始加载 PLY 文件:", ply_file_path);
  loader.load(
    ply_file_path,
    function (geometry) {
      console.info(".ply file loaded");
      geometry.computeVertexNormals();

      let material;
      if (geometry.attributes.color) {
        console.log("PLY file contains color information");
        material = new THREE.PointsMaterial({
          size: 0.003,
          vertexColors: true,
        });
      } else {
        console.log(
          "PLY file does not contain color information, using default red color"
        );
        material = new THREE.PointsMaterial({ size: 0.1, color: 0xff0000 });
      }
      const points = new THREE.Points(geometry, material);
      scene.add(points);
      console.log("Geometry:", geometry);
      if (!geometry.attributes.position) {
        console.error("Geometry 中缺少 position 属性");
        return;
      }
      const positions = geometry.attributes.position;
      console.log("点数量:", positions.count);
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
      // 将相机初始位置设置为中心点上一定距离处

      camera.position.set(center.x, center.y, center.z + cameraZ);
      camera.position.z = 5;
      camera.lookAt(center);
      controls.target.set(center.x, center.y, center.z);
      controls.target.copy(center);

      // 保存用于自动旋转的数据
      autoCenter = center.clone();
      autoRadius = camera.position.distanceTo(center) / 5;
    },

    function (xhr) {
      console.log(
        `PLY 加载进度: ${((xhr.loaded / xhr.total) * 100).toFixed(2)}%`
      );
    },

    function (error) {
      console.error("加载 PLY 文件时出错:", error);
    }
  );

  // 渲染循环
  function animate() {
    requestAnimationFrame(animate);

    //如果点云中心已确定，则更新相机位置使其绕中心旋转
    if (autoCenter) {
      autoAngle -= 0.01; // 调整旋转速度
      camera.position.x = autoCenter.x + autoRadius * Math.cos(autoAngle);
      camera.position.z = autoCenter.z + autoRadius * Math.sin(autoAngle);
      camera.lookAt(autoCenter);
      controls.target.copy(autoCenter);
    }

    // 更新信息覆盖层，显示相机位置和 FOV
    infoDiv.innerHTML = `Camera Position: (${camera.position.x.toFixed(
      2
    )}, ${camera.position.y.toFixed(2)}, ${camera.position.z.toFixed(
      2
    )})<br>FOV: ${camera.fov.toFixed(2)}`;

    // 如果采用方式1将图标添加到场景，则在这里更新其位置
    //cameraSprite.position.copy(camera.position);

    controls.update();
    renderer.render(scene, camera);
  }
  animate();
}

const container = document.getElementById("app");
initThreeJS(container);
