(() => {
    'use strict';

    const numberFormat = new Intl.NumberFormat('fr-FR', { maximumSignificantDigits: 10 });
    const formatNumber = value => numberFormat.format(Object.is(value, -0) ? 0 : value);

    const statisticsForm = document.getElementById('statisticsForm');
    statisticsForm.addEventListener('submit', event => {
        event.preventDefault();
        const error = document.getElementById('statisticsError');
        error.hidden = true;
        const values = document.getElementById('statisticsValues').value
            .trim()
            .split(/[\s,;]+/)
            .filter(Boolean)
            .map(value => Number(value.replace(',', '.')));

        if (!values.length || values.some(value => !Number.isFinite(value))) {
            document.querySelectorAll('#statisticsForm ~ .science-tool__results dd').forEach(result => {
                result.textContent = '—';
            });
            error.textContent = 'Entrez une série de nombres valides, séparés par des espaces, des virgules ou des points-virgules.';
            error.hidden = false;
            return;
        }

        const sorted = values.slice().sort((a, b) => a - b);
        const count = values.length;
        const mean = values.reduce((sum, value) => sum + value, 0) / count;
        const middle = Math.floor(count / 2);
        const median = count % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
        const frequencies = new Map();
        values.forEach(value => frequencies.set(value, (frequencies.get(value) || 0) + 1));
        const maxFrequency = Math.max(...frequencies.values());
        const modes = maxFrequency === 1
            ? 'Aucun mode'
            : [...frequencies].filter(([, frequency]) => frequency === maxFrequency).map(([value]) => formatNumber(value)).join(', ');
        const populationVariance = values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / count;
        const sampleVariance = count > 1
            ? values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / (count - 1)
            : null;

        document.getElementById('statisticsCount').textContent = String(count);
        document.getElementById('statisticsMean').textContent = formatNumber(mean);
        document.getElementById('statisticsMedian').textContent = formatNumber(median);
        document.getElementById('statisticsModes').textContent = modes;
        document.getElementById('statisticsMin').textContent = formatNumber(sorted[0]);
        document.getElementById('statisticsMax').textContent = formatNumber(sorted[count - 1]);
        document.getElementById('statisticsPopulationVariance').textContent = formatNumber(populationVariance);
        document.getElementById('statisticsPopulationDeviation').textContent = formatNumber(Math.sqrt(populationVariance));
        document.getElementById('statisticsSampleVariance').textContent = sampleVariance === null ? 'N/D (n < 2)' : formatNumber(sampleVariance);
        document.getElementById('statisticsSampleDeviation').textContent = sampleVariance === null ? 'N/D (n < 2)' : formatNumber(Math.sqrt(sampleVariance));
    });

    const unitDefinitions = {
        length: {
            label: 'Longueur',
            units: [
                ['km', 'Kilomètre', 1000], ['m', 'Mètre', 1], ['dm', 'Décimètre', 0.1],
                ['cm', 'Centimètre', 0.01], ['mm', 'Millimètre', 0.001], ['µm', 'Micromètre', 1e-6],
                ['nm', 'Nanomètre', 1e-9], ['mi', 'Mile', 1609.344], ['yd', 'Yard', 0.9144],
                ['ft', 'Pied', 0.3048], ['in', 'Pouce', 0.0254]
            ]
        },
        mass: {
            label: 'Masse',
            units: [
                ['t', 'Tonne', 1000], ['kg', 'Kilogramme', 1], ['g', 'Gramme', 0.001],
                ['mg', 'Milligramme', 1e-6], ['µg', 'Microgramme', 1e-9], ['lb', 'Livre', 0.45359237],
                ['oz', 'Once', 0.028349523125]
            ]
        },
        time: {
            label: 'Temps',
            units: [
                ['j', 'Jour', 86400], ['h', 'Heure', 3600], ['min', 'Minute', 60],
                ['s', 'Seconde', 1], ['ms', 'Milliseconde', 0.001], ['µs', 'Microseconde', 1e-6]
            ]
        },
        speed: {
            label: 'Vitesse',
            units: [
                ['m/s', 'Mètre par seconde', 1], ['km/h', 'Kilomètre par heure', 1 / 3.6],
                ['mph', 'Mile par heure', 0.44704], ['kn', 'Nœud', 0.5144444444444445]
            ]
        },
        force: {
            label: 'Force',
            units: [
                ['N', 'Newton', 1], ['kN', 'Kilonewton', 1000], ['dyn', 'Dyne', 1e-5],
                ['kgf', 'Kilogramme-force', 9.80665]
            ]
        },
        energy: {
            label: 'Énergie',
            units: [
                ['J', 'Joule', 1], ['kJ', 'Kilojoule', 1000], ['cal', 'Calorie', 4.184],
                ['kcal', 'Kilocalorie', 4184], ['Wh', 'Watt-heure', 3600], ['kWh', 'Kilowatt-heure', 3600000],
                ['eV', 'Électronvolt', 1.602176634e-19]
            ]
        },
        pressure: {
            label: 'Pression',
            units: [
                ['Pa', 'Pascal', 1], ['kPa', 'Kilopascal', 1000], ['bar', 'Bar', 100000],
                ['atm', 'Atmosphère', 101325], ['mmHg', 'Millimètre de mercure', 133.322387415],
                ['psi', 'Livre par pouce carré', 6894.757293168]
            ]
        },
        temperature: {
            label: 'Température',
            units: [
                ['°C', 'Degré Celsius'], ['°F', 'Degré Fahrenheit'], ['K', 'Kelvin']
            ]
        }
    };

    const unitCategory = document.getElementById('unitCategory');
    const unitFrom = document.getElementById('unitFrom');
    const unitTo = document.getElementById('unitTo');
    const unitForm = document.getElementById('unitConverterForm');
    const unitError = document.getElementById('unitConverterError');

    Object.entries(unitDefinitions).forEach(([value, definition]) => {
        const option = document.createElement('option');
        option.value = value;
        option.textContent = definition.label;
        unitCategory.appendChild(option);
    });

    function populateUnits() {
        const definition = unitDefinitions[unitCategory.value];
        [unitFrom, unitTo].forEach(select => {
            select.replaceChildren();
            definition.units.forEach(([symbol, label]) => {
                const option = document.createElement('option');
                option.value = symbol;
                option.textContent = `${label} (${symbol})`;
                select.appendChild(option);
            });
        });
        if (unitCategory.value === 'length') {
            unitFrom.value = 'm';
            unitTo.value = 'cm';
        }
        convertUnits();
    }

    function convertUnits(event) {
        if (event) event.preventDefault();
        unitError.hidden = true;
        const value = Number(document.getElementById('unitValue').value);
        if (!Number.isFinite(value)) {
            document.getElementById('unitConverterOutput').textContent = '—';
            document.getElementById('unitConverterSummary').textContent = '';
            unitError.textContent = 'Saisissez une valeur numérique valide.';
            unitError.hidden = false;
            return;
        }

        const definition = unitDefinitions[unitCategory.value];
        const from = definition.units.find(([symbol]) => symbol === unitFrom.value);
        const to = definition.units.find(([symbol]) => symbol === unitTo.value);
        let result;
        if (unitCategory.value === 'temperature') {
            let celsius = value;
            if (from[0] === '°F') celsius = (value - 32) * 5 / 9;
            if (from[0] === 'K') celsius = value - 273.15;
            if (celsius < 0) {
                document.getElementById('unitConverterOutput').textContent = '—';
                document.getElementById('unitConverterSummary').textContent = '';
                unitError.textContent = 'Une température ne peut pas être inférieure au zéro absolu.';
                unitError.hidden = false;
                return;
            }
            result = celsius;
            if (to[0] === '°F') result = celsius * 9 / 5 + 32;
            if (to[0] === 'K') result = celsius + 273.15;
        } else {
            result = value * from[2] / to[2];
        }

        document.getElementById('unitConverterOutput').textContent = `${formatNumber(result)} ${to[0]}`;
        document.getElementById('unitConverterSummary').textContent = `${formatNumber(value)} ${from[0]} = ${formatNumber(result)} ${to[0]}`;
    }

    unitCategory.addEventListener('change', populateUnits);
    unitForm.addEventListener('submit', convertUnits);
    unitForm.addEventListener('input', convertUnits);
    unitForm.addEventListener('change', convertUnits);
    populateUnits();

    const atomicMass = {
        H: 1.008, He: 4.002602, Li: 6.94, Be: 9.0121831, B: 10.81, C: 12.011, N: 14.007, O: 15.999,
        F: 18.998403163, Ne: 20.1797, Na: 22.98976928, Mg: 24.305, Al: 26.9815385, Si: 28.085, P: 30.973761998,
        S: 32.06, Cl: 35.45, Ar: 39.948, K: 39.0983, Ca: 40.078, Sc: 44.955908, Ti: 47.867, V: 50.9415,
        Cr: 51.9961, Mn: 54.938044, Fe: 55.845, Co: 58.933194, Ni: 58.6934, Cu: 63.546, Zn: 65.38,
        Ga: 69.723, Ge: 72.63, As: 74.921595, Se: 78.971, Br: 79.904, Kr: 83.798, Rb: 85.4678, Sr: 87.62,
        Y: 88.90584, Zr: 91.224, Nb: 92.90637, Mo: 95.95, Tc: 98, Ru: 101.07, Rh: 102.9055, Pd: 106.42,
        Ag: 107.8682, Cd: 112.414, In: 114.818, Sn: 118.71, Sb: 121.76, Te: 127.6, I: 126.90447, Xe: 131.293,
        Cs: 132.90545196, Ba: 137.327, La: 138.90547, Ce: 140.116, Pr: 140.90766, Nd: 144.242, Pm: 145,
        Sm: 150.36, Eu: 151.964, Gd: 157.25, Tb: 158.92535, Dy: 162.5, Ho: 164.93033, Er: 167.259,
        Tm: 168.93422, Yb: 173.045, Lu: 174.9668, Hf: 178.49, Ta: 180.94788, W: 183.84, Re: 186.207,
        Os: 190.23, Ir: 192.217, Pt: 195.084, Au: 196.966569, Hg: 200.592, Tl: 204.38, Pb: 207.2,
        Bi: 208.9804, Po: 209, At: 210, Rn: 222, Fr: 223, Ra: 226, Ac: 227, Th: 232.0377, Pa: 231.03588,
        U: 238.02891, Np: 237, Pu: 244, Am: 243, Cm: 247, Bk: 247, Cf: 251, Es: 252, Fm: 257,
        Md: 258, No: 259, Lr: 266, Rf: 267, Db: 268, Sg: 269, Bh: 270, Hs: 277, Mt: 278,
        Ds: 281, Rg: 282, Cn: 285, Nh: 286, Fl: 289, Mc: 290, Lv: 293, Ts: 294, Og: 294
    };

    function parseFormula(formula) {
        const segments = formula.replace(/\s+/g, '').split(/[·⋅.]/);
        const total = new Map();
        if (!formula.trim() || segments.some(segment => !segment)) throw new Error('Saisissez une formule chimique complète.');

        segments.forEach(segment => {
            const coefficientMatch = segment.match(/^(\d+)(?=[A-Z(])/);
            const coefficient = coefficientMatch ? Number(coefficientMatch[1]) : 1;
            if (!Number.isSafeInteger(coefficient) || coefficient < 1) throw new Error('Le coefficient de la formule doit être un entier positif.');
            const content = coefficientMatch ? segment.slice(coefficientMatch[0].length) : segment;
            const tokens = content.match(/[A-Z][a-z]?|\d+|[()]/g) || [];
            if (!content || tokens.join('') !== content) throw new Error(`Formule non reconnue : ${segment}.`);

            let index = 0;
            function parseGroup(nested = false) {
                const counts = new Map();
                while (index < tokens.length && tokens[index] !== ')') {
                    if (tokens[index] === '(') {
                        index += 1;
                        const group = parseGroup(true);
                        if (tokens[index] !== ')') throw new Error('Parenthèses non fermées dans la formule.');
                        index += 1;
                        const multiplier = readMultiplier();
                        group.forEach((count, element) => counts.set(element, (counts.get(element) || 0) + count * multiplier));
                    } else if (/^[A-Z]/.test(tokens[index])) {
                        const element = tokens[index];
                        if (!(element in atomicMass)) throw new Error(`Élément chimique inconnu : ${element}.`);
                        index += 1;
                        const multiplier = readMultiplier();
                        counts.set(element, (counts.get(element) || 0) + multiplier);
                    } else {
                        throw new Error(`La formule contient un nombre ou symbole inattendu : ${tokens[index]}.`);
                    }
                }
                if (nested && !counts.size) throw new Error('Les parenthèses ne peuvent pas être vides.');
                return counts;
            }

            function readMultiplier() {
                if (index < tokens.length && /^\d+$/.test(tokens[index])) {
                    const multiplier = Number(tokens[index]);
                    index += 1;
                    if (!Number.isSafeInteger(multiplier) || multiplier < 1) throw new Error('Les indices de formule doivent être des entiers positifs.');
                    return multiplier;
                }
                return 1;
            }

            const counts = parseGroup();
            if (index !== tokens.length || !counts.size) throw new Error(`Formule non reconnue : ${segment}.`);
            counts.forEach((count, element) => total.set(element, (total.get(element) || 0) + count * coefficient));
        });
        return total;
    }

    const molarMassForm = document.getElementById('molarMassForm');
    molarMassForm.addEventListener('submit', event => {
        event.preventDefault();
        const error = document.getElementById('molarMassError');
        error.hidden = true;
        try {
            const formula = document.getElementById('chemicalFormula').value.trim();
            const composition = parseFormula(formula);
            const mass = [...composition].reduce((sum, [element, count]) => sum + atomicMass[element] * count, 0);
            document.getElementById('molarMassOutput').textContent = `${formatNumber(mass)} g·mol⁻¹`;
            document.getElementById('molarMassSummary').textContent =
                [...composition].map(([element, count]) => `${element}${count > 1 ? count : ''}`).join(' · ');
        } catch (calculationError) {
            document.getElementById('molarMassOutput').textContent = '—';
            document.getElementById('molarMassSummary').textContent = '';
            error.textContent = calculationError instanceof Error ? calculationError.message : 'La formule n’a pas pu être calculée.';
            error.hidden = false;
        }
    });

    const concentrationUnits = [
        ['M', 'mol·L⁻¹', 1], ['mM', 'mmol·L⁻¹', 1e-3], ['µM', 'µmol·L⁻¹', 1e-6], ['nM', 'nmol·L⁻¹', 1e-9]
    ];
    const volumeUnits = [['L', 'L', 1], ['mL', 'mL', 1e-3], ['µL', 'µL', 1e-6]];
    document.querySelectorAll('.dilution-concentration-unit').forEach(select => {
        concentrationUnits.forEach(([value, label]) => {
            const option = document.createElement('option');
            option.value = value;
            option.textContent = label;
            select.appendChild(option);
        });
    });
    const volumeUnitSelect = document.getElementById('dilutionVolumeUnit');
    volumeUnits.forEach(([value, label]) => {
        const option = document.createElement('option');
        option.value = value;
        option.textContent = label;
        volumeUnitSelect.appendChild(option);
    });
    volumeUnitSelect.value = 'mL';

    const dilutionUnknown = document.getElementById('dilutionUnknown');
    const dilutionFields = {
        C1: document.getElementById('dilutionC1'),
        V1: document.getElementById('dilutionV1'),
        C2: document.getElementById('dilutionC2'),
        V2: document.getElementById('dilutionV2')
    };

    function updateDilutionTarget() {
        Object.entries(dilutionFields).forEach(([name, input]) => {
            const isTarget = dilutionUnknown.value === name;
            input.disabled = isTarget;
            input.required = !isTarget;
            input.placeholder = isTarget ? 'Valeur calculée' : 'Saisir une valeur';
            if (isTarget) input.value = '';
        });
    }

    dilutionUnknown.addEventListener('change', updateDilutionTarget);
    updateDilutionTarget();

    const dilutionForm = document.getElementById('dilutionForm');
    dilutionForm.addEventListener('submit', event => {
        event.preventDefault();
        const error = document.getElementById('dilutionError');
        error.hidden = true;
        const target = dilutionUnknown.value;
        const clearDilutionResult = () => {
            document.getElementById('dilutionOutput').textContent = '—';
            document.getElementById('dilutionSummary').textContent = '';
        };
        const concentrationFactor = unit => concentrationUnits.find(([value]) => value === unit)[2];
        const volumeFactor = volumeUnits.find(([value]) => value === volumeUnitSelect.value)[2];
        const values = {};

        for (const name of Object.keys(dilutionFields).filter(key => key !== target)) {
            const value = Number(dilutionFields[name].value);
            if (!Number.isFinite(value) || value <= 0) {
                clearDilutionResult();
                error.textContent = 'Renseignez les trois valeurs connues avec des nombres strictement positifs.';
                error.hidden = false;
                return;
            }
            if (name[0] === 'C') {
                const unit = document.getElementById(`dilution${name}Unit`).value;
                values[name] = value * concentrationFactor(unit);
            } else {
                values[name] = value * volumeFactor;
            }
        }

        let result;
        if (target === 'C1') result = values.C2 * values.V2 / values.V1;
        if (target === 'V1') result = values.C2 * values.V2 / values.C1;
        if (target === 'C2') result = values.C1 * values.V1 / values.V2;
        if (target === 'V2') result = values.C1 * values.V1 / values.C2;
        if (!Number.isFinite(result) || result <= 0) {
            clearDilutionResult();
            error.textContent = 'Impossible de calculer une valeur positive avec ces données. Vérifiez les unités et les valeurs saisies.';
            error.hidden = false;
            return;
        }

        const isConcentration = target[0] === 'C';
        const unit = isConcentration
            ? document.getElementById(`dilution${target}Unit`).value
            : volumeUnitSelect.value;
        const factor = isConcentration ? concentrationFactor(unit) : volumeFactor;
        const displayResult = result / factor;
        document.getElementById('dilutionOutput').textContent = `${target} = ${formatNumber(displayResult)} ${unit}`;
        document.getElementById('dilutionSummary').textContent = 'Calcul effectué avec la relation C₁V₁ = C₂V₂, après conversion des unités.';
        error.hidden = true;
    });
})();
