"""Add list counter triggers

Revision ID: a88ac9e8a287
Revises: 5d732e1bcdb2
Create Date: 2025-07-25 14:01:41.556389

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'a88ac9e8a287'
down_revision = '5d732e1bcdb2'
branch_labels = None
depends_on = None


def upgrade():
    # Создаем функцию для обновления счетчиков при изменении задачи
    op.execute(sa.text("""
    CREATE OR REPLACE FUNCTION productivity.update_list_counters_for_task_changes()
    RETURNS TRIGGER AS $$
    BEGIN
        IF TG_OP = 'UPDATE' THEN
            -- Обновляем счетчики при изменении статуса
            IF NEW."StatusID" = 2 AND OLD."StatusID" != 2 THEN
                UPDATE productivity.lists l SET
                    unfinished_count = unfinished_count - 1,
                    important_count = CASE WHEN OLD."PriorityID" = 3 THEN important_count - 1 ELSE important_count END,
                    background_count = CASE WHEN OLD."IsBackground" = true THEN background_count - 1 ELSE background_count END
                FROM productivity.task_list_relations tlr
                WHERE tlr."ListID" = l."ListID" AND tlr."TaskID" = NEW."TaskID";
            ELSIF NEW."StatusID" != 2 AND OLD."StatusID" = 2 THEN
                UPDATE productivity.lists l SET
                    unfinished_count = unfinished_count + 1,
                    important_count = CASE WHEN NEW."PriorityID" = 3 THEN important_count + 1 ELSE important_count END,
                    background_count = CASE WHEN NEW."IsBackground" = true THEN background_count + 1 ELSE background_count END
                FROM productivity.task_list_relations tlr
                WHERE tlr."ListID" = l."ListID" AND tlr."TaskID" = NEW."TaskID";
            END IF;

            -- Обновляем счетчики при изменении важности
            IF NEW."PriorityID" = 3 AND OLD."PriorityID" != 3 AND NEW."StatusID" != 2 THEN
                UPDATE productivity.lists l SET
                    important_count = important_count + 1
                FROM productivity.task_list_relations tlr
                WHERE tlr."ListID" = l."ListID" AND tlr."TaskID" = NEW."TaskID";
            ELSIF NEW."PriorityID" != 3 AND OLD."PriorityID" = 3 AND NEW."StatusID" != 2 THEN
                UPDATE productivity.lists l SET
                    important_count = important_count - 1
                FROM productivity.task_list_relations tlr
                WHERE tlr."ListID" = l."ListID" AND tlr."TaskID" = NEW."TaskID";
            END IF;

            -- Обновляем счетчики при изменении фонового режима
            IF NEW."IsBackground" = true AND OLD."IsBackground" = false AND NEW."StatusID" != 2 THEN
                UPDATE productivity.lists l SET
                    background_count = background_count + 1
                FROM productivity.task_list_relations tlr
                WHERE tlr."ListID" = l."ListID" AND tlr."TaskID" = NEW."TaskID";
            ELSIF NEW."IsBackground" = false AND OLD."IsBackground" = true AND NEW."StatusID" != 2 THEN
                UPDATE productivity.lists l SET
                    background_count = background_count - 1
                FROM productivity.task_list_relations tlr
                WHERE tlr."ListID" = l."ListID" AND tlr."TaskID" = NEW."TaskID";
            END IF;
        END IF;
        RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
    """))

    # Создаем функцию для обновления счетчиков при изменении связей между задачами и списками
    op.execute(sa.text("""
    CREATE OR REPLACE FUNCTION productivity.update_list_counters_for_relations()
    RETURNS TRIGGER AS $$
    BEGIN
        IF TG_OP = 'INSERT' THEN
            -- При добавлении связи
            UPDATE productivity.lists l SET
                unfinished_count = unfinished_count + CASE 
                    WHEN EXISTS (
                        SELECT 1 FROM productivity.tasks t 
                        WHERE t."TaskID" = NEW."TaskID" AND t."StatusID" != 2
                    ) THEN 1 ELSE 0 END,
                important_count = important_count + CASE 
                    WHEN EXISTS (
                        SELECT 1 FROM productivity.tasks t 
                        WHERE t."TaskID" = NEW."TaskID" AND t."StatusID" != 2 AND t."PriorityID" = 3
                    ) THEN 1 ELSE 0 END,
                background_count = background_count + CASE 
                    WHEN EXISTS (
                        SELECT 1 FROM productivity.tasks t 
                        WHERE t."TaskID" = NEW."TaskID" AND t."StatusID" != 2 AND t."IsBackground" = true
                    ) THEN 1 ELSE 0 END
            WHERE l."ListID" = NEW."ListID";
        ELSIF TG_OP = 'DELETE' THEN
            -- При удалении связи
            UPDATE productivity.lists l SET
                unfinished_count = unfinished_count - CASE 
                    WHEN EXISTS (
                        SELECT 1 FROM productivity.tasks t 
                        WHERE t."TaskID" = OLD."TaskID" AND t."StatusID" != 2
                    ) THEN 1 ELSE 0 END,
                important_count = important_count - CASE 
                    WHEN EXISTS (
                        SELECT 1 FROM productivity.tasks t 
                        WHERE t."TaskID" = OLD."TaskID" AND t."StatusID" != 2 AND t."PriorityID" = 3
                    ) THEN 1 ELSE 0 END,
                background_count = background_count - CASE 
                    WHEN EXISTS (
                        SELECT 1 FROM productivity.tasks t 
                        WHERE t."TaskID" = OLD."TaskID" AND t."StatusID" != 2 AND t."IsBackground" = true
                    ) THEN 1 ELSE 0 END
            WHERE l."ListID" = OLD."ListID";
        END IF;
        RETURN NULL;
    END;
    $$ LANGUAGE plpgsql;
    """))

    # Создаем триггеры
    op.execute(sa.text("""
    DROP TRIGGER IF EXISTS tr_update_list_counters_for_task_changes ON productivity.tasks;
    CREATE TRIGGER tr_update_list_counters_for_task_changes
        AFTER UPDATE ON productivity.tasks
        FOR EACH ROW
        EXECUTE FUNCTION productivity.update_list_counters_for_task_changes();
    """))

    op.execute(sa.text("""
    DROP TRIGGER IF EXISTS tr_update_list_counters_for_relations ON productivity.task_list_relations;
    CREATE TRIGGER tr_update_list_counters_for_relations
        AFTER INSERT OR DELETE ON productivity.task_list_relations
        FOR EACH ROW
        EXECUTE FUNCTION productivity.update_list_counters_for_relations();
    """))


def downgrade():
    # Удаляем триггеры
    op.execute(sa.text("""
    DROP TRIGGER IF EXISTS tr_update_list_counters_for_task_changes ON productivity.tasks;
    DROP TRIGGER IF EXISTS tr_update_list_counters_for_relations ON productivity.task_list_relations;
    """))
    
    # Удаляем функции
    op.execute(sa.text("""
    DROP FUNCTION IF EXISTS productivity.update_list_counters_for_task_changes();
    DROP FUNCTION IF EXISTS productivity.update_list_counters_for_relations();
    """))
