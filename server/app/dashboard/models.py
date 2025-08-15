from app import db
from app.main.models import User
from datetime import datetime, timezone
from sqlalchemy import Column, Integer, ForeignKey, DateTime, String, Text
import json
import uuid


# Модель для таблицы users
class Dashboard(db.Model):
    __tablename__ = 'dashboard'
    __table_args__ = {'schema': 'workspace'}
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), nullable=False)
    name = Column(Text)
    containers = db.Column(db.JSON)
    timers = db.Column(db.JSON)
    theme_mode = db.Column(db.String(20))
    calendar_settings = db.Column(db.Text)

    def to_dict(self):
        try:
            parsed_settings = json.loads(self.calendar_settings) if self.calendar_settings else None
        except (TypeError, json.JSONDecodeError):
            parsed_settings = None

        return {
            "id": self.id,
            "name": self.name,
            "containers": self.containers,
            "timers": self.timers,
            "themeMode": self.theme_mode,
            "calendarSettings": parsed_settings
        }
