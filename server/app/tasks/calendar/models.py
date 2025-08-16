from sqlalchemy import Index
from app import db


class TaskOverride(db.Model):
    __tablename__ = 'task_overrides'
    __table_args__ = (
        Index('idx_task_overrides_taskid_date_userid', 'task_id', 'date', 'user_id'),
        {'schema': 'productivity'}
    )
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    task_id = db.Column(db.String(36), db.ForeignKey('productivity.tasks.TaskID'), nullable=False)
    user_id = db.Column(db.String(36), nullable=False)
    date = db.Column(db.Date, nullable=False)
    type = db.Column(db.String(20), nullable=False, default='modified')
    data = db.Column(db.JSON, default={})

    task = db.relationship('Task', backref='overrides', foreign_keys=[task_id])

    def to_dict(self):
        return {
            'id': self.id,
            'task_id': self.task_id,
            'user_id': self.user_id,
            'date': self.date.isoformat(),
            'type': self.type,
            'data': self.data,
        }
