(() => {
    'use strict';

    const form = document.getElementById('baseConverterForm');
    if (!form) return;

    const valueInput = document.getElementById('baseConverterValue');
    const fromSelect = document.getElementById('baseConverterFrom');
    const toSelect = document.getElementById('baseConverterTo');
    const output = document.getElementById('baseConverterOutput');
    const summary = document.getElementById('baseConverterSummary');
    const error = document.getElementById('baseConverterError');
    const digits = '0123456789abcdefghijklmnopqrstuvwxyz';

    for (let base = 2; base <= 36; base += 1) {
        const option = document.createElement('option');
        option.value = String(base);
        option.textContent = `Base ${base}`;
        fromSelect.appendChild(option);
        toSelect.appendChild(option.cloneNode(true));
    }

    fromSelect.value = '10';
    toSelect.value = '16';

    function parseInteger(value, base) {
        const normalized = value.trim().toLowerCase();
        if (!normalized) throw new Error('Saisissez un nombre à convertir.');

        let sign = 1n;
        let start = 0;
        if (normalized[0] === '-' || normalized[0] === '+') {
            if (normalized[0] === '-') sign = -1n;
            start = 1;
        }
        if (start === normalized.length) throw new Error('Saisissez des chiffres après le signe.');

        let result = 0n;
        for (const character of normalized.slice(start)) {
            const digit = digits.indexOf(character);
            if (digit < 0 || digit >= base) {
                throw new Error(`« ${character} » n’est pas un chiffre valide en base ${base}.`);
            }
            result = result * BigInt(base) + BigInt(digit);
        }
        return sign * result;
    }

    function formatInteger(value, base) {
        return value.toString(base);
    }

    function convert(event) {
        event.preventDefault();
        error.hidden = true;
        error.textContent = '';

        const fromBase = Number(fromSelect.value);
        const toBase = Number(toSelect.value);
        try {
            const value = parseInteger(valueInput.value, fromBase);
            const converted = formatInteger(value, toBase);
            output.textContent = converted;
            summary.textContent = `${valueInput.value.trim()} en base ${fromBase} = ${converted} en base ${toBase}`;

            [2, 8, 10, 16].forEach(base => {
                document.getElementById(`baseResult${base}`).textContent = formatInteger(value, base);
            });
        } catch (conversionError) {
            output.textContent = '—';
            summary.textContent = '';
            [2, 8, 10, 16].forEach(base => {
                document.getElementById(`baseResult${base}`).textContent = '—';
            });
            error.textContent = conversionError instanceof Error ? conversionError.message : 'La conversion a échoué.';
            error.hidden = false;
        }
    }

    form.addEventListener('submit', convert);
    form.addEventListener('input', () => {
        error.hidden = true;
        error.textContent = '';
    });
    convert(new Event('submit', { cancelable: true }));
})();
