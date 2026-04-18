// content-injected.js - Sayfa context'inde çalışan script (Chrome API erişimi YOK, DOM erişimi VAR)
// Content-loader.js'e aracılığıyla mesaj gönder/alır

let isMasterSwitchEnabled = true;
let savedWords = [];
let oxfordDictionary = [];

const tagsToIgnore = new Set([
  'SCRIPT', 'STYLE', 'NOSCRIPT', 'TEXTAREA', 'INPUT', 'CODE', 'PRE'
]);

console.log("LinguMark: Content-injected script başlatıldı");

// Content-loader'dan gelen mesajları dinle
window.addEventListener('message', (event) => {
  if (event.source !== window) return;
  
  if (event.data.type === 'LINGUMARK_FROM_BACKGROUND') {
    const message = event.data.data;
    console.log("LinguMark: Background'dan mesaj alındı:", message);
    
    // Background'dan Röntgen scan mesajı geldi
    if (message.type === "RONTGEN_SCAN") {
      handleRontgenScan(message.levels);
    }
    if (message.type === "CLEAR_SCAN") {
      removeRontgenHighlights();
    }
  }
  
  // Oxford dictionary'yi content-loader'dan al
  if (event.data.type === 'LINGUMARK_INIT_OXFORD') {
    oxfordDictionary = event.data.data;
    console.log("LinguMark: Oxford dictionary yüklendi, kelime sayısı:", oxfordDictionary.length);
    
    // Oxford dict yüklenince init'i çağır
    initWithOxford();
  }
});

async function initWithOxford() {
  // Storage'dan veri al (simüle et)
  isMasterSwitchEnabled = true;
  savedWords = [];

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

  // Content-loader aracılığıyla background'a mesaj gönder
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
}

function removeHighlights() {
  const marks = document.querySelectorAll('span.lingumark-word');
  marks.forEach(span => {
    const parent = span.parentNode;
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
    
    span.appendChild(document.createTextNode(matchNode.nodeValue));

    if (type === "normal") {
      const sup = document.createElement('sup');
      sup.className = 'lingumark-badge';
      sup.textContent = 'L';
      span.appendChild(sup);
    } else {
      const levelBadge = document.createElement('sub');
      levelBadge.className = 'rontgen-level-badge';
      levelBadge.textContent = wordObjMatch.level;
      span.appendChild(levelBadge);
      
      span.title = `Oxford ${wordObjMatch.level}: ${wordObjMatch.word}. Çift tıkla kütüphanene ekle!`;
      span.addEventListener('dblclick', async (e) => {
        e.preventDefault();
        // Content-loader aracılığıyla background'a mesaj gönder
        window.postMessage({
          type: "LINGUMARK_QUICK_ADD",
          word: wordObjMatch.word,
          id: wordObjMatch.id,
          meanings: wordObjMatch.meanings
        }, '*');
        showToast(`✓ ${wordObjMatch.word} eklendi!`);
        span.classList.remove('lingumark-rontgen');
        span.classList.add('lingumark-word');
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
        span.classList.remove("lingumark-word");
        span.style.color = "#10b981";
        span.style.fontWeight = "700";
        span.style.cursor = "pointer";
        span.style.textDecoration = "none";
        span.title = `Original: ${wordObjMatch.word} (Sağ tıkla eski haline döndür)`;
        isTranslated = true;
      } else {
        span.innerHTML = "";
        span.appendChild(document.createTextNode(originalNodeText));
        const sup = document.createElement('sup');
        sup.className = 'lingumark-badge';
        sup.textContent = 'L';
        span.appendChild(sup);
        span.classList.add("lingumark-word");
        span.style.color = "";
        span.style.fontWeight = "";
        span.style.cursor = "";
        span.style.textDecoration = "";
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
  if (!words.length) return;
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
