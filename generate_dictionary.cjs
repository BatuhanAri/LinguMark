const fs = require('fs');
const path = require('path');

// Google Translate GTX endpoint (Free, Unofficial)
async function translateWord(word, targetLang) {
  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=${targetLang}&dt=t&q=${encodeURIComponent(word)}`;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error('API Error');
    const data = await res.json();
    return data[0][0][0] || word;
  } catch (err) {
    console.log(`Failed translating ${word} to ${targetLang}`);
    return word; // Fallback
  }
}

async function start() {
  const wordsFile = path.join(__dirname, 'oxford_words.json');
  const outFile = path.join(__dirname, 'src', 'shared', 'oxford.js');

  console.log('Reading oxford_words.json...');
  const wordLevels = JSON.parse(fs.readFileSync(wordsFile, 'utf8'));
  const langs = ['tr', 'es', 'fr', 'de', 'it'];
  
  const finalDictionary = [];
  
  for (const [level, words] of Object.entries(wordLevels)) {
    console.log(`Processing Level ${level}... (${words.length} words)`);
    let idx = 1;
    for (const word of words) {
      console.log(`  Translating [${level}] ${word}...`);
      const meanings = {};
      
      // Translate concurrently for speed, but add slight delay between words to prevent ban
      await Promise.all(langs.map(async (lang) => {
        meanings[lang] = await translateWord(word, lang);
      }));

      finalDictionary.push({
        id: `ox-${level.toLowerCase()}-${idx++}`,
        word: word,
        level: level,
        isOxford: true,
        meanings: meanings
      });
      // 100ms delay to respect rate limit
      await new Promise(r => setTimeout(r, 100));
    }
  }

  // Format array into JS module
  const output = `export const oxfordDictionary = ${JSON.stringify(finalDictionary, null, 2)};\n`;
  fs.writeFileSync(outFile, output, 'utf8');
  console.log(`✅ Dictionary Generation Complete! Successfully wrote ${finalDictionary.length} words to src/shared/oxford.js`);
  console.log(`To add 5000 words, just fill 'oxford_words.json' and run 'npm run generate' again!`);
}

start();
