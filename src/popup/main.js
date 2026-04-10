const wordList = document.getElementById('wordList');
const emptyState = document.getElementById('emptyState');
const masterSwitch = document.getElementById('masterSwitch');
const targetLangSelect = document.getElementById('targetLang');

document.addEventListener('DOMContentLoaded', async () => {
  // Load settings
  const syncData = await chrome.storage.sync.get(['masterSwitch', 'targetLang']);
  masterSwitch.checked = syncData.masterSwitch ?? true;
  targetLangSelect.value = syncData.targetLang || 'tr';

  // Listeners for settings
  masterSwitch.addEventListener('change', (e) => {
    chrome.storage.sync.set({ masterSwitch: e.target.checked });
  });

  targetLangSelect.addEventListener('change', (e) => {
    chrome.storage.sync.set({ targetLang: e.target.value });
  });

  // Load words
  loadWords();

  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === 'local' && changes.words) {
      loadWords();
    }
  });
});

function loadWords() {
  chrome.storage.local.get(['words'], (result) => {
    const words = result.words || [];
    renderWords(words);
  });
}

function renderWords(words) {
  wordList.innerHTML = '';
  
  if (words.length === 0) {
    emptyState.classList.remove('hidden');
    emptyState.classList.add('flex');
  } else {
    emptyState.classList.remove('flex');
    emptyState.classList.add('hidden');
    
    const sortedWords = words.sort((a, b) => new Date(b.dateAdded) - new Date(a.dateAdded));

    sortedWords.forEach(wordObj => {
      const li = document.createElement('li');
      li.className = 'bg-slate-800/40 backdrop-blur-md p-3.5 rounded-2xl border border-white/5 flex flex-col justify-between group hover:shadow-lg hover:shadow-black/20 hover:border-purple-500/30 hover:bg-slate-800/60 transition-all duration-300 relative overflow-hidden transform hover:-translate-y-0.5 cursor-default';
      
      const headDiv = document.createElement('div');
      headDiv.className = 'flex justify-between items-start w-full mb-1.5 z-10 relative';

      const wordTitle = document.createElement('h3');
      wordTitle.className = 'font-bold text-slate-100 capitalize text-[15px] mr-2 break-words leading-tight flex-1 drop-shadow-sm';
      wordTitle.textContent = wordObj.word;

      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'text-slate-500 hover:text-red-400 transition-colors p-1.5 -mt-1.5 -mr-1.5 rounded-lg hover:bg-red-500/10 opacity-0 group-hover:opacity-100 focus:opacity-100';
      deleteBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>`;
      deleteBtn.setAttribute('title', 'Delete word');
      deleteBtn.onclick = () => deleteWord(wordObj.id);

      headDiv.appendChild(wordTitle);
      headDiv.appendChild(deleteBtn);

      const meaningText = document.createElement('p');
      meaningText.className = 'text-sm text-slate-300 line-clamp-3 leading-relaxed font-light bg-black/20 p-2.5 rounded-xl mt-1 border border-white/5 z-10 relative select-text';
      meaningText.textContent = wordObj.meaning || "No meaning found.";
      meaningText.title = wordObj.meaning;

      const footerDiv = document.createElement('div');
      footerDiv.className = 'flex justify-between items-center mt-3 z-10 relative';

      const langBadge = document.createElement('span');
      langBadge.className = 'text-[9px] font-bold bg-cyan-500/10 text-cyan-400 px-2.5 py-0.5 rounded-full uppercase tracking-wider border border-cyan-500/20 shadow-sm';
      langBadge.textContent = wordObj.lang || 'tr';

      const dateAdded = document.createElement('span');
      dateAdded.className = 'text-[10px] text-slate-500 uppercase tracking-widest font-medium';
      const d = new Date(wordObj.dateAdded);
      dateAdded.textContent = isNaN(d) ? "" : d.toLocaleDateString();

      footerDiv.appendChild(langBadge);
      footerDiv.appendChild(dateAdded);

      // Add a subtle gradient background element for hover effect
      const glowEffect = document.createElement('div');
      glowEffect.className = 'absolute inset-0 bg-gradient-to-tr from-purple-500/5 to-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-2xl';

      li.appendChild(glowEffect);
      li.appendChild(headDiv);
      li.appendChild(meaningText);
      li.appendChild(footerDiv);

      wordList.appendChild(li);
    });
  }
}

function deleteWord(id) {
  chrome.storage.local.get(['words'], (result) => {
    let words = result.words || [];
    words = words.filter(w => w.id !== id);
    chrome.storage.local.set({ words: words });
  });
}
