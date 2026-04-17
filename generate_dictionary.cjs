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
    console.log(`Failed translating ${word} to ${targetLang} (Rate Limit Hit!)`);
    return word; // Fallback to english if banned
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
      const meanings = {};
      
      // Translate sequentially to avoid 429 Too Many Requests IP Ban (50,000 requests total)
      for (const lang of langs) {
         meanings[lang] = await translateWord(word, lang);
         await new Promise(r => setTimeout(r, 200)); // 200ms per api call
      }

      finalDictionary.push({
        id: `ox-${level.toLowerCase()}-${idx++}`,
        word: word,
        level: level,
        isOxford: true,
        meanings: meanings
      });
      
      if (idx % 50 === 0) {
          console.log(`  [${level}] Translated ${idx}/${words.length} words...`);
          // Save incrementally just in case
          const output = `export const oxfordDictionary = ${JSON.stringify(finalDictionary, null, 2)};\n`;
          fs.writeFileSync(outFile, output, 'utf8');
      }
    }
  }

  const output = `export const oxfordDictionary = ${JSON.stringify(finalDictionary, null, 2)};\n`;
  fs.writeFileSync(outFile, output, 'utf8');
  console.log(`✅ Dictionary Generation Complete! Successfully wrote ${finalDictionary.length} words to src/shared/oxford.js`);
}

start();
