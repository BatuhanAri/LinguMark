export function initQuiz() {
  const container = document.getElementById('quizContainer');
  let quizWords = [];
  let currentQ = 0;
  let score = 0;

  // Initialize
  quizWords = [...window.linguWords].sort(() => Math.random() - 0.5);
  
  if(quizWords.length < 4) {
      container.innerHTML = `
        <div class="bg-red-500/10 border border-red-500/20 p-8 rounded-2xl text-center">
            <h2 class="text-xl font-bold text-red-400 mb-2">Yetersiz Kelime</h2>
            <p class="text-red-300/80">Test çözebilmek için en az 4 kelime kaydetmiş olmanız gerekir.</p>
        </div>
      `;
      return;
  }

  showQuestion();

  function showQuestion() {
      if(currentQ >= quizWords.length) {
          showResults();
          return;
      }

      const currentWord = quizWords[currentQ];
      
      // Get 3 random WRONG choices
      let wrongChoices = window.linguWords.filter(w => w.id !== currentWord.id);
      wrongChoices = wrongChoices.sort(() => Math.random() - 0.5).slice(0, 3);
      
      let allChoices = [currentWord, ...wrongChoices].sort(() => Math.random() - 0.5);

      container.innerHTML = `
        <div class="text-center mb-8">
            <span class="text-purple-400 font-bold tracking-widest uppercase text-sm bg-purple-500/10 px-4 py-1.5 rounded-full border border-purple-500/20 shadow-md">Soru ${currentQ + 1} / ${quizWords.length}</span>
        </div>
        <div class="bg-gradient-to-br from-slate-800/80 to-slate-900/90 backdrop-blur-xl border border-white/10 p-10 rounded-3xl text-center shadow-2xl relative overflow-hidden">
            <div class="absolute inset-0 bg-gradient-to-tr from-purple-500/10 to-cyan-500/10 opacity-30 pointer-events-none"></div>
            <p class="text-slate-400 mb-4 tracking-widest uppercase text-sm relative z-10">Bu kelimenin anlamı nedir?</p>
            <h2 class="text-5xl font-bold text-white mb-10 drop-shadow-md capitalize relative z-10">${currentWord.word}</h2>
            
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 relative z-10" id="optionsGrid">
                ${allChoices.map(choice => `
                    <button class="quiz-option bg-slate-800/60 hover:bg-white/10 border border-white/10 hover:border-purple-500/30 text-lg font-medium text-slate-200 py-4 px-6 rounded-2xl transition-all shadow-lg hover:shadow-purple-500/20 transform hover:-translate-y-1" data-id="${choice.id}">
                        ${choice.meaning}
                    </button>
                `).join('')}
            </div>
        </div>
      `;

      const options = document.querySelectorAll('.quiz-option');
      let answered = false;

      options.forEach(opt => {
          opt.addEventListener('click', (e) => {
              if(answered) return;
              answered = true;
              
              const selectedId = e.currentTarget.getAttribute('data-id');
              const isCorrect = selectedId === currentWord.id;

              if(isCorrect) {
                  score++;
                  e.currentTarget.classList.remove('bg-slate-800/60', 'hover:bg-white/10', 'border-white/10');
                  e.currentTarget.classList.add('bg-emerald-500/20', 'border-emerald-500/50', 'text-emerald-400');
              } else {
                  e.currentTarget.classList.remove('bg-slate-800/60');
                  e.currentTarget.classList.add('bg-red-500/20', 'border-red-500/50', 'text-red-400');
                  // highlight correct
                  options.forEach(o => {
                      if(o.getAttribute('data-id') === currentWord.id) {
                          o.classList.remove('bg-slate-800/60');
                          o.classList.add('bg-emerald-500/20', 'border-emerald-500/50', 'text-emerald-400');
                      }
                  });
              }

              setTimeout(() => {
                  currentQ++;
                  showQuestion();
              }, 1200);
          });
      });
  }

  function showResults() {
      container.innerHTML = `
        <div class="bg-gradient-to-br from-slate-800/80 to-slate-900/90 backdrop-blur-xl border border-white/10 p-12 rounded-3xl text-center shadow-2xl">
            <h2 class="text-4xl font-bold text-white mb-6">Test Tamamlandı!</h2>
            <div class="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400 mb-8 drop-shadow-lg scale-110">
                ${score} / ${quizWords.length}
            </div>
            <p class="text-slate-300 text-lg mb-8">Doğru bildiğiniz kelime sayısı.</p>
            <button onclick="location.reload()" class="bg-gradient-to-r from-purple-500 to-cyan-500 hover:from-purple-400 hover:to-cyan-400 text-white font-bold py-3 px-10 rounded-xl shadow-[0_0_20px_rgba(168,85,247,0.4)] transition-all transform hover:scale-105">
                Başa Dön
            </button>
        </div>
      `;
  }
}
