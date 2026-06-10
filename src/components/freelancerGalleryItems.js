/**
 * Freelancer gallery items.
 * Placeholder portraits cycle randomly from the three background assets.
 * Replace with per-role image paths when final portraits are ready.
 */
export const TALENT_IMAGES = [
  'assets/background-color-01.jpg',
  'assets/background-color-02.jpg',
  'assets/background-color-03.jpg'
];

const FREELANCER_ROLES = [
  { slug: 'ui-designer', text: 'UI Designer' },
  { slug: 'copywriter', text: 'Copywriter' },
  { slug: 'developer', text: 'Developer' },
  { slug: 'video-editor', text: 'Video Editor' },
  { slug: 'marketer', text: 'Marketer' },
  { slug: 'photographer', text: 'Photographer' },
  { slug: 'translator', text: 'Translator' },
  { slug: 'illustrator', text: 'Illustrator' },
  { slug: 'motion-design', text: 'Motion Design' }
];

function shuffledImages(count) {
  const pool = Array.from({ length: count }, (_, index) => TALENT_IMAGES[index % TALENT_IMAGES.length]);

  for (let i = pool.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }

  return pool;
}

const shuffledTalentImages = shuffledImages(FREELANCER_ROLES.length);

export const FREELANCER_GALLERY_ITEMS = FREELANCER_ROLES.map(({ slug, text }, index) => ({
  text,
  image: shuffledTalentImages[index]
}));

export { FREELANCER_ROLES };
