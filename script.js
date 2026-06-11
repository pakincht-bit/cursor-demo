import { initAurora } from "./aurora.js";

(function initNavScroll() {
  const nav = document.getElementById("siteNav");
  if (!nav) return;

  const inner = nav.querySelector(".nav__inner");
  const SCROLL_THRESHOLD = 48;
  const TRANSITION_MS = 380;
  let ticking = false;
  let isScrolled = null;
  let transitionTimer;

  function setTransitioning(active) {
    if (!inner) return;
    if (active) {
      inner.classList.add("is-transitioning");
      clearTimeout(transitionTimer);
      transitionTimer = setTimeout(() => {
        inner.classList.remove("is-transitioning");
      }, TRANSITION_MS);
    } else {
      clearTimeout(transitionTimer);
      inner.classList.remove("is-transitioning");
    }
  }

  function updateNav(skipTransition = false) {
    ticking = false;
    const nextScrolled = window.scrollY > SCROLL_THRESHOLD;
    if (nextScrolled === isScrolled) return;

    isScrolled = nextScrolled;
    nav.classList.toggle("is-scrolled", nextScrolled);
    document.documentElement.classList.toggle("nav-is-bottom", nextScrolled);
    if (!skipTransition) setTransitioning(true);
  }

  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(updateNav);
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  updateNav(true);
})();

const faqTriggers = document.querySelectorAll(".faq__trigger");

function closeFaqItem(trigger) {
  const panelId = trigger.getAttribute("aria-controls");
  const panel = panelId ? document.getElementById(panelId) : null;
  trigger.setAttribute("aria-expanded", "false");
  if (panel) panel.hidden = true;
}

function openFaqItem(trigger) {
  const panelId = trigger.getAttribute("aria-controls");
  const panel = panelId ? document.getElementById(panelId) : null;
  trigger.setAttribute("aria-expanded", "true");
  if (panel) panel.hidden = false;
}

faqTriggers.forEach((trigger) => {
  trigger.addEventListener("click", () => {
    const isOpen = trigger.getAttribute("aria-expanded") === "true";

    faqTriggers.forEach((other) => {
      if (other !== trigger) closeFaqItem(other);
    });

    if (isOpen) {
      closeFaqItem(trigger);
    } else {
      openFaqItem(trigger);
    }
  });
});

const testimonialCards = document.querySelectorAll(".testimonial-card");

function setActiveTestimonial(card) {
  testimonialCards.forEach((item) => {
    const isActive = item === card;
    item.classList.toggle("is-active", isActive);
    item.setAttribute("aria-pressed", isActive ? "true" : "false");
    const content = item.querySelector(".testimonial-card__content");
    if (content) {
      content.setAttribute("aria-hidden", isActive ? "false" : "true");
    }
  });
}

testimonialCards.forEach((card) => {
  const content = card.querySelector(".testimonial-card__content");
  if (content) {
    content.setAttribute("aria-hidden", card.classList.contains("is-active") ? "false" : "true");
  }

  card.addEventListener("click", () => {
    if (card.classList.contains("is-active")) return;
    setActiveTestimonial(card);
  });

  card.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    if (!card.classList.contains("is-active")) {
      setActiveTestimonial(card);
    }
  });
});

(function initHeroIntro() {
  const hero = document.querySelector(".hero--wayflyer");
  if (!hero) return;

  const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

  function readTimeVar(name, fallback) {
    const raw = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    if (!raw) return fallback;
    if (raw.endsWith("ms")) return parseFloat(raw);
    if (raw.endsWith("s")) return parseFloat(raw) * 1000;
    return parseFloat(raw) || fallback;
  }

  function finishIntro() {
    hero.classList.remove("is-intro", "is-intro-active");
    hero.classList.add("is-intro-done");
  }

  if (motionQuery.matches) {
    finishIntro();
    return;
  }

  const startDelayMs = readTimeVar("--hero-intro-start-delay", 120);

  window.setTimeout(() => {
    requestAnimationFrame(() => {
      hero.classList.add("is-intro-active");
    });
  }, startDelayMs);

  const videoDelayMs = readTimeVar("--hero-intro-video-delay", 1200);
  const visualDurationMs = readTimeVar("--hero-intro-duration-visual", 1200);
  const totalMs = startDelayMs + videoDelayMs + visualDurationMs + 80;

  window.setTimeout(finishIntro, totalMs);
})();

(function initHeroAurora() {
  const canvasHost = document.querySelector(".hero__aurora-canvas");
  if (!canvasHost) return;

  const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

  function readTimeVar(name, fallback) {
    const raw = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    if (!raw) return fallback;
    if (raw.endsWith("ms")) return parseFloat(raw);
    if (raw.endsWith("s")) return parseFloat(raw) * 1000;
    return parseFloat(raw) || fallback;
  }

  function getAuroraDelayMs() {
    if (motionQuery.matches) return 0;
    return (
      readTimeVar("--hero-intro-start-delay", 120) +
      readTimeVar("--hero-intro-aurora-delay", 1200)
    );
  }

  function boot() {
    if (!canvasHost.offsetWidth || !canvasHost.offsetHeight) {
      requestAnimationFrame(boot);
      return;
    }
    initAurora(canvasHost, {
      colorStops: ["#84B5FF", "#0569FF", "#AE8EFF", "#FFCCA5"],
      amplitude: 1.15,
      blend: 0.62,
      speed: 1.0,
    });
  }

  window.setTimeout(boot, getAuroraDelayMs());
})();

(function initHeroParallax() {
  const hero = document.querySelector(".hero--wayflyer");
  const media = document.querySelector(".hero--wayflyer .hero__media");
  if (!hero || !media) return;

  const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

  let isInView = false;
  let ticking = false;
  let enabled = !motionQuery.matches;

  function getMaxOffset() {
    const value = getComputedStyle(document.documentElement)
      .getPropertyValue("--hero-parallax-max")
      .trim();
    const parsed = parseFloat(value);
    return Number.isFinite(parsed) ? parsed : 40;
  }

  function clearParallax() {
    media.style.transform = "";
    media.classList.remove("is-parallax-active");
  }

  function updateParallax() {
    ticking = false;
    if (!enabled || !isInView) {
      clearParallax();
      return;
    }

    const maxOffset = getMaxOffset();
    const rect = hero.getBoundingClientRect();
    const scrollRange = Math.max(hero.offsetHeight, rect.height);
    const scrolled = Math.max(0, -rect.top);
    const progress = Math.min(scrolled / scrollRange, 1);
    const offset = progress * maxOffset;

    media.style.transform = offset > 0 ? `translate3d(0, ${-offset}px, 0)` : "";
    media.classList.toggle("is-parallax-active", offset > 0);
  }

  function onScroll() {
    if (!enabled || !isInView || ticking) return;
    ticking = true;
    requestAnimationFrame(updateParallax);
  }

  function disableParallax() {
    enabled = false;
    clearParallax();
    window.removeEventListener("scroll", onScroll);
    observer.disconnect();
  }

  const observer = new IntersectionObserver(
    ([entry]) => {
      isInView = entry.isIntersecting;
      if (!isInView) {
        clearParallax();
        return;
      }
      requestAnimationFrame(updateParallax);
    },
    { rootMargin: "80px 0px", threshold: 0 }
  );

  if (enabled) {
    observer.observe(hero);
    window.addEventListener("scroll", onScroll, { passive: true });
    requestAnimationFrame(updateParallax);
  }

  motionQuery.addEventListener("change", (event) => {
    if (event.matches) disableParallax();
  });
})();

(function initHeroVideoModal() {
  const YOUTUBE_EMBED_BASE = "https://www.youtube.com/embed/yePp4-EhOlk";
  const playBtn = document.getElementById("heroPlayBtn");
  const modal = document.getElementById("videoModal");
  const closeBtn = document.getElementById("videoModalClose");
  const iframe = document.getElementById("videoModalIframe");
  const backdrop = modal?.querySelector(".video-modal__backdrop");
  const dialog = modal?.querySelector(".video-modal__dialog");

  if (!playBtn || !modal || !closeBtn || !iframe || !backdrop || !dialog) return;

  let previousFocus = null;

  function getFocusableElements() {
    return [...dialog.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )].filter((el) => !el.hasAttribute("disabled") && el.offsetParent !== null);
  }

  function trapFocus(event) {
    if (event.key !== "Tab" || modal.hidden) return;

    const focusable = getFocusableElements();
    if (!focusable.length) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  function openModal() {
    previousFocus = document.activeElement;
    iframe.src = `${YOUTUBE_EMBED_BASE}?autoplay=1&rel=0`;
    modal.hidden = false;
    document.body.classList.add("is-modal-open");
    closeBtn.focus();
    document.addEventListener("keydown", onKeydown);
    document.addEventListener("keydown", trapFocus);
  }

  function closeModal() {
    iframe.src = "";
    modal.hidden = true;
    document.body.classList.remove("is-modal-open");
    document.removeEventListener("keydown", onKeydown);
    document.removeEventListener("keydown", trapFocus);

    if (previousFocus && typeof previousFocus.focus === "function") {
      previousFocus.focus();
    }
    previousFocus = null;
  }

  function onKeydown(event) {
    if (event.key === "Escape") {
      event.preventDefault();
      closeModal();
    }
  }

  playBtn.addEventListener("click", openModal);
  closeBtn.addEventListener("click", closeModal);
  backdrop.addEventListener("click", closeModal);
})();

(function initSectionReveal() {
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const targets = document.querySelectorAll(
    "main > section:not(.hero) > .container, .footer-cta > .container"
  );

  if (!targets.length) return;

  if (reducedMotion.matches) {
    targets.forEach((target) => target.classList.add("is-visible"));
    return;
  }

  targets.forEach((target) => target.classList.add("section-reveal"));

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.1, rootMargin: "0px 0px -48px 0px" }
  );

  targets.forEach((target) => observer.observe(target));
})();

(function initFeaturesScroll() {
  const section = document.querySelector(".features-included");
  if (!section) return;

  const steps = [...section.querySelectorAll(".features-included__step")];
  const stackImages = [...section.querySelectorAll(".features-included__media-stack .features-included__image")];
  if (!steps.length || !stackImages.length) return;

  const desktopQuery = window.matchMedia("(min-width: 900px)");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let activeIndex = 0;
  let observer = null;
  const intersectionState = new Map();

  function getStepAlt(index) {
    const stepImage = steps[index]?.querySelector(".features-included__step-visual img");
    return stepImage?.getAttribute("alt") || "";
  }

  function setActive(index) {
    if (index === activeIndex || index < 0 || index >= steps.length) return;

    activeIndex = index;

    steps.forEach((step, i) => {
      const isActive = i === index;
      step.classList.toggle("is-active", isActive);
      step.setAttribute("aria-current", isActive ? "step" : "false");
    });

    stackImages.forEach((image, i) => {
      const isActive = i === index;
      image.classList.toggle("is-active", isActive);
      if (isActive) {
        image.setAttribute("alt", getStepAlt(i));
      } else {
        image.setAttribute("alt", "");
      }
    });
  }

  function updateActiveFromIntersection() {
    let bestIndex = activeIndex;
    let bestRatio = 0;

    intersectionState.forEach((ratio, index) => {
      if (ratio > bestRatio) {
        bestRatio = ratio;
        bestIndex = index;
      }
    });

    if (bestRatio > 0) {
      setActive(bestIndex);
    }
  }

  function enableScrollSync() {
    section.classList.add("features-included--scroll-sync");
    steps.forEach((step, index) => {
      step.classList.toggle("is-active", index === 0);
      step.setAttribute("aria-current", index === 0 ? "step" : "false");
      intersectionState.set(index, index === 0 ? 1 : 0);
    });
    stackImages.forEach((image, index) => {
      image.classList.toggle("is-active", index === 0);
      image.setAttribute("alt", index === 0 ? getStepAlt(0) : "");
    });
    activeIndex = 0;

    observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const index = Number(entry.target.dataset.featureIndex);
          intersectionState.set(index, entry.isIntersecting ? entry.intersectionRatio : 0);
        });
        updateActiveFromIntersection();
      },
      {
        root: null,
        rootMargin: "-40% 0px -40% 0px",
        threshold: [0, 0.25, 0.5, 0.75, 1]
      }
    );

    steps.forEach((step) => observer.observe(step));
  }

  function disableScrollSync() {
    section.classList.remove("features-included--scroll-sync");
    if (observer) {
      observer.disconnect();
      observer = null;
    }
    intersectionState.clear();
    steps.forEach((step) => {
      step.classList.add("is-active");
      step.removeAttribute("aria-current");
    });
    stackImages.forEach((image, index) => {
      image.classList.toggle("is-active", index === 0);
      image.setAttribute("alt", index === 0 ? getStepAlt(0) : "");
    });
    activeIndex = 0;
  }

  function syncMode() {
    if (desktopQuery.matches && !reducedMotion.matches) {
      enableScrollSync();
    } else {
      disableScrollSync();
    }
  }

  syncMode();
  desktopQuery.addEventListener("change", syncMode);
  reducedMotion.addEventListener("change", syncMode);
})();
