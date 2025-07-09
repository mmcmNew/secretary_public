from __future__ import with_statement
import logging
from logging.config import fileConfig

from alembic import context
from flask import current_app

import os
from app import create_app, db

# this is the Alembic Config object, which provides
# access to the values within the .ini file in use.
config = context.config

# Interpret the config file for Python logging.
# This line sets up loggers basically.
fileConfig(config.config_file_name)
logger = logging.getLogger('alembic.env')

mode = os.environ.get('MODE', 'development')
config_type = 'test' if mode == 'test' else 'work'
app = create_app(config_type)

target_metadata = db.metadata


def run_migrations_offline():
    with app.app_context():
        url = current_app.config.get('SQLALCHEMY_DATABASE_URI')
        context.configure(
            url=url,
            target_metadata=target_metadata,
            literal_binds=True,
            dialect_opts={"paramstyle": "named"},
            render_as_batch=True,
        )

        with context.begin_transaction():
            context.run_migrations()


def run_migrations_online():
    with app.app_context():
        connectable = db.engine

        with connectable.connect() as connection:
            context.configure(
                connection=connection,
                target_metadata=target_metadata,
                render_as_batch=True,
            )

            with context.begin_transaction():
                context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
