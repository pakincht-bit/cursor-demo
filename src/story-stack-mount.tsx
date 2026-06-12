import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import GradualBlur from '@/components/GradualBlur';
import ProblemStoryStack from '@/components/ProblemStoryStack';
import { Pricing } from '@/components/ui/pricing-section-with-comparison';
const heroBlurMount = document.getElementById('hero-gradual-blur-root');

if (heroBlurMount) {
  createRoot(heroBlurMount).render(
    <StrictMode>
      <GradualBlur
        target="parent"
        position="bottom"
        height="8rem"
        tabletHeight="6rem"
        mobileHeight="4rem"
        responsive
        strength={2}
        divCount={5}
        curve="bezier"
        exponential
        opacity={1}
      />
    </StrictMode>
  );
}

const mountNode = document.getElementById('story-stack-root');

if (mountNode) {
  createRoot(mountNode).render(
    <StrictMode>
      <ProblemStoryStack />
    </StrictMode>
  );
}

const pricingMount = document.getElementById('pricing-section-root');

if (pricingMount) {
  createRoot(pricingMount).render(
    <StrictMode>
      <Pricing />
    </StrictMode>
  );
}
