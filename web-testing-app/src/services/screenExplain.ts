export type UIElementInfo = { tag: string; text: string; role?: string; clickable?: boolean; selector?: string };
export type ScreenExplanation = { summary: string; elements: UIElementInfo[]; actions: string[] };

async function evalJSON(expr: string) {
  const res = await window.cdp.evaluate(expr);
  if (!res.success) throw new Error(res.error || 'evaluate failed');
  return res.result;
}

export async function explainScreen(): Promise<ScreenExplanation> {
  const expr = "(() => {" +
    "const list = [];" +
    "const nodes = Array.from(document.querySelectorAll('*'));" +
    "for (const el of nodes) {" +
      "const tag = el.tagName.toLowerCase();" +
      "const text = (el.innerText || '').trim().slice(0, 80);" +
      "const role = el.getAttribute('role') || undefined;" +
      "const clickable = el instanceof HTMLElement && (el.onclick || el.tabIndex >= 0 || ['a','button'].includes(tag));" +
      "if (clickable || ['a','button','input','select','textarea','form','nav'].includes(tag)) {" +
        "var selector = '';" +
        "if (el.id) selector = '#' + el.id;" +
        "else if (el.className && typeof el.className === 'string') selector = tag + '.' + Array.from(el.classList).join('.');" +
        "else selector = tag;" +
        "list.push({ tag, text, role, clickable, selector });" +
      "}" +
    "}" +
    "return list.slice(0, 200);" +
  "})()";
  const elements: UIElementInfo[] = await evalJSON(expr);

  const actions: string[] = [];
  for (const el of elements) {
    if (el.clickable) actions.push(`Click ${el.selector}`);
    if (['input','textarea','select'].includes(el.tag)) actions.push(`Type into ${el.selector}`);
    if (el.tag === 'form') actions.push(`Submit ${el.selector}`);
  }

  const summary = `Elements: ${elements.length}. Clickables: ${elements.filter(e=>e.clickable).length}. Forms: ${elements.filter(e=>e.tag==='form').length}. Inputs: ${elements.filter(e=>['input','textarea','select'].includes(e.tag)).length}.`;
  return { summary, elements, actions };
}

export async function injectHighlights(): Promise<{ success: boolean; count: number }> {
  const res = await window.cdp.evaluate(`(function(){
    const style = document.createElement('style');
    style.innerHTML = '[data-testmaster-highlight]{outline:2px solid #22c55e; outline-offset:2px; position:relative}';
    document.head.appendChild(style);
    const targets = Array.from(document.querySelectorAll('a, button, input, select, textarea'));
    for(const el of targets){ el.setAttribute('data-testmaster-highlight','1'); }
    return {count:targets.length};
  })()`);
  if (!res.success) return { success: false, count: 0 };
  return { success: true, count: (res.result && res.result.count) ? res.result.count : 0 };
}

