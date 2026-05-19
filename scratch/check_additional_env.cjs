const fs = require('fs');
const path = require('path');

const candidates = JSON.parse(fs.readFileSync(path.join(__dirname, 'b1_candidates.json'), 'utf8'));
const candidateMap = new Map();
candidates.forEach(c => {
    candidateMap.set(c.word.toLowerCase(), c);
});

const testWords = [
    'dirt', 'dust', 'earth', 'heat', 'ice', 'lightning', 'metal', 'mountain', 'mud', 'ocean',
    'plastic', 'pollution', 'sand', 'smoke', 'soil', 'wave', 'wood', 'valley', 'waterfall',
    'wild', 'wildlife', 'agricultural', 'agriculture', 'rural', 'urban', 'geography', 'globe',
    'chemical', 'physics', 'battery', 'electricity', 'solar', 'wind'
];

console.log('Testing additional natural/env words in B1 candidates:');
testWords.forEach(w => {
    if (candidateMap.has(w)) {
        console.log(`- ${w} (${candidateMap.get(w).meanings.tr})`);
    }
});
