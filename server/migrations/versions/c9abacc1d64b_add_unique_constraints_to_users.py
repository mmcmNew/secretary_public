"""add unique constraints to users

Revision ID: c9abacc1d64b
Revises: 
Create Date: 2025-07-01 14:44:00
"""

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'c9abacc1d64b'
down_revision = None
branch_labels = None
depends_on = None

def upgrade():
    with op.batch_alter_table('users') as batch_op:
        batch_op.create_unique_constraint('uq_users_user_name', ['user_name'])
        batch_op.create_unique_constraint('uq_users_email', ['email'])

def downgrade():
    with op.batch_alter_table('users') as batch_op:
        batch_op.drop_constraint('uq_users_user_name', type_='unique')
        batch_op.drop_constraint('uq_users_email', type_='unique')
