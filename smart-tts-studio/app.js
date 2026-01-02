/**
 * Smart TTS Studio - App JavaScript v2.0
 * AI-powered TTS generation with script analysis
 * Features: API settings, segment splitting, multilingual prompts
 */

// ============================================
// TTS Service Data (Real Models & Voices)
// ============================================
const TTS_SERVICES = {
    google: {
        name: 'Google AI Studio',
        models: [
            { id: 'gemini-2.5-flash-preview-tts', name: 'Gemini 2.5 Flash TTS (권장)', description: '최신 TTS 모델, 저렴하고 빠름, $0.50/1M입력' },
            { id: 'gemini-2.5-pro-preview-tts', name: 'Gemini 2.5 Pro TTS (고품질)', description: '고품질 TTS, 자연스러운 음성, $1.00/1M입력' }
        ],
        voices: [
            { id: 'Kore', name: 'Kore', gender: 'female', description: '단단하고 확신있는 톤, 비즈니스/전문 추천', language: 'multi' },
            { id: 'Charon', name: 'Charon', gender: 'male', description: '차분하고 정보전달적인 톤, 다큐/강의용', language: 'multi' },
            { id: 'Aoede', name: 'Aoede', gender: 'female', description: '밝고 명랑한 톤, 유튜브/광고용 추천', language: 'multi' },
            { id: 'Fenrir', name: 'Fenrir', gender: 'male', description: '활기차고 열정적인 톤, 엔터테인먼트용', language: 'multi' },
            { id: 'Puck', name: 'Puck', gender: 'male', description: '업비트하고 발랄한 톤, 젊은 층 타겟', language: 'multi' },
            { id: 'Zephyr', name: 'Zephyr', gender: 'neutral', description: '부드럽고 중성적인 톤, 다목적', language: 'multi' }
        ]
    },
    elevenlabs: {
        name: 'ElevenLabs',
        models: [
            { id: 'eleven_multilingual_v2', name: 'Multilingual v2 (권장)', description: '한국어 포함 29개 언어, 최고 품질' },
            { id: 'eleven_turbo_v2_5', name: 'Flash v2.5', description: '초저지연(75ms), 실시간 스트리밍용' },
            { id: 'eleven_monolingual_v1', name: 'English v1', description: '영어 특화, 빠른 처리' }
        ],
        voices: [
            // Korean-optimized voices
            { id: 'jBpfuIE2acCO8z3wKNLl', name: '덕수 (Deoksu)', gender: 'male', description: '밝고 선명한 중년 남성, 부동산/비즈니스 추천', language: 'ko' },
            { id: 'ThT5KcBeYPX3keUQqHPh', name: '유나 (Yuna)', gender: 'female', description: '젊고 상냥한 여성, 유튜브 나레이션 추천', language: 'ko' },
            { id: 'VR6AewLTigWG4xSOukaG', name: '민준 (Min-joon)', gender: 'male', description: '젊은 남성, 캐주얼한 대화체', language: 'ko' },
            { id: 'N2lVS1w4EtoT3dr4eOWO', name: '제니 (Jennie)', gender: 'female', description: '밝고 친근한 여성, 광고/홍보용', language: 'ko' },
            { id: 'pNInz6obpgDQGcFmaJgB', name: '남춘 할아버지', gender: 'male', description: '따뜻하고 자상한 노신사, 스토리텔링', language: 'ko' },
            { id: 'onwK4e9ZLuTAKqWW03F9', name: '도현 (Do Hyeon)', gender: 'male', description: '차분하고 신뢰감 있는 톤, 교육/강의', language: 'ko' },
            { id: 'EXAVITQu4vr4xnSDxMaL', name: '민호 (Min-ho)', gender: 'male', description: '활기차고 젊은 남성, 엔터테인먼트', language: 'ko' },
            { id: 'MF3mGyEYCl7XYWbV9V6O', name: '서연 (Seoyeon)', gender: 'female', description: '서울 사투리, 차분한 30대 여성', language: 'ko' },
            { id: 'TxGEqnHWrfWFTfGW9XjX', name: '재성 (Jae-seong)', gender: 'male', description: '외교적이고 차분한 톤, 공식 발표용', language: 'ko' },
            { id: 'XB0fDUnXU5powFXDhCwa', name: '현 (Hyuk)', gender: 'male', description: '깊고 매력적인 남성, 팟캐스트/라디오', language: 'ko' }
        ]
    },
    openai: {
        name: 'OpenAI TTS',
        models: [
            { id: 'tts-1-hd', name: 'TTS-1 HD (고품질)', description: '고품질 음성, 기본 권장' },
            { id: 'tts-1', name: 'TTS-1 (표준)', description: '빠른 처리, 저지연' }
        ],
        voices: [
            { id: 'alloy', name: 'Alloy', gender: 'neutral', description: '다재다능하고 균형잡힌 톤, 다양한 용도', language: 'multi' },
            { id: 'echo', name: 'Echo', gender: 'male', description: '젊고 에너제틱한 톤, 유튜브/숏폼 추천', language: 'multi' },
            { id: 'fable', name: 'Fable', gender: 'neutral', description: '차분하고 안정적인 톤, 스토리텔링 최적화', language: 'multi' },
            { id: 'onyx', name: 'Onyx', gender: 'male', description: '자신감 있고 권위있는 톤, 비즈니스/프레젠테이션', language: 'multi' },
            { id: 'nova', name: 'Nova', gender: 'female', description: '밝고 친근한 여성 톤, 비영어권에서 우수 성능', language: 'multi' },
            { id: 'shimmer', name: 'Shimmer', gender: 'female', description: '우아하고 세련된 톤, 고급 브랜드용', language: 'multi' }
        ]
    }
};

// ============================================
// Emotion Data with Descriptions
// ============================================
const EMOTIONS = {
    normal: { emoji: '😐', name: '일반', desc: '중립적인 기본 감정', promptEn: 'neutral and balanced', promptKo: '중립적이고 균형잡힌' },
    happy: { emoji: '😊', name: '기쁨', desc: '밝고 즐거운 톤', promptEn: 'happy and joyful', promptKo: '기쁘고 즐거운' },
    sad: { emoji: '😢', name: '슬픔', desc: '차분하고 우울한 톤', promptEn: 'sad and melancholic', promptKo: '슬프고 우울한' },
    angry: { emoji: '😠', name: '분노', desc: '강하고 격앙된 톤', promptEn: 'angry and intense', promptKo: '화나고 강렬한' },
    excited: { emoji: '🤩', name: '흥분', desc: '열정적이고 고조된 톤', promptEn: 'excited and enthusiastic', promptKo: '흥분되고 열정적인' },
    calm: { emoji: '😌', name: '차분', desc: '평온하고 안정적인 톤', promptEn: 'calm and soothing', promptKo: '차분하고 평온한' },
    confident: { emoji: '😎', name: '자신감', desc: '당당하고 확신있는 톤', promptEn: 'confident and assertive', promptKo: '자신감 있고 당당한' },
    caring: { emoji: '🤗', name: '배려', desc: '따뜻하고 공감하는 톤', promptEn: 'caring and empathetic', promptKo: '따뜻하고 공감하는' },
    serious: { emoji: '🧐', name: '진지', desc: '엄숙하고 무거운 톤', promptEn: 'serious and formal', promptKo: '진지하고 격식있는' },
    playful: { emoji: '😜', name: '장난', desc: '재미있고 유쾌한 톤', promptEn: 'playful and fun', promptKo: '장난스럽고 재미있는' },
    inspiring: { emoji: '✨', name: '영감', desc: '동기부여 고취하는 톤', promptEn: 'inspiring and motivational', promptKo: '영감을 주고 동기부여하는' },
    whisper: { emoji: '🤫', name: '속삭임', desc: '조용하고 은밀한 톤', promptEn: 'whispering and intimate', promptKo: '속삭이듯 은밀한' }
};

// ============================================
// Style Presets with Prompts
// ============================================
const STYLE_PRESETS = {
    normal: { name: '일반', promptEn: 'neutral tone', promptKo: '중립적인 톤' },
    narration: { name: '내레이션', promptEn: 'documentary narration style, clear and informative', promptKo: '다큐멘터리 내레이션 스타일, 명확하고 정보전달적인' },
    professional: { name: '전문가', promptEn: 'professional business presentation style, confident and authoritative', promptKo: '전문적인 비즈니스 발표 스타일, 자신감 있고 권위있는' },
    news_anchor: { name: '뉴스 앵커', promptEn: 'news anchor style, clear articulation and steady pace', promptKo: '뉴스 앵커 스타일, 명확한 발음과 안정적인 속도' },
    medical: { name: '의료/과학', promptEn: 'medical professional style, trustworthy and reassuring', promptKo: '의료 전문가 스타일, 신뢰감 있고 안심시키는' },
    warm_friendly: { name: '다정함', promptEn: 'warm and friendly tone, like talking to a close friend', promptKo: '따뜻하고 친근한 톤, 친한 친구에게 말하듯이' },
    conversational: { name: '대화체', promptEn: 'casual conversational style, natural and relaxed', promptKo: '편안한 대화체 스타일, 자연스럽고 편안한' },
    caring: { name: '케어링', promptEn: 'caring and empathetic tone, understanding and supportive', promptKo: '배려하고 공감하는 톤, 이해하고 지지하는' },
    energetic: { name: '활기찬', promptEn: 'energetic and upbeat tone, vibrant and lively', promptKo: '활기차고 밝은 톤, 생동감 있고 활발한' },
    promotional: { name: '홍보/광고', promptEn: 'promotional style, persuasive and engaging', promptKo: '홍보 스타일, 설득력 있고 주목을 끄는' },
    cheerful: { name: '응원', promptEn: 'cheerful and encouraging tone, motivating and positive', promptKo: '응원하고 격려하는 톤, 동기부여하고 긍정적인' },
    storyteller: { name: '이야기꾼', promptEn: 'storytelling style, engaging and immersive', promptKo: '스토리텔링 스타일, 몰입감 있고 매력적인' },
    dramatic: { name: '드라마틱', promptEn: 'dramatic style with emotional emphasis', promptKo: '감정을 강조하는 드라마틱 스타일' },
    mysterious: { name: '미스터리', promptEn: 'mysterious and intriguing tone, building suspense', promptKo: '미스터리하고 흥미로운 톤, 서스펜스를 조성하는' }
};

// ============================================
// Configuration
// ============================================
let CONFIG = {
    ragServerUrl: 'http://localhost:8001',
    ttsServerUrl: 'http://localhost:8005',  // TTS 서버 연결
    maxScriptLength: 10000,
    maxSegmentLength: 3000,
    segmentMethod: 'semantic',
    defaultLanguage: 'ko',
    autoSave: true
};

// ============================================
// TTS API Mapping Functions (for m08_tts server)
// ============================================
function mapStyleToTTSStyle(stylePreset) {
    const styleMap = {
        'normal': 'narrator',
        'narration': 'narrator',
        'professional': 'calm',
        'news_anchor': 'news',
        'medical': 'calm',
        'warm_friendly': 'friendly',
        'conversational': 'friendly',
        'caring': 'friendly',
        'energetic': 'energetic',
        'promotional': 'energetic',
        'cheerful': 'energetic',
        'storyteller': 'dramatic',
        'dramatic': 'dramatic',
        'mysterious': 'dramatic'
    };
    return styleMap[stylePreset] || 'narrator';
}

function mapEmotionToTTSEmotion(emotion) {
    const emotionMap = {
        'normal': 'neutral',
        'happy': 'happy',
        'sad': 'sad',
        'angry': 'angry',
        'excited': 'excited',
        'calm': 'neutral',
        'confident': 'serious',
        'caring': 'warm',
        'serious': 'serious',
        'playful': 'happy',
        'inspiring': 'excited',
        'whisper': 'neutral'
    };
    return emotionMap[emotion] || 'neutral';
}

function mapSpeedToRate(speed) {
    if (speed <= 70) return 'slow';
    if (speed <= 90) return 'normal';
    if (speed <= 110) return 'normal';
    if (speed <= 130) return 'fast';
    return 'very_fast';
}

// ============================================
// State Management
// ============================================
const state = {
    script: '',
    segments: [],
    selectedService: 'google',
    selectedModel: '',
    selectedVoice: '',
    isAnalyzing: false,
    analysisResult: null,
    recommendations: [],
    selectedRecommendation: null,
    generatedPromptEn: '',
    generatedPromptKo: '',
    customMixEnabled: false,
    customSettings: {
        stylePreset: 'normal',
        professionalism: 50,
        friendliness: 50,
        persuasiveness: 50,
        emotion: 'normal',
        emotionIntensity: 50,
        speed: 100,
        pauseStrength: 'medium',
        endingTone: 'level',
        pitch: 0,
        stability: 50,
        similarity: 75,
        outputFormat: 'mp3',
        sampleRate: 24000
    },
    isGenerating: false,
    generatedAudios: [],
    history: [],
    apiKeys: {
        google: { key: '', status: 'unknown' },
        elevenlabs: { key: '', status: 'unknown' },
        openai: { key: '', status: 'unknown' }
    }
};

// ============================================
// DOM Elements
// ============================================
const elements = {};

// ============================================
// Initialization
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    cacheElements();
    loadSettings();
    loadHistory();
    setupEventListeners();
    initializeServiceUI();
    checkApiConnection();
});

function cacheElements() {
    // Script
    elements.scriptInput = document.getElementById('scriptInput');
    elements.charCount = document.getElementById('charCount');
    elements.segmentInfo = document.getElementById('segmentInfo');
    elements.analyzeBtn = document.getElementById('analyzeBtn');

    // Recommendations
    elements.recommendationsSection = document.getElementById('recommendationsSection');
    elements.recommendationCards = document.getElementById('recommendationCards');
    elements.enableCustomMix = document.getElementById('enableCustomMix');

    // Analysis
    elements.detectedTone = document.getElementById('detectedTone');
    elements.detectedEmotion = document.getElementById('detectedEmotion');
    elements.detectedPurpose = document.getElementById('detectedPurpose');
    elements.detectedPace = document.getElementById('detectedPace');

    // Prompts
    elements.promptEnglish = document.getElementById('promptEnglish');
    elements.promptKorean = document.getElementById('promptKorean');
    elements.enablePromptEdit = document.getElementById('enablePromptEdit');

    // Advanced
    elements.advancedSection = document.getElementById('advancedSection');
    elements.modelSelect = document.getElementById('modelSelect');
    elements.voiceSelect = document.getElementById('voiceSelect');
    elements.voicePreview = document.getElementById('voicePreview');
    elements.resetOptionsBtn = document.getElementById('resetOptionsBtn');

    // Generate
    elements.generateBtn = document.getElementById('generateBtn');
    elements.generationStatus = document.getElementById('generationStatus');
    elements.statusDesc = document.getElementById('statusDesc');
    elements.progressBar = document.getElementById('progressBar');
    elements.segmentProgress = document.getElementById('segmentProgress');
    elements.audioResults = document.getElementById('audioResults');
    elements.segmentList = document.getElementById('segmentList');
    elements.totalSegments = document.getElementById('totalSegments');
    elements.playAllBtn = document.getElementById('playAllBtn');
    elements.downloadAllBtn = document.getElementById('downloadAllBtn');

    // Modals
    elements.apiSettingsBtn = document.getElementById('apiSettingsBtn');
    elements.apiSettingsModal = document.getElementById('apiSettingsModal');
    elements.closeApiSettingsModal = document.getElementById('closeApiSettingsModal');
    elements.cancelApiSettingsBtn = document.getElementById('cancelApiSettingsBtn');
    elements.saveApiSettingsBtn = document.getElementById('saveApiSettingsBtn');

    elements.helpBtn = document.getElementById('helpBtn');
    elements.helpModal = document.getElementById('helpModal');
    elements.closeHelpModal = document.getElementById('closeHelpModal');

    elements.historyBtn = document.getElementById('historyBtn');
    elements.historyModal = document.getElementById('historyModal');
    elements.closeHistoryModal = document.getElementById('closeHistoryModal');
    elements.historyList = document.getElementById('historyList');

    // Settings
    elements.ragServerUrl = document.getElementById('ragServerUrl');
    elements.defaultLanguage = document.getElementById('defaultLanguage');
    elements.maxSegmentLength = document.getElementById('maxSegmentLength');
    elements.segmentMethod = document.getElementById('segmentMethod');
    elements.testConnectionBtn = document.getElementById('testConnectionBtn');
    elements.connectionStatus = document.getElementById('connectionStatus');

    // API Status
    elements.apiStatus = document.getElementById('apiStatus');
    elements.toastContainer = document.getElementById('toastContainer');
}

// ============================================
// Event Listeners
// ============================================
function setupEventListeners() {
    // Script input
    elements.scriptInput.addEventListener('input', handleScriptInput);
    elements.analyzeBtn.addEventListener('click', analyzeScript);

    // Custom mix toggle
    elements.enableCustomMix.addEventListener('change', (e) => {
        state.customMixEnabled = e.target.checked;
        if (e.target.checked) {
            showToast('믹스 모드 활성화: 프롬프트 + 고급 옵션 조합', 'info');
        }
    });

    // Prompt edit toggle
    elements.enablePromptEdit.addEventListener('change', (e) => {
        elements.promptEnglish.disabled = !e.target.checked;
        elements.promptKorean.disabled = !e.target.checked;
        if (e.target.checked) {
            showToast('프롬프트를 직접 수정할 수 있습니다. 한글→영문 자동 동기화 활성', 'info');
        }
    });

    // Korean prompt → English auto-sync (always sync, regardless of checkbox)
    elements.promptKorean.addEventListener('input', debounce((e) => {
        // Always sync Korean to English for TTS quality
        syncKoreanToEnglish(e.target.value);
    }, 500));

    // Reset options
    elements.resetOptionsBtn.addEventListener('click', resetOptions);

    // Generate
    elements.generateBtn.addEventListener('click', generateTTS);
    elements.playAllBtn.addEventListener('click', playAllSegments);
    elements.downloadAllBtn.addEventListener('click', downloadAllSegments);

    // Modals
    elements.apiSettingsBtn.addEventListener('click', () => openModal('apiSettingsModal'));
    elements.closeApiSettingsModal.addEventListener('click', () => closeModal('apiSettingsModal'));
    elements.cancelApiSettingsBtn.addEventListener('click', () => closeModal('apiSettingsModal'));
    elements.saveApiSettingsBtn.addEventListener('click', saveApiSettings);

    elements.helpBtn.addEventListener('click', () => openModal('helpModal'));
    elements.closeHelpModal.addEventListener('click', () => closeModal('helpModal'));

    elements.historyBtn.addEventListener('click', () => {
        renderHistory();
        openModal('historyModal');
    });
    elements.closeHistoryModal.addEventListener('click', () => closeModal('historyModal'));

    // Test connection
    elements.testConnectionBtn.addEventListener('click', testConnection);

    // Tabs
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const tab = btn.dataset.tab;
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            btn.classList.add('active');
            document.getElementById(`tab-${tab}`).classList.add('active');
        });
    });

    // Accordion
    document.querySelectorAll('.accordion-header').forEach(header => {
        header.addEventListener('click', () => {
            header.parentElement.classList.toggle('open');
        });
    });

    // Service selection
    document.querySelectorAll('input[name="ttsService"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            state.selectedService = e.target.value;
            updateServiceUI();
        });
    });

    // Model/Voice selection
    elements.modelSelect.addEventListener('change', (e) => {
        state.selectedModel = e.target.value;
    });

    elements.voiceSelect.addEventListener('change', (e) => {
        state.selectedVoice = e.target.value;
        updateVoicePreview();
    });

    // Toggle groups
    document.querySelectorAll('.toggle-group').forEach(group => {
        group.querySelectorAll('.toggle-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                group.querySelectorAll('.toggle-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                handleToggleChange(group.id, btn.dataset.value);
            });
        });
    });

    // Emotion buttons
    document.querySelectorAll('.emotion-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.emotion-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            state.customSettings.emotion = btn.dataset.emotion;
            document.getElementById('emotionLabel').textContent = EMOTIONS[btn.dataset.emotion].name;
            updateGeneratedPrompts();
        });
    });

    // Sliders
    setupSlider('professionalism', 'professionalismValue');
    setupSlider('friendliness', 'friendlinessValue');
    setupSlider('persuasiveness', 'persuasivenessValue');
    setupSlider('emotionIntensity', 'emotionIntensityValue');
    setupSlider('speed', 'speedValue', v => (v / 100).toFixed(1) + 'x');
    setupSlider('pitch', 'pitchValue');
    setupSlider('stability', 'stabilityValue', v => (v / 100).toFixed(2));
    setupSlider('similarity', 'similarityValue', v => (v / 100).toFixed(2));

    // Style preset
    document.getElementById('stylePreset').addEventListener('change', (e) => {
        state.customSettings.stylePreset = e.target.value;
        document.getElementById('toneLabel').textContent = STYLE_PRESETS[e.target.value]?.name || '일반';
        updateGeneratedPrompts();
    });

    // Close modals on overlay click
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                overlay.classList.remove('active');
            }
        });
    });
}

// ============================================
// Service & Voice UI
// ============================================
function initializeServiceUI() {
    updateServiceUI();
}

function updateServiceUI() {
    const service = TTS_SERVICES[state.selectedService];

    // Update service cards
    document.querySelectorAll('.service-card').forEach(card => {
        card.classList.toggle('active', card.dataset.service === state.selectedService);
    });

    // Update label
    document.getElementById('selectedServiceLabel').textContent = service.name;

    // Update models
    elements.modelSelect.innerHTML = service.models.map(m =>
        `<option value="${m.id}">${m.name}</option>`
    ).join('');
    state.selectedModel = service.models[0].id;

    // Update voices
    elements.voiceSelect.innerHTML = service.voices.map(v =>
        `<option value="${v.id}">${v.name} (${v.gender === 'male' ? '남성' : v.gender === 'female' ? '여성' : '중성'})</option>`
    ).join('');
    state.selectedVoice = service.voices[0].id;

    // Update voice preview
    updateVoicePreview();

    // Show/hide ElevenLabs specific options
    document.body.classList.toggle('service-elevenlabs-active', state.selectedService === 'elevenlabs');
}

function updateVoicePreview() {
    const service = TTS_SERVICES[state.selectedService];
    const voice = service.voices.find(v => v.id === state.selectedVoice);

    if (voice) {
        elements.voicePreview.innerHTML = `
            <strong>${voice.name}</strong>: ${voice.description}
            ${voice.language === 'ko' ? '<span style="color: var(--gold-primary)"> 🇰🇷 한국어 최적화</span>' : ''}
        `;
    }
}

// ============================================
// Script Handling & Segmentation
// ============================================
function handleScriptInput(e) {
    const value = e.target.value;
    state.script = value;
    elements.charCount.textContent = value.length;

    if (value.length > CONFIG.maxScriptLength) {
        e.target.value = value.slice(0, CONFIG.maxScriptLength);
        state.script = e.target.value;
        elements.charCount.textContent = CONFIG.maxScriptLength;
        showToast('최대 글자 수에 도달했습니다', 'warning');
    }

    // Update segment info
    updateSegmentInfo();
}

function updateSegmentInfo() {
    const segmentCount = Math.ceil(state.script.length / CONFIG.maxSegmentLength);
    if (state.script.length > CONFIG.maxSegmentLength) {
        elements.segmentInfo.textContent = `📄 ${segmentCount}개 세그먼트로 분할 예정`;
    } else {
        elements.segmentInfo.textContent = '';
    }
}

function segmentScript(script) {
    if (script.length <= CONFIG.maxSegmentLength) {
        return [script];
    }

    const segments = [];
    let remaining = script;

    while (remaining.length > 0) {
        if (remaining.length <= CONFIG.maxSegmentLength) {
            segments.push(remaining.trim());
            break;
        }

        // Find the best split point within the limit
        let splitPoint = CONFIG.maxSegmentLength;

        // Try to find sentence endings (., !, ?, 。)
        const sentenceEndings = ['. ', '! ', '? ', '。', '.\n', '!\n', '?\n'];
        let bestSplit = -1;

        for (const ending of sentenceEndings) {
            const lastIndex = remaining.lastIndexOf(ending, CONFIG.maxSegmentLength);
            if (lastIndex > bestSplit && lastIndex > CONFIG.maxSegmentLength * 0.5) {
                bestSplit = lastIndex + ending.length;
            }
        }

        if (bestSplit > 0) {
            splitPoint = bestSplit;
        } else {
            // Try paragraph breaks
            const paragraphBreak = remaining.lastIndexOf('\n\n', CONFIG.maxSegmentLength);
            if (paragraphBreak > CONFIG.maxSegmentLength * 0.5) {
                splitPoint = paragraphBreak + 2;
            } else {
                // Try any newline
                const newlineBreak = remaining.lastIndexOf('\n', CONFIG.maxSegmentLength);
                if (newlineBreak > CONFIG.maxSegmentLength * 0.5) {
                    splitPoint = newlineBreak + 1;
                }
            }
        }

        segments.push(remaining.slice(0, splitPoint).trim());
        remaining = remaining.slice(splitPoint).trim();
    }

    return segments;
}

// ============================================
// AI Analysis & Recommendations
// ============================================
async function analyzeScript() {
    if (!state.script.trim()) {
        showToast('대본을 입력해주세요', 'warning');
        return;
    }

    state.isAnalyzing = true;
    elements.analyzeBtn.disabled = true;
    elements.analyzeBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 분석 중...';

    try {
        // Segment the script
        state.segments = segmentScript(state.script);

        // Simulate AI analysis (replace with actual API call)
        const analysis = await simulateAnalysis(state.script);

        state.analysisResult = analysis.analysis;
        state.recommendations = analysis.recommendations;

        // Update UI with analysis results
        elements.detectedTone.textContent = analysis.analysis.tone;
        elements.detectedEmotion.textContent = analysis.analysis.emotion;
        elements.detectedPurpose.textContent = analysis.analysis.purpose;
        elements.detectedPace.textContent = analysis.analysis.pace;

        renderRecommendations(analysis.recommendations);

        elements.recommendationsSection.classList.add('active');
        elements.advancedSection.classList.add('active');

        // Auto-select the top recommendation (best match for this script)
        if (analysis.recommendations.length > 0) {
            const topRec = analysis.recommendations[0];
            selectRecommendation(topRec.id);
            showToast(`AI 분석 완료! "${topRec.name}" 스타일이 가장 적합합니다. (${state.segments.length}개 세그먼트)`, 'success');
        } else {
            showToast(`AI 분석 완료! ${state.segments.length}개 세그먼트로 분할됩니다.`, 'success');
        }


    } catch (error) {
        console.error('Analysis error:', error);
        showToast('분석 중 오류가 발생했습니다', 'error');
    } finally {
        state.isAnalyzing = false;
        elements.analyzeBtn.disabled = false;
        elements.analyzeBtn.innerHTML = '<i class="fas fa-magic"></i> <span>AI 분석 시작</span>';
    }
}

async function simulateAnalysis(script) {
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Enhanced keyword-based analysis
    const hasGreeting = script.includes('안녕') || script.includes('환영') || script.includes('반갑');
    const hasBusiness = script.includes('매물') || script.includes('부동산') || script.includes('상담') || script.includes('계약') || script.includes('투자');
    const hasExclamation = (script.match(/!/g) || []).length;
    const isQuestion = script.includes('?');
    const hasPromotion = script.includes('특별') || script.includes('할인') || script.includes('이벤트') || script.includes('혜택');
    const hasEducation = script.includes('설명') || script.includes('안내') || script.includes('알려') || script.includes('소개');
    const hasEmotion = script.includes('감사') || script.includes('축하') || script.includes('사랑');
    const scriptLength = script.length;

    // Determine primary characteristics
    let tone = '일반';
    let emotion = '중립';
    let purpose = '정보 전달';
    let pace = '보통';
    let toneEn = 'neutral';
    let emotionEn = 'neutral';
    let purposeEn = 'information delivery';

    // Score-based recommendation ranking
    let scores = {
        warm: 0,      // 따뜻한 내레이션
        professional: 0, // 전문적 설명
        energetic: 0,  // 활기찬 홍보
        calm: 0,       // 차분한 안내
        storytelling: 0 // 스토리텔링
    };

    if (hasGreeting) {
        tone = '친근한'; toneEn = 'friendly';
        emotion = '따뜻함'; emotionEn = 'warm';
        scores.warm += 30;
        scores.storytelling += 10;
    }
    if (hasBusiness) {
        tone = '전문적'; toneEn = 'professional';
        purpose = '비즈니스'; purposeEn = 'business presentation';
        scores.professional += 30;
        scores.warm += 15;
    }
    if (hasPromotion) {
        emotion = '활기찬'; emotionEn = 'energetic';
        purpose = '홍보/마케팅'; purposeEn = 'marketing/promotion';
        pace = '약간 빠름';
        scores.energetic += 40;
    }
    if (hasExclamation >= 3) {
        emotion = '활기찬'; emotionEn = 'enthusiastic';
        pace = '약간 빠름';
        scores.energetic += 20;
    } else if (hasExclamation >= 1) {
        scores.warm += 10;
    }
    if (isQuestion) {
        purpose = '소통/질문'; purposeEn = 'communication';
        scores.warm += 10;
    }
    if (hasEducation) {
        tone = '설명적'; toneEn = 'explanatory';
        purpose = '교육/안내'; purposeEn = 'education/guidance';
        scores.calm += 25;
        scores.professional += 15;
    }
    if (hasEmotion) {
        emotion = '감성적'; emotionEn = 'emotional';
        scores.warm += 20;
        scores.storytelling += 15;
    }
    if (scriptLength > 500) {
        scores.calm += 10;
        scores.storytelling += 10;
    }

    // Build context-aware prompts based on analysis
    const analysisPromptEn = `This is a ${toneEn} ${purposeEn} script. Speak with a ${emotionEn} emotional tone.`;
    const analysisPromptKo = `이 대본은 ${tone} ${purpose} 스타일입니다. ${emotion} 감정 톤으로 말하세요.`;

    // Create all recommendation types with their base scores
    const allRecommendations = [
        {
            type: 'warm',
            score: scores.warm,
            id: 1,
            name: '따뜻한 내레이션',
            emoji: '💝',
            description: '친근하고 부드러운 톤으로, 청자에게 신뢰감을 주는 스타일입니다. 부동산/서비스 소개에 적합합니다.',
            promptEn: `${analysisPromptEn} Speak in a warm, friendly, and conversational tone. Like a trusted advisor sharing helpful information. Use gentle pauses and maintain a steady, reassuring pace. Emphasize key points naturally without being too dramatic.`,
            promptKo: `${analysisPromptKo} 따뜻하고 친근하며 대화하는 듯한 톤으로 말하세요. 신뢰할 수 있는 조언자가 유용한 정보를 공유하듯이. 부드러운 쉼을 사용하고 안정적이고 안심시키는 속도를 유지하세요.`,
            settings: { stylePreset: 'warm_friendly', emotion: 'caring', speed: 95 }
        },
        {
            type: 'professional',
            score: scores.professional,
            id: 2,
            name: '전문적 설명',
            emoji: '👔',
            description: '신뢰감 있고 명확한 전달력의 전문가 스타일입니다. 비즈니스 프레젠테이션에 적합합니다.',
            promptEn: `${analysisPromptEn} Speak in a professional, authoritative, and clear manner. Like a knowledgeable expert presenting to clients. Use deliberate pacing with confident pauses. Maintain credibility while remaining approachable.`,
            promptKo: `${analysisPromptKo} 전문적이고 권위 있으며 명확한 방식으로 말하세요. 고객에게 발표하는 지식이 풍부한 전문가처럼. 자신감 있는 쉼과 함께 의도적인 속도를 사용하세요.`,
            settings: { stylePreset: 'professional', emotion: 'confident', speed: 90 }
        },
        {
            type: 'energetic',
            score: scores.energetic,
            id: 3,
            name: '활기찬 홍보',
            emoji: '🎉',
            description: '에너지 넘치고 청자의 관심을 끄는 홍보 스타일입니다. 마케팅 콘텐츠에 적합합니다.',
            promptEn: `${analysisPromptEn} Speak with energy and enthusiasm! Like an exciting host revealing something special. Use dynamic pacing with excitement building at key points. Be persuasive and engaging while maintaining authenticity.`,
            promptKo: `${analysisPromptKo} 에너지와 열정을 담아 말하세요! 특별한 것을 공개하는 흥미진진한 호스트처럼. 중요한 포인트에서 흥분이 고조되는 역동적인 속도를 사용하세요.`,
            settings: { stylePreset: 'promotional', emotion: 'excited', speed: 110 }
        },
        {
            type: 'calm',
            score: scores.calm,
            id: 4,
            name: '차분한 안내',
            emoji: '🧘',
            description: '평온하고 안정적인 톤으로, 정보 전달에 집중하는 스타일입니다. 교육/설명 콘텐츠에 적합합니다.',
            promptEn: `${analysisPromptEn} Speak in a calm, measured, and soothing tone. Like a gentle guide walking someone through important information. Maintain a steady, unhurried pace. Use clear articulation and thoughtful pauses.`,
            promptKo: `${analysisPromptKo} 차분하고 절제된 편안한 톤으로 말하세요. 중요한 정보를 안내하는 부드러운 가이드처럼. 안정적이고 서두르지 않는 속도를 유지하세요.`,
            settings: { stylePreset: 'narration', emotion: 'calm', speed: 90 }
        },
        {
            type: 'storytelling',
            score: scores.storytelling,
            id: 5,
            name: '스토리텔링',
            emoji: '📖',
            description: '이야기를 전하듯 몰입감 있는 스타일입니다. 내러티브 콘텐츠에 적합합니다.',
            promptEn: `${analysisPromptEn} Speak like a skilled storyteller captivating an audience. Vary your pace and tone to create drama and interest. Build emotional connection through expressive delivery. Use pauses for effect.`,
            promptKo: `${analysisPromptKo} 청중을 사로잡는 숙련된 이야기꾼처럼 말하세요. 드라마와 흥미를 위해 속도와 톤을 다양하게 조절하세요. 표현력 있는 전달로 감정적 연결을 구축하세요.`,
            settings: { stylePreset: 'storyteller', emotion: 'inspiring', speed: 95 }
        }
    ];

    // Sort by score (highest first) and take top 3
    allRecommendations.sort((a, b) => b.score - a.score);
    const topRecommendations = allRecommendations.slice(0, 3).map((rec, index) => ({
        ...rec,
        id: index + 1,
        rank: index + 1,
        matchScore: rec.score
    }));

    // Store analysis prompts in state for later use
    state.analysisPromptEn = analysisPromptEn;
    state.analysisPromptKo = analysisPromptKo;

    return {
        analysis: { tone, emotion, purpose, pace, toneEn, emotionEn, purposeEn },
        recommendations: topRecommendations
    };
}

function renderRecommendations(recommendations) {
    elements.recommendationCards.innerHTML = recommendations.map((rec, index) => `
        <div class="recommendation-card ${index === 0 ? 'best-match' : ''}" data-id="${rec.id}">
            ${index === 0 ? '<div class="best-match-badge">🏆 Best Match</div>' : ''}
            <div class="rec-header">
                <span class="rec-emoji">${rec.emoji}</span>
                <span class="rec-title">${rec.name}</span>
            </div>
            <p class="rec-description">${rec.description}</p>
            <div class="rec-prompts">
                <div class="rec-prompt-label">🇺🇸 English Prompt</div>
                <p class="rec-prompt-text">${rec.promptEn.slice(0, 120)}...</p>
            </div>
            <div class="rec-actions">
                <button class="btn btn-outline rec-preview-btn" onclick="previewRecommendation(${rec.id})">
                    <i class="fas fa-play"></i> 미리듣기
                </button>
                <button class="btn btn-primary rec-select-btn" onclick="selectRecommendation(${rec.id})">
                    선택
                </button>
            </div>
        </div>
    `).join('');
}

function selectRecommendation(id) {
    const rec = state.recommendations.find(r => r.id === id);
    if (!rec) return;

    state.selectedRecommendation = rec;
    state.generatedPromptEn = rec.promptEn;
    state.generatedPromptKo = rec.promptKo;

    // Apply settings
    Object.assign(state.customSettings, rec.settings);

    // Update prompts
    elements.promptEnglish.value = rec.promptEn;
    elements.promptKorean.value = rec.promptKo;

    // Update UI
    document.querySelectorAll('.recommendation-card').forEach(card => {
        card.classList.toggle('selected', card.dataset.id == id);
    });

    // Open prompt accordion
    document.querySelector('[data-accordion="prompt"]').classList.add('open');

    updateFormFromSettings();
    showToast(`"${rec.name}" 스타일이 선택되었습니다`, 'success');
}

function previewRecommendation(id) {
    showToast('미리듣기 기능은 TTS API 연동 후 사용 가능합니다', 'info');
}

function updateGeneratedPrompts() {
    const style = STYLE_PRESETS[state.customSettings.stylePreset] || STYLE_PRESETS.normal;
    const emotion = EMOTIONS[state.customSettings.emotion] || EMOTIONS.normal;
    const speed = state.customSettings.speed;

    let speedDesc = '';
    if (speed < 90) speedDesc = 'speaking slowly and deliberately, ';
    else if (speed > 110) speedDesc = 'speaking with energy and pace, ';

    const promptEn = `Speak in a ${style.promptEn} manner. The emotional tone should be ${emotion.promptEn}. ${speedDesc}Emphasize natural pauses and maintain clear articulation throughout.`;
    const promptKo = `${style.promptKo} 방식으로 말하세요. 감정적 톤은 ${emotion.promptKo} 느낌이어야 합니다. 자연스러운 쉼을 강조하고 전체적으로 명확한 발음을 유지하세요.`;

    state.generatedPromptEn = promptEn;
    state.generatedPromptKo = promptKo;

    if (!elements.enablePromptEdit.checked) {
        elements.promptEnglish.value = promptEn;
        elements.promptKorean.value = promptKo;
    }
}

function updateFormFromSettings() {
    const s = state.customSettings;

    document.getElementById('stylePreset').value = s.stylePreset;
    document.getElementById('professionalism').value = s.professionalism;
    document.getElementById('friendliness').value = s.friendliness;
    document.getElementById('persuasiveness').value = s.persuasiveness;
    document.getElementById('emotionIntensity').value = s.emotionIntensity;
    document.getElementById('speed').value = s.speed;
    document.getElementById('pitch').value = s.pitch;
    document.getElementById('stability').value = s.stability;
    document.getElementById('similarity').value = s.similarity;

    // Update displays
    document.getElementById('professionalismValue').textContent = s.professionalism;
    document.getElementById('friendlinessValue').textContent = s.friendliness;
    document.getElementById('persuasivenessValue').textContent = s.persuasiveness;
    document.getElementById('emotionIntensityValue').textContent = s.emotionIntensity;
    document.getElementById('speedValue').textContent = (s.speed / 100).toFixed(1) + 'x';
    document.getElementById('pitchValue').textContent = s.pitch;
    document.getElementById('stabilityValue').textContent = (s.stability / 100).toFixed(2);
    document.getElementById('similarityValue').textContent = (s.similarity / 100).toFixed(2);

    // Emotion
    document.querySelectorAll('.emotion-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.emotion === s.emotion);
    });
    document.getElementById('emotionLabel').textContent = EMOTIONS[s.emotion]?.name || '일반';
    document.getElementById('toneLabel').textContent = STYLE_PRESETS[s.stylePreset]?.name || '일반';
    document.getElementById('speedLabel').textContent = (s.speed / 100).toFixed(1) + 'x';
}

function resetOptions() {
    state.customSettings = {
        stylePreset: 'normal',
        professionalism: 50,
        friendliness: 50,
        persuasiveness: 50,
        emotion: 'normal',
        emotionIntensity: 50,
        speed: 100,
        pauseStrength: 'medium',
        endingTone: 'level',
        pitch: 0,
        stability: 50,
        similarity: 75,
        outputFormat: 'mp3',
        sampleRate: 24000
    };

    updateFormFromSettings();
    updateGeneratedPrompts();
    showToast('설정이 초기화되었습니다', 'success');
}

// ============================================
// TTS Generation (Real API)
// ============================================
async function generateTTS() {
    if (!state.script.trim()) {
        showToast('대본을 입력해주세요', 'warning');
        return;
    }

    state.isGenerating = true;
    state.generatedAudios = [];
    elements.generateBtn.disabled = true;
    elements.audioResults.classList.remove('active');
    elements.generationStatus.classList.add('active');

    try {
        // Segment the script
        const segments = state.segments.length > 0 ? state.segments : segmentScript(state.script);
        state.segments = segments;

        // Show segment progress UI
        elements.segmentProgress.innerHTML = segments.map((seg, i) => `
            <div class="segment-progress-item pending" id="seg-progress-${i}">
                <div class="segment-progress-icon"><i class="fas fa-circle"></i></div>
                <div class="segment-progress-text">${seg.slice(0, 50)}${seg.length > 50 ? '...' : ''}</div>
                <div class="segment-progress-status">대기중</div>
            </div>
        `).join('');

        // Generate each segment via API
        for (let i = 0; i < segments.length; i++) {
            const segEl = document.getElementById(`seg-progress-${i}`);
            segEl.classList.remove('pending');
            segEl.classList.add('processing');
            segEl.querySelector('.segment-progress-icon i').className = 'fas fa-spinner fa-spin';
            segEl.querySelector('.segment-progress-status').textContent = '생성 중...';

            elements.statusDesc.textContent = `세그먼트 ${i + 1}/${segments.length} 생성 중`;
            elements.progressBar.style.width = `${((i + 0.5) / segments.length) * 100}%`;

            try {
                // Call the real TTS API (m08_tts server on port 8005)
                const response = await fetch(`${CONFIG.ttsServerUrl}/webhook/tts`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        text: segments[i],
                        gender: state.customSettings.emotion === 'caring' ? 'female' : 'male',
                        age_group: 'middle',
                        style: mapStyleToTTSStyle(state.customSettings.stylePreset),
                        emotion: mapEmotionToTTSEmotion(state.customSettings.emotion),
                        speaking_rate: mapSpeedToRate(state.customSettings.speed),
                        emotion_intensity: state.customSettings.emotionIntensity > 70 ? 'strong' : state.customSettings.emotionIntensity > 30 ? 'moderate' : 'subtle',
                        output_format: state.customSettings.outputFormat || 'mp3'
                    })
                });

                const result = await response.json();

                if (result.success && result.audio) {
                    // Create audio blob from base64
                    const audioBlob = base64ToBlob(result.audio, result.contentType || 'audio/mpeg');
                    const audioUrl = URL.createObjectURL(audioBlob);

                    state.generatedAudios.push({
                        index: i,
                        text: segments[i],
                        audioUrl: audioUrl,
                        audioBlob: audioBlob,
                        audioBase64: result.audio,
                        contentType: result.contentType || 'audio/mpeg',
                        duration: result.duration || (segments[i].length * 0.1),
                        service: result.service || state.selectedService
                    });

                    segEl.classList.remove('processing');
                    segEl.classList.add('completed');
                    segEl.querySelector('.segment-progress-icon i').className = 'fas fa-check-circle';
                    segEl.querySelector('.segment-progress-status').textContent = '완료';
                } else {
                    throw new Error(result.error || '음성 생성 실패');
                }
            } catch (segError) {
                console.error(`Segment ${i} error:`, segError);
                segEl.classList.remove('processing');
                segEl.classList.add('error');
                segEl.querySelector('.segment-progress-icon i').className = 'fas fa-times-circle';
                segEl.querySelector('.segment-progress-status').textContent = '오류: ' + (segError.message || '생성 실패');

                // Add placeholder for failed segment
                state.generatedAudios.push({
                    index: i,
                    text: segments[i],
                    audioUrl: null,
                    audioBlob: null,
                    error: segError.message,
                    duration: 0,
                    service: state.selectedService
                });
            }

            elements.progressBar.style.width = `${((i + 1) / segments.length) * 100}%`;
        }

        // Show results
        elements.generationStatus.classList.remove('active');
        elements.audioResults.classList.add('active');
        renderAudioResults();

        // Save to history
        saveToHistory();

        const successCount = state.generatedAudios.filter(a => a.audioUrl).length;
        if (successCount === segments.length) {
            showToast(`${segments.length}개 세그먼트 생성 완료!`, 'success');
        } else {
            showToast(`${successCount}/${segments.length}개 세그먼트 생성됨 (일부 실패)`, 'warning');
        }

    } catch (error) {
        console.error('Generation error:', error);
        showToast('음성 생성 중 오류가 발생했습니다: ' + error.message, 'error');
        elements.generationStatus.classList.remove('active');
    } finally {
        state.isGenerating = false;
        elements.generateBtn.disabled = false;
    }
}

// Base64 to Blob conversion
function base64ToBlob(base64, mimeType = 'audio/mpeg') {
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: mimeType });
}

function renderAudioResults() {
    elements.totalSegments.textContent = state.generatedAudios.length;

    elements.segmentList.innerHTML = state.generatedAudios.map(audio => `
        <div class="segment-item ${audio.error ? 'error' : ''}">
            <div class="segment-number">${audio.index + 1}</div>
            <div class="segment-info">
                <div class="segment-text">${audio.text.slice(0, 80)}${audio.text.length > 80 ? '...' : ''}</div>
                <div class="segment-meta">
                    ${audio.error ? `<span style="color: var(--danger)">오류: ${audio.error}</span>` :
            `${audio.duration.toFixed(1)}초 · ${TTS_SERVICES[audio.service]?.name || audio.service}`}
                </div>
            </div>
            <div class="segment-actions">
                <button class="btn btn-outline btn-sm" onclick="playSegment(${audio.index})" ${audio.error ? 'disabled' : ''}>
                    <i class="fas fa-play"></i>
                </button>
                <button class="btn btn-outline btn-sm" onclick="downloadSegment(${audio.index})" ${audio.error ? 'disabled' : ''}>
                    <i class="fas fa-download"></i>
                </button>
            </div>
        </div>
    `).join('');
}

// Current audio element for playback
let currentAudio = null;
let currentPlayingIndex = -1;

function playSegment(index) {
    const audio = state.generatedAudios[index];
    if (!audio || !audio.audioUrl) {
        showToast('재생할 오디오가 없습니다', 'warning');
        return;
    }

    // Stop current audio if playing
    if (currentAudio) {
        currentAudio.pause();
        currentAudio = null;

        // Update previous button
        if (currentPlayingIndex >= 0) {
            const prevBtn = document.querySelector(`.segment-item:nth-child(${currentPlayingIndex + 1}) .btn:first-child i`);
            if (prevBtn) prevBtn.className = 'fas fa-play';
        }

        // If same button clicked, just stop
        if (currentPlayingIndex === index) {
            currentPlayingIndex = -1;
            return;
        }
    }

    // Create and play new audio
    currentAudio = new Audio(audio.audioUrl);
    currentPlayingIndex = index;

    // Update button to pause icon
    const btn = document.querySelector(`.segment-item:nth-child(${index + 1}) .btn:first-child i`);
    if (btn) btn.className = 'fas fa-pause';

    currentAudio.onended = () => {
        if (btn) btn.className = 'fas fa-play';
        currentPlayingIndex = -1;
        currentAudio = null;
    };

    currentAudio.onerror = () => {
        showToast('오디오 재생 오류', 'error');
        if (btn) btn.className = 'fas fa-play';
        currentPlayingIndex = -1;
        currentAudio = null;
    };

    currentAudio.play().catch(err => {
        console.error('Playback error:', err);
        showToast('오디오 재생에 실패했습니다', 'error');
        if (btn) btn.className = 'fas fa-play';
    });

    showToast(`세그먼트 ${index + 1} 재생 중...`, 'info');
}

function playAllSegments() {
    const validAudios = state.generatedAudios.filter(a => a.audioUrl);
    if (validAudios.length === 0) {
        showToast('재생할 오디오가 없습니다', 'warning');
        return;
    }

    let currentIndex = 0;

    function playNext() {
        if (currentIndex >= validAudios.length) {
            showToast('전체 재생 완료', 'success');
            return;
        }

        const audio = validAudios[currentIndex];
        currentAudio = new Audio(audio.audioUrl);
        currentPlayingIndex = audio.index;

        // Update button
        const btn = document.querySelector(`.segment-item:nth-child(${audio.index + 1}) .btn:first-child i`);
        if (btn) btn.className = 'fas fa-pause';

        currentAudio.onended = () => {
            if (btn) btn.className = 'fas fa-play';
            currentIndex++;
            playNext();
        };

        currentAudio.play().catch(err => {
            console.error('Playback error:', err);
            currentIndex++;
            playNext();
        });
    }

    showToast('전체 재생 시작...', 'info');
    playNext();
}

function downloadSegment(index) {
    const audio = state.generatedAudios[index];
    if (!audio || !audio.audioBlob) {
        showToast('다운로드할 오디오가 없습니다', 'warning');
        return;
    }

    // Determine extension based on content type
    let extension = 'mp3';
    if (audio.contentType && audio.contentType.includes('wav')) {
        extension = 'wav';
    }

    // Create a unique filename
    const timestamp = new Date().getTime();
    const filename = `tts_segment_${index + 1}_${timestamp}.${extension}`;

    // Create and click the download link
    const link = document.createElement('a');
    link.href = audio.audioUrl;
    link.download = filename;
    link.style.display = 'none';
    document.body.appendChild(link);

    link.click();

    // Clean up
    requestAnimationFrame(() => {
        document.body.removeChild(link);
    });

    showToast('다운로드 저장 중...', 'success');
}

function downloadAllSegments() {
    const validAudios = state.generatedAudios.filter(a => a.audioBlob);
    if (validAudios.length === 0) {
        showToast('다운로드할 오디오가 없습니다', 'warning');
        return;
    }

    // Download each file with a slight delay
    validAudios.forEach((audio, i) => {
        setTimeout(() => {
            downloadSegment(audio.index);
        }, i * 500);
    });

    showToast(`${validAudios.length}개 파일 다운로드 시작...`, 'success');
}

// ============================================
// Settings & API
// ============================================
async function testConnection() {
    elements.connectionStatus.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 연결 테스트 중...';
    elements.connectionStatus.className = 'connection-status';

    try {
        const url = elements.ragServerUrl.value;
        const response = await fetch(`${url}/health`, { timeout: 5000 });
        const data = await response.json();

        if (data.status === 'healthy') {
            elements.connectionStatus.innerHTML = '✅ 연결 성공! 서버가 정상 작동 중입니다.';
            elements.connectionStatus.className = 'connection-status success';
        } else {
            throw new Error('Not healthy');
        }
    } catch (error) {
        elements.connectionStatus.innerHTML = '❌ 연결 실패. 서버 URL을 확인해주세요.';
        elements.connectionStatus.className = 'connection-status error';
    }
}

async function testApiKey(service) {
    const inputId = `${service}ApiKey`;
    const statusId = `${service}KeyStatus`;
    const key = document.getElementById(inputId).value;

    if (!key) {
        showToast('API 키를 입력해주세요', 'warning');
        return;
    }

    document.getElementById(statusId).textContent = '테스트 및 저장 중...';

    // Map frontend service names to backend service names
    const serviceNameMap = {
        'google': 'gemini',  // Backend expects 'gemini' for Google AI Studio
        'elevenlabs': 'elevenlabs',
        'openai': 'openai'
    };

    const backendServiceName = serviceNameMap[service] || service;

    try {
        // Save to backend
        const response = await fetch(`${CONFIG.ragServerUrl}/api/service-keys`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                service: backendServiceName,
                api_key: key,
                description: `TTS Studio - ${TTS_SERVICES[service]?.name || service}`
            })
        });

        const result = await response.json();

        if (result.success || response.ok) {
            document.getElementById(statusId).textContent = '저장 완료';
            document.getElementById(statusId).classList.add('registered');
            state.apiKeys[service] = { key: '***', status: 'valid' };
            showToast(`${TTS_SERVICES[service]?.name || service} API 키가 저장되었습니다`, 'success');
        } else {
            document.getElementById(statusId).textContent = '저장 실패';
            showToast(`API 키 저장 실패: ${result.error || '알 수 없는 오류'}`, 'error');
        }
    } catch (error) {
        console.error('API key save error:', error);
        document.getElementById(statusId).textContent = '저장 실패';
        showToast(`API 키 저장 실패: ${error.message}`, 'error');
    }
}

async function saveApiSettings() {
    CONFIG.ragServerUrl = elements.ragServerUrl.value;
    CONFIG.defaultLanguage = elements.defaultLanguage.value;
    CONFIG.maxSegmentLength = parseInt(elements.maxSegmentLength.value);
    CONFIG.segmentMethod = elements.segmentMethod.value;

    // Get API keys
    const apiKeys = {
        google: document.getElementById('googleApiKey').value,
        elevenlabs: document.getElementById('elevenlabsApiKey').value,
        openai: document.getElementById('openaiApiKey').value
    };

    // Map frontend service names to backend service names
    const serviceNameMap = {
        'google': 'gemini',  // Backend expects 'gemini' for Google AI Studio
        'elevenlabs': 'elevenlabs',
        'openai': 'openai'
    };

    // Save to localStorage (for config)
    localStorage.setItem('tts_config', JSON.stringify(CONFIG));

    // Save API keys to backend
    const savePromises = [];

    for (const [service, key] of Object.entries(apiKeys)) {
        if (key && key.trim()) {
            const backendService = serviceNameMap[service] || service;
            savePromises.push(
                fetch(`${CONFIG.ragServerUrl}/api/service-keys`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        service: backendService,
                        api_key: key,
                        description: `TTS Studio - ${TTS_SERVICES[service]?.name || service}`
                    })
                }).then(res => res.json())
                    .then(result => {
                        console.log(`Saved ${service} (as ${backendService}) key:`, result);
                        return { service, success: true };
                    })
                    .catch(err => {
                        console.error(`Failed to save ${service} key:`, err);
                        return { service, success: false, error: err.message };
                    })
            );
        }
    }

    // Wait for all saves
    if (savePromises.length > 0) {
        const results = await Promise.all(savePromises);
        const failed = results.filter(r => !r.success);
        if (failed.length > 0) {
            showToast(`일부 API 키 저장 실패: ${failed.map(f => f.service).join(', ')}`, 'warning');
        } else {
            showToast('모든 API 키가 서버에 저장되었습니다', 'success');
        }
    }

    // Also save locally for fallback
    localStorage.setItem('tts_api_keys', JSON.stringify(apiKeys));

    closeModal('apiSettingsModal');
    showToast('설정이 저장되었습니다', 'success');

    updateSegmentInfo();
    checkApiConnection();
}

function loadSettings() {
    const saved = localStorage.getItem('tts_config');
    if (saved) {
        Object.assign(CONFIG, JSON.parse(saved));
        elements.ragServerUrl.value = CONFIG.ragServerUrl;
        elements.defaultLanguage.value = CONFIG.defaultLanguage;
        elements.maxSegmentLength.value = CONFIG.maxSegmentLength;
        elements.segmentMethod.value = CONFIG.segmentMethod;
    }

    const savedKeys = localStorage.getItem('tts_api_keys');
    if (savedKeys) {
        const keys = JSON.parse(savedKeys);
        if (keys.google) {
            document.getElementById('googleApiKey').value = keys.google;
            document.getElementById('googleKeyStatus').textContent = '등록됨';
            document.getElementById('googleKeyStatus').classList.add('registered');
        }
        if (keys.elevenlabs) {
            document.getElementById('elevenlabsApiKey').value = keys.elevenlabs;
            document.getElementById('elevenlabsKeyStatus').textContent = '등록됨';
            document.getElementById('elevenlabsKeyStatus').classList.add('registered');
        }
        if (keys.openai) {
            document.getElementById('openaiApiKey').value = keys.openai;
            document.getElementById('openaiKeyStatus').textContent = '등록됨';
            document.getElementById('openaiKeyStatus').classList.add('registered');
        }
    }
}

async function checkApiConnection() {
    try {
        // Check TTS server connection (m08_tts on port 8005)
        const response = await fetch(`${CONFIG.ttsServerUrl}/health`);
        const data = await response.json();

        if (data.status === 'healthy') {
            elements.apiStatus.classList.add('connected');
            elements.apiStatus.innerHTML = `
                <span class="status-dot"></span>
                <span>TTS 서버 연결됨 (${data.module || 'TTS'})</span>
            `;
        } else {
            throw new Error('Unhealthy');
        }
    } catch (error) {
        elements.apiStatus.classList.remove('connected');
        elements.apiStatus.innerHTML = `
            <span class="status-dot"></span>
            <span>TTS 서버 연결 안됨 (8005)</span>
        `;
    }
}

// Load registered keys from backend
async function loadRegisteredKeys() {
    try {
        const response = await fetch(`${CONFIG.ragServerUrl}/api/service-keys`);
        const data = await response.json();

        if (data.keys && Array.isArray(data.keys)) {
            // Update status badges for registered keys
            data.keys.forEach(keyInfo => {
                const service = keyInfo.service;
                const statusEl = document.getElementById(`${service}KeyStatus`);
                if (statusEl) {
                    statusEl.textContent = '서버에 등록됨';
                    statusEl.classList.add('registered');
                }

                // Update state to know we have this key on server
                state.apiKeys[service] = { key: '***', status: 'registered_on_server' };
            });

            // Map common service names
            const serviceMap = {
                'google_ai_studio': 'google',
                'gemini': 'google',
                'google_tts': 'google',
                'elevenlabs_tts': 'elevenlabs',
                'openai_tts': 'openai'
            };

            data.keys.forEach(keyInfo => {
                const mappedService = serviceMap[keyInfo.service];
                if (mappedService) {
                    const statusEl = document.getElementById(`${mappedService}KeyStatus`);
                    if (statusEl) {
                        statusEl.textContent = '서버에 등록됨';
                        statusEl.classList.add('registered');
                    }
                    state.apiKeys[mappedService] = { key: '***', status: 'registered_on_server' };
                }
            });
        }
    } catch (error) {
        console.log('Could not fetch registered keys:', error);
    }
}

// ============================================
// History
// ============================================
function saveToHistory() {
    const historyItem = {
        id: Date.now(),
        script: state.script.slice(0, 100),
        service: state.selectedService,
        segments: state.generatedAudios.length,
        timestamp: new Date().toISOString()
    };

    state.history.unshift(historyItem);
    if (state.history.length > 50) state.history.pop();

    localStorage.setItem('tts_history', JSON.stringify(state.history));
}

function loadHistory() {
    const saved = localStorage.getItem('tts_history');
    if (saved) {
        state.history = JSON.parse(saved);
    }
}

function renderHistory() {
    if (state.history.length === 0) {
        elements.historyList.innerHTML = `
            <div class="history-empty">
                <i class="fas fa-clock"></i>
                <p>아직 생성된 음성이 없습니다</p>
            </div>
        `;
        return;
    }

    elements.historyList.innerHTML = state.history.map(item => `
        <div class="history-item">
            <div class="segment-number">${item.segments}</div>
            <div class="segment-info">
                <div class="segment-text">${item.script}...</div>
                <div class="segment-meta">${TTS_SERVICES[item.service]?.name || item.service} · ${new Date(item.timestamp).toLocaleDateString('ko-KR')}</div>
            </div>
        </div>
    `).join('');
}

// ============================================
// UI Helpers
// ============================================
function setupSlider(sliderId, valueId, formatter = v => v) {
    const slider = document.getElementById(sliderId);
    const valueEl = document.getElementById(valueId);

    if (slider && valueEl) {
        slider.addEventListener('input', (e) => {
            const value = parseInt(e.target.value);
            valueEl.textContent = formatter(value);
            state.customSettings[sliderId] = value;

            if (sliderId === 'speed') {
                document.getElementById('speedLabel').textContent = formatter(value);
            }

            updateGeneratedPrompts();
        });
    }
}

function handleToggleChange(groupId, value) {
    if (groupId === 'pauseStrength') state.customSettings.pauseStrength = value;
    if (groupId === 'endingTone') state.customSettings.endingTone = value;
}

function openModal(modalId) {
    document.getElementById(modalId).classList.add('active');
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
}

function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    const icons = {
        success: 'fa-check-circle',
        error: 'fa-times-circle',
        warning: 'fa-exclamation-triangle',
        info: 'fa-info-circle'
    };

    toast.innerHTML = `
        <i class="fas ${icons[type]} toast-icon"></i>
        <span class="toast-message">${message}</span>
    `;

    elements.toastContainer.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'slideIn 0.3s ease reverse';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function copyPrompt(promptId) {
    const text = document.getElementById(promptId).value;
    navigator.clipboard.writeText(text).then(() => {
        showToast('프롬프트가 복사되었습니다', 'success');
    });
}

// ============================================
// Utility Functions
// ============================================
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Convert base64 string to Blob for audio playback
function base64ToBlob(base64, contentType = 'audio/mpeg') {
    try {
        // Remove any whitespace or newlines from base64 string
        const cleanBase64 = base64.replace(/\s/g, '');

        const byteCharacters = atob(cleanBase64);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        return new Blob([byteArray], { type: contentType });
    } catch (error) {
        console.error('Error converting base64 to blob:', error);
        return null;
    }
}

// Korean → English prompt synchronization using backend translation API
async function syncKoreanToEnglish(koreanText) {
    if (!koreanText || koreanText.trim().length === 0) return;

    // Show loading indicator
    elements.promptEnglish.placeholder = "번역 중...";

    try {
        const response = await fetch(`${CONFIG.ragServerUrl}/api/translate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                text: koreanText,
                source_lang: 'ko',
                target_lang: 'en'
            })
        });

        const data = await response.json();

        if (data.success && data.translated) {
            // Check if translation still has Korean characters (verification step)
            const hasKorean = /[\uAC00-\uD7AF]/.test(data.translated);

            if (hasKorean) {
                console.warn('API translation returned mixed content, using local fallback');
                localSyncKoreanToEnglish(koreanText);
            } else {
                elements.promptEnglish.value = data.translated;
                state.generatedPromptEn = data.translated;
                elements.promptEnglish.placeholder = "";
            }
        } else {
            // Fallback: use local keyword replacement
            localSyncKoreanToEnglish(koreanText);
        }
    } catch (error) {
        console.error('Translation API error:', error);
        // Fallback: use local keyword replacement
        localSyncKoreanToEnglish(koreanText);
    }
}

// Local fallback translation - use full English template instead of partial translation
function localSyncKoreanToEnglish(koreanText) {
    // Check if text contains Korean characters
    const hasKorean = /[\uAC00-\uD7AF]/.test(koreanText);

    if (hasKorean) {
        // Korean detected - generate proper English prompt based on current settings
        const style = state.customSettings.stylePreset || 'normal';
        const emotion = state.customSettings.emotion || 'normal';
        const styleInfo = STYLE_PRESETS[style] || STYLE_PRESETS.normal;
        const emotionInfo = EMOTIONS[emotion] || EMOTIONS.normal;

        // Build comprehensive English prompt
        let englishPrompt = `Speak in a ${styleInfo.promptEn || 'natural and clear'} manner. `;
        englishPrompt += `The emotional tone should be ${emotionInfo.promptEn || 'neutral'}. `;
        englishPrompt += `Maintain natural pacing and clear articulation. `;
        englishPrompt += `Use gentle pauses for emphasis. `;

        // Add context from analysis if available
        if (state.analysisPromptEn) {
            englishPrompt += state.analysisPromptEn;
        } else {
            englishPrompt += 'Deliver with warmth and professionalism.';
        }

        elements.promptEnglish.value = englishPrompt;
        state.generatedPromptEn = englishPrompt;
    } else {
        // No Korean, keep as is
        elements.promptEnglish.value = koreanText;
        state.generatedPromptEn = koreanText;
    }
}

// ============================================
// Global Functions
// ============================================
window.previewRecommendation = previewRecommendation;
window.selectRecommendation = selectRecommendation;
window.playSegment = playSegment;
window.downloadSegment = downloadSegment;
window.testApiKey = testApiKey;
window.copyPrompt = copyPrompt;

