import { LitElement } from 'lit-element';
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
    };
    firstUpdated(): Promise<void>;
    setupFaceTracking(): Promise<void>;
    enableWebcam(): void;
    predictWebcam(): Promise<void>;
    setupThreeJS(): void;
    calculateEyeCenter(eyeLandmarks: any, landmarks: any): {
        x: number;
        y: number;
        z: number;
    };
    glassesKeyPoints: {
        midEye: number;
        leftEye: number;
        noseBottom: number;
        rightEye: number;
    };
    getMidEyePosition(landmarks: any): {
        x: number;
        y: number;
        z: number;
    };
    calculateGlassesPosition(landmarks: any): {
        x: number;
        y: number;
        z: number;
    };
    index: number;
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
