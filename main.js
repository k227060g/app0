import * as THREE from './three.module.js';
import { GLTFLoader } from './GLTFLoader.js';
import { ARButton } from './ARButton.js';

// シーン、カメラ、レンダラーの初期設定
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 20);
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.domElement.style.position = 'absolute';
renderer.domElement.style.top = '0';
document.body.appendChild(renderer.domElement);
renderer.xr.enabled = true;

// 3Dモデルを配置するマーカー（仮）の作成
const markerGeometry = new THREE.CylinderGeometry(0.05, 0.05, 0.01, 32);
const markerMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000, transparent: true, opacity: 0.5 });
const marker = new THREE.Mesh(markerGeometry, markerMaterial);
marker.matrixAutoUpdate = false;
marker.visible = false;
scene.add(marker);

// GLTFモデルの読み込み
const loader = new GLTFLoader();
let loadedModel;
loader.load('./box.glb', (gltf) => {
    loadedModel = gltf.scene;
    // モデルのサイズを調整
    loadedModel.scale.set(0.2, 0.2, 0.2);
});

// UI要素の取得とARButtonの追加
const titleContainer = document.getElementById('title-container');
const arButton = ARButton.createButton(renderer, { requiredFeatures: ['hit-test'] });
document.body.appendChild(arButton);

let hitTestSource = null;
let hitTestSourceRequested = false;

// ARセッションの開始・終了イベント
renderer.xr.addEventListener('sessionstart', () => {
    titleContainer.style.display = 'none';
    renderer.domElement.style.zIndex = -1;
});

renderer.xr.addEventListener('sessionend', () => {
    titleContainer.style.display = 'block';
    renderer.domElement.style.zIndex = 0;
});

// アニメーションループ
renderer.setAnimationLoop(render);

function render(time, frame) {
    if (frame) {
        const referenceSpace = renderer.xr.getReferenceSpace();
        const session = renderer.xr.getSession();

        if (hitTestSourceRequested === false) {
            session.requestReferenceSpace('viewer').then((viewerSpace) => {
                session.requestHitTestSource({ space: viewerSpace }).then((source) => {
                    hitTestSource = source;
                });
            });
            session.addEventListener('end', () => {
                hitTestSourceRequested = false;
                hitTestSource = null;
            });
            hitTestSourceRequested = true;
        }

        if (hitTestSource) {
            const hitTestResults = frame.getHitTestResults(hitTestSource);
            if (hitTestResults.length > 0) {
                const hit = hitTestResults[0];
                const pose = hit.getPose(referenceSpace);
                
                // マーカーをAR空間に表示
                marker.visible = true;
                marker.matrix.fromArray(pose.transform.matrix);
            } else {
                // 平面が検出されない場合、マーカーを非表示にする
                marker.visible = false;
            }
        }
    }

    renderer.render(scene, camera);
}

// 画面タップでモデルを配置
window.addEventListener('click', () => {
    if (renderer.xr.isPresenting && marker.visible && loadedModel) {
        const newModel = loadedModel.clone();
        newModel.matrix.copy(marker.matrix);
        newModel.visible = true;
        scene.add(newModel);
    }
});

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}
window.addEventListener('resize', onWindowResize);
