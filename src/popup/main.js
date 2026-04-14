import { t } from '../shared/i18n.js';

const wordList = document.getElementById('wordList');
const emptyState = document.getElementById('emptyState');
const masterSwitch = document.getElementById('masterSwitch');
const langDropdownBtn = document.getElementById('langDropdownBtn');
const langDropdownText = document.getElementById('langDropdownText');
const langDropdownMenu = document.getElementById('langDropdownMenu');
const targetLangOptions = document.querySelectorAll('.lang-option');
const practiceBtn = document.getElementById('practiceBtn');

// Localization Elements
const appTitle = document.getElementById('appTitle');
const appSubTitle = document.getElementById('appSubTitle');
const practiceBtnText = document.getElementById('practiceBtnText');
const translateToLabel = document.getElementById('translateToLabel');
const noWordsTitle = document.getElementById('noWordsTitle');
const noWordsDesc = document.getElementById('noWordsDesc');

document.addEventListener('DOMContentLoaded', async () => {
  // Load settings
  const syncData = await chrome.storage.sync.get(['masterSwitch', 'targetLang']);
  const currentLang = syncData.targetLang || 'tr';
  
  masterSwitch.checked = syncData.masterSwitch ?? true;
  updateLocalUI(currentLang);

  if (practiceBtn) {
    practiceBtn.addEventListener('click', () => {
      chrome.tabs.create({ url: chrome.runtime.getURL('dashboard.html') });
    });
  }
  
  // Custom Dropdown logic
  langDropdownBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    langDropdownMenu.classList.toggle('hidden');
  });

  document.addEventListener('click', () => {
    langDropdownMenu.classList.add('hidden');
  });

  targetLangOptions.forEach(option => {
    option.addEventListener('click', async (e) => {
      const selectedValue = e.target.getAttribute('data-value');
      const selectedText = e.target.textContent;
      langDropdownText.textContent = selectedText;
      
      await chrome.storage.sync.set({ targetLang: selectedValue });
      updateLocalUI(selectedValue);
      loadWords(selectedValue);
    });
  });

  const selectedOption = Array.from(targetLangOptions).find(opt => opt.getAttribute('data-value') === currentLang);
  if (selectedOption) {
    langDropdownText.textContent = selectedOption.textContent;
  }

  // Listeners for settings
  masterSwitch.addEventListener('change', (e) => {
    chrome.storage.sync.set({ masterSwitch: e.target.checked });
  });

  // Load words
  loadWords(currentLang);

  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === 'local' && changes.words) {
      chrome.storage.sync.get(['targetLang'], (res) => {
        loadWords(res.targetLang || 'tr');
      });
    }
    if (areaName === 'sync' && changes.targetLang) {
       loadWords(changes.targetLang.newValue);
       updateLocalUI(changes.targetLang.newValue);
    }
  });
});

function updateLocalUI(lang) {
  if (appTitle) appTitle.textContent = t('app_title', lang);
  if (appSubTitle) appSubTitle.textContent = t('smart_translation', lang);
  if (practiceBtnText) practiceBtnText.textContent = t('practice_btn', lang);
  if (translateToLabel) translateToLabel.textContent = t('translate_to', lang);
  if (noWordsTitle) noWordsTitle.textContent = t('no_words', lang);
  
  // Custom desc with span
  if (noWordsDesc) {
    noWordsDesc.innerHTML = `${t('no_words_desc', lang).split('.')[0]}. <span class="text-cyan-400 font-bold">LinguMark</span>`;
  }
}

function loadWords(filterLang) {
  chrome.storage.local.get(['words'], (result) => {
    const words = result.words || [];
    // Only show words matching the current target language
    const filteredWords = words.filter(w => w.lang === filterLang);
    renderWords(filteredWords, filterLang);
  });
}

function renderWords(words, lang) {
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
      li.className = 'word-card group cursor-default';
      
      const headDiv = document.createElement('div');
      headDiv.className = 'flex justify-between items-start w-full mb-3 z-10 relative';

      const wordTitle = document.createElement('h3');
      wordTitle.className = 'font-extrabold text-white capitalize text-[16px] mr-2 break-words leading-tight flex-1 drop-shadow-sm';
      wordTitle.textContent = wordObj.word;

      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'text-slate-500 hover:text-red-400 transition-all p-2 -mt-2 -mr-2 rounded-xl hover:bg-red-500/10 opacity-0 group-hover:opacity-100 focus:opacity-100 active:scale-90';
      deleteBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>`;
      deleteBtn.onclick = (e) => {
        e.stopPropagation();
        deleteWord(wordObj.id);
      };

      headDiv.appendChild(wordTitle);
      headDiv.appendChild(deleteBtn);

      const meaningBox = document.createElement('div');
      meaningBox.className = 'bg-black/40 backdrop-blur-md p-3.5 rounded-2xl border border-white/5 z-10 relative group/meaning hover:border-white/10 transition-colors';
      
      const meaningText = document.createElement('p');
      meaningText.className = 'text-[13px] text-slate-200 leading-relaxed font-medium select-text';
      meaningText.textContent = wordObj.meaning || "---";
      
      meaningBox.appendChild(meaningText);

      const footerDiv = document.createElement('div');
      footerDiv.className = 'flex justify-between items-center mt-4 z-10 relative';

      const langBadge = document.createElement('span');
      langBadge.className = 'text-[9px] font-black bg-purple-500/10 text-purple-400 px-3 py-1 rounded-lg uppercase tracking-widest border border-purple-500/20 shadow-sm';
      langBadge.textContent = wordObj.lang || 'tr';

      const dateAdded = document.createElement('span');
      dateAdded.className = 'text-[10px] text-slate-500 uppercase tracking-widest font-bold opacity-60';
      const d = new Date(wordObj.dateAdded);
      dateAdded.textContent = isNaN(d) ? "" : d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

      footerDiv.appendChild(langBadge);
      footerDiv.appendChild(dateAdded);

      li.appendChild(headDiv);
      li.appendChild(meaningBox);
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

