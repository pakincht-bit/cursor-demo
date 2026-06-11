const BANK_LOGOS = [
  {
    id: 'kbank',
    label: 'KBank',
    src: 'assets/bank-logo/Bank App _ PNG.png'
  },
  {
    id: 'scb',
    label: 'SCB',
    src: 'assets/bank-logo/Bank App _ PNG-1.png'
  },
  {
    id: 'bbl',
    label: 'Bangkok Bank',
    src: 'assets/bank-logo/Bank App _ PNG-2.png'
  },
  {
    id: 'ttb',
    label: 'ttb',
    src: 'assets/bank-logo/Bank App _ PNG-3.png'
  },
  {
    id: 'krungsri',
    label: 'Krungsri',
    src: 'assets/bank-logo/Bank App _ PNG-4.png'
  },
  {
    id: 'ktb',
    label: 'Krungthai',
    src: 'assets/bank-logo/Bank App _ PNG-5.png'
  }
];

const CARD_LOGOS = [
  {
    id: 'visa',
    label: 'Visa',
    variant: 'card',
    src: 'assets/bank-logo/visa.svg'
  },
  {
    id: 'mastercard',
    label: 'Mastercard',
    variant: 'card',
    src: 'assets/bank-logo/mastercard.svg'
  }
];

function BankLogo({ logo }) {
  return (
    <div className="magic-bento-card__bank-logo">
      <img src={encodeURI(logo.src)} alt="" loading="lazy" decoding="async" />
    </div>
  );
}

function BankMarquee() {
  const marqueeLogos = [...BANK_LOGOS, ...BANK_LOGOS];

  return (
    <div className="magic-bento-card__bank-marquee" aria-hidden="true">
      <div className="magic-bento-card__bank-marquee-track">
        {marqueeLogos.map((logo, index) => (
          <BankLogo key={`${logo.id}-${index}`} logo={logo} />
        ))}
      </div>
    </div>
  );
}

export default function ThaiBankLogosDecor({ variant = 'banks' }) {
  if (variant === 'cards') {
    return (
      <div className="magic-bento-card__bank-logos magic-bento-card__bank-logos--cards" aria-hidden="true">
        {CARD_LOGOS.map(logo => (
          <div
            key={logo.id}
            className={`magic-bento-card__bank-logo${logo.variant === 'card' ? ' magic-bento-card__bank-logo--card' : ''}`}
          >
            <img src={encodeURI(logo.src)} alt="" loading="lazy" decoding="async" />
          </div>
        ))}
      </div>
    );
  }

  return <BankMarquee />;
}
