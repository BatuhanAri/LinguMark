let isMasterSwitchEnabled = true;
let savedWords = [];

const tagsToIgnore = new Set([
  'SCRIPT', 'STYLE', 'NOSCRIPT', 'TEXTAREA', 'INPUT', 'CODE', 'PRE'
]);

async function init() {
  const syncData = await chrome.storage.sync.get(['masterSwitch']);
  isMasterSwitchEnabled = syncData.masterSwitch ?? true;

  const syncDataWords = await chrome.storage.sync.get(['words']);
  savedWords = syncDataWords.words || [];

  if (isMasterSwitchEnabled && savedWords.length > 0) {
    highlightWords();
  }
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

function processTextNode(node, wordsToHighlight) {
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
    span.className = 'lingumark-word';
    
    // Add text securely
    span.appendChild(document.createTextNode(matchNode.nodeValue));

    // Add superscript
    const sup = document.createElement('sup');
    sup.className = 'lingumark-badge';
    sup.textContent = 'L';
    span.appendChild(sup);

    let isTranslated = false;
    const originalNodeText = matchNode.nodeValue;

    // Right Cick Event to transform context
    span.addEventListener('contextmenu', (e) => {
      e.preventDefault(); // Stop native context menu from opening
      
      const translation = wordObjMatch.meaning || "Translating...";
      
      if (!isTranslated) {
        // Keep it inside the DOM cleanly
        span.innerHTML = "";
        span.appendChild(document.createTextNode(translation));
        
        // Update styling to signify successful translation
        span.classList.remove('lingumark-word');
        span.style.color = '#10b981'; // A pleasant green
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
        span.style.cursor = 'pointer';
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

function highlightWords() {
  if (!savedWords.length) return;

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
          if (parent.tagName === 'SPAN' && parent.classList.contains('lingumark-word')) {
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
      currNode = processTextNode(currNode, savedWords);
    }
  });
}

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

init();
