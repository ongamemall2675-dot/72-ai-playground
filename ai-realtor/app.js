// AI 공부하는 공인중개사 - 메인 앱 스크립트

// 상태 관리
const state = {
    isLoggedIn: false,
    currentUser: null,
    currentPage: 'dashboard'
};

// 관리자 계정 정보
const ADMIN_CREDENTIALS = {
    id: 'ongamemall',
    password: 'realhun0506'
};

// DOM 요소
const elements = {
    loginModal: document.getElementById('loginModal'),
    loadingModal: document.getElementById('loadingModal'),
    loginForm: document.getElementById('loginForm'),
    loginError: document.getElementById('loginError'),
    mainContent: document.getElementById('mainContent'),
    sidebar: document.getElementById('sidebar'),
    menuBtn: document.getElementById('menuBtn'),
    logoutBtn: document.getElementById('logoutBtn'),
    userName: document.getElementById('userName'),
    searchInput: document.getElementById('searchInput')
};

// 초기화
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    setupEventListeners();
});

// 인증 확인
function checkAuth() {
    const savedUser = localStorage.getItem('aiRealtorUser');
    if (savedUser) {
        state.isLoggedIn = true;
        state.currentUser = JSON.parse(savedUser);
        elements.userName.textContent = state.currentUser.name || '사용자';
        showDashboard();
    } else {
        showLogin();
    }
}

// 이벤트 리스너 설정
function setupEventListeners() {
    // 로그인 폼
    elements.loginForm.addEventListener('submit', handleLogin);

    // 로그아웃
    elements.logoutBtn.addEventListener('click', handleLogout);

    // 모바일 메뉴
    elements.menuBtn.addEventListener('click', toggleSidebar);

    // 네비게이션 링크
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const page = link.dataset.page;
            navigateTo(page);
        });
    });

    // 검색
    elements.searchInput?.addEventListener('input', handleSearch);
}

// 로그인 처리
function handleLogin(e) {
    e.preventDefault();

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    // 인증 확인
    if (email === ADMIN_CREDENTIALS.id && password === ADMIN_CREDENTIALS.password) {
        state.isLoggedIn = true;
        state.currentUser = { id: email, name: '관리자' };
        localStorage.setItem('aiRealtorUser', JSON.stringify(state.currentUser));

        elements.loginError.classList.add('hidden');
        elements.userName.textContent = state.currentUser.name;

        hideLogin();
        showDashboard();
    } else {
        elements.loginError.classList.remove('hidden');
    }
}

// 로그아웃
function handleLogout() {
    state.isLoggedIn = false;
    state.currentUser = null;
    localStorage.removeItem('aiRealtorUser');
    showLogin();
}

// 로그인 모달 표시/숨기기
function showLogin() {
    elements.loginModal.classList.remove('hidden');
    elements.mainContent.innerHTML = '';
}

function hideLogin() {
    elements.loginModal.classList.add('hidden');
}

// 사이드바 토글
function toggleSidebar() {
    elements.sidebar.classList.toggle('open');
}

// 네비게이션
function navigateTo(page) {
    state.currentPage = page;

    // 활성 링크 업데이트
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
        if (link.dataset.page === page) {
            link.classList.add('active');
        }
    });

    // 모바일 사이드바 닫기
    elements.sidebar.classList.remove('open');

    showDashboard();
}

// 검색 처리
function handleSearch(e) {
    const query = e.target.value.toLowerCase();
    const cards = document.querySelectorAll('.app-card');

    cards.forEach(card => {
        const title = card.querySelector('h3')?.textContent.toLowerCase() || '';
        const desc = card.querySelector('p')?.textContent.toLowerCase() || '';

        if (title.includes(query) || desc.includes(query)) {
            card.style.display = '';
        } else {
            card.style.display = 'none';
        }
    });
}

// 대시보드 표시
function showDashboard() {
    elements.mainContent.innerHTML = getDashboardHTML();
    setupAppCardListeners();
}

// 대시보드 HTML
function getDashboardHTML() {
    const page = state.currentPage;

    // 히어로 섹션 HTML
    const heroSection = `
        <!-- Hero Section -->
        <div class="relative mb-16 mt-4">
            <div class="hero-gradient absolute -top-20 -left-20 w-96 h-96 bg-blue-500/10"></div>
            <div class="hero-gradient absolute top-10 right-20 w-64 h-64 bg-purple-500/10"></div>
            <div class="relative z-10">
                <div class="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-blue-500/10 to-indigo-500/10 border border-blue-500/20 text-primary text-xs font-bold uppercase tracking-wider mb-6 shadow-sm">
                    <span class="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                    AI Powered System
                </div>
                <h1 class="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 dark:text-white leading-[1.1] mb-6 tracking-tight">
                    AI 공부하는 <br class="sm:hidden"/>
                    <span class="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">공인중개사의 놀이터</span>
                </h1>
                <p class="text-slate-600 dark:text-slate-400 text-lg sm:text-xl max-w-3xl leading-relaxed font-medium">
                    환영합니다, ${state.currentUser?.name || '사용자'}님. <br class="hidden sm:block"/>
                    ${page === 'dashboard' ? '아래 카테고리를 선택하여 AI 도구를 사용해보세요.' : '업무 효율을 극대화할 수 있는 AI 도구들이 준비되어 있습니다.'}
                </p>
            </div>
        </div>
    `;

    // 카테고리 카드 섹션 (대시보드 홈용)
    const categoryCardsSection = `
        <!-- 카테고리 선택 섹션 -->
        <section class="mb-20 animate-fade-in">
            <div class="flex items-center gap-3 mb-8">
                <span class="material-symbols-outlined text-2xl text-primary">apps</span>
                <h2 class="text-2xl font-bold text-slate-900 dark:text-white">카테고리 선택</h2>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
                <!-- AI 엔지니어링 카테고리 -->
                <div class="category-card group relative flex flex-col p-8 rounded-[2rem] bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-700/60 card-hover-effect hover:shadow-glow-primary hover:border-primary/50 cursor-pointer overflow-hidden" data-category="ai-engineer">
                    <div class="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    <div class="relative z-10">
                        <div class="flex justify-between items-start mb-6">
                            <div class="w-20 h-20 rounded-2xl bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center text-primary border border-blue-200 dark:border-blue-500/30 shadow-lg group-hover:scale-110 transition-transform duration-300">
                                <span class="material-symbols-outlined text-4xl">engineering</span>
                            </div>
                            <span class="badge badge-blue">3 도구</span>
                        </div>
                        <h3 class="text-2xl font-black text-slate-900 dark:text-white mb-3 group-hover:text-primary transition-colors">AI 엔지니어링</h3>
                        <p class="text-slate-500 dark:text-slate-400 text-sm leading-relaxed mb-6">프롬프트 마법사, 지침 최적화, Persona 생성 등 AI 어시스턴스 지침을 생성합니다.</p>
                        <div class="flex items-center gap-2 text-primary font-semibold text-sm">
                            <span>도구 보기</span>
                            <span class="material-symbols-outlined text-lg group-hover:translate-x-1 transition-transform">arrow_forward</span>
                        </div>
                    </div>
                </div>

                <!-- 프롬프트 생성기 카테고리 -->
                <div class="category-card group relative flex flex-col p-8 rounded-[2rem] bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-700/60 card-hover-effect hover:shadow-glow-emerald hover:border-emerald-500/50 cursor-pointer overflow-hidden" data-category="prompt-generator">
                    <div class="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    <div class="relative z-10">
                        <div class="flex justify-between items-start mb-6">
                            <div class="w-20 h-20 rounded-2xl bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30 shadow-lg group-hover:scale-110 transition-transform duration-300">
                                <span class="material-symbols-outlined text-4xl">auto_awesome</span>
                            </div>
                            <span class="badge badge-emerald">9 도구</span>
                        </div>
                        <h3 class="text-2xl font-black text-slate-900 dark:text-white mb-3 group-hover:text-emerald-500 transition-colors">프롬프트 생성기</h3>
                        <p class="text-slate-500 dark:text-slate-400 text-sm leading-relaxed mb-6">대본 생성, 이미지/영상 컨셉, SEO 콘텐츠 등 다양한 콘텐츠를 생성합니다.</p>
                        <div class="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-semibold text-sm">
                            <span>도구 보기</span>
                            <span class="material-symbols-outlined text-lg group-hover:translate-x-1 transition-transform">arrow_forward</span>
                        </div>
                    </div>
                </div>

                <!-- n8n 워크플로우 카테고리 -->
                <div class="category-card group relative flex flex-col p-8 rounded-[2rem] bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-700/60 card-hover-effect hover:shadow-glow-purple hover:border-purple-500/50 cursor-pointer overflow-hidden" data-category="n8n-workflow">
                    <div class="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    <div class="relative z-10">
                        <div class="flex justify-between items-start mb-6">
                            <div class="w-20 h-20 rounded-2xl bg-purple-100 dark:bg-purple-500/20 flex items-center justify-center text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-500/30 shadow-lg group-hover:scale-110 transition-transform duration-300">
                                <span class="material-symbols-outlined text-4xl">hub</span>
                            </div>
                            <span class="badge badge-purple">2 도구</span>
                        </div>
                        <h3 class="text-2xl font-black text-slate-900 dark:text-white mb-3 group-hover:text-purple-500 transition-colors">n8n 워크플로우</h3>
                        <p class="text-slate-500 dark:text-slate-400 text-sm leading-relaxed mb-6">자동화 워크플로우를 관리하고 새로운 작업 흐름을 생성합니다.</p>
                        <div class="flex items-center gap-2 text-purple-600 dark:text-purple-400 font-semibold text-sm">
                            <span>도구 보기</span>
                            <span class="material-symbols-outlined text-lg group-hover:translate-x-1 transition-transform">arrow_forward</span>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    `;

    // AI 엔지니어링 섹션 HTML
    const aiEngineerSection = `
        <!-- AI 엔지니어링 섹션 -->
        <section class="mb-20 animate-fade-in" id="ai-engineer">
            <div class="section-header">
                <div class="section-icon blue">
                    <span class="material-symbols-outlined text-2xl">engineering</span>
                </div>
                <div>
                    <h2 class="text-2xl font-bold text-slate-900 dark:text-white">AI 어시스턴스 지침 생성</h2>
                    <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">프롬프트 엔지니어링 도구 모음</p>
                </div>
                <div class="hidden sm:block h-px flex-1 bg-gradient-to-r from-slate-200 to-transparent dark:from-slate-800 ml-8"></div>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
                ${getAppCard('프롬프트 마법사', '복잡한 요구사항을 입력하면 최적의 AI 프롬프트로 변환해주는 마법 같은 도구입니다.', 'auto_fix_high', 'blue', 'prompt-wizard')}
                ${getAppCard('지침 최적화 도구', '기존의 지침을 분석하여 더 명확하고 효과적인 AI 지시문으로 개선합니다.', 'settings_suggest', 'blue', 'instruction-optimizer')}
                ${getAppCard('Persona 생성기', '중개사님의 스타일을 반영한 AI 페르소나를 생성하여 일관된 톤앤매너를 유지합니다.', 'person_search', 'blue', 'persona-generator')}
            </div>
        </section>
    `;

    // 프롬프트 생성기 섹션 HTML
    const promptGeneratorSection = `
        <!-- 프롬프트 생성기 섹션 -->
        <section class="mb-20 animate-fade-in" id="prompt-generator">
            <div class="section-header">
                <div class="section-icon emerald">
                    <span class="material-symbols-outlined text-2xl">auto_awesome</span>
                </div>
                <div>
                    <h2 class="text-2xl font-bold text-slate-900 dark:text-white">프롬프트 생성기</h2>
                    <div class="flex items-center gap-2 mt-1">
                        <span class="badge badge-emerald">CONTENTS</span>
                        <p class="text-sm text-slate-500 dark:text-slate-400">다양한 콘텐츠 생성을 위한 도구</p>
                    </div>
                </div>
                <div class="hidden sm:block h-px flex-1 bg-gradient-to-r from-slate-200 to-transparent dark:from-slate-800 ml-8"></div>
            </div>

            <!-- 대본 생성 도구 -->
            <div class="category-box">
                <div class="flex items-center gap-3 mb-6">
                    <span class="flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold text-sm">1</span>
                    <h3 class="text-lg font-bold text-slate-700 dark:text-slate-200">대본 생성 도구</h3>
                </div>
                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    ${getSmallAppCard('부동산 매물 대본', '아파트, 빌라, 상가 등 매물의 특징을 살린 매력적인 소개 대본을 작성합니다.', 'home_work', 'emerald', 'property-script')}
                    ${getSmallAppCard('브리핑 대본', '고객 미팅 전, 핵심 정보를 요약하여 전문적으로 브리핑할 수 있는 대본을 준비합니다.', 'mic', 'emerald', 'briefing-script')}
                    ${getSmallAppCard('공지사항 대본', '휴무 일정, 정책 변경 등 고객에게 알릴 공지사항 문구를 정중하게 작성합니다.', 'campaign', 'emerald', 'notice-script')}
                </div>
            </div>

            <!-- 이미지/영상 생성 -->
            <div class="category-box">
                <div class="flex items-center gap-3 mb-6">
                    <span class="flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold text-sm">2</span>
                    <h3 class="text-lg font-bold text-slate-700 dark:text-slate-200">이미지/영상/썸네일 생성</h3>
                </div>
                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    ${getSmallAppCard('이미지 아이디어', '매물 홍보에 적합한 이미지 컨셉과 구도 아이디어를 AI가 제안합니다.', 'photo_camera', 'emerald', 'image-idea')}
                    ${getSmallAppCard('영상 스토리보드', '매물 영상 촬영을 위한 컷 구성과 스토리보드 흐름을 기획합니다.', 'movie_filter', 'emerald', 'video-storyboard')}
                    ${getSmallAppCard('썸네일 컨셉', '클릭을 유도하는 매력적인 썸네일 디자인 컨셉과 문구를 추천합니다.', 'image', 'emerald', 'thumbnail-concept')}
                </div>
            </div>

            <!-- SEO 콘텐츠 -->
            <div class="category-box">
                <div class="flex items-center gap-3 mb-6">
                    <span class="flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold text-sm">3</span>
                    <h3 class="text-lg font-bold text-slate-700 dark:text-slate-200">SEO 규격 콘텐츠 생성</h3>
                </div>
                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    ${getSmallAppCard('유튜브 SEO', '유튜브 검색 상위 노출을 위한 제목, 설명, 태그 최적화 가이드를 제공합니다.', 'smart_display', 'emerald', 'youtube-seo')}
                    ${getSmallAppCard('인스타 해시태그', '게시물 노출을 극대화할 수 있는 인기 해시태그 조합을 생성합니다.', 'grid_on', 'emerald', 'insta-hashtag')}
                    ${getSmallAppCard('틱톡 트렌드', '틱톡에서 유행하는 챌린지와 트렌드를 분석하여 콘텐츠에 적용합니다.', 'music_note', 'emerald', 'tiktok-trend')}
                </div>
            </div>
        </section>
    `;

    // n8n 워크플로우 섹션 HTML
    const n8nWorkflowSection = `
        <!-- n8n 워크플로우 섹션 -->
        <section class="mb-20 animate-fade-in" id="n8n-workflow">
            <div class="section-header">
                <div class="section-icon purple">
                    <span class="material-symbols-outlined text-2xl">hub</span>
                </div>
                <div>
                    <h2 class="text-2xl font-bold text-slate-900 dark:text-white">n8n 워크플로우 연결</h2>
                    <a class="inline-flex items-center gap-1 text-sm text-purple-600 dark:text-purple-400 hover:underline" href="https://n8n.hyehwa72.org" target="_blank">
                        n8n.hyehwa72.org <span class="material-symbols-outlined text-[14px]">open_in_new</span>
                    </a>
                </div>
                <div class="hidden sm:block h-px flex-1 bg-gradient-to-r from-slate-200 to-transparent dark:from-slate-800 ml-8"></div>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
                ${getAppCard('내 워크플로우 목록', '현재 연결된 모든 n8n 자동화 워크플로우의 상태와 목록을 확인합니다.', 'account_tree', 'purple', 'workflow-list')}
                ${getAppCard('새 워크플로우 생성', '새로운 자동화 작업을 시작하기 위한 빈 워크플로우를 생성합니다.', 'add_circle', 'purple', 'new-workflow')}
            </div>
        </section>
    `;

    // 페이지에 따라 콘텐츠 결정
    let content = heroSection;

    switch (page) {
        case 'dashboard':
            // 대시보드 홈: 카테고리 카드만 표시
            content += categoryCardsSection;
            break;
        case 'ai-engineer':
            // AI 엔지니어링만 표시
            content += aiEngineerSection;
            break;
        case 'prompt-generator':
            // 프롬프트 생성기만 표시
            content += promptGeneratorSection;
            break;
        case 'n8n-workflow':
            // n8n 워크플로우만 표시
            content += n8nWorkflowSection;
            break;
        default:
            // 기본: 카테고리 카드 표시
            content += categoryCardsSection;
    }

    return content;
}


// 앱 카드 HTML 생성
function getAppCard(title, description, icon, color, id) {
    return `
        <div class="app-card ${color}" data-app-id="${id}">
            <div class="relative z-10 flex flex-col h-full">
                <div class="flex justify-between items-start mb-6">
                    <div class="icon-box ${color}">
                        <span class="material-symbols-outlined text-3xl">${icon}</span>
                    </div>
                    <div class="p-2 rounded-full bg-slate-50 dark:bg-slate-800 text-slate-400 group-hover:text-primary group-hover:bg-primary/10 transition-colors">
                        <span class="material-symbols-outlined text-xl">arrow_outward</span>
                    </div>
                </div>
                <h3 class="text-xl font-bold text-slate-900 dark:text-white mb-3 transition-colors">${title}</h3>
                <p class="text-slate-500 dark:text-slate-400 text-sm leading-relaxed mb-6">${description}</p>
                <div class="mt-auto pt-5 border-t border-slate-100 dark:border-slate-700/50 flex flex-col gap-2">
                    <div class="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
                        <span class="material-symbols-outlined text-base">save</span>
                        <span>자동 저장 지원</span>
                    </div>
                    <div class="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
                        <span class="material-symbols-outlined text-base">content_copy</span>
                        <span>다운로드/복사 가능</span>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// 작은 앱 카드 HTML 생성
function getSmallAppCard(title, description, icon, color, id) {
    return `
        <div class="app-card ${color}" data-app-id="${id}">
            <div class="relative z-10">
                <div class="flex items-center gap-4 mb-4">
                    <div class="w-12 h-12 rounded-xl flex items-center justify-center" style="background: ${color === 'emerald' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(147, 51, 234, 0.1)'}; border: 1px solid ${color === 'emerald' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(147, 51, 234, 0.2)'};">
                        <span class="material-symbols-outlined text-2xl" style="color: ${color === 'emerald' ? '#10b981' : '#9333ea'}">${icon}</span>
                    </div>
                    <h3 class="text-lg font-bold text-slate-900 dark:text-white transition-colors">${title}</h3>
                </div>
                <p class="text-sm text-slate-500 dark:text-slate-400 leading-relaxed mb-4 min-h-[40px]">${description}</p>
                <div class="pt-4 border-t border-slate-100 dark:border-slate-700/50 text-xs font-semibold flex justify-between items-center" style="color: ${color === 'emerald' ? '#10b981' : '#9333ea'}">
                    <span>앱 실행하기</span>
                    <span class="material-symbols-outlined text-sm">arrow_forward</span>
                </div>
            </div>
        </div>
    `;
}

// 앱 카드 클릭 이벤트
function setupAppCardListeners() {
    // 앱 카드 클릭
    document.querySelectorAll('.app-card').forEach(card => {
        card.addEventListener('click', () => {
            const appId = card.dataset.appId;
            launchApp(appId);
        });
    });

    // 카테고리 카드 클릭
    document.querySelectorAll('.category-card').forEach(card => {
        card.addEventListener('click', () => {
            const category = card.dataset.category;
            navigateTo(category);
        });
    });
}

// 앱 실행
function launchApp(appId) {
    showLoading(appId);

    // 로딩 시뮬레이션
    let progress = 0;
    const interval = setInterval(() => {
        progress += Math.random() * 15;
        if (progress >= 100) {
            progress = 100;
            clearInterval(interval);
            setTimeout(() => {
                hideLoading();
                showAppPage(appId);
            }, 500);
        }
        updateLoadingProgress(progress);
    }, 300);
}

// 로딩 표시
function showLoading(appId) {
    const appNames = {
        'prompt-wizard': '프롬프트 마법사',
        'instruction-optimizer': '지침 최적화 도구',
        'persona-generator': 'Persona 생성기',
        'property-script': '부동산 매물 대본',
        'briefing-script': '브리핑 대본',
        'notice-script': '공지사항 대본',
        'image-idea': '이미지 아이디어',
        'video-storyboard': '영상 스토리보드',
        'thumbnail-concept': '썸네일 컨셉',
        'youtube-seo': '유튜브 SEO',
        'insta-hashtag': '인스타 해시태그',
        'tiktok-trend': '틱톡 트렌드',
        'workflow-list': '내 워크플로우 목록',
        'new-workflow': '새 워크플로우 생성'
    };

    document.getElementById('loadingTitle').textContent = appNames[appId] || '앱 실행 중';
    document.getElementById('loadingDesc').textContent = '백엔드 서버에 연결하는 중...';
    document.getElementById('loadingStep').textContent = '초기화 중...';
    document.getElementById('loadingPercent').textContent = '0%';
    document.getElementById('loadingBar').style.width = '0%';

    elements.loadingModal.classList.remove('hidden');
}

// 로딩 진행률 업데이트
function updateLoadingProgress(progress) {
    const steps = ['초기화 중...', '리소스 할당 중...', 'AI 모델 로딩...', '워크플로우 준비...', '완료!'];
    const stepIndex = Math.min(Math.floor(progress / 25), 4);

    document.getElementById('loadingStep').textContent = steps[stepIndex];
    document.getElementById('loadingPercent').textContent = `${Math.floor(progress)}%`;
    document.getElementById('loadingBar').style.width = `${progress}%`;
}

// 로딩 숨기기
function hideLoading() {
    elements.loadingModal.classList.add('hidden');
}

// 앱 페이지 표시
function showAppPage(appId) {
    elements.mainContent.innerHTML = getAppPageHTML(appId);
    setupAppPageListeners();
}

// 앱 페이지 HTML
function getAppPageHTML(appId) {
    const appNames = {
        'prompt-wizard': '프롬프트 마법사',
        'instruction-optimizer': '지침 최적화 도구',
        'persona-generator': 'Persona 생성기',
        'property-script': '부동산 매물 대본',
        'briefing-script': '브리핑 대본',
        'notice-script': '공지사항 대본',
        'image-idea': '이미지 아이디어',
        'video-storyboard': '영상 스토리보드',
        'thumbnail-concept': '썸네일 컨셉',
        'youtube-seo': '유튜브 SEO',
        'insta-hashtag': '인스타 해시태그',
        'tiktok-trend': '틱톡 트렌드',
        'workflow-list': '내 워크플로우 목록',
        'new-workflow': '새 워크플로우 생성'
    };

    return `
        <div class="max-w-5xl mx-auto animate-fade-in">
            <button class="back-btn flex items-center gap-2 text-slate-500 hover:text-primary dark:text-slate-400 transition-colors text-sm font-medium mb-6">
                <span class="material-symbols-outlined text-[20px]">arrow_back</span>
                대시보드로 돌아가기
            </button>
            
            <div class="flex items-center gap-4 mb-8">
                <div class="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-indigo-600 flex items-center justify-center shadow-lg shadow-primary/20">
                    <span class="material-symbols-outlined text-white text-3xl">auto_fix_high</span>
                </div>
                <div>
                    <h1 class="text-3xl font-black text-slate-900 dark:text-white">${appNames[appId] || appId}</h1>
                    <span class="inline-flex items-center gap-1 text-xs text-green-500 font-medium bg-green-500/10 px-2 py-1 rounded mt-2">
                        <span class="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                        Backend Active
                    </span>
                </div>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <!-- 입력 영역 -->
                <div class="bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-700 rounded-2xl p-6 shadow-sm">
                    <h3 class="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                        <span class="material-symbols-outlined text-primary">edit_note</span>
                        입력
                    </h3>
                    <div class="space-y-4">
                        <div>
                            <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">프롬프트 입력</label>
                            <textarea id="appInput" class="w-full h-48 p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-primary focus:border-transparent resize-none" placeholder="원하는 내용을 자세히 입력해주세요..."></textarea>
                        </div>
                        <button id="runAppBtn" class="btn-primary w-full flex items-center justify-center gap-2">
                            <span class="material-symbols-outlined">play_arrow</span>
                            실행하기
                        </button>
                    </div>
                </div>

                <!-- 결과 영역 -->
                <div class="bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-700 rounded-2xl p-6 shadow-sm">
                    <h3 class="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                        <span class="material-symbols-outlined text-emerald-500">auto_awesome</span>
                        결과
                    </h3>
                    <div id="appResult" class="h-48 p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 overflow-y-auto">
                        <p class="text-slate-400 text-sm">실행 버튼을 클릭하면 결과가 여기에 표시됩니다.</p>
                    </div>
                    <div class="flex gap-2 mt-4">
                        <button id="copyResultBtn" class="flex-1 py-2 px-4 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center justify-center gap-2">
                            <span class="material-symbols-outlined text-lg">content_copy</span>
                            복사
                        </button>
                        <button id="downloadResultBtn" class="flex-1 py-2 px-4 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center justify-center gap-2">
                            <span class="material-symbols-outlined text-lg">download</span>
                            다운로드
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// 앱 페이지 이벤트 리스너
function setupAppPageListeners() {
    document.querySelector('.back-btn')?.addEventListener('click', showDashboard);

    document.getElementById('runAppBtn')?.addEventListener('click', () => {
        const input = document.getElementById('appInput').value;
        if (!input.trim()) {
            alert('내용을 입력해주세요.');
            return;
        }

        const resultEl = document.getElementById('appResult');
        resultEl.innerHTML = '<p class="text-primary animate-pulse">처리 중...</p>';

        // 시뮬레이션된 결과
        setTimeout(() => {
            resultEl.innerHTML = `
                <div class="text-slate-900 dark:text-white space-y-3">
                    <p class="font-medium">✨ AI가 생성한 결과:</p>
                    <p class="text-sm leading-relaxed">${generateSampleResult(input)}</p>
                </div>
            `;
        }, 1500);
    });

    document.getElementById('copyResultBtn')?.addEventListener('click', () => {
        const result = document.getElementById('appResult').innerText;
        navigator.clipboard.writeText(result).then(() => {
            alert('클립보드에 복사되었습니다!');
        });
    });

    document.getElementById('downloadResultBtn')?.addEventListener('click', () => {
        const result = document.getElementById('appResult').innerText;
        const blob = new Blob([result], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'result.txt';
        a.click();
        URL.revokeObjectURL(url);
    });
}

// 샘플 결과 생성
function generateSampleResult(input) {
    const templates = [
        `입력하신 "${input.substring(0, 30)}..."에 대해 분석한 결과입니다.\n\n🏠 핵심 포인트:\n- 이 매물은 교통 편의성이 뛰어납니다\n- 주변 학군이 우수합니다\n- 향후 개발 호재가 예상됩니다\n\n📝 추천 멘트:\n"역세권 + 학세권의 완벽한 조화! 놓치면 후회할 매물입니다."`,
        `"${input.substring(0, 20)}..." 관련 최적화된 콘텐츠입니다.\n\n✅ SEO 최적화 제목:\n"[2024 최신] ${input.substring(0, 15)} 완벽 가이드"\n\n🏷️ 추천 해시태그:\n#부동산 #아파트 #매물추천 #부동산투자 #공인중개사\n\n📊 예상 조회수: 1,000+ views`,
        `입력 내용을 기반으로 생성된 프롬프트입니다:\n\n"당신은 전문 부동산 마케터입니다. 다음 매물 정보를 바탕으로 ${input.substring(0, 20)}에 맞는 매력적인 소개글을 작성해주세요. 타겟 고객은 30-40대 맞벌이 부부이며, 교통과 학군을 중요시합니다."`
    ];

    return templates[Math.floor(Math.random() * templates.length)];
}
