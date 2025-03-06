import * as THREE from 'three';
export const LensShaderMaterial = new THREE.ShaderMaterial({
    uniforms: {
        color1: { value: new THREE.Color(0xffffff) }, // Base lens color
        color2: { value: new THREE.Color(0xddddff) }, // Soft tint for edges
        opacity: { value: 0.4 }, // Base opacity for transmission effect
        fresnelPower: { value: 3.0 }, // Controls edge glow intensity
        envMap: { value: null }, // Placeholder for reflection map
        time: { value: 0.0 }, // For animation
    },
    vertexShader: `
        varying vec3 vNormal;
        varying vec3 vViewDir;
        varying vec2 vUv;

        void main() {
            vNormal = normalize(normalMatrix * normal);
            vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
            vViewDir = normalize(-mvPosition.xyz);
            vUv = uv;
            gl_Position = projectionMatrix * mvPosition;
        }
    `,
    fragmentShader: `
        uniform vec3 color1;
        uniform vec3 color2;
        uniform float opacity;
        uniform float fresnelPower;
        uniform float time;
        varying vec3 vNormal;
        varying vec3 vViewDir;
        varying vec2 vUv;

        void main() {
            // Compute Fresnel effect (bright edges)
            float fresnel = pow(1.0 - dot(vNormal, vViewDir), fresnelPower);

            // Smooth gradient tinting
            vec3 gradientColor = mix(color1, color2, vUv.y);

            // Add subtle animation effect
            float dynamicFactor = 0.5 + 0.5 * sin(time);
            vec3 finalColor = mix(gradientColor, vec3(1.0, 1.0, 1.0), fresnel * dynamicFactor);

            gl_FragColor = vec4(finalColor, opacity + fresnel * 0.3);
        }
    `,
    transparent: true,
    depthWrite: false, // Avoids depth conflicts with transparent objects
    side: THREE.DoubleSide,
});
export const VTOShaderParams = {
    vertexShader: 'varying vec3 vWorldPosition;\nvarying vec3 vWorldNormal;\nuniform float lensMinY;\nuniform float lensMaxY;\nvarying float heightOnLens;\n  \n  void main() {\n    vWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;\n    vec4 viewPos = modelViewMatrix * vec4(position,1.0);\n    vWorldNormal = mat3(modelMatrix) * normalize(normal);\n    gl_Position = projectionMatrix * viewPos;\n    heightOnLens = 1.0 - (position.y - lensMinY)/(lensMaxY - lensMinY);\n  }',
    fragmentShader: 'precision highp float;\n#define PI 3.14159265359\nuniform int blendMode;\nuniform vec3 lensTransmission[GRADIENT_VALUES];\nuniform float lensCoatingSpecularity[GRADIENT_VALUES];\nuniform vec3 lensCoatingSpecularColor[GRADIENT_VALUES];\nuniform float heightOnLensInterpolationFactor[GRADIENT_VALUES];\nvarying float heightOnLens;\nuniform float envMapIntensity;\nuniform mat3 reflectionVecMat;\n#ifdef ENVMAP_TYPE_CUBE_UV\n  uniform sampler2D envMap;\n#else\n  uniform samplerCube envMap;\n#endif\n#include <cube_uv_reflection_fragment>\nvarying vec3 vWorldNormal;\nvarying vec3 vWorldPosition;\nvec3 sRGBToLinear(vec3 color) {\n  vec3 sRGB = color.rgb;\n  color.rgb = sRGB * (sRGB * (sRGB * 0.305306011 + 0.682171111) + 0.012522878);\n  return color;\n}\nvec4 heatmap(float val, float min, float max){\n  if(val< min) return vec4(0.0,0.0,1.0,1.0);\n  if(val> max) return vec4(1.0,0.0,0.0,1.0);\n  return mix(vec4(0.0,0.0,0.0,1.0),vec4(1.0,1.0,1.0,1.0),(val-min)/(max-min));\n}\nfloat pow5(float x) {\n    float x2 = x * x;\n    return x2 * x2 * x;\n}\nvec3 F_Schlick(const vec3 f0, const vec3 f90, const float VoH) {\n    return f0 + (f90 - f0) * pow5(1.0 - VoH);\n}\nvec3 fresnel(const vec3 f0, const vec3 f90, float LoH) {\n  return F_Schlick(f0, f90, LoH);\n}\nvec4 draw() {\n  vec3 normalWS = normalize(vWorldNormal);\n  vec3 viewDirectionWS = normalize(vWorldPosition - cameraPosition);\n  vec3 h_lensTransmission = lensTransmission[0];\n  float h_lensCoatingSpecularity = lensCoatingSpecularity[0];\n  vec3 h_lensCoatingSpecularColor = lensCoatingSpecularColor[0];\n  \n  for (int i = 0; i <GRADIENT_VALUES-1; i++) {\n    if ( heightOnLens >= heightOnLensInterpolationFactor[i] && heightOnLens < heightOnLensInterpolationFactor[i+1]) {\n      float factor = (heightOnLens - heightOnLensInterpolationFactor[i])/(heightOnLensInterpolationFactor[i+1] - heightOnLensInterpolationFactor[i]);\n      h_lensTransmission = mix( lensTransmission[i], lensTransmission[i+1], factor );\n      h_lensCoatingSpecularity = mix( lensCoatingSpecularity[i], lensCoatingSpecularity[i+1], factor );\n      h_lensCoatingSpecularColor = mix( lensCoatingSpecularColor[i], lensCoatingSpecularColor[i+1], factor );\n    }\n  }\n  if (heightOnLens >= heightOnLensInterpolationFactor[GRADIENT_VALUES -1]) {\n    h_lensTransmission = lensTransmission[GRADIENT_VALUES -1];\n    h_lensCoatingSpecularity = lensCoatingSpecularity[GRADIENT_VALUES -1];\n    h_lensCoatingSpecularColor = lensCoatingSpecularColor[GRADIENT_VALUES -1];\n  }\n  \n  vec3 rWS = normalize(reflectionVecMat*reflect(viewDirectionWS, normalWS));\n  \n  #ifdef ENVMAP_TYPE_CUBE_UV\n    vec3 envLight = textureCubeUV(envMap, vec3( rWS.x, rWS.y, rWS.z), 0.001).rgb * envMapIntensity;\n  #else\n    vec3 envLight = textureCube(envMap, vec3( -rWS.x, rWS.y, rWS.z)).rgb * envMapIntensity;\n  #endif\n  float dotNV = max(1e-4,dot(normalWS, -viewDirectionWS));\n  vec4 oColor = vec4(0., 0., 0., 1.);\n  \n  vec3 color = vec3(0.);\n  vec3 mult = vec3(1.0); \n  vec3 multTinted = h_lensTransmission;      \n  \n  if (blendMode == 0) {\n      oColor.rgb = multTinted;\n  } else if (blendMode == 1) {\n    oColor.rgb = color;\n  } else if (blendMode == 2) {    vec3 fc = fresnel(h_lensCoatingSpecularColor, vec3(1.), dotNV);\n    oColor.rgb = envLight * fc * dotNV; \n    oColor.a = h_lensCoatingSpecularity;\n  }\n  return oColor;\n}\nvoid main() {\n   vec4 color = draw();\n   gl_FragColor = color;\n}\n',
    defines: { GRADIENT_VALUES: 2, HIDE_LENSES: 0, HIDE_FRAME: 0 },
    // transparent: true, // Ensure transparency works
    // depthWrite: false, // Prevent transparency artifacts
    // depthTest: true, // Make sure it's depth-tested correctly
    uniforms: {
        time: { value: 0.0 }, // For animation
        blendMode: { value: 0 },
        // envMap: { value: new THREE.Texture() },
        envMap: { value: null }, // Placeholder for reflection map
        envMapIntensity: { value: 1 },
        lensCoatingSpecularity: { value: [0.1, 0.1] },
        reflectionVecMat: { value: new THREE.Matrix3() },
        lensCoatingSpecularColor: { value: [new THREE.Color(1, 1, 1), new THREE.Color(1, 1, 1)] },
        lensTransmission: { value: [new THREE.Color(0.5, 0.5, 0.5), new THREE.Color(1, 1, 1)] },
        heightOnLensInterpolationFactor: { value: [0, 1] },
        lensMinY: { value: -1 },
        lensMaxY: { value: 1 },
    },
};
//# sourceMappingURL=shader.js.map