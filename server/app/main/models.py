from app import db
from datetime import datetime, timezone
from sqlalchemy import Column, Integer, ForeignKey, DateTime, String, Text
from flask import current_app


# Модель для таблицы users
class User(db.Model):
    __bind_key__ = 'main'
    __tablename__ = 'users'  # Название таблицы в нижнем регистре
    user_id = Column(Integer, primary_key=True)
    user_name = Column(Text)
    avatar_src = Column(Text)

    @staticmethod
    def add_initial_users():
        # Проверяем, есть ли пользователи уже в базе данных
        if not User.query.all():  # если база пуста
            users = [
                User(user_name="Me", avatar_src="me.png"),
                User(user_name="Secretary", avatar_src="secretary.png"),
            ]
            db.session.bulk_save_objects(users)
            db.session.commit()
            current_app.logger.info("Initial users added.")
        else:
            pass
            # current_app.logger.info("Users already exist.")

    def to_dict(self):
        return {
            'id': self.user_id,
            'user_name': self.user_name,
            'avatar_src': self.avatar_src
        }


# Модель для таблицы chat_history
class ChatHistory(db.Model):
    __bind_key__ = 'main'
    __tablename__ = 'chat_history'  # Название таблицы в нижнем регистре
    message_id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.user_id'))  # Название таблицы в нижнем регистре
    datetime = Column(DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))
    text = Column(Text)
    files = Column(Text)
    position = Column(Text)
    user = db.relationship('User', backref='messages', lazy=True)

    def to_dict(self):
        return {
            'message_id': str(self.message_id),
            'user': self.user.to_dict(),
            'text': self.text,
            'datetime': self.datetime.isoformat() + 'Z',
            'files': self.files,
        }


# Модель для таблицы quotes
class Quote(db.Model):
    __bind_key__ = 'main'
    __tablename__ = 'quotes'  # Название таблицы в нижнем регистре
    quote_id = Column(Integer, primary_key=True)
    quote = Column(String(255))  # Использование String вместо Text для коротких строковых полей
