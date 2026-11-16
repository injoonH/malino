// Operator-only feasibility UI. No account identifiers, credentials, or note contents
// are embedded in this HTML or in its downloadable measurement report.
export function feasibilityPage(nonce: string): string {
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow"><title>malino · Sign-in check</title>
<style nonce="${nonce}">
body{font:16px/1.6 system-ui,sans-serif;background:#fdfcf9;color:#302e2b;max-width:700px;margin:60px auto;padding:0 24px}h1{letter-spacing:-1px}button{font:inherit;padding:10px 18px;border:1px solid #d8cfc0;border-radius:8px;cursor:pointer;background:#fff}button.primary{background:#a94b38;color:white;border:0}button:disabled{opacity:.5;cursor:wait}.actions{display:flex;gap:12px;flex-wrap:wrap}pre{white-space:pre-wrap;background:#f3f1ec;padding:20px;border-radius:8px;font-size:13px}small{color:#74695e}#status{padding:16px 0}a{color:#a94b38}
</style></head><body>
<small>MY LITTLE NOTE · FEASIBILITY CHECK</small><h1>Sign in to malino</h1>
<p>This page checks Google sign-in and saves synthetic test content. Your notes are not used.</p>
<p lang="ko">Google 로그인과 테스트 데이터 저장을 확인합니다. 실제 노트는 사용하지 않습니다.</p>
<p id="status" role="status">Checking your session…</p>
<div class="actions"><button id="signin" class="primary" hidden>Continue with Google</button><button id="run" hidden>Run a small performance check</button><button id="signout" hidden>Sign out</button><button id="download" hidden>Download results</button></div>
<pre id="results" hidden></pre>
<p><small>The check makes at most 25 application requests. Reported times are browser round trips, not Worker CPU measurements.</small></p>
<script nonce="${nonce}">
const el = id => document.getElementById(id);
let report;
async function jsonPost(path, body) {
  const response = await fetch(path, {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
  if (!response.ok) throw new Error('Request failed (' + response.status + '). Your session may have expired or the service may have reached a limit.');
  return response;
}
async function session() {
  const response = await fetch('/api/spike/session');
  if (response.status !== 200 && response.status !== 401) throw new Error('The sign-in service is unavailable. Check configuration and try again.');
  const signedIn = response.ok;
  el('status').textContent = signedIn ? 'Google sign-in succeeded. You can now run the check.' : 'Sign in with your invited Google account.';
  el('signin').hidden = signedIn; el('run').hidden = !signedIn; el('signout').hidden = !signedIn;
}
el('signin').onclick = async () => {
  el('signin').disabled = true;
  try {
    const response = await jsonPost('/api/auth/sign-in/social', {provider:'google', callbackURL:location.origin + '/', errorCallbackURL:location.origin + '/'});
    const result = await response.json();
    const target = new URL(result.url);
    if (target.origin !== 'https://accounts.google.com') throw new Error('Unexpected sign-in destination.');
    location.assign(target.href);
  } catch(error) { el('status').textContent = error.message; el('signin').disabled = false; }
};
el('signout').onclick = async () => {
  try { await jsonPost('/api/auth/sign-out', {}); await session(); }
  catch(error) { el('status').textContent = error.message; }
};
el('run').onclick = async () => {
  el('run').disabled = true;
  el('status').textContent = 'Running the check…';
  const doc = text => ({type:'doc',content:[{type:'paragraph',content:[{type:'text',text}]}]});
  const cases = [ ['normal', doc('A little note. 오늘의 기록. '.repeat(100))], ['near-limit', doc('a'.repeat(255 * 1024))] ];
  report = {testedAt:new Date().toISOString(),origin:location.origin,userAgent:navigator.userAgent,scope:'Synthetic authenticated browser round trips; not Worker CPU or a complete security audit',cases:[]};
  try {
    for (const [name, document] of cases) {
      const id = crypto.randomUUID(); let version = 0; const saves = []; const renders = []; const writes = [];
      for (let i=0;i<5;i++) {
        let start = performance.now();
        const response = await jsonPost('/api/spike/save', {id,version,mutationId:crypto.randomUUID(),document});
        const result = await response.json();
        saves.push(performance.now()-start); version=result.version;
        writes.push({rowsRead:result.rowsRead,rowsWritten:result.rowsWritten});
        start=performance.now();
        await (await jsonPost('/api/spike/render',document)).text();
        renders.push(performance.now()-start);
      }
      const p95 = values => [...values].sort((a,b)=>a-b)[Math.ceil(values.length*.95)-1];
      report.cases.push({name,documentBytes:new TextEncoder().encode(JSON.stringify(document)).length,saveP95Ms:p95(saves),renderP95Ms:p95(renders),saveSamplesMs:saves,renderSamplesMs:renders,noteSqlOnly:writes});
    }
    el('status').textContent = 'Sign-in, saves, and rendering succeeded. Download the results and tell me this check passed.';
    el('download').hidden=false;
  } catch(error) { report.error=error.message; el('status').textContent=error.message; el('download').hidden=false; }
  el('results').hidden=false; el('results').textContent=JSON.stringify(report,null,2); el('run').disabled=false;
};
el('download').onclick = () => {
  const url=URL.createObjectURL(new Blob([JSON.stringify(report,null,2)],{type:'application/json'}));
  const a=document.createElement('a');a.href=url;a.download='malino-feasibility-results.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
};
// Clear OAuth error query strings after noting that a login attempt failed.
const loginFailed = new URLSearchParams(location.search).has('error');
if(location.search) history.replaceState(null,'',location.pathname);
session().then(()=>{if(loginFailed)el('status').textContent='Google sign-in did not complete. Check that this account is invited and the callback URL is configured.';}).catch(error=>{el('status').textContent=error.message;});
</script></body></html>`;
}
