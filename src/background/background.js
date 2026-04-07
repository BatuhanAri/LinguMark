chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "add-to-lingumark",
    title: "Add to LinguMark",
    contexts: ["selection"]
  });
  
  chrome.storage.sync.get(['masterSwitch', 'targetLang'], (result) => {
    const toSet = {};
    if (result.masterSwitch === undefined) toSet.masterSwitch = true;
    if (result.targetLang === undefined) toSet.targetLang = 'tr';
    if (Object.keys(toSet).length > 0) {
      chrome.storage.sync.set(toSet);
    }
  });
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === "add-to-lingumark" && info.selectionText) {
    const word = info.selectionText.trim(); // Keep original casing initially for better translation context
    
    if (!word) return;

    try {
      const syncData = await chrome.storage.sync.get(['targetLang']);
      const targetLang = syncData.targetLang || 'tr';

      const response = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLang}&dt=t&q=${encodeURIComponent(word)}`);
      
      let meaning = "No translation found.";
      if (response.ok) {
        const data = await response.json();
        if (data && data[0] && data[0][0] && data[0][0][0]) {
          // Combine multi-sentence translations if applicable
          meaning = data[0].map(item => item[0]).join(''); 
        }
      }

      chrome.storage.local.get({ words: [] }, (result) => {
        const words = result.words;
        
        const existingIndex = words.findIndex(w => w.word.toLowerCase() === word.toLowerCase() && w.lang === targetLang);
        const newEntry = {
          id: Date.now().toString(),
          word: word.toLowerCase(), // Save normalized version for highlighting
          meaning: meaning,
          lang: targetLang,
          dateAdded: new Date().toISOString()
        };

        if (existingIndex !== -1) {
          words[existingIndex] = newEntry;
        } else {
          words.push(newEntry);
        }

        chrome.storage.local.set({ words: words });
      });

    } catch (error) {
      console.error("LinguMark: Error fetching translation from Google API", error);
    }
  }
});
