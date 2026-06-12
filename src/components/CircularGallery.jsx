import { Camera, Mesh, Plane, Program, Renderer, Texture, Transform } from 'ogl';
import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';

import './CircularGallery.css';

function debounce(func, wait) {
  let timeout;
  return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

function lerp(p1, p2, t) {
  return p1 + (p2 - p1) * t;
}

function autoBind(instance) {
  const proto = Object.getPrototypeOf(instance);
  Object.getOwnPropertyNames(proto).forEach(key => {
    if (key !== 'constructor' && typeof instance[key] === 'function') {
      instance[key] = instance[key].bind(instance);
    }
  });
}

const DEFAULT_FONT = 'bold 30px Figtree';
const DEFAULT_FONT_URL =
  'https://fonts.googleapis.com/css2?family=Figtree:wght@400;700&display=swap';

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function drawCover(ctx, img, width, height) {
  const imgAspect = img.naturalWidth / img.naturalHeight;
  const canvasAspect = width / height;
  let drawWidth;
  let drawHeight;
  let offsetX;
  let offsetY;

  if (imgAspect > canvasAspect) {
    drawHeight = height;
    drawWidth = height * imgAspect;
    offsetX = (width - drawWidth) / 2;
    offsetY = 0;
  } else {
    drawWidth = width;
    drawHeight = width / imgAspect;
    offsetX = 0;
    offsetY = (height - drawHeight) / 2;
  }

  ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
}

async function createLayeredCardImage(bgSrc, overlaySrc) {
  const [bg, overlay] = await Promise.all([loadImage(bgSrc), loadImage(overlaySrc)]);
  const width = bg.naturalWidth;
  const height = bg.naturalHeight;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  drawCover(ctx, bg, width, height);
  drawCover(ctx, overlay, width, height);
  return canvas;
}

function deriveFontFamilyFromUrl(url) {
  const fileName = (url.split('/').pop() || 'custom-font').split('?')[0];
  const base = fileName.replace(/\.(woff2?|ttf|otf|eot)$/i, '');
  return base.replace(/[^a-zA-Z0-9-_ ]/g, '').trim() || 'CircularGalleryFont';
}

async function loadFontFromStylesheet(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to fetch font stylesheet (${response.status})`);
  const cssText = await response.text();
  const faceBlocks = cssText.match(/@font-face\s*{[^}]*}/g) || [];
  let family = null;
  const fontFaces = [];
  for (const block of faceBlocks) {
    const familyMatch = block.match(/font-family:\s*['"]?([^;'"]+)['"]?/);
    const urlMatch = block.match(/url\(\s*['"]?([^'")]+)['"]?\s*\)/);
    if (!familyMatch || !urlMatch) continue;
    family = familyMatch[1].trim();
    const descriptors = {};
    const weightMatch = block.match(/font-weight:\s*([^;]+);/);
    const styleMatch = block.match(/font-style:\s*([^;]+);/);
    const rangeMatch = block.match(/unicode-range:\s*([^;]+);/);
    if (weightMatch) descriptors.weight = weightMatch[1].trim();
    if (styleMatch) descriptors.style = styleMatch[1].trim();
    if (rangeMatch) descriptors.unicodeRange = rangeMatch[1].trim();
    fontFaces.push(new FontFace(family, `url(${urlMatch[1]})`, descriptors));
  }
  if (!family) throw new Error('No @font-face rule found in the stylesheet');
  await Promise.allSettled(
    fontFaces.map(async face => {
      await face.load();
      document.fonts.add(face);
    })
  );
  return family;
}

async function loadFontFromFile(url) {
  const family = deriveFontFamilyFromUrl(url);
  const fontFace = new FontFace(family, `url(${url})`);
  await fontFace.load();
  document.fonts.add(fontFace);
  return family;
}

async function loadCustomFont(fontUrl) {
  const isStylesheet =
    fontUrl.includes('fonts.googleapis.com') || /\.css(\?.*)?$/i.test(fontUrl);
  return isStylesheet ? loadFontFromStylesheet(fontUrl) : loadFontFromFile(fontUrl);
}

async function resolveFont(font, fontUrl) {
  const effectiveUrl = fontUrl || (font === DEFAULT_FONT ? DEFAULT_FONT_URL : null);
  if (!effectiveUrl) {
    if (document.fonts && document.fonts.load) {
      try {
        await document.fonts.load(font);
        await document.fonts.ready;
      } catch {
        // Ignore – fall back to whatever the browser provides.
      }
    }
    return font;
  }
  try {
    const family = await loadCustomFont(effectiveUrl);
    const sizeMatch = font.match(/^\s*(.*?\d+px)/);
    const prefix = sizeMatch ? sizeMatch[1].trim() : 'bold 30px';
    const resolved = `${prefix} "${family}"`;
    if (document.fonts && document.fonts.load) {
      try {
        await document.fonts.load(resolved);
      } catch {
        // Ignore – we still attempt to render with the requested font.
      }
    }
    return resolved;
  } catch (error) {
    console.error('CircularGallery: unable to load font from', fontUrl, error);
    return font;
  }
}

function getFontSize(font) {
  const match = font.match(/(\d+)px/);
  return match ? parseInt(match[1], 10) : 30;
}

function createTextTexture(gl, text, font = 'bold 30px monospace', color = 'black') {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  context.font = font;
  const metrics = context.measureText(text);
  const textWidth = Math.ceil(metrics.width);
  const textHeight = Math.ceil(getFontSize(font) * 1.35);
  const padX = 18;
  const padY = 10;
  canvas.width = textWidth + padX * 2;
  canvas.height = textHeight + padY * 2;
  context.font = font;
  context.textBaseline = 'middle';
  context.textAlign = 'center';
  context.clearRect(0, 0, canvas.width, canvas.height);

  const pillX = padX * 0.5;
  const pillY = padY * 0.35;
  const pillW = canvas.width - padX;
  const pillH = canvas.height - padY * 0.7;
  const radius = pillH / 2;
  context.fillStyle = 'rgba(255, 255, 255, 0.92)';
  context.beginPath();
  context.moveTo(pillX + radius, pillY);
  context.lineTo(pillX + pillW - radius, pillY);
  context.quadraticCurveTo(pillX + pillW, pillY, pillX + pillW, pillY + radius);
  context.lineTo(pillX + pillW, pillY + pillH - radius);
  context.quadraticCurveTo(pillX + pillW, pillY + pillH, pillX + pillW - radius, pillY + pillH);
  context.lineTo(pillX + radius, pillY + pillH);
  context.quadraticCurveTo(pillX, pillY + pillH, pillX, pillY + pillH - radius);
  context.lineTo(pillX, pillY + radius);
  context.quadraticCurveTo(pillX, pillY, pillX + radius, pillY);
  context.closePath();
  context.fill();

  context.fillStyle = color;
  context.fillText(text, canvas.width / 2, canvas.height / 2);
  const texture = new Texture(gl, { generateMipmaps: false });
  texture.image = canvas;
  return { texture, width: canvas.width, height: canvas.height };
}

function createRoleOverlayTexture(gl, text, font = '500 14px sans-serif', color = '#ffffff') {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  const width = 800;
  const height = 220;
  canvas.width = width;
  canvas.height = height;

  const gradient = context.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
  gradient.addColorStop(0.42, 'rgba(0, 0, 0, 0.45)');
  gradient.addColorStop(1, 'rgba(0, 0, 0, 0.82)');
  context.fillStyle = gradient;
  context.fillRect(0, 0, width, height);

  context.font = font;
  context.fillStyle = color;
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillText(text, width / 2, height * 0.72);

  const texture = new Texture(gl, { generateMipmaps: false });
  texture.image = canvas;
  return { texture, width: canvas.width, height: canvas.height };
}

class Title {
  constructor({
    gl,
    plane,
    renderer,
    text,
    textColor = '#545050',
    font = '30px sans-serif',
    labelInside = false
  }) {
    autoBind(this);
    this.gl = gl;
    this.plane = plane;
    this.renderer = renderer;
    this.text = text;
    this.textColor = textColor;
    this.font = font;
    this.labelInside = labelInside;
    this.labelOffsetY = 0;
    this.textureWidth = 0;
    this.textureHeight = 0;
    this.createMesh();
  }
  createMesh() {
    const createTexture = this.labelInside ? createRoleOverlayTexture : createTextTexture;
    const { texture, width, height } = createTexture(
      this.gl,
      this.text,
      this.font,
      this.textColor
    );
    this.textureWidth = width;
    this.textureHeight = height;
    const geometry = new Plane(this.gl);
    const program = new Program(this.gl, {
      depthTest: false,
      depthWrite: false,
      vertex: `
        attribute vec3 position;
        attribute vec2 uv;
        uniform mat4 modelViewMatrix;
        uniform mat4 projectionMatrix;
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragment: `
        precision highp float;
        uniform sampler2D tMap;
        varying vec2 vUv;
        void main() {
          vec4 color = texture2D(tMap, vUv);
          if (color.a < 0.08) discard;
          gl_FragColor = color;
        }
      `,
      uniforms: { tMap: { value: texture } },
      transparent: true
    });
    this.mesh = new Mesh(this.gl, { geometry, program });
    this.updateLayout();
    if (this.labelInside) {
      this.mesh.setParent(this.plane);
    }
  }
  attachToScene(scene) {
    if (this.labelInside || !this.mesh) return;
    this.mesh.setParent(scene);
  }
  syncToPlane(plane) {
    if (this.labelInside || !this.mesh) return;

    const cos = Math.cos(plane.rotation.z);
    const sin = Math.sin(plane.rotation.z);
    this.mesh.position.x = plane.position.x - this.labelOffsetY * sin;
    this.mesh.position.y = plane.position.y + this.labelOffsetY * cos;
    this.mesh.position.z = 2.5;
    this.mesh.rotation.z = plane.rotation.z;
  }
  updateLayout() {
    if (!this.mesh) return;
    if (this.labelInside) {
      const overlayHeight = this.plane.scale.y * 0.28;
      const overlayWidth = this.plane.scale.x * 0.98;
      this.mesh.scale.set(overlayWidth, overlayHeight, 1);
      this.mesh.position.y = -this.plane.scale.y * 0.5 + overlayHeight * 0.5;
      return;
    }

    const aspect = this.textureWidth / this.textureHeight;
    const textHeight = this.plane.scale.y * 0.2;
    const textWidth = textHeight * aspect;
    this.mesh.scale.set(textWidth, textHeight, 1);
    this.labelOffsetY = -this.plane.scale.y * 0.5 - textHeight * 0.5 - 0.12;
  }
}

const ROUNDED_IMAGE_FRAGMENT = `
  precision highp float;
  uniform vec2 uImageSizes;
  uniform vec2 uPlaneSizes;
  uniform sampler2D tMap;
  uniform float uBorderRadius;
  varying vec2 vUv;
  
  float roundedBoxSDF(vec2 p, vec2 b, float r) {
    vec2 d = abs(p) - b;
    return length(max(d, vec2(0.0))) + min(max(d.x, d.y), 0.0) - r;
  }
  
  void main() {
    vec2 ratio = vec2(
      min((uPlaneSizes.x / uPlaneSizes.y) / (uImageSizes.x / uImageSizes.y), 1.0),
      min((uPlaneSizes.y / uPlaneSizes.x) / (uImageSizes.y / uImageSizes.x), 1.0)
    );
    vec2 uv = vec2(
      vUv.x * ratio.x + (1.0 - ratio.x) * 0.5,
      vUv.y * ratio.y + (1.0 - ratio.y) * 0.5
    );
    vec4 color = texture2D(tMap, uv);
    
    float d = roundedBoxSDF(vUv - 0.5, vec2(0.5 - uBorderRadius), uBorderRadius);
    float edgeSmooth = 0.002;
    float alpha = 1.0 - smoothstep(-edgeSmooth, edgeSmooth, d);
    
    gl_FragColor = vec4(color.rgb, alpha);
  }
`;

class Media {
  constructor({
    geometry,
    gl,
    image,
    overlayImage,
    index,
    length,
    renderer,
    scene,
    screen,
    text,
    viewport,
    bend,
    textColor,
    borderRadius = 0,
    font,
    labelInside = false,
    staticGallery = false,
    loopItems = true
  }) {
    this.extra = 0;
    this.geometry = geometry;
    this.gl = gl;
    this.image = image;
    this.overlayImage = overlayImage;
    this.index = index;
    this.length = length;
    this.renderer = renderer;
    this.scene = scene;
    this.screen = screen;
    this.text = text;
    this.viewport = viewport;
    this.bend = bend;
    this.textColor = textColor;
    this.borderRadius = borderRadius;
    this.font = font;
    this.labelInside = labelInside;
    this.staticGallery = staticGallery;
    this.loopItems = loopItems;
    this.createShader();
    this.createMesh();
    this.createTitle();
    this.onResize();
  }
  createShader() {
    const texture = new Texture(this.gl, {
      generateMipmaps: true
    });
    this.program = new Program(this.gl, {
      depthTest: false,
      depthWrite: false,
      vertex: `
        precision highp float;
        attribute vec3 position;
        attribute vec2 uv;
        uniform mat4 modelViewMatrix;
        uniform mat4 projectionMatrix;
        uniform float uTime;
        uniform float uSpeed;
        varying vec2 vUv;
        void main() {
          vUv = uv;
          vec3 p = position;
          p.z = (sin(p.x * 4.0 + uTime) * 1.5 + cos(p.y * 2.0 + uTime) * 1.5) * (0.1 + uSpeed * 0.5);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
        }
      `,
      fragment: ROUNDED_IMAGE_FRAGMENT,
      uniforms: {
        tMap: { value: texture },
        uPlaneSizes: { value: [0, 0] },
        uImageSizes: { value: [0, 0] },
        uSpeed: { value: 0 },
        uTime: { value: 100 * Math.random() },
        uBorderRadius: { value: this.borderRadius }
      },
      transparent: true
    });
    const applyTexture = image => {
      texture.image = image;
      this.program.uniforms.uImageSizes.value = [
        image.naturalWidth || image.width,
        image.naturalHeight || image.height
      ];
    };

    const loadCardImage = this.overlayImage
      ? createLayeredCardImage(this.image, this.overlayImage)
      : loadImage(this.image);

    loadCardImage.then(applyTexture).catch(() => {
      loadImage(this.image).then(applyTexture).catch(() => {});
    });
  }
  createMesh() {
    this.plane = new Mesh(this.gl, {
      geometry: this.geometry,
      program: this.program
    });
    this.plane.setParent(this.scene);
  }
  createTitle() {
    if (!this.text) return;

    this.title = new Title({
      gl: this.gl,
      plane: this.plane,
      renderer: this.renderer,
      text: this.text,
      textColor: this.textColor,
      font: this.font,
      labelInside: this.labelInside
    });
  }
  update(scroll, direction) {
    this.plane.position.x = this.x - scroll.current - this.extra;

    const x = this.plane.position.x;
    const H = this.viewport.width / 2;

    if (this.bend === 0) {
      this.plane.position.y = 0;
      this.plane.rotation.z = 0;
    } else {
      const B_abs = Math.abs(this.bend);
      const R = (H * H + B_abs * B_abs) / (2 * B_abs);
      const effectiveX = Math.min(Math.abs(x), H);

      const arc = R - Math.sqrt(R * R - effectiveX * effectiveX);
      if (this.bend > 0) {
        this.plane.position.y = -arc;
        this.plane.rotation.z = -Math.sign(x) * Math.asin(effectiveX / R);
      } else {
        this.plane.position.y = arc;
        this.plane.rotation.z = Math.sign(x) * Math.asin(effectiveX / R);
      }
    }

    this.speed = scroll.current - scroll.last;
    if (!this.staticGallery) {
      this.program.uniforms.uTime.value += 0.04;
      this.program.uniforms.uSpeed.value = this.speed;
    }

    if (this.staticGallery || !this.loopItems) return;

    const planeOffset = this.plane.scale.x / 2;
    const viewportOffset = this.viewport.width / 2;
    this.isBefore = this.plane.position.x + planeOffset < -viewportOffset;
    this.isAfter = this.plane.position.x - planeOffset > viewportOffset;
    if (direction === 'right' && this.isBefore) {
      this.extra -= this.widthTotal;
      this.isBefore = this.isAfter = false;
    }
    if (direction === 'left' && this.isAfter) {
      this.extra += this.widthTotal;
      this.isBefore = this.isAfter = false;
    }

    if (this.title) {
      this.title.syncToPlane(this.plane);
    }
  }
  onResize({ screen, viewport } = {}) {
    if (screen) this.screen = screen;
    if (viewport) {
      this.viewport = viewport;
      if (this.plane.program.uniforms.uViewportSizes) {
        this.plane.program.uniforms.uViewportSizes.value = [
          this.viewport.width,
          this.viewport.height
        ];
      }
    }
    this.scale = this.screen.height / 1500;
    const labelReserve = this.text && !this.labelInside ? 0.24 : 0;
    const cardHeight = 900 * (1 - labelReserve);
    this.plane.scale.y = (this.viewport.height * cardHeight * this.scale) / this.screen.height;
    this.plane.scale.x = (this.viewport.width * (700 * this.scale)) / this.screen.width;
    this.plane.program.uniforms.uPlaneSizes.value = [this.plane.scale.x, this.plane.scale.y];
    this.padding = 2;
    this.width = this.plane.scale.x + this.padding;
    this.widthTotal = this.width * this.length;
    this.x = this.width * this.index;
    if (this.title) {
      this.title.updateLayout();
      this.title.syncToPlane(this.plane);
    }
  }
}

class App {
  constructor(
    container,
    {
      items,
      bend,
      textColor = '#ffffff',
      borderRadius = 0,
      font = 'bold 30px Figtree',
      scrollSpeed = 2,
      scrollEase = 0.05,
      enableWheel = true,
      interactive = true,
      scrollLinked = false,
      labelInside = false,
      duplicateItems = true
    } = {}
  ) {
    document.documentElement.classList.remove('no-js');
    this.container = container;
    this.scrollSpeed = scrollSpeed;
    this.enableWheel = enableWheel;
    this.interactive = interactive;
    this.scrollLinked = scrollLinked;
    this.labelInside = labelInside;
    this.duplicateItems = duplicateItems;
    this.itemCount = 0;
    this.hasLabelsBelow =
      !labelInside && (items || []).some(item => item && item.text);
    this.scrollBase = 0;
    this.scrollTravel = 0;
    this.scroll = { ease: scrollEase, current: 0, target: 0, last: 0 };
    this.onCheckDebounce = debounce(this.onCheck, 200);
    this.createRenderer();
    this.createCamera();
    this.createScene();
    this.onResize();
    this.createGeometry();
    this.createMedias(items, bend, textColor, borderRadius, font);
    if (this.scrollLinked) {
      this.updateScrollMetrics(0);
    } else if (!this.interactive) {
      this.centerScroll();
    }
    this.update();
    this.addEventListeners();
  }
  updateScrollMetrics(progress = null) {
    if (!this.medias || !this.medias[0] || !this.itemCount) return;
    const width = this.medias[0].width;
    const currentProgress =
      progress ??
      (this.scrollTravel > 0
        ? (this.scroll.target - this.scrollBase) / this.scrollTravel
        : 0);
    this.scrollBase = (width * this.itemCount) / 2;
    this.scrollTravel = width * this.itemCount * 0.9;
    this.setScrollProgress(currentProgress);
  }
  setScrollProgress(progress) {
    if (!this.scrollLinked || !this.medias?.[0]) return;
    const clamped = Math.min(1, Math.max(0, progress));
    this.scroll.target = this.scrollBase + clamped * this.scrollTravel;
  }
  createRenderer() {
    this.renderer = new Renderer({
      alpha: true,
      antialias: true,
      dpr: Math.min(window.devicePixelRatio || 1, 2)
    });
    this.gl = this.renderer.gl;
    this.gl.clearColor(0, 0, 0, 0);
    this.container.appendChild(this.gl.canvas);
  }
  createCamera() {
    this.camera = new Camera(this.gl);
    this.camera.fov = 45;
    this.camera.position.z = 20;
  }
  createScene() {
    this.scene = new Transform();
  }
  createGeometry() {
    this.planeGeometry = new Plane(this.gl, {
      heightSegments: 50,
      widthSegments: 100
    });
  }
  createMedias(items, bend = 1, textColor, borderRadius, font) {
    const galleryItems = items && items.length ? items : [];
    this.itemCount = galleryItems.length;
    this.mediasImages = this.duplicateItems
      ? galleryItems.concat(galleryItems)
      : galleryItems;
    this.medias = this.mediasImages.map((data, index) => {
      return new Media({
        geometry: this.planeGeometry,
        gl: this.gl,
        image: data.image,
        overlayImage: data.overlay,
        index,
        length: this.mediasImages.length,
        renderer: this.renderer,
        scene: this.scene,
        screen: this.screen,
        text: data.text,
        viewport: this.viewport,
        bend,
        textColor,
        borderRadius,
        font,
        labelInside: this.labelInside,
        staticGallery: !this.interactive && !this.scrollLinked,
        loopItems: this.duplicateItems
      });
    });
    this.medias.forEach(media => {
      if (media.title) {
        media.title.attachToScene(this.scene);
      }
    });
  }
  onTouchDown(e) {
    this.isDown = true;
    this.scroll.position = this.scroll.current;
    this.start = e.touches ? e.touches[0].clientX : e.clientX;
  }
  onTouchMove(e) {
    if (!this.isDown) return;
    const x = e.touches ? e.touches[0].clientX : e.clientX;
    const distance = (this.start - x) * (this.scrollSpeed * 0.025);
    this.scroll.target = this.scroll.position + distance;
  }
  onTouchUp() {
    this.isDown = false;
    this.onCheck();
  }
  onWheel(e) {
    e.preventDefault();
    e.stopPropagation();
    const delta = e.deltaY || e.wheelDelta || e.detail;
    this.scroll.target += (delta > 0 ? this.scrollSpeed : -this.scrollSpeed) * 0.2;
    this.onCheckDebounce();
  }
  onCheck() {
    if (!this.medias || !this.medias[0]) return;
    const width = this.medias[0].width;
    const itemIndex = Math.round(Math.abs(this.scroll.target) / width);
    const item = width * itemIndex;
    this.scroll.target = this.scroll.target < 0 ? -item : item;
  }
  onResize() {
    this.screen = {
      width: this.container.clientWidth,
      height: this.container.clientHeight
    };
    this.renderer.setSize(this.screen.width, this.screen.height);
    this.camera.perspective({
      aspect: this.screen.width / this.screen.height
    });
    const fov = (this.camera.fov * Math.PI) / 180;
    const height = 2 * Math.tan(fov / 2) * this.camera.position.z;
    const width = height * this.camera.aspect;
    this.viewport = { width, height };
    this.scene.position.y = this.hasLabelsBelow ? height * 0.1 : 0;
    if (this.medias) {
      this.medias.forEach(media => media.onResize({ screen: this.screen, viewport: this.viewport }));
    }
    if (this.scrollLinked) {
      this.updateScrollMetrics();
    } else if (!this.interactive) {
      this.centerScroll();
    }
  }
  centerScroll() {
    if (!this.medias || !this.medias[0] || !this.itemCount) return;
    const offset = (this.medias[0].width * this.itemCount) / 2;
    this.scroll.current = offset;
    this.scroll.target = offset;
    this.scroll.last = offset;
  }
  update() {
    if (!this.interactive && !this.scrollLinked) {
      this.scroll.current = this.scroll.target;
    } else {
      this.scroll.current = lerp(this.scroll.current, this.scroll.target, this.scroll.ease);
    }
    const direction = this.scroll.current > this.scroll.last ? 'right' : 'left';
    if (this.medias) {
      this.medias.forEach(media => media.update(this.scroll, direction));
    }
    this.renderer.render({ scene: this.scene, camera: this.camera });
    this.scroll.last = this.scroll.current;
    this.raf = window.requestAnimationFrame(this.update.bind(this));
  }
  addEventListeners() {
    this.boundOnResize = this.onResize.bind(this);
    this.boundOnWheel = this.onWheel.bind(this);
    this.boundOnTouchDown = this.onTouchDown.bind(this);
    this.boundOnTouchMove = this.onTouchMove.bind(this);
    this.boundOnTouchUp = this.onTouchUp.bind(this);
    window.addEventListener('resize', this.boundOnResize);
    if (!this.interactive || this.scrollLinked) return;
    if (this.enableWheel) {
      this.container.addEventListener('wheel', this.boundOnWheel, { passive: false });
    }
    this.container.addEventListener('mousedown', this.boundOnTouchDown);
    this.container.addEventListener('mousemove', this.boundOnTouchMove);
    this.container.addEventListener('mouseup', this.boundOnTouchUp);
    this.container.addEventListener('mouseleave', this.boundOnTouchUp);
    this.container.addEventListener('touchstart', this.boundOnTouchDown, { passive: true });
    this.container.addEventListener('touchmove', this.boundOnTouchMove, { passive: true });
    this.container.addEventListener('touchend', this.boundOnTouchUp);
  }
  destroy() {
    window.cancelAnimationFrame(this.raf);
    window.removeEventListener('resize', this.boundOnResize);
    if (this.enableWheel) {
      this.container.removeEventListener('wheel', this.boundOnWheel);
    }
    this.container.removeEventListener('mousedown', this.boundOnTouchDown);
    this.container.removeEventListener('mousemove', this.boundOnTouchMove);
    this.container.removeEventListener('mouseup', this.boundOnTouchUp);
    this.container.removeEventListener('mouseleave', this.boundOnTouchUp);
    this.container.removeEventListener('touchstart', this.boundOnTouchDown);
    this.container.removeEventListener('touchmove', this.boundOnTouchMove);
    this.container.removeEventListener('touchend', this.boundOnTouchUp);
    if (this.renderer && this.renderer.gl && this.renderer.gl.canvas.parentNode) {
      this.renderer.gl.canvas.parentNode.removeChild(this.renderer.gl.canvas);
    }
  }
}

export default forwardRef(function CircularGallery(
  {
    items,
    bend = 3,
    textColor = '#ffffff',
    borderRadius = 0.05,
    font = 'bold 30px Figtree',
    fontUrl,
    scrollSpeed = 2,
    scrollEase = 0.05,
    enableWheel = true,
    interactive = true,
    scrollLinked = false,
    labelInside = false,
    duplicateItems = true,
    className = ''
  },
  ref
) {
  const containerRef = useRef(null);
  const appRef = useRef(null);

  useImperativeHandle(ref, () => ({
    setScrollProgress(progress) {
      appRef.current?.setScrollProgress(progress);
    }
  }));

  useEffect(() => {
    if (!containerRef.current) return;
    let app;
    let isMounted = true;
    resolveFont(font, fontUrl).then(resolvedFont => {
      if (!isMounted || !containerRef.current) return;
      app = new App(containerRef.current, {
        items,
        bend,
        textColor,
        borderRadius,
        font: resolvedFont,
        scrollSpeed,
        scrollEase,
        enableWheel,
        interactive,
        scrollLinked,
        labelInside,
        duplicateItems
      });
      appRef.current = app;
    });
    return () => {
      isMounted = false;
      appRef.current = null;
      if (app) app.destroy();
    };
  }, [
    items,
    bend,
    textColor,
    borderRadius,
    font,
    fontUrl,
    scrollSpeed,
    scrollEase,
    enableWheel,
    interactive,
    scrollLinked,
    labelInside,
    duplicateItems
  ]);
  const staticClass = interactive ? '' : ' circular-gallery--static';
  return (
    <div className={`circular-gallery${staticClass} ${className}`.trim()} ref={containerRef} />
  );
});
