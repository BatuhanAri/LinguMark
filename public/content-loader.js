(async () => {
  try {
    const src = chrome.runtime.getURL('content.js');
    await import(src);
  } catch (error) {
    console.error("LinguMark: Error loading content module:", error);
  }
})();
