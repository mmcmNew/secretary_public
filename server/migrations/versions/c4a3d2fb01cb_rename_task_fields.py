"""Rename Task fields to end and completed_at

Revision ID: c4a3d2fb01cb
Revises: c73c77ebd0e9
Create Date: 2024-06-13 00:00:00.000000
"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'c4a3d2fb01cb'
down_revision = 'c73c77ebd0e9'
branch_labels = None
depends_on = None

def upgrade():
    pass  # columns kept the same; aliases added in code


def downgrade():
    pass
