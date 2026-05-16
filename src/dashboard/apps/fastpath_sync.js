/**
 * FastPath Sync Module
 * Local (chrome.storage.local) ↔ Firestore senkronizasyonu
 * 
 * Strateji:
 * - Session sırasında: sadece chrome.storage.local'a yaz (ücretsiz, hızlı)
 * - Session bitince: Firestore'a tek batch write
 * - App açılışında: Firestore'dan çek, local'a senkronize et (1 read)
 * - Conflict resolution: Math.max (progress geri gitmez)
 */

import { db } from '../../shared/firebase.js';
import { auth } from '../../shared/auth.js';
import { doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';

const STORAGE_KEY = 'fastPathLocal';

// ====== LOCAL STORAGE ======

/**
 * Local progress'i okur
 * @returns {Promise<Object>}
 */
export async function getLocalProgress() {
    return new Promise((resolve) => {
        chrome.storage.local.get(STORAGE_KEY, (res) => {
            resolve(res[STORAGE_KEY] || { activeLevel: 'a2', levels: {} });
        });
    });
}

/**
 * Local progress'i günceller
 * @param {Object} data
 */
export async function setLocalProgress(data) {
    return new Promise((resolve) => {
        chrome.storage.local.set({ [STORAGE_KEY]: data }, resolve);
    });
}

/**
 * Belirli bir seviyenin progress'ini günceller
 * @param {string} level - 'a2', 'b1', etc.
 * @param {Object} levelData - { progress, mistakes, history }
 */
export async function updateLevelProgress(level, levelData) {
    const local = await getLocalProgress();
    if (!local.levels) local.levels = {};
    local.levels[level] = { ...local.levels[level], ...levelData };
    await setLocalProgress(local);
}

/**
 * Aktif seviyeyi değiştirir
 * @param {string} level
 */
export async function setActiveLevel(level) {
    const local = await getLocalProgress();
    local.activeLevel = level;
    await setLocalProgress(local);
}

// ====== FIRESTORE SYNC ======

/**
 * Firestore'dan progress çeker ve local ile merge eder
 * App açılışında bir kez çağrılır (1 read)
 */
export async function pullFromFirestore() {
    const user = auth.currentUser;
    if (!user) return;

    try {
        const userRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(userRef);
        
        if (!docSnap.exists()) return;
        
        const serverFP = docSnap.data().fastPath;
        if (!serverFP) return;

        const local = await getLocalProgress();
        const merged = mergeProgress(local, serverFP);
        await setLocalProgress(merged);
    } catch (e) {
        console.error('FastPath Firestore pull failed:', e);
    }
}

/**
 * Local progress'i Firestore'a yazar
 * Session bittiğinde çağrılır (1 write)
 */
export async function pushToFirestore() {
    const user = auth.currentUser;
    if (!user) return;

    try {
        const local = await getLocalProgress();
        const userRef = doc(db, 'users', user.uid);
        
        const docSnap = await getDoc(userRef);
        if (docSnap.exists()) {
            await updateDoc(userRef, { fastPath: local });
        } else {
            await setDoc(userRef, { fastPath: local }, { merge: true });
        }
    } catch (e) {
        console.error('FastPath Firestore push failed:', e);
    }
}

/**
 * İki progress objesini merge eder
 * Conflict resolution: Math.max (progress geri gitmez)
 */
function mergeProgress(local, server) {
    const merged = {
        activeLevel: local.activeLevel || server.activeLevel || 'a2',
        levels: {}
    };

    const allLevels = new Set([
        ...Object.keys(local.levels || {}),
        ...Object.keys(server.levels || {})
    ]);

    for (const level of allLevels) {
        const l = local.levels?.[level] || {};
        const s = server.levels?.[level] || {};

        merged.levels[level] = {
            progress: Math.max(l.progress || 0, s.progress || 0),
            completed: (l.completed || false) || (s.completed || false),
            mistakes: l.mistakes || s.mistakes || [],
            history: { ...(s.history || {}), ...(l.history || {}) }
        };
    }

    return merged;
}
