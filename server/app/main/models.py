from app import db
from datetime import datetime, timezone
from sqlalchemy import Column, Integer, ForeignKey, DateTime, String, Text, Boolean
from sqlalchemy.types import JSON
from flask import current_app
from werkzeug.security import generate_password_hash, check_password_hash
import uuid


# Модель для таблицы users
class User(db.Model):
    __tablename__ = 'users'
    __table_args__ = {'schema': 'users'}
    user_id = Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_name = Column(Text, nullable=False)
    email = Column(String(255), unique=True)
    password_hash = Column(String(255))
    avatar_src = Column(Text)
    last_dashboard_id = Column(String(36), ForeignKey('workspace.dashboard.id'))
    modules = Column(JSON, default=lambda: ['diary'])
    access_level_id = Column(Integer, default=1)
    is_admin = Column(Boolean, default=False)

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
        # if current_app.config.get("CONFIG_TYPE") != "test":
        #     return

        # Проверяем, есть ли пользователи уже в базе данных
        if not User.query.all():  # если база пуста
            admin = User(user_name="admin", email="admin@example.com", avatar_src="me.png", last_dashboard_id=None, modules=[], access_level_id=3, is_admin=True)
            admin.set_password("password")
            secretary = User(user_name="Secretary", avatar_src="secretary.png", last_dashboard_id=None, modules=[], access_level_id=3)
            secretary.set_password("password")
            db.session.add(admin)
            db.session.add(secretary)
            db.session.commit()
            
            # Инициализируем рабочие пространства для начальных пользователей
            admin.initialize_user_workspace()
            secretary.initialize_user_workspace()
            
            current_app.logger.info("Initial users added.")

    def create_default_journal(self):
        """Создает дефолтный журнал diary для пользователя"""
        from app.journals.models import JournalSchema
        
        # Проверяем, есть ли уже дефолтный журнал
        existing = JournalSchema.query.filter_by(user_id=self.user_id, name='diary').first()
        if not existing:
            # Убираем 'diary' из списка модулей, чтобы избежать дублирования
            if 'diary' in (self.modules or []):
                self.modules = [m for m in self.modules if m != 'diary']
            
            default_schema = JournalSchema(
                user_id=self.user_id,
                name='diary',
                display_name='Дневник',
                fields=[
                    {'name': 'content', 'type': 'textarea', 'label': 'Содержание', 'required': True},
                    {'name': 'mood', 'type': 'select', 'label': 'Настроение', 'options': ['😊', '😐', '😔', '😡', '😴']},
                    {'name': 'tags', 'type': 'tags', 'label': 'Теги'}
                ],
                is_default=True
            )
            db.session.add(default_schema)
            db.session.commit()
    
    def initialize_user_workspace(self):
        """Инициализирует рабочее пространство пользователя"""
        try:
            from app.user_data_manager import UserDataManager
            UserDataManager.create_user_workspace(self.user_id)
            self.create_default_journal()
            current_app.logger.info(f"Workspace initialized for user {self.user_id}")
        except Exception as e:
            current_app.logger.error(f"Failed to initialize workspace for user {self.user_id}: {e}")

    def to_dict(self):
        return {
            'id': self.user_id,
            'user_name': self.user_name,
            'email': self.email,
            'avatar_src': self.avatar_src,
            'last_dashboard_id': self.last_dashboard_id,
            'modules': self.modules,
            'is_admin': self.is_admin,
        }


# Модель для таблицы chat_history
class ChatHistory(db.Model):
    __tablename__ = 'chat_history'
    __table_args__ = {'schema': 'communication'}
    message_id = Column(Integer, primary_key=True)
    user_id = Column(String(36), ForeignKey('users.users.user_id'), nullable=False)
    datetime = Column(DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))
    text = Column(Text)
    files = Column(Text)
    position = Column(Text)

    def to_dict(self):
        # Получаем пользователя отдельно
        user = User.query.filter_by(user_id=self.user_id).first()
        return {
            'message_id': str(self.message_id),
            'user': user.to_dict() if user else {'user_name': 'Unknown', 'avatar_src': 'default.png'},
            'text': self.text,
            'datetime': self.datetime.isoformat() + 'Z',
            'files': self.files,
        }

