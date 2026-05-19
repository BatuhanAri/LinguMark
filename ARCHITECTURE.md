# LinguMark Sistem Mimarisi (ARCHITECTURE.md)

LinguMark; web sayfalarında gezinirken kelimeleri akıllı bir şekilde tarayan, otomatik vurgulama (Web Röntgen) yapan, Oxford kelime kütüphanesini barındıran ve Duolingo tarzı ünite bazlı gamifikasyonla (FastPath) öğrenimi destekleyen modern bir **Chrome Uzantısı (Extension) ve SaaS** platformudur.

Bu doküman, sistemin API entegrasyonlarını, modüler kod yapısını, dizin sorumluluklarını ve sayfa bağımlılık ağaçlarını en ince ayrıntısına kadar detaylandırmaktadır.

---

## 1. API ve Entegrasyon Katmanı

Sistem, harici servisler, tarayıcı API'leri ve sunucu taraflı Firebase servislerinin uyum içinde çalıştığı hibrit bir iletişim modeline sahiptir.

```mermaid
graph TD
    %% Extension Elements
    subgraph Chrome Extension MV3
        BG[background.js]
        CS[content.js / content-injected.js]
        POP[popup.js]
        DASH[dashboard.js]
        PREM[premium.js]
    end

    %% External APIs
    subgraph Dış Servisler
        GTA[Google Translate API]
        FDA[Free Dictionary API]
        GIS[Google Image Search]
    end

    %% Database & Auth
    subgraph Firebase Cloud
        FA[Firebase Auth]
        FS[Cloud Firestore]
    end

    %% Integrations
    CS -- Mesajlaşma -- BG
    BG -- Selection Translation -- GTA
    DASH -- Word Details -- FDA
    DASH -- Google Image Search -- GIS
    PREM -- Google Sign-In -- FA
    PREM -- Subscription Write -- FS
    DASH -- Sync Progress -- FS
```

### A. Dış (External) API'ler

#### 1. Google Translate API (Translation & Lang Detection)
* **Kullanım Yeri:** `background.js` (Bağlam Menüsü Tıklaması)
* **Endpoint:** `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLang}&dt=t&q=${encodeURIComponent(word)}`
* **Metot:** `GET`
* **Görevi:** Kullanıcı tarayıcıda herhangi bir kelimeyi seçip sağ tıkladığında ve "Add to LinguMark" dediğinde, kelimenin anlamını otomatik çevirir ve kelimenin orijinal dilini (kaynak dil) otomatik olarak tespit eder (`data[2]`).

#### 2. Free Dictionary API (Word Metadata)
* **Kullanım Yeri:** `src/dashboard/apps/fastpath.js` (Öğrenim Aşaması)
* **Endpoint:** `https://api.dictionaryapi.dev/api/v2/entries/en/${word}`
* **Metot:** `GET`
* **Görevi:** Öğrenilen İngilizce kelimelerin okunuşunu (phonetics), isim/fiil gibi dilbilgisi rollerini (partOfSpeech) ve örnek cümlelerini (example) dinamik olarak çekerek kullanıcının bilgi kartında görüntüler.

#### 3. Google Image Search (Visual Search)
* **Kullanım Yeri:** `src/dashboard/apps/fastpath.js` & `dashboard.html` ("Araştır" Butonu)
* **Endpoint:** `https://www.google.com/search?tbm=isch&q=${encodeURIComponent(word)}`
* **Metot:** `GET` (Yeni sekmede `_blank` açılır)
* **Görevi:** Görsel sunucu veya CDN bağımlılığını tamamen ortadan kaldırarak kullanıcının kelimeyi doğrudan Google Görseller üzerinden en kaliteli ve güncel sonuçlarla incelemesini sağlar.

---

### B. İç (Internal) API'ler ve Tarayıcı Servisleri

#### 1. Chrome Extension Message Passing (MV3)
Extension bileşenleri (Content Script, Background, Dashboard, Popup) birbirleriyle asenkron Chrome mesaj kanalları ile haberleşir:
* `"GET_STORAGE" / "LINGUMARK_GET_STORAGE"`: Content script, sayfayı taramadan önce aktif durumdaki kelimeleri ve master switch değerini background'dan talep eder.
* `"UPDATE_CONTEXT" / "LINGUMARK_UPDATE_CONTEXT"`: Kullanıcı bir kelime seçtiğinde, seçilen kelimenin içinde geçtiği cümle (bağlam/context) ve bulunulan web sayfasının URL'si (`sourceUrl`) background'a iletilir ve kaydedilir.
* `"QUICK_ADD" / "LINGUMARK_QUICK_ADD"`: Web Röntgen taramasında vurgulanan kelimenin üzerindeki "Hızlı Ekle" (Quick Add) butonuna basıldığında kelimeyi anında sözlüğe kaydeder.
* `"RELOAD_HIGHLIGHTS"`: Yeni bir kelime eklendiğinde veya silindiğinde, tüm açık sekmelerdeki Web Röntgen vurgulamalarını dinamik olarak günceller.
* `"SHOW_SAVE_TOAST"`: Kelime başarıyla kaydedildiğinde, kullanıcının bulunduğu sekmede şık bir premium bildirim kartı (toast) açarak kelime dilini ve anlamını düzenlemesine izin verir.
* `"TOGGLE_MENU"`: Seçilen metin 1 kelimeden fazla ise tarayıcı bağlam menüsündeki (sağ tık) "Add to LinguMark" seçeneğini otomatik gizler/gösterir.

#### 2. Chrome Storage API (`chrome.storage.local`)
Platform, hızlı ve kesintisiz çevrimdışı çalışma için tüm kullanıcı ilerlemesini, kelime listelerini, Röntgen ayarlarını ve premium durumunu `chrome.storage.local` üzerinde depolar.

---

### C. Veritabanı ve Senkronizasyon (Firebase & Firestore)
Platform, premium SaaS modelini desteklemek amacıyla Firebase Web SDK entegrasyonuna sahiptir.
* **Firebase Auth:** Google ile Giriş Yap (`loginWithGoogle`) altyapısını yönetir.
* **Cloud Firestore:** `users/{userId}` koleksiyonu altında kullanıcının premium abonelik durumunu (`isPremium`) ve FastPath seviye ilerleme verilerini (progress, history, mistakes) barındırır.
* **Sync Yapısı (`fastpath_sync.js`):** Her FastPath dersi tamamlandığında veya hata düzeltildiğinde, veriler önce yerel depolamaya yazılır, ardından arka planda Firestore bulut veritabanıyla senkronize edilir (`pushToFirestore`).

---

## 2. Kod Mimarisi ve Dizin Yapısı

Proje, Google Chrome MV3 (Manifest V3) ve Vite paketleme standartlarına göre tasarlanmış modüler bir yapıya sahiptir.

```
LinguMark/
├── public/                 # Statik Varlıklar (Görseller, İkonlar, JSON Verileri)
│   └── data/               # FastPath Kelime Listeleri (fastpath_a2.json vb.)
├── src/                    # Kaynak Kodlar
│   ├── background/         # Arka Plan Servisleri (Service Worker)
│   ├── content/            # Web Sayfasına Enjekte Edilen Kodlar (DOM Manipülasyonu)
│   ├── popup/              # Extension Dropdown Pop-up Kodları
│   ├── premium/            # Abonelik ve Satın Alma Ekranı Kontrolleri
│   ├── shared/             # Ortak Servisler, Firebase, i18n ve Oxford Veri Bankası
│   └── dashboard/          # LinguMark Öğrenim Paneli
│       ├── apps/           # FastPath, Flashcard, Quiz ve İstatistik Uygulamaları
│       └── main.js         # Panel Görünüm Yöneticisi ve Sekme Yönlendirmeleri
├── dashboard.html          # Ana Öğrenim Arayüzü HTML şablonu
├── premium.html            # Premium Abonelik HTML şablonu
├── index.html              # Sözlük & Kelimelerim Ana HTML şablonu
└── welcome.html            # İlk Kurulum Hoş Geldiniz HTML şablonu
```

### Bileşenlerin Sorumlulukları ve Tasarım Desenleri

* **Service Locator & Modüler Yapı:** `src/shared` dizini altındaki servisler tek bir sorumluluğa (Single Responsibility) odaklanmıştır. `auth.js` sadece giriş-çıkış işlemlerini yönetirken, `premiumGuard.js` sadece yetki kapılarını denetler.
* **MVC & Pub-Sub Benzeri Mesajlaşma:** Background script (`background.js`) denetleyici (Controller) rolünü üstlenir. Content scriptlerden gelen mesajları (Event) dinler, model verisini (Storage) günceller ve arayüzlere (View) yeniden yükleme sinyali yollar.
* **State Management (fastpath.js):** FastPath modülünde durum yönetimi `ls` (Lesson State) adında reaktif bir bellek nesnesiyle yönetilir. Dersin hangi aşamada olduğu (`LEARN`, `TEST`, `RESULTS`), hata yapılan kelimeler (`mistakesSet`) tek elden kontrol edilir.

---

## 3. Sayfa (Page) ve Fonksiyon Bağımlılıkları (Dependency Tree)

Bu bölümde, kullanıcı arayüzlerinin arkasındaki kod bağımlılıkları ve fonksiyonların birbiriyle olan ilişkisi ayrıntılı olarak listelenmiştir.

### A. Dashboard Sayfası (`dashboard.html` -> `src/dashboard/main.js`)
Dashboard; tüm öğrenme merkezini, Oxford kütüphanesini ve istatistikleri barındıran ana modüldür.

```
src/dashboard/main.js
├── src/shared/i18n.js (Çoklu Dil Desteği)
├── src/shared/auth.js (Giriş Durumu Kontrolü)
├── src/shared/premiumGuard.js (Premium Kilidi Sorgulama)
├── src/shared/oxford.js (Oxford A2-C1 Kelime Veri Tabanı)
└── src/dashboard/apps/
    ├── remember.js (Spaced Repetition / Flashcard Modülü)
    ├── stats.js (Çalışma Grafikleri ve İstatistikler)
    └── fastpath.js (Duolingo Tarzı Öğrenim Patikası)
        ├── fastpath_data.js (Dinamik JSON Kelime Yükleyici)
        └── fastpath_sync.js (Firestore & Local İlerleme Senkronizasyonu)
```

#### Ana Fonksiyonlar ve Akışlar:
* `switchView(tabId)`: Menüdeki sekmeler arası (Kelimelerim, Hatırla, Oxford, FastPath, İstatistikler) pürüzsüz geçişleri sağlar ve ilgili alt uygulamayı tetikler.
* `renderWordList()`: Sözlükteki kayıtlı kelimeleri listeler, dil filtrelemesi yapar.
* `deleteWord(id)`: Sözlükten kelime siler ve tüm açık sayfalardaki vurguları güncellemek için `chrome.runtime.sendMessage` tetikler.

---

### B. FastPath Modülü (`src/dashboard/apps/fastpath.js`)
Ders/Harita akışını ve kilit sistemini kontrol eden en karmaşık modüldür.

#### Bağımlı Olduğu Fonksiyonlar:
* `loadLevelData(levelId)` (`fastpath_data.js`): `a2`, `b1` vb. seviyeler için `/public/data/fastpath_{level}.json` dosyalarını asenkron olarak yükler.
* `getLocalProgress()` (`fastpath_sync.js`): Kullanıcının yerel depolamadaki seviye ilerlemesini çeker.
* `updateLevelProgress(...)` & `pushToFirestore()` (`fastpath_sync.js`): Tamamlanan ders sonuçlarını bulut veritabanına yedekler.

#### Kilit ve Harita Fonksiyonları:
* `initFastPath(...)`: Modülü ilklendirir, seviye seçiciyi hazırlar ve haritayı çizer.
  * *Akıllı Scroll Mantığı:* Harita yüklendiğinde veya bir ders bittiğinde, sayfa en tepeye sıçramaz. `scrollToStepIndex` parametresi ile en son çözülen adımın (`fpStepNode-${index}`) olduğu yere **pürüzsüzce odaklanılır**.
* `renderUnits(...)`: Seviye altındaki üniteleri (Daily Life, City/Travel, Work/Education vb.) çizer.
  * **Ünite Bazlı Kilit Mantığı:** Her ünitenin en baştaki ilk adımı kilitsiz başlar. Ünite içindeki sonraki adımların açılması ise sıralı olarak bir önceki adımın `historyForLang` veya `currentStepIndex` içinde tamamlanmış olmasına bağlıdır.
* `startLesson(...)`: Seçilen adımın ders sürecini (`LEARN` aşaması) başlatır.
* `showNextLearn()`: Araştır butonu (`fpLearnSearchCard`) etkileşimlerini yönetir, tıklandığında Google Görseller üzerinde kelime araması başlatır.

---

### C. Premium Sayfası (`premium.html` -> `src/premium/main.js`)
Monetizasyon ve paket abonelik yönetiminin yürütüldüğü arayüzdür.

```
src/premium/main.js
├── src/shared/auth.js (loginWithGoogle, logout)
├── src/shared/firebase.js (db - Firestore Bağlantısı)
└── src/shared/premiumGuard.js (checkPremiumStatusAsync)
```

#### Ana Fonksiyonlar:
* `switchPackage(key)`: Aylık, 3 Aylık, 6 Aylık ve Yıllık fiyat paketleri arasındaki geçişleri yönetir. Altın sarısı degrade animasyonları ve indirim oranlarını anlık olarak arayüze basar.
* `buyBtn.onclick`: Firebase Firestore üzerinde `users/{uid}` belgesindeki `isPremium` alanını `true` yapar, yerel depolamayı günceller ve sayfayı yenileyerek premium kilidini açar.

---

### D. Web Röntgen Vurgulama Modülü (`src/content/content.js` & `content-injected.js`)
Kullanıcı herhangi bir web sayfasını ziyaret ettiğinde arka planda görünmez bir şekilde çalışan enjekte kod ağacıdır.

```
src/content/content.js
├── background.js (Tarayıcı Depolama Veri Paylaşımı)
└── src/content/content-injected.js
    ├── Quick Add Tooltip (Hızlı Kelime Ekleme Kutusu)
    └── Save Toast Popup (Kaydedildi Dil Düzenleme Paneli)
```

#### Ana Fonksiyonlar:
* `scanPageForWords()`: DOM ağacını kelime kelime tarar. Sözlükte kayıtlı olan kelimeleri bulduğunda üzerine özel bir `span.lingumark-highlight` sınıfı ve hover durumunda anlamını gösteren dinamik ipucu kutusu (tooltip) yerleştirir.
* `selectionchange` dinleyicisi: Metin seçimlerini izler. Eğer seçim tek kelimeden fazla ise background script'e mesaj yollayarak sağ tık menüsünü gizler. Eğer tek kelime ise o kelimenin geçtiği tüm cümleyi bağlam (context) olarak hafızaya alır.

---

## 4. Analiz Dışı Kalanlar / Kör Noktalar

Kod tabanı son derece temiz, modüler ve performansı optimize edilmiş durumdadır. Ancak analiz sırasında mimari bütünlük adına göz önünde bulundurulması gereken ufak detaylar şunlardır:

1. **Firestore Gerçek Zamanlı Dinleyici (Real-time Listener) Eksikliği:**
   * İlerleme kayıtları ders bitiminde Firestore'a basılmakta (`pushToFirestore`) ancak farklı bir cihazda (örneğin başka bir tarayıcıda) harita açıkken buluttan anlık veri çekilmemektedir. İlerleyen aşamalarda `onSnapshot` ile Firestore'daki ilerlemeler gerçek zamanlı olarak haritaya yansıtılabilir.
2. **Web Röntgen Dil Sınırı:**
   * Web Röntgen modülü (`saveWord` fonksiyonu) mimari gereği şu an için sadece İngilizce (`en`) kaynak dil tespiti yapmaktadır. Farklı dillerdeki kelimelerin de sayfalarda vurgulanabilmesi için dil eşleştirme mantığı genişletilebilir.
