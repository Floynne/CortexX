// 👇 ТВОЙ ВОРКЕР 👇
const WORKER_URL = 'https://bybit.officialmazkey.workers.dev/'; 

const totalEl = document.getElementById('total-balance');
const listEl = document.getElementById('assets-list');
const fullscreenBtn = document.getElementById('fullscreen-btn');

let currentTotal = 0;
let isFirstLoad = true;

// --- 1. Анимация чисел (Count Up) ---
function animateValue(obj, start, end, duration) {
    if (start === end) return;
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        
        // Easing function для плавности в конце
        const ease = 1 - Math.pow(1 - progress, 3);
        
        const val = start + (end - start) * ease;
        obj.innerHTML = val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        
        if (progress < 1) {
            window.requestAnimationFrame(step);
        } else {
            obj.innerHTML = end.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        }
    };
    window.requestAnimationFrame(step);
}

// --- 2. Получение данных ---
async function fetchData() {
    try {
        const res = await fetch(WORKER_URL);
        const data = await res.json();

        if (data.error) throw new Error("API Error");

        const newTotal = data.totalEquity;

        // Логика вспышек (Тренд)
        if (!isFirstLoad && newTotal !== currentTotal) {
            // Снимаем классы анимации, чтобы перезапустить их
            totalEl.classList.remove('flash-up', 'flash-down');
            void totalEl.offsetWidth; // Триггер reflow (перезагрузка анимации)

            if (newTotal > currentTotal) {
                totalEl.classList.add('flash-up');
            } else {
                totalEl.classList.add('flash-down');
            }
        }

        // Запуск счетчика
        animateValue(totalEl, currentTotal, newTotal, 2000); 
        currentTotal = newTotal;
        isFirstLoad = false;

        // Рендер списка
        renderList(data.list);

    } catch (e) {
        console.error("Fetch error:", e);
    }
}

function renderList(list) {
    // ❗ УБРАЛ ЛИМИТ > 1$. Теперь показывает всё, что больше 0.
    const cleanList = list.filter(item => item.usdValue > 0.000001);
    
    if (cleanList.length === 0) {
        listEl.innerHTML = '<div class="loader">Wallet is empty</div>';
        return;
    }

    // Сортируем: дорогие сверху
    const sorted = cleanList.sort((a,b) => b.usdValue - a.usdValue);

    listEl.innerHTML = sorted.map(item => `
        <div class="asset-card">
            <div class="coin-header">${item.coin}</div>
            <div class="coin-amt">${parseFloat(item.amount).toLocaleString('en-US', { maximumFractionDigits: 6 })}</div>
            <div class="coin-val">$${item.usdValue.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
        </div>
    `).join('');
}

// --- 3. Полноэкранный режим "MONITOR" ---
fullscreenBtn.addEventListener('click', () => {
    const body = document.body;
    
    if (!document.fullscreenElement) {
        // Вход в полный экран
        document.documentElement.requestFullscreen().catch(e => console.log(e));
        body.classList.add('monitor-mode');
        fullscreenBtn.innerHTML = "✖"; // Иконка выхода
    } else {
        // Выход
        if (document.exitFullscreen) document.exitFullscreen();
        body.classList.remove('monitor-mode');
        fullscreenBtn.innerHTML = "⛶";
    }
});

// Слушаем Escape
document.addEventListener('fullscreenchange', () => {
    if (!document.fullscreenElement) {
        document.body.classList.remove('monitor-mode');
        fullscreenBtn.innerHTML = "⛶";
    }
});

// --- 4. Фон: Частицы (Starfield) ---
const canvas = document.getElementById('bg-canvas');
const ctx = canvas.getContext('2d');
let width, height;
let particles = [];

function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
}
window.addEventListener('resize', resize);
resize();

class Particle {
    constructor() {
        this.reset();
    }
    reset() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.vx = (Math.random() - 0.5) * 0.5;
        this.vy = (Math.random() - 0.5) * 0.5;
        this.size = Math.random() * 2;
        this.alpha = Math.random() * 0.5 + 0.1;
    }
    update() {
        this.x += this.vx;
        this.y += this.vy;
        if (this.x < 0) this.x = width;
        if (this.x > width) this.x = 0;
        if (this.y < 0) this.y = height;
        if (this.y > height) this.y = 0;
    }
    draw() {
        ctx.fillStyle = `rgba(255, 255, 255, ${this.alpha})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
    }
}

for (let i = 0; i < 120; i++) particles.push(new Particle());

function animateBg() {
    ctx.clearRect(0, 0, width, height);
    
    // Рисуем линии
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    for (let i = 0; i < particles.length; i++) {
        particles[i].update();
        particles[i].draw();
        for (let j = i; j < particles.length; j++) {
            const dx = particles[i].x - particles[j].x;
            const dy = particles[i].y - particles[j].y;
            const dist = Math.sqrt(dx*dx + dy*dy);
            if (dist < 100) {
                ctx.beginPath();
                ctx.moveTo(particles[i].x, particles[i].y);
                ctx.lineTo(particles[j].x, particles[j].y);
                ctx.stroke();
            }
        }
    }
    requestAnimationFrame(animateBg);
}
animateBg();

// --- Старт ---
fetchData();
setInterval(fetchData, 3000); // Обновление каждые 3 сек для динамики