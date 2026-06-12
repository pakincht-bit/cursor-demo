import { useState } from "react"
import { Check, Minus, MoveRight, PhoneCall } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

import "./pricing-section.css"

const PRIMARY_CTA_URL = "https://form.typeform.com/to/YDvQlvrN"

type FeatureValue = boolean | string | string[]

const PLANS = [
  {
    id: "personal",
    name: "Fastwork",
    teamSize: "1 person",
    description:
      "For individuals. Hire freelancers on your own — pay per project before work begins.",
    cta: "Get started",
    ctaVariant: "outline" as const,
    highlighted: false,
  },
  {
    id: "business",
    name: "For Business",
    teamSize: "2–50 teammates",
    description:
      "Self-serve. For SMEs and mid-market teams that want to hire freelancers as a business, not as individuals.",
    cta: "Set up your business",
    ctaVariant: "primary" as const,
    highlighted: true,
  },
  {
    id: "enterprise",
    name: "For Enterprise",
    teamSize: "50+ employees",
    description:
      "Sales-led. For large businesses with procurement, legal, and security review requirements.",
    cta: "Talk to Enterprise team",
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

function Pricing() {
  const [activePlan, setActivePlan] = useState<PlanId>("business")

  return (
    <section
      className="pricing-section"
      id="tiers"
      aria-label="Pricing plans"
      data-active-plan={activePlan}
    >
      <div className="pricing-section__inner">
        <div
          className="pricing-section__plan-toggle"
          role="tablist"
          aria-label="Choose a plan"
        >
          {PLANS.map((plan) => (
            <button
              key={plan.id}
              type="button"
              role="tab"
              id={`pricing-tab-${plan.id}`}
              aria-selected={activePlan === plan.id}
              aria-controls={`pricing-panel-${plan.id}`}
              className={cn(
                "pricing-section__plan-toggle-btn",
                activePlan === plan.id && "pricing-section__plan-toggle-btn--active"
              )}
              onClick={() => setActivePlan(plan.id)}
            >
              {plan.id === "personal" ? plan.name : plan.name.replace(/^For /, "")}
            </button>
          ))}
        </div>

        <div className="pricing-section__table">
          <div className="pricing-section__plans">
            <div className="pricing-section__plan-spacer" aria-hidden="true" />

            {PLANS.map((plan) => (
              <div
                key={plan.id}
                id={plan.id === "enterprise" ? "enterprise" : `pricing-panel-${plan.id}`}
                role="tabpanel"
                aria-labelledby={`pricing-tab-${plan.id}`}
                data-plan={plan.id}
                className={cn(
                  "pricing-section__plan-col",
                  plan.highlighted && "pricing-section__recommended",
                  plan.id === "enterprise" && "pricing-section__plan-col--enterprise"
                )}
              >
                <span className="pricing-section__plan-badge">{plan.teamSize}</span>
                <h3 className="pricing-section__plan-title">{plan.name}</h3>
                <p className="pricing-section__plan-desc">{plan.description}</p>
                {plan.ctaVariant === "primary" ? (
                  <Button
                    asChild
                    variant="default"
                    className="pricing-section__cta pricing-section__cta--primary gap-2"
                  >
                    <a href={PRIMARY_CTA_URL}>
                      {plan.cta}
                      <MoveRight className="h-4 w-4" />
                    </a>
                  </Button>
                ) : (
                  <Button
                    asChild={plan.id === "personal"}
                    variant="outline"
                    className="pricing-section__cta pricing-section__cta--outline gap-2"
                  >
                    {plan.id === "personal" ? (
                      <a href={PRIMARY_CTA_URL}>
                        {plan.cta}
                        <MoveRight className="h-4 w-4" />
                      </a>
                    ) : (
                      <>
                        {plan.cta}
                        <PhoneCall className="h-4 w-4" />
                      </>
                    )}
                  </Button>
                )}
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
