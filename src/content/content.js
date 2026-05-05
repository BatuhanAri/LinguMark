let isMasterSwitchEnabled = true;
let savedWords = [];
let oxfordDictionary = []; // Loaded dynamically via fetch

// Verify chrome API is available
if (typeof chrome === 'undefined') {
  console.error("LinguMark: Chrome API not available. This script should run as a content script.");
}

const tagsToIgnore = new Set([
  'SCRIPT', 'STYLE', 'NOSCRIPT', 'TEXTAREA', 'INPUT', 'CODE', 'PRE'
]);

async function init() {
  const syncData = await chrome.storage.local.get(['masterSwitch', 'words']);
  isMasterSwitchEnabled = syncData.masterSwitch ?? true;
  savedWords = syncData.words || [];

  // Load Oxford Dictionary for Rontgen feature locally (large file)
  try {
    const res = await fetch(chrome.runtime.getURL('oxford.json'));
    oxfordDictionary = await res.json();
  } catch (e) {
    console.warn("LinguMark: Failed to load oxford.json", e);
  }

  if (isMasterSwitchEnabled && savedWords.length > 0) {
    highlightWords();
  }
}

// Feature 1: Contextual Memory & Context Menu Visibility - Capture sentence on right-click
window.addEventListener('contextmenu', () => {
  // 1. Context Menu Visibility Update
  updateMenuVisibility();

  // 2. Contextual Memory Update
  const selection = window.getSelection();
  if (!selection.rangeCount) return;

  const range = selection.getRangeAt(0);
  const container = range.commonAncestorContainer;
  
  const parent = container.nodeType === 3 ? container.parentNode : container;
  const fullText = parent.innerText || "";
  const selectedText = selection.toString().trim();
  
  if (!selectedText) return;

  const sentences = fullText.match(/[^\.!\?]+[\.!\?]+/g) || [fullText];
  const sentence = sentences.find(s => s.toLowerCase().includes(selectedText.toLowerCase())) || selectedText;

  try {
    if (typeof chrome !== 'undefined' && chrome.runtime) {
      chrome.runtime.sendMessage({
        type: "UPDATE_CONTEXT",
        sentence: sentence.trim().substring(0, 300), 
        sourceUrl: window.location.href
      });
    }
  } catch (error) {
    console.warn("LinguMark: Failed to send context message:", error);
  }
});

/**
 * Robust word counting logic (Synced with background.js)
 */
function getWordCount(text) {
  if (!text) return 0;
  const cleanText = text.replace(/[\p{P}\p{S}]/gu, ' ');
  const tokens = cleanText.trim().split(/\s+/).filter(t => t.length > 0);
  return tokens.length;
}

let lastMenuState = null;
function updateMenuVisibility() {
  const selection = window.getSelection().toString().trim();
  const isSingleWord = getWordCount(selection) === 1;

  if (isSingleWord !== lastMenuState) {
    lastMenuState = isSingleWord;
    try {
      if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id) {
        chrome.runtime.sendMessage({ type: "TOGGLE_MENU", visible: isSingleWord });
      }
    } catch (e) { /* Tab context might be dead */ }
  }
}

// Global selection tracking
document.addEventListener('selectionchange', updateMenuVisibility);

// Feature 2: Web Röntgen - Receive scan request
if (typeof chrome !== 'undefined' && chrome.runtime) {
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === "RONTGEN_SCAN") {
      handleRontgenScan(message.levels);
    }
    if (message.type === "CLEAR_SCAN") {
      removeRontgenHighlights();
    }
    if (message.type === "SHOW_SAVE_TOAST") {
      showSaveToast(message.word, message.lang, message.id);
    }
  });
}

function removeRontgenHighlights() {
  const marks = document.querySelectorAll('span.lingumark-rontgen');
  marks.forEach(span => {
    const parent = span.parentNode;
    // Keep text, remove span
    const text = span.childNodes[0].nodeValue;
    parent.replaceChild(document.createTextNode(text), span);
    parent.normalize();
  });
}

function showToast(text) {
  const toast = document.createElement('div');
  toast.className = 'lingumark-toast';
  toast.textContent = text;
  document.body.appendChild(toast);
  setTimeout(() => toast.classList.add('show'), 100);
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 2500);
}

function showSaveToast(word, lang, wordId) {
  // Remove existing toast if any
  const existing = document.querySelector('.lingumark-toast.interactive');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.className = 'lingumark-toast interactive';
  toast.style.pointerEvents = 'auto'; // allow interacting with select
  toast.style.zIndex = '2147483647';
  
  toast.innerHTML = `
    <div style="display: flex; flex-direction: column; gap: 8px; align-items: flex-start; pointer-events: auto;">
      <div><span style="font-weight: 900; color: #fff;">${word}</span> eklendi!</div>
      <div style="font-size: 11px; display: flex; align-items: center; gap: 6px;">
        <span style="color: #cbd5e1;">Dil (Oto):</span>
        <select class="lingumark-lang-select" style="background: rgba(0,0,0,0.5); border: 1px solid rgba(255,255,255,0.2); color: white; border-radius: 4px; padding: 2px 4px; font-size: 11px; cursor: pointer; outline: none; pointer-events: auto;">
          <option value="en" ${lang === 'en' ? 'selected' : ''}>English</option>
          <option value="es" ${lang === 'es' ? 'selected' : ''}>Spanish</option>
          <option value="fr" ${lang === 'fr' ? 'selected' : ''}>French</option>
          <option value="de" ${lang === 'de' ? 'selected' : ''}>German</option>
          <option value="it" ${lang === 'it' ? 'selected' : ''}>Italian</option>
          <option value="tr" ${lang === 'tr' ? 'selected' : ''}>Turkish</option>
        </select>
      </div>
    </div>
  `;
  document.body.appendChild(toast);
  
  const select = toast.querySelector('.lingumark-lang-select');
  select.addEventListener('change', (e) => {
     const newLang = e.target.value;
     if (typeof chrome !== 'undefined' && chrome.storage) {
       chrome.storage.local.get(['words'], (res) => {
          const words = res.words || [];
          const idx = words.findIndex(w => w.id === wordId);
          if (idx !== -1) {
             words[idx].lang = newLang;
             chrome.storage.local.set({ words });
             e.target.style.borderColor = '#4ade80';
             setTimeout(() => { if(e.target) e.target.style.borderColor = 'rgba(255,255,255,0.2)'; }, 1000);
          }
       });
     }
  });

  setTimeout(() => toast.classList.add('show'), 10);
  
  let timeout;
  const startTimeout = () => {
    timeout = setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  };
  startTimeout();
  
  toast.addEventListener('mouseenter', () => clearTimeout(timeout));
  toast.addEventListener('mouseleave', startTimeout);
}

function handleRontgenScan(levels) {
  const filtered = oxfordDictionary.filter(w => levels.includes(w.level));
  highlightWords(filtered, "rontgen");
}

if (typeof chrome !== 'undefined' && chrome.storage) {
  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === 'local' && changes.masterSwitch) {
      isMasterSwitchEnabled = changes.masterSwitch.newValue;
      if (isMasterSwitchEnabled) {
        highlightWords();
      } else {
        removeHighlights();
      }
    }

    // Handle words changes in local
    if (areaName === 'local' && changes.words) {
      savedWords = changes.words.newValue || [];
      if (isMasterSwitchEnabled) {
        removeHighlights();
        if (savedWords.length > 0) highlightWords();
      }
    }
  });
}

function removeHighlights() {
  const marks = document.querySelectorAll('span.lingumark-word');
  marks.forEach(span => {
    const parent = span.parentNode;
    // Just replace span with its raw text content if we remove feature
    parent.replaceChild(document.createTextNode(span.textContent.replace(/L$/, '')), span);
    parent.normalize();
  });
}

function processTextNode(node, wordsToHighlight, type = "normal") {
  const content = node.nodeValue;
  if (!content || !content.trim()) return null;

  let earliestMatch = null;
  let textMatch = null;
  let wordObjMatch = null;

  for (const wordObj of wordsToHighlight) {
    const word = wordObj.word;
    const regex = new RegExp(`\\b${escapeRegExp(word)}\\b`, 'gi');
    let matchArr;
    while ((matchArr = regex.exec(content)) !== null) {
      if (earliestMatch === null || matchArr.index < earliestMatch) {
         // Skip if word is already highlighted or too short
         if (node.parentNode && node.parentNode.classList && node.parentNode.classList.contains('lingumark-word')) continue;
         
         earliestMatch = matchArr.index;
         textMatch = matchArr[0];
         wordObjMatch = wordObj;
      }
    }
  }

  if (earliestMatch !== null) {
    const matchLength = textMatch.length;
    const beforeNode = node;
    const matchNode = beforeNode.splitText(earliestMatch);
    const afterNode = matchNode.splitText(matchLength);

    const span = document.createElement('span');
    span.className = type === "rontgen" ? 'lingumark-rontgen' : 'lingumark-word';
    
    // Add text securely
    span.appendChild(document.createTextNode(matchNode.nodeValue));

    if (type === "normal") {
      const sup = document.createElement('sup');
      sup.textContent = 'L';
      sup.style.color = 'blue';
      sup.style.fontFamily = '"Cambria Math", "STIX Two Math", serif';
      sup.style.fontStyle = 'italic';
      sup.style.fontWeight = 'bold';
      span.appendChild(sup);
    } else {
      // Add small level badge for rontgen
      const levelBadge = document.createElement('sub');
      levelBadge.className = 'rontgen-level-badge';
      levelBadge.textContent = wordObjMatch.level;
      span.appendChild(levelBadge);
      
      // Feature 1.1: Clicking rontgen word opens a quick-save toast or logic
      span.title = `Oxford ${wordObjMatch.level}: ${wordObjMatch.word}. Çift tıkla kütüphanene ekle!`;
      span.addEventListener('dblclick', async (e) => {
         e.preventDefault();
         try {
           if (typeof chrome !== 'undefined' && chrome.runtime) {
             chrome.runtime.sendMessage({ 
               type: "QUICK_ADD", 
               word: wordObjMatch.word, 
               id: wordObjMatch.id,
               meanings: wordObjMatch.meanings // Pass all language meanings
             });
           }
         } catch (error) {
           console.warn("LinguMark: Failed to send QUICK_ADD message:", error);
         }
         showToast(`✓ ${wordObjMatch.word} eklendi!`);
         span.classList.remove('lingumark-rontgen');
         span.classList.add('lingumark-word');
      });
    }

    let isTranslated = false;
    const originalNodeText = matchNode.nodeValue;

    // Right Cick Event to transform context
    span.addEventListener('contextmenu', (e) => {
      if (type === "rontgen") return; // Handled differently
      e.preventDefault(); 
      
      const translation = wordObjMatch.meaning || "Translating...";
      
      if (!isTranslated) {
        span.innerHTML = "";
        span.appendChild(document.createTextNode(translation));
        span.classList.remove('lingumark-word');
        span.style.color = '#10b981'; 
        span.style.fontWeight = '700';
        span.style.cursor = 'pointer';
        span.style.textDecoration = 'none';
        span.title = `Original: ${wordObjMatch.word} (Sağ tıkla eski haline döndür)`;
        isTranslated = true;
      } else {
        span.innerHTML = "";
        span.appendChild(document.createTextNode(originalNodeText));
        const sup = document.createElement('sup');
        sup.className = 'lingumark-badge';
        sup.textContent = 'L';
        span.appendChild(sup);
        span.classList.add('lingumark-word');
        span.style.color = '';
        span.style.fontWeight = '';
        span.style.cursor = '';
        span.style.textDecoration = '';
        span.title = '';
        isTranslated = false;
      }
    });

    matchNode.parentNode.replaceChild(span, matchNode);
    return afterNode;
  }
  return null;
}

function highlightWords(words = savedWords, type = "normal") {
  if (!words.length) return;

  const walker = document.createTreeWalker(
    document.body,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode: function(node) {
        let parent = node.parentNode;
        while (parent && parent !== document.body) {
          if (tagsToIgnore.has(parent.tagName) || parent.isContentEditable) {
            return NodeFilter.FILTER_REJECT;
          }
          if (parent.tagName === 'SPAN' && (parent.classList.contains('lingumark-word') || parent.classList.contains('lingumark-rontgen'))) {
             return NodeFilter.FILTER_REJECT;
          }
          parent = parent.parentNode;
        }
        return NodeFilter.FILTER_ACCEPT;
      }
    }
  );

  let node;
  const nodesToProcess = [];
  while (node = walker.nextNode()) {
    nodesToProcess.push(node);
  }

  nodesToProcess.forEach(textNode => {
    let currNode = textNode;
    while (currNode) {
      currNode = processTextNode(currNode, words, type);
    }
  });
}

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

init();
