// Content-Loader.js - Content Script (Chrome API'ye erişim var)
// Bu script background'dan mesajları alıp page scriptin'e iletir ve tersi

console.log("LinguMark: Content-loader script başlatıldı");

// Background'dan storage verilerini al
async function loadStorageData() {
  try {
    const response = await new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({ type: 'GET_STORAGE' }, (response) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve(response);
        }
      });
    });
    
    // Storage verilerini injected script'e gönder
    window.postMessage({
      type: 'LINGUMARK_INIT_STORAGE',
      data: response
    }, '*');
    
    console.log("LinguMark: Storage verileri injected script'e gönderildi");
  } catch (error) {
    console.warn("LinguMark: Failed to load storage data:", error);
  }
}

// Oxford.json'u önceden yükle ve injected script'e gönder
async function loadOxfordDict() {
  try {
    const res = await fetch(chrome.runtime.getURL('oxford.json'));
    const oxfordData = await res.json();
    
    // Injected script için window'a event gönder
    window.postMessage({
      type: 'LINGUMARK_INIT_OXFORD',
      data: oxfordData
    }, '*');
    
    console.log("LinguMark: Oxford dictionary injected script'e gönderildi");
  } catch (e) {
    console.warn("LinguMark: Failed to load oxford.json", e);
  }
}

// Page script'ten gelen mesajları background'a iletir
window.addEventListener('message', (event) => {
  // Sadece bu sayfadan gelen mesajları al
  if (event.source !== window) return;
  
  if (event.data.type && event.data.type.startsWith('LINGUMARK_')) {
    console.log("LinguMark: Page script'ten mesaj alındı:", event.data);
    
    // Page script'ten gelen mesajı background'a gönder
    try {
      chrome.runtime.sendMessage(event.data, (response) => {
        // Service worker restart hatalarını yakala
        if (chrome.runtime.lastError) {
          return;
        }
        
        // Background'dan cevap gelirse, page script'e ilet
        window.postMessage({
          type: 'LINGUMARK_RESPONSE',
          originalType: event.data.type,
          response: response
        }, '*');
      });
    } catch (error) {
      // Sessiz fail
    }
  }
});

// Background'dan gelen mesajları page script'e iletir
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("LinguMark: Background'dan mesaj alındı:", message);
  
  // Background'dan gelen mesajı page script'e ilet
  window.postMessage({
    type: 'LINGUMARK_FROM_BACKGROUND',
    data: message
  }, '*');

  // Handle reload highlights specifically
  if (message.type === "RELOAD_HIGHLIGHTS") {
     window.postMessage({ type: 'LINGUMARK_RELOAD_REQ' }, '*');
  }
});

// Injected script'i DOM'a inject et
const script = document.createElement('script');
script.src = chrome.runtime.getURL('content-injected.js');
script.onload = function() {
  console.log("LinguMark: Content-injected script başarıyla yüklendi");
  this.remove();
  // Oxford dict'i ve storage verilerini yükle
  loadOxfordDict();
  loadStorageData();
};
script.onerror = function() {
  console.error("LinguMark: Content-injected script yükleme hatası");
  this.remove();
};
(document.head || document.documentElement).appendChild(script);
