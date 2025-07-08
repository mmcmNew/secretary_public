"""add task type models

Revision ID: 1e71224aabe2
Revises: 62b74df5920e
Create Date: 2025-07-09 00:00:00.000000
"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '1e71224aabe2'
down_revision = '62b74df5920e'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'task_type_groups',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=255)),
        sa.Column('color', sa.String(length=20)),
        sa.Column('order', sa.Integer()),
        sa.Column('is_active', sa.Boolean(), server_default=sa.text('1')),
        sa.Column('description', sa.Text()),
    )

    op.create_table(
        'task_types',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('group_id', sa.Integer(), sa.ForeignKey('task_type_groups.id')),
        sa.Column('name', sa.String(length=255)),
        sa.Column('color', sa.String(length=20)),
        sa.Column('order', sa.Integer()),
        sa.Column('is_active', sa.Boolean(), server_default=sa.text('1')),
        sa.Column('description', sa.Text()),
    )

    with op.batch_alter_table('tasks') as batch_op:
        batch_op.alter_column('TaskTypeID', sa.Integer(), nullable=True)
        batch_op.create_foreign_key('fk_tasks_task_type', 'task_types', ['TaskTypeID'], ['id'])

    with op.batch_alter_table('anti_schedule') as batch_op:
        batch_op.alter_column('TaskTypeID', sa.Integer(), nullable=True)
        batch_op.create_foreign_key('fk_anti_schedule_task_type', 'task_types', ['TaskTypeID'], ['id'])

    with op.batch_alter_table('users') as batch_op:
        batch_op.drop_column('task_types')


def downgrade():
    with op.batch_alter_table('users') as batch_op:
        batch_op.add_column(sa.Column('task_types', sa.JSON()))

    with op.batch_alter_table('anti_schedule') as batch_op:
        batch_op.drop_constraint('fk_anti_schedule_task_type', type_='foreignkey')

    with op.batch_alter_table('tasks') as batch_op:
        batch_op.drop_constraint('fk_tasks_task_type', type_='foreignkey')

    op.drop_table('task_types')
    op.drop_table('task_type_groups')
