import { useEffect, useRef } from 'react';
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

const GALLERY_STACK = {
  stackPositionPx: 0,
  itemStackDistance: 180
};

function getDocumentOffsetTop(element) {
  let top = 0;
  let el = element;

  while (el) {
    top += el.offsetTop;
    el = el.offsetParent;
  }

  return top;
}

function getGalleryScrollProgress(card) {
  const cards = card.parentElement?.querySelectorAll('.scroll-stack-card');
  if (!cards?.length) return 0;

  const scrollTop = window.scrollY;
  const cardTop = getDocumentOffsetTop(card);
  const pinStart = cardTop - GALLERY_STACK.stackPositionPx;
  const nextCard = cards[1];
  const pinEnd = nextCard
    ? getDocumentOffsetTop(nextCard) -
      GALLERY_STACK.stackPositionPx -
      GALLERY_STACK.itemStackDistance
    : pinStart + window.innerHeight * 0.85;

  if (scrollTop <= pinStart) return 0;
  if (scrollTop >= pinEnd) return 1;
  return (scrollTop - pinStart) / (pinEnd - pinStart);
}

const BRIDGE_LINES = [
  { id: 'a', startX: 2, colors: ['#84b5ff', '#0569ff'], width: 2.2, opacity: 0.78 },
  { id: 'b', startX: 8, colors: ['#84b5ff', '#0569ff'], width: 2.4, opacity: 0.82 },
  { id: 'c', startX: 14, colors: ['#0569ff', '#84b5ff'], width: 2.8, opacity: 0.88 },
  { id: 'd', startX: 22, colors: ['#0569ff', '#ae8eff'], width: 2.4, opacity: 0.8 },
  { id: 'e', startX: 30, colors: ['#84b5ff', '#ae8eff'], width: 2.6, opacity: 0.84 },
  { id: 'f', startX: 38, colors: ['#84b5ff', '#8565ff'], width: 2.2, opacity: 0.74 },
  { id: 'g', startX: 46, colors: ['#ae8eff', '#8565ff'], width: 2.5, opacity: 0.76 },
  { id: 'h', startX: 54, colors: ['#ae8eff', '#ffcca5'], width: 2.4, opacity: 0.8 },
  { id: 'i', startX: 62, colors: ['#8565ff', '#ffcca5'], width: 2.8, opacity: 0.86 },
  { id: 'j', startX: 70, colors: ['#8565ff', '#ffb508'], width: 2.4, opacity: 0.82 },
  { id: 'k', startX: 78, colors: ['#ffcca5', '#ffb508'], width: 2.6, opacity: 0.78 },
  { id: 'l', startX: 86, colors: ['#ffcca5', '#ae8eff'], width: 2.2, opacity: 0.72 },
  { id: 'm', startX: 92, colors: ['#ffb508', '#ffcca5'], width: 2.4, opacity: 0.76 },
  { id: 'n', startX: 98, colors: ['#84b5ff', '#ffcca5'], width: 2, opacity: 0.7 }
];

const BRIDGE_LOGO_SRC = 'assets/Logo-black.svg';

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

function getBridgePinMetrics(card) {
  const cardTop = getDocumentOffsetTop(card);
  const viewport = window.innerHeight;
  const scroller = card.closest('.scroll-stack-scroller');
  const endElement = scroller?.querySelector('.scroll-stack-end');
  const pinStart = cardTop;
  const pinEnd = endElement
    ? getDocumentOffsetTop(endElement) - viewport * 0.5
    : pinStart + viewport * 0.85;
  const animEnd = Math.min(pinStart + viewport * 0.72, pinEnd);

  return { pinStart, pinEnd, animEnd };
}

function getBridgeScrollProgress(card) {
  const scrollTop = window.scrollY;
  const { pinStart, animEnd } = getBridgePinMetrics(card);

  if (scrollTop <= pinStart) return 0;
  if (scrollTop >= animEnd) return 1;
  return (scrollTop - pinStart) / (animEnd - pinStart);
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
        alt="fastwork"
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
    const lineConnectEnd = 0.76;

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
        <>
          <span className="story-scene__headline-accent">{scene.headlineLeadAccent}</span>{' '}
          {scene.headline}
        </>
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
  { id: 'mina', name: 'Mina', color: '#0569FF', position: 1 },
  { id: 'kai', name: 'Kai', color: '#AE8EFF', position: 2 },
  { id: 'anna', name: 'Anna', color: '#FFB780', position: 3 },
  { id: 'ryan', name: 'Ryan', color: '#6FA8FF', position: 4 },
  { id: 'nira', name: 'Nira', color: '#0569FF', position: 5 },
  { id: 'theo', name: 'Theo', color: '#AE8EFF', position: 6 }
];

function TeamMemberBadge({ member }) {
  return (
    <div
      className={`story-scene__team-badge story-scene__team-badge--${member.position}`}
      style={{ backgroundColor: member.color }}
      role="listitem"
    >
      <span className="story-scene__team-badge-name">{member.name}</span>
    </div>
  );
}

function TeamPlatformVisual() {
  return (
    <div className="story-scene__teams-stage">
      <img
        className="story-scene__teams-mockup"
        src="assets/ui-platform.png?v=2"
        alt="fastwork for business team dashboard with setup steps, members, credits, and transactions"
        width={2277}
        height={1417}
        loading="lazy"
        decoding="async"
      />
      <div className="story-scene__team-badges" role="list" aria-label="Team members">
        {TEAM_MEMBERS.map(member => (
          <TeamMemberBadge key={member.id} member={member} />
        ))}
      </div>
    </div>
  );
}

function TeamPlatformScene({ scene }) {
  return (
    <>
      <div className="story-scene__content">
        <p className="story-scene__eyebrow">{scene.eyebrow}</p>
        <SceneHeadline scene={scene} />
        {scene.kicker ? <p className="story-scene__kicker">{scene.kicker}</p> : null}
      </div>
      <div className="story-scene__teams-wrap">
        <TeamPlatformVisual />
      </div>
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
    headline: 'Every payment method',
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
      itemDistance={180}
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
