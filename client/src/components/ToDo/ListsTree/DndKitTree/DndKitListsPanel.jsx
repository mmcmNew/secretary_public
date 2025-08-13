import React from 'react';
import PropTypes from 'prop-types';
import { Box, Button, Divider, IconButton } from '@mui/material';
import QueueIcon from '@mui/icons-material/Queue';
import { AccountTree } from '@mui/icons-material';
import DndKitTree from './DndKitTree';
import { useGetListsTreeQuery, useAddObjectMutation, useMoveListObjectMutation, useUpdateListMutation } from '../../../../store/listsSlice';

import { useDispatch } from 'react-redux';
import { DndContext } from '@dnd-kit/core';
// import { setSelectedListId } from '../../../../store/todoLayoutSlice';

const DndKitListsPanel = ({ mobile }) => {
    const dispatch = useDispatch();
    const { data, error, isLoading } = useGetListsTreeQuery();
    const [addObject] = useAddObjectMutation();
    const [moveListObject] = useMoveListObjectMutation();
    const [updateList] = useUpdateListMutation();
    const [selectedListId, setSelectedListIdState] = React.useState(null);

    const handleDragEnd = (event) => {
        const { active, over } = event;

        if (!over) {
            return;
        }

        const activeId = active.id;
        const overId = over.id;

        if (activeId === overId) {
            return;
        }

        const activeItem = findItem(data, activeId);
        const overItem = findItem(data, overId);

        if (!activeItem || !overItem) {
            return;
        }

        const activeSection = findSection(data, activeId);
        const overSection = findSection(data, overId);

        if (!activeSection || !overSection) {
            return;
        }

        // Rule 1: Projects can only be sorted within their section
        if (activeItem.data.type === 'project' && activeSection.id !== overSection.id) {
            return;
        }

        // Rule 2: Groups can be moved within their section and into projects
        if (activeItem.data.type === 'group') {
            if (activeSection.id !== overSection.id && overItem.data.type !== 'project') {
                return;
            }
        }

        // Rule 3: Lists can be moved into groups and projects
        if (activeItem.data.type === 'list') {
            if (overItem.data.type !== 'group' && overItem.data.type !== 'project') {
                return;
            }
        }

        // Optimistic update
        const newSections = [...data];
        const activeSectionIndex = newSections.findIndex(s => s.id === activeSection.id);
        const overSectionIndex = newSections.findIndex(s => s.id === overSection.id);

        const activeSectionItems = [...newSections[activeSectionIndex].data];
        const activeItemIndex = activeSectionItems.findIndex(item => item.id === activeId);
        const [movedItem] = activeSectionItems.splice(activeItemIndex, 1);

        if (activeSection.id === overSection.id) {
            const overItemIndex = activeSectionItems.findIndex(item => item.id === overId);
            activeSectionItems.splice(overItemIndex, 0, movedItem);
            newSections[activeSectionIndex] = { ...newSections[activeSectionIndex], data: activeSectionItems };
        } else {
            const overSectionItems = [...newSections[overSectionIndex].data];
            const overItemIndex = overSectionItems.findIndex(item => item.id === overId);
            overSectionItems.splice(overItemIndex, 0, movedItem);
            newSections[activeSectionIndex] = { ...newSections[activeSectionIndex], data: activeSectionItems };
            newSections[overSectionIndex] = { ...newSections[overSectionIndex], data: overSectionItems };
        }

        // This is a simplified optimistic update. A more robust solution would involve
        // updating the parent-child relationships and calling the mutation.
        console.log('New sections:', newSections);
        // Here you would call the mutation to persist the changes
        // moveListObject({ ... });
    };

    const findSection = (sections, itemId) => {
        return sections.find(section => section.data.some(item => item.id === itemId));
    };

    const findItem = (sections, itemId) => {
        for (const section of sections) {
            const item = section.data.find(i => i.id === itemId);
            if (item) {
                return item;
            }
        }
        return null;
    };

    const handleAddList = () => {
        addObject({ type: 'list', title: 'Новый список' });
    };

    const handleAddGroup = () => {
        addObject({ type: 'group', title: 'Новая группа' });
    };

    const handleAddProject = () => {
        addObject({ type: 'project', title: 'Новый проект' });
    };

    const handleSetSelectedListId = (listId) => {
        // dispatch(setSelectedListId(listId));
        setSelectedListIdState(listId);
    };

    if (isLoading) return <div>Загрузка списков...</div>;
    if (error) return <div>Ошибка: {error.message}</div>;
    if (!data || data.length === 0) return <div>Нет данных для отображения.</div>;

    return (
        <Box
          sx={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            width: '100%'
          }}
        >
            <DndContext onDragEnd={handleDragEnd}>
                <Box sx={{ flexGrow: 1, overflowY: 'auto', height: mobile ? '90%' : '100%' }}>
                    {data.map((section, index) => (
                    <Box key={section.id} sx={{ mb: 2, width: '97%' }}>
                        <h3>{section.name}</h3>
                        <DndKitTree
                            treeData={section.data}
                            onSelect={handleSetSelectedListId}
                            selectedId={selectedListId}
                            onRename={(id, newTitle) => {
                                updateList({ listId: id, title: newTitle });
                            }}
                        />
                        {index === data.length - 1 ? null : <Divider />}
                    </Box>
                    ))}
                </Box>
            </DndContext>
          <Box sx={{ display: 'flex', flexDirection: 'row', width: '100%', mt: 1 }}>
            <Button variant="outlined" sx={{ width: '100%' }} onClick={handleAddList}>
              Создать список
            </Button>
            <IconButton variant="outlined" sx={{ alignSelf: 'center' }} onClick={handleAddGroup}>
              <QueueIcon />
            </IconButton>
            <IconButton variant="outlined" sx={{ alignSelf: 'center' }} onClick={handleAddProject}>
              <AccountTree />
            </IconButton>
          </Box>
        </Box>
      );
};

DndKitListsPanel.propTypes = {
    mobile: PropTypes.bool,
};

export default DndKitListsPanel;