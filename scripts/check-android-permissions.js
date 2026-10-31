#!/usr/bin/env node
/*
 * Google Play "Photo and Video Permissions" policy guard.
 *
 * Fails (exit code 1) if anything could bring READ_MEDIA_IMAGES / READ_MEDIA_VIDEO back:
 *   1. android/app/src/main/AndroidManifest.xml declares one without tools:node="remove",
 *      or is missing the removal entries that stop libraries from merging them in.
 *   2. app.json lists one under android.permissions, or does not block them.
 *   3. Code under src/ asks for media-library permission or reads the user's library,
 *      anywhere except src/utils/mediaPermissions.js.
 *
 * Run:  npm run check:permissions   (also runs automatically before `npm run build:android`)
 */
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const errors = [];

const BROAD_PERMISSIONS = ['READ_MEDIA_IMAGES', 'READ_MEDIA_VIDEO'];
const MUST_BE_REMOVED = [...BROAD_PERMISSIONS, 'READ_MEDIA_VISUAL_USER_SELECTED'];

// ---- 1. AndroidManifest.xml -------------------------------------------------
const manifestPath = path.join(root, 'android', 'app', 'src', 'main', 'AndroidManifest.xml');
if (!fs.existsSync(manifestPath)) {
  errors.push(`Missing ${path.relative(root, manifestPath)}`);
} else {
  const manifest = fs.readFileSync(manifestPath, 'utf8').replace(/<!--[\s\S]*?-->/g, '');
  const lines = manifest.split(/\r?\n/);

  for (const name of MUST_BE_REMOVED) {
    const decl = lines.find(
      (l) => l.includes('<uses-permission') && l.includes(`android.permission.${name}"`)
    );
    if (!decl) {
      errors.push(`AndroidManifest.xml has no tools:node="remove" entry for ${name}.`);
    } else if (!/tools:node="remove"/.test(decl)) {
      errors.push(`AndroidManifest.xml declares ${name} without tools:node="remove".`);
    }
  }
}

// ---- 2. app.json ------------------------------------------------------------
const appJsonPath = path.join(root, 'app.json');
if (fs.existsSync(appJsonPath)) {
  const android = (JSON.parse(fs.readFileSync(appJsonPath, 'utf8')).expo || {}).android || {};
  const requested = android.permissions || [];
  const blocked = android.blockedPermissions || [];

  for (const name of BROAD_PERMISSIONS) {
    const full = `android.permission.${name}`;
    if (requested.includes(full)) errors.push(`app.json android.permissions requests ${name}.`);
    if (!blocked.includes(full)) errors.push(`app.json android.blockedPermissions is missing ${name}.`);
  }
}

// ---- 3. Source code ---------------------------------------------------------
const ALLOWED_FILE = path.join('src', 'utils', 'mediaPermissions.js');
const FORBIDDEN_CALLS = [
  /MediaLibrary\.(requestPermissionsAsync|getPermissionsAsync|usePermissions)\b/,
  /MediaLibrary\.(getAssetsAsync|getAlbumsAsync|getAlbumAsync|getAssetInfoAsync|getMomentsAsync)\b/,
  /ImagePicker\.(requestMediaLibraryPermissionsAsync|getMediaLibraryPermissionsAsync|useMediaLibraryPermissions)\b/,
  /READ_MEDIA_(IMAGES|VIDEO)/,
];

function walk(dir, out) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (/\.(js|jsx|ts|tsx)$/.test(entry.name)) out.push(full);
  }
  return out;
}

const srcDir = path.join(root, 'src');
if (fs.existsSync(srcDir)) {
  for (const file of walk(srcDir, [])) {
    const rel = path.relative(root, file);
    if (rel === ALLOWED_FILE) continue;
    fs.readFileSync(file, 'utf8')
      .split(/\r?\n/)
      .forEach((line, i) => {
        const trimmed = line.trim();
        if (trimmed.startsWith('//') || trimmed.startsWith('*') || trimmed.startsWith('/*')) return;
        const hit = FORBIDDEN_CALLS.find((re) => re.test(line));
        if (hit) {
          errors.push(`${rel}:${i + 1} uses a media-library permission/read API: ${trimmed}`);
        }
      });
  }
}

// ---- Result -----------------------------------------------------------------
if (errors.length) {
  console.error('\nAndroid permission check FAILED (Google Play Photo and Video Permissions policy):\n');
  errors.forEach((e) => console.error('  - ' + e));
  console.error(
    '\nUse the system photo picker / MediaStore saves instead. Route any gallery-save permission ' +
      'through src/utils/mediaPermissions.js.\n'
  );
  process.exit(1);
}
console.log('Android permission check passed: no READ_MEDIA_IMAGES / READ_MEDIA_VIDEO usage found.');
