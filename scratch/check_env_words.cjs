const fs = require('fs');
const path = require('path');

const candidates = JSON.parse(fs.readFileSync(path.join(__dirname, 'b1_candidates.json'), 'utf8'));
const candidateMap = new Map();
candidates.forEach(c => {
    candidateMap.set(c.word.toLowerCase(), c);
});

const testWords = [
    'acid', 'carbon', 'coal', 'conservation', 'damage', 'disaster', 'electricity', 'emission', 'energy',
    'fuel', 'gas', 'global', 'greenhouse', 'nuclear', 'oxygen', 'ozone', 'petrol', 'planet', 'pollution',
    'power', 'recycle', 'resource', 'solar', 'waste', 'wind',
    'climate', 'atmosphere', 'temperature', 'season', 'weather', 'extinct', 'habitat', 'organic',
    'chemical', 'ecology', 'effect', 'preserve', 'protect', 'threat', 'natural'
];

console.log('Testing environment words in B1 candidates:');
testWords.forEach(w => {
    console.log(`${w}: ${candidateMap.has(w) ? 'YES' : 'NO'}`);
});

console.log('\nSearching for other B1 candidates containing env/earth/energy/nature meanings:');
const matches = candidates.filter(c => {
    const tr = (c.meanings.tr || '').toLowerCase();
    const word = c.word.toLowerCase();
    return tr.includes('çevre') || tr.includes('doğa') || tr.includes('enerji') || tr.includes('dünya') || tr.includes('gaz') || tr.includes('hava') || tr.includes('orman');
});

console.log(`Found ${matches.length} matching candidates:`);
matches.forEach(m => console.log(`- ${m.word} (${m.meanings.tr})`));
