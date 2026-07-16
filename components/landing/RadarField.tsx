'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'

export type RadarPhase = 'nominal' | 'degrading' | 'detected' | 'resolved'

export interface RadarState {
  phase: RadarPhase
  score: number
  sector: number
}

const COUNT = 3200
const SWEEP_PERIOD = 12 // seconds per full radar revolution — also the story loop
const DISC_RADIUS = 12.5
// World angle the sweep crosses at 62% of each revolution — where trouble forms.
const CLUSTER_ANGLE = Math.PI * 2 * 0.62

const discVertex = /* glsl */ `
  varying vec2 vWorld;
  void main() {
    vec4 w = modelMatrix * vec4(position, 1.0);
    vWorld = w.xz;
    gl_Position = projectionMatrix * viewMatrix * w;
  }
`

const discFragment = /* glsl */ `
  precision highp float;

  #define TAU 6.28318530718

  uniform float uSweep;
  uniform float uTime;
  uniform float uWave;
  uniform float uWaveA;
  varying vec2 vWorld;

  void main() {
    float r = length(vWorld);
    float phi = atan(vWorld.y, vWorld.x);

    // Comet tail behind the sweep beam, plus a crisp leading edge.
    float delta = mod(uSweep - phi, TAU);
    float tail = exp(-delta * 2.6);
    float beam = exp(-pow(delta * 26.0, 2.0));

    // Faint range rings every 3 units.
    float rings =
      exp(-pow((r - 3.0) * 9.0, 2.0)) +
      exp(-pow((r - 6.0) * 9.0, 2.0)) +
      exp(-pow((r - 9.0) * 9.0, 2.0)) +
      exp(-pow((r - 12.0) * 9.0, 2.0));

    // The emitter: a soft glow at the origin with ripple pings expanding out of it.
    float centerGlow = exp(-pow(r * 1.1, 2.0));
    float rp = mod(uTime * 1.3, 4.5);
    float ripple = exp(-pow((r - rp) * 3.2, 2.0)) * (1.0 - rp / 4.5) * 0.8;

    // Healing wave: one bright ring rolls to the rim after an anomaly is resolved.
    float wave = exp(-pow((r - uWave) * 2.0, 2.0)) * uWaveA;

    // Fade at the rim.
    float radial = smoothstep(${DISC_RADIUS.toFixed(1)}, 10.2, r);

    vec3 col = vec3(0.07, 0.52, 0.37) * (0.55 + tail * 0.7 + beam * 0.9 + centerGlow * 1.4);
    col += vec3(0.30, 1.0, 0.65) * wave * 0.8;
    float a = (tail * 0.12 + beam * 0.4 + rings * 0.05 + ripple * 0.22 + wave * 0.3 + centerGlow * 0.4) * radial;
    if (a < 0.003) discard;
    gl_FragColor = vec4(col, a);
  }
`

const particleVertex = /* glsl */ `
  #define TAU 6.28318530718
  #define PI 3.14159265359

  uniform float uTime;
  uniform float uSweep;
  uniform float uDistress;
  uniform float uResolve;
  uniform float uClusterR;

  attribute float aSeed;
  attribute float aSize;
  attribute float aR;
  attribute float aTheta;
  attribute float aY;

  varying float vHot;
  varying float vGlow;
  varying float vFlash;
  varying float vTwinkle;

  void main() {
    // Differential rotation — inner orbits run faster, like a galaxy.
    float omega = 0.25 / (0.4 + aR * 0.15);
    float th = aTheta + uTime * omega;
    float r = aR + sin(uTime * 0.3 + aSeed * 31.0) * 0.25;

    vec3 p = vec3(
      cos(th) * r,
      aY + sin(uTime * 0.6 + aSeed * 47.0) * 0.14,
      sin(th) * r
    );

    // The anomaly sector: proximity in angle and range to the trouble spot.
    float thw = mod(th, TAU);
    float dAng = abs(mod(thw - ${CLUSTER_ANGLE.toFixed(5)} + PI, TAU) - PI);
    float prox = exp(-pow(dAng / 0.5, 2.0)) * exp(-pow((aR - uClusterR) / 2.4, 2.0));
    float infl = prox * uDistress;

    // Agitation jitter while distressed.
    p += vec3(
      sin(uTime * 15.0 + aSeed * 91.0),
      cos(uTime * 18.0 + aSeed * 57.0),
      sin(uTime * 13.0 + aSeed * 73.0)
    ) * infl * 0.12;

    // The sweep brightens whatever it just passed.
    float delta = mod(uSweep - thw, TAU);
    vFlash = exp(-delta * 7.0);

    vHot = infl;
    vGlow = prox * uResolve;
    vTwinkle = 0.5 + 0.5 * sin(uTime * (0.5 + aSeed) + aSeed * 40.0);

    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_PointSize = (0.9 + aSize * 1.1 + infl * 2.4 + vGlow * 1.6) * (46.0 / -mv.z);
    gl_Position = projectionMatrix * mv;
  }
`

const particleFragment = /* glsl */ `
  precision highp float;

  varying float vHot;
  varying float vGlow;
  varying float vFlash;
  varying float vTwinkle;

  void main() {
    vec2 uv = gl_PointCoord - 0.5;
    float d = length(uv);
    if (d > 0.5) discard;
    float soft = smoothstep(0.5, 0.05, d);

    vec3 calm = mix(vec3(0.12, 0.21, 0.18), vec3(0.24, 0.56, 0.44), vTwinkle);
    vec3 hot = mix(vec3(0.96, 0.62, 0.16), vec3(0.94, 0.27, 0.27), smoothstep(0.3, 0.8, vHot));
    vec3 col = mix(calm, hot, smoothstep(0.05, 0.5, vHot));
    col += vec3(0.30, 1.0, 0.65) * vGlow;
    col += vec3(0.55, 1.0, 0.82) * vFlash * 0.55;

    float a = soft * (0.30 + vTwinkle * 0.20 + vHot * 0.55 + vGlow * 0.6 + vFlash * 0.35);
    if (a < 0.003) discard;
    gl_FragColor = vec4(col, a);
  }
`

function clamp01(v: number) {
  return Math.min(1, Math.max(0, v))
}

function smoothstep(edge0: number, edge1: number, x: number) {
  const t = clamp01((x - edge0) / (edge1 - edge0))
  return t * t * (3 - 2 * t)
}

/** Deterministic pseudo-random per cycle: each sweep finds trouble at a new range. */
function hash(n: number) {
  const s = Math.sin(n * 127.1) * 43758.5453
  return s - Math.floor(s)
}

function Scene({
  onState,
  reducedMotion,
}: {
  onState?: (s: RadarState) => void
  reducedMotion: boolean
}) {
  const discMat = useRef<THREE.ShaderMaterial>(null)
  const particleMat = useRef<THREE.ShaderMaterial>(null)
  const pointer = useRef({ x: 0, y: 0 })
  const lastEmit = useRef({ phase: '', score: -1, at: 0 })

  const particles = useMemo(() => {
    const seeds = new Float32Array(COUNT)
    const sizes = new Float32Array(COUNT)
    const radii = new Float32Array(COUNT)
    const thetas = new Float32Array(COUNT)
    const ys = new Float32Array(COUNT)
    // Positions are computed in the vertex shader; this buffer only feeds three.
    const positions = new Float32Array(COUNT * 3)
    for (let i = 0; i < COUNT; i++) {
      seeds[i] = Math.random()
      sizes[i] = Math.random()
      radii[i] = 1.8 + Math.pow(Math.random(), 0.58) * 10.2
      thetas[i] = Math.random() * Math.PI * 2
      ys[i] = (Math.random() - 0.5) * (Math.random() - 0.5) * 2.6
    }
    return { seeds, sizes, radii, thetas, ys, positions }
  }, [])

  const discUniforms = useMemo(
    () => ({
      uSweep: { value: 0 },
      uTime: { value: 0 },
      uWave: { value: -5 },
      uWaveA: { value: 0 },
    }),
    []
  )
  const particleUniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uSweep: { value: 0 },
      uDistress: { value: 0 },
      uResolve: { value: 0 },
      uClusterR: { value: 6 },
    }),
    []
  )

  useFrame(({ clock, pointer: p, camera }) => {
    const du = discMat.current?.uniforms
    const pu = particleMat.current?.uniforms
    if (!du || !pu) return

    // Reduced motion: hold the field on a calm, static frame.
    const time = reducedMotion ? 1.5 : clock.getElapsedTime()
    const sweep = ((Math.PI * 2) / SWEEP_PERIOD) * time

    pu.uTime.value = time
    pu.uSweep.value = sweep
    du.uSweep.value = sweep
    du.uTime.value = time

    const cycle = Math.floor(time / SWEEP_PERIOD)
    const t = (time % SWEEP_PERIOD) / SWEEP_PERIOD

    // Trouble forms ahead of the beam; the beam reaches it at t ≈ 0.62 and heals it.
    const distress = reducedMotion
      ? 0
      : smoothstep(0.2, 0.45, t) * (1 - smoothstep(0.62, 0.72, t))
    const resolve = reducedMotion
      ? 0
      : smoothstep(0.62, 0.66, t) * (1 - smoothstep(0.8, 0.95, t))
    pu.uDistress.value = distress
    pu.uResolve.value = resolve
    pu.uClusterR.value = 4.2 + hash(cycle + 3) * 4.4

    // After the beam clears the anomaly, one healing ring rolls out to the rim.
    du.uWave.value =
      !reducedMotion && t > 0.64 && t < 0.95
        ? THREE.MathUtils.lerp(0, 13, (t - 0.64) / 0.31)
        : -5
    du.uWaveA.value = resolve

    // Parallax drift with the pointer — never an orbit.
    pointer.current.x += (p.x - pointer.current.x) * 0.04
    pointer.current.y += (p.y - pointer.current.y) * 0.04
    camera.position.x = pointer.current.x * 1.6
    camera.position.y = 6.2 + pointer.current.y * 0.7
    // Look-at is offset left so the core sits right of the headline column.
    camera.lookAt(-2.2, 0, 0)

    if (!onState || reducedMotion) return

    let phase: RadarPhase = 'nominal'
    let score = 78
    if (t < 0.2) {
      phase = 'nominal'
      score = 78 + Math.round(Math.sin(time * 0.8) * 2)
    } else if (t < 0.58) {
      phase = 'degrading'
      score = Math.round(THREE.MathUtils.lerp(78, 24, smoothstep(0.2, 0.58, t)))
    } else if (t < 0.68) {
      phase = 'detected'
      score = Math.round(THREE.MathUtils.lerp(24, 33, smoothstep(0.58, 0.68, t)))
    } else if (t < 0.95) {
      phase = 'resolved'
      score = Math.round(THREE.MathUtils.lerp(33, 82, smoothstep(0.68, 0.95, t)))
    } else {
      phase = 'nominal'
      score = 80
    }

    const now = performance.now()
    const last = lastEmit.current
    if (now - last.at > 90 && (phase !== last.phase || score !== last.score)) {
      last.at = now
      last.phase = phase
      last.score = score
      onState({ phase, score, sector: 12 + ((cycle * 7) % 83) })
    }
  })

  return (
    <>
      {/* The radar surface: sweep tail + range rings. */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.4, 0]}>
        <circleGeometry args={[DISC_RADIUS, 96]} />
        <shaderMaterial
          ref={discMat}
          uniforms={discUniforms}
          vertexShader={discVertex}
          fragmentShader={discFragment}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* The signal field the radar watches. */}
      <points frustumCulled={false}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[particles.positions, 3]} />
          <bufferAttribute attach="attributes-aSeed" args={[particles.seeds, 1]} />
          <bufferAttribute attach="attributes-aSize" args={[particles.sizes, 1]} />
          <bufferAttribute attach="attributes-aR" args={[particles.radii, 1]} />
          <bufferAttribute attach="attributes-aTheta" args={[particles.thetas, 1]} />
          <bufferAttribute attach="attributes-aY" args={[particles.ys, 1]} />
        </bufferGeometry>
        <shaderMaterial
          ref={particleMat}
          uniforms={particleUniforms}
          vertexShader={particleVertex}
          fragmentShader={particleFragment}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>

      {/* The emitter: a flat point of light — the pings and the sweep do the talking. */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.38, 0]}>
        <circleGeometry args={[0.14, 32]} />
        <meshBasicMaterial color="#34d399" transparent opacity={0.9} />
      </mesh>
    </>
  )
}

export default function RadarField({ onState }: { onState?: (s: RadarState) => void }) {
  const [reducedMotion, setReducedMotion] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReducedMotion(mq.matches)
    const onChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  return (
    <Canvas
      dpr={[1, 1.75]}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      camera={{ position: [0, 6.2, 9.8], fov: 45, near: 0.1, far: 120 }}
    >
      <Scene onState={onState} reducedMotion={reducedMotion} />
    </Canvas>
  )
}
