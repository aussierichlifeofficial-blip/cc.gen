// ===== CC GENERATOR - Developer Testing Tool =====

// Luhn Algorithm - generates valid check digit
function luhnCheckDigit(partial) {
    let sum = 0;
    let isDouble = true;
    for (let i = partial.length - 1; i >= 0; i--) {
        let digit = parseInt(partial[i]);
        if (isDouble) {
            digit *= 2;
            if (digit > 9) digit -= 9;
        }
        sum += digit;
        isDouble = !isDouble;
    }
    return (10 - (sum % 10)) % 10;
}

// Generate random number between min and max
function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Detect card brand from BIN
function detectBrand(number) {
    const num = number.toString();
    if (/^4/.test(num)) return 'visa';
    if (/^5[1-5]/.test(num) || /^2[2-7]/.test(num)) return 'mastercard';
    if (/^3[47]/.test(num)) return 'amex';
    if (/^6(?:011|5)/.test(num)) return 'discover';
    return 'visa';
}

// Get brand icon class
function getBrandIcon(brand) {
    const icons = {
        'visa': 'fab fa-cc-visa',
        'mastercard': 'fab fa-cc-mastercard',
        'amex': 'fab fa-cc-amex',
        'discover': 'fab fa-cc-discover'
    };
    return icons[brand] || 'fas fa-credit-card';
}

// Get brand display name
function getBrandName(brand) {
    const names = {
        'visa': 'Visa',
        'mastercard': 'Mastercard',
        'amex': 'Amex',
        'discover': 'Discover'
    };
    return names[brand] || 'Unknown';
}

// Generate a single card number
function generateCardNumber(bin, brand) {
    let prefix = bin || '';
    
    // If no BIN provided, generate based on brand
    if (!prefix) {
        switch (brand) {
            case 'visa':
                prefix = '4' + randomInt(100, 999).toString();
                break;
            case 'mastercard':
                prefix = '5' + randomInt(1, 5).toString() + randomInt(10, 99).toString();
                break;
            case 'amex':
                prefix = '3' + (Math.random() > 0.5 ? '4' : '7') + randomInt(10, 99).toString();
                break;
            case 'discover':
                prefix = '6011' + randomInt(10, 99).toString();
                break;
            default:
                prefix = '4' + randomInt(100, 999).toString();
        }
    }

    // Determine card length
    let cardLength = 16;
    const detectedBrand = detectBrand(prefix);
    if (detectedBrand === 'amex') cardLength = 15;

    // Fill remaining digits (except check digit)
    while (prefix.length < cardLength - 1) {
        prefix += randomInt(0, 9).toString();
    }

    // Add Luhn check digit
    const checkDigit = luhnCheckDigit(prefix);
    return prefix + checkDigit.toString();
}

// Generate expiry
function generateExpiry(month, year) {
    const m = month === 'random' ? String(randomInt(1, 12)).padStart(2, '0') : month;
    const y = year === 'random' ? String(randomInt(2025, 2030)) : year;
    return { month: m, year: y, display: m + '/' + y.slice(-2) };
}

// Generate CVV
function generateCVV(brand) {
    const length = brand === 'amex' ? 4 : 3;
    let cvv = '';
    for (let i = 0; i < length; i++) {
        cvv += randomInt(0, 9).toString();
    }
    return cvv;
}

// Format card number for display
function formatCardNumber(number) {
    if (number.length === 15) {
        // Amex: 4-6-5
        return number.slice(0, 4) + ' ' + number.slice(4, 10) + ' ' + number.slice(10);
    }
    // Standard: 4-4-4-4
    return number.replace(/(.{4})/g, '$1 ').trim();
}

// Show toast notification
function showToast(message) {
    const toast = document.getElementById('toast');
    const toastMsg = document.getElementById('toastMsg');
    toastMsg.textContent = message;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2500);
}

// Copy to clipboard
function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        showToast('Copied to clipboard!');
    }).catch(() => {
        // Fallback
        const ta = document.createElement('textarea');
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        showToast('Copied to clipboard!');
    });
}

// Update 3D card preview
function updateCardPreview(number, expiry, cvv, brand) {
    document.getElementById('displayCardNumber').textContent = formatCardNumber(number);
    document.getElementById('displayExpiry').textContent = expiry;
    document.getElementById('displayCvv').textContent = cvv;
    document.getElementById('displayBrand').innerHTML = `<i class="${getBrandIcon(brand)}"></i>`;
}

// Store generated cards
let generatedCards = [];

// Main generate function
function generateCards() {
    const bin = document.getElementById('binInput').value.trim();
    const quantity = parseInt(document.getElementById('quantity').value);
    const expMonth = document.getElementById('expMonth').value;
    const expYear = document.getElementById('expYear').value;
    const cvvType = document.getElementById('cvvType').value;
    const cardBrand = document.getElementById('cardBrand').value;

    // Validate BIN
    if (bin && (!/^\d{1,6}$/.test(bin))) {
        showToast('Please enter a valid BIN (1-6 digits)');
        return;
    }

    generatedCards = [];
    const resultsBody = document.getElementById('resultsBody');
    resultsBody.innerHTML = '';

    for (let i = 0; i < quantity; i++) {
        const brand = cardBrand === 'auto' ? (bin ? detectBrand(bin) : 'visa') : cardBrand;
        const number = generateCardNumber(bin, brand);
        const expiry = generateExpiry(expMonth, expYear);
        const cvv = generateCVV(detectBrand(number));
        const detectedBrand = detectBrand(number);

        const card = {
            number: number,
            expiry: expiry.display,
            cvv: cvv,
            brand: detectedBrand
        };
        generatedCards.push(card);

        // Add row
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${i + 1}</td>
            <td>${formatCardNumber(number)}</td>
            <td>${expiry.display}</td>
            <td>${cvv}</td>
            <td><i class="${getBrandIcon(detectedBrand)} brand-icon"></i></td>
            <td><button class="copy-row-btn" onclick="copyToClipboard('${number}|${expiry.display}|${cvv}')"><i class="fas fa-copy"></i></button></td>
        `;
        resultsBody.appendChild(tr);
    }

    // Update 3D card with first result
    if (generatedCards.length > 0) {
        const first = generatedCards[0];
        updateCardPreview(first.number, first.expiry, first.cvv, first.brand);
    }

    // Show results
    document.getElementById('results').style.display = 'block';
    document.getElementById('results').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// Copy all cards
function copyAllCards() {
    const text = generatedCards.map(c => `${c.number}|${c.expiry}|${c.cvv}`).join('\n');
    copyToClipboard(text);
}

// Clear results
function clearResults() {
    generatedCards = [];
    document.getElementById('resultsBody').innerHTML = '';
    document.getElementById('results').style.display = 'none';
    showToast('Results cleared');
}

// ===== EVENT LISTENERS =====
document.addEventListener('DOMContentLoaded', () => {
    // Generate button
    document.getElementById('generateBtn').addEventListener('click', generateCards);

    // Copy All button
    document.getElementById('copyAllBtn').addEventListener('click', copyAllCards);

    // Clear button
    document.getElementById('clearBtn').addEventListener('click', clearResults);

    // BIN input - update card preview in real time
    document.getElementById('binInput').addEventListener('input', (e) => {
        const val = e.target.value.replace(/\D/g, '').slice(0, 6);
        e.target.value = val;
        if (val.length >= 1) {
            const brand = detectBrand(val);
            document.getElementById('displayBrand').innerHTML = `<i class="${getBrandIcon(brand)}"></i>`;
            const display = val + ' •••• •••• ••••';
            document.getElementById('displayCardNumber').textContent = display.slice(0, 19);
        }
    });

    // Card brand select - update preview
    document.getElementById('cardBrand').addEventListener('change', (e) => {
        const brand = e.target.value === 'auto' ? 'visa' : e.target.value;
        document.getElementById('displayBrand').innerHTML = `<i class="${getBrandIcon(brand)}"></i>`;
    });

    // Add subtle 3D tilt effect on mouse move
    const cardWrapper = document.getElementById('cardWrapper');
    cardWrapper.addEventListener('mousemove', (e) => {
        const rect = cardWrapper.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const rotateX = (y - centerY) / 15;
        const rotateY = (centerX - x) / 15;
        
        const card = document.getElementById('card3d');
        if (!cardWrapper.matches(':hover') || card.style.transform === 'rotateY(180deg)') return;
        card.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
    });

    cardWrapper.addEventListener('mouseleave', () => {
        document.getElementById('card3d').style.transform = '';
    });

    // Enter key to generate
    document.getElementById('binInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') generateCards();
    });
});
