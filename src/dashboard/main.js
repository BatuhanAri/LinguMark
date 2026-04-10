const noWordsState = document.getElementById('noWordsState');
const practiceArea = document.getElementById('practiceArea');
const flashcard = document.getElementById('flashcard');
const flashcardInner = document.getElementById('flashcardInner');
const fcWord = document.getElementById('fcWord');
const fcMeaning = document.getElementById('fcMeaning');
const fcLang = document.getElementById('fcLang');
const progressText = document.getElementById('progressText');
const btnForgot = document.getElementById('btnForgot');
const btnRemembered = document.getElementById('btnRemembered');

let words = [];
let currentIndex = 0;
let isFlipped = false;

document.addEventListener('DOMContentLoaded', () => {
  chrome.storage.local.get(['words'], (result) => {
    words = result.words || [];
    
    if (words.length === 0) {
      noWordsState.classList.remove('hidden');
      noWordsState.classList.add('flex');
      practiceArea.classList.remove('flex');
      practiceArea.classList.add('hidden');
    } else {
      // Shuffle words for practice
      words = words.sort(() => Math.random() - 0.5);
      noWordsState.classList.remove('flex');
      noWordsState.classList.add('hidden');
      practiceArea.classList.remove('hidden');
      practiceArea.classList.add('flex');
      
      showWord(0);
    }
  });
});

flashcard.addEventListener('click', (e) => {
  // Prevent flipping when clicking buttons on the back
  if (e.target.tagName === 'BUTTON' || e.target.closest('button')) return;
  
  isFlipped = !isFlipped;
  if (isFlipped) {
    flashcardInner.classList.add('rotate-y-180');
  } else {
    flashcardInner.classList.remove('rotate-y-180');
  }
});

function showWord(index) {
  if (index >= words.length) {
    // Finished!
    fcWord.textContent = "";
    fcMeaning.textContent = "Tüm kelimeleri başarıyla tekrar ettin.";
    progressText.textContent = `${words.length} / ${words.length}`;
    fcLang.textContent = "BİTTİ";
    
    // Hide buttons on the back
    btnForgot.style.display = 'none';
    btnRemembered.style.display = 'none';
    
    // Add a return button instead
    const returnBtn = document.createElement('button');
    returnBtn.className = 'bg-gradient-to-r from-purple-500 to-cyan-500 text-white font-bold py-3 px-8 rounded-xl shadow-lg mt-4';
    returnBtn.textContent = 'Başa Dön';
    returnBtn.onclick = () => location.reload();
    fcMeaning.parentNode.appendChild(returnBtn);

    // Auto flip to back to show congrats
    if (!isFlipped) {
      flashcardInner.classList.add('rotate-y-180');
    }
    return;
  }

  const wordObj = words[index];
  fcWord.textContent = wordObj.word;
  fcMeaning.textContent = wordObj.meaning;
  fcLang.textContent = (wordObj.lang || 'TR').toUpperCase();
  progressText.textContent = `${index + 1} / ${words.length}`;
  
  btnForgot.style.display = 'block';
  btnRemembered.style.display = 'flex';
  
  // Ensure front is showing
  isFlipped = false;
  flashcardInner.classList.remove('rotate-y-180');
}

btnForgot.addEventListener('click', (e) => {
  e.stopPropagation();
  // Move current word to the end of the list to practice again, or just let it pass but we want them to learn it
  const currentWord = words[currentIndex];
  words.push(currentWord);
  
  currentIndex++;
  
  // Quick flip back to front before showing next word
  isFlipped = false;
  flashcardInner.classList.remove('rotate-y-180');
  
  setTimeout(() => {
    showWord(currentIndex);
  }, 300);
});

btnRemembered.addEventListener('click', (e) => {
  e.stopPropagation();
  currentIndex++;
  
  // Quick flip back to front before showing next word
  isFlipped = false;
  flashcardInner.classList.remove('rotate-y-180');
  
  setTimeout(() => {
    showWord(currentIndex);
  }, 300);
});
