// === Audio System ===
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playTone(freq, type, dur, vol=0.1) {
  if(audioCtx.state === 'suspended') audioCtx.resume();
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = type; osc.frequency.value = freq;
  osc.connect(gain); gain.connect(audioCtx.destination);
  osc.start(); gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + dur);
  osc.stop(audioCtx.currentTime + dur);
}
function playBeep() { playTone(800, 'square', 0.1, 0.1); }
function playTypewriter() { playTone(1200, 'square', 0.05, 0.05); }
function playMachine() { playTone(100, 'sawtooth', 0.5, 0.3); setTimeout(() => playTone(150, 'square', 0.3, 0.3), 200); }
function playCoin() { playTone(2000, 'sine', 0.1, 0.2); setTimeout(() => playTone(3000, 'sine', 0.2, 0.2), 100); }
function playCrunch() {
  if(audioCtx.state === 'suspended') audioCtx.resume();
  playTone(300, 'square', 0.1, 0.4);
  setTimeout(() => playTone(200, 'sawtooth', 0.1, 0.4), 50);
}
function playLaser() {
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(1500, audioCtx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(100, audioCtx.currentTime + 0.3);
  osc.connect(gain); gain.connect(audioCtx.destination);
  osc.start(); gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.3);
  osc.stop(audioCtx.currentTime + 0.3);
}
function playGod() {
  playTone(50, 'sawtooth', 1.0, 0.5);
  setTimeout(() => playTone(100, 'square', 0.8, 0.3), 200);
}

// === Trace Log System ===
const logContent = document.getElementById('log-content');
let logEntries = [];
function logTrace(msg, statusClass = '') {
  playTypewriter();
  const div = document.createElement('div');
  div.className = 'log-entry ' + statusClass;
  div.innerHTML = msg;
  logContent.appendChild(div);
  logEntries.push(div);
  if(logEntries.length > 10) {
    const oldest = logEntries.shift();
    oldest.remove();
  }
}
function clearLog() {
  logContent.innerHTML = '';
  logEntries = [];
}

// === Navigation & Steps ===
const stepTitles = [
  "5-1. 関数の定義と戻り値", "5-2. 戻り値のない関数", "5-3. 三角形の面積を求める", 
  "5-4. 再帰① 階乗(n!)", "5-5. 再帰② 組合せ(nCr)", "5-6. 再帰③ ユークリッド互除法(神)"
];
let currentStep = 1;

function updateStep() {
  document.querySelectorAll('.step-panel').forEach(p => p.classList.remove('active'));
  const panel = document.getElementById('step-' + currentStep);
  if(panel) panel.classList.add('active');
  document.getElementById('step-display').innerText = stepTitles[currentStep - 1];
  playTone(1800, 'sine', 0.1);
  clearFactory();
  clearLog();
  cancelAuto();
  setupCodeForStep(currentStep);
  currentLoopState = null;
}
function nextStep() { if(currentStep < 6) { currentStep++; updateStep(); } }
function prevStep() { if(currentStep > 1) { currentStep--; updateStep(); } }

// === UI Logic (Code & Memory) ===
function setCodeMonitor(codeStr) {
  const lines = codeStr.trim().split('\n');
  const html = lines.map((l, i) => `<span class="code-line" id="line-${i}">${l.replace(/ /g, '&nbsp;')}</span>`).join('\n');
  document.getElementById('code-content').innerHTML = html;
}
function highlightLine(lineNums) {
  document.querySelectorAll('.code-line').forEach(el => el.classList.remove('active'));
  if(lineNums === null) return;
  if(!Array.isArray(lineNums)) lineNums = [lineNums];
  lineNums.forEach(num => {
    const el = document.getElementById(`line-${num}`);
    if(el) el.classList.add('active');
  });
}
function updateMemoryHUD(text) { document.getElementById('mem-content').innerHTML = text; }

function setupCodeForStep(step) {
  highlightLine(null);
  const codes = [
    `def fruits_price(apple, banana):\n  t_apple = apple * 100\n  t_banana = banana * 80\n  total = t_apple + t_banana\n  return total\n\nprice = fruits_price(10, 5)\nprint(price)`,
    `def fruits_price(apple, banana):\n  t_apple = apple * 100\n  t_banana = banana * 80\n  total = t_apple + t_banana\n  print('合計', total, '円です')\n\nfruits_price(10, 5)`,
    `def triangle(a, b):\n  return a * b / 2\n\nans = triangle(4, 5)\nprint(ans)`,
    `def kaijou(n):\n  if n == 0:\n    return 1\n  else:\n    return n * kaijou(n-1)\n\nprint(kaijou(4))`,
    `def kumiawase(n, r):\n  if r==0 or n==r:\n    return 1\n  else:\n    return kumiawase(n-1,r) + kumiawase(n-1,r-1)\n\nprint(kumiawase(4, 2))`,
    `def god(a, b):\n  if b == 0:\n    return a\n  else:\n    r = a % b\n    return god(b, r)\n\nprint(god(1071, 1029))`
  ];
  setCodeMonitor(codes[step - 1]);
  updateMemoryHUD("Wait...");
}

// === Factory Floor API ===
const floor = document.getElementById('factory-floor');

function clearFactory() {
  floor.innerHTML = '';
}

function createBox(x, y, title, type='func') {
  const box = document.createElement('div');
  box.className = type + '-box';
  gsap.set(box, {x: x, y: y});
  
  const titleEl = document.createElement('div');
  titleEl.className = type + '-title';
  titleEl.innerHTML = title;
  box.appendChild(titleEl);
  
  if (type === 'func') {
    const mouth = document.createElement('div');
    mouth.className = 'func-mouth';
    mouth.innerHTML = '● ● ●';
    box.appendChild(mouth);
  } else if (type === 'recur') {
    const content = document.createElement('div');
    content.className = 'recur-content';
    box.appendChild(content);
  }
  
  floor.appendChild(box);
  return box;
}

// === State Machine Logic ===
let currentLoopState = null;
let autoInterval = null;

function cancelAuto() {
  if(autoInterval) { clearInterval(autoInterval); autoInterval = null; }
}

// Step 1: Return value
function* step1Generator() {
  clearFactory(); clearLog(); updateMemoryHUD(`Wait...`); highlightLine(5); yield;
  
  logTrace(`[CALL] fruits_price(10, 5)`);
  const box = createBox(window.innerWidth/2 - 120, window.innerHeight/2 - 90, 'def fruits_price()');
  gsap.from(box, {y: window.innerHeight, opacity: 0, duration: 0.5, ease: 'back.out(1.5)'});
  playMachine(); yield;
  
  // Throw args
  const arg1 = document.createElement('div'); arg1.className = 'falling-arg'; arg1.innerHTML = '🍎x10';
  const arg2 = document.createElement('div'); arg2.className = 'falling-arg'; arg2.innerHTML = '🍌x5';
  floor.appendChild(arg1); floor.appendChild(arg2);
  gsap.set(arg1, {x: window.innerWidth/2 - 100, y: -50});
  gsap.set(arg2, {x: window.innerWidth/2 + 20, y: -50});
  
  gsap.to(arg1, {y: window.innerHeight/2 - 20, duration: 0.5, ease: 'power2.in'});
  gsap.to(arg2, {y: window.innerHeight/2 - 20, duration: 0.5, delay: 0.2, ease: 'power2.in', onComplete: () => {
    arg1.remove(); arg2.remove();
    gsap.to(box, {x: "+=10", yoyo: true, repeat: 5, duration: 0.05});
    playMachine();
    highlightLine([1,2,3]);
    logTrace(`[CALC] 10*100 + 5*80 = 1400`);
    updateMemoryHUD(`total = 1400`);
  }});
  yield;
  
  // Return
  highlightLine(4);
  logTrace(`[RETURN] 1400`);
  const coin = document.createElement('div'); coin.className = 'return-coin'; coin.innerHTML = '1400';
  floor.appendChild(coin);
  gsap.set(coin, {x: window.innerWidth/2 - 40, y: window.innerHeight/2 + 50, scale: 0});
  gsap.to(coin, {y: window.innerHeight/2 + 150, scale: 1, duration: 0.5, ease: 'bounce.out', onComplete: playCoin});
  yield;
  
  highlightLine(6);
  logTrace(`[RESULT] price = 1400`, 'true');
  yield;
  highlightLine(null);
}

// Step 2: No Return
function* step2Generator() {
  clearFactory(); clearLog(); updateMemoryHUD(`Wait...`); highlightLine(6); yield;
  
  logTrace(`[CALL] fruits_price(10, 5)`);
  const box = createBox(window.innerWidth/2 - 120, window.innerHeight/2 - 90, 'def fruits_price()');
  gsap.from(box, {y: window.innerHeight, opacity: 0, duration: 0.5, ease: 'back.out(1.5)'});
  playMachine(); yield;
  
  const arg1 = document.createElement('div'); arg1.className = 'falling-arg'; arg1.innerHTML = '🍎x10';
  floor.appendChild(arg1);
  gsap.set(arg1, {x: window.innerWidth/2 - 50, y: -50});
  gsap.to(arg1, {y: window.innerHeight/2 - 20, duration: 0.5, ease: 'power2.in', onComplete: () => {
    arg1.remove();
    gsap.to(box, {x: "+=10", yoyo: true, repeat: 5, duration: 0.05});
    playMachine();
    highlightLine([1,2,3]);
    logTrace(`[CALC] 計算完了`);
  }});
  yield;
  
  highlightLine(4);
  logTrace(`[PRINT] 関数の中で直接出力`);
  const mouth = box.querySelector('.func-mouth');
  mouth.classList.add('talking');
  mouth.innerHTML = '合計1400円です!!';
  playBeep();
  
  // No coin
  updateMemoryHUD(`returnは無し<br>(None)`);
  yield;
  
  highlightLine(null);
  logTrace(`[END] 戻り値なしで終了`, 'warn');
  yield;
}

// Step 3: Triangle
function* step3Generator() {
  clearFactory(); clearLog(); updateMemoryHUD(`Wait...`); highlightLine(3); yield;
  
  logTrace(`[CALL] triangle(4, 5)`);
  const box = createBox(window.innerWidth/2 - 120, window.innerHeight/2 + 20, 'def triangle()');
  gsap.from(box, {scale: 0, duration: 0.5});
  playMachine(); yield;
  
  const svgDiv = document.createElement('div');
  svgDiv.className = 'svg-container';
  svgDiv.innerHTML = `<svg width="200" height="200" viewBox="0 0 100 100"><polygon class="triangle-polygon" points="10,90 90,90 50,10" /></svg>`;
  floor.appendChild(svgDiv);
  gsap.set(svgDiv, {x: window.innerWidth/2 - 100, y: window.innerHeight/2 - 220, opacity: 0});
  
  const label = document.createElement('div'); label.className = 'triangle-label'; label.innerHTML = 'a=4, b=5';
  svgDiv.appendChild(label);
  
  gsap.to(svgDiv, {opacity: 1, duration: 0.5});
  yield;
  
  highlightLine(1);
  logTrace(`[CALC] 4 * 5 / 2`);
  gsap.to(svgDiv, {y: window.innerHeight/2 - 150, scale: 0.5, duration: 0.5, ease: 'power2.in', onComplete: () => {
    playLaser();
    const laser = document.createElement('div'); laser.className = 'laser-cut';
    floor.appendChild(laser);
    gsap.set(laser, {x: window.innerWidth/2 - 100, y: window.innerHeight/2 - 50, width: 0});
    gsap.to(laser, {width: 200, duration: 0.3, onComplete: () => {
      svgDiv.innerHTML = '';
      laser.remove();
      const coin = document.createElement('div'); coin.className = 'return-coin'; coin.innerHTML = '10';
      floor.appendChild(coin);
      gsap.set(coin, {x: window.innerWidth/2 - 40, y: window.innerHeight/2 - 50, scale: 0});
      gsap.to(coin, {y: window.innerHeight/2 + 100, scale: 1, duration: 0.6, ease: 'bounce.out', onComplete: playCoin});
    }});
  }});
  yield;
  
  highlightLine(4);
  updateMemoryHUD(`ans = 10.0`);
  logTrace(`[RESULT] ans = 10.0`, 'true'); yield;
  highlightLine(null);
}

// Step 4: Recursion (Factorial)
function* step4Generator() {
  clearFactory(); clearLog(); updateMemoryHUD(`Wait...`); highlightLine(6); yield;
  
  logTrace(`[CALL] kaijou(4)`);
  let boxes = [];
  
  for(let i=4; i>=0; i--) {
    const size = 150 + i * 20;
    const box = createBox(window.innerWidth/2 - size/2, 100 + (4-i)*60, `kaijou(${i})`, 'recur');
    box.style.width = size + 'px'; box.style.height = size/1.5 + 'px';
    box.style.color = `hsl(${i*50}, 100%, 70%)`;
    boxes.push(box);
    
    gsap.from(box, {scale: 0, duration: 0.4, ease: 'back.out(2)'});
    playMachine();
    
    if(i > 0) {
      highlightLine(4);
      logTrace(`kaijou(${i}) => ${i} * kaijou(${i-1})`);
      updateMemoryHUD(`kaijou(${i-1})待ち...`);
      const formula = document.createElement('div');
      formula.innerHTML = `${i} * k(${i-1})`;
      box.querySelector('.recur-content').appendChild(formula);
      yield;
    } else {
      highlightLine(2);
      logTrace(`kaijou(0) => 1`, 'true');
      updateMemoryHUD(`ベースケース!`);
      const val = document.createElement('div'); val.innerHTML = '1';
      box.querySelector('.recur-content').appendChild(val);
      yield;
    }
  }
  
  // Unwind
  let currentVal = 1;
  for(let i=4; i>=1; i--) {
    const childBox = boxes[i];
    const parentBox = boxes[i-1];
    let n = 4 - i + 1; 
    let prevVal = currentVal;
    currentVal = n * prevVal;
    
    logTrace(`[RETURN] ${prevVal} を返す`);
    const targetY = gsap.getProperty(parentBox, "y") + 20;
    gsap.to(childBox, {y: targetY, scale: 0, opacity: 0, duration: 0.4});
    
    setTimeout(() => {
      playBeep();
      parentBox.querySelector('.recur-content').innerHTML = `${n} * ${prevVal} = ${currentVal}`;
    }, 400);
    yield;
  }
  
  highlightLine(6);
  logTrace(`[RESULT] 24`, 'true');
  updateMemoryHUD(`Result = 24`);
  yield;
  highlightLine(null);
}

// Step 5: Recursion (Combination)
function* step5Generator() {
  clearFactory(); clearLog(); updateMemoryHUD(`Wait...`); highlightLine(6); yield;
  
  logTrace(`[CALL] kumiawase(4, 2)`);
  
  const cells = [];
  function addCell(x, y, label, isBase=false) {
    const cell = document.createElement('div');
    cell.className = 'cell-node'; cell.innerHTML = label;
    if(isBase) cell.style.background = '#50fa7b';
    floor.appendChild(cell);
    gsap.set(cell, {x: x, y: y, scale: 0});
    gsap.to(cell, {scale: 1, duration: 0.4, ease: 'back.out(2)'});
    cells.push(cell);
    return cell;
  }
  
  // Simplified static tree for 4C2
  // k(4,2)
  const c42 = addCell(window.innerWidth/2 - 35, 100, 'k(4,2)'); playBeep(); yield;
  highlightLine(4); logTrace(`k(4,2) => k(3,2) + k(3,1)`);
  const c32 = addCell(window.innerWidth/2 - 140, 200, 'k(3,2)');
  const c31 = addCell(window.innerWidth/2 + 70, 200, 'k(3,1)'); playBeep(); yield;
  
  highlightLine(4); logTrace(`k(3,2) => k(2,2) + k(2,1)`);
  const c22 = addCell(window.innerWidth/2 - 230, 300, '1', true);
  const c21 = addCell(window.innerWidth/2 - 100, 300, 'k(2,1)'); playBeep(); yield;
  
  highlightLine(4); logTrace(`k(3,1) => k(2,1) + k(2,0)`);
  const c21b = addCell(window.innerWidth/2 + 30, 300, 'k(2,1)');
  const c20 = addCell(window.innerWidth/2 + 160, 300, '1', true); playBeep(); yield;
  
  logTrace(`細胞分裂が続く...`);
  // Just show bases for k(2,1) -> k(1,1)=1, k(1,0)=1
  const c11 = addCell(window.innerWidth/2 - 140, 400, '1', true);
  const c10 = addCell(window.innerWidth/2 - 60, 400, '1', true);
  const c11b = addCell(window.innerWidth/2 + 0, 400, '1', true);
  const c10b = addCell(window.innerWidth/2 + 80, 400, '1', true); playBeep(); yield;
  
  // Fusion
  highlightLine(2); logTrace(`ベースケース(1)が合体!`);
  gsap.to([c11, c10], {x: window.innerWidth/2 - 100, y: 300, opacity: 0, duration: 0.5});
  gsap.to([c11b, c10b], {x: window.innerWidth/2 + 30, y: 300, opacity: 0, duration: 0.5, onComplete: () => {
    c21.innerHTML = '2'; gsap.to(c21, {backgroundColor: '#f1fa8c', color: '#000', duration: 0.3});
    c21b.innerHTML = '2'; gsap.to(c21b, {backgroundColor: '#f1fa8c', color: '#000', duration: 0.3});
    playCoin();
  }}); yield;
  
  gsap.to([c22, c21], {x: window.innerWidth/2 - 140, y: 200, opacity: 0, duration: 0.5});
  gsap.to([c21b, c20], {x: window.innerWidth/2 + 70, y: 200, opacity: 0, duration: 0.5, onComplete: () => {
    c32.innerHTML = '3'; gsap.to(c32, {backgroundColor: '#f1fa8c', color: '#000', duration: 0.3});
    c31.innerHTML = '3'; gsap.to(c31, {backgroundColor: '#f1fa8c', color: '#000', duration: 0.3});
    playCoin();
  }}); yield;
  
  gsap.to([c32, c31], {x: window.innerWidth/2 - 35, y: 100, opacity: 0, duration: 0.5, onComplete: () => {
    c42.innerHTML = '6'; 
    gsap.to(c42, {scale: 1.5, backgroundColor: '#ff5555', color: '#fff', duration: 0.5});
    playCoin();
  }}); yield;
  
  highlightLine(6); logTrace(`[RESULT] 6`, 'true'); yield;
  highlightLine(null);
}

// Step 6: Recursion (God)
function* step6Generator() {
  clearFactory(); clearLog(); updateMemoryHUD(`Wait...`); highlightLine(7); yield;
  
  logTrace(`[CALL] god(1071, 1029)`);
  
  let blockA = document.createElement('div'); blockA.className = 'god-block';
  blockA.innerHTML = '1071'; blockA.style.width = '200px'; blockA.style.height = '150px';
  let blockB = document.createElement('div'); blockB.className = 'god-block';
  blockB.innerHTML = '1029'; blockB.style.width = '190px'; blockB.style.height = '140px';
  
  floor.appendChild(blockA); floor.appendChild(blockB);
  const startAx = window.innerWidth/2 - 250;
  const startAy = window.innerHeight/2 - 75;
  const startBx = window.innerWidth/2 + 50;
  const startBy = window.innerHeight/2 - 70;
  
  gsap.set(blockA, {x: startAx, y: startAy});
  gsap.set(blockB, {x: startBx, y: startBy});
  
  playGod(); yield;
  
  const theGod = document.createElement('div'); theGod.className = 'god-entity'; theGod.innerHTML = '👼';
  floor.appendChild(theGod);
  gsap.set(theGod, {x: window.innerWidth/2 - 60, y: 50, scale: 0});
  gsap.to(theGod, {scale: 1, duration: 0.5, ease: 'bounce.out'});
  
  logTrace(`[GOD] 裁きの時間です！`, 'warn'); yield;
  
  const steps = [
    {a: 1071, b: 1029, r: 42, smashes: 1, msg: "ドカーン！"},
    {a: 1029, b: 42, r: 21, smashes: 5, msg: "オラオラオラ！"},
    {a: 42, b: 21, r: 0, smashes: 2, msg: "ドカッ！ドカッ！"}
  ];
  
  for(let i=0; i<steps.length; i++) {
    const s = steps[i];
    highlightLine(4);
    logTrace(`[GOD] ${s.a} ÷ ${s.b} = 余り...？`);
    
    const tl = gsap.timeline();
    tl.to(theGod, {x: startBx, y: startBy - 100, duration: 0.2});
    
    setTimeout(() => {
      theGod.innerHTML = '👼🗯️' + s.msg;
      theGod.style.fontSize = '3rem';
      theGod.style.whiteSpace = 'nowrap';
    }, 200);
    
    for(let j=0; j<s.smashes; j++) {
       tl.to(blockB, {y: startBy - 50, x: startBx - 20, duration: 0.05, ease: 'power1.out'}, "+=0.05");
       tl.to(theGod, {y: startBy - 150, x: startBx - 20, duration: 0.05, ease: 'power1.out'}, "<");
       
       tl.to(blockB, {x: startAx + 100, y: startAy + 20, duration: 0.05, ease: 'power1.in'}, "+=0.02");
       tl.to(theGod, {x: startAx + 100, y: startAy - 80, duration: 0.05, ease: 'power1.in', 
         onComplete: () => {
           playCrunch();
           gsap.to(blockA, {x: "+=15", yoyo: true, repeat: 3, duration: 0.03});
         }
       }, "<");
    }
    
    tl.to(theGod, {x: window.innerWidth/2 - 60, y: 50, duration: 0.2, onComplete: () => {
      theGod.innerHTML = '👼'; 
      theGod.style.fontSize = '8rem';
    }}, "+=0.1");
    tl.to(blockB, {x: startBx, y: startBy, duration: 0.2}, "<");
    
    tl.to(blockA, {scale: 0.8, duration: 0.2, onComplete: () => {
       blockA.innerHTML = s.r;
       blockA.style.width = Math.max(80, s.r * 2) + 'px';
       gsap.to(blockA, {scale: 1, duration: 0.2, ease: 'bounce.out'});
       logTrace(`[GOD] 余り ${s.r} に削り取った！`, 'true');
    }});
    
    yield; 
    
    if(s.r !== 0) {
      highlightLine(6);
      logTrace(`[GOD] return god(${s.b}, ${s.r})`);
      
      gsap.to(blockB, {x: startAx, y: startAy, duration: 0.4});
      gsap.to(blockA, {x: startBx, y: startBy, duration: 0.4});
      
      const temp = blockA;
      blockA = blockB;
      blockB = temp;
      yield;
    } else {
      gsap.to(blockA, {scale: 0, opacity: 0, duration: 0.5});
    }
  }
  
  highlightLine(2);
  logTrace(`[GOD] 余りが0！ ${steps[2].b} が最大公約数！`, 'warn');
  gsap.to(blockB, {x: window.innerWidth/2 - 95, y: window.innerHeight/2 - 70, scale: 1.5, borderColor: '#50fa7b', color: '#50fa7b', duration: 0.5});
  playCoin();
  updateMemoryHUD(`GCD = 21`);
  yield;
  
  highlightLine(null);
}

// Controller
function triggerStep(stepNum, isAuto) {
  if (!currentLoopState || currentLoopState.step !== stepNum) {
    cancelAuto();
    const generators = [step1Generator, step2Generator, step3Generator, step4Generator, step5Generator, step6Generator];
    currentLoopState = { step: stepNum, gen: generators[stepNum-1]() };
  }
  
  if (isAuto) {
    cancelAuto();
    autoInterval = setInterval(() => {
      const res = currentLoopState.gen.next();
      if(res.done) cancelAuto();
    }, 1000);
  } else {
    cancelAuto();
    currentLoopState.gen.next();
  }
}

updateStep();
