document.addEventListener('DOMContentLoaded', () => {
    const loadingOverlay = document.getElementById('loading-overlay');
    const loadingStatusText = document.getElementById('loading-status-text');
    const greetingTitle = document.getElementById('greeting-title');
    const hubContainer = document.querySelector('.hub-container');

    if (loadingOverlay && hubContainer) {
        const statusTextDelay = 1000; // Задержка перед скрытием текста статуса
        const greetingDelay = 1500; // Задержка перед показом заголовка
        const greetingDuration = 1800; // Длительность анимации заголовка
        const overlayFadeDelay = greetingDelay + greetingDuration + 3300; // Задержка перед скрытием оверлея
        const contentFadeDelay = overlayFadeDelay + 200; // Задержка для контента хаба

        document.body.classList.add('loading-active');

        // Создаём и настраиваем аудиоэлемент
        const audio = document.createElement('audio');
        audio.src = '1.mp3'; // Путь к вашему файлу в корне GitHub Pages
        audio.volume = 0.3; // Громкость (0.0 до 1.0, 0.3 = 30%)
        audio.preload = 'auto';
        audio.autoplay = true; // Пытаемся включить автопроигрывание
        document.body.appendChild(audio);

        // Пробуем воспроизвести музыку сразу
        audio.play().catch((e) => {
            console.warn("Ошибка воспроизведения аудио:", e);
            // Если автопроигрывание заблокировано, запускаем по клику
            const startAudio = () => {
                audio.play().then(() => {
                    console.log("Музыка запущена после клика");
                    document.removeEventListener('click', startAudio);
                }).catch((err) => {
                    console.warn("Ошибка при запуске по клику:", err);
                });
            };
            document.addEventListener('click', startAudio);
        });

        // Скрываем текст статуса
        setTimeout(() => {
            loadingStatusText?.classList.add('hidden');
        }, statusTextDelay);

        // Показываем заголовок
        setTimeout(() => {
            if (greetingTitle) {
                greetingTitle.classList.remove('hidden');
                greetingTitle.classList.add('visible');
                void greetingTitle.offsetWidth; // Принудительный рефлоу для анимации
            }
        }, greetingDelay);

        // Скрываем оверлей загрузки
        setTimeout(() => {
            loadingOverlay.classList.add('hidden');
        }, overlayFadeDelay);

        // Показываем контент хаба
        setTimeout(() => {
            hubContainer.classList.remove('hidden-initially');
            void hubContainer.offsetWidth; // Принудительный рефлоу
            hubContainer.classList.add('visible');
        }, contentFadeDelay);

        // Убираем состояние загрузки
        setTimeout(() => {
            document.body.classList.remove('loading-active');
        }, overlayFadeDelay + 1000);
    } else {
        hubContainer?.classList.remove('hidden-initially');
        hubContainer?.classList.add('visible');
        console.warn("Элементы оверлея загрузки не найдены. Пропускаем анимацию.");
    }

    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const loggedInUserContainer = document.getElementById('logged-in-user');
    const loggedInAvatarDiv = document.getElementById('logged-in-avatar');
    const loggedInUsernameSpan = document.getElementById('logged-in-username');
    const logoutBtn = document.getElementById('logout-btn');
    const showRegisterLink = document.getElementById('show-register');
    const showLoginLink = document.getElementById('show-login');
    const welcomeMessageH2 = document.getElementById('welcome-message');
    const loginTriggerBtn = document.getElementById('login-trigger-btn');
    const authModalOverlay = document.getElementById('auth-modal-overlay');
    const authModalContent = document.getElementById('auth-modal-content');
    const modalCloseBtn = document.getElementById('modal-close-btn');
    const authMessageModalDiv = document.getElementById('auth-message-modal');
    const avatarSelectModalOverlay = document.getElementById('avatar-select-modal-overlay');
    const avatarSelectModalContent = document.getElementById('avatar-select-modal-content');
    const avatarModalCloseBtn = document.getElementById('avatar-modal-close-btn');
    const avatarChoicesContainer = document.getElementById('avatar-choices');
    const uploadAvatarBtn = document.getElementById('upload-avatar-btn');
    const avatarFileInput = document.getElementById('avatar-file-input');
    const uploadErrorMessage = document.getElementById('upload-error-message');

    const USERS_STORAGE_KEY = 'hubUsers';
    const CURRENT_USER_KEY = 'hubCurrentUser';
    const AVAILABLE_AVATARS = ['👤', '🧑‍💻', '👩‍💻', '😎', '🚀', '🎨', '💡', '🎵', '🎮', '📚', '🧪', '⚙️', '👽', '🤖', '👻', '🦊', '🦄', '🐲', '🌟', '🍕'];
    const DEFAULT_AVATAR = { type: 'emoji', value: '👤' };

    function getUsers() {
        const usersJson = localStorage.getItem(USERS_STORAGE_KEY);
        try { return usersJson ? JSON.parse(usersJson) : {}; }
        catch (e) { console.error("Ошибка парсинга пользователей из localStorage", e); return {}; }
    }
    function saveUsers(users) {
        try { localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users)); }
        catch (e) { console.error("Ошибка сохранения пользователей в localStorage", e); }
    }
    function getCurrentUser() {
        const userJson = localStorage.getItem(CURRENT_USER_KEY);
        try { return userJson ? JSON.parse(userJson) : null; }
        catch (e) { console.error("Ошибка парсинга текущего пользователя", e); localStorage.removeItem(CURRENT_USER_KEY); return null; }
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
            if (users[currentUser.username]) {
                users[currentUser.username + '_avatar_type'] = avatarObject.type;
                users[currentUser.username + '_avatar_value'] = avatarObject.value;
                saveUsers(users);
            }
            updateAvatarDisplay(avatarObject);
        }
    }
    function poorMansHash(password) {
        try {
            const salt = "cortex_hub_salt_demo_v2_super_secret_and_long";
            return btoa(salt + password + password.length + salt.slice(password.length % salt.length));
        } catch (e) {
            console.error("Ошибка кодирования Base64", e);
            return password + "_fallback";
        }
    }
    function displayAuthMessage(message, isError = false, targetElement = authMessageModalDiv) {
        if (!targetElement) return;
        targetElement.textContent = message;
        targetElement.className = 'auth-message';
        if (message) {
            targetElement.classList.add(isError ? 'error' : 'success');
            targetElement.style.display = 'block';
        } else {
            targetElement.style.display = 'none';
        }
    }
    function clearAuthMessage(targetElement = authMessageModalDiv) {
        displayAuthMessage('', false, targetElement);
    }
    function showLoginFormInModal() {
        loginForm?.classList.remove('hidden');
        registerForm?.classList.add('hidden');
        clearAuthMessage();
        loginForm?.querySelector('input')?.focus();
    }
    function showRegisterFormInModal() {
        loginForm?.classList.add('hidden');
        registerForm?.classList.remove('hidden');
        clearAuthMessage();
        registerForm?.querySelector('input')?.focus();
    }
    function openAuthModal() {
        clearAuthMessage();
        showLoginFormInModal();
        authModalOverlay?.classList.remove('hidden');
        setTimeout(() => { authModalOverlay?.classList.add('modal-visible'); }, 10);
        loginForm?.querySelector('input')?.focus();
    }
    function closeAuthModal() {
        authModalOverlay?.classList.remove('modal-visible');
        setTimeout(() => { authModalOverlay?.classList.add('hidden'); }, 400);
    }
    function openAvatarModal() {
        populateAvatarChoices();
        clearAuthMessage(uploadErrorMessage);
        avatarSelectModalOverlay?.classList.remove('hidden');
        setTimeout(() => { avatarSelectModalOverlay?.classList.add('modal-visible'); }, 10);
    }
    function closeAvatarModal() {
        avatarSelectModalOverlay?.classList.remove('modal-visible');
        setTimeout(() => { avatarSelectModalOverlay?.classList.add('hidden'); }, 400);
    }
    function populateAvatarChoices() {
        if (!avatarChoicesContainer) return;
        avatarChoicesContainer.innerHTML = '';
        AVAILABLE_AVATARS.forEach(avatar => {
            const choice = document.createElement('span');
            choice.className = 'avatar-choice';
            choice.textContent = avatar;
            choice.dataset.avatar = avatar;
            choice.title = `Выбрать ${avatar}`;
            choice.setAttribute('role', 'button');
            choice.setAttribute('tabindex', '0');
            avatarChoicesContainer.appendChild(choice);
        });
    }
    function updateAvatarDisplay(avatarObject) {
        if (!loggedInAvatarDiv) return;
        const avatar = (avatarObject && avatarObject.type && avatarObject.value) ? avatarObject : DEFAULT_AVATAR;
        loggedInAvatarDiv.textContent = '';
        loggedInAvatarDiv.style.backgroundImage = 'none';
        if (avatar.type === 'image') {
            loggedInAvatarDiv.style.backgroundImage = `url(${avatar.value})`;
        } else {
            loggedInAvatarDiv.textContent = avatar.value;
        }
    }
    function showLoggedInView(userObject) {
        if (!userObject || !userObject.username) return;
        loginTriggerBtn?.classList.add('hidden');
        loggedInUserContainer?.classList.remove('hidden');
        updateAvatarDisplay(userObject.avatar || DEFAULT_AVATAR);
        if (loggedInUsernameSpan) loggedInUsernameSpan.textContent = userObject.username;
        if (welcomeMessageH2) welcomeMessageH2.textContent = `Добро пожаловать, ${userObject.username}!`;
        closeAuthModal();
    }
    function showLoggedOutView() {
        loginTriggerBtn?.classList.remove('hidden');
        loggedInUserContainer?.classList.add('hidden');
        if (welcomeMessageH2) welcomeMessageH2.textContent = `Добро пожаловать!`;
    }
    loginTriggerBtn?.addEventListener('click', openAuthModal);
    modalCloseBtn?.addEventListener('click', closeAuthModal);
    authModalOverlay?.addEventListener('click', (e) => { if (e.target === authModalOverlay) closeAuthModal(); });
    avatarModalCloseBtn?.addEventListener('click', closeAvatarModal);
    avatarSelectModalOverlay?.addEventListener('click', (e) => { if (e.target === avatarSelectModalOverlay) closeAvatarModal(); });
    loggedInAvatarDiv?.addEventListener('click', () => { if (getCurrentUser()) { openAvatarModal(); } });
    avatarChoicesContainer?.addEventListener('click', (e) => {
        const target = e.target.closest('.avatar-choice');
        if (target) {
            const selectedAvatar = target.dataset.avatar;
            if (selectedAvatar) {
                updateUserAvatar({ type: 'emoji', value: selectedAvatar });
                closeAvatarModal();
            }
        }
    });
    avatarChoicesContainer?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            const target = e.target.closest('.avatar-choice');
            if (target) {
                e.preventDefault();
                const selectedAvatar = target.dataset.avatar;
                if (selectedAvatar) {
                    updateUserAvatar({ type: 'emoji', value: selectedAvatar });
                    closeAvatarModal();
                }
            }
        }
    });
    uploadAvatarBtn?.addEventListener('click', () => { avatarFileInput?.click(); });
    avatarFileInput?.addEventListener('change', (event) => {
        clearAuthMessage(uploadErrorMessage);
        const file = event.target.files?.[0];
        if (!file) return;
        if (!file.type.startsWith('image/')) {
            displayAuthMessage('Пожалуйста, выберите файл изображения (PNG, JPG, GIF, WebP).', true, uploadErrorMessage);
            avatarFileInput.value = '';
            return;
        }
        const maxSizeMB = 2;
        if (file.size > maxSizeMB * 1024 * 1024) {
            displayAuthMessage(`Файл слишком большой (макс. ${maxSizeMB} МБ).`, true, uploadErrorMessage);
            avatarFileInput.value = '';
            return;
        }
        const reader = new FileReader();
        reader.onload = (e) => {
            const imageDataUrl = e.target?.result;
            if (typeof imageDataUrl === 'string' && imageDataUrl.startsWith('data:image/')) {
                updateUserAvatar({ type: 'image', value: imageDataUrl });
                closeAvatarModal();
            } else {
                console.error("Результат FileReader не является валидным URL изображения:", e.target?.result);
                displayAuthMessage('Не удалось обработать файл. Попробуйте другой.', true, uploadErrorMessage);
            }
        };
        reader.onerror = (e) => {
            console.error("Ошибка чтения файла", e);
            displayAuthMessage('Ошибка при чтении файла.', true, uploadErrorMessage);
        };
        reader.readAsDataURL(file);
        avatarFileInput.value = '';
    });
    loginForm?.addEventListener('submit', (e) => {
        e.preventDefault();
        clearAuthMessage();
        const usernameInput = document.getElementById('login-username');
        const passwordInput = document.getElementById('login-password');
        const username = usernameInput.value.trim();
        const password = passwordInput.value;
        if (!username || !password) {
            displayAuthMessage("Пожалуйста, заполните имя пользователя и пароль.", true);
            return;
        }
        const users = getUsers();
        const storedHash = users[username];
        const enteredHash = poorMansHash(password);
        if (storedHash && storedHash === enteredHash) {
            const avatarType = users[username + '_avatar_type'] || DEFAULT_AVATAR.type;
            const avatarValue = users[username + '_avatar_value'] || DEFAULT_AVATAR.value;
            const userObject = { username: username, avatar: { type: avatarType, value: avatarValue } };
            setCurrentUser(userObject);
            showLoggedInView(userObject);
            loginForm.reset();
        } else {
            displayAuthMessage("Неверное имя пользователя или пароль.", true);
            authModalContent?.classList.add('shake');
            setTimeout(() => authModalContent?.classList.remove('shake'), 500);
        }
    });
    registerForm?.addEventListener('submit', (e) => {
        e.preventDefault();
        clearAuthMessage();
        const usernameInput = document.getElementById('register-username');
        const passwordInput = document.getElementById('register-password');
        const passwordConfirmInput = document.getElementById('register-password-confirm');
        const username = usernameInput.value.trim();
        const password = passwordInput.value;
        const passwordConfirm = passwordConfirmInput.value;
        if (!username || !password || !passwordConfirm) {
            displayAuthMessage("Пожалуйста, заполните все поля.", true);
            return;
        }
        if (password !== passwordConfirm) {
            displayAuthMessage("Пароли не совпадают.", true);
            passwordConfirmInput.focus();
            return;
        }
        if (password.length < 4) {
            displayAuthMessage("Пароль должен содержать минимум 4 символа.", true);
            passwordInput.focus();
            return;
        }
        const users = getUsers();
        if (users[username]) {
            displayAuthMessage("Пользователь с таким именем уже зарегистрирован.", true);
            usernameInput.focus();
        } else {
            const hashedPassword = poorMansHash(password);
            users[username] = hashedPassword;
            users[username + '_avatar_type'] = DEFAULT_AVATAR.type;
            users[username + '_avatar_value'] = DEFAULT_AVATAR.value;
            saveUsers(users);
            const userObject = { username: username, avatar: DEFAULT_AVATAR };
            setCurrentUser(userObject);
            showLoggedInView(userObject);
            registerForm.reset();
        }
    });
    showRegisterLink?.addEventListener('click', (e) => { e.preventDefault(); showRegisterFormInModal(); });
    showLoginLink?.addEventListener('click', (e) => { e.preventDefault(); showLoginFormInModal(); });
    logoutBtn?.addEventListener('click', () => {
        setCurrentUser(null);
        showLoggedOutView();
    });
    const contentFadeInDelayInit = 500;
    const currentUser = getCurrentUser();
    setTimeout(() => {
        if (currentUser) {
            showLoggedInView(currentUser);
        } else {
            showLoggedOutView();
        }
        if (welcomeMessageH2 && welcomeMessageH2.textContent === "Загрузка..." && !currentUser) {
            welcomeMessageH2.textContent = "Добро пожаловать!";
        }
    }, contentFadeInDelayInit + 100);

    // Инжектируем CSS для анимации тряски
    const style = document.createElement('style');
    style.textContent = `
        @keyframes shake {
            0%, 100% { transform: translateX(0); }
            10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
            20%, 40%, 60%, 80% { transform: translateX(5px); }
        }
        .modal-content.shake {
            animation: shake 0.5s ease-in-out;
        }
    `;
    document.head.appendChild(style);
});
