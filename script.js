let apiKey = '';
let chatHistory = [];

// Initialize the app
function init() {
    const savedApiKey = localStorage.getItem('gemini_api_key');
    if (savedApiKey) {
        apiKey = savedApiKey;
        showChat();
    } else {
        showApiSetup();
    }
}

function showApiSetup() {
    document.getElementById('apiSetup').classList.add('show');
    document.getElementById('chatContainer').style.display = 'none';
}

function showChat() {
    document.getElementById('apiSetup').classList.remove('show');
    document.getElementById('chatContainer').style.display = 'flex';
    document.getElementById('messageInput').focus();
}

function saveApiKey() {
    const input = document.getElementById('apiKeyInput');
    const key = input.value.trim();
    
    if (!key) {
        alert('Please enter a valid API key');
        return;
    }
    
    apiKey = key;
    localStorage.setItem('gemini_api_key', key);
    showChat();
}

// Chat functionality
function addMessage(content, isUser = false) {
    const messagesContainer = document.getElementById('chatMessages');
    const welcomeMessage = messagesContainer.querySelector('.welcome-message');
    
    if (welcomeMessage) {
        welcomeMessage.remove();
    }

    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isUser ? 'user' : 'assistant'}`;
    
    messageDiv.innerHTML = `
        <div class="message-avatar">${isUser ? 'U' : '🥗'}</div>
        <div class="message-content">${content}</div>
    `;
    
    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function showLoading(show = true) {
    const loading = document.getElementById('loadingIndicator');
    const sendBtn = document.getElementById('sendBtn');
    
    if (show) {
        loading.classList.add('show');
        sendBtn.disabled = true;
        sendBtn.textContent = 'Sending...';
    } else {
        loading.classList.remove('show');
        sendBtn.disabled = false;
        sendBtn.textContent = 'Send';
    }
}

async function sendMessage(message) {
    if (!message.trim()) return;
    
    // Add user message
    addMessage(message, true);
    chatHistory.push({role: 'user', parts: [{text: message}]});
    
    showLoading(true);
    
    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [
                    {
                        role: 'user',
                        parts: [{
                            text: `You are a professional nutritionist and dietician assistant. Please provide helpful, accurate, and practical advice about nutrition, diet, and healthy eating. Here's the user's question: ${message}`
                        }]
                    }
                ],
                generationConfig: {
                    temperature: 0.7,
                    topK: 40,
                    topP: 0.95,
                    maxOutputTokens: 1024,
                }
            })
        });

        if (!response.ok) {
            throw new Error(`API Error: ${response.status}`);
        }

        const data = await response.json();
        
        if (data.candidates && data.candidates[0] && data.candidates[0].content) {
            const aiResponse = data.candidates[0].content.parts[0].text;
            addMessage(aiResponse);
            chatHistory.push({role: 'model', parts: [{text: aiResponse}]});
        } else {
            throw new Error('Unexpected response format');
        }
        
    } catch (error) {
        console.error('Error:', error);
        let errorMessage = 'Sorry, I encountered an error. Please check your API key and try again.';
        
        if (error.message.includes('403')) {
            errorMessage = 'API key is invalid or has no access. Please check your Gemini API key.';
        } else if (error.message.includes('429')) {
            errorMessage = 'Rate limit exceeded. Please wait a moment and try again.';
        }
        
        addMessage(errorMessage);
    } finally {
        showLoading(false);
    }
}

function askQuestion(question) {
    document.getElementById('messageInput').value = question;
    sendMessage(question);
    document.getElementById('messageInput').value = '';
}

// Event listeners
document.addEventListener('DOMContentLoaded', function() {
    // Initialize app when DOM is loaded
    init();
    
    // Chat form submission
    document.getElementById('chatForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const input = document.getElementById('messageInput');
        const message = input.value.trim();
        
        if (message) {
            sendMessage(message);
            input.value = '';
        }
    });

    // Enter key handling
    document.getElementById('messageInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            document.getElementById('chatForm').dispatchEvent(new Event('submit'));
        }
    });
});

// Initialize app when page loads (backup)
window.addEventListener('load', init);