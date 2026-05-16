/**
 * A2 kelime seçimi scripti
 * Oxford A2 listesinden flashcard'a uygun 360 kelime seçer ve 15 üniteye ayırır
 * Çalıştır: node scratch/select_a2_words.cjs
 */
const fs = require('fs');
const path = require('path');

const oxfordWords = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'oxford_words.json'), 'utf8'));
const a2Words = oxfordWords.A2;

// Flashcard'a uygun olmayan fonksiyon kelimeleri (zamirler, edatlar, bağlaçlar, vb.)
const SKIP_WORDS = new Set([
    // Zamirler
    'I', 'me', 'my', 'you', 'your', 'yourself', 'he', 'him', 'his', 'she', 'her',
    'it', 'its', 'we', 'us', 'our', 'they', 'them', 'their',
    // Edatlar
    'about', 'above', 'across', 'after', 'at', 'before', 'behind', 'below', 'between',
    'by', 'during', 'for', 'from', 'in', 'into', 'of', 'off', 'on', 'out', 'over',
    'through', 'to', 'under', 'until', 'up', 'with', 'without',
    // Bağlaçlar
    'and', 'but', 'or', 'so', 'because', 'if', 'when', 'where', 'which', 'who',
    'why', 'how', 'what', 'that', 'than',
    // Zarflar/Belirteçler (çok soyut)
    'also', 'always', 'already', 'again', 'any', 'anyone', 'anything', 'as',
    'away', 'both', 'can', 'cannot', 'could', 'do', 'each', 'else', 'enough',
    'even', 'ever', 'every', 'everybody', 'everyone', 'everything', 'have',
    'have to', 'here', 'however', 'just', 'let', 'more', 'most', 'much',
    'must', 'not', 'no', 'no one', 'nobody', 'nothing', 'now', 'often',
    'once', 'only', 'other', 'quite', 'really', 'should', 'some', 'somebody',
    'someone', 'something', 'sometimes', 'still', 'such', 'the', 'then',
    'there', 'this', 'too', 'very', 'well', 'will', 'would',
    // Tepkiler/Ünlemler
    'oh', 'OK', 'yeah', 'yes', 'no', 'bye', 'hello', 'hey', 'hi', 'please',
    'sorry', 'thanks', 'thank', 'dear', 'welcome', 'goodbye', 'sure',
    // Sayılar  
    'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten',
    'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen',
    'eighteen', 'nineteen', 'twenty', 'thirty', 'forty', 'fifty', 'sixty',
    'seventy', 'eighty', 'ninety', 'hundred', 'thousand', 'million',
    'first', 'second', 'third', 'fourth', 'fifth',
    // Aylar
    'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August',
    'September', 'October', 'November', 'December',
    // Günler
    'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday',
    // Çok basit/soyut
    'be', 'go', 'get', 'make', 'come', 'give', 'take', 'put', 'see', 'say',
    'know', 'think', 'look', 'want', 'tell', 'find', 'need', 'back',
    'down', 'all', 'another', 'few', 'lot', 'many',
    // Tekrar/eşanlamlı
    'DVD', 'CD', 'TV', "o'clock",
    // Boolean
    'TRUE', 'FALSE',
    // Soyut zamirler  
    'ago',
]);

const filtered = a2Words.filter(w => !SKIP_WORDS.has(w));

console.log(`Total A2: ${a2Words.length}`);
console.log(`After filter: ${filtered.length}`);

// Tematik ünitelere ayır
const units = {
    'Ev & Günlük Yaşam': ['apartment', 'bathroom', 'bedroom', 'bed', 'chair', 'clock', 'door', 'flat', 'floor', 'garden', 'house', 'key', 'kitchen', 'upstairs', 'light', 'room', 'shower', 'table', 'toilet', 'wall', 'window', 'clean', 'wash', 'bath'],
    'Aile & İlişkiler': ['baby', 'boy', 'girl', 'man', 'woman', 'child', 'adult', 'brother', 'sister', 'mother', 'father', 'daughter', 'son', 'aunt', 'uncle', 'cousin', 'grandfather', 'grandmother', 'grandparent', 'husband', 'wife', 'boyfriend', 'girlfriend', 'friend'],
    'Yiyecek & İçecek': ['apple', 'banana', 'bread', 'butter', 'cake', 'carrot', 'cheese', 'chicken', 'chocolate', 'coffee', 'cream', 'egg', 'fish', 'food', 'fruit', 'juice', 'meal', 'meat', 'milk', 'onion', 'orange', 'pepper', 'potato', 'rice'],
    'Yemek & Mutfak': ['beer', 'bottle', 'tomato', 'breakfast', 'cook', 'cooking', 'cup', 'delicious', 'diet', 'dinner', 'dish', 'drink', 'eat', 'glass', 'hungry', 'ice', 'ice cream', 'lunch', 'menu', 'restaurant', 'salad', 'salt', 'sandwich', 'sugar'],
    'Giyim & Görünüm': ['bag', 'black', 'blonde', 'blue', 'boot', 'brown', 'clothes', 'coat', 'colour', 'dress', 'green', 'grey', 'hat', 'jacket', 'jeans', 'pink', 'purple', 'red', 'shirt', 'shoe', 'skirt', 'sweater', 'trousers', 'T-shirt'],
    'Vücut & Sağlık': ['arm', 'body', 'ear', 'eye', 'face', 'foot', 'hair', 'hand', 'head', 'leg', 'mouth', 'nose', 'tooth', 'health', 'healthy', 'hospital', 'doctor', 'nurse', 'sick', 'fat', 'tall', 'short', 'strong', 'young'],
    'Şehir & Ulaşım': ['airport', 'bicycle', 'bike', 'boat', 'building', 'bus', 'car', 'city', 'drive', 'driver', 'flight', 'map', 'park', 'plane', 'road', 'station', 'stop', 'street', 'taxi', 'ticket', 'town', 'traffic', 'train', 'travel'],
    'Doğa & Hava Durumu': ['air', 'animal', 'beach', 'bird', 'cat', 'cow', 'dog', 'elephant', 'farm', 'farmer', 'flower', 'horse', 'island', 'lion', 'mountain', 'mouse', 'plant', 'rain', 'river', 'sea', 'sheep', 'snake', 'snow', 'tree'],
    'Hava & Mevsimler': ['autumn', 'beautiful', 'umbrella', 'cold', 'cool', 'dark', 'fire', 'hot', 'land', 'natural', 'north', 'south', 'east', 'west', 'spring', 'summer', 'sun', 'warm', 'water', 'weather', 'vegetable', 'winter', 'village', 'country'],
    'Eğitim & Öğrenme': ['book', 'class', 'classroom', 'college', 'computer', 'correct', 'describe', 'dictionary', 'difficult', 'easy', 'exam', 'example', 'exercise', 'homework', 'language', 'learn', 'lesson', 'library', 'page', 'pen', 'pencil', 'read', 'school', 'student'],
    'İş & Kariyer': ['bill', 'worker', 'business', 'busy', 'career', 'cent', 'company', 'complete', 'cost', 'customer', 'dollar', 'euro', 'expensive', 'cheap', 'free', 'job', 'machine', 'meeting', 'money', 'office', 'pay', 'pound', 'price', 'sell'],
    'Hobiler & Eğlence': ['art', 'artist', 'ball', 'band', 'camera', 'cinema', 'concert', 'dance', 'dancer', 'dancing', 'film', 'football', 'fun', 'funny', 'game', 'guitar', 'gym', 'hobby', 'movie', 'music', 'piano', 'play', 'player', 'sport'],
    'İletişim & Teknoloji': ['address', 'answer', 'article', 'blog', 'call', 'card', 'conversation', 'email', 'form', 'Internet', 'interview', 'letter', 'magazine', 'message', 'newspaper', 'note', 'opinion', 'phone', 'photo', 'photograph', 'question', 'radio', 'telephone', 'website'],
    'Duygular & Kişilik': ['afraid', 'amazing', 'angry', 'bad', 'bored', 'boring', 'dangerous', 'excited', 'exciting', 'fantastic', 'favourite', 'feeling', 'friendly', 'good', 'great', 'happy', 'hate', 'hope', 'imagine', 'important', 'interested', 'interesting', 'kind', 'love'],
    'Eylemler & Günlük Rutinler': ['add', 'agree', 'arrive', 'begin', 'believe', 'bring', 'build', 'buy', 'carry', 'change', 'choose', 'climb', 'close', 'compare', 'create', 'cut', 'decide', 'die', 'draw', 'enjoy', 'explain', 'fall', 'feel', 'fill'],
};

// Kullanılan kelimeleri takip et
const used = new Set();
for (const words of Object.values(units)) {
    words.forEach(w => used.add(w));
}

console.log(`\nManually assigned: ${used.size}`);
console.log(`Remaining available: ${filtered.filter(w => !used.has(w)).length}`);

// Kalan kelimeleri göster
const remaining = filtered.filter(w => !used.has(w));
console.log('\nRemaining words:');
remaining.forEach(w => console.log(`  ${w}`));

// JSON çıktısı oluştur — oxford.js'deki çevirileri kullanarak
const oxfordJS = fs.readFileSync(path.join(__dirname, '..', 'src', 'shared', 'oxford.js'), 'utf8');
const match = oxfordJS.match(/export const oxfordDictionary = (\[[\s\S]*\]);\s*$/);
const dict = JSON.parse(match[1]);

const output = {
    version: 1,
    level: 'A2',
    totalWords: 0,
    units: []
};

let wordCount = 0;
for (const [title, words] of Object.entries(units)) {
    const unitWords = words.map(w => {
        const entry = dict.find(d => d.word.toLowerCase() === w.toLowerCase() && d.level === 'A2');
        if (!entry) {
            console.warn(`WARNING: "${w}" not found in oxford dictionary!`);
            return null;
        }
        wordCount++;
        return {
            id: `a2_${String(wordCount).padStart(3, '0')}`,
            word: entry.word,
            meanings: entry.meanings,
            example: '',
            image: `${entry.word.toLowerCase().replace(/[^a-z0-9]/g, '-')}.webp`,
            pos: ''
        };
    }).filter(Boolean);
    
    const icon = {
        'Ev & Günlük Yaşam': '🏠', 'Aile & İlişkiler': '👨‍👩‍👧‍👦', 'Yiyecek & İçecek': '🍎',
        'Yemek & Mutfak': '🍳', 'Giyim & Görünüm': '👔', 'Vücut & Sağlık': '🏥',
        'Şehir & Ulaşım': '🚌', 'Doğa & Hava Durumu': '🌿', 'Hava & Mevsimler': '🌦️',
        'Eğitim & Öğrenme': '📚', 'İş & Kariyer': '💼', 'Hobiler & Eğlence': '🎮',
        'İletişim & Teknoloji': '📱', 'Duygular & Kişilik': '😊', 'Eylemler & Günlük Rutinler': '🏃',
    }[title] || '📦';

    output.units.push({
        id: title.toLowerCase().replace(/[^a-zğüşıöç0-9]/gi, '-').replace(/-+/g, '-'),
        title,
        icon,
        words: unitWords
    });
}

output.totalWords = wordCount;

fs.writeFileSync(
    path.join(__dirname, '..', 'public', 'data', 'fastpath_a2.json'),
    JSON.stringify(output, null, 2),
    'utf8'
);

console.log(`\n✅ Generated fastpath_a2.json with ${wordCount} words in ${output.units.length} units`);
