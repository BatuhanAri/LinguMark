import { initQuiz } from './apps/quiz.js';
import { initTyping } from './apps/typing.js';
import { initMatch } from './apps/match.js';

// Global state
window.linguWords = [];

// DOM Elements
const noWordsState = document.getElementById('noWordsState');
const navBtns = document.querySelectorAll('.nav-btn');
const appViews = document.querySelectorAll('.app-view');

// Word List Elements
const wordListGrid = document.getElementById('wordListGrid');
const wordCountBadge = document.getElementById('wordCountBadge');

// Flashcard Elements
const flashcard = document.getElementById('flashcard');
const flashcardInner = document.getElementById('flashcardInner');
const fcWord = document.getElementById('fcWord');
const fcMeaning = document.getElementById('fcMeaning');
const fcLang = document.getElementById('fcLang');
const progressText = document.getElementById('progressText');
const btnForgot = document.getElementById('btnForgot');
const btnRemembered = document.getElementById('btnRemembered');

let flashcardWords = [];
let fcCurrentIndex = 0;
let fcIsFlipped = false;

document.addEventListener('DOMContentLoaded', () => {
  chrome.storage.local.get(['words'], (result) => {
    window.linguWords = result.words || [];
    
    if (window.linguWords.length === 0) {
      noWordsState.classList.remove('hidden');
      noWordsState.classList.add('flex');
    } else {
      wordCountBadge.textContent = `${window.linguWords.length} Kelime`;
      renderWordList(window.linguWords);
      setupFlashcard();
      
      initQuiz();
      initTyping();
      initMatch();
    }
  });

  // Navigation Logic
  navBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      if (window.linguWords.length === 0) return; // Prevent navigation if empty

      // Update active button
      navBtns.forEach(b => {
        b.classList.remove('active', 'bg-white/10', 'text-white', 'shadow-inner');
        b.classList.add('text-slate-400');
      });
      e.target.classList.remove('text-slate-400');
      e.target.classList.add('active', 'bg-white/10', 'text-white', 'shadow-inner');

      // Update view
      const targetId = e.target.getAttribute('data-target');
      appViews.forEach(view => {
        view.classList.add('hidden');
        view.classList.remove('flex');
      });
      document.getElementById(targetId).classList.remove('hidden');
      document.getElementById(targetId).classList.add('flex');
    });
  });
});

// 1. Rendering Word List View
function renderWordList(words) {
  wordListGrid.innerHTML = '';
  const sortedWords = [...words].sort((a, b) => new Date(b.dateAdded) - new Date(a.dateAdded));

  sortedWords.forEach(wordObj => {
    const card = document.createElement('div');
    card.className = 'bg-slate-800/40 backdrop-blur-md p-5 rounded-2xl border border-white/5 flex flex-col justify-between group hover:shadow-lg hover:shadow-black/20 hover:border-purple-500/30 transition-all duration-300 relative overflow-hidden';
    
    card.innerHTML = `
      <div class="absolute inset-0 bg-gradient-to-tr from-purple-500/5 to-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
      <div class="flex justify-between items-start mb-2 relative z-10">
        <h3 class="text-xl font-bold text-white capitalize drop-shadow-sm">${wordObj.word}</h3>
        <span class="text-[10px] font-bold bg-cyan-500/10 text-cyan-400 px-2.5 py-1 rounded-full uppercase tracking-wider">${wordObj.lang || 'TR'}</span>
      </div>
      <div class="bg-black/20 p-3 rounded-xl border border-white/5 relative z-10">
        <p class="text-sm text-slate-300 font-light leading-relaxed">${wordObj.meaning}</p>
      </div>
    `;
    wordListGrid.appendChild(card);
  });
}

// 2. Flashcard Logic
function setupFlashcard() {
  flashcardWords = [...window.linguWords].sort(() => Math.random() - 0.5);
  showFlashcard(0);

  flashcard.addEventListener('click', (e) => {
    if (e.target.tagName === 'BUTTON' || e.target.closest('button')) return;
    fcIsFlipped = !fcIsFlipped;
    if (fcIsFlipped) flashcardInner.classList.add('rotate-y-180');
    else flashcardInner.classList.remove('rotate-y-180');
  });

  btnForgot.addEventListener('click', (e) => {
    e.stopPropagation();
    flashcardWords.push(flashcardWords[fcCurrentIndex]); // move to back of queue
    fcCurrentIndex++;
    nextFlashcard();
  });

  btnRemembered.addEventListener('click', (e) => {
    e.stopPropagation();
    fcCurrentIndex++;
    nextFlashcard();
  });
}

function nextFlashcard() {
  fcIsFlipped = false;
  flashcardInner.classList.remove('rotate-y-180');
  setTimeout(() => showFlashcard(fcCurrentIndex), 300);
}

function showFlashcard(index) {
  if (index >= flashcardWords.length) {
    fcWord.textContent = "";
    fcMeaning.textContent = "Tüm kelimeleri başarıyla tekrar ettin!";
    progressText.textContent = `${flashcardWords.length} / ${flashcardWords.length}`;
    fcLang.textContent = "BİTTİ";
    document.getElementById('fcButtons').style.display = 'none';
    
    const returnBtn = document.createElement('button');
    returnBtn.className = 'bg-gradient-to-r from-purple-500 to-cyan-500 text-white font-bold py-3 px-8 rounded-xl shadow-lg mt-4 w-full cursor-pointer';
    returnBtn.textContent = 'Başa Dön';
    returnBtn.onclick = () => location.reload();
    fcMeaning.parentNode.appendChild(returnBtn);

    if (!fcIsFlipped) flashcardInner.classList.add('rotate-y-180');
    return;
  }

  const wordObj = flashcardWords[index];
  fcWord.textContent = wordObj.word;
  fcMeaning.textContent = wordObj.meaning;
  fcLang.textContent = (wordObj.lang || 'TR').toUpperCase();
  progressText.textContent = `${index + 1} / ${flashcardWords.length}`;
  document.getElementById('fcButtons').style.display = 'flex';
}
