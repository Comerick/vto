var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { css, html, LitElement } from 'lit-element';
import * as vision from '@mediapipe/tasks-vision';
const { FaceLandmarker, FilesetResolver, DrawingUtils } = vision;
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { registerCustomElement } from "./common/register";
function convertLandmarksToThreeJS(landmarks, camera, depthScale = 1) {
    const threeJsLandmarks = {};
    landmarks.forEach((landmark, index) => {
        const flippedX = 1 - landmark.x; // Flip X to mirror horizontally
        const worldPosition = new THREE.Vector3((flippedX - 0.5) * 2, // Adjusted X
        -(landmark.y - 0.5) * 2, -landmark.z * depthScale).unproject(camera);
        threeJsLandmarks[index] = worldPosition;
    });
    return threeJsLandmarks;
}
let HoloVTO = class HoloVTO extends LitElement {
    constructor() {
        super(...arguments);
        this.webcamRunning = false;
        this.runningMode = 'VIDEO';
        this.debugValues = {
            posX: 0,
            posY: 0,
            posZ: 0,
            scale: 63,
            rotY: 0.14,
            rotZ: 0.5,
            planZ: 1.8,
        };
    }
    async firstUpdated() {
        this.videoElement = this.shadowRoot?.getElementById('holo-webcam');
        this.canvasElement = this.shadowRoot?.getElementById('holo-vto-canvas');
        this.canvasCtx = this.canvasElement.getContext('2d', { willReadFrequently: true });
        await this.setupFaceTracking();
        this.setupThreeJS();
        this.enableWebcam();
        this.createDebugPanel();
    }
    drawDebugPoint(position, color) {
        if (!position)
            return;
        const geometry = new THREE.SphereGeometry(0.01, 0.1, 0.1);
        const material = new THREE.MeshBasicMaterial({ color });
        const point = new THREE.Mesh(geometry, material);
        point.position.copy(position);
        this.scene.add(point);
    }
    async setupFaceTracking() {
        const filesetResolver = await FilesetResolver.forVisionTasks('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm');
        this.faceLandmarker = await FaceLandmarker.createFromOptions(filesetResolver, {
            baseOptions: {
                modelAssetPath: `https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task`,
                delegate: 'GPU',
            },
            outputFaceBlendshapes: true,
            outputFacialTransformationMatrixes: true,
            runningMode: 'VIDEO',
            numFaces: 1,
        });
        this.enableWebcam();
    }
    pushGlassesTowardsNose(landmarks) { }
    computeFaceRotation(landmarks) {
        if (!landmarks || landmarks.length === 0) {
            return new THREE.Euler(0, 0, 0);
        }
        // Define key landmarks for rotation estimation
        const noseTip = landmarks[1]; // Example index, change based on your landmark set
        const leftEye = landmarks[33]; // Adjust based on the landmark set
        const rightEye = landmarks[263]; // Adjust based on the landmark set
        const chin = landmarks[152]; // Adjust based on the landmark set
        if (!noseTip || !leftEye || !rightEye || !chin) {
            return new THREE.Euler(0, 0, 0);
        }
        // Compute direction vectors
        const eyeVector = new THREE.Vector3(rightEye.x - leftEye.x, rightEye.y - leftEye.y, rightEye.z - leftEye.z)
            .unproject(this.camera)
            .normalize(); // Left to Right eye direction
        const faceVector = new THREE.Vector3(noseTip.x - chin.x, noseTip.y - chin.y, noseTip.z - chin.z)
            .unproject(this.camera)
            .normalize(); // Nose to Chin direction
        // Compute angles
        const yaw = Math.atan2(eyeVector.y, eyeVector.x); // Horizontal rotation (left-right)
        const pitch = Math.atan2(faceVector.y, faceVector.z); // Up-down tilt
        const roll = Math.atan2(faceVector.x, faceVector.z); // Side tilt
        return new THREE.Euler(pitch, yaw, roll);
    }
    enableWebcam() {
        if (!this.faceLandmarker) {
            console.warn('Wait! faceLandmarker not loaded yet.');
            return;
        }
        navigator.mediaDevices
            .getUserMedia({
            video: {
                width: { ideal: 903 }, // Set desired width
                height: { ideal: 598 }, // Set desired height
                facingMode: 'user',
            },
        })
            .then((stream) => {
            this.videoElement.srcObject = stream;
            this.videoElement.addEventListener('loadeddata', () => {
                this.predictWebcam();
            });
        })
            .catch((error) => {
            console.error('Error accessing webcam:', error);
        });
    }
    async predictWebcam() {
        this.canvasElement.width = this.videoElement.videoWidth;
        this.canvasElement.height = this.videoElement.videoHeight;
        const startTimeMs = performance.now();
        const results = await this.faceLandmarker.detectForVideo(this.videoElement, startTimeMs);
        this.canvasCtx.clearRect(0, 0, this.canvasElement.width, this.canvasElement.height);
        this.canvasCtx.drawImage(this.videoElement, 0, 0, this.canvasElement.width, this.canvasElement.height);
        if (results.faceLandmarks.length > 0) {
            console.log('results', results);
            this.attachGlasses(results.faceLandmarks[0]);
        }
        window.requestAnimationFrame(() => this.predictWebcam());
    }
    computeGlassesPosition(landmarks) {
        const leftEye = landmarks[143]; // Left eye
        const rightEye = landmarks[372]; // Right eye
        // Calculate the position values directly
        const x = (leftEye.x + rightEye.x) / 2;
        const y = (leftEye.y + rightEye.y) / 2;
        const z = (leftEye.z + rightEye.z) / 2;
        // this.drawDebugPoint(new THREE.Vector3(leftEye.x, leftEye.y, leftEye.z), 0x00ff00); // Green for left eye
        // this.drawDebugPoint(new THREE.Vector3(rightEye.x, rightEye.y, rightEye.z), 0xff0000); // Red for right eye
        //
        // this.drawDebugPoint(new THREE.Vector3(x, y, z).unproject(this.camera), 0x808080);
        return new THREE.Vector3(x + this.debugValues.posX, y + this.debugValues.posY, z + this.debugValues.posZ);
    }
    setupThreeJS() {
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, 903 / 598, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
        this.renderer.setSize(903, 598);
        this.shadowRoot?.querySelector('div')?.appendChild(this.renderer.domElement);
        this.loader = new GLTFLoader();
        const dracoLoader = new DRACOLoader();
        dracoLoader.setDecoderPath('https://www.gstatic.com/draco/v1/decoders/');
        this.loader.setDRACOLoader(dracoLoader);
        this.renderer.localClippingEnabled = true;
        const clipPlane = new THREE.Plane(new THREE.Vector3(0, 1, 2.5), 0.8); // Adjust `0.5` to change cutoff
        this.renderer.clippingPlanes = [clipPlane];
        // 🔹 Load Glasses Model
        this.loader.load('https://onsite-backend.holostep.local/holo-api-stage-cdn/1/5590ea69-c831-4277-a80b-b2c4fb2d6a44-model.glb', (gltf) => {
            this.glasses = gltf.scene;
            this.glasses.renderOrder = 2;
            this.glasses.clippingPlanes = [clipPlane];
            this.glasses.clipShadows = true;
            this.glasses.alphaToCoverage = true;
            this.scene.add(this.glasses);
        }, undefined, (error) => console.error('GLTF Loading Error:', error));
        this.camera.position.set(0, 0, 2);
        this.camera.lookAt(0, 0, 0);
        const axesHelper = new THREE.AxesHelper(2);
        this.scene.add(axesHelper);
        this.scene.add(this.camera);
        this._animate();
    }
    attachGlasses(landmarks) {
        if (!this.glasses)
            return;
        const threeJsLandmarks = convertLandmarksToThreeJS(landmarks, this.camera);
        const position = this.computeGlassesPosition(threeJsLandmarks);
        this.glasses.position.set(position.x, position.y + 0.01, position.z);
        // todo scale
        this.glasses.scale.set(1, 1, 1);
        const drawingUtils = new DrawingUtils(this.canvasCtx);
        drawingUtils.drawConnectors(landmarks, FaceLandmarker.FACE_LANDMARKS_RIGHT_IRIS, {
            color: '#FF3030',
        });
        drawingUtils.drawConnectors(landmarks, FaceLandmarker.FACE_LANDMARKS_LEFT_IRIS, {
            color: '#30FF30',
        });
        drawingUtils.drawConnectors(landmarks, FaceLandmarker.FACE_LANDMARKS_RIGHT_EYE, {
            color: '#FF3030',
        });
        drawingUtils.drawConnectors(landmarks, FaceLandmarker.FACE_LANDMARKS_RIGHT_EYEBROW, {
            color: '#FF3030',
        });
        drawingUtils.drawConnectors(landmarks, FaceLandmarker.FACE_LANDMARKS_LEFT_EYE, {
            color: '#30FF30',
        });
        drawingUtils.drawConnectors(landmarks, FaceLandmarker.FACE_LANDMARKS_LEFT_EYEBROW, {
            color: '#30FF30',
        });
        drawingUtils.drawConnectors(landmarks, FaceLandmarker.FACE_LANDMARKS_FACE_OVAL, {
            color: '#E0E0E0',
        });
        drawingUtils.drawConnectors(landmarks, FaceLandmarker.FACE_LANDMARKS_TESSELATION, {
            color: '#C0C0C070',
            lineWidth: 1,
        });
    }
    _animate() {
        requestAnimationFrame(() => this._animate());
        this.renderer.render(this.scene, this.camera);
    }
    createDebugPanel() {
        const panel = document.createElement('div');
        panel.classList.add('debug-panel');
        panel.innerHTML = `
      <label>PosX: <input type="range" min="-1" max="1" step="0.0005" value="${this.debugValues.posX}" id="posX"></label><br>
      <label>PosY: <input type="range" min="-1" max="1" step="0.0005" value="${this.debugValues.posY}" id="posY"></label><br>
      <label>PosZ: <input type="range" min="-1" max="1" step="0.0005" value="${this.debugValues.posZ}" id="posZ"></label><br>
      <label>Scale: <input type="range" min="20" max="100" step="1" value="${this.debugValues.scale}" id="scale"></label><br>
      <label>RotY: <input type="range" min="-1" max="1" step="0.01" value="${this.debugValues.rotY}" id="rotY"></label><br>
      <label>RotZ: <input type="range" min="-1" max="1" step="0.01" value="${this.debugValues.rotZ}" id="rotZ"></label>
      <label>planZ: <input type="range" min="-2" max="2" step="0.01" value="${this.debugValues.planZ}" id="planZ"></label>
    
`;
        this.shadowRoot?.appendChild(panel);
        panel.style.display = 'block';
        panel.querySelectorAll('input').forEach((input) => {
            input.addEventListener('input', (e) => {
                const id = e.target.id;
                this.debugValues[id] = parseFloat(e.target.value);
                if (id === 'planZ') {
                    const clipPlane = new THREE.Plane(new THREE.Vector3(0, 0, parseFloat(e.target.value)), 0.8);
                    clipPlane.constant = 0.5; // Set z value
                    this.renderer.clippingPlanes = [clipPlane];
                }
            });
        });
    }
    render() {
        return html `
      <div style="height: 100%">
        <video id="holo-webcam" width="903" height="598" autoplay playsinline></video>
        <canvas id="holo-vto-canvas" width="903" height="598"></canvas>
      </div>
    `;
    }
    disconnectedCallback() {
        super.disconnectedCallback();
        if (this.faceLandmarker) {
            this.faceLandmarker.close();
        }
    }
};
HoloVTO.styles = css `
    :host {
      display: block;
      position: relative;
      width: 100%;
      height: 100%;
      overflow: hidden;
    }
    video {
      display: none;
      width: 903px;
      height: 598px;
      transform: rotateY(180deg);
      -webkit-transform: rotateY(180deg);
      -moz-transform: rotateY(180deg);
    }
    canvas {
      position: absolute;
      width: 903px;
      height: 598px;

      right: auto;
      top: 16px !important;
      left: 16px !important;
      bottom: auto;
      inset: 0;
    }
    #holo-vto-canvas {
      position: relative;
      width: 903px;
      height: 598px;
      top: 0 !important;
      left: 0 !important;
      transform: rotateY(180deg);
      -webkit-transform: rotateY(180deg);
      -moz-transform: rotateY(180deg);
    }
    #holo-webcam {
      transform: rotateY(180deg);
      -webkit-transform: rotateY(180deg);
      -moz-transform: rotateY(180deg);
    }
    .debug-panel {
      position: absolute;
      top: 10px;
      right: 10px;
      background: rgba(0, 0, 0, 0.7);
      color: white;
      padding: 10px;
      border-radius: 8px;
      display: none;
    }
    .debug-panel input {
      width: 100px;
    }
  `;
HoloVTO = __decorate([
    registerCustomElement('holo-vto')
], HoloVTO);
export { HoloVTO };
//# sourceMappingURL=vto.js.map