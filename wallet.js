// База данных в памяти браузера (содержит всех юзеров)
let db = JSON.parse(localStorage.getItem('premium_fin_db')) || { users: {} };
let currentUser = localStorage.getItem('premium_fin_current_user');

// Режимы авторизации
let isLoginMode = true;

const DOM = {
    // Auth
    authView: document.getElementById('auth-view'),
    appView: document.getElementById('app-view'),
    authForm: document.getElementById('auth-form'),
    usernameInput: document.getElementById('username'),
    passwordInput: document.getElementById('password'),
    authTitle: document.getElementById('auth-title'),
    authSubtitle: document.getElementById('auth-subtitle'),
    authBtn: document.getElementById('auth-btn'),
    authSwitchText: document.getElementById('auth-switch-text'),
    authSwitchBtn: document.getElementById('auth-switch-btn'),
    userAvatar: document.getElementById('user-avatar'),
    themeIcon: document.getElementById('theme-icon'),
    
    // App
    balance: document.getElementById('total-balance'),
    income: document.getElementById('total-income'),
    expense: document.getElementById('total-expense'),
    usdt: document.getElementById('total-usdt'),
    list: document.getElementById('transaction-list'),
    form: document.getElementById('transaction-form'),
    modal: document.getElementById('modal'),
    modalTitle: document.getElementById('modal-title'),
    currencySymbol: document.getElementById('currency-symbol'),
    emptyState: document.getElementById('empty-state')
};

// --- СИСТЕМА АВТОРИЗАЦИИ ---

// Проверка при загрузке страницы
function checkAuth() {
    if (currentUser && db.users[currentUser]) {
        // Пользователь вошел
        DOM.authView.classList.remove('active');
        DOM.appView.classList.add('active');
        DOM.userAvatar.innerText = currentUser.charAt(0).toUpperCase();
        applyTheme(db.users[currentUser].theme || 'light');
        initApp(); // Загружаем данные юзера
    } else {
        // Пользователь не вошел
        DOM.authView.classList.add('active');
        DOM.appView.classList.remove('active');
    }
}

// Переключение Вход / Регистрация
function toggleAuthMode() {
    isLoginMode = !isLoginMode;
    if(isLoginMode) {
        DOM.authTitle.innerText = 'Вход в аккаунт';
        DOM.authSubtitle.innerText = 'С возвращением! Введите данные.';
        DOM.authBtn.innerText = 'Войти';
        DOM.authSwitchText.innerText = 'Нет аккаунта?';
        DOM.authSwitchBtn.innerText = 'Создать';
    } else {
        DOM.authTitle.innerText = 'Регистрация';
        DOM.authSubtitle.innerText = 'Создайте свой личный трекер.';
        DOM.authBtn.innerText = 'Зарегистрироваться';
        DOM.authSwitchText.innerText = 'Уже есть аккаунт?';
        DOM.authSwitchBtn.innerText = 'Войти';
    }
}

// Обработка формы входа/регистрации
DOM.authForm.addEventListener('submit', function(e) {
    e.preventDefault();
    const username = DOM.usernameInput.value.trim().toLowerCase();
    const password = DOM.passwordInput.value;

    if(isLoginMode) {
        // Логика ВХОДА
        if(db.users[username] && db.users[username].password === password) {
            login(username);
        } else {
            alert('Неверный логин или пароль!');
        }
    } else {
        // Логика РЕГИСТРАЦИИ
        if(db.users[username]) {
            alert('Пользователь с таким именем уже существует!');
        } else {
            db.users[username] = {
                password: password,
                transactions: [],
                theme: 'light'
            };
            saveDB();
            login(username);
        }
    }
});

function login(username) {
    currentUser = username;
    localStorage.setItem('premium_fin_current_user', username);
    DOM.authForm.reset();
    checkAuth();
}

function logout() {
    currentUser = null;
    localStorage.removeItem('premium_fin_current_user');
    checkAuth();
}

function saveDB() {
    localStorage.setItem('premium_fin_db', JSON.stringify(db));
}

// --- ТЁМНАЯ ТЕМА ---
function toggleTheme() {
    let currentTheme = db.users[currentUser].theme || 'light';
    let newTheme = currentTheme === 'light' ? 'dark' : 'light';
    
    db.users[currentUser].theme = newTheme;
    saveDB();
    applyTheme(newTheme);
}

function applyTheme(theme) {
    if (theme === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
        DOM.themeIcon.classList.replace('ph-moon', 'ph-sun');
    } else {
        document.documentElement.removeAttribute('data-theme');
        DOM.themeIcon.classList.replace('ph-sun', 'ph-moon');
    }
}

// --- ЛОГИКА ПРИЛОЖЕНИЯ (Для текущего юзера) ---

function getTransactions() {
    return db.users[currentUser].transactions;
}

function openModal(type) {
    document.getElementById('type').value = type;
    document.getElementById('date').valueAsDate = new Date();
    
    if(type === 'income') {
        DOM.modalTitle.innerText = 'Добавить пополнение';
        DOM.currencySymbol.innerText = '$';
    } else if(type === 'expense') {
        DOM.modalTitle.innerText = 'Добавить расход';
        DOM.currencySymbol.innerText = '$';
    } else if(type === 'usdt') {
        DOM.modalTitle.innerText = 'Купить USDT';
        DOM.currencySymbol.innerText = '₮';
    }
    DOM.modal.classList.add('active');
}

function closeModal() {
    DOM.modal.classList.remove('active');
    setTimeout(() => DOM.form.reset(), 200);
}

DOM.form.addEventListener('submit', function(e) {
    e.preventDefault();
    const type = document.getElementById('type').value;
    const amount = Math.abs(parseFloat(document.getElementById('amount').value));
    const category = document.getElementById('category').value;
    const date = document.getElementById('date').value;

    db.users[currentUser].transactions.push({ id: Date.now(), type, amount, category, date });
    saveDB();
    initApp();
    closeModal();
});

function formatMoney(amount) {
    return new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount);
}

function getCategoryIcon(category, type) {
    if (type === 'usdt') return '<i class="ph ph-currency-circle-dollar" style="color: var(--color-blue)"></i>';
    const icons = { 'Зарплата': '<i class="ph ph-briefcase"></i>', 'Фриланс': '<i class="ph ph-laptop"></i>', 'Крипта': '<i class="ph ph-currency-btc"></i>', 'Покупки': '<i class="ph ph-shopping-bag"></i>', 'Трейдинг': '<i class="ph ph-chart-line-up"></i>' };
    return icons[category] || '<i class="ph ph-wallet"></i>';
}

function addTransactionDOM(transaction) {
    const isUSDT = transaction.type === 'usdt';
    const sign = transaction.type === 'expense' ? '-' : '+';
    const currency = isUSDT ? '₮' : '$';
    let colorClass = transaction.type === 'income' ? 'text-green' : '';

    const item = document.createElement('li');
    item.innerHTML = `
        <div class="li-left">
            <div class="li-icon">${getCategoryIcon(transaction.category, transaction.type)}</div>
            <div class="li-info">
                <span class="li-title">${transaction.category}</span>
                <span class="li-date">${new Date(transaction.date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
            </div>
        </div>
        <div class="li-right ${colorClass}">
            ${sign}${formatMoney(transaction.amount)} ${currency}
            <button class="delete-btn" onclick="removeTransaction(${transaction.id})"><i class="ph ph-trash"></i></button>
        </div>
    `;
    DOM.list.appendChild(item);
}

function animateValue(element, start, end, duration, prefix = '', suffix = '') {
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        const currentVal = (1 - Math.pow(1 - progress, 4)) * (end - start) + start;
        element.innerText = `${prefix}${formatMoney(currentVal)}${suffix}`;
        if (progress < 1) window.requestAnimationFrame(step);
        else { element.innerText = `${prefix}${formatMoney(end)}${suffix}`; element.dataset.value = end; }
    };
    window.requestAnimationFrame(step);
}

function updateValues() {
    const tr = getTransactions();
    const income = tr.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
    const expense = tr.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
    const usdt = tr.filter(t => t.type === 'usdt').reduce((acc, t) => acc + t.amount, 0);
    const balance = income - expense;

    animateValue(DOM.balance, parseFloat(DOM.balance.dataset.value) || 0, balance, 1000, '$');
    animateValue(DOM.income, parseFloat(DOM.income.dataset.value) || 0, income, 1000, '+$');
    animateValue(DOM.expense, parseFloat(DOM.expense.dataset.value) || 0, expense, 1000, '-$');
    animateValue(DOM.usdt, parseFloat(DOM.usdt.dataset.value) || 0, usdt, 1000, '', ' ₮');
}

function removeTransaction(id) {
    db.users[currentUser].transactions = db.users[currentUser].transactions.filter(t => t.id !== id);
    saveDB();
    initApp();
}

function initApp() {
    DOM.list.innerHTML = '';
    const tr = getTransactions();
    if(tr.length === 0) {
        DOM.emptyState.style.display = 'flex';
    } else {
        DOM.emptyState.style.display = 'none';
        tr.sort((a, b) => new Date(b.date) - new Date(a.date)).forEach(addTransactionDOM);
    }
    updateValues();
}

// Запуск при открытии сайта
checkAuth();