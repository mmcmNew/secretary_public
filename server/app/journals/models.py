from datetime import datetime

from app import db

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
