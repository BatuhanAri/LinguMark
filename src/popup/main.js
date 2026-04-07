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
      li.className = 'bg-white p-3.5 rounded-xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-slate-100 flex flex-col justify-between group hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all duration-300 relative overflow-hidden transform hover:-translate-y-0.5';
      
      const headDiv = document.createElement('div');
      headDiv.className = 'flex justify-between items-start w-full mb-1.5';

      const wordTitle = document.createElement('h3');
      wordTitle.className = 'font-bold text-slate-800 capitalize text-[15px] mr-2 break-words leading-tight flex-1';
      wordTitle.textContent = wordObj.word;

      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'text-slate-300 hover:text-red-500 transition-colors p-1.5 -mt-1.5 -mr-1.5 rounded-lg hover:bg-red-50 opacity-0 group-hover:opacity-100 focus:opacity-100';
      deleteBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>`;
      deleteBtn.setAttribute('title', 'Delete word');
      deleteBtn.onclick = () => deleteWord(wordObj.id);

      headDiv.appendChild(wordTitle);
      headDiv.appendChild(deleteBtn);

      const meaningText = document.createElement('p');
      meaningText.className = 'text-sm text-slate-500 line-clamp-3 leading-relaxed font-medium bg-slate-50/50 p-2 rounded-lg mt-1 border border-slate-50';
      meaningText.textContent = wordObj.meaning || "No meaning found.";
      meaningText.title = wordObj.meaning;

      const footerDiv = document.createElement('div');
      footerDiv.className = 'flex justify-between items-center mt-3';

      const langBadge = document.createElement('span');
      langBadge.className = 'text-[9px] font-bold bg-blue-50 text-blue-500 px-2 py-0.5 rounded-full uppercase tracking-wider';
      langBadge.textContent = wordObj.lang || 'tr';

      const dateAdded = document.createElement('span');
      dateAdded.className = 'text-[10px] text-slate-400 uppercase tracking-wide font-medium';
      const d = new Date(wordObj.dateAdded);
      dateAdded.textContent = isNaN(d) ? "" : d.toLocaleDateString();

      footerDiv.appendChild(langBadge);
      footerDiv.appendChild(dateAdded);

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
