(() => {
  try {
    const script = document.createElement('script');
    script.src = chrome.runtime.getURL('content.js');
    script.onload = function() {
      console.log("LinguMark: Content script loaded successfully");
      // Call init after script is loaded
      if (typeof init === 'function') {
        init();
      }
    };
    script.onerror = function() {
      console.error("LinguMark: Failed to load content.js");
    };
    (document.head || document.documentElement).appendChild(script);
  } catch (error) {
    console.error("LinguMark: Error loading content module:", error);
  }
})();
