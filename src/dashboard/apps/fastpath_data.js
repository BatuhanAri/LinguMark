/**
 * FastPath Data Loader
 * Seviye bazlı JSON dosyalarını yükler (local extension dosyalarından)
 */

let loadedLevels = {};

/**
 * Belirtilen seviyenin kelime datasını yükler
 * @param {string} level - 'a2', 'b1', 'b2', 'c1'
 * @returns {Promise<Object|null>} Parsed JSON data veya null (hata durumunda)
 */
export async function loadLevelData(level) {
    // Zaten yüklenmişse tekrar parse etme
    if (loadedLevels[level]) return loadedLevels[level];

    try {
        const url = chrome.runtime.getURL(`data/fastpath_${level}.json`);
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        
        const data = await res.json();
        
        // Basit schema validation
        if (!data.units || !Array.isArray(data.units)) {
            throw new Error('Invalid schema: missing units array');
        }

        loadedLevels[level] = data;
        return data;
    } catch (e) {
        console.error(`FastPath data load failed for ${level}:`, e);
        return null;
    }
}

/**
 * Yüklenmiş level cache'ini temizler (memory cleanup)
 */
export function clearLoadedData() {
    loadedLevels = {};
}

/**
 * Belirtilen seviyenin toplam kelime sayısını döner
 * @param {string} level
 * @returns {number}
 */
export function getWordCount(level) {
    if (!loadedLevels[level]) return 0;
    return loadedLevels[level].units.reduce((sum, u) => sum + u.words.length, 0);
}
