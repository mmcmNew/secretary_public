"""add task type groups

Revision ID: 62b74df5920e
Revises: c4a3d2fb01cb
Create Date: 2025-07-08 06:51:40.124123

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '62b74df5920e'
down_revision = 'c4a3d2fb01cb'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'task_type_groups',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('name', sa.String(length=255)),
        sa.Column('color', sa.String(length=20)),
        sa.Column('order', sa.Integer()),
        sa.Column('is_active', sa.Boolean(), server_default=sa.text('1')),
        sa.Column('description', sa.Text())
    )

    op.add_column('task_types', sa.Column('GroupID', sa.Integer(), sa.ForeignKey('task_type_groups.id')))
    op.add_column('task_types', sa.Column('IsActive', sa.Boolean(), server_default=sa.text('1')))
    op.add_column('task_types', sa.Column('Order', sa.Integer()))
    op.add_column('task_types', sa.Column('Description', sa.Text()))
    op.drop_column('task_types', 'PeriodType')
    op.drop_column('task_types', 'Type')
    op.drop_column('task_types', 'Icon')
    op.drop_column('task_types', 'GroupLabel')

    connection = op.get_bind()
    labels = connection.execute(sa.text('SELECT DISTINCT GroupLabel FROM task_types')).fetchall()
    for row in labels:
        label = row[0]
        if label:
            connection.execute(sa.text('INSERT INTO task_type_groups (name) VALUES (:name)'), {'name': label})
            connection.execute(sa.text('UPDATE task_types SET GroupID=(SELECT id FROM task_type_groups WHERE name=:name) WHERE GroupLabel=:name'), {'name': label})
    connection.execute(sa.text('UPDATE task_types SET IsActive=1 WHERE IsActive IS NULL'))

def downgrade():
    op.add_column('task_types', sa.Column('GroupLabel', sa.String(length=255)))
    op.add_column('task_types', sa.Column('Icon', sa.String(length=255)))
    op.add_column('task_types', sa.Column('Type', sa.String(length=255)))
    op.add_column('task_types', sa.Column('PeriodType', sa.String(length=255)))
    op.drop_column('task_types', 'Description')
    op.drop_column('task_types', 'Order')
    op.drop_column('task_types', 'IsActive')
    op.drop_column('task_types', 'GroupID')
    op.drop_table('task_type_groups')
