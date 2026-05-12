import { loginWithGoogle, logout, listenAuthState, auth } from '../shared/auth.js';
import { db } from '../shared/firebase.js';
import { doc, updateDoc } from 'firebase/firestore';
import { checkPremiumStatusAsync } from '../shared/premiumGuard.js';

document.addEventListener('DOMContentLoaded', () => {
    const authContainer = document.getElementById('authContainer');

    listenAuthState(async (user) => {
        if (user) {
            // Kullanıcı giriş yapmış, premium durumunu kontrol et
            const isPremium = await checkPremiumStatusAsync();
            
            if (isPremium) {
                authContainer.innerHTML = `
                    <div class="text-center py-8 rounded-2xl bg-gradient-to-b from-green-500/20 to-transparent border border-green-500/40 shadow-[0_0_40px_rgba(34,197,94,0.2)] relative overflow-hidden">
                        <div class="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMiIgY3k9IjIiIHI9IjEiIGZpbGw9IiMzNGQzOTkiIGZpbGwtb3BhY2l0eT0iMC4yIi8+PC9zdmc+')] opacity-50 pointer-events-none"></div>
                        <div class="w-16 h-16 mx-auto bg-green-500/20 rounded-full flex items-center justify-center mb-4 border border-green-400/50 relative z-10">
                            <svg class="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/></svg>
                        </div>
                        <p class="text-2xl text-green-400 font-black mb-1 relative z-10">Premium Aktif!</p>
                        <p class="text-sm text-green-300/80 font-medium mb-6 relative z-10">${user.email}</p>
                        <button id="dashboardBtn" class="px-8 py-3 rounded-xl font-bold text-[#0b0e14] bg-green-400 hover:bg-green-300 transition-all shadow-[0_0_20px_rgba(74,222,128,0.4)] relative z-10">
                            Öğrenmeye Başla
                        </button>
                    </div>
                `;

                document.getElementById('dashboardBtn').addEventListener('click', () => {
                    chrome.tabs.create({ url: chrome.runtime.getURL('dashboard.html') });
                });
            } else {
                authContainer.innerHTML = `
                    <p class="text-xs text-slate-400 mb-3 text-center">Giriş yapıldı: ${user.email}</p>
                    <a href="#" id="buyBtn" class="w-full flex items-center justify-center py-4 rounded-xl font-black text-[#0b0e14] bg-gradient-to-r from-yellow-300 to-yellow-500 hover:from-yellow-200 hover:to-yellow-400 transition-all shadow-[0_0_20px_rgba(250,204,21,0.3)]">
                        Şimdi Satın Al
                    </a>
                    <button id="logoutBtn" class="w-full mt-3 py-2 text-xs font-bold text-slate-500 hover:text-slate-300 transition-colors">
                        Farklı Hesapla Giriş Yap
                    </button>
                `;
                
                document.getElementById('buyBtn').addEventListener('click', (e) => {
                    e.preventDefault();
                    
                    const btn = document.getElementById('buyBtn');
                    const originalText = btn.innerHTML;
                    btn.innerHTML = '<span class="animate-pulse">Ödeme İşleniyor...</span>';
                    btn.disabled = true;
                    
                    // Mock Payment Process for local development
                    setTimeout(async () => {
                        try {
                            if (auth.currentUser) {
                                const userRef = doc(db, 'users', auth.currentUser.uid);
                                await updateDoc(userRef, { isPremium: true });
                            }
                            await chrome.storage.local.set({ isPremium: true });
                            // A reload will trigger checkPremiumStatusAsync again
                            window.location.reload();
                        } catch (err) {
                            console.error('Ödeme simülasyonunda hata:', err);
                            btn.innerHTML = originalText;
                            btn.disabled = false;
                        }
                    }, 1500);
                });
                
                document.getElementById('logoutBtn').addEventListener('click', () => {
                    logout();
                });
            }
        } else {
            // Kullanıcı giriş yapmamış
            authContainer.innerHTML = `
                <button id="loginBtn" class="w-full py-4 rounded-xl font-black text-[#0b0e14] bg-gradient-to-r from-yellow-300 to-yellow-500 hover:from-yellow-200 hover:to-yellow-400 transition-all shadow-[0_0_20px_rgba(250,204,21,0.3)] flex items-center justify-center gap-3">
                  <svg class="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                  Google ile Giriş Yap & Satın Al
                </button>
            `;
            
            document.getElementById('loginBtn').addEventListener('click', async () => {
                const btn = document.getElementById('loginBtn');
                const originalText = btn.innerHTML;
                btn.innerHTML = 'Bağlanıyor...';
                btn.disabled = true;
                
                try {
                    await loginWithGoogle();
                } catch (e) {
                    console.error(e);
                    btn.innerHTML = originalText;
                    btn.disabled = false;
                    alert('Giriş yapılamadı: ' + e.message);
                }
            });
        }
    });
});
