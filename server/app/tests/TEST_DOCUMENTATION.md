# Test Documentation

This document provides an overview of the tests in the application.

## `test_instance_endpoint.py`

- **`test_create_override`**: Creates a parent task and then creates an override for a specific instance of that task.
- **`test_update_override`**: Creates a parent task, creates an override, and then updates that override.
- **`test_delete_override_when_no_diff`**: Creates a parent task, creates an override, and then deletes the override by patching it with the same data as the parent.
- **`test_skip_instance`**: Creates a parent task and then skips a specific instance of that task.

## `test_tasks_add_list.py`

- **`test_add_list_success`**: Tests successful addition of a list.
- **`test_add_group_success`**: Tests successful addition of a group.
- **`test_add_project_success`**: Tests successful addition of a project.
- **`test_add_list_without_title`**: Tests adding a list without a title, expecting a default title to be assigned.
- **`test_add_list_invalid_type`**: Tests adding an object with an invalid type.
- **`test_add_list_unauthorized`**: Tests adding a list without authorization.

## `test_tasks_add_list_fixed.py`

- **`test_add_list_success`**: Tests successful addition of a list.
- **`test_add_group_success`**: Tests successful addition of a group.
- **`test_add_project_success`**: Tests successful addition of a project.
- **`test_add_list_without_title`**: Tests adding a list without a title, expecting a default title to be assigned.
- **`test_add_list_invalid_type`**: Tests adding an object with an invalid type.
- **`test_add_list_unauthorized`**: Tests adding a list without authorization.

## `test_tasks_add_subtask.py`

- **`test_add_subtask_success`**: Tests successful addition of a subtask.
- **`test_add_subtask_without_parent`**: Tests adding a subtask without a parent task.
- **`test_add_subtask_parent_not_found`**: Tests adding a subtask with a non-existent parent task.
- **`test_add_subtask_without_title`**: Tests adding a subtask without a title.
- **`test_add_subtask_unauthorized`**: Tests adding a subtask without authorization.

## `test_tasks_add_task.py`

- **`test_add_task_success`**: Tests successful addition of a task.
- **`test_add_task_without_title`**: Tests adding a task without a title.
- **`test_add_task_with_due_date`**: Tests adding a task with a due date.
- **`test_add_task_to_my_day`**: Tests adding a task to 'My Day'.
- **`test_add_task_to_important`**: Tests adding an important task.
- **`test_add_task_to_background`**: Tests adding a background task.
- **`test_add_task_unauthorized`**: Tests adding a task without authorization.

## `test_tasks_add_task_fixed.py`

- **`test_add_task_success`**: Tests successful addition of a task.
- **`test_add_task_without_title`**: Tests adding a task without a title.
- **`test_add_task_with_due_date`**: Tests adding a task with a due date.
- **`test_add_task_to_my_day`**: Tests adding a task to 'My Day'.
- **`test_add_task_to_important`**: Tests adding an important task.
- **`test_add_task_to_background`**: Tests adding a background task.
- **`test_add_task_unauthorized`**: Tests adding a task without authorization.

## `test_tasks_change_status.py`

- **`test_change_task_status_to_completed`**: Tests changing a task's status to 'Completed'.
- **`test_change_task_status_to_in_progress`**: Tests changing a task's status to 'In Progress'.
- **`test_change_status_task_not_found`**: Tests changing the status of a non-existent task.
- **`test_change_status_invalid_status_id`**: Tests changing the status with an invalid status ID.
- **`test_change_status_with_completion_date`**: Tests changing the status with a completion date.
- **`test_change_status_unauthorized`**: Tests changing the status without authorization.

## `test_tasks_del_task.py`

- **`test_delete_task_success`**: Tests successful deletion of a task.
- **`test_delete_task_not_found`**: Tests deleting a non-existent task.
- **`test_delete_task_without_task_id`**: Tests deleting a task without specifying an ID.
- **`test_delete_task_invalid_data`**: Tests deleting a task with invalid data.
- **`test_delete_task_unauthorized`**: Tests deleting a task without authorization.

## `test_tasks_delete_from_childes.py`

- **`test_delete_from_childes_success`**: Tests successful deletion of an item from a list of children.
- **`test_delete_from_childes_special_list`**: Tests deleting from a special list's children.
- **`test_delete_from_childes_without_group_id`**: Tests deleting from children without specifying a group ID.
- **`test_delete_from_childes_invalid_source`**: Tests deleting a non-existent item from children.
- **`test_delete_from_childes_unauthorized`**: Tests deleting from children without authorization.

## `test_tasks_edit_list.py`

- **`test_edit_list_success`**: Tests successful editing of a list.
- **`test_edit_group_success`**: Tests successful editing of a group.
- **`test_edit_project_success`**: Tests successful editing of a project.
- **`test_edit_list_not_found`**: Tests editing a non-existent list.
- **`test_edit_list_invalid_data`**: Tests editing a list with invalid data.
- **`test_edit_list_unauthorized`**: Tests editing a list without authorization.

## `test_tasks_edit_task.py`

- **`test_edit_task_success`**: Tests successful editing of a task.
- **`test_edit_task_not_found`**: Tests editing a non-existent task.
- **`test_edit_task_invalid_id`**: Tests editing a task with an invalid ID.
- **`test_edit_task_with_due_date`**: Tests editing a task with a due date.
- **`test_edit_task_clear_field`**: Tests clearing a task's field.
- **`test_edit_task_unauthorized`**: Tests editing a task without authorization.

## `test_tasks_fields_config.py`

- **`test_get_fields_config_success`**: Tests successful retrieval of the task fields configuration.
- **`test_get_fields_config_with_task_types`**: Tests retrieving the task fields configuration with task types.
- **`test_get_fields_config_unauthorized`**: Tests retrieving the task fields configuration without authorization.
- **`test_get_fields_config_cached`**: Tests caching of the task fields configuration.

## `test_tasks_get_calendar_events.py`

- **`test_get_calendar_events_success`**: Tests successful retrieval of calendar events.
- **`test_get_calendar_events_without_dates`**: Tests retrieving calendar events without specifying dates.
- **`test_get_calendar_events_with_my_day`**: Tests retrieving calendar events for 'My Day'.
- **`test_get_calendar_events_empty_range`**: Tests retrieving calendar events for an empty date range.
- **`test_get_calendar_events_invalid_dates`**: Tests retrieving calendar events with invalid dates.
- **`test_get_calendar_events_unauthorized`**: Tests retrieving calendar events without authorization.
- **`test_get_calendar_events_cached`**: Tests caching of calendar events.

## `test_tasks_get_lists.py`

- **`test_get_lists_success`**: Tests successful retrieval of task lists.
- **`test_get_lists_tree_success`**: Tests successful retrieval of the task list tree.
- **`test_get_lists_tree_unauthorized`**: Tests retrieving the task list tree without authorization.
- **`test_get_lists_tree_with_timezone`**: Tests retrieving the task list tree with a timezone.
- **`test_get_lists_tree_with_invalid_timezone`**: Tests retrieving the task list tree with an invalid timezone.
- **`test_get_lists_unauthorized`**: Tests retrieving task lists without authorization.
- **`test_get_lists_with_timezone`**: Tests retrieving task lists with a timezone.
- **`test_get_lists_with_invalid_timezone`**: Tests retrieving task lists with an invalid timezone.

## `test_tasks_get_subtasks.py`

- **`test_get_subtasks_success`**: Tests successful retrieval of subtasks.
- **`test_get_subtasks_empty`**: Tests retrieving subtasks when there are none.
- **`test_get_subtasks_not_found`**: Tests retrieving subtasks for a non-existent task.
- **`test_get_subtasks_invalid_id`**: Tests retrieving subtasks with an invalid parent task ID.
- **`test_get_subtasks_preserve_order`**: Tests that the order of subtasks is preserved.
- **`test_get_subtasks_unauthorized`**: Tests retrieving subtasks without authorization.
- **`test_get_subtasks_cached`**: Tests caching of subtasks.

## `test_tasks_get_tasks.py`

- **`test_get_tasks_by_list_id`**: Tests retrieving tasks by list ID.
- **`test_get_all_tasks`**: Tests retrieving all tasks.
- **`test_get_tasks_without_list_id`**: Tests retrieving tasks without specifying a list ID.
- **`test_get_tasks_with_date_range`**: Tests retrieving tasks within a date range.
- **`test_get_tasks_unauthorized`**: Tests retrieving tasks without authorization.
- **`test_get_tasks_invalid_list_id`**: Tests retrieving tasks with an invalid list ID.

## `test_tasks_get_tasks_by_ids.py`

- **`test_get_tasks_by_ids_success`**: Tests successful retrieval of tasks by their IDs.
- **`test_get_tasks_by_ids_empty_list`**: Tests retrieving tasks with an empty list of IDs.
- **`test_get_tasks_by_ids_invalid_ids`**: Tests retrieving tasks with invalid IDs.
- **`test_get_tasks_by_ids_nonexistent_tasks`**: Tests retrieving non-existent tasks by ID.
- **`test_get_tasks_by_ids_mixed_existing_and_nonexistent`**: Tests retrieving tasks with a mix of existing and non-existent IDs.
- **`test_get_tasks_by_ids_unauthorized`**: Tests retrieving tasks by ID without authorization.

## `test_tasks_integration_uuid.py`

- **`test_full_workflow_with_uuid`**: An integration test for the full workflow using UUIDs.
- **`test_uuid_consistency_across_operations`**: Tests the consistency of UUIDs across all operations.
- **`test_error_handling_with_invalid_uuids`**: Tests error handling with invalid UUIDs.
- **`test_uuid_format_validation`**: Tests the validation of the UUID format.

## `test_tasks_link_group_list.py`

- **`test_link_group_to_list_success`**: Tests successfully linking a group to a list.
- **`test_link_project_to_list_success`**: Tests successfully linking a project to a list.
- **`test_link_group_list_invalid_source`**: Tests linking with an invalid source.
- **`test_link_group_list_invalid_target`**: Tests linking with an invalid target.
- **`test_link_group_list_unauthorized`**: Tests linking a group and list without authorization.

## `test_tasks_link_task.py`

- **`test_link_task_to_list_success`**: Tests successfully linking a task to a list.
- **`test_link_task_to_task_success`**: Tests successfully linking a task to another task (creating a subtask).
- **`test_link_task_move_action`**: Tests linking a task with a move action.
- **`test_link_task_invalid_task_id`**: Tests linking with an invalid task ID.
- **`test_link_task_to_itself`**: Tests attempting to link a task to itself.
- **`test_link_task_unauthorized`**: Tests linking a task without authorization.

## `test_tasks_minimal_uuid.py`

- **`test_basic_uuid_operations`**: A minimal test for basic operations with UUIDs.
- **`test_task_types_uuid`**: Tests task types with UUIDs.
- **`test_subtasks_uuid`**: Tests subtasks with UUIDs.
- **`test_error_handling_uuid`**: Tests error handling with UUIDs.

## `test_tasks_task_type_groups_delete.py`

- **`test_delete_task_type_group_success`**: Tests successful deletion of a task type group.
- **`test_delete_task_type_group_not_found`**: Tests deleting a non-existent task type group.
- **`test_delete_task_type_group_invalid_id`**: Tests deleting a task type group with an invalid ID.
- **`test_delete_task_type_group_with_types`**: Tests deleting a task type group that contains task types.
- **`test_delete_task_type_group_unauthorized`**: Tests deleting a task type group without authorization.

## `test_tasks_task_type_groups_get.py`

- **`test_get_task_type_groups_success`**: Tests successful retrieval of task type groups.
- **`test_get_task_type_groups_empty`**: Tests retrieving task type groups when there are none.
- **`test_get_task_type_groups_unauthorized`**: Tests retrieving task type groups without authorization.
- **`test_get_task_type_groups_cached`**: Tests caching of task type groups.

## `test_tasks_task_type_groups_post.py`

- **`test_create_task_type_group_success`**: Tests successful creation of a task type group.
- **`test_create_task_type_group_minimal_data`**: Tests creating a task type group with minimal data.
- **`test_create_task_type_group_without_name`**: Tests creating a task type group without a name.
- **`test_create_task_type_group_empty_name`**: Tests creating a task type group with an empty name.
- **`test_create_task_type_group_unauthorized`**: Tests creating a task type group without authorization.
- **`test_create_task_type_group_invalid_json`**: Tests creating a task type group with invalid JSON.

## `test_tasks_task_type_groups_put.py`

- **`test_update_task_type_group_success`**: Tests successful update of a task type group.
- **`test_update_task_type_group_partial_data`**: Tests partially updating a task type group.
- **`test_update_task_type_group_not_found`**: Tests updating a non-existent task type group.
- **`test_update_task_type_group_invalid_id`**: Tests updating a task type group with an invalid ID.
- **`test_update_task_type_group_unauthorized`**: Tests updating a task type group without authorization.
- **`test_update_task_type_group_empty_data`**: Tests updating a task type group with empty data.

## `test_tasks_task_types_delete.py`

- **`test_delete_task_type_success`**: Tests successful deletion of a task type.
- **`test_delete_task_type_not_found`**: Tests deleting a non-existent task type.
- **`test_delete_task_type_invalid_id`**: Tests deleting a task type with an invalid ID.
- **`test_delete_task_type_assigned_to_tasks`**: Tests deleting a task type that is assigned to tasks.
- **`test_delete_task_type_unauthorized`**: Tests deleting a task type without authorization.

## `test_tasks_task_types_get.py`

- **`test_get_task_types_success`**: Tests successful retrieval of task types.
- **`test_get_task_types_empty`**: Tests retrieving task types when there are none.
- **`test_get_task_types_with_group_info`**: Tests retrieving task types with group information.
- **`test_get_task_types_unauthorized`**: Tests retrieving task types without authorization.
- **`test_get_task_types_cached`**: Tests caching of task types.

## `test_tasks_task_types_post.py`

- **`test_create_task_type_success`**: Tests successful creation of a task type.
- **`test_create_task_type_minimal_data`**: Tests creating a task type with minimal data.
- **`test_create_task_type_without_name`**: Tests creating a task type without a name.
- **`test_create_task_type_with_nonexistent_group`**: Tests creating a task type with a non-existent group.
- **`test_create_task_type_empty_name`**: Tests creating a task type with an empty name.
- **`test_create_task_type_unauthorized`**: Tests creating a task type without authorization.
- **`test_create_task_type_invalid_json`**: Tests creating a task type with invalid JSON.

## `test_tasks_task_types_put.py`

- **`test_update_task_type_success`**: Tests successful update of a task type.
- **`test_update_task_type_partial_data`**: Tests partially updating a task type.
- **`test_update_task_type_not_found`**: Tests updating a non-existent task type.
- **`test_update_task_type_invalid_id`**: Tests updating a task type with an invalid ID.
- **`test_update_task_type_with_nonexistent_group`**: Tests updating a task type with a non-existent group.
- **`test_update_task_type_unauthorized`**: Tests updating a task type without authorization.
- **`test_update_task_type_empty_data`**: Tests updating a task type with empty data.

## `test_tasks_task_types_updated.py`

- **`test_get_task_types_empty`**: Tests getting an empty list of task types.
- **`test_add_task_type_success`**: Tests successful addition of a task type.
- **`test_add_task_type_with_group`**: Tests adding a task type with a group.
- **`test_add_task_type_missing_name`**: Tests adding a task type without a name.
- **`test_edit_task_type_success`**: Tests successful editing of a task type.
- **`test_edit_task_type_not_found`**: Tests editing a non-existent task type.
- **`test_delete_task_type_success`**: Tests successful deletion of a task type.
- **`test_delete_task_type_not_found`**: Tests deleting a non-existent task type.
- **`test_get_task_types_after_creation`**: Tests getting task types after creation.
- **`test_task_type_groups_crud`**: Tests CRUD operations for task type groups.
- **`test_fields_config_with_task_types`**: Tests getting fields configuration with task types.
- **`test_task_type_unauthorized_access`**: Tests unauthorized access to task types.

## `test_tasks_uuid_support.py`

- **`test_add_task_to_custom_list`**: Tests adding a task to a custom list with a UUID.
- **`test_get_tasks_from_custom_list`**: Tests getting tasks from a custom list with a UUID.
- **`test_get_tasks_by_uuid_ids`**: Tests getting tasks by UUID identifiers.
- **`test_edit_task_with_uuid`**: Tests editing a task with a UUID.
- **`test_change_task_status_with_uuid`**: Tests changing the status of a task with a UUID.
- **`test_delete_task_with_uuid`**: Tests deleting a task with a UUID.
- **`test_add_subtask_with_uuid`**: Tests adding a subtask with a UUID.
- **`test_get_subtasks_with_uuid`**: Tests getting subtasks with a UUID.
- **`test_edit_list_with_uuid`**: Tests editing a list with a UUID.
- **`test_link_group_list_with_uuid`**: Tests linking a group and list with UUIDs.
- **`test_get_lists_returns_uuid_ids`**: Tests that getting lists returns UUID identifiers.
- **`test_invalid_uuid_handling`**: Tests handling of invalid UUIDs.
