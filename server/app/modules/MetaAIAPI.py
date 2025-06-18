from meta_ai_api import MetaAI
import json
import requests


def get_meta_ai_response(message):

    # proxy = {
    #     'http': 'http://159.65.245.255:80',
    #     'https': 'https://160.86.242.23:8080'
    # }

    try:
        # ai = MetaAI(proxy=proxy)
        ai = MetaAI()
        response = ai.prompt(message=message)
        return response
    except Exception as e:
        print(f"Error: {e}")
        return {'message': f"Error: {e}"}


def get_eden_ai_response(message):
    headers = {"Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiYjdhNTY4ZjMtMDI0ZS00Yzg4LWE0NzctNTA5NTljYTg2Zjk0IiwidHlwZSI6ImFwaV90b2tlbiJ9.KbnFHZXRn1DZJ_-yAQRS8qKykVlxgTYt4gNhW9KQkXw"}

    provider = "openai/gpt-4"
    url = "https://api.edenai.run/v2/text/chat"
    payload = {
        "providers": provider,
        "text": message,
        "chatbot_global_action": "Ты девушка-секретарь. Старайся отвечать кратко и по делу. Укладывай ответ в 200 "
                                 "символов. Общайся менее официально и более по дружески. "
                                 "Помимо деловых у нас еще и дружеские отношения",
        "previous_history": [],
        "temperature": 0.0,
        "max_tokens": 200,
    }

    try:
        response = requests.post(url, json=payload, headers=headers)

        result = json.loads(response.text)
        print(result)
        print(result[provider]['generated_text'])
        return {'message':  result[provider]['generated_text']}
    except Exception as e:
        print(f"Error: {e}")
        return {'message': f"Error: {e}"}