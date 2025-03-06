"use strict";
// import { css, html, LitElement } from 'lit-element';
// import { registerCustomElement } from '@holo/util';
// //@ts-ignore
// import vision from 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3';
// const { FaceLandmarker, FilesetResolver, DrawingUtils } = vision;
//
// import * as THREE from 'three';
// import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
// import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
// import { getRotationMatrixForGlasses } from './common/util';
// const { FACE_LANDMARKS_RIGHT_EYE, FACE_LANDMARKS_LEFT_EYE } = FaceLandmarker;
// function normalizeLandmarks(landmarks, canvasWidth, canvasHeight) {
//   let normalizedLandmarks = {};
//
//   landmarks.forEach((point, index) => {
//     normalizedLandmarks[index] = {
//       x: point.x * canvasWidth,
//       y: point.y * canvasHeight,
//       z: point.z, // Add z index
//     };
//   });
//
//   return normalizedLandmarks;
// }
// function getPoseArray(faceLandmarkerResult) {
//   if (
//     !faceLandmarkerResult ||
//     !faceLandmarkerResult.facialTransformationMatrixes ||
//     faceLandmarkerResult.facialTransformationMatrixes.length === 0
//   ) {
//     return null;
//   }
//
//   // Extract the transformation matrix for the first detected face
//   const transformationMatrix = faceLandmarkerResult.facialTransformationMatrixes[0].data;
//   // console.log(
//   //   'transformationMatrix',
//   //   transformationMatrix,
//   //   faceLandmarkerResult.facialTransformationMatrixes,
//   // );
//   // Convert the matrix into a pose array (Pitch, Yaw, Roll, X, Y)
//   const poseArray = [
//     Math.atan2(transformationMatrix[1], transformationMatrix[5]), // Pitch
//     Math.asin(-transformationMatrix[9]), // Yaw
//     Math.atan2(transformationMatrix[8], transformationMatrix[10]), // Roll
//     transformationMatrix[12], // X translation
//     transformationMatrix[13], // Y translation
//   ];
//
//   return poseArray;
// }
//
// function computeFaceCrop(landmarks, poseArray) {
//   const pitch = poseArray[0]; // Head pitch
//   const yaw = poseArray[1]; // Head yaw
//   const roll = poseArray[2]; // Head roll
//
//   // Scaling factors for cropping based on yaw movement
//   const scaleFactor = 1.17 + Math.abs(yaw);
//   const adjustedScale = Math.min(scaleFactor, 2);
//   const safeScale = Math.min(Math.max(1.17, 1.17 - pitch), 1.3);
//
//   // Important landmark points
//   const chinX = landmarks[9].x;
//   const chinY = (landmarks[9].y + landmarks[151].y) / 2;
//   const foreheadX = landmarks[4].x;
//   const foreheadY = (landmarks[123].y + landmarks[352].y) / 2;
//
//   // Eye distance calculation for width
//   const leftEye = landmarks[143]; // Left eye center
//   const rightEye = landmarks[372]; // Right eye center
//   const cropWidth =
//     Math.sqrt((rightEye.x - leftEye.x) ** 2 + (rightEye.y - leftEye.y) ** 2) * adjustedScale;
//
//   // Face height calculation
//   const cropHeight = Math.sqrt((foreheadX - chinX) ** 2 + (foreheadY - chinY) ** 2) * safeScale;
//
//   return {
//     cropCenterX: (leftEye.x + rightEye.x) / 2,
//     cropCenterY: (chinY + foreheadY) / 2,
//     cropWidth,
//     cropHeight,
//     paddingX:
//       (cropWidth * Math.cos(Math.abs(roll)) + cropHeight * Math.sin(Math.abs(roll)) - cropWidth) /
//       2,
//     paddingY:
//       (cropWidth * Math.sin(Math.abs(roll)) + cropHeight * Math.cos(Math.abs(roll)) - cropHeight) /
//       2,
//   };
// }
// const MAX_PITCH = (Math.PI / 180) * 15;
// const MAX_YAW = (Math.PI / 180) * 30;
// const MAX_ROLL = (Math.PI / 180) * 30;
// const MAX_MOVEMENT_THRESHOLD = 0.02;
//
// function isValidPose(canvasSize, faceCrop, poseArray, prevPoseArray) {
//   if (!prevPoseArray) return true; // First frame always valid
//
//   const pitchDiff = Math.abs(prevPoseArray[0] - poseArray[0]) / Math.PI;
//   const yawDiff = Math.abs(prevPoseArray[1] - poseArray[1]) / Math.PI;
//   const rollDiff = Math.abs(prevPoseArray[2] - poseArray[2]) / Math.PI;
//   const xDiff = Math.abs(prevPoseArray[3] - poseArray[3]) / canvasSize.width;
//   const yDiff = Math.abs(prevPoseArray[4] - poseArray[4]) / canvasSize.height;
//
//   console.debug('Pose Differences', {
//     pitch: pitchDiff.toFixed(3),
//     yaw: yawDiff.toFixed(3),
//     roll: rollDiff.toFixed(3),
//     x: xDiff.toFixed(3),
//     y: yDiff.toFixed(3),
//   });
//
//   return (
//     faceCrop.cropCenterX - faceCrop.cropWidth / 2 > 0 &&
//     faceCrop.cropCenterX + faceCrop.cropWidth / 2 < canvasSize.width &&
//     faceCrop.cropCenterY - faceCrop.cropHeight / 2 > 0 &&
//     faceCrop.cropCenterY + faceCrop.cropHeight / 2 < canvasSize.height &&
//     Math.abs(poseArray[0]) < MAX_PITCH &&
//     Math.abs(poseArray[1]) < MAX_YAW &&
//     Math.abs(poseArray[2]) < MAX_ROLL &&
//     pitchDiff < MAX_MOVEMENT_THRESHOLD &&
//     yawDiff < MAX_MOVEMENT_THRESHOLD &&
//     rollDiff < MAX_MOVEMENT_THRESHOLD &&
//     xDiff < 0.01 &&
//     yDiff < 0.01
//   );
// }
// /**
//  * Compute the glasses position from facial landmarks
//  */
//
// /**
//  * Compute scale based on eye distance
//  */
// export function computeGlassesScale(landmarks) {
//   const leftEye = landmarks[143];
//   const rightEye = landmarks[372];
//
//   return Math.sqrt(
//     (rightEye.x - leftEye.x) ** 2 + (rightEye.y - leftEye.y) ** 2 + (rightEye.z - leftEye.z) ** 2,
//   );
// }
// function convertLandmarksToThreeJS(landmarks, camera, depthScale = 1) {
//   const threeJsLandmarks = {};
//
//   landmarks.forEach((landmark, index) => {
//     // Convert normalized coordinates to Three.js space
//     const worldPosition = new THREE.Vector3(
//       (landmark.x - 0.5) * 2, // Convert x to range [-1, 1]
//       -(landmark.y - 0.5) * 2, // Convert y to range [-1, 1] (flip y)
//       -landmark.z * depthScale, // Scale depth properly
//     ).unproject(camera); // Convert from camera space to world space
//
//     threeJsLandmarks[index] = worldPosition;
//   });
//
//   return threeJsLandmarks;
// }
// /**
//  * Compute rotation matrix for the glasses
//  */
// export function computeGlassesRotation(poseArray) {
//   const euler = new THREE.Euler(poseArray[0], poseArray[1], poseArray[2], 'XYZ');
//   const quaternion = new THREE.Quaternion().setFromEuler(euler);
//   return quaternion.normalize();
// }
// // Create a gradient shader material
// const LensShaderMaterial = new THREE.ShaderMaterial({
//   uniforms: {
//     color1: { value: new THREE.Color(0xffffff) }, // Base lens color
//     color2: { value: new THREE.Color(0xddddff) }, // Soft tint for edges
//     opacity: { value: 0.4 }, // Base opacity for transmission effect
//     fresnelPower: { value: 3.0 }, // Controls edge glow intensity
//     envMap: { value: null }, // Placeholder for reflection map
//     time: { value: 0.0 }, // For animation
//   },
//   vertexShader: `
//         varying vec3 vNormal;
//         varying vec3 vViewDir;
//         varying vec2 vUv;
//
//         void main() {
//             vNormal = normalize(normalMatrix * normal);
//             vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
//             vViewDir = normalize(-mvPosition.xyz);
//             vUv = uv;
//             gl_Position = projectionMatrix * mvPosition;
//         }
//     `,
//   fragmentShader: `
//         uniform vec3 color1;
//         uniform vec3 color2;
//         uniform float opacity;
//         uniform float fresnelPower;
//         uniform float time;
//         varying vec3 vNormal;
//         varying vec3 vViewDir;
//         varying vec2 vUv;
//
//         void main() {
//             // Compute Fresnel effect (bright edges)
//             float fresnel = pow(1.0 - dot(vNormal, vViewDir), fresnelPower);
//
//             // Smooth gradient tinting
//             vec3 gradientColor = mix(color1, color2, vUv.y);
//
//             // Add subtle animation effect
//             float dynamicFactor = 0.5 + 0.5 * sin(time);
//             vec3 finalColor = mix(gradientColor, vec3(1.0, 1.0, 1.0), fresnel * dynamicFactor);
//
//             gl_FragColor = vec4(finalColor, opacity + fresnel * 0.3);
//         }
//     `,
//   transparent: true,
//   depthWrite: false, // Avoids depth conflicts with transparent objects
//   side: THREE.DoubleSide,
// });
//
// const VTOShaderParams: any = {
//   vertexShader:
//     'varying vec3 vWorldPosition;\nvarying vec3 vWorldNormal;\nuniform float lensMinY;\nuniform float lensMaxY;\nvarying float heightOnLens;\n  \n  void main() {\n    vWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;\n    vec4 viewPos = modelViewMatrix * vec4(position,1.0);\n    vWorldNormal = mat3(modelMatrix) * normalize(normal);\n    gl_Position = projectionMatrix * viewPos;\n    heightOnLens = 1.0 - (position.y - lensMinY)/(lensMaxY - lensMinY);\n  }',
//   fragmentShader:
//     'precision highp float;\n#define PI 3.14159265359\nuniform int blendMode;\nuniform vec3 lensTransmission[GRADIENT_VALUES];\nuniform float lensCoatingSpecularity[GRADIENT_VALUES];\nuniform vec3 lensCoatingSpecularColor[GRADIENT_VALUES];\nuniform float heightOnLensInterpolationFactor[GRADIENT_VALUES];\nvarying float heightOnLens;\nuniform float envMapIntensity;\nuniform mat3 reflectionVecMat;\n#ifdef ENVMAP_TYPE_CUBE_UV\n  uniform sampler2D envMap;\n#else\n  uniform samplerCube envMap;\n#endif\n#include <cube_uv_reflection_fragment>\nvarying vec3 vWorldNormal;\nvarying vec3 vWorldPosition;\nvec3 sRGBToLinear(vec3 color) {\n  vec3 sRGB = color.rgb;\n  color.rgb = sRGB * (sRGB * (sRGB * 0.305306011 + 0.682171111) + 0.012522878);\n  return color;\n}\nvec4 heatmap(float val, float min, float max){\n  if(val< min) return vec4(0.0,0.0,1.0,1.0);\n  if(val> max) return vec4(1.0,0.0,0.0,1.0);\n  return mix(vec4(0.0,0.0,0.0,1.0),vec4(1.0,1.0,1.0,1.0),(val-min)/(max-min));\n}\nfloat pow5(float x) {\n    float x2 = x * x;\n    return x2 * x2 * x;\n}\nvec3 F_Schlick(const vec3 f0, const vec3 f90, const float VoH) {\n    return f0 + (f90 - f0) * pow5(1.0 - VoH);\n}\nvec3 fresnel(const vec3 f0, const vec3 f90, float LoH) {\n  return F_Schlick(f0, f90, LoH);\n}\nvec4 draw() {\n  vec3 normalWS = normalize(vWorldNormal);\n  vec3 viewDirectionWS = normalize(vWorldPosition - cameraPosition);\n  vec3 h_lensTransmission = lensTransmission[0];\n  float h_lensCoatingSpecularity = lensCoatingSpecularity[0];\n  vec3 h_lensCoatingSpecularColor = lensCoatingSpecularColor[0];\n  \n  for (int i = 0; i <GRADIENT_VALUES-1; i++) {\n    if ( heightOnLens >= heightOnLensInterpolationFactor[i] && heightOnLens < heightOnLensInterpolationFactor[i+1]) {\n      float factor = (heightOnLens - heightOnLensInterpolationFactor[i])/(heightOnLensInterpolationFactor[i+1] - heightOnLensInterpolationFactor[i]);\n      h_lensTransmission = mix( lensTransmission[i], lensTransmission[i+1], factor );\n      h_lensCoatingSpecularity = mix( lensCoatingSpecularity[i], lensCoatingSpecularity[i+1], factor );\n      h_lensCoatingSpecularColor = mix( lensCoatingSpecularColor[i], lensCoatingSpecularColor[i+1], factor );\n    }\n  }\n  if (heightOnLens >= heightOnLensInterpolationFactor[GRADIENT_VALUES -1]) {\n    h_lensTransmission = lensTransmission[GRADIENT_VALUES -1];\n    h_lensCoatingSpecularity = lensCoatingSpecularity[GRADIENT_VALUES -1];\n    h_lensCoatingSpecularColor = lensCoatingSpecularColor[GRADIENT_VALUES -1];\n  }\n  \n  vec3 rWS = normalize(reflectionVecMat*reflect(viewDirectionWS, normalWS));\n  \n  #ifdef ENVMAP_TYPE_CUBE_UV\n    vec3 envLight = textureCubeUV(envMap, vec3( rWS.x, rWS.y, rWS.z), 0.001).rgb * envMapIntensity;\n  #else\n    vec3 envLight = textureCube(envMap, vec3( -rWS.x, rWS.y, rWS.z)).rgb * envMapIntensity;\n  #endif\n  float dotNV = max(1e-4,dot(normalWS, -viewDirectionWS));\n  vec4 oColor = vec4(0., 0., 0., 1.);\n  \n  vec3 color = vec3(0.);\n  vec3 mult = vec3(1.0); \n  vec3 multTinted = h_lensTransmission;      \n  \n  if (blendMode == 0) {\n      oColor.rgb = multTinted;\n  } else if (blendMode == 1) {\n    oColor.rgb = color;\n  } else if (blendMode == 2) {    vec3 fc = fresnel(h_lensCoatingSpecularColor, vec3(1.), dotNV);\n    oColor.rgb = envLight * fc * dotNV; \n    oColor.a = h_lensCoatingSpecularity;\n  }\n  return oColor;\n}\nvoid main() {\n   vec4 color = draw();\n   gl_FragColor = color;\n}\n',
//   defines: { GRADIENT_VALUES: 2, HIDE_LENSES: 0, HIDE_FRAME: 0 },
//   // transparent: true, // Ensure transparency works
//   // depthWrite: false, // Prevent transparency artifacts
//   // depthTest: true, // Make sure it's depth-tested correctly
//   uniforms: {
//     time: { value: 0.0 }, // For animation
//     blendMode: { value: 0 },
//     // envMap: { value: new THREE.Texture() },
//     envMap: { value: null }, // Placeholder for reflection map
//     envMapIntensity: { value: 1 },
//     lensCoatingSpecularity: { value: [0.1, 0.1] },
//     reflectionVecMat: { value: new THREE.Matrix3() },
//     lensCoatingSpecularColor: { value: [new THREE.Color(1, 1, 1), new THREE.Color(1, 1, 1)] },
//     lensTransmission: { value: [new THREE.Color(0.5, 0.5, 0.5), new THREE.Color(1, 1, 1)] },
//     heightOnLensInterpolationFactor: { value: [0, 1] },
//     lensMinY: { value: -1 },
//     lensMaxY: { value: 1 },
//   },
// };
//
// @registerCustomElement('holo-vto')
// export class HoloVTO extends LitElement {
//   static styles = css`
//     :host {
//       display: block;
//       position: relative;
//       width: 100%;
//       height: 100%;
//       overflow: hidden;
//     }
//     video {
//       display: none;
//       width: 903px;
//       height: 598px;
//       transform: rotateY(180deg);
//       -webkit-transform: rotateY(180deg);
//       -moz-transform: rotateY(180deg);
//     }
//     canvas {
//       position: absolute;
//       width: 903px;
//       height: 598px;
//
//       right: auto;
//       top: 16px !important;
//       left: 16px !important;
//       bottom: auto;
//       inset: 0;
//     }
//     #holo-vto-canvas {
//       position: relative;
//       width: 903px;
//       height: 598px;
//       top: 0 !important;
//       left: 0 !important;
//       transform: rotateY(180deg);
//       -webkit-transform: rotateY(180deg);
//       -moz-transform: rotateY(180deg);
//     }
//     #holo-webcam {
//       transform: rotateY(180deg);
//       -webkit-transform: rotateY(180deg);
//       -moz-transform: rotateY(180deg);
//     }
//     .debug-panel {
//       position: absolute;
//       top: 10px;
//       right: 10px;
//       background: rgba(0, 0, 0, 0.7);
//       color: white;
//       padding: 10px;
//       border-radius: 8px;
//       display: none;
//     }
//     .debug-panel input {
//       width: 100px;
//     }
//   `;
//
//   videoElement;
//   scene;
//   camera;
//   renderer;
//   glasses;
//   loader;
//   clock;
//   canvasElement;
//   canvasCtx;
//   faceLandmarker;
//   webcamRunning = false;
//   runningMode = 'VIDEO';
//
//   debugValues = {
//     posX: 0,
//     posY: 0,
//     posZ: 0,
//     scale: 63,
//     rotY: 0.14,
//     rotZ: 0.5,
//     planZ: 1.8,
//   };
//
//   async firstUpdated() {
//     this.videoElement = this.shadowRoot?.getElementById('holo-webcam');
//     this.canvasElement = this.shadowRoot?.getElementById('holo-vto-canvas');
//     this.canvasCtx = this.canvasElement.getContext('2d', { willReadFrequently: true });
//
//     await this.setupFaceTracking();
//     this.setupThreeJS();
//     this.enableWebcam();
//
//     this.createDebugPanel();
//   }
//
//   async setupFaceTracking() {
//     const filesetResolver = await FilesetResolver.forVisionTasks(
//       'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm',
//     );
//
//     this.faceLandmarker = await FaceLandmarker.createFromOptions(filesetResolver, {
//       baseOptions: {
//         modelAssetPath: `https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task`,
//         delegate: 'GPU',
//       },
//       outputFaceBlendshapes: false,
//       outputFacialTransformationMatrixes: true,
//       runningMode: 'VIDEO',
//       numFaces: 1,
//     });
//
//     this.enableWebcam();
//   }
//
//   enableWebcam() {
//     if (!this.faceLandmarker) {
//       console.warn('Wait! faceLandmarker not loaded yet.');
//       return;
//     }
//
//     navigator.mediaDevices
//       .getUserMedia({
//         video: {
//           width: { ideal: 903 }, // Set desired width
//           height: { ideal: 598 }, // Set desired height
//           facingMode: 'user',
//         },
//       })
//       .then((stream) => {
//         this.videoElement.srcObject = stream;
//         this.videoElement.addEventListener('loadeddata', () => {
//           this.predictWebcam();
//         });
//       })
//       .catch((error) => {
//         console.error('Error accessing webcam:', error);
//       });
//   }
//   async predictWebcam() {
//     this.canvasElement.width = this.videoElement.videoWidth;
//     this.canvasElement.height = this.videoElement.videoHeight;
//
//     const startTimeMs = performance.now();
//     const results = await this.faceLandmarker.detectForVideo(this.videoElement, startTimeMs);
//
//     this.canvasCtx.clearRect(0, 0, this.canvasElement.width, this.canvasElement.height);
//     this.canvasCtx.drawImage(
//       this.videoElement,
//       0,
//       0,
//       this.canvasElement.width,
//       this.canvasElement.height,
//     );
//     if (results.faceLandmarks.length > 0) {
//       const poseArray = getPoseArray(results);
//       this.attachGlasses(results.faceLandmarks[0], poseArray);
//     }
//
//     window.requestAnimationFrame(() => this.predictWebcam());
//   }
//
//   computeGlassesPosition(landmarks) {
//     const leftEye = landmarks[143]; // Left eye
//     const rightEye = landmarks[372]; // Right eye
//
//     // Calculate the position values directly
//     const x = (leftEye.x + rightEye.x) / 2;
//     const y = (leftEye.y + rightEye.y) / 2;
//     const z = (leftEye.z + rightEye.z) / 2;
//
//     console.log(
//       'x: ',
//       x + this.debugValues.posX,
//       'y: ',
//       y + this.debugValues.posY,
//       'z: ',
//       z + this.debugValues.posZ,
//     );
//     return {
//       x: x + this.debugValues.posX,
//       y: y + this.debugValues.posY,
//       z: z + this.debugValues.posZ,
//     };
//   }
//   setupThreeJS() {
//     this.scene = new THREE.Scene();
//     this.camera = new THREE.PerspectiveCamera(75, 903 / 598, 0.1, 1000);
//     this.renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
//     this.renderer.setSize(903, 598);
//
//     this.shadowRoot?.querySelector('div')?.appendChild(this.renderer.domElement);
//
//     this.loader = new GLTFLoader();
//     const dracoLoader = new DRACOLoader();
//     dracoLoader.setDecoderPath('https://www.gstatic.com/draco/v1/decoders/');
//     this.loader.setDRACOLoader(dracoLoader);
//     // 🔹 Enable Global Clipping
//     this.renderer.localClippingEnabled = true;
//
//     // 🔹 Define a Clipping Plane (to hide parts behind)
//     const clipPlane = new THREE.Plane(new THREE.Vector3(0, 1, 2.5), 0.8); // Adjust `0.5` to change cutoff
//
//     // // 🔹 Enable Clipping Plane Globally
//     // this.renderer.clippingPlanes = [clipPlane];
//
//     // 🔹 Load Glasses Model
//     this.loader.load(
//       'https://onsite-backend.holostep.local/holo-api-stage-cdn/1/5590ea69-c831-4277-a80b-b2c4fb2d6a44-model.glb',
//       (gltf) => {
//         this.glasses = gltf.scene;
//         this.glasses.renderOrder = 2;
//         this.glasses.clippingPlanes = [clipPlane];
//         this.glasses.clipShadows = true;
//         this.glasses.alphaToCoverage = true;
//
//         this.scene.add(this.glasses);
//       },
//       undefined,
//       (error) => console.error('GLTF Loading Error:', error),
//     );
//
//     this.camera.position.set(0, -1, 0);
//
//     this.scene.add(this.camera);
//     this._animate();
//   }
//
//   _animateGradient(shaderMaterial) {
//     const animate = () => {
//       // console.log('shaderMaterial', shaderMaterial);
//       requestAnimationFrame(animate);
//       shaderMaterial.uniforms.time.value += 0.01; // Smoothly animate gradient over time
//     };
//     animate();
//   }
//
//   attachGlasses(landmarks, poseArray) {
//     if (!this.glasses) return;
//     const normalizedLandmarks = normalizeLandmarks(
//       landmarks,
//       this.canvasElement.width,
//       this.canvasElement.height,
//     );
//
//     // console.log('normalizedLandmarks', normalizedLandmarks);
//     const threeJsLandmarks = convertLandmarksToThreeJS(landmarks, this.camera);
//
//     const faceCrop = computeFaceCrop(threeJsLandmarks, poseArray);
//     const leftEye = threeJsLandmarks[143]; // Left eye
//     const rightEye = threeJsLandmarks[372]; // Right eye
//     const position = this.computeGlassesPosition(threeJsLandmarks);
//     // const scale = computeGlassesScale(landmarks);
//     // const rotation = computeGlassesRotation(poseArray);
//     // console.log('rot', rotation);
//
//     // this.glasses.quaternion.slerp(rotation, 0.5);
//
//     // Compute rotation using our new function
//     const headPosition = threeJsLandmarks[10]; // Approximate head center
//     const leftEar = threeJsLandmarks[234];
//     const nose = threeJsLandmarks[1]; // Nose tip position
//     const rightEar = threeJsLandmarks[454];
//
//     // console.log('position,', position, rotation);
//     // Compute the nose position
//
//     // Adjust the glasses position to include the nose offset
//     this.glasses.position.set(position.x, position.y + 0.01, position.z);
//     // this.applyGlassesCrop(faceCrop);
//
//     // todo finetune scale
//     this.glasses.scale.set(1, 1, 1);
//
//     // Align rotation using head orientatio
//     // const forward = new THREE.Vector3().subVectors(leftEye, rightEye).normalize();
//     // const up = new THREE.Vector3(0, 1, 0); // Invert Y-axis to flip direction
//     // const right = new THREE.Vector3().crossVectors(up, forward).normalize();
//     // const correctedUp = new THREE.Vector3().crossVectors(forward, right).normalize();
//     //
//     // // Adjust the rotation to ensure the glasses face the user in the opposite direction
//     // const rotationMatrixv0 = new THREE.Matrix4().makeBasis(right, correctedUp, forward);
//     console.log('headPosition, rightEar, nose', headPosition, rightEar, nose);
//     const rotationMatrix = getRotationMatrixForGlasses(poseArray, headPosition, rightEar, nose);
//     // console.log('martix', rotationMatrixv0, rotationMatrix);
//     this.glasses.setRotationFromMatrix(rotationMatrix);
//
//     // Apply additional rotation to ensure the glasses face the user correctly
//     // const additionalRotation = new THREE.Quaternion().setFromAxisAngle(
//     //   new THREE.Vector3(0, 1, 0),
//     //   -Math.PI / 2, // 90 degrees
//     // );
//     //
//     // this.glasses.quaternion.multiply(additionalRotation);
//
//     // this.glasses.quaternion.multiply(rotation);
//
//     // Debugging: Draw detected face features
//     const drawingUtils = new DrawingUtils(this.canvasCtx);
//     const geometry = new THREE.BoxGeometry(0.1, 0.1, 0.1);
//     const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
//     const cube = new THREE.Mesh(geometry, material);
//     this.scene.add(cube);
//
//     // Add more cubes to the right and left
//     const cubeLeft = new THREE.Mesh(geometry, material);
//     cubeLeft.position.set(-1, 0, 0); // Move left cube to the left
//     this.scene.add(cubeLeft);
//
//     const cubeRight = new THREE.Mesh(geometry, material);
//     cubeRight.position.set(1, 0, 0); // Move right cube to the right
//     this.scene.add(cubeRight);
//     const material2 = new THREE.MeshBasicMaterial({ color: 0xff0000 }); // Changed color to red
//     const diffCube = new THREE.Mesh(geometry, material2);
//     diffCube.position.set(position.x, position.y, position.z);
//     // this.scene.add(diffCube);
//
//     // Log positions of all cubes
//     // console.log('cube position:2', cube.position);
//     // console.log('cubeLeft position:2', cubeLeft.position);
//     // console.log('cubeRight position:2', cubeRight.position);
//
//     drawingUtils.drawConnectors(landmarks, FaceLandmarker.FACE_LANDMARKS_RIGHT_IRIS, {
//       color: '#FF3030',
//     });
//     drawingUtils.drawConnectors(landmarks, FaceLandmarker.FACE_LANDMARKS_LEFT_IRIS, {
//       color: '#30FF30',
//     });
//     drawingUtils.drawConnectors(landmarks, FaceLandmarker.FACE_LANDMARKS_RIGHT_EYE, {
//       color: '#FF3030',
//     });
//     drawingUtils.drawConnectors(landmarks, FaceLandmarker.FACE_LANDMARKS_RIGHT_EYEBROW, {
//       color: '#FF3030',
//     });
//     drawingUtils.drawConnectors(landmarks, FaceLandmarker.FACE_LANDMARKS_LEFT_EYE, {
//       color: '#30FF30',
//     });
//     drawingUtils.drawConnectors(landmarks, FaceLandmarker.FACE_LANDMARKS_LEFT_EYEBROW, {
//       color: '#30FF30',
//     });
//   }
//
//   _animate() {
//     requestAnimationFrame(() => this._animate());
//     this.renderer.render(this.scene, this.camera);
//   }
//
//   createDebugPanel() {
//     const panel = document.createElement('div');
//     panel.classList.add('debug-panel');
//     panel.innerHTML = `
//       <label>PosX: <input type="range" min="-10" max="10" step="0.1" value="${this.debugValues.posX}" id="posX"></label><br>
//       <label>PosY: <input type="range" min="-10" max="10" step="0.1" value="${this.debugValues.posY}" id="posY"></label><br>
//       <label>PosZ: <input type="range" min="-20" max="0" step="0.1" value="${this.debugValues.posZ}" id="posZ"></label><br>
//       <label>Scale: <input type="range" min="20" max="100" step="1" value="${this.debugValues.scale}" id="scale"></label><br>
//       <label>RotY: <input type="range" min="-1" max="1" step="0.01" value="${this.debugValues.rotY}" id="rotY"></label><br>
//       <label>RotZ: <input type="range" min="-1" max="1" step="0.01" value="${this.debugValues.rotZ}" id="rotZ"></label>
//       <label>planZ: <input type="range" min="-2" max="2" step="0.01" value="${this.debugValues.planZ}" id="planZ"></label>
//
// `;
//
//     this.shadowRoot?.appendChild(panel);
//     panel.style.display = 'block';
//
//     panel.querySelectorAll('input').forEach((input) => {
//       input.addEventListener('input', (e: any) => {
//         const id = e.target.id;
//         this.debugValues[id] = parseFloat(e.target.value);
//         console.log('debug', this.debugValues);
//         if (id === 'planZ') {
//           // 🔹 Enable Clipping Plane Globally
//           const clipPlane = new THREE.Plane(
//             new THREE.Vector3(0, 0, parseFloat(e.target.value)),
//             0.8,
//           );
//           console.log(parseFloat(e.target.value));
//           clipPlane.constant = 0.5; // Set z value
//           this.renderer.clippingPlanes = [clipPlane];
//         }
//       });
//     });
//   }
//
//   render() {
//     return html`
//       <div style="height: 100%">
//         <video id="holo-webcam" width="903" height="598" autoplay playsinline></video>
//         <canvas id="holo-vto-canvas" width="903" height="598"></canvas>
//       </div>
//     `;
//   }
//
//   disconnectedCallback() {
//     super.disconnectedCallback();
//     if (this.faceLandmarker) {
//       this.faceLandmarker.close();
//     }
//   }
// }
//
// declare global {
//   interface HTMLElementTagNameMap {
//     //@ts-ignore
//     'holo-vto': HoloVTO;
//   }
// }
//# sourceMappingURL=vtov.js.map