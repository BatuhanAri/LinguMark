import { t } from '../../shared/i18n.js';

export function initMatch(lang = 'tr') {
  const container = document.getElementById('matchingContainer');
  startMatchGame(container, lang);
}

function startMatchGame(container, lang) {
  let matchWords = [];
  let matchesFound = 0;

  // need at least 4 words
  if(window.linguWords.length < 4) {
      container.innerHTML = `
        <div class="bg-red-500/10 border border-red-500/20 p-12 rounded-[32px] text-center mt-10 backdrop-blur-3xl animate-in fade-in zoom-in-95">
            <h2 class="text-3xl font-black text-red-400 mb-4">${t('yetersiz_kelime', lang)}</h2>
            <p class="text-red-300/80 text-lg font-medium">${t('yetersiz_kelime_desc', lang)}</p>
        </div>
      `;
      return;
  }

  // pick 4 random words
  matchWords = [...window.linguWords].sort(() => Math.random() - 0.5).slice(0, 4);
  
  // prepare 8 cards (4 words, 4 meanings)
  let cards = [];
  matchWords.forEach(w => {
      cards.push({ id: w.id, text: w.word, type: 'word' });
      cards.push({ id: w.id, text: w.meaning, type: 'meaning' });
  });

  cards = cards.sort(() => Math.random() - 0.5);

  container.innerHTML = `
    <div class="text-center mb-10 flex flex-col items-center">
        <span class="text-emerald-400 font-black tracking-[0.2em] uppercase text-sm bg-emerald-500/10 px-8 py-3 rounded-2xl border border-emerald-500/20 shadow-2xl backdrop-blur-md">
            ${t('kalan_eslesme', lang)}: <span id="matchRem" class="text-white ml-2">4</span>
        </span>
    </div>
    <div class="bg-white/[0.03] backdrop-blur-3xl border border-white/10 p-10 sm:p-16 rounded-[48px] shadow-3xl relative w-full overflow-hidden group">
        <div class="absolute inset-0 bg-gradient-to-tr from-emerald-500/10 to-teal-500/10 opacity-30 pointer-events-none transition-opacity duration-1000 group-hover:opacity-50"></div>
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-6 relative z-10" id="matchGrid">
            ${cards.map((c, i) => `
                <div class="match-card bg-black/40 hover:bg-white/10 border-2 border-white/5 cursor-pointer rounded-3xl p-6 flex items-center justify-center text-center transition-all duration-500 transform hover:-translate-y-2 hover:shadow-[0_25px_50px_-15px_rgba(52,211,153,0.3)] min-h-[140px] group/card" data-id="${c.id}" data-index="${i}">
                    <span class="text-white font-black flex-1 pointer-events-none select-none break-words text-base sm:text-lg capitalize drop-shadow-2xl transition-all group-hover/card:scale-105">${c.text}</span>
                </div>
            `).join('')}
        </div>
    </div>
  `;

  const domCards = document.querySelectorAll('.match-card');
  let firstSelection = null;
  let isChecking = false;

  domCards.forEach(card => {
      card.addEventListener('click', () => {
          if(isChecking) return;
          if(card.classList.contains('matched')) return;
          if(firstSelection && firstSelection.getAttribute('data-index') === card.getAttribute('data-index')) return;

          // Select visually
          card.classList.add('border-emerald-400', 'bg-emerald-500/20', 'scale-105', 'shadow-[0_0_30px_rgba(52,211,153,0.3)]');
          card.classList.remove('border-white/5', 'bg-black/40');

          if(!firstSelection) {
              firstSelection = card;
              return;
          }

          // We have two selections
          isChecking = true;
          const secondSelection = card;

          const id1 = firstSelection.getAttribute('data-id');
          const id2 = secondSelection.getAttribute('data-id');

          if(id1 === id2) {
              // Match!
              setTimeout(() => {
                  firstSelection.classList.remove('border-emerald-400', 'bg-emerald-500/20', 'scale-105');
                  secondSelection.classList.remove('border-emerald-400', 'bg-emerald-500/20', 'scale-105');
                  
                  firstSelection.classList.add('opacity-0', 'scale-75', 'matched');
                  secondSelection.classList.add('opacity-0', 'scale-75', 'matched');
                  firstSelection.style.pointerEvents = 'none';
                  secondSelection.style.pointerEvents = 'none';

                  matchesFound++;
                  document.getElementById('matchRem').textContent = 4 - matchesFound;

                  firstSelection = null;
                  isChecking = false;

                  if(matchesFound === 4) {
                      setTimeout(() => showMatchResults(container, lang), 600);
                  }
              }, 600);
          } else {
              // Wrong!
              firstSelection.classList.remove('border-emerald-400', 'bg-emerald-500/20');
              secondSelection.classList.remove('border-emerald-400', 'bg-emerald-500/20');
              firstSelection.classList.add('border-red-500', 'bg-red-500/20', 'animate-shake');
              secondSelection.classList.add('border-red-500', 'bg-red-500/20', 'animate-shake');

              setTimeout(() => {
                  firstSelection.classList.remove('border-red-500', 'bg-red-500/20', 'animate-shake', 'scale-105');
                  secondSelection.classList.remove('border-red-500', 'bg-red-500/20', 'animate-shake', 'scale-105');
                  firstSelection.classList.add('border-white/5', 'bg-black/40');
                  secondSelection.classList.add('border-white/5', 'bg-black/40');

                  firstSelection = null;
                  isChecking = false;
              }, 800);
          }
      });
  });
}

function showMatchResults(container, lang) {
  container.innerHTML = `
    <div class="bg-white/[0.03] backdrop-blur-3xl border border-white/10 p-20 rounded-[48px] text-center shadow-3xl animate-in fade-in zoom-in-95 duration-700">
        <h2 class="text-5xl font-black text-white mb-8 tracking-tighter">${t('perfect_match', lang)}</h2>
        <div class="w-32 h-32 mx-auto bg-emerald-500/20 rounded-full flex items-center justify-center mb-10 border border-emerald-500/40 shadow-[0_0_50px_rgba(16,185,129,0.3)] animate-bounce">
           <svg xmlns="http://www.w3.org/2000/svg" class="w-16 h-16 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3.5"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>
        </div>
        <p class="text-slate-400 text-xl mb-12 font-bold">${t('match_finished_desc', lang)}</p>
        <button id="restartMatchBtn" class="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-black py-5 px-16 rounded-[28px] shadow-[0_20px_40px_-10px_rgba(16,185,129,0.4)] transition-all transform hover:scale-105 active:scale-95 text-xl tracking-tight uppercase">
            ${t('play_again', lang)}
        </button>
    </div>
  `;
  
  document.getElementById('restartMatchBtn').addEventListener('click', () => {
    startMatchGame(container, lang);
  });
}

