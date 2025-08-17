document.addEventListener('DOMContentLoaded', () => {

    // =========================================================================
    // ОБЩИЕ СКРИПТЫ (Работают на всех страницах, где есть класс .hidden)
    // =========================================================================

    const hiddenElements = document.querySelectorAll('.hidden');
    if (hiddenElements.length > 0) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry, i) => {
                if (entry.isIntersecting) {
                    // Добавляем небольшую задержку для красивого каскадного появления
                    setTimeout(() => {
                        entry.target.classList.add('visible');
                    }, i * 100);
                }
            });
        }, {
            threshold: 0.1
        });
        hiddenElements.forEach(el => observer.observe(el));
    }


    // =========================================================================
    // СКРИПТЫ ТОЛЬКО ДЛЯ ГЛАВНОЙ СТРАНИЦЫ (index.html)
    // =========================================================================

    // --- Эффект печатающейся машинки ---
    const typingElement = document.querySelector('.typing-effect');
    if (typingElement) {
        const words = ["ЗАЩИТЫ", "АНАЛИТИКИ", "БЕЗОПАСНОСТИ"];
        let wordIndex = 0;
        let charIndex = 0;
        let isDeleting = false;

        function type() {
            const currentWord = words[wordIndex];
            const currentChar = isDeleting ?
                currentWord.substring(0, charIndex - 1) :
                currentWord.substring(0, charIndex + 1);

            typingElement.textContent = currentChar;

            if (!isDeleting && charIndex < currentWord.length) {
                charIndex++;
                setTimeout(type, 150);
            } else if (isDeleting && charIndex > 0) {
                charIndex--;
                setTimeout(type, 100);
            } else {
                isDeleting = !isDeleting;
                if (!isDeleting) {
                    wordIndex = (wordIndex + 1) % words.length;
                }
                setTimeout(type, 1200);
            }
        }
        type();
    }

    // --- Анимация частиц на фоне (CANVAS) ---
    const canvas = document.getElementById('particle-canvas');
    if (canvas) {
        const ctx = canvas.getContext('2d');
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        let particlesArray;

        class Particle {
            constructor(x, y, directionX, directionY, size) {
                this.x = x;
                this.y = y;
                this.directionX = directionX;
                this.directionY = directionY;
                this.size = size;
            }
            draw() {
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2, false);
                ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
                ctx.fill();
            }
            update() {
                if (this.x > canvas.width || this.x < 0) this.directionX = -this.directionX;
                if (this.y > canvas.height || this.y < 0) this.directionY = -this.directionY;
                this.x += this.directionX;
                this.y += this.directionY;
                this.draw();
            }
        }

        function init() {
            particlesArray = [];
            let numberOfParticles = (canvas.height * canvas.width) / 9000;
            for (let i = 0; i < numberOfParticles; i++) {
                let size = (Math.random() * 2) + 1;
                let x = (Math.random() * ((innerWidth - size * 2) - (size * 2)) + size * 2);
                let y = (Math.random() * ((innerHeight - size * 2) - (size * 2)) + size * 2);
                let directionX = (Math.random() * 0.4) - 0.2;
                let directionY = (Math.random() * 0.4) - 0.2;
                particlesArray.push(new Particle(x, y, directionX, directionY, size));
            }
        }

        function connect() {
            let maxDistance = 120;
            for (let a = 0; a < particlesArray.length; a++) {
                for (let b = a; b < particlesArray.length; b++) {
                    let distance = ((particlesArray[a].x - particlesArray[b].x) ** 2) + ((particlesArray[a].y - particlesArray[b].y) ** 2);
                    if (distance < (maxDistance ** 2)) {
                        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
                        ctx.lineWidth = 1;
                        ctx.beginPath();
                        ctx.moveTo(particlesArray[a].x, particlesArray[a].y);
                        ctx.lineTo(particlesArray[b].x, particlesArray[b].y);
                        ctx.stroke();
                    }
                }
            }
        }

        function animate() {
            requestAnimationFrame(animate);
            ctx.clearRect(0, 0, innerWidth, innerHeight);
            for (let i = 0; i < particlesArray.length; i++) {
                particlesArray[i].update();
            }
            connect();
        }

        window.addEventListener('resize', () => {
            canvas.width = innerWidth;
            canvas.height = innerHeight;
            init();
        });

        init();
        animate();
    }


    // =========================================================================
    // СКРИПТЫ ТОЛЬКО ДЛЯ СТРАНИЦЫ КУРСОВ (courses.html)
    // =========================================================================

    const accordionContainer = document.querySelector('.accordion-container');
    if (accordionContainer) {
        const accordionItems = document.querySelectorAll('.accordion-item');
        const progressKey = 'nexusAcademyProgress';

        // --- Функция для загрузки и отображения прогресса ---
        function loadProgress() {
            const completedLessons = JSON.parse(localStorage.getItem(progressKey)) || [];
            accordionItems.forEach(item => {
                const lessonId = item.dataset.lessonId;
                if (completedLessons.includes(lessonId)) {
                    item.classList.add('completed');
                }
            });
        }

        // --- Функция для сохранения прогресса ---
        function saveProgress(lessonId) {
            let completedLessons = JSON.parse(localStorage.getItem(progressKey)) || [];
            if (!completedLessons.includes(lessonId)) {
                completedLessons.push(lessonId);
                localStorage.setItem(progressKey, JSON.stringify(completedLessons));
            }
        }

        // --- Логика работы аккордеона и сохранения прогресса ---
        accordionItems.forEach(item => {
            const header = item.querySelector('.accordion-header');
            const lessonLink = item.querySelector('.lesson-link');

            // Обработчик для открытия/закрытия аккордеона
            header.addEventListener('click', () => {
                const isActive = item.classList.contains('active');
                accordionItems.forEach(otherItem => {
                    otherItem.classList.remove('active');
                });
                if (!isActive) {
                    item.classList.add('active');
                }
            });

            // Обработчик для кнопки "Перейти к уроку"
            if (lessonLink) {
                lessonLink.addEventListener('click', (e) => {
                    const lessonId = item.dataset.lessonId;
                    saveProgress(lessonId);
                    // Класс 'completed' будет добавлен при следующей загрузке страницы
                });
            }
        });

        // Загружаем прогресс при каждой загрузке страницы курсов
        loadProgress();
    }


    // =========================================================================
    // СКРИПТЫ ТОЛЬКО ДЛЯ СТРАНИЦ УРОКОВ (lesson-*.html)
    // =========================================================================

    const lessonNav = document.querySelector('.lesson-nav');
    if (lessonNav) {
        // --- Логика для подсветки навигации при скролле ("Spy Scrolling") ---
        const navLinks = lessonNav.querySelectorAll('.nav-link');
        const sections = document.querySelectorAll('.lesson-content section');
        
        const observerOptions = {
            rootMargin: '-20% 0px -80% 0px', // Активирует секцию, когда она в верхней трети экрана
            threshold: 0
        };

        const sectionObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const id = entry.target.getAttribute('id');
                    navLinks.forEach(link => {
                        link.classList.remove('active');
                        if (link.getAttribute('href') === `#${id}`) {
                            link.classList.add('active');
                        }
                    });
                }
            });
        }, observerOptions);

        sections.forEach(section => {
            sectionObserver.observe(section);
        });

        // --- Логика для кнопок "Копировать код" ---
        const copyButtons = document.querySelectorAll('.copy-btn');
        copyButtons.forEach(button => {
            button.addEventListener('click', () => {
                const codeBlock = button.previousElementSibling;
                const codeText = codeBlock.innerText;
                
                navigator.clipboard.writeText(codeText).then(() => {
                    button.textContent = 'Скопировано!';
                    button.style.backgroundColor = '#3498db'; // Синий для обратной связи
                    setTimeout(() => {
                        button.textContent = 'Копировать';
                        button.style.backgroundColor = ''; // Возвращаем исходный цвет
                    }, 2000);
                }).catch(err => {
                    console.error('Ошибка копирования: ', err);
                    button.textContent = 'Ошибка';
                });
            });
        });
    }

}); // Конец основного события DOMContentLoaded