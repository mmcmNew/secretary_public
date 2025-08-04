from flask import current_app
from flask_jwt_extended import current_user
from sqlalchemy.orm import joinedload
from app.tasks.models import TaskType

from app import db


class AntiTask(db.Model):
    __tablename__ = 'anti_schedule'
    __table_args__ = (
        db.Index('ix_anti_schedule_user_id', 'user_id'),
        db.Index('ix_anti_schedule_start', 'Start'),
        {'schema': 'productivity'}
    )
    id = db.Column('AntiTaskID', db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.Integer, nullable=False)
    task_id = db.Column('TaskID', db.Integer, db.ForeignKey('productivity.tasks.TaskID'))
    title = db.Column('Title', db.String(255))
    start = db.Column('Start', db.DateTime)
    end = db.Column('End', db.DateTime)
    note = db.Column('Note', db.Text)
    color = db.Column('Color', db.String(20))
    type_id = db.Column('TaskTypeID', db.Integer, db.ForeignKey('productivity.task_types.id'))
    status_id = db.Column('StatusID', db.Integer, db.ForeignKey('productivity.statuses.StatusID'), default=1)
    is_background = db.Column('IsBackground', db.Boolean, default=False)
    files = db.Column('Files', db.Text)

    task = db.relationship('Task', backref='anti_tasks', foreign_keys=[task_id])
    status = db.relationship('Status', backref='anti_tasks', foreign_keys=[status_id])

    def to_dict(self):
        type_data = None
        if self.type_id:
            type_obj = db.session.get(TaskType, self.type_id)
            if type_obj:
                type_data = type_obj.to_dict()

        task_dict = {
            'id': self.id,
            'task_id': self.task_id,
            'main_task': self.task.to_dict() if self.task else None,
            'title': self.title,
            'start': self.start.isoformat() + 'Z' if self.start else None,
            'end': self.end.isoformat() + 'Z' if self.end else None,
            'note': self.note,
            'status_id': self.status_id,
            'is_background': self.is_background,
            'type_id': self.type_id,
            'color': self.color,
            'type': type_data,
            'files': self.files
        }
        if self.is_background:
            task_dict['display'] = 'background'

        return task_dict

    @staticmethod
    def get_anti_schedule(user_id):
        load_options = [
            joinedload(AntiTask.task),
            joinedload(AntiTask.status)
        ]
        query = AntiTask.query.options(*load_options).filter_by(user_id=user_id)
        anti_tasks = query.order_by(AntiTask.start).all()
        schedule = [task.to_dict() for task in anti_tasks]
        return schedule


# class TaskOverride(db.Model):
#     __tablename__ = 'task_overrides'
#     __table_args__ = {'schema': 'productivity'}
#     id = db.Column(db.Integer, primary_key=True, autoincrement=True)
#     task_id = db.Column(db.Integer, db.ForeignKey('productivity.tasks.TaskID'), nullable=False)
#     user_id = db.Column(db.Integer, nullable=False)  # Новый столбец для пользователя
#     date = db.Column(db.Date, nullable=False)  # Дата экземпляра, к которому относится override
#     type = db.Column(db.String(20), nullable=False, default='modified')  # 'modified' или 'skip'
#     # Изменённые поля (например, start, end, title, status и т.д.)
#     data = db.Column(db.JSON, default={})

#     task = db.relationship('Task', backref='overrides', foreign_keys=[task_id])

#     def to_dict(self):
#         return {
#             'id': self.id,
#             'task_id': self.task_id,
#             'user_id': self.user_id,
#             'date': self.date.isoformat(),
#             'type': self.type,
#             'data': self.data,
#         }
