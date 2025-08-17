// --- НАСТРОЙКИ ---
const CUSTOM_SEARCH_API_KEY = "AIzaSyBOB2y6OcY6IlPeDxETPZKK2bYCqomgWSA";
const YOUTUBE_API_KEY = "AIzaSyAvczn526c1NUjTfTpVDhfFPien7Miixw4";
const CX = "028b080368bda459a";

// --- DOM ЭЛЕМЕНТЫ ---
const homeScreen = document.getElementById('home-screen');
const resultsPage = document.getElementById('results-page');
const homeForm = document.getElementById('home-search-form');
const homeInput = document.getElementById('home-search-input');
const resultsForm = document.getElementById('results-search-form');
const resultsInput = document.getElementById('results-search-input');
const usdRateSpan = document.getElementById('usd-rate');
const resultsContainer = document.getElementById('results-container');
const statsContainer = document.getElementById('stats-container');
const paginationContainer = document.getElementById('pagination-container');
const filterPanel = document.getElementById('filter-panel');
const lightbox = document.getElementById('lightbox');
const lightboxImg = document.getElementById('lightbox-img');
const lightboxClose = document.querySelector('.lightbox-close');


// --- СОСТОЯНИЕ ПОИСКА ---
let currentState = {
    query: '',
    start: 1,
    type: 'web',
    nextPageToken: null
};

// --- ОБРАБОТЧИКИ СОБЫТИЙ ---
homeForm.addEventListener('submit', (e) => { e.preventDefault(); const query = homeInput.value.trim(); if (query) { currentState.query = query; resultsInput.value = query; currentState.start = 1; performSearch(); showResultsView(); } });
resultsForm.addEventListener('submit', (e) => { e.preventDefault(); const query = resultsInput.value.trim(); if (query) { currentState.query = query; homeInput.value = query; currentState.start = 1; performSearch(); } });
filterPanel.addEventListener('click', (e) => { if (e.target.tagName === 'BUTTON' && !e.target.disabled) { filterPanel.querySelector('.active').classList.remove('active'); e.target.classList.add('active'); currentState.type = e.target.dataset.type; currentState.start = 1; currentState.nextPageToken = null; performSearch(); } });
resultsContainer.addEventListener('click', (e) => { const imageCard = e.target.closest('.image-item'); if (imageCard) { e.preventDefault(); lightboxImg.src = imageCard.dataset.fullurl; lightbox.classList.add('active'); } });
lightboxClose.addEventListener('click', () => lightbox.classList.remove('active'));
lightbox.addEventListener('click', (e) => { if (e.target === lightbox) { lightbox.classList.remove('active'); } });

// --- ОСНОВНАЯ ЛОГИКА ---
function showResultsView() { homeScreen.classList.add('exiting'); setTimeout(() => { homeScreen.classList.remove('active'); resultsPage.classList.add('active'); homeScreen.classList.remove('exiting'); document.body.style.overflow = 'auto'; }, 400); }
async function performSearch() {
    statsContainer.innerHTML = 'Идет поиск...';
    resultsContainer.innerHTML = '';
    paginationContainer.innerHTML = '';
    try {
        let data;
        if (currentState.type === 'video') {
            data = await searchVideos();
        } else {
            data = await searchWebOrImages();
        }
        displayAll(data);
    } catch (error) {
        console.error("Ошибка:", error);
        statsContainer.innerHTML = `<p style="color: #FF5252;">Произошла ошибка. Проверьте API ключи и лимиты.</p>`;
    }
}
async function searchWebOrImages() { let url = `https://www.googleapis.com/customsearch/v1?key=${CUSTOM_SEARCH_API_KEY}&cx=${CX}&q=${currentState.query}&start=${currentState.start}`; if (currentState.type === 'image') { url += '&searchType=image'; } const response = await fetch(url); if (!response.ok) throw new Error('Ошибка Custom Search API'); return await response.json(); }
async function searchVideos() { let url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${currentState.query}&key=${YOUTUBE_API_KEY}&maxResults=12&type=video`; if (currentState.nextPageToken) { url += `&pageToken=${currentState.nextPageToken}`; } const response = await fetch(url); if (!response.ok) throw new Error('Ошибка YouTube API'); const data = await response.json(); return { items: data.items, queries: { request: [{ totalResults: data.pageInfo.totalResults }] }, nextPageToken: data.nextPageToken, prevPageToken: data.prevPageToken }; }

// --- ОТОБРАЖЕНИЕ РЕЗУЛЬТАТОВ ---
function displayAll(data) {
    statsContainer.innerHTML = '';
    resultsContainer.innerHTML = '';

    const mainContent = document.querySelector('.results-content');
    // ⭐ ВОТ ГЛАВНОЕ ИЗМЕНЕНИЕ: УПРАВЛЯЕМ КЛАССОМ ⭐
    if (currentState.type === 'image' || currentState.type === 'video') {
        mainContent.classList.add('full-bleed');
    } else {
        mainContent.classList.remove('full-bleed');
    }

    if (data.searchInformation?.formattedTotalResults) {
        statsContainer.innerHTML = `Найдено примерно ${data.searchInformation.formattedTotalResults} результатов`;
    } else if (data.queries?.request[0]?.totalResults) {
        statsContainer.innerHTML = `Найдено примерно ${Number(data.queries.request[0].totalResults).toLocaleString('ru-RU')} результатов`;
    }

    resultsContainer.className = currentState.type;

    if (data.items && data.items.length > 0) {
        data.items.forEach((item, index) => {
            let resultElement;
            switch(currentState.type) {
                case 'image': resultElement = createImageCard(item); break;
                case 'video': resultElement = createVideoCard(item); break;
                default: resultElement = createWebCard(item);
            }
            if(resultElement) {
                resultElement.style.animationDelay = `${index * 0.08}s`;
                resultsContainer.appendChild(resultElement);
            }
        });
    } else {
        statsContainer.innerHTML = `По запросу "${currentState.query}" ничего не найдено.`;
    }
    
    createPagination(data);
}

function createWebCard(item) {
    const resultCard = document.createElement('div');
    resultCard.className = 'search-result-card';
    const domain = new URL(item.link).hostname;
    const faviconUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
    resultCard.innerHTML = `<div class="result-header-info"><img src="${faviconUrl}" alt="Favicon" class="favicon" onerror="this.style.display='none'"><div class="result-source"><span class="site-name">${item.pagemap?.metatags?.[0]?.['og:site_name'] || item.displayLink}</span><span class="site-url">${item.formattedUrl}</span></div></div><h3 class="result-title"><a href="${item.link}" target="_blank" rel="noopener">${item.htmlTitle}</a></h3><p class="result-snippet">${item.htmlSnippet}</p>`;
    return resultCard;
}

function createImageCard(item) {
    const resultCard = document.createElement('div');
    resultCard.className = 'search-result-card image-item';
    resultCard.dataset.fullurl = item.link;
    resultCard.innerHTML = `<img src="${item.image.thumbnailLink}" alt="${item.title}" loading="lazy"><div class="image-title">${item.title}</div>`;
    return resultCard;
}

function createVideoCard(item) {
    const snippet = item.snippet;
    const resultCard = document.createElement('a');
    resultCard.className = 'search-result-card video-card';
    resultCard.href = `https://www.youtube.com/watch?v=${item.id.videoId}`;
    resultCard.target = '_blank';
    resultCard.rel = 'noopener';
    resultCard.innerHTML = `<div class="video-thumbnail"><img src="${snippet.thumbnails.high.url}" alt="" loading="lazy"><div class="play-icon"><svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg></div></div><div class="video-info"><h3>${snippet.title}</h3><p>${snippet.channelTitle}</p></div>`;
    return resultCard;
}

// --- ПАГИНАЦИЯ ---
function createPagination(data) {
    paginationContainer.innerHTML = '';
    const hasPrev = currentState.type === 'video' ? data.prevPageToken : data.queries?.previousPage;
    const hasNext = currentState.type === 'video' ? data.nextPageToken : data.queries?.nextPage;
    if (hasPrev) {
        const prevBtn = document.createElement('button');
        prevBtn.textContent = '‹ Назад';
        prevBtn.onclick = () => { if (currentState.type === 'video') { currentState.nextPageToken = data.prevPageToken; } else { currentState.start = data.queries.previousPage[0].startIndex; } performSearch(); document.querySelector('#results-page').scrollTo(0, 0); };
        paginationContainer.appendChild(prevBtn);
    }
    if (hasNext) {
        const nextBtn = document.createElement('button');
        nextBtn.textContent = 'Вперед ›';
        nextBtn.onclick = () => { if (currentState.type === 'video') { currentState.nextPageToken = data.nextPageToken; } else { currentState.start = data.queries.nextPage[0].startIndex; } performSearch(); document.querySelector('#results-page').scrollTo(0, 0); };
        paginationContainer.appendChild(nextBtn);
    }
}

// --- ЗАПУСК ---
async function fetchExchangeRate() { const apiUrl = 'https://api.exchangerate.host/latest?base=USD&symbols=RUB'; try { const response = await fetch(apiUrl); if (!response.ok) throw new Error('Network response was not ok'); const data = await response.json(); const rate = data.rates.RUB; usdRateSpan.textContent = `USD ${rate.toFixed(2)}`; } catch (error) { console.error("Ошибка при получении курса валют:", error); usdRateSpan.textContent = "USD --.--"; } }
document.addEventListener('DOMContentLoaded', () => { fetchExchangeRate(); document.body.style.overflow = 'hidden'; });