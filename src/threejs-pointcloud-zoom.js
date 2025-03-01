function initThreeJS(container) {
  const ply_file_path = "assets/rose.ply"; // 或者使用你需要的 .ply 文件路径
  // 用于存储平滑动画所需的曲线
  let curve = null;
  let curveT = 0;
  const curveSpeed = 0.0005; // 调整yi动速度
  const sampleCountMin = 20;
  const pointSize = 0.0006;

  let animationComplete = false; // 动画是否完成
  let autoRotationActive = false; // 是否启动新的自动旋转
  let newAngle = 0; // 用于新旋转动画的角度（以弧度计）

  // 保存初始状态：初始相机位置和模型中心
  let initialCameraPos = null;
  let initialTarget = null;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.00001,
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
  const controls = new THREE.TrackballControls(camera, renderer.domElement);
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
  const axesHelper = new THREE.AxesHelper(0.2); // 坐标轴长度 10
  scene.add(axesHelper);
  // 添加坐标轴文本标注
  function createTextSprite(text, color) {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    canvas.width = 256;
    canvas.height = 128;
    ctx.fillStyle = color;
    ctx.font = "Bold 10px Arial";
    ctx.fillText(text, 50, 60);

    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.SpriteMaterial({ map: texture });
    const sprite = new THREE.Sprite(material);
    sprite.scale.set(1, 1, 1); // 调整缩放以适应文字
    return sprite;
  }

  // 创建 X, Y, Z 轴的标注
  const labelX = createTextSprite("X", "red");
  const labelY = createTextSprite("Y", "green");
  const labelZ = createTextSprite("Z", "blue");
  // 添加标注到场景
  //scene.add(labelX, labelY, labelZ);

  // 设置标注的位置（略微偏移，使其不遮挡坐标轴）
  labelX.position.set(1, 0, 0);
  labelY.position.set(0, 1, 0);
  labelZ.position.set(0, 0, 1);

  // ---------------------------
  // 1. 添加 CameraHelper 显示相机视锥（FOV）
  const cameraHelper = new THREE.CameraHelper(camera);
  //scene.add(cameraHelper);

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
    //scene.add(cameraSprite);

    // 如果需要微调图标在相机坐标系中的位置，可以设置：
    cameraSprite.position.set(0, 0, 0); // 可根据需要调整
  });

  // 创建蓝色立方体（示例代码，可选）
  const cubeGeometry = new THREE.BoxGeometry(1, 1, 1);
  const cubeMaterial = new THREE.MeshBasicMaterial({ color: 0x0000ff });
  const cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
  // scene.add(cube); // 如果不需要显示立方体，则可注释掉

  // 用于最近邻遍历动画的数据
  let samplePoints = []; // 所有采样点
  let unvisitedPoints = []; // 未访问的采样点集合
  let isTraversing = false; // 标记是否已开始最近邻遍历

  // const capturer = new CCapture({ format: "webm", framerate: 30 });

  // 视频保存


  const stream = renderer.domElement.captureStream(30); // 30 FPS

  const options = { mimeType: "video/webm; codecs=vp8" };
  const mediaRecorder = new MediaRecorder(stream, options);
  let chunks = [];
  mediaRecorder.ondataavailable = (e) => {
    if (e.data.size > 0) {
      chunks.push(e.data);
      console.info(".ply file loaded", chunks);
    }
  };
  mediaRecorder.onstop = (e) => {
    const blob = new Blob(chunks, { type: "video/webm" });
    // 将 blob 保存为视频文件
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.style.display = "none";
    a.href = url;
    a.download = "animation.webm";
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    }, 100);
  };

  // 加载 .ply 文件
  const loader = new THREE.PLYLoader();
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
          size: pointSize,
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
      initialTarget = center.clone();
      initialCameraPos = new THREE.Vector3(center.x, center.y, center.z + 0.7);
      // 将初始位置绕 Y 轴旋转 20 度（角度转换为弧度）
      const angle = THREE.MathUtils.degToRad(-100);
      initialCameraPos.applyAxisAngle(new THREE.Vector3(0, 1, 0), angle);

      camera.position.copy(initialCameraPos);
      //camera.position.set(center.x, center.y, center.z + 50); // 初始距离可调
      camera.lookAt(center);
      controls.target.copy(center);

      // 将初始位置保存到全局变量，供动画结束后使用
      window.initialCameraPos = initialCameraPos;
      window.initialTarget = center.clone();

      // 从点云采样出部分点（例如采样最多 200 个点）
      //const positionsArray = positions.array;
      const totalPoints = positions.count;
      const sampleCount = Math.min(sampleCountMin, totalPoints);
      const step = Math.floor(totalPoints / sampleCount);
      for (let i = 0; i < totalPoints; i += step) {
        const x = positionsArray[i * 3];
        const y = positionsArray[i * 3 + 1];
        const z = positionsArray[i * 3 + 2];
        samplePoints.push(new THREE.Vector3(x, y, z));
      }
      console.log("采样点数量:", samplePoints.length);

      // 计算最近邻路径（从当前相机位置开始）
      const orderedPoints = computeNearestNeighborPath(
        samplePoints,
        camera.position
      );
      console.log("路径点数量:", orderedPoints.length);

      // 生成平滑曲线
      curve = new THREE.CatmullRomCurve3(
        orderedPoints,
        false,
        "catmullrom",
        0.5
      );
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

  // calculate a path
  // 我们先定义一个辅助函数，根据初始位置和采样的点集，得到一个有序的点序列（路径）。这种方法是：从初始位置出发，每次选择最近的未访问点，直到所有点都被访问。
  function computeNearestNeighborPath(points, startPos) {
    const unvisited = points.slice(); // 复制一个数组
    const path = [];
    let current = startPos.clone();

    while (unvisited.length > 0) {
      let nearestIndex = -1;
      let nearestDistSq = Infinity;
      for (let i = 0; i < unvisited.length; i++) {
        const distSq = current.distanceToSquared(unvisited[i]);
        if (distSq < nearestDistSq) {
          nearestDistSq = distSq;
          nearestIndex = i;
        }
      }
      const nearestPoint = unvisited.splice(nearestIndex, 1)[0];
      path.push(nearestPoint);
      current = nearestPoint;
    }
    return path;
  }

  // 定义函数：从当前点 currentPos 出发，查找 unvisitedPoints 中最近的点，并用 Tween 动画移动相机
  function traverseNearest(currentPos) {
    if (unvisitedPoints.length === 0) {
      console.log("最近邻遍历完成");
      return;
    }
    // 简单遍历 unvisitedPoints，寻找与 currentPos 距离最小的点
    let nearestIndex = -1;
    let nearestDistSq = Infinity;
    for (let i = 0; i < unvisitedPoints.length; i++) {
      const distSq = currentPos.distanceToSquared(unvisitedPoints[i]);
      if (distSq < nearestDistSq) {
        nearestDistSq = distSq;
        nearestIndex = i;
      }
    }
    // 如果找到了最近的点
    if (nearestIndex >= 0) {
      const targetPoint = unvisitedPoints[nearestIndex];
      // 从 unvisitedPoints 中移除该点
      unvisitedPoints.splice(nearestIndex, 1);

      // 为相机位置添加一个偏移（例如使相机距离 targetPoint 有一定距离）
      const offset = new THREE.Vector3(0, 0, 0.005); // 可根据需求调整偏移
      const destination = targetPoint.clone().add(offset);

      // 使用 TWEEN 创建动画，移动相机到 destination
      new TWEEN.Tween(camera.position)
        .to(
          {
            x: destination.x,
            y: destination.y,
            z: destination.z,
          },
          2000 // 动画持续时间 ms
        )
        .easing(TWEEN.Easing.Quadratic.InOut)
        .onUpdate(() => {
          // 在动画更新时，使相机始终看向 targetPoint
          camera.lookAt(targetPoint);
          controls.target.copy(targetPoint);
        })
        .onComplete(() => {
          // 动画完成后，继续从当前相机位置作为起点，搜索下一个最近邻点
          traverseNearest(camera.position.clone());
        })
        .start();
    }
  }

  // 渲染循环
  function animate() {
    //if (animationComplete) return; // 动画完成后停止更新

    requestAnimationFrame(animate);

    //TWEEN.update();

    if (!animationComplete && curve && curveT < 1 && !autoRotationActive) {
      curveT += curveSpeed;
      if (curveT >= 1) {
        // 到达曲线末端时，启动 Tween 将相机平滑移动到 (0,0,0)
        new TWEEN.Tween(camera.position)
          .to(
            {
              x: window.initialCameraPos.x,
              y: window.initialCameraPos.y,
              z: window.initialCameraPos.z,
            },
            2000 // 动画持续时间 ms
          )
          .easing(TWEEN.Easing.Quadratic.InOut)
          .onUpdate(() => {
            camera.lookAt(window.initialTarget);
            controls.target.copy(window.initialTarget);
          })
          .onComplete(() => {
            animationComplete = true;
            console.log("遍历动画完成，等待5秒后开始自动旋转");
            // 延迟5秒后启动新的自动旋转动画
            setTimeout(() => {
              autoRotationActive = true;
              newAngle = Math.atan2(
                camera.position.z - initialTarget.z,
                camera.position.x - initialTarget.x
              );
            }, 2000);
          })
          .start();
      } else {
        // 沿曲线运动
        const newPos = curve.getPoint(curveT);
        camera.position.copy(newPos);
        // 让相机看向曲线上稍后的点
        const lookAtT = Math.min(curveT + 0.01, 1);
        const lookAtPos = curve.getPoint(lookAtT);
        camera.lookAt(lookAtPos);
        controls.target.copy(lookAtPos);
      }
    }

    //mediaRecorder.stop();
    // 如果启动了自动旋转（遍历动画完成且延迟结束），则更新相机位置以绕着模型中心顺时针旋转
    //autoRotationActive = 0;
    if (autoRotationActive) {
      // 计算半径（保持相机与初始中心的距离）
      const radius = initialCameraPos.distanceTo(initialTarget);
      // 增加角度，新角度为负数以实现顺时针旋转
      newAngle += 0.002; // 调整此值控制旋转速度
      camera.position.x = initialTarget.x + radius * Math.cos(newAngle);
      camera.position.z = initialTarget.z + radius * Math.sin(newAngle);
      camera.position.y = initialCameraPos.y; // 保持高度不变
      camera.lookAt(initialTarget);
      controls.target.copy(initialTarget);

      setTimeout(() => {
        autoRotationActive = 0;
      }, 60000);// in


    }

    // 更新信息覆盖层，显示相机位置和 FOV
    infoDiv.innerHTML = `Camera Position: (${camera.position.x.toFixed(
      2
    )}, ${camera.position.y.toFixed(2)}, ${camera.position.z.toFixed(2)})<br>
        Camera Rotation: (${camera.rotation.x.toFixed(
          2
        )}, ${camera.rotation.y.toFixed(2)}, ${camera.rotation.z.toFixed(2)})`;

    controls.update();
    TWEEN.update();
    renderer.render(scene, camera);

    //capturer.capture(renderer.domElement);
  }

  mediaRecorder.start();
  setTimeout(() => {
    mediaRecorder.stop();
  }, 120000);// in

  // capturer.start();



  animate();

  // capturer.stop();
  // capturer.save();
}

const container = document.getElementById("app");
initThreeJS(container);
