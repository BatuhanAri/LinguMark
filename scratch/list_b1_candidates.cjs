const fs = require('fs');
const path = require('path');

const oxfordJS = fs.readFileSync(path.join(__dirname, '..', 'src', 'shared', 'oxford.js'), 'utf8');
const match = oxfordJS.match(/export const oxfordDictionary = (\[[\s\S]*\]);\s*$/);
if (!match) {
    console.error('Could not parse oxfordDictionary from oxford.js');
    process.exit(1);
}

const dict = JSON.parse(match[1]);
const b1Words = dict.filter(w => w.level === 'B1');

console.log(`Total B1 words in JS dictionary: ${b1Words.length}`);

// Let's filter out short words (< 3 chars) or words that are typical prepositions/conjunctions
const skipList = new Set([
    'and', 'but', 'or', 'so', 'because', 'if', 'when', 'where', 'which', 'who', 'why', 'how', 'what', 'that', 'than',
    'about', 'above', 'across', 'after', 'at', 'before', 'behind', 'below', 'between', 'by', 'during', 'for', 'from',
    'in', 'into', 'of', 'off', 'on', 'out', 'over', 'through', 'to', 'under', 'until', 'up', 'with', 'without'
]);

const candidates = b1Words.filter(w => {
    const word = w.word.toLowerCase();
    if (word.length <= 2) return false;
    if (skipList.has(word)) return false;
    return true;
});

console.log(`Candidate B1 words after filtering: ${candidates.length}`);

// Write candidates to a JSON file for inspection/processing
fs.writeFileSync(path.join(__dirname, 'b1_candidates.json'), JSON.stringify(candidates, null, 2), 'utf8');
console.log('Wrote candidate list to scratch/b1_candidates.json');
