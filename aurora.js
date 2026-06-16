import { Renderer, Program, Mesh, Triangle } from "https://esm.sh/ogl@1.0.11";

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

float hueToRgb(float p, float q, float t) {
  if (t < 0.0) t += 1.0;
  if (t > 1.0) t -= 1.0;
  if (t < 1.0 / 6.0) return p + (q - p) * 6.0 * t;
  if (t < 0.5) return q;
  if (t < 2.0 / 3.0) return p + (q - p) * (2.0 / 3.0 - t) * 6.0;
  return p;
}

vec3 hslToRgb(vec3 hsl) {
  if (hsl.y <= 0.0) return vec3(hsl.z);
  float q = hsl.z < 0.5 ? hsl.z * (1.0 + hsl.y) : hsl.z + hsl.y - hsl.z * hsl.y;
  float p = 2.0 * hsl.z - q;
  return vec3(
    hueToRgb(p, q, hsl.x + 1.0 / 3.0),
    hueToRgb(p, q, hsl.x),
    hueToRgb(p, q, hsl.x - 1.0 / 3.0)
  );
}

vec3 rgbToHsl(vec3 rgb) {
  float maxC = max(rgb.r, max(rgb.g, rgb.b));
  float minC = min(rgb.r, min(rgb.g, rgb.b));
  float l = (maxC + minC) * 0.5;
  if (maxC == minC) return vec3(0.0, 0.0, l);

  float d = maxC - minC;
  float s = l > 0.5 ? d / (2.0 - maxC - minC) : d / (maxC + minC);
  float h;
  if (maxC == rgb.r) h = (rgb.g - rgb.b) / d + (rgb.g < rgb.b ? 6.0 : 0.0);
  else if (maxC == rgb.g) h = (rgb.b - rgb.r) / d + 2.0;
  else h = (rgb.r - rgb.g) / d + 4.0;
  return vec3(h / 6.0, s, l);
}

// Short-path hue interpolation keeps purple→peach in magenta/pink, not yellow.
vec3 mixPaletteColors(vec3 a, vec3 b, float t) {
  vec3 ha = rgbToHsl(a);
  vec3 hb = rgbToHsl(b);
  float dh = hb.x - ha.x;
  if (dh > 0.5) dh -= 1.0;
  else if (dh < -0.5) dh += 1.0;
  float h = fract(ha.x + dh * t);
  float s = mix(ha.y, hb.y, t);
  float l = mix(ha.z, hb.z, t);
  return hslToRgb(vec3(h, s, l));
}

vec3 auroraRampColor(float factor) {
  vec3 palette[4];
  palette[0] = vec3(0.521569, 0.709804, 1.0);      // #84B5FF
  palette[1] = vec3(0.019608, 0.411765, 1.0);      // #0569FF
  palette[2] = vec3(0.682353, 0.556863, 1.0);      // #AE8EFF
  palette[3] = vec3(1.0, 0.8, 0.647059);           // #FFCCA5

  float scaled = clamp(factor, 0.0, 0.999999) * 3.0;
  int idx = int(floor(scaled));
  float blend = fract(scaled);
  return mixPaletteColors(palette[idx], palette[idx + 1], blend);
}

void main() {
  vec2 uv = gl_FragCoord.xy / uResolution;
  uv.y = 1.0 - uv.y;

  vec3 rampColor = auroraRampColor(uv.x);

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

export const AURORA_COLOR_STOPS = ["#84B5FF", "#0569FF", "#AE8EFF", "#FFCCA5"];

/**
 * Mount a react-bits–style Aurora background into a container element.
 * @param {HTMLElement} container
 * @param {object} options
 */
export function initAurora(container, options = {}) {
  if (!container) return null;

  const settings = {
    amplitude: 0.8,
    blend: 0.5,
    speed: 1.0,
    animate: true,
    ...options,
  };

  if (
    options.colorStops &&
    options.colorStops.some((stop, i) => stop?.toUpperCase() !== AURORA_COLOR_STOPS[i])
  ) {
    console.warn("initAurora: only the brand aurora palette is supported; using AURORA_COLOR_STOPS.");
  }

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

  const program = new Program(gl, {
    vertex: VERT,
    fragment: FRAG,
    uniforms: {
      uTime: { value: 0 },
      uAmplitude: { value: settings.amplitude },
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
