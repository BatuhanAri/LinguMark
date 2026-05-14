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
            const controller = new AbortController();
            const id = setTimeout(() => controller.abort(), 3000);
            const res = await fetch(url, { headers: { 'User-Agent': 'LinguMark/1.0 (batuhan@example.com)' }, signal: controller.signal });
            clearTimeout(id);
            if (res.status === 429) {
                // Wait 2 seconds and retry
                await new Promise(r => setTimeout(r, 2000));
                continue;
            }
            if (!res.ok) return null;
            return await res.json();
        } catch (e) {
            // timeout or network error, retry after 1s
            await new Promise(r => setTimeout(r, 1000));
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
    const TARGET_COUNT = 120; 
    let checked = 0;
    
    async function checkWord(w) {
        if (curatedIds.length >= TARGET_COUNT) return null;
        const hasExample = await fetchWordData(w.word);
        if (!hasExample) return null;
        const hasImage = await fetchWikiImage(w.word);
        if (!hasImage) return null;
        return w.id;
    }

    const concurrency = 3;
    let i = 0;
    while (i < a2Words.length && curatedIds.length < TARGET_COUNT) {
        const batch = a2Words.slice(i, i + concurrency);
        i += concurrency;
        
        const promises = batch.map(w => checkWord(w));
        const results = await Promise.all(promises);
        
        for (const id of results) {
            if (id && curatedIds.length < TARGET_COUNT) {
                curatedIds.push(id);
                console.log(`[${curatedIds.length}/${TARGET_COUNT}] Found ID: ${id}`);
            }
        }
        checked += batch.length;
        // console.log(`Checked ${checked} words so far...`);
    }
    
    console.log('Finished processing.');
    const outputContent = `export const curatedA2Ids = ${JSON.stringify(curatedIds, null, 2)};`;
    fs.writeFileSync('./src/dashboard/apps/fastpath_curated.js', outputContent);
    console.log('Successfully saved to fastpath_curated.js');
}

processWords();
