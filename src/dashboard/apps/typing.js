import { t } from '../../shared/i18n.js';

export function initTyping() {
  const container = document.getElementById('typingContainer');
  chrome.storage.sync.get(['targetLang'], (res) => {
    const lang = res.targetLang || 'tr';
    startTypingGame(container, lang);
  });
}

function startTypingGame(container, lang) {
  let typeWords = [];
  let currentQ = 0;
  let score = 0;

  typeWords = [...window.linguWords].sort(() => Math.random() - 0.5);

  if(typeWords.length === 0) return;

  showQuestion();

  function showQuestion() {
      if(currentQ >= typeWords.length) {
          showTypingResults(container, typeWords, score, lang);
          return;
      }

      const currentWord = typeWords[currentQ];
      
      container.innerHTML = `
        <div class="text-center mb-10 flex flex-col items-center">
            <span class="text-pink-400 font-black tracking-[0.2em] uppercase text-sm bg-pink-500/10 px-8 py-3 rounded-2xl border border-pink-500/20 shadow-2xl backdrop-blur-md font-['Outfit']">
                ${t('back', lang).toUpperCase()} ${currentQ + 1} / ${typeWords.length}
            </span>
        </div>
        <div class="bg-white/[0.03] backdrop-blur-3xl border border-white/10 p-12 rounded-[48px] text-center shadow-3xl relative overflow-hidden w-full group">
            <div class="absolute inset-0 bg-gradient-to-tr from-pink-500/10 to-purple-500/10 opacity-30 pointer-events-none group-hover:opacity-50 transition-opacity duration-1000"></div>
            <p class="text-slate-500 mb-6 tracking-[0.2em] uppercase text-xs font-black relative z-10">${t('typing_instruction', lang) || 'BU ANLAMA GELEN KELİMEYİ YAZIN'}</p>
            <h2 class="text-3xl sm:text-5xl font-black text-white mb-12 tracking-tighter drop-shadow-2xl relative z-10 break-words">${currentWord.meaning}</h2>
            
            <div class="relative z-10 max-w-md mx-auto">
                <input type="text" id="typeInput" class="w-full bg-black/40 border-2 border-white/5 focus:border-pink-500/50 text-white text-center text-3xl font-black p-6 rounded-[28px] outline-none transition-all shadow-2xl mb-8 selection:bg-pink-500/30" placeholder="..." autocomplete="off">
                <div id="feedback" class="text-sm font-black h-8 mb-6 mt-[-15px] hidden uppercase tracking-widest"></div>
                <div class="flex gap-4">
                    <button id="btnHint" class="bg-white/5 hover:bg-white/10 text-slate-400 font-black py-4 px-8 rounded-[24px] transition-all border border-white/5 w-1/3 text-sm uppercase tracking-wider active:scale-95 text-xs">${t('hint', lang) || 'İPUCU'}</button>
                    <button id="btnSubmit" class="bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white font-black py-4 px-8 rounded-[24px] shadow-2xl transition-all border border-white/10 w-2/3 uppercase tracking-widest active:scale-95">${t('check_answer', lang) || 'KONTROL ET'}</button>
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
      setTimeout(() => input.focus(), 150);

      btnHint.addEventListener('click', () => {
          if(answered) return;
          hinted = true;
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
              input.classList.remove('border-white/5', 'focus:border-pink-500/50');
              input.classList.add('border-emerald-500/50', 'bg-emerald-500/10', 'text-emerald-400', 'shadow-[0_0_30px_rgba(52,211,153,0.3)]');
              feedback.textContent = 'Correct!';
              feedback.classList.remove('hidden', 'text-red-400');
              feedback.classList.add('block', 'text-emerald-400');
              
              setTimeout(() => {
                  currentQ++;
                  showQuestion();
              }, 1200);
          } else {
              input.classList.remove('border-white/5', 'focus:border-pink-500/50');
              input.classList.add('border-red-500/50', 'bg-red-500/10', 'text-red-400', 'animate-shake', 'shadow-[0_0_30px_rgba(239,68,68,0.35)]');
              feedback.textContent = `False! Answer: ${currentWord.word}`;
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
}

function showTypingResults(container, typeWords, score, lang) {
  container.innerHTML = `
    <div class="bg-white/[0.03] backdrop-blur-3xl border border-white/10 p-20 rounded-[48px] text-center shadow-3xl animate-in fade-in zoom-in-95 duration-700">
        <h2 class="text-5xl font-black text-white mb-8 tracking-tighter">${t('congrats', lang)}</h2>
        <div class="text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-purple-400 to-pink-400 mb-10 drop-shadow-lg scale-110 animate-pulse">
            ${score} / ${typeWords.length}
        </div>
        <p class="text-slate-400 text-xl mb-12 font-bold">${t('meaning', lang).toUpperCase()} DOĞRU YAZILAN KELİME SAYISI.</p>
        <button id="restartTypingBtn" class="bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white font-black py-5 px-16 rounded-[28px] shadow-2xl transition-all transform hover:scale-105 active:scale-95 text-xl tracking-tight uppercase">
            ${t('back_to_start', lang)}
        </button>
    </div>
  `;
  
  document.getElementById('restartTypingBtn').addEventListener('click', () => {
    startTypingGame(container, lang);
  });
}

