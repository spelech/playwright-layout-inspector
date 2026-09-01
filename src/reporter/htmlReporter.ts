import { LayoutAuditResult } from '../types';

export function generateHtmlReport(result: LayoutAuditResult): string {
  const {
    url,
    timestamp,
    device,
    viewport,
    uxScore,
    overflowIssues = [],
    containerOverflowIssues = [],
    textFlowIssues = [],
    touchTargetIssues = [],
    viewportFit,
    readabilityIssues = [],
    occlusionIssues = [],
    collisionIssues = [],
    scrollTrapIssues = [],
    accessibleNameIssues = [],
    focusIndicatorIssues = [],
    thumbZoneAnalysis,
    layoutShiftResult,
    screenshotBase64,
    executionTimeMs
  } = result;

  const totalIssues =
    overflowIssues.length +
    containerOverflowIssues.length +
    textFlowIssues.length +
    touchTargetIssues.length +
    readabilityIssues.length +
    occlusionIssues.length +
    collisionIssues.length +
    scrollTrapIssues.length +
    accessibleNameIssues.length +
    focusIndicatorIssues.length +
    (viewportFit ? viewportFit.issues.length : 0);

  const scoreColor = uxScore.totalScore >= 85 ? '#10b981' : uxScore.totalScore >= 70 ? '#f59e0b' : '#ef4444';
  const gradeBadgeClass = uxScore.grade.startsWith('A')
    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
    : uxScore.grade.startsWith('B')
    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
    : 'bg-rose-500/20 text-rose-300 border-rose-500/40';

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
      <div class="md:col-span-3 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        ${renderCategoryCard(uxScore.categories.overflowAndFit, '🌊')}
        ${renderCategoryCard(uxScore.categories.stability, '⚖️')}
        ${renderCategoryCard(uxScore.categories.touchErgonomics, '👆')}
        ${renderCategoryCard(uxScore.categories.readabilityAndVisibility, '👁️')}
        ${renderCategoryCard(uxScore.categories.accessibilityAndFocus, '♿')}
      </div>
    </div>

    <!-- Thumb Zone Ergonomics Advisory (if mobile) -->
    ${thumbZoneAnalysis ? `
    <section class="p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-4">
      <div class="flex items-center justify-between">
        <h2 class="text-lg font-bold text-white flex items-center gap-2">
          <span>👍</span> Mobile Thumb-Zone Ergonomics
        </h2>
        <span class="text-xs font-mono font-bold px-2 py-1 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
          Ergonomics Score: ${thumbZoneAnalysis.ergonomicsScore}/100
        </span>
      </div>
      <p class="text-xs text-slate-400">${escapeHtml(thumbZoneAnalysis.summary)}</p>
      <div class="grid grid-cols-3 gap-4 text-center text-xs">
        <div class="bg-emerald-950/40 p-3 rounded-xl border border-emerald-500/30">
          <div class="text-emerald-400 font-bold text-lg">${thumbZoneAnalysis.naturalZoneCount}</div>
          <div class="text-slate-400">Natural Zone (Easy)</div>
        </div>
        <div class="bg-amber-950/40 p-3 rounded-xl border border-amber-500/30">
          <div class="text-amber-400 font-bold text-lg">${thumbZoneAnalysis.reachZoneCount}</div>
          <div class="text-slate-400">Reach Zone (Moderate)</div>
        </div>
        <div class="bg-rose-950/40 p-3 rounded-xl border border-rose-500/30">
          <div class="text-rose-400 font-bold text-lg">${thumbZoneAnalysis.hardZoneCount}</div>
          <div class="text-slate-400">Hard Zone (Stretch)</div>
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
          <p class="text-xs text-slate-400">Actionable layout, container overflow, text wrap, collision, and accessibility fixes</p>
        </div>
      </div>

      ${totalIssues === 0 ? `
        <div class="py-12 text-center text-slate-400 space-y-2">
          <div class="text-4xl">🎉</div>
          <p class="text-base font-semibold text-slate-200">No layout or UX issues detected!</p>
          <p class="text-xs">Your layout complies with responsive viewport fit, container containment, text flow, touch target standards, accessibility, and stability rules.</p>
        </div>
      ` : `
        <div class="space-y-4">
          <!-- Viewport Fit Issues -->
          ${viewportFit ? viewportFit.issues.map(iss => `
            <div class="p-4 bg-rose-950/30 border border-rose-500/30 rounded-xl space-y-2">
              <div class="flex items-center gap-2 text-rose-400 font-semibold text-sm">
                <span>🚨 Viewport Constraint Issue</span>
              </div>
              <p class="text-sm text-slate-200">${escapeHtml(iss)}</p>
            </div>
          `).join('') : ''}

          <!-- Viewport Overflow Issues -->
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
              </div>
              <p class="text-xs text-slate-300">${escapeHtml(issue.culpritDescription)}</p>
              <div class="text-xs text-emerald-300 bg-emerald-950/30 p-2.5 rounded-lg border border-emerald-500/20 font-mono">
                💡 <span class="font-bold text-emerald-400">Fix:</span> ${escapeHtml(issue.suggestedFix)}
              </div>
            </div>
          `).join('')}

          <!-- Container Overflow Issues -->
          ${containerOverflowIssues.map(cIssue => `
            <div class="p-4 bg-slate-950/80 border border-orange-500/30 rounded-xl space-y-3">
              <div class="flex items-start justify-between gap-4">
                <div class="space-y-1">
                  <div class="flex items-center gap-2">
                    <span class="px-2 py-0.5 text-[10px] font-bold rounded uppercase bg-orange-500/20 text-orange-400 border border-orange-500/30">
                      ${cIssue.severity}
                    </span>
                    <span class="text-sm font-semibold text-slate-100">Container Geometric Bleed (+${Math.round(cIssue.overflowRightPx || cIssue.overflowBottomPx || cIssue.overflowLeftPx)}px)</span>
                  </div>
                  <div class="flex flex-wrap items-center gap-2 text-xs font-mono">
                    <span class="text-rose-400 bg-rose-950/40 px-2 py-0.5 rounded border border-rose-500/20">
                      Child: ${escapeHtml(cIssue.selector)}
                    </span>
                    <span class="text-slate-500">inside</span>
                    <span class="text-indigo-400 bg-indigo-950/40 px-2 py-0.5 rounded border border-indigo-500/20">
                      Container: ${escapeHtml(cIssue.containerSelector)}
                    </span>
                  </div>
                </div>
              </div>
              <p class="text-xs text-slate-300">${escapeHtml(cIssue.culpritDescription)}</p>
              <div class="text-xs text-emerald-300 bg-emerald-950/30 p-2.5 rounded-lg border border-emerald-500/20 font-mono">
                💡 <span class="font-bold text-emerald-400">Fix:</span> ${escapeHtml(cIssue.suggestedFix)}
              </div>
            </div>
          `).join('')}

          <!-- Text Flow & Wrap Anomaly Issues -->
          ${textFlowIssues.map(tf => `
            <div class="p-4 bg-slate-950/80 border border-yellow-500/30 rounded-xl space-y-3">
              <div class="flex items-start justify-between gap-4">
                <div class="space-y-1">
                  <div class="flex items-center gap-2">
                    <span class="px-2 py-0.5 text-[10px] font-bold rounded uppercase bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
                      ${tf.anomalyType.replace(/-/g, ' ')}
                    </span>
                    <span class="text-sm font-semibold text-slate-100">Text Flow / Wrapping Anomaly</span>
                  </div>
                  <div class="text-xs font-mono text-indigo-400 bg-indigo-950/40 px-2 py-1 rounded border border-indigo-500/20 inline-block">
                    ${escapeHtml(tf.selector)}
                  </div>
                  ${tf.textSnippet ? `<span class="text-xs text-slate-400 italic font-mono ml-2">&ldquo;${escapeHtml(tf.textSnippet)}&rdquo;</span>` : ''}
                </div>
              </div>
              <p class="text-xs text-slate-300">${escapeHtml(tf.details)}</p>
              <div class="text-xs text-emerald-300 bg-emerald-950/30 p-2.5 rounded-lg border border-emerald-500/20 font-mono">
                💡 <span class="font-bold text-emerald-400">Fix:</span> ${escapeHtml(tf.suggestedFix)}
              </div>
            </div>
          `).join('')}

          <!-- Occlusion Issues -->
          ${occlusionIssues.map(occ => `
            <div class="p-4 bg-slate-950/80 border border-rose-500/30 rounded-xl space-y-2">
              <div class="flex items-center gap-2">
                <span class="px-2 py-0.5 text-[10px] font-bold rounded uppercase bg-rose-500/20 text-rose-400 border border-rose-500/30">
                  Tap-Jacking / Occlusion
                </span>
                <span class="text-sm font-semibold text-slate-100">Interactive Element Click-Blocked</span>
              </div>
              <p class="text-xs text-slate-300">${escapeHtml(occ.suggestion)}</p>
            </div>
          `).join('')}

          <!-- Collision Issues -->
          ${collisionIssues.map(col => `
            <div class="p-4 bg-slate-950/80 border border-amber-500/30 rounded-xl space-y-2">
              <div class="flex items-center gap-2">
                <span class="px-2 py-0.5 text-[10px] font-bold rounded uppercase bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  ${col.isTextCollision ? 'Text Collision' : 'Element Overlap'}
                </span>
                <span class="text-sm font-semibold text-slate-100">${Math.round(col.overlapAreaPx)}px² Overlapping Area</span>
              </div>
              <p class="text-xs text-slate-300">${escapeHtml(col.suggestion)}</p>
            </div>
          `).join('')}

          <!-- Scroll Trap Issues -->
          ${scrollTrapIssues.map(trap => `
            <div class="p-4 bg-slate-950/80 border border-purple-500/30 rounded-xl space-y-2">
              <div class="flex items-center gap-2">
                <span class="px-2 py-0.5 text-[10px] font-bold rounded uppercase bg-purple-500/20 text-purple-400 border border-purple-500/30">
                  Nested Scroll Trap
                </span>
                <span class="text-sm font-semibold text-slate-100">${Math.round(trap.viewportRatio * 100)}% Viewport Coverage</span>
              </div>
              <p class="text-xs text-slate-300">${escapeHtml(trap.suggestion)}</p>
            </div>
          `).join('')}

          <!-- Accessible Name Issues -->
          ${accessibleNameIssues.map(acc => `
            <div class="p-4 bg-slate-950/80 border border-indigo-500/30 rounded-xl space-y-2">
              <div class="flex items-center gap-2">
                <span class="px-2 py-0.5 text-[10px] font-bold rounded uppercase bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                  Missing Accessible Name
                </span>
                <span class="text-sm font-semibold text-slate-100"><${acc.tagName}> ${acc.isIconOnly ? '(Icon Only)' : ''}</span>
              </div>
              <p class="text-xs text-slate-300">${escapeHtml(acc.suggestion)}</p>
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
        </div>
      `}
    </section>

    <!-- Footer -->
    <footer class="text-center text-xs text-slate-600 py-6 border-t border-slate-900">
      Generated by <strong class="text-slate-400">Playwright Layout Inspector</strong> • Automated UX & Layout Quality Assurance
    </footer>
  </div>
</body>
</html>`;
}

function renderCategoryCard(cat: any, icon: string): string {
  if (!cat) return '';
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
