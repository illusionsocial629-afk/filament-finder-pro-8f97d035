import { Canvas, useFrame } from "@react-three/fiber";
import { Float, Environment, ContactShadows } from "@react-three/drei";
import { useMemo, useRef, Suspense } from "react";
import * as THREE from "three";

function Spool({ color }: { color: string }) {
  const group = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (group.current) {
      group.current.rotation.y += delta * 0.4;
    }
  });

  // Build a coiled filament as a TubeGeometry along a helical curve
  const filamentGeometry = useMemo(() => {
    const turns = 18;
    const radius = 0.95;
    const height = 0.9;
    const curve = new THREE.CatmullRomCurve3(
      Array.from({ length: turns * 40 + 1 }, (_, i) => {
        const t = i / (turns * 40);
        const angle = t * Math.PI * 2 * turns;
        return new THREE.Vector3(
          Math.cos(angle) * radius,
          -height / 2 + t * height,
          Math.sin(angle) * radius
        );
      })
    );
    return new THREE.TubeGeometry(curve, 800, 0.05, 12, false);
  }, []);

  // Filament color (driven by prop, defaults to design-system blue)
  const filamentColor = useMemo(() => new THREE.Color(color), [color]);
  const flangeColor = useMemo(() => new THREE.Color("hsl(214, 32%, 95%)"), []);
  const hubColor = useMemo(() => new THREE.Color("hsl(215, 25%, 88%)"), []);

  return (
    <group ref={group} rotation={[0.35, 0.4, 0]}>
      {/* Top flange */}
      <mesh position={[0, 0.55, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[1.15, 1.15, 0.08, 64]} />
        <meshStandardMaterial color={flangeColor} metalness={0.1} roughness={0.35} />
      </mesh>
      {/* Bottom flange */}
      <mesh position={[0, -0.55, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[1.15, 1.15, 0.08, 64]} />
        <meshStandardMaterial color={flangeColor} metalness={0.1} roughness={0.35} />
      </mesh>
      {/* Center hub */}
      <mesh castShadow receiveShadow>
        <cylinderGeometry args={[0.55, 0.55, 1, 48]} />
        <meshStandardMaterial color={hubColor} metalness={0.2} roughness={0.5} />
      </mesh>
      {/* Inner hole rim accent */}
      <mesh position={[0, 0.56, 0]}>
        <torusGeometry args={[0.2, 0.03, 16, 48]} />
        <meshStandardMaterial color={hubColor} metalness={0.4} roughness={0.4} />
      </mesh>
      {/* Coiled filament */}
      <mesh geometry={filamentGeometry} castShadow>
        <meshStandardMaterial
          color={filamentColor}
          metalness={0.3}
          roughness={0.25}
          emissive={filamentColor}
          emissiveIntensity={0.08}
        />
      </mesh>
      {/* Loose strand coming off the spool */}
      <mesh position={[1.05, -0.2, 0]} rotation={[0, 0, -0.3]}>
        <torusGeometry args={[0.18, 0.05, 12, 32, Math.PI * 1.4]} />
        <meshStandardMaterial color={filamentColor} metalness={0.3} roughness={0.25} />
      </mesh>
    </group>
  );
}

type FilamentSpool3DProps = {
  color?: string;
  className?: string;
};

const FilamentSpool3D = ({
  color = "hsl(214, 95%, 55%)",
  className = "w-full aspect-square max-w-[560px] mx-auto",
}: FilamentSpool3DProps) => {
  return (
    <div className={`relative ${className}`}>
      <div className="absolute inset-0 bg-gradient-primary opacity-20 blur-3xl rounded-full" />
      <Canvas
        shadows
        dpr={[1, 2]}
        camera={{ position: [0, 0.6, 4], fov: 40 }}
        className="relative !rounded-2xl"
        aria-label="Interactive 3D filament spool"
      >
        <Suspense fallback={null}>
          <ambientLight intensity={0.6} />
          <directionalLight
            position={[4, 5, 3]}
            intensity={1.2}
            castShadow
            shadow-mapSize-width={1024}
            shadow-mapSize-height={1024}
          />
          <directionalLight position={[-4, 2, -2]} intensity={0.4} color="hsl(214, 95%, 70%)" />
          <Float speed={1.4} rotationIntensity={0.4} floatIntensity={0.6}>
            <Spool color={color} />
          </Float>
          <ContactShadows
            position={[0, -1.2, 0]}
            opacity={0.35}
            scale={6}
            blur={2.5}
            far={2}
          />
          <Environment preset="city" />
        </Suspense>
      </Canvas>
    </div>
  );
};

export default FilamentSpool3D;
