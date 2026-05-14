import fs from 'fs';

const oxfordPath = './src/shared/oxford.js';
let oxfordContent = fs.readFileSync(oxfordPath, 'utf8');
oxfordContent = oxfordContent.replace('export const oxfordDictionary = ', '').trim();
if (oxfordContent.endsWith(';')) {
    oxfordContent = oxfordContent.slice(0, -1);
}

const dictionary = JSON.parse(oxfordContent);
const a2Words = dictionary.filter(w => w.level === 'A2');

const visualWords = [
    "actor", "adult", "airport", "animal", "apartment", "apple", "arm", "art", "artist", "autumn", 
    "baby", "bag", "ball", "banana", "band", "bank", "bath", "bathroom", "beach", "bear", 
    "bed", "bedroom", "beer", "bird", "blood", "boat", "body", "bone", "book", "boot", 
    "bottle", "bottom", "box", "boy", "brain", "bread", "bridge", "brother", "bus", "butter", 
    "button", "camera", "camp", "car", "card", "cat", "chair", "cheese", "chicken", "child", 
    "church", "circle", "city", "class", "clock", "cloud", "club", "coat", "coffee", "college", 
    "computer", "corner", "country", "cow", "cross", "cup", "dad", "dance", "daughter", "day", 
    "desk", "dinner", "doctor", "dog", "door", "dress", "driver", "ear", "earth", "egg", 
    "elephant", "energy", "engine", "eye", "face", "factory", "family", "farm", "farmer", "father", 
    "finger", "fire", "fish", "floor", "flower", "food", "foot", "forest", "fork", "friend", 
    "fruit", "game", "garden", "gas", "girl", "glass", "gold", "grandfather", "grandmother", "grass", 
    "group", "guitar", "hair", "hand", "hat", "head", "heart", "hole", "holiday", "home", 
    "horse", "hospital", "hotel", "house", "husband", "ice", "idea", "island", "job", "juice", 
    "key", "king", "kitchen", "knife", "lake", "language", "leg", "letter", "library", "light", 
    "line", "lion", "lip", "list", "machine", "magazine", "man", "map", "market", "meat", 
    "medicine", "metal", "milk", "money", "monkey", "month", "moon", "morning", "mother", "mountain", 
    "mouse", "mouth", "movie", "museum", "music", "name", "nature", "neck", "newspaper", "night", 
    "noise", "nose", "number", "ocean", "office", "oil", "orange", "page", "paint", "paper", 
    "park", "part", "party", "pen", "pencil", "person", "phone", "photo", "picture", "pig", 
    "pizza", "place", "plane", "plant", "plastic", "plate", "player", "pocket", "police", "pool", 
    "post", "potato", "price", "queen", "question", "radio", "rain", "restaurant", "rice", "ring", 
    "river", "road", "rock", "roof", "room", "rose", "rule", "salad", "salt", "school", 
    "sea", "season", "seed", "sentence", "shape", "sheep", "ship", "shirt", "shoe", "shop", 
    "shoulder", "shower", "sign", "sister", "size", "skin", "skirt", "sky", "sleep", "smile", 
    "smoke", "snow", "soap", "sock", "son", "song", "sound", "soup", "space", "spoon", 
    "sport", "spring", "square", "star", "station", "stomach", "store", "storm", "story", "street", 
    "student", "sugar", "summer", "sun", "table", "tea", "teacher", "team", "teeth", "television", 
    "test", "theatre", "ticket", "time", "toe", "tomato", "tongue", "tool", "tooth", "town", 
    "toy", "train", "tree", "truck", "uncle", "university", "vacation", "valley", "village", "voice", 
    "wall", "water", "way", "weather", "week", "weight", "wheel", "wife", "wind", "window", 
    "wine", "winter", "woman", "wood", "word", "world", "year", "zoo"
];

const selectedIds = [];
const selectedWords = new Set();

// First add matching visual words
for (const vw of visualWords) {
    const match = a2Words.find(w => w.word.toLowerCase() === vw.toLowerCase());
    if (match && !selectedWords.has(match.word)) {
        selectedIds.push(match.id);
        selectedWords.add(match.word);
    }
}

// If we have less than 240, fill the rest randomly
for (const w of a2Words) {
    if (selectedIds.length >= 240) break;
    if (!selectedWords.has(w.word)) {
        selectedIds.push(w.id);
        selectedWords.add(w.word);
    }
}

// Slice to exactly 240
const finalIds = selectedIds.slice(0, 240);

const outputContent = `export const curatedA2Ids = ${JSON.stringify(finalIds, null, 2)};`;

fs.writeFileSync('./src/dashboard/apps/fastpath_curated.js', outputContent);
console.log('Successfully generated fastpath_curated.js with 240 items.');
