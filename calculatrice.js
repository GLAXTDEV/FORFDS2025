(() => {
	'use strict';

	const root = document.querySelector('.page-calcul_matrice');
	if (!root) return;

	function dimension(id) {
		return Math.max(1, Math.min(12, Number.parseInt(root.querySelector(id).value, 10) || 1));
	}

	function buildMatrix(target, rows, cols) {
		const grid = root.querySelector(target);
		grid.replaceChildren();
		grid.style.gridTemplateColumns = `repeat(${cols}, 78px)`;
		for (let row = 0; row < rows; row += 1) {
			for (let col = 0; col < cols; col += 1) {
				const input = document.createElement('input');
				input.type = 'number';
				input.step = 'any';
				input.value = '0';
				input.dataset.row = String(row);
				input.dataset.col = String(col);
				input.setAttribute('aria-label', `Ligne ${row + 1}, colonne ${col + 1}`);
				grid.appendChild(input);
			}
		}
	}

	function readMatrix(target, rows, cols) {
		const inputs = [...root.querySelector(target).querySelectorAll('input')];
		return Array.from({ length: rows }, (_, row) => Array.from({ length: cols }, (_, col) => {
			const input = inputs.find(cell => Number(cell.dataset.row) === row && Number(cell.dataset.col) === col);
			const value = Number.parseFloat(input.value.replace(',', '.'));
			return Number.isFinite(value) ? value : 0;
		}));
	}

	function refreshMatrices(clear = false) {
		const state = clear ? {} : loadState();
		buildMatrix('#matrixA', dimension('#matrixRowsA'), dimension('#matrixColsA'));
		buildMatrix('#matrixB', dimension('#matrixRowsB'), dimension('#matrixColsB'));
		restoreMatrix('#matrixA', state.matrixA);
		restoreMatrix('#matrixB', state.matrixB);
		const result = root.querySelector('#matrixResult');
		if (!state.result) {
			result.className = 'matrix-calculator__message';
			result.textContent = 'Vos matrices sont prêtes à être calculées.';
		} else {
			result.className = state.result.className || 'matrix-calculator__message';
			result.innerHTML = state.result.html;
		}
	}

	const MATRIX_STORAGE_KEY = 'docs2025.calculatriceMatrice';

	function loadState() {
		try { return JSON.parse(localStorage.getItem(MATRIX_STORAGE_KEY) || '{}'); } catch { return {}; }
	}

	function saveState() {
		const state = loadState();
		state.values = {};
		root.querySelectorAll('input, select').forEach(field => {
			if (field.id) state.values[field.id] = field.value;
		});
		state.matrixA = readMatrix('#matrixA', dimension('#matrixRowsA'), dimension('#matrixColsA'));
		state.matrixB = readMatrix('#matrixB', dimension('#matrixRowsB'), dimension('#matrixColsB'));
		const result = root.querySelector('#matrixResult');
		state.result = { className: result.className, html: result.innerHTML };
		localStorage.setItem(MATRIX_STORAGE_KEY, JSON.stringify(state));
	}

	function restoreMatrix(target, matrix) {
		if (!Array.isArray(matrix)) return;
		root.querySelector(target).querySelectorAll('input').forEach(input => {
			const row = Number(input.dataset.row); const col = Number(input.dataset.col);
			if (matrix[row] && Number.isFinite(matrix[row][col])) input.value = matrix[row][col];
		});
	}

	function restoreState() {
		const state = loadState();
		Object.entries(state.values || {}).forEach(([id, value]) => {
			const field = root.querySelector(`#${id}`);
			if (field) field.value = value;
		});
	}

	function transpose(matrix) { return matrix[0].map((_, col) => matrix.map(row => row[col])); }

	function determinant(matrix) {
		const size = matrix.length;
		const work = matrix.map(row => row.slice());
		let result = 1;
		for (let col = 0; col < size; col += 1) {
			let pivot = col;
			for (let row = col + 1; row < size; row += 1) if (Math.abs(work[row][col]) > Math.abs(work[pivot][col])) pivot = row;
			if (Math.abs(work[pivot][col]) < 1e-12) return 0;
			if (pivot !== col) { [work[pivot], work[col]] = [work[col], work[pivot]]; result *= -1; }
			result *= work[col][col];
			for (let row = col + 1; row < size; row += 1) {
				const factor = work[row][col] / work[col][col];
				for (let index = col + 1; index < size; index += 1) work[row][index] -= factor * work[col][index];
			}
		}
		return result;
	}

	function inverse(matrix) {
		const size = matrix.length;
		const work = matrix.map((row, rowIndex) => row.concat(Array.from({ length: size }, (_, col) => rowIndex === col ? 1 : 0)));
		for (let col = 0; col < size; col += 1) {
			let pivot = col;
			for (let row = col + 1; row < size; row += 1) if (Math.abs(work[row][col]) > Math.abs(work[pivot][col])) pivot = row;
			if (Math.abs(work[pivot][col]) < 1e-12) return null;
			[work[pivot], work[col]] = [work[col], work[pivot]];
			const divisor = work[col][col];
			work[col] = work[col].map(value => value / divisor);
			for (let row = 0; row < size; row += 1) {
				if (row === col) continue;
				const factor = work[row][col];
				work[row] = work[row].map((value, index) => value - factor * work[col][index]);
			}
		}
		return work.map(row => row.slice(size));
	}

	function multiply(left, right) {
		return left.map(row => right[0].map((_, col) => row.reduce((sum, value, index) => sum + value * right[index][col], 0)));
	}

	function isSquare(matrix) { return matrix.length > 0 && matrix.length === matrix[0].length; }
	function formatNumber(value) { const rounded = Math.abs(value) < 1e-10 ? 0 : Number(value.toFixed(10)); return String(rounded); }

	function renderResult(result) {
		const container = root.querySelector('#matrixResult');
		container.replaceChildren();
		if (Array.isArray(result)) {
			const table = document.createElement('table');
			table.className = 'matrix-output';
			result.forEach(row => {
				const tr = document.createElement('tr');
				row.forEach(value => { const td = document.createElement('td'); td.textContent = formatNumber(value); tr.appendChild(td); });
				table.appendChild(tr);
			});
			container.appendChild(table);
			saveState();
			return;
		}
		const value = document.createElement('p');
		value.className = 'matrix-value';
		value.textContent = formatNumber(result);
		container.appendChild(value);
		saveState();
	}

	function showError(message) {
		const result = root.querySelector('#matrixResult');
		result.className = 'matrix-calculator__message matrix-calculator__error';
		result.textContent = message;
		saveState();
	}

	function initializeCalculator() {
		const settings = root.querySelector('#matrixSettings');
		const operation = root.querySelector('#matrixOperation');
		if (!settings || !operation) return;

		function calculate(event) {
			event.preventDefault();
			const rowsA = dimension('#matrixRowsA'); const colsA = dimension('#matrixColsA');
			const rowsB = dimension('#matrixRowsB'); const colsB = dimension('#matrixColsB');
			const matrixA = readMatrix('#matrixA', rowsA, colsA); const matrixB = readMatrix('#matrixB', rowsB, colsB);
			const selected = operation.value;
			root.querySelector('#matrixResult').className = 'matrix-calculator__message';
			try {
				let result;
				if (selected === 'add' || selected === 'subtract') {
					if (rowsA !== rowsB || colsA !== colsB) throw new Error('A et B doivent avoir les mêmes dimensions pour cette opération.');
					result = matrixA.map((row, r) => row.map((value, c) => selected === 'add' ? value + matrixB[r][c] : value - matrixB[r][c]));
				} else if (selected === 'multiply') {
					if (colsA !== rowsB) throw new Error('Le nombre de colonnes de A doit être égal au nombre de lignes de B.');
					result = multiply(matrixA, matrixB);
				} else if (selected === 'scalar') {
					const scalar = Number.parseFloat(root.querySelector('#matrixScalar').value.replace(',', '.'));
					if (!Number.isFinite(scalar)) throw new Error('Le scalaire k doit être un nombre.');
					result = matrixA.map(row => row.map(value => value * scalar));
				} else if (selected === 'transposeA' || selected === 'transposeB') {
					result = transpose(selected === 'transposeA' ? matrixA : matrixB);
				} else {
					const matrix = selected.endsWith('A') ? matrixA : matrixB;
					if (!isSquare(matrix)) throw new Error('Cette opération nécessite une matrice carrée.');
					if (selected.startsWith('determinant')) result = determinant(matrix);
					else { result = inverse(matrix); if (!result) throw new Error('Cette matrice est singulière : elle ne possède pas d’inverse.'); }
				}
				renderResult(result);
			} catch (error) { showError(error.message); }
		}

		[ '#matrixRowsA', '#matrixColsA', '#matrixRowsB', '#matrixColsB' ].forEach(id => root.querySelector(id).addEventListener('change', refreshMatrices));
		operation.addEventListener('change', () => { root.querySelector('#scalarField').hidden = operation.value !== 'scalar'; });
		settings.addEventListener('submit', calculate);
		root.addEventListener('input', saveState);
		root.addEventListener('change', saveState);
		root.querySelector('#matrixClear').addEventListener('click', () => {
			refreshMatrices(true);
			saveState();
		});
		restoreState();
		refreshMatrices();
		saveState();
	}

	fetch('calculatrice.html')
		.then(response => {
			if (!response.ok) throw new Error(`Impossible de charger calculatrice.html (${response.status}).`);
			return response.text();
		})
		.then(html => {
			root.innerHTML = html;
			initializeCalculator();
		})
		.catch(error => {
			root.innerHTML = `<p class="matrix-calculator__message matrix-calculator__error">${error.message}</p>`;
		});
})();
