import { useEffect, useRef } from 'react'

/**
 * The hero photograph, rendered on the GPU instead of as a CSS background.
 *
 * WHY NOT three.js
 * This draws one full-screen quad with one fragment shader. three.js plus a
 * renderer wrapper is ~200 kB gzipped for a scene graph, camera and lighting
 * model that a single quad never uses - on a main chunk already over Vite's
 * warning threshold. Raw WebGL costs nothing but this file.
 *
 * WHAT IT BUYS
 * A photograph that is never quite still: a slow drift, a depth offset that
 * follows the cursor, and film grain, so the first screen reads as footage
 * rather than as a stock image behind a headline. Frames dissolve through a
 * flow field, which looks like one image becoming another rather than two
 * images being cross-faded.
 *
 * It degrades in three steps: no WebGL, or a lost context, leaves the CSS
 * background underneath visible (the canvas simply never paints); reduced
 * motion holds the frame still and dissolves plainly; everything else gets
 * the full treatment.
 */

const VERT = `
attribute vec2 aPos;
varying vec2 vUv;
void main() {
  vUv = aPos * 0.5 + 0.5;
  gl_Position = vec4(aPos, 0.0, 1.0);
}
`

const FRAG = `
precision highp float;

varying vec2 vUv;

uniform sampler2D uTex0;
uniform sampler2D uTex1;
uniform vec2 uTexRes0;
uniform vec2 uTexRes1;
uniform vec2 uResolution;
uniform vec2 uMouse;
uniform float uTime;
uniform float uProgress;
uniform float uMotion;

float hash21(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float vnoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float a = hash21(i);
  float b = hash21(i + vec2(1.0, 0.0));
  float c = hash21(i + vec2(0.0, 1.0));
  float d = hash21(i + vec2(1.0, 1.0));
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 4; i++) {
    v += a * vnoise(p);
    p *= 2.0;
    a *= 0.5;
  }
  return v;
}

/* background-size: cover, in UV space. Without this the photograph stretches
   with the window instead of being cropped by it. */
vec2 coverUv(vec2 uv, vec2 res, vec2 texRes) {
  float rs = res.x / max(res.y, 1.0);
  float ri = texRes.x / max(texRes.y, 1.0);
  vec2 scale = rs > ri ? vec2(1.0, ri / rs) : vec2(rs / ri, 1.0);
  return (uv - 0.5) * scale + 0.5;
}

void main() {
  vec2 uv = vUv;

  /* Two slow sines at different periods: the frame never repeats a position
     often enough for the movement to read as a loop. */
  float drift = uTime * 0.012;
  vec2 driftOffset = vec2(sin(drift) * 0.012, cos(drift * 0.8) * 0.010) * uMotion;
  float breathe = 1.0 + 0.02 * sin(uTime * 0.08) * uMotion;
  vec2 parallax = uMouse * 0.018 * uMotion;

  vec2 base = (uv - 0.5) / breathe + 0.5 + driftOffset + parallax;

  vec2 uv0 = coverUv(base, uResolution, uTexRes0);
  vec2 uv1 = coverUv(base, uResolution, uTexRes1);

  float t = clamp(uProgress, 0.0, 1.0);

  /* The field the transition travels across.

     The old mask was one big soft threshold over the whole frame, so the new
     photograph bloomed everywhere at once and the change read as a crossfade
     with no moment to it. This gives it somewhere to come from and somewhere
     to go: a diagonal axis carries the direction, a coarse noise bends that
     line into something organic, and a fine noise breaks the boundary so it
     never looks like a gradient sweeping past. */
  float axis = dot(uv - 0.5, normalize(vec2(0.86, 0.34))) + 0.5;
  float coarse = fbm(uv * 1.8 + uTime * 0.02);
  float fine = vnoise(uv * 9.0 - uTime * 0.05);
  float field = axis * 0.60 + coarse * 0.32 + fine * 0.08;

  /* How tight the front is. A narrow band is a wipe with a leading edge; a
     wide one is the crossfade this replaced. EDGE is the whole difference. */
  float EDGE = 0.16;
  float front = t * (1.0 + EDGE * 2.0) - EDGE;
  float mask = 1.0 - smoothstep(front - EDGE, front + EDGE, field);

  /* 1 exactly at the front, 0 in both settled halves. Everything expensive
     below is multiplied by this, so a frame that is not transitioning pays
     for none of it and is never warped. */
  float edge = 4.0 * mask * (1.0 - mask);

  /* The pixels are pushed hardest where the two photographs actually meet,
     rather than across the whole frame - which is what makes them look like
     they are melting into one another instead of fading. */
  float amp = uMotion * 0.16 * edge;
  vec2 flow = vec2(
    fbm(uv * 3.0 + uTime * 0.03),
    fbm(uv * 3.0 + 7.3 - uTime * 0.03)
  ) - 0.5;
  uv0 += flow * amp;
  uv1 -= flow * amp * 0.65;

  vec3 c0 = texture2D(uTex0, clamp(uv0, 0.001, 0.999)).rgb;

  /* One fetch, deliberately. A three-tap chromatic separation at the front
     looked good and cost two extra full-screen texture reads on every pixel
     of every frame, transitioning or not - and this is a full-bleed hero that
     has to hold 60fps on a phone. The front, the warp and the gold below do
     the work; the fringing was the least visible part of it and by far the
     most expensive. */
  vec3 c1 = texture2D(uTex1, clamp(uv1, 0.001, 0.999)).rgb;

  vec3 col = mix(c0, c1, clamp(mask, 0.0, 1.0));

  /* The brand's gold, laid on the front itself and nowhere else, with a
     small lift in brightness behind it. It is what stops the boundary
     reading as an artefact and makes it read as a decision. */
  vec3 GOLD = vec3(0.725, 0.596, 0.318);
  col += GOLD * edge * 0.10 * uMotion;
  col *= 1.0 + edge * 0.06 * uMotion;

  float grain = hash21(uv * uResolution * 0.5 + fract(uTime) * 100.0);
  col += (grain - 0.5) * 0.035 * uMotion;

  float vig = smoothstep(0.95, 0.25, length(uv - 0.5));
  col *= mix(0.72, 1.0, vig);

  gl_FragColor = vec4(col, 1.0);
}
`

interface CinematicHeroProps {
  /** Resolved image URLs, in slide order. */
  images: string[]
  /** Index of the frame that should be showing. */
  index: number
}

interface Tex {
  texture: WebGLTexture
  width: number
  height: number
}

function compile(gl: WebGLRenderingContext, type: number, source: string) {
  const shader = gl.createShader(type)
  if (!shader) return null
  gl.shaderSource(shader, source)
  gl.compileShader(shader)
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader)
    return null
  }
  return shader
}

export default function CinematicHero({ images, index }: CinematicHeroProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  // The render loop reads the target index without being torn down and rebuilt
  // every time the parent advances a slide.
  const indexRef = useRef(index)
  const imagesRef = useRef(images)

  imagesRef.current = images

  useEffect(() => {
    indexRef.current = index
  }, [index])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const gl =
      (canvas.getContext('webgl', { antialias: false, alpha: false }) as WebGLRenderingContext | null) ||
      (canvas.getContext('experimental-webgl') as WebGLRenderingContext | null)
    // No WebGL: paint nothing and let the CSS background show through.
    if (!gl) return

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const motion = reduced ? 0 : 1

    const vert = compile(gl, gl.VERTEX_SHADER, VERT)
    const frag = compile(gl, gl.FRAGMENT_SHADER, FRAG)
    if (!vert || !frag) return

    const program = gl.createProgram()
    if (!program) return
    gl.attachShader(program, vert)
    gl.attachShader(program, frag)
    gl.linkProgram(program)
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return
    gl.useProgram(program)

    const buffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW)
    const aPos = gl.getAttribLocation(program, 'aPos')
    gl.enableVertexAttribArray(aPos)
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0)

    const u = {
      tex0: gl.getUniformLocation(program, 'uTex0'),
      tex1: gl.getUniformLocation(program, 'uTex1'),
      texRes0: gl.getUniformLocation(program, 'uTexRes0'),
      texRes1: gl.getUniformLocation(program, 'uTexRes1'),
      resolution: gl.getUniformLocation(program, 'uResolution'),
      mouse: gl.getUniformLocation(program, 'uMouse'),
      time: gl.getUniformLocation(program, 'uTime'),
      progress: gl.getUniformLocation(program, 'uProgress'),
      motion: gl.getUniformLocation(program, 'uMotion'),
    }
    gl.uniform1i(u.tex0, 0)
    gl.uniform1i(u.tex1, 1)
    gl.uniform1f(u.motion, motion)

    const cache = new Map<string, Tex>()
    const pending = new Set<string>()
    let from: Tex | null = null
    let to: Tex | null = null
    let shown = -1
    let progress = 1

    /* Photographs are never power-of-two, so WebGL1 needs CLAMP_TO_EDGE and a
       non-mipmapped filter or every texture samples as black. */
    const upload = (image: HTMLImageElement): Tex | null => {
      const texture = gl.createTexture()
      if (!texture) return null
      gl.bindTexture(gl.TEXTURE_2D, texture)
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1)
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
      return { texture, width: image.naturalWidth, height: image.naturalHeight }
    }

    const request = (src: string) => {
      if (!src || cache.has(src) || pending.has(src)) return
      pending.add(src)
      const image = new Image()
      image.crossOrigin = 'anonymous'
      image.decoding = 'async'
      image.onload = () => {
        pending.delete(src)
        const tex = upload(image)
        if (tex) cache.set(src, tex)
      }
      image.onerror = () => pending.delete(src)
      image.src = src
    }

    let width = 0
    let height = 0
    const resize = () => {
      // Capped at 2: a 3x phone would otherwise shade nine times the pixels
      // for a difference nobody can see on a photograph.
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const w = Math.round(canvas.clientWidth * dpr)
      const h = Math.round(canvas.clientHeight * dpr)
      if (w === width && h === height) return
      width = w
      height = h
      canvas.width = w
      canvas.height = h
      gl.viewport(0, 0, w, h)
      gl.uniform2f(u.resolution, w, h)
    }

    const mouse = { x: 0, y: 0, tx: 0, ty: 0 }
    const onMouseMove = (event: MouseEvent) => {
      mouse.tx = (event.clientX / window.innerWidth) * 2 - 1
      mouse.ty = (event.clientY / window.innerHeight) * 2 - 1
    }
    if (motion) window.addEventListener('mousemove', onMouseMove, { passive: true })

    let raf = 0
    let lost = false
    const onLost = (event: Event) => {
      event.preventDefault()
      lost = true
      cancelAnimationFrame(raf)
    }
    canvas.addEventListener('webglcontextlost', onLost)

    const start = performance.now()
    let last = start
    let painted = false

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame)
      if (lost) return

      const dt = Math.min((now - last) / 1000, 0.05)
      last = now
      resize()

      const list = imagesRef.current
      const target = Math.min(Math.max(indexRef.current, 0), Math.max(list.length - 1, 0))
      const src = list[target]
      if (src) request(src)
      // The next frame is fetched while the current one is still showing, so
      // advancing never dissolves into an empty texture.
      const upcoming = list[(target + 1) % list.length]
      if (upcoming) request(upcoming)

      const ready = src ? cache.get(src) : undefined
      if (ready && target !== shown) {
        from = to ?? ready
        to = ready
        shown = target
        progress = to === from ? 1 : 0
      }
      if (!to) return

      // Reduced motion gets a short plain dissolve; otherwise it is slow
      // enough to read as a dissolve rather than a cut.
      progress = Math.min(progress + dt / (reduced ? 0.25 : 1.6), 1)

      mouse.x += (mouse.tx - mouse.x) * 0.045
      mouse.y += (mouse.ty - mouse.y) * 0.045

      const source = from ?? to
      gl.activeTexture(gl.TEXTURE0)
      gl.bindTexture(gl.TEXTURE_2D, source.texture)
      gl.uniform2f(u.texRes0, source.width, source.height)
      gl.activeTexture(gl.TEXTURE1)
      gl.bindTexture(gl.TEXTURE_2D, to.texture)
      gl.uniform2f(u.texRes1, to.width, to.height)

      gl.uniform1f(u.time, motion ? (now - start) / 1000 : 0)
      gl.uniform1f(u.progress, progress)
      gl.uniform2f(u.mouse, mouse.x, mouse.y)

      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)

      // An un-drawn alpha:false canvas is opaque black, which would cover the
      // CSS photograph underneath while the first texture decodes. Reveal it
      // only once it has something real on it; both layers are the same frame
      // at the same crop, so the swap is invisible.
      if (!painted) {
        painted = true
        canvas.style.opacity = '1'
      }
    }
    raf = requestAnimationFrame(frame)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('mousemove', onMouseMove)
      canvas.removeEventListener('webglcontextlost', onLost)
      cache.forEach((tex) => gl.deleteTexture(tex.texture))
      cache.clear()
      gl.deleteBuffer(buffer)
      gl.deleteProgram(program)
      gl.deleteShader(vert)
      gl.deleteShader(frag)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="absolute inset-0 h-full w-full"
      style={{ display: 'block', opacity: 0, transition: 'opacity 700ms ease' }}
    />
  )
}
