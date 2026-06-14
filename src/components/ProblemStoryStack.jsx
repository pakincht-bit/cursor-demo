import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import CircularGallery from './CircularGallery';
import { FREELANCER_GALLERY_ITEMS } from './freelancerGalleryItems';
import MagicBento from './MagicBento';
import RotatingText from './RotatingText';
import ScrollStack, { ScrollStackItem } from './ScrollStack';
import './ProblemStoryStack.css';

const PAYMENT_BENTO_CARDS = [
  {
    id: 'prepaid',
    size: 'large',
    backgroundDecor: 'fastwork-card',
    color: '#ffffff',
    title: "Prepaid team's credit",
    description:
      "No more having to advance the payment out of your pocket. Top up credit for your team to use together on all team's order."
  },
  {
    id: 'bank-account',
    size: 'compact',
    backgroundDecor: 'thai-banks',
    color: '#ffffff',
    title: 'Bank & Promptpay',
    description:
      'Pay from your registered business bank account, or pay via PromptPay QR'
  },
  {
    id: 'credit-card',
    size: 'compact',
    backgroundDecor: 'payment-cards',
    color: '#ffffff',
    title: 'Credit card',
    description: 'Charge company Visa and Mastercard for every hire — no personal cards, no reimbursement.'
  },
  {
    id: 'credit-term',
    size: 'large',
    backgroundDecor: 'credit-invoice',
    color: '#ffffff',
    title: 'Credit terms',
    description:
      'Pre-paid does not work for you? Contact our enterprise team to pay with net 30 to net 90 invoicing.'
  }
];

function getDocumentOffsetTop(element) {
  let top = 0;
  let el = element;

  while (el) {
    top += el.offsetTop;
    el = el.offsetParent;
  }

  return top;
}

function getStoryStackCardPinStart(card, cards, cardIndex) {
  const cardTop = getDocumentOffsetTop(card);
  const stackPositionPx = parseStackPositionPx(STORY_STACK_PIN.stackPosition);
  return cardTop - stackPositionPx - STORY_STACK_PIN.itemStackDistance * cardIndex;
}

function getGalleryScrollMetrics(card) {
  const viewport = window.innerHeight;
  const scroller = card.closest('.scroll-stack-scroller');
  const cards = scroller ? Array.from(scroller.querySelectorAll('.scroll-stack-card')) : [card];
  const cardIndex = Math.max(0, cards.indexOf(card));
  const pinStart = getStoryStackCardPinStart(card, cards, cardIndex);
  const nextCard = cards[cardIndex + 1];
  const animEnd = nextCard
    ? getStoryStackCardPinStart(nextCard, cards, cardIndex + 1)
    : pinStart + viewport;

  // Start as the gallery card enters the viewport, before it reaches its pin point.
  const animStart = pinStart - viewport;

  return { animStart, animEnd };
}

function getGalleryScrollProgress(card) {
  const scrollTop = window.scrollY;
  const { animStart, animEnd } = getGalleryScrollMetrics(card);
  const range = animEnd - animStart;

  if (range <= 0) return scrollTop >= animStart ? 1 : 0;
  if (scrollTop <= animStart) return 0;
  if (scrollTop >= animEnd) return 1;

  return (scrollTop - animStart) / range;
}

const BRIDGE_GRADIENT_STOPS = [
  { pos: 0, color: '#84b5ff' },
  { pos: 1 / 3, color: '#0569ff' },
  { pos: 2 / 3, color: '#ae8eff' },
  { pos: 1, color: '#ffcca5' }
];

function hexToRgb(hex) {
  const value = parseInt(hex.slice(1), 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}

function rgbToHex(r, g, b) {
  return `#${[r, g, b]
    .map(channel => Math.round(channel).toString(16).padStart(2, '0'))
    .join('')}`;
}

function sampleBridgeGradient(t) {
  const clamped = Math.min(1, Math.max(0, t));

  for (let i = 0; i < BRIDGE_GRADIENT_STOPS.length - 1; i += 1) {
    const current = BRIDGE_GRADIENT_STOPS[i];
    const next = BRIDGE_GRADIENT_STOPS[i + 1];

    if (clamped <= next.pos || i === BRIDGE_GRADIENT_STOPS.length - 2) {
      const span = next.pos - current.pos || 1;
      const local = (clamped - current.pos) / span;
      const from = hexToRgb(current.color);
      const to = hexToRgb(next.color);

      return rgbToHex(
        from[0] + (to[0] - from[0]) * local,
        from[1] + (to[1] - from[1]) * local,
        from[2] + (to[2] - from[2]) * local
      );
    }
  }

  return BRIDGE_GRADIENT_STOPS[BRIDGE_GRADIENT_STOPS.length - 1].color;
}

const BRIDGE_LINE_DEFS = [
  { id: 'a', startX: 2, width: 2.2, opacity: 0.78 },
  { id: 'b', startX: 8, width: 2.4, opacity: 0.82 },
  { id: 'c', startX: 14, width: 2.8, opacity: 0.88 },
  { id: 'd', startX: 22, width: 2.4, opacity: 0.8 },
  { id: 'e', startX: 30, width: 2.6, opacity: 0.84 },
  { id: 'f', startX: 38, width: 2.2, opacity: 0.74 },
  { id: 'g', startX: 46, width: 2.5, opacity: 0.76 },
  { id: 'h', startX: 54, width: 2.4, opacity: 0.8 },
  { id: 'i', startX: 62, width: 2.8, opacity: 0.86 },
  { id: 'j', startX: 70, width: 2.4, opacity: 0.82 },
  { id: 'k', startX: 78, width: 2.6, opacity: 0.78 },
  { id: 'l', startX: 86, width: 2.2, opacity: 0.72 },
  { id: 'm', startX: 92, width: 2.4, opacity: 0.76 },
  { id: 'n', startX: 98, width: 2, opacity: 0.7 }
];

const BRIDGE_LINES = BRIDGE_LINE_DEFS.map(line => {
  const outer = line.startX / 100;
  const inner = (line.startX + 50) / 2 / 100;

  return {
    ...line,
    colors: [sampleBridgeGradient(outer), sampleBridgeGradient(inner)]
  };
});

const BRIDGE_LOGO_SRC = 'assets/logos/business - on light.svg';

function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

function getBridgeTargetPoint(card, badge) {
  const cardRect = card.getBoundingClientRect();
  const badgeRect = badge.getBoundingClientRect();

  if (!cardRect.width || !cardRect.height) {
    return { x: 50, y: 38 };
  }

  return {
    x: ((badgeRect.left + badgeRect.width / 2 - cardRect.left) / cardRect.width) * 100,
    y: ((badgeRect.top + badgeRect.height / 2 - cardRect.top) / cardRect.height) * 100
  };
}

const BRIDGE_LINE_CONNECT_END = 0.4;

const STORY_STACK_PIN = {
  stackPosition: '0%',
  itemStackDistance: 0
};

function parseStackPositionPx(value) {
  if (typeof value === 'string' && value.includes('%')) {
    return (parseFloat(value) / 100) * window.innerHeight;
  }

  return parseFloat(value) || 0;
}

function getBridgePinMetrics(card) {
  const viewport = window.innerHeight;
  const scroller = card.closest('.scroll-stack-scroller');
  const endElement = scroller?.querySelector('.scroll-stack-end');
  const cards = scroller ? Array.from(scroller.querySelectorAll('.scroll-stack-card')) : [];
  const cardIndex = Math.max(0, cards.indexOf(card));
  const pinStart = getStoryStackCardPinStart(card, cards, cardIndex);
  const pinEnd = endElement
    ? getDocumentOffsetTop(endElement) - viewport * 0.5
    : pinStart + viewport * 1.2;

  return { pinStart, pinEnd };
}

function getBridgeScrollProgress(card) {
  const scrollTop = window.scrollY;
  const { pinStart, pinEnd } = getBridgePinMetrics(card);
  const range = pinEnd - pinStart;

  if (range <= 0) return scrollTop >= pinStart ? 1 : 0;
  if (scrollTop <= pinStart) return 0;
  if (scrollTop >= pinEnd) return 1;

  return (scrollTop - pinStart) / range;
}

function BridgeConvergenceLines({ svgRef }) {
  return (
    <svg
      ref={svgRef}
      className="story-scene__bridge-lines"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <defs>
        <filter id="story-bridge-line-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="0.55" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <radialGradient id="story-bridge-core-glow" cx="50%" cy="38%" r="50%">
          <stop offset="0%" stopColor="#ae8eff" stopOpacity="0.28" />
          <stop offset="35%" stopColor="#ffcca5" stopOpacity="0.12" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
        {BRIDGE_LINES.map(line => (
          <linearGradient
            key={`gradient-${line.id}`}
            id={`story-bridge-gradient-${line.id}`}
            data-bridge-gradient={line.id}
            gradientUnits="userSpaceOnUse"
            x1={line.startX}
            y1="-4"
            x2="50"
            y2="38"
          >
            <stop offset="0%" stopColor={line.colors[0]} stopOpacity="0.15" />
            <stop offset="45%" stopColor={line.colors[0]} stopOpacity="0.95" />
            <stop offset="100%" stopColor={line.colors[1]} stopOpacity="1" />
          </linearGradient>
        ))}
      </defs>

      <circle
        className="story-scene__bridge-core"
        data-bridge-core=""
        cx="50"
        cy="38"
        r="0"
        fill="url(#story-bridge-core-glow)"
      />

      {BRIDGE_LINES.map(line => (
        <line
          key={line.id}
          data-bridge-line={line.id}
          x1={line.startX}
          y1="-4"
          x2={line.startX}
          y2="-4"
          stroke={`url(#story-bridge-gradient-${line.id})`}
          strokeWidth={line.width}
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
          filter="url(#story-bridge-line-glow)"
          opacity={line.opacity}
        />
      ))}
    </svg>
  );
}

function BridgeLogoBadge({ badgeRef }) {
  return (
    <div ref={badgeRef} className="story-scene__bridge-badge">
      <img
        src={BRIDGE_LOGO_SRC}
        alt="fastwork for business"
        className="story-scene__bridge-badge-logo"
        draggable="false"
      />
    </div>
  );
}

function BridgeScene({ scene }) {
  const cardRef = useRef(null);
  const linesRef = useRef(null);
  const badgeRef = useRef(null);
  const headlineRef = useRef(null);

  useEffect(() => {
    let frame = 0;
    const lineConnectEnd = BRIDGE_LINE_CONNECT_END;

    const updateScene = progress => {
      const card = cardRef.current?.closest('.scroll-stack-card');
      const badge = badgeRef.current;
      const svg = linesRef.current;
      const headline = headlineRef.current;
      if (!card || !badge || !svg) return;

      const lineProgress = Math.min(1, progress / lineConnectEnd);
      const lineEased = easeOutCubic(lineProgress);
      const textProgress =
        progress <= lineConnectEnd
          ? 0
          : Math.min(1, (progress - lineConnectEnd) / (1 - lineConnectEnd));
      const textEased = easeOutCubic(textProgress);
      const target = getBridgeTargetPoint(card, badge);
      const core = svg.querySelector('[data-bridge-core]');
      const coreGlow = svg.querySelector('#story-bridge-core-glow');

      if (coreGlow) {
        coreGlow.setAttribute('cx', `${target.x}%`);
        coreGlow.setAttribute('cy', `${target.y}%`);
      }

      if (core) {
        core.setAttribute('cx', String(target.x));
        core.setAttribute('cy', String(target.y));
        core.setAttribute('r', String(5 + lineEased * 14));
        core.setAttribute('opacity', String(lineEased * 0.85));
      }

      BRIDGE_LINES.forEach(line => {
        const gradient = svg.querySelector(`[data-bridge-gradient="${line.id}"]`);
        if (gradient) {
          gradient.setAttribute('x2', String(target.x));
          gradient.setAttribute('y2', String(target.y));
        }

        const el = svg.querySelector(`[data-bridge-line="${line.id}"]`);
        if (!el) return;

        const x2 = line.startX + (target.x - line.startX) * lineEased;
        const y2 = -4 + (target.y + 4) * lineEased;
        el.setAttribute('x2', String(x2));
        el.setAttribute('y2', String(y2));
        el.setAttribute(
          'opacity',
          String(line.opacity * Math.min(1, 0.25 + lineEased * 0.85))
        );
      });

      badge.style.setProperty('--bridge-badge-glow', String(lineEased));
      card.style.setProperty('--bridge-bg-progress', String(lineEased));

      if (headline) {
        headline.style.setProperty('--bridge-headline-opacity', String(textEased));
        headline.style.setProperty('--bridge-headline-y', `${(1 - textEased) * 14}px`);
      }
    };

    const tick = () => {
      const card = cardRef.current?.closest('.scroll-stack-card');
      const progress = card ? getBridgeScrollProgress(card) : 0;

      updateScene(progress);
      frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <>
      <div className="story-scene__bridge-backdrop" aria-hidden="true">
        <BridgeConvergenceLines svgRef={linesRef} />
      </div>
      <div ref={cardRef} className="story-scene__content story-scene__content--bridge">
        <BridgeLogoBadge badgeRef={badgeRef} />
        <div ref={headlineRef} className="story-scene__bridge-headline-wrap">
          <SceneHeadline scene={scene} />
        </div>
        {scene.kicker ? <p className="story-scene__kicker">{scene.kicker}</p> : null}
      </div>
    </>
  );
}

function PaymentBento({ scene }) {
  return (
    <>
      <div className="story-scene__content">
        <p className="story-scene__eyebrow">{scene.eyebrow}</p>
        <SceneHeadline scene={scene} />
        {scene.kicker ? <p className="story-scene__kicker">{scene.kicker}</p> : null}
      </div>
      <div className="story-scene__bento-wrap" aria-hidden="true">
        <MagicBento
          cards={PAYMENT_BENTO_CARDS}
          textAutoHide={true}
          enableStars={false}
          enableSpotlight={false}
          enableBorderGlow={true}
          enableTilt={false}
          enableMagnetism={false}
          clickEffect={false}
          spotlightRadius={330}
          particleCount={12}
          glowColor="0, 0, 0"
        />
      </div>
    </>
  );
}

function SceneHeadline({ scene }) {
  if (scene.headlineRotating) {
    return (
      <h2 className="story-scene__headline story-scene__headline--rotating">
        {scene.headlinePrefix}{' '}
        <RotatingText
          texts={scene.headlineRotating}
          mainClassName="story-scene__headline-rotate"
          elementLevelClassName="story-scene__headline-accent story-scene__headline-rotate-char"
          splitLevelClassName="story-scene__headline-rotate-word"
          staggerFrom="center"
          initial={{ y: '40%', opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '-40%', opacity: 0 }}
          staggerDuration={0.05}
          transition={{ type: 'spring', damping: 30, stiffness: 400 }}
          rotationInterval={2500}
          splitBy="words"
        />
      </h2>
    );
  }

  return (
    <h2 className="story-scene__headline">
      {scene.headlineLeadAccent ? (
        scene.headlineLine2 ? (
          <>
            <span className="story-scene__headline-accent">{scene.headlineLeadAccent}</span>
            <br />
            {scene.headlineLine2}
          </>
        ) : (
          <>
            <span className="story-scene__headline-accent">{scene.headlineLeadAccent}</span>{' '}
            {scene.headline}
          </>
        )
      ) : scene.headlineAccent ? (
        <>
          {scene.headline}{' '}
          <span className="story-scene__headline-accent">{scene.headlineAccent}</span>
        </>
      ) : scene.headlineLine2 ? (
        <>
          {scene.headline}
          <br />
          {scene.headlineLine2}
        </>
      ) : (
        scene.headline
      )}
    </h2>
  );
}

const TEAM_MEMBERS = [
  { id: 'admin', role: 'Admin', color: '#0569FF', position: 1 },
  { id: 'finance', role: 'Finance', color: '#AE8EFF', position: 2 },
  { id: 'hiring', role: 'Hiring', color: '#FF7088', position: 3 },
  { id: 'operations', role: 'Operations', color: '#6FA8FF', position: 4 },
  { id: 'legal', role: 'Legal', color: '#7B61FF', position: 5 },
  { id: 'marketing', role: 'Marketing', color: '#FFB508', position: 6 }
];

const USER_TEAM_BADGE = {
  role: 'You',
  color: '#0569FF'
};

function TeamCursorGraphic({ label, color, className }) {
  return (
    <div className={className} style={{ '--team-cursor-color': color }}>
      <svg
        className="story-scene__team-cursor-pointer"
        viewBox="0 0 12 18"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M1 1v12.2l3.2-2.3L6.4 16.8l1.6-.8-2.3-5.4h4.8L1 1Z"
          fill="currentColor"
          stroke="#fff"
          strokeWidth="1.25"
          strokeLinejoin="round"
        />
      </svg>
      <span className="story-scene__team-cursor-label">{label}</span>
    </div>
  );
}

function TeamMemberCursor({ member }) {
  return (
    <div role="listitem">
      <TeamCursorGraphic
        label={member.role}
        color={member.color}
        className={`story-scene__team-cursor story-scene__team-cursor--${member.position}`}
      />
    </div>
  );
}

function isTeamsSectionActive(card) {
  if (!card) return false;
  if (card.style.visibility === 'hidden' || card.style.pointerEvents === 'none') return false;

  const rect = card.getBoundingClientRect();
  const viewportHeight = window.innerHeight;
  const visibleHeight = Math.min(rect.bottom, viewportHeight) - Math.max(rect.top, 0);
  const minVisible = Math.min(rect.height * 0.45, viewportHeight * 0.38);

  return rect.top <= 8 && rect.height >= 120 && visibleHeight >= minVisible;
}

function useTeamUserBadge(sectionRef) {
  const [badge, setBadge] = useState({ active: false, visible: false, x: 0, y: 0 });
  const activeRef = useRef(false);
  const lastMouseRef = useRef({ x: 0, y: 0, has: false });

  useEffect(() => {
    const card = sectionRef.current?.closest('.scroll-stack-card');
    if (!card || !window.matchMedia('(pointer: fine)').matches) return undefined;

    let frame = 0;

    const showUserBadge = () => {
      if (!lastMouseRef.current.has) return;

      setBadge({
        active: true,
        visible: true,
        x: lastMouseRef.current.x,
        y: lastMouseRef.current.y
      });
    };

    const syncActive = () => {
      const nextActive = isTeamsSectionActive(card);
      activeRef.current = nextActive;

      if (nextActive) {
        showUserBadge();
        return;
      }

      setBadge(prev => ({ ...prev, active: false, visible: false }));
    };

    const onScroll = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        syncActive();
      });
    };

    const onMouseMove = event => {
      lastMouseRef.current = {
        x: event.clientX,
        y: event.clientY,
        has: true
      };

      if (!activeRef.current) return;

      setBadge({
        active: true,
        visible: true,
        x: event.clientX,
        y: event.clientY
      });
    };

    syncActive();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('mousemove', onMouseMove, { passive: true });

    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('mousemove', onMouseMove);
    };
  }, [sectionRef]);

  return badge;
}

function TeamPlatformVisual() {
  return (
    <div className="story-scene__teams-stage">
      <div className="story-scene__teams-mockup-wrap">
        <img
          className="story-scene__teams-mockup"
          src="assets/ui-platform-no-bg.png?v=1"
          alt="fastwork for business team dashboard with setup steps, members, credits, and transactions"
          width={2277}
          height={1417}
          loading="lazy"
          decoding="async"
        />
      </div>
      <div className="story-scene__team-badges" role="list" aria-label="Team roles">
        {TEAM_MEMBERS.map(member => (
          <TeamMemberCursor key={member.id} member={member} />
        ))}
      </div>
    </div>
  );
}

function TeamPlatformScene({ scene }) {
  const sectionRef = useRef(null);
  const userBadge = useTeamUserBadge(sectionRef);

  return (
    <>
      <div className="story-scene__content">
        <p className="story-scene__eyebrow">{scene.eyebrow}</p>
        <SceneHeadline scene={scene} />
        {scene.kicker ? <p className="story-scene__kicker">{scene.kicker}</p> : null}
      </div>
      <div ref={sectionRef} className="story-scene__teams-wrap">
        <TeamPlatformVisual />
      </div>
      {userBadge.active && userBadge.visible
        ? createPortal(
            <div
              className="story-scene__user-badge"
              style={{
                '--team-cursor-color': USER_TEAM_BADGE.color,
                transform: `translate3d(${userBadge.x + 14}px, ${userBadge.y + 18}px, 0)`
              }}
              aria-hidden="true"
            >
              <span className="story-scene__team-cursor-label">{USER_TEAM_BADGE.role}</span>
            </div>,
            document.body
          )
        : null}
    </>
  );
}

function FreelancerGallery({ scene }) {
  const cardRef = useRef(null);
  const galleryRef = useRef(null);

  useEffect(() => {
    let frame = 0;

    const tick = () => {
      const card = cardRef.current?.closest('.scroll-stack-card');
      if (card && galleryRef.current) {
        galleryRef.current.setScrollProgress(getGalleryScrollProgress(card));
      }
      frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <>
      <div ref={cardRef} className="story-scene__content">
        <p className="story-scene__eyebrow">{scene.eyebrow}</p>
        <SceneHeadline scene={scene} />
        {scene.kicker ? <p className="story-scene__kicker">{scene.kicker}</p> : null}
      </div>
      <div className="story-scene__gallery-wrap" aria-hidden="true">
        <CircularGallery
          ref={galleryRef}
          items={FREELANCER_GALLERY_ITEMS}
          bend={3.5}
          borderRadius={0.05}
          scrollEase={0.06}
          interactive={false}
          scrollLinked
          duplicateItems={false}
        />
      </div>
    </>
  );
}

const SCENES = [
  {
    id: 'freelancers',
    eyebrow: 'Hiring freelancers',
    headlineLeadAccent: 'Great talent.',
    headline: 'Easier to find.',
    kicker:
      'fastwork connects your business to quality freelancers — spend less time searching and more time getting work done.',
    tone: 'benefit',
    visual: 'circular-gallery'
  },
  {
    id: 'payments',
    eyebrow: 'How you pay',
    headlineLeadAccent: 'Every payment method',
    headlineLine2: 'your business already uses.',
    tone: 'benefit',
    visual: 'payment-bento'
  },
  {
    id: 'teams',
    eyebrow: 'Built for teams',
    headlinePrefix: 'Your whole team can',
    headlineRotating: ['hire', 'pay', 'share'],
    kicker:
      "Invite your team to hire freelancers together in a shared workspace, use shared team's credit, and keep all documents in one place.",
    tone: 'benefit',
    visual: 'team-platform'
  },
  {
    id: 'product',
    headline: 'Everything above.',
    headlineAccent: 'One platform.',
    kicker: '',
    tone: 'bridge',
    visual: 'unified'
  }
];

function SceneVisual({ type }) {
  if (type === 'circular-gallery') {
    return null;
  }

  if (type === 'companies') {
    return (
      <div className="story-scene__visual story-scene__visual--companies" aria-hidden="true">
        <div className="story-scene__window story-scene__window--a">
          <span>Company A</span>
        </div>
        <div className="story-scene__window story-scene__window--b">
          <span>Company B</span>
        </div>
        <div className="story-scene__window story-scene__window--c">
          <span>Company C</span>
        </div>
      </div>
    );
  }

  if (type === 'logins') {
    return (
      <div className="story-scene__visual story-scene__visual--logins" aria-hidden="true">
        <div className="story-scene__tabs">
          <span className="story-scene__tab story-scene__tab--active">Login · Co. A</span>
          <span className="story-scene__tab">Login · Co. B</span>
          <span className="story-scene__tab">Login · Co. C</span>
          <span className="story-scene__tab">Login · Co. D</span>
        </div>
        <div className="story-scene__login">
          <div className="story-scene__field" />
          <div className="story-scene__field story-scene__field--short" />
          <div className="story-scene__btn">Sign in</div>
        </div>
      </div>
    );
  }

  if (type === 'payment-bento') {
    return null;
  }

  return (
    <div className="story-scene__visual story-scene__visual--unified" aria-hidden="true">
      <div className="story-scene__unified-bar">
        <span>Workspace</span>
        <span>Payments</span>
        <span>Documents</span>
      </div>
      <div className="story-scene__unified-body">
        <div className="story-scene__unified-line" />
        <div className="story-scene__unified-line story-scene__unified-line--short" />
        <div className="story-scene__unified-line story-scene__unified-line--medium" />
      </div>
    </div>
  );
}

function SceneCard({ scene }) {
  const toneClass =
    scene.tone === 'bridge'
      ? 'story-scene--bridge'
      : scene.tone === 'benefit'
        ? 'story-scene--benefit'
        : 'story-scene--problem';
  const useCircularGallery = scene.visual === 'circular-gallery';
  const usePaymentBento = scene.visual === 'payment-bento';
  const useTeamPlatform = scene.visual === 'team-platform';

  const copy = (
    <>
      {scene.eyebrow ? <p className="story-scene__eyebrow">{scene.eyebrow}</p> : null}
      <SceneHeadline scene={scene} />
      {scene.kicker ? <p className="story-scene__kicker">{scene.kicker}</p> : null}
    </>
  );

  if (useCircularGallery) {
    return (
      <ScrollStackItem itemClassName={`story-scene ${toneClass} story-scene--gallery`}>
        <FreelancerGallery scene={scene} />
      </ScrollStackItem>
    );
  }

  if (usePaymentBento) {
    return (
      <ScrollStackItem itemClassName={`story-scene ${toneClass} story-scene--payment-bento`}>
        <PaymentBento scene={scene} />
      </ScrollStackItem>
    );
  }

  if (useTeamPlatform) {
    return (
      <ScrollStackItem itemClassName={`story-scene ${toneClass} story-scene--teams`}>
        <TeamPlatformScene scene={scene} />
      </ScrollStackItem>
    );
  }

  if (scene.tone === 'bridge') {
    return (
      <ScrollStackItem itemClassName={`story-scene ${toneClass}`}>
        <BridgeScene scene={scene} />
      </ScrollStackItem>
    );
  }

  return (
    <ScrollStackItem itemClassName={`story-scene ${toneClass}`}>
      {copy}
      <SceneVisual type={scene.visual} />
    </ScrollStackItem>
  );
}

export default function ProblemStoryStack() {
  return (
    <ScrollStack
      className="problem-story-stack"
      itemDistance={48}
      itemStackDistance={0}
      stackPosition="0%"
      baseScale={1}
      itemScale={0}
      blurAmount={0}
      useWindowScroll
    >
      {SCENES.map(scene => (
        <SceneCard key={scene.id} scene={scene} />
      ))}
    </ScrollStack>
  );
}
