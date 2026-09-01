const app = document.getElementById('app')!;
const urlParams = new URLSearchParams(window.location.search);
const initialScenario = urlParams.get('scenario') || 'clean';

function renderApp(scenario: string) {
  let content = '';

  if (scenario === 'overflow') {
    content = `
      <div id="test-container" style="padding: 16px;">
        <h1 style="font-size: 20px; font-weight: bold; margin-bottom: 12px;">Scenario: Viewport Overflow / Canvas Bleed</h1>
        <p style="color: #94a3b8; font-size: 14px; margin-bottom: 16px;">Simulates an oversized label canvas bleeding past mobile screen (e.g. 600px width on a 412px Galaxy S25+ viewport, or 2000px on desktop).</p>
        
        <!-- Bleeding Element -->
        <div id="oversized-canvas" style="width: 2000px; height: 350px; background: #1e1b4b; border: 2px solid #6366f1; border-radius: 8px; padding: 20px; box-shadow: 0 10px 25px rgba(0,0,0,0.5);">
          <div style="font-size: 16px; font-weight: bold; color: #c7d2fe;">Nelko Thermal Label (2000px Bleeding Canvas)</div>
          <div style="font-size: 12px; color: #a5b4fc; margin-top: 8px;">Barcode: 123456789</div>
        </div>
      </div>
    `;
  } else if (scenario === 'shifting') {
    content = `
      <div id="test-container" style="padding: 16px; display: flex; flex-direction: column; min-height: 100vh;">
        <header id="header" style="height: 50px; background: #0f172a; border-bottom: 1px solid #1e293b; display: flex; align-items: center; justify-content: space-between; padding: 0 16px;">
          <span style="font-weight: bold;">Label Studio</span>
          <button id="toggle-drawer-btn" style="background: #4f46e5; color: white; border: none; padding: 8px 16px; border-radius: 6px; font-size: 14px; min-height: 44px;">Toggle Drawer</button>
        </header>

        <!-- Dynamic Drawer with variable height -->
        <div id="dynamic-drawer" style="display: none; background: #1e293b; border-bottom: 2px solid #3b82f6; padding: 20px; height: 180px;">
          <h3 style="font-size: 16px; color: #93c5fd;">Expanded Inspector Drawer (Height: 180px)</h3>
          <p style="font-size: 12px; color: #cbd5e1; margin-top: 8px;">Opening this drawer abruptly pushes down the canvas workspace below.</p>
        </div>

        <!-- Canvas Workspace that gets displaced -->
        <main id="canvas-workspace" style="flex: 1; display: flex; align-items: center; justify-content: center; padding: 20px; background: #020617;">
          <div id="canvas-card" style="width: 320px; height: 200px; background: #ffffff; color: #0f172a; border-radius: 8px; padding: 16px; box-shadow: 0 4px 12px rgba(0,0,0,0.3); text-align: center;">
            <strong style="display: block; margin-top: 40px; font-size: 18px;">Centered Label Canvas</strong>
            <span style="font-size: 12px; color: #64748b;">(Displaces jarringly when drawer toggles)</span>
          </div>
        </main>
      </div>
    `;
  } else if (scenario === 'tiny-touch') {
    content = `
      <div id="test-container" style="padding: 16px;">
        <h1 style="font-size: 20px; font-weight: bold; margin-bottom: 12px;">Scenario: Undersized Touch Targets</h1>
        <p style="color: #94a3b8; font-size: 14px; margin-bottom: 16px;">Simulates interactive buttons smaller than WCAG 2.2 AA standard (24x24px).</p>

        <div style="display: flex; gap: 2px; align-items: center;">
          <button id="tiny-close-btn" style="width: 14px; height: 14px; background: #ef4444; color: white; border: none; border-radius: 2px; font-size: 9px; line-height: 14px; text-align: center; padding: 0;">×</button>
          <button id="tiny-edit-btn" style="width: 16px; height: 16px; background: #3b82f6; color: white; border: none; border-radius: 2px; font-size: 9px; line-height: 16px; text-align: center; padding: 0;">✎</button>
        </div>
      </div>
    `;
  } else if (scenario === 'occlusion') {
    content = `
      <div id="test-container" style="padding: 16px; position: relative;">
        <h1 style="font-size: 20px; font-weight: bold; margin-bottom: 12px;">Scenario: Occluded / Tap-Jacked Action</h1>
        <p style="color: #94a3b8; font-size: 14px; margin-bottom: 16px;">Simulates a button covered by a floating overlay.</p>

        <div style="position: relative; height: 200px;">
          <!-- Underlying Button -->
          <button id="covered-submit-btn" style="position: absolute; top: 20px; left: 20px; width: 120px; height: 44px; background: #22c55e; color: white; border: none; border-radius: 6px; z-index: 1;">
            Submit Order
          </button>

          <!-- Floating Overlay covering the button -->
          <div id="floating-banner-overlay" style="position: absolute; top: 0; left: 0; width: 200px; height: 100px; background: rgba(15, 23, 42, 0.85); color: #f87171; padding: 12px; border-radius: 8px; z-index: 10;">
            Floating Banner Overlay
          </div>
        </div>
      </div>
    `;
  } else if (scenario === 'collision') {
    content = `
      <div id="test-container" style="padding: 16px;">
        <h1 style="font-size: 20px; font-weight: bold; margin-bottom: 12px;">Scenario: Overlapping Text Labels</h1>
        <p style="color: #94a3b8; font-size: 14px; margin-bottom: 16px;">Simulates broken positioning where two text badges collide.</p>

        <div style="position: relative; height: 100px;">
          <span id="badge-alpha" style="position: absolute; left: 10px; top: 10px; width: 120px; height: 30px; background: #3b82f6; color: white; padding: 4px 8px; border-radius: 4px;">Primary Badge</span>
          <span id="badge-beta" style="position: absolute; left: 40px; top: 10px; width: 120px; height: 30px; background: #ef4444; color: white; padding: 4px 8px; border-radius: 4px;">Discount Badge</span>
        </div>
      </div>
    `;
  } else if (scenario === 'scrolltrap') {
    content = `
      <div id="test-container" style="padding: 16px;">
        <h1 style="font-size: 20px; font-weight: bold; margin-bottom: 12px;">Scenario: Nested Scroll Trap</h1>
        <p style="color: #94a3b8; font-size: 14px; margin-bottom: 16px;">Simulates a massive nested scroll container taking up 80% of screen height.</p>

        <div id="trapping-feed" style="height: 600px; overflow-y: scroll; background: #0f172a; border: 1px solid #334155; padding: 16px; border-radius: 8px;">
          <div style="height: 2000px; padding: 20px; color: #94a3b8;">
            <p>Scrollable Content item 1</p>
            <p style="margin-top: 400px;">Scrollable Content item 2</p>
            <p style="margin-top: 800px;">Scrollable Content item 3</p>
          </div>
        </div>
      </div>
    `;
  } else if (scenario === 'missingaction') {
    content = `
      <div id="test-container" style="padding: 16px;">
        <h1 style="font-size: 20px; font-weight: bold; margin-bottom: 12px;">Scenario: Missing Labels & Focus Rings</h1>
        <p style="color: #94a3b8; font-size: 14px; margin-bottom: 16px;">Simulates icon-only buttons without aria-label and inputs with outline: none.</p>

        <div style="display: flex; gap: 12px; align-items: center;">
          <!-- Icon button missing aria-label or title -->
          <button id="unlabeled-icon-btn" style="width: 44px; height: 44px; background: #334155; border: none; border-radius: 8px; display: flex; items-center; justify-content: center;">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </button>

          <!-- Input with outline: none and no visible focus ring -->
          <input id="no-focus-input" type="text" placeholder="Enter text..." style="outline: none; border: 1px solid #334155; background: #0f172a; color: white; padding: 8px 12px; border-radius: 6px; box-shadow: none;" />
        </div>
      </div>
    `;
  } else if (scenario === 'container-overflow') {
    content = `
      <div id="test-container" style="padding: 32px; display: flex; justify-content: center; align-items: center; min-height: 80vh;">
        <!-- Modal Card Container: 550px width -->
        <div id="auth-modal" class="modal-card" style="position: relative; width: 550px; background: #0f172a; border: 2px solid #334155; border-radius: 12px; padding: 24px; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);">
          <!-- Exempt Corner Close Button -->
          <button id="modal-close-btn" class="btn-close" aria-label="Close" style="position: absolute; top: -10px; right: -10px; width: 28px; height: 28px; background: #ef4444; color: white; border: none; border-radius: 50%; cursor: pointer;">✕</button>

          <!-- Exempt Floating Tooltip -->
          <div id="auth-tooltip" role="tooltip" class="tooltip" style="position: absolute; top: -35px; left: 24px; background: #1e293b; color: #cbd5e1; padding: 4px 8px; border-radius: 4px; font-size: 11px;">
            Security Check
          </div>

          <h2 style="font-size: 20px; font-weight: bold; color: white; margin-bottom: 16px;">Two-Factor Authentication</h2>
          <p style="font-size: 14px; color: #94a3b8; margin-bottom: 20px;">Enter verification codes across 3 auth services.</p>

          <!-- Overflowing 3-column auth inputs row: total width 632px inside 550px modal (inner content ~502px) -->
          <div id="auth-input-row" class="auth-row" style="display: flex; gap: 16px; width: 632px; margin-bottom: 20px;">
            <input id="auth-code-1" type="text" placeholder="SMS Code (200px)" style="width: 200px; height: 44px; background: #1e293b; border: 1px solid #475569; color: white; border-radius: 6px; padding: 0 12px; box-sizing: border-box;" />
            <input id="auth-code-2" type="text" placeholder="Email Code (200px)" style="width: 200px; height: 44px; background: #1e293b; border: 1px solid #475569; color: white; border-radius: 6px; padding: 0 12px; box-sizing: border-box;" />
            <input id="auth-code-3" type="text" placeholder="App Token (200px)" style="width: 200px; height: 44px; background: #1e293b; border: 1px solid #475569; color: white; border-radius: 6px; padding: 0 12px; box-sizing: border-box;" />
          </div>

          <button id="auth-submit-btn" style="width: 100%; height: 44px; background: #4f46e5; color: white; border: none; border-radius: 8px; font-weight: 600; cursor: pointer;">
            Verify Credentials
          </button>
        </div>
      </div>
    `;
  } else if (scenario === 'text-breaks') {
    content = `
      <div id="test-container" style="padding: 24px; max-width: 600px; margin: 0 auto;">
        <h1 style="font-size: 20px; font-weight: bold; margin-bottom: 16px;">Scenario: Text Flow & Wrap Anomalies</h1>

        <!-- 1. Mid-word break anomaly -->
        <div style="background: #0f172a; padding: 16px; border-radius: 8px; border: 1px solid #334155; margin-bottom: 16px;">
          <h3 style="font-size: 14px; color: #93c5fd; margin-bottom: 8px;">1. Mid-Word Break (word-break: break-all)</h3>
          <p id="midword-break-text" style="width: 120px; word-break: break-all; font-size: 14px; color: #e2e8f0; line-height: 1.4;">
            Authentication credentials required
          </p>
        </div>

        <!-- 2. Awkward Button Wrap -->
        <div style="background: #0f172a; padding: 16px; border-radius: 8px; border: 1px solid #334155; margin-bottom: 16px;">
          <h3 style="font-size: 14px; color: #93c5fd; margin-bottom: 8px;">2. Button Orphan / Multi-line Wrap</h3>
          <button id="orphan-button" class="btn" style="width: 65px; height: 50px; background: #2563eb; color: white; border: none; border-radius: 6px; font-size: 13px; padding: 4px;">
            Submit Order
          </button>
        </div>

        <!-- 3. Heading Orphan Wrap -->
        <div style="background: #0f172a; padding: 16px; border-radius: 8px; border: 1px solid #334155; margin-bottom: 16px;">
          <h3 style="font-size: 14px; color: #93c5fd; margin-bottom: 8px;">3. Heading Orphan Wrap</h3>
          <h2 id="orphan-heading" style="width: 100px; font-size: 16px; font-weight: bold; color: white; line-height: 1.3;">
            Submit order now
          </h2>
        </div>

        <!-- 4. Crushed Flex Column -->
        <div style="background: #0f172a; padding: 16px; border-radius: 8px; border: 1px solid #334155; margin-bottom: 16px;">
          <h3 style="font-size: 14px; color: #93c5fd; margin-bottom: 8px;">4. Crushed Flex Column</h3>
          <div id="flex-row-container" style="display: flex; gap: 8px; width: 300px; border: 1px dashed #64748b; padding: 8px;">
            <div style="width: 250px; background: #334155; color: white; padding: 6px; font-size: 12px;">Wide Column (250px)</div>
            <div id="crushed-col" style="width: 40px; overflow: hidden; white-space: nowrap; background: #ef4444; color: white; padding: 6px; font-size: 12px;">OverflownTextString</div>
          </div>
        </div>
      </div>
    `;
  } else if (scenario === 'bad-viewport') {
    const meta = document.getElementById('meta-viewport');
    if (meta) meta.setAttribute('content', 'width=device-width, user-scalable=no, maximum-scale=1.0');

    content = `
      <div id="test-container" style="padding: 16px;">
        <h1 style="font-size: 20px; font-weight: bold; margin-bottom: 12px;">Scenario: Locked Viewport Pinch-to-Zoom</h1>
        <p style="color: #94a3b8; font-size: 14px;">Viewport meta tag has user-scalable=no and maximum-scale=1.0.</p>
      </div>
    `;
  } else {
    // Clean responsive layout — fully WCAG-compliant for E2E scoring tests
    content = `
      <style>
        #action-btn:focus-visible,
        #undo-btn:focus-visible,
        #redo-btn:focus-visible { outline: 3px solid #818cf8; outline-offset: 2px; }
      </style>
      <div id="test-container" style="padding: 16px; max-width: 100%; box-sizing: border-box;">
        <header style="height: 56px; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #1e293b; padding-bottom: 12px; margin-bottom: 16px;">
          <h1 style="font-size: 16px; font-weight: bold; color: #818cf8; white-space: nowrap;">Compliant Layout</h1>
          <div style="display: flex; gap: 8px; align-items: center;">
            <button id="undo-btn" aria-label="Undo" title="Undo last action" style="min-width: 44px; min-height: 44px; background: #334155; color: white; border: none; border-radius: 8px; font-size: 14px; padding: 0 12px; cursor: pointer;">↩</button>
            <button id="redo-btn" aria-label="Redo" title="Redo last action" style="min-width: 44px; min-height: 44px; background: #334155; color: white; border: none; border-radius: 8px; font-size: 14px; padding: 0 12px; cursor: pointer;">↪</button>
            <button id="action-btn" aria-label="Action" style="min-width: 48px; min-height: 48px; background: #4f46e5; color: white; border: none; border-radius: 8px; font-size: 14px; font-weight: 600; padding: 0 16px; cursor: pointer;">Action</button>
          </div>
        </header>

        <p style="font-size: 14px; color: #94a3b8; margin-bottom: 12px; line-height: 1.5;">
          This layout demonstrates proper responsive design — no horizontal overflow, correct meta viewport, accessible interactive targets, and stable layout.
        </p>
        
        <main style="display: flex; justify-content: center; padding: 12px 0;">
          <div id="responsive-canvas" style="width: 100%; max-width: 380px; height: 240px; background: #ffffff; color: #0f172a; border-radius: 8px; padding: 16px; box-shadow: 0 4px 12px rgba(0,0,0,0.2); box-sizing: border-box;">
            <div style="font-size: 16px; font-weight: bold;">Auto-Fitted Label Canvas</div>
            <div style="font-size: 14px; color: #475569; margin-top: 8px;">Responsive width (max-w-[380px], w-full).</div>
          </div>
        </main>
      </div>
    `;
  }

  // Navigation switcher
  const nav = `
    <div id="scenario-nav" style="position: fixed; bottom: 0; left: 0; right: 0; background: #0f172a; border-top: 1px solid #1e293b; height: 50px; display: flex; align-items: center; justify-content: space-around; z-index: 100; overflow-x: auto;">
      <a href="?scenario=clean" style="color: ${scenario === 'clean' ? '#818cf8' : '#94a3b8'}; font-size: 11px; text-decoration: none; min-width: 40px; min-height: 44px; display: flex; align-items: center; justify-content: center;">Clean</a>
      <a href="?scenario=container-overflow" style="color: ${scenario === 'container-overflow' ? '#818cf8' : '#94a3b8'}; font-size: 11px; text-decoration: none; min-width: 40px; min-height: 44px; display: flex; align-items: center; justify-content: center;">Modal Bleed</a>
      <a href="?scenario=text-breaks" style="color: ${scenario === 'text-breaks' ? '#818cf8' : '#94a3b8'}; font-size: 11px; text-decoration: none; min-width: 40px; min-height: 44px; display: flex; align-items: center; justify-content: center;">Text Breaks</a>
      <a href="?scenario=overflow" style="color: ${scenario === 'overflow' ? '#818cf8' : '#94a3b8'}; font-size: 11px; text-decoration: none; min-width: 40px; min-height: 44px; display: flex; align-items: center; justify-content: center;">Overflow</a>
      <a href="?scenario=shifting" style="color: ${scenario === 'shifting' ? '#818cf8' : '#94a3b8'}; font-size: 11px; text-decoration: none; min-width: 40px; min-height: 44px; display: flex; align-items: center; justify-content: center;">Shifting</a>
      <a href="?scenario=tiny-touch" style="color: ${scenario === 'tiny-touch' ? '#818cf8' : '#94a3b8'}; font-size: 11px; text-decoration: none; min-width: 40px; min-height: 44px; display: flex; align-items: center; justify-content: center;">Touch</a>
      <a href="?scenario=occlusion" style="color: ${scenario === 'occlusion' ? '#818cf8' : '#94a3b8'}; font-size: 11px; text-decoration: none; min-width: 40px; min-height: 44px; display: flex; align-items: center; justify-content: center;">Occlude</a>
      <a href="?scenario=collision" style="color: ${scenario === 'collision' ? '#818cf8' : '#94a3b8'}; font-size: 11px; text-decoration: none; min-width: 40px; min-height: 44px; display: flex; align-items: center; justify-content: center;">Collide</a>
      <a href="?scenario=scrolltrap" style="color: ${scenario === 'scrolltrap' ? '#818cf8' : '#94a3b8'}; font-size: 11px; text-decoration: none; min-width: 40px; min-height: 44px; display: flex; align-items: center; justify-content: center;">Scroll</a>
      <a href="?scenario=missingaction" style="color: ${scenario === 'missingaction' ? '#818cf8' : '#94a3b8'}; font-size: 11px; text-decoration: none; min-width: 40px; min-height: 44px; display: flex; align-items: center; justify-content: center;">A11y</a>
    </div>
  `;

  app.innerHTML = content + nav;

  // Drawer event listener if on shifting scenario
  const toggleBtn = document.getElementById('toggle-drawer-btn');
  const drawer = document.getElementById('dynamic-drawer');
  if (toggleBtn && drawer) {
    toggleBtn.onclick = () => {
      drawer.style.display = drawer.style.display === 'none' ? 'block' : 'none';
    };
  }
}

renderApp(initialScenario);
