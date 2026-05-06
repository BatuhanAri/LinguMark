import { app, db } from './firebase.js';
import { getAuth, signInWithCredential, GoogleAuthProvider, signOut, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export const auth = getAuth(app);

// Chrome Identity API üzerinden token alır
function getChromeToken(interactive = true) {
    return new Promise((resolve, reject) => {
        chrome.identity.getAuthToken({ interactive }, (token) => {
            if (chrome.runtime.lastError) {
                return reject(chrome.runtime.lastError);
            }
            resolve(token);
        });
    });
}

// Google ile Giriş Yap (Firebase)
export async function loginWithGoogle() {
    try {
        const token = await getChromeToken(true);
        if (!token) throw new Error("Token alınamadı");

        const credential = GoogleAuthProvider.credential(null, token);
        const result = await signInWithCredential(auth, credential);
        const user = result.user;
        
        // Kullanıcı Firestore'da var mı kontrol et, yoksa oluştur (isPremium: false ile)
        const userRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(userRef);
        
        if (!docSnap.exists()) {
            await setDoc(userRef, {
                email: user.email,
                name: user.displayName,
                isPremium: false,
                createdAt: new Date().toISOString()
            });
        }
        
        return user;
    } catch (error) {
        console.error("Giriş hatası:", error);
        throw error;
    }
}

// Çıkış Yap
export async function logout() {
    try {
        await signOut(auth);
        
        // Chrome üzerindeki token'ı temizle ki hesap değiştirilebilsin
        const token = await getChromeToken(false).catch(() => null);
        if (token) {
            await new Promise((resolve) => {
                const url = 'https://accounts.google.com/o/oauth2/revoke?token=' + token;
                window.fetch(url);
                chrome.identity.removeCachedAuthToken({ token }, () => resolve());
            });
        }
    } catch (e) {
        console.error("Çıkış yaparken hata:", e);
    }
}

// Auth durumunu dinle
export function listenAuthState(callback) {
    return onAuthStateChanged(auth, callback);
}
