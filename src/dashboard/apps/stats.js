export function initStats(lang = 'tr') {
  const container = document.getElementById('statsContainer');
  if (!container) return;

  const words = window.linguWords || [];

  // Gamification Metrics
  const today = new Date().toISOString().split('T')[0];
  const todayWords = words.filter(w => w.dateAdded && w.dateAdded.startsWith(today)).length;
  const goal = 10;
  const progress = Math.min((todayWords / goal) * 100, 100);

  // Heatmap Data (Count words per day)
  const activityMap = {};
  words.forEach(w => {
    if (!w.dateAdded) return;
    const dateStr = w.dateAdded.split('T')[0];
    activityMap[dateStr] = (activityMap[dateStr] || 0) + 1;
  });

  // Calculate Streak
  let streak = 0;
  let currDate = new Date();
  
  // Check if today has activity, otherwise start checking from yesterday
  if (activityMap[today]) {
     streak++;
     currDate.setDate(currDate.getDate() - 1);
  } else {
     // If no activity today, streak might still be intact from yesterday, so we check yesterday
     currDate.setDate(currDate.getDate() - 1);
  }

  while (true) {
     const checkStr = currDate.toISOString().split('T')[0];
     if (activityMap[checkStr]) {
       streak++;
       currDate.setDate(currDate.getDate() - 1);
     } else {
       break;
     }
  }

  container.innerHTML = `
    <!-- Top Stats -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-8 w-full mb-12">
      <!-- Daily Goal -->
      <div class="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl relative overflow-hidden group">
        <div class="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full filter blur-[40px] group-hover:scale-150 transition-transform duration-700"></div>
        <h3 class="text-slate-400 text-sm font-bold tracking-widest uppercase mb-4">Bugünkü Hedef</h3>
        <div class="flex items-end gap-3 mb-6">
          <span class="text-6xl font-black text-white">${todayWords}</span>
          <span class="text-2xl text-slate-500 font-bold mb-1">/ ${goal} Kelime</span>
        </div>
        <div class="w-full bg-black/40 rounded-full h-3 mb-2 overflow-hidden border border-white/5">
          <div class="bg-gradient-to-r from-cyan-400 to-purple-500 h-3 rounded-full transition-all duration-1000" style="width: ${progress}%"></div>
        </div>
        <p class="text-xs text-slate-400 font-bold">${progress >= 100 ? 'Harika! Günlük hedefine ulaştın 🎉' : 'Hedefe ulaşmaya az kaldı! Yabancı makaleler oku.'}</p>
      </div>

      <!-- Streak -->
      <div class="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl relative overflow-hidden group">
        <div class="absolute -top-10 -right-10 w-40 h-40 bg-orange-500/10 rounded-full filter blur-[50px] group-hover:scale-125 transition-transform duration-700"></div>
        <h3 class="text-slate-400 text-sm font-bold tracking-widest uppercase mb-4">Öğrenme Serisi</h3>
        <div class="flex items-center gap-6 mt-4">
          <div class="w-16 h-16 bg-gradient-to-tr from-orange-400 to-red-500 rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(249,115,22,0.3)] animate-bounce">
            <svg class="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M17.5 10c0 3.58-2.5 6.5-6 6.5s-6-2.92-6-6.5c0-3.58 4.5-9.5 6-9.5s6 5.92 6 9.5z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/></svg>
          </div>
          <div>
            <span class="text-5xl font-black text-white">${streak}</span>
            <span class="text-slate-400 font-bold ml-2">Günlük Seri</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Heatmap -->
    <div class="w-full bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-10 shadow-2xl">
      <h3 class="text-xl font-black text-white mb-8 border-b border-white/10 pb-4">Aktivite (Son 90 Gün)</h3>
      <div class="flex flex-wrap gap-2" id="heatmapGrid"></div>
      <div class="flex justify-end items-center gap-3 mt-6 text-xs font-bold text-slate-500">
        <span>Az</span>
        <div class="w-4 h-4 rounded bg-white/5 border border-white/10"></div>
        <div class="w-4 h-4 rounded bg-green-500/30"></div>
        <div class="w-4 h-4 rounded bg-green-500/60"></div>
        <div class="w-4 h-4 rounded bg-green-400"></div>
        <span>Çok</span>
      </div>
    </div>
  `;

  // Render Heatmap Grid for last 90 days
  const heatmapGrid = document.getElementById('heatmapGrid');
  if (heatmapGrid) {
    const endNode = new Date();
    const startNode = new Date();
    startNode.setDate(endNode.getDate() - 90);

    let current = new Date(startNode);
    let html = '';

    while (current <= endNode) {
      const dateStr = current.toISOString().split('T')[0];
      const count = activityMap[dateStr] || 0;
      
      let colorClass = 'bg-white/5 border border-white/10'; // empty
      if (count > 0 && count <= 2) colorClass = 'bg-green-500/30';
      else if (count > 2 && count <= 5) colorClass = 'bg-green-500/60';
      else if (count > 5) colorClass = 'bg-green-400 shadow-[0_0_10px_rgba(74,222,128,0.4)]';

      html += `<div class="w-5 h-5 rounded ${colorClass} transition-colors hover:scale-125 hover:z-10 cursor-pointer" title="${dateStr}: ${count} kelime"></div>`;
      
      current.setDate(current.getDate() + 1);
    }
    
    heatmapGrid.innerHTML = html;
  }
}
