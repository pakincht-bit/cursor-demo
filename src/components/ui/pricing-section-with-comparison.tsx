import { useState } from "react"
import { Check, Minus, MoveRight, PhoneCall } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

import "./pricing-section.css"

const PRIMARY_CTA_URL = "https://form.typeform.com/to/YDvQlvrN"

type FeatureValue = boolean | string | string[]

interface ComparisonFeature {
  name: string
  subItems?: string[]
  business: FeatureValue
  enterprise: FeatureValue
}

const PLANS = [
  {
    id: "business",
    name: "For Business",
    description:
      "Self-serve. For SMEs and mid-market teams that want to hire freelancers as a business, not as individuals.",
    cta: "Set up your business",
    ctaVariant: "primary" as const,
    highlighted: true,
  },
  {
    id: "enterprise",
    name: "For Enterprise",
    description:
      "Sales-led. For large businesses with procurement, legal, and security review requirements.",
    cta: "Talk to Enterprise team",
    ctaVariant: "outline" as const,
    highlighted: false,
  },
] as const

type PlanId = (typeof PLANS)[number]["id"]

const FEATURES: ComparisonFeature[] = [
  {
    name: "Payment methods",
    business: [
      "Pre-paid Team Credit",
      "Credit / debit card",
      "Bank Transfer",
      "Promptpay QR",
    ],
    enterprise: ["Similar to business", "Credit term / invoicing"],
  },
  {
    name: "Billing as multiple entity",
    business: true,
    enterprise: true,
  },
  {
    name: "Consolidated statements and documents",
    business: true,
    enterprise: true,
  },
  {
    name: "Access to business ready freelances pool",
    business: true,
    enterprise: true,
  },
  {
    name: "Freelances sourcing",
    business: "Self-serve — browse & hire from pool",
    enterprise: "Fastwork sources freelancers for you",
  },
  {
    name: "Dedicated Account Manager + Project Manager",
    business: "Self-serve + platform support",
    enterprise: "Dedicated AM & PM",
  },
  {
    name: "Input VAT deduction",
    business: "Only if freelances allow",
    enterprise: "Full input VAT deduction",
  },
  {
    name: "Custom contracts",
    subItems: [
      "Master Service Agreement",
      "Data Processing Agreement",
      "Non Disclosure Agreement",
      "other",
    ],
    business: "Standard platform terms",
    enterprise: "MSA, DPA, NDA & custom agreements",
  },
  {
    name: "Vendor security questionnaire / SSO review",
    business: "Standard platform security",
    enterprise: "Security questionnaire & SSO review",
  },
  {
    name: "Minimum spending",
    business: "no minimum",
    enterprise: "50k thb+",
  },
  {
    name: "Onboarding",
    business: "Self-serve",
    enterprise: "Contact our enterprise team",
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
              {plan.name.replace(/^For /, "")}
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
                  plan.highlighted && "pricing-section__recommended"
                )}
              >
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
                    variant="outline"
                    className="pricing-section__cta pricing-section__cta--outline gap-2"
                  >
                    {plan.cta}
                    <PhoneCall className="h-4 w-4" />
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
                  <div className="pricing-section__feature-cell" data-plan="business">
                    <FeatureCell value={feature.business} />
                  </div>
                  <div className="pricing-section__feature-cell" data-plan="enterprise">
                    <FeatureCell value={feature.enterprise} />
                  </div>
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
