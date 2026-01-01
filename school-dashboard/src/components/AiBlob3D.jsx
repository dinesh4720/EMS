import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// Custom Shader for the "Living Blob" with Ripples
const BlobShaderMaterial = {
    uniforms: {
        uTime: { value: 0 },
        uColorKey: { value: new THREE.Color("#9333ea") }, // Primary Purple
        uColorSecondary: { value: new THREE.Color("#FF2D55") }, // Secondary Red/Pink
    },
    vertexShader: `
    uniform float uTime;
    varying vec2 vUv;
    varying float vDisplacement;
    varying vec3 vNormal;

    // Simplex noise function (simplified)
    vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec4 permute(vec4 x) { return mod289(((x * 34.0) + 1.0) * x); }
    vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
    float snoise(vec3 v) {
      const vec2 C = vec2(1.0/6.0, 1.0/3.0);
      const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
      vec3 i  = floor(v + dot(v, C.yyy));
      vec3 x0 = v - i + dot(i, C.xxx);
      vec3 g = step(x0.yzx, x0.xyz);
      vec3 l = 1.0 - g;
      vec3 i1 = min( g.xyz, l.zxy );
      vec3 i2 = max( g.xyz, l.zxy );
      vec3 x1 = x0 - i1 + C.xxx;
      vec3 x2 = x0 - i2 + C.yyy;
      vec3 x3 = x0 - D.yyy;
      i = mod289(i);
      vec4 p = permute( permute( permute(
                 i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
               + i.y + vec4(0.0, i1.y, i2.y, 1.0 ))
               + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));
      float n_ = 0.142857142857;
      vec3  ns = n_ * D.wyz - D.xzx;
      vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
      vec4 x_ = floor(j * ns.z);
      vec4 y_ = floor(j - 7.0 * x_ );
      vec4 x = x_ *ns.x + ns.yyyy;
      vec4 y = y_ *ns.x + ns.yyyy;
      vec4 h = 1.0 - abs(x) - abs(y);
      vec4 b0 = vec4( x.xy, y.xy );
      vec4 b1 = vec4( x.zw, y.zw );
      vec4 s0 = floor(b0) * 2.0 + 1.0;
      vec4 s1 = floor(b1) * 2.0 + 1.0;
      vec4 sh = -step(h, vec4(0.0));
      vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
      vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
      vec3 p0 = vec3(a0.xy, h.x);
      vec3 p1 = vec3(a0.zw, h.y);
      vec3 p2 = vec3(a1.xy, h.z);
      vec3 p3 = vec3(a1.zw, h.w);
      vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
      p0 *= norm.x;
      p1 *= norm.y;
      p2 *= norm.z;
      p3 *= norm.w;
      vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
      m = m * m;
      return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3) ) );
    }

    void main() {
      vUv = uv;
      vNormal = normal;
      
      // Blob Displacement Logic
      float noise = snoise(position * 2.5 + uTime * 0.5);
      vDisplacement = noise;
      
      // Push vertices out based on noise
      vec3 newPosition = position + normal * (noise * 0.15);
      
      gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
    }
  `,
    fragmentShader: `
    uniform float uTime;
    uniform vec3 uColorKey;
    uniform vec3 uColorSecondary;
    varying vec2 vUv;
    varying float vDisplacement;
    varying vec3 vNormal;

    void main() {
      // Base Mix based on displacement (peaks are lighter/different color)
      float mixFactor = smoothstep(-0.2, 0.2, vDisplacement);
      vec3 baseColor = mix(uColorKey, uColorSecondary, mixFactor);
      
      // Fresnel Effect (Rim Light)
      vec3 viewDir = normalize(cameraPosition - vNormal); // Approximation
      // Actually standard viewDir in fragment is just vec3(0,0,1) in view space, 
      // but vNormal is in object space? No, varying normals are usually transformed.
      // Let's use simple normal-z trick for mock fresnel.
      float fresnel = pow(1.0 - abs(vNormal.z), 3.0);
      
      // Ripple Effect (Scanning Lines)
      // Moving down: uTime
      // Dense lines: mod with small value
      float rippleSpeed = 1.0;
      float rippleDensity = 30.0;
      float ripple = sin((vUv.y * rippleDensity) - (uTime * 5.0));
      ripple = smoothstep(0.8, 1.0, ripple); // Sharpen the ripple lines
      
      // Combine
      vec3 finalColor = baseColor;
      finalColor += vec3(1.0) * fresnel * 0.5; // Add Rim
      finalColor += vec3(1.0) * ripple * 0.3; // Add White Ripples
      
      gl_FragColor = vec4(finalColor, 1.0);
    }
  `
};

function BlobMesh() {
    const mesh = useRef();

    // Create shader material instance once
    const material = useMemo(() => {
        return new THREE.ShaderMaterial({
            uniforms: {
                uTime: { value: 0 },
                uColorKey: { value: new THREE.Color("#9333ea") },
                uColorSecondary: { value: new THREE.Color("#FF2D55") },
            },
            vertexShader: BlobShaderMaterial.vertexShader,
            fragmentShader: BlobShaderMaterial.fragmentShader,
        });
    }, []);

    useFrame((state) => {
        if (mesh.current) {
            // Pass time to shader
            mesh.current.material.uniforms.uTime.value = state.clock.getElapsedTime();

            // Subtle rotation
            mesh.current.rotation.y = state.clock.getElapsedTime() * 0.2;
        }
    });

    return (
        <mesh ref={mesh} scale={1.2}>
            <sphereGeometry args={[1, 64, 64]} />
            <primitive object={material} attach="material" />
        </mesh>
    );
}

export default function AiBlob3D() {
    return (
        <div className="w-full h-full">
            <Canvas
                camera={{ position: [0, 0, 3] }}
                gl={{ alpha: true, antialias: true }}
            >
                {/* Lights aren't needed for raw ShaderMaterial unless we use Light logic, 
            but keeping them doesn't hurt if we later switch to StandardMaterial. 
            Our shader is unlit (self-illuminated). */}
                <BlobMesh />
            </Canvas>
        </div>
    );
}
