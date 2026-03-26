import React, { useRef, useMemo, useState, useEffect, useCallback } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Float } from "@react-three/drei";
import * as THREE from "three";
import { useTheme } from "next-themes";

function StaticSchoolBuildingFallback() {
  return (
    <div className="absolute inset-0 overflow-hidden bg-[linear-gradient(180deg,#ffffff_0%,#f8f8f8_50%,#f0f0f0_100%)] dark:bg-[linear-gradient(180deg,#09090b_0%,#18181b_50%,#27272a_100%)]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(20,184,166,0.18),transparent_45%)] dark:bg-[radial-gradient(circle_at_top,rgba(45,212,191,0.14),transparent_40%)]" />
      <div className="absolute left-1/2 top-1/2 w-[420px] max-w-[78%] -translate-x-1/2 -translate-y-[42%]">
        <div className="relative mx-auto h-64 rounded-t-[3rem] border border-gray-200/80 bg-white/90 shadow-2xl dark:border-zinc-700/80 dark:bg-zinc-900/85">
          <div className="absolute inset-x-[18%] -top-8 h-16 rounded-t-[2rem] border border-gray-200/80 bg-white/95 dark:border-zinc-700/80 dark:bg-zinc-900/90" />
          <div className="absolute inset-x-[28%] -top-20 h-14 rounded-t-[1.5rem] border border-gray-200/80 bg-white/95 dark:border-zinc-700/80 dark:bg-zinc-900/90" />
          <div className="absolute inset-x-10 top-10 grid grid-cols-5 gap-3">
            {Array.from({ length: 15 }).map((_, index) => (
              <div
                key={index}
                className="h-7 rounded-md border border-teal-100 bg-teal-50/90 dark:border-teal-900 dark:bg-teal-950/60"
              />
            ))}
          </div>
          <div className="absolute bottom-0 left-1/2 h-20 w-28 -translate-x-1/2 rounded-t-3xl border-x border-t border-gray-300 bg-teal-600/90 dark:border-zinc-600 dark:bg-teal-700/80" />
          <div className="absolute inset-x-0 bottom-0 h-5 bg-gray-100 dark:bg-zinc-800" />
        </div>
        <div className="mx-auto h-6 w-[92%] rounded-b-3xl bg-gray-200/80 dark:bg-zinc-700/80" />
      </div>
      <div className="absolute bottom-8 lg:bottom-24 left-0 right-0 text-center pointer-events-none px-4 lg:px-8">
        <h2 className="text-lg lg:text-2xl font-bold text-gray-800 dark:text-zinc-200 mb-1 lg:mb-2">
          Building Excellence in Education
        </h2>
        <p className="text-gray-500 dark:text-zinc-400 text-xs lg:text-sm">
          WebGL is unavailable in this browser session
        </p>
      </div>
    </div>
  );
}

// Cinematic camera angles
const cameraAngles = [
  { position: [0, 8, 25], target: [0, 3, 0], duration: 6 },
  { position: [22, 6, 12], target: [0, 2, 0], duration: 5 },
  { position: [5, 20, 15], target: [0, 0, 0], duration: 5 },
  { position: [15, 3, 18], target: [0, 5, 0], duration: 6 },
  { position: [8, 12, 8], target: [0, 7, 0], duration: 5 },
  { position: [0, 4, 12], target: [0, 1, 3], duration: 5 },
  { position: [-18, 10, 10], target: [0, 3, 0], duration: 6 },
  { position: [-10, 18, 18], target: [0, 2, 0], duration: 5 },
];

// Animated block that flies to its target position with border
function AnimatedBlock({ startPos, targetPos, size, delay, blockColor }) {
  const groupRef = useRef();
  const [shouldRender, setShouldRender] = useState(false);
  const startPosRef = useRef(new THREE.Vector3(...startPos));
  const targetPosRef = useRef(new THREE.Vector3(...targetPos));

  // Create edge geometry for the border
  const edgeGeometry = useMemo(() => {
    const geo = new THREE.BoxGeometry(...size);
    const edges = new THREE.EdgesGeometry(geo);
    return edges;
  }, [size]);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();

    if (time < delay) return;

    if (!shouldRender) {
      setShouldRender(true);
      return;
    }

    if (!groupRef.current) return;

    const progress = Math.min(1, Math.max(0, (time - delay) * 0.8));
    const eased = 1 - Math.pow(1 - progress, 4);

    groupRef.current.position.lerpVectors(startPosRef.current, targetPosRef.current, eased);
    groupRef.current.rotation.x = (1 - eased) * Math.PI * 2;
    groupRef.current.rotation.y = (1 - eased) * Math.PI * 1.5;
    groupRef.current.rotation.z = (1 - eased) * Math.PI;
  });

  if (!shouldRender) return null;

  const isWhite = !blockColor || blockColor === "#ffffff";
  const borderColor = isWhite ? "#b0b0b0" : "#00000033";

  return (
    <group ref={groupRef} position={startPos}>
      {/* Block */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={size} />
        <meshStandardMaterial color={blockColor || "#ffffff"} metalness={0} roughness={0.4} />
      </mesh>
      {/* Border/edge - only for white blocks */}
      {isWhite && (
        <lineSegments geometry={edgeGeometry}>
          <lineBasicMaterial color={borderColor} />
        </lineSegments>
      )}
    </group>
  );
}

// Window component - white with borders
function Window({ position, scale = 1, delay = 5 }) {
  const [visible, setVisible] = useState(false);

  const frameEdgeGeometry = useMemo(() => {
    const geo = new THREE.BoxGeometry(0.9, 1.2, 0.1);
    return new THREE.EdgesGeometry(geo);
  }, []);

  useFrame((state) => {
    if (!visible && state.clock.getElapsedTime() >= delay) {
      setVisible(true);
    }
  });

  if (!visible) return null;

  return (
    <group position={position} scale={scale}>
      {/* Window frame - white */}
      <mesh castShadow>
        <boxGeometry args={[0.9, 1.2, 0.1]} />
        <meshStandardMaterial color="#ffffff" metalness={0} roughness={0.4} />
      </mesh>
      {/* Frame border */}
      <lineSegments geometry={frameEdgeGeometry}>
        <lineBasicMaterial color="#b0b0b0" />
      </lineSegments>
      {/* Window glass */}
      <mesh position={[0, 0, 0.02]}>
        <boxGeometry args={[0.7, 1, 0.05]} />
        <meshPhysicalMaterial color="#e8f4fc" metalness={0} roughness={0} transmission={0.9} transparent opacity={0.6} />
      </mesh>
      {/* Window dividers */}
      <mesh position={[0, 0, 0.04]}>
        <boxGeometry args={[0.02, 1, 0.02]} />
        <meshStandardMaterial color="#c0c0c0" />
      </mesh>
      <mesh position={[0, 0, 0.04]}>
        <boxGeometry args={[0.7, 0.02, 0.02]} />
        <meshStandardMaterial color="#c0c0c0" />
      </mesh>
    </group>
  );
}

// Get a start position far outside the canvas
function getOutsidePosition(index) {
  const sides = [
    { x: -100, y: 15, z: 0 },
    { x: 100, y: 15, z: 0 },
    { x: 0, y: 15, z: -100 },
    { x: 0, y: 15, z: 100 },
    { x: -80, y: 40, z: 0 },
    { x: 80, y: 40, z: 0 },
    { x: 0, y: 50, z: 0 },
    { x: -70, y: 20, z: 70 },
    { x: 70, y: 20, z: 70 },
    { x: -70, y: 20, z: -70 },
    { x: 70, y: 20, z: -70 },
  ];

  const side = sides[index % sides.length];
  const variation = 10;

  return [
    side.x + (Math.random() - 0.5) * variation,
    side.y + (Math.random() - 0.5) * variation,
    side.z + (Math.random() - 0.5) * variation,
  ];
}

// Main school building
function SchoolBuilding() {
  const blocks = useMemo(() => {
    const blockList = [];
    let delay = 0;
    let posIndex = 0;

    // Helper to add a block
    const addBlock = (targetPos, size) => {
      blockList.push({
        startPos: getOutsidePosition(posIndex++),
        targetPos,
        size,
        delay: delay++ * 0.008,
      });
    };

    // Ground floor base
    for (let x = -6; x <= 6; x++) {
      for (let z = -2; z <= 2; z++) {
        addBlock([x, 0, z], [1, 0.8, 1]);
      }
    }

    // Main walls - front and back
    for (let y = 0.4; y < 4; y += 0.8) {
      for (let x = -6; x <= 6; x++) {
        const isWindow = y > 0.8 && y < 3.2 && Math.abs(x) !== 6 && (Math.abs(x) % 2 === 0);
        if (!isWindow) {
          addBlock([x, y + 0.4, 2], [1, 0.8, 0.4]);
        }
        addBlock([x, y + 0.4, -2], [1, 0.8, 0.4]);
      }
    }

    // Side walls
    for (let y = 0.4; y < 4; y += 0.8) {
      for (let z = -1.5; z <= 1.5; z++) {
        addBlock([-6, y + 0.4, z], [0.4, 0.8, 1]);
        addBlock([6, y + 0.4, z], [0.4, 0.8, 1]);
      }
    }

    // Tower base
    for (let x = -1; x <= 1; x++) {
      for (let z = -1; z <= 1; z++) {
        addBlock([x, 4, z], [1, 0.8, 1]);
      }
    }

    // Tower walls
    for (let y = 4.4; y < 7; y += 0.8) {
      for (let x = -1; x <= 1; x++) {
        addBlock([x, y, 1], [1, 0.8, 0.4]);
        addBlock([x, y, -1], [1, 0.8, 0.4]);
      }
      for (let z = -0.5; z <= 0.5; z++) {
        addBlock([-1, y, z], [0.4, 0.8, 1]);
        addBlock([1, y, z], [0.4, 0.8, 1]);
      }
    }

    // Main roof
    for (let x = -6.2; x <= 6.2; x += 0.5) {
      const roofHeight = 1.5 - Math.abs(x) * 0.08;
      addBlock([x, 4.2 + roofHeight / 2, 0], [0.5, roofHeight, 4.5]);
    }

    // Tower roof
    for (let level = 0; level < 4; level++) {
      const sz = 2 - level * 0.4;
      addBlock([0, 7.2 + level * 0.5, 0], [sz, 0.4, sz]);
    }

    // Spire
    addBlock([0, 9.5, 0], [0.3, 1.5, 0.3]);

    // Entrance columns
    for (let col = -1; col <= 1; col += 2) {
      for (let y = -0.4; y < 3; y += 0.5) {
        addBlock([col * 1.2, y + 0.25, 2.8], [0.3, 0.5, 0.3]);
      }
    }

    // Entrance roof
    for (let x = -1.5; x <= 1.5; x += 0.5) {
      addBlock([x, 3.2, 2.8], [0.5, 0.2, 1.2]);
    }

    // Steps
    for (let step = 0; step < 3; step++) {
      for (let x = -1.5; x <= 1.5; x += 0.5) {
        addBlock([x, -0.3 - step * 0.15, 3.5 + step * 0.5], [0.5, 0.15, 0.5]);
      }
    }

    // Left wing
    for (let x = -9; x < -6; x++) {
      for (let z = -1.5; z <= 1.5; z++) {
        addBlock([x, 0, z], [1, 0.8, 1]);
      }
    }
    for (let y = 0.4; y < 3.2; y += 0.8) {
      for (let x = -9; x < -6; x++) {
        addBlock([x, y + 0.4, 1.5], [1, 0.8, 0.4]);
        addBlock([x, y + 0.4, -1.5], [1, 0.8, 0.4]);
      }
    }
    for (let x = -9; x < -6; x++) {
      addBlock([x, 3.6, 0], [1, 0.8, 3.5]);
    }

    // Right wing
    for (let x = 7; x <= 9; x++) {
      for (let z = -1.5; z <= 1.5; z++) {
        addBlock([x, 0, z], [1, 0.8, 1]);
      }
    }
    for (let y = 0.4; y < 3.2; y += 0.8) {
      for (let x = 7; x <= 9; x++) {
        addBlock([x, y + 0.4, 1.5], [1, 0.8, 0.4]);
        addBlock([x, y + 0.4, -1.5], [1, 0.8, 0.4]);
      }
    }
    for (let x = 7; x <= 9; x++) {
      addBlock([x, 3.6, 0], [1, 0.8, 3.5]);
    }

    // Clock
    addBlock([0, 6, 1.3], [0.8, 0.8, 0.1]);

    // Flag pole (gray)
    blockList.push({
      startPos: getOutsidePosition(posIndex++),
      targetPos: [0, 10.5, 0],
      size: [0.05, 1, 0.05],
      blockColor: "#888888",
      delay: delay++ * 0.008,
    });

    // Flag (red)
    blockList.push({
      startPos: getOutsidePosition(posIndex++),
      targetPos: [0.4, 10.8, 0],
      size: [0.8, 0.5, 0.02],
      blockColor: "#e74c3c",
      delay: delay++ * 0.008,
    });

    return blockList;
  }, []);

  const windows = useMemo(() => {
    const windowList = [];
    for (let x = -5; x <= 5; x += 2) {
      for (let y = 1.2; y < 3.5; y += 1.4) {
        windowList.push([x, y, 2.15]);
      }
    }
    for (let y = 4.8; y < 6.5; y += 1) {
      windowList.push([0, y, 1.15]);
    }
    for (let x = -8.5; x <= -6.5; x++) {
      for (let y = 1.2; y < 3; y += 1.4) {
        windowList.push([x, y, 1.65]);
      }
    }
    for (let x = 7.5; x <= 8.5; x++) {
      for (let y = 1.2; y < 3; y += 1.4) {
        windowList.push([x, y, 1.65]);
      }
    }
    return windowList;
  }, []);

  return (
    <group>
      {blocks.map((block, i) => (
        <AnimatedBlock key={`block-${i}`} {...block} />
      ))}
      {windows.map((pos, i) => (
        <Window key={`window-${i}`} position={pos} scale={0.8} />
      ))}
    </group>
  );
}

// Ground with platform
function Ground({ isDark }) {
  return (
    <>
      {/* Main ground plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]} receiveShadow>
        <planeGeometry args={[100, 100]} />
        <meshStandardMaterial color={isDark ? "#18181b" : "#fafafa"} metalness={0} roughness={0.9} />
      </mesh>
      {/* Building platform */}
      <mesh position={[0, -0.35, 1]} receiveShadow>
        <boxGeometry args={[24, 0.3, 8]} />
        <meshStandardMaterial color={isDark ? "#27272a" : "#ffffff"} metalness={0} roughness={0.5} />
      </mesh>
      {/* Platform edge */}
      <mesh position={[0, -0.45, 1]} receiveShadow>
        <boxGeometry args={[24.5, 0.1, 8.5]} />
        <meshStandardMaterial color={isDark ? "#3f3f46" : "#e0e0e0"} metalness={0} roughness={0.5} />
      </mesh>
      {/* Steps area */}
      <mesh position={[0, -0.55, 4.5]} receiveShadow>
        <boxGeometry args={[5, 0.2, 3]} />
        <meshStandardMaterial color={isDark ? "#27272a" : "#ffffff"} metalness={0} roughness={0.5} />
      </mesh>
    </>
  );
}

// Glowing orange particles
function Particles() {
  const [visible, setVisible] = useState(false);

  const particles = useMemo(() => {
    return Array.from({ length: 40 }, (_, i) => ({
      id: i,
      position: [
        (Math.random() - 0.5) * 30,
        Math.random() * 12 + 2,
        (Math.random() - 0.5) * 30,
      ],
      scale: Math.random() * 0.12 + 0.05,
      speed: 1 + Math.random() * 1.5,
    }));
  }, []);

  useFrame((state) => {
    if (!visible && state.clock.getElapsedTime() >= 3) {
      setVisible(true);
    }
  });

  if (!visible) return null;

  return (
    <>
      {particles.map((p) => (
        <Float key={p.id} speed={p.speed} rotationIntensity={0.3} floatIntensity={1.5}>
          <mesh position={p.position}>
            <sphereGeometry args={[p.scale, 16, 16]} />
            <meshStandardMaterial
              color="#ff8c00"
              emissive="#ff6600"
              emissiveIntensity={2}
              transparent
              opacity={0.9}
            />
          </mesh>
        </Float>
      ))}
      <pointLight position={[10, 8, 10]} color="#ff7700" intensity={0.5} distance={20} />
      <pointLight position={[-10, 6, -10]} color="#ff5500" intensity={0.4} distance={18} />
      <pointLight position={[0, 10, 0]} color="#ff9900" intensity={0.3} distance={15} />
    </>
  );
}

// Scene with cinematic camera
function Scene({ enableCinematic, onUserInteraction, isDark }) {
  const { camera } = useThree();
  const controlsRef = useRef();
  const angleIndex = useRef(0);
  const transitionStart = useRef(0);
  const isInteracting = useRef(false);

  // Initialize camera position
  useEffect(() => {
    camera.position.set(0, 8, 25);
    camera.lookAt(0, 3, 0);
    transitionStart.current = performance.now();
  }, [camera]);

  // Handle cinematic camera movement
  useFrame(() => {
    if (!enableCinematic || isInteracting.current) return;

    const current = cameraAngles[angleIndex.current];
    const nextIndex = (angleIndex.current + 1) % cameraAngles.length;
    const next = cameraAngles[nextIndex];

    const elapsed = (performance.now() - transitionStart.current) / 1000;
    const progress = Math.min(elapsed / current.duration, 1);

    // Smooth easing
    const eased = progress < 0.5
      ? 4 * progress * progress * progress
      : 1 - Math.pow(-2 * progress + 2, 3) / 2;

    // Interpolate position
    const targetPos = new THREE.Vector3().lerpVectors(
      new THREE.Vector3(...current.position),
      new THREE.Vector3(...next.position),
      eased
    );

    // Interpolate target
    const targetLookAt = new THREE.Vector3().lerpVectors(
      new THREE.Vector3(...current.target),
      new THREE.Vector3(...next.target),
      eased
    );

    camera.position.lerp(targetPos, 0.02);
    camera.lookAt(targetLookAt);

    // Move to next angle
    if (progress >= 1) {
      angleIndex.current = nextIndex;
      transitionStart.current = performance.now();
    }
  });

  const handleStart = useCallback(() => {
    isInteracting.current = true;
    onUserInteraction();
  }, [onUserInteraction]);

  const handleEnd = useCallback(() => {
    isInteracting.current = false;
  }, []);

  return (
    <>
      {/* Ambient light - reduced in dark mode */}
      <ambientLight intensity={isDark ? 0.6 : 1.2} />
      {/* Hemisphere light */}
      <hemisphereLight args={[isDark ? "#a1a1aa" : "#ffffff", isDark ? "#27272a" : "#ffffff", isDark ? 0.4 : 0.8]} />
      <directionalLight
        position={[10, 20, 10]}
        intensity={1.5}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={100}
        shadow-camera-left={-20}
        shadow-camera-right={20}
        shadow-camera-top={20}
        shadow-camera-bottom={-20}
        shadow-bias={-0.0001}
      />
      <directionalLight position={[-10, 10, -10]} intensity={0.8} color="#ffffff" />
      <directionalLight position={[15, 5, -15]} intensity={0.3} color="#ff8844" />

      <SchoolBuilding />
      <Ground isDark={isDark} />
      <Particles />

      <OrbitControls
        ref={controlsRef}
        enablePan={false}
        enableZoom={true}
        minDistance={15}
        maxDistance={45}
        minPolarAngle={Math.PI / 6}
        maxPolarAngle={Math.PI / 2.1}
        maxZoomSpeed={0.5}
        zoomSpeed={0.5}
        onStart={handleStart}
        onEnd={handleEnd}
      />
    </>
  );
}

// Main component
// Error boundary that catches Three.js/Canvas errors and shows the static fallback
class CanvasErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch() {
    this.props.onError?.();
  }
  render() {
    if (this.state.hasError) return <StaticSchoolBuildingFallback />;
    return this.props.children;
  }
}

export default function SchoolBuilding3D() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [enableCinematic, setEnableCinematic] = useState(true);
  const [canvasKey, setCanvasKey] = useState(0);
  const [hasWebGLSupport, setHasWebGLSupport] = useState(false);
  const [canvasError, setCanvasError] = useState(false);
  const timeoutRef = useRef(null);

  const handleUserInteraction = useCallback(() => {
    setEnableCinematic(false);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setEnableCinematic(true);
    }, 5000);
  }, []);

  // Handle browser zoom changes
  useEffect(() => {
    let resizeTimeout;
    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        setCanvasKey(prev => prev + 1);
      }, 250);
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(resizeTimeout);
    };
  }, []);

  useEffect(() => {
    try {
      const canvas = document.createElement("canvas");
      const context =
        canvas.getContext("webgl2") ||
        canvas.getContext("webgl") ||
        canvas.getContext("experimental-webgl");

      if (!context) {
        setHasWebGLSupport(false);
        return;
      }

      // Verify the context actually works (some headless environments report support but fail)
      const testShader = context.createShader(context.VERTEX_SHADER);
      if (!testShader) {
        setHasWebGLSupport(false);
        return;
      }
      context.deleteShader(testShader);

      setHasWebGLSupport(true);
    } catch {
      setHasWebGLSupport(false);
    }
  }, []);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  if (!hasWebGLSupport || canvasError) {
    return <StaticSchoolBuildingFallback />;
  }

  return (
    <div className="absolute inset-0 bg-white dark:bg-zinc-950">
      <CanvasErrorBoundary onError={() => setCanvasError(true)}>
      <Canvas
        key={canvasKey}
        shadows
        camera={{ position: [0, 8, 25], fov: 45, near: 0.1, far: 200 }}
        gl={{ antialias: true, alpha: true, failIfMajorPerformanceCaveat: true }}
        onCreated={(state) => {
          try {
            // Compile a test render to verify GPU actually works
            state.gl.compile(state.scene, state.camera);
          } catch {
            setCanvasError(true);
          }
        }}
        className="bg-[linear-gradient(180deg,#ffffff_0%,#f8f8f8_50%,#f0f0f0_100%)] dark:bg-[linear-gradient(180deg,#09090b_0%,#18181b_50%,#27272a_100%)]"
      >
        <Scene enableCinematic={enableCinematic} onUserInteraction={handleUserInteraction} isDark={isDark} />
      </Canvas>
      </CanvasErrorBoundary>

      <div className="absolute bottom-8 lg:bottom-24 left-0 right-0 text-center pointer-events-none px-4 lg:px-8">
        <h2 className="text-lg lg:text-2xl font-bold text-gray-800 dark:text-zinc-200 mb-1 lg:mb-2">
          Building Excellence in Education
        </h2>
        <p className="text-gray-500 dark:text-zinc-400 text-xs lg:text-sm">
          {enableCinematic ? "Cinematic camera active • Drag to explore" : "Manual control • Auto-resumes in 5s"}
        </p>
      </div>
    </div>
  );
}
