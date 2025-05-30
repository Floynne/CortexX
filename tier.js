// script.js
document.addEventListener('DOMContentLoaded', () => {
    const tierListArea = document.getElementById('tier-list-area');
    const itemPool = document.getElementById('item-pool');
    const uploadInput = document.getElementById('upload-image-input');
    const addTierBtn = document.getElementById('add-tier-btn');
    const saveStateBtn = document.getElementById('save-state-btn');
    const clearStorageBtn = document.getElementById('clear-storage-btn');
    const contextMenu = document.getElementById('context-menu');
    const tierColorPicker = document.getElementById('tier-color-picker');
    const notificationsContainer = document.getElementById('notifications-container');

    let draggedItem = null;
    let draggedTier = null;
    let tierCounter = 0;
    let currentContextMenuTierLabelContainer = null;

    const DEFAULT_TIER_COLORS = ['#ff7f7f', '#ffbf7f', '#ffff7f', '#bfff7f', '#7fffff', '#7f7fff', '#ff7fff'];
    const DEFAULT_TIERS_CONFIG = [
        { name: 'S+', color: '#ff65a3' },
        { name: 'A', color: '#ff9a52' },
        { name: 'B', color: '#ffda58' },
        { name: 'C', color: '#92d449' },
        { name: 'D', color: '#4ec1de' },
    ];

    function initializeApp() {
        loadState();
        setupGlobalEventListeners();
        // updateDraggableItemsAndDropzones(); // Вызывается в конце loadState
        // updateDraggableTiers();           // Вызывается в конце loadState
    }

    function generateId(prefix = 'item') {
        return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    function showNotification(message, type = 'info', duration = 3000) {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        notificationsContainer.appendChild(notification);
        setTimeout(() => notification.classList.add('show'), 10);
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, duration);
    }

    function loadState() {
        const savedTiersData = localStorage.getItem('tierListProTiers');
        const savedItemsData = localStorage.getItem('tierListProItems');

        if (savedItemsData) {
            console.log(`loadState: Raw savedItemsData from localStorage (length: ${savedItemsData.length}): ${savedItemsData.substring(0, 300)}...`);
        } else {
            console.log("loadState: No savedItemsData found in localStorage.");
        }

        const savedTiers = savedTiersData ? JSON.parse(savedTiersData) : null;
        let savedItems = null;
        if (savedItemsData) {
            try {
                savedItems = JSON.parse(savedItemsData);
            } catch (e) {
                console.error("Error parsing savedItemsData from localStorage:", e);
                showNotification("Ошибка загрузки данных элементов: данные повреждены.", "error", 5000);
                // localStorage.removeItem('tierListProItems'); // Можно раскомментировать для автоочистки
            }
        }

        if (savedItems) {
           console.log(`loadState: Parsed ${Object.keys(savedItems).length} items from localStorage.`, savedItems);
        } else {
           console.log("loadState: No items to load or error parsing them.");
        }

        tierListArea.innerHTML = '';
        itemPool.innerHTML = '';

        const tiersToRender = savedTiers || DEFAULT_TIERS_CONFIG.map(t => ({ ...t, id: generateId('tier') }));

        let maxNumericPartOfName = 0;
        let renderedTiersCount = 0;
        tierCounter = 0; // Сбрасываем, createTierRow его инкрементирует

        tiersToRender.forEach(tierData => {
            createTierRow(tierData.id, tierData.name, tierData.color, false); // false - не сохранять на этом этапе
            renderedTiersCount++;
            if (tierData.name) {
                const nameMatch = tierData.name.match(/\s(\d+)$/);
                if (nameMatch && nameMatch[1]) {
                    const numFromName = parseInt(nameMatch[1], 10);
                    if (numFromName > maxNumericPartOfName) {
                        maxNumericPartOfName = numFromName;
                    }
                }
            }
        });
        tierCounter = Math.max(renderedTiersCount, maxNumericPartOfName);

        if (savedItems) {
            let loadedItemCount = 0;
            Object.entries(savedItems).forEach(([itemId, itemData]) => {
                if (!itemData || !itemData.parentId || !itemData.src) {
                    console.warn(`loadState: Corrupted or incomplete item data for itemId ${itemId}`, itemData);
                    return;
                }
                const parentElement = document.getElementById(itemData.parentId);
                const targetContainer = parentElement || itemPool;
                createTierItemElement(itemData.src, itemId, targetContainer);
                loadedItemCount++;
            });
            console.log(`loadState: Successfully created ${loadedItemCount} item elements from saved data.`);
        }

        if(savedTiersData || savedItemsData) {
             showNotification('Состояние загружено', 'info', 1500);
        }
        updateDraggableItemsAndDropzones();
        updateDraggableTiers();
    }

    function saveState() {
        const tiers = [];
        document.querySelectorAll('.tier-row').forEach(row => {
            tiers.push({
                id: row.id,
                name: row.querySelector('.tier-label-text').textContent,
                color: row.querySelector('.tier-label-container').style.backgroundColor
            });
        });

        const items = {};
        const allTierItems = document.querySelectorAll('.tier-item');
        console.log(`saveState: Found ${allTierItems.length} .tier-item elements on the page.`);

        allTierItems.forEach(item => {
            items[item.id] = {
                src: item.querySelector('img').src,
                parentId: item.parentElement.id
            };
        });
        console.log(`saveState: Prepared ${Object.keys(items).length} items to save.`, items);
        const itemsJsonString = JSON.stringify(items);
        console.log(`saveState: Items JSON string length: ${itemsJsonString.length} characters.`);

        try {
            localStorage.setItem('tierListProTiers', JSON.stringify(tiers));
            localStorage.setItem('tierListProItems', itemsJsonString);
            showNotification('Состояние сохранено!', 'success');
        } catch (e) {
            console.error("Error saving to localStorage:", e);
            if (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED') {
                showNotification('Ошибка: Хранилище заполнено! Не удалось сохранить все данные. Попробуйте удалить часть изображений.', 'error', 7000);
            } else {
                showNotification('Произошла ошибка при сохранении состояния.', 'error');
            }
        }
    }

    function clearStorage() {
        if (confirm('Вы уверены, что хотите сбросить все тиры и элементы? Это действие необратимо.')) {
            localStorage.removeItem('tierListProTiers');
            localStorage.removeItem('tierListProItems');
            tierCounter = 0;
            // Переинициализируем приложение с дефолтными настройками
            tierListArea.innerHTML = '';
            itemPool.innerHTML = '';
            DEFAULT_TIERS_CONFIG.forEach(tierConfig => {
                createTierRow(null, tierConfig.name, tierConfig.color, false); // не сохраняем поштучно
            });
            tierCounter = DEFAULT_TIERS_CONFIG.length; // Устанавливаем счетчик после создания дефолтных
            saveState(); // Сохраняем пустое (или дефолтное) состояние
            updateDraggableItemsAndDropzones();
            updateDraggableTiers();
            showNotification('Все данные сброшены.', 'warning');
        }
    }


    function createTierRow(id, name, color, shouldSave = true) {
        tierCounter++; // Глобальный счетчик для уникальных имен/ID новых тиров
        const tierRowId = id || generateId(`tier${tierCounter}`); // Используем инкрементированный tierCounter для генерации
        const tierRow = document.createElement('div');
        tierRow.classList.add('tier-row');
        tierRow.id = tierRowId;

        const labelContainer = document.createElement('div');
        labelContainer.classList.add('tier-label-container');
        labelContainer.style.backgroundColor = color || DEFAULT_TIER_COLORS[ (tierCounter -1 + DEFAULT_TIER_COLORS.length) % DEFAULT_TIER_COLORS.length]; // + DEFAULT_TIER_COLORS.length для избежания отрицательного индекса
        
        const dragHandle = document.createElement('i');
        dragHandle.className = 'fas fa-grip-vertical tier-drag-handle';
        dragHandle.title = "Перетащить тир";
        dragHandle.setAttribute('draggable', 'true');
        labelContainer.appendChild(dragHandle);

        const labelTextWrapper = document.createElement('div');
        labelTextWrapper.classList.add('tier-label-text-wrapper');
        const labelText = document.createElement('span');
        labelText.classList.add('tier-label-text');
        labelText.textContent = name || `Тир ${tierCounter}`; // Используем инкрементированный tierCounter для имени
        labelTextWrapper.appendChild(labelText);
        labelContainer.appendChild(labelTextWrapper);
        
        labelTextWrapper.addEventListener('dblclick', () => makeLabelEditable(labelText, labelContainer));
        labelTextWrapper.addEventListener('contextmenu', (e) => showTierContextMenu(e, labelContainer));

        tierRow.appendChild(labelContainer);

        const tierItems = document.createElement('div');
        tierItems.classList.add('tier-items', 'dropzone');
        tierItems.id = tierRowId + '-items';
        tierRow.appendChild(tierItems);

        tierListArea.appendChild(tierRow);
        if (shouldSave) saveState();
        updateDraggableItemsAndDropzones();
        updateDraggableTiers();
        return tierRow;
    }
    
    function makeLabelEditable(labelTextElement, labelContainer) {
        contextMenu.style.display = 'none';
        const currentName = labelTextElement.textContent;
        const input = document.createElement('input');
        input.type = 'text';
        input.value = currentName;
        input.classList.add('tier-name-input');
        const wrapper = labelTextElement.parentElement;
        wrapper.replaceChild(input, labelTextElement);
        input.focus();
        input.select();
        const finishEdit = () => {
            const newName = input.value.trim();
            labelTextElement.textContent = newName || currentName;
            wrapper.replaceChild(labelTextElement, input);
            saveState();
        };
        input.addEventListener('blur', finishEdit);
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') input.blur();
            if (e.key === 'Escape') { input.value = currentName; input.blur(); }
        });
    }

    function createTierItemElement(imageSrc, itemId, parentContainer = itemPool) {
        const tierItem = document.createElement('div');
        tierItem.classList.add('tier-item');
        tierItem.setAttribute('draggable', 'true');
        tierItem.id = itemId || generateId();
        const img = document.createElement('img');
        img.src = imageSrc;
        img.alt = 'Tier Item';
        tierItem.appendChild(img);
        const deleteBtn = document.createElement('button');
        deleteBtn.classList.add('delete-item-btn');
        deleteBtn.innerHTML = '<i class="fas fa-times"></i>';
        deleteBtn.title = "Удалить элемент";
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (confirm('Удалить этот элемент?')) {
                tierItem.remove();
                saveState();
            }
        });
        tierItem.appendChild(deleteBtn);
        parentContainer.appendChild(tierItem);
        return tierItem;
    }

    function updateDraggableItemsAndDropzones() {
        document.querySelectorAll('.tier-item').forEach(item => {
            item.removeEventListener('dragstart', handleItemDragStart);
            item.addEventListener('dragstart', handleItemDragStart);
            item.removeEventListener('dragend', handleItemDragEnd);
            item.addEventListener('dragend', handleItemDragEnd);
        });
        document.querySelectorAll('.dropzone').forEach(zone => {
            zone.removeEventListener('dragover', handleItemDragOver);
            zone.addEventListener('dragover', handleItemDragOver);
            zone.removeEventListener('dragleave', handleItemDragLeave);
            zone.addEventListener('dragleave', handleItemDragLeave);
            zone.removeEventListener('drop', handleItemDrop);
            zone.addEventListener('drop', handleItemDrop);
        });
    }

    function handleItemDragStart(event) {
        if (event.target.closest('.delete-item-btn')) { event.preventDefault(); return; }
        draggedItem = event.target.closest('.tier-item');
        if (!draggedItem) return;
        setTimeout(() => { if (draggedItem) draggedItem.classList.add('dragging'); }, 0);
        event.dataTransfer.effectAllowed = 'move';
        event.dataTransfer.setData('text/plain', draggedItem.id);
    }

    function handleItemDragEnd() {
        if (draggedItem) draggedItem.classList.remove('dragging');
        draggedItem = null;
        saveState();
    }

    function handleItemDragOver(event) {
        event.preventDefault();
        const targetDropzone = event.target.closest('.dropzone');
        if (targetDropzone) targetDropzone.classList.add('drag-over');
        event.dataTransfer.dropEffect = 'move';
    }

    function handleItemDragLeave(event) {
        const targetDropzone = event.target.closest('.dropzone');
        if (targetDropzone) targetDropzone.classList.remove('drag-over');
    }

    function handleItemDrop(event) {
        event.preventDefault();
        const targetDropzone = event.target.closest('.dropzone');
        if (!targetDropzone || !draggedItem) return;
        targetDropzone.classList.remove('drag-over');
        const afterElement = getDragAfterItemElement(targetDropzone, event.clientX, event.clientY);
        if (afterElement == null) targetDropzone.appendChild(draggedItem);
        else targetDropzone.insertBefore(draggedItem, afterElement);
        // saveState() вызывается в handleItemDragEnd
    }

    function getDragAfterItemElement(container, x, y) {
        const draggableElements = [...container.querySelectorAll('.tier-item:not(.dragging)')];
        return draggableElements.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offsetX = x - box.left - box.width / 2;
            if (y >= box.top && y <= box.bottom && offsetX < 0 && offsetX > (closest.offsetX || Number.NEGATIVE_INFINITY)) {
                return { offsetX: offsetX, element: child };
            }
            return closest;
        }, {}).element;
    }

    function updateDraggableTiers() {
        document.querySelectorAll('.tier-row .tier-drag-handle').forEach(handle => {
            handle.setAttribute('draggable', 'true');
            handle.removeEventListener('dragstart', handleTierDragStart);
            handle.addEventListener('dragstart', handleTierDragStart);
            handle.removeEventListener('dragend', handleTierDragEnd);
            handle.addEventListener('dragend', handleTierDragEnd);
        });
        tierListArea.removeEventListener('dragover', handleTierDragOver);
        tierListArea.addEventListener('dragover', handleTierDragOver);
        tierListArea.removeEventListener('drop', handleTierDrop);
        tierListArea.addEventListener('drop', handleTierDrop);
    }

    function handleTierDragStart(event) {
        draggedTier = event.target.closest('.tier-row');
        if (!draggedTier) { event.preventDefault(); return; }
        try {
            const tierRect = draggedTier.getBoundingClientRect();
            const offsetX = event.clientX - tierRect.left;
            const offsetY = event.clientY - tierRect.top;
            event.dataTransfer.setDragImage(draggedTier, offsetX, offsetY);
        } catch (e) { /* console.warn("setDragImage not supported or error:", e); */ }
        setTimeout(() => { if (draggedTier) draggedTier.classList.add('dragging-tier'); }, 0);
        event.dataTransfer.effectAllowed = 'move';
        event.dataTransfer.setData('text/plain', draggedTier.id);
    }
    
    function handleTierDragEnd(event) {
        if (draggedTier) draggedTier.classList.remove('dragging-tier');
        draggedTier = null;
        saveState();
    }

    function handleTierDragOver(event) {
        event.preventDefault();
        if (!draggedTier) return;
        event.dataTransfer.dropEffect = 'move';
    }

    function handleTierDrop(event) {
        event.preventDefault();
        if (!draggedTier) return;
        const afterTier = getDragAfterTierElement(tierListArea, event.clientY);
        if (afterTier) tierListArea.insertBefore(draggedTier, afterTier);
        else tierListArea.appendChild(draggedTier);
        // saveState() вызовется в handleTierDragEnd
    }

    function getDragAfterTierElement(container, y) {
        const draggableTiers = [...container.querySelectorAll('.tier-row:not(.dragging-tier)')];
        return draggableTiers.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = y - box.top - box.height / 2;
            if (offset < 0 && offset > (closest.offset || Number.NEGATIVE_INFINITY)) {
                return { offset: offset, element: child };
            }
            return closest;
        }, {}).element;
    }

    function setupGlobalEventListeners() {
        addTierBtn.addEventListener('click', () => {
            // Глобальный tierCounter уже обновлен в loadState или при предыдущих createTierRow.
            // createTierRow сам инкрементирует и использует tierCounter для нового тира.
            createTierRow(null, null, null, true);
        });
        saveStateBtn.addEventListener('click', saveState);
        clearStorageBtn.addEventListener('click', clearStorage);
        uploadInput.addEventListener('change', handleFileUpload);
        document.addEventListener('paste', handlePasteImage);
        document.addEventListener('click', () => { if(contextMenu.style.display === 'block') contextMenu.style.display = 'none'; });
        contextMenu.addEventListener('click', handleContextMenuAction);
        tierColorPicker.addEventListener('input', handleTierColorChange);
        tierColorPicker.addEventListener('change', () => { if (currentContextMenuTierLabelContainer) saveState(); });
    }

    function handleFileUpload(event) {
        const files = event.target.files;
        let count = 0;
        const promises = [];

        for (const file of files) {
            if (file.type.startsWith('image/')) {
                count++;
                const promise = new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        createTierItemElement(e.target.result, null, itemPool);
                        resolve();
                    };
                    reader.onerror = reject;
                    reader.readAsDataURL(file);
                });
                promises.push(promise);
            }
        }

        if (promises.length > 0) {
            Promise.all(promises).then(() => {
                updateDraggableItemsAndDropzones();
                saveState();
                showNotification(`Загружено ${count} изображени(й/е)`, 'success');
            }).catch(error => {
                console.error("Error reading files:", error);
                showNotification('Ошибка при чтении одного или нескольких файлов.', 'error');
            });
        }
        uploadInput.value = '';
    }

    function handlePasteImage(event) {
        const items = (event.clipboardData || window.clipboardData).items;
        let imagePasted = false;
        for (const item of items) {
            if (item.type.indexOf('image') !== -1) {
                const blob = item.getAsFile();
                if (blob) {
                    imagePasted = true; // Устанавливаем флаг, что изображение найдено
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        createTierItemElement(e.target.result, null, itemPool);
                        updateDraggableItemsAndDropzones();
                        saveState(); // Сохраняем после успешной вставки и создания элемента
                        showNotification('Изображение вставлено из буфера!', 'success');
                    };
                    reader.readAsDataURL(blob);
                    event.preventDefault(); 
                    return; // Обрабатываем только первое найденное изображение
                }
            }
        }
        // Если изображение было вставлено, saveState() вызовется в reader.onload.
        // Если нет, ничего не делаем.
    }
    
    function showTierContextMenu(event, tierLabelContainerEl) {
        event.preventDefault();
        event.stopPropagation();
        currentContextMenuTierLabelContainer = tierLabelContainerEl;
        contextMenu.style.top = `${event.pageY + 5}px`;
        contextMenu.style.left = `${event.pageX + 5}px`;
        contextMenu.style.display = 'block';
    }

    function handleContextMenuAction(event) {
        if (!currentContextMenuTierLabelContainer) return;
        const action = event.target.closest('li')?.dataset.action;
        const tierRow = currentContextMenuTierLabelContainer.closest('.tier-row');
        const labelTextElement = currentContextMenuTierLabelContainer.querySelector('.tier-label-text');
        switch (action) {
            case 'edit-name': makeLabelEditable(labelTextElement, currentContextMenuTierLabelContainer); break;
            case 'change-color':
                tierColorPicker.value = rgbToHex(currentContextMenuTierLabelContainer.style.backgroundColor || '#777777');
                tierColorPicker.click(); break;
            case 'delete-tier':
                if (confirm(`Удалить тир "${tierRow.querySelector('.tier-label-text').textContent}"? Все его элементы переместятся в пул.`)) {
                    tierRow.querySelectorAll('.tier-item').forEach(item => itemPool.appendChild(item));
                    tierRow.remove(); saveState(); showNotification('Тир удален', 'info');
                } break;
        }
        // contextMenu.style.display = 'none'; // Закрывается глобальным слушателем
    }
    
    function handleTierColorChange(event){
        if(currentContextMenuTierLabelContainer) currentContextMenuTierLabelContainer.style.backgroundColor = event.target.value;
        // saveState() вызывается по событию 'change' на tierColorPicker в setupGlobalEventListeners
    }

    function rgbToHex(rgb) {
        if (!rgb || rgb.startsWith('#')) return rgb;
        const result = rgb.match(/\d+/g);
        if (!result || result.length < 3) return '#777777'; // Возвращаем дефолтный или исходный, если парсинг не удался
        return "#" + result.map(x => parseInt(x, 10).toString(16).padStart(2, '0')).join('');
    }

    initializeApp();
});