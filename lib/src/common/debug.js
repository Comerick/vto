import * as THREE from 'three';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js';
export function createPoseText(scene, poseArray) {
    const loader = new FontLoader();
    loader.load('https://threejs.org/examples/fonts/helvetiker_regular.typeface.json', function (font) {
        const textGeometry = new TextGeometry(`Pitch: ${poseArray[0].toFixed(2)}\nYaw: ${poseArray[1].toFixed(2)}\nRoll: ${poseArray[2].toFixed(2)}\nX: ${poseArray[3].toFixed(2)}\nY: ${poseArray[4].toFixed(2)}`, {
            font: font,
            size: 0.1,
            height: 0.01,
        });
        const textMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
        const textMesh = new THREE.Mesh(textGeometry, textMaterial);
        textMesh.position.set(-1.5, 1.8, -1);
        scene.add(textMesh);
    });
}
export function createPoseDebugCubes(scene, poseArray) {
    const colors = [0xff0000, 0x00ff00, 0x0000ff, 0xffff00, 0x00ffff];
    for (let i = 0; i < 5; i++) {
        const material = new THREE.MeshBasicMaterial({ color: colors[i] });
        const cube = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.05, 0.05), material);
        cube.position.set(poseArray[3] + i * 0.1, poseArray[4] + i * 0.1, -1);
        scene.add(cube);
    }
}
export function updatePoseDebug(scene, poseArray) {
    if (!poseArray)
        return;
    createPoseText(scene, poseArray);
    createPoseDebugCubes(scene, poseArray);
}
//# sourceMappingURL=debug.js.map