const value = process.env.EXPO_PUBLIC_API_ORIGIN;

if (process.env.EAS_BUILD_PROFILE !== 'preview') process.exit(0);

try {
  const url = new URL(value);
  if (url.protocol !== 'https:' || url.username || url.password || url.pathname !== '/' || url.search || url.hash) throw new Error('invalid');
} catch {
  console.error('Preview APK needs EXPO_PUBLIC_API_ORIGIN set to the HTTPS root URL of your deployed question API. Set it in the EAS preview environment before building.');
  process.exit(1);
}
