const contacts = [
    { id: 1, name: 'John Doe', avatar: '👨', language: 'es' },
    { id: 2, name: 'Jane Smith', avatar: '👩', language: 'fr' },
    { id: 3, name: 'Mike Johnson', avatar: '👨‍💼', language: 'de' },
    { id: 4, name: 'Sarah Williams', avatar: '👩‍💻', language: 'it' }
];

const supportedLanguages = [
    { code: 'en', label: 'English' },
    { code: 'es', label: 'Spanish' },
    { code: 'fr', label: 'French' },
    { code: 'de', label: 'German' },
    { code: 'it', label: 'Italian' },
    { code: 'pt', label: 'Portuguese' },
    { code: 'ru', label: 'Russian' },
    { code: 'ja', label: 'Japanese' },
    { code: 'ko', label: 'Korean' },
    { code: 'zh', label: 'Chinese' },
    { code: 'hi', label: 'Hindi' },
    { code: 'ta', label: 'Tamil' }
];

const userLanguage = 'en';
// Google Translate API endpoint (free, no API key required)
const GOOGLE_TRANSLATE_API = 'https://translate.googleapis.com/translate_a/single';
const translateTimeout = 10000;
const languageSelect = document.getElementById('languageSelect');

// Optional: If you have a Google Cloud Translation API key, set it here
// const GOOGLE_CLOUD_API_KEY = 'YOUR_API_KEY_HERE';
// const GOOGLE_CLOUD_ENDPOINT = 'https://translation.googleapis.com/language/translate/v2';

let currentContact = null;
let messages = {
    1: [
        { id: 1, text: 'Hey there!', sender: 'received', time: '10:30 AM' },
        { id: 2, text: 'Hello! How are you?', sender: 'sent', time: '10:32 AM' }
    ]
};

function loadContacts() {
    const container = document.getElementById('contacts');
    container.innerHTML = contacts.map(contact => `
                <div class="contact-item" onclick="selectContact(${contact.id})">
                    <div class="d-flex align-items-center">
                        <div class="contact-avatar">${contact.avatar}</div>
                        <div class="contact-info">
                            <div class="contact-name">${contact.name}</div>
                            <div class="contact-language">${contact.language.toUpperCase()}</div>
                        </div>
                    </div>
                </div>
            `).join('');
}

function selectContact(id) {
    currentContact = contacts.find(c => c.id === id);
    document.getElementById('chatName').textContent = currentContact.name;
    document.querySelectorAll('.contact-item').forEach((el, i) => {
        el.classList.toggle('active', contacts[i].id === id);
    });
    loadMessages();
    showChatView();
}

function showChatView() {
    const sidebar = document.querySelector('.sidebar');
    const chatArea = document.querySelector('.chat-area');
    const emptyState = document.querySelector('.empty-chat-state');

    // Check if mobile view (width <= 768px)
    if (window.innerWidth <= 768) {
        sidebar.classList.add('hidden');
        chatArea.classList.remove('hidden');
        if (emptyState) emptyState.classList.remove('show');
    } else {
        sidebar.classList.remove('hidden');
        chatArea.classList.remove('hidden');
        if (emptyState) emptyState.classList.remove('show');
    }
}

function goBackToContacts() {
    const sidebar = document.querySelector('.sidebar');
    const chatArea = document.querySelector('.chat-area');
    const emptyState = document.querySelector('.empty-chat-state');

    // Only hide chat on mobile
    if (window.innerWidth <= 768) {
        sidebar.classList.remove('hidden');
        chatArea.classList.add('hidden');
        if (emptyState) emptyState.classList.add('show');
    }
}

// Handle window resize
window.addEventListener('resize', function () {
    if (window.innerWidth > 768) {
        // Desktop/Tablet: show both views
        const sidebar = document.querySelector('.sidebar');
        const chatArea = document.querySelector('.chat-area');
        const emptyState = document.querySelector('.empty-chat-state');
        sidebar.classList.remove('hidden');
        chatArea.classList.remove('hidden');
        if (emptyState && currentContact) {
            emptyState.classList.remove('show');
        } else if (emptyState && !currentContact) {
            emptyState.classList.add('show');
        }
    }
});

function populateLanguageSelect() {
    languageSelect.innerHTML = supportedLanguages.map(
        lang => `<option value="${lang.code}">${lang.label}</option>`
    ).join('');
    languageSelect.value = 'en';
}

function loadMessages() {
    const container = document.getElementById('messages');
    const emptyState = document.querySelector('.empty-chat-state');
    const messageInput = document.querySelector('.message-input');

    if (!currentContact) {
        if (emptyState) emptyState.classList.add('show');
        if (container) container.style.display = 'none';
        if (messageInput) messageInput.style.display = 'none';
        return;
    }

    if (emptyState) emptyState.classList.remove('show');
    if (container) container.style.display = 'flex';
    if (messageInput) messageInput.style.display = 'flex';

    const msgs = messages[currentContact.id] || [];
    container.innerHTML = msgs.map(msg => `
                <div class="message ${msg.sender}">
                    <div class="message-bubble">
                        <div class="message-text">${msg.text}</div>
                        ${msg.translated ? `<div class="translation"><div class="translation-label"><i class="fas fa-language"></i>Translation:</div>${msg.translated}</div>` : ''}
                        <div class="message-footer">
                            ${msg.isTranslating ? `<span style="color: #667781; font-size: 0.6875rem;"><i class="fas fa-spinner fa-spin"></i> Translating...</span>` :
            (!msg.translated ? `<button class="translate-btn" onclick="translateMessage(${msg.id})">
                                <i class="fas fa-language"></i> Translate
                            </button>` : '')}
                            <span class="message-time">${msg.time}</span>
                        </div>
                    </div>
                </div>
            `).join('');
    container.scrollTop = container.scrollHeight;
}

function sendMessage() {
    if (!currentContact) return;
    const input = document.getElementById('messageInput');
    const text = input.value.trim();
    if (!text) return;

    if (!messages[currentContact.id]) messages[currentContact.id] = [];
    messages[currentContact.id].push({
        id: Date.now(),
        text,
        sender: 'sent',
        time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    });

    input.value = '';
    loadMessages();
}

async function translateMessage(msgId) {
    if (!currentContact) return;
    const msg = messages[currentContact.id].find(m => m.id === msgId);
    if (!msg) return;

    const targetLang = languageSelect.value;
    const sourceLang = msg.sender === 'sent' ? userLanguage : currentContact.language;
    if (targetLang === sourceLang) {
        msg.translated = msg.text;
        loadMessages();
        return;
    }

    msg.isTranslating = true;
    loadMessages();

    try {
        const translatedText = await translateText(msg.text, sourceLang, targetLang);
        msg.translated = translatedText;
    } catch (error) {
        console.error(error);
        msg.translated = 'Translation unavailable. Please check your connection and try again.';
    } finally {
        delete msg.isTranslating;
        loadMessages();
    }
}

/**
 * Main translation function using Google Translate API
 * @param {string} text - Text to translate
 * @param {string} source - Source language code
 * @param {string} target - Target language code
 * @returns {Promise<string>} Translated text
 */
async function translateText(text, source, target) {
    // Auto-detect source language if 'auto' is provided
    if (source === 'auto' || !source) {
        source = 'auto';
    }

    try {
        // Try Google Translate free API first
        const translatedText = await translateWithGoogleAPI(text, source, target);
        return translatedText;
    } catch (error) {
        console.error('Google Translate API error:', error);
        throw new Error('Translation failed. Please try again.');
    }
}

/**
 * Translate using Google Translate API (free, no API key required)
 * @param {string} text - Text to translate
 * @param {string} source - Source language code
 * @param {string} target - Target language code
 * @returns {Promise<string>} Translated text
 */
async function translateWithGoogleAPI(text, source, target) {
    // Handle long text by splitting into chunks
    const maxLength = 5000;
    if (text.length > maxLength) {
        const chunks = splitTextIntoChunks(text, maxLength);
        const translatedChunks = [];

        for (const chunk of chunks) {
            const translated = await translateChunk(chunk, source, target);
            translatedChunks.push(translated);
        }

        return translatedChunks.join(' ');
    }

    return await translateChunk(text, source, target);
}

/**
 * Translate a single chunk of text
 */
async function translateChunk(text, source, target) {
    const url = `${GOOGLE_TRANSLATE_API}?client=gtx&sl=${source}&tl=${target}&dt=t&q=${encodeURIComponent(text)}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), translateTimeout);

    try {
        const response = await fetch(url, {
            method: 'GET',
            signal: controller.signal,
            headers: {
                'Accept': 'application/json'
            }
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        // Google Translate API returns data in format: [[["translated text",...],...],...]
        if (data && Array.isArray(data) && data[0] && Array.isArray(data[0])) {
            let translatedText = '';
            for (const item of data[0]) {
                if (item && item[0]) {
                    translatedText += item[0];
                }
            }
            return translatedText || text;
        }

        throw new Error('Invalid response format from Google Translate');
    } catch (error) {
        clearTimeout(timeoutId);
        if (error.name === 'AbortError') {
            throw new Error('Translation request timed out');
        }
        throw error;
    }
}

/**
 * Split long text into chunks for translation
 */
function splitTextIntoChunks(text, maxLength) {
    const chunks = [];
    let start = 0;

    while (start < text.length) {
        let end = Math.min(start + maxLength, text.length);

        // Try to break at sentence boundaries
        if (end < text.length) {
            const lastPeriod = text.lastIndexOf('.', end);
            const lastExclamation = text.lastIndexOf('!', end);
            const lastQuestion = text.lastIndexOf('?', end);
            const lastNewline = text.lastIndexOf('\n', end);

            const breakPoint = Math.max(lastPeriod, lastExclamation, lastQuestion, lastNewline);

            if (breakPoint > start + maxLength * 0.5) {
                end = breakPoint + 1;
            } else {
                // Fallback to word boundary
                const lastSpace = text.lastIndexOf(' ', end);
                if (lastSpace > start + maxLength * 0.5) {
                    end = lastSpace + 1;
                }
            }
        }

        chunks.push(text.slice(start, end).trim());
        start = end;
    }

    return chunks.filter(chunk => chunk.length > 0);
}

document.getElementById('messageInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendMessage();
});

languageSelect.addEventListener('change', () => {
    if (!currentContact) return;
    const msgs = messages[currentContact.id] || [];
    msgs.forEach(msg => delete msg.translated);
    loadMessages();
});

populateLanguageSelect();
loadContacts();

// Initialize mobile view
function initializeView() {
    if (window.innerWidth <= 768) {
        const sidebar = document.querySelector('.sidebar');
        const chatArea = document.querySelector('.chat-area');
        const emptyState = document.querySelector('.empty-chat-state');
        sidebar.classList.remove('hidden');
        chatArea.classList.add('hidden');
        if (emptyState) emptyState.classList.add('show');
    } else {
        const sidebar = document.querySelector('.sidebar');
        const chatArea = document.querySelector('.chat-area');
        const emptyState = document.querySelector('.empty-chat-state');
        sidebar.classList.remove('hidden');
        if (currentContact) {
            chatArea.classList.remove('hidden');
            if (emptyState) emptyState.classList.remove('show');
        } else {
            chatArea.classList.remove('hidden');
            if (emptyState) emptyState.classList.add('show');
        }
    }
}

// Initialize on load
initializeView();