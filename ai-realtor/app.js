// AI 공부하는 공인중개사 - 메인 앱 스크립트

// 상태 관리
const state = {
    isLoggedIn: false,
    currentUser: null,
    currentPage: 'dashboard'
};

// 기본 관리자 계정 (초기화용)
const DEFAULT_ADMIN = {
    id: 'ongamemall',
    password: 'realhun0506',
    name: '관리자',
    role: 'admin',
    createdAt: new Date().toISOString()
};

// 사용자 데이터 관리
function getUsers() {
    const users = localStorage.getItem('aiRealtorUsers');
    if (!users) {
        // 기본 관리자 계정 초기화
        const initialUsers = [DEFAULT_ADMIN];
        localStorage.setItem('aiRealtorUsers', JSON.stringify(initialUsers));
        return initialUsers;
    }
    return JSON.parse(users);
}

function saveUsers(users) {
    localStorage.setItem('aiRealtorUsers', JSON.stringify(users));
}

// =============================================
// 앱 레지스트리 (App Store & Custom Apps)
// =============================================

const SYSTEM_APPS = [
    {
        id: 'app-builder',
        title: '새 도구 만들기',
        description: 'n8n Webhook과 연동되는 나만의 AI 도구를 만듭니다.',
        icon: 'build_circle',
        color: 'indigo',
        type: 'system-builder',
        inputs: []
    },
    {
        id: 'new-workflow',
        title: 'n8n JSON 생성',
        description: 'n8n 워크플로우 JSON 코드를 생성해줍니다.',
        icon: 'hub',
        color: 'rose',
        type: 'system-generator',
        inputs: [
            { id: 'prompt', type: 'textarea', label: '워크플로우 설명', placeholder: '예: 고객 문의 자동 응답' }
        ]
    },
    {
        id: 'rag-management',
        title: 'RAG 지식 관리',
        description: '지식 데이터베이스 및 문서를 관리합니다.',
        icon: 'database',
        color: 'emerald',
        type: 'system-link',
        targetPage: 'rag-management'
    },
    {
        id: 'prompt-wizard',
        title: '프롬프트 마법사',
        description: '복잡한 프롬프트를 AI가 알기 쉽게 최적화해줍니다.',
        icon: 'magic_button',
        color: 'violet',
        type: 'mock',
        inputs: [{ id: 'input', type: 'textarea', label: '프롬프트 입력', placeholder: '최적화할 프롬프트 내용을 입력하세요.' }]
    },
    {
        id: 'property-script',
        title: '부동산 매물 대본',
        description: '매물 정보를 입력하면 유튜브/블로그용 대본을 작성합니다.',
        icon: 'description',
        color: 'blue',
        type: 'mock',
        inputs: [{ id: 'input', type: 'textarea', label: '매물 정보', placeholder: '위치, 가격, 특징 등을 입력하세요.' }]
    }
];

function getApps() {
    const customApps = JSON.parse(localStorage.getItem('aiRealtorCustomApps') || '[]');
    const systemIds = new Set(SYSTEM_APPS.map(a => a.id));
    return [...SYSTEM_APPS, ...customApps.filter(a => !systemIds.has(a.id))];
}

function findApp(appId) {
    return getApps().find(a => a.id === appId);
}

function registerCustomApp(appData) {
    const customApps = JSON.parse(localStorage.getItem('aiRealtorCustomApps') || '[]');
    const newApp = {
        ...appData,
        id: `custom-${Date.now()}`,
        type: 'webhook',
        color: 'cyan',
        createdAt: new Date().toISOString()
    };
    customApps.push(newApp);
    localStorage.setItem('aiRealtorCustomApps', JSON.stringify(customApps));
    return newApp;
}

function deleteCustomApp(appId) {
    let customApps = JSON.parse(localStorage.getItem('aiRealtorCustomApps') || '[]');
    customApps = customApps.filter(a => a.id !== appId);
    localStorage.setItem('aiRealtorCustomApps', JSON.stringify(customApps));
}

function findUser(id) {
    const users = getUsers();
    return users.find(u => u.id === id);
}

function addUser(userData) {
    const users = getUsers();
    if (users.find(u => u.id === userData.id)) {
        return { success: false, message: '이미 존재하는 ID입니다.' };
    }
    users.push({
        ...userData,
        createdAt: new Date().toISOString()
    });
    saveUsers(users);
    return { success: true, message: '계정이 생성되었습니다.' };
}

function deleteUser(id) {
    const users = getUsers();
    const index = users.findIndex(u => u.id === id);
    if (index === -1) return { success: false, message: '사용자를 찾을 수 없습니다.' };
    if (users[index].role === 'admin' && users.filter(u => u.role === 'admin').length === 1) {
        return { success: false, message: '마지막 관리자는 삭제할 수 없습니다.' };
    }
    users.splice(index, 1);
    saveUsers(users);
    return { success: true, message: '계정이 삭제되었습니다.' };
}

function updateUser(id, updates) {
    const users = getUsers();
    const index = users.findIndex(u => u.id === id);
    if (index === -1) return { success: false, message: '사용자를 찾을 수 없습니다.' };
    users[index] = { ...users[index], ...updates };
    saveUsers(users);
    return { success: true, message: '계정이 수정되었습니다.' };
}

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
    getUsers(); // 사용자 데이터 초기화
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
        updateUserBadge();
        showDashboard();
    } else {
        showLogin();
    }
}

// 사용자 뱃지 업데이트 및 관리자 메뉴 표시
function updateUserBadge() {
    const badge = document.querySelector('#userName + span');
    const adminMenuSection = document.getElementById('adminMenuSection');

    if (badge && state.currentUser) {
        badge.textContent = state.currentUser.role === 'admin' ? 'ADMIN' : 'USER';
        badge.className = state.currentUser.role === 'admin'
            ? 'text-[11px] text-red-500 font-bold uppercase tracking-wide bg-red-500/10 px-1.5 py-0.5 rounded mt-0.5'
            : 'text-[11px] text-primary font-bold uppercase tracking-wide bg-primary/10 px-1.5 py-0.5 rounded mt-0.5';
    }

    // 관리자 메뉴 표시/숨김
    if (adminMenuSection) {
        if (state.currentUser?.role === 'admin') {
            adminMenuSection.classList.remove('hidden');
        } else {
            adminMenuSection.classList.add('hidden');
        }
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

    const id = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    const user = findUser(id);

    if (user && user.password === password) {
        state.isLoggedIn = true;
        state.currentUser = {
            id: user.id,
            name: user.name,
            role: user.role
        };
        localStorage.setItem('aiRealtorUser', JSON.stringify(state.currentUser));

        elements.loginError.classList.add('hidden');
        elements.userName.textContent = state.currentUser.name;
        updateUserBadge();

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
    // 계정 관리 페이지인 경우 별도 처리
    if (state.currentPage === 'user-management') {
        if (state.currentUser?.role === 'admin') {
            elements.mainContent.innerHTML = getUserManagementHTML();
            setupUserManagementListeners();
        } else {
            // 관리자가 아닐 경우 대시보드로 리다이렉트
            state.currentPage = 'dashboard';
            elements.mainContent.innerHTML = getDashboardHTML();
            setupAppCardListeners();
        }
    } else if (state.currentPage === 'rag-management') {
        if (state.currentUser?.role === 'admin') {
            elements.mainContent.innerHTML = getRAGManagementHTML();
            setupRAGManagementListeners();
        } else {
            state.currentPage = 'dashboard';
            elements.mainContent.innerHTML = getDashboardHTML();
            setupAppCardListeners();
        }
    } else {
        elements.mainContent.innerHTML = getDashboardHTML();
        setupAppCardListeners();
    }
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
    // 동적으로 시스템 앱과 커스텀 앱 로드
    const allApps = getApps();
    const builderApp = findApp('app-builder');
    const generatorApp = findApp('new-workflow');

    // 커스텀 앱 목록 (타입이 webhook 인 것들)
    const customAppsHTML = allApps
        .filter(a => a.type === 'webhook')
        .map(a => getAppCard(a.title, a.description, a.icon || 'smart_toy', a.color || 'blue', a.id))
        .join('');

    const n8nWorkflowSection = `
        <!-- n8n 워크플로우 섹션 -->
        <section class="mb-20 animate-fade-in" id="n8n-workflow">
            <div class="section-header">
                <div class="section-icon purple">
                    <span class="material-symbols-outlined text-2xl">hub</span>
                </div>
                <div>
                    <h2 class="text-2xl font-bold text-slate-900 dark:text-white">나만의 AI 도구 & 워크플로우</h2>
                    <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">n8n과 연동된 커스텀 도구를 만들고 사용합니다.</p>
                </div>
                <div class="hidden sm:block h-px flex-1 bg-gradient-to-r from-slate-200 to-transparent dark:from-slate-800 ml-8"></div>
            </div>
            
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
                <!-- 시스템 도구 -->
                ${builderApp ? getAppCard(builderApp.title, builderApp.description, builderApp.icon, builderApp.color, builderApp.id) : ''}
                ${generatorApp ? getAppCard(generatorApp.title, generatorApp.description, generatorApp.icon, generatorApp.color, generatorApp.id) : ''}
                
                <!-- 사용자가 만든 커스텀 도구들 -->
                ${customAppsHTML}
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
    const app = findApp(appId);
    const appTitle = app ? app.title : '앱 실행 중';

    document.getElementById('loadingTitle').textContent = appTitle;
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
    setupAppPageListeners(appId);
}

// 앱 페이지 HTML
function getAppPageHTML(appId) {
    const app = findApp(appId);

    if (!app) return '<div class="p-8 text-center">앱을 찾을 수 없습니다.</div>';

    // 1. App Builder (새 도구 만들기)
    if (app.type === 'system-builder') {
        return getAppBuilderHTML(app);
    }

    // 2. RAG Management (링크형)
    if (app.type === 'system-link') {
        // 이미 라우팅 처리되었어야 하나, 안전장치
        return `<div class="text-center p-12">Redirecting...</div>`;
    }

    // 3. 일반 앱 (시스템/커스텀)
    // 입력 필드 생성
    const inputFieldsHTML = (app.inputs || []).map(input => `
        <div class="mb-4">
            <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">${input.label}</label>
            ${input.type === 'textarea'
            ? `<textarea id="input_${input.id}" class="w-full h-32 p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-${app.color}-500 resize-none" placeholder="${input.placeholder || ''}"></textarea>`
            : `<input type="text" id="input_${input.id}" class="w-full p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-${app.color}-500" placeholder="${input.placeholder || ''}">`
        }
        </div>
    `).join('');

    return `
        <div class="max-w-5xl mx-auto animate-fade-in">
            <button class="back-btn flex items-center gap-2 text-slate-500 hover:text-primary dark:text-slate-400 transition-colors text-sm font-medium mb-6">
                <span class="material-symbols-outlined text-[20px]">arrow_back</span>
                대시보드로 돌아가기
            </button>
            
            <div class="flex items-center justify-between mb-8">
                <div class="flex items-center gap-4">
                    <div class="w-16 h-16 rounded-2xl bg-${app.color}-500 text-white flex items-center justify-center shadow-lg shadow-${app.color}-500/20">
                        <span class="material-symbols-outlined text-3xl">${app.icon}</span>
                    </div>
                    <div>
                        <h1 class="text-3xl font-black text-slate-900 dark:text-white">${app.title}</h1>
                        <p class="text-slate-500 mt-1">${app.description}</p>
                    </div>
                </div>
                ${app.type === 'webhook' ? `
                    <button id="deleteAppBtn" class="text-red-400 hover:text-red-500 text-sm flex items-center gap-1 px-3 py-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                        <span class="material-symbols-outlined text-lg">delete</span> 삭제
                    </button>
                ` : ''}
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <!-- 입력 영역 -->
                <div class="bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-700 rounded-2xl p-6 shadow-sm">
                    <h3 class="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                        <span class="material-symbols-outlined text-${app.color}-500">input</span>
                        입력 설정
                    </h3>
                    <div class="space-y-4">
                        ${inputFieldsHTML || '<p class="text-slate-400 text-sm">입력 항목이 없습니다. 바로 실행하세요.</p>'}
                        <button id="runAppBtn" class="w-full py-4 mt-4 bg-${app.color}-600 hover:bg-${app.color}-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-${app.color}-500/25 flex items-center justify-center gap-2">
                            <span class="material-symbols-outlined">play_arrow</span>
                            실행하기
                        </button>
                    </div>
                </div>

                <!-- 결과 영역 -->
                <div class="bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-700 rounded-2xl p-6 shadow-sm flex flex-col">
                    <h3 class="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                        <span class="material-symbols-outlined text-emerald-500">auto_awesome</span>
                        실행 결과
                    </h3>
                    <div id="appResult" class="flex-1 min-h-[300px] p-6 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 overflow-y-auto">
                        <div class="h-full flex flex-col items-center justify-center text-slate-400 text-sm">
                            <span class="material-symbols-outlined text-4xl mb-2 opacity-50">terminal</span>
                            <p>입력 값을 넣고 실행 버튼을 눌러주세요.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// 앱 빌더 HTML
function getAppBuilderHTML(app) {
    return `
        <div class="max-w-3xl mx-auto animate-fade-in">
             <button class="back-btn flex items-center gap-2 text-slate-500 hover:text-primary dark:text-slate-400 transition-colors text-sm font-medium mb-6">
                <span class="material-symbols-outlined text-[20px]">arrow_back</span>
                대시보드로 돌아가기
            </button>
            
            <div class="bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-700 rounded-2xl p-8 shadow-lg">
                <div class="flex items-center gap-4 mb-8 pb-8 border-b border-slate-100 dark:border-slate-700">
                    <div class="w-16 h-16 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-500/30">
                        <span class="material-symbols-outlined text-3xl">build</span>
                    </div>
                    <div>
                        <h1 class="text-2xl font-black text-slate-900 dark:text-white">새로운 AI 도구 만들기</h1>
                        <p class="text-slate-500 mt-1">n8n Webhook과 연동하여 나만의 앱을 생성합니다.</p>
                    </div>
                </div>

                <form id="createAppForm" class="space-y-6">
                    <div class="grid grid-cols-2 gap-6">
                        <div>
                            <label class="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">도구 이름</label>
                            <input type="text" id="newAppTitle" class="w-full p-3 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700" placeholder="예: 유튜브 요약기" required>
                        </div>
                        <div>
                            <label class="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">설명</label>
                            <input type="text" id="newAppDesc" class="w-full p-3 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700" placeholder="이 도구에 대한 간단한 설명" required>
                        </div>
                    </div>

                    <div>
                        <label class="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                            <span class="flex items-center gap-2">
                                n8n Webhook URL
                                <span class="bg-indigo-100 text-indigo-600 text-[10px] px-2 py-0.5 rounded-full uppercase">POST Method</span>
                            </span>
                        </label>
                        <input type="url" id="newAppWebhook" class="w-full p-3 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-sm text-indigo-600" placeholder="https://your-n8n-instance.com/webhook/..." required>
                        <p class="text-xs text-slate-400 mt-1.5 ml-1">n8n 워크플로우의 Webhook (Production URL)을 입력하세요.</p>
                    </div>

                    <div class="pt-6 border-t border-slate-100 dark:border-slate-700">
                        <div class="flex items-center justify-between mb-4">
                            <label class="block text-sm font-bold text-slate-700 dark:text-slate-300">입력 필드 설정</label>
                            <button type="button" id="addInputBtn" class="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
                                <span class="material-symbols-outlined text-sm">add_circle</span> 필드 추가
                            </button>
                        </div>
                        <div id="inputFieldsList" class="space-y-3">
                            <!-- 초기 필드 하나 -->
                            <div class="flex gap-3 items-start field-row">
                                <input type="text" class="field-id flex-1 p-2 rounded bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm" placeholder="Field ID (예: prompt)" required value="prompt">
                                <input type="text" class="field-label flex-1 p-2 rounded bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm" placeholder="Label (예: 질문)" required value="질문">
                                <select class="field-type w-24 p-2 rounded bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm">
                                    <option value="text">Text</option>
                                    <option value="textarea" selected>TextArea</option>
                                </select>
                                <button type="button" class="text-slate-400 hover:text-red-500 p-2" onclick="this.parentElement.remove()"><span class="material-symbols-outlined text-lg">cancel</span></button>
                            </div>
                        </div>
                    </div>

                    <button type="submit" class="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-lg shadow-lg shadow-indigo-500/25 transition-all mt-8">
                        도구 생성하기
                    </button>
                </form>
            </div>
        </div>
    `;
}

// 앱 페이지 이벤트 리스너
function setupAppPageListeners(appId) {
    const app = findApp(appId);
    document.querySelector('.back-btn')?.addEventListener('click', showDashboard);

    // 1. 앱 생성 폼 처리 (App Builder)
    const createAppForm = document.getElementById('createAppForm');
    if (createAppForm) {
        // 필드 추가 버튼
        document.getElementById('addInputBtn')?.addEventListener('click', () => {
            const list = document.getElementById('inputFieldsList');
            const row = document.createElement('div');
            row.className = 'flex gap-3 items-start field-row';
            row.innerHTML = `
                <input type="text" class="field-id flex-1 p-2 rounded bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm" placeholder="ID (예: topic)" required>
                <input type="text" class="field-label flex-1 p-2 rounded bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm" placeholder="Label (예: 주제)" required>
                <select class="field-type w-24 p-2 rounded bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm">
                    <option value="text">Text</option>
                    <option value="textarea">TextArea</option>
                </select>
                <button type="button" class="text-slate-400 hover:text-red-500 p-2" onclick="this.parentElement.remove()"><span class="material-symbols-outlined text-lg">cancel</span></button>
            `;
            list.appendChild(row);
        });

        // 폼 제출
        createAppForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const title = document.getElementById('newAppTitle').value;
            const desc = document.getElementById('newAppDesc').value;
            const webhook = document.getElementById('newAppWebhook').value;

            const inputs = [];
            document.querySelectorAll('.field-row').forEach(row => {
                inputs.push({
                    id: row.querySelector('.field-id').value,
                    label: row.querySelector('.field-label').value,
                    type: row.querySelector('.field-type').value,
                    placeholder: `${row.querySelector('.field-label').value}을(를) 입력하세요`
                });
            });

            registerCustomApp({
                title,
                description: desc,
                webhookUrl: webhook,
                inputs,
                icon: 'smart_toy' // 기본 아이콘
            });

            alert('새로운 도구가 생성되었습니다!');
            showDashboard();
        });
        return;
    }

    // 2. 앱 실행 및 삭제 처리
    document.getElementById('deleteAppBtn')?.addEventListener('click', () => {
        if (confirm('이 도구를 정말 삭제하시겠습니까?')) {
            deleteCustomApp(appId);
            showDashboard();
        }
    });

    document.getElementById('runAppBtn')?.addEventListener('click', async () => {
        const resultEl = document.getElementById('appResult');
        resultEl.innerHTML = '<div class="h-full flex items-center justify-center"><p class="text-primary animate-pulse flex items-center gap-2"><span class="material-symbols-outlined animate-spin">progress_activity</span> 처리 중...</p></div>';

        // 입력 값 수집
        const inputData = {};
        let hasEmpty = false;
        (app.inputs || []).forEach(input => {
            const val = document.getElementById(`input_${input.id}`).value;
            if (!val.trim()) hasEmpty = true;
            inputData[input.id] = val;
        });

        if (hasEmpty) {
            alert('모든 내용을 입력해주세요.');
            resultEl.innerHTML = '';
            return;
        }

        // Case A: JSON Generator (구 new-workflow)
        if (app.type === 'system-generator') {
            setTimeout(() => {
                const workflowJson = generateN8nWorkflowJSON(inputData.prompt || '');
                resultEl.innerHTML = `
                    <div class="text-slate-900 dark:text-white space-y-3">
                        <div class="flex items-center justify-between">
                            <p class="font-bold flex items-center gap-2">
                                <span class="material-symbols-outlined text-[#ff6d5a]">hub</span>
                                n8n Workflow JSON
                            </p>
                            <span class="text-xs bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded text-slate-500">Copy & Paste to n8n</span>
                        </div>
                        <pre class="bg-slate-900 text-green-400 p-4 rounded-xl text-xs font-mono overflow-auto max-h-60 leading-relaxed custom-scrollbar select-all">${JSON.stringify(workflowJson, null, 2)}</pre>
                    </div>
                `;
            }, 1000);
            return;
        }

        // Case B: Webhook Apps (Custom or Mock)
        console.log('Sending to Webhook:', app.webhookUrl, inputData);

        try {
            // Mock Simulation
            await new Promise(resolve => setTimeout(resolve, 2000));

            let mockOutput = "";
            if (app.id === 'prompt-wizard') {
                mockOutput = `[프롬프트 최적화 결과]\n\n"당신은 부동산 전문 마케터입니다..."`;
            } else if (app.id === 'property-script') {
                mockOutput = `[유튜브 대본 초안]\n\n안녕하세요! 오늘 소개해드릴 매물은...`;
            } else {
                mockOutput = `[Webhook 응답 성공]\n\n워크플로우 '${app.title}' 실행 완료.\n(Webhook URL: ${app.webhookUrl})\n\n[처리 결과]\n성공적으로 데이터를 전송했습니다.`;
            }

            resultEl.innerHTML = `
                <div class="text-slate-900 dark:text-white space-y-3">
                    <div class="flex items-center gap-2 text-green-500 font-bold text-sm mb-2">
                         <span class="material-symbols-outlined text-base">check_circle</span> 실행 완료
                    </div>
                    <p class="text-sm leading-relaxed whitespace-pre-wrap">${mockOutput}</p>
                </div>
            `;

        } catch (e) {
            resultEl.innerHTML = `<p class="text-red-500">실행 오류: ${e.message}</p>`;
        }
    });

    document.getElementById('copyResultBtn')?.addEventListener('click', () => {
        const result = document.getElementById('appResult').innerText;
        navigator.clipboard.writeText(result).then(() => alert('복사되었습니다.'));
    });

    document.getElementById('downloadResultBtn')?.addEventListener('click', () => {
        const result = document.getElementById('appResult').innerText;
        const blob = new Blob([result], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'result.txt';
        a.click();
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

// n8n 워크플로우 JSON 생성기 (Mock)
function generateN8nWorkflowJSON(input) {
    // 사용자의 입력 내용을 바탕으로 프롬프트 구성
    const userPrompt = input.replace(/"/g, '\\"').substring(0, 100);

    return {
        "name": "AI Realtor Auto-Workflow",
        "nodes": [
            {
                "parameters": {
                    "path": "webhook-trigger",
                    "responseMode": "lastNode",
                    "options": {}
                },
                "id": "uuid-1",
                "name": "Webhook",
                "type": "n8n-nodes-base.webhook",
                "typeVersion": 1,
                "position": [100, 300]
            },
            {
                "parameters": {
                    "model": "gpt-4",
                    "prompt": `Role: Professional Real Estate Marketer\nRequest: ${userPrompt}\n\nClient Data: {{ $json.body }}`,
                    "temperature": 0.7,
                    "options": {}
                },
                "id": "uuid-2",
                "name": "AI Generator",
                "type": "n8n-nodes-base.openAi",
                "typeVersion": 1,
                "position": [300, 300]
            },
            {
                "parameters": {
                    "subject": "자동 응답: 문의 감사드립니다",
                    "html": "<html><body><p>{{ $json.message.content }}</p><hr><p>72놀이터 부동산 제공</p></body></html>",
                    "toEmail": "{{ $json.body.email }}"
                },
                "id": "uuid-3",
                "name": "Send Email",
                "type": "n8n-nodes-base.emailSend",
                "typeVersion": 1,
                "position": [500, 300]
            }
        ],
        "connections": {
            "Webhook": {
                "main": [
                    [{ "node": "AI Generator", "type": "main", "index": 0 }]
                ]
            },
            "AI Generator": {
                "main": [
                    [{ "node": "Send Email", "type": "main", "index": 0 }]
                ]
            }
        }
    };
}

// =============================================
// 계정 관리 페이지
// =============================================

function getUserManagementHTML() {
    const users = getUsers();

    const userRows = users.map(user => `
        <tr class="border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
            <td class="py-4 px-4">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-xl ${user.role === 'admin' ? 'bg-red-100 dark:bg-red-500/20 text-red-500' : 'bg-primary/10 text-primary'} flex items-center justify-center font-bold">
                        ${user.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <div class="font-semibold text-slate-900 dark:text-white">${user.name}</div>
                        <div class="text-xs text-slate-500">${user.id}</div>
                    </div>
                </div>
            </td>
            <td class="py-4 px-4">
                <span class="px-3 py-1 rounded-full text-xs font-bold ${user.role === 'admin' ? 'bg-red-100 dark:bg-red-500/20 text-red-500' : 'bg-blue-100 dark:bg-blue-500/20 text-blue-500'}">
                    ${user.role === 'admin' ? '관리자' : '사용자'}
                </span>
            </td>
            <td class="py-4 px-4 text-sm text-slate-500">
                ${new Date(user.createdAt).toLocaleDateString('ko-KR')}
            </td>
            <td class="py-4 px-4">
                <div class="flex gap-2">
                    <button class="edit-user-btn p-2 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 text-slate-400 hover:text-blue-500 transition-colors" data-id="${user.id}" title="수정">
                        <span class="material-symbols-outlined text-lg">edit</span>
                    </button>
                    <button class="delete-user-btn p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-400 hover:text-red-500 transition-colors ${user.id === state.currentUser.id ? 'opacity-30 cursor-not-allowed' : ''}" data-id="${user.id}" title="삭제" ${user.id === state.currentUser.id ? 'disabled' : ''}>
                        <span class="material-symbols-outlined text-lg">delete</span>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');

    return `
        <div class="max-w-5xl mx-auto animate-fade-in">
            <!-- 헤더 -->
            <div class="flex items-center justify-between mb-8">
                <div class="flex items-center gap-4">
                    <div class="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center shadow-lg shadow-red-500/20">
                        <span class="material-symbols-outlined text-white text-2xl">manage_accounts</span>
                    </div>
                    <div>
                        <h1 class="text-3xl font-black text-slate-900 dark:text-white">계정 관리</h1>
                        <p class="text-slate-500 text-sm mt-1">사용자 계정을 생성하고 관리합니다</p>
                    </div>
                </div>
                <button id="addUserBtn" class="flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white font-bold shadow-lg shadow-red-500/25 transition-all hover:-translate-y-0.5 active:scale-95">
                    <span class="material-symbols-outlined">person_add</span>
                    새 계정 추가
                </button>
            </div>

            <!-- 통계 카드 -->
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                <div class="bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-700 rounded-2xl p-5">
                    <div class="flex items-center gap-3">
                        <div class="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500">
                            <span class="material-symbols-outlined">group</span>
                        </div>
                        <div>
                            <div class="text-2xl font-black text-slate-900 dark:text-white">${users.length}</div>
                            <div class="text-xs text-slate-500 font-medium">전체 계정</div>
                        </div>
                    </div>
                </div>
                <div class="bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-700 rounded-2xl p-5">
                    <div class="flex items-center gap-3">
                        <div class="w-12 h-12 rounded-xl bg-red-100 dark:bg-red-500/20 flex items-center justify-center text-red-500">
                            <span class="material-symbols-outlined">admin_panel_settings</span>
                        </div>
                        <div>
                            <div class="text-2xl font-black text-slate-900 dark:text-white">${users.filter(u => u.role === 'admin').length}</div>
                            <div class="text-xs text-slate-500 font-medium">관리자</div>
                        </div>
                    </div>
                </div>
                <div class="bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-700 rounded-2xl p-5">
                    <div class="flex items-center gap-3">
                        <div class="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center text-blue-500">
                            <span class="material-symbols-outlined">person</span>
                        </div>
                        <div>
                            <div class="text-2xl font-black text-slate-900 dark:text-white">${users.filter(u => u.role === 'user').length}</div>
                            <div class="text-xs text-slate-500 font-medium">일반 사용자</div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- 사용자 목록 테이블 -->
            <div class="bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden">
                <table class="w-full">
                    <thead class="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                        <tr>
                            <th class="py-4 px-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">사용자</th>
                            <th class="py-4 px-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">권한</th>
                            <th class="py-4 px-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">생성일</th>
                            <th class="py-4 px-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">작업</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${userRows}
                    </tbody>
                </table>
            </div>
        </div>

        <!-- 계정 추가/수정 모달 -->
        <div id="userModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm hidden">
            <div class="w-full max-w-md bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl p-8 mx-4">
                <div class="flex items-center justify-between mb-6">
                    <h2 id="userModalTitle" class="text-xl font-bold text-slate-900 dark:text-white">새 계정 추가</h2>
                    <button id="closeUserModalBtn" class="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 transition-colors">
                        <span class="material-symbols-outlined">close</span>
                    </button>
                </div>
                <form id="userForm" class="space-y-5">
                    <input type="hidden" id="editUserId" value="">
                    <div>
                        <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">아이디</label>
                        <input type="text" id="userIdInput" class="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent" placeholder="아이디 입력" required>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">이름</label>
                        <input type="text" id="userNameInput" class="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent" placeholder="이름 입력" required>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">비밀번호</label>
                        <input type="password" id="userPasswordInput" class="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent" placeholder="비밀번호 입력">
                        <p id="passwordHint" class="text-xs text-slate-400 mt-1 hidden">수정 시 비워두면 기존 비밀번호 유지</p>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">권한</label>
                        <select id="userRoleInput" class="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent">
                            <option value="user">일반 사용자</option>
                            <option value="admin">관리자</option>
                        </select>
                    </div>
                    <div id="userFormError" class="text-red-500 text-sm hidden"></div>
                    <button type="submit" class="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white font-bold transition-all">
                        저장
                    </button>
                </form>
            </div>
        </div>
    `;
}

function setupUserManagementListeners() {
    // 새 계정 추가 버튼
    document.getElementById('addUserBtn')?.addEventListener('click', () => {
        openUserModal();
    });

    // 모달 닫기
    document.getElementById('closeUserModalBtn')?.addEventListener('click', closeUserModal);
    document.getElementById('userModal')?.addEventListener('click', (e) => {
        if (e.target.id === 'userModal') closeUserModal();
    });

    // 사용자 폼 제출
    document.getElementById('userForm')?.addEventListener('submit', handleUserFormSubmit);

    // 수정 버튼들
    document.querySelectorAll('.edit-user-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const userId = btn.dataset.id;
            openUserModal(userId);
        });
    });

    // 삭제 버튼들
    document.querySelectorAll('.delete-user-btn').forEach(btn => {
        if (!btn.disabled) {
            btn.addEventListener('click', () => {
                const userId = btn.dataset.id;
                handleDeleteUser(userId);
            });
        }
    });
}

function openUserModal(userId = null) {
    const modal = document.getElementById('userModal');
    const title = document.getElementById('userModalTitle');
    const idInput = document.getElementById('userIdInput');
    const nameInput = document.getElementById('userNameInput');
    const passwordInput = document.getElementById('userPasswordInput');
    const roleInput = document.getElementById('userRoleInput');
    const editIdInput = document.getElementById('editUserId');
    const passwordHint = document.getElementById('passwordHint');
    const errorDiv = document.getElementById('userFormError');

    errorDiv.classList.add('hidden');

    if (userId) {
        // 수정 모드
        const user = findUser(userId);
        if (user) {
            title.textContent = '계정 수정';
            editIdInput.value = userId;
            idInput.value = user.id;
            idInput.disabled = true;
            nameInput.value = user.name;
            passwordInput.value = '';
            passwordInput.required = false;
            passwordHint.classList.remove('hidden');
            roleInput.value = user.role;
        }
    } else {
        // 추가 모드
        title.textContent = '새 계정 추가';
        editIdInput.value = '';
        idInput.value = '';
        idInput.disabled = false;
        nameInput.value = '';
        passwordInput.value = '';
        passwordInput.required = true;
        passwordHint.classList.add('hidden');
        roleInput.value = 'user';
    }

    modal.classList.remove('hidden');
}

function closeUserModal() {
    document.getElementById('userModal')?.classList.add('hidden');
}

function handleUserFormSubmit(e) {
    e.preventDefault();

    const editId = document.getElementById('editUserId').value;
    const id = document.getElementById('userIdInput').value.trim();
    const name = document.getElementById('userNameInput').value.trim();
    const password = document.getElementById('userPasswordInput').value;
    const role = document.getElementById('userRoleInput').value;
    const errorDiv = document.getElementById('userFormError');

    if (editId) {
        // 수정
        const updates = { name, role };
        if (password) updates.password = password;

        const result = updateUser(editId, updates);
        if (result.success) {
            closeUserModal();
            showDashboard();
        } else {
            errorDiv.textContent = result.message;
            errorDiv.classList.remove('hidden');
        }
    } else {
        // 추가
        if (!password) {
            errorDiv.textContent = '비밀번호를 입력해주세요.';
            errorDiv.classList.remove('hidden');
            return;
        }

        const result = addUser({ id, name, password, role });
        if (result.success) {
            closeUserModal();
            showDashboard();
        } else {
            errorDiv.textContent = result.message;
            errorDiv.classList.remove('hidden');
        }
    }
}

function handleDeleteUser(userId) {
    const user = findUser(userId);
    if (!user) return;

    if (confirm(`"${user.name}" 계정을 삭제하시겠습니까?`)) {
        const result = deleteUser(userId);
        if (result.success) {
            showDashboard();
        } else {
            alert(result.message);
        }
    }
}

// =============================================
// RAG 데이터 관리 페이지
// =============================================

// RAG API 설정
const RAG_API = {
    BASE_URL: 'https://api.hyehwa72.org',
    ENDPOINTS: {
        HEALTH: '/health',
        STATS: '/stats',
        DOCUMENTS: '/documents',
        SEARCH: '/search' // 가상의 검색 엔드포인트
    }
};

function getRAGManagementHTML() {
    return `
        <div class="max-w-6xl mx-auto animate-fade-in p-2">
            <!-- 헤더 -->
            <div class="flex items-center justify-between mb-8">
                <div class="flex items-center gap-4">
                    <div class="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                        <span class="material-symbols-outlined text-white text-2xl">database</span>
                    </div>
                    <div>
                        <h1 class="text-3xl font-black text-slate-900 dark:text-white">RAG 데이터 관리</h1>
                        <p class="text-slate-500 text-sm mt-1">지식 베이스 문서 관리 및 검색 테스트</p>
                    </div>
                </div>
                <!-- 서버 상태 배지 -->
                <div id="serverStatusBadge" class="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-full">
                    <span class="w-2.5 h-2.5 rounded-full bg-slate-400"></span>
                    <span class="text-xs font-bold text-slate-500">서버 연결 확인 중...</span>
                </div>
            </div>

            <!-- 탭 네비게이션 -->
            <div class="flex gap-2 mb-8 border-b border-slate-200 dark:border-slate-800">
                <button class="rag-tab-btn active px-6 py-3 text-sm font-bold text-indigo-500 border-b-2 border-indigo-500 transition-colors" data-tab="dashboard">
                    대시보드
                </button>
                <button class="rag-tab-btn px-6 py-3 text-sm font-bold text-slate-500 hover:text-indigo-500 border-b-2 border-transparent hover:border-indigo-500/50 transition-colors" data-tab="documents">
                    문서 관리
                </button>
                <button class="rag-tab-btn px-6 py-3 text-sm font-bold text-slate-500 hover:text-indigo-500 border-b-2 border-transparent hover:border-indigo-500/50 transition-colors" data-tab="upload">
                    문서 업로드
                </button>
                <button class="rag-tab-btn px-6 py-3 text-sm font-bold text-slate-500 hover:text-indigo-500 border-b-2 border-transparent hover:border-indigo-500/50 transition-colors" data-tab="test">
                    검색 테스트
                </button>
                <button class="rag-tab-btn px-6 py-3 text-sm font-bold text-slate-500 hover:text-indigo-500 border-b-2 border-transparent hover:border-indigo-500/50 transition-colors" data-tab="api">
                    <span class="material-symbols-outlined text-lg align-bottom mr-1">webhook</span> API / 연동
                </button>
            </div>

            <!-- 탭 콘텐츠 -->
            <div id="ragTabContent" class="min-h-[400px]">
                <!-- 대시보드 탭 로딩 중... -->
                <div class="flex items-center justify-center h-64">
                    <div class="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
            </div>
        </div>
    `;
}

// 탭별 HTML 생성 함수들
// 탭별 HTML 생성 함수들
const RAGTabs = {
    dashboard: (stats) => `
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 animate-fade-in">
            <!-- 상태 카드들 -->
            <div class="bg-white dark:bg-surface-dark p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
                <div class="flex items-center gap-3 mb-2">
                    <span class="p-2 rounded-lg bg-green-100 text-green-600 material-symbols-outlined">check_circle</span>
                    <span class="text-sm font-bold text-slate-500">API 상태</span>
                </div>
                <div class="text-2xl font-black text-slate-900 dark:text-white">${stats.status || 'Unknown'}</div>
            </div>
            <div class="bg-white dark:bg-surface-dark p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
                <div class="flex items-center gap-3 mb-2">
                    <span class="p-2 rounded-lg bg-blue-100 text-blue-600 material-symbols-outlined">library_books</span>
                    <span class="text-sm font-bold text-slate-500">총 문서 수</span>
                </div>
                <div class="text-2xl font-black text-slate-900 dark:text-white">${stats.totalDocuments || 142}</div>
            </div>
            <div class="bg-white dark:bg-surface-dark p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
                <div class="flex items-center gap-3 mb-2">
                    <span class="p-2 rounded-lg bg-purple-100 text-purple-600 material-symbols-outlined">data_object</span>
                    <span class="text-sm font-bold text-slate-500">총 청크 수</span>
                </div>
                <div class="text-2xl font-black text-slate-900 dark:text-white">${stats.totalChunks || 3250}</div>
            </div>
            <div class="bg-white dark:bg-surface-dark p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
                <div class="flex items-center gap-3 mb-2">
                    <span class="p-2 rounded-lg bg-orange-100 text-orange-600 material-symbols-outlined">memory</span>
                    <span class="text-sm font-bold text-slate-500">벡터 DB</span>
                </div>
                <div class="text-xl font-bold text-slate-900 dark:text-white">PostgreSQL</div>
                <div class="text-xs text-slate-400">pgvector enabled</div>
            </div>
        </div>

        <!-- 시각화 차트 섹션 -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8 animate-fade-in delay-100">
            <!-- 카테고리 도넛 차트 -->
            <div class="bg-white dark:bg-surface-dark p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm col-span-1">
                <h3 class="font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                    <span class="material-symbols-outlined text-slate-400">pie_chart</span> 카테고리 분포
                </h3>
                <div class="flex items-center justify-center p-4">
                    <div class="relative w-48 h-48 rounded-full shadow-inner" style="background: conic-gradient(#4f46e5 0% 35%, #8b5cf6 35% 60%, #ec4899 60% 80%, #f43f5e 80% 95%, #cbd5e1 95% 100%);">
                        <div class="absolute inset-8 bg-white dark:bg-surface-dark rounded-full flex flex-col items-center justify-center z-10 shadow-sm">
                            <span class="text-3xl font-black text-slate-800 dark:text-white">${stats.totalDocuments || 142}</span>
                            <span class="text-xs text-slate-500 font-bold uppercase tracking-wider">Total Docs</span>
                        </div>
                    </div>
                </div>
                <div class="grid grid-cols-2 gap-3 mt-6 text-xs font-medium text-slate-600 dark:text-slate-400">
                    <div class="flex items-center gap-2"><span class="w-2.5 h-2.5 rounded-full bg-indigo-600 shadow-sm shadow-indigo-500/50"></span>부동산 정책 (35%)</div>
                    <div class="flex items-center gap-2"><span class="w-2.5 h-2.5 rounded-full bg-violet-500 shadow-sm shadow-violet-500/50"></span>시세 데이터 (25%)</div>
                    <div class="flex items-center gap-2"><span class="w-2.5 h-2.5 rounded-full bg-pink-500 shadow-sm shadow-pink-500/50"></span>법률/가이드 (20%)</div>
                    <div class="flex items-center gap-2"><span class="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-sm shadow-rose-500/50"></span>상담 매뉴얼 (15%)</div>
                </div>
            </div>

            <!-- 시스템 현황 막대 그래프 -->
            <div class="bg-white dark:bg-surface-dark p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm col-span-2">
                <h3 class="font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                    <span class="material-symbols-outlined text-slate-400">monitoring</span> 리소스 및 성능
                </h3>
                <div class="space-y-8">
                    <div>
                        <div class="flex justify-between text-sm mb-2">
                            <span class="font-bold text-slate-700 dark:text-slate-300">Vector Store Usage (PGVector)</span>
                            <span class="text-indigo-600 font-bold bg-indigo-50 dark:bg-indigo-900/20 px-2 py-0.5 rounded">64%</span>
                        </div>
                        <div class="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div class="h-full bg-indigo-600 rounded-full relative overflow-hidden group" style="width: 64%">
                                <div class="absolute inset-0 bg-white/20 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]"></div>
                            </div>
                        </div>
                        <p class="text-xs text-slate-400 mt-2 flex justify-between">
                            <span>Used: 6.4 GB</span>
                            <span>Total: 10 GB</span>
                        </p>
                    </div>

                    <div>
                        <div class="flex justify-between text-sm mb-2">
                            <span class="font-bold text-slate-700 dark:text-slate-300">Daily Token Limit (OpenAI API)</span>
                            <span class="text-green-500 font-bold bg-green-50 dark:bg-green-900/20 px-2 py-0.5 rounded">12%</span>
                        </div>
                        <div class="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div class="h-full bg-green-500 rounded-full" style="width: 12%"></div>
                        </div>
                        <p class="text-xs text-slate-400 mt-2 flex justify-between">
                            <span>Used: 15,234 tokens</span>
                            <span>Limit: 120,000 tokens</span>
                        </p>
                    </div>
                </div>
                
                <div class="grid grid-cols-2 gap-4 mt-8">
                     <div class="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700/50">
                         <div class="flex items-start gap-3">
                            <span class="material-symbols-outlined text-indigo-500 bg-indigo-100 dark:bg-indigo-900/30 p-2 rounded-lg">speed</span>
                            <div>
                                 <h4 class="text-sm font-bold text-slate-900 dark:text-white">평균 청크 처리</h4>
                                 <p class="text-lg font-black text-slate-800 dark:text-white mt-0.5">0.8s <span class="text-xs font-normal text-slate-400">/ doc</span></p>
                            </div>
                         </div>
                    </div>
                     <div class="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700/50">
                         <div class="flex items-start gap-3">
                            <span class="material-symbols-outlined text-green-500 bg-green-100 dark:bg-green-900/30 p-2 rounded-lg">task_alt</span>
                            <div>
                                 <h4 class="text-sm font-bold text-slate-900 dark:text-white">자동 분류 정확도</h4>
                                 <p class="text-lg font-black text-slate-800 dark:text-white mt-0.5">99.2%</p>
                            </div>
                         </div>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- 시스템 정보 -->
        <div class="bg-indigo-50 dark:bg-slate-800/50 rounded-2xl p-6 border border-indigo-100 dark:border-slate-700">
            <h3 class="font-bold text-slate-900 dark:text-white mb-4">🔗 연결 정보</h3>
            <div class="space-y-2 text-sm">
                <div class="flex justify-between p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                    <span class="text-slate-500">API 엔드포인트</span>
                    <span class="font-mono text-indigo-600 dark:text-indigo-400">${RAG_API.BASE_URL}</span>
                </div>
                <div class="flex justify-between p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                    <span class="text-slate-500">헬스체크 URL</span>
                    <span class="font-mono text-indigo-600 dark:text-indigo-400">${RAG_API.BASE_URL}${RAG_API.ENDPOINTS.HEALTH}</span>
                </div>
            </div>
        </div>
    `,

    documents: (docs) => `
        <div class="bg-white dark:bg-surface-dark rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden animate-fade-in relative">
            <div class="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
                <h3 class="font-bold text-slate-900 dark:text-white">문서 목록</h3>
                <button id="refreshDocsBtn" class="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors">
                    <span class="material-symbols-outlined">refresh</span>
                </button>
            </div>
            
            ${docs && docs.length > 0 ? `
                <table class="w-full text-left border-collapse">
                    <thead class="bg-slate-50 dark:bg-slate-800/50">
                        <tr>
                            <th class="p-4 text-xs font-bold text-slate-500 uppercase">파일명</th>
                            <th class="p-4 text-xs font-bold text-slate-500 uppercase">카테고리</th>
                            <th class="p-4 text-xs font-bold text-slate-500 uppercase">타입</th>
                            <th class="p-4 text-xs font-bold text-slate-500 uppercase">크기</th>
                            <th class="p-4 text-xs font-bold text-slate-500 uppercase">업로드 날짜</th>
                            <th class="p-4 text-xs font-bold text-slate-500 uppercase text-right">관리</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-100 dark:divide-slate-700">
                        ${docs.map(doc => `
                            <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                                <td class="p-4 font-medium text-slate-900 dark:text-white">
                                    <div class="flex items-center gap-3">
                                        <span class="material-symbols-outlined text-slate-400">description</span>
                                        ${doc.filename || doc.name || 'Untitled'}
                                    </div>
                                </td>
                                <td class="p-4">
                                    <span class="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-600">
                                        ${doc.category || 'General'}
                                    </span>
                                </td>
                                <td class="p-4 text-sm text-slate-500">${doc.content_type || 'text/plain'}</td>
                                <td class="p-4 text-sm text-slate-500">${doc.size ? (doc.size / 1024).toFixed(1) + ' KB' : '-'}</td>
                                <td class="p-4 text-sm text-slate-500">${new Date(doc.created_at || Date.now()).toLocaleDateString()}</td>
                                <td class="p-4 text-right">
                                    <div class="flex justify-end gap-2">
                                        <button class="view-chunks-btn p-1.5 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/20 text-slate-400 hover:text-indigo-500 transition-colors" data-id="${doc.id}" data-filename="${doc.filename}" title="청크 보기">
                                            <span class="material-symbols-outlined text-lg">segment</span>
                                        </button>
                                        <button class="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 p-1.5 rounded-lg transition-colors" onclick="alert('삭제 기능 준비 중')" title="삭제">
                                            <span class="material-symbols-outlined text-lg">delete</span>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            ` : `
                <div class="p-12 text-center">
                    <div class="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-4 text-slate-400">
                        <span class="material-symbols-outlined text-3xl">folder_off</span>
                    </div>
                    <h3 class="text-slate-900 dark:text-white font-bold mb-1">문서가 없습니다</h3>
                    <p class="text-slate-500 text-sm">새 문서를 업로드하여 지식 베이스를 구축해보세요.</p>
                </div>
            `}
        </div>

        <!-- 청크 뷰어 모달 -->
        <div id="chunkViewerModal" class="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm hidden animate-fade-in">
            <div class="w-full max-w-4xl h-[80vh] bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl flex flex-col mx-4 overflow-hidden">
                <div class="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
                    <div>
                        <h3 id="chunkViewerTitle" class="text-lg font-bold text-slate-900 dark:text-white">문서 청크 상세</h3>
                        <p class="text-xs text-slate-500 mt-0.5">문서가 분할되어 저장된 내용을 확인합니다.</p>
                    </div>
                    <button onclick="document.getElementById('chunkViewerModal').classList.add('hidden')" class="p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 transition-colors">
                        <span class="material-symbols-outlined">close</span>
                    </button>
                </div>
                <div id="chunkViewerContent" class="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/30 dark:bg-black/20">
                    <!-- 청크 내용이 여기에 로드됨 -->
                </div>
                <div class="p-4 border-t border-slate-100 dark:border-slate-700 bg-white dark:bg-surface-dark flex justify-between items-center text-xs text-slate-500">
                    <span>Embedding: OpenAI text-embedding-3-small</span>
                    <span>Total Chunks: <span id="chunkCount">0</span></span>
                </div>
            </div>
        </div>
    `,

    upload: () => `
        <div class="max-w-2xl mx-auto animate-fade-in">
            <div class="bg-white dark:bg-surface-dark rounded-2xl border border-slate-200 dark:border-slate-700 p-8 text-center">
                
                <!-- 카테고리 선택 영역 -->
                <div class="mb-6 text-left">
                    <div class="flex justify-between items-center mb-2">
                        <label class="block text-sm font-bold text-slate-700 dark:text-slate-300">문서 카테고리</label>
                        <div class="flex items-center gap-2">
                            <label class="relative inline-flex items-center cursor-pointer group">
                                <input type="checkbox" id="autoClassifyToggle" class="peer sr-only" checked>
                                <div class="w-9 h-5 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                                <span class="ml-2 text-xs font-bold text-slate-500 peer-checked:text-indigo-600 transition-colors">AI 자동 분류</span>
                            </label>
                        </div>
                    </div>

                    <div class="relative transition-all duration-300 opacity-50 grayscale pointer-events-none" id="categorySelectWrapper">
                        <select id="uploadCategory" class="w-full appearance-none bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm rounded-xl px-4 py-3 pr-10 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all cursor-pointer" disabled>
                            <option value="general">일반 문서 (General)</option>
                            <option value="policy">부동산 정책 (Policy)</option>
                            <option value="market">시세/매물 데이터 (Market Data)</option>
                            <option value="law">법률/세금 가이드 (Law & Tax)</option>
                            <option value="manual">상담 매뉴얼 (Manual)</option>
                        </select>
                        <div class="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-slate-500">
                            <span class="material-symbols-outlined">expand_more</span>
                        </div>
                    </div>
                    <p class="text-xs text-slate-400 mt-1.5 ml-1 transition-colors" id="categoryHelpText">
                        <span class="material-symbols-outlined text-[10px] align-middle mr-0.5">smart_toy</span>
                        AI가 문서 내용을 분석하여 자동으로 카테고리를 지정합니다.
                    </p>
                </div>

                <div id="dropZone" class="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-2xl p-12 transition-colors hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/10 cursor-pointer">
                    <input type="file" id="fileInput" class="hidden" multiple accept=".txt,.pdf,.md,.csv">
                    <div class="w-20 h-20 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto mb-6">
                        <span class="material-symbols-outlined text-4xl">cloud_upload</span>
                    </div>
                    <h3 class="text-xl font-bold text-slate-900 dark:text-white mb-2">파일을 여기에 드래그하세요</h3>
                    <p class="text-slate-500 mb-6">또는 클릭하여 파일 선택 (PDF, TXT, MD)</p>
                    <button id="selectFileBtn" class="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-indigo-500/25">
                        파일 탐색기 열기
                    </button>
                </div>
                
                <!-- 업로드 목록 -->
                <div id="uploadList" class="mt-8 space-y-3 hidden">
                    <h4 class="text-left text-sm font-bold text-slate-500 mb-3">업로드 대기 중인 파일</h4>
                </div>

                <button id="startUploadBtn" class="w-full mt-8 py-4 bg-slate-200 text-slate-400 rounded-xl font-bold cursor-not-allowed transition-all" disabled>
                    업로드 시작
                </button>
            </div>
            
            <div class="mt-6 p-4 bg-orange-50 dark:bg-orange-900/10 border border-orange-100 dark:border-orange-800/30 rounded-xl flex gap-3">
                <span class="material-symbols-outlined text-orange-500 shrink-0">warning</span>
                <p class="text-sm text-orange-800 dark:text-orange-200">
                    <strong>주의:</strong> 파일 업로드 시 자동으로 벡터 임베딩이 진행되며, 파일 크기에 따라 시간이 소요될 수 있습니다.
                </p>
            </div>
        </div>
    `,

    test: () => `
        <div class="max-w-3xl mx-auto animate-fade-in">
            <!-- 검색 바 -->
            <div class="bg-white dark:bg-surface-dark rounded-2xl border border-slate-200 dark:border-slate-700 p-2 shadow-lg mb-8">
                <div class="flex items-center">
                    <div class="pl-4">
                        <span class="material-symbols-outlined text-slate-400">search</span>
                    </div>
                    <input type="text" id="ragSearchInput" class="w-full p-4 bg-transparent border-none focus:ring-0 text-slate-900 dark:text-white placeholder-slate-400" placeholder="지식 베이스에서 검색할 내용을 입력하세요...">
                    <button id="ragSearchBtn" class="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-colors m-1">
                        검색
                    </button>
                </div>
            </div>

            <!-- 결과 영역 -->
            <div id="ragSearchResults" class="space-y-4">
                <div class="text-center text-slate-400 py-12">
                    <span class="material-symbols-outlined text-4xl mb-2">manage_search</span>
                    <p>검색어를 입력하여 RAG 성능을 테스트해보세요.</p>
                </div>
            </div>
        </div>
    `,

    api: () => `
        <div class="max-w-4xl mx-auto animate-fade-in space-y-6">
            <!-- n8n 연동 가이드 -->
            <div class="bg-white dark:bg-surface-dark p-8 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
                <div class="flex items-center gap-4 mb-6">
                    <div class="w-12 h-12 rounded-xl bg-[#ff6d5a]/10 flex items-center justify-center">
                        <span class="material-symbols-outlined text-[#ff6d5a] text-2xl">all_inclusive</span> <!-- n8n 비슷 -->
                    </div>
                    <div>
                        <h3 class="text-xl font-bold text-slate-900 dark:text-white">n8n / Zapier 워크플로우 연동</h3>
                        <p class="text-sm text-slate-500">외부 툴에서 생성된 문서를 자동으로 RAG 지식 베이스에 업로드합니다.</p>
                    </div>
                </div>

                <div class="space-y-6">
                    <div>
                        <label class="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Webhook URL (Upload Endpoint)</label>
                        <div class="flex gap-2">
                             <code class="flex-1 p-4 bg-slate-800 text-green-400 font-mono text-sm rounded-xl overflow-x-auto">POST https://api.hyehwa72.org/v1/webhook/rag/upload</code>
                             <button class="px-4 bg-slate-100 dark:bg-slate-800 text-slate-600 hover:text-indigo-600 rounded-xl font-bold transition-colors" onclick="navigator.clipboard.writeText('https://api.hyehwa72.org/v1/webhook/rag/upload'); alert('복사되었습니다.');">
                                 <span class="material-symbols-outlined">content_copy</span>
                             </button>
                        </div>
                    </div>

                    <div>
                         <label class="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Request Body Example (JSON)</label>
                         <pre class="p-4 bg-slate-900 text-slate-300 font-mono text-xs rounded-xl overflow-x-auto leading-relaxed">
{
  "file_url": "https://example.com/report.pdf",
  "category": "policy",  // optional (auto-detected if omitted)
  "auto_chunk": true,
  "metadata": {
    "source": "n8n_automation",
    "author": "AI_Agent_01"
  }
}</pre>
                    </div>
                </div>
            </div>

            <!-- API Key 관리 -->
             <div class="bg-white dark:bg-surface-dark p-8 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
                <h3 class="font-bold text-slate-900 dark:text-white mb-4">API Access Keys</h3>
                <div class="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 mb-4">
                     <div class="flex items-center gap-3">
                         <span class="material-symbols-outlined text-slate-400">key</span>
                         <span class="font-mono text-slate-600 dark:text-slate-300">sk-rag-**********************8a9f</span>
                     </div>
                     <div class="flex items-center gap-2">
                         <span class="px-2 py-1 rounded-md bg-green-100 text-green-700 text-xs font-bold">Active</span>
                         <button class="text-slate-400 hover:text-red-500"><span class="material-symbols-outlined">delete</span></button>
                     </div>
                </div>
                <button class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-bold transition-colors flex items-center gap-2">
                    <span class="material-symbols-outlined text-sm">add</span> Create New API Key
                </button>
             </div>
        </div>
    `
};

let ragState = {
    selectedFiles: []
};

function setupRAGManagementListeners() {
    // 탭 전환 리스너
    document.querySelectorAll('.rag-tab-btn').forEach(btn => {
        btn.addEventListener('click', () => switchRAGTab(btn.dataset.tab));
    });

    // 초기 로드 시 대시보드 탭 활성화 및 데이터 로드
    checkServerStatus().then(isOnline => {
        if (isOnline) {
            loadRAGDashboard();
        } else {
            // 오프라인 상태 UI 표시 (데모용)
            /*
            document.getElementById('ragTabContent').innerHTML = `
                <div class="text-center py-20 animate-fade-in">
                    <div class="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/20 text-red-500 flex items-center justify-center mx-auto mb-4">
                        <span class="material-symbols-outlined text-3xl">wifi_off</span>
                    </div>
                    <h3 class="text-xl font-bold text-slate-900 dark:text-white mb-2">서버에 연결할 수 없습니다</h3>
                    <p class="text-slate-500 mb-6">RAG API 서버(${RAG_API.BASE_URL})가 응답하지 않습니다.</p>
                    <button onclick="setupRAGManagementListeners()" class="px-6 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-lg font-bold hover:opacity-90 transition-opacity">
                        재시도
                    </button>
                </div>
            `;
            */
            // 일단 데모 모드로 진행
            loadRAGDashboard();
        }
    });
}

async function checkServerStatus() {
    const badge = document.getElementById('serverStatusBadge');
    if (!badge) return false;

    try {
        const response = await fetch(`${RAG_API.BASE_URL}${RAG_API.ENDPOINTS.HEALTH}`, {
            method: 'GET',
            mode: 'cors'
        });

        if (response.ok) {
            badge.className = 'flex items-center gap-2 px-4 py-2 bg-green-100 dark:bg-green-900/30 rounded-full';
            badge.innerHTML = `
                <span class="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse"></span>
                <span class="text-xs font-bold text-green-700 dark:text-green-400">서버 온라인</span>
            `;
            return true;
        } else {
            throw new Error('Server returned ' + response.status);
        }
    } catch (error) {
        console.warn('Server check failed, running in manual/demo mode:', error);
        badge.className = 'flex items-center gap-2 px-4 py-2 bg-red-100 dark:bg-red-900/30 rounded-full';
        badge.innerHTML = `
            <span class="w-2.5 h-2.5 rounded-full bg-red-500"></span>
            <span class="text-xs font-bold text-red-700 dark:text-red-400">서버 오프라인 (데모)</span>
        `;
        return false;
    }
}

function switchRAGTab(tabName) {
    // 탭 스타일 업데이트
    document.querySelectorAll('.rag-tab-btn').forEach(btn => {
        if (btn.dataset.tab === tabName) {
            btn.classList.add('active', 'text-indigo-500', 'border-indigo-500');
            btn.classList.remove('text-slate-500', 'border-transparent');
        } else {
            btn.classList.remove('active', 'text-indigo-500', 'border-indigo-500');
            btn.classList.add('text-slate-500', 'border-transparent');
        }
    });

    const contentDiv = document.getElementById('ragTabContent');
    contentDiv.innerHTML = '<div class="flex justify-center p-12"><div class="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div></div>';

    // 탭별 로직 실행
    switch (tabName) {
        case 'dashboard':
            loadRAGDashboard();
            break;
        case 'documents':
            loadDocumentsList();
            break;
        case 'upload':
            renderUploadUI();
            break;
        case 'test':
            contentDiv.innerHTML = RAGTabs.test();
            setupSearchListeners();
            break;
        case 'api':
            contentDiv.innerHTML = RAGTabs.api();
            break;
    }
}

async function loadRAGDashboard() {
    try {
        // 실제 API 연동 시 주석 해제하여 사용
        /*
        const response = await fetch(`${RAG_API.BASE_URL}${RAG_API.ENDPOINTS.STATS}`);
        const stats = await response.json();
        */

        // Mock Data for Demo
        const stats = {
            status: 'Healthy',
            totalDocuments: 12,
            totalChunks: 3450,
            dbType: 'PostgreSQL'
        };

        document.getElementById('ragTabContent').innerHTML = RAGTabs.dashboard(stats);
    } catch (e) {
        console.error(e);
        document.getElementById('ragTabContent').innerHTML = '<div class="text-red-500 p-8 text-center">데이터를 불러오는데 실패했습니다.</div>';
    }
}

async function loadDocumentsList() {
    try {
        // Mock Data
        /*
        const response = await fetch(`${RAG_API.BASE_URL}${RAG_API.ENDPOINTS.DOCUMENTS}`);
        const docs = await response.json();
        */

        // 임시 데이터
        const docs = [
            { id: 1, filename: '2024_부동산_정책_요약.pdf', category: 'policy', content_type: 'application/pdf', size: 1024000, created_at: '2025-12-20' },
            { id: 2, filename: '서울시_아파트_시세_데이터.csv', category: 'market', content_type: 'text/csv', size: 512000, created_at: '2025-12-22' },
            { id: 3, filename: '중개실무_가이드라인_v2.txt', category: 'manual', content_type: 'text/plain', size: 24000, created_at: '2025-12-24' }
        ];

        document.getElementById('ragTabContent').innerHTML = RAGTabs.documents(docs);

        document.getElementById('refreshDocsBtn')?.addEventListener('click', loadDocumentsList);

        // 청크 보기 버튼 리스너
        document.querySelectorAll('.view-chunks-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                showChunkViewer(btn.dataset.filename, btn.dataset.id);
            });
        });
    } catch (e) {
        document.getElementById('ragTabContent').innerHTML = '<div class="text-red-500 p-8 text-center">문서 목록을 불러오는데 실패했습니다.</div>';
    }
}

function renderUploadUI() {
    document.getElementById('ragTabContent').innerHTML = RAGTabs.upload();

    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('fileInput');
    const selectBtn = document.getElementById('selectFileBtn');

    // AI 자동분류 토글 로직
    const toggle = document.getElementById('autoClassifyToggle');
    const selectWrapper = document.getElementById('categorySelectWrapper');
    const select = document.getElementById('uploadCategory');
    const helpText = document.getElementById('categoryHelpText');

    toggle?.addEventListener('change', (e) => {
        if (e.target.checked) {
            selectWrapper.classList.add('opacity-50', 'grayscale', 'pointer-events-none');
            select.disabled = true;
            helpText.innerHTML = '<span class="material-symbols-outlined text-[10px] align-middle mr-0.5">smart_toy</span> AI가 문서 내용을 분석하여 자동으로 카테고리를 지정합니다.';
            helpText.className = 'text-xs text-indigo-500 mt-1.5 ml-1 transition-colors font-medium';
        } else {
            selectWrapper.classList.remove('opacity-50', 'grayscale', 'pointer-events-none');
            select.disabled = false;
            helpText.textContent = '※ 문서를 가장 잘 설명하는 카테고리를 직접 선택해주세요.';
            helpText.className = 'text-xs text-slate-400 mt-1.5 ml-1 transition-colors';
        }
    });

    // 드래그 앤 드롭
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('border-indigo-500', 'bg-indigo-50', 'dark:bg-indigo-900/10');
    });

    dropZone.addEventListener('dragleave', (e) => {
        e.preventDefault();
        dropZone.classList.remove('border-indigo-500', 'bg-indigo-50', 'dark:bg-indigo-900/10');
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('border-indigo-500', 'bg-indigo-50', 'dark:bg-indigo-900/10');
        handleFiles(e.dataTransfer.files);
    });

    dropZone.addEventListener('click', () => fileInput.click());
    selectBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        fileInput.click();
    });

    fileInput.addEventListener('change', (e) => handleFiles(e.target.files));
}

function handleFiles(files) {
    const listContainer = document.getElementById('uploadList');
    const uploadBtn = document.getElementById('startUploadBtn');

    ragState.selectedFiles = Array.from(files);

    if (ragState.selectedFiles.length > 0) {
        listContainer.classList.remove('hidden');
        uploadBtn.disabled = false;
        uploadBtn.classList.remove('bg-slate-200', 'text-slate-400', 'cursor-not-allowed');
        uploadBtn.classList.add('bg-indigo-600', 'hover:bg-indigo-700', 'text-white', 'shadow-lg');

        listContainer.innerHTML = `
            <h4 class="text-left text-sm font-bold text-slate-500 mb-3">업로드 대기 중인 파일 (${ragState.selectedFiles.length})</h4>
            ${ragState.selectedFiles.map(file => `
                <div class="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                    <div class="flex items-center gap-3">
                        <span class="material-symbols-outlined text-indigo-500">description</span>
                        <div class="text-left">
                            <div class="text-sm font-bold text-slate-900 dark:text-white">${file.name}</div>
                            <div class="text-xs text-slate-500">${(file.size / 1024).toFixed(1)} KB</div>
                        </div>
                    </div>
                    <button class="text-slate-400 hover:text-red-500 transition-colors">
                        <span class="material-symbols-outlined">close</span>
                    </button>
                </div>
            `).join('')}
        `;

        uploadBtn.onclick = uploadFiles;
    }
}

// (Duplicate uploadFiles function removed)

function setupSearchListeners() {
    const input = document.getElementById('ragSearchInput');
    const btn = document.getElementById('ragSearchBtn');

    btn.addEventListener('click', performSearch);
    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') performSearch();
    });
}

function performSearch() {
    const query = document.getElementById('ragSearchInput').value;
    if (!query.trim()) return;

    const resultsDiv = document.getElementById('ragSearchResults');
    resultsDiv.innerHTML = `
        <div class="text-center py-8">
            <div class="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p class="text-slate-500">지식 베이스 검색 및 답변 생성 중...</p>
        </div>
    `;

    // 데모용 결과 시뮬레이션
    setTimeout(() => {
        resultsDiv.innerHTML = `
             <div class="bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-800 rounded-2xl p-6">
                <div class="flex items-center gap-2 mb-4">
                    <span class="material-symbols-outlined text-indigo-600">psychology</span>
                    <h3 class="font-bold text-indigo-900 dark:text-indigo-100">AI 답변</h3>
                </div>
                <p class="text-slate-700 dark:text-slate-300 leading-relaxed">
                    검색하신 <strong>"${query}"</strong>에 대한 답변입니다.<br><br>
                    RAG 데이터베이스에서 관련된 문서를 찾아 답변을 생성합니다. 현재는 UI 테스트 모드이며, 실제 백엔드 연동 시 여기에 실시간 결과가 표시됩니다.
                </p>
            </div>
            
            <h4 class="font-bold text-slate-500 text-sm mt-6 mb-3 uppercase">참고 문서 (References)</h4>
            <div class="space-y-3">
                <div class="bg-white dark:bg-surface-dark p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-indigo-300 transition-colors cursor-pointer">
                    <div class="flex justify-between items-start mb-2">
                        <span class="text-sm font-bold text-indigo-600">2024_부동산_정책_요약.pdf</span>
                        <span class="text-xs text-slate-400">유사도: 0.89</span>
                    </div>
                    <p class="text-xs text-slate-500 line-clamp-2">...관련된 정책 내용이 여기에 표시됩니다. 문서의 실제 내용을 발췌하여 보여주는 영역입니다...</p>
                </div>
            </div>
        `;
    }, 1500);
}

function showChunkViewer(filename, docId) {
    const modal = document.getElementById('chunkViewerModal');
    const title = document.getElementById('chunkViewerTitle');
    const content = document.getElementById('chunkViewerContent');
    const countSpan = document.getElementById('chunkCount');

    if (!modal) return;

    title.textContent = `문서 청크: ${filename}`;
    modal.classList.remove('hidden');
    content.innerHTML = '<div class="flex justify-center p-12"><div class="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div></div>';

    // 모의 청크 데이터 로드
    setTimeout(() => {
        const mockChunks = Array.from({ length: 5 }, (_, i) => ({
            id: i + 1,
            content: `[Chunk ${i + 1}] 이것은 "${filename}" 문서에서 추출된 ${i + 1}번째 텍스트 조각입니다. RAG 시스템은 문서를 이러한 작은 단위로 쪼개어(Chunking) 벡터 데이터베이스에 저장합니다. 검색 시 이 조각들과의 유사도를 비교하여 가장 관련성 높은 내용을 가져옵니다. 실제 데이터가 연동되면 여기에 원본 텍스트가 표시됩니다. \n\n(Vector Dimensions: 1536, Embedding Model: text-embedding-3-small)`,
            token_count: 150 + Math.floor(Math.random() * 50)
        }));

        countSpan.textContent = mockChunks.length;

        content.innerHTML = mockChunks.map(chunk => `
            <div class="bg-white dark:bg-surface-dark p-5 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors">
                <div class="flex justify-between items-center mb-3">
                    <span class="text-xs font-bold text-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 px-2 py-1 rounded">Chunk #${chunk.id}</span>
                    <div class="flex items-center gap-3">
                        <span class="text-xs text-slate-400 font-mono">tokens: ${chunk.token_count}</span>
                        <button class="text-slate-400 hover:text-indigo-500 transition-colors" title="Copy Text" onclick="navigator.clipboard.writeText(this.parentElement.parentElement.nextElementSibling.textContent); alert('복사되었습니다.');">
                            <span class="material-symbols-outlined text-sm">content_copy</span>
                        </button>
                    </div>
                </div>
                <p class="text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-mono whitespace-pre-wrap">${chunk.content}</p>
            </div>
        `).join('');
    }, 500);
}

/* Override uploadFiles to support Auto Classification Mock */
async function uploadFiles() {
    const btn = document.getElementById('startUploadBtn');
    const categorySelect = document.getElementById('uploadCategory');
    const autoClassify = document.getElementById('autoClassifyToggle')?.checked;
    let category = categorySelect ? categorySelect.value : 'general';
    const originalText = btn.innerHTML;

    btn.disabled = true;

    // AI 자동분류 시뮬레이션
    if (autoClassify && ragState.selectedFiles.length > 0) {
        btn.innerHTML = '<span class="material-symbols-outlined animate-spin mr-2">smart_toy</span> AI가 문서 내용을 분석 중...';

        // 시각적 효과를 위한 지연
        await new Promise(resolve => setTimeout(resolve, 1500));

        // 간단한 Mock 로직: 파일명 기반 추론
        const filename = ragState.selectedFiles[0].name.toLowerCase();
        let detected = false;

        if (filename.includes('정책') || filename.includes('policy')) { category = 'policy'; detected = true; }
        else if (filename.includes('시세') || filename.includes('가격') || filename.includes('price')) { category = 'market'; detected = true; }
        else if (filename.includes('법') || filename.includes('세금') || filename.includes('tax')) { category = 'law'; detected = true; }
        else if (filename.includes('가이드') || filename.includes('매뉴얼') || filename.includes('manual')) { category = 'manual'; detected = true; }

        const categoryNames = {
            'general': '일반 문서', 'policy': '부동산 정책', 'market': '시세/매물 데이터',
            'law': '법률/세금 가이드', 'manual': '상담 매뉴얼'
        };

        if (detected) {
            alert(`[AI 자동 분류 완료]\n\n문서 내용이 <${categoryNames[category]}> 카테고리와 가장 유사합니다.\n해당 카테고리로 자동 설정되었습니다.`);
        }
    }

    btn.innerHTML = '<span class="material-symbols-outlined animate-spin mr-2">progress_activity</span> 업로드 및 처리 중...';
    console.log(`Uploading files to category: ${category}`);

    // 실제 업로드 로직 (FormData 사용) - Mock
    try {
        /*
        const formData = new FormData();
        ragState.selectedFiles.forEach(file => formData.append('files', file));
        formData.append('category', category);
        
        await fetch(`${RAG_API.BASE_URL}${RAG_API.ENDPOINTS.DOCUMENTS}`, {
            method: 'POST',
            body: formData
        });
        */

        await new Promise(resolve => setTimeout(resolve, 2000));

        alert('업로드가 완료되었습니다!');
        ragState.selectedFiles = [];
        switchRAGTab('documents'); // 문서 목록으로 이동
    } catch (e) {
        alert('업로드 실패: ' + e.message);
        btn.disabled = false;
        btn.innerHTML = originalText;
    }
}
