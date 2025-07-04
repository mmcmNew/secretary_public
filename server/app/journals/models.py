from datetime import datetime

from app import db

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

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'journal_type': self.journal_type,
            'data': self.data,
            'created_at': self.created_at.isoformat() + 'Z'
        }
