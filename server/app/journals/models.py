from datetime import datetime
import os

from app import db
from app.data_paths import APP_USER_DATA_DIR

class JournalSchema(db.Model):
    __bind_key__ = 'content'
    __tablename__ = 'journal_schemas'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, nullable=False)
    name = db.Column(db.String(100), nullable=False)
    display_name = db.Column(db.String(200), nullable=False)
    fields = db.Column(db.JSON, nullable=False)
    is_default = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'display_name': self.display_name,
            'fields': self.fields,
            'is_default': self.is_default,
            'created_at': self.created_at.isoformat() + 'Z',
            'updated_at': self.updated_at.isoformat() + 'Z'
        }

class JournalEntry(db.Model):
    __bind_key__ = 'content'
    __tablename__ = 'journal_entries'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, nullable=False)
    journal_type = db.Column(db.String(50))
    data = db.Column(db.JSON)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Связь с файлами
    files = db.relationship('JournalFile', backref='entry', lazy=True, cascade='all, delete-orphan')

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'journal_type': self.journal_type,
            'data': self.data,
            'files': [f.to_dict() for f in self.files],
            'created_at': self.created_at.isoformat() + 'Z'
        }

class JournalFile(db.Model):
    __bind_key__ = 'content'
    __tablename__ = 'journal_files'

    id = db.Column(db.Integer, primary_key=True)
    entry_id = db.Column(db.Integer, db.ForeignKey('journal_entries.id'), nullable=False)
    field_name = db.Column(db.String(100), nullable=False)  # Имя поля, к которому относится файл
    filename = db.Column(db.String(255), nullable=False)
    original_filename = db.Column(db.String(255), nullable=False)
    file_path = db.Column(db.String(500), nullable=False)
    file_size = db.Column(db.Integer)
    mime_type = db.Column(db.String(100))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'field_name': self.field_name,
            'filename': self.filename,
            'original_filename': self.original_filename,
            'file_size': self.file_size,
            'mime_type': self.mime_type,
            'created_at': self.created_at.isoformat() + 'Z'
        }

    @property
    def absolute_path(self):
        return os.path.join(APP_USER_DATA_DIR, self.file_path)

    def delete_file(self):
        """Удаляет физический файл с диска"""
        try:
            abs_path = self.absolute_path
            if os.path.exists(abs_path):
                os.remove(abs_path)
        except Exception as e:
            print(f"Ошибка при удалении файла {self.file_path}: {e}")
