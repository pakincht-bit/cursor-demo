const FREELANCER_ASSET_VERSION = '6';

const withAssetVersion = path => `${path}?v=${FREELANCER_ASSET_VERSION}`;

const FREELANCER_IMAGE_PATHS = Object.keys(
  import.meta.glob('../../assets/freelancer/freelancer-*.png', { eager: false })
)
  .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
  .map(filePath => withAssetVersion(`assets/freelancer/${filePath.split('/').pop()}`));

export const FREELANCER_GALLERY_ITEMS = FREELANCER_IMAGE_PATHS.length
  ? FREELANCER_IMAGE_PATHS.map(image => ({ image }))
  : [{ image: withAssetVersion('assets/freelancer/freelancer-01.png') }];
