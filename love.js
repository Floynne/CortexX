// ==========================================
// 1. ДАННЫЕ (ТОЧНАЯ ДАТА: 04.12.2022 00:36:03)
// ==========================================
const anniversaryDate = new Date(2022, 11, 4, 0, 36, 3);

// Ваши фото для сердца (папка images123)
const photoList = [
  'images123/photo1.jpg', 'images123/photo2.jpg',
  'images123/photo3.jpg', 'images123/photo4.jpg',
  'images123/photo5.jpg', 'images123/photo6.jpg',
  'images123/photo7.jpg', 'images123/photo8.jpg',
  'images123/photo9.jpg', 'images123/photo10.jpg',
  'images123/photo11.jpg', 'images123/photo12.jpg',
  'images123/photo13.jpg', 'images123/photo14.jpg'
];

// ==========================================
// 2. ЗВУКОВОЙ ДВИЖОК WEB AUDIO API
// ==========================================
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playTone(freq, type, duration) {
  try {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.01, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  } catch (e) {}
}

function soundPop(pitch = 580) { playTone(pitch, 'sine', 0.12); }
function soundWoosh() { playTone(320, 'triangle', 0.25); }
function soundChime() {
  playTone(523.25, 'sine', 0.2);
  setTimeout(() => playTone(659.25, 'sine', 0.2), 80);
  setTimeout(() => playTone(783.99, 'sine', 0.3), 160);
}

// ==========================================
// 3. ИНТЕРАКТИВНЫЕ ИСКРЫ ПРИ КАСАНИИ ЭКРАНА
// ==========================================
function spawnTouchSparkle(x, y) {
  const emojis = ['✨', '💖', '⭐', '🌸', '💕'];
  for (let i = 0; i < 4; i++) {
    const el = document.createElement('div');
    el.className = 'touch-sparkle';
    el.innerText = emojis[Math.floor(Math.random() * emojis.length)];
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    
    const tx = (Math.random() - 0.5) * 70;
    const ty = (Math.random() - 0.7) * 70;
    el.style.setProperty('--tx', `${tx}px`);
    el.style.setProperty('--ty', `${ty}px`);
    
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 650);
  }
}

window.addEventListener('pointerdown', (e) => {
  spawnTouchSparkle(e.clientX, e.clientY);
}, { passive: true });

// ==========================================
// 4. СПЛЭШ-СКРИН
// ==========================================
window.addEventListener('load', () => {
  setTimeout(() => {
    const splash = document.getElementById('splashScreen');
    if (splash) {
      splash.classList.add('fade-out');
      soundPop(640);
    }
  }, 1800);
});

// ==========================================
// 5. УПРАВЛЕНИЕ СЛАЙДАМИ И ПЕРЕХОДАМИ
// ==========================================
let currentSlide = 0;
let isTransitioning = false;
const slides = document.querySelectorAll('.story-slide');
const totalSlides = slides.length;
const timelineBox = document.getElementById('storiesProgress');
const curtain = document.getElementById('transitionCurtain');
const curtainTitle = document.getElementById('curtainTitle');
const curtainIcon = document.getElementById('curtainIcon');

// Создаем полосочки историй сверху
for (let i = 0; i < totalSlides; i++) {
  const seg = document.createElement('div');
  seg.className = `story-segment ${i === 0 ? 'active' : ''}`;
  seg.innerHTML = '<div class="story-fill"></div>';
  timelineBox.appendChild(seg);
}

function updateTimeline() {
  const segments = document.querySelectorAll('.story-segment');
  segments.forEach((s, idx) => {
    s.classList.remove('active', 'passed');
    if (idx < currentSlide) s.classList.add('passed');
    if (idx === currentSlide) s.classList.add('active');
  });
}

function goToSlide(idx) {
  if (idx < 0 || idx >= totalSlides || isTransitioning) return;

  const isLastSlide = (idx === totalSlides - 1);

  // ЕСЛИ ЭТО ПОСЛЕДНИЙ СЛАЙД — показываем «А теперь...»!
  if (isLastSlide) {
    isTransitioning = true;
    curtainTitle.innerText = "А теперь... Главный вопрос всей моей жизни 💍";
    curtainIcon.innerText = "💍";
    curtain.classList.add('show');
    soundChime();

    setTimeout(() => {
      slides.forEach((s, i) => s.classList.toggle('active', i === idx));
      currentSlide = idx;
      updateTimeline();

      setTimeout(() => {
        curtain.classList.remove('show');
        isTransitioning = false;
      }, 450);
    }, 800);
    return;
  }

  // ДЛЯ ВСЕХ ОСТАЛЬНЫХ СЛАЙДОВ — обычный мгновенный и плавный переход
  slides.forEach((s, i) => s.classList.toggle('active', i === idx));
  currentSlide = idx;
  updateTimeline();
  soundPop(580);

  // Если это слайд с сердцем (слайд 6, index 5) — вырисовываем по 1 фото
  if (currentSlide === 5) {
    animateHeartPhotosSequentially();
  }
}

function nextSlide() {
  if (currentSlide < totalSlides - 1) {
    goToSlide(currentSlide + 1);
  }
}

// Старт по первой кнопке
document.getElementById('startBtn').addEventListener('click', () => {
  const bgMusic = document.getElementById('bgMusic');
  bgMusic.play().catch(() => {});
  if (audioCtx.state === 'suspended') audioCtx.resume();
  triggerConfetti();
  nextSlide();
  setInterval(createFloatingIcon, 450);
});

// Умный свайп (не сбивает чтение письма и карточек)
let touchStartY = 0;
let isScrollZone = false;

window.addEventListener('touchstart', (e) => {
  const scrollable = e.target.closest('.letter-scroll-body, .memories-grid-scroll, .dc-chat-stream, .btn-arena, .zoom-modal, .envelope-box');
  if (scrollable) {
    isScrollZone = true;
    return;
  }
  isScrollZone = false;
  touchStartY = e.changedTouches[0].screenY;
}, { passive: true });

window.addEventListener('touchend', (e) => {
  if (isScrollZone || isTransitioning) return;
  
  const deltaY = touchStartY - e.changedTouches[0].screenY;
  if (deltaY > 60 && currentSlide < totalSlides - 1) nextSlide();
  else if (deltaY < -60 && currentSlide > 0) goToSlide(currentSlide - 1);
}, { passive: true });

// ==========================================
// 6. ЖИВОЙ ТАЙМЕР
// ==========================================
function updateLiveClock() {
  const now = new Date();
  const diff = now - anniversaryDate;

  const sec = Math.floor((diff / 1000) % 60);
  const min = Math.floor((diff / (1000 * 60)) % 60);
  const hrs = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  document.getElementById('days').innerText = String(days);
  document.getElementById('hours').innerText = String(hrs).padStart(2, '0');
  document.getElementById('minutes').innerText = String(min).padStart(2, '0');
  document.getElementById('seconds').innerText = String(sec).padStart(2, '0');
}
setInterval(updateLiveClock, 1000);
updateLiveClock();

// ==========================================
// 7. СЕРДЦЕ ИЗ ФОТО С ВЫРИСОВКОЙ ПО 1 ШТУКЕ
// ==========================================
function buildGiantHeart() {
  const container = document.getElementById('giantHeartGrid');
  const count = photoList.length;
  const cx = 160;
  const cy = 130;
  const scale = 7.4;

  photoList.forEach((src, i) => {
    const t = (Math.PI * 2 / count) * i;
    const x = 16 * Math.pow(Math.sin(t), 3);
    const y = -(13 * Math.cos(t) - 5 * Math.cos(2*t) - 2 * Math.cos(3*t) - Math.cos(4*t));

    const rot = (Math.sin(i * 45) * 15).toFixed(1);

    const card = document.createElement('div');
    card.className = 'heart-polaroid-item';
    card.style.left = `${cx + x * scale - 29}px`;
    card.style.top = `${cy + y * scale - 32}px`;
    card.dataset.rotation = rot;
    card.style.zIndex = i + 2;

    const img = document.createElement('img');
    img.src = src;
    img.onerror = () => {
      img.src = 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=160&auto=format&fit=crop&q=80';
    };

    card.appendChild(img);
    card.onclick = () => openZoom(img.src);
    container.appendChild(card);
  });
}
window.addEventListener('load', buildGiantHeart);

// Поочередное появление фоток
function animateHeartPhotosSequentially() {
  const items = document.querySelectorAll('.heart-polaroid-item');
  items.forEach((item) => {
    item.classList.remove('spawned');
    item.style.transform = 'scale(0) rotate(0deg)';
  });

  items.forEach((item, index) => {
    setTimeout(() => {
      item.classList.add('spawned');
      const rot = item.dataset.rotation || '0';
      item.style.transform = `scale(1) rotate(${rot}deg)`;
      soundPop(480 + index * 30);
    }, index * 110);
  });
}

// Зум фото
const photoZoomModal = document.getElementById('photoZoomModal');
const zoomImgTarget = document.getElementById('zoomImgTarget');
function openZoom(src) {
  zoomImgTarget.src = src;
  photoZoomModal.style.display = 'flex';
  soundPop(720);
}
document.querySelector('.modal-close-btn').onclick = () => photoZoomModal.style.display = 'none';
photoZoomModal.onclick = (e) => { if (e.target === photoZoomModal) photoZoomModal.style.display = 'none'; };

// ==========================================
// 8. КОНВЕРТ С ПИСЬМОМ
// ==========================================
document.getElementById('loveEnvelope').addEventListener('click', function(e) {
  if (e.target.closest('.letter-scroll-body') && this.classList.contains('open')) {
    return;
  }
  this.classList.toggle('open');
  soundPop(620);
});

// ==========================================
// 9. ИДЕАЛЬНАЯ УБЕГАЮЩАЯ КНОПКА «НЕТ»
// ==========================================
const noBtn = document.getElementById('noBtn');
const yesBtn = document.getElementById('yesBtn');
const arenaBox = document.getElementById('arenaBox');
let noAttempts = 0;
let yesScale = 1;

const noTexts = [
  'Нет 😜',
  'Не-а 😂',
  'Даже не думай!',
  'Кнопка сломалась ❌',
  'Только ДА! ❤️'
];

function escapeNoButton(e) {
  if (e) {
    e.preventDefault();
    e.stopPropagation();
  }
  if (navigator.vibrate) navigator.vibrate(40);
  soundWoosh();

  noAttempts++;

  const arenaW = arenaBox.clientWidth;
  const arenaH = arenaBox.clientHeight;
  const btnW = noBtn.offsetWidth || 85;

  const maxShiftX = (arenaW - btnW - 30);
  const maxShiftY = (arenaH / 2) - 26;

  const randX = -Math.floor(Math.random() * (maxShiftX * 0.75));
  const randY = Math.floor((Math.random() - 0.5) * (maxShiftY * 1.6));

  noBtn.style.transform = `translate(${randX}px, ${randY}px)`;
  noBtn.innerText = noTexts[Math.min(noAttempts, noTexts.length - 1)];

  yesScale += 0.12;
  yesBtn.style.transform = `scale(${yesScale})`;
}

noBtn.addEventListener('touchstart', escapeNoButton, { passive: false });
noBtn.addEventListener('mouseenter', escapeNoButton);

yesBtn.addEventListener('click', () => {
  triggerConfetti();
  setTimeout(triggerConfetti, 400);
  setTimeout(triggerConfetti, 800);
  yesBtn.innerText = 'Я ЗНАЛ! ЛЮБЛЮ ТЕБЯ! 💖';
  yesBtn.style.background = '#ff0055';
  yesBtn.style.color = '#fff';
  yesBtn.style.transform = 'scale(1.1)';
  noBtn.style.display = 'none';
  playTone(880, 'sine', 0.4);
});

// ==========================================
// 10. КОНФЕТТИ И ЗВЕЗДНОЕ НЕБО
// ==========================================
function triggerConfetti() {
  confetti({
    particleCount: 90,
    spread: 75,
    origin: { y: 0.6 },
    colors: ['#ff2a6d', '#5865F2', '#ffffff', '#ffd166']
  });
}

function createFloatingIcon() {
  const layer = document.getElementById('heartsLayer');
  const el = document.createElement('div');
  el.className = 'floating-icon';
  el.innerHTML = ['❤️', '💖', '✨', '🎮', '🚗', '💕', '💍', '🏡', '🌸'][Math.floor(Math.random() * 9)];
  el.style.left = Math.random() * 92 + 'vw';
  el.style.animationDuration = Math.random() * 2 + 3.5 + 's';
  el.style.fontSize = Math.random() * 10 + 14 + 'px';
  layer.appendChild(el);

  setTimeout(() => el.remove(), 5500);
}

// Звезды на Canvas
const canvas = document.getElementById('starsCanvas');
const ctx = canvas.getContext('2d');
let stars = [];

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

for (let i = 0; i < 40; i++) {
  stars.push({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    r: Math.random() * 1.2 + 0.4,
    a: Math.random(),
    speed: Math.random() * 0.02 + 0.005
  });
}

function renderCanvasStars() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  stars.forEach(s => {
    s.a += s.speed;
    if (s.a > 1 || s.a < 0) s.speed = -s.speed;
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255, 255, 255, ${Math.abs(s.a)})`;
    ctx.fill();
  });
  requestAnimationFrame(renderCanvasStars);
}
renderCanvasStars();