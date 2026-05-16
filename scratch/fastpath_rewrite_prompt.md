# FastPath.js Yeniden Yazım Promptu

Bu promptu başka bir AI'a ver. Çıktıyı `src/dashboard/apps/fastpath.js` dosyasının üzerine yaz.

---

Aşağıdaki mevcut fastpath.js dosyasını yeniden yaz. Lesson/test/results mantığını koru ama şu değişiklikleri uygula:

## IMPORT DEĞİŞİKLİKLERİ

ESKİ import'ları SİL:
- oxfordDictionary import'u
- curatedA2Units import'u

YENİ import'lar:
```js
import { loadLevelData } from './fastpath_data.js';
import { getLocalProgress, updateLevelProgress, setActiveLevel } from './fastpath_sync.js';
import { LEVELS, CDN_BASE, IMAGE_TIMEOUT, PREFETCH_AHEAD, WORDS_PER_UNIT } from '../../shared/constants.js';
import { t } from '../../shared/i18n.js';
import { isUserPremium } from '../../shared/premiumGuard.js';
```

`let WORDS_PER_STEP = 12;` satırını kaldır.

## DEĞİŞİKLİKLER

### 1. LEVEL SELECTOR
initFastPath fonksiyonunun başında, harita render edilmeden ÖNCE yatay bir seviye seçim barı render et:
- LEVELS dizisindeki her seviye için buton kartı
- A2 = free, B1/B2/C1 = premium (isUserPremium() ile kontrol)
- Aktif seviye mor/purple vurgulu
- Kilitli seviye tıklanınca premium.html'e yönlendir
- Tailwind class'ları kullan

### 2. DATA LOADING
curatedA2Units yerine:
- `loadLevelData(activeLevel)` ile JSON'dan yükle (async)
- null dönerse "Yüklenemedi" mesajı göster
- Yüklenen data.units dizisini renderUnits'e ver

### 3. RENDER — IntersectionObserver
renderUnits fonksiyonunda:
- Her ünite için placeholder div (min-height: 200px)
- IntersectionObserver ile viewport'a girince render
- rootMargin: '200px'
- activeObservers dizisinde tut, initFastPath'te temizle

### 4. LEARN CARD IMAGE
showNextLearn'de:
- word.image varsa ve boş değilse: `CDN_BASE + '/' + activeLevel + '/' + word.image` ile img göster
- img.loading = 'lazy', img.decoding = 'async'
- img.onerror → 'icons/placeholder.svg'
- fetchWikiImage fonksiyonunu SİL
- fetchWordData fonksiyonunu KORU (ama sadece word.example boşsa çağır)

### 5. EXAMPLE SENTENCE
showNextLearn'de:
- Önce word.example kontrol et
- Doluysa direkt göster, API çağırma
- Boşsa fetchWordData ile API'den çek

### 6. PREFETCH
startLesson'da:
- Aktif kart + sonraki PREFETCH_AHEAD (2) görseli prefetch et
- `<link rel="prefetch" as="image">` ile

### 7. MEMORY CLEANUP
- `let activeObservers = []` — observer'ları tut
- `let activeFetches = new AbortController()` — fetch kontrol
- initFastPath başında temizle
- fetch'lerde `{ signal: activeFetches.signal }` kullan

### 8. PROGRESS
chrome.storage.local.get/set yerine:
- `getLocalProgress()` kullan
- `updateLevelProgress(level, data)` kullan
- `setActiveLevel(level)` kullan

### 9. TEST DISTRACTOR POOL
setupTestChoice'da:
- oxfordDictionary yerine: `loadedData.units.flatMap(u => u.words)` kullan
- loadedData'yı modül seviyesinde tut

### 10. WORDS_PER_STEP → WORDS_PER_UNIT (24)

## KORUNACAK (DEĞİŞTİRME)
- openModal, closeModal, hideAllZones, setProgress
- Test phase (choice + typing)
- handleAnswer, nextTestItem
- showResults ve sonuç ekranı
- playAudio
- Mistakes storage (addMistakeToStorage, removeMistakeFromStorage)
- startFixMistakes, updateMistakesUI
- ls (lesson state) objesi

## STİL
- Tailwind CSS class'ları
- Dark tema: slate, purple, emerald, cyan

---

MEVCUT fastpath.js İÇERİĞİ:

[BURAYA src/dashboard/apps/fastpath.js DOSYASININ İÇERİĞİNİ YAPIŞTIR]
