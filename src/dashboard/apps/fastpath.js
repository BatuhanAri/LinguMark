import { oxfordDictionary } from '../../shared/oxford.js';
import { t } from '../../shared/i18n.js';

let WORDS_PER_STEP = 45;
let TOTAL_STEPS = 20;

// Language-agnostic dictionary loader
function getFastPathDictionary(lang) {
    if (lang === 'en') {
        // Filter only A2 words from Oxford for now, can be expanded later
        return oxfordDictionary.filter(w => w.level === 'A2');
    }
    // For other languages, return empty array (or fetch from other dictionaries when added)
    return [];
}

export function initFastPath(learningLang, nativeLang) {
    const dictionary = getFastPathDictionary(learningLang);
    const container = document.getElementById('fastpathContainer');
    if (!container) return;
    
    container.innerHTML = '';
    
    if (dictionary.length === 0) {
        container.innerHTML = `<div class="text-center text-slate-400 mt-20 flex flex-col items-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-16 h-16 text-slate-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/></svg>
            Şu an <b>${learningLang.toUpperCase()}</b> dili için FastPath kütüphanesi bulunmuyor. Yakında eklenecektir!
        </div>`;
        return;
    }
    
    // Chunk words
    const steps = [];
    for (let i = 0; i < TOTAL_STEPS; i++) {
        const chunk = dictionary.slice(i * WORDS_PER_STEP, (i + 1) * WORDS_PER_STEP);
        if (chunk.length > 0) {
            steps.push(chunk);
        }
    }
    
    // Load Progress
    chrome.storage.local.get(['fastPathProgress'], (result) => {
        let progressObj = result.fastPathProgress || {};
        let currentStepIndex = progressObj[learningLang] || 0; 
        
        renderMap(steps, currentStepIndex, learningLang, nativeLang);
    });
}

function renderMap(steps, currentStepIndex, learningLang, nativeLang) {
    const container = document.getElementById('fastpathContainer');
    container.innerHTML = '';
    
    steps.forEach((chunk, index) => {
        const isLocked = index > currentStepIndex;
        const isActive = index === currentStepIndex;
        const isCompleted = index < currentStepIndex;
        
        // Sine wave offset (-120px to 120px)
        const offset = Math.sin(index * 0.8) * 120;
        
        const nodeDiv = document.createElement('div');
        nodeDiv.className = 'relative flex items-center justify-center my-4';
        nodeDiv.style.transform = `translateX(${offset}px)`;
        
        let btnClasses = "w-20 h-20 rounded-full flex items-center justify-center font-black text-2xl transition-all shadow-xl z-10 border-[6px] ";
        let iconHtml = '';
        
        if (isActive) {
            btnClasses += "bg-purple-500 border-purple-300 text-white animate-pulse shadow-[0_0_30px_rgba(168,85,247,0.8)] cursor-pointer hover:scale-110";
            iconHtml = `<svg xmlns="http://www.w3.org/2000/svg" class="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M12 14l9-5-9-5-9 5 9 5z"/><path stroke-linecap="round" stroke-linejoin="round" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"/></svg>`;
        } else if (isCompleted) {
            btnClasses += "bg-emerald-500 border-emerald-300 text-white shadow-[0_0_20px_rgba(16,185,129,0.5)] cursor-pointer hover:scale-105";
            iconHtml = `<svg xmlns="http://www.w3.org/2000/svg" class="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>`;
        } else {
            btnClasses += "bg-[#1e232e] border-slate-700 text-slate-500 cursor-not-allowed";
            iconHtml = `<svg xmlns="http://www.w3.org/2000/svg" class="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>`;
        }
        
        nodeDiv.innerHTML = `
           <button class="${btnClasses}" title="Adım ${index + 1}">
             ${iconHtml}
           </button>
           <div class="absolute -right-20 bg-white/5 border border-white/10 px-3 py-1 rounded-lg">
             <span class="text-slate-400 font-bold text-xs tracking-widest uppercase">Adım ${index + 1}</span>
           </div>
        `;
        
        if (!isLocked) {
            nodeDiv.querySelector('button').addEventListener('click', () => {
                startLesson(chunk, index, learningLang, nativeLang, isActive);
            });
        }
        
        container.appendChild(nodeDiv);
    });
}

function startLesson(chunk, stepIndex, learningLang, nativeLang, isCurrentLevel) {
    const modal = document.getElementById('fpModal');
    const inner = document.getElementById('fpModalInner');
    const closeBtn = document.getElementById('fpModalClose');
    
    const wordEl = document.getElementById('fpModalWord');
    const meaningBox = document.getElementById('fpModalMeaningBox');
    const meaningEl = document.getElementById('fpModalMeaning');
    const progressEl = document.getElementById('fpModalProgress');
    
    const btnReveal = document.getElementById('fpBtnReveal');
    const btnNext = document.getElementById('fpBtnNext');
    const btnComplete = document.getElementById('fpBtnComplete');
    const actionZone = document.getElementById('fpModalActionZone');
    const completeZone = document.getElementById('fpModalCompleteZone');
    
    let currentIndex = 0;
    
    // Reset state & show modal
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    setTimeout(() => {
        modal.classList.remove('opacity-0');
        inner.classList.remove('scale-95');
        inner.classList.add('scale-100');
    }, 10);
    
    const showWord = (idx) => {
        if (idx >= chunk.length) {
            // Finished step
            actionZone.classList.remove('flex');
            actionZone.classList.add('hidden');
            completeZone.classList.remove('hidden');
            completeZone.classList.add('flex');
            
            wordEl.textContent = "Tebrikler!";
            meaningBox.classList.remove('hidden');
            meaningEl.textContent = "Bu adımdaki tüm kelimeleri gördünüz.";
            progressEl.textContent = `Tamamlandı`;
            return;
        }
        
        const w = chunk[idx];
        wordEl.textContent = w.word;
        meaningEl.textContent = w.meanings[nativeLang] || w.meanings['tr'] || "Anlam bulunamadı";
        progressEl.textContent = `Kelime ${idx + 1} / ${chunk.length}`;
        
        meaningBox.classList.add('hidden');
        btnReveal.classList.remove('hidden');
        btnNext.classList.add('hidden');
        
        if ('speechSynthesis' in window) {
           const utterance = new SpeechSynthesisUtterance(w.word);
           utterance.lang = learningLang === 'en' ? 'en-US' : (learningLang === 'es' ? 'es-ES' : (learningLang === 'fr' ? 'fr-FR' : (learningLang === 'de' ? 'de-DE' : 'en-US')));
           window.speechSynthesis.speak(utterance);
        }
    };
    
    const finishLesson = () => {
        if (isCurrentLevel) {
            chrome.storage.local.get(['fastPathProgress'], (res) => {
                let p = res.fastPathProgress || {};
                p[learningLang] = stepIndex + 1;
                chrome.storage.local.set({ fastPathProgress: p }, () => {
                    initFastPath(learningLang, nativeLang); 
                });
            });
        }
        closeModal();
    };
    
    const closeModal = () => {
        modal.classList.add('opacity-0');
        inner.classList.remove('scale-100');
        inner.classList.add('scale-95');
        setTimeout(() => {
            modal.classList.remove('flex');
            modal.classList.add('hidden');
        }, 300);
    };
    
    closeBtn.onclick = closeModal;
    btnReveal.onclick = () => {
        meaningBox.classList.remove('hidden');
        btnReveal.classList.add('hidden');
        btnNext.classList.remove('hidden');
    };
    btnNext.onclick = () => {
        currentIndex++;
        showWord(currentIndex);
    };
    btnComplete.onclick = finishLesson;
    
    actionZone.classList.remove('hidden');
    actionZone.classList.add('flex');
    completeZone.classList.add('hidden');
    completeZone.classList.remove('flex');
    
    showWord(0);
}
