(() => {
  'use strict';

  const root = document.querySelector('.page-calculatrice_generale');
  if (!root) return;

  const mathReady = new Promise((resolve, reject) => {
    if (window.math) { resolve(window.math); return; }
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/mathjs@14.0.1/lib/browser/math.js';
    script.onload = () => window.math ? resolve(window.math) : reject(new Error('Le moteur mathématique n’a pas pu démarrer.'));
    script.onerror = () => reject(new Error('Impossible de charger mathjs. Vérifiez la connexion internet.'));
    document.head.appendChild(script);
  });

  fetch('clagen.html')
    .then(response => {
      if (!response.ok) throw new Error(`Impossible de charger clagen.html (${response.status}).`);
      return response.text();
    })
    .then(html => {
      root.innerHTML = html;
      initialize(mathReady);
    })
    .catch(error => {
      root.innerHTML = `<p class="calgen-output">${error.message}</p>`;
    });

  function initialize(enginePromise) {
    const $ = selector => root.querySelector(selector);
    const status = $('#calgenStatus');
    const savedState = loadState();
    restoreState(savedState);
    enginePromise.then(() => {
      status.textContent = 'Moteur prêt';
      status.classList.add('is-ready');
    }).catch(error => showError(error.message));

    root.querySelectorAll('.calgen-tab').forEach(tab => tab.addEventListener('click', () => {
      root.querySelectorAll('.calgen-tab').forEach(item => item.classList.toggle('is-active', item === tab));
      root.querySelectorAll('.calgen-panel').forEach(panel => {
        const active = panel.id === tab.dataset.panel;
        panel.hidden = !active;
        panel.classList.toggle('is-visible', active);
      });
      saveState({ activePanel: tab.dataset.panel });
      if (tab.dataset.panel === 'graphPanel' && $('#functionGraph').dataset.drawn === 'true') drawGraph();
    }));

    root.addEventListener('input', persistFormState);
    root.addEventListener('change', persistFormState);

    $('#evaluateExpression').addEventListener('click', () => run(() => {
      const expression = $('#expressionInput').value.trim();
      const xText = $('#expressionX').value.trim();
      const scope = xText === '' ? {} : { x: number(xText, 'La valeur de x') };
      const result = math.evaluate(expression, scope);
      return `<span class="calgen-output__value">${format(result)}</span><span class="calgen-output__formula">${escapeHtml(expression)}</span>`;
    }, '#expressionOutput'));

    $('#calculateDerivative').addEventListener('click', () => run(() => {
      const expression = $('#derivativeExpression').value.trim();
      const variable = identifier($('#derivativeVariable').value, 'La variable');
      const order = integer($('#derivativeOrder').value, 1, 12, 'L’ordre');
      let node = math.parse(expression);
      for (let index = 0; index < order; index += 1) node = math.derivative(node, variable);
      return `<span class="calgen-output__value">d^${order}f / d${variable}^${order} = ${escapeHtml(node.toString())}</span>`;
    }, '#derivativeOutput'));

    $('#calculateLimit').addEventListener('click', () => run(() => calculateLimit(), '#limitOutput'));
    $('#calculateIntegral').addEventListener('click', () => run(() => calculateIntegral(), '#integralOutput'));
    $('#calculatePrimitive').addEventListener('click', () => run(() => calculatePrimitive(), '#primitiveOutput'));
    $('#drawGraph').addEventListener('click', () => run(() => { drawGraph(); return 'Courbe tracée.'; }, '#graphPanel .calgen-help'));
    $('#calculateProbability').addEventListener('click', () => run(() => calculateProbability(), '#probabilityOutput'));
    $('#probabilityModel').addEventListener('change', updateProbabilityFields);
    updateProbabilityFields();
    if (savedState.activePanel) {
      const savedTab = root.querySelector(`[data-panel="${savedState.activePanel}"]`);
      if (savedTab) {
        savedTab.click();
        if (savedState.activePanel === 'graphPanel' && savedState.values && savedState.values.graphExpression) {
          mathReady.then(() => { try { drawGraph(); } catch {} });
        }
      }
    }
  }

  const CALGEN_STORAGE_KEY = 'docs2025.calculatriceGenerale';

  function loadState() {
    try { return JSON.parse(localStorage.getItem(CALGEN_STORAGE_KEY) || '{}'); } catch { return {}; }
  }

  function saveState(changes = {}) {
    const state = loadState();
    Object.assign(state, changes);
    localStorage.setItem(CALGEN_STORAGE_KEY, JSON.stringify(state));
  }

  function persistFormState() {
    const values = {};
    root.querySelectorAll('input, select, textarea').forEach(field => {
      if (field.id) values[field.id] = field.value;
    });
    const outputs = {};
    root.querySelectorAll('.calgen-output').forEach(output => {
      if (output.id) outputs[output.id] = output.innerHTML;
    });
    saveState({ values, outputs });
  }

  function restoreState(state) {
    Object.entries(state.values || {}).forEach(([id, value]) => {
      const field = root.querySelector(`#${id}`);
      if (field) field.value = value;
    });
    Object.entries(state.outputs || {}).forEach(([id, html]) => {
      const output = root.querySelector(`#${id}`);
      if (output) output.innerHTML = html;
    });
  }

  function run(action, outputSelector) {
    mathReady.then(() => {
      try {
        const output = root.querySelector(outputSelector);
        output.innerHTML = action();
        output.classList.remove('calgen-error');
        persistFormState();
      } catch (error) { showError(error.message); }
    }).catch(error => showError(error.message));
  }

  function calculateLimit() {
    const expression = root.querySelector('#limitExpression').value.trim();
    const variable = identifier(root.querySelector('#limitVariable').value, 'La variable');
    const pointText = root.querySelector('#limitPoint').value.trim().toLowerCase();
    const direction = root.querySelector('#limitDirection').value;
    const point = pointText === 'inf' || pointText === '+inf' ? Infinity : pointText === '-inf' ? -Infinity : number(pointText, 'Le point');
    const numerator = root.querySelector('#limitNumerator').value.trim();
    const denominator = root.querySelector('#limitDenominator').value.trim();
    let result = numericalLimit(expression, variable, point, direction);
    let method = 'Évaluation numérique autour du point';

    if ((!Number.isFinite(result) || Number.isNaN(result)) && numerator && denominator && Number.isFinite(point)) {
      let currentNumerator = numerator;
      let currentDenominator = denominator;
      for (let order = 1; order <= 8; order += 1) {
        currentNumerator = math.derivative(currentNumerator, variable).toString();
        currentDenominator = math.derivative(currentDenominator, variable).toString();
        const value = numericalLimit(`(${currentNumerator}) / (${currentDenominator})`, variable, point, direction);
        if (Number.isFinite(value)) { result = value; method = `Règle de l’Hôpital appliquée ${order} fois`; break; }
      }
    }
    if (Number.isNaN(result)) throw new Error('La limite n’a pas pu être déterminée. Essayez de fournir le numérateur et le dénominateur pour appliquer l’Hôpital.');
    return `<span class="calgen-output__value">lim ${variable}→${escapeHtml(pointText)} ${escapeHtml(expression)} = ${format(result)}</span><span class="calgen-output__formula">${method}</span>`;
  }

  function numericalLimit(expression, variable, point, direction) {
    if (point === Infinity || point === -Infinity) {
      const signs = point === Infinity ? [1] : [-1];
      return evaluateNear(expression, variable, signs[0] * 1e6);
    }
    const sides = direction === 'both' ? [-1, 1] : [direction === '-' ? -1 : 1];
    const values = sides.map(side => {
      const samples = [1e-2, 1e-3, 1e-4, 1e-5, 1e-6, 1e-7];
      const valid = samples.map(step => evaluateNear(expression, variable, point + side * step)).filter(Number.isFinite);
      return valid[valid.length - 1];
    });
    if (values.some(value => value === undefined)) return NaN;
    if (values.length === 2 && Math.abs(values[0] - values[1]) > Math.max(1e-5, Math.abs(values[0]) * 1e-3)) return NaN;
    return values.reduce((sum, value) => sum + value, 0) / values.length;
  }

  function evaluateNear(expression, variable, value) {
    try { return Number(math.evaluate(expression, { [variable]: value })); } catch { return NaN; }
  }

  function calculateIntegral() {
    const expression = root.querySelector('#integralExpression').value.trim();
    const variable = identifier(root.querySelector('#integralVariable').value, 'La variable');
    const start = number(root.querySelector('#integralStart').value, 'La borne a');
    const end = number(root.querySelector('#integralEnd').value, 'La borne b');
    const value = simpson(expression, variable, start, end);
    const u = root.querySelector('#partsU').value.trim();
    const dv = root.querySelector('#partsDv').value.trim();
    let details = 'Méthode de Simpson adaptative numérique.';
    if (u && dv) details = `Par parties : ∫u·dv = u·v - ∫v·du. Ici u = ${escapeHtml(u)} et dv = ${escapeHtml(dv)}. La valeur est évaluée numériquement.`;
    return `<span class="calgen-output__value">∫[${format(start)}, ${format(end)}] ${escapeHtml(expression)} d${variable} = ${format(value)}</span><span class="calgen-output__formula">${details}</span>`;
  }

  function simpson(expression, variable, start, end) {
    const intervals = 2000;
    const step = (end - start) / intervals;
    let sum = 0;
    for (let index = 0; index <= intervals; index += 1) {
      const value = evaluateNear(expression, variable, start + index * step);
      if (!Number.isFinite(value)) throw new Error('La fonction n’est pas définie sur tout l’intervalle.');
      sum += (index === 0 || index === intervals ? 1 : index % 2 === 0 ? 2 : 4) * value;
    }
    return (step / 3) * sum;
  }

  function calculatePrimitive() {
    const expression = root.querySelector('#primitiveExpression').value.trim();
    const variable = identifier(root.querySelector('#primitiveVariable').value, 'La variable');
    const constant = root.querySelector('#primitiveConstant').value.trim() || 'C';
    const primitive = integrateNode(math.parse(expression), variable);
    if (!primitive) throw new Error('Cette primitive ne peut pas être simplifiée automatiquement. Décomposez l’expression en fonctions usuelles.');
    const simplified = math.simplify(primitive).toString();
    return `<span class="calgen-output__value">∫ ${escapeHtml(expression)} d${variable} = ${escapeHtml(simplified)} + ${escapeHtml(constant)}</span><span class="calgen-output__formula">Vérification : dF/d${variable} = ${escapeHtml(math.derivative(simplified, variable).toString())}</span>`;
  }

  function integrateNode(node, variable) {
    if (node.type === 'ParenthesisNode') return integrateNode(node.content, variable);
    if (node.type === 'ConstantNode' || (node.type === 'SymbolNode' && node.name !== variable)) return `(${node.toString()}) * ${variable}`;
    if (node.type === 'SymbolNode' && node.name === variable) return `${variable}^2 / 2`;
    if (node.type === 'OperatorNode') {
      const parts = node.args.map(argument => integrateNode(argument, variable));
      if (node.op === '+' || node.op === '-') return parts.every(Boolean) ? `(${parts[0]}) ${node.op} (${parts[1]})` : null;
      if (node.op === '*') {
        if (isIndependent(node.args[0], variable) && parts[1]) return `(${node.args[0].toString()}) * (${parts[1]})`;
        if (isIndependent(node.args[1], variable) && parts[0]) return `(${node.args[1].toString()}) * (${parts[0]})`;
      }
      if (node.op === '/' && isIndependent(node.args[1], variable) && parts[0]) return `(${parts[0]}) / (${node.args[1].toString()})`;
      if (node.op === '^' && node.args[0].toString() === variable && isIndependent(node.args[1], variable)) {
        const exponent = Number(node.args[1].value);
        if (Number.isFinite(exponent) && exponent !== -1) return `${variable}^(${exponent + 1}) / ${exponent + 1}`;
        if (exponent === -1) return `log(abs(${variable}))`;
      }
    }
    if (node.type === 'FunctionNode' && node.args.length === 1 && node.args[0].toString() === variable) {
      if (node.fn.name === 'sin') return `-cos(${variable})`;
      if (node.fn.name === 'cos') return `sin(${variable})`;
      if (node.fn.name === 'exp') return `exp(${variable})`;
      if (node.fn.name === 'log') return `${variable} * log(${variable}) - ${variable}`;
    }
    return null;
  }

  function isIndependent(node, variable) {
    try { return math.simplify(math.derivative(node, variable)).toString() === '0'; } catch { return false; }
  }

  function calculateProbability() {
    const model = root.querySelector('#probabilityModel').value;
    if (model === 'combinatorics') return calculateCombinatorics();
    if (model === 'binomial') return calculateBinomial();
    if (model === 'poisson') return calculatePoisson();
    if (model === 'geometric') return calculateGeometric();
    if (model === 'hypergeometric') return calculateHypergeometric();
    if (model === 'normal') return calculateNormal();
    if (model === 'bayes') return calculateBayes();
    return calculateStatistics();
  }

  function updateProbabilityFields() {
    const model = root.querySelector('#probabilityModel').value;
    const groups = {
      combinatorics: ['probNField', 'probKField'],
      binomial: ['probNField', 'probKField', 'probPField'],
      poisson: ['probKField', 'probLambdaField'],
      geometric: ['probKField', 'probPField'],
      hypergeometric: ['probSuccessField', 'probTotalField', 'probDrawField', 'probKField'],
      normal: ['probKField', 'probMeanField', 'probStdField'],
      bayes: ['probPaField', 'probBGivenAField', 'probBGivenNotAField'],
      statistics: ['probDataField']
    };
    const active = groups[model] || [];
    root.querySelectorAll('#probabilityFields label').forEach(field => field.classList.toggle('probability-hidden', !active.includes(field.id)));
    root.querySelector('#probabilityQuery').classList.toggle('probability-hidden', model === 'combinatorics' || model === 'bayes' || model === 'statistics');
  }

  function calculateCombinatorics() {
    const n = whole('#probN', 'n'); const k = whole('#probK', 'k');
    if (k > n) throw new Error('k doit être inférieur ou égal à n.');
    const arrangements = factorial(n) / factorial(n - k);
    const combinations = choose(n, k);
    return probabilityResult(`C(${n}, ${k}) = ${format(combinations)}`, `Arrangements A(${n}, ${k}) = ${format(arrangements)} · Permutations n! = ${format(factorial(n))}`);
  }

  function calculateBinomial() {
    const n = whole('#probN', 'n'); const k = whole('#probK', 'k'); const p = probability('#probP', 'p');
    if (k > n) throw new Error('k doit être inférieur ou égal à n.');
    const query = root.querySelector('#probabilityQuery').value;
    const value = query === 'exact' ? binomialPMF(n, k, p) : query === 'atMost' ? sum(k + 1, index => binomialPMF(n, index, p)) : sum(n - k, index => binomialPMF(n, k + index, p));
    return probabilityResult(`P(X ${query === 'exact' ? '=' : query === 'atMost' ? '≤' : '≥'} ${k}) = ${format(value)}`, `Loi binomiale B(${n}, ${format(p)}) · ${percentage(value)}`);
  }

  function calculatePoisson() {
    const k = whole('#probK', 'k'); const lambda = positive('#probLambda', 'λ'); const query = root.querySelector('#probabilityQuery').value;
    const value = query === 'exact' ? poissonPMF(k, lambda) : query === 'atMost' ? sum(k + 1, index => poissonPMF(index, lambda)) : 1 - sum(k, index => poissonPMF(index, lambda));
    return probabilityResult(`P(X ${query === 'exact' ? '=' : query === 'atMost' ? '≤' : '≥'} ${k}) = ${format(value)}`, `Loi de Poisson λ = ${format(lambda)} · ${percentage(value)}`);
  }

  function calculateGeometric() {
    const k = whole('#probK', 'k'); if (k < 1) throw new Error('Pour une loi géométrique, k doit être au moins égal à 1.');
    const p = probability('#probP', 'p'); const query = root.querySelector('#probabilityQuery').value;
    const value = query === 'exact' ? (1 - p) ** (k - 1) * p : query === 'atMost' ? 1 - (1 - p) ** k : (1 - p) ** (k - 1);
    return probabilityResult(`P(X ${query === 'exact' ? '=' : query === 'atMost' ? '≤' : '≥'} ${k}) = ${format(value)}`, `Loi géométrique p = ${format(p)} · ${percentage(value)}`);
  }

  function calculateHypergeometric() {
    const population = whole('#probTotal', 'N'); const successes = whole('#probSuccess', 'K'); const draws = whole('#probDraw', 'n'); const k = whole('#probK', 'k');
    if (successes > population || draws > population || k > draws || k > successes || draws - k > population - successes) throw new Error('Les paramètres hypergéométriques sont incompatibles.');
    const query = root.querySelector('#probabilityQuery').value;
    const pmf = index => choose(successes, index) * choose(population - successes, draws - index) / choose(population, draws);
    const value = query === 'exact' ? pmf(k) : query === 'atMost' ? sum(k + 1, index => index <= successes && draws - index <= population - successes ? pmf(index) : 0) : 1 - sum(k, index => index <= successes && draws - index <= population - successes ? pmf(index) : 0);
    return probabilityResult(`P(X ${query === 'exact' ? '=' : query === 'atMost' ? '≤' : '≥'} ${k}) = ${format(value)}`, `Population N = ${population}, succès K = ${successes}, tirages n = ${draws} · ${percentage(value)}`);
  }

  function calculateNormal() {
    const x = numeric('#probK', 'x'); const mean = numeric('#probMean', 'μ'); const std = positive('#probStd', 'σ'); const query = root.querySelector('#probabilityQuery').value;
    const z = (x - mean) / std; const value = query === 'exact' ? Math.exp(-z * z / 2) / (std * Math.sqrt(2 * Math.PI)) : query === 'atMost' ? normalCDF(z) : 1 - normalCDF(z);
    return probabilityResult(`${query === 'exact' ? 'Densité f(x)' : `P(X ${query === 'atMost' ? '≤' : '≥'} ${format(x)})`} = ${format(value)}`, `Loi normale N(${format(mean)}, ${format(std)}²) · z = ${format(z)} · ${query === 'exact' ? 'densité' : percentage(value)}`);
  }

  function calculateBayes() {
    const pa = probability('#probPa', 'P(A)'); const pba = probability('#probBGivenA', 'P(B|A)'); const pbna = probability('#probBGivenNotA', 'P(B|non A)');
    const probabilityB = pba * pa + pbna * (1 - pa); const posterior = pba * pa / probabilityB;
    return probabilityResult(`P(A|B) = ${format(posterior)}`, `P(B) = P(B|A)P(A) + P(B|non A)P(non A) = ${format(probabilityB)} · ${percentage(posterior)}`);
  }

  function calculateStatistics() {
    const values = root.querySelector('#probData').value.split(',').map(value => Number.parseFloat(value.trim())).filter(Number.isFinite);
    if (!values.length) throw new Error('Entrez au moins une donnée numérique.');
    const mean = values.reduce((total, value) => total + value, 0) / values.length;
    const variance = values.reduce((total, value) => total + (value - mean) ** 2, 0) / values.length;
    const sorted = values.slice().sort((a, b) => a - b); const middle = Math.floor(sorted.length / 2); const median = sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
    return probabilityResult(`Moyenne = ${format(mean)} · Médiane = ${format(median)}`, `n = ${values.length} · Variance = ${format(variance)} · Écart-type = ${format(Math.sqrt(variance))} · Min = ${format(sorted[0])} · Max = ${format(sorted[sorted.length - 1])}`);
  }

  function factorial(value) { let result = 1; for (let index = 2; index <= value; index += 1) result *= index; return result; }
  function choose(n, k) { if (k < 0 || k > n) return 0; const reduced = Math.min(k, n - k); let result = 1; for (let index = 1; index <= reduced; index += 1) result = result * (n - reduced + index) / index; return result; }
  function binomialPMF(n, k, p) { return choose(n, k) * p ** k * (1 - p) ** (n - k); }
  function poissonPMF(k, lambda) { return Math.exp(-lambda) * lambda ** k / factorial(k); }
  function sum(count, callback) { let result = 0; for (let index = 0; index < count; index += 1) result += callback(index); return result; }
  function normalCDF(value) { return (1 + erf(value / Math.sqrt(2))) / 2; }
  function erf(value) { const sign = value < 0 ? -1 : 1; const absolute = Math.abs(value); const t = 1 / (1 + .3275911 * absolute); const polynomial = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - .284496736) * t + .254829592) * t * Math.exp(-absolute * absolute); return sign * polynomial; }
  function numeric(id, label) { return number(root.querySelector(id).value, label); }
  function whole(id, label) { const value = Number.parseInt(root.querySelector(id).value, 10); if (!Number.isInteger(value) || value < 0 || value > 170) throw new Error(`${label} doit être un entier entre 0 et 170.`); return value; }
  function positive(id, label) { const value = numeric(id, label); if (value <= 0) throw new Error(`${label} doit être strictement positif.`); return value; }
  function probability(id, label) { const value = numeric(id, label); if (value < 0 || value > 1) throw new Error(`${label} doit être compris entre 0 et 1.`); return value; }
  function percentage(value) { return `${format(value * 100)} %`; }
  function probabilityResult(value, details) { return `<span class="calgen-output__value">${escapeHtml(value)}</span><span class="calgen-output__formula">${escapeHtml(details)}</span>`; }

  function drawGraph() {
    const canvas = root.querySelector('#functionGraph');
    const context = canvas.getContext('2d');
    const expression = root.querySelector('#graphExpression').value.trim();
    const min = number(root.querySelector('#graphMin').value, 'x min');
    const max = number(root.querySelector('#graphMax').value, 'x max');
    if (!(max > min)) throw new Error('x max doit être supérieur à x min.');
    const width = canvas.width; const height = canvas.height; const padding = 42;
    const points = [];
    for (let index = 0; index <= 700; index += 1) {
      const x = min + (max - min) * index / 700;
      const y = evaluateNear(expression, 'x', x);
      if (Number.isFinite(y)) points.push({ x, y });
    }
    if (points.length < 2) throw new Error('Impossible de tracer cette fonction sur l’intervalle.');
    const autoY = root.querySelector('#graphAutoY').value === 'yes';
    let yMin = autoY ? Math.min(...points.map(point => point.y)) : -10;
    let yMax = autoY ? Math.max(...points.map(point => point.y)) : 10;
    if (yMin === yMax) { yMin -= 1; yMax += 1; }
    const yMargin = (yMax - yMin) * .1; yMin -= yMargin; yMax += yMargin;
    const remarkable = analyzeCurve(expression, min, max, points);
    const toCanvasX = x => padding + (x - min) / (max - min) * (width - padding * 2);
    const toCanvasY = y => height - padding - (y - yMin) / (yMax - yMin) * (height - padding * 2);
    context.clearRect(0, 0, width, height);
    context.fillStyle = getComputedStyle(root.querySelector('.general-calculator')).getPropertyValue('--calgen-panel');
    context.fillRect(0, 0, width, height);
    context.strokeStyle = '#b9c6d4'; context.lineWidth = 1; context.beginPath();
    if (min <= 0 && max >= 0) { const x = toCanvasX(0); context.moveTo(x, padding); context.lineTo(x, height - padding); }
    if (yMin <= 0 && yMax >= 0) { const y = toCanvasY(0); context.moveTo(padding, y); context.lineTo(width - padding, y); }
    context.stroke();
    context.strokeStyle = '#0f766e'; context.lineWidth = 3; context.beginPath();
    points.forEach((point, index) => { const x = toCanvasX(point.x); const y = toCanvasY(point.y); if (index === 0) context.moveTo(x, y); else context.lineTo(x, y); });
    context.stroke();
    drawMarkers(context, remarkable, toCanvasX, toCanvasY);
    context.fillStyle = getComputedStyle(root.querySelector('.general-calculator')).getPropertyValue('--calgen-muted');
    context.font = '14px sans-serif'; context.fillText(`x: [${format(min)}, ${format(max)}]`, padding, height - 12); context.fillText(`y: [${format(yMin)}, ${format(yMax)}]`, padding, 20);
    root.querySelector('#graphPoints').innerHTML = renderCurvePoints(remarkable);
    canvas.dataset.drawn = 'true';
  }

  function analyzeCurve(expression, min, max, points) {
    const zeros = [];
    const extrema = [];
    const inflections = [];
    for (let index = 1; index < points.length; index += 1) {
      const previous = points[index - 1]; const current = points[index];
      if (previous.y === 0 || previous.y * current.y < 0) {
        const zero = previous.y === 0 ? previous.x : bisectZero(expression, previous.x, current.x);
        addUnique(zeros, { x: zero, y: 0 });
      }
    }
    for (let index = 1; index < points.length - 1; index += 1) {
      const before = points[index - 1]; const current = points[index]; const after = points[index + 1];
      if (current.y > before.y && current.y >= after.y) addUnique(extrema, { type: 'maximum local', x: current.x, y: current.y });
      if (current.y < before.y && current.y <= after.y) addUnique(extrema, { type: 'minimum local', x: current.x, y: current.y });
      const curvatureBefore = current.y - before.y;
      const curvatureAfter = after.y - current.y;
      if (curvatureBefore * curvatureAfter < 0) addUnique(inflections, { x: current.x, y: current.y });
    }
    const maximum = points.reduce((best, point) => point.y > best.y ? point : best, points[0]);
    const minimum = points.reduce((best, point) => point.y < best.y ? point : best, points[0]);
    const yIntercept = min <= 0 && max >= 0 ? points.reduce((best, point) => Math.abs(point.x) < Math.abs(best.x) ? point : best, points[0]) : null;
    return { zeros: zeros.slice(0, 30), extrema: extrema.slice(0, 30), inflections: inflections.slice(0, 30), maximum, minimum, yIntercept, bounds: { min, max } };
  }

  function bisectZero(expression, left, right) {
    let leftValue = evaluateNear(expression, 'x', left);
    for (let iteration = 0; iteration < 45; iteration += 1) {
      const middle = (left + right) / 2; const middleValue = evaluateNear(expression, 'x', middle);
      if (!Number.isFinite(middleValue) || Math.abs(middleValue) < 1e-9) return middle;
      if (leftValue * middleValue <= 0) right = middle;
      else { left = middle; leftValue = middleValue; }
    }
    return (left + right) / 2;
  }

  function addUnique(items, point) {
    if (!items.some(item => Math.abs(item.x - point.x) < 1e-3)) items.push(point);
  }

  function drawMarkers(context, data, toCanvasX, toCanvasY) {
    data.zeros.concat(data.extrema, data.inflections, [data.maximum, data.minimum], data.yIntercept ? [data.yIntercept] : []).forEach(point => {
      context.fillStyle = point.type === 'maximum local' || point === data.maximum ? '#c2410c' : point.type === 'minimum local' || point === data.minimum ? '#2563eb' : point.type ? '#0891b2' : '#7c3aed';
      context.beginPath(); context.arc(toCanvasX(point.x), toCanvasY(point.y), 5, 0, Math.PI * 2); context.fill();
    });
  }

  function renderCurvePoints(data) {
    const list = points => points.length ? `<ul>${points.map(point => `<li>x = <strong>${format(point.x)}</strong>, y = <strong>${format(point.y)}</strong></li>`).join('')}</ul>` : '<p>Aucun point détecté sur cet intervalle.</p>';
    const intercept = data.yIntercept ? `<li>Axe des ordonnées : (0 ; ${format(data.yIntercept.y)})</li>` : '<li>Hors intervalle</li>';
    return `<div class="calgen-points"><h4>Points remarquables</h4><div><strong>Zéros</strong>${list(data.zeros)}</div><div><strong>Extrema locaux</strong>${data.extrema.length ? `<ul>${data.extrema.map(point => `<li>${point.type} : (${format(point.x)} ; ${format(point.y)})</li>`).join('')}</ul>` : '<p>Aucun extremum local détecté.</p>'}</div><div><strong>Inflexions</strong>${list(data.inflections)}</div><div><strong>Valeurs globales visibles</strong><ul><li>Maximum : (${format(data.maximum.x)} ; ${format(data.maximum.y)})</li><li>Minimum : (${format(data.minimum.x)} ; ${format(data.minimum.y)})</li>${intercept}</ul></div></div>`;
  }

  function integer(value, min, max, label) { const parsed = Number.parseInt(value, 10); if (!Number.isInteger(parsed) || parsed < min || parsed > max) throw new Error(`${label} doit être compris entre ${min} et ${max}.`); return parsed; }
  function number(value, label) { const parsed = Number.parseFloat(String(value).replace(',', '.')); if (!Number.isFinite(parsed)) throw new Error(`${label} doit être un nombre.`); return parsed; }
  function identifier(value, label) { const clean = value.trim(); if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(clean)) throw new Error(`${label} est invalide.`); return clean; }
  function format(value) { if (value && typeof value.toString === 'function' && typeof value !== 'number') return escapeHtml(value.toString()); const rounded = Math.abs(value) < 1e-10 ? 0 : Number(Number(value).toFixed(10)); return escapeHtml(String(rounded)); }
  function escapeHtml(value) { return String(value).replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[character])); }
  function showError(message) { const toast = root.querySelector('#calgenError'); if (!toast) return; toast.textContent = message; toast.hidden = false; window.setTimeout(() => { toast.hidden = true; }, 6000); }
})();
