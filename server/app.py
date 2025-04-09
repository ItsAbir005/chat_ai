import google.generativeai as genai
from pymongo import MongoClient
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)
client = MongoClient("mongodb://localhost:27017/")
db = client["chat_db"]
chat_collection = db["chats"]

genai.configure(api_key="AIzaSyAgPE0HUIiLbF8NTx3Af04SR7UptUlYeSg")  
model = genai.GenerativeModel('gemini-2.0-flash')

@app.route('/chat', methods=['POST'])
def chat():
    data = request.get_json()
    user_input = data.get('user_input')
    response = model.generate_content(user_input)
    bot_response = response.text

    chat_collection.insert_one({
        'user': user_input,
        'bot': bot_response
    })

    return jsonify({'bot_response': bot_response})

@app.route('/get_chats', methods=['GET'])
def get_chats():
    chats = list(chat_collection.find({}, {"_id": 0, "user": 1, "bot": 1}))
    return jsonify(chats)
@app.route('/delete_chats', methods=['DELETE'])
def delete_chat():
    result = chat_collection.delete_many({})  
    return jsonify({'message': 'All chats deleted', 'deleted_count': result.deleted_count})
if __name__ == '__main__':
    app.run(debug=True)

