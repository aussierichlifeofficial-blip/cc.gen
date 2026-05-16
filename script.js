// ===== CC GEN PRO - Developer Testing Suite =====

// ==================== UTILITY FUNCTIONS ====================

function luhnCheckDigit(partial) {
    let sum = 0;
    let isDouble = true;
    for (let i = partial.length - 1; i >= 0; i--) {
        let digit = parseInt(partial[i]);
        if (isDouble) { digit *= 2; if (digit > 9) digit -= 9; }
        sum += digit;
        isDouble = !isDouble;
    }
    return (10 - (sum % 10)) % 10;
}

function luhnValidate(number) {
    const digits = number.replace(/\D/g, '');
    if (digits.length < 13) return false;
    let sum = 0;
    let isDouble = false;
    for (let i = digits.length - 1; i >= 0; i--) {
        let digit = parseInt(digits[i]);
        if (isDouble) { digit *= 2; if (digit > 9) digit -= 9; }
        sum += digit;
        isDouble = !isDouble;
    }
    return sum % 10 === 0;
}

function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomElement(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

function showToast(message) {
    const toast = document.getElementById('toast');
    const toastMsg = document.getElementById('toastMsg');
    toastMsg.textContent = message;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2500);
}

function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        showToast('Copied to clipboard!');
    }).catch(() => {
        const ta = document.createElement('textarea');
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        showToast('Copied to clipboard!');
    });
}

function detectBrand(number) {
    const num = number.toString();
    if (/^4/.test(num)) return 'visa';
    if (/^5[1-5]/.test(num) || /^2[2-7]/.test(num)) return 'mastercard';
    if (/^3[47]/.test(num)) return 'amex';
    if (/^6(?:011|5)/.test(num)) return 'discover';
    return 'visa';
}

function getBrandIcon(brand) {
    const icons = { 'visa': 'fab fa-cc-visa', 'mastercard': 'fab fa-cc-mastercard', 'amex': 'fab fa-cc-amex', 'discover': 'fab fa-cc-discover' };
    return icons[brand] || 'fas fa-credit-card';
}

function formatCardNumber(number) {
    if (number.length === 15) return number.slice(0,4)+' '+number.slice(4,10)+' '+number.slice(10);
    return number.replace(/(.{4})/g, '$1 ').trim();
}

// ==================== TAB NAVIGATION ====================

function initTabs() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            tabBtns.forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            btn.classList.add('active');
            const tab = btn.getAttribute('data-tab');
            document.getElementById('tab-' + tab).classList.add('active');
        });
    });
}



// ==================== CC GENERATOR ====================

let generatedCards = [];

function generateCardNumber(bin, brand) {
    let prefix = bin || '';
    if (!prefix) {
        switch (brand) {
            case 'visa': prefix = '4' + randomInt(100, 999); break;
            case 'mastercard': prefix = '5' + randomInt(1, 5) + randomInt(10, 99); break;
            case 'amex': prefix = '3' + (Math.random() > 0.5 ? '4' : '7') + randomInt(10, 99); break;
            case 'discover': prefix = '6011' + randomInt(10, 99); break;
            default: prefix = '4' + randomInt(100, 999);
        }
    }
    let cardLength = detectBrand(prefix) === 'amex' ? 15 : 16;
    while (prefix.length < cardLength - 1) prefix += randomInt(0, 9);
    return prefix + luhnCheckDigit(prefix);
}

function generateExpiry(month, year) {
    const m = month === 'random' ? String(randomInt(1, 12)).padStart(2, '0') : month;
    const y = year === 'random' ? String(randomInt(2025, 2030)) : year;
    return { month: m, year: y, display: m + '/' + y.slice(-2) };
}

function generateCVV(brand) {
    const len = brand === 'amex' ? 4 : 3;
    let cvv = '';
    for (let i = 0; i < len; i++) cvv += randomInt(0, 9);
    return cvv;
}

function generateCards() {
    const bin = document.getElementById('binInput').value.trim();
    const quantity = parseInt(document.getElementById('quantity').value);
    const expMonth = document.getElementById('expMonth').value;
    const expYear = document.getElementById('expYear').value;
    const cardBrand = document.getElementById('cardBrand').value;

    if (bin && !/^\d{1,6}$/.test(bin)) { showToast('Enter valid BIN (1-6 digits)'); return; }

    generatedCards = [];
    const tbody = document.getElementById('resultsBody');
    tbody.innerHTML = '';

    for (let i = 0; i < quantity; i++) {
        const brand = cardBrand === 'auto' ? (bin ? detectBrand(bin) : 'visa') : cardBrand;
        const number = generateCardNumber(bin, brand);
        const expiry = generateExpiry(expMonth, expYear);
        const cvv = generateCVV(detectBrand(number));
        const det = detectBrand(number);
        generatedCards.push({ number, expiry: expiry.display, cvv, brand: det });

        const tr = document.createElement('tr');
        tr.innerHTML = `<td>${i+1}</td><td>${formatCardNumber(number)}</td><td>${expiry.display}</td><td>${cvv}</td><td><i class="${getBrandIcon(det)} brand-icon"></i></td><td><button class="copy-row-btn" onclick="copyToClipboard('${number}|${expiry.display}|${cvv}')"><i class="fas fa-copy"></i></button></td>`;
        tbody.appendChild(tr);
    }

    document.getElementById('ccResults').style.display = 'block';
    document.getElementById('ccResults').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function copyAllCards() {
    const text = generatedCards.map(c => `${c.number}|${c.expiry}|${c.cvv}`).join('\n');
    copyToClipboard(text);
}

function clearResults() {
    generatedCards = [];
    document.getElementById('resultsBody').innerHTML = '';
    document.getElementById('ccResults').style.display = 'none';
    showToast('Results cleared');
}



// ==================== TEMP MAIL ====================

let currentEmail = '';
let fakeInbox = [];

const emailUsernames = ['dev.test', 'john.smith', 'testing.acc', 'user.demo', 'quick.test', 'alpha.beta', 'code.ninja', 'test.runner', 'debug.mode', 'qa.tester', 'sample.user', 'mail.check', 'auto.gen', 'random.box', 'proxy.mail'];

function generateTempEmail() {
    const domain = document.getElementById('emailDomain').value;
    const user = randomElement(emailUsernames) + randomInt(10, 9999);
    currentEmail = user + domain;
    document.getElementById('tempEmailAddress').textContent = currentEmail;
    fakeInbox = [];
    renderInbox();
    showToast('New email generated!');
    
    // Simulate incoming emails after delay
    setTimeout(() => simulateIncomingMail(), randomInt(2000, 4000));
}

function simulateIncomingMail() {
    if (!currentEmail) return;
    const senders = ['noreply@github.com', 'support@stripe.com', 'verify@paypal.com', 'no-reply@aws.amazon.com', 'team@netlify.com', 'hello@vercel.com', 'security@google.com', 'notifications@facebook.com'];
    const subjects = ['Verify your email address', 'Your verification code: ' + randomInt(100000, 999999), 'Welcome to our platform!', 'Action required: Confirm your account', 'Your OTP is ' + randomInt(1000, 9999), 'Password reset requested', 'New login from unknown device', 'Complete your registration'];
    
    const numEmails = randomInt(1, 3);
    for (let i = 0; i < numEmails; i++) {
        fakeInbox.push({
            from: randomElement(senders),
            subject: randomElement(subjects),
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            body: 'This is a simulated email for testing purposes. Code: ' + randomInt(100000, 999999)
        });
    }
    renderInbox();
}

function refreshInbox() {
    if (!currentEmail) { showToast('Generate an email first!'); return; }
    simulateIncomingMail();
    showToast('Inbox refreshed!');
}

function renderInbox() {
    const list = document.getElementById('inboxList');
    const count = document.getElementById('inboxCount');
    count.textContent = fakeInbox.length + ' messages';

    if (fakeInbox.length === 0) {
        list.innerHTML = '<div class="empty-state"><i class="fas fa-envelope-open"></i><p>No emails yet. Generate an email and wait for messages.</p></div>';
        return;
    }

    list.innerHTML = fakeInbox.map((mail, i) => `
        <div class="email-item" onclick="copyToClipboard('${mail.body}')">
            <div class="email-icon"><i class="fas fa-envelope"></i></div>
            <div class="email-info">
                <div class="email-from">${mail.from}</div>
                <div class="email-subject">${mail.subject}</div>
            </div>
            <div class="email-time">${mail.time}</div>
        </div>
    `).join('');
}



// ==================== FAKE ADDRESS GENERATOR ====================

const addressData = {
    US: { streets: ['Main St', 'Oak Avenue', 'Elm Street', 'Maple Drive', 'Cedar Lane', 'Pine Road', 'Washington Blvd', 'Lincoln Ave', 'Park Place', 'Sunset Blvd'], cities: ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia', 'San Antonio', 'San Diego', 'Dallas', 'Austin'], states: ['NY', 'CA', 'IL', 'TX', 'AZ', 'PA', 'FL', 'OH', 'GA', 'NC'], zip: () => randomInt(10000, 99999), phone: () => `+1 (${randomInt(200,999)}) ${randomInt(200,999)}-${randomInt(1000,9999)}` },
    UK: { streets: ['High Street', 'Church Road', 'Station Road', 'Victoria Road', 'Park Avenue', 'London Road', 'Mill Lane', 'Manor Road', 'Queens Road', 'Kings Avenue'], cities: ['London', 'Manchester', 'Birmingham', 'Leeds', 'Glasgow', 'Liverpool', 'Edinburgh', 'Bristol', 'Cardiff', 'Belfast'], states: ['England', 'Scotland', 'Wales', 'N. Ireland'], zip: () => randomElement(['SW','NW','SE','EC','WC','E','W','N']) + randomInt(1,20) + ' ' + randomInt(1,9) + randomElement(['AB','CD','EF','GH','JK','LM']), phone: () => `+44 ${randomInt(7000,7999)} ${randomInt(100000,999999)}` },
    CA: { streets: ['Yonge Street', 'Bay Street', 'King Street', 'Queen Street', 'Dundas Street', 'Bloor Street', 'College Street', 'Spadina Ave', 'University Ave', 'Front Street'], cities: ['Toronto', 'Montreal', 'Vancouver', 'Calgary', 'Edmonton', 'Ottawa', 'Winnipeg', 'Quebec City', 'Hamilton', 'Halifax'], states: ['ON', 'QC', 'BC', 'AB', 'MB', 'SK', 'NS', 'NB'], zip: () => randomElement(['A','B','C','E','G','H','J','K','L','M','N','P','R','S','T','V']) + randomInt(1,9) + randomElement(['A','B','C','E','G','H','J','K','L','M']) + ' ' + randomInt(1,9) + randomElement(['A','B','C','E','G','H']) + randomInt(1,9), phone: () => `+1 (${randomInt(200,999)}) ${randomInt(200,999)}-${randomInt(1000,9999)}` },
    AU: { streets: ['George Street', 'Collins Street', 'Queen Street', 'King Street', 'Elizabeth Street', 'Bourke Street', 'Flinders Street', 'Pitt Street', 'Murray Street', 'Adelaide Street'], cities: ['Sydney', 'Melbourne', 'Brisbane', 'Perth', 'Adelaide', 'Gold Coast', 'Canberra', 'Hobart', 'Darwin', 'Newcastle'], states: ['NSW', 'VIC', 'QLD', 'WA', 'SA', 'TAS', 'ACT', 'NT'], zip: () => randomInt(2000, 7999), phone: () => `+61 4${randomInt(00,99)} ${randomInt(100,999)} ${randomInt(100,999)}` },
    DE: { streets: ['Hauptstraße', 'Bahnhofstraße', 'Berliner Straße', 'Gartenstraße', 'Schillerstraße', 'Friedrichstraße', 'Mozartstraße', 'Goethestraße', 'Lindenstraße', 'Kirchstraße'], cities: ['Berlin', 'Munich', 'Hamburg', 'Frankfurt', 'Cologne', 'Stuttgart', 'Düsseldorf', 'Leipzig', 'Dortmund', 'Dresden'], states: ['Bayern', 'NRW', 'Baden-Württemberg', 'Niedersachsen', 'Hessen', 'Sachsen', 'Berlin', 'Hamburg'], zip: () => randomInt(10000, 99999), phone: () => `+49 ${randomInt(150,179)} ${randomInt(1000000,9999999)}` },
    FR: { streets: ['Rue de la Paix', 'Avenue des Champs-Élysées', 'Boulevard Saint-Germain', 'Rue de Rivoli', 'Avenue Montaigne', 'Rue du Faubourg', 'Boulevard Haussmann', 'Rue de la République', 'Avenue Victor Hugo', 'Rue Nationale'], cities: ['Paris', 'Marseille', 'Lyon', 'Toulouse', 'Nice', 'Nantes', 'Strasbourg', 'Montpellier', 'Bordeaux', 'Lille'], states: ['Île-de-France', 'Provence', 'Auvergne', 'Occitanie', 'Normandie', 'Bretagne', 'Grand Est'], zip: () => randomInt(10000, 95999), phone: () => `+33 6 ${randomInt(10,99)} ${randomInt(10,99)} ${randomInt(10,99)} ${randomInt(10,99)}` },
    JP: { streets: ['Shibuya', 'Shinjuku', 'Ginza', 'Roppongi', 'Akihabara', 'Ikebukuro', 'Harajuku', 'Asakusa', 'Ueno', 'Odaiba'], cities: ['Tokyo', 'Osaka', 'Kyoto', 'Yokohama', 'Nagoya', 'Sapporo', 'Kobe', 'Fukuoka', 'Sendai', 'Hiroshima'], states: ['Tokyo-to', 'Osaka-fu', 'Kyoto-fu', 'Kanagawa-ken', 'Aichi-ken', 'Hokkaido', 'Hyogo-ken', 'Fukuoka-ken'], zip: () => randomInt(100, 999) + '-' + randomInt(1000, 9999), phone: () => `+81 ${randomInt(70,90)}-${randomInt(1000,9999)}-${randomInt(1000,9999)}` },
    IN: { streets: ['MG Road', 'Park Street', 'Brigade Road', 'Connaught Place', 'Anna Salai', 'FC Road', 'Mall Road', 'Civil Lines', 'Linking Road', 'Carter Road'], cities: ['Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai', 'Kolkata', 'Pune', 'Ahmedabad', 'Jaipur', 'Lucknow'], states: ['Maharashtra', 'Delhi', 'Karnataka', 'Telangana', 'Tamil Nadu', 'West Bengal', 'Gujarat', 'Rajasthan', 'UP'], zip: () => randomInt(100000, 999999), phone: () => `+91 ${randomInt(7000,9999)}${randomInt(100000,999999)}` },
    BR: { streets: ['Rua Augusta', 'Avenida Paulista', 'Rua Oscar Freire', 'Avenida Atlântica', 'Rua da Consolação', 'Avenida Brasil', 'Rua dos Pinheiros', 'Avenida Ipiranga', 'Rua XV de Novembro', 'Avenida Rio Branco'], cities: ['São Paulo', 'Rio de Janeiro', 'Brasília', 'Salvador', 'Fortaleza', 'Belo Horizonte', 'Curitiba', 'Manaus', 'Recife', 'Porto Alegre'], states: ['SP', 'RJ', 'DF', 'BA', 'CE', 'MG', 'PR', 'AM', 'PE', 'RS'], zip: () => randomInt(10000, 99999) + '-' + randomInt(100, 999), phone: () => `+55 ${randomInt(11,99)} ${randomInt(90000,99999)}-${randomInt(1000,9999)}` },
    PK: { streets: ['Mall Road', 'Jinnah Avenue', 'Faisal Avenue', 'Shahrah-e-Quaid', 'GT Road', 'University Road', 'Murree Road', 'Tariq Road', 'Clifton Road', 'Blue Area'], cities: ['Karachi', 'Lahore', 'Islamabad', 'Rawalpindi', 'Faisalabad', 'Peshawar', 'Multan', 'Quetta', 'Sialkot', 'Hyderabad'], states: ['Sindh', 'Punjab', 'ICT', 'KPK', 'Balochistan', 'Gilgit-Baltistan'], zip: () => randomInt(10000, 99999), phone: () => `+92 3${randomInt(0,4)}${randomInt(0,9)} ${randomInt(1000000,9999999)}` },
    AE: { streets: ['Sheikh Zayed Road', 'Al Maktoum Road', 'Jumeirah Beach Road', 'Al Wasl Road', 'Khalifa Street', 'Corniche Road', 'Airport Road', 'Hamdan Street', 'Electra Street', 'Defense Road'], cities: ['Dubai', 'Abu Dhabi', 'Sharjah', 'Ajman', 'Ras Al Khaimah', 'Fujairah', 'Al Ain'], states: ['Dubai', 'Abu Dhabi', 'Sharjah', 'Ajman', 'RAK', 'Fujairah', 'UAQ'], zip: () => randomInt(10000, 99999), phone: () => `+971 5${randomInt(0,9)} ${randomInt(100,999)} ${randomInt(1000,9999)}` },
    SA: { streets: ['King Fahd Road', 'Olaya Street', 'Tahlia Street', 'King Abdullah Road', 'Prince Sultan Road', 'Makkah Road', 'Madinah Road', 'Jeddah Corniche', 'Al Batha Street', 'Prince Mohammed Street'], cities: ['Riyadh', 'Jeddah', 'Mecca', 'Medina', 'Dammam', 'Khobar', 'Tabuk', 'Abha', 'Taif', 'Buraidah'], states: ['Riyadh Region', 'Makkah Region', 'Eastern Province', 'Madinah Region', 'Asir'], zip: () => randomInt(10000, 99999), phone: () => `+966 5${randomInt(0,9)} ${randomInt(100,999)} ${randomInt(1000,9999)}` },
    IT: { streets: ['Via Roma', 'Via Garibaldi', 'Via Dante', 'Via Mazzini', 'Corso Vittorio Emanuele', 'Via Nazionale', 'Via del Corso', 'Via Veneto', 'Piazza del Duomo', 'Via Condotti'], cities: ['Rome', 'Milan', 'Naples', 'Turin', 'Florence', 'Venice', 'Bologna', 'Genoa', 'Palermo', 'Verona'], states: ['Lazio', 'Lombardia', 'Campania', 'Piemonte', 'Toscana', 'Veneto', 'Emilia-Romagna', 'Sicilia'], zip: () => randomInt(10000, 99999), phone: () => `+39 3${randomInt(20,99)} ${randomInt(100,999)} ${randomInt(1000,9999)}` },
    ES: { streets: ['Gran Vía', 'Paseo de la Castellana', 'Calle Mayor', 'Rambla de Catalunya', 'Avenida de la Constitución', 'Calle Alcalá', 'Paseo del Prado', 'Calle Serrano', 'Avenida Diagonal', 'Calle Real'], cities: ['Madrid', 'Barcelona', 'Valencia', 'Seville', 'Bilbao', 'Malaga', 'Zaragoza', 'Palma', 'Alicante', 'Granada'], states: ['Madrid', 'Cataluña', 'Valencia', 'Andalucía', 'País Vasco', 'Galicia', 'Aragón', 'Baleares'], zip: () => randomInt(10000, 52999), phone: () => `+34 6${randomInt(10,99)} ${randomInt(100,999)} ${randomInt(100,999)}` },
    MX: { streets: ['Avenida Reforma', 'Calle Madero', 'Avenida Insurgentes', 'Paseo de la Reforma', 'Calle 5 de Mayo', 'Avenida Juárez', 'Boulevard Ávila Camacho', 'Calle Hidalgo', 'Avenida Universidad', 'Calle Morelos'], cities: ['Mexico City', 'Guadalajara', 'Monterrey', 'Puebla', 'Cancún', 'Tijuana', 'León', 'Mérida', 'Querétaro', 'Oaxaca'], states: ['CDMX', 'Jalisco', 'Nuevo León', 'Puebla', 'Quintana Roo', 'Baja California', 'Guanajuato', 'Yucatán'], zip: () => randomInt(10000, 99999), phone: () => `+52 ${randomInt(55,99)} ${randomInt(1000,9999)} ${randomInt(1000,9999)}` },
    RU: { streets: ['Tverskaya Street', 'Nevsky Prospekt', 'Arbat Street', 'Kutuzovsky Prospekt', 'Leninsky Prospekt', 'Novy Arbat', 'Bolshaya Sadovaya', 'Mokhovaya Street', 'Petrovka Street', 'Liteiny Prospekt'], cities: ['Moscow', 'Saint Petersburg', 'Novosibirsk', 'Yekaterinburg', 'Kazan', 'Nizhny Novgorod', 'Samara', 'Chelyabinsk', 'Omsk', 'Rostov-on-Don'], states: ['Moscow Oblast', 'Leningrad Oblast', 'Novosibirsk Oblast', 'Sverdlovsk Oblast', 'Tatarstan'], zip: () => randomInt(100000, 699999), phone: () => `+7 9${randomInt(10,99)} ${randomInt(100,999)}-${randomInt(10,99)}-${randomInt(10,99)}` },
    CN: { streets: ['Nanjing Road', 'Wangfujing Street', 'Huaihai Road', 'Chang An Avenue', 'Beijing Road', 'Zhongshan Road', 'Jiefang Road', 'Renmin Road', 'Dongfeng Road', 'Xinhua Road'], cities: ['Beijing', 'Shanghai', 'Guangzhou', 'Shenzhen', 'Chengdu', 'Hangzhou', 'Wuhan', 'Nanjing', 'Tianjin', 'Chongqing'], states: ['Beijing', 'Shanghai', 'Guangdong', 'Sichuan', 'Zhejiang', 'Hubei', 'Jiangsu', 'Tianjin'], zip: () => randomInt(100000, 999999), phone: () => `+86 1${randomInt(30,99)} ${randomInt(1000,9999)} ${randomInt(1000,9999)}` },
    KR: { streets: ['Gangnam-daero', 'Teheran-ro', 'Sejong-daero', 'Jong-ro', 'Eulji-ro', 'Itaewon-ro', 'Haeundae-ro', 'Bukchon-ro', 'Myeongdong-gil', 'Apgujeong-ro'], cities: ['Seoul', 'Busan', 'Incheon', 'Daegu', 'Daejeon', 'Gwangju', 'Ulsan', 'Suwon', 'Seongnam', 'Goyang'], states: ['Seoul', 'Gyeonggi', 'Busan', 'Incheon', 'Daegu', 'Gwangju', 'Daejeon', 'Ulsan'], zip: () => randomInt(10000, 63599), phone: () => `+82 10-${randomInt(1000,9999)}-${randomInt(1000,9999)}` },
    NL: { streets: ['Kalverstraat', 'Damrak', 'Leidsestraat', 'Herengracht', 'Keizersgracht', 'Prinsengracht', 'Overtoom', 'Rokin', 'Vijzelstraat', 'Utrechtsestraat'], cities: ['Amsterdam', 'Rotterdam', 'The Hague', 'Utrecht', 'Eindhoven', 'Groningen', 'Tilburg', 'Almere', 'Breda', 'Nijmegen'], states: ['Noord-Holland', 'Zuid-Holland', 'Utrecht', 'Noord-Brabant', 'Gelderland', 'Groningen'], zip: () => randomInt(1000, 9999) + ' ' + randomElement(['AB','AC','AD','AE','AG','AH','AK','AL','AM','AN']), phone: () => `+31 6 ${randomInt(10000000, 99999999)}` },
    SE: { streets: ['Drottninggatan', 'Kungsgatan', 'Sveavägen', 'Storgatan', 'Vasagatan', 'Hamngatan', 'Götgatan', 'Birger Jarlsgatan', 'Odengatan', 'Fleminggatan'], cities: ['Stockholm', 'Gothenburg', 'Malmö', 'Uppsala', 'Linköping', 'Västerås', 'Örebro', 'Helsingborg', 'Norrköping', 'Jönköping'], states: ['Stockholm', 'Västra Götaland', 'Skåne', 'Uppsala', 'Östergötland', 'Västmanland', 'Örebro'], zip: () => randomInt(100, 999) + ' ' + randomInt(10, 99), phone: () => `+46 7${randomInt(0,9)} ${randomInt(100,999)} ${randomInt(10,99)} ${randomInt(10,99)}` }
};

const firstNames = ['James', 'Emma', 'Oliver', 'Sophia', 'William', 'Ava', 'Benjamin', 'Isabella', 'Lucas', 'Mia', 'Henry', 'Charlotte', 'Alexander', 'Amelia', 'Daniel', 'Harper', 'Michael', 'Evelyn', 'David', 'Aria'];
const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Thompson', 'White'];

function generateAddress() {
    const country = document.getElementById('addrCountry').value;
    const qty = parseInt(document.getElementById('addrQuantity').value);
    const data = addressData[country];
    
    if (!data) { showToast('Country data not available'); return; }

    const container = document.getElementById('addressCards');
    container.innerHTML = '';

    const addresses = [];
    for (let i = 0; i < qty; i++) {
        const addr = {
            name: randomElement(firstNames) + ' ' + randomElement(lastNames),
            street: randomInt(1, 9999) + ' ' + randomElement(data.streets),
            city: randomElement(data.cities),
            state: randomElement(data.states),
            zip: data.zip(),
            country: country,
            phone: data.phone(),
            email: randomElement(firstNames).toLowerCase() + '.' + randomElement(lastNames).toLowerCase() + randomInt(1,99) + '@gmail.com'
        };
        addresses.push(addr);

        const card = document.createElement('div');
        card.className = 'addr-card';
        card.innerHTML = `
            <div class="addr-card-header">
                <h4><i class="fas fa-user"></i> ${addr.name}</h4>
                <button class="copy-row-btn" onclick="copyToClipboard('${addr.name}\\n${addr.street}\\n${addr.city}, ${addr.state} ${addr.zip}\\n${country}\\n${addr.phone}')"><i class="fas fa-copy"></i> Copy</button>
            </div>
            <div class="addr-fields">
                <div class="addr-field"><span class="field-label">Street</span><span class="field-value">${addr.street}</span></div>
                <div class="addr-field"><span class="field-label">City</span><span class="field-value">${addr.city}</span></div>
                <div class="addr-field"><span class="field-label">State/Region</span><span class="field-value">${addr.state}</span></div>
                <div class="addr-field"><span class="field-label">ZIP/Postal</span><span class="field-value">${addr.zip}</span></div>
                <div class="addr-field"><span class="field-label">Phone</span><span class="field-value">${addr.phone}</span></div>
                <div class="addr-field"><span class="field-label">Email</span><span class="field-value">${addr.email}</span></div>
            </div>
        `;
        container.appendChild(card);
    }

    document.getElementById('addrResults').style.display = 'block';
    document.getElementById('addrResults').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function copyAllAddresses() {
    const cards = document.querySelectorAll('.addr-card');
    let text = '';
    cards.forEach(card => {
        const fields = card.querySelectorAll('.field-value');
        text += Array.from(fields).map(f => f.textContent).join(' | ') + '\n';
    });
    copyToClipboard(text.trim());
}



// ==================== BIN LOOKUP ====================

const binDatabase = {
    '4': { brand: 'Visa', type: 'Credit/Debit', level: 'Classic' },
    '40': { brand: 'Visa', type: 'Debit', level: 'Electron' },
    '41': { brand: 'Visa', type: 'Credit', level: 'Classic' },
    '42': { brand: 'Visa', type: 'Credit', level: 'Classic' },
    '43': { brand: 'Visa', type: 'Credit', level: 'Gold' },
    '44': { brand: 'Visa', type: 'Credit', level: 'Platinum' },
    '45': { brand: 'Visa', type: 'Credit', level: 'Business' },
    '46': { brand: 'Visa', type: 'Credit', level: 'Corporate' },
    '47': { brand: 'Visa', type: 'Debit', level: 'Classic' },
    '48': { brand: 'Visa', type: 'Credit', level: 'Gold' },
    '49': { brand: 'Visa', type: 'Credit', level: 'Platinum' },
    '51': { brand: 'Mastercard', type: 'Credit', level: 'Standard' },
    '52': { brand: 'Mastercard', type: 'Credit', level: 'Gold' },
    '53': { brand: 'Mastercard', type: 'Credit', level: 'Platinum' },
    '54': { brand: 'Mastercard', type: 'Credit', level: 'World' },
    '55': { brand: 'Mastercard', type: 'Credit', level: 'World Elite' },
    '34': { brand: 'American Express', type: 'Credit', level: 'Standard' },
    '37': { brand: 'American Express', type: 'Credit', level: 'Gold/Platinum' },
    '60': { brand: 'Discover', type: 'Credit', level: 'Standard' },
    '65': { brand: 'Discover', type: 'Credit', level: 'Cashback' },
    '36': { brand: 'Diners Club', type: 'Credit', level: 'International' },
    '38': { brand: 'Diners Club', type: 'Credit', level: 'Carte Blanche' },
    '35': { brand: 'JCB', type: 'Credit', level: 'Standard' },
    '22': { brand: 'Mastercard', type: 'Credit', level: 'Standard (2-series)' },
    '23': { brand: 'Mastercard', type: 'Debit', level: 'Debit (2-series)' },
};

const binBanks = ['Chase Bank', 'Bank of America', 'Wells Fargo', 'Citibank', 'Capital One', 'HSBC', 'Barclays', 'Deutsche Bank', 'BNP Paribas', 'Royal Bank of Canada', 'TD Bank', 'US Bank', 'PNC Bank', 'Standard Chartered', 'ING Bank', 'Santander', 'UBS', 'Credit Suisse', 'Goldman Sachs', 'Morgan Stanley'];
const binCountries = [
    { name: 'United States', code: 'US', flag: '🇺🇸' },
    { name: 'United Kingdom', code: 'GB', flag: '🇬🇧' },
    { name: 'Canada', code: 'CA', flag: '🇨🇦' },
    { name: 'Germany', code: 'DE', flag: '🇩🇪' },
    { name: 'France', code: 'FR', flag: '🇫🇷' },
    { name: 'Australia', code: 'AU', flag: '🇦🇺' },
    { name: 'Japan', code: 'JP', flag: '🇯🇵' },
    { name: 'India', code: 'IN', flag: '🇮🇳' },
    { name: 'Brazil', code: 'BR', flag: '🇧🇷' },
    { name: 'Italy', code: 'IT', flag: '🇮🇹' }
];

function lookupBin() {
    const bin = document.getElementById('binLookupInput').value.trim().replace(/\D/g, '');
    if (bin.length < 1) { showToast('Please enter a BIN number'); return; }

    // Find matching BIN info
    let info = null;
    for (let len = Math.min(bin.length, 2); len >= 1; len--) {
        const key = bin.slice(0, len);
        if (binDatabase[key]) { info = binDatabase[key]; break; }
    }

    if (!info) {
        info = { brand: 'Unknown', type: 'Unknown', level: 'Standard' };
    }

    // Generate random but deterministic-looking data based on BIN
    const seed = parseInt(bin.slice(0, 4)) || 1234;
    const bank = binBanks[seed % binBanks.length];
    const country = binCountries[seed % binCountries.length];

    const grid = document.getElementById('binInfoGrid');
    grid.innerHTML = `
        <div class="bin-info-item">
            <span class="info-label">BIN Number</span>
            <span class="info-value"><i class="fas fa-hashtag"></i> ${bin}</span>
        </div>
        <div class="bin-info-item">
            <span class="info-label">Card Brand</span>
            <span class="info-value"><i class="${getBrandIcon(info.brand.toLowerCase())}"></i> ${info.brand}</span>
        </div>
        <div class="bin-info-item">
            <span class="info-label">Card Type</span>
            <span class="info-value"><i class="fas fa-credit-card"></i> ${info.type}</span>
        </div>
        <div class="bin-info-item">
            <span class="info-label">Card Level</span>
            <span class="info-value"><i class="fas fa-star"></i> ${info.level}</span>
        </div>
        <div class="bin-info-item">
            <span class="info-label">Issuing Bank</span>
            <span class="info-value"><i class="fas fa-university"></i> ${bank}</span>
        </div>
        <div class="bin-info-item">
            <span class="info-label">Country</span>
            <span class="info-value"><i class="fas fa-globe"></i> ${country.flag} ${country.name}</span>
        </div>
        <div class="bin-info-item">
            <span class="info-label">Country Code</span>
            <span class="info-value"><i class="fas fa-map"></i> ${country.code}</span>
        </div>
        <div class="bin-info-item">
            <span class="info-label">Luhn Valid</span>
            <span class="info-value"><i class="fas fa-check-circle" style="color: var(--success)"></i> Algorithm Supported</span>
        </div>
    `;

    document.getElementById('binResults').style.display = 'block';
    document.getElementById('binResults').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// ==================== CC CHECKER ====================

function checkCards() {
    const input = document.getElementById('ccCheckInput').value.trim();
    if (!input) { showToast('Please enter card details'); return; }

    const lines = input.split('\n').filter(l => l.trim());
    const tbody = document.getElementById('checkerBody');
    tbody.innerHTML = '';

    let validCount = 0;
    let invalidCount = 0;

    lines.forEach((line, i) => {
        const parts = line.split('|').map(p => p.trim());
        const number = (parts[0] || '').replace(/\s/g, '');
        const expiry = parts[1] || 'N/A';
        const cvv = parts[2] || 'N/A';
        const brand = detectBrand(number);
        const isLuhnValid = luhnValidate(number);
        
        // Check expiry validity
        let expiryValid = false;
        if (expiry !== 'N/A' && expiry.includes('/')) {
            const [mm, yy] = expiry.split('/');
            const month = parseInt(mm);
            const year = parseInt('20' + yy);
            const now = new Date();
            const expDate = new Date(year, month);
            expiryValid = expDate > now && month >= 1 && month <= 12;
        }

        const isValid = isLuhnValid && expiryValid && number.length >= 13;
        if (isValid) validCount++;
        else invalidCount++;

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${i + 1}</td>
            <td>${formatCardNumber(number)}</td>
            <td>${expiry}</td>
            <td>${cvv}</td>
            <td><i class="${getBrandIcon(brand)} brand-icon"></i></td>
            <td>${isLuhnValid ? '<span class="status-valid">PASS</span>' : '<span class="status-invalid">FAIL</span>'}</td>
            <td>${isValid ? '<span class="status-valid">VALID</span>' : '<span class="status-invalid">INVALID</span>'}</td>
        `;
        tbody.appendChild(tr);
    });

    document.getElementById('statLive').textContent = validCount + ' Valid';
    document.getElementById('statDead').textContent = invalidCount + ' Invalid';
    document.getElementById('checkerResults').style.display = 'block';
    document.getElementById('checkerResults').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// ==================== INIT ====================

document.addEventListener('DOMContentLoaded', () => {
    initTabs();

    // CC Generator
    document.getElementById('generateBtn').addEventListener('click', generateCards);
    document.getElementById('copyAllBtn').addEventListener('click', copyAllCards);
    document.getElementById('clearBtn').addEventListener('click', clearResults);
    document.getElementById('binInput').addEventListener('keypress', e => { if (e.key === 'Enter') generateCards(); });
    document.getElementById('binInput').addEventListener('input', e => {
        e.target.value = e.target.value.replace(/\D/g, '').slice(0, 6);
    });

    // Temp Mail
    document.getElementById('generateEmailBtn').addEventListener('click', generateTempEmail);
    document.getElementById('refreshInboxBtn').addEventListener('click', refreshInbox);
    document.getElementById('copyEmailBtn').addEventListener('click', () => {
        if (currentEmail) copyToClipboard(currentEmail);
        else showToast('Generate an email first!');
    });

    // Fake Address
    document.getElementById('generateAddrBtn').addEventListener('click', generateAddress);
    document.getElementById('copyAllAddrBtn').addEventListener('click', copyAllAddresses);

    // BIN Lookup
    document.getElementById('lookupBinBtn').addEventListener('click', lookupBin);
    document.getElementById('binLookupInput').addEventListener('keypress', e => { if (e.key === 'Enter') lookupBin(); });
    document.getElementById('binLookupInput').addEventListener('input', e => {
        e.target.value = e.target.value.replace(/\D/g, '').slice(0, 8);
    });

    // CC Checker
    document.getElementById('checkCcBtn').addEventListener('click', checkCards);
});
