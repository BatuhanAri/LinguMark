import fs from 'fs';

const oxfordPath = './src/shared/oxford.js';
let oxfordContent = fs.readFileSync(oxfordPath, 'utf8');
oxfordContent = oxfordContent.replace('export const oxfordDictionary = ', '').trim();
if (oxfordContent.endsWith(';')) {
    oxfordContent = oxfordContent.slice(0, -1);
}

const dictionary = JSON.parse(oxfordContent);

const u1Words = ["bed", "bedroom", "house", "door", "window", "chair", "floor", "shower", "mother", "father", "sister", "daughter", "child", "boy", "man", "morning", "night", "name", "sleep", "mouth", "nose", "eye", "hand", "face"];
const u2Words = ["town", "village", "city", "street", "building", "car", "airport", "passport", "travel", "flight", "traffic", "police", "supermarket", "shopping", "umbrella", "person", "north", "year", "month", "August", "world", "mountain", "rain", "still"];
const u3Words = ["school", "university", "homework", "student", "writer", "pen", "report", "message", "business", "success", "news", "interest", "opinion", "question", "number", "minute", "model", "customer", "OK", "meeting", "conversation", "dialogue", "reading", "the"];
const u4Words = ["tea", "water", "beer", "wine", "meat", "chocolate", "ice cream", "cream", "breakfast", "meal", "bottle", "cup", "shirt", "trousers", "dress", "T-shirt", "watch", "brown", "green", "favourite", "please", "I", "must", "match"];
const u5Words = ["art", "music", "song", "piano", "film", "hobby", "party", "ball", "bird", "lion", "pig", "fish", "plant", "garden", "summer", "holiday", "sound", "hope", "last", "success", "question", "person", "name", "world"];

function getIds(words) {
    const ids = [];
    const used = new Set();
    for (const w of words) {
        const match = dictionary.find(x => x.word.toLowerCase() === w.toLowerCase() && x.level === 'A2');
        if (match && !used.has(match.id)) {
            ids.push(match.id);
            used.add(match.id);
        }
    }
    return ids;
}

const units = [
    { title: "Günlük Yaşam & Ev", icon: "🏠", ids: getIds(u1Words) },
    { title: "Şehir & Ulaşım", icon: "✈️", ids: getIds(u2Words) },
    { title: "Eğitim & İş", icon: "💼", ids: getIds(u3Words) },
    { title: "Gıda & Kıyafet", icon: "🍔", ids: getIds(u4Words) },
    { title: "Sosyal Yaşam & Hobi", icon: "🎨", ids: getIds(u5Words) }
];

const output = `export const curatedA2Units = ${JSON.stringify(units, null, 2)};`;

fs.writeFileSync('./src/dashboard/apps/fastpath_curated.js', output);
console.log("fastpath_curated.js updated with units.");
