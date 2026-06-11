import { useLayoutEffect, useRef, useCallback } from 'react';
import Lenis from 'lenis';
import './ScrollStack.css';

const MOBILE_BREAKPOINT = 768;

function isMobileViewport() {
  return window.innerWidth <= MOBILE_BREAKPOINT;
}

function isMobileFlowCard(card) {
  return isMobileViewport() && card.classList.contains('story-scene--payment-bento');
}

export const ScrollStackItem = ({ children, itemClassName = '' }) => (
  <div className={`scroll-stack-card ${itemClassName}`.trim()}>{children}</div>
);

function getDocumentOffsetTop(element) {
  let top = 0;
  let el = element;

  while (el) {
    top += el.offsetTop;
    el = el.offsetParent;
  }

  return top;
}

const ScrollStack = ({
  children,
  className = '',
  itemDistance = 100,
  itemScale = 0.03,
  itemStackDistance = 30,
  stackPosition = '20%',
  scaleEndPosition = '10%',
  baseScale = 0.85,
  scaleDuration = 0.5,
  rotationAmount = 0,
  blurAmount = 0,
  useWindowScroll = false,
  onStackComplete
}) => {
  const scrollerRef = useRef(null);
  const stackCompletedRef = useRef(false);
  const animationFrameRef = useRef(null);
  const lenisRef = useRef(null);
  const cardsRef = useRef([]);
  const cardMetricsRef = useRef([]);
  const endTopRef = useRef(0);
  const lastTransformsRef = useRef(new Map());

  const calculateProgress = useCallback((scrollTop, start, end) => {
    if (scrollTop < start) return 0;
    if (scrollTop > end) return 1;
    return (scrollTop - start) / (end - start);
  }, []);

  const parsePercentage = useCallback((value, containerHeight) => {
    if (typeof value === 'string' && value.includes('%')) {
      return (parseFloat(value) / 100) * containerHeight;
    }
    return parseFloat(value);
  }, []);

  const measureLayout = useCallback(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;

    const cards = Array.from(scroller.querySelectorAll('.scroll-stack-card'));
    cardsRef.current = cards;

    cardMetricsRef.current = cards.map(card => ({
      top: getDocumentOffsetTop(card)
    }));

    const endElement = scroller.querySelector('.scroll-stack-end');
    endTopRef.current = endElement ? getDocumentOffsetTop(endElement) : 0;
  }, []);

  const updateCardTransforms = useCallback(
    scrollTopOverride => {
      const cards = cardsRef.current;
      if (!cards.length) return;

      const scrollTop =
        scrollTopOverride ??
        (useWindowScroll ? window.scrollY : scrollerRef.current?.scrollTop ?? 0);
      const containerHeight = useWindowScroll
        ? window.innerHeight
        : scrollerRef.current?.clientHeight ?? window.innerHeight;

      const stackPositionPx = parsePercentage(stackPosition, containerHeight);
      const scaleEndPositionPx = parsePercentage(scaleEndPosition, containerHeight);
      const endElementTop = endTopRef.current;
      const pinEnd = endElementTop - containerHeight / 2;

      let topCardIndex = 0;
      for (let j = 0; j < cards.length; j++) {
        const cardTop = cardMetricsRef.current[j]?.top ?? 0;
        const jTriggerStart = cardTop - stackPositionPx - itemStackDistance * j;
        if (scrollTop >= jTriggerStart) {
          topCardIndex = j;
        }
      }

      cards.forEach((card, i) => {
        if (!card) return;

        if (isMobileFlowCard(card)) {
          card.style.transform = 'none';
          card.style.filter = 'none';
          card.style.visibility = 'visible';
          card.style.opacity = '1';
          card.style.pointerEvents = 'auto';
          card.style.zIndex = String(10 + i);
          lastTransformsRef.current.set(i, { transform: 'none', filter: 'none' });
          return;
        }

        const cardTop = cardMetricsRef.current[i]?.top ?? 0;
        const triggerStart = cardTop - stackPositionPx - itemStackDistance * i;
        const triggerEnd = cardTop - scaleEndPositionPx;
        const pinStart = cardTop - stackPositionPx - itemStackDistance * i;

        const scaleProgress = calculateProgress(scrollTop, triggerStart, triggerEnd);
        const targetScale = baseScale + i * itemScale;
        const scale = 1 - scaleProgress * (1 - targetScale);
        const rotation = rotationAmount ? i * rotationAmount * scaleProgress : 0;

        let blur = 0;
        if (blurAmount && i < topCardIndex) {
          blur = Math.max(0, (topCardIndex - i) * blurAmount);
        }

        let translateY = 0;
        const isPinned = scrollTop >= pinStart && scrollTop <= pinEnd;

        if (isPinned) {
          translateY = scrollTop - cardTop + stackPositionPx + itemStackDistance * i;
        } else if (scrollTop > pinEnd) {
          translateY = pinEnd - cardTop + stackPositionPx + itemStackDistance * i;
        }

        const transform = `translate3d(0, ${translateY.toFixed(2)}px, 0) scale(${scale.toFixed(4)}) rotate(${rotation.toFixed(2)}deg)`;
        const filter = blur > 0 ? `blur(${blur.toFixed(2)}px)` : 'none';
        const isBuried = i < topCardIndex;

        card.style.zIndex = String(10 + i);
        card.style.visibility = isBuried ? 'hidden' : 'visible';
        card.style.opacity = isBuried ? '0' : '1';
        card.style.pointerEvents = isBuried ? 'none' : 'auto';

        const lastTransform = lastTransformsRef.current.get(i);
        if (
          !lastTransform ||
          lastTransform.transform !== transform ||
          lastTransform.filter !== filter
        ) {
          card.style.transform = transform;
          card.style.filter = filter;
          lastTransformsRef.current.set(i, { transform, filter });
        }

        if (i === cards.length - 1) {
          const isInView = scrollTop >= pinStart && scrollTop <= pinEnd;
          if (isInView && !stackCompletedRef.current) {
            stackCompletedRef.current = true;
            onStackComplete?.();
          } else if (!isInView && stackCompletedRef.current) {
            stackCompletedRef.current = false;
          }
        }
      });
    },
    [
      itemScale,
      itemStackDistance,
      stackPosition,
      scaleEndPosition,
      baseScale,
      rotationAmount,
      blurAmount,
      useWindowScroll,
      onStackComplete,
      calculateProgress,
      parsePercentage
    ]
  );

  const setupLenis = useCallback(() => {
    if (useWindowScroll) {
      document.documentElement.classList.add('lenis', 'lenis-smooth');

      const lenis = new Lenis({
        duration: 1.2,
        easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        smoothWheel: true,
        touchMultiplier: 2,
        infinite: false,
        wheelMultiplier: 1,
        lerp: 0.1,
        syncTouch: true,
        syncTouchLerp: 0.075
      });

      const raf = time => {
        lenis.raf(time);
        updateCardTransforms(lenis.scroll);
        animationFrameRef.current = requestAnimationFrame(raf);
      };
      animationFrameRef.current = requestAnimationFrame(raf);

      lenisRef.current = lenis;
      return lenis;
    }

    const scroller = scrollerRef.current;
    if (!scroller) return;

    const lenis = new Lenis({
      wrapper: scroller,
      content: scroller.querySelector('.scroll-stack-inner'),
      duration: 1.2,
      easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      touchMultiplier: 2,
      infinite: false,
      gestureOrientationHandler: true,
      normalizeWheel: true,
      wheelMultiplier: 1,
      touchInertiaMultiplier: 35,
      lerp: 0.1,
      syncTouch: true,
      syncTouchLerp: 0.075,
      touchInertia: 0.6
    });

    const raf = time => {
      lenis.raf(time);
      updateCardTransforms(lenis.scroll);
      animationFrameRef.current = requestAnimationFrame(raf);
    };
    animationFrameRef.current = requestAnimationFrame(raf);

    lenisRef.current = lenis;
    return lenis;
  }, [updateCardTransforms, useWindowScroll]);

  useLayoutEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;

    const cards = Array.from(scroller.querySelectorAll('.scroll-stack-card'));
    cardsRef.current = cards;

    cards.forEach((card, i) => {
      if (i < cards.length - 1) {
        card.style.marginBottom = `${itemDistance}px`;
      }
      card.style.willChange = 'transform';
      card.style.transformOrigin = 'center top';
      card.style.backfaceVisibility = 'hidden';
      card.style.transform = 'translate3d(0, 0, 0)';
    });

    measureLayout();
    setupLenis();
    updateCardTransforms(useWindowScroll ? window.scrollY : scroller.scrollTop);

    const handleResize = () => {
      measureLayout();
      updateCardTransforms(
        useWindowScroll ? lenisRef.current?.scroll ?? window.scrollY : scroller.scrollTop
      );
    };

    window.addEventListener('resize', handleResize, { passive: true });

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (lenisRef.current) {
        lenisRef.current.destroy();
      }
      if (useWindowScroll) {
        document.documentElement.classList.remove('lenis', 'lenis-smooth');
      }
      stackCompletedRef.current = false;
      cardsRef.current = [];
      cardMetricsRef.current = [];
      lastTransformsRef.current.clear();
    };
  }, [
    itemDistance,
    itemScale,
    itemStackDistance,
    stackPosition,
    scaleEndPosition,
    baseScale,
    scaleDuration,
    rotationAmount,
    blurAmount,
    useWindowScroll,
    onStackComplete,
    setupLenis,
    updateCardTransforms,
    measureLayout
  ]);

  const scrollerClassName = [
    'scroll-stack-scroller',
    useWindowScroll ? 'scroll-stack-scroller--window' : '',
    className
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={scrollerClassName} ref={scrollerRef}>
      <div className="scroll-stack-inner">
        {children}
        <div className="scroll-stack-end" aria-hidden="true" />
      </div>
    </div>
  );
};

export default ScrollStack;
