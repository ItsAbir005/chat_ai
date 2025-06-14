import os
import google.generativeai as genai
from pymongo import MongoClient
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# Get MongoDB URI from environment variable
mongo_uri = os.environ.get("MONGO_URI")
if not mongo_uri:
    # Fallback for local development if MONGO_URI is not set
    # In production on Render, this environment variable will be set
    print("MONGO_URI environment variable not set. Using local MongoDB for development.")
    mongo_uri = "mongodb://localhost:27017/"

client = MongoClient(mongo_uri)
db = client["chat_db"]
chat_collection = db["chats"]

# Get API key from environment variable
genai_api_key = os.environ.get("GENAI_API_KEY")
if not genai_api_key:
    raise ValueError("GENAI_API_KEY environment variable not set.")

genai.configure(api_key=genai_api_key)
model = genai.GenerativeModel('gemini-2.0-flash')

@app.route('/chat', methods=['POST'])
def chat():
    """
    Handles chat requests. Takes user input, generates a bot response,
    and stores both in the MongoDB database.
    """
    data = request.get_json()
    user_input = data.get('user_input')

    if not user_input:
        return jsonify({'error': 'No user input provided'}), 400

    try:
        response = model.generate_content(user_input)
        bot_response = response.text
    except Exception as e:
        print(f"Error generating content: {e}")
        return jsonify({'error': 'Failed to get a response from the AI model'}), 500

    try:
        chat_collection.insert_one({
            'user': user_input,
            'bot': bot_response
        })
    except Exception as e:
        print(f"Error inserting chat into DB: {e}")
        # Even if DB insertion fails, still return the bot response
        return jsonify({'bot_response': bot_response, 'warning': 'Failed to save chat history'}), 200

    return jsonify({'bot_response': bot_response})

@app.route('/get_chats', methods=['GET'])
def get_chats():
    """
    Retrieves all chat history from the MongoDB database.
    """
    try:
        chats = list(chat_collection.find({}, {"_id": 0, "user": 1, "bot": 1}))
        return jsonify(chats)
    except Exception as e:
        print(f"Error retrieving chats from DB: {e}")
        return jsonify({'error': 'Failed to retrieve chat history'}), 500

@app.route('/delete_chats', methods=['DELETE'])
def delete_chat():
    """
    Deletes all chat history from the MongoDB database.
    """
    try:
        result = chat_collection.delete_many({})
        return jsonify({'message': 'All chats deleted', 'deleted_count': result.deleted_count})
    except Exception as e:
        print(f"Error deleting chats from DB: {e}")
        return jsonify({'error': 'Failed to delete chat history'}), 500

if __name__ == '__main__':
    # When deploying on Render, Render sets the PORT environment variable.
    # Flask needs to listen on this port.
    port = int(os.environ.get("PORT", 5000))
    app.run(host='0.0.0.0', port=port, debug=True)
