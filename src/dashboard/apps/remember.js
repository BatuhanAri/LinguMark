import { t } from '../../shared/i18n.js';

let reviewQueue = [];
let currentReviewIndex = 0;
let currentLang = 'tr';

export function initRemember(lang = 'tr') {
  currentLang = lang;
  const container = document.getElementById('rememberContainer');
  if (!container) return;

  const now = new Date();
  
  // Filter words that need review
  reviewQueue = window.linguWords.filter(w => {
    // If it doesn't have nextReviewDate, it's a new legacy word
    if (!w.nextReviewDate) return true;
    const reviewDate = new Date(w.nextReviewDate);
    return reviewDate <= now;
  });

  // Sort logically (e.g. oldest review date first)
  reviewQueue.sort((a, b) => new Date(a.nextReviewDate || 0) - new Date(b.nextReviewDate || 0));
  
  currentReviewIndex = 0;
  renderCurrentReview();
}

function processAnswer(answerType) {
  const wordObj = reviewQueue[currentReviewIndex];
  
  // Initialize SM2 properties if they don't exist
  let interval = wordObj.interval || 0;
  let easeFactor = wordObj.easeFactor || 2.5;

  if (answerType === 'again') {
    easeFactor = Math.max(1.3, easeFactor - 0.20);
    interval = 0;
  } else if (answerType === 'hard') {
    easeFactor = Math.max(1.3, easeFactor - 0.15);
    interval = Math.max(1, interval * 0.5);
  } else if (answerType === 'good') {
    interval = (interval === 0) ? 1 : interval * easeFactor;
  } else if (answerType === 'easy') {
    easeFactor += 0.15;
    interval = (interval === 0) ? 4 : interval * easeFactor * 1.3;
  }
  
  // Update Word object
  wordObj.interval = interval;
  wordObj.easeFactor = easeFactor;
  
  const nextDate = new Date();
  if (interval > 0) {
     nextDate.setDate(nextDate.getDate() + Math.round(interval));
  } else {
     // If interval is 0, review again in 1 minute
     nextDate.setMinutes(nextDate.getMinutes() + 1);
  }
  
  wordObj.nextReviewDate = nextDate.toISOString();

  // Save to Chrome Sync Global Array
  chrome.storage.sync.get(['words'], (result) => {
    const allWords = result.words || [];
    const idx = allWords.findIndex(w => w.id === wordObj.id);
    if (idx !== -1) {
      allWords[idx] = wordObj;
      chrome.storage.sync.set({ words: allWords });
    }
  });

  currentReviewIndex++;
  renderCurrentReview();
}

function renderCurrentReview() {
  const container = document.getElementById('rememberContainer');
  if (!container) return;

  if (reviewQueue.length === 0 || currentReviewIndex >= reviewQueue.length) {
    container.innerHTML = `
      <div class="flex flex-col items-center justify-center py-20 text-center animate-in fade-in slide-in-from-bottom-4">
        <div class="w-32 h-32 bg-green-500/10 rounded-full flex items-center justify-center mb-8 border border-green-500/30 shadow-[0_0_50px_rgba(34,197,94,0.3)]">
          <svg class="w-16 h-16 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>
        </div>
        <h2 class="text-4xl font-black text-white mb-4">Harika İş Çıkardın!</h2>
        <p class="text-slate-400 text-lg">Şu an için tekrar etmen gereken kelime kalmadı.</p>
        <button id="btnRefreshRemember" class="mt-8 bg-white/10 hover:bg-white/20 text-white font-bold py-3 px-8 rounded-xl transition-all">Yenile</button>
      </div>
    `;
    const btn = document.getElementById('btnRefreshRemember');
    if (btn) btn.onclick = () => initRemember(currentLang);
    return;
  }

  const wordObj = reviewQueue[currentReviewIndex];
  const total = reviewQueue.length;
  const current = currentReviewIndex + 1;

  container.innerHTML = `
    <div class="w-full flex justify-between items-center mb-8">
      <h2 class="text-3xl font-black text-white">Hatırla Modu</h2>
      <div class="bg-cyan-500/10 text-cyan-400 px-5 py-2 rounded-xl font-bold border border-cyan-500/20 shadow-lg">
        ${current} / ${total}
      </div>
    </div>
    
    <div class="perspective-1000 w-full mb-10 cursor-pointer group" id="rememberCardContainer">
      <div id="rememberCard" class="relative w-full transition-all duration-700 transform-style-preserve-3d shadow-2xl rounded-3xl min-h-[400px]">
        <!-- Front -->
        <div class="absolute inset-0 backface-hidden bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl flex flex-col items-center justify-center p-12 text-center group-hover:border-purple-500/30 transition-all flex h-full">
          <p class="text-slate-500 mb-6 tracking-[0.2em] uppercase text-xs font-bold">BU KELİMEYİ HATIRLIYOR MUSUN?</p>
          <h3 class="text-5xl md:text-6xl font-black text-white capitalize drop-shadow-xl">${wordObj.word}</h3>
          <div class="mt-12 text-cyan-400 animate-pulse text-sm font-bold tracking-widest uppercase">
            Cevabı görmek için tıkla
          </div>
        </div>
        <!-- Back (Hidden initially by flip logic) -->
        <div class="absolute inset-0 backface-hidden rotate-y-180 bg-gradient-to-br from-purple-900/50 to-black backdrop-blur-xl border border-purple-500/40 rounded-3xl flex flex-col items-center justify-center p-12 text-center shadow-[0_0_60px_rgba(168,85,247,0.15)] flex h-full">
          <p class="text-purple-400 mb-6 tracking-[0.2em] uppercase text-xs font-bold">ANLAMI</p>
          <h3 class="text-3xl md:text-5xl font-black text-white leading-tight">${wordObj.meaning}</h3>
        </div>
      </div>
    </div>

    <!-- Rating Buttons (Hidden until flipped) -->
    <div id="rememberActions" class="hidden w-full flex justify-center gap-4 mt-8 animate-in fade-in slide-in-from-bottom-2">
      <button class="rm-btn flex-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 font-bold py-4 rounded-2xl transition-all" data-ans="again">Tekrar (1 dk)</button>
      <button class="rm-btn flex-1 bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 border border-orange-500/30 font-bold py-4 rounded-2xl transition-all" data-ans="hard">Zor</button>
      <button class="rm-btn flex-1 bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/30 font-bold py-4 rounded-2xl transition-all shadow-[0_0_20px_rgba(34,197,94,0.1)]" data-ans="good">İyi</button>
      <button class="rm-btn flex-1 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 font-bold py-4 rounded-2xl transition-all shadow-[0_0_20px_rgba(6,182,212,0.1)]" data-ans="easy">Kolay</button>
    </div>
  `;

  // Interaction Logic
  const cardContainer = document.getElementById('rememberCardContainer');
  const card = document.getElementById('rememberCard');
  const actions = document.getElementById('rememberActions');

  let flipped = false;

  cardContainer.onclick = () => {
    if (flipped) return;
    flipped = true;
    card.classList.add('rotate-y-180');
    actions.classList.remove('hidden');
    actions.classList.add('flex');
  };

  document.querySelectorAll('.rm-btn').forEach(btn => {
    btn.onclick = (e) => {
      e.stopPropagation();
      processAnswer(e.target.getAttribute('data-ans'));
    };
  });
}
