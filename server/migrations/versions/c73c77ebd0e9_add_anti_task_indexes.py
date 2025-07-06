"""Add indexes to AntiTask

Revision ID: c73c77ebd0e9
Revises: 
Create Date: 2024-06-10 00:00:00.000000
"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'c73c77ebd0e9'
down_revision = None
branch_labels = None
depends_on = None

def upgrade():
    op.create_index('ix_anti_schedule_user_id', 'anti_schedule', ['user_id'])
    op.create_index('ix_anti_schedule_start', 'anti_schedule', ['Start'])


def downgrade():
    op.drop_index('ix_anti_schedule_start', table_name='anti_schedule')
    op.drop_index('ix_anti_schedule_user_id', table_name='anti_schedule')
