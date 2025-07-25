from sqlalchemy import create_engine, inspect

# Create the engine
engine = create_engine("postgresql+psycopg2://secretary:secretary@localhost:5432/secretary_db")

# Create an inspector
inspector = inspect(engine)

# Get all schema names
schemas = inspector.get_schema_names()
print('Schemas:', schemas)

# For each schema, get all table names
for schema in schemas:
    print(f'\nTables in {schema}:', inspector.get_table_names(schema=schema))
