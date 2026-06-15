import { Check, Minus } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

import "./pricing-section.css"

const PRIMARY_CTA_URL = "https://form.typeform.com/to/YDvQlvrN"
const PERSONAL_CTA_URL = "https://fastwork.co/"
const ENTERPRISE_CTA_URL = "https://business.fastwork.co/"

type FeatureValue = boolean | string | string[]

const PLANS = [
  {
    id: "personal",
    name: "Fastwork",
    logoSrc: "assets/logos/individual - on light.svg",
    teamSize: "1 person",
    description:
      "For individuals. Hire freelancers on your own — pay per project before work begins.",
    cta: "Sign-up",
    ctaUrl: PERSONAL_CTA_URL,
    ctaVariant: "outline" as const,
    highlighted: false,
  },
  {
    id: "business",
    name: "For Business",
    logoSrc: "assets/logos/business - on light.svg",
    teamSize: "2–50 teammates",
    description:
      "Self-serve. For SMEs and mid-market teams that want to hire freelancers as a business, not as individuals.",
    cta: "Join waitlist",
    ctaUrl: PRIMARY_CTA_URL,
    ctaVariant: "primary" as const,
    highlighted: true,
  },
  {
    id: "enterprise",
    name: "For Enterprise",
    logoSrc: "assets/logos/enterprise - on light.svg",
    teamSize: "50+ employees",
    description:
      "Sales-led. For large businesses with procurement, legal, and security review requirements.",
    cta: "Contact Enterprise team",
    ctaUrl: ENTERPRISE_CTA_URL,
    ctaVariant: "outline" as const,
    highlighted: false,
  },
] as const

type PlanId = (typeof PLANS)[number]["id"]

interface ComparisonFeature {
  name: string
  subItems?: string[]
  values: Record<PlanId, FeatureValue>
}

const FEATURES: ComparisonFeature[] = [
  {
    name: "Payment",
    values: {
      personal: "Pay before hiring",
      business: "Top up credit and start hiring immediately",
      enterprise: "Monthly billing (credit term)",
    },
  },
  {
    name: "Minimum service fee",
    values: {
      personal: "No minimum",
      business: "No minimum",
      enterprise: "Starting from ฿50,000",
    },
  },
  {
    name: "Account Service coordination",
    values: {
      personal: false,
      business: false,
      enterprise: true,
    },
  },
  {
    name: "Access to Business-Ready freelancers",
    values: {
      personal: false,
      business: true,
      enterprise: true,
    },
  },
  {
    name: "Tax invoice",
    values: {
      personal: "If freelancer is a legal entity",
      business: "If freelancer is a legal entity",
      enterprise: true,
    },
  },
  {
    name: "Team dashboard",
    values: {
      personal: false,
      business: true,
      enterprise: true,
    },
  },
]

function FeatureCell({ value }: { value: FeatureValue }) {
  if (value === true) {
    return (
      <span className="pricing-section__icon pricing-section__icon--check" aria-hidden="true">
        <Check className="h-3.5 w-3.5" />
      </span>
    )
  }

  if (value === false) {
    return (
      <span className="pricing-section__icon pricing-section__icon--dash" aria-hidden="true">
        <Minus className="h-3.5 w-3.5" strokeWidth={2.5} />
      </span>
    )
  }

  if (Array.isArray(value)) {
    return (
      <ul className="pricing-section__feature-list">
        {value.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    )
  }

  return <p className="pricing-section__feature-value">{value}</p>
}

function FeatureName({
  name,
  subItems,
}: {
  name: string
  subItems?: string[]
}) {
  if (!subItems?.length) {
    return <span>{name}</span>
  }

  return (
    <div className="pricing-section__feature-name-group">
      <span>{name}</span>
      <ul className="pricing-section__feature-sublist">
        {subItems.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  )
}

function PlanHeaderLogo({ plan }: { plan: (typeof PLANS)[number] }) {
  return (
    <h3 className="pricing-section__plan-title">
      <img
        src={plan.logoSrc}
        alt={plan.name}
        className="pricing-section__plan-logo"
      />
    </h3>
  )
}

function PlanCta({ plan }: { plan: (typeof PLANS)[number] }) {
  const className = cn(
    "pricing-section__cta",
    plan.ctaVariant === "primary"
      ? "pricing-section__cta--primary"
      : "pricing-section__cta--outline"
  )

  return (
    <Button asChild variant={plan.ctaVariant === "primary" ? "default" : "outline"} className={className}>
      <a href={plan.ctaUrl}>{plan.cta}</a>
    </Button>
  )
}

function Pricing() {
  return (
    <section
      className="pricing-section"
      id="tiers"
      aria-label="Pricing plans"
    >
      <div className="pricing-section__inner">
        <div className="pricing-section__cards">
          {PLANS.map((plan) => (
            <article
              key={plan.id}
              data-plan={plan.id}
              className={cn(
                "pricing-section__card",
                plan.highlighted && "pricing-section__card--recommended",
                plan.id === "enterprise" && "pricing-section__card--enterprise"
              )}
            >
              <div className="pricing-section__card-header">
                <p className="pricing-section__plan-eyebrow">{plan.teamSize}</p>
                <PlanHeaderLogo plan={plan} />
                <p className="pricing-section__plan-desc">{plan.description}</p>
                <PlanCta plan={plan} />
              </div>
              <ul className="pricing-section__card-features">
                {FEATURES.map((feature) => (
                  <li key={feature.name} className="pricing-section__card-feature">
                    <span className="pricing-section__card-feature-name">
                      <FeatureName name={feature.name} subItems={feature.subItems} />
                    </span>
                    <span className="pricing-section__card-feature-value">
                      <FeatureCell value={feature.values[plan.id]} />
                    </span>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>

        <div className="pricing-section__table">
          <div className="pricing-section__plans">
            <div className="pricing-section__plan-spacer" aria-hidden="true" />

            {PLANS.map((plan) => (
              <div
                key={plan.id}
                id={plan.id === "enterprise" ? "enterprise" : undefined}
                data-plan={plan.id}
                className={cn(
                  "pricing-section__plan-col",
                  plan.highlighted && "pricing-section__recommended",
                  plan.id === "enterprise" && "pricing-section__plan-col--enterprise"
                )}
              >
                <p className="pricing-section__plan-eyebrow">{plan.teamSize}</p>
                <PlanHeaderLogo plan={plan} />
                <p className="pricing-section__plan-desc">{plan.description}</p>
                <PlanCta plan={plan} />
              </div>
            ))}
          </div>

          <div className="pricing-section__features">
            {FEATURES.map((feature) => (
              <div key={feature.name} className="pricing-section__feature-row">
                <div className="pricing-section__feature-name">
                  <FeatureName name={feature.name} subItems={feature.subItems} />
                </div>
                <div className="pricing-section__feature-values">
                  {PLANS.map((plan) => (
                    <div
                      key={plan.id}
                      className="pricing-section__feature-cell"
                      data-plan={plan.id}
                    >
                      <FeatureCell value={feature.values[plan.id]} />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

export { Pricing }
