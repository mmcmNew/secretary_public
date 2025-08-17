from datetime import datetime, timedelta, timezone
from dateutil.rrule import rrule, rruleset, WEEKLY, DAILY, MONTHLY, YEARLY, MO, TU, WE, TH, FR
from flask import current_app
from flask_jwt_extended import current_user
from sqlalchemy.orm import joinedload
from sqlalchemy.dialects.postgresql import JSONB
import hashlib
import json
import random
import uuid
from sqlalchemy import or_, and_, Index

from app import db

print("Определяем task_subtasks_relations")
# Вспомогательные таблицы для связи между задачами и подзадачами
task_subtasks_relations = db.Table('task_subtasks_relations',
                                   db.Column('TaskID', db.String(36), db.ForeignKey('productivity.tasks.TaskID'), primary_key=True),
                                   db.Column('SubtaskID', db.String(36), db.ForeignKey('productivity.tasks.TaskID'), primary_key=True),
                                   schema='productivity')

# Вспомогательные таблицы для связи между задачами и проектами
task_project_relations = db.Table('task_project_relations',
                                  db.Column('TaskID', db.String(36), db.ForeignKey('productivity.tasks.TaskID'), primary_key=True),
                                  db.Column('ProjectID', db.String(36), db.ForeignKey('productivity.projects.ProjectID'), primary_key=True),
                                  schema='productivity')

# Вспомогательные таблицы для связи между списками и проектами
list_project_relations = db.Table('list_project_relations',
                                  db.Column('ListID', db.String(36), db.ForeignKey('productivity.lists.ListID'), primary_key=True),
                                  db.Column('ProjectID', db.String(36), db.ForeignKey('productivity.projects.ProjectID'), primary_key=True),
                                  schema='productivity')

group_project_relations = db.Table('group_project_relations',
                                   db.Column('GroupID', db.String(36), db.ForeignKey('productivity.groups.GroupID'), primary_key=True),
                                   db.Column('ProjectID', db.String(36), db.ForeignKey('productivity.projects.ProjectID'), primary_key=True),
                                   schema='productivity')

# Вспомогательные таблицы для связи между задачами и списками
task_list_relations = db.Table('task_list_relations',
                               db.Column('TaskID', db.String(36), db.ForeignKey('productivity.tasks.TaskID'), primary_key=True),
                               db.Column('ListID', db.String(36), db.ForeignKey('productivity.lists.ListID'), primary_key=True),
                               schema='productivity')

# Вспомогательные таблицы для связи между списками и группами
list_group_relations = db.Table('list_group_relations',
                                db.Column('ListID', db.String(36), db.ForeignKey('productivity.lists.ListID'), primary_key=True),
                                db.Column('GroupID', db.String(36), db.ForeignKey('productivity.groups.GroupID'), primary_key=True),
                                schema='productivity')


class DataVersion(db.Model):
    __tablename__ = 'data_versions'
    __table_args__ = {'schema': 'productivity'}
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    version_metadata = db.Column(db.JSON, default={})
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    @classmethod
    def get_version(cls, key='version'):
        version_record = cls.query.first()
        if not version_record:
            version_record = cls(version_metadata={})
            db.session.add(version_record)
            db.session.commit()
        # Исправление: если version_metadata None, сделать его словарём
        if version_record.version_metadata is None:
            version_record.version_metadata = {}
        if key not in version_record.version_metadata:
            version_record.version_metadata[key] = str(uuid.uuid4())
            db.session.commit()
        return version_record.version_metadata.get(key)

    @classmethod
    def check_version(cls, key, client_version):
        version_record = cls.query.first()
        if not version_record:
            version_record = cls(version_metadata={})
            db.session.add(version_record)
            db.session.commit()
        if key not in version_record.version_metadata:
            version_record.version_metadata[key] = str(uuid.uuid4())
            db.session.commit()
        current = version_record.version_metadata[key]
        return {
            'version': current,
            'has_changed': current != client_version
        }

    @classmethod
    def update_version(cls, key='version'):
        version_record = cls.query.first()
        if not version_record:
            version_record = cls(version_metadata={})
            db.session.add(version_record)
        new_version = str(uuid.uuid4())
        version_record.version_metadata[key] = new_version
        from sqlalchemy.orm.attributes import flag_modified
        flag_modified(version_record, "version_metadata")
        db.session.commit()
        return new_version

    @classmethod
    def get_version_info(cls, key='version'):
        """Get detailed version information for the key."""
        version_record = cls.query.first()
        if not version_record:
            return None

        return {
            'version': version_record.version_metadata.get(key),
            'updated_at': version_record.updated_at,
        }


# Модели для базы данных ToDoBase
class Priority(db.Model):
    __tablename__ = 'priorities'
    __table_args__ = {'schema': 'productivity'}
    id = db.Column('PriorityID', db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = db.Column('PriorityName', db.String(255))

    @staticmethod
    def add_initial_priorities():
        # Проверяем, есть ли пользователи уже в базе данных
        if not Priority.query.all():  # если база пуста
            priorities = [
                Priority(name="Low"),
                Priority(name="Medium"),
                Priority(name="High"),
            ]
            db.session.bulk_save_objects(priorities)
            db.session.commit()
            current_app.logger.info("Initial priorities added.")
        else:
            pass
            # current_app.logger.info("Priorities already exist.")


class Interval(db.Model):
    __tablename__ = 'intervals'
    __table_args__ = {'schema': 'productivity'}
    id = db.Column('IntervalID', db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = db.Column('IntervalName', db.String(255))
    title = db.Column('IntervalTitle', db.String(255))

    @staticmethod
    def add_initial_intervals():
        # Проверяем, есть ли пользователи уже в базе данных
        if not Interval.query.all():  # если база пуста
            intervals = [
                Interval(name="DAILY", title="День"),
                Interval(name="WEEKLY", title="Неделя"),
                Interval(name="MONTHLY", title="Месяц"),
                Interval(name="YEARLY", title="Год"),
                Interval(name="WORK", title="Рабочие дни"),
            ]
            db.session.bulk_save_objects(intervals)
            db.session.commit()
            current_app.logger.info("Initial intervals added.")
        else:
            pass
            # current_app.logger.info("Intervals already exist.")


class TaskTypeGroup(db.Model):
    __tablename__ = 'task_type_groups'
    __table_args__ = {'schema': 'productivity'}
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36), nullable=False)
    name = db.Column(db.String(255))
    color = db.Column(db.String(20))
    order = db.Column(db.Integer)
    is_active = db.Column(db.Boolean, default=True)
    description = db.Column(db.Text)

    task_types = db.relationship('TaskType', backref='group', cascade='all, delete-orphan')

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'name': self.name,
            'color': self.color,
            'order': self.order,
            'is_active': self.is_active,
            'description': self.description,
        }


class TaskType(db.Model):
    __tablename__ = 'task_types'
    __table_args__ = {'schema': 'productivity'}
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36), nullable=False)
    group_id = db.Column(db.String(36), db.ForeignKey('productivity.task_type_groups.id'))
    name = db.Column(db.String(255))
    color = db.Column(db.String(20))
    order = db.Column(db.Integer)
    is_active = db.Column(db.Boolean, default=True)
    description = db.Column(db.Text)

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'group_id': self.group_id,
            'name': self.name,
            'color': self.color,
            'order': self.order,
            'is_active': self.is_active,
            'description': self.description,
        }


class Status(db.Model):
    __tablename__ = 'statuses'
    __table_args__ = {'schema': 'productivity'}
    id = db.Column('StatusID', db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = db.Column('StatusName', db.String(255))
    is_final = db.Column('IsFinal', db.Boolean, default=False, nullable=False)

    @staticmethod
    def add_initial_statuses():
        # Проверяем, есть ли пользователи уже в базе данных
        if not Status.query.all():  # если база пуста
            statuses = [
                Status(name="Not Started", is_final=False),
                Status(name="In Progress", is_final=False),
                Status(name="Completed", is_final=True),
            ]
            db.session.bulk_save_objects(statuses)
            db.session.commit()
            current_app.logger.info("Initial statuses added.")
        else:
            pass
            # current_app.logger.info("Statuses already exist.")


class Project(db.Model):
    __tablename__ = 'projects'
    __table_args__ = {'schema': 'productivity'}
    id = db.Column('ProjectID', db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36), nullable=False)
    title = db.Column('ProjectName', db.String(255))
    order = db.Column('Order', db.Integer, default=-1)
    childes_order = db.Column('Childes', JSONB, default=[])
    deleted = db.Column('Deleted', db.Boolean, default=False)

    tasks = db.relationship('Task', secondary=task_project_relations, back_populates='projects')
    lists = db.relationship('List', secondary=list_project_relations, back_populates='projects')
    groups = db.relationship('Group', secondary=group_project_relations, back_populates='projects')

    def to_dict(self):
        groups_dict = [group.to_dict() for group in self.groups]
        lists_dict = [lst.to_dict() for lst in self.lists]
        combined = groups_dict + lists_dict
        combined = sorted(combined, key=lambda x: x['order'])
        return {
            'id': self.id,
            'type': 'project',
            'title': self.title,
            'order': self.order,
            'childes_order': self.childes_order if self.childes_order else [],
            'childes': combined,
            'deleted': self.deleted
        }


class Group(db.Model):
    __tablename__ = 'groups'
    __table_args__ = {'schema': 'productivity'}
    id = db.Column('GroupID', db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36), nullable=False)
    title = db.Column('GroupName', db.String(255))
    order = db.Column('Order', db.Integer, default=-1)
    childes_order = db.Column('ChildesOrder', JSONB, default=[])
    in_general_list = db.Column('inGeneralList', db.Boolean, default=True)
    deleted = db.Column('Deleted', db.Boolean, default=False)

    lists = db.relationship('List', secondary=list_group_relations, back_populates='groups')
    projects = db.relationship('Project', secondary=group_project_relations, back_populates='groups')

    def to_dict(self):
        return {
            'id': self.id,
            'type': 'group',
            'title': self.title,
            'order': self.order,
            'childes_order': self.childes_order,
            'in_general_list': self.in_general_list,
            'deleted': self.deleted,
        }


class List(db.Model):
    __tablename__ = 'lists'
    __table_args__ = {'schema': 'productivity'}
    id = db.Column('ListID', db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36), nullable=False)
    title = db.Column('ListName', db.String(255))
    order = db.Column('Order', db.Integer, default=-1)
    childes_order = db.Column('ChildesOrder', JSONB, default=[])
    in_general_list = db.Column('inGeneralList', db.Boolean, default=True)
    deleted = db.Column('Deleted', db.Boolean, default=False)
    unfinished_count = db.Column('unfinished_count', db.Integer, nullable=False, default=0)
    important_count = db.Column('important_count', db.Integer, nullable=False, default=0)
    background_count = db.Column('background_count', db.Integer, nullable=False, default=0)

    tasks = db.relationship('Task', secondary=task_list_relations, back_populates='lists')
    projects = db.relationship('Project', secondary=list_project_relations, back_populates='lists')
    groups = db.relationship('Group', secondary=list_group_relations, back_populates='lists')

    def to_dict(self):
        return {
            'id': self.id,
            'type': 'list',
            'title': self.title,
            'order': self.order,
            'childes_order': self.childes_order,
            'unfinished_tasks_count': self.unfinished_count,
            'important_tasks_count': self.important_count,
            'background_tasks_count': self.background_count,
            'in_general_list': self.in_general_list,
            'deleted': self.deleted,
        }


class Task(db.Model):
    __tablename__ = 'tasks'
    __table_args__ = {'schema': 'productivity'}
    id = db.Column('TaskID', db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36), nullable=False)
    title = db.Column('Title', db.String(255))
    start = db.Column('Start', db.DateTime)
    end = db.Column('Deadline', db.DateTime)
    is_background = db.Column('IsBackground', db.Boolean, default=False)
    completed_at = db.Column('EndDate', db.DateTime)
    is_completed = db.Column('IsCompleted', db.Boolean, default=False, nullable=False)
    is_important = db.Column('IsImportant', db.Boolean, default=False, nullable=False)
    attachments = db.Column('Attachments', db.String(255))
    note = db.Column('Note', db.Text)
    childes_order = db.Column('ChildesOrder', JSONB, default=[])
    color = db.Column('Color', db.String(20))
    type_id = db.Column('TaskTypeID', db.String(36), db.ForeignKey('productivity.task_types.id'))
    status_id = db.Column('StatusID', db.String(36), db.ForeignKey('productivity.statuses.StatusID'))
    priority_id = db.Column('PriorityID', db.String(36), db.ForeignKey('productivity.priorities.PriorityID'))
    interval_id = db.Column('IntervalID', db.String(36), db.ForeignKey('productivity.intervals.IntervalID'))
    is_infinite = db.Column('IsInfinite', db.Boolean, default=False)

    status = db.relationship('Status', backref='tasks', foreign_keys=[status_id])
    priority = db.relationship('Priority', backref='tasks', foreign_keys=[priority_id])
    interval = db.relationship('Interval', backref='tasks', foreign_keys=[interval_id])

    subtasks = db.relationship('Task',
                               secondary=task_subtasks_relations,
                               primaryjoin=lambda: Task.id == task_subtasks_relations.c.TaskID,
                               secondaryjoin=lambda: Task.id == task_subtasks_relations.c.SubtaskID,
                               foreign_keys=[task_subtasks_relations.c.TaskID, task_subtasks_relations.c.SubtaskID],
                               backref="parent_tasks")
    projects = db.relationship('Project', secondary=task_project_relations, back_populates='tasks')
    lists = db.relationship('List', secondary=task_list_relations, back_populates='tasks')

    def to_dict(self):
        type_data = None
        if self.type_id:
            type_obj = db.session.get(TaskType, self.type_id)
            if type_obj:
                type_data = type_obj.to_dict()

        task_dict = {
            'id': self.id,
            'title': self.title,
            'end': self.end.isoformat() + 'Z' if self.end else None,
            'start': self.start.isoformat() + 'Z' if self.start else None,
            'range': {
                'start': self.start.isoformat() + 'Z' if self.start else None,
                'end': self.end.isoformat() + 'Z' if self.end else None,
            },
            'completed_at': self.completed_at.isoformat() + 'Z' if self.completed_at else None,
            'is_completed': self.is_completed,
            'is_important': self.is_important,
            'is_background': self.is_background,
            'attachments': self.attachments,
            'note': self.note,
            'childes_order': self.childes_order,
            'status_id': self.status_id,
            'priority_id': self.priority_id,
            'interval_id': self.interval_id,
            'is_infinite': self.is_infinite,
            'type_id': self.type_id,
            'type': type_data,
            'color': self.color,  # '#008000' if self.status_id == 2 else self.color,
            'lists_ids': [lst.id for lst in self.lists],
            # 'subtasks': [subtask.to_dict() for subtask in self.subtasks],
        }
        if self.is_background:
            task_dict['display'] = 'background'
        if self.interval:
            task_dict['rrule'] = self.get_rrule()
            if self.start and self.end:
                start_time = self.start.time()
                end_time = self.end.time()

                # Вычисление продолжительности
                start_datetime = datetime.combine(datetime.min, start_time)
                end_datetime = datetime.combine(datetime.min, end_time)
                duration = end_datetime - start_datetime

                # Форматирование продолжительности как HH:MM:SS
                if duration < timedelta(0):
                    duration = timedelta(0)  # Обеспечиваем, что продолжительность не отрицательная

                hours, remainder = divmod(duration.seconds, 3600)
                minutes, seconds = divmod(remainder, 60)
                duration_str = f"{hours:02}:{minutes:02}:{seconds:02}"

                task_dict['duration'] = duration_str

        return task_dict

    def build_rrule(self):
        if not self.interval_id or not self.start:
            return None

        interval_mapping = {
            1: DAILY,
            2: WEEKLY,
            3: MONTHLY,
            4: YEARLY,
            5: WEEKLY  # рабочие дни тоже weekly, но с byweekday
        }

        freq = interval_mapping.get(self.interval_id)
        until_date = self.end if not self.is_infinite else None

        kwargs = {
            'freq': freq,
            'dtstart': self.start,
            'until': until_date,
        }

        if self.interval_id == 5:
            kwargs['byweekday'] = (MO, TU, WE, TH, FR)

        return rrule(**kwargs)
    

    def get_rrule(self):
        if not self.interval_id or not self.start:
            return None

        interval_mapping = {
            1: 'DAILY',  # День
            2: 'WEEKLY',  # Неделя
            3: 'MONTHLY',  # Месяц
            4: 'YEARLY'  # Год
        }

        rule_params = {
            'freq': interval_mapping.get(self.interval_id),
            'dtstart': self.start.isoformat() + 'Z',
        }

        if not self.is_infinite:
            rule_params['until'] = self.end.isoformat() + 'Z'

        if self.interval_id == 5:  # Если рабочие дни
            rule_params['freq'] = 'WEEKLY'  # Используем WEEKLY
            rule_params['byweekday'] = ['MO', 'TU', 'WE', 'TH', 'FR']  # Понедельник — пятница

        # Возвращаем строковое представление rrule
        return rule_params

