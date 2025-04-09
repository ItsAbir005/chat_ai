document.addEventListener('DOMContentLoaded', function () {
    var chatContainer = document.getElementById('chat-container');
    var userInput = document.getElementById('user-input');
    var sendButton = document.getElementById('send-button');
    var deleteButton = document.getElementById('delete-button');

    sendButton.addEventListener('click', sendMessage);
    userInput.addEventListener('keypress', function (e) {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });
    deleteButton.addEventListener('click', deleteChatHistory);

    async function sendMessage() {
        var message = userInput.value.trim();
        if (message === '') return;

        addMessageToChat('user', message);
        userInput.value = '';

        var response = await fetch('http://127.0.0.1:5000/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ user_input: message })
        });
        var data = await response.json();
        addMessageToChat('bot', data.bot_response);
    }

    function addMessageToChat(sender, text) {
        var messageDiv = document.createElement('div');
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
        var response = await fetch('http://127.0.0.1:5000/delete_chats', {
            method: 'DELETE'
        });
        var data = await response.json();
        chatContainer.innerHTML = '';
        addMessageToChat('bot', data.message || 'Chat history deleted.');
    }
});
