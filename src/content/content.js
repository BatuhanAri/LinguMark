let isMasterSwitchEnabled = true;
let savedWords = [];

const tagsToIgnore = new Set([
  'SCRIPT', 'STYLE', 'NOSCRIPT', 'TEXTAREA', 'INPUT', 'CODE', 'PRE'
]);

async function init() {
  const syncData = await chrome.storage.local.get(['masterSwitch']);
  isMasterSwitchEnabled = syncData.masterSwitch ?? true;

  const syncDataWords = await chrome.storage.local.get(['words']);
  savedWords = syncDataWords.words || [];

  if (isMasterSwitchEnabled && savedWords.length > 0) {
    highlightWords();
  }
}

// Feature 1: Contextual Memory - Capture sentence on right-click
window.addEventListener('contextmenu', () => {
  const selection = window.getSelection();
  if (!selection.rangeCount) return;

  const range = selection.getRangeAt(0);
  const container = range.commonAncestorContainer;
  
  // Find surrounding sentence
  // We look at the parent element of the selection to find text
  const parent = container.nodeType === 3 ? container.parentNode : container;
  const fullText = parent.innerText || "";
  const selectedText = selection.toString().trim();
  
  if (!selectedText) return;

  // Simple sentence splitter logic
  const sentences = fullText.match(/[^\.!\?]+[\.!\?]+/g) || [fullText];
  const sentence = sentences.find(s => s.toLowerCase().includes(selectedText.toLowerCase())) || selectedText;

  chrome.runtime.sendMessage({
    type: "UPDATE_CONTEXT",
    sentence: sentence.trim().substring(0, 300), // Limit to 300 chars for safety
    sourceUrl: window.location.href
  });
});

// Feature 2: Web Röntgen - Receive scan request
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "RONTGEN_SCAN") {
    handleRontgenScan(message.levels);
  }
});

async function handleRontgenScan(levels) {
   // Import dictionary dynamically or from global if we bundle it
   // Since we use Vite, we might need to handle this via background or bundled oxford.js
   // For now, let's assume we can fetch it or it's provided
   const { oxfordDictionary } = await import('../shared/oxford.js');
   const filtered = oxfordDictionary.filter(w => levels.includes(w.level));
   highlightWords(filtered, "rontgen");
}

chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === 'sync' && changes.masterSwitch) {
    isMasterSwitchEnabled = changes.masterSwitch.newValue;
    if (isMasterSwitchEnabled) {
      highlightWords();
    } else {
      removeHighlights();
    }
  }

  // Handle words changes in sync
  if (areaName === 'sync' && changes.words) {
    savedWords = changes.words.newValue || [];
    if (isMasterSwitchEnabled) {
      removeHighlights();
      if (savedWords.length > 0) highlightWords();
    }
  }
});

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
      // Add superscript for saved words
      const sup = document.createElement('sup');
      sup.className = 'lingumark-badge';
      sup.textContent = 'L';
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
         // Quick add logic could go here
         chrome.runtime.sendMessage({ type: "QUICK_ADD", word: wordObjMatch.word, id: wordObjMatch.id });
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
