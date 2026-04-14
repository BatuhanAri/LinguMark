import { t } from '../shared/i18n.js';
import { initQuiz } from './apps/quiz.js';
import { initTyping } from './apps/typing.js';
import { initMatch } from './apps/match.js';

// Global state
window.linguWords = [];
let allWords = [];
let currentGameLang = 'tr';

// DOM Elements
const noWordsState = document.getElementById('noWordsState');
const navBtns = document.querySelectorAll('.nav-btn');
const appViews = document.querySelectorAll('.app-view');

// Nav/Title Elements
const navTitle = document.getElementById('navTitle');
const navSubTitle = document.getElementById('navSubTitle');
const tabWords = document.getElementById('tab-words');
const tabFlashcards = document.getElementById('tab-flashcards');
const tabQuiz = document.getElementById('tab-quiz');
const tabTyping = document.getElementById('tab-typing');
const tabMatching = document.getElementById('tab-matching');
const emptyTitle = document.getElementById('emptyTitle');
const emptyDesc = document.getElementById('emptyDesc');

// Dash Lang Elements
const dashLangBtn = document.getElementById('dashLangBtn');
const dashLangText = document.getElementById('dashLangText');
const dashLangMenu = document.getElementById('dashLangMenu');
const dashLangOptions = document.querySelectorAll('.dash-lang-option');

// Word List Elements
const wordListGrid = document.getElementById('wordListGrid');
const wordCountBadge = document.getElementById('wordCountBadge');
const viewTitleWords = document.getElementById('viewTitleWords');
const viewDescWords = document.getElementById('viewDescWords');

// Flashcard Elements
const flashcard = document.getElementById('flashcard');
const flashcardInner = document.getElementById('flashcardInner');
const fcWord = document.getElementById('fcWord');
const fcMeaning = document.getElementById('fcMeaning');
const fcLangBadge = document.getElementById('fcLang');
const progressText = document.getElementById('progressText');
const btnForgot = document.getElementById('btnForgot');
const btnRemembered = document.getElementById('btnRemembered');
const fcHint = document.getElementById('fcHint');
const flipHintText = document.getElementById('flipHintText');
const meaningLabel = document.getElementById('meaningLabel');

let flashcardWords = [];
let fcCurrentIndex = 0;
let fcIsFlipped = false;

document.addEventListener('DOMContentLoaded', async () => {
  const syncData = await chrome.storage.sync.get(['targetLang']);
  currentGameLang = syncData.targetLang || 'tr';
  
  updateDashUI(currentGameLang);
  
  // Lang Dropdown
  dashLangBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    dashLangMenu.classList.toggle('hidden');
  });
  
  document.addEventListener('click', () => {
    dashLangMenu.classList.add('hidden');
  });
  
  dashLangOptions.forEach(opt => {
    opt.addEventListener('click', async (e) => {
      const val = e.target.getAttribute('data-value');
      currentGameLang = val;
      updateDashUI(val);
      filterAndRefresh(val);
      await chrome.storage.sync.set({ targetLang: val });
    });
  });

  // Load Initial Data
  chrome.storage.local.get(['words'], (result) => {
    allWords = result.words || [];
    filterAndRefresh(currentGameLang);
  });

  // Navigation Logic
  navBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      if (window.linguWords.length === 0) return;

      navBtns.forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');

      const targetId = e.target.getAttribute('data-target');
      appViews.forEach(view => {
        view.classList.add('hidden');
        view.classList.remove('flex');
      });
      document.getElementById(targetId).classList.remove('hidden');
      document.getElementById(targetId).classList.add('flex');
      
      // Re-init apps if needed when switching
      if (targetId === 'view-matching') initMatch();
      if (targetId === 'view-quiz') initQuiz();
      if (targetId === 'view-typing') initTyping();
    });
  });
});

function updateDashUI(lang) {
  // Update Selector Text
  const options = Array.from(dashLangOptions);
  const selected = options.find(o => o.getAttribute('data-value') === lang);
  if (selected) dashLangText.textContent = selected.textContent;

  // Localize Static Text
  if (navTitle) navTitle.textContent = t('app_title', lang);
  if (navSubTitle) navSubTitle.textContent = t('learn_center', lang);
  if (tabWords) tabWords.textContent = t('words_tab', lang);
  if (tabFlashcards) tabFlashcards.textContent = t('flashcards_tab', lang);
  if (tabQuiz) tabQuiz.textContent = t('quiz_tab', lang);
  if (tabTyping) tabTyping.textContent = t('typing_tab', lang);
  if (tabMatching) tabMatching.textContent = t('match_tab', lang);
  
  if (emptyTitle) emptyTitle.textContent = t('no_words', lang);
  if (emptyDesc) emptyDesc.textContent = t('no_words_desc', lang);
  
  if (viewTitleWords) viewTitleWords.textContent = t('words_tab', lang);
  if (viewDescWords) viewDescWords.textContent = t('no_words_desc', lang);
  
  if (fcHint) fcHint.textContent = t('meaning', lang).toUpperCase() + " ?";
  if (meaningLabel) meaningLabel.textContent = t('meaning', lang).toUpperCase();
  if (flipHintText) flipHintText.textContent = t('flip_hint', lang);
  if (btnForgot) btnForgot.textContent = t('forgot', lang).toUpperCase();
  if (btnRemembered) btnRemembered.textContent = t('remembered', lang).toUpperCase();
}

function filterAndRefresh(lang) {
  window.linguWords = allWords.filter(w => w.lang === lang);
  
  if (window.linguWords.length === 0) {
    noWordsState.classList.remove('hidden');
    noWordsState.classList.add('flex');
    appViews.forEach(v => v.classList.add('hidden'));
  } else {
    noWordsState.classList.add('hidden');
    noWordsState.classList.remove('flex');
    
    // Default show words
    document.getElementById('view-wordlist').classList.remove('hidden');
    document.getElementById('view-wordlist').classList.add('flex');
    
    wordCountBadge.textContent = `${window.linguWords.length} ${t('words_count', lang)}`;
    renderWordList(window.linguWords);
    setupFlashcard();
    
    // Init others
    initQuiz(lang);
    initTyping(lang);
    initMatch(lang);
  }
}

// 1. Rendering Word List View
function renderWordList(words) {
  wordListGrid.innerHTML = '';
  const sortedWords = [...words].sort((a, b) => new Date(b.dateAdded) - new Date(a.dateAdded));

  sortedWords.forEach(wordObj => {
    const card = document.createElement('div');
    card.className = 'word-card group cursor-default';
    
    card.innerHTML = `
      <div class="flex justify-between items-start mb-4 z-10 relative">
        <h3 class="text-2xl font-black text-white capitalize tracking-tight drop-shadow-md">${wordObj.word}</h3>
        <span class="text-[10px] font-black bg-cyan-500/10 text-cyan-400 px-3 py-1 rounded-lg uppercase tracking-widest border border-cyan-500/20">${wordObj.lang || 'TR'}</span>
      </div>
      <div class="bg-black/40 backdrop-blur-md p-5 rounded-2xl border border-white/5 relative z-10 hover:border-white/10 transition-colors">
        <p class="text-[15px] text-slate-200 font-bold leading-relaxed">${wordObj.meaning}</p>
      </div>
    `;
    wordListGrid.appendChild(card);
  });
}

// 2. Flashcard Logic
function setupFlashcard() {
  flashcardWords = [...window.linguWords].sort(() => Math.random() - 0.5);
  showFlashcard(0);

  // Remove old listeners to avoid duplicates
  const newFlashcard = flashcard.cloneNode(true);
  if (flashcard && flashcard.parentNode) {
    flashcard.parentNode.replaceChild(newFlashcard, flashcard);
  }
  
  // Update references
  const flashcardRef = document.getElementById('flashcard');
  const innerRef = document.getElementById('flashcardInner');
  const forgotRef = document.getElementById('btnForgot');
  const rememberedRef = document.getElementById('btnRemembered');

  if (flashcardRef) {
    flashcardRef.addEventListener('click', (e) => {
      if (e.target.tagName === 'BUTTON' || e.target.closest('button')) return;
      fcIsFlipped = !fcIsFlipped;
      if (fcIsFlipped) innerRef.classList.add('rotate-y-180');
      else innerRef.classList.remove('rotate-y-180');
    });
  }

  if (forgotRef) {
    forgotRef.addEventListener('click', (e) => {
      e.stopPropagation();
      flashcardWords.push(flashcardWords[fcCurrentIndex]);
      fcCurrentIndex++;
      nextFlashcard(innerRef);
    });
  }

  if (rememberedRef) {
    rememberedRef.addEventListener('click', (e) => {
      e.stopPropagation();
      fcCurrentIndex++;
      nextFlashcard(innerRef);
    });
  }
}

function nextFlashcard(inner) {
  fcIsFlipped = false;
  inner.classList.remove('rotate-y-180');
  setTimeout(() => showFlashcard(fcCurrentIndex), 300);
}

function showFlashcard(index) {
  const innerRef = document.getElementById('flashcardInner');
  const fcW = document.getElementById('fcWord');
  const fcM = document.getElementById('fcMeaning');
  const fcL = document.getElementById('fcLang');
  const pText = document.getElementById('progressText');
  const buttons = document.getElementById('fcButtons');

  if (index >= flashcardWords.length) {
    fcW.textContent = "";
    fcM.textContent = t('all_done', currentGameLang);
    pText.textContent = `${flashcardWords.length} / ${flashcardWords.length}`;
    fcL.textContent = "✓";
    buttons.classList.add('hidden');
    
    // Start Over Button
    const oldBtn = document.getElementById('restartFC');
    if (oldBtn) oldBtn.remove();

    const returnBtn = document.createElement('button');
    returnBtn.id = 'restartFC';
    returnBtn.className = 'mt-10 bg-gradient-to-r from-purple-500 to-cyan-500 text-white font-black py-4 px-12 rounded-[28px] shadow-2xl transition-all hover:scale-105 active:scale-95';
    returnBtn.textContent = t('back_to_start', currentGameLang).toUpperCase();
    returnBtn.onclick = () => {
       fcCurrentIndex = 0;
       setupFlashcard();
    };
    fcM.parentNode.appendChild(returnBtn);

    if (!fcIsFlipped) innerRef.classList.add('rotate-y-180');
    return;
  }

  const wordObj = flashcardWords[index];
  fcW.textContent = wordObj.word;
  fcM.textContent = wordObj.meaning;
  fcL.textContent = (wordObj.lang || 'TR').toUpperCase();
  pText.textContent = `${index + 1} / ${flashcardWords.length}`;
  buttons.classList.remove('hidden');
  
  const oldBtn = document.getElementById('restartFC');
  if (oldBtn) oldBtn.remove();
}

