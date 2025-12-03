// utils/avatarResolver.js
const avatarUrlMap = import.meta.glob('/src/assets/avatars/*', {
  eager: true,
  as: 'url',
});

export function resolveAvatar(inputPath = '') {
  const file = inputPath.split('/').pop(); // alex.png
  return avatarUrlMap[`/src/assets/avatars/${file}`] || avatarUrlMap['/src/assets/avatars/default.png'];
}
