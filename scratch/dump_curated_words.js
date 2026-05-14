import fs from 'fs';

const oxfordPath = './src/shared/oxford.js';
let oxfordContent = fs.readFileSync(oxfordPath, 'utf8');
oxfordContent = oxfordContent.replace('export const oxfordDictionary = ', '').trim();
if (oxfordContent.endsWith(';')) {
    oxfordContent = oxfordContent.slice(0, -1);
}

const dictionary = JSON.parse(oxfordContent);

import { curatedA2Ids } from '../src/dashboard/apps/fastpath_curated.js';

const words = curatedA2Ids.map(id => {
    const w = dictionary.find(x => x.id === id);
    return w ? w.word : id;
});

console.log(words.join(', '));
