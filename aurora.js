import { Renderer, Program, Mesh, Color, Triangle } from "https://esm.sh/ogl@1.0.11";

const VERT = `#version 300 es
in vec2 position;
void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

const FRAG = `#version 300 es
precision highp float;

uniform float uTime;
uniform float uAmplitude;
uniform vec3 uColorStops[4];
uniform vec2 uResolution;
uniform float uBlend;

out vec4 fragColor;

vec3 permute(vec3 x) {
  return mod(((x * 34.0) + 1.0) * x, 289.0);
}

float snoise(vec2 v){
  const vec4 C = vec4(
    0.211324865405187, 0.366025403784439,
    -0.577350269189626, 0.024390243902439
  );
  vec2 i = floor(v + dot(v, C.yy));
  vec2 x0 = v - i + dot(i, C.xx);
  vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod(i, 289.0);

  vec3 p = permute(
    permute(i.y + vec3(0.0, i1.y, 1.0))
    + i.x + vec3(0.0, i1.x, 1.0)
  );

  vec3 m = max(
    0.5 - vec3(
      dot(x0, x0),
      dot(x12.xy, x12.xy),
      dot(x12.zw, x12.zw)
    ),
    0.0
  );
  m = m * m;
  m = m * m;

  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);

  vec3 g;
  g.x = a0.x * x0.x + h.x * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

struct ColorStop {
  vec3 color;
  float position;
};

#define COLOR_RAMP(colors, factor, finalColor) { \
  int index = 0; \
  for (int i = 0; i < 3; i++) { \
    ColorStop currentColor = colors[i]; \
    bool isInBetween = currentColor.position <= factor; \
    index = int(mix(float(index), float(i), float(isInBetween))); \
  } \
  ColorStop currentColor = colors[index]; \
  ColorStop nextColor = colors[index + 1]; \
  float range = nextColor.position - currentColor.position; \
  float lerpFactor = (factor - currentColor.position) / range; \
  finalColor = mix(currentColor.color, nextColor.color, lerpFactor); \
}

void main() {
  vec2 uv = gl_FragCoord.xy / uResolution;
  uv.y = 1.0 - uv.y;

  ColorStop colors[4];
  colors[0] = ColorStop(uColorStops[0], 0.0);
  colors[1] = ColorStop(uColorStops[1], 0.333);
  colors[2] = ColorStop(uColorStops[2], 0.666);
  colors[3] = ColorStop(uColorStops[3], 1.0);

  vec3 rampColor;
  COLOR_RAMP(colors, uv.x, rampColor);

  float height = snoise(vec2(uv.x * 2.0 + uTime * 0.1, uTime * 0.25)) * 0.5 * uAmplitude;
  height = exp(height);
  height = (uv.y * 2.0 - height + 0.2);
  float intensity = 0.6 * height;

  float midPoint = 0.20;
  float auroraAlpha = smoothstep(midPoint - uBlend * 0.5, midPoint + uBlend * 0.5, intensity);

  vec3 auroraColor = intensity * rampColor;

  fragColor = vec4(auroraColor * auroraAlpha, auroraAlpha);
}
`;

function hexToRgb(hex) {
  const c = new Color(hex);
  return [c.r, c.g, c.b];
}

/**
 * Mount a react-bits–style Aurora background into a container element.
 * @param {HTMLElement} container
 * @param {object} options
 */
export function initAurora(container, options = {}) {
  if (!container) return null;

  const settings = {
    colorStops: ["#84B5FF", "#0569FF", "#AE8EFF", "#FFCCA5"],
    amplitude: 0.8,
    blend: 0.5,
    speed: 1.0,
    animate: true,
    ...options,
  };

  const renderer = new Renderer({
    alpha: true,
    premultipliedAlpha: true,
    antialias: settings.antialias !== false,
    dpr: settings.dpr ?? Math.min(window.devicePixelRatio || 1, 2),
  });
  const gl = renderer.gl;
  gl.clearColor(0, 0, 0, 0);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
  gl.canvas.style.backgroundColor = "transparent";
  gl.canvas.style.width = "100%";
  gl.canvas.style.height = "100%";
  gl.canvas.style.display = "block";

  container.appendChild(gl.canvas);

  const geometry = new Triangle(gl);
  if (geometry.attributes.uv) {
    delete geometry.attributes.uv;
  }

  const paddedStops = settings.colorStops.slice(0, 4);
  while (paddedStops.length < 4) {
    paddedStops.push(paddedStops[paddedStops.length - 1]);
  }

  const program = new Program(gl, {
    vertex: VERT,
    fragment: FRAG,
    uniforms: {
      uTime: { value: 0 },
      uAmplitude: { value: settings.amplitude },
      uColorStops: { value: paddedStops.map(hexToRgb) },
      uResolution: { value: [container.offsetWidth, container.offsetHeight] },
      uBlend: { value: settings.blend },
    },
  });

  const mesh = new Mesh(gl, { geometry, program });

  function hasSize() {
    return container.offsetWidth > 0 && container.offsetHeight > 0;
  }

  function resize() {
    const width = container.offsetWidth;
    const height = container.offsetHeight;
    if (!width || !height) return false;
    renderer.setSize(width, height);
    program.uniforms.uResolution.value = [width, height];
    return true;
  }

  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(container);
  if (container.parentElement) {
    resizeObserver.observe(container.parentElement);
  }
  window.addEventListener("resize", resize);
  window.addEventListener("load", resize);

  let animateId = 0;
  let running = settings.animate;

  function update(t) {
    if (!running) return;

    animateId = requestAnimationFrame(update);
    program.uniforms.uTime.value = t * 0.01 * settings.speed * 0.1;
    program.uniforms.uAmplitude.value = settings.amplitude;
    program.uniforms.uBlend.value = settings.blend;
    program.uniforms.uColorStops.value = paddedStops.map(hexToRgb);

    const [rw, rh] = program.uniforms.uResolution.value;
    if (!rw || !rh) {
      if (!resize() && !hasSize()) return;
    }
    renderer.render({ scene: mesh });
  }

  if (running) {
    animateId = requestAnimationFrame(update);
  } else {
    update(0);
  }

  return {
    destroy() {
      running = false;
      cancelAnimationFrame(animateId);
      resizeObserver.disconnect();
      window.removeEventListener("resize", resize);
      window.removeEventListener("load", resize);
      if (gl.canvas.parentNode === container) {
        container.removeChild(gl.canvas);
      }
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    },
    setAnimate(value) {
      if (value === running) return;
      running = value;
      if (running) {
        animateId = requestAnimationFrame(update);
      } else {
        cancelAnimationFrame(animateId);
        animateId = 0;
      }
    },
  };
}
