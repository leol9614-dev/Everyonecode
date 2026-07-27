/* ==========================================================================
   Lotto 6/45 AI Recommendation App - Interactive JavaScript Logic
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    // App State
    const state = {
        mode: 'ai',
        gameCount: 3,
        includeNumbers: [],
        excludeNumbers: [],
        history: JSON.parse(localStorage.getItem('lotto_history') || '[]'),
        favorites: JSON.parse(localStorage.getItem('lotto_favorites') || '[]'),
        activeTab: 'history'
    };

    // DOM Elements
    const btnGenerate = document.getElementById('btnGenerate');
    const resultsContainer = document.getElementById('resultsContainer');
    const toggleAdvanced = document.getElementById('toggleAdvanced');
    const advancedAccordion = toggleAdvanced.closest('.advanced-accordion');
    const includeInput = document.getElementById('includeInput');
    const excludeInput = document.getElementById('excludeInput');
    const includeChips = document.getElementById('includeChips');
    const excludeChips = document.getElementById('excludeChips');
    const historyList = document.getElementById('historyList');
    const btnClearHistory = document.getElementById('btnClearHistory');
    const btnQuickCopy = document.getElementById('btnQuickCopy');
    const toast = document.getElementById('toast');

    // Initialize App
    init();

    function init() {
        bindEvents();
        renderHistory();
    }

    // Event Bindings
    function bindEvents() {
        // Mode Selection
        document.querySelectorAll('input[name="mode"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                state.mode = e.target.value;
                document.querySelectorAll('.mode-btn').forEach(btn => btn.classList.remove('active'));
                e.target.closest('.mode-btn').classList.add('active');
            });
        });

        // Game Count Selector
        document.querySelectorAll('.btn-count').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.btn-count').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                state.gameCount = parseInt(e.target.dataset.count, 10);
            });
        });

        // Advanced Filter Accordion Toggle
        toggleAdvanced.addEventListener('click', () => {
            advancedAccordion.classList.toggle('open');
        });

        // Include / Exclude Inputs
        includeInput.addEventListener('keydown', (e) => handleChipAdd(e, 'include'));
        excludeInput.addEventListener('keydown', (e) => handleChipAdd(e, 'exclude'));

        // Generate Button
        btnGenerate.addEventListener('click', generateNumbers);

        // Quick Copy All
        btnQuickCopy.addEventListener('click', copyAllResults);

        // History & Favorite Tabs
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const targetTab = e.currentTarget.dataset.tab;
                state.activeTab = targetTab;
                document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                e.currentTarget.classList.add('active');
                renderHistory();
            });
        });

        // Clear History
        btnClearHistory.addEventListener('click', () => {
            if (state.activeTab === 'history') {
                state.history = [];
                localStorage.setItem('lotto_history', '[]');
                showToast('최근 생성 이력이 삭제되었습니다.');
            } else {
                state.favorites = [];
                localStorage.setItem('lotto_favorites', '[]');
                showToast('보관함이 비워졌습니다.');
            }
            renderHistory();
        });
    }

    // Handle Adding Filter Chips
    function handleChipAdd(e, type) {
        if (e.key === 'Enter') {
            e.preventDefault();
            const val = parseInt(e.target.value.trim(), 10);
            e.target.value = '';

            if (isNaN(val) || val < 1 || val > 45) {
                showToast('1부터 45 사이의 숫자를 입력해주세요.');
                return;
            }

            if (type === 'include') {
                if (state.includeNumbers.includes(val)) return;
                if (state.excludeNumbers.includes(val)) {
                    showToast(`${val}번은 제외 목록에 이미 존재합니다.`);
                    return;
                }
                if (state.includeNumbers.length >= 5) {
                    showToast('포함할 번호는 최대 5개까지 설정 가능합니다.');
                    return;
                }
                state.includeNumbers.push(val);
                renderChips('include');
            } else {
                if (state.excludeNumbers.includes(val)) return;
                if (state.includeNumbers.includes(val)) {
                    showToast(`${val}번은 포함 목록에 이미 존재합니다.`);
                    return;
                }
                if (state.excludeNumbers.length >= 15) {
                    showToast('제외할 번호는 최대 15개까지 설정 가능합니다.');
                    return;
                }
                state.excludeNumbers.push(val);
                renderChips('exclude');
            }
        }
    }

    // Render Filter Chips
    function renderChips(type) {
        const container = type === 'include' ? includeChips : excludeChips;
        const input = type === 'include' ? includeInput : excludeInput;
        const list = type === 'include' ? state.includeNumbers : state.excludeNumbers;
        const chipClass = type === 'include' ? 'chip-include' : 'chip-exclude';

        // Clear existing chips
        container.querySelectorAll('.chip').forEach(c => c.remove());

        list.sort((a, b) => a - b).forEach(num => {
            const chip = document.createElement('span');
            chip.className = `chip ${chipClass}`;
            chip.innerHTML = `${num} <i class="fa-solid fa-xmark" data-num="${num}"></i>`;
            
            chip.querySelector('i').addEventListener('click', () => {
                if (type === 'include') {
                    state.includeNumbers = state.includeNumbers.filter(n => n !== num);
                } else {
                    state.excludeNumbers = state.excludeNumbers.filter(n => n !== num);
                }
                renderChips(type);
            });

            container.insertBefore(chip, input);
        });
    }

    // Core Lotto Generator Algorithm
    function generateNumbers() {
        const games = [];

        for (let i = 0; i < state.gameCount; i++) {
            let numbers = [];
            
            switch (state.mode) {
                case 'ai':
                    numbers = generateAiWeightedNumbers();
                    break;
                case 'balanced':
                    numbers = generateBalancedNumbers();
                    break;
                case 'fortune':
                    numbers = generateFortuneNumbers(i);
                    break;
                case 'random':
                default:
                    numbers = generatePureRandomNumbers();
                    break;
            }

            numbers.sort((a, b) => a - b);
            
            games.push({
                id: Date.now() + '_' + i + '_' + Math.random().toString(36).substring(2, 5),
                mode: getModeLabel(state.mode),
                numbers: numbers,
                date: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
                timestamp: Date.now()
            });
        }

        // Save to History state
        state.history.unshift(...games);
        if (state.history.length > 50) state.history = state.history.slice(0, 50);
        localStorage.setItem('lotto_history', JSON.stringify(state.history));

        // Render in Display Card
        renderResults(games);
        renderHistory();

        showToast(`${state.gameCount}게임의 행운 번호가 생성되었습니다!`);
    }

    // 1. AI Weighted Generator (Balances number ranges: 1-10, 11-20, 21-30, 31-40, 41-45)
    function generateAiWeightedNumbers() {
        const pool = getAvailablePool();
        const selected = new Set(state.includeNumbers);

        // Group by ranges
        const ranges = [
            pool.filter(n => n >= 1 && n <= 10),
            pool.filter(n => n >= 11 && n <= 20),
            pool.filter(n => n >= 21 && n <= 30),
            pool.filter(n => n >= 31 && n <= 40),
            pool.filter(n => n >= 41 && n <= 45)
        ];

        // Try to pick uniformly across ranges
        while (selected.size < 6 && pool.length >= 6) {
            // Pick a range index randomly
            const rangeIndex = Math.floor(Math.random() * ranges.length);
            const rangePool = ranges[rangeIndex].filter(n => !selected.has(n));

            if (rangePool.length > 0) {
                const picked = rangePool[Math.floor(Math.random() * rangePool.length)];
                selected.add(picked);
            } else {
                // Fallback pick from entire remaining pool
                const remaining = pool.filter(n => !selected.has(n));
                if (remaining.length === 0) break;
                const picked = remaining[Math.floor(Math.random() * remaining.length)];
                selected.add(picked);
            }
        }

        return Array.from(selected);
    }

    // 2. Balanced Generator (Odd:Even 3:3 or 2:4, Sum 100~170)
    function generateBalancedNumbers() {
        const pool = getAvailablePool();
        let selected = [];
        let attempts = 0;

        while (attempts < 500) {
            attempts++;
            const tempSet = new Set(state.includeNumbers);
            const remainingPool = shuffle([...pool.filter(n => !tempSet.has(n))]);

            while (tempSet.size < 6 && remainingPool.length > 0) {
                tempSet.add(remainingPool.pop());
            }

            const candidate = Array.from(tempSet);
            const sum = candidate.reduce((acc, curr) => acc + curr, 0);
            const oddCount = candidate.filter(n => n % 2 !== 0).length;

            // Check optimal winning conditions
            if (sum >= 100 && sum <= 175 && (oddCount === 2 || oddCount === 3 || oddCount === 4)) {
                selected = candidate;
                break;
            }
            selected = candidate; // Fallback
        }

        return selected;
    }

    // 3. Today's Fortune Generator
    function generateFortuneNumbers(seedOffset) {
        const pool = getAvailablePool();
        const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        let seed = parseInt(dateStr, 10) + seedOffset * 999;

        // Custom pseudo-random generator
        const seededRandom = () => {
            const x = Math.sin(seed++) * 10000;
            return x - Math.floor(x);
        };

        const selected = new Set(state.includeNumbers);
        const shuffledPool = [...pool].sort(() => seededRandom() - 0.5);

        for (const num of shuffledPool) {
            if (selected.size >= 6) break;
            selected.add(num);
        }

        return Array.from(selected);
    }

    // 4. Pure Random Generator
    function generatePureRandomNumbers() {
        const pool = getAvailablePool();
        const selected = new Set(state.includeNumbers);
        const shuffled = shuffle([...pool.filter(n => !selected.has(n))]);

        while (selected.size < 6 && shuffled.length > 0) {
            selected.add(shuffled.pop());
        }

        return Array.from(selected);
    }

    // Helper: Available Number Pool (1~45 minus excludeNumbers)
    function getAvailablePool() {
        const excluded = new Set(state.excludeNumbers);
        const pool = [];
        for (let i = 1; i <= 45; i++) {
            if (!excluded.has(i)) {
                pool.push(i);
            }
        }
        return pool;
    }

    // Helper: Array Shuffle
    function shuffle(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    // Helper: Get Mode Display Label
    function getModeLabel(mode) {
        switch (mode) {
            case 'ai': return 'AI 스마트';
            case 'balanced': return '통계 밸런스';
            case 'fortune': return '오늘의 운세';
            case 'random': default: return '순수 랜덤';
        }
    }

    // Helper: Ball Color CSS Class
    function getBallColorClass(num) {
        if (num <= 10) return 'ball-y';
        if (num <= 20) return 'ball-b';
        if (num <= 30) return 'ball-r';
        if (num <= 40) return 'ball-g';
        return 'ball-gr';
    }

    // Render Generated Results in Display Container
    function renderResults(games) {
        resultsContainer.innerHTML = '';

        games.forEach((game, gIdx) => {
            const row = document.createElement('div');
            row.className = 'game-row';

            const sum = game.numbers.reduce((a, b) => a + b, 0);
            const oddCount = game.numbers.filter(n => n % 2 !== 0).length;
            const evenCount = 6 - oddCount;

            const isFav = state.favorites.some(f => f.id === game.id);

            row.innerHTML = `
                <div class="game-row-header">
                    <span><strong>Game ${String.fromCharCode(65 + gIdx)}</strong> <span class="game-tag">${game.mode}</span></span>
                    <div class="game-actions">
                        <button class="btn-icon fav ${isFav ? 'active' : ''}" title="찜하기">
                            <i class="${isFav ? 'fa-solid' : 'fa-regular'} fa-star"></i>
                        </button>
                        <button class="btn-icon copy" title="복사">
                            <i class="fa-regular fa-copy"></i>
                        </button>
                    </div>
                </div>

                <div class="balls-wrapper">
                    ${game.numbers.map((num, idx) => `
                        <span class="lotto-ball ${getBallColorClass(num)}" style="animation-delay: ${idx * 0.08}s">
                            ${num}
                        </span>
                    `).join('')}
                </div>

                <div class="game-stats">
                    <span>홀:짝 = ${oddCount}:${evenCount}</span>
                    <span>총합 = ${sum}</span>
                </div>
            `;

            // Favorite Toggle
            row.querySelector('.fav').addEventListener('click', (e) => {
                toggleFavorite(game, e.currentTarget);
            });

            // Single Game Copy
            row.querySelector('.copy').addEventListener('click', () => {
                const text = `${game.numbers.join(', ')}`;
                navigator.clipboard.writeText(text);
                showToast(`Game ${String.fromCharCode(65 + gIdx)} 번호가 복사되었습니다: [${text}]`);
            });

            resultsContainer.appendChild(row);
        });
    }

    // Toggle Favorite Item
    function toggleFavorite(game, btnEl) {
        const index = state.favorites.findIndex(f => f.id === game.id);
        if (index >= 0) {
            state.favorites.splice(index, 1);
            btnEl.classList.remove('active');
            btnEl.querySelector('i').className = 'fa-regular fa-star';
            showToast('보관함에서 제거되었습니다.');
        } else {
            state.favorites.push(game);
            btnEl.classList.add('active');
            btnEl.querySelector('i').className = 'fa-solid fa-star';
            showToast('보관함에 저장되었습니다!');
        }
        localStorage.setItem('lotto_favorites', JSON.stringify(state.favorites));
        if (state.activeTab === 'favorites') renderHistory();
    }

    // Copy All Rendered Results
    function copyAllResults() {
        const gameRows = resultsContainer.querySelectorAll('.game-row');
        if (gameRows.length === 0) {
            showToast('복사할 생성 결과가 없습니다.');
            return;
        }

        const lines = [];
        gameRows.forEach((row, idx) => {
            const balls = Array.from(row.querySelectorAll('.lotto-ball')).map(b => b.textContent.trim());
            lines.push(`Game ${String.fromCharCode(65 + idx)}: ${balls.join(', ')}`);
        });

        const copyText = `[로또 6/45 AI 행운 번호]\n` + lines.join('\n');
        navigator.clipboard.writeText(copyText);
        showToast('모든 게임 번호가 클립보드에 복사되었습니다!');
    }

    // Render History & Favorites Tab
    function renderHistory() {
        const list = state.activeTab === 'history' ? state.history : state.favorites;
        historyList.innerHTML = '';

        if (list.length === 0) {
            historyList.innerHTML = `
                <div class="empty-state" style="grid-column: 1 / -1; padding: 20px;">
                    <p class="empty-text">${state.activeTab === 'history' ? '생성된 이력이 없습니다.' : '보관함이 비어있습니다. 마음에 드는 번호의 ⭐ 버튼을 눌러 저장해보세요!'}</p>
                </div>
            `;
            return;
        }

        list.forEach(game => {
            const item = document.createElement('div');
            item.className = 'history-item';

            item.innerHTML = `
                <div class="history-item-header">
                    <span>${game.mode} (${game.date})</span>
                    <button class="btn-icon copy-item" title="복사"><i class="fa-regular fa-copy"></i></button>
                </div>
                <div class="balls-wrapper">
                    ${game.numbers.map(num => `
                        <span class="lotto-ball sm ${getBallColorClass(num)}">
                            ${num}
                        </span>
                    `).join('')}
                </div>
            `;

            item.querySelector('.copy-item').addEventListener('click', () => {
                navigator.clipboard.writeText(game.numbers.join(', '));
                showToast(`번호가 복사되었습니다: ${game.numbers.join(', ')}`);
            });

            historyList.appendChild(item);
        });
    }

    // Toast Notification Helper
    function showToast(message) {
        toast.textContent = message;
        toast.classList.add('show');
        setTimeout(() => {
            toast.classList.remove('show');
        }, 2600);
    }
});