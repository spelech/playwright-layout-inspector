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
  } else if (scenario === 'bad-viewport') {
    // Modify meta viewport dynamically
    const meta = document.getElementById('meta-viewport');
    if (meta) meta.setAttribute('content', 'width=device-width, user-scalable=no, maximum-scale=1.0');

    content = `
      <div id="test-container" style="padding: 16px;">
        <h1 style="font-size: 20px; font-weight: bold; margin-bottom: 12px;">Scenario: Locked Viewport Pinch-to-Zoom</h1>
        <p style="color: #94a3b8; font-size: 14px;">Viewport meta tag has user-scalable=no and maximum-scale=1.0.</p>
      </div>
    `;
  } else {
    // Clean responsive layout
    content = `
      <div id="test-container" style="padding: 16px; max-width: 100%; box-sizing: border-box;">
        <header style="height: 56px; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #1e293b; padding-bottom: 12px; margin-bottom: 16px;">
          <h1 style="font-size: 18px; font-weight: bold; color: #818cf8;">Compliant Responsive Layout</h1>
          <button id="action-btn" style="min-width: 48px; min-height: 48px; background: #4f46e5; color: white; border: none; border-radius: 8px; font-size: 14px; font-weight: 600; padding: 0 16px;">Action</button>
        </header>
        
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
    <div id="scenario-nav" style="position: fixed; bottom: 0; left: 0; right: 0; background: #0f172a; border-top: 1px solid #1e293b; height: 50px; display: flex; align-items: center; justify-content: space-around; z-index: 100;">
      <a href="?scenario=clean" style="color: ${scenario === 'clean' ? '#818cf8' : '#94a3b8'}; font-size: 12px; text-decoration: none; min-width: 48px; min-height: 44px; display: flex; align-items: center; justify-content: center;">Clean</a>
      <a href="?scenario=overflow" style="color: ${scenario === 'overflow' ? '#818cf8' : '#94a3b8'}; font-size: 12px; text-decoration: none; min-width: 48px; min-height: 44px; display: flex; align-items: center; justify-content: center;">Overflow</a>
      <a href="?scenario=shifting" style="color: ${scenario === 'shifting' ? '#818cf8' : '#94a3b8'}; font-size: 12px; text-decoration: none; min-width: 48px; min-height: 44px; display: flex; align-items: center; justify-content: center;">Shifting</a>
      <a href="?scenario=tiny-touch" style="color: ${scenario === 'tiny-touch' ? '#818cf8' : '#94a3b8'}; font-size: 12px; text-decoration: none; min-width: 48px; min-height: 44px; display: flex; align-items: center; justify-content: center;">Touch</a>
      <a href="?scenario=bad-viewport" style="color: ${scenario === 'bad-viewport' ? '#818cf8' : '#94a3b8'}; font-size: 12px; text-decoration: none; min-width: 48px; min-height: 44px; display: flex; align-items: center; justify-content: center;">Viewport</a>
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
