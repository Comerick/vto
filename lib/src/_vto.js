var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { css, html, LitElement } from 'lit-element';
//@ts-ignore
import vision from '@mediapipe/tasks-vision';
const { FaceLandmarker, FilesetResolver, DrawingUtils } = vision;
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { registerCustomElement } from "./common/register";
const { FACE_LANDMARKS_RIGHT_EYE, FACE_LANDMARKS_LEFT_EYE } = FaceLandmarker;
let HoloVTO = class HoloVTO extends LitElement {
    constructor() {
        super(...arguments);
        this.webcamRunning = false;
        this.runningMode = 'VIDEO';
        // Adjustable values for debugging
        this.debugValues = {
            posX: -10,
            posY: 6.5,
            posZ: 0,
            scale: 63,
            rotY: 0.14,
            rotZ: 0.5,
        };
        this.glassesKeyPoints = { midEye: 168, leftEye: 143, noseBottom: 2, rightEye: 372 };
        this.index = 0;
    }
    async firstUpdated() {
        this.videoElement = this.shadowRoot?.getElementById('holo-webcam');
        this.canvasElement = this.shadowRoot?.getElementById('holo-vto-canvas');
        this.canvasCtx = this.canvasElement.getContext('2d');
        await this.setupFaceTracking();
        this.setupThreeJS();
        this.enableWebcam();
        this.createDebugPanel();
    }
    async setupFaceTracking() {
        const filesetResolver = await FilesetResolver.forVisionTasks('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm');
        this.faceLandmarker = await FaceLandmarker.createFromOptions(filesetResolver, {
            baseOptions: {
                modelAssetPath: `https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task`,
                delegate: 'GPU',
            },
            outputFaceBlendshapes: false,
            outputFacialTransformationMatrixes: true,
            runningMode: 'VIDEO',
            numFaces: 1,
        });
        this.enableWebcam();
    }
    enableWebcam() {
        if (!this.faceLandmarker) {
            console.log('Wait! faceLandmarker not loaded yet.');
            return;
        }
        navigator.mediaDevices
            .getUserMedia({
            video: {
                width: { ideal: 903 },
                height: { ideal: 598 },
            },
        })
            .then((stream) => {
            this.videoElement.srcObject = stream;
            this.videoElement.addEventListener('loadeddata', () => this.predictWebcam());
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
            this.attachGlasses(results.faceLandmarks[0]);
        }
        window.requestAnimationFrame(() => this.predictWebcam());
    }
    setupThreeJS() {
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, 903 / 598, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ alpha: true });
        this.renderer.setSize(903, 598);
        this.shadowRoot?.querySelector('div')?.appendChild(this.renderer.domElement);
        this.loader = new GLTFLoader();
        const dracoLoader = new DRACOLoader();
        dracoLoader.setDecoderPath('https://www.gstatic.com/draco/v1/decoders/');
        this.loader.setDRACOLoader(dracoLoader);
        this.loader.load('https://onsite-backend.holostep.local/holo-api-stage-cdn/1/5590ea69-c831-4277-a80b-b2c4fb2d6a44-model.glb', (gltf) => {
            this.glasses = gltf.scene;
            this.scene.add(this.glasses);
        }, undefined, (error) => console.error('GLTF Loading Error:', error));
        this.camera.position.set(0, 0, 2);
        this.clock = new THREE.Clock();
        this._animate();
    }
    calculateEyeCenter(eyeLandmarks, landmarks) {
        let sumX = 0, sumY = 0, sumZ = 0;
        let count = 0;
        for (const { start, end } of eyeLandmarks) {
            const p1 = landmarks[start];
            const p2 = landmarks[end];
            if (p1 && p2) {
                sumX += (p1.x + p2.x) / 2;
                sumY += (p1.y + p2.y) / 2;
                sumZ += (p1.z + p2.z) / 2;
                count++;
            }
        }
        return count > 0 ? { x: sumX / count, y: sumY / count, z: sumZ / count } : { x: 0, y: 0, z: 0 };
    }
    getMidEyePosition(landmarks) {
        if (!landmarks || landmarks.length === 0)
            return { x: 0, y: 0, z: 0 };
        const leftEye = landmarks[143];
        const rightEye = landmarks[372];
        return {
            x: (leftEye.x + rightEye.x) / 2,
            y: (leftEye.y + rightEye.y) / 2,
            z: (leftEye.z + rightEye.z) / 2,
        };
    }
    calculateGlassesPosition(landmarks) {
        if (!landmarks || landmarks.length === 0)
            return { x: 0, y: 0, z: 0 };
        const leftEyeCenter = this.calculateEyeCenter(FACE_LANDMARKS_LEFT_EYE, landmarks);
        const rightEyeCenter = this.calculateEyeCenter(FACE_LANDMARKS_RIGHT_EYE, landmarks);
        // Midpoint between left and right eye center
        return {
            x: (leftEyeCenter.x + rightEyeCenter.x) / 2,
            y: (leftEyeCenter.y + rightEyeCenter.y) / 2,
            z: (leftEyeCenter.z + rightEyeCenter.z) / 2,
        };
    }
    attachGlasses(landmarks) {
        if (!this.glasses)
            return;
        // Key landmarks for positioning and rotation
        // const leftEyebrow = landmarks[105]; // Center of left eyebrow
        // const browInnerUp = landmarks[3];
        // const browDownLeft = landmarks[1];
        // const browDownRight = landmarks[2];
        // const eyeBlinkLeft = landmarks[9];
        // const eyeBlinkRight = landmarks[10];
        // const eyeSquintLeft = landmarks[19];
        // const eyeSquintRight = landmarks[20];
        // const rightEyebrow = landmarks[334]; // Center of right eyebrow
        // const noseTip = landmarks[1];
        //
        // const leftEye = landmarks[33];
        // const rightEye = landmarks[263];
        // const noseBottom = landmarks[2];
        // const midEye = landmarks[168];
        // console.log('midEye', midEye, FaceLandmarker);
        // const midEyev2 = this.calculateGlassesPosition(landmarks);
        // console.log('midEye v2', midEyev2);
        //
        // this.glasses.position.x = midEyev2.x;
        // this.glasses.position.y = -midEyev2.y + parseFloat('0');
        // this.glasses.position.z = -this.camera.position.z + midEyev2.z;
        // this.glasses.up.x = midEye[0] - noseBottom[0];
        // this.glasses.up.y = -(midEye[1] - noseBottom[1]);
        // this.glasses.up.z = midEye[2] - noseBottom[2];
        // const length = Math.sqrt(
        //   this.glasses.up.x ** 2 + this.glasses.up.y ** 2 + this.glasses.up.z ** 2,
        // );
        // this.glasses.up.x /= length;
        // this.glasses.up.y /= length;
        // this.glasses.up.z /= length;
        //
        // const eyeDist = Math.sqrt(
        //   (leftEye[0] - rightEye[0]) ** 2 +
        //     (leftEye[1] - rightEye[1]) ** 2 +
        //     (leftEye[2] - rightEye[2]) ** 2,
        // );
        // // scale the glasses to fit the eye distance
        // this.glasses.scale.x = eyeDist * parseFloat('1');
        // this.glasses.scale.y = eyeDist * parseFloat('1');
        // this.glasses.scale.z = eyeDist * parseFloat('1');
        //
        // this.glasses.rotation.y = Math.PI;
        // this.glasses.rotation.z = Math.PI / 2 - Math.acos(this.glasses.up.x);
        // this.renderer.render(this.scene, this.camera);
        // Key facial landmarks for positioning
        const leftEyebrow = landmarks[105]; // Approx. center of left eyebrow
        const rightEyebrow = landmarks[334]; // Approx. center of right eyebrow
        const leftEye = landmarks[263];
        const rightEye = landmarks[33];
        const eyeCenter = landmarks[168];
        const noseTip = landmarks[1];
        // Get mid-eye position
        const midEye = this.getMidEyePosition(landmarks);
        // console.log('Mid Eye Position:', midEye);
        // Set glasses position to mid-eye
        // console.log(
        //   midEye,
        //   this.glasses.position,
        //   this.debugValues.posX,
        //   this.debugValues.posY,
        //   this.debugValues.posZ,
        // );
        // this.glasses.position.set(this.debugValues.posX, this.debugValues.posY, this.debugValues.posZ);
        // console.log('mideye... v2', midEye);
        // Compute position as midpoint between eyebrows
        const centerX = (leftEye.x + rightEye.x) / 2;
        const centerY = (leftEye.y + rightEye.y) / 2;
        const centerZ = (leftEye.z + rightEye.z) / 2;
        // Convert to world space
        const posX = leftEye.x;
        const posY = leftEye.y;
        const posZ = leftEye.z;
        // // Draw a small cube at the position of the left eye
        // const cubeGeometry = new THREE.BoxGeometry(0.1, 0.1, 0.1);
        // const cubeMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
        // const cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
        // cube.position.set(posX, posY, posZ);
        // this.scene.add(cube);
        //
        // // Draw a small cube at the position of the right eye
        // const cubeGeometry2 = new THREE.BoxGeometry(0.1, 0.1, 0.1);
        // const cubeMaterial2 = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
        // const cube2 = new THREE.Mesh(cubeGeometry2, cubeMaterial2);
        // cube2.position.set(rightEye.x, rightEye.y, rightEye.z);
        // this.scene.add(cube2);
        // Draw a small cube at the position of the right eye
        const cubeGeometry3 = new THREE.BoxGeometry(0.1, 0.1, 0.1);
        const cubeMaterial3 = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
        const cube3 = new THREE.Mesh(cubeGeometry3, cubeMaterial3);
        this.index += 1;
        const point = landmarks[this.index];
        console.log('point..', point, this.index, landmarks);
        if (point) {
            const x = (point.x - 0.5) * 4; // Center at (0,0)
            const y = -(point.y - 0.5) * 4; // Invert Y-axis for Three.js
            const z = point.z * -2; // Adjust depth scaling (tune this value)
            cube3.position.set(x, y, z);
            console.log('FACE_LANDMARKS_LEFT_EYE', FACE_LANDMARKS_LEFT_EYE[0], point);
            this.scene.add(cube3);
        }
        // this.glasses.position.set(posX, posY, posZ);
        // Compute scale based on eye distance
        const faceWidth = Math.abs(rightEye.x - leftEye.x) * this.debugValues.scale;
        this.glasses.scale.set(faceWidth, faceWidth, faceWidth);
        //
        // // Compute rotation using eyebrow orientation
        // const dx = rightEyebrow.x - leftEyebrow.x;
        // const dy = rightEyebrow.y - leftEyebrow.y;
        // const dz = rightEyebrow.z - leftEyebrow.z;
        //
        // const rotationY = Math.atan2(dy, dx) + this.debugValues.rotY; // Horizontal tilt
        // const rotationZ = Math.atan2(dz, dx) + this.debugValues.rotZ; // Depth tilt
        //
        // this.glasses.rotation.set(0, -rotationY, -rotationZ);
        // Debugging: Draw detected face features
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
    }
    _animate() {
        requestAnimationFrame(() => this._animate());
        this.renderer.render(this.scene, this.camera);
    }
    createDebugPanel() {
        const panel = document.createElement('div');
        panel.classList.add('debug-panel');
        panel.innerHTML = `
      <label>PosX: <input type="range" min="-10" max="10" step="0.1" value="${this.debugValues.posX}" id="posX"></label><br>
      <label>PosY: <input type="range" min="-10" max="10" step="0.1" value="${this.debugValues.posY}" id="posY"></label><br>
      <label>PosZ: <input type="range" min="-20" max="0" step="0.1" value="${this.debugValues.posZ}" id="posZ"></label><br>
      <label>Scale: <input type="range" min="20" max="100" step="1" value="${this.debugValues.scale}" id="scale"></label><br>
      <label>RotY: <input type="range" min="-1" max="1" step="0.01" value="${this.debugValues.rotY}" id="rotY"></label><br>
      <label>RotZ: <input type="range" min="-1" max="1" step="0.01" value="${this.debugValues.rotZ}" id="rotZ"></label>
    
`;
        this.shadowRoot?.appendChild(panel);
        panel.style.display = 'block';
        panel.querySelectorAll('input').forEach((input) => {
            input.addEventListener('input', (e) => {
                const id = e.target.id;
                this.debugValues[id] = parseFloat(e.target.value);
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
//# sourceMappingURL=_vto.js.map