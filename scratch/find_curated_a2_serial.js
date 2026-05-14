import fs from 'fs';
import https from 'https';

const oxfordPath = './src/shared/oxford.js';
let oxfordContent = fs.readFileSync(oxfordPath, 'utf8');
oxfordContent = oxfordContent.replace('export const oxfordDictionary = ', '').trim();
if (oxfordContent.endsWith(';')) {
    oxfordContent = oxfordContent.slice(0, -1);
}

const dictionary = JSON.parse(oxfordContent);
const a2Words = dictionary.filter(w => w.level === 'A2');
a2Words.sort(() => 0.5 - Math.random());

async function fetchJson(url) {
    while (true) {
        try {
            const res = await fetch(url, { headers: { 'User-Agent': 'LinguMark/1.0 (batuhan@example.com)' } });
            if (res.status === 429) {
                console.log(`Rate limited on ${url}, waiting 2 seconds...`);
                await new Promise(r => setTimeout(r, 2000));
                continue;
            }
            if (!res.ok) return null;
            return await res.json();
        } catch (e) {
            return null;
        }
    }
}

async function fetchWordData(word) {
    const data = await fetchJson(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`);
    if (!data || !data[0]) return false;
    
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
    const TARGET_COUNT = 120; // 10 steps
    let checked = 0;
    
    for (const w of a2Words) {
        if (curatedIds.length >= TARGET_COUNT) break;
        
        const hasExample = await fetchWordData(w.word);
        if (hasExample) {
            const hasImage = await fetchWikiImage(w.word);
            if (hasImage) {
                curatedIds.push(w.id);
                console.log(`[${curatedIds.length}/${TARGET_COUNT}] Validated: ${w.word}`);
            }
        }
        
        checked++;
        // Small delay to be polite
        await new Promise(r => setTimeout(r, 200));
    }
    
    console.log(`Finished processing. Checked ${checked} words.`);
    const outputContent = `export const curatedA2Ids = ${JSON.stringify(curatedIds, null, 2)};`;
    fs.writeFileSync('./src/dashboard/apps/fastpath_curated.js', outputContent);
    console.log('Successfully saved to fastpath_curated.js');
}

processWords();
