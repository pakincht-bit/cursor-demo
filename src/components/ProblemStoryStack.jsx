import { useEffect, useRef } from 'react';
import CircularGallery from './CircularGallery';
import { FREELANCER_GALLERY_ITEMS } from './freelancerGalleryItems';
import MagicBento from './MagicBento';
import ScrollStack, { ScrollStackItem } from './ScrollStack';
import './ProblemStoryStack.css';

const PAYMENT_BENTO_CARDS = [
  {
    id: 'prepaid',
    size: 'large',
    backgroundDecor: 'fastwork-card',
    color: '#ffffff',
    title: 'Prepaid credit',
    description: 'Top up wallet balance and pay from available credit.'
  },
  {
    id: 'bank-account',
    size: 'compact',
    backgroundDecor: 'thai-banks',
    color: '#ffffff',
    title: 'Bank & PromptPay',
    description: 'Pay from your registered business bank account, or top up instantly with PromptPay.'
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
    description: 'Pay on net-30 to net-90 invoicing for enterprise teams.'
  }
];

const GALLERY_STACK = {
  stackPositionPx: 0,
  itemStackDistance: 180
};

const TEAM_AVATARS = [
  { id: 'jd', initials: 'JD', image: 'assets/background-color-01.jpg', position: 1 },
  { id: 'sa', initials: 'SA', image: 'assets/background-color-02.jpg', position: 2 },
  { id: 'mk', initials: 'MK', gradient: 'linear-gradient(135deg, #84b5ff, #0569ff)', position: 3 },
  { id: 'pl', initials: 'PL', image: 'assets/background-color-03.jpg', position: 4 },
  { id: 'an', initials: 'AN', gradient: 'linear-gradient(135deg, #ae8eff, #8565ff)', position: 5 },
  { id: 'rw', initials: 'RW', gradient: 'linear-gradient(135deg, #ffcca5, #ffb508)', position: 6 }
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
          enableMagnetism={true}
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

function TeamAvatar({ member }) {
  const style = member.image
    ? { backgroundImage: `url(${member.image})` }
    : { background: member.gradient };

  return (
    <div
      className={`story-scene__team-avatar story-scene__team-avatar--${member.position}`}
      style={style}
      aria-hidden="true"
    >
      {!member.image ? <span>{member.initials}</span> : null}
    </div>
  );
}

function TeamPlatformVisual() {
  return (
    <div className="story-scene__teams-stage" aria-hidden="true">
      {TEAM_AVATARS.map(member => (
        <TeamAvatar key={member.id} member={member} />
      ))}

      <div className="story-scene__platform">
        <div className="story-scene__platform-chrome">
          <span className="story-scene__platform-dot story-scene__platform-dot--red" />
          <span className="story-scene__platform-dot story-scene__platform-dot--amber" />
          <span className="story-scene__platform-dot story-scene__platform-dot--green" />
          <span className="story-scene__platform-url">app.fastwork.co/team</span>
        </div>

        <div className="story-scene__platform-body">
          <aside className="story-scene__platform-sidebar">
            <p className="story-scene__platform-sidebar-label">Workspace</p>
            <div className="story-scene__platform-nav-item story-scene__platform-nav-item--active">
              <span className="story-scene__platform-nav-icon" />
              Team
            </div>
            <div className="story-scene__platform-nav-item">
              <span className="story-scene__platform-nav-icon" />
              Projects
            </div>
            <div className="story-scene__platform-nav-item">
              <span className="story-scene__platform-nav-icon" />
              Payments
            </div>
            <div className="story-scene__platform-nav-item">
              <span className="story-scene__platform-nav-icon" />
              Documents
            </div>
          </aside>

          <div className="story-scene__platform-main">
            <div className="story-scene__platform-header">
              <div>
                <p className="story-scene__platform-context">Acme Co. · Team workspace</p>
                <p className="story-scene__platform-title">Shared hiring dashboard</p>
              </div>
              <span className="story-scene__platform-badge">
                <span className="story-scene__platform-badge-dot" />
                6 members
              </span>
            </div>

            <div className="story-scene__platform-cards">
              <div className="story-scene__platform-card">
                <span className="story-scene__platform-card-label">Active project</span>
                <span className="story-scene__platform-card-line" />
                <span className="story-scene__platform-card-line story-scene__platform-card-line--short" />
              </div>
              <div className="story-scene__platform-card">
                <span className="story-scene__platform-card-label">Team wallet</span>
                <span className="story-scene__platform-card-line story-scene__platform-card-line--medium" />
              </div>
            </div>
          </div>
        </div>
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
          textColor="#ffffff"
          borderRadius={0.05}
          scrollEase={0.06}
          interactive={false}
          scrollLinked
          labelInside
          font="500 15px Instrument Sans"
          fontUrl="https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@500&display=swap"
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
    headline: 'Your whole team can hire — and pay — together.',
    kicker:
      'Invite members to hire freelancers on shared business profiles, use team payment methods, and keep documents in one place.',
    tone: 'benefit',
    visual: 'team-platform'
  },
  {
    id: 'product',
    eyebrow: 'Introducing fastwork',
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
