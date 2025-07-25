"""add task list indexes

Revision ID: add_task_list_indexes
Revises: # you'll need to put the ID of your last migration here
Create Date: 2025-07-24 22:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic
revision = 'add_task_list_indexes'
down_revision = 'f11957b193b8'  # pointing to the other head
branch_labels = None
depends_on = None

def upgrade():
    # Add indexes for frequently queried columns
    op.create_index('idx_tasks_user_id', 'tasks', ['user_id'], schema='productivity')
    op.create_index('idx_tasks_status_id', 'tasks', ['StatusID'], schema='productivity')
    op.create_index('idx_lists_user_id', 'lists', ['user_id'], schema='productivity')
    
    # Add composite indexes for joins
    op.create_index(
        'idx_task_list_relations_composite',
        'task_list_relations',
        ['TaskID', 'ListID'],
        schema='productivity'
    )

def downgrade():
    op.drop_index('idx_task_list_relations_composite', table_name='task_list_relations', schema='productivity')
    op.drop_index('idx_lists_user_id', table_name='lists', schema='productivity')
    op.drop_index('idx_tasks_status_id', table_name='tasks', schema='productivity')
    op.drop_index('idx_tasks_user_id', table_name='tasks', schema='productivity')
