"""Add counter columns to Lists

Revision ID: 5d732e1bcdb2
Revises: b00013e5a74c
Create Date: 2025-07-25 14:00:02.516274

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '5d732e1bcdb2'
down_revision = '28aacf38f6e1'
branch_labels = None
depends_on = None


def upgrade():
    # Добавляем колонки для хранения счетчиков
    op.add_column('lists', sa.Column('unfinished_count', sa.Integer(), nullable=False, server_default='0'), schema='productivity')
    op.add_column('lists', sa.Column('important_count', sa.Integer(), nullable=False, server_default='0'), schema='productivity')
    op.add_column('lists', sa.Column('background_count', sa.Integer(), nullable=False, server_default='0'), schema='productivity')
    
    # Обновляем начальные значения счетчиков
    connection = op.get_bind()
    
    # Подсчет незавершенных задач
    connection.execute(sa.text("""
        UPDATE productivity.lists l SET
            unfinished_count = COALESCE((
                SELECT COUNT(*)
                FROM productivity.tasks t
                JOIN productivity.task_list_relations tlr ON t."TaskID" = tlr."TaskID"
                WHERE tlr."ListID" = l."ListID"
                AND t."StatusID" != 2
            ), 0),
            important_count = COALESCE((
                SELECT COUNT(*)
                FROM productivity.tasks t
                JOIN productivity.task_list_relations tlr ON t."TaskID" = tlr."TaskID"
                WHERE tlr."ListID" = l."ListID"
                AND t."PriorityID" = 3
                AND t."StatusID" != 2
            ), 0),
            background_count = COALESCE((
                SELECT COUNT(*)
                FROM productivity.tasks t
                JOIN productivity.task_list_relations tlr ON t."TaskID" = tlr."TaskID"
                WHERE tlr."ListID" = l."ListID"
                AND t."IsBackground" = true
                AND t."StatusID" != 2
            ), 0)
    """))


def downgrade():
    pass
