const fs = require('fs');
const path = require('path');

const candidates = JSON.parse(fs.readFileSync(path.join(__dirname, 'b1_candidates.json'), 'utf8'));

const icons = {
    'Ev & Günlük Yaşam': '🏠',
    'Aile & İlişkiler': '👨‍👩‍👧‍👦',
    'Yiyecek & İçecek': '🍎',
    'Yemek & Mutfak': '🍳',
    'Giyim & Görünüm': '👔',
    'Vücut & Sağlık': '🏥',
    'Şehir & Ulaşım': '🚌',
    'Doğa & Hava Durumu': '🌿',
    'Çevre & Enerji': '🌿',
    'Eğitim & Öğrenme': '📚',
    'İş & Kariyer': '💼',
    'Hobiler & Eğlence': '🎮',
    'İletişim & Teknoloji': '📱',
    'Duygular & Kişilik': '😊',
    'Eylemler & Günlük Rutinler': '🏃'
};

// Convert candidates to map for quick checks
const candidateMap = new Map();
candidates.forEach(c => {
    candidateMap.set(c.word.toLowerCase(), c);
});

// Definitions of categories and their search keywords
const categoryKeywords = {
    'Ev & Günlük Yaşam': {
        eng: ['accommodation', 'appliance', 'balcony', 'blanket', 'cabinet', 'candle', 'carpet', 'ceiling', 'chest', 'curtain', 'cushion', 'desk', 'drawer', 'dust', 'fence', 'furniture', 'household', 'laundry', 'mirror', 'neighbour', 'pillow', 'property', 'rent', 'repair', 'rubbish', 'sheet', 'shelf', 'sink', 'tap', 'tidy', 'tub', 'vase', 'home', 'house', 'room', 'apartment', 'flat', 'neighbor', 'rent', 'cleaning', 'clock'],
        tr: ['ev', 'oda', 'kira', 'apartman', 'mobilya', 'mutfak', 'banyo', 'zemin', 'duvar', 'bahçe', 'komşu', 'çatı', 'yatak', 'dolap', 'halı', 'perde', 'anahtar', 'kilitlemek', 'tamir', 'temizlik', 'çöp', 'toz', 'çamaşır', 'saat']
    },
    'Aile & İlişkiler': {
        eng: ['adopt', 'ancestor', 'anniversary', 'bride', 'groom', 'couple', 'divorce', 'engage', 'generation', 'grow up', 'guest', 'infant', 'inherit', 'marriage', 'marry', 'nephew', 'niece', 'parent', 'partner', 'relative', 'single', 'spouse', 'twin', 'wedding', 'widow', 'youth', 'behavior', 'celebrate', 'ceremony', 'character', 'childhood', 'citizen', 'community', 'crowd', 'female', 'friendship', 'gender', 'guy', 'human', 'individual', 'kid', 'male', 'minority', 'population', 'public', 'relation', 'relationship', 'sex', 'sexual', 'social', 'society', 'stranger'],
        tr: ['aile', 'ebeveyn', 'anne', 'baba', 'kardeş', 'çocuk', 'oğul', 'kız', 'bebek', 'genç', 'akraba', 'evlilik', 'düğün', 'evlen', 'boşan', 'nişan', 'yıldönümü', 'konuk', 'misafir', 'ortak', 'ikiz', 'gelin', 'damat', 'eş', 'dul', 'nesil', 'kuşak', 'ata', 'kuzen', 'yeğen', 'arkadaş', 'dost', 'ilişki', 'sevgi', 'aşk']
    },
    'Yiyecek & İçecek': {
        eng: ['alcohol', 'bake', 'bean', 'beef', 'biscuit', 'bitter', 'boil', 'cabbage', 'cocoa', 'cream', 'cucumber', 'dairy', 'dessert', 'flour', 'garlic', 'grape', 'honey', 'ingredient', 'lemon', 'loaf', 'melon', 'nut', 'oil', 'onion', 'peach', 'pear', 'plum', 'pork', 'raw', 'recipe', 'salad', 'spice', 'sour', 'sweet', 'tasty', 'wheat', 'food', 'drink', 'beverage', 'water', 'milk', 'tea', 'coffee', 'wine', 'beer', 'juice', 'apple', 'banana', 'orange', 'fruit', 'vegetable', 'tomato', 'potato', 'soup', 'sugar', 'salt', 'chocolate', 'cheese', 'butter'],
        tr: ['yemek', 'yiyecek', 'içecek', 'su', 'süt', 'çay', 'kahve', 'şarap', 'bira', 'alkol', 'meyve suyu', 'ekmek', 'et', 'tavuk', 'balık', 'sebze', 'meyve', 'elma', 'muz', 'portakal', 'üzüm', 'limon', 'şeftali', 'armut', 'domates', 'patates', 'soğan', 'sarımsak', 'fasulye', 'salata', 'çorba', 'şeker', 'tuz', 'bal', 'tatlı', 'ekşi', 'acı', 'çikolata', 'peynir', 'tereyağı']
    },
    'Yemek & Mutfak': {
        eng: ['bowl', 'cooker', 'cupboard', 'dish', 'fork', 'frying pan', 'glass', 'grill', 'kettle', 'knife', 'microwave', 'napkin', 'oven', 'pan', 'plate', 'pot', 'refrigerator', 'saucepan', 'spoon', 'stove', 'tablecloth', 'toaster', 'tray', 'chef', 'canteen', 'consume', 'flavour', 'freeze', 'fry', 'taste', 'tasty', 'waiter', 'waitress', 'bite', 'feed', 'sauce', 'serve', 'service', 'slice', 'snack', 'cured', 'kitchen', 'restaurant', 'breakfast', 'lunch', 'dinner', 'cooking'],
        tr: ['mutfak', 'pişir', 'şef', 'tarif', 'fırın', 'ocak', 'tava', 'tencere', 'tabak', 'kase', 'bardak', 'kaşık', 'çatal', 'bıçak', 'peçete', 'tepsi', 'garson', 'menü', 'kantin', 'lokanta', 'restoran', 'kahvaltı', 'öğle yemeği', 'akşam yemeği']
    },
    'Giyim & Görünüm': {
        eng: ['apron', 'belt', 'blouse', 'boot', 'button', 'cap', 'collar', 'costume', 'cotton', 'earring', 'fashion', 'glove', 'handbag', 'jewellery', 'leather', 'makeup', 'necklace', 'pocket', 'purse', 'ring', 'scarf', 'silk', 'sleeve', 'suit', 'tie', 'umbrella', 'underwear', 'wool', 'zipper', 'clothing', 'dress', 'wear', 'shirt', 'pants', 'skirt', 'coat', 'jacket', 'sock', 'hat', 'bag', 'appearance', 'look', 'style'],
        tr: ['giyim', 'elbise', 'giy', 'gömlek', 'pantolon', 'etek', 'palto', 'ceket', 'kravat', 'ayakkabı', 'bot', 'çorap', 'şapka', 'eldiven', 'atkı', 'kemer', 'düğme', 'cep', 'kol', 'yaka', 'şemsiye', 'çanta', 'cüzdan', 'makyaj', 'mücevher', 'yüzük', 'kolye', 'küpe', 'saat', 'pamuk', 'yün', 'ipek', 'deri', 'moda', 'görünüş', 'tarz']
    },
    'Vücut & Sağlık': {
        eng: ['ache', 'allergy', 'ankle', 'bandage', 'bleed', 'blind', 'blood', 'brain', 'breath', 'breathe', 'chest', 'chin', 'cure', 'deaf', 'dentist', 'disease', 'dizzy', 'elbow', 'fever', 'fit', 'flu', 'forehead', 'illness', 'injury', 'knee', 'liver', 'lung', 'muscle', 'neck', 'pain', 'patient', 'pill', 'shoulder', 'skin', 'stomach', 'throat', 'thumb', 'toe', 'treatment', 'vein', 'wound', 'wrist', 'body', 'health', 'medical', 'medicine', 'doctor', 'nurse', 'hospital', 'clinic', 'face', 'eye', 'ear', 'nose', 'mouth', 'lip', 'tooth', 'arm', 'hand', 'finger', 'leg', 'foot'],
        tr: ['vücut', 'beden', 'sağlık', 'tıbbi', 'ilaç', 'doktor', 'hemşire', 'hastane', 'klinik', 'diş hekimi', 'hasta', 'tedavi', 'hap', 'hastalık', 'ağrı', 'acı', 'yara', 'yaralanma', 'kan', 'kanama', 'kemik', 'kas', 'beyin', 'kalp', 'deri', 'cilt', 'yüz', 'göz', 'kulak', 'burun', 'ağız', 'dudak', 'diş', 'boğaz', 'boyun', 'omuz', 'kol', 'el', 'parmak', 'bacak', 'ayak', 'diz', 'göğüs', 'mide']
    },
    'Şehir & Ulaşım': {
        eng: ['abroad', 'accident', 'airport', 'ambulance', 'aviation', 'baggage', 'bicycle', 'border', 'bridge', 'cabin', 'canal', 'carriage', 'customs', 'delay', 'departure', 'destination', 'fare', 'flight', 'harbour', 'highway', 'journey', 'luggage', 'metro', 'motorcycle', 'passenger', 'passport', 'pedestrian', 'platform', 'railway', 'route', 'subway', 'ticket', 'tourism', 'tourist', 'traffic', 'train', 'transport', 'travel', 'tunnel', 'vehicle', 'voyage', 'city', 'town', 'street', 'road', 'map', 'car', 'bus', 'plane', 'taxi', 'boat', 'ship', 'hotel'],
        tr: ['şehir', 'kasaba', 'sokak', 'yol', 'harita', 'trafik', 'ulaşım', 'seyahat', 'yolculuk', 'bilet', 'yolcu', 'sürücü', 'taşıt', 'araç', 'araba', 'otobüs', 'tren', 'uçak', 'uçuş', 'havalimanı', 'istasyon', 'metro', 'bisiklet', 'motosiklet', 'taksi', 'tekne', 'gemi', 'köprü', 'tünel', 'otoyol', 'sınır', 'gümrük', 'bagaj', 'pasaport', 'otel', 'hedef']
    },
    'Doğa & Hava Durumu': {
        eng: ['agriculture', 'animal', 'atmosphere', 'bay', 'beach', 'beast', 'bush', 'cave', 'climate', 'coast', 'continent', 'creature', 'crop', 'desert', 'earthquake', 'environment', 'flood', 'flower', 'forest', 'grass', 'hill', 'hurricane', 'insect', 'island', 'jungle', 'lake', 'landscape', 'mountain', 'nature', 'ocean', 'path', 'plain', 'plant', 'river', 'sea', 'soil', 'species', 'stone', 'storm', 'stream', 'valley', 'volcano', 'waterfall', 'wave', 'wild', 'wildlife', 'wood', 'earth', 'land', 'world', 'tree', 'leaf', 'seed', 'rock', 'bird', 'fish', 'sky', 'sun', 'moon', 'star', 'space'],
        tr: ['doğa', 'doğal', 'dünya', 'toprak', 'kara', 'dağ', 'tepe', 'vadi', 'ova', 'orman', 'ağaç', 'bitki', 'çiçek', 'ot', 'çimen', 'yaprak', 'tohum', 'taş', 'kaya', 'mağara', 'nehir', 'dere', 'göl', 'deniz', 'okyanus', 'körfez', 'kıyı', 'sahil', 'kumsal', 'ada', 'şelale', 'dalga', 'hayvan', 'vahşi', 'yaban', 'kuş', 'balık', 'böcek', 'gökyüzü', 'güneş', 'ay', 'yıldız', 'uzay']
    },
    'Çevre & Enerji': {
        eng: ['acid', 'carbon', 'coal', 'conservation', 'damage', 'disaster', 'electricity', 'emission', 'energy', 'fuel', 'gas', 'global', 'greenhouse', 'nuclear', 'oxygen', 'ozone', 'petrol', 'planet', 'pollution', 'power', 'recycle', 'resource', 'solar', 'waste', 'wind', 'climate', 'atmosphere', 'temperature', 'season', 'weather', 'extinct', 'habitat', 'organic', 'chemical', 'ecology', 'effect', 'preserve', 'protect', 'threat', 'natural', 'battery', 'dirt', 'earth', 'heat', 'ice', 'lightning', 'metal', 'ocean', 'plastic', 'sand', 'smoke', 'valley', 'waterfall', 'wildlife', 'geography', 'environment', 'environmental', 'surround', 'rain', 'snow', 'storm', 'cloud', 'hot', 'cold'],
        tr: ['çevre', 'iklim', 'hava', 'yağmur', 'kar', 'fırtına', 'rüzgar', 'bulut', 'sıcaklık', 'soğuk', 'buz', 'enerji', 'elektrik', 'gaz', 'petrol', 'kömür', 'yakıt', 'pil', 'güç', 'güneş', 'nükleer', 'karbon', 'emisyon', 'sera', 'kirlilik', 'atık', 'geri dönüşüm', 'koru', 'zarar', 'afet', 'tehdit', 'asit', 'kimyasal']
    },
    'Eğitim & Öğrenme': {
        eng: ['academy', 'academic', 'assignment', 'biology', 'chemistry', 'class', 'college', 'course', 'degree', 'diploma', 'discipline', 'education', 'elementary', 'exam', 'geography', 'graduate', 'history', 'homework', 'institute', 'instructor', 'knowledge', 'lecture', 'lesson', 'library', 'mathematics', 'physics', 'primary', 'professor', 'pupil', 'scholar', 'scholarship', 'school', 'science', 'semester', 'student', 'subject', 'syllabus', 'term', 'test', 'tutor', 'university', 'analyze', 'concentrate', 'focus', 'instruction', 'intelligent', 'intellectual', 'memory', 'mental', 'mind', 'research', 'skill', 'smart', 'solve', 'talent', 'thought', 'understanding', 'study', 'learn', 'know', 'book'],
        tr: ['eğitim', 'okul', 'kolej', 'üniversite', 'öğrenci', 'öğretmen', 'profesör', 'özel ders', 'sınıf', 'ders', 'ders anlatımı', 'dönem', 'sömestr', 'ders konusu', 'bilim', 'fen', 'tarih', 'coğrafya', 'matematik', 'fizik', 'kimya', 'biyoloji', 'sınav', 'test', 'ödev', 'derece', 'diploma', 'sertifika', 'burs', 'kütüphane', 'kitap', 'çalışma', 'öğren', 'bilgi', 'çöz', 'anlama']
    },
    'İş & Kariyer': {
        eng: ['accountant', 'applicant', 'application', 'boss', 'business', 'candidate', 'career', 'clerk', 'colleague', 'company', 'contract', 'department', 'director', 'dismiss', 'employ', 'employee', 'employer', 'employment', 'enterprise', 'executive', 'firm', 'hire', 'industry', 'interview', 'job', 'manager', 'meeting', 'occupation', 'office', 'profession', 'professional', 'promotion', 'qualification', 'quit', 'salary', 'staff', 'strike', 'union', 'vacancy', 'wage', 'work', 'worker', 'fire', 'retire'],
        tr: ['iş', 'kariyer', 'meslek', 'istihdam', 'işveren', 'çalışan', 'patron', 'müdür', 'yönetici', 'personel', 'meslektaş', 'ofis', 'şirket', 'firma', 'girişim', 'endüstri', 'sanayi', 'sözleşme', 'kontrat', 'maaş', 'ücret', 'terfi', 'nitelik', 'mülakat', 'başvuru', 'aday', 'boş kadro', 'işe al', 'emekli', 'istifa', 'toplantı']
    },
    'Hobiler & Eğlence': {
        eng: ['acting', 'activity', 'art', 'artist', 'athletics', 'audience', 'ballet', 'band', 'camera', 'chess', 'cinema', 'circus', 'club', 'comedy', 'concert', 'craft', 'dance', 'drama', 'exhibition', 'festival', 'film', 'game', 'gallery', 'guitar', 'gym', 'hobby', 'instrument', 'leisure', 'movie', 'music', 'novel', 'painting', 'performance', 'photography', 'piano', 'play', 'recreation', 'sculpture', 'sport', 'stage', 'theatre', 'toy', 'vacation', 'theatre', 'actor', 'actress'],
        tr: ['hobi', 'boş zaman', 'eğlence', 'spor', 'oyun', 'oyuncak', 'atletizm', 'jimnastik', 'satranç', 'gitar', 'piyano', 'enstrüman', 'müzik', 'şarkı', 'grup', 'konser', 'dans', 'bale', 'sanat', 'sanatçı', 'resim', 'çizim', 'heykel', 'müze', 'galeri', 'sergi', 'tiyatro', 'sahne', 'oyunculuk', 'aktör', 'aktris', 'sinema', 'film', 'komedi', 'festival']
    },
    'İletişim & Teknoloji': {
        eng: ['address', 'advertise', 'advertisement', 'broadcast', 'cable', 'chat', 'communication', 'computer', 'connection', 'conversation', 'data', 'device', 'digital', 'discussion', 'email', 'hardware', 'information', 'internet', 'link', 'media', 'message', 'mobile', 'network', 'online', 'phone', 'press', 'program', 'radio', 'screen', 'software', 'technology', 'telephone', 'user', 'website', 'television', 'news', 'newspaper', 'magazine'],
        tr: ['teknoloji', 'dijital', 'elektronik', 'bilgisayar', 'donanım', 'yazılım', 'program', 'veri', 'ağ', 'internet', 'çevrimiçi', 'web sitesi', 'bağlantı', 'e-posta', 'mesaj', 'sohbet', 'konuşma', 'tartışma', 'telefon', 'ekran', 'cihaz', 'alet', 'iletişim', 'basın', 'medya', 'radyo', 'televyon', 'yayın', 'haber', 'gazete', 'dergi', 'reklam']
    },
    'Duygular & Kişilik': {
        eng: ['afraid', 'anger', 'angry', 'anxiety', 'anxious', 'ashamed', 'bored', 'brave', 'calm', 'cheerful', 'confidence', 'confident', 'confusion', 'confused', 'cruel', 'curious', 'delighted', 'depressed', 'disappointed', 'embarrassed', 'emotion', 'emotional', 'enthusiastic', 'envy', 'excitement', 'excited', 'fear', 'friendly', 'generous', 'grief', 'guilt', 'happy', 'hate', 'honest', 'hope', 'jealous', 'lonely', 'love', 'mood', 'nervous', 'patient', 'pride', 'proud', 'sad', 'satisfied', 'shy', 'silly', 'sympathy', 'tense', 'upset', 'worry', 'worried', 'feel', 'feeling'],
        tr: ['duygu', 'his', 'ruh hali', 'mutlu', 'üzgün', 'kızgın', 'öfkeli', 'korku', 'korkmuş', 'endişe', 'gururlu', 'utanç', 'utanmış', 'heyecanlı', 'sıkılmış', 'sakin', 'cesur', 'dürüst', 'cömert', 'sabırlı', 'dost canlısı', 'zalim', 'meraklı', 'kıskanç', 'yalnız', 'sempati', 'şaşkın', 'memnun', 'neşeli', 'hayal kırıklığı']
    },
    'Eylemler & Günlük Rutinler': {
        eng: ['achieve', 'agree', 'arrive', 'begin', 'believe', 'bite', 'break', 'bring', 'build', 'burn', 'buy', 'carry', 'catch', 'change', 'choose', 'clean', 'climb', 'close', 'compare', 'cook', 'create', 'cry', 'cut', 'dance', 'decide', 'deliver', 'destroy', 'discover', 'do', 'draw', 'dream', 'drink', 'drive', 'eat', 'enter', 'explain', 'fall', 'feed', 'feel', 'fight', 'find', 'finish', 'fly', 'forget', 'forgive', 'get', 'give', 'go', 'grow', 'happen', 'hear', 'help', 'hide', 'hit', 'hold', 'hope', 'hurt', 'ignore', 'imagine', 'improve', 'introduce', 'join', 'keep', 'know', 'laugh', 'learn', 'leave', 'lend', 'let', 'lie', 'like', 'listen', 'live', 'look', 'lose', 'love', 'make', 'meet', 'move', 'need', 'open', 'organize', 'pay', 'perform', 'plan', 'play', 'prepare', 'promise', 'pull', 'push', 'put', 'read', 'receive', 'remember', 'repeat', 'return', 'ride', 'run', 'save', 'say', 'search', 'see', 'sell', 'send', 'share', 'shout', 'show', 'sing', 'sit', 'sleep', 'smile', 'speak', 'spend', 'stand', 'start', 'stay', 'steal', 'stop', 'study', 'suggest', 'take', 'talk', 'teach', 'tell', 'think', 'throw', 'travel', 'try', 'turn', 'understand', 'use', 'visit', 'wait', 'wake', 'walk', 'want', 'wash', 'watch', 'wear', 'win', 'work', 'write', 'routine', 'end', 'walk', 'ride', 'drive', 'fly'],
        tr: ['eylem', 'rutin', 'başla', 'dur', 'bitir', 'son', 'yap', 'et', 'al', 'ver', 'getir', 'taşı', 'tut', 'çek', 'it', 'fırlat', 'yakala', 'koş', 'yürü', 'bin', 'sür', 'uç', 'seyahat', 'var', 'dön', 'ol', 'bekle', 'kal', 'ayrıl', 'git', 'terk et', 'buluş', 'karşıla', 'yardım', 'değiştir', 'seç', 'satın al', 'sat', 'öde', 'harca', 'biriktir', 'temizle', 'yıka', 'izle', 'gör', 'duy', 'dinle', 'konuş']
    }
};

const manualExamples = {
    'abroad': 'She decided to study abroad next semester.',
    'accident': 'The police arrived at the scene of the accident.',
    'accommodation': 'We need to find cheap accommodation for the weekend.',
    'achieve': 'If you work hard, you can achieve your goals.',
    'activity': 'Hiking is my favorite outdoor activity.',
    'actor': 'He is a very famous actor in Hollywood.',
    'admission': 'The admission ticket to the museum was ten dollars.',
    'advice': 'Can you give me some advice on buying a house?',
    'airport': 'The taxi dropped us off at the airport.',
    'ambulance': 'An ambulance arrived to take him to the hospital.',
    'angry': 'He was very angry because they were late.',
    'anniversary': 'They celebrated their tenth wedding anniversary yesterday.',
    'appliance': 'Modern home appliances save a lot of time.',
    'applicant': 'The company interviewed five applicants for the job.',
    'application': 'Please submit your job application by Friday.',
    'appointment': 'I have a dentist appointment at three o\'clock.',
    'balcony': 'Our hotel room has a beautiful balcony facing the sea.',
    'bandage': 'She put a bandage on her cut finger.',
    'blanket': 'It was cold, so she put another blanket on the bed.',
    'bleed': 'His nose started to bleed after the fall.',
    'blood': 'Donating blood can save lives.',
    'boss': 'My boss asked me to work overtime today.',
    'bowl': 'She ate a bowl of soup for lunch.',
    'brain': 'Reading books helps keep your brain active.',
    'brave': 'The brave firefighter saved the little girl from the fire.',
    'breath': 'Take a deep breath before you speak.',
    'bridge': 'They are building a new bridge over the river.',
    'cabinet': 'Keep the medicine in a locked cabinet.',
    'candidate': 'She is a strong candidate for the manager position.',
    'candle': 'We lit a candle when the electricity went out.',
    'career': 'He wants to pursue a career in computer science.',
    'carpet': 'The living room floor is covered with a soft carpet.',
    'ceiling': 'The ceiling in this old house is very high.',
    'chemistry': 'Chemistry was my favorite subject in high school.',
    'cinema': 'Let\'s go to the cinema to watch a movie.',
    'climate': 'The climate of this region is very warm and humid.',
    'colleague': 'She is a helpful colleague from my office.',
    'college': 'He went to college in Boston.',
    'comedy': 'We watched a funny comedy last night.',
    'company': 'They work for a large technology company.',
    'computer': 'I bought a new computer for my studies.',
    'concert': 'The band played a great concert last Saturday.',
    'confidence': 'Developing self-confidence takes time and effort.',
    'connection': 'Our internet connection is very slow today.',
    'contract': 'They signed a two-year contract with the client.',
    'conversation': 'We had an interesting conversation about politics.',
    'cooker': 'We bought a new gas cooker for our kitchen.',
    'costume': 'The children wore colorful costumes for Halloween.',
    'cotton': 'This shirt is made of one hundred percent cotton.',
    'couple': 'A young couple walked past us in the park.',
    'course': 'I enrolled in an online English language course.',
    'curious': 'The little cat was curious about the new toy.',
    'curtain': 'She pulled the curtains to block the sunlight.',
    'cushion': 'There are several cushions on the sofa.',
    'customs': 'We had to go through customs at the border.',
    'dairy': 'Dairy products like milk and cheese are good for bones.',
    'damage': 'The storm caused serious damage to the roof.',
    'data': 'The researcher analyzed the collected data.',
    'deaf': 'He has been deaf since childhood.',
    'decorate': 'They decorated the room with balloons for the party.',
    'delay': 'Our flight was delayed by two hours due to rain.',
    'dentist': 'You should visit the dentist twice a year.',
    'departure': 'The departure time of our train is 9:30 AM.',
    'department': 'She works in the marketing department.',
    'desert': 'Camels can survive in the hot desert for days.',
    'destination': 'We finally reached our destination after a long drive.',
    'device': 'A smartphone is a very useful digital device.',
    'digital': 'We live in a digital world now.',
    'director': 'The director of the film won an award.',
    'disaster': 'The flood was a natural disaster for the village.',
    'disease': 'Washing hands helps prevent the spread of disease.',
    'divorce': 'They decided to get a divorce after five years of marriage.',
    'dizzy': 'I felt dizzy after spinning around.',
    'drawer': 'I kept my passport in the desk drawer.',
    'dream': 'I had a strange dream last night.',
    'dust': 'The old books were covered in thick dust.',
    'education': 'Education is the key to a better future.',
    'electricity': 'Many cars now run on electricity.',
    'electronic': 'We sell electronic goods online.',
    'email': 'I received an email from my teacher.',
    'emotion': 'Love is a very strong human emotion.',
    'employee': 'The company has over five hundred employees.',
    'employer': 'Her employer gave her a bonus for her hard work.',
    'energy': 'We need more solar energy to protect the environment.',
    'engage': 'They got engaged on Valentine\'s Day.',
    'environment': 'We must do more to protect the environment.',
    'equipment': 'We bought new sports equipment for the gym.',
    'exam': 'She passed the English exam with high marks.',
    'exhibition': 'We visited an art exhibition in the museum.',
    'face': 'She washed her face with cold water.',
    'factory': 'He works as an engineer in a car factory.',
    'fare': 'Bus fares have increased recently.',
    'fashion': 'She is interested in the latest fashion trends.',
    'fear': 'He overcame his fear of heights.',
    'festival': 'The music festival takes place every summer.',
    'fever': 'The child has a high fever and needs rest.',
    'film': 'We watched an interesting documentary film.',
    'flight': 'The flight to Paris was very comfortable.',
    'flood': 'The river overflowed and caused a major flood.',
    'flour': 'Bread is made from flour and water.',
    'forest': 'We took a walk in the green forest.',
    'fork': 'He ate his dinner with a knife and fork.',
    'friendly': 'Our new neighbors are very friendly.',
    'fuel': 'Wood is still used as fuel in some countries.',
    'furniture': 'We bought new furniture for our living room.',
    'gallery': 'They went to a gallery to see paintings.',
    'game': 'They played a board game together.',
    'garlic': 'I always put garlic in the pasta sauce.',
    'gas': 'The kitchen smelled of gas, so we opened the window.',
    'generation': 'Our grandparents belong to a different generation.',
    'geography': 'We learned about rivers in geography class.',
    'global': 'Global warming affects the whole world.',
    'glove': 'Wear gloves to keep your hands warm.',
    'gradual': 'There was a gradual improvement in his health.',
    'graduate': 'She graduated from university last summer.',
    'grape': 'We bought green grapes from the market.',
    'grief': 'She expressed her deep grief over the loss.',
    'guest': 'We invited twenty guests to the dinner party.',
    'guitar': 'He plays the guitar in a rock band.',
    'gym': 'I go to the gym three times a week.',
    'habit': 'Reading daily is a very good habit.',
    'handbag': 'She left her handbag on the bus.',
    'harbour': 'We saw many boats in the harbour.',
    'hardware': 'Computer hardware includes the monitor and keyboard.',
    'health': 'Eating vegetables is good for your health.',
    'heating': 'Turn on the heating, it is very cold in here.',
    'honey': 'I like to add honey to my warm tea.',
    'honest': 'Please be honest with me about your decision.',
    'hope': 'We hope to see you again soon.',
    'hospital': 'He was taken to the hospital for treatment.',
    'household': 'My brother helps with household chores.',
    'hunger': 'Millions of people suffer from hunger in the world.',
    'illness': 'Her illness kept her away from school.',
    'infant': 'An infant needs constant care and attention.',
    'ingredient': 'Flour is the main ingredient of this cake.',
    'injury': 'The player suffered a knee injury during the game.',
    'insect': 'A bee is a very useful insect.',
    'instrument': 'The piano is a beautiful musical instrument.',
    'internet': 'You can find any information on the internet.',
    'interview': 'He has a job interview tomorrow morning.',
    'island': 'They spent their vacation on a tropical island.',
    'jewellery': 'She wore beautiful gold jewellery to the party.',
    'journey': 'It was a long and tiring journey by train.',
    'juice': 'I drank a glass of orange juice.',
    'jungle': 'Many wild animals live in the deep jungle.',
    'kettle': 'Put the kettle on to make some tea.',
    'knee': 'He hurt his knee while playing football.',
    'knife': 'Be careful with that sharp knife.',
    'knowledge': 'Books are a source of great knowledge.',
    'lake': 'We swam in the cool lake during summer.',
    'landscape': 'The mountain landscape was absolutely beautiful.',
    'laundry': 'She did the laundry on Sunday afternoon.',
    'leather': 'I bought a black leather jacket.',
    'lecture': 'The professor gave an interesting lecture on history.',
    'leisure': 'What do you do in your leisure time?',
    'lemon': 'I squeezed some lemon into the salad.',
    'lesson': 'Our English lesson starts at ten o\'clock.',
    'library': 'I borrowed two books from the library.',
    'link': 'Click on this link to visit our website.',
    'liver': 'The liver is an important organ in the body.',
    'luggage': 'We checked in our luggage at the counter.',
    'makeup': 'She wears makeup only for special occasions.',
    'manager': 'The manager solved the customer\'s problem.',
    'marriage': 'A happy marriage is built on trust.',
    'marry': 'They decided to marry next month.',
    'medicine': 'Take this medicine after your meals.',
    'meeting': 'We have a staff meeting every Monday.',
    'message': 'Send me a message when you arrive.',
    'metro': 'I go to work by metro.',
    'microwave': 'You can heat the soup in the microwave.',
    'mirror': 'She looked at herself in the mirror.',
    'mobile': 'Please turn off your mobile phone during class.',
    'motorcycle': 'He rode his motorcycle to the countryside.',
    'mountain': 'They climbed a high mountain last weekend.',
    'muscle': 'Exercise helps build strong muscles.',
    'music': 'She loves listening to classical music.',
    'nature': 'I love spending time in nature.',
    'necklace': 'He bought a silver necklace for his mother.',
    'neighbour': 'Our neighbour helped us move the furniture.',
    'network': 'The computer network was down for maintenance.',
    'niece': 'My niece is three years old today.',
    'novel': 'He is reading a historical novel.',
    'nuclear': 'Nuclear energy is a controversial topic.',
    'nut': 'Walnuts and almonds are very healthy nuts.',
    'occupation': 'Please write your occupation on the form.',
    'ocean': 'The ship sailed across the Atlantic Ocean.',
    'office': 'Our office is located in the city center.',
    'oil': 'Olive oil is very popular in Turkish cooking.',
    'onion': 'I chopped some onions for the soup.',
    'oven': 'Bake the cake in a preheated oven.',
    'oxygen': 'Trees produce the oxygen we breathe.',
    'pain': 'He felt a sharp pain in his back.',
    'painting': 'This is a famous painting by Van Gogh.',
    'pan': 'Heat some butter in the frying pan.',
    'parent': 'Every parent wants their child to succeed.',
    'partner': 'He is my business partner in this project.',
    'passenger': 'All passengers must wear seat belts.',
    'passport': 'Don\'t forget to bring your passport to the airport.',
    'patient': 'The doctor examined the sick patient.',
    'peach': 'I ate a sweet, juicy peach.',
    'pear': 'We picked fresh pears from the tree.',
    'pedestrian': 'Drivers must stop for pedestrians at the crossing.',
    'performance': 'The actors gave a wonderful performance.',
    'personality': 'She has a very cheerful personality.',
    'petrol': 'Our car is low on petrol, we must find a station.',
    'phone': 'He made a quick phone call to his wife.',
    'photography': 'Her hobby is nature photography.',
    'physics': 'Physics helps us understand how the universe works.',
    'piano': 'She has been playing the piano since she was six.',
    'pill': 'Take one pill before going to bed.',
    'pillow': 'I need a soft pillow to sleep well.',
    'planet': 'Mars is often called the red planet.',
    'plate': 'She put a plate of cookies on the table.',
    'platform': 'The train to London leaves from platform four.',
    'play': 'We watched a theatrical play last night.',
    'pocket': 'I have some coins in my pocket.',
    'pollution': 'Air pollution is a major problem in big cities.',
    'pot': 'She put a pot of water on the stove.',
    'poverty': 'The charity organization works to reduce poverty.',
    'power': 'The storm caused a power outage in the area.',
    'primary': 'Primary education is compulsory in many countries.',
    'professional': 'He is a professional photographer.',
    'professor': 'The professor answered the student\'s question.',
    'program': 'I watched an educational program on TV.',
    'promotion': 'He received a promotion to senior manager.',
    'property': 'They bought a new property in the countryside.',
    'proud': 'Her parents are very proud of her success.',
    'purse': 'She kept her credit cards in her purse.',
    'qualification': 'Having a university degree is a good qualification.',
    'queen': 'Queen Elizabeth reigned for seventy years.',
    'question': 'The teacher asked a difficult question.',
    'radio': 'We listened to the news on the radio.',
    'railway': 'The railway line runs through the valley.',
    'raw': 'Sushi is made with raw fish.',
    'recipe': 'Follow this simple recipe to make a delicious cake.',
    'recycle': 'We should recycle plastic bottles to protect nature.',
    'refrigerator': 'Keep the milk in the refrigerator.',
    'relative': 'All our relatives gathered for the holiday.',
    'rent': 'We pay our rent on the first of every month.',
    'repair': 'He repaired the broken chair.',
    'resource': 'Water is our most valuable natural resource.',
    'restaurant': 'We dined at a nice Italian restaurant.',
    'ring': 'She wears a gold ring on her finger.',
    'river': 'They went fishing in the quiet river.',
    'roof': 'The cat climbed onto the house roof.',
    'route': 'We chose the fastest route to the city.',
    'rubbish': 'Please throw the rubbish in the bin.',
    'sad': 'She felt sad after hearing the bad news.',
    'salary': 'He earns a good monthly salary.',
    'saucepan': 'Pour the sauce into a small saucepan.',
    'scarf': 'She wore a wool scarf around her neck.',
    'sculpture': 'We saw a beautiful marble sculpture in the park.',
    'sea': 'The children played in the shallow sea water.',
    'semester': 'The new school semester starts in September.',
    'sheet': 'She put clean sheets on the bed.',
    'shelf': 'Put the books back on the shelf.',
    'shirt': 'He wore a clean white shirt to the meeting.',
    'shoe': 'These shoes are very comfortable for walking.',
    'shoulder': 'He carried the bag on his shoulder.',
    'silk': 'This scarf is made of genuine Chinese silk.',
    'single': 'He is single and lives alone.',
    'sink': 'Wash the dishes in the kitchen sink.',
    'skin': 'Sunscreen protects your skin from damage.',
    'sleeve': 'He rolled up his sleeves and started working.',
    'software': 'I installed the new design software.',
    'solar': 'Solar panels convert sunlight into electricity.',
    'sour': 'This lemon is very sour.',
    'special': 'Today is a special day for our family.',
    'spice': 'Chili is a very hot spice.',
    'spoon': 'Stir the soup with a wooden spoon.',
    'sport': 'Tennis is my favorite sport.',
    'spouse': 'Employees are welcome to bring their spouses to the event.',
    'staff': 'The hotel staff were extremely polite and helpful.',
    'stage': 'The actors stood on the theatre stage.',
    'stomach': 'He has a stomach ache from eating too much.',
    'stone': 'The path was made of smooth stones.',
    'storm': 'The heavy storm damaged several trees.',
    'stove': 'We cooked dinner on the electric stove.',
    'student': 'The students paid attention to the lecture.',
    'subject': 'Math is a difficult subject for many.',
    'subway': 'We took the subway to get downtown quickly.',
    'sugar': 'I don\'t take sugar in my coffee.',
    'suit': 'He wore a dark suit and tie to the interview.',
    'sweet': 'These strawberries are very sweet.',
    'tablecloth': 'She spread a white tablecloth on the dining table.',
    'tap': 'Turn off the tap while brushing your teeth.',
    'tasty': 'This chocolate cake is very tasty.',
    'teacher': 'The teacher explained the rules of the game.',
    'technology': 'Modern technology has changed our lives.',
    'telephone': 'The telephone rang in the middle of the night.',
    'term': 'The academic term ends in January.',
    'test': 'The students took a spelling test.',
    'theatre': 'Let\'s see a play at the local theatre.',
    'throat': 'She has a sore throat and cannot speak.',
    'thumb': 'He cut his thumb while chopping onions.',
    'ticket': 'Do you have your train ticket?',
    'tidy': 'Keep your room clean and tidy.',
    'tie': 'He wore a red tie with his suit.',
    'toaster': 'Put two slices of bread in the toaster.',
    'toe': 'He stubbed his toe against the table leg.',
    'tool': 'A hammer is an essential tool for building.',
    'tourism': 'Tourism is a major source of income for the country.',
    'tourist': 'Many tourists visit Istanbul every year.',
    'toy': 'The child was playing with a wooden toy.',
    'traffic': 'The morning traffic was very heavy today.',
    'train': 'The train arrived on time.',
    'transport': 'Public transport is very efficient in this city.',
    'tray': 'She carried the teacups on a silver tray.',
    'treatment': 'He is receiving medical treatment for his illness.',
    'tunnel': 'The train passed through a long mountain tunnel.',
    'tutor': 'He hired a private tutor to help with math.',
    'twin': 'She has a twin sister who looks just like her.',
    'umbrella': 'Bring an umbrella, it is starting to rain.',
    'underwear': 'Wash your underwear in warm water.',
    'union': 'Workers decided to join the labor union.',
    'university': 'She is studying law at university.',
    'upset': 'She was upset because she lost her keys.',
    'user': 'The system has over ten thousand active users.',
    'vacancy': 'The hotel has no vacancies for tonight.',
    'vacation': 'They spent their summer vacation in Italy.',
    'valley': 'The village is situated in a green valley.',
    'vase': 'Put the fresh flowers in the glass vase.',
    'vehicle': 'Cars and buses are road vehicles.',
    'vein': 'Veins carry blood back to the heart.',
    'voyage': 'The Titanic sank on its first voyage.',
    'wage': 'Minimum wage laws protect workers.',
    'waste': 'Recycling helps reduce household waste.',
    'waterfall': 'We took photos of the beautiful waterfall.',
    'wave': 'The surfers rode the large ocean waves.',
    'wedding': 'They invited all their friends to the wedding.',
    'website': 'You can find details on our website.',
    'wheat': 'Wheat is harvested in the summer.',
    'widow': 'The poor widow lived alone in the cottage.',
    'wind': 'The strong wind blew away my hat.',
    'wool': 'This warm sweater is made of pure sheep wool.',
    'worker': 'Factory workers demanded better conditions.',
    'worry': 'Don\'t worry, everything will be fine.',
    'wound': 'The nurse cleaned the soldier\'s wound.',
    'wrist': 'She wore a silver bracelet on your wrist.',
    'youth': 'He spent his youth in a small village.',
    'zipper': 'The zipper of my jacket is broken.',
    'childhood': 'I had a very happy childhood.',
    'female': 'The lioness is a female lion.',
    'male': 'The company has more male employees than female ones.',
    'friendship': 'Their friendship started when they were in primary school.',
    'human': 'To err is human, to forgive divine.',
    'individual': 'Each individual has the right to vote.',
    'relationship': 'She has a close relationship with her sister.',
    'social': 'Instagram is a popular social media platform.',
    'society': 'We must build a better society for our children.',
    'stranger': 'Don\'t talk to strangers on the street.',
    'celebrate': 'We will celebrate my birthday at a restaurant.',
    'citizen': 'He is a citizen of both Turkey and Canada.',
    'character': 'She is a strong and honest character.',
    'community': 'The local community built a new playground.',
    'crowd': 'A large crowd gathered to watch the concert.',
    'chef': 'The head chef prepared a delicious meal.',
    'canteen': 'We usually eat lunch at the school canteen.',
    'consume': 'Electric cars consume less energy than petrol cars.',
    'flavour': 'I love the flavour of fresh strawberries.',
    'freeze': 'Water freezes at zero degrees Celsius.',
    'fry': 'Fry the onions in a pan with some olive oil.',
    'taste': 'This soup tastes wonderful.',
    'waiter': 'The waiter brought our drinks quickly.',
    'snack': 'I usually have a healthy snack in the afternoon.',
    'slice': 'Would you like a slice of cake?',
    'sauce': 'She made a delicious tomato sauce for the pasta.',
    'serve': 'They serve breakfast until 11 AM.',
    'climate': 'The world\'s climate is changing rapidly.',
    'atmosphere': 'The Earth\'s atmosphere protects us from the sun.',
    'temperature': 'The temperature is very high today.',
    'weather': 'The weather is beautiful and sunny.',
    'wildlife': 'We saw a lot of wildlife in the forest.',
    'organic': 'This supermarket sells organic vegetables.',
    'chemical': 'Do not mix these dangerous chemicals.',
    'ecology': 'Ecology is the study of how living things interact with their environment.',
    'effect': 'Smoking has a bad effect on your health.',
    'protect': 'We must protect our planet from pollution.',
    'threat': 'Pollution is a major threat to the environment.',
    'natural': 'Earthquakes are natural disasters.',
    'planet': 'Earth is the only planet known to support life.',
    'analyze': 'The scientist analyzed the blood sample.',
    'concentrate': 'It is hard to concentrate with all this noise.',
    'focus': 'You need to focus on your studies.',
    'instruction': 'Read the instructions carefully before starting.',
    'intelligent': 'Dolphins are very intelligent animals.',
    'memory': 'She has a great memory for faces.',
    'mental': 'Physical exercise is good for mental health.',
    'mind': 'Keep an open mind about the new project.',
    'research': 'They are doing research on a new vaccine.',
    'skill': 'Learning a language is a useful skill.',
    'solve': 'He tried to solve the difficult math problem.',
    'talent': 'She has a natural talent for singing.',
    'thought': 'What are your thoughts on this matter?',
    'understanding': 'The teacher has a good understanding of children.',
    'battery': 'This toy needs two double-A batteries to work.',
    'dirt': 'Wash the dirt off your hands.',
    'earth': 'The astronaut looked down at the green and blue Earth.',
    'heat': 'The summer heat was almost unbearable.',
    'ice': 'Put some ice in my water, please.',
    'lightning': 'A flash of lightning lit up the dark sky.',
    'metal': 'This table is made of strong metal.',
    'plastic': 'We should reduce our use of plastic bottles.',
    'sand': 'The children played in the hot sand on the beach.',
    'smoke': 'We saw black smoke rising from the chimney.',
    'surround': 'The house is surrounded by beautiful trees.',
    'environmental': 'Global warming is a major environmental issue.',
    'environment': 'We need to protect the natural environment.'
};

// Process each category
const usedGlobalWords = new Set();
const finalUnits = [];
let totalMatchedWords = 0;

for (const [title, query] of Object.entries(categoryKeywords)) {
    const selectedWords = [];
    
    // First, try exact matches of keywords in the pool
    for (const kw of query.eng) {
        if (selectedWords.length >= 48) break;
        const candidate = candidateMap.get(kw.toLowerCase());
        if (candidate && !usedGlobalWords.has(candidate.word.toLowerCase())) {
            selectedWords.push(candidate);
            usedGlobalWords.add(candidate.word.toLowerCase());
        }
    }
    
    // Second, if not enough, do a substring/semantic search across all remaining candidates
    if (selectedWords.length < 48) {
        for (const candidate of candidates) {
            if (selectedWords.length >= 48) break;
            if (usedGlobalWords.has(candidate.word.toLowerCase())) continue;
            
            const word = candidate.word.toLowerCase();
            const tr = (candidate.meanings.tr || '').toLowerCase();
            
            let matched = false;
            // Check English word prefix/suffix matching
            for (const kw of query.eng) {
                if (word === kw || (kw.length >= 4 && (word.startsWith(kw) || word.endsWith(kw)))) {
                    matched = true;
                    break;
                }
            }
            if (!matched) {
                // Check Turkish translation matching
                for (const kw of query.tr) {
                    if (tr === kw || (kw.length >= 3 && tr.includes(kw))) {
                        matched = true;
                        break;
                    }
                }
            }
            
            if (matched) {
                selectedWords.push(candidate);
                usedGlobalWords.add(candidate.word.toLowerCase());
            }
        }
    }
    
    // Third, if still not enough, grab unmatched B1 words sequentially to fill up to 48
    if (selectedWords.length < 48) {
        console.log(`Unit "${title}" has ${selectedWords.length} words. Filling with fallbacks to reach 48...`);
        for (const candidate of candidates) {
            if (selectedWords.length >= 48) break;
            if (usedGlobalWords.has(candidate.word.toLowerCase())) continue;
            
            selectedWords.push(candidate);
            usedGlobalWords.add(candidate.word.toLowerCase());
        }
    }
    
    console.log(`Matched ${selectedWords.length}/48 words for "${title}"`);
    totalMatchedWords += selectedWords.length;
    
    finalUnits.push({
        title: title,
        icon: icons[title] || '📦',
        words: selectedWords
    });
}

console.log(`\nMatched a total of ${totalMatchedWords} B1 words across 15 categories.`);

// Format output JSON in Duolingo structure
let globalWordIndex = 0;
const outputJSON = {
    version: 1,
    level: 'B1',
    totalWords: totalMatchedWords,
    units: finalUnits.map((unit) => {
        const words = unit.words.map((w) => {
            globalWordIndex++;
            return {
                id: `b1_${String(globalWordIndex).padStart(3, '0')}`,
                word: w.word,
                meanings: w.meanings,
                example: manualExamples[w.word.toLowerCase()] || '',
                image: `${w.word.toLowerCase().replace(/[^a-z0-9]/g, '-')}.webp`,
                pos: ''
            };
        });
        
        return {
            id: unit.title.toLowerCase().replace(/[^a-zğüşıöç0-9]/gi, '-').replace(/-+/g, '-'),
            title: unit.title,
            icon: unit.icon,
            words: words
        };
    })
};

// Write output JSON
fs.writeFileSync(
    path.join(__dirname, '..', 'public', 'data', 'fastpath_b1.json'),
    JSON.stringify(outputJSON, null, 2),
    'utf8'
);

console.log(`\n✅ Generated fastpath_b1.json with ${globalWordIndex} words in ${outputJSON.units.length} units.`);
