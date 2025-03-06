import { LitElement } from 'lit-element';
import * as THREE from 'three';
export declare class HoloVTO extends LitElement {
    static styles: import("lit-element").CSSResult;
    videoElement: any;
    scene: any;
    camera: any;
    renderer: any;
    glasses: any;
    loader: any;
    clock: any;
    canvasElement: any;
    canvasCtx: any;
    faceLandmarker: any;
    webcamRunning: boolean;
    runningMode: string;
    debugValues: {
        posX: number;
        posY: number;
        posZ: number;
        scale: number;
        rotY: number;
        rotZ: number;
        planZ: number;
    };
    firstUpdated(): Promise<void>;
    drawDebugPoint(position: any, color: any): void;
    setupFaceTracking(): Promise<void>;
    pushGlassesTowardsNose(landmarks: any): void;
    computeFaceRotation(landmarks: any): THREE.Euler;
    enableWebcam(): void;
    predictWebcam(): Promise<void>;
    computeGlassesPosition(landmarks: any): THREE.Vector3;
    setupThreeJS(): void;
    attachGlasses(landmarks: any): void;
    _animate(): void;
    createDebugPanel(): void;
    render(): import("lit-html").TemplateResult<1>;
    disconnectedCallback(): void;
}
declare global {
    interface HTMLElementTagNameMap {
        'holo-vto': HoloVTO;
    }
}
