CREATE TABLE task_type_groups (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    name VARCHAR(255),
    color VARCHAR(20),
    "order" INTEGER,
    is_active BOOLEAN DEFAULT 1,
    description TEXT
);

CREATE TABLE task_types (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    group_id INTEGER REFERENCES task_type_groups(id),
    name VARCHAR(255),
    color VARCHAR(20),
    "order" INTEGER,
    is_active BOOLEAN DEFAULT 1,
    description TEXT
);

ALTER TABLE tasks
    ADD CONSTRAINT fk_tasks_task_type FOREIGN KEY (TaskTypeID) REFERENCES task_types(id);

ALTER TABLE anti_schedule
    ADD CONSTRAINT fk_anti_schedule_task_type FOREIGN KEY (TaskTypeID) REFERENCES task_types(id);

ALTER TABLE users DROP COLUMN task_types;
