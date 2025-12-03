// src/utils/avatars.js  (Vite version; for CRA see note below)
const files = import.meta.glob('../assets/avatars/*.png', {
  eager: true,
  import: 'default',
});

function firstLower(name = '') {
  const first = name.trim().split(/\s+/)[0] || '';
  return first.toLowerCase();
}

/** Return a URL for /assets/avatars/<first>.png or undefined */
export function getAvatarByName(name) {
  const filename = `${firstLower(name)}.png`;
  for (const key of Object.keys(files)) {
    if (key.endsWith(filename)) return files[key];
  }
  return undefined;
}
