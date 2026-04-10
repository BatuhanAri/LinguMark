export function initMatch() {
  const container = document.getElementById('matchingContainer');
  let matchWords = [];
  let score = 0;
  let matchesFound = 0;

  // need at least 4 words
  if(window.linguWords.length < 4) {
      container.innerHTML = `
        <div class="bg-red-500/10 border border-red-500/20 p-8 rounded-2xl text-center mt-10">
            <h2 class="text-xl font-bold text-red-400 mb-2">Yetersiz Kelime</h2>
            <p class="text-red-300/80">Eşleştirme yapabilmek için en az 4 kelime kaydetmiş olmanız gerekir.</p>
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
    <div class="text-center mb-8">
        <span class="text-emerald-400 font-bold tracking-widest uppercase text-sm bg-emerald-500/10 px-4 py-1.5 rounded-full border border-emerald-500/20 shadow-md">Kalan Eşleşme: <span id="matchRem">4</span></span>
    </div>
    <div class="bg-gradient-to-br from-slate-800/80 to-slate-900/90 backdrop-blur-xl border border-white/10 p-8 sm:p-12 rounded-3xl shadow-2xl relative w-full">
        <div class="absolute inset-0 bg-gradient-to-tr from-emerald-500/10 to-teal-500/10 opacity-30 pointer-events-none rounded-3xl"></div>
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 relative z-10" id="matchGrid">
            ${cards.map((c, i) => `
                <div class="match-card bg-slate-800/80 hover:bg-white/10 border-2 border-white/5 cursor-pointer rounded-2xl p-4 sm:p-6 flex items-center justify-center text-center transition-all duration-300 transform hover:-translate-y-1 hover:shadow-[0_0_15px_rgba(52,211,153,0.3)] min-h-[100px]" data-id="${c.id}" data-index="${i}">
                    <span class="text-white font-semibold flex-1 pointer-events-none select-none break-words text-sm sm:text-base capitalize drop-shadow-sm">${c.text}</span>
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
          card.classList.add('border-emerald-400', 'bg-emerald-500/20');
          card.classList.remove('border-white/5', 'bg-slate-800/80');

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
                  firstSelection.classList.remove('border-emerald-400', 'bg-emerald-500/20');
                  secondSelection.classList.remove('border-emerald-400', 'bg-emerald-500/20');
                  
                  firstSelection.classList.add('opacity-0', 'scale-90', 'matched');
                  secondSelection.classList.add('opacity-0', 'scale-90', 'matched');
                  firstSelection.style.pointerEvents = 'none';
                  secondSelection.style.pointerEvents = 'none';

                  matchesFound++;
                  document.getElementById('matchRem').textContent = 4 - matchesFound;

                  firstSelection = null;
                  isChecking = false;

                  if(matchesFound === 4) {
                      setTimeout(showResults, 600);
                  }
              }, 500);
          } else {
              // Wrong!
              // add warning colors
              firstSelection.classList.remove('border-emerald-400', 'bg-emerald-500/20');
              secondSelection.classList.remove('border-emerald-400', 'bg-emerald-500/20');
              firstSelection.classList.add('border-red-500', 'bg-red-500/20');
              secondSelection.classList.add('border-red-500', 'bg-red-500/20');

              setTimeout(() => {
                  firstSelection.classList.remove('border-red-500', 'bg-red-500/20');
                  secondSelection.classList.remove('border-red-500', 'bg-red-500/20');
                  firstSelection.classList.add('border-white/5', 'bg-slate-800/80');
                  secondSelection.classList.add('border-white/5', 'bg-slate-800/80');

                  firstSelection = null;
                  isChecking = false;
              }, 800);
          }
      });
  });

  function showResults() {
      container.innerHTML = `
        <div class="bg-gradient-to-br from-slate-800/80 to-slate-900/90 backdrop-blur-xl border border-white/10 p-12 rounded-3xl text-center shadow-2xl">
            <h2 class="text-4xl font-bold text-white mb-6">Mükemmel Eşleşme!</h2>
            <div class="w-24 h-24 mx-auto bg-green-500/20 rounded-full flex items-center justify-center mb-8 border border-green-500/50 scale-110 drop-shadow-lg">
               <svg xmlns="http://www.w3.org/2000/svg" class="w-12 h-12 text-green-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
            <p class="text-slate-300 text-lg mb-8">Tüm kelimeleri doğru eşleştirdiniz.</p>
            <button onclick="location.reload()" class="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-bold py-3 px-10 rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.4)] transition-all transform hover:scale-105">
                Başa Dön
            </button>
        </div>
      `;
  }
}
