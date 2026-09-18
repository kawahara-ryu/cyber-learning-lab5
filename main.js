const codes = [
`def fruits_price(apple, banana):
  total_apple = apple * 100
  total_banana = banana * 80
  total = total_apple + total_banana
  return total

apple_count = 10
banana_count = 5
price = fruits_price(apple_count, banana_count)
print('りんご ', apple_count, '個とバナナ', banana_count, '本で、合計', price, '円です。')`,

`def kaijou(n):
  if n == 0:
    return 1
  else:
    return n * kaijou(n-1)

ans = kaijou(3)
print('3! =', ans)`,

`def gcd(a, b):
  if b == 0:
    return a
  else:
    r = a % b
    return gcd(b, r)

ans = gcd(24, 9)
print('GCD =', ans)`,

`def fib(n):
  if n <= 1:
    return n
  return fib(n-1) + fib(n-2)

ans = fib(3)
print('fib(3) =', ans)`
];

let currentStep = 1;
let currentLoopState = null;
let autoInterval = null;
window.isFastForward = false;

// === Trace Table System ===
const traceTable = document.getElementById('trace-table');
const traceThead = document.getElementById('trace-thead');
const traceTbody = document.getElementById('trace-tbody');
const traceTableContainer = document.querySelector('.trace-table-container');

const stepTraceHeaders = [
  ["ステップ", "引数 / 変数", "計算処理", "値 / 出力"],
  ["スタック / 深さ", "引数 n", "判定 / 処理", "戻り値 (return)"],
  ["呼び出し", "引数 (a, b)", "計算 (r = a % b)", "判定 / 戻り値"],
  ["ノード (Call)", "引数 n", "条件 (n <= 1)", "戻り値"]
];

function setupTraceTableHeaders(headers) {
  if (!traceThead || !traceTbody) return;
  traceThead.innerHTML = '';
  traceTbody.innerHTML = '';
  const tr = document.createElement('tr');
  headers.forEach(h => {
    const th = document.createElement('th');
    th.innerHTML = h;
    tr.appendChild(th);
  });
  traceThead.appendChild(tr);
}

function addTraceRow(cells, statusClass = '') {
  playSound('particle');
  if (!traceTbody) return;
  const tr = document.createElement('tr');
  tr.className = 'new-row ' + statusClass;
  cells.forEach(cell => {
    const td = document.createElement('td');
    td.innerHTML = cell;
    tr.appendChild(td);
  });
  traceTbody.appendChild(tr);
  
  if (traceTableContainer) {
    traceTableContainer.scrollTop = traceTableContainer.scrollHeight;
  }
}

function clearTraceTable() {
  if (traceTbody) traceTbody.innerHTML = '';
}

function logTrace(msg, type="normal") {
  addTraceRow([msg], type === 'true' ? 'val-true' : (type === 'warn' ? 'val-ret' : ''));
}

// Theme Switcher
const themes = ['', 'theme-matrix', 'theme-hacker'];
let themeIdx = 0;
function toggleTheme() {
  if (themes[themeIdx]) document.body.classList.remove(themes[themeIdx]);
  themeIdx = (themeIdx + 1) % themes.length;
  if (themes[themeIdx]) document.body.classList.add(themes[themeIdx]);
}

// Sound & Shake
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playSound(type, depth = 0) {
  if (window.isFastForward) return;
  if (audioCtx.state === 'suspended') audioCtx.resume();
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  
  const now = audioCtx.currentTime;
  if(type === 'particle') {
    osc.type = 'sine';
    const baseFreq = 600 + (depth * 150);
    osc.frequency.setValueAtTime(baseFreq, now);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.5, now + 0.1);
    gain.gain.setValueAtTime(0.05, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
    osc.start(now); osc.stop(now + 0.1);
  } else if(type === 'shake') {
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(100, now);
    osc.frequency.exponentialRampToValueAtTime(40, now + 0.5);
    gain.gain.setValueAtTime(0.1, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
    osc.start(now); osc.stop(now + 0.5);
    
    gsap.fromTo(document.body, {x:-10}, {x:10, duration:0.05, yoyo:true, repeat:9, ease:"power1.inOut", onComplete:()=>gsap.set(document.body, {clearProps:"transform"})});
  } else if(type === 'pop') {
    osc.type = 'triangle';
    const baseFreq = 1200 - (depth * 150);
    osc.frequency.setValueAtTime(baseFreq, now);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.5, now + 0.2);
    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
    osc.start(now); osc.stop(now + 0.2);
  }
}

// UI Helpers

function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function highlightSyntax(code) {
  const strPlaceholders = [];
  let res = code.replace(/('(?:\\'|[^'])*'|"(?:\\"|[^"])*")/g, (m) => {
    strPlaceholders.push(m);
    return `___STR_${strPlaceholders.length - 1}___`;
  });

  res = res.replace(/\b(def|return|if|elif|else|and|or|not)\b/g, (match) => { return `<span class="hl-keyword keyword-help" data-word="${match}">${match}</span>`; });
  res = res.replace(/\b(True|False)\b/g, (match) => { return `<span class="hl-keyword keyword-help" style="color:var(--neon-green);" data-word="${match}">${match}</span>`; });
  res = res.replace(/\b(print|int|float|str|input)\b/g, (match) => { return `<span class="hl-func keyword-help" data-word="${match}">${match}</span>`; });
  res = res.replace(/\b(\d+(?:\.\d+)?)\b/g, '<span class="hl-number">$1</span>');

  res = res.replace(/___STR_(\d+)___/g, (m, idx) => {
    return `<span class="hl-string">${strPlaceholders[idx]}</span>`;
  });

  return res;
}

function initUI() {
  
  
  const titles = ["5-1. 関数の基本", "5-4. 自分自身を実行する再帰関数①（階乗）", "5-6. 再帰関数②（ユークリッド互除法）", "5-x. 樹状再帰（フィボナッチ・ツリー）"];
  document.getElementById('step-display').innerText = titles[currentStep-1];
    // Update step badge and file name
    const badge = document.getElementById('step-badge');
    if(badge) badge.innerText = `Step ${currentStep}/4`;
    const fileName = document.querySelector('.file-name');
    if(fileName) fileName.innerText = `📄 func_recursion.py (Step ${currentStep})`;

  
  const codeBox = document.getElementById('code-content');
  codeBox.innerHTML = codes[currentStep-1].split('\n').map((line, i) => 
    `<span class="code-line" id="line-${i}">${highlightSyntax(escapeHtml(line)) || ' '}</span>`
  ).join('');
  
  clearFactory();
  clearTraceTable();
  setupTraceTableHeaders(stepTraceHeaders[currentStep - 1]);
  updateMemoryHUD("Wait...");
  
  cancelAuto();
  currentLoopState = null;
}

function nextStep() { if(currentStep < 4) { currentStep++; initUI(); } }
function prevStep() { if(currentStep > 1) { currentStep--; initUI(); } }

function highlightLine(lineNum) {
  document.querySelectorAll('.code-line').forEach(el => el.classList.remove('active'));
  if (lineNum !== -1) {
    const el = document.getElementById(`line-${lineNum}`);
    if (el) el.classList.add('active');
  }
}

function updateMemoryHUD(htmlStr) {
  document.getElementById('mem-content').innerHTML = htmlStr;
}

function clearFactory() {
  document.getElementById('factory-floor').innerHTML = '<div id="gcd-visualizer"></div><div id="tree-visualizer" style="position: absolute; width: 100%; height: 100%; top: 0; left: 0; pointer-events: none;"></div>';
  gsap.killTweensOf("*");
}

function cancelAuto() {
  if (autoInterval) { clearInterval(autoInterval); autoInterval = null; }
}

function shootParticle(startEl, endX, endY, onComplete) {
  if(!startEl) { if(onComplete) onComplete(); return; }
  playSound('particle');
  const rect = startEl.getBoundingClientRect();
  const p = document.createElement('div');
  p.className = 'particle';
  document.body.appendChild(p);
  gsap.fromTo(p, {left: rect.left + rect.width/2, top: rect.top + rect.height/2, scale: 1}, {
    left: endX, top: endY, scale: 0.2, duration: 0.6, ease: 'power2.in',
    onComplete: () => { p.remove(); if(onComplete) onComplete(); }
  });
}

let gcdVisualizerScale = 14;
function drawGCDRect(x, y, w, h, isSquare=false) {
  const vis = document.getElementById('gcd-visualizer');
  let el = document.createElement('div');
  el.className = isSquare ? 'gcd-rect gcd-square' : 'gcd-rect';
  el.style.left = (x * gcdVisualizerScale) + 'px';
  el.style.top = (y * gcdVisualizerScale) + 'px';
  el.style.width = (w * gcdVisualizerScale) + 'px';
  el.style.height = (h * gcdVisualizerScale) + 'px';
  if(isSquare) el.innerText = `${w}x${h}`;
  vis.appendChild(el);
  gsap.from(el, {scale: 0, opacity: 0, duration: 0.5, ease: 'back.out'});
  return el;
}

// ----------------------------------------------------
// STEP 1: Fruits Price Function
// ----------------------------------------------------
function* step1Generator() {
  const factory = document.getElementById('factory-floor');
  
  highlightLine(7);
  updateMemoryHUD(`<span id="hud-apple">apple_count = 10</span>`);
  logTrace(`グローバル変数 apple_count に 10 を代入`);
  yield;
  
  highlightLine(8);
  updateMemoryHUD(`<span id="hud-apple">apple_count = 10</span><br><span id="hud-banana">banana_count = 5</span>`);
  logTrace(`グローバル変数 banana_count に 5 を代入`);
  yield;
  
  highlightLine(9);
  logTrace(`fruits_price(10, 5) を呼び出します...`, 'warn');
  
  // Create function machine
  const machine = document.createElement('div');
  machine.className = 'func-machine';
  machine.style.top = '150px';
  machine.innerHTML = `
    <div class="machine-header">fruits_price()</div>
    <div class="machine-screen" id="m-screen">Idle</div>
    <div class="machine-gear">⚙️</div>
  `;
  factory.appendChild(machine);
  gsap.from(machine, {y: -100, opacity: 0, duration: 0.5, ease: 'back.out'});
  
  // Create Arguments
  const arg1 = document.createElement('div');
  arg1.className = 'data-item'; arg1.innerHTML = `<span class="label">apple</span>10`;
  arg1.style.left = '50px'; arg1.style.top = '300px';
  factory.appendChild(arg1);
  gsap.set(arg1, {scale: 0});
  
  const arg2 = document.createElement('div');
  arg2.className = 'data-item'; arg2.innerHTML = `<span class="label">banana</span>5`;
  arg2.style.left = '150px'; arg2.style.top = '300px';
  factory.appendChild(arg2);
  gsap.set(arg2, {scale: 0});
  
  // Shoot particles
  if(window.isFastForward) {
    shootParticle(document.getElementById('hud-apple'), 90, 340, () => gsap.to(arg1, {scale:1, duration:0.3, ease:'back.out'}));
    shootParticle(document.getElementById('hud-banana'), 190, 340, () => gsap.to(arg2, {scale:1, duration:0.3, ease:'back.out'}));
  } else {
    shootParticle(document.getElementById('hud-apple'), 90, 340, () => gsap.to(arg1, {scale:1, duration:0.3, ease:'back.out'}));
    setTimeout(() => {
      shootParticle(document.getElementById('hud-banana'), 190, 340, () => gsap.to(arg2, {scale:1, duration:0.3, ease:'back.out'}));
    }, 200);
  }
  yield;
  
  // Move args into machine
  gsap.to([arg1, arg2], {y: -150, opacity: 0, duration: 0.5, stagger: 0.2});
  machine.classList.add('active');
  document.getElementById('m-screen').innerText = "Processing...";
  highlightLine(0);
  updateMemoryHUD(`[ローカル変数]<br>apple = 10<br>banana = 5`);
  addTraceRow(["引数受取", "apple=10, banana=5", "関数開始", "-"]);
  yield;
  
  highlightLine(1);
  updateMemoryHUD(`[ローカル変数]<br>apple = 10<br>banana = 5<br><span style="color:#00ff66">total_apple = 1000</span>`);
  document.getElementById('m-screen').innerText = "apple * 100";
  addTraceRow(["計算①", "total_apple", "10 * 100", "1000 円"]);
  yield;
  
  highlightLine(2);
  updateMemoryHUD(`[ローカル変数]<br>apple = 10<br>banana = 5<br>total_apple = 1000<br><span style="color:#00ff66">total_banana = 400</span>`);
  document.getElementById('m-screen').innerText = "banana * 80";
  addTraceRow(["計算②", "total_banana", "5 * 80", "400 円"]);
  yield;
  
  highlightLine(3);
  updateMemoryHUD(`[ローカル変数]<br>total_apple = 1000<br>total_banana = 400<br><span style="color:#00ff66">total = 1400</span>`);
  document.getElementById('m-screen').innerText = "1000 + 400 = 1400";
  addTraceRow(["小計", "total", "1000 + 400", "1400 円"]);
  yield;
  
  highlightLine(4);
  addTraceRow(["戻り値", "return total", "呼び出し元へ返却", "<span class='val-ret'>1400</span>"]);
  
  const retVal = document.createElement('div');
  retVal.className = 'return-val';
  retVal.innerText = 'Return: 1400';
  retVal.style.top = '100px';
  factory.appendChild(retVal);
  gsap.from(retVal, {y: 50, scale: 0, duration: 0.5, ease: 'back.out'});
  machine.classList.remove('active');
  document.getElementById('m-screen').innerText = "Done";
  yield;
  
  gsap.to(machine, {opacity: 0.3, duration: 0.5});
  gsap.to(retVal, {top: '300px', duration: 0.5, ease: 'power2.inOut'});
  
  highlightLine(9);
  updateMemoryHUD(`apple_count = 10<br>banana_count = 5<br><span id="hud-price" style="color:#00ff66">price = 1400</span>`);
  
  const rect = document.getElementById('hud-price').getBoundingClientRect();
  shootParticle(retVal, rect.left + 40, rect.top + 10, () => {
    playSound('particle');
    retVal.remove();
  });
  yield;
  
  highlightLine(10);
  const bubble = document.createElement('div');
  bubble.className = 'speech-bubble';
  bubble.innerText = "合計 1400 円です。";
  bubble.style.top = '350px';
  factory.appendChild(bubble);
  gsap.from(bubble, {scale: 0, y: 20, duration: 0.5, ease: 'elastic.out(1, 0.5)'});
  logTrace(`出力: 合計 1400 円です。`, 'true');
  
  highlightLine(-1);
  logTrace(`[完了]`);
}

// ----------------------------------------------------
// STEP 2: Factorial Recursive Function
// ----------------------------------------------------
function* step2Generator() {
  const factory = document.getElementById('factory-floor');
  const stackBaseY = 500;
  const stackOffset = 110;
  let frames = [];
  
  highlightLine(7);
  updateMemoryHUD(`グローバル領域<br>---<br>関数呼び出し準備...`);
  logTrace(`kaijou(3) を呼び出します`);
  yield;
  
  // Call kaijou(3)
  frames.push(createStackFrameFactorial(3, stackBaseY - 0*stackOffset, factory));
  highlightLine(0);
  updateMemoryHUD(`[スタック1]<br>n = 3`);
  logTrace(`[Push] kaijou(3) スタック生成`, 'warn');
  playSound('particle', 0);
  yield;
  
  highlightLine(1);
  logTrace(`n == 0 ? -> False`);
  yield;
  
  highlightLine(4);
  logTrace(`kaijou(2) を呼び出して結果を待ちます...`);
  yield;
  
  // Call kaijou(2)
  frames[0].classList.remove('active');
  frames.push(createStackFrameFactorial(2, stackBaseY - 1*stackOffset, factory));
  highlightLine(0);
  updateMemoryHUD(`[スタック2]<br>n = 2<br><br>[スタック1 (待機)]<br>n = 3`);
  logTrace(`[Push] kaijou(2) スタック生成`, 'warn');
  playSound('particle', 1);
  yield;
  
  highlightLine(1); logTrace(`n == 0 ? -> False`); yield;
  highlightLine(4); logTrace(`kaijou(1) を呼び出します...`); yield;
  
  // Call kaijou(1)
  frames[1].classList.remove('active');
  frames.push(createStackFrameFactorial(1, stackBaseY - 2*stackOffset, factory));
  highlightLine(0);
  updateMemoryHUD(`[スタック3]<br>n = 1<br><br>[スタック2 (待機)]<br>n = 2`);
  addTraceRow(["Push [スタック3]", "n = 1", "kaijou(0) を呼び出し", "待機"]);
  playSound('particle', 2);
  yield;
  
  highlightLine(1); yield;
  highlightLine(4); yield;
  
  // Call kaijou(0)
  frames[2].classList.remove('active');
  frames.push(createStackFrameFactorial(0, stackBaseY - 3*stackOffset, factory));
  highlightLine(0);
  updateMemoryHUD(`[スタック4]<br>n = 0<br><br>[スタック3 (待機)]<br>n = 1`);
  addTraceRow(["Push [スタック4]", "n = 0", "n == 0 (ベースケース)", "<span class='val-ret'>return 1</span>"]);
  playSound('particle', 3);
  yield;
  
  highlightLine(1); 
  playSound('shake');
  yield;
  
  highlightLine(2);
  let ret = 1;
  frames[3].innerHTML += `<div class="treasure-chest">📦</div>`;
  gsap.from(frames[3].querySelector('.treasure-chest'), {scale: 0, rotation: 360, duration: 0.5, ease: 'back.out'});
  showReturnValue(frames[3], ret);
  yield;
  
  // Pop kaijou(0)
  playSound('pop', 3);
  popStackFrame(frames.pop(), ret, frames[2]);
  updateMemoryHUD(`[スタック3]<br>n = 1`);
  addTraceRow(["Pop  [スタック4]", "n = 0 終了", "戻り値 1 を kaijou(1) へ", "1"]);
  highlightLine(4);
  yield;
  
  // In kaijou(1)
  frames[2].querySelector('.frame-body').innerHTML = `1 * <span style="color:#ff00ff">${ret}</span>`;
  highlightLine(4);
  yield;
  
  frames[2].querySelector('.frame-body').innerHTML = `1 * 1 = <span style="color:#00ff66">1</span>`;
  ret = 1 * 1;
  addTraceRow(["Pop  [スタック3]", "n = 1 完了", "1 * 1 = 1", "<span class='val-ret'>return 1</span>"]);
  showReturnValue(frames[2], ret);
  yield;
  
  // Pop kaijou(1)
  playSound('pop', 2);
  popStackFrame(frames.pop(), ret, frames[1]);
  updateMemoryHUD(`[スタック2]<br>n = 2`);
  yield;
  
  // In kaijou(2)
  frames[1].querySelector('.frame-body').innerHTML = `2 * <span style="color:#ff00ff">${ret}</span>`;
  highlightLine(4);
  yield;
  
  frames[1].querySelector('.frame-body').innerHTML = `2 * 1 = <span style="color:#00ff66">2</span>`;
  ret = 2 * 1;
  addTraceRow(["Pop  [スタック2]", "n = 2 完了", "2 * 1 = 2", "<span class='val-ret'>return 2</span>"]);
  showReturnValue(frames[1], ret);
  yield;
  
  // Pop kaijou(2)
  playSound('pop', 1);
  popStackFrame(frames.pop(), ret, frames[0]);
  updateMemoryHUD(`[スタック1]<br>n = 3`);
  yield;
  
  // In kaijou(3)
  frames[0].querySelector('.frame-body').innerHTML = `3 * <span style="color:#ff00ff">${ret}</span>`;
  highlightLine(4);
  yield;
  
  frames[0].querySelector('.frame-body').innerHTML = `3 * 2 = <span style="color:#00ff66">6</span>`;
  ret = 3 * 2;
  addTraceRow(["Pop  [スタック1]", "n = 3 完了", "3 * 2 = 6", "<span class='val-ret'>return 6</span>"]);
  showReturnValue(frames[0], ret);
  yield;
  
  // Pop kaijou(3) back to global
  playSound('pop', 0);
  popStackFrame(frames.pop(), ret, null);
  highlightLine(7);
  updateMemoryHUD(`グローバル領域<br>ans = ${ret}`);
  addTraceRow(["再帰完了", "ans に代入", "3! = 6", "<span class='val-true'>計算完了</span>"]);
  yield;
  
  highlightLine(8);
  addTraceRow(["最終出力", "print('3! =', ans)", "出力", "<span class='val-true' style='font-size:1.1rem;'>3! = 6</span>"]);
  highlightLine(-1);
}

// ----------------------------------------------------
// STEP 3: GCD Recursive Function
// ----------------------------------------------------
function* step3Generator() {
  const factory = document.getElementById('factory-floor');
  const stackBaseY = 500;
  const stackOffset = 110;
  let frames = [];
  
  highlightLine(7);
  updateMemoryHUD(`ans = ?`);
  addTraceRow(["開始", "-", "-", "gcd(24, 9) 呼出"]);
  drawGCDRect(0, 0, 24, 9); // Initial 24x9 rectangle
  yield;
  
  // gcd(24, 9)
  frames.push(createStackFrameGCD(24, 9, stackBaseY - 0*stackOffset, factory));
  highlightLine(0); updateMemoryHUD(`a=24, b=9`);
  addTraceRow(["Push [スタック1]", "(24, 9)", "def gcd(a, b):", "実行開始"]);
  yield;

  highlightLine(1);
  addTraceRow(["判定", "(24, 9)", "b == 0 (9 == 0)", "<span class='val-false'>False (継続)</span>"]);
  yield;

  highlightLine(4); 
  frames[0].querySelector('.frame-var').innerHTML = `r = 24 % 9 = 6`;
  drawGCDRect(0, 0, 9, 9, true); drawGCDRect(9, 0, 9, 9, true); // Visual slice
  addTraceRow(["余り計算", "(24, 9)", "r = 24 % 9", "r = 6"]);
  yield;

  highlightLine(5); 
  animateShift(frames[0], 24, 9, 6);
  addTraceRow(["再帰呼出", "(9, 6)", "return gcd(9, 6)", "gcd(b, r)"]);
  yield;
  
  // gcd(9, 6)
  frames[0].classList.remove('active');
  frames.push(createStackFrameGCD(9, 6, stackBaseY - 1*stackOffset, factory));
  highlightLine(0); updateMemoryHUD(`[スタック2]<br>a=9, b=6<br><br>[スタック1]<br>a=24, b=9`);
  addTraceRow(["Push [スタック2]", "(9, 6)", "def gcd(a, b):", "実行開始"]);
  yield;

  highlightLine(1);
  addTraceRow(["判定", "(9, 6)", "b == 0 (6 == 0)", "<span class='val-false'>False (継続)</span>"]);
  yield;

  highlightLine(4); 
  frames[1].querySelector('.frame-var').innerHTML = `r = 9 % 6 = 3`;
  drawGCDRect(18, 0, 6, 6, true);
  addTraceRow(["余り計算", "(9, 6)", "r = 9 % 6", "r = 3"]);
  yield;

  highlightLine(5); 
  animateShift(frames[1], 9, 6, 3);
  addTraceRow(["再帰呼出", "(6, 3)", "return gcd(6, 3)", "gcd(b, r)"]);
  yield;
  
  // gcd(6, 3)
  frames[1].classList.remove('active');
  frames.push(createStackFrameGCD(6, 3, stackBaseY - 2*stackOffset, factory));
  highlightLine(0); updateMemoryHUD(`[スタック3]<br>a=6, b=3<br><br>[スタック2]<br>a=9, b=6`);
  addTraceRow(["Push [スタック3]", "(6, 3)", "def gcd(a, b):", "実行開始"]);
  yield;

  highlightLine(1);
  addTraceRow(["判定", "(6, 3)", "b == 0 (3 == 0)", "<span class='val-false'>False (継続)</span>"]);
  yield;

  highlightLine(4); 
  frames[2].querySelector('.frame-var').innerHTML = `r = 6 % 3 = 0`;
  drawGCDRect(18, 6, 3, 3, true); drawGCDRect(21, 6, 3, 3, true);
  addTraceRow(["余り計算", "(6, 3)", "r = 6 % 3", "r = 0"]);
  yield;

  highlightLine(5); 
  animateShift(frames[2], 6, 3, 0);
  addTraceRow(["再帰呼出", "(3, 0)", "return gcd(3, 0)", "gcd(b, r)"]);
  yield;
  
  // gcd(3, 0)
  frames[2].classList.remove('active');
  frames.push(createStackFrameGCD(3, 0, stackBaseY - 3*stackOffset, factory));
  highlightLine(0); updateMemoryHUD(`[スタック4]<br>a=3, b=0`);
  addTraceRow(["Push [スタック4]", "(3, 0)", "def gcd(a, b):", "実行開始"]);
  yield;

  highlightLine(1); 
  playSound('shake');
  addTraceRow(["ベースケース", "(3, 0)", "b == 0 (0 == 0)", "<span class='val-true'>True (終了条件成立)</span>"]);
  yield;
  
  highlightLine(2);
  let ret = 3;
  showReturnValue(frames[3], ret);
  addTraceRow(["Pop  [スタック4]", "(3, 0)", "return a (3)", "<span class='val-ret'>return 3</span>"]);
  yield;
  
  // Pop cascade! GCD just returns the value directly up the chain.
  const popLabels = ["Pop  [スタック3]", "Pop  [スタック2]", "Pop  [スタック1]"];
  const popNotes = ["gcd(6, 3) 完了", "gcd(9, 6) 完了", "gcd(24, 9) 完了"];
  for(let i=3; i>=0; i--) {
    let target = i > 0 ? frames[i-1] : null;
    popStackFrame(frames[i], ret, target);
    if(target) {
      updateMemoryHUD(`[スタック${i}]<br>戻り値をそのまま上に返す`);
      addTraceRow([popLabels[3-i], `階層${i} へ戻る`, popNotes[3-i], `<span class='val-ret'>伝搬: 3</span>`]);
    }
    highlightLine(5);
    yield;
  }
  
  highlightLine(7);
  updateMemoryHUD(`ans = ${ret}`);
  addTraceRow(["再帰完了", "ans に格納", "gcd(24, 9) = 3", "<span class='val-true'>ans = 3</span>"]);
  yield;
  
  highlightLine(8);
  addTraceRow(["最終出力", "print('GCD =', ans)", "出力", "<span class='val-true' style='font-size:1.1rem;'>GCD = 3</span>"]);
  highlightLine(-1);
}

// Stack Frame Helpers
function createStackFrameFactorial(n, yPos, parent) {
  const el = document.createElement('div');
  el.className = 'stack-frame active';
  el.style.top = yPos + 'px';
  const depth = 3 - n; // B1F, B2F, etc.
  el.innerHTML = `
    <div class="rpg-floor">B${depth+1}F</div>
    <div class="frame-title">kaijou(${n})</div>
    <div class="frame-body">${n > 0 ? `${n} * <span style="color:#ffb86c">kaijou(${n-1})</span>` : `return 1`}</div>
  `;
  parent.appendChild(el);
  gsap.from(el, {y: -50, scale: 0.8, opacity: 0, duration: 0.4, ease: 'back.out'});
  return el;
}

function createStackFrameGCD(a, b, yPos, parent) {
  const el = document.createElement('div');
  el.className = 'stack-frame active';
  el.style.top = yPos + 'px';
  el.innerHTML = `
    <div class="frame-title">gcd(<span class="var-a">${a}</span>, <span class="var-b">${b}</span>)</div>
    <div class="frame-body" style="position:relative;">${b == 0 ? `return ${a}` : `gcd(<span class="call-b" style="display:inline-block">${b}</span>, <span class="call-r" style="display:inline-block">r</span>)`}</div>
    <div class="frame-var"></div>
  `;
  parent.appendChild(el);
  gsap.from(el, {y: -50, scale: 0.8, opacity: 0, duration: 0.4, ease: 'back.out'});
  return el;
}

function animateShift(frame, a, b, r) {
  const bEl = frame.querySelector('.call-b');
  const rEl = frame.querySelector('.call-r');
  const varB = frame.querySelector('.var-b');
  const varA = frame.querySelector('.var-a');
  if(!bEl || !rEl) return;
  
  const moveB = bEl.cloneNode(true);
  const moveR = document.createElement('span'); moveR.innerText = r; moveR.style.color = '#ff00ff'; moveR.style.fontWeight='bold';
  moveB.style.position = 'absolute'; moveB.style.color = '#00f3ff'; moveB.style.fontWeight='bold';
  moveR.style.position = 'absolute';
  
  frame.appendChild(moveB); frame.appendChild(moveR);
  
  const bRect = varB.getBoundingClientRect();
  const aRect = varA.getBoundingClientRect();
  const rSrcRect = frame.querySelector('.frame-var').getBoundingClientRect();
  const frameRect = frame.getBoundingClientRect();
  
  gsap.set(moveB, {x: bRect.left - frameRect.left, y: bRect.top - frameRect.top});
  gsap.set(moveR, {x: rSrcRect.left - frameRect.left + 50, y: rSrcRect.top - frameRect.top});
  
  const callBRect = bEl.getBoundingClientRect();
  const callRRect = rEl.getBoundingClientRect();
  
  gsap.to(moveB, {x: callBRect.left - frameRect.left, y: callBRect.top - frameRect.top, duration: 0.8, ease: 'power2.inOut'});
  gsap.to(moveR, {x: callRRect.left - frameRect.left, y: callRRect.top - frameRect.top, duration: 0.8, ease: 'power2.inOut', onComplete: () => {
    bEl.style.color = '#00f3ff';
    rEl.innerText = r; rEl.style.color = '#ff00ff';
    moveB.remove(); moveR.remove();
  }});
}

function showReturnValue(frame, val) {
  const retEl = document.createElement('div');
  retEl.className = 'return-val';
  retEl.innerText = val;
  frame.appendChild(retEl);
  gsap.set(retEl, {top: '-20px', left: '100px'});
  gsap.from(retEl, {y: 20, scale: 0, duration: 0.3, ease: 'back.out'});
  frame.retEl = retEl;
}

function popStackFrame(frame, val, targetFrame) {
  gsap.to(frame, {opacity: 0, scale: 0.8, x: -50, duration: 0.5, onComplete: () => frame.remove()});
  if (targetFrame && frame.retEl) {
    targetFrame.classList.add('active');
    targetFrame.appendChild(frame.retEl);
    gsap.to(frame.retEl, {top: '10px', left: '200px', duration: 0.5, ease: 'power2.inOut'});
  }
}


// Engine Trigger
function stepBackOld(stepNum) {
  if (!currentLoopState || currentLoopState.count <= 0) return;
  const targetCount = currentLoopState.count - 1;
  cancelAuto();
  
  // Re-init generator
  initUI();
  let gen;
  if(stepNum === 1) gen = step1Generator();
  if(stepNum === 2) gen = step2Generator();
  if(stepNum === 3) gen = step3Generator();
  if(stepNum === 4) gen = step4Generator();
  
  currentLoopState = { step: stepNum, gen: gen, count: 0 };
  
  window.isFastForward = true;
  gsap.globalTimeline.timeScale(100);
  
  for(let i=0; i<targetCount; i++) {
     currentLoopState.gen.next();
     currentLoopState.count++;
  }
  
  setTimeout(() => {
    window.isFastForward = false;
    gsap.globalTimeline.timeScale(1);
  }, 50);
}

function triggerStep(stepNum, isAuto) {
  if (!currentLoopState || currentLoopState.step !== stepNum) {
    initUI();
    let gen;
    if(stepNum === 1) gen = step1Generator();
    if(stepNum === 2) gen = step2Generator();
    if(stepNum === 3) gen = step3Generator();
    if(stepNum === 4) gen = step4Generator();
    currentLoopState = { step: stepNum, gen: gen, count: 0 };
  }
  
  if (isAuto) {
    if (autoInterval) return; // already running
    autoInterval = setInterval(() => {
      const res = currentLoopState.gen.next();
      if(!res.done) currentLoopState.count++;
      if (res.done) cancelAuto();
    }, 1200);
  } else {
    cancelAuto();
    const res = currentLoopState.gen.next();
    if(!res.done) currentLoopState.count++;
    if (res.done) currentLoopState = null;
  }
}

// ----------------------------------------------------
// STEP 4: Fibonacci Tree
// ----------------------------------------------------
let treeNodes = [];
let treeEdges = [];

function drawTreeNode(id, label, x, y) {
  const node = document.createElement('div');
  node.className = 'tree-node';
  node.id = 'node-' + id;
  node.innerHTML = label;
  node.style.left = x + 'px';
  node.style.top = y + 'px';
  document.getElementById('tree-visualizer').appendChild(node);
  if(!window.isFastForward) gsap.from(node, {scale: 0, duration: 0.5, ease: 'back.out'});
  treeNodes.push(node);
  return node;
}

function drawTreeEdge(x1, y1, x2, y2) {
  const edge = document.createElement('div');
  edge.className = 'tree-edge';
  const length = Math.hypot(x2 - x1, y2 - y1);
  const angle = Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI;
  edge.style.width = length + 'px';
  edge.style.left = x1 + 'px';
  edge.style.top = y1 + 'px';
  edge.style.transform = `rotate(${angle}deg)`;
  document.getElementById('tree-visualizer').appendChild(edge);
  if(!window.isFastForward) gsap.from(edge, {width: 0, duration: 0.5});
  treeEdges.push(edge);
  return edge;
}

function* step4Generator() {
  const factory = document.getElementById('factory-floor');
  const vis = document.getElementById('tree-visualizer');
  
  const originX = factory ? factory.clientWidth / 2 : 400;
  const originY = 100;
  
  highlightLine(5);
  updateMemoryHUD(`ans = ?`);
  addTraceRow(["開始", "-", "-", "fib(3) 呼出"]);
  
  let node3 = drawTreeNode('fib3', 'f(3)', originX, originY);
  yield;
  
  // fib(3) -> fib(2) + fib(1)
  highlightLine(0);
  addTraceRow(["f(3)", "3", "-", "実行開始"]);
  playSound('particle', 1); yield;

  highlightLine(1);
  addTraceRow(["f(3)", "3", "3 <= 1", "<span class='val-false'>False (再帰へ)</span>"]);
  yield;

  highlightLine(3);
  addTraceRow(["f(3) 左枝", "3", "fib(2) を呼び出し", "待機中..."]);
  let node2 = drawTreeNode('fib2', 'f(2)', originX - 100, originY + 100);
  drawTreeEdge(originX, originY, originX - 100, originY + 100);
  yield;
  
  // fib(2) -> fib(1) + fib(0)
  highlightLine(0);
  addTraceRow(["f(2)", "2", "-", "実行開始"]);
  playSound('particle', 2); yield;

  highlightLine(1);
  addTraceRow(["f(2)", "2", "2 <= 1", "<span class='val-false'>False (再帰へ)</span>"]);
  yield;

  highlightLine(3);
  addTraceRow(["f(2) 左枝", "2", "fib(1) を呼び出し", "待機中..."]);
  let node2_1 = drawTreeNode('fib1', 'f(1)', originX - 150, originY + 200);
  drawTreeEdge(originX - 100, originY + 100, originX - 150, originY + 200);
  yield;
  
  // fib(1) Base Case
  highlightLine(0);
  addTraceRow(["f(1)", "1", "-", "実行開始"]);
  playSound('particle', 3); yield;

  highlightLine(1); playSound('shake');
  addTraceRow(["f(1)", "1", "1 <= 1", "<span class='val-true'>True (ベースケース)</span>"]);
  yield;

  highlightLine(2);
  addTraceRow(["f(1)", "1", "return 1", "<span class='val-ret'>return 1</span>"]);
  node2_1.innerHTML += `<div class="flower">🌸</div>`; node2_1.classList.add('active');
  yield;
  
  // pop fib(1)
  playSound('pop', 3);
  addTraceRow(["Pop  f(1)", "1", "戻り値 1 を f(2) へ伝搬", "1"]);
  yield;
  
  // fib(2) next
  highlightLine(3);
  addTraceRow(["f(2) 右枝", "2", "fib(0) を呼び出し", "待機中..."]);
  let node2_0 = drawTreeNode('fib0', 'f(0)', originX - 50, originY + 200);
  drawTreeEdge(originX - 100, originY + 100, originX - 50, originY + 200);
  yield;
  
  // fib(0) Base Case
  highlightLine(0);
  addTraceRow(["f(0)", "0", "-", "実行開始"]);
  playSound('particle', 3); yield;

  highlightLine(1); playSound('shake');
  addTraceRow(["f(0)", "0", "0 <= 1", "<span class='val-true'>True (ベースケース)</span>"]);
  yield;

  highlightLine(2);
  addTraceRow(["f(0)", "0", "return 0", "<span class='val-ret'>return 0</span>"]);
  node2_0.innerHTML += `<div class="flower">🌸</div>`; node2_0.classList.add('active');
  yield;
  
  // pop fib(0)
  playSound('pop', 3);
  addTraceRow(["Pop  f(0)", "0", "戻り値 0 を f(2) へ伝搬", "0"]);
  yield;
  
  // return fib(2)
  highlightLine(3);
  addTraceRow(["Pop  f(2)", "2", "f(1) + f(0) = 1 + 0", "<span class='val-ret'>return 1</span>"]);
  node2.innerHTML += `<div class="flower">🌸</div>`; node2.classList.add('active'); yield;
  playSound('pop', 2);
  yield;
  
  // return to fib(3)
  highlightLine(3);
  addTraceRow(["f(3) 右枝", "3", "fib(1) を呼び出し", "待機中..."]);
  let node3_1 = drawTreeNode('fib1_right', 'f(1)', originX + 100, originY + 100);
  drawTreeEdge(originX, originY, originX + 100, originY + 100);
  yield;
  
  // fib(1) Base Case right
  highlightLine(0);
  addTraceRow(["f(1) 右", "1", "-", "実行開始"]);
  playSound('particle', 2); yield;

  highlightLine(1); playSound('shake');
  addTraceRow(["f(1) 右", "1", "1 <= 1", "<span class='val-true'>True (ベースケース)</span>"]);
  yield;

  highlightLine(2);
  addTraceRow(["f(1) 右", "1", "return 1", "<span class='val-ret'>return 1</span>"]);
  node3_1.innerHTML += `<div class="flower">🌸</div>`; node3_1.classList.add('active');
  yield;
  
  // pop fib(1) right
  playSound('pop', 2);
  addTraceRow(["Pop  f(1)", "1", "戻り値 1 を f(3) へ伝搬", "1"]);
  yield;
  
  // return fib(3)
  highlightLine(3);
  addTraceRow(["Pop  f(3)", "3", "f(2) + f(1) = 1 + 1", "<span class='val-ret'>return 2</span>"]);
  node3.innerHTML += `<div class="flower">🌸</div>`; node3.classList.add('active'); yield;
  playSound('pop', 1);
  yield;
  
  highlightLine(5);
  updateMemoryHUD(`ans = 2`);
  addTraceRow(["再帰完了", "ans に格納", "fib(3) = 2", "<span class='val-true'>ans = 2</span>"]);
  yield;
}

// Init
window.onload = initUI;



// === Wrappers for 3-Column UI ===
function stepForward() {
  triggerStep(currentStep, false);
}
function stepBack() {
  stepBackOld(currentStep);
}
function toggleAuto() {
  const btn = document.getElementById('btn-auto');
  if (autoInterval) {
    cancelAuto();
  } else {
    triggerStep(currentStep, true);
    if(btn) {
      btn.innerText = '⏸ PAUSE';
      btn.classList.add('auto-active');
    }
  }
}

// Override cancelAuto to update button state
const oldCancelAuto = cancelAuto;
cancelAuto = function() {
  oldCancelAuto();
  const btn = document.getElementById('btn-auto');
  if(btn) {
    btn.innerText = '▶ AUTO';
    btn.classList.remove('auto-active');
  }
};

function resetCurrentStep() {
  cancelAuto();
  initUI();
}


// =================================================================
// Feature: Hacker Cat Tooltip
// =================================================================
const hackerDict = {
  'print': 'コンソール画面に、文字や変数の結果を出力（表示）する関数にゃ。',
  'int': '文字などのデータを「整数（数値）」に変身させる関数にゃ。',
  'float': '文字などのデータを「小数（浮動小数点数）」に変身させる関数にゃ。',
  'str': '数値などのデータを「文字列（テキスト）」に変身させる関数にゃ。',
  'input': 'キーボードから入力を受け付ける関数にゃ。',
  'if': 'もし～なら、という条件分岐を作る命令にゃ。',
  'elif': 'ifの条件に当てはまらず、「じゃあ、もし～なら」と追加の条件を作る命令にゃ。',
  'else': 'どの条件にも当てはまらなかった場合（それ以外）の処理を書くところにゃ。',
  'and': '「～かつ～」の両方が正しい（True）ときに全体の条件をTrueにするにゃ。',
  'or': '「～または～」のどちらかが正しい（True）ときに全体の条件をTrueにするにゃ。',
  'not': '「～ではない」と、条件のTrueとFalseを逆転させるにゃ。',
  'True': '条件が「正しい（真）」であることを表す値にゃ！',
  'False': '条件が「間違っている（偽）」であることを表す値にゃ！',
  'def': '新しい関数を定義（作る）ための合図にゃ。',
  'return': '関数の処理結果（戻り値）を呼び出し元に返す命令にゃ。'
};

const tooltipEl = document.getElementById('hacker-tooltip');
const tooltipText = document.getElementById('hacker-speech-text');

if (tooltipEl && tooltipText) {
  document.addEventListener('mouseover', (e) => {
    const target = e.target.closest('.keyword-help');
    if (target) {
      const word = target.getAttribute('data-word');
      if (hackerDict[word]) {
        tooltipText.innerText = hackerDict[word];
        const rect = target.getBoundingClientRect();
        tooltipEl.style.left = `${rect.left}px`;
        tooltipEl.style.top = `${rect.top - tooltipEl.offsetHeight - 10}px`;
        tooltipEl.classList.remove('hidden');
        tooltipEl.classList.add('visible');
      }
    }
  });

  document.addEventListener('mouseout', (e) => {
    if (e.target.closest('.keyword-help')) {
      tooltipEl.classList.remove('visible');
      setTimeout(() => {
        if (!tooltipEl.classList.contains('visible')) {
          tooltipEl.classList.add('hidden');
        }
      }, 200);
    }
  });
}
// === Feature: Hacker Cat Tooltip & Syntax Highlighting ===
const hackerDict = {
  "def": "「関数」を作るための魔法のキーワードニャ！新しい技を定義するのニャ！",
  "return": "関数の「結果」を返すキーワードニャ。この値が呼び出し元に届くのニャ！",
  "if": "「もし〜なら」という条件分岐ニャ。プログラミングの基本中の基本ニャ！",
  "elif": "「それとも、もし〜なら」ニャ！ifの条件がダメだった時の次の選択肢ニャ！",
  "else": "「どれにも当てはまらないなら」ニャ！最後のセーフティーネットニャ！",
  "while": "「条件がTrueの間、ずっと繰り返す」ニャ。無限ループには注意ニャ！",
  "for": "「リストや範囲の要素を順番に取り出して繰り返す」ニャ！",
  "in": "「〜の中に」含まれているか調べるニャ！for文の相棒でもあるニャ。",
  "print": "画面に文字を表示する魔法の呪文ニャ！デバッグにも大活躍ニャ！",
  "int": "文字などを「整数」に変換するニャ。数値計算したい時に必須ニャ！",
  "float": "「小数（浮動小数点数）」に変換するニャ！細かい数字を扱う時ニャ。",
  "str": "数字などを「文字列」に変換するニャ！文字と繋げたい時に使うニャ。",
  "input": "ユーザーからキーボード入力を受け取るニャ。対話型アプリの第一歩ニャ！",
  "and": "「〜かつ〜」ニャ！両方の条件がTrueの時だけTrueになるニャ！",
  "or": "「〜または〜」ニャ！どちらかの条件がTrueならTrueになるニャ！",
  "not": "「〜ではない」ニャ！TrueとFalseをひっくり返すニャ！",
  "True": "「真（正しい）」を表す特別な値ニャ。大文字から始まるのに注意ニャ！",
  "False": "「偽（間違い）」を表す特別な値ニャ。こちらも大文字からニャ！",
  "range": "連続した整数のリストのようなものを作るニャ！forループと仲良しニャ！",
  "len": "リストの長さ（要素数）や文字列の文字数を教えてくれるニャ！"
};

function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function highlightSyntax(line) {
  let res = line.replace(/ /g, '&nbsp;');
  res = res.replace(/('(?:\\\'|[^'])*'|"(?:\\\"|[^"])*")/g, (m) => {
    return `<span class="hl-string">${m}</span>`;
  });
  res = res.replace(/\b(def|return|if|elif|else|while|for|in|and|or|not|True|False)\b/g, (match) => {
    return `<span class="hl-keyword keyword-help" data-word="${match}">${match}</span>`;
  });
  res = res.replace(/\b(print|int|float|str|input|range|len)\b/g, (match) => {
    return `<span class="hl-func keyword-help" data-word="${match}">${match}</span>`;
  });
  return res;
}

const tooltip = document.getElementById('hacker-tooltip');
const tooltipText = document.getElementById('hacker-speech-text');

document.addEventListener('mouseover', (e) => {
  if (e.target.classList.contains('keyword-help')) {
    const word = e.target.getAttribute('data-word');
    if (hackerDict[word] && tooltip) {
      tooltipText.innerText = hackerDict[word];
      const rect = e.target.getBoundingClientRect();
      tooltip.style.left = (rect.left + 20) + 'px';
      tooltip.style.top = (rect.top + 30) + 'px';
      tooltip.classList.add('visible');
    }
  }
});
document.addEventListener('mouseout', (e) => {
  if (e.target.classList.contains('keyword-help') && tooltip) {
    tooltip.classList.remove('visible');
  }
});

// --- Injected Features ---
function changeSpeed(val) {
  if (typeof gsap !== 'undefined' && gsap.globalTimeline) {
    gsap.globalTimeline.timeScale(parseFloat(val));
  }
}
function fireConfetti() {
  if (typeof confetti !== 'undefined') {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#ff5555', '#50fa7b', '#f1fa8c', '#bd93f9', '#8be9fd']
    });
  }
}
