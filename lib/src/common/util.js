import * as THREE from 'three';
const MAX_PITCH = (Math.PI / 180) * 15;
const MAX_YAW = (Math.PI / 180) * 30;
const MAX_ROLL = (Math.PI / 180) * 30;
const MAX_MOVEMENT_THRESHOLD = 0.02;
function isValidPose(canvasSize, faceCrop, poseArray, prevPoseArray) {
    if (!prevPoseArray)
        return true; // First frame always valid
    const pitchDiff = Math.abs(prevPoseArray[0] - poseArray[0]) / Math.PI;
    const yawDiff = Math.abs(prevPoseArray[1] - poseArray[1]) / Math.PI;
    const rollDiff = Math.abs(prevPoseArray[2] - poseArray[2]) / Math.PI;
    const xDiff = Math.abs(prevPoseArray[3] - poseArray[3]) / canvasSize.width;
    const yDiff = Math.abs(prevPoseArray[4] - poseArray[4]) / canvasSize.height;
    return (faceCrop.cropCenterX - faceCrop.cropWidth / 2 > 0 &&
        faceCrop.cropCenterX + faceCrop.cropWidth / 2 < canvasSize.width &&
        faceCrop.cropCenterY - faceCrop.cropHeight / 2 > 0 &&
        faceCrop.cropCenterY + faceCrop.cropHeight / 2 < canvasSize.height &&
        Math.abs(poseArray[0]) < MAX_PITCH &&
        Math.abs(poseArray[1]) < MAX_YAW &&
        Math.abs(poseArray[2]) < MAX_ROLL &&
        pitchDiff < MAX_MOVEMENT_THRESHOLD &&
        yawDiff < MAX_MOVEMENT_THRESHOLD &&
        rollDiff < MAX_MOVEMENT_THRESHOLD &&
        xDiff < 0.01 &&
        yDiff < 0.01);
}
export function getRotationMatrixForGlassesv0(headPosition, rightEar, nose) {
    // Convert positions to THREE.js Vector3
    const headVector = new THREE.Vector3(headPosition.x, headPosition.y, headPosition.z);
    const earVector = new THREE.Vector3(rightEar.x, rightEar.y, rightEar.z);
    const noseVector = new THREE.Vector3(nose.x, nose.y, nose.z);
    // Compute direction vectors
    const forward = new THREE.Vector3().subVectors(noseVector, headVector).normalize();
    const right = new THREE.Vector3().subVectors(earVector, headVector).normalize();
    const up = new THREE.Vector3().crossVectors(forward, right).normalize();
    // Construct the rotation matrix
    const rotationMatrix = new THREE.Matrix4();
    rotationMatrix.makeBasis(right, up, forward);
    return rotationMatrix;
}
export function computeGlassesScale(landmarks) {
    const leftEye = landmarks[143];
    const rightEye = landmarks[372];
    return Math.sqrt((rightEye.x - leftEye.x) ** 2 + (rightEye.y - leftEye.y) ** 2 + (rightEye.z - leftEye.z) ** 2);
}
//# sourceMappingURL=util.js.map