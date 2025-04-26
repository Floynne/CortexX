document.addEventListener('DOMContentLoaded', () => {
    // Получаем элементы DOM
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const loggedInUserContainer = document.getElementById('logged-in-user');
    const loggedInAvatarSpan = document.getElementById('logged-in-avatar'); // Это div
    const loggedInUsernameSpan = document.getElementById('logged-in-username');
    const logoutBtn = document.getElementById('logout-btn');
    const showRegisterLink = document.getElementById('show-register');
    const showLoginLink = document.getElementById('show-login');
    const welcomeMessageH2 = document.getElementById('welcome-message');
    const loginTriggerBtn = document.getElementById('login-trigger-btn');

    // Элементы модального окна авторизации
    const authModalOverlay = document.getElementById('auth-modal-overlay');
    const authModalContent = document.getElementById('auth-modal-content');
    const modalCloseBtn = document.getElementById('modal-close-btn');
    const authMessageModalDiv = document.getElementById('auth-message-modal');

    // ЭЛЕМЕНТЫ МОДАЛЬНОГО ОКНА АВАТАРОВ
    const avatarSelectModalOverlay = document.getElementById('avatar-select-modal-overlay');
    const avatarSelectModalContent = document.getElementById('avatar-select-modal-content');
    const avatarModalCloseBtn = document.getElementById('avatar-modal-close-btn');
    const avatarChoicesContainer = document.getElementById('avatar-choices');

    // ЭЛЕМЕНТЫ ДЛЯ ЗАГРУЗКИ АВАТАРА
    const uploadAvatarBtn = document.getElementById('upload-avatar-btn');
    const avatarFileInput = document.getElementById('avatar-file-input');
    const uploadErrorMessage = document.getElementById('upload-error-message');

    // Ключи для localStorage
    const USERS_STORAGE_KEY = 'hubUsers'; // Хранит { username: hashedPassword, username_avatar_type: type, username_avatar_value: value }
    const CURRENT_USER_KEY = 'hubCurrentUser'; // Хранит объект { username, avatar: {type, value} }

    // Предопределенные аватары и дефолтный
    const AVAILABLE_AVATARS = ['👤', '🧑‍💻', '👩‍💻', '😎', '🚀', '🎨', '💡', '🎵', '🎮', '📚', '🧪', '⚙️', '👽', '🤖', '👻', '🦊', '🦄', '🐲', '🌟', '🍕'];
    const DEFAULT_AVATAR = { type: 'emoji', value: '👤' };

    // --- Функции Хранилища ---
    function getUsers() {
        const usersJson = localStorage.getItem(USERS_STORAGE_KEY);
        try { return usersJson ? JSON.parse(usersJson) : {}; }
        catch (e) { console.error("Error parsing users from localStorage", e); return {}; }
     }
    function saveUsers(users) {
        try { localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users)); }
        catch (e) { console.error("Error saving users to localStorage", e); }
    }
    function getCurrentUser() {
        const userJson = localStorage.getItem(CURRENT_USER_KEY);
        try { return userJson ? JSON.parse(userJson) : null; }
        catch (e) { console.error("Error parsing current user", e); localStorage.removeItem(CURRENT_USER_KEY); return null; }
    }
    function setCurrentUser(userObject) {
        if (userObject && userObject.username) {
            userObject.avatar = userObject.avatar && userObject.avatar.type && userObject.avatar.value ? userObject.avatar : DEFAULT_AVATAR;
            localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(userObject));
        } else {
            localStorage.removeItem(CURRENT_USER_KEY);
        }
    }
    function updateUserAvatar(avatarObject) {
        const currentUser = getCurrentUser();
        if (currentUser && avatarObject && avatarObject.type && avatarObject.value) {
            currentUser.avatar = avatarObject;
            setCurrentUser(currentUser);

            const users = getUsers();
            users[currentUser.username + '_avatar_type'] = avatarObject.type; // Сохраняем тип
            users[currentUser.username + '_avatar_value'] = avatarObject.value; // Сохраняем значение
            saveUsers(users);

            updateAvatarDisplay(avatarObject);
        }
    }

    // --- "Хеширование" Пароля ---
    function poorMansHash(password) {
        try { const salt = "cortex_hub_salt_demo"; return btoa(password + salt); }
        catch (e) { console.error("Hashing failed", e); return password; }
     }

    // --- Функции UI ---
    function displayAuthMessage(message, isError = false) { authMessageModalDiv.textContent = message; authMessageModalDiv.className = 'auth-message'; if (message) { authMessageModalDiv.classList.add(isError ? 'error' : 'success'); } }
    function clearAuthMessage() { authMessageModalDiv.textContent = ''; authMessageModalDiv.className = 'auth-message'; }
    function showLoginFormInModal() { loginForm.classList.remove('hidden'); registerForm.classList.add('hidden'); clearAuthMessage(); }
    function showRegisterFormInModal() { loginForm.classList.add('hidden'); registerForm.classList.remove('hidden'); clearAuthMessage(); }

    function openAuthModal() { clearAuthMessage(); showLoginFormInModal(); authModalOverlay.classList.remove('hidden'); setTimeout(() => { authModalOverlay.classList.add('modal-visible'); }, 10); }
    function closeAuthModal() { authModalOverlay.classList.remove('modal-visible'); setTimeout(() => { authModalOverlay.classList.add('hidden'); }, 300); }

    function openAvatarModal() { populateAvatarChoices(); displayUploadError(''); avatarSelectModalOverlay.classList.remove('hidden'); setTimeout(() => { avatarSelectModalOverlay.classList.add('modal-visible'); }, 10); }
    function closeAvatarModal() { avatarSelectModalOverlay.classList.remove('modal-visible'); setTimeout(() => { avatarSelectModalOverlay.classList.add('hidden'); }, 300); }

    function populateAvatarChoices() {
        if (!avatarChoicesContainer) return;
        avatarChoicesContainer.innerHTML = '';
        const currentUser = getCurrentUser();
        AVAILABLE_AVATARS.forEach(avatar => {
            const choice = document.createElement('span'); choice.className = 'avatar-choice';
            choice.textContent = avatar; choice.dataset.avatar = avatar;
            avatarChoicesContainer.appendChild(choice);
        });
    }

    function displayUploadError(message) {
        uploadErrorMessage.textContent = message;
        uploadErrorMessage.classList.toggle('error', !!message);
    }

    function updateAvatarDisplay(avatarObject) {
        if (!loggedInAvatarSpan) return;
        const avatar = avatarObject || DEFAULT_AVATAR;
        if (avatar.type === 'image' && avatar.value) {
            loggedInAvatarSpan.textContent = '';
            loggedInAvatarSpan.style.backgroundImage = `url(${avatar.value})`;
        } else {
            loggedInAvatarSpan.style.backgroundImage = 'none';
            loggedInAvatarSpan.textContent = avatar.value || DEFAULT_AVATAR.value;
        }
    }

    function showLoggedInView(userObject) {
        loginTriggerBtn?.classList.add('hidden');
        loggedInUserContainer.classList.remove('hidden');
        updateAvatarDisplay(userObject.avatar);
        loggedInUsernameSpan.textContent = userObject.username;
        welcomeMessageH2.textContent = `Добро пожаловать, ${userObject.username}!`;
        closeAuthModal();
    }
    function showLoggedOutView() {
        loginTriggerBtn?.classList.remove('hidden');
        loggedInUserContainer.classList.add('hidden');
        welcomeMessageH2.textContent = `Добро пожаловать!`;
        closeAuthModal(); closeAvatarModal();
    }

    // --- Обработчики Событий ---
    loginTriggerBtn?.addEventListener('click', openAuthModal);
    modalCloseBtn?.addEventListener('click', closeAuthModal);
    authModalOverlay?.addEventListener('click', (e) => { if (e.target === authModalOverlay) closeAuthModal(); });
    avatarModalCloseBtn?.addEventListener('click', closeAvatarModal);
    avatarSelectModalOverlay?.addEventListener('click', (e) => { if (e.target === avatarSelectModalOverlay) closeAvatarModal(); });
    loggedInAvatarSpan?.addEventListener('click', () => { if (getCurrentUser()) { openAvatarModal(); } });
    avatarChoicesContainer?.addEventListener('click', (e) => { if (e.target.classList.contains('avatar-choice')) { const selectedAvatar = e.target.dataset.avatar; if (selectedAvatar) { updateUserAvatar({ type: 'emoji', value: selectedAvatar }); closeAvatarModal(); } } });

    uploadAvatarBtn?.addEventListener('click', () => { avatarFileInput?.click(); });
    avatarFileInput?.addEventListener('change', (event) => {
        displayUploadError('');
        const file = event.target.files?.[0];
        if (!file) return;
        if (!file.type.startsWith('image/')) { displayUploadError('Пожалуйста, выберите файл изображения.'); avatarFileInput.value = ''; return; }
        const maxSizeMB = 1;
        if (file.size > maxSizeMB * 1024 * 1024) { displayUploadError(`Файл слишком большой (макс. ${maxSizeMB} МБ).`); avatarFileInput.value = ''; return; }

        const reader = new FileReader();
        reader.onload = (e) => { const imageDataUrl = e.target.result; updateUserAvatar({ type: 'image', value: imageDataUrl }); closeAvatarModal(); };
        reader.onerror = (e) => { console.error("File reading error", e); displayUploadError('Не удалось прочитать файл.'); };
        reader.readAsDataURL(file);
        avatarFileInput.value = '';
    });


    loginForm?.addEventListener('submit', (e) => {
        e.preventDefault(); clearAuthMessage();
        const username = document.getElementById('login-username').value.trim();
        const password = document.getElementById('login-password').value;
        if (!username || !password) { displayAuthMessage("Заполните все поля.", true); return; }
        const users = getUsers(); const hashedPassword = poorMansHash(password);
        if (users[username] && users[username] === hashedPassword) {
            const avatarType = users[username + '_avatar_type'] || DEFAULT_AVATAR.type;
            const avatarValue = users[username + '_avatar_value'] || DEFAULT_AVATAR.value;
            const userObject = { username: username, avatar: {type: avatarType, value: avatarValue} };
            setCurrentUser(userObject); showLoggedInView(userObject); loginForm.reset();
        } else { displayAuthMessage("Неверное имя пользователя или пароль.", true); }
    });

    registerForm?.addEventListener('submit', (e) => {
        e.preventDefault(); clearAuthMessage();
        const username = document.getElementById('register-username').value.trim();
        const password = document.getElementById('register-password').value;
        const passwordConfirm = document.getElementById('register-password-confirm').value;
        if (!username || !password || !passwordConfirm) { displayAuthMessage("Заполните все поля.", true); return; }
        if (password !== passwordConfirm) { displayAuthMessage("Пароли не совпадают.", true); return; }
        if (password.length < 4) { displayAuthMessage("Пароль должен быть не менее 4 символов.", true); return; }
        const users = getUsers();
        if (users[username]) { displayAuthMessage("Пользователь с таким именем уже существует.", true); }
        else {
            const hashedPassword = poorMansHash(password);
            users[username] = hashedPassword;
            users[username + '_avatar_type'] = DEFAULT_AVATAR.type;
            users[username + '_avatar_value'] = DEFAULT_AVATAR.value;
            saveUsers(users);
            const userObject = { username: username, avatar: DEFAULT_AVATAR };
            setCurrentUser(userObject); showLoggedInView(userObject); registerForm.reset();
        }
    });

    showRegisterLink?.addEventListener('click', (e) => { e.preventDefault(); showRegisterFormInModal(); });
    showLoginLink?.addEventListener('click', (e) => { e.preventDefault(); showLoginFormInModal(); });
    logoutBtn?.addEventListener('click', () => { setCurrentUser(null); showLoggedOutView(); });

    // --- Инициализация при загрузке страницы ---
    const currentUser = getCurrentUser();
    if (currentUser) { showLoggedInView(currentUser); }
    else { showLoggedOutView(); }
});