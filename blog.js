document.addEventListener('DOMContentLoaded', function() {

    // 1. Плавная анимация появления элементов (Intersection Observer)
    const observerOptions = {
        root: null, // Относительно viewport
        rootMargin: '0px', // Без дополнительных отступов
        threshold: 0.1 // Элемент должен быть виден на 10% для срабатывания
    };

    const observerCallback = (entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                // Применяем базовый класс is-visible, который запускает CSS-анимацию
                entry.target.classList.add('is-visible');
                
                // Для текстовой анимации "по словам/буквам"
                if (entry.target.classList.contains('animate-text-reveal')) {
                    // Вызываем функцию только если текст еще не был обработан
                    if (!entry.target.dataset.textRevealed) {
                        animateTextReveal(entry.target);
                        entry.target.dataset.textRevealed = "true"; // Помечаем, что текст обработан
                    }
                }
                // Отписываемся от элемента после того, как он стал видимым и анимировался,
                // чтобы анимация не повторялась при каждом скролле (если не нужно обратное)
                observer.unobserve(entry.target);
            }
        });
    };

    const observer = new IntersectionObserver(observerCallback, observerOptions);
    
    // Находим все элементы, которые должны анимироваться
    document.querySelectorAll('.animate-pop-in, .animate-slide-in-right, .animate-text-reveal, .animate-hero-graphic, .animate-on-scroll')
        .forEach(el => observer.observe(el));

    // Функция для анимации текста "по буквам"
    function animateTextReveal(textContainer) {
        const originalText = textContainer.textContent.trim();
        textContainer.innerHTML = ''; // Очищаем контейнер, чтобы вставить span'ы

        let charCount = 0; // Общий счетчик символов для задержки
        // Разбиваем текст на слова и пробелы, чтобы сохранить пробелы
        originalText.split(/(\s+)/).forEach((segment) => {
            if (segment.match(/\s+/)) { // Если это пробел(ы)
                textContainer.appendChild(document.createTextNode(segment));
            } else { // Если это слово
                // Обертка для слова (необязательно, но может быть полезна для стилизации или других эффектов)
                const wordWrapperSpan = document.createElement('span');
                wordWrapperSpan.style.display = 'inline-block'; // Позволяет слову вести себя как блок для анимаций дочерних элементов

                segment.split('').forEach((char) => {
                    const charSpan = document.createElement('span');
                    charSpan.textContent = char;
                    charSpan.style.display = 'inline-block'; // Важно для применения transform
                    // Начальные стили (opacity: 0, transform: translateY(20px)...) задаются в CSS
                    // для .animate-text-reveal span > span
                    // JS только устанавливает задержку, чтобы буквы появлялись последовательно
                    charSpan.style.transitionDelay = `${charCount * 0.035 + 0.1}s`; // Задержка = (индекс_буквы * шаг) + начальная_задержка
                    wordWrapperSpan.appendChild(charSpan);
                    charCount++;
                });
                textContainer.appendChild(wordWrapperSpan);
            }
        });
        // Класс .is-visible на родительском textContainer (добавленный IntersectionObserver)
        // теперь заставит CSS-правила для .animate-text-reveal.is-visible span > span анимировать буквы.
    }


    // 2. Обновление года в подвале
    const currentYearSpan = document.getElementById('current-year');
    if (currentYearSpan) {
        currentYearSpan.textContent = new Date().getFullYear();
    }

    // 3. Плавная прокрутка к якорям
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const hrefAttribute = this.getAttribute('href');
            // Убедимся, что это не просто "#" и что элемент с таким ID существует
            if (hrefAttribute.length > 1 && hrefAttribute !== '#') {
                try {
                    const targetElement = document.querySelector(hrefAttribute);
                    if (targetElement) {
                        e.preventDefault();
                        targetElement.scrollIntoView({
                            behavior: 'smooth'
                        });
                    }
                } catch (error) {
                    // Если селектор невалидный (например, "#[123]"), ничего не делаем
                    console.warn("Invalid selector for anchor scroll:", hrefAttribute);
                }
            }
        });
    });

    // 4. Кнопка "Наверх"
    const scrollToTopBtn = document.getElementById('scrollToTopBtn');
    if (scrollToTopBtn) {
        window.addEventListener('scroll', () => {
            if (window.pageYOffset > 400) { // Показать кнопку после прокрутки на 400px
                scrollToTopBtn.classList.add('visible');
            } else {
                scrollToTopBtn.classList.remove('visible');
            }
        });
        scrollToTopBtn.addEventListener('click', () => {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }

    // 5. Подсветка активного пункта меню
    const navLinks = document.querySelectorAll('.main-nav a');
    // Получаем текущий URL без хэша и параметров для более точного сравнения
    const currentCleanUrl = window.location.origin + window.location.pathname;

    navLinks.forEach(link => {
        const linkHref = link.getAttribute('href');
        // Создаем полный URL для ссылки, чтобы корректно сравнивать относительные и абсолютные пути
        // Это важно, если href относительный (например, "articles/page.html")
        const linkFullUrl = new URL(linkHref, window.location.href).href.split('#')[0];
        
        if (linkFullUrl === currentCleanUrl) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
    // Дополнительная обработка для якорных ссылок на текущей странице при загрузке с хэшем
    if (window.location.hash) {
        const activeAnchorLink = document.querySelector(`.main-nav a[href$="${window.location.hash}"]`);
        if (activeAnchorLink) {
             navLinks.forEach(link => link.classList.remove('active')); // Сбросить другие активные
            activeAnchorLink.classList.add('active');
        }
    }


    // 6. Поиск по статьям (на главной странице)
    const searchInput = document.getElementById('searchInput');
    const articlesGrid = document.getElementById('articlesGrid');
    const noResultsMessage = document.getElementById('noResultsMessage');

    if (searchInput && articlesGrid) {
        const articles = Array.from(articlesGrid.getElementsByClassName('article-preview')); // Сохраняем исходный массив статей

        searchInput.addEventListener('input', function() {
            const query = this.value.toLowerCase().trim();
            let found = false;

            articles.forEach(article => {
                const titleElement = article.querySelector('h3 a');
                const excerptElement = article.querySelector('.article-excerpt');
                
                const title = titleElement ? titleElement.textContent.toLowerCase() : '';
                const excerpt = excerptElement ? excerptElement.textContent.toLowerCase() : '';
                
                if (title.includes(query) || excerpt.includes(query)) {
                    article.style.display = ''; // Показываем, если есть совпадение
                    found = true;
                } else {
                    article.style.display = 'none'; // Скрываем, если нет
                }
            });

            if (noResultsMessage) {
                noResultsMessage.style.display = found ? 'none' : 'block';
            }
        });
    }
    
    // 7. Перенаправление поиска со страницы статьи на главную
    const searchInputArticlePage = document.getElementById('searchInputArticle'); // ID для инпута поиска на странице статьи
    if(searchInputArticlePage) {
        searchInputArticlePage.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                const query = this.value.trim();
                if (query) {
                    // Определяем базовый путь к index.html
                    let basePath = './'; // По умолчанию, если мы уже на главной или в корне
                    // Проверяем, находимся ли мы в подпапке /articles/
                    if (window.location.pathname.includes('/articles/')) {
                        basePath = '../'; // Если да, то index.html на уровень выше
                    }
                    window.location.href = `${basePath}index.html?search=${encodeURIComponent(query)}`;
                }
            }
        });
    }

    // Если на главную был выполнен переход с параметром поиска из URL
    const urlParams = new URLSearchParams(window.location.search);
    const searchQueryFromUrl = urlParams.get('search');
    // Убедимся, что мы на главной странице (где есть #searchInput) и есть параметр поиска
    if (searchQueryFromUrl && searchInput && (window.location.pathname.endsWith('index.html') || window.location.pathname.endsWith('/') || window.location.pathname === '')) {
        searchInput.value = decodeURIComponent(searchQueryFromUrl);
        // Инициируем событие input, чтобы запустить фильтрацию статей
        searchInput.dispatchEvent(new Event('input', { bubbles: true }));
    }


    // 8. Эффект "прилипания" и изменения фона шапки при скролле
    const siteHeader = document.querySelector('.site-header');
    if (siteHeader) {
        // const headerHeight = siteHeader.offsetHeight; // Получаем высоту шапки один раз, если нужно для других расчетов
        window.addEventListener('scroll', function() {
            if (window.pageYOffset > 50) { // Начать эффект после прокрутки на 50px
                siteHeader.classList.add('scrolled');
            } else {
                siteHeader.classList.remove('scrolled');
            }
        }, false);
    }

    // 9. Переключатель темы (добавляет/удаляет класс .light-theme и сохраняет выбор)
    const themeToggle = document.getElementById('themeToggle');
    const prefersDarkScheme = window.matchMedia("(prefers-color-scheme: dark)");

    function applyTheme(theme) {
        if (theme === 'light') {
            document.body.classList.add('light-theme');
            if (themeToggle) themeToggle.checked = true;
        } else { // 'dark' or any other value will default to dark
            document.body.classList.remove('light-theme');
            if (themeToggle) themeToggle.checked = false;
        }
    }

    if (themeToggle) {
        // Загружаем сохраненную тему или используем системные предпочтения
        let currentTheme = localStorage.getItem('theme');
        if (!currentTheme) { // Если в localStorage нет сохраненной темы
            currentTheme = prefersDarkScheme.matches ? 'dark' : 'light'; // Используем системную
        }
        applyTheme(currentTheme); // Применяем найденную или системную тему

        themeToggle.addEventListener('change', function() {
            const newTheme = this.checked ? 'light' : 'dark';
            localStorage.setItem('theme', newTheme); // Сохраняем выбор пользователя
            applyTheme(newTheme);
        });

        // Слушаем изменения системной темы (если пользователь меняет ее в ОС)
        // Обновляем тему на сайте, ТОЛЬКО если пользователь еще не сделал явный выбор (т.е. нет записи в localStorage)
        prefersDarkScheme.addEventListener('change', (e) => {
            if (!localStorage.getItem('theme')) {
                applyTheme(e.matches ? 'dark' : 'light');
            }
        });
    } else {
        // Если переключателя нет на странице, можно просто применить системную тему или дефолтную темную.
        // Для консистентности, если тема сохранена, применяем ее. Иначе - системную.
        let currentTheme = localStorage.getItem('theme');
        if (!currentTheme) {
            currentTheme = prefersDarkScheme.matches ? 'dark' : 'light';
        }
        // Если даже на страницах без переключателя хотим темную по умолчанию, можно так:
        // applyTheme(currentTheme === 'light' ? 'light' : 'dark');
        // Но лучше, чтобы тема была консистентна по всему сайту, если localStorage используется.
        // Поэтому просто применяем сохраненную/системную:
        applyTheme(currentTheme);
    }
});