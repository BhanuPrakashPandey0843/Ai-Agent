/** Asset modules only — URIs resolved lazily after the native bridge is ready */

const ASSETS = {
  welcome: require('../../assets/welcome.png'),
  welcomeone: require('../../assets/welcomeone.png'),
  welcometwo: require('../../assets/welcometwo.png'),
  icon: require('../../assets/icon.png'),
};

const DEMO_DEFS = [
  { id: 'demo-1', title: 'Divine Light', category: 'Christian', asset: 'welcome', rating: '4.9' },
  { id: 'demo-2', title: 'Path of Faith', category: 'Islamic', asset: 'welcomeone', rating: '4.8' },
  { id: 'demo-3', title: 'Sacred Horizon', category: 'Hindu', asset: 'welcometwo', rating: '4.7' },
  { id: 'demo-4', title: 'Peaceful Spirit', category: 'Buddhist', asset: 'icon', rating: '4.6' },
  { id: 'demo-5', title: 'Golden Grace', category: 'Sikh', asset: 'icon', rating: '4.8' },
  {
    id: 'demo-6',
    title: 'Morning Prayer',
    category: 'Christian',
    asset: 'welcomeone',
    rating: '4.5',
  },
];

let cachedList = null;

function buildDemoList() {
  if (cachedList) return cachedList;
  const { Image } = require('react-native');
  const toUri = (module) => Image.resolveAssetSource(module).uri;
  cachedList = DEMO_DEFS.map((d) => ({
    id: d.id,
    title: d.title,
    category: d.category,
    country: 'Global',
    uri: toUri(ASSETS[d.asset]),
    rating: d.rating,
  }));
  return cachedList;
}

export function getDemoWallpapers(category = null) {
  const list = buildDemoList();
  if (!category || category === 'all') return [...list];
  return list.filter((w) => w.category === category);
}

export function getDemoWallpaperById(id) {
  return buildDemoList().find((w) => w.id === id) || null;
}

export function searchDemoWallpapers(text) {
  const q = text.toLowerCase();
  return buildDemoList().filter(
    (w) =>
      w.title?.toLowerCase().includes(q) || w.category?.toLowerCase().includes(q)
  );
}
