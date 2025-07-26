// Enhanced Chat Management System
class ChatManager {
    constructor() {
        this.participants = new Map();
        this.messageHistory = [];
        this.activeTypers = new Set();
        this.participantCount = 0;
        this.messageIdCounter = 1;
        
        // Initialize with some realistic demo data
        this.initializeDemoEnvironment();
    }

    initializeDemoEnvironment() {
        // Add some demo participants for realistic feel
        const demoUsers = [
            'Alexandra Chen', 'Marcus Rodriguez', 'Sarah Johnson', 
            'David Kim', 'Emma Thompson'
        ];
        
        demoUsers.forEach((name, index) => {
            const demoId = `demo_user_${index + 1}_${Date.now()}`;
            this.addParticipant(demoId, name);
        });
    }

    addParticipant(userId, displayName) {
        this.participants.set(userId, { 
            displayName, 
            userId, 
            joinedAt: new Date(),
            isActive: true
        });
        this.participantCount++;
        return { success: true };
    }

    removeParticipant(userId) {
        const participant = this.participants.get(userId);
        if (participant) {
            this.participants.delete(userId);
            this.activeTypers.delete(userId);
            this.participantCount--;
            return participant;
        }
        return null;
    }

    createMessage(userId, content) {
        const participant = this.participants.get(userId);
        if (!participant || !content.trim()) return { success: false };

        const messageObj = {
            messageId: this.messageIdCounter++,
            displayName: participant.displayName,
            content: content.trim(),
            createdAt: new Date(),
            senderId: userId,
            messageType: 'user'
        };
        
        this.messageHistory.push(messageObj);
        
        // Clear typing status when message is sent
        this.updateTypingStatus(userId, false);
        
        return { success: true, messageData: messageObj };
    }

    updateTypingStatus(userId, isCurrentlyTyping) {
        const participant = this.participants.get(userId);
        if (!participant) return;

        if (isCurrentlyTyping) {
            this.activeTypers.add(userId);
        } else {
            this.activeTypers.delete(userId);
        }
    }

    getActiveTypers(excludeUserId) {
        const typerNames = [];
        for (const userId of this.activeTypers) {
            if (userId !== excludeUserId) {
                const participant = this.participants.get(userId);
                if (participant) typerNames.push(participant.displayName);
            }
        }
        return typerNames;
    }

    createSystemMessage(content) {
        const systemMsg = {
            messageId: this.messageIdCounter++,
            content: content,
            createdAt: new Date(),
            messageType: 'system'
        };
        this.messageHistory.push(systemMsg);
        return systemMsg;
    }
}

// Application State Management
const chatSystem = new ChatManager();
let currentUser = null;
let currentUserId = null;
let typingTimeout = null;
let autoResponseTimer = null;

// DOM Element References
const chatContainer = document.getElementById('chatMessages');
const messageField = document.getElementById('textInput');
const sendButton = document.getElementById('submitBtn');
const participantDisplay = document.getElementById('userCounter');
const typingIndicator = document.getElementById('typingStatus');
const typingText = document.getElementById('typingText');
const welcomeModal = document.getElementById('welcomeScreen');
const nameField = document.getElementById('nameInput');

// Initialize chat session
function initializeChat() {
    const userName = nameField.value.trim();
    if (userName.length < 2) {
        alert('Please enter a valid name (minimum 2 characters)');
        return;
    }

    // Generate unique user session
    currentUserId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    currentUser = userName;
    
    // Register user in system
    chatSystem.addParticipant(currentUserId, userName);
    
    // Hide welcome screen
    welcomeModal.style.display = 'none';
    
    // Add welcome message
    const welcomeMsg = chatSystem.createSystemMessage(`${userName} joined the conversation`);
    displaySystemMessage(welcomeMsg);
    
    // Update UI
    updateParticipantCount();
    messageField.focus();
    
    // Start demo activity
    scheduleAutomaticResponses();
}

// Send user message
function publishMessage() {
    const messageText = messageField.value.trim();
    if (messageText === '' || !currentUserId) return;

    // Create and store message
    const result = chatSystem.createMessage(currentUserId, messageText);
    if (result.success) {
        displayUserMessage(result.messageData, true);
        messageField.value = '';
        autoResizeTextarea();
        
        // Trigger demo responses
        scheduleAutomaticResponses();
    }
}

// Display user message in chat
function displayUserMessage(messageData, isSentByCurrentUser = false) {
    const messageElement = document.createElement('div');
    messageElement.className = `message-item ${isSentByCurrentUser ? 'sent' : ''}`;
    
    const timeString = messageData.createdAt.toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit' 
    });
    
    messageElement.innerHTML = `
        <div class="message-content">
            <div class="message-header">
                <span class="username-badge">${escapeHtmlContent(messageData.displayName)}</span>
                <span class="timestamp">${timeString}</span>
            </div>
            <div class="message-bubble">${escapeHtmlContent(messageData.content)}</div>
        </div>
    `;
    
    chatContainer.appendChild(messageElement);
    scrollToLatestMessage();
}

// Display system notifications
function displaySystemMessage(messageData) {
    const notificationElement = document.createElement('div');
    notificationElement.className = 'system-notification';
    notificationElement.textContent = messageData.content;
    chatContainer.appendChild(notificationElement);
    scrollToLatestMessage();
}

// Demo response system for realistic chat experience
function scheduleAutomaticResponses() {
    clearTimeout(autoResponseTimer);
    
    // Random delay between 2-8 seconds
    const delay = Math.random() * 6000 + 2000;
    
    autoResponseTimer = setTimeout(() => {
        generateDemoResponse();
    }, delay);
}

function generateDemoResponse() {
    // Predefined realistic responses
    const responses = [
        "That's really interesting! 🤔",
        "I completely agree with that point",
        "Thanks for sharing your thoughts!",
        "Great to have you here! 👋",
        "How has everyone been doing lately?",
        "That makes a lot of sense",
        "Interesting perspective on that topic",
        "Hope everyone is having a good day! ☀️",
        "I've been thinking about that too",
        "Really good point there"
    ];
    
    // Get random demo participant
    const demoParticipants = Array.from(chatSystem.participants.values())
        .filter(p => p.userId !== currentUserId && p.userId.startsWith('demo_'));
    
    if (demoParticipants.length === 0) return;
    
    const randomParticipant = demoParticipants[Math.floor(Math.random() * demoParticipants.length)];
    const randomResponse = responses[Math.floor(Math.random() * responses.length)];
    
    // Show typing indicator first
    displayTypingIndicator([randomParticipant.displayName]);
    
    setTimeout(() => {
        hideTypingIndicator();
        
        // Create and display response
        const result = chatSystem.createMessage(randomParticipant.userId, randomResponse);
        if (result.success) {
            displayUserMessage(result.messageData, false);
            
            // Schedule next response
            scheduleAutomaticResponses();
        }
    }, Math.random() * 2000 + 1000);
}

// Typing indicator management
function handleUserTyping() {
    if (!currentUserId) return;
    
    chatSystem.updateTypingStatus(currentUserId, true);
    
    clearTimeout(typingTimeout);
    typingTimeout = setTimeout(() => {
        chatSystem.updateTypingStatus(currentUserId, false);
    }, 3000);
}

function displayTypingIndicator(userNames) {
    if (userNames.length > 0) {
        const displayText = userNames.length === 1 
            ? `${userNames[0]} is typing`
            : `${userNames.slice(0, -1).join(', ')} and ${userNames[userNames.length - 1]} are typing`;
        
        typingText.textContent = displayText;
        typingIndicator.style.display = 'flex';
    }
}

function hideTypingIndicator() {
    typingIndicator.style.display = 'none';
}

// UI Helper Functions
function updateParticipantCount() {
    const count = chatSystem.participantCount;
    participantDisplay.textContent = `${count} participant${count !== 1 ? 's' : ''} online`;
}

function escapeHtmlContent(text) {
    const tempDiv = document.createElement('div');
    tempDiv.textContent = text;
    return tempDiv.innerHTML;
}

function scrollToLatestMessage() {
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

function autoResizeTextarea() {
    messageField.style.height = 'auto';
    messageField.style.height = Math.min(messageField.scrollHeight, 120) + 'px';
}

// Event Listeners Setup
messageField.addEventListener('keypress', (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        publishMessage();
    } else {
        handleUserTyping();
    }
});

messageField.addEventListener('input', autoResizeTextarea);

nameField.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
        initializeChat();
    }
});

// Application Initialization
document.addEventListener('DOMContentLoaded', () => {
    nameField.focus();
    
    // Add initial system message
    setTimeout(() => {
        const welcomeMsg = chatSystem.createSystemMessage('Welcome to ConnectChat! Connect with people in real-time.');
        displaySystemMessage(welcomeMsg);
    }, 1000);
});

// Initialize some demo activity
setTimeout(() => {
    const demoParticipants = Array.from(chatSystem.participants.values())
        .filter(p => p.userId.startsWith('demo_'));
    
    if (demoParticipants.length > 0) {
        const welcomer = demoParticipants[0];
        const result = chatSystem.createMessage(welcomer.userId, 'Hello everyone! Welcome to our chat room. Feel free to introduce yourselves! 😊');
        if (result.success) {
            displayUserMessage(result.messageData, false);
            updateParticipantCount();
        }
    }
}, 3000);