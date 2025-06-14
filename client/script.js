document.addEventListener('DOMContentLoaded', function () {
    // === IMPORTANT: REPLACE THIS PLACEHOLDER WITH YOUR ACTUAL RENDER BACKEND URL ===
    // You can find this URL in your Render dashboard for your Flask web service.
    // Example: const BACKEND_URL = 'https://my-awesome-chat-api.onrender.com';
    const BACKEND_URL = 'https://chat-ai-wjg7.onrender.com';

    const chatContainer = document.getElementById('chat-container');
    const userInput = document.getElementById('user-input');
    const sendButton = document.getElementById('send-button');
    const deleteButton = document.getElementById('delete-button');

    // Event Listeners
    sendButton.addEventListener('click', sendMessage);
    userInput.addEventListener('keypress', function (e) {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });
    deleteButton.addEventListener('click', deleteChatHistory);

    // Initial load of chat history when the page loads
    fetchChatHistory();

    /**
     * Sends the user's message to the backend and displays the bot's response.
     */
    async function sendMessage() {
        const message = userInput.value.trim();
        if (message === '') return; // Prevent sending empty messages

        addMessageToChat('user', message); // Display user's message instantly
        userInput.value = ''; // Clear the input field

        try {
            // Make a POST request to your Render backend's /chat endpoint
            const response = await fetch(`${BACKEND_URL}/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ user_input: message }) // Send user input as JSON
            });

            if (!response.ok) {
                // If the HTTP response status is not OK (e.g., 404, 500), throw an error
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            addMessageToChat('bot', data.bot_response); // Display the bot's response

            if (data.warning) {
                // If the backend sends a warning (e.g., DB save failed), display it
                addMessageToChat('system', `Warning: ${data.warning}`);
            }

        } catch (error) {
            console.error('Error sending message:', error);
            addMessageToChat('system', 'Error: Could not get a response from the bot. Please check your network connection or try again later.');
        }
    }

    /**
     * Adds a message to the chat display in the UI.
     * @param {string} sender - The sender of the message ('user', 'bot', or 'system').
     * @param {string} text - The text content of the message.
     */
    function addMessageToChat(sender, text) {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message');

        // Add specific class for styling based on sender
        if (sender === 'user') {
            messageDiv.classList.add('user-message');
        } else if (sender === 'bot') {
            messageDiv.classList.add('bot-message');
        } else {
            messageDiv.classList.add('system-message'); // For system messages like errors or warnings
        }

        messageDiv.textContent = text;
        chatContainer.appendChild(messageDiv);
        // Scroll to the bottom to show the latest message
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }

    /**
     * Fetches the entire chat history from the backend and displays it.
     */
    async function fetchChatHistory() {
        try {
            // Make a GET request to your Render backend's /get_chats endpoint
            const response = await fetch(`${BACKEND_URL}/get_chats`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const chats = await response.json();
            chatContainer.innerHTML = ''; // Clear existing messages before loading history

            // Loop through the fetched chats and display them
            chats.forEach(chat => {
                addMessageToChat('user', chat.user);
                addMessageToChat('bot', chat.bot);
            });
        } catch (error) {
            console.error('Error fetching chat history:', error);
            addMessageToChat('system', 'Error: Could not load chat history. Please refresh the page.');
        }
    }

    /**
     * Deletes all chat history from the backend.
     */
    async function deleteChatHistory() {
        // Prompt for confirmation before deleting all history
        if (!confirm('Are you sure you want to clear all chat history? This action cannot be undone.')) {
            return; // Exit if the user cancels
        }

        try {
            // Make a DELETE request to your Render backend's /delete_chats endpoint
            const response = await fetch(`${BACKEND_URL}/delete_chats`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            chatContainer.innerHTML = ''; // Clear the frontend chat display
            // Display a confirmation message from the backend
            addMessageToChat('system', data.message || 'Chat history deleted successfully.');
        } catch (error) {
            console.error('Error deleting chat history:', error);
            addMessageToChat('system', 'Error: Could not delete chat history. Please try again.');
        }
    }
});
