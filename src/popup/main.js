import { t } from '../shared/i18n.js';
const masterSwitch = document.getElementById('masterSwitch');
const langDropdownBtn = document.getElementById('langDropdownBtn');
const langDropdownText = document.getElementById('langDropdownText');
const langDropdownMenu = document.getElementById('langDropdownMenu');
const targetLangOptions = document.querySelectorAll('.lang-option');
const practiceBtn = document.getElementById('practiceBtn');

const appTitle = document.getElementById('appTitle');
const appSubTitle = document.getElementById('appSubTitle');
const practiceBtnText = document.getElementById('practiceBtnText');
const translateToLabel = document.getElementById('translateToLabel');

document.addEventListener('DOMContentLoaded', async () => {
  // Load settings
  const syncData = await chrome.storage.local.get(['masterSwitch', 'targetLang']);
  const currentLang = syncData.targetLang || 'tr';
  
  masterSwitch.checked = syncData.masterSwitch ?? true;
  updateSwitchVisuals(masterSwitch.checked);
  updateLocalUI(currentLang);

  if (practiceBtn) {
    practiceBtn.addEventListener('click', () => {
      chrome.tabs.create({ url: chrome.runtime.getURL('dashboard.html') });
    });
  }
  
  // Custom Dropdown logic
  langDropdownBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    langDropdownMenu.classList.toggle('hidden');
  });

  document.addEventListener('click', () => {
    langDropdownMenu.classList.add('hidden');
  });

  targetLangOptions.forEach(option => {
    option.addEventListener('click', async (e) => {
      const selectedValue = e.target.getAttribute('data-value');
      const selectedText = e.target.textContent;
      langDropdownText.textContent = selectedText;
      
      await chrome.storage.local.set({ targetLang: selectedValue });
      updateLocalUI(selectedValue);
    });
  });

  const selectedOption = Array.from(targetLangOptions).find(opt => opt.getAttribute('data-value') === currentLang);
  if (selectedOption) {
    langDropdownText.textContent = selectedOption.textContent;
  }

  // Listeners for settings
  masterSwitch.addEventListener('change', (e) => {
    chrome.storage.local.set({ masterSwitch: e.target.checked });
    updateSwitchVisuals(e.target.checked);
  });

  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === 'local' && changes.targetLang) {
       updateLocalUI(changes.targetLang.newValue);
    }
  });

  // Feature 2: Web Röntgen Trigger
  const rontgenBtn = document.getElementById('rontgenBtn');
  const clearRontgenBtn = document.getElementById('clearRontgenBtn');
  const levelCheckboxes = document.querySelectorAll('.rontgen-lv');

  // Handle visual feedback for levels
  function updateLevelVisuals() {
    levelCheckboxes.forEach(cb => {
      const label = cb.closest('label');
      if (cb.checked) {
        label.classList.replace('bg-white/5', 'bg-purple-500/20');
        label.classList.replace('border-white/5', 'border-purple-400/40');
        label.querySelector('span').classList.replace('text-slate-400', 'text-purple-200');
      } else {
        label.classList.replace('bg-purple-500/20', 'bg-white/5');
        label.classList.replace('border-purple-400/40', 'border-white/5');
        label.querySelector('span').classList.replace('text-purple-200', 'text-slate-400');
      }
    });
  }

  levelCheckboxes.forEach(cb => {
    cb.addEventListener('change', updateLevelVisuals);
  });
  updateLevelVisuals(); // Initial state

  if (rontgenBtn) {
    rontgenBtn.addEventListener('click', async () => {
      const selectedLevels = Array.from(levelCheckboxes)
        .filter(cb => cb.checked)
        .map(cb => cb.value);
      
      if (selectedLevels.length === 0) return;

      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab) {
        try {
          chrome.tabs.sendMessage(tab.id, { 
            type: "RONTGEN_SCAN", 
            levels: selectedLevels 
          });
        } catch(e) {
          // Content script may not be injected on this particular page (e.g., chrome:// pages)
          console.warn("LinguMark: Cannot send message to tab.", e);
        }
        
        // Visual feedback for the button
        const originalText = rontgenBtn.textContent;
        rontgenBtn.textContent = "TARANIYOR...";
        rontgenBtn.classList.add('bg-purple-600/50');
        setTimeout(() => {
          rontgenBtn.textContent = originalText;
          rontgenBtn.classList.remove('bg-purple-600/50');
          window.close(); // Close popup to let user see highlights
        }, 1000);
      }
    });
  }

  if (clearRontgenBtn) {
    clearRontgenBtn.addEventListener('click', async () => {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab) {
        try {
          chrome.tabs.sendMessage(tab.id, { type: "CLEAR_SCAN" });
        } catch(e) {
          console.warn("LinguMark: Cannot send clear message.", e);
        }
        window.close();
      }
    });
  }
});

function updateSwitchVisuals(isOn) {
  const bg = document.getElementById('switchBg');
  const dot = document.getElementById('switchDot');
  const status = document.getElementById('statusDot');
  if (isOn) {
     bg.classList.add('bg-green-500');
     bg.classList.remove('bg-slate-800');
     dot.style.transform = 'translateX(24px)';
     status.classList.replace('bg-slate-500', 'bg-green-400');
     status.classList.add('animate-pulse');
  } else {
     bg.classList.remove('bg-green-500');
     bg.classList.add('bg-slate-800');
     dot.style.transform = 'translateX(0)';
     status.classList.replace('bg-green-400', 'bg-slate-500');
     status.classList.remove('animate-pulse');
  }
}

function updateLocalUI(lang) {
  if (appTitle) appTitle.textContent = t('app_title', lang);
  if (appSubTitle) appSubTitle.textContent = t('smart_translation', lang);
  if (practiceBtnText) practiceBtnText.textContent = t('practice_btn', lang);
  if (translateToLabel) translateToLabel.textContent = t('translate_to', lang);
}

