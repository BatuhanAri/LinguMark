import { loadLevelData } from './fastpath_data.js';
import { getLocalProgress, updateLevelProgress, setActiveLevel } from './fastpath_sync.js';
import { LEVELS, CDN_BASE, IMAGE_TIMEOUT, PREFETCH_AHEAD, WORDS_PER_UNIT } from '../../shared/constants.js';
import { t } from '../../shared/i18n.js';
import { isUserPremium } from '../../shared/premiumGuard.js';

// Memory Cleanup & State
let activeObservers = [];
let activeFetches = new AbortController();
let loadedData = null;
let activeLearningLang = 'en';
let activeNativeLang = 'tr';
let activeLevel = 'a2';

export async function initFastPath(learningLang, nativeLang) {
    activeLearningLang = learningLang;
    activeNativeLang = nativeLang;
    
    // Cleanup previous state
    activeObservers.forEach(obs => obs.disconnect());
    activeObservers = [];
    activeFetches.abort();
    activeFetches = new AbortController();

    const container = document.getElementById('fastpathContainer');
    if (!container) return;
    
    container.innerHTML = '';

    // 1. Render Level Selector
    renderLevelSelector(container);

    // 2. Load Progress & Data
    const progress = await getLocalProgress();
    activeLevel = progress.activeLevel || 'a2';
    
    const loadingDiv = document.createElement('div');
    loadingDiv.className = "text-center text-slate-400 mt-10 animate-pulse";
    loadingDiv.textContent = "Yükleniyor...";
    container.appendChild(loadingDiv);

    loadedData = await loadLevelData(activeLevel);
    loadingDiv.remove();

    if (!loadedData) {
        container.innerHTML += `<div class="text-center text-red-400 mt-10">Veri yüklenemedi. Lütfen internet bağlantınızı kontrol edip tekrar deneyin.</div>`;
        return;
    }

    const currentStepIndex = (progress.levels?.[activeLevel]?.progress) || 0;
    const historyForLang = (progress.levels?.[activeLevel]?.history) || {};
    const mistakesForLang = (progress.levels?.[activeLevel]?.mistakes) || [];

    updateMistakesUI(mistakesForLang);
    renderUnits(loadedData.units, currentStepIndex, historyForLang);
}

function renderLevelSelector(container) {
    const selector = document.createElement('div');
    selector.className = "flex flex-wrap justify-center gap-3 mb-10 p-4 bg-white/5 border border-white/10 rounded-3xl sticky top-0 z-20 backdrop-blur-md";
    
    LEVELS.forEach(lvl => {
        const isLocked = !lvl.free && !isUserPremium();
        const isActive = lvl.id === activeLevel;
        
        const btn = document.createElement('button');
        btn.className = `flex items-center gap-2 px-5 py-3 rounded-2xl font-bold transition-all border-2 ${
            isActive 
            ? "bg-purple-500 border-purple-400 text-white shadow-lg shadow-purple-500/30" 
            : "bg-slate-800/50 border-slate-700 text-slate-400 hover:border-slate-500"
        } ${isLocked ? "opacity-70" : ""}`;
        
        btn.innerHTML = `
            <span class="text-xl">${lvl.icon}</span>
            <div class="flex flex-col items-start">
                <span class="text-xs uppercase tracking-tighter opacity-70">${lvl.label}</span>
                <span class="text-sm">${lvl.title}</span>
            </div>
            ${isLocked ? `<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 ml-1 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>` : ""}
        `;
        
        btn.onclick = async () => {
            if (isLocked) {
                window.location.href = 'premium.html';
                return;
            }
            if (isActive) return;
            
            await setActiveLevel(lvl.id);
            initFastPath(activeLearningLang, activeNativeLang);
        };
        
        selector.appendChild(btn);
    });
    
    container.appendChild(selector);
}

function renderUnits(units, currentStepIndex, historyForLang) {
    const container = document.getElementById('fastpathContainer');
    let globalStepCounter = 0;

    units.forEach((unit, unitIdx) => {
        // Placeholder for Virtualization
        const unitSection = document.createElement('div');
        unitSection.className = "w-full mb-12 min-h-[200px]";
        container.appendChild(unitSection);

        const observer = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting) {
                observer.disconnect();
                renderUnitContent(unitSection, unit, unitIdx, globalStepCounter, currentStepIndex, historyForLang);
            }
        }, { rootMargin: '200px' });

        observer.observe(unitSection);
        activeObservers.push(observer);
        
        // Update global counter for the next unit based on chunks
        globalStepCounter += Math.ceil(unit.words.length / WORDS_PER_UNIT);
    });
}

function renderUnitContent(section, unit, unitIdx, unitStartStep, currentStepIndex, historyForLang) {
    section.innerHTML = '';
    
    // Render Unit Header
    const header = document.createElement('div');
    header.className = "w-full max-w-md mx-auto mb-8 p-6 bg-white/5 border border-white/10 rounded-[32px] flex items-center gap-6 shadow-2xl relative overflow-hidden group";
    header.innerHTML = `
        <div class="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
        <div class="w-16 h-16 bg-gradient-to-tr from-purple-500 to-indigo-500 rounded-2xl flex items-center justify-center text-3xl shadow-lg z-10">
            ${unit.icon}
        </div>
        <div class="flex flex-col z-10 text-left">
            <span class="text-purple-400 text-xs font-black tracking-widest uppercase mb-1">ÜNİTE ${unitIdx + 1}</span>
            <h3 class="text-xl font-bold text-white tracking-tight">${unit.title}</h3>
        </div>
    `;
    section.appendChild(header);

    // Chunk words
    const unitSteps = [];
    for (let i = 0; i < unit.words.length; i += WORDS_PER_UNIT) {
        unitSteps.push(unit.words.slice(i, i + WORDS_PER_UNIT));
    }

    unitSteps.forEach((chunk, stepOffset) => {
        const index = unitStartStep + stepOffset;
        const isLocked = index > currentStepIndex;
        const isActive = index === currentStepIndex;
        const isCompleted = index < currentStepIndex;
        
        const offset = Math.sin(index * 0.8) * 120;
        
        const nodeDiv = document.createElement('div');
        nodeDiv.className = 'relative flex items-center justify-center my-4 w-full';
        
        const innerNode = document.createElement('div');
        innerNode.className = 'relative flex items-center justify-center';
        innerNode.style.transform = `translateX(${offset}px)`;
        
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
        
        let exclamations = '';
        if (isCompleted && historyForLang[index] !== undefined) {
            const m = historyForLang[index];
            if (m >= 3) exclamations = `<span class="text-red-500 font-bold ml-1 text-sm tracking-tighter">! !</span>`;
            else if (m >= 1) exclamations = `<span class="text-red-500 font-bold ml-1 text-sm tracking-tighter">!</span>`;
        }
        
        innerNode.innerHTML = `
           <button class="${btnClasses}" title="Adım ${index + 1}">
             ${iconHtml}
           </button>
           <div class="absolute -right-20 bg-white/5 border border-white/10 px-3 py-1 rounded-lg flex items-center">
             <span class="text-slate-400 font-bold text-xs tracking-widest uppercase whitespace-nowrap">Adım ${index + 1}</span>${exclamations}
           </div>
        `;
        
        if (!isLocked) {
            innerNode.querySelector('button').addEventListener('click', () => {
                startLesson(chunk, index);
            });
        }
        
        nodeDiv.appendChild(innerNode);
        section.appendChild(nodeDiv);
    });
}

// Lesson State
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
        const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`, { signal: activeFetches.signal });
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

function startLesson(chunk, stepIndex) {
    ls.isFixMistakesMode = false;
    ls.chunk = chunk;
    ls.stepIndex = stepIndex;
    ls.learnQueue = [...chunk];
    ls.testQueue = chunk.map(w => ({ ...w, retried: false }));
    ls.testQueue.sort(() => Math.random() - 0.5);
    ls.mistakesSet = new Set();
    ls.totalInitialTestCount = ls.testQueue.length;
    
    // Prefetch next 2 images
    prefetchNextImages(chunk, 0);
    
    openModal();
    startLearnPhase();
}

function prefetchNextImages(chunk, startIndex) {
    for (let i = 1; i <= PREFETCH_AHEAD; i++) {
        const item = chunk[startIndex + i];
        if (item && item.image) {
            const link = document.createElement('link');
            link.rel = 'prefetch';
            link.as = 'image';
            link.href = `${CDN_BASE}/${activeLevel}/${item.image}`;
            document.head.appendChild(link);
        }
    }
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
    
    document.getElementById('fpBtnPlayAudio').onclick = () => playAudio(ls.currentItem.word);
    document.getElementById('fpBtnTestPlayAudio').onclick = () => playAudio(ls.currentItem.word);
    document.getElementById('fpBtnTestTypingAudio').onclick = () => playAudio(ls.currentItem.word);
    
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
    document.getElementById('fpModalProgress').textContent = `${current} / ${total}`;
    const badge = document.getElementById('fpPhaseBadge');
    badge.textContent = phaseName;
    badge.className = `bg-${phaseColor}-500/10 text-${phaseColor}-400 font-black tracking-[0.2em] uppercase text-xs px-4 py-2 rounded-xl border border-${phaseColor}-500/20`;
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
    
    // Prefetch ahead
    prefetchNextImages(ls.chunk, currentIndex);
    
    // reset UI fields
    document.getElementById('fpLearnPhonetic').textContent = '';
    document.getElementById('fpLearnPoS').textContent = '';
    document.getElementById('fpLearnExampleBox').classList.add('hidden');
    
    const imgContainer = document.getElementById('fpLearnImageContainer');
    const imgEl = document.getElementById('fpLearnImage');
    if (imgContainer && imgEl) {
        imgContainer.classList.add('hidden');
        imgEl.src = '';
    }
    
    playAudio(ls.currentItem.word);
    
    // Load Image
    if (ls.currentItem.image) {
        imgEl.loading = 'lazy';
        imgEl.decoding = 'async';
        imgEl.onerror = () => { imgEl.src = 'icons/placeholder.svg'; };
        imgEl.src = `${CDN_BASE}/${activeLevel}/${ls.currentItem.image}`;
        imgContainer.classList.remove('hidden');
    }
    
    // Fetch word data only if example is missing
    if (!ls.currentItem.example) {
        const apiData = await fetchWordData(ls.currentItem.word);
        if (apiData && ls.currentItem.word === document.getElementById('fpLearnWord').textContent) {
            if (apiData.phonetic) document.getElementById('fpLearnPhonetic').textContent = apiData.phonetic;
            if (apiData.partOfSpeech) document.getElementById('fpLearnPoS').textContent = apiData.partOfSpeech;
            if (apiData.example) {
                document.getElementById('fpLearnExampleBox').classList.remove('hidden');
                document.getElementById('fpLearnExample').textContent = `"${apiData.example}"`;
            }
        }
    } else {
        document.getElementById('fpLearnExampleBox').classList.remove('hidden');
        document.getElementById('fpLearnExample').textContent = `"${ls.currentItem.example}"`;
        if (ls.currentItem.pos) document.getElementById('fpLearnPoS').textContent = ls.currentItem.pos;
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
    
    document.getElementById('fpTestFeedback').classList.add('hidden');
    document.getElementById('fpTestFeedback').classList.remove('flex');
    
    const type = Math.floor(Math.random() * 3);
    hideAllZones();
    
    if (type === 0 || type === 1) {
        setupTestChoice(type);
    } else {
        setupTestTyping();
    }
    
    playAudio(ls.currentItem.word);
}

function setupTestChoice(type) {
    const zone = document.getElementById('fpZoneTestChoice');
    zone.classList.remove('hidden');
    zone.classList.add('flex');
    
    const optionsContainer = document.getElementById('fpTestOptions');
    const wordEl = document.getElementById('fpTestChoiceWord');
    const promptEl = document.getElementById('fpTestChoicePrompt');
    optionsContainer.innerHTML = '';
    
    if (type === 0) {
        wordEl.textContent = ls.currentItem.word;
        wordEl.classList.remove('hidden');
        promptEl.textContent = "Bu kelimenin anlamını seçin";
    } else {
        wordEl.classList.add('hidden');
        promptEl.textContent = "Duyduğunuz kelimeyi seçin";
    }
    
    let options = [ls.currentItem];
    let allWords = loadedData.units.flatMap(u => u.words);
    let pool = allWords.filter(w => w.id !== ls.currentItem.id);
    pool.sort(() => 0.5 - Math.random());
    options.push(...pool.slice(0, 3));
    
    options.sort(() => 0.5 - Math.random());
    
    options.forEach(opt => {
        const btn = document.createElement('button');
        btn.className = "bg-white/5 hover:bg-white/10 border border-white/10 px-8 py-6 rounded-3xl text-xl font-bold text-slate-300 transition-all shadow-lg hover:border-cyan-500/50 hover:text-white hover:scale-105 active:scale-95";
        btn.textContent = type === 0 ? (opt.meanings[activeNativeLang] || opt.meanings['tr']) : opt.word;
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
        feedbackOverlay.className = "absolute inset-0 bg-emerald-900/95 backdrop-blur-xl rounded-[40px] flex flex-col items-center justify-center z-10 transition-all";
        fTitle.textContent = "Harika!";
        fTitle.className = "text-5xl font-black text-emerald-300 tracking-tighter drop-shadow-lg";
        fSub.classList.add('hidden');
        iCorr.classList.remove('hidden');
        
        if (ls.isFixMistakesMode && !ls.mistakesSet.has(ls.currentItem.id)) {
            removeMistakeFromStorage(ls.currentItem.id);
        }
    } else {
        feedbackOverlay.className = "absolute inset-0 bg-red-900/95 backdrop-blur-xl rounded-[40px] flex flex-col items-center justify-center z-10 transition-all";
        fTitle.textContent = "Yanlış Cevap";
        fTitle.className = "text-5xl font-black text-red-300 tracking-tighter drop-shadow-lg";
        fSub.textContent = `Doğrusu: ${ls.currentItem.word}`;
        fSub.classList.remove('hidden');
        iWron.classList.remove('hidden');
        
        if (!ls.currentItem.retried) {
            ls.mistakesSet.add(ls.currentItem.id);
            addMistakeToStorage(ls.currentItem);
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
    document.getElementById('fpTestFeedback').classList.add('hidden');
    document.getElementById('fpTestFeedback').classList.remove('flex');
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
    const isPass = uniqueMistakes <= 4;
    
    if (uniqueMistakes === 0) {
        title.textContent = "Harika İş Çıkardın!";
        accuracyEl.innerHTML = "0 Hata";
        accuracyEl.className = "text-emerald-400 font-black";
        iconDiv.className = "w-32 h-32 rounded-full bg-gradient-to-tr from-emerald-400 to-teal-400 flex items-center justify-center mb-8 shadow-[0_0_60px_rgba(16,185,129,0.5)]";
        iconDiv.innerHTML = `<svg class="w-16 h-16 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>`;
    } else if (uniqueMistakes <= 2) {
        title.textContent = "Tebrikler!";
        accuracyEl.innerHTML = `${uniqueMistakes} Hata <span class="text-red-500 font-bold ml-1 text-4xl">!</span>`;
        accuracyEl.className = "text-emerald-400 font-black flex items-center justify-center";
        iconDiv.className = "w-32 h-32 rounded-full bg-gradient-to-tr from-emerald-400 to-teal-400 flex items-center justify-center mb-8 shadow-[0_0_60px_rgba(16,185,129,0.5)]";
        iconDiv.innerHTML = `<svg class="w-16 h-16 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>`;
    } else if (uniqueMistakes <= 4) {
        title.textContent = "Zorla Geçtin!";
        accuracyEl.innerHTML = `${uniqueMistakes} Hata <span class="text-red-500 font-bold ml-1 text-4xl">! !</span>`;
        accuracyEl.className = "text-orange-400 font-black flex items-center justify-center";
        iconDiv.className = "w-32 h-32 rounded-full bg-gradient-to-tr from-orange-400 to-yellow-400 flex items-center justify-center mb-8 shadow-[0_0_60px_rgba(249,115,22,0.5)]";
        iconDiv.innerHTML = `<svg class="w-16 h-16 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>`;
    } else {
        title.textContent = "Tekrar Denemelisin!";
        accuracyEl.innerHTML = `${uniqueMistakes} Hata <span class="text-red-500 font-bold ml-1 text-4xl">! ! !</span>`;
        accuracyEl.className = "text-red-400 font-black flex items-center justify-center";
        iconDiv.className = "w-32 h-32 rounded-full bg-gradient-to-tr from-red-500 to-orange-500 flex items-center justify-center mb-8 shadow-[0_0_60px_rgba(239,68,68,0.5)]";
        iconDiv.innerHTML = `<svg class="w-16 h-16 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>`;
    }
    
    if (isPass) {
        errorNotice.classList.add('hidden');
        getLocalProgress().then(local => {
            let h = local.levels?.[activeLevel]?.history || {};
            let prevMistakes = h[ls.stepIndex];
            if (prevMistakes === undefined || uniqueMistakes < prevMistakes) {
                h[ls.stepIndex] = uniqueMistakes;
            }
            
            let p = local.levels?.[activeLevel]?.progress || 0;
            if (ls.stepIndex === p) {
                p = ls.stepIndex + 1;
            }
            
            updateLevelProgress(activeLevel, { progress: p, history: h }).then(() => {
                pushToFirestore(); // Session End Sync
            });
        });
    } else {
        errorNotice.classList.remove('hidden');
    }
}

async function completeSession() {
    closeModal();
    initFastPath(activeLearningLang, activeNativeLang);
}

// ================= MISTAKES STORAGE =================
async function addMistakeToStorage(wordObj) {
    const local = await getLocalProgress();
    let m = local.levels?.[activeLevel]?.mistakes || [];
    if (!m.find(w => w.id === wordObj.id)) {
        m.push(wordObj);
        await updateLevelProgress(activeLevel, { mistakes: m });
    }
}

async function removeMistakeFromStorage(wordId) {
    const local = await getLocalProgress();
    let m = local.levels?.[activeLevel]?.mistakes || [];
    m = m.filter(w => w.id !== wordId);
    await updateLevelProgress(activeLevel, { mistakes: m });
}

async function startFixMistakes(mistakesArray) {
    ls.isFixMistakesMode = true;
    ls.chunk = mistakesArray.slice(0, 20);
    ls.stepIndex = -1;
    ls.learnQueue = []; 
    ls.testQueue = ls.chunk.map(w => ({ ...w, retried: false }));
    ls.testQueue.sort(() => Math.random() - 0.5);
    ls.mistakesSet = new Set();
    ls.totalInitialTestCount = ls.testQueue.length;
    
    openModal();
    startTestPhase();
}

function updateMistakesUI(mistakes) {
    const btn = document.getElementById('btnFixMistakes');
    const count = document.getElementById('txtMistakeCount');
    if (!btn || !count) return;
    
    if (mistakes && mistakes.length > 0) {
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
