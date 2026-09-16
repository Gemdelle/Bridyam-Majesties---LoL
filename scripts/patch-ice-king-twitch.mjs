/**
 * Manually add Ice King Twitch to accounts that own it
 * (LoLDB does not always list this skin).
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FILE = path.join(__dirname, '..', 'public', 'data', 'account-skins.json');

const TARGETS = [
  'GEM Lacellire#LAS',
  'GEM Greedgardell#GEM',
  'GEM Glacelynne#GEM',
  'GEM Reamsetmours#GEM',
];

const ICE_KING = {
  name: 'Ice King Twitch',
  champName: 'Twitch',
  rarity: 'kEpic',
  imageUrl:
    'https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/assets/characters/twitch/skins/skin12/images/twitch_splash_tile_12.jpg',
  skinLines: ['winter wonder'],
};

const data = JSON.parse(fs.readFileSync(FILE, 'utf8'));
let added = 0;

for (const username of TARGETS) {
  const acc = data.accounts.find((a) => a.username === username);
  if (!acc) {
    console.log('missing account', username);
    continue;
  }
  if (acc.skins.some((s) => s.name === ICE_KING.name)) {
    console.log('already has', username);
    continue;
  }
  acc.skins.push({ ...ICE_KING });
  added += 1;
  console.log('added to', username);
}

data.updatedAt = new Date().toISOString();
fs.writeFileSync(FILE, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
console.log(`Done. Added ${added}.`);
