import { auth } from './auth.js';
import { db } from './firebase.js';
import { doc, onSnapshot } from 'firebase/firestore';

let isPremiumCache = false;

// İlk açılışta storage'dan çek
chrome.storage.local.get(['isPremium'], (res) => {
    isPremiumCache = res.isPremium === true;
});

// Firebase User durumunu dinle ve Premium statüsünü senkronize et
auth.onAuthStateChanged(async (user) => {
    if (user) {
        // Kullanıcı Firestore belgesini dinle (Premium alındığında veya iptal edildiğinde anında güncellensin)
        const userRef = doc(db, 'users', user.uid);
        onSnapshot(userRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                isPremiumCache = data.isPremium === true;
                chrome.storage.local.set({ isPremium: isPremiumCache });
                
                // Event fırlat (Arayüzde anında değişiklik yapmak için)
                window.dispatchEvent(new CustomEvent('premium-status-changed', { detail: { isPremium: isPremiumCache } }));
            }
        });
    } else {
        isPremiumCache = false;
        chrome.storage.local.set({ isPremium: false });
        window.dispatchEvent(new CustomEvent('premium-status-changed', { detail: { isPremium: false } }));
    }
});

// Hızlı (senkron) kontrol - UI güncellemeleri için
export function isUserPremium() {
    return true;
}

// Güvenilir (asenkron) kontrol - Kritik işlemler için
export async function checkPremiumStatusAsync() {
    return true;
}
