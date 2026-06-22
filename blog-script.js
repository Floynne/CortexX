// === НАСТРОЙКИ ===
const SECRET_PIN = "7777"; // Твой секретный пин-код для добавления статей

// Базовые статьи (чтобы блог не был пустым при первом входе)
const defaultArticles = [
    {
        id: 1,
        title: "Манифест Геймера: Как не выгореть",
        tag: "Mindset",
        desc: "Как играть по 10 часов в день, не терять фокус и сохранять продуктивность в реальной жизни.",
        content: "<p>Гейминг — это не просто развлечение, это стиль жизни. Но многие сталкиваются с выгоранием. Мой секрет прост: грамотное распределение дофамина.</p><p>Во-первых, нужно делать перерывы. Во-вторых, комбинировать игры с написанием кода. Когда ты создаешь что-то свое, мозг отдыхает от бесконечного потребления контента.</p>",
        date: "20.10.2023"
    },
    {
        id: 2,
        title: "Почему я использую Python для буста ПК",
        tag: "Coding / Python",
        desc: "Разбор моего скрипта Cortex Booster. Почему Python идеален для работы с системными процессами.",
        content: "<p>Многие считают Python медленным. Да, это так, если писать на нем тяжелые игровые движки. Но для автоматизации и убийства системных процессов Windows (через библиотеку os и psutil) — это идеальный инструмент.</p><p>Мой скрипт сканирует древо процессов и безжалостно рубит всё, что жрет оперативную память во время катки в CS2 или Valorant.</p>",
        date: "25.10.2023"
    }
];

// Загружаем статьи из LocalStorage или берем базовые
let articles = JSON.parse(localStorage.getItem("floynne_blog")) || defaultArticles;

// === ЛОГИКА ОТОБРАЖЕНИЯ НА СТРАНИЦЕ BLOG.HTML ===
const blogCardsContainer = document.getElementById("blog-cards");
const searchInput = document.getElementById("searchInput");

function renderArticles(arrayToRender) {
    if (!blogCardsContainer) return; // Выходим, если мы не на странице blog.html

    blogCardsContainer.innerHTML = ""; // Очищаем контейнер

    if (arrayToRender.length === 0) {
        blogCardsContainer.innerHTML = "<p style='color: #888;'>Статьи не найдены...</p>";
        return;
    }

    // Рендерим в обратном порядке (новые сверху)
    [...arrayToRender].reverse().forEach(art => {
        const card = document.createElement("a");
        card.href = `article.html?id=${art.id}`;
        card.className = "card hover-target fade-up visible";
        card.innerHTML = `
            <div class="card-border"></div>
            <div class="card-content">
                <div class="card-header">
                    <span class="card-tag">${art.tag}</span>
                    <span style="color: #555; font-size: 0.8rem;">${art.date}</span>
                </div>
                <h3>${art.title}</h3>
                <p>${art.desc}</p>
            </div>
        `;
        blogCardsContainer.appendChild(card);
    });

    // Обновляем эффекты свечения для новых карточек
    updateCardGlow();
}

// Поиск
if (searchInput) {
    searchInput.addEventListener("input", (e) => {
        const query = e.target.value.toLowerCase();
        const filtered = articles.filter(art => 
            art.title.toLowerCase().includes(query) || 
            art.tag.toLowerCase().includes(query) ||
            art.desc.toLowerCase().includes(query)
        );
        renderArticles(filtered);
    });
    
    // Первичный рендер
    renderArticles(articles);
}

// Обновление свечения за курсором для карточек блога
function updateCardGlow() {
    if (blogCardsContainer) {
        blogCardsContainer.onmousemove = e => {
            for(const card of document.getElementsByClassName("card")) {
                const rect = card.getBoundingClientRect(),
                      x = e.clientX - rect.left,
                      y = e.clientY - rect.top;
                card.style.setProperty("--mouse-x", `${x}px`);
                card.style.setProperty("--mouse-y", `${y}px`);
            }
        };
    }
}

// === ЛОГИКА МОДАЛЬНЫХ ОКОН (АВТОРИЗАЦИЯ И СОЗДАНИЕ) ===
const pinModal = document.getElementById("pinModal");
const editorModal = document.getElementById("editorModal");
const pinError = document.getElementById("pinError");
const pinInput = document.getElementById("pinInput");

function openPinModal() {
    pinModal.classList.add("active");
    pinInput.value = "";
    pinError.style.display = "none";
    pinInput.focus();
}

function closeModals() {
    if(pinModal) pinModal.classList.remove("active");
    if(editorModal) editorModal.classList.remove("active");
}

function verifyPin() {
    if (pinInput.value === SECRET_PIN) {
        pinModal.classList.remove("active");
        editorModal.classList.add("active");
    } else {
        pinError.style.display = "block";
        pinInput.value = "";
    }
}

// Сохранение новой статьи
function saveArticle() {
    const title = document.getElementById("artTitle").value;
    const tag = document.getElementById("artTag").value;
    const desc = document.getElementById("artDesc").value;
    const content = document.getElementById("artContent").value;

    if (!title || !content) {
        alert("Заголовок и текст обязательны!");
        return;
    }

    // Получаем текущую дату
    const today = new Date();
    const dateStr = `${today.getDate().toString().padStart(2, '0')}.${(today.getMonth() + 1).toString().padStart(2, '0')}.${today.getFullYear()}`;

    const newArticle = {
        id: Date.now(), // Уникальный ID
        title: title,
        tag: tag || "Общее",
        desc: desc || "Без описания...",
        content: content.replace(/\n/g, "<br>"), // Заменяем переносы строк на тег <br>
        date: dateStr
    };

    articles.push(newArticle);
    localStorage.setItem("floynne_blog", JSON.stringify(articles)); // Сохраняем в кэш

    closeModals();
    
    // Очищаем форму
    document.getElementById("artTitle").value = "";
    document.getElementById("artTag").value = "";
    document.getElementById("artDesc").value = "";
    document.getElementById("artContent").value = "";

    renderArticles(articles); // Обновляем список на экране
}

// === ЛОГИКА СТРАНИЦЫ ЧТЕНИЯ (ARTICLE.HTML) ===
const urlParams = new URLSearchParams(window.location.search);
const articleId = urlParams.get('id');

if (articleId) {
    const art = articles.find(a => a.id == articleId);
    
    if (art) {
        document.getElementById("readTitle").innerText = art.title;
        document.getElementById("readTag").innerText = art.tag;
        document.getElementById("readDate").innerText = art.date;
        document.getElementById("readContent").innerHTML = art.content;
    } else {
        document.getElementById("readTitle").innerText = "Статья не найдена";
        document.getElementById("readContent").innerHTML = "<p>Возможно, она была удалена.</p>";
    }
}