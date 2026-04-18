chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "add-to-lingumark",
    title: "Add to LinguMark",
    contexts: ["selection"]
  });
  
  // Migration logic (Local to Sync)
  chrome.storage.local.get(['words'], (localData) => {
    chrome.storage.local.get(['masterSwitch', 'targetLang', 'words'], (syncData) => {
      const toSet = {};
      if (syncData.masterSwitch === undefined) toSet.masterSwitch = true;
      if (syncData.targetLang === undefined) toSet.targetLang = 'tr';
      
      // If words exist in local but not sync, or sync is empty, migrate them
      if (localData.words && localData.words.length > 0) {
        if (!syncData.words || syncData.words.length === 0) {
            toSet.words = localData.words;
            // Clear local words to complete migration
            chrome.storage.local.remove(['words']);
            console.log("LinguMark: Migrated words from local to sync storage.");
        }
      } else if (syncData.words === undefined) {
         toSet.words = [];
      }

      if (Object.keys(toSet).length > 0) {
        chrome.storage.local.set(toSet);
      }
    });
  });
});

// Premium: Global state for last captured context
let lastCapturedData = {
  sentence: "",
  sourceUrl: ""
};

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "UPDATE_CONTEXT") {
    lastCapturedData = {
      sentence: message.sentence,
      sourceUrl: message.sourceUrl
    };
  }
  if (message.type === "QUICK_ADD") {
     saveWord(message.word, message.id, message.meanings || {});
  }
});

async function saveWord(word, oxfordId, meanings) {
   const syncData = await chrome.storage.local.get(['targetLang', 'words']);
   const targetLang = syncData.targetLang || 'tr';
   const words = syncData.words || [];
   
   if (words.some(w => w.word.toLowerCase() === word.toLowerCase() && w.lang === targetLang)) return;

   // Use meanings passed from content script (no dynamic import needed)
   const meaning = (meanings && meanings[targetLang]) || (meanings && meanings['tr']) || '';

   const newEntry = {
      id: Date.now().toString(),
      word: word.toLowerCase(),
      meaning: meaning,
      lang: targetLang,
      dateAdded: new Date().toISOString(),
      isOxford: true,
      context: "Added via Web Röntgen",
      sourceUrl: "", 
      nextReviewDate: new Date().toISOString(),
      interval: 1,
      easeFactor: 2.5
   };
   words.push(newEntry);
   chrome.storage.local.set({ words });
}

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === "add-to-lingumark" && info.selectionText) {
    const word = info.selectionText.trim(); 
    
    if (!word) return;
    
    // Single word constraint (Reject multi-word selections like sentences)
    if (word.split(/\s+/).length > 1) {
      console.warn("LinguMark: Cannot add multiple words.", word);
      return;
    }

    try {
      const syncData = await chrome.storage.local.get(['targetLang']);
      const targetLang = syncData.targetLang || 'tr';

      const response = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLang}&dt=t&q=${encodeURIComponent(word)}`);
      
      let meaning = "No translation found.";
      if (response.ok) {
        const data = await response.json();
        if (data && data[0] && data[0][0] && data[0][0][0]) {
          meaning = data[0].map(item => item[0]).join(''); 
        }
      }

      chrome.storage.local.get({ words: [] }, (result) => {
        const words = result.words;
        
        const existingIndex = words.findIndex(w => w.word.toLowerCase() === word.toLowerCase() && w.lang === targetLang);
        const newEntry = {
          id: Date.now().toString(),
          word: word.toLowerCase(),
          meaning: meaning,
          lang: targetLang,
          dateAdded: new Date().toISOString(),
          // Premium: Contextual Memory fields
          context: (lastCapturedData.sentence && lastCapturedData.sentence.toLowerCase().includes(word.toLowerCase())) ? lastCapturedData.sentence : "",
          sourceUrl: lastCapturedData.sourceUrl || "",
          // Spaced Repetition (Hatırla) Module Schema
          nextReviewDate: new Date().toISOString(),
          interval: 0,
          easeFactor: 2.5
        };

        if (existingIndex !== -1) {
          // If rewriting, preserve spacing stats
          const old = words[existingIndex];
          old.meaning = meaning;
          words[existingIndex] = old;
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
