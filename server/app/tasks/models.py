from datetime import datetime, timedelta, timezone
from dateutil.rrule import rrule, rruleset, WEEKLY, DAILY, MONTHLY, YEARLY, MO, TU, WE, TH, FR
from flask import current_app
from flask_jwt_extended import current_user
from sqlalchemy.orm import joinedload
import hashlib
import json
import random
import uuid

from app import db
from app.main.models import User

# Вспомогательные таблицы для связи между задачами и подзадачами
task_subtasks_relations = db.Table('task_subtasks_relations',
                                   db.Column('TaskID', db.Integer, db.ForeignKey('tasks.TaskID')),
                                   db.Column('SubtaskID', db.Integer, db.ForeignKey('tasks.TaskID')))

# Вспомогательные таблицы для связи между задачами и проектами
task_project_relations = db.Table('task_project_relations',
                                  db.Column('TaskID', db.Integer, db.ForeignKey('tasks.TaskID'), primary_key=True),
                                  db.Column('ProjectID', db.Integer, db.ForeignKey('projects.ProjectID'),
                                            primary_key=True))

# Вспомогательные таблицы для связи между списками и проектами
list_project_relations = db.Table('list_project_relations',
                                  db.Column('ListID', db.Integer, db.ForeignKey('lists.ListID'), primary_key=True),
                                  db.Column('ProjectID', db.Integer, db.ForeignKey('projects.ProjectID'),
                                            primary_key=True))

group_project_relations = db.Table('group_project_relations',
                                   db.Column('GroupID', db.Integer, db.ForeignKey('groups.GroupID'), primary_key=True),
                                   db.Column('ProjectID', db.Integer, db.ForeignKey('projects.ProjectID'),
                                             primary_key=True))

# Вспомогательные таблицы для связи между задачами и списками
task_list_relations = db.Table('task_list_relations',
                               db.Column('TaskID', db.Integer, db.ForeignKey('tasks.TaskID'), primary_key=True),
                               db.Column('ListID', db.Integer, db.ForeignKey('lists.ListID'), primary_key=True))

# Вспомогательные таблицы для связи между списками и группами
list_group_relations = db.Table('list_group_relations',
                                db.Column('ListID', db.Integer, db.ForeignKey('lists.ListID'), primary_key=True),
                                db.Column('GroupID', db.Integer, db.ForeignKey('groups.GroupID'), primary_key=True))


class DataVersion(db.Model):
    __tablename__ = 'data_versions'
    
    id = db.Column(db.Integer, primary_key=True)
    version_metadata = db.Column(db.JSON, default={})
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    @classmethod
    def get_version(cls, key='version'):
        """Get current version for the specified key."""
        version_record = cls.query.first()
        if not version_record:
            version_record = cls(version_metadata={})
            db.session.add(version_record)
            db.session.commit()
        if key not in version_record.version_metadata:
            version_record.version_metadata[key] = str(uuid.uuid4())
            db.session.commit()
        return version_record.version_metadata.get(key)

    @classmethod
    def check_version(cls, key, client_version):
        """Check if client version matches server version for the key."""
        version_record = cls.query.first()
        if not version_record:
            version_record = cls(version_metadata={})
            db.session.add(version_record)
            db.session.commit()
        current = version_record.version_metadata.get(key)
        if not current:
            version_record.version_metadata[key] = str(uuid.uuid4())
            db.session.commit()
            current = version_record.version_metadata[key]

        return {
            'version': current,
            'has_changed': current != client_version
        }

    @classmethod
    def update_version(cls, key='version'):
        """Update version for the specified key."""
        version_record = cls.query.first()
        if not version_record:
            version_record = cls(version_metadata={})
            db.session.add(version_record)
        version_record.version_metadata[key] = str(uuid.uuid4())
        db.session.commit()
        return version_record.version_metadata.get(key)

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
    id = db.Column('PriorityID', db.Integer, primary_key=True, autoincrement=True)
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
    id = db.Column('IntervalID', db.Integer, primary_key=True, autoincrement=True)
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


class Status(db.Model):
    __tablename__ = 'statuses'
    id = db.Column('StatusID', db.Integer, primary_key=True, autoincrement=True)
    name = db.Column('StatusName', db.String(255))

    @staticmethod
    def add_initial_statuses():
        # Проверяем, есть ли пользователи уже в базе данных
        if not Status.query.all():  # если база пуста
            statuses = [
                Status(name="Not Started"),
                Status(name="In Progress"),
                Status(name="Completed"),
            ]
            db.session.bulk_save_objects(statuses)
            db.session.commit()
            current_app.logger.info("Initial statuses added.")
        else:
            pass
            # current_app.logger.info("Statuses already exist.")


class Project(db.Model):
    __tablename__ = 'projects'
    id = db.Column('ProjectID', db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.Integer, nullable=False)
    title = db.Column('ProjectName', db.String(255))
    order = db.Column('Order', db.Integer, default=-1)
    childes_order = db.Column('Childes', db.JSON, default=[])
    deleted = db.Column('Deleted', db.Boolean, default=False)

    tasks = db.relationship('Task', secondary=task_project_relations, back_populates='projects')
    lists = db.relationship('List', secondary=list_project_relations, back_populates='projects')
    groups = db.relationship('Group', secondary=group_project_relations, back_populates='projects')

    def unfinished_tasks_count(self):
        unfinished_tasks_count = 0
        for list in self.lists:
            unfinished_tasks_count += list.unfinished_tasks_count()
        for group in self.groups:
            unfinished_tasks_count += group.unfinished_tasks_count()
        return unfinished_tasks_count

    def tasks_count(self):
        tasks_count = 0
        for list in self.lists:
            tasks_count += len(list.childes_order)
        for group in self.groups:
            tasks_count += group.tasks_count()
        return tasks_count

    def to_dict(self):
        groups_dict = [group.to_dict() for group in self.groups]
        lists_dict = [lst.to_dict() for lst in self.lists]
        combined = groups_dict + lists_dict
        combined = sorted(combined, key=lambda x: x['order'])
        # print(f'combined: {combined}')
        return {
            'id': f'project_{self.id}',
            'type': 'project',
            'title': self.title,
            'order': self.order,
            'childes_order': self.childes_order if self.childes_order else [],
            'childes': combined,
            # 'unfinished_tasks_count': self.unfinished_tasks_count(),
            'tasks_count': self.tasks_count(),
            'deleted': self.deleted
        }


class Group(db.Model):
    __tablename__ = 'groups'
    id = db.Column('GroupID', db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.Integer, nullable=False)
    title = db.Column('GroupName', db.String(255))
    order = db.Column('Order', db.Integer, default=-1)
    childes_order = db.Column('ChildesOrder', db.JSON, default=[])
    in_general_list = db.Column('InGeneralList', db.Boolean, default=True)
    deleted = db.Column('Deleted', db.Boolean, default=False)

    lists = db.relationship('List', secondary=list_group_relations, back_populates='groups')
    projects = db.relationship('Project', secondary=group_project_relations, back_populates='groups')

    def unfinished_tasks_count(self, lists_map=None, tasks_map=None):
        """Return count of unfinished tasks within this group.

        Optionally accepts a mapping of list_id -> List objects and a mapping of
        task_id -> Task objects to avoid per-item database queries."""
        unfinished_tasks_count = 0
        for list_id in self.childes_order:
            lst = None
            if lists_map is not None:
                lst = lists_map.get(list_id)
            if lst is None:
                lst = List.query.get(list_id)
            if lst:
                unfinished_tasks_count += lst.unfinished_tasks_count(tasks_map)
        return unfinished_tasks_count

    def tasks_count(self, lists_map=None):
        """Return total number of tasks within this group."""
        tasks_count = 0
        for list_id in self.childes_order:
            lst = None
            if lists_map is not None:
                lst = lists_map.get(list_id)
            if lst is None:
                lst = List.query.get(list_id)
            if lst:
                tasks_count += len(lst.childes_order)
        return tasks_count

    def to_dict(self):
        return {
            'id': f'group_{self.id}',
            'type': 'group',
            'title': self.title,
            'order': self.order,
            'childes_order': self.childes_order,
            'inGeneralList': self.in_general_list,
            # 'unfinished_tasks_count': self.unfinished_tasks_count(),
            'tasks_count': self.tasks_count(),
            'deleted': self.deleted,
        }


class List(db.Model):
    __tablename__ = 'lists'
    id = db.Column('ListID', db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.Integer, nullable=False)
    title = db.Column('ListName', db.String(255))
    order = db.Column('Order', db.Integer, default=-1)
    childes_order = db.Column('ChildesOrder', db.JSON, default=[])
    in_general_list = db.Column('InGeneralList', db.Boolean, default=True)
    deleted = db.Column('Deleted', db.Boolean, default=False)

    tasks = db.relationship('Task', secondary=task_list_relations, back_populates='lists')
    projects = db.relationship('Project', secondary=list_project_relations, back_populates='lists')
    groups = db.relationship('Group', secondary=list_group_relations, back_populates='lists')

    def unfinished_tasks_count(self, tasks_map=None):
        """Return number of unfinished tasks in this list.

        A mapping of task_id -> Task can be provided to avoid database lookups."""
        unfinished_tasks_count = 0
        for task_id in self.childes_order:
            task = None
            if tasks_map is not None:
                task = tasks_map.get(task_id)
            if task is None:
                task = Task.query.get(task_id)
            if task and task.status_id != 2:
                unfinished_tasks_count += 1
        return unfinished_tasks_count

    def to_dict(self):
        return {
            'id': self.id,
            'type': 'list',
            'title': self.title,
            'order': self.order,
            'childes_order': self.childes_order,
            # 'unfinished_tasks_count': self.unfinished_tasks_count(),
            'inGeneralList': self.in_general_list,
            'deleted': self.deleted,
        }


class TaskTypes(db.Model):
    __tablename__ = 'task_types'
    id = db.Column('TaskTypeID', db.Integer, primary_key=True, autoincrement=True)
    period_type = db.Column('PeriodType', db.String(255))
    task_type = db.Column('Type', db.String(255))
    type_name = db.Column('Name', db.String(255))
    type_color = db.Column('Color', db.String(20))
    type_icon = db.Column('Icon', db.String(255))
    group_label = db.Column('GroupLabel', db.String(255))

    @staticmethod
    def add_initial_task_types():
        pass

    #     # Проверяем, есть ли пользователи уже в базе данных
    #     if not TaskTypes.query.all():  # если база пуста
    #         task_types = [
    #             TaskTypes(period_type="productive", task_type="work", type_name="Продуктивная работа",
    #                       type_color="green", type_icon="work", group_label="Рабочее время"),
    #             TaskTypes(period_type="everyday", task_type="work", type_name="Повседневные задачи", type_color="green",
    #                       type_icon="work", group_label="Рабочее время"),
    #             TaskTypes(period_type="break", task_type="rest", type_name="Перерыв", type_color="green",
    #                       type_icon="rest", group_label="Отдых"),
    #             TaskTypes(period_type="lunch", task_type="rest", type_name="Обед", type_color="green", type_icon="rest",
    #                       group_label="Отдых"),
    #             TaskTypes(period_type="study", task_type="study", type_name="Учеба", type_color="green",
    #                       type_icon="study", group_label="Учеба"),
    #         ]
    #         db.session.bulk_save_objects(task_types)
    #         db.session.commit()
    #         current_app.logger.info("Initial task types added.")
    #     else:
    #         pass
    #         # current_app.logger.info("Task types already exist.")

    def to_dict(self):
        return {
            'id': self.id,
            'period_type': self.period_type,
            'task_type': self.task_type,
            'type_name': self.type_name,
            'type_color': self.type_color,
            'type_icon': self.type_icon,
            'group_label': self.group_label
        }


class Task(db.Model):
    __tablename__ = 'tasks'
    id = db.Column('TaskID', db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.Integer, nullable=False)
    title = db.Column('Title', db.String(255))
    start = db.Column('Start', db.DateTime)
    end = db.Column('Deadline', db.DateTime)
    is_background = db.Column('IsBackground', db.Boolean, default=False)
    completed_at = db.Column('EndDate', db.DateTime)
    attachments = db.Column('Attachments', db.String(255))
    note = db.Column('Note', db.Text)
    childes_order = db.Column('ChildesOrder', db.JSON, default=[])
    color = db.Column('Color', db.String(20))
    type_id = db.Column('TaskTypeID', db.Integer, db.ForeignKey('task_types.TaskTypeID'))
    status_id = db.Column('StatusID', db.Integer, db.ForeignKey('statuses.StatusID'), default=1)
    priority_id = db.Column('PriorityID', db.Integer, db.ForeignKey('priorities.PriorityID'))
    interval_id = db.Column('IntervalID', db.Integer, db.ForeignKey('intervals.IntervalID'))
    is_infinite = db.Column('IsInfinite', db.Boolean, default=False)

    type = db.relationship('TaskTypes', backref='tasks', foreign_keys=[type_id])
    status = db.relationship('Status', backref='tasks', foreign_keys=[status_id])
    priority = db.relationship('Priority', backref='tasks', foreign_keys=[priority_id])
    interval = db.relationship('Interval', backref='tasks', foreign_keys=[interval_id])

    subtasks = db.relationship('Task',
                               secondary=task_subtasks_relations,
                               primaryjoin='Task.id == task_subtasks_relations.c.TaskID',
                               secondaryjoin='Task.id == task_subtasks_relations.c.SubtaskID',
                               foreign_keys=[task_subtasks_relations.c.TaskID, task_subtasks_relations.c.SubtaskID],
                               backref="parent_tasks")
    projects = db.relationship('Project', secondary=task_project_relations, back_populates='tasks')
    lists = db.relationship('List', secondary=task_list_relations, back_populates='tasks')

    def to_dict(self):
        task_dict = {
            'id': self.id,
            'title': self.title,
            'end': self.end.isoformat() + 'Z' if self.end else None,
            'start': self.start.isoformat() + 'Z' if self.start else None,
            'completed_at': self.completed_at.isoformat() + 'Z' if self.completed_at else None,
            'is_background': self.is_background,
            'attachments': self.attachments,
            'note': self.note,
            'childes_order': self.childes_order,
            'status_id': self.status_id,
            'priority_id': self.priority_id,
            'interval_id': self.interval_id,
            'is_infinite': self.is_infinite,
            'type_id': self.type_id,
            'type': self.type.to_dict() if self.type else None,
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

    @staticmethod
    def get_myday_tasks(client_timezone=0, user_id=None):
        client_timezone_offset = timedelta(minutes=-int(client_timezone))

        if user_id is None:
            try:
                user_id = current_user.id
            except Exception:
                user_id = None

        # Локальное «сегодня» в UTC
        now_local = datetime.now(timezone.utc) + client_timezone_offset
        start_of_day = datetime.combine(now_local.date(), datetime.min.time())
        end_of_day = datetime.combine(now_local.date(), datetime.max.time())

        # Смещение обратно в UTC
        start_utc = start_of_day - client_timezone_offset
        end_utc = end_of_day - client_timezone_offset

        load_options = [
            joinedload(Task.lists),
            joinedload(Task.type),
            joinedload(Task.status),
            joinedload(Task.priority),
            joinedload(Task.interval),
            joinedload(Task.subtasks)
        ]

        # Обычные задачи на сегодня
        query = Task.query.options(*load_options).filter(
            Task.start >= start_utc,
            Task.start < end_utc
        )
        if user_id:
            query = query.filter(Task.user_id == user_id)

        today_tasks = query.all()

        # Повторяющиеся задачи
        recurring_query = Task.query.options(*load_options).filter(
            Task.interval_id.isnot(None),
            Task.start.isnot(None),
            Task.status_id != 2
        )
        if user_id:
            recurring_query = recurring_query.filter(Task.user_id == user_id)

        recurring_tasks = recurring_query.all()

        for task in recurring_tasks:
            rule = task.build_rrule()
            if rule and rule.between(start_utc, end_utc, inc=True):
                today_tasks.append(task)

        # Удалить дубли
        unique_tasks = list({task.id: task for task in today_tasks}.values())

        # Сортировка по времени начала
        unique_tasks.sort(key=lambda t: t.start.time() if t.start else datetime.min.time())

        return unique_tasks

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


class AntiTask(db.Model):
    __tablename__ = 'anti_schedule'
    __table_args__ = (
        db.Index('ix_anti_schedule_user_id', 'user_id'),
        db.Index('ix_anti_schedule_start', 'Start'),
    )
    id = db.Column('AntiTaskID', db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.Integer, nullable=False)
    task_id = db.Column('TaskID', db.Integer, db.ForeignKey('tasks.TaskID'))
    title = db.Column('Title', db.String(255))
    start = db.Column('Start', db.DateTime)
    end = db.Column('End', db.DateTime)
    note = db.Column('Note', db.Text)
    color = db.Column('Color', db.String(20))
    type_id = db.Column('TaskTypeID', db.Integer, db.ForeignKey('task_types.TaskTypeID', name="fk_anti_type"))
    status_id = db.Column('StatusID', db.Integer, db.ForeignKey('statuses.StatusID'), default=1)
    is_background = db.Column('IsBackground', db.Boolean, default=False)
    files = db.Column('Files', db.Text)

    task = db.relationship('Task', backref='anti_tasks', foreign_keys=[task_id])
    type = db.relationship('TaskTypes', backref='anti_tasks', foreign_keys=[type_id])
    status = db.relationship('Status', backref='anti_tasks', foreign_keys=[status_id])

    def to_dict(self):
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
            'type': self.type.to_dict() if self.type else None,
            'files': self.files
        }
        if self.is_background:
            task_dict['display'] = 'background'

        return task_dict

    @staticmethod
    def get_anti_schedule(user_id=None):
        if user_id is None:
            try:
                user_id = current_user.id
            except Exception:
                user_id = None
        load_options = [
            joinedload(AntiTask.task),
            joinedload(AntiTask.type),
            joinedload(AntiTask.status)
        ]

        query = AntiTask.query.options(*load_options)
        if user_id is not None:
            query = query.filter_by(user_id=user_id)
        anti_tasks = query.order_by(AntiTask.start).all()
        schedule = [task.to_dict() for task in anti_tasks]

        return schedule
