import { LayoutAuditResult } from '../types';

export function generateHtmlReport(result: LayoutAuditResult): string {
  const { url, timestamp, device, viewport, uxScore, overflowIssues, touchTargetIssues, viewportFit, readabilityIssues, occlusionIssues, layoutShiftResult, screenshotBase64, executionTimeMs } = result;

  const totalIssues = overflowIssues.length + touchTargetIssues.length + readabilityIssues.length + occlusionIssues.length + viewportFit.issues.length;

  const scoreColor = uxScore.totalScore >= 85 ? '#10b981' : uxScore.totalScore >= 70 ? '#f59e0b' : '#ef4444';
  const gradeBadgeClass = uxScore.grade.startsWith('A') ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' : uxScore.grade.startsWith('B') ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' : 'bg-rose-500/20 text-rose-300 border-rose-500/40';

  return `<!DOCTYPE html>
<html lang="en" class="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Layout & UX Audit Report — ${escapeHtml(url)}</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      darkMode: 'class',
      theme: {
        extend: {
          colors: {
            brand: {
              50: '#eef2ff',
              500: '#6366f1',
              600: '#4f46e5',
              900: '#312e81',
            }
          }
        }
      }
    }
  </script>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap');
    body { font-family: 'Inter', sans-serif; }
    code, pre { font-family: 'JetBrains Mono', monospace; }
  </style>
</head>
<body class="bg-slate-950 text-slate-100 min-h-screen antialiased p-4 md:p-8">
  <div class="max-w-7xl mx-auto space-y-8">
    
    <!-- Top Header -->
    <header class="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 bg-slate-900/80 backdrop-blur border border-slate-800 rounded-2xl shadow-xl">
      <div class="space-y-1">
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-500/30">
            📐
          </div>
          <h1 class="text-2xl font-bold tracking-tight text-white">Playwright Layout Inspector</h1>
          <span class="px-2.5 py-0.5 text-xs font-semibold rounded-full border ${gradeBadgeClass}">
            Grade ${uxScore.grade}
          </span>
        </div>
        <p class="text-sm text-slate-400 font-mono break-all">${escapeHtml(url)}</p>
      </div>

      <div class="flex flex-wrap items-center gap-3 text-xs text-slate-400">
        <div class="bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700">
          📱 <span class="font-semibold text-slate-200">${escapeHtml(device?.name || `${viewport.width}x${viewport.height}`)}</span>
        </div>
        <div class="bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700">
          ⏱️ <span class="font-semibold text-slate-200">${executionTimeMs}ms</span>
        </div>
        <div class="bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700">
          📅 <span class="font-semibold text-slate-200">${new Date(timestamp).toLocaleTimeString()}</span>
        </div>
      </div>
    </header>

    <!-- Score & Overview Hero -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
      
      <!-- Primary UX Score Gauge -->
      <div class="md:col-span-1 p-6 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col items-center justify-center text-center shadow-lg relative overflow-hidden">
        <div class="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-4">Overall UX Score</div>
        <div class="relative flex items-center justify-center w-36 h-36">
          <svg class="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
            <path class="text-slate-800" stroke-width="3.5" stroke="currentColor" fill="none"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
            <path stroke="${scoreColor}" stroke-width="3.5" stroke-dasharray="${uxScore.totalScore}, 100" stroke-linecap="round" fill="none"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
          </svg>
          <div class="absolute flex flex-col items-center">
            <span class="text-4xl font-extrabold text-white">${Math.round(uxScore.totalScore)}</span>
            <span class="text-xs font-bold text-slate-400">/ 100</span>
          </div>
        </div>
        <div class="mt-4 text-xs font-medium text-slate-400">
          ${uxScore.passed ? '<span class="text-emerald-400 font-semibold">✓ Pass UX Standards</span>' : '<span class="text-rose-400 font-semibold">✗ Fails UX Standards</span>'}
        </div>
      </div>

      <!-- Category Breakdown Cards -->
      <div class="md:col-span-3 grid grid-cols-1 sm:grid-cols-2 gap-4">
        ${renderCategoryCard(uxScore.categories.overflowAndFit, '🌊')}
        ${renderCategoryCard(uxScore.categories.stability, '⚖️')}
        ${renderCategoryCard(uxScore.categories.touchErgonomics, '👆')}
        ${renderCategoryCard(uxScore.categories.readabilityAndVisibility, '👁️')}
      </div>
    </div>

    <!-- Visual Screenshot & Bounding Boxes (if available) -->
    ${screenshotBase64 ? `
    <section class="p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-4">
      <div class="flex items-center justify-between">
        <h2 class="text-lg font-bold text-white flex items-center gap-2">
          <span>📸</span> Visual Viewport Inspection
        </h2>
        <span class="text-xs text-slate-400 font-mono">${viewport.width} x ${viewport.height} CSS px (DPR: ${viewport.devicePixelRatio}x)</span>
      </div>
      <div class="flex justify-center bg-slate-950 p-4 rounded-xl border border-slate-800/80 overflow-auto">
        <div class="relative border-4 border-slate-700 rounded-lg shadow-2xl overflow-hidden" style="max-width: ${viewport.width}px; width: 100%;">
          <img src="data:image/png;base64,${screenshotBase64}" alt="Page Visual Audit" class="w-full h-auto block" />
          
          <!-- Bounding box overlays for overflow issues -->
          ${overflowIssues.map(issue => `
            <div style="
              position: absolute;
              left: ${issue.boundingBox.x}px;
              top: ${issue.boundingBox.y}px;
              width: ${issue.boundingBox.width}px;
              height: ${issue.boundingBox.height}px;
              border: 2px dashed #ef4444;
              background-color: rgba(239, 68, 68, 0.15);
              pointer-events: none;
            " title="${escapeHtml(issue.culpritDescription)}">
              <span class="bg-red-600 text-white text-[9px] font-mono px-1 py-0.5 rounded absolute -top-4 left-0">Overflow +${Math.round(issue.overflowRightPx)}px</span>
            </div>
          `).join('')}

          <!-- Bounding box overlays for touch targets -->
          ${touchTargetIssues.map(issue => `
            <div style="
              position: absolute;
              left: ${issue.boundingBox.x}px;
              top: ${issue.boundingBox.y}px;
              width: ${issue.boundingBox.width}px;
              height: ${issue.boundingBox.height}px;
              border: 2px dashed #f59e0b;
              background-color: rgba(245, 158, 11, 0.15);
              pointer-events: none;
            " title="${escapeHtml(issue.suggestion)}">
              <span class="bg-amber-600 text-white text-[9px] font-mono px-1 py-0.5 rounded absolute -top-4 left-0">Target: ${Math.round(issue.width)}x${Math.round(issue.height)}px</span>
            </div>
          `).join('')}
        </div>
      </div>
    </section>
    ` : ''}

    <!-- Issues Triage Section -->
    <section class="p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-6">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h2 class="text-xl font-bold text-white flex items-center gap-2">
            <span>🛠️</span> Issues & Remediation (${totalIssues})
          </h2>
          <p class="text-xs text-slate-400">Actionable layout, overflow, and touch ergonomics fixes</p>
        </div>
      </div>

      ${totalIssues === 0 ? `
        <div class="py-12 text-center text-slate-400 space-y-2">
          <div class="text-4xl">🎉</div>
          <p class="text-base font-semibold text-slate-200">No layout or UX issues detected!</p>
          <p class="text-xs">Your layout complies with responsive viewport fit, touch target standards, and stability rules.</p>
        </div>
      ` : `
        <div class="space-y-4">
          <!-- Viewport Fit Issues -->
          ${viewportFit.issues.map(iss => `
            <div class="p-4 bg-rose-950/30 border border-rose-500/30 rounded-xl space-y-2">
              <div class="flex items-center gap-2 text-rose-400 font-semibold text-sm">
                <span>🚨 Viewport Constraint Issue</span>
              </div>
              <p class="text-sm text-slate-200">${escapeHtml(iss)}</p>
              ${viewportFit.suggestions.length > 0 ? `
                <div class="text-xs text-slate-400 bg-slate-900/80 p-2.5 rounded-lg border border-slate-800 font-mono">
                  💡 <span class="text-indigo-300">Suggestion:</span> ${escapeHtml(viewportFit.suggestions.join(' '))}
                </div>
              ` : ''}
            </div>
          `).join('')}

          <!-- Overflow Issues -->
          ${overflowIssues.map(issue => `
            <div class="p-4 bg-slate-950/80 border border-red-500/30 rounded-xl space-y-3">
              <div class="flex items-start justify-between gap-4">
                <div class="space-y-1">
                  <div class="flex items-center gap-2">
                    <span class="px-2 py-0.5 text-[10px] font-bold rounded uppercase bg-red-500/20 text-red-400 border border-red-500/30">
                      ${issue.severity}
                    </span>
                    <span class="text-sm font-semibold text-slate-100">Horizontal Viewport Bleed (+${Math.round(issue.overflowRightPx)}px)</span>
                  </div>
                  <div class="text-xs font-mono text-indigo-400 bg-indigo-950/40 px-2 py-1 rounded border border-indigo-500/20 inline-block">
                    ${escapeHtml(issue.selector)}
                  </div>
                </div>
                <div class="text-right text-xs text-slate-400 font-mono">
                  Width: ${Math.round(issue.boundingBox.width)}px / Screen: ${issue.viewport.width}px
                </div>
              </div>
              <p class="text-xs text-slate-300">${escapeHtml(issue.culpritDescription)}</p>
              <div class="text-xs text-emerald-300 bg-emerald-950/30 p-2.5 rounded-lg border border-emerald-500/20 font-mono">
                💡 <span class="font-bold text-emerald-400">Fix:</span> ${escapeHtml(issue.suggestedFix)}
              </div>
            </div>
          `).join('')}

          <!-- Touch Target Issues -->
          ${touchTargetIssues.map(issue => `
            <div class="p-4 bg-slate-950/80 border border-amber-500/30 rounded-xl space-y-3">
              <div class="flex items-start justify-between gap-4">
                <div class="space-y-1">
                  <div class="flex items-center gap-2">
                    <span class="px-2 py-0.5 text-[10px] font-bold rounded uppercase bg-amber-500/20 text-amber-400 border border-amber-500/30">
                      Touch Target Too Small
                    </span>
                    <span class="text-sm font-semibold text-slate-100">${Math.round(issue.width)}x${Math.round(issue.height)}px (Min: ${issue.minRequiredSize}px)</span>
                  </div>
                  <div class="text-xs font-mono text-indigo-400 bg-indigo-950/40 px-2 py-1 rounded border border-indigo-500/20 inline-block">
                    ${escapeHtml(issue.selector)}
                  </div>
                </div>
              </div>
              <p class="text-xs text-slate-300">${escapeHtml(issue.suggestion)}</p>
            </div>
          `).join('')}

          <!-- Readability Issues -->
          ${readabilityIssues.map(issue => `
            <div class="p-4 bg-slate-950/80 border border-slate-800 rounded-xl space-y-2">
              <div class="flex items-center gap-2">
                <span class="px-2 py-0.5 text-[10px] font-bold rounded uppercase bg-slate-700 text-slate-300">
                  Readability Warning
                </span>
                <span class="text-sm font-semibold text-slate-200">Font Size ${issue.fontSizePx}px ${issue.isTruncated ? '(Truncated)' : ''}</span>
              </div>
              <div class="text-xs font-mono text-slate-400">${escapeHtml(issue.selector)}</div>
              <p class="text-xs text-slate-300">${escapeHtml(issue.suggestion)}</p>
            </div>
          `).join('')}
        </div>
      `}
    </section>

    <!-- Layout Shift Attribution Section (if tracked) -->
    ${layoutShiftResult ? `
    <section class="p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-4">
      <div class="flex items-center justify-between">
        <h2 class="text-lg font-bold text-white flex items-center gap-2">
          <span>⚖️</span> Tracked Layout Shifts (${layoutShiftResult.items.length})
        </h2>
        <span class="px-2.5 py-0.5 text-xs font-semibold rounded-full border ${layoutShiftResult.isAcceptable ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' : 'bg-rose-500/20 text-rose-300 border-rose-500/40'}">
          Shift Score: ${layoutShiftResult.totalShiftScore}
        </span>
      </div>
      <p class="text-xs text-slate-400">${escapeHtml(layoutShiftResult.summary)}</p>
      
      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs">
          <thead class="bg-slate-950 text-slate-400 uppercase font-mono">
            <tr>
              <th class="p-3">Element</th>
              <th class="p-3">Displacement</th>
              <th class="p-3">Impact Score</th>
              <th class="p-3">Severity</th>
              <th class="p-3">Analysis</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-800">
            ${layoutShiftResult.items.map(item => `
              <tr class="hover:bg-slate-800/40">
                <td class="p-3 font-mono text-indigo-400">${escapeHtml(item.selector)}</td>
                <td class="p-3 font-mono text-slate-200">Δx: ${item.deltaX}px, Δy: ${item.deltaY}px (${Math.round(item.distance)}px)</td>
                <td class="p-3 font-mono text-amber-400">${item.impactScore}</td>
                <td class="p-3">
                  <span class="px-2 py-0.5 rounded text-[10px] font-bold ${item.isJarring ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' : 'bg-slate-800 text-slate-400'}">
                    ${item.isJarring ? 'JARRING' : 'Minor'}
                  </span>
                </td>
                <td class="p-3 text-slate-300">${escapeHtml(item.explanation)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </section>
    ` : ''}

    <!-- Footer -->
    <footer class="text-center text-xs text-slate-600 py-6 border-t border-slate-900">
      Generated by <strong class="text-slate-400">Playwright Layout Inspector</strong> • Automated UX & Layout Quality Assurance
    </footer>
  </div>
</body>
</html>`;
}

function renderCategoryCard(cat: any, icon: string): string {
  const gradeClass = cat.grade.startsWith('A') ? 'text-emerald-400' : cat.grade.startsWith('B') ? 'text-amber-400' : 'text-rose-400';
  const progressPct = Math.round((cat.score / cat.maxScore) * 100);

  return `
    <div class="p-5 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col justify-between space-y-3 shadow-lg">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <span>${icon}</span>
          <h3 class="text-xs font-semibold text-slate-200 uppercase tracking-wider">${escapeHtml(cat.name)}</h3>
        </div>
        <span class="text-sm font-extrabold ${gradeClass}">${cat.score} / ${cat.maxScore}</span>
      </div>
      <div class="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
        <div class="h-full bg-indigo-500 rounded-full" style="width: ${progressPct}%"></div>
      </div>
      <p class="text-xs text-slate-400 leading-relaxed">${escapeHtml(cat.summary)}</p>
    </div>
  `;
}

function escapeHtml(str: string): string {
  return (str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
