import { oxfordDictionary } from '../../shared/oxford.js';
import { t } from '../../shared/i18n.js';

let WORDS_PER_STEP = 12;

let activeLearningLang = 'en';
let activeNativeLang = 'tr';

function getFastPathDictionary(lang) {
    if (lang === 'en') {
        return oxfordDictionary.filter(w => w.level === 'A2');
    }
    return [];
}

export function initFastPath(learningLang, nativeLang) {
    activeLearningLang = learningLang;
    activeNativeLang = nativeLang;
    
    const dictionary = getFastPathDictionary(learningLang);
    const container = document.getElementById('fastpathContainer');
    if (!container) return;
    
    container.innerHTML = '';
    
    if (dictionary.length === 0) {
        container.innerHTML = `<div class="text-center text-slate-400 mt-20 flex flex-col items-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-16 h-16 text-slate-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/></svg>
            Şu an <b>${learningLang.toUpperCase()}</b> dili için FastPath kütüphanesi bulunmuyor.
        </div>`;
        return;
    }
    
    // Chunk words dynamically
    const steps = [];
    for (let i = 0; i < dictionary.length; i += WORDS_PER_STEP) {
        steps.push(dictionary.slice(i, i + WORDS_PER_STEP));
    }
    
    chrome.storage.local.get(['fastPathProgress', 'fastPathMistakes'], (result) => {
        let progressObj = result.fastPathProgress || {};
        let currentStepIndex = progressObj[learningLang] || 0; 
        
        let mistakesObj = result.fastPathMistakes || {};
        let mistakesForLang = mistakesObj[learningLang] || [];
        
        updateMistakesUI(mistakesForLang);
        renderMap(steps, currentStepIndex, learningLang, nativeLang);
    });
}

function updateMistakesUI(mistakes) {
    const btn = document.getElementById('btnFixMistakes');
    const count = document.getElementById('txtMistakeCount');
    if (!btn || !count) return;
    
    if (mistakes.length > 0) {
        btn.classList.remove('hidden');
        btn.classList.add('flex');
        count.textContent = mistakes.length;
        btn.onclick = () => {
            startFixMistakes(mistakes);
        };
    } else {
        btn.classList.add('hidden');
        btn.classList.remove('flex');
    }
}

function renderMap(steps, currentStepIndex, learningLang, nativeLang) {
    const container = document.getElementById('fastpathContainer');
    container.innerHTML = '';
    
    steps.forEach((chunk, index) => {
        const isLocked = index > currentStepIndex;
        const isActive = index === currentStepIndex;
        const isCompleted = index < currentStepIndex;
        
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
                startLesson(chunk, index, false);
            });
        }
        
        container.appendChild(nodeDiv);
    });
}

// Global Lesson State
let ls = {
    isFixMistakesMode: false,
    chunk: [],
    stepIndex: 0,
    learnQueue: [],
    testQueue: [],
    mistakesSet: new Set(), 
    totalInitialTestCount: 0,
    currentItem: null,
    currentPhase: 'LEARN'
};

function playAudio(wordText) {
    if ('speechSynthesis' in window) {
       const utterance = new SpeechSynthesisUtterance(wordText);
       utterance.lang = activeLearningLang === 'en' ? 'en-US' : (activeLearningLang === 'es' ? 'es-ES' : (activeLearningLang === 'fr' ? 'fr-FR' : (activeLearningLang === 'de' ? 'de-DE' : 'en-US')));
       window.speechSynthesis.speak(utterance);
    }
}

async function fetchWordData(word) {
    if (activeLearningLang !== 'en') return null;
    try {
        const res = await fetch(\`https://api.dictionaryapi.dev/api/v2/entries/en/\${word}\`);
        if (!res.ok) return null;
        const data = await res.json();
        let phonetic = data[0].phonetic || '';
        let partOfSpeech = '';
        let example = '';
        
        const meanings = data[0].meanings;
        if (meanings && meanings.length > 0) {
            partOfSpeech = meanings[0].partOfSpeech || '';
            const defs = meanings[0].definitions;
            if (defs && defs.length > 0) {
                example = defs[0].example || '';
            }
        }
        return { phonetic, partOfSpeech, example };
    } catch(e) {
        return null;
    }
}

function startFixMistakes(mistakesArray) {
    ls.isFixMistakesMode = true;
    ls.chunk = mistakesArray.slice(0, 20); // Test up to 20 mistakes
    ls.stepIndex = -1;
    ls.learnQueue = []; 
    ls.testQueue = ls.chunk.map(w => ({ ...w, retried: false }));
    // Shuffle testQueue
    ls.testQueue.sort(() => Math.random() - 0.5);
    ls.mistakesSet = new Set();
    ls.totalInitialTestCount = ls.testQueue.length;
    
    openModal();
    startTestPhase();
}

export function startLesson(chunk, stepIndex, isCurrentLevel) {
    ls.isFixMistakesMode = false;
    ls.chunk = chunk;
    ls.stepIndex = stepIndex;
    ls.learnQueue = [...chunk];
    ls.testQueue = chunk.map(w => ({ ...w, retried: false }));
    ls.testQueue.sort(() => Math.random() - 0.5);
    ls.mistakesSet = new Set();
    ls.totalInitialTestCount = ls.testQueue.length;
    
    openModal();
    startLearnPhase();
}

function openModal() {
    const modal = document.getElementById('fpModal');
    const inner = document.getElementById('fpModalInner');
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    setTimeout(() => {
        modal.classList.remove('opacity-0');
        inner.classList.remove('scale-95');
        inner.classList.add('scale-100');
    }, 10);
    
    document.getElementById('fpModalClose').onclick = closeModal;
    document.getElementById('fpBtnLearnNext').onclick = nextLearn;
    document.getElementById('fpBtnTestSubmit').onclick = submitTestTyping;
    document.getElementById('fpBtnFeedbackNext').onclick = nextTestItem;
    document.getElementById('fpBtnFinish').onclick = completeSession;
    
    // Audio buttons
    document.getElementById('fpBtnPlayAudio').onclick = () => playAudio(ls.currentItem.word);
    document.getElementById('fpBtnTestPlayAudio').onclick = () => playAudio(ls.currentItem.word);
    document.getElementById('fpBtnTestTypingAudio').onclick = () => playAudio(ls.currentItem.word);
    
    // Input Enter key support
    const testInput = document.getElementById('fpTestInput');
    testInput.onkeyup = (e) => {
        if (e.key === 'Enter') submitTestTyping();
    };
    document.getElementById('fpFeedbackIconCorrect').classList.add('hidden');
    document.getElementById('fpFeedbackIconWrong').classList.add('hidden');
}

function closeModal() {
    const modal = document.getElementById('fpModal');
    const inner = document.getElementById('fpModalInner');
    modal.classList.add('opacity-0');
    inner.classList.remove('scale-100');
    inner.classList.add('scale-95');
    setTimeout(() => {
        modal.classList.remove('flex');
        modal.classList.add('hidden');
    }, 300);
}

function hideAllZones() {
    ['fpZoneLearn', 'fpZoneTestChoice', 'fpZoneTestTyping', 'fpZoneResults'].forEach(id => {
        const el = document.getElementById(id);
        if(el) {
            el.classList.add('hidden');
            el.classList.remove('flex');
        }
    });
}

function setProgress(current, total, phaseName, phaseColor) {
    document.getElementById('fpModalProgress').textContent = \`\${current} / \${total}\`;
    const badge = document.getElementById('fpPhaseBadge');
    badge.textContent = phaseName;
    badge.className = \`bg-\${phaseColor}-500/10 text-\${phaseColor}-400 font-black tracking-[0.2em] uppercase text-xs px-4 py-2 rounded-xl border border-\${phaseColor}-500/20\`;
}

// ================= LEARN PHASE =================
async function startLearnPhase() {
    ls.currentPhase = 'LEARN';
    hideAllZones();
    document.getElementById('fpZoneLearn').classList.add('flex');
    document.getElementById('fpZoneLearn').classList.remove('hidden');
    showNextLearn();
}

async function showNextLearn() {
    if (ls.learnQueue.length === 0) {
        startTestPhase();
        return;
    }
    
    ls.currentItem = ls.learnQueue.shift();
    const currentIndex = ls.chunk.length - ls.learnQueue.length;
    setProgress(currentIndex, ls.chunk.length, 'ÖĞRENME AŞAMASI', 'purple');
    
    document.getElementById('fpLearnWord').textContent = ls.currentItem.word;
    document.getElementById('fpLearnMeaning').textContent = ls.currentItem.meanings[activeNativeLang] || ls.currentItem.meanings['tr'] || "Anlam bulunamadı";
    
    // reset API fields
    document.getElementById('fpLearnPhonetic').textContent = '';
    document.getElementById('fpLearnPoS').textContent = '';
    document.getElementById('fpLearnExampleBox').classList.add('hidden');
    
    playAudio(ls.currentItem.word);
    
    const apiData = await fetchWordData(ls.currentItem.word);
    if (apiData && ls.currentPhase === 'LEARN' && ls.currentItem.word === document.getElementById('fpLearnWord').textContent) {
        if (apiData.phonetic) document.getElementById('fpLearnPhonetic').textContent = apiData.phonetic;
        if (apiData.partOfSpeech) document.getElementById('fpLearnPoS').textContent = apiData.partOfSpeech;
        if (apiData.example) {
            document.getElementById('fpLearnExampleBox').classList.remove('hidden');
            document.getElementById('fpLearnExample').textContent = \`"\${apiData.example}"\`;
        }
    }
}

function nextLearn() {
    showNextLearn();
}

// ================= TEST PHASE =================
function startTestPhase() {
    ls.currentPhase = 'TEST';
    hideAllZones();
    showNextTest();
}

function showNextTest() {
    if (ls.testQueue.length === 0) {
        showResults();
        return;
    }
    
    ls.currentItem = ls.testQueue.shift();
    const testProgress = ls.totalInitialTestCount - ls.testQueue.filter(w => !w.retried).length;
    setProgress(testProgress, ls.totalInitialTestCount, 'TEST AŞAMASI', 'cyan');
    
    // Hide feedback
    document.getElementById('fpTestFeedback').classList.add('hidden');
    document.getElementById('fpTestFeedback').classList.remove('flex');
    
    // Randomly choose test type: 0 = Choice, 1 = Typing
    const type = Math.random() > 0.5 ? 1 : 0;
    hideAllZones();
    
    if (type === 0) {
        setupTestChoice();
    } else {
        setupTestTyping();
    }
    
    playAudio(ls.currentItem.word);
}

function setupTestChoice() {
    const zone = document.getElementById('fpZoneTestChoice');
    zone.classList.remove('hidden');
    zone.classList.add('flex');
    
    const optionsContainer = document.getElementById('fpTestOptions');
    optionsContainer.innerHTML = '';
    
    let options = [ls.currentItem];
    // Pick 3 random distractors from the whole dictionary
    let pool = oxfordDictionary.filter(w => w.id !== ls.currentItem.id);
    // Shuffle pool briefly
    pool.sort(() => 0.5 - Math.random());
    options.push(...pool.slice(0, 3));
    
    options.sort(() => 0.5 - Math.random());
    
    options.forEach(opt => {
        const btn = document.createElement('button');
        btn.className = "bg-white/5 hover:bg-white/10 border border-white/10 px-8 py-6 rounded-3xl text-xl font-bold text-slate-300 transition-all shadow-lg hover:border-cyan-500/50 hover:text-white hover:scale-105 active:scale-95";
        btn.textContent = opt.meanings[activeNativeLang] || opt.meanings['tr'];
        btn.onclick = () => handleAnswer(opt.id === ls.currentItem.id);
        optionsContainer.appendChild(btn);
    });
}

function setupTestTyping() {
    const zone = document.getElementById('fpZoneTestTyping');
    zone.classList.remove('hidden');
    zone.classList.add('flex');
    
    const input = document.getElementById('fpTestInput');
    input.value = '';
    setTimeout(() => input.focus(), 100);
}

function submitTestTyping() {
    const input = document.getElementById('fpTestInput').value.trim().toLowerCase();
    if (!input) return;
    const correct = ls.currentItem.word.toLowerCase();
    handleAnswer(input === correct);
}

function handleAnswer(isCorrect) {
    const feedbackOverlay = document.getElementById('fpTestFeedback');
    const fTitle = document.getElementById('fpFeedbackText');
    const fSub = document.getElementById('fpFeedbackSubtext');
    const iCorr = document.getElementById('fpFeedbackIconCorrect');
    const iWron = document.getElementById('fpFeedbackIconWrong');
    
    feedbackOverlay.classList.remove('hidden');
    feedbackOverlay.classList.add('flex');
    
    iCorr.classList.add('hidden');
    iWron.classList.add('hidden');
    
    if (isCorrect) {
        // CORRECT
        feedbackOverlay.className = "absolute inset-0 bg-emerald-900/95 backdrop-blur-xl rounded-[40px] flex flex-col items-center justify-center z-10 transition-all";
        fTitle.textContent = "Harika!";
        fTitle.className = "text-5xl font-black text-emerald-300 tracking-tighter drop-shadow-lg";
        fSub.classList.add('hidden');
        iCorr.classList.remove('hidden');
        
        // If in FixMistakes Mode, mark as correctly fixed
        if (ls.isFixMistakesMode && !ls.mistakesSet.has(ls.currentItem.id)) {
            removeMistakeFromStorage(ls.currentItem.id);
        }
        
    } else {
        // WRONG
        feedbackOverlay.className = "absolute inset-0 bg-red-900/95 backdrop-blur-xl rounded-[40px] flex flex-col items-center justify-center z-10 transition-all";
        fTitle.textContent = "Yanlış Cevap";
        fTitle.className = "text-5xl font-black text-red-300 tracking-tighter drop-shadow-lg";
        fSub.textContent = \`Doğrusu: \${ls.currentItem.word}\`;
        fSub.classList.remove('hidden');
        iWron.classList.remove('hidden');
        
        // Add to global mistakes if not retried yet
        if (!ls.currentItem.retried) {
            ls.mistakesSet.add(ls.currentItem.id);
            addMistakeToStorage(ls.currentItem);
            
            // Push to end of queue ONCE
            ls.currentItem.retried = true;
            ls.testQueue.push(ls.currentItem);
        }
    }
}

function nextTestItem() {
    showNextTest();
}

// ================= RESULTS PHASE =================
function showResults() {
    ls.currentPhase = 'RESULTS';
    hideAllZones();
    document.getElementById('fpZoneResults').classList.remove('hidden');
    document.getElementById('fpZoneResults').classList.add('flex');
    setProgress('-', '-', 'SONUÇ', 'emerald');
    
    const errorNotice = document.getElementById('fpResultErrorNotice');
    const accuracyEl = document.getElementById('fpResultAccuracy');
    const iconDiv = document.getElementById('fpResultIcon');
    const title = document.getElementById('fpResultTitle');
    
    if (ls.isFixMistakesMode) {
        title.textContent = "Hatalar Temizlendi!";
        accuracyEl.textContent = "Harika";
        errorNotice.classList.add('hidden');
        iconDiv.className = "w-32 h-32 rounded-full bg-gradient-to-tr from-emerald-400 to-teal-400 flex items-center justify-center mb-8 shadow-[0_0_60px_rgba(16,185,129,0.5)]";
        return;
    }
    
    const uniqueMistakes = ls.mistakesSet.size;
    const accuracy = ((ls.chunk.length - uniqueMistakes) / ls.chunk.length) * 100;
    
    accuracyEl.textContent = \`%\${Math.round(accuracy)}\`;
    
    if (accuracy >= 90) {
        title.textContent = "Harika İş Çıkardın!";
        errorNotice.classList.add('hidden');
        accuracyEl.className = "text-emerald-400 font-black";
        iconDiv.className = "w-32 h-32 rounded-full bg-gradient-to-tr from-emerald-400 to-teal-400 flex items-center justify-center mb-8 shadow-[0_0_60px_rgba(16,185,129,0.5)]";
        iconDiv.innerHTML = \`<svg class="w-16 h-16 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>\`;
        
        // Save progress
        chrome.storage.local.get(['fastPathProgress'], (res) => {
            let p = res.fastPathProgress || {};
            // Only advance if this was the latest unlocked step
            if (p[activeLearningLang] === undefined) p[activeLearningLang] = 0;
            if (ls.stepIndex === p[activeLearningLang]) {
                p[activeLearningLang] = ls.stepIndex + 1;
                chrome.storage.local.set({ fastPathProgress: p });
            }
        });
        
    } else {
        title.textContent = "Tekrar Denemelisin!";
        errorNotice.classList.remove('hidden');
        accuracyEl.className = "text-red-400 font-black";
        iconDiv.className = "w-32 h-32 rounded-full bg-gradient-to-tr from-red-500 to-orange-500 flex items-center justify-center mb-8 shadow-[0_0_60px_rgba(239,68,68,0.5)]";
        iconDiv.innerHTML = \`<svg class="w-16 h-16 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>\`;
    }
}

function completeSession() {
    closeModal();
    // Re-render map to reflect new progress and mistakes
    initFastPath(activeLearningLang, activeNativeLang);
}

// ================= MISTAKES STORAGE =================
function addMistakeToStorage(wordObj) {
    chrome.storage.local.get(['fastPathMistakes'], (result) => {
        let m = result.fastPathMistakes || {};
        if (!m[activeLearningLang]) m[activeLearningLang] = [];
        // Avoid duplicates
        if (!m[activeLearningLang].find(w => w.id === wordObj.id)) {
            m[activeLearningLang].push(wordObj);
            chrome.storage.local.set({ fastPathMistakes: m });
        }
    });
}

function removeMistakeFromStorage(wordId) {
    chrome.storage.local.get(['fastPathMistakes'], (result) => {
        let m = result.fastPathMistakes || {};
        if (!m[activeLearningLang]) return;
        m[activeLearningLang] = m[activeLearningLang].filter(w => w.id !== wordId);
        chrome.storage.local.set({ fastPathMistakes: m });
    });
}
