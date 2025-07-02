"""add data_dir column to users

Revision ID: a1b2c3d4e5
Revises: c9abacc1d64b
Create Date: 2025-08-01
"""

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'a1b2c3d4e5'
down_revision = 'c9abacc1d64b'
branch_labels = None
depends_on = None

def upgrade():
    with op.batch_alter_table('users') as batch_op:
        batch_op.add_column(sa.Column('data_dir', sa.Text()))

def downgrade():
    with op.batch_alter_table('users') as batch_op:
        batch_op.drop_column('data_dir')
