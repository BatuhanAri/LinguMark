const fs = require('fs');
const path = require('path');

const oxfordWords = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'oxford_words.json'), 'utf8'));

console.log('Oxford Words levels and counts:');
for (const [level, words] of Object.entries(oxfordWords)) {
  console.log(`${level}: ${words.length} words`);
}

const oxfordJS = fs.readFileSync(path.join(__dirname, '..', 'src', 'shared', 'oxford.js'), 'utf8');
const match = oxfordJS.match(/export const oxfordDictionary = (\[[\s\S]*\]);\s*$/);
if (match) {
  const dict = JSON.parse(match[1]);
  console.log('\nOxford JS Dictionary levels and counts:');
  const counts = {};
  dict.forEach(w => {
    counts[w.level] = (counts[w.level] || 0) + 1;
  });
  console.log(counts);
}
