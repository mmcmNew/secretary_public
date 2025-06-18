def new_twitch_message(data):
    user_name = data.get("author", "Anonymous")
    message = data.get("content", "")
    match user_name:
        case 'player_mmcm':
            answer = 'Добрый день'
        case 'mianamay':
            answer = ('Добро пожаловать, Диана. Как говорится, Все лучшее впереди, и начнется это прямо сейчас. '
                      'Рада видеть вас здесь.')
        case 'r8nna_':
            answer = ''
        case 'shapka_choppera':
            answer = ('Добро пожаловать на стрим Анастасия. Располагайтесь поудобнее. Как Ваши дела? Надеюсь не жала '
                      'на голову Чоппера сегодня')
        case _:
            answer = ''
    print(f"New message from {user_name}: {message}")
    return {"answer": answer}, 201
