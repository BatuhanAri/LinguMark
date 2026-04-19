// content-injected.js - Sayfa context'inde çalışan script (Chrome API erişimi YOK, DOM erişimi VAR)
// Content-loader.js'e aracılığıyla mesaj gönder/alır

let isMasterSwitchEnabled = true;
let savedWords = [];
let oxfordDictionary = [];
let precompiledRegex = null;

const tagsToIgnore = new Set([
  'SCRIPT', 'STYLE', 'NOSCRIPT', 'TEXTAREA', 'INPUT', 'CODE', 'PRE'
]);

console.log("LinguMark: Content-injected script başlatıldı");

let dataLoaded = {
  oxford: false,
  storage: false
};

// Content-loader'dan gelen mesajları dinle
window.addEventListener('message', (event) => {
  if (event.source !== window) return;
  
  if (event.data.type === 'LINGUMARK_FROM_BACKGROUND') {
    const message = event.data.data;
    
    if (message.type === "RONTGEN_SCAN") {
      handleRontgenScan(message.levels);
    }
    if (message.type === "CLEAR_SCAN") {
      removeRontgenHighlights();
    }
  }
  
  // Instant Reload Request from content-loader (who got it from background)
  if (event.data.type === 'LINGUMARK_RELOAD_REQ') {
    // Page script cannot access storage, ask loader to fetch it
    window.postMessage({ type: 'LINGUMARK_GET_STORAGE_REQ' }, '*');
  }
  
  // Oxford dictionary'yi content-loader'dan al
  if (event.data.type === 'LINGUMARK_INIT_OXFORD') {
    oxfordDictionary = event.data.data;
    dataLoaded.oxford = true;
    checkAndInit();
  }
  
  // Storage verileri content-loader'dan al
  if (event.data.type === 'LINGUMARK_INIT_STORAGE') {
    const storageData = event.data.data;
    isMasterSwitchEnabled = storageData.masterSwitch ?? true;
    savedWords = storageData.words || [];
    updateRegexCache();
    dataLoaded.storage = true;
    checkAndInit();
  }
  
  // Storage update mesajları
  if (event.data.type === 'LINGUMARK_STORAGE_UPDATE') {
    if (event.data.masterSwitch !== undefined) {
      isMasterSwitchEnabled = event.data.masterSwitch;
    }
    if (event.data.savedWords) {
      savedWords = event.data.savedWords;
      updateRegexCache();
      if (isMasterSwitchEnabled && savedWords.length > 0) {
        removeHighlights();
        highlightWords();
      }
    }
  }
});

function updateRegexCache() {
  if (!savedWords.length) {
    precompiledRegex = null;
    return;
  }
  // Sort by length descending to match longer phrases first
  const sorted = [...savedWords].sort((a, b) => b.word.length - a.word.length);
  const pattern = sorted.map(w => escapeRegExp(w.word)).join('|');
  precompiledRegex = new RegExp(`\\b(${pattern})\\b`, 'gi');
}

function checkAndInit() {
  if (dataLoaded.oxford && dataLoaded.storage) {
    initWithData();
  }
}

async function initWithData() {
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
  
  const parent = container.nodeType === 3 ? container.parentNode : container;
  const fullText = parent.innerText || "";
  const selectedText = selection.toString().trim();
  
  if (!selectedText) return;

  const sentences = fullText.match(/[^\.!\?]+[\.!\?]+/g) || [fullText];
  const sentence = sentences.find(s => s.toLowerCase().includes(selectedText.toLowerCase())) || selectedText;

  window.postMessage({
    type: "LINGUMARK_UPDATE_CONTEXT",
    sentence: sentence.trim().substring(0, 300),
    sourceUrl: window.location.href
  }, '*');
});

function removeRontgenHighlights() {
  const marks = document.querySelectorAll('span.lingumark-rontgen');
  marks.forEach(span => {
    const parent = span.parentNode;
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

function handleRontgenScan(levels) {
  const filtered = oxfordDictionary.filter(w => levels.includes(w.level));
  highlightWords(filtered, "rontgen");
  
  // Notify Loader that scan is complete so Popup can close
  window.postMessage({ type: "LINGUMARK_SCAN_DONE" }, "*");
}

function removeHighlights() {
  const marks = document.querySelectorAll('span.lingumark-word');
  marks.forEach(span => {
    const parent = span.parentNode;
    // Premium remove logic: just keep the primary text node, remove the badge
    const text = span.childNodes[0].nodeValue;
    parent.replaceChild(document.createTextNode(text), span);
    parent.normalize();
  });
}

function processTextNode(node, wordsToHighlight, type = "normal") {
  const content = node.nodeValue;
  if (!content || !content.trim()) return null;

  let matchArr;
  let wordObjMatch = null;
  let earliestMatch = null;
  let textMatch = null;

  if (type === "normal") {
    if (!precompiledRegex) return null;
    precompiledRegex.lastIndex = 0;
    matchArr = precompiledRegex.exec(content);
    if (matchArr) {
      earliestMatch = matchArr.index;
      textMatch = matchArr[0];
      wordObjMatch = savedWords.find(w => w.word.toLowerCase() === textMatch.toLowerCase());
    }
  } else {
    // For Röntgen, we still use individual check or a temporary regex
    for (const wordObj of wordsToHighlight) {
      const regex = new RegExp(`\\b${escapeRegExp(wordObj.word)}\\b`, 'gi');
      const m = regex.exec(content);
      if (m) {
        if (earliestMatch === null || m.index < earliestMatch) {
          earliestMatch = m.index;
          textMatch = m[0];
          wordObjMatch = wordObj;
        }
      }
    }
  }

  if (earliestMatch !== null) {
    const matchLength = textMatch.length;
    const matchNode = node.splitText(earliestMatch);
    const afterNode = matchNode.splitText(matchLength);

    const span = document.createElement('span');
    span.className = type === "rontgen" ? 'lingumark-rontgen' : 'lingumark-word';
    span.appendChild(document.createTextNode(matchNode.nodeValue));

    if (type === "normal") {
      const sup = document.createElement('sup');
      sup.className = 'lingumark-badge';
      sup.textContent = 'L';
      span.appendChild(sup);
    } else {
      const levelBadge = document.createElement('sup');
      levelBadge.className = 'rontgen-level-badge';
      levelBadge.textContent = wordObjMatch.level;
      span.appendChild(levelBadge);
      
      span.title = `Oxford ${wordObjMatch.level}: ${wordObjMatch.word}. Çift tıkla kütüphanene ekle!`;
      span.addEventListener('dblclick', async (e) => {
        e.preventDefault();
        window.postMessage({
          type: "LINGUMARK_QUICK_ADD",
          word: wordObjMatch.word,
          id: wordObjMatch.id,
          meanings: wordObjMatch.meanings
        }, '*');
        
        showToast(`✓ ${wordObjMatch.word} eklendi!`);
        
        // INSTANT TRANSITION
        span.classList.remove('lingumark-rontgen');
        span.classList.add('lingumark-word');
        const sub = span.querySelector('.rontgen-level-badge');
        if (sub) sub.remove();
        
        const sup = document.createElement('sup');
        sup.className = 'lingumark-badge';
        sup.textContent = 'L';
        span.appendChild(sup);
        span.title = ""; // Clear tooltip
      });
    }

    let isTranslated = false;
    const originalNodeText = matchNode.nodeValue;

    span.addEventListener('contextmenu', (e) => {
      if (type === "rontgen") return;
      e.preventDefault(); 
      
      const translation = wordObjMatch.meaning || "Translating...";
      if (!isTranslated) {
        span.innerHTML = "";
        span.appendChild(document.createTextNode(translation));
        // Keep special styling but remove "L" badge temporarily
        span.style.color = "#3b82f6";
        span.style.fontWeight = "900";
        span.style.cursor = "pointer";
        span.title = `Orijinal: ${wordObjMatch.word}`;
        isTranslated = true;
      } else {
        span.innerHTML = "";
        span.style.color = "";
        span.style.fontWeight = "";
        span.appendChild(document.createTextNode(originalNodeText));
        const sup = document.createElement('sup');
        sup.className = 'lingumark-badge';
        sup.textContent = 'L';
        span.appendChild(sup);
        span.title = "";
        isTranslated = false;
      }
    });
    
    matchNode.parentNode.replaceChild(span, matchNode);
    return afterNode;
  }
  return null;
}

function highlightWords(words = savedWords, type = "normal") {
  if (!words.length && type === "normal") return;
  const walker = document.createTreeWalker(
    document.body,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode: function(node2) {
        let parent = node2.parentNode;
        while (parent && parent !== document.body) {
          if (tagsToIgnore.has(parent.tagName) || parent.isContentEditable) {
            return NodeFilter.FILTER_REJECT;
          }
          if (parent.tagName === "SPAN" && (parent.classList.contains("lingumark-word") || parent.classList.contains("lingumark-rontgen"))) {
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
  nodesToProcess.forEach((textNode) => {
    let currNode = textNode;
    while (currNode) {
      currNode = processTextNode(currNode, words, type);
    }
  });
}

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
