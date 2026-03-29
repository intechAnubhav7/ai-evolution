import { useEffect, useRef, useCallback } from 'react'
import * as THREE from 'three'

/* ═══════════════════════════════════════════════════════════════
   NeuralNetworkScene.jsx
   ─────────────────────────────────────────────────────────────
   A performant Three.js 3D neural network visualization.

   Architecture
   ────────────
   • Nodes   — InstancedMesh of SphereGeometry (1 draw call for all nodes)
   • Edges   — LineSegments with a BufferGeometry (1 draw call for all wires)
   • Pulses  — InstancedMesh of small spheres that travel along edges
   • Glow    — AdditiveBlending sprite per node layer color
   • Float   — each node has an independent sin/cos oscillation offset
   • Mouse   — subtle camera parallax on pointer move

   Performance budget
   ────────────────────
   • ≤ 300 node instances   (instanced, no per-node draw calls)
   • ≤ 1000 edge segments   (single LineSegments call)
   • ≤ 40 pulse instances   (instanced, pooled, recycled)
   • requestAnimationFrame gated by visibility (IntersectionObserver)
   • Renderer pixel ratio capped at 1.5
   • Dispose everything on unmount
═══════════════════════════════════════════════════════════════ */

/* ─── Network topology ──────────────────────────────────────── */
const LAYER_DEFS = [
  { count: 4,  color: '#00d4ff', label: 'INPUT'   },
  { count: 7,  color: '#1ac8ff', label: 'H · 01'  },
  { count: 8,  color: '#7b2fff', label: 'H · 02'  },
  { count: 8,  color: '#9528ff', label: 'H · 03'  },
  { count: 6,  color: '#c040ff', label: 'H · 04'  },
  { count: 5,  color: '#e030d0', label: 'H · 05'  },
  { count: 3,  color: '#ff2d78', label: 'OUTPUT'  },
]

/* ─── Scene constants ───────────────────────────────────────── */
const LAYER_SPACING  = 2.6   // X distance between layers
const NODE_SPREAD    = 1.6   // Y spread within a layer
const NODE_RADIUS    = 0.10  // sphere radius
const EDGE_OPACITY   = 0.10  // base wire opacity
const FLOAT_SPEED    = 0.38  // global oscillation speed multiplier
const FLOAT_AMOUNT   = 0.09  // max Y/Z float displacement
const PULSE_SPEED    = 0.016 // pulse travel speed per frame (0→1 per edge)
const PULSE_COUNT    = 38    // total pulse pool
const PULSE_RADIUS   = 0.055 // pulse sphere radius
const CAM_Z          = 10    // camera z position
const FOV            = 50
const MOUSE_STRENGTH = 0.30  // camera parallax strength

/* ─── Build node positions ──────────────────────────────────── */
function buildNetwork() {
  const nodes   = []  // { pos: Vector3, layerIdx, nodeIdx, color, floatOffset }
  const edges   = []  // { a: nodeIdx, b: nodeIdx }

  const totalLayers = LAYER_DEFS.length
  const xStart      = -((totalLayers - 1) * LAYER_SPACING) / 2

  let globalIdx = 0

  LAYER_DEFS.forEach((layer, li) => {
    const x        = xStart + li * LAYER_SPACING
    const yStart   = -((layer.count - 1) * NODE_SPREAD) / 2
    const layerStart = globalIdx

    for (let ni = 0; ni < layer.count; ni++) {
      const y = yStart + ni * NODE_SPREAD
      nodes.push({
        pos:         new THREE.Vector3(x, y, 0),
        basePos:     new THREE.Vector3(x, y, 0),
        layerIdx:    li,
        nodeIdx:     globalIdx,
        color:       new THREE.Color(layer.color),
        floatOffset: Math.random() * Math.PI * 2,   // phase offset
        floatFreqY:  0.7 + Math.random() * 0.6,     // individual frequency
        floatFreqZ:  0.5 + Math.random() * 0.8,
      })
      globalIdx++
    }

    // Connect every node in this layer → every node in next layer
    if (li < totalLayers - 1) {
      const nextLayer    = LAYER_DEFS[li + 1]
      const nextStart    = globalIdx  // nodes not yet pushed, but index is known
      // We'll resolve after all nodes are built — store layer ranges instead
    }
  })

  // Build edges from layer connectivity
  let layerStarts = []
  let idx = 0
  LAYER_DEFS.forEach((layer) => {
    layerStarts.push(idx)
    idx += layer.count
  })

  for (let li = 0; li < LAYER_DEFS.length - 1; li++) {
    const aStart = layerStarts[li],     aCount = LAYER_DEFS[li].count
    const bStart = layerStarts[li + 1], bCount = LAYER_DEFS[li + 1].count
    for (let ai = 0; ai < aCount; ai++) {
      for (let bi = 0; bi < bCount; bi++) {
        edges.push({ a: aStart + ai, b: bStart + bi })
      }
    }
  }

  return { nodes, edges, layerStarts }
}

/* ─── Pulse state ───────────────────────────────────────────── */
function createPulses(edges, count) {
  return Array.from({ length: count }, () => {
    const edgeIdx = Math.floor(Math.random() * edges.length)
    return {
      edgeIdx,
      t:      Math.random(),   // 0 = at node A, 1 = at node B
      active: true,
    }
  })
}

/* ═══════════════════════════════════════════════════════════════
   Main component
═══════════════════════════════════════════════════════════════ */
export default function NeuralNetworkScene({
  className = '',
  style     = {},
  height    = 480,
}) {
  const mountRef     = useRef(null)
  const stateRef     = useRef(null)   // holds all Three.js objects
  const rafRef       = useRef(null)
  const mouseRef     = useRef({ x: 0, y: 0, tx: 0, ty: 0 })
  const visibleRef   = useRef(true)

  /* ── Build and mount the scene ── */
  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return

    /* ── Renderer ── */
    const renderer = new THREE.WebGLRenderer({
      antialias:  true,
      alpha:      true,
      powerPreference: 'high-performance',
    })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5))
    renderer.setSize(mount.clientWidth, mount.clientHeight)
    renderer.setClearColor(0x000000, 0)
    renderer.sortObjects = true
    mount.appendChild(renderer.domElement)

    /* ── Scene & Camera ── */
    const scene  = new THREE.Scene()
    const aspect = mount.clientWidth / mount.clientHeight
    const camera = new THREE.PerspectiveCamera(FOV, aspect, 0.1, 100)
    camera.position.set(0, 0, CAM_Z)

    /* ── Build network data ── */
    const { nodes, edges, layerStarts } = buildNetwork()
    const nodeCount = nodes.length
    const edgeCount = edges.length

    /* ─────────────────────────────────────────
       NODES — InstancedMesh
    ───────────────────────────────────────── */
    const nodeGeo = new THREE.SphereGeometry(NODE_RADIUS, 12, 8)
    const nodeMat = new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.92 })

    // We need per-instance color, so we use vertex colors on the geometry
    // but InstancedMesh doesn't support vertex color per instance via MeshBasicMaterial directly.
    // Use a custom approach: separate InstancedMesh per layer color.
    const layerMeshes = []

    LAYER_DEFS.forEach((layerDef, li) => {
      const layerNodes = nodes.filter(n => n.layerIdx === li)
      if (!layerNodes.length) return

      const geo = new THREE.SphereGeometry(NODE_RADIUS, 12, 8)
      const mat = new THREE.MeshBasicMaterial({
        color:       new THREE.Color(layerDef.color),
        transparent: true,
        opacity:     0.90,
      })
      const mesh = new THREE.InstancedMesh(geo, mat, layerNodes.length)
      mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage)

      const dummy = new THREE.Object3D()
      layerNodes.forEach((node, i) => {
        dummy.position.copy(node.pos)
        dummy.updateMatrix()
        mesh.setMatrixAt(i, dummy.matrix)
      })
      mesh.instanceMatrix.needsUpdate = true

      scene.add(mesh)
      layerMeshes.push({ mesh, layerIdx: li, layerNodes })
    })

    /* ─────────────────────────────────────────
       NODE GLOW — additive sprite per layer
    ───────────────────────────────────────── */
    // Sprite texture: radial gradient baked into a canvas
    function makeGlowTexture(color) {
      const size = 64
      const canvas = document.createElement('canvas')
      canvas.width = canvas.height = size
      const ctx = canvas.getContext('2d')
      const grad = ctx.createRadialGradient(size/2, size/2, 0, size/2, size/2, size/2)
      grad.addColorStop(0,   color + 'cc')
      grad.addColorStop(0.3, color + '55')
      grad.addColorStop(1,   color + '00')
      ctx.fillStyle = grad
      ctx.fillRect(0, 0, size, size)
      return new THREE.CanvasTexture(canvas)
    }

    const glowSprites = []
    LAYER_DEFS.forEach((layerDef, li) => {
      const tex      = makeGlowTexture(layerDef.color)
      const mat      = new THREE.SpriteMaterial({
        map:     tex,
        blending:THREE.AdditiveBlending,
        transparent: true,
        opacity: 0.55,
        depthWrite: false,
      })
      const layerNodes = nodes.filter(n => n.layerIdx === li)
      layerNodes.forEach(node => {
        const sprite = new THREE.Sprite(mat.clone())
        sprite.position.copy(node.pos)
        sprite.scale.setScalar(0.55)
        scene.add(sprite)
        glowSprites.push({ sprite, nodeIdx: node.nodeIdx })
      })
      tex.dispose()   // texture transferred to GPU, CPU copy no longer needed
    })

    /* ─────────────────────────────────────────
       EDGES — single LineSegments call
    ───────────────────────────────────────── */
    const edgePosArr = new Float32Array(edgeCount * 6)   // 2 verts × 3 floats per edge
    const edgeColArr = new Float32Array(edgeCount * 6)   // vertex color per endpoint

    edges.forEach((edge, ei) => {
      const na = nodes[edge.a], nb = nodes[edge.b]
      const base = ei * 6
      edgePosArr[base]   = na.pos.x; edgePosArr[base+1] = na.pos.y; edgePosArr[base+2] = na.pos.z
      edgePosArr[base+3] = nb.pos.x; edgePosArr[base+4] = nb.pos.y; edgePosArr[base+5] = nb.pos.z
      // Color = gradient between the two layer colors
      edgeColArr[base]   = na.color.r; edgeColArr[base+1] = na.color.g; edgeColArr[base+2] = na.color.b
      edgeColArr[base+3] = nb.color.r; edgeColArr[base+4] = nb.color.g; edgeColArr[base+5] = nb.color.b
    })

    const edgeGeo = new THREE.BufferGeometry()
    edgeGeo.setAttribute('position', new THREE.BufferAttribute(edgePosArr, 3))
    edgeGeo.setAttribute('color',    new THREE.BufferAttribute(edgeColArr, 3))
    edgeGeo.attributes.position.setUsage(THREE.DynamicDrawUsage)

    const edgeMat  = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent:  true,
      opacity:      EDGE_OPACITY,
      blending:     THREE.AdditiveBlending,
      depthWrite:   false,
    })
    const edgeMesh = new THREE.LineSegments(edgeGeo, edgeMat)
    scene.add(edgeMesh)

    /* ─────────────────────────────────────────
       PULSES — InstancedMesh, pooled & recycled
    ───────────────────────────────────────── */
    const pulses = createPulses(edges, PULSE_COUNT)

    const pulseGeo  = new THREE.SphereGeometry(PULSE_RADIUS, 8, 6)
    const pulseMat  = new THREE.MeshBasicMaterial({
      color:       0xffffff,
      transparent: true,
      opacity:     0.85,
      blending:    THREE.AdditiveBlending,
      depthWrite:  false,
    })
    const pulseMesh = new THREE.InstancedMesh(pulseGeo, pulseMat, PULSE_COUNT)
    pulseMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage)
    scene.add(pulseMesh)

    // Per-pulse color (lerped between layer colors of the edge endpoints)
    const pulseColorArr = new Float32Array(PULSE_COUNT * 3)
    pulseMesh.instanceColor = new THREE.InstancedBufferAttribute(pulseColorArr, 3)

    /* ─────────────────────────────────────────
       Store all refs for the animation loop
    ───────────────────────────────────────── */
    stateRef.current = {
      renderer, scene, camera,
      nodes, edges, layerStarts,
      layerMeshes, glowSprites,
      edgeGeo, edgePosArr,
      pulseMesh, pulses,
      clock: new THREE.Clock(),
    }

    /* ─────────────────────────────────────────
       Animation loop
    ───────────────────────────────────────── */
    const dummy = new THREE.Object3D()
    const tmpColor = new THREE.Color()

    function tick() {
      rafRef.current = requestAnimationFrame(tick)
      if (!visibleRef.current) return

      const { clock, nodes, edges, layerMeshes, glowSprites,
              edgeGeo, edgePosArr, pulseMesh, pulses } = stateRef.current

      const t = clock.getElapsedTime()

      /* Mouse parallax — smooth damp */
      const m = mouseRef.current
      m.tx += (m.x - m.tx) * 0.04
      m.ty += (m.y - m.ty) * 0.04
      camera.position.x = m.tx * MOUSE_STRENGTH
      camera.position.y = m.ty * MOUSE_STRENGTH * 0.6
      camera.lookAt(0, 0, 0)

      /* Float nodes */
      nodes.forEach(node => {
        const fy = Math.sin(t * FLOAT_SPEED * node.floatFreqY + node.floatOffset) * FLOAT_AMOUNT
        const fz = Math.cos(t * FLOAT_SPEED * node.floatFreqZ + node.floatOffset * 1.3) * FLOAT_AMOUNT * 0.6
        node.pos.set(node.basePos.x, node.basePos.y + fy, node.basePos.z + fz)
      })

      /* Update node instance matrices */
      layerMeshes.forEach(({ mesh, layerNodes }) => {
        layerNodes.forEach((node, i) => {
          dummy.position.copy(node.pos)
          dummy.updateMatrix()
          mesh.setMatrixAt(i, dummy.matrix)
        })
        mesh.instanceMatrix.needsUpdate = true
      })

      /* Sync glow sprites to node positions */
      glowSprites.forEach(({ sprite, nodeIdx }) => {
        sprite.position.copy(nodes[nodeIdx].pos)
      })

      /* Update edge positions (nodes have moved) */
      edges.forEach((edge, ei) => {
        const na = nodes[edge.a], nb = nodes[edge.b]
        const base = ei * 6
        edgePosArr[base]   = na.pos.x; edgePosArr[base+1] = na.pos.y; edgePosArr[base+2] = na.pos.z
        edgePosArr[base+3] = nb.pos.x; edgePosArr[base+4] = nb.pos.y; edgePosArr[base+5] = nb.pos.z
      })
      edgeGeo.attributes.position.needsUpdate = true

      /* Animate pulses */
      pulses.forEach((pulse, pi) => {
        pulse.t += PULSE_SPEED

        if (pulse.t >= 1.0) {
          // Recycle: pick a new random edge, restart
          pulse.edgeIdx = Math.floor(Math.random() * edges.length)
          pulse.t       = 0
        }

        const edge = edges[pulse.edgeIdx]
        const na   = nodes[edge.a]
        const nb   = nodes[edge.b]

        // Position: lerp between node A and B
        dummy.position.lerpVectors(na.pos, nb.pos, pulse.t)
        dummy.updateMatrix()
        pulseMesh.setMatrixAt(pi, dummy.matrix)

        // Color: lerp between layer colors
        tmpColor.lerpColors(na.color, nb.color, pulse.t)
        pulseMesh.setColorAt(pi, tmpColor)
      })
      pulseMesh.instanceMatrix.needsUpdate = true
      pulseMesh.instanceColor.needsUpdate  = true

      renderer.render(scene, camera)
    }

    tick()

    /* ─── Resize handler ─── */
    const onResize = () => {
      if (!mount) return
      const w = mount.clientWidth, h = mount.clientHeight
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      renderer.setSize(w, h)
    }
    window.addEventListener('resize', onResize)

    /* ─── Mouse parallax ─── */
    const onMouse = (e) => {
      const rect = mount.getBoundingClientRect()
      mouseRef.current.x = ((e.clientX - rect.left) / rect.width  - 0.5) * 2
      mouseRef.current.y = -((e.clientY - rect.top)  / rect.height - 0.5) * 2
    }
    mount.addEventListener('mousemove', onMouse)

    /* ─── Pause when off-screen (IntersectionObserver) ─── */
    const observer = new IntersectionObserver(
      ([entry]) => { visibleRef.current = entry.isIntersecting },
      { threshold: 0.05 }
    )
    observer.observe(mount)

    /* ─── Cleanup ─── */
    return () => {
      cancelAnimationFrame(rafRef.current)
      window.removeEventListener('resize', onResize)
      mount.removeEventListener('mousemove', onMouse)
      observer.disconnect()

      // Dispose all Three.js resources
      layerMeshes.forEach(({ mesh }) => {
        mesh.geometry.dispose()
        mesh.material.dispose()
        scene.remove(mesh)
      })
      glowSprites.forEach(({ sprite }) => {
        sprite.material.map?.dispose()
        sprite.material.dispose()
        scene.remove(sprite)
      })
      edgeGeo.dispose()
      edgeMat.dispose()
      pulseGeo.dispose()
      pulseMat.dispose()
      scene.remove(edgeMesh)
      scene.remove(pulseMesh)

      renderer.dispose()
      if (mount.contains(renderer.domElement)) {
        mount.removeChild(renderer.domElement)
      }

      stateRef.current = null
    }
  }, [])

  return (
    <div
      ref={mountRef}
      className={className}
      style={{ width: '100%', height, position: 'relative', ...style }}
      aria-hidden="true"
    />
  )
}
