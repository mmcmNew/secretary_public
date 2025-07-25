"""merge multiple heads

Revision ID: 28aacf38f6e1
Revises: add_task_list_indexes
Create Date: 2025-07-25 09:32:41.020292

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '28aacf38f6e1'
down_revision = 'add_task_list_indexes'
branch_labels = None
depends_on = None


def upgrade():
    pass


def downgrade():
    pass
