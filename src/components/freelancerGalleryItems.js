const FREELANCER_ASSET_VERSION = '4';

const GALLERY_BACKGROUNDS = [
  'assets/background-color-01.jpg',
  'assets/background-color-02.jpg',
  'assets/background-color-03.jpg',
  'assets/background-color-04.jpg'
];

const withAssetVersion = path => `${path}?v=${FREELANCER_ASSET_VERSION}`;

const FREELANCER_OVERLAY_PATHS = Object.keys(
  import.meta.glob('../../assets/freelancer/freelancer-*.png', { eager: false })
)
  .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
  .map(filePath => withAssetVersion(`assets/freelancer/${filePath.split('/').pop()}`));

export const FREELANCER_GALLERY_ITEMS = FREELANCER_OVERLAY_PATHS.length
  ? FREELANCER_OVERLAY_PATHS.map((overlay, index) => ({
      image: GALLERY_BACKGROUNDS[index % GALLERY_BACKGROUNDS.length],
      overlay
    }))
  : [
      {
        image: GALLERY_BACKGROUNDS[0],
        overlay: withAssetVersion('assets/freelancer/freelancer-01.png')
      }
    ];
