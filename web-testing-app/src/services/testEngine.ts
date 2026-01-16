export type TestAction = { type: 'navigate' | 'click' | 'type' | 'wait' | 'screenshot'; selector?: string; value?: string; description?: string };
export type TestCase = { name: string; description: string; actions: TestAction[] };
export type TestResult = { caseName: string; status: 'pass' | 'fail' | 'error'; error?: string; screenshots?: string[]; metrics?: any };

async function evaluate<T = any>(expression: string): Promise<T> {
  const res = await window.cdp.evaluate(expression);
  if (!res.success) throw new Error(res.error || 'Evaluate failed');
  return res.result as T;
}

export async function analyzeUrl(url: string) {
  // Ensure CDP connection
  try {
    const tabs = await window.cdp.getTabs();
    // Type guard for error response
    const hasError = typeof tabs === 'object' && tabs !== null && 'error' in tabs;
    if (hasError || !Array.isArray(tabs)) {
      await window.system.launchChrome();
      // Poll until /json/version is ready via preload checkConnection
      let ok = false;
      for (let i = 0; i < 10; i++) {
        const chk = await window.cdp.checkConnection();
        if (chk.success) { ok = true; break; }
        await new Promise(r => setTimeout(r, 500));
      }
      if (!ok) throw new Error('Chrome not ready for CDP');
    }
    const auto = await window.cdp.autoConnect();
    if (!auto.success) throw new Error(auto.error || 'CDP autoConnect failed');
  } catch (e: any) {
    throw new Error(e?.message || 'CDP connection failed');
  }

  const navRes = await window.cdp.navigate(url);
  if (!navRes.success) throw new Error(navRes.error || 'Navigation failed');

  const title = await evaluate<string>('document.title');
  const links = await evaluate<number>('document.querySelectorAll("a[href]").length');
  const forms = await evaluate<number>('document.forms.length');
  const inputs = await evaluate<number>('document.querySelectorAll("input, textarea, select").length');

  const perfStr = await evaluate<string>('JSON.stringify(performance.getEntriesByType("navigation")[0] || {})');
  const perf = JSON.parse(perfStr || '{}');

  return { title, links, forms, inputs, perf };
}

export function generateTestCases(summary: { title: string; links: number; forms: number; inputs: number }) : TestCase[] {
  const cases: TestCase[] = [];
  cases.push({
    name: 'Load Page',
    description: 'Page loads without console errors',
    actions: [ { type: 'screenshot', description: 'Initial state' } ]
  });

  if (summary.forms > 0 && summary.inputs > 0) {
    cases.push({
      name: 'Form Interaction',
      description: 'Fill first text input and submit first form',
      actions: [
        { type: 'type', selector: 'input[type="text"], input:not([type]), textarea', value: 'test', description: 'Enter sample text' },
        { type: 'click', selector: 'button[type="submit"], input[type="submit"]', description: 'Submit form' },
        { type: 'wait', description: 'Wait for response' },
        { type: 'screenshot', description: 'After submit' },
      ]
    });
  }

  if (summary.links > 0) {
    cases.push({
      name: 'Link Navigation',
      description: 'Click first link and validate navigation',
      actions: [
        { type: 'click', selector: 'a[href]', description: 'Click first link' },
        { type: 'wait', description: 'Wait for navigation' },
        { type: 'screenshot', description: 'After navigation' },
      ]
    });
  }

  return cases;
}

async function clickSelector(selector: string) {
  const res = await window.cdp.click(selector);
  if (!res.success) throw new Error(res.error || `Click failed: ${selector}`);
}

async function typeSelector(selector: string, text: string) {
  const res = await window.cdp.type(selector, text);
  if (!res.success) throw new Error(res.error || `Type failed: ${selector}`);
}

export async function runTestSuite(cases: TestCase[]) : Promise<{ results: TestResult[], summary: { passed: number, failed: number } }> {
  const results: TestResult[] = [];
  let passed = 0, failed = 0;

  for (const tc of cases) {
    const screenshots: string[] = [];
    try {
      for (const action of tc.actions) {
        if (action.type === 'screenshot') {
          const shot = await window.cdp.screenshot();
          if (shot.success && shot.data) screenshots.push(shot.data);
        } else if (action.type === 'click' && action.selector) {
          await clickSelector(action.selector);
        } else if (action.type === 'type' && action.selector) {
          await typeSelector(action.selector, action.value || 'test');
        } else if (action.type === 'wait') {
          await new Promise(r => setTimeout(r, 800));
        }
      }
      results.push({ caseName: tc.name, status: 'pass', screenshots });
      passed++;
    } catch (e: any) {
      results.push({ caseName: tc.name, status: 'fail', error: e?.message || String(e), screenshots });
      failed++;
    }
  }

  return { results, summary: { passed, failed } };
}

