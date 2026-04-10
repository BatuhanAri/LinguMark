export function initTyping() {
  const container = document.getElementById('typingContainer');
  let typeWords = [];
  let currentQ = 0;
  let score = 0;

  typeWords = [...window.linguWords].sort(() => Math.random() - 0.5);

  if(typeWords.length === 0) return;

  showQuestion();

  function showQuestion() {
      if(currentQ >= typeWords.length) {
          showResults();
          return;
      }

      const currentWord = typeWords[currentQ];
      
      container.innerHTML = `
        <div class="text-center mb-8">
            <span class="text-pink-400 font-bold tracking-widest uppercase text-sm bg-pink-500/10 px-4 py-1.5 rounded-full border border-pink-500/20 shadow-md">Soru ${currentQ + 1} / ${typeWords.length}</span>
        </div>
        <div class="bg-gradient-to-br from-slate-800/80 to-slate-900/90 backdrop-blur-xl border border-white/10 p-10 rounded-3xl text-center shadow-2xl relative overflow-hidden w-full">
            <div class="absolute inset-0 bg-gradient-to-tr from-pink-500/10 to-purple-500/10 opacity-30 pointer-events-none"></div>
            <p class="text-slate-400 mb-4 tracking-widest uppercase text-xs sm:text-sm relative z-10">Bu anlama gelen kelimeyi yazın</p>
            <h2 class="text-2xl sm:text-4xl font-bold text-white mb-10 drop-shadow-md relative z-10 break-words">${currentWord.meaning}</h2>
            
            <div class="relative z-10 max-w-sm mx-auto">
                <input type="text" id="typeInput" class="w-full bg-slate-900/50 border-2 border-slate-700/50 focus:border-pink-500/50 text-white text-center text-2xl p-4 rounded-xl outline-none transition-all shadow-inner mb-6" placeholder="..." autocomplete="off">
                <div id="feedback" class="text-sm font-bold h-6 mb-4 mt-[-10px] hidden"></div>
                <div class="flex gap-3">
                    <button id="btnHint" class="bg-slate-700/50 hover:bg-slate-600/50 text-slate-300 font-bold py-3 px-6 rounded-xl transition-all border border-white/5 w-1/3 text-sm">İpucu</button>
                    <button id="btnSubmit" class="bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white font-bold py-3 px-6 rounded-xl shadow-lg transition-all border border-white/10 w-2/3">Kontrol Et</button>
                </div>
            </div>
        </div>
      `;

      const input = document.getElementById('typeInput');
      const btnSubmit = document.getElementById('btnSubmit');
      const btnHint = document.getElementById('btnHint');
      const feedback = document.getElementById('feedback');
      let hinted = false;
      let answered = false;

      // Focus input
      setTimeout(() => input.focus(), 100);

      btnHint.addEventListener('click', () => {
          if(answered) return;
          hinted = true;
          // show first 2 letters
          const word = currentWord.word;
          const hint = word.substring(0, Math.ceil(word.length / 2)) + '...';
          input.value = hint;
          input.focus();
      });

      const checkAnswer = () => {
          if(answered) return;
          const val = input.value.trim().toLowerCase();
          const target = currentWord.word.trim().toLowerCase();
          
          if(!val) return;
          
          answered = true;
          if(val === target) {
              if(!hinted) score++;
              input.classList.remove('border-slate-700/50', 'focus:border-pink-500/50');
              input.classList.add('border-emerald-500', 'bg-emerald-500/10', 'text-emerald-400');
              feedback.textContent = 'Doğru!';
              feedback.classList.remove('hidden', 'text-red-400');
              feedback.classList.add('block', 'text-emerald-400');
              
              setTimeout(() => {
                  currentQ++;
                  showQuestion();
              }, 1000);
          } else {
              input.classList.remove('border-slate-700/50', 'focus:border-pink-500/50');
              input.classList.add('border-red-500', 'bg-red-500/10', 'text-red-400', 'animate-pulse');
              feedback.textContent = `Yanlış! Doğrusu: ${currentWord.word}`;
              feedback.classList.remove('hidden', 'text-emerald-400');
              feedback.classList.add('block', 'text-red-400');
              
              setTimeout(() => {
                  currentQ++;
                  showQuestion();
              }, 2500);
          }
      };

      btnSubmit.addEventListener('click', checkAnswer);
      input.addEventListener('keypress', (e) => {
          if(e.key === 'Enter') checkAnswer();
      });
  }

  function showResults() {
      container.innerHTML = `
        <div class="bg-gradient-to-br from-slate-800/80 to-slate-900/90 backdrop-blur-xl border border-white/10 p-12 rounded-3xl text-center shadow-2xl">
            <h2 class="text-4xl font-bold text-white mb-6">Yazım Pratiği Tamam!</h2>
            <div class="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-400 mb-8 drop-shadow-lg scale-110">
                ${score} / ${typeWords.length}
            </div>
            <p class="text-slate-300 text-lg mb-8">İpucu almadan doğru yazdığınız kelime sayısı.</p>
            <button onclick="location.reload()" class="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-400 hover:to-purple-400 text-white font-bold py-3 px-10 rounded-xl shadow-[0_0_20px_rgba(236,72,153,0.4)] transition-all transform hover:scale-105">
                Başa Dön
            </button>
        </div>
      `;
  }
}
