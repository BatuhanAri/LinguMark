/**
 * FastPath Global Constants
 * CDN, seviye konfigürasyonu, timeout ve versiyon sabitleri
 */

// jsDelivr CDN base URL — tag bazlı cache (1 yıl)
// GitHub repo oluşturulduktan sonra USERNAME/REPO güncellenmeli
export const CDN_BASE = 'https://cdn.jsdelivr.net/gh/BatuhanAri/lingumark-assets@v1.0/images';

// Fallback CDN (jsDelivr down olursa)
export const CDN_FALLBACK = 'https://raw.githubusercontent.com/BatuhanAri/lingumark-assets/main/images';

// Desteklenen CEFR seviyeleri
export const LEVELS = [
    { id: 'a2', label: 'A2', title: 'Elementary', icon: '🌱', free: true },
    { id: 'b1', label: 'B1', title: 'Intermediate', icon: '📘', free: false },
    { id: 'b2', label: 'B2', title: 'Upper-Intermediate', icon: '🚀', free: false },
    { id: 'c1', label: 'C1', title: 'Advanced', icon: '🎓', free: false },
];

// Veri versiyonları — cache invalidation için
export const DATA_VERSION = 1;

// Timeout ve retry sabitleri
export const IMAGE_TIMEOUT = 5000;    // 5 saniye
export const IMAGE_MAX_RETRIES = 2;
export const PREFETCH_AHEAD = 2;      // Aktif karttan sonraki 2 görseli prefetch et

// Ünite başına kelime sayısı
export const WORDS_PER_UNIT = 8;
