import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read the current portraits.json file
const portraitsPath = path.join(__dirname, 'public', 'data', 'portraits.json');
const portraits = JSON.parse(fs.readFileSync(portraitsPath, 'utf8'));

// Tier options (Diamond as highest)
const tiers = ['Iron', 'Bronze', 'Silver', 'Gold', 'Platinum', 'Emerald', 'Diamond'];

// Update all entries
portraits.forEach(portrait => {
    // Only update if they still have image URLs
    if (typeof portrait['elo-soloq'] === 'string' && portrait['elo-soloq'].includes('placehold.co')) {
        portrait['elo-soloq'] = tiers[Math.floor(Math.random() * tiers.length)];
    }
    if (typeof portrait['elo-flex'] === 'string' && portrait['elo-flex'].includes('placehold.co')) {
        portrait['elo-flex'] = tiers[Math.floor(Math.random() * tiers.length)];
    }
});

// Write back to file
fs.writeFileSync(portraitsPath, JSON.stringify(portraits, null, 4));
console.log('Updated all elo-soloq and elo-flex fields to tier words'); 