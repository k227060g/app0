import * as THREE from "three";
import { DeviceOrientationControls } from "three/examples/jsm/controls/DeviceOrientationControls";
let w;
let h;
let canvas;
let scene;
let camera;
let renderer;
let object;
let controls;

let deviceOrienModal = null;
let deviceOrienModalButton = null;

let video = null;
let videoInput = null;
let videoStream = null;

const initVideo = () => {
  video = document.getElementById("camera");
  video.addEventListener("loadedmetadata", adjustVideo);

  navigator.mediaDevices
    .enumerateDevices()
    .then((devices) => {
      videoInput = devices.filter((device) => device.kind === "videoinput");
      getVideo();
    })
    .catch(function (error) {
      console.log(error);
    });
};

const setVideo = () => {
  return {
    audio: false,
    video: {
      deviceId: videoInput,
      facingMode: "environment",
      width: { min: 1280, max: 1920 },
      height: { min: 720, max: 1080 },
    },
  };
};

const getVideo = () => {
  if (videoStream) {
    videoStream.getTracks().forEach((track) => track.stop());
  }
  navigator.mediaDevices
    .getUserMedia(setVideo())
    .then(function (stream) {
      video.srcObject = stream;
      video.play();
      videoStream = stream;
    })
    .catch(function (error) {
      console.log(error);
      alert(
        "カメラの使用が拒否されています。\nページを再読み込みして使用を許可するか、ブラウザの設定をご確認ください。"
      );
    });
};

const adjustVideo = () => {
  const windowWidth = window.innerWidth;
  const windowHeight = window.innerHeight;
  const videoWidth = video.videoWidth;
  const videoHeight = video.videoHeight;

  let videoAspect: number = videoWidth / videoHeight;
  let windowAspect: number = windowWidth / windowHeight;

  if (windowAspect < videoAspect) {
    let newWidth: number = videoAspect * windowHeight;
    video.style.width = newWidth + "px";
    video.style.marginLeft = -(newWidth - windowWidth) / 2 + "px";
    video.style.height = windowHeight + "px";
    video.style.marginTop = "0px";
  } else {
    let newHeight: number = 1 / (videoAspect / windowWidth);
    video.style.height = newHeight + "px";
    video.style.marginTop = -(newHeight - windowHeight) / 2 + "px";
    video.style.width = windowWidth + "px";
    video.style.marginLeft = "0px";
  }
};

const isIos = () => {
  const ua = navigator.userAgent.toLowerCase();
  return (
    ua.indexOf("iphone") >= 0 ||
    ua.indexOf("ipad") >= 0 ||
    ua.indexOf("ipod") >= 0
  );
};

const checkDeviceOrien = () => {
  return new Promise((resolve, reject) => {
    if (!isIos()) resolve("resolve");

    const deviceOrienEvent = () => {
      hideDeviceOrienModal();
      window.removeEventListener("deviceorientation", deviceOrienEvent, false);
      resolve("resolve");
    };
    window.addEventListener("deviceorientation", deviceOrienEvent, false);

    deviceOrienModal = document.getElementById("device-orien-modal");
    deviceOrienModalButton = document.getElementById(
      "device-orien-modal-button"
    );
    const alertMessage =
      "モーションセンサーの使用が拒否されました。\nこのページを楽しむには、デバイスモーションセンサーの使用を許可する必要があります。\nSafariのアプリを再起動して、モーションセンサーの使用（「動作と方向」へのアクセス）を許可をしてください。";
    deviceOrienModal.classList.remove("is-hidden");

    deviceOrienModalButton.addEventListener("click", () => {
      if (
        DeviceMotionEvent &&
        (DeviceMotionEvent as any).requestPermission &&
        typeof (DeviceMotionEvent as any).requestPermission === "function"
      ) {
        (DeviceMotionEvent as any).requestPermission().then((res: any) => {});
      }
      if (
        DeviceOrientationEvent &&
        (DeviceOrientationEvent as any).requestPermission &&
        typeof (DeviceOrientationEvent as any).requestPermission === "function"
      ) {
        (DeviceOrientationEvent as any).requestPermission().then((res: any) => {
          console.log(res);
          if (res === "granted") {
            hideDeviceOrienModal();
            resolve("resolve");
          } else {
            alert(alertMessage);
            reject("resolve");
          }
        });
      } else {
        alert(alertMessage);
        reject("resolve");
      }
    });
  });
};

const hideDeviceOrienModal = () => {
  deviceOrienModal.classList.add("is-hidden");
};

const initThree = () => {
  w = window.innerWidth;
  h = window.innerHeight;
  canvas = document.getElementById("canvas");
  setScene();
  setCamera();
  setObject();
  setRenderer();
  controls = new DeviceOrientationControls(camera, true);
};

const setScene = () => {
  scene = new THREE.Scene();
};

const setCamera = () => {
  camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 30);
  camera.position.set(0, 0, 5);
  camera.lookAt(0, 0, 0);
  scene.add(camera);
};

const setObject = () => {
  const geometry = new THREE.BoxGeometry(1, 1, 1);
  const material = new THREE.MeshNormalMaterial();
  object = new THREE.Mesh(geometry, material);
  object.position.set(0, 0, 0);
  scene.add(object);
};

const setRenderer = () => {
  renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true,
    canvas: canvas,
  });
  renderer.setClearColor(0x000000, 0);
  renderer.setSize(w, h);
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setAnimationLoop(() => {
    render();
  });
};

const render = () => {
  object.rotation.x += 0.01;
  object.rotation.y += 0.01;
  controls.update();
  renderer.render(scene, camera);
};

window.onload = () => {
  checkDeviceOrien()
    .then(() => {
      initThree();
      initVideo();
    })
    .catch((error) => {
      console.log(error);
    });
};
