// import * as THREE from "../node_modules/three/build/three.module.js";
//import { TrackballControls } from "../node_modules/three/examples/jsm/controls/TrackballControls.js";

import * as THREE from "three";
import { TrackballControls } from "three/examples/jsm/controls/TrackballControls.js";
import { PLYLoader } from "three/examples/jsm/Addons.js";


export function initThreeJS(container) {
  console.log("initThreeJS called with container:", container);


  // 创建文本 Sprite 的函数
  function createTextSprite(message, parameters) {
    if (parameters === undefined) parameters = {};

    const fontface = parameters.hasOwnProperty("fontface")
      ? parameters["fontface"]
      : "Arial";
    const fontsize = parameters.hasOwnProperty("fontsize")
      ? parameters["fontsize"]
      : 24;
    const borderThickness = parameters.hasOwnProperty("borderThickness")
      ? parameters["borderThickness"]
      : 4;
    const borderColor = parameters.hasOwnProperty("borderColor")
      ? parameters["borderColor"]
      : { r: 0, g: 0, b: 0, a: 1.0 };
    const backgroundColor = parameters.hasOwnProperty("backgroundColor")
      ? parameters["backgroundColor"]
      : { r: 255, g: 255, b: 255, a: 1.0 };
    const textColor = parameters.hasOwnProperty("textColor")
      ? parameters["textColor"]
      : "rgba(0,0,0,1)";

    // 创建画布
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    context.font = fontsize + "px " + fontface;
    // 计算文本宽度
    const metrics = context.measureText(message);
    const textWidth = metrics.width;

    // 根据文本尺寸调整画布大小
    canvas.width = textWidth + borderThickness * 2;
    canvas.height = fontsize * 1.4 + borderThickness * 2;

    // 绘制背景
    context.fillStyle = `rgba(${backgroundColor.r},${backgroundColor.g},${backgroundColor.b},${backgroundColor.a})`;
    context.fillRect(0, 0, canvas.width, canvas.height);
    // 绘制边框
    context.strokeStyle = `rgba(${borderColor.r},${borderColor.g},${borderColor.b},${borderColor.a})`;
    context.lineWidth = borderThickness;
    context.strokeRect(0, 0, canvas.width, canvas.height);
    // 绘制文本
    context.fillStyle = textColor;
    context.font = fontsize + "px " + fontface;
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText(message, canvas.width / 2, canvas.height / 2);

    // 生成纹理和 Sprite
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
    const sprite = new THREE.Sprite(spriteMaterial);
    // 根据需要调整 Sprite 的大小
    sprite.scale.set(canvas.width / 10, canvas.height / 10, 1);
    return sprite;
  }




  /// 初始化场景
  // 示例：添加网格和坐标轴，并在轴旁边添加标注
  function initScene() {
    const scene = new THREE.Scene();

    // 添加网格辅助器
    const gridHelper = new THREE.GridHelper(200, 50);
    scene.add(gridHelper);

    // 添加坐标轴辅助器，长度 100
    const axesHelper = new THREE.AxesHelper(100);
    scene.add(axesHelper);

    // 创建 X, Y, Z 的标注
    const labelX = createTextSprite("X", {
      fontsize: 100,
      textColor: "red",
      backgroundColor: { r: 255, g: 255, b: 255, a: 0.0 },
      borderThickness: 0,
    });
    const labelY = createTextSprite("Y", {
      fontsize: 100,
      textColor: "green",
      backgroundColor: { r: 255, g: 255, b: 255, a: 0.0 },
      borderThickness: 0,
    });
    const labelZ = createTextSprite("Z", {
      fontsize: 100,
      textColor: "blue",
      backgroundColor: { r: 255, g: 255, b: 255, a: 0.0 },
      borderThickness: 0,
    });

    // 设置标注位置（相对于坐标轴末端）
    labelX.position.set(110, 0, 0); // X 轴末端稍偏右
    labelY.position.set(0, 110, 0); // Y 轴末端稍偏上
    labelZ.position.set(0, 0, 110); // Z 轴末端稍偏前

    scene.add(labelX);
    scene.add(labelY);
    scene.add(labelZ);

    console.log("scean initialed!!");

    return scene;
  }




// 1. 创建场景
  //const scene = new THREE.Scene();
  const scene = initScene();

  // 2. 创建摄像头
  const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    100000
  );
  camera.position.set(0, 0, 500); // 设置合适的初始位置


  // 3. 创建渲染器
  const renderer = new THREE.WebGLRenderer();
  renderer.setSize(window.innerWidth, window.innerHeight);

  container.appendChild(renderer.domElement);


  // 4. 创建 TrackballControls 控制器
  const controls = new TrackballControls(camera, renderer.domElement);
  // 修改旋转速度（默认 1.0，调低可以减少鼠标移动的幅度）
  controls.rotateSpeed = 5;
  // 修改缩放和平移速度（可选）
  controls.zoomSpeed = 1.2;
  controls.panSpeed = 0.8;

  // 5.创建物体
  const boxGeometry = new THREE.BoxGeometry(100, 100, 100, 2, 2, 2);
  const sphereGeometry = new THREE.SphereGeometry(100, 12, 12);
  const material = new THREE.PointsMaterial({
    color: 0xffffff,
    size: 2,
    transparent: true,
  });
  const point_new = new THREE.Points(boxGeometry, material);

  // 6.将物体添加到场景中
  scene.add(point_new);
  //scene.add(camera);

  // 7. 创建动画
  function animate() {
    requestAnimationFrame(animate);
    //point_new.rotation.y+=0.001;

    controls.update();
    renderer.render(scene, camera);
  }

  //8. 运行动画
  animate();
}

window.initThreeJS = initThreeJS; // Expose to global scope
