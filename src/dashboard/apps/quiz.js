import { t } from '../../shared/i18n.js';

export function initQuiz() {
  const container = document.getElementById('quizContainer');
  chrome.storage.sync.get(['targetLang'], (res) => {
    const lang = res.targetLang || 'tr';
    startQuizGame(container, lang);
  });
}

function startQuizGame(container, lang) {
  let quizWords = [];
  let currentQ = 0;
  let score = 0;

  // Initialize
  quizWords = [...window.linguWords].sort(() => Math.random() - 0.5);
  
  if(quizWords.length < 4) {
      container.innerHTML = `
        <div class="bg-red-500/10 border border-red-500/20 p-12 rounded-[32px] text-center mt-10 backdrop-blur-3xl animate-in fade-in zoom-in-95">
            <h2 class="text-3xl font-black text-red-400 mb-4">${t('yetersiz_kelime', lang) || 'Yetersiz Kelime'}</h2>
            <p class="text-red-300/80 text-lg font-medium">Test çözebilmek için en az 4 kelime kaydetmiş olmanız gerekir.</p>
        </div>
      `;
      return;
  }

  showQuestion();

  function showQuestion() {
      if(currentQ >= quizWords.length) {
          showQuizResults(container, quizWords, score, lang);
          return;
      }

      const currentWord = quizWords[currentQ];
      
      // Get 3 random WRONG choices
      let wrongChoices = window.linguWords.filter(w => w.id !== currentWord.id);
      wrongChoices = wrongChoices.sort(() => Math.random() - 0.5).slice(0, 3);
      
      let allChoices = [currentWord, ...wrongChoices].sort(() => Math.random() - 0.5);

      container.innerHTML = `
        <div class="text-center mb-10 flex flex-col items-center">
            <span class="text-purple-400 font-black tracking-[0.2em] uppercase text-sm bg-purple-500/10 px-8 py-3 rounded-2xl border border-purple-500/20 shadow-2xl backdrop-blur-md">
                ${t('back', lang).toUpperCase()} ${currentQ + 1} / ${quizWords.length}
            </span>
        </div>
        <div class="bg-white/[0.03] backdrop-blur-3xl border border-white/10 p-12 rounded-[48px] text-center shadow-3xl relative overflow-hidden group">
            <div class="absolute inset-0 bg-gradient-to-tr from-purple-500/10 to-cyan-500/10 opacity-30 pointer-events-none group-hover:opacity-50 transition-opacity duration-1000"></div>
            <p class="text-slate-500 mb-6 tracking-[0.2em] uppercase text-xs font-black relative z-10">${t('fcHint', lang) || 'BU KELİMENİN ANLAMI NEDİR?'}</p>
            <h2 class="text-6xl md:text-7xl font-black text-white mb-12 tracking-tighter drop-shadow-2xl capitalize relative z-10">${currentWord.word}</h2>
            
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-6 relative z-10" id="optionsGrid">
                ${allChoices.map(choice => `
                    <button class="quiz-option bg-black/40 hover:bg-white/10 border-2 border-white/5 text-lg font-black text-slate-300 py-6 px-8 rounded-3xl transition-all shadow-xl hover:shadow-purple-500/30 transform hover:-translate-y-1 active:scale-95" data-id="${choice.id}">
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
                  e.currentTarget.classList.remove('bg-black/40', 'hover:bg-white/10', 'border-white/5');
                  e.currentTarget.classList.add('bg-emerald-500/20', 'border-emerald-500/50', 'text-emerald-400', 'scale-105', 'shadow-[0_0_30px_rgba(52,211,153,0.3)]');
              } else {
                  e.currentTarget.classList.remove('bg-black/40');
                  e.currentTarget.classList.add('bg-red-500/20', 'border-red-500/50', 'text-red-400', 'scale-105', 'shadow-[0_0_30px_rgba(239,68,68,0.35)]');
                  // highlight correct
                  options.forEach(o => {
                      if(o.getAttribute('data-id') === currentWord.id) {
                          o.classList.remove('bg-black/40');
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
}

function showQuizResults(container, quizWords, score, lang) {
  container.innerHTML = `
    <div class="bg-white/[0.03] backdrop-blur-3xl border border-white/10 p-20 rounded-[48px] text-center shadow-3xl animate-in fade-in zoom-in-95 duration-700">
        <h2 class="text-5xl font-black text-white mb-8 tracking-tighter">${t('congrats', lang)}</h2>
        <div class="text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-cyan-400 to-purple-400 mb-10 drop-shadow-lg scale-110 animate-pulse">
            ${score} / ${quizWords.length}
        </div>
        <p class="text-slate-400 text-xl mb-12 font-bold">${t('meaning', lang).toUpperCase()} BİLDİĞİNİZ KELİME SAYISI.</p>
        <button id="restartQuizBtn" class="bg-gradient-to-r from-purple-500 to-cyan-500 hover:from-purple-400 hover:to-cyan-400 text-white font-black py-5 px-16 rounded-[28px] shadow-2xl transition-all transform hover:scale-105 active:scale-95 text-xl tracking-tight uppercase">
            ${t('back_to_start', lang)}
        </button>
    </div>
  `;
  
  document.getElementById('restartQuizBtn').addEventListener('click', () => {
    startQuizGame(container, lang);
  });
}

