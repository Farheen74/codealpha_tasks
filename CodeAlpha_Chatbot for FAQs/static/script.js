// ==================== AI FAQ CHATBOT - JAVASCRIPT ====================

function sendMessage() {
    let input = document.getElementById("user-input");
    let message = input.value.trim();

    if (message === "") return;

    let chatBox = document.getElementById("chat-box");

    // Add user message with avatar
    chatBox.innerHTML += `
        <div class="message user-message">
            <div class="message-bubble">${escapeHtml(message)}</div>
            <div class="avatar user-avatar-img">👤</div>
        </div>`;

    // Show typing indicator
    let typingDiv = document.createElement('div');
    typingDiv.id = 'typing-indicator';
    typingDiv.className = 'message bot-message';
    typingDiv.innerHTML = `
        <div class="avatar bot-avatar-img">🤖</div>
        <div class="message-bubble">
            <div class="typing">
                <span></span>
                <span></span>
                <span></span>
            </div>
        </div>`;
    chatBox.appendChild(typingDiv);
    chatBox.scrollTop = chatBox.scrollHeight;

    // Send message to server
    fetch("/chat", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({message: message})
    })
    .then(res => res.json())
    .then(data => {
        // Remove typing indicator
        let typingIndicator = document.getElementById('typing-indicator');
        if (typingIndicator) typingIndicator.remove();

        // Add bot response with avatar
        chatBox.innerHTML += `
            <div class="message bot-message">
                <div class="avatar bot-avatar-img">🤖</div>
                <div class="message-bubble">${data.response}</div>
            </div>`;
        
        chatBox.scrollTop = chatBox.scrollHeight;
        
        // Update quick replies
        updateQuickReplies(data.quick_replies);
    })
    .catch(err => {
        let typingIndicator = document.getElementById('typing-indicator');
        if (typingIndicator) typingIndicator.remove();
        
        chatBox.innerHTML += `
            <div class="message bot-message">
                <div class="avatar bot-avatar-img">🤖</div>
                <div class="message-bubble">⚠️ Connection error. Please try again.</div>
            </div>`;
    });

    input.value = "";
}

// Handle quick reply clicks
function handleQuickReply(reply) {
    let input = document.getElementById("user-input");
    input.value = reply;
    sendMessage();
}

// Update quick replies section
function updateQuickReplies(replies) {
    let container = document.getElementById("quick-replies");
    
    if (!replies || replies.length === 0) {
        container.innerHTML = "";
        return;
    }
    
    let html = '<div class="quick-replies-label">Quick questions:</div>';
    html += '<div class="quick-replies-buttons">';
    
    replies.forEach(reply => {
        html += `<button class="quick-reply-btn" onclick="handleQuickReply('${reply}')">${reply}</button>`;
    });
    
    html += '</div>';
    container.innerHTML = html;
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    let div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Allow Enter key to send
document.getElementById("user-input").addEventListener("keypress", function(event) {
    if (event.key === "Enter") {
        sendMessage();
    }
});
