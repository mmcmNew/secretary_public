from app import db
from datetime import datetime, timezone
from sqlalchemy import Column, Integer, ForeignKey, DateTime, String, Text


# Модель для таблицы users
class Dashboard(db.Model):
    __bind_key__ = 'app_session_meta'
    __tablename__ = 'dashboard'  # Название таблицы в нижнем регистре
    id = Column(Integer, primary_key=True)
    name = Column(Text)
    containers = db.Column(db.JSON)
    timers = db.Column(db.JSON)
    theme_mode = db.Column(db.String(20))
    calendar_settings = db.Column(db.Text)

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "containers": self.containers,
            "timers": self.timers,
            "themeMode": self.theme_mode,
            "calendarSettings": self.calendar_settings
        }
