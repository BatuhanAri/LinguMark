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
  const syncData = await chrome.storage.sync.get(['masterSwitch', 'targetLang']);
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
      
      await chrome.storage.sync.set({ targetLang: selectedValue });
      updateLocalUI(selectedValue);
    });
  });

  const selectedOption = Array.from(targetLangOptions).find(opt => opt.getAttribute('data-value') === currentLang);
  if (selectedOption) {
    langDropdownText.textContent = selectedOption.textContent;
  }

  // Listeners for settings
  masterSwitch.addEventListener('change', (e) => {
    chrome.storage.sync.set({ masterSwitch: e.target.checked });
    updateSwitchVisuals(e.target.checked);
  });

  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === 'sync' && changes.targetLang) {
       updateLocalUI(changes.targetLang.newValue);
    }
  });
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

