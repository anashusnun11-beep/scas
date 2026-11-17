"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Suspense, useEffect, useMemo, useRef } from "react";
import { MathUtils, SRGBColorSpace, TextureLoader, Vector3, type Group } from "three";

/*
 * The 3D office door for the login stage.
 * Loaded lazily by DoorStage, never during SSR. Plain three.js geometry, no helper libraries,
 * to keep the bundle small. Renders on demand: frames only while the door is moving.
 * `open`: the door eases open over about 1.5 s when the login succeeds.
 *
 * Units are metres. The doorway is 1.0 x 2.1 m, centred on x = 0, in a wall at z = 0.
 * The camera is in the corridor (+z), the lit office is behind the wall (-z).
 */

const OPEN_ANGLE = MathUtils.degToRad(112);
const DOOR_W = 1.0;
const DOOR_H = 2.1;
const LEAF_GAP = 0.02; // the latch-side gap where the lamp light leaks through

const LOOK_AT = new Vector3(0, 1.02, 0);

type Palette = Record<"woodLight" | "wood" | "woodDark" | "edge" | "frame" | "wall" | "floor" | "handle" | "lampCore" | "lamp" | "plate", string>;

/** Colours come from the CSS component tokens, so the 3D door matches the CSS door. */
function readPalette(): Palette {
  const css = getComputedStyle(document.documentElement);
  const v = (name: string) => css.getPropertyValue(name).trim();
  return {
    woodLight: v("--door-wood-light"),
    wood: v("--door-wood"),
    woodDark: v("--door-wood-dark"),
    edge: v("--door-edge"),
    frame: v("--door-frame"),
    wall: v("--door-wall"),
    floor: v("--door-floor"),
    handle: v("--door-handle"),
    lampCore: v("--lamp-core"),
    lamp: v("--lamp"),
    plate: v("--logo-plate"),
  };
}

function Nameplate({ color }: { color: string }) {
  const invalidate = useThree((s) => s.invalidate);
  const logo = useMemo(() => {
    const texture = new TextureLoader().load("/kpmb-logo.png", () => invalidate());
    texture.colorSpace = SRGBColorSpace;
    return texture;
  }, [invalidate]);
  const logoH = 0.24;
  const logoW = (logoH * 1360) / 1212; // keep the official logo's proportions
  return (
    <group position={[DOOR_W / 2, 1.22, 0.034]}>
      <mesh castShadow>
        <boxGeometry args={[logoW + 0.08, logoH + 0.08, 0.012]} />
        <meshStandardMaterial color={color} roughness={0.35} metalness={0.2} />
      </mesh>
      <mesh position={[0, 0, 0.0065]}>
        <planeGeometry args={[logoW, logoH]} />
        {/* unlit, so the logo keeps its true colours in the dark corridor */}
        <meshBasicMaterial map={logo} transparent toneMapped={false} />
      </mesh>
    </group>
  );
}

function Door({ open, palette }: { open: boolean; palette: Palette }) {
  const hinge = useRef<Group>(null);
  const progress = useRef(0);
  const invalidate = useThree((s) => s.invalidate);

  useEffect(() => {
    invalidate();
  }, [open, invalidate]);

  useFrame((_, delta) => {
    const target = open ? 1 : 0;
    // Exponential damping: a heavy door that eases out over about 1.5 s.
    progress.current = MathUtils.damp(progress.current, target, 2.6, Math.min(delta, 0.05));
    if (Math.abs(progress.current - target) < 0.0005) progress.current = target;
    if (hinge.current) hinge.current.rotation.y = -progress.current * OPEN_ANGLE;
    if (progress.current !== target) invalidate();
  });

  const leafW = DOOR_W - LEAF_GAP;
  const leafH = DOOR_H - 0.02;

  return (
    // Hinge on the left edge of the doorway; negative rotation swings the leaf toward the camera.
    <group ref={hinge} position={[-DOOR_W / 2, 0, 0]}>
      <mesh position={[leafW / 2, leafH / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[leafW, leafH, 0.05]} />
        <meshStandardMaterial color={palette.wood} roughness={0.72} />
      </mesh>
      {/* raised panels */}
      {[
        { y: 1.62, h: 0.62 },
        { y: 0.62, h: 0.84 },
      ].map((p) => (
        <mesh key={p.y} position={[leafW / 2, p.y, 0.027]} castShadow>
          <boxGeometry args={[leafW - 0.22, p.h, 0.012]} />
          <meshStandardMaterial color={palette.woodLight} roughness={0.65} />
        </mesh>
      ))}
      <Nameplate color={palette.plate} />
      {/* handle */}
      <mesh position={[leafW - 0.1, 1.0, 0.06]} castShadow>
        <sphereGeometry args={[0.035, 24, 16]} />
        <meshStandardMaterial color={palette.handle} metalness={0.8} roughness={0.3} />
      </mesh>
    </group>
  );
}

function Corridor({ palette }: { palette: Palette }) {
  const frame = 0.07;
  return (
    <group>
      {/* wall around the doorway (three blocks so the opening stays clear) */}
      {[
        { x: -DOOR_W / 2 - 1.5, w: 3, h: 4, y: 2 },
        { x: DOOR_W / 2 + 1.5, w: 3, h: 4, y: 2 },
        { x: 0, w: DOOR_W, h: 4 - DOOR_H, y: DOOR_H + (4 - DOOR_H) / 2 },
      ].map((b, i) => (
        <mesh key={i} position={[b.x, b.y, -0.06]} castShadow receiveShadow>
          <boxGeometry args={[b.w, b.h, 0.12]} />
          <meshStandardMaterial color={palette.wall} roughness={0.95} />
        </mesh>
      ))}
      {/* door frame */}
      {[
        { x: -DOOR_W / 2 - frame / 2, y: DOOR_H / 2, w: frame, h: DOOR_H + frame },
        { x: DOOR_W / 2 + frame / 2, y: DOOR_H / 2, w: frame, h: DOOR_H + frame },
        { x: 0, y: DOOR_H + frame / 2, w: DOOR_W + frame * 2, h: frame },
      ].map((f, i) => (
        <mesh key={i} position={[f.x, f.y, 0.02]} castShadow>
          <boxGeometry args={[f.w, f.h, 0.06]} />
          <meshStandardMaterial color={palette.frame} roughness={0.6} />
        </mesh>
      ))}
      {/* corridor floor: catches the light spill */}
      <mesh rotation-x={-Math.PI / 2} position={[0, 0, 2]} receiveShadow>
        <planeGeometry args={[8, 6]} />
        <meshStandardMaterial color={palette.floor} roughness={0.85} />
      </mesh>
      {/* the lit office: a warm back wall and floor */}
      <mesh position={[0, 1.6, -2.2]}>
        <planeGeometry args={[4, 3.2]} />
        <meshStandardMaterial color={palette.lamp} emissive={palette.lamp} emissiveIntensity={0.9} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.001, -1.1]} receiveShadow>
        <planeGeometry args={[4, 2.2]} />
        <meshStandardMaterial color={palette.lampCore} roughness={0.9} />
      </mesh>
    </group>
  );
}

function CameraRig() {
  const camera = useThree((s) => s.camera);
  useEffect(() => {
    camera.lookAt(LOOK_AT);
  }, [camera]);
  return null;
}

/** Fires once the scene is mounted and a frame is on screen, so DoorStage can cross-fade. */
function Ready({ onReady }: { onReady: () => void }) {
  useEffect(() => {
    let raf = requestAnimationFrame(() => {
      raf = requestAnimationFrame(onReady);
    });
    return () => cancelAnimationFrame(raf);
  }, [onReady]);
  return null;
}

export default function DoorScene({ open = false, onReady }: { open?: boolean; onReady: () => void }) {
  const palette = useMemo(() => readPalette(), []);

  return (
    <Canvas
      shadows="percentage"
      frameloop="demand"
      dpr={[1, 1.75]}
      camera={{ position: [0.9, 1.25, 4.6], fov: 32 }}
      gl={{ antialias: true, powerPreference: "low-power" }}
      aria-hidden
    >
      <CameraRig />
      <color attach="background" args={[palette.floor]} />
      {/* cool, dim corridor light from the camera side */}
      <hemisphereLight args={[palette.lampCore, palette.floor, 1.1]} />
      <directionalLight position={[2.5, 3.5, 4]} intensity={1.8} color={palette.lampCore} />
      {/* the lamp inside the office */}
      <pointLight
        position={[0.25, 1.7, -1.0]}
        color={palette.lamp}
        intensity={14}
        distance={9}
        decay={1.6}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.002}
      />
      <Suspense fallback={null}>
        <Corridor palette={palette} />
        <Door open={open} palette={palette} />
        <Ready onReady={onReady} />
      </Suspense>
    </Canvas>
  );
}
