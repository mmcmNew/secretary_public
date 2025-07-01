from app import db
from flask_login import UserMixin
from datetime import datetime, timezone
from sqlalchemy import Column, Integer, ForeignKey, DateTime, String, Text
from flask import current_app
from werkzeug.security import generate_password_hash, check_password_hash


# Модель для таблицы users
class User(UserMixin, db.Model):
    __bind_key__ = 'app_session_meta'
    __tablename__ = 'users'  # Название таблицы в нижнем регистре
    user_id = Column(Integer, primary_key=True)
    user_name = Column(Text, unique=True)
    email = Column(String(255), unique=True)
    password_hash = Column(String(255))
    avatar_src = Column(Text)

    @property
    def id(self):
        return self.user_id

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        if not self.password_hash:
            return False
        return check_password_hash(self.password_hash, password)

    @staticmethod
    def add_initial_users():
        """Create default users only for the test configuration."""
        if current_app.config.get("CONFIG_TYPE") != "test":
            return

        # Проверяем, есть ли пользователи уже в базе данных
        if not User.query.all():  # если база пуста
            admin = User(user_name="admin", email="admin@example.com", avatar_src="me.png")
            admin.set_password("password")
            secretary = User(user_name="Secretary", avatar_src="secretary.png")
            db.session.add(admin)
            db.session.add(secretary)
            db.session.commit()
            current_app.logger.info("Initial users added.")

    def to_dict(self):
        return {
            'id': self.user_id,
            'user_name': self.user_name,
            'email': self.email,
            'avatar_src': self.avatar_src
        }


# Модель для таблицы chat_history
class ChatHistory(db.Model):
    __bind_key__ = 'main'
    __tablename__ = 'chat_history'  # Название таблицы в нижнем регистре
    message_id = Column(Integer, primary_key=True)
    user_id = Column(Integer)
    datetime = Column(DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))
    text = Column(Text)
    files = Column(Text)
    position = Column(Text)
    user = db.relationship(
        'User',
        primaryjoin='foreign(ChatHistory.user_id) == User.user_id',
        viewonly=True,
    )

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
