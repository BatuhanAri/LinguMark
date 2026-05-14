import fs from 'fs';
import https from 'https';

// We will read the oxford.js file, extract the JSON part and parse it.
const oxfordPath = './src/shared/oxford.js';
let oxfordContent = fs.readFileSync(oxfordPath, 'utf8');
oxfordContent = oxfordContent.replace('export const oxfordDictionary = ', '').trim();
if (oxfordContent.endsWith(';')) {
    oxfordContent = oxfordContent.slice(0, -1);
}

const dictionary = JSON.parse(oxfordContent);
const a2Words = dictionary.filter(w => w.level === 'A2');

console.log(`Total A2 words: ${a2Words.length}`);

async function fetchJson(url) {
    try {
        const res = await fetch(url, { headers: { 'User-Agent': 'LinguMark/1.0' } });
        if (!res.ok) {
            console.log(`Failed ${res.status}: ${url}`);
            return null;
        }
        return await res.json();
    } catch (e) {
        return null;
    }
}

async function fetchWordData(word) {
    const data = await fetchJson(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`);
    if (!data || !data[0]) return null;
    
    let example = '';
    const meanings = data[0].meanings;
    if (meanings && meanings.length > 0) {
        const defs = meanings[0].definitions;
        if (defs && defs.length > 0) {
            example = defs[0].example || '';
        }
    }
    return example ? true : false;
}

async function fetchWikiImage(word) {
    const data = await fetchJson(`https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(word)}&prop=pageimages&format=json&pithumbsize=400&origin=*`);
    if (!data) return false;
    const pages = data.query?.pages;
    if (pages) {
        const pageId = Object.keys(pages)[0];
        if (pageId !== "-1" && pages[pageId].thumbnail?.source) {
            return true;
        }
    }
    return false;
}

async function processWords() {
    const curatedIds = [];
    let count = 0;
    
    // We want exactly 240 words to have exactly 20 steps (240 / 12 = 20)
    const TARGET_COUNT = 240; 
    
    // Process in batches of 10 to not overwhelm APIs
    for (let i = 0; i < a2Words.length; i += 10) {
        const batch = a2Words.slice(i, i + 10);
        const promises = batch.map(async (w) => {
            if (curatedIds.length >= TARGET_COUNT) return null;
            
            const hasExample = await fetchWordData(w.word);
            if (!hasExample) return null;
            
            const hasImage = await fetchWikiImage(w.word);
            if (hasImage) {
                return w.id;
            }
            return null;
        });
        
        const results = await Promise.all(promises);
        for (const id of results) {
            if (id && curatedIds.length < TARGET_COUNT) {
                curatedIds.push(id);
                console.log(`Found ${curatedIds.length}/${TARGET_COUNT}: ${a2Words.find(w=>w.id===id).word}`);
            }
        }
        
        if (curatedIds.length >= TARGET_COUNT) break;
        
        // Small delay
        await new Promise(r => setTimeout(r, 200));
    }
    
    console.log('Finished processing.');
    console.log('Curated IDs:', curatedIds.length);
    fs.writeFileSync('curated_a2_ids.json', JSON.stringify(curatedIds, null, 2));
}

processWords();
