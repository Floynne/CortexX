document.addEventListener('DOMContentLoaded', () => {

    // 1. КАСТОМНЫЙ КУРСОР
    const cursorDot = document.querySelector('.cursor-dot');
    const cursorOutline = document.querySelector('.cursor-outline');
    const hoverTargets = document.querySelectorAll('.hover-target, .card, a, button');

    if (window.innerWidth > 768) {
        window.addEventListener('mousemove', (e) => {
            const posX = e.clientX;
            const posY = e.clientY;

            cursorDot.style.left = `${posX}px`;
            cursorDot.style.top = `${posY}px`;

            cursorOutline.animate({
                left: `${posX}px`,
                top: `${posY}px`
            }, { duration: 500, fill: "forwards" });
        });

        hoverTargets.forEach(target => {
            target.addEventListener('mouseenter', () => {
                document.body.classList.add('cursor-hover');
            });
            target.addEventListener('mouseleave', () => {
                document.body.classList.remove('cursor-hover');
            });
        });
    }

    // 2. ИНТЕРАКТИВНЫЕ КАРТОЧКИ (Свечение за мышкой)
    const cardsContainer = document.getElementById("cards");
    if (cardsContainer) {
        cardsContainer.onmousemove = e => {
            for(const card of document.getElementsByClassName("card")) {
                const rect = card.getBoundingClientRect(),
                      x = e.clientX - rect.left,
                      y = e.clientY - rect.top;
                card.style.setProperty("--mouse-x", `${x}px`);
                card.style.setProperty("--mouse-y", `${y}px`);
            }
        };
    }

    // 3. АНИМАЦИЯ ПЕЧАТНОЙ МАШИНКИ (Developer, Designer, Gamer)
    const typewriterElement = document.getElementById('typewriter');
    if (typewriterElement) {
        const words = ["Developer", "Designer", "Gamer"];
        let wordIndex = 0;
        let charIndex = 0;
        let isDeleting = false;

        function type() {
            const currentWord = words[wordIndex];
            
            if (isDeleting) {
                typewriterElement.textContent = currentWord.substring(0, charIndex - 1);
                charIndex--;
            } else {
                typewriterElement.textContent = currentWord.substring(0, charIndex + 1);
                charIndex++;
            }

            let typingSpeed = isDeleting ? 50 : 120;

            if (!isDeleting && charIndex === currentWord.length) {
                typingSpeed = 2000; // Пауза когда слово написано полностью
                isDeleting = true;
            } else if (isDeleting && charIndex === 0) {
                isDeleting = false;
                wordIndex = (wordIndex + 1) % words.length; // Переход к следующему слову
                typingSpeed = 500; // Пауза перед началом печати нового слова
            }

            setTimeout(type, typingSpeed);
        }

        // Запуск печатной машинки через секунду после загрузки (чтобы анимация успела выплыть снизу)
        setTimeout(type, 1000);
    }

    // 4. АНИМАЦИИ ПОЯВЛЕНИЯ ПРИ СКРОЛЛЕ
    const observerOptions = { threshold: 0.1, rootMargin: "0px 0px -50px 0px" };
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, observerOptions);

    const fadeElements = document.querySelectorAll('.fade-up');
    fadeElements.forEach(el => observer.observe(el));

    // Появление элементов главного экрана сразу при загрузке
    setTimeout(() => {
        document.querySelectorAll('.hero .fade-up').forEach(el => {
            el.classList.add('visible');
        });
    }, 100);
});

// === ЛОГИКА ОКНА ПОДДЕРЖКИ (DONATE) ===
const supportModal = document.getElementById('supportModal');

function openSupportModal() {
    if(supportModal) supportModal.classList.add('active');
}

function closeSupportModal() {
    if(supportModal) supportModal.classList.remove('active');
}

// Закрытие по клику вне окна
if (supportModal) {
    supportModal.addEventListener('click', (e) => {
        if (e.target === supportModal) closeSupportModal();
    });
}

// Функция копирования текста
function copyToClipboard(text, element) {
    // Копируем в буфер обмена
    navigator.clipboard.writeText(text).then(() => {
        // Добавляем класс для зеленой анимации
        element.classList.add('copied');
        
        // Убираем класс через 2 секунды
        setTimeout(() => {
            element.classList.remove('copied');
        }, 2000);
    }).catch(err => {
        console.error('Ошибка копирования: ', err);
    });
}