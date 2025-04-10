document.addEventListener('DOMContentLoaded', function () {
    const chatContainer = document.getElementById('chat-container');
    const userInput = document.getElementById('user-input');
    const sendButton = document.getElementById('send-button');
    const deleteButton = document.getElementById('delete-button');

    sendButton.addEventListener('click', sendMessage);
    userInput.addEventListener('keypress', function (e) {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });
    deleteButton.addEventListener('click', deleteChatHistory);

    async function sendMessage() {
        const message = userInput.value.trim();
        if (message === '') return;

        addMessageToChat('user', message);
        userInput.value = '';

        const response = await fetch('http://127.0.0.1:5000/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ user_input: message })
        });
        const data = await response.json();
        addMessageToChat('bot', data.bot_response);
    }

    function addMessageToChat(sender, text) {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message');

        if (sender === 'user') {
            messageDiv.classList.add('user-message');
        } else {
            messageDiv.classList.add('bot-message');
        }

        messageDiv.textContent = text;
        chatContainer.appendChild(messageDiv);
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }

    async function deleteChatHistory() {
        const response = await fetch('http://127.0.0.1:5000/delete_chats', {
            method: 'DELETE'
        });
        const data = await response.json();
        chatContainer.innerHTML = '';
        addMessageToChat('bot', data.message || 'Chat history deleted.');
    }
});
