/**
 * E-Immo Chatbot Widget
 * Widget de chat IA pour le site public
 */

(function() {
    'use strict';
    
    const CHATBOT_API = 'http://localhost:3000/api/ai/chat';
    
    const ChatbotWidget = {
        config: {
            position: 'bottom-right',
            theme: 'dark',
            accentColor: '#e94560'
        },
        
        init() {
            this.createWidget();
            this.loadChatHistory();
            this.setupEventListeners();
        },
        
        createWidget() {
            // Create widget container
            const widget = document.createElement('div');
            widget.id = 'immo-chatbot';
            widget.innerHTML = `
                <div class="chatbot-toggle" id="chatbotToggle">
                    <span class="chat-icon">💬</span>
                    <span class="chat-badge" id="chatBadge" style="display:none;">●</span>
                </div>
                <div class="chatbot-window" id="chatbotWindow">
                    <div class="chatbot-header">
                        <div class="chatbot-title">
                            <span class="chat-icon">🏠</span>
                            <span>E-Immo Assistant</span>
                        </div>
                        <button class="chat-close" id="chatClose">×</button>
                    </div>
                    <div class="chatbot-messages" id="chatMessages">
                        <div class="chat-message bot">
                            <div class="bubble">
                                Bonjour! 👋 Je suis votre assistant immobilier E-Immo.
                                <br><br>
                                Je peux vous aider à:
                                <br>• Trouver des propriétés
                                <br>• Estimer un prix
                                <br>• Répondre à vos questions
                                <br><br>
                                Comment puis-je vous aider?
                            </div>
                        </div>
                    </div>
                    <div class="chatbot-input">
                        <input type="text" id="chatInput" placeholder="Tapez votre message...">
                        <button id="chatSend">➤</button>
                    </div>
                </div>
            `;
            
            // Add styles
            const styles = document.createElement('style');
            styles.textContent = `
                #immo-chatbot {
                    position: fixed;
                    ${this.config.position}: 20px;
                    bottom: 20px;
                    z-index: 10000;
                    font-family: 'Segoe UI', system-ui, sans-serif;
                }
                
                .chatbot-toggle {
                    width: 60px;
                    height: 60px;
                    background: linear-gradient(135deg, #e94560, #ff6b6b);
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    box-shadow: 0 4px 20px rgba(233,69,96,0.4);
                    transition: transform 0.3s;
                }
                
                .chatbot-toggle:hover {
                    transform: scale(1.1);
                }
                
                .chatbot-toggle .chat-icon {
                    font-size: 28px;
                }
                
                .chat-badge {
                    position: absolute;
                    top: -5px;
                    right: -5px;
                    width: 15px;
                    height: 15px;
                    background: #00c853;
                    border-radius: 50%;
                    border: 2px solid #fff;
                }
                
                .chatbot-window {
                    display: none;
                    position: absolute;
                    bottom: 70px;
                    right: 0;
                    width: 380px;
                    height: 500px;
                    background: #0a0a0a;
                    border: 1px solid rgba(255,255,255,0.1);
                    border-radius: 16px;
                    overflow: hidden;
                    flex-direction: column;
                }
                
                .chatbot-window.open {
                    display: flex;
                }
                
                .chatbot-header {
                    padding: 16px;
                    background: linear-gradient(135deg, #e94560, #ff6b6b);
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                
                .chatbot-title {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    font-weight: 600;
                    color: #fff;
                }
                
                .chat-close {
                    background: none;
                    border: none;
                    color: #fff;
                    font-size: 24px;
                    cursor: pointer;
                }
                
                .chatbot-messages {
                    flex: 1;
                    padding: 16px;
                    overflow-y: auto;
                }
                
                .chat-message {
                    margin-bottom: 12px;
                    display: flex;
                }
                
                .chat-message.user {
                    justify-content: flex-end;
                }
                
                .chat-message .bubble {
                    padding: 12px 16px;
                    border-radius: 16px;
                    max-width: 80%;
                    font-size: 14px;
                    line-height: 1.5;
                }
                
                .chat-message.bot .bubble {
                    background: rgba(255,255,255,0.1);
                    color: #fff;
                    border-bottom-left-radius: 4px;
                }
                
                .chat-message.user .bubble {
                    background: linear-gradient(135deg, #e94560, #ff6b6b);
                    color: #fff;
                    border-bottom-right-radius: 4px;
                }
                
                .chat-message.typing .bubble {
                    color: #666;
                    font-style: italic;
                }
                
                .chatbot-input {
                    padding: 12px;
                    border-top: 1px solid rgba(255,255,255,0.1);
                    display: flex;
                    gap: 8px;
                }
                
                .chatbot-input input {
                    flex: 1;
                    padding: 12px 16px;
                    background: rgba(255,255,255,0.05);
                    border: 1px solid rgba(255,255,255,0.1);
                    border-radius: 24px;
                    color: #fff;
                    font-size: 14px;
                }
                
                .chatbot-input input:focus {
                    outline: none;
                    border-color: #e94560;
                }
                
                .chatbot-input button {
                    width: 44px;
                    height: 44px;
                    background: linear-gradient(135deg, #e94560, #ff6b6b);
                    border: none;
                    border-radius: 50%;
                    color: #fff;
                    font-size: 18px;
                    cursor: pointer;
                }
                
                @media (max-width: 480px) {
                    #immo-chatbot {
                        right: 10px;
                        bottom: 10px;
                    }
                    
                    .chatbot-window {
                        width: calc(100vw - 20px);
                        height: calc(100vh - 100px);
                        right: -10px;
                    }
                }
            `;
            
            document.head.appendChild(styles);
            document.body.appendChild(widget);
        },
        
        loadChatHistory() {
            const history = localStorage.getItem('immo_chat_history');
            if (history) {
                const messages = JSON.parse(history);
                messages.forEach(msg => {
                    this.addMessage(msg.text, msg.sender);
                });
            }
        },
        
        saveChatHistory() {
            const messages = [];
            document.querySelectorAll('.chat-message').forEach(el => {
                messages.push({
                    text: el.querySelector('.bubble').textContent,
                    sender: el.classList.contains('user') ? 'user' : 'bot'
                });
            });
            localStorage.setItem('immo_chat_history', JSON.stringify(messages));
        },
        
        setupEventListeners() {
            // Toggle chat
            document.getElementById('chatbotToggle').addEventListener('click', () => {
                this.toggleChat();
            });
            
            document.getElementById('chatClose').addEventListener('click', () => {
                this.toggleChat();
            });
            
            // Send message
            document.getElementById('chatSend').addEventListener('click', () => {
                this.sendMessage();
            });
            
            document.getElementById('chatInput').addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.sendMessage();
            });
        },
        
        toggleChat() {
            const window = document.getElementById('chatbotWindow');
            window.classList.toggle('open');
            
            const toggle = document.getElementById('chatbotToggle');
            toggle.style.display = window.classList.contains('open') ? 'none' : 'flex';
        },
        
        addMessage(text, sender) {
            const container = document.getElementById('chatMessages');
            const div = document.createElement('div');
            div.className = `chat-message ${sender}`;
            div.innerHTML = `<div class="bubble">${text}</div>`;
            container.appendChild(div);
            container.scrollTop = container.scrollHeight;
        },
        
        async sendMessage() {
            const input = document.getElementById('chatInput');
            const message = input.value.trim();
            
            if (!message) return;
            
            // Add user message
            this.addMessage(message, 'user');
            input.value = '';
            
            // Show typing indicator
            const container = document.getElementById('chatMessages');
            const typing = document.createElement('div');
            typing.className = 'chat-message bot typing';
            typing.innerHTML = '<div class="bubble">Écrit...</div>';
            container.appendChild(typing);
            container.scrollTop = container.scrollHeight;
            
            try {
                const response = await fetch(CHATBOT_API, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ message })
                });
                
                const data = await response.json();
                
                // Remove typing
                container.removeChild(typing);
                
                // Add bot response
                this.addMessage(data.response || 'Désolé, je n\'ai pas compris. Pouvez-vous reformuler?', 'bot');
                
                // Save history
                this.saveChatHistory();
                
            } catch (e) {
                // Remove typing
                container.removeChild(typing);
                
                // Add error message
                this.addMessage('Service temporairement indisponible. Veuillez réessayer plus tard.', 'bot');
            }
        }
    };
    
    // Initialize on load
    document.addEventListener('DOMContentLoaded', () => {
        ChatbotWidget.init();
    });
    
    // Export
    window.ChatbotWidget = ChatbotWidget;
    
})();