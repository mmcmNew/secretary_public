import { PropTypes } from 'prop-types';
import MyTimer from "./Timer/Timer";
import Metronome from "./Metronome";
import { Accordion, AccordionSummary, AccordionDetails, Typography, Box,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Autocomplete,
  TextField,
 } from "@mui/material";
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { useState, useMemo, useEffect } from 'react';
import IconButton from '@mui/material/IconButton';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import TTSText from './Scenario/TTSText';
import AudioPlayer from './Scenario/AudioPlayer';
import Survey from './Scenario/Survey';
import axios from 'axios';
import { apiGet } from '../utils/api';

async function getScenario(name){
      try {
        const { data } = await apiGet(`/get_scenario/${name}`);
        return data.scenario
      } catch (error) {
        console.error('Failed to fetch dashboard from server:', error);
        return null
      }
}

export default function ScenarioComponent({ isRunningProp=false, updateProgress  }) {
    const [isRunning, setIsRunning] = useState(isRunningProp);
    const [currentActionId, setCurrentActionId] = useState(null);
    const [expanded, setExpanded] = useState(false);
    const [localScenario, setLocalScenario] = useState(null);
    const [scenarioName, setScenarioName] = useState('my_day');

    const scenariesList = useMemo(() => [
        { label: 'Демонстрация', src: 'demo' },
        { label: 'Продуктивность', src: 'productivity' },
        { label: 'Расслабление', src: 'relax' },
        { label: 'Мой день', src: 'my_day' },
    ], []);

    useEffect(() => {
        if (!currentActionId)
            setCurrentActionId('el_0_0')
        setIsRunning(isRunningProp);
    }, [isRunningProp]);

    useEffect(() => {
        const stepId = currentActionId?.split('_')[1] || 0;
        const currentStepTitle = localScenario?.steps[stepId].name; // Название текущего действия
        const remainingTime = 600000; // Здесь указывается оставшееся время
        const progress = (remainingTime / 1000000) * 100;
        const scenarioTitle = scenariesList.find(item => item.src === scenarioName)?.label || 'Выберите сценарий';

        // Обновляем прогресс в MiniScenario
        if (updateProgress)
            updateProgress(scenarioTitle, progress, remainingTime, currentStepTitle);

    }, [isRunning, updateProgress, currentActionId, localScenario, scenarioName, scenariesList]);

    async function handleScenarioChange(event, newValue) {
        setScenarioName(newValue);
        setLocalScenario(null); // Clear current scenario
        setIsRunning(false); // Stop any running actions
        setCurrentActionId(null); // Reset the current action ID
        setExpanded(false); // Collapse any expanded steps

        const data = await apiGet(`/get_scenario/${newValue}`);

        setLocalScenario(data);
    }

    function onExpire(id) {
        if (!isRunning) return;
        console.log('onExpire ', id);
        const parts = id.split('_');
        const stepId = parts[1];
        let actionIndex = parseInt(parts[2]);
        if (actionIndex >= localScenario.steps[stepId].actions.length - 1) {
            actionIndex = 0;
            if (stepId >= localScenario.steps.length - 1) {
                setIsRunning(false);
                return;
            }
            console.log(`next step: el_${parseInt(stepId) + 1}_0`);
            setCurrentActionId(`el_${parseInt(stepId) + 1}_0`);
            setExpanded(`panel_${parseInt(stepId) + 1}`);
            return;
        }
        setCurrentActionId(`el_${stepId}_${actionIndex + 1}`);
        // console.log('onExpire ', id);
        // console.log('onExpire', stepId, actionIndex);
    }

    function renderElement(element, index, stepId) {
        const elementId = `el_${stepId}_${index}`;
        let initialTimeProp = 0;
        let initialEndTimeProp = null;
        let isRunningProp = false;
        switch (element.type) {
            case 'timer':
                // Проверка наличия ключа endtime и его значения
                // console.log('element', element)
                if (element.endtime) {
                    // console.log('endtime', element.endtime);
                    initialEndTimeProp = element.endtime;
                    isRunningProp = true
                } else {
                    // Рассчитываем initialTimeProp на основе времени в массиве element.time
                    for (let i = 0; i < element.time.length; i++) {
                        initialTimeProp += parseInt(element.time[i]) * Math.pow(60, element.time.length - 1 - i);
                    }
                }

                return <MyTimer
                    key={elementId}
                    id={elementId}
                    resultText={element.name}
                    initialEndTimeProp={initialEndTimeProp}
                    initialTimeProp={initialEndTimeProp ? undefined : initialTimeProp}
                    onExpireFunc={onExpire}
                    currentActionId={currentActionId}
                    isRunningProp={isRunningProp}
                />;
            case 'metronome':
                return <Metronome key={elementId} intialName={element.name} initialCount={element.count}
                initialBpm={element.bpm} id={elementId} onExpireFunc={onExpire} currentActionId={currentActionId} />;
            case 'text':
                return (
                    <TTSText key={elementId} element={element} elementId={elementId} isScenarioRunning={isRunning}
                    onExpireFunc={onExpire} currentActionId={currentActionId}/>
                );
            case 'audio':
                return <AudioPlayer key={elementId} element={element} elementId={elementId}
                    isStartPlay={false} onExpireFunc={onExpire} currentActionId={currentActionId} />;
            case 'survey':
                return <Survey key={elementId} id={elementId} survey={element} onExpireFunc={onExpire}
                    activeElementId={currentActionId}/>;
            default:
                return null;
        }
    }

    function handlePlayPause(stepId) {
        if (isRunning) {
            setIsRunning(false);
            return
        }
        setCurrentActionId(`el_${stepId}_0`);
        setIsRunning(true);
        setExpanded(`panel_${stepId}`);
    }

    function renderStep(step, stepId) {
        const isActive = expanded === `panel_${stepId}`;
        return (
            <Accordion key={stepId} expanded={isActive} onChange={() => setExpanded(isActive ? false : `panel_${stepId}`)}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{padding: 0}}>
                <ListItemButton sx={{margin: 0, padding: 0}}>
                    <ListItemIcon onClick={(event) => {
                        event.stopPropagation();
                        handlePlayPause(stepId);

                    }}>
                    <IconButton aria-label="play" color="primary">
                        {isRunning ? <PauseIcon /> : <PlayArrowIcon />}
                    </IconButton>
                    </ListItemIcon>
                    <ListItemText id={stepId} primary={'Этап ' + parseInt(stepId + 1) + '. ' + step.name} />
                </ListItemButton>
                </AccordionSummary>
                <AccordionDetails sx={{ border: 1, borderColor: 'divider', }}>
                    {step.actions.map((action, index) => (
                        <Box key={index} my={2} width={'100%'} sx={{alignItems: 'center', display: 'flex', justifyContent: 'center'}}>
                            {renderElement(action, index, stepId)}
                        </Box>
                    ))}
                </AccordionDetails>
            </Accordion>
        );
    }

    return (
        <Box sx={{ maxWidth: '700px', minWidth: '300px', margin: 'auto' }}>
            {/* Выпадающий список сценариев */}
            <Autocomplete
                disablePortal
                id="combo-box-demo"
                options={scenariesList}
                sx={{ width: '100%', padding: 1 }}
                renderInput={(params) => <TextField {...params} label="Сценарии" />}
                onChange={(event, newValue) => {
                    handleScenarioChange(event, newValue?.src || null);
                }}
            />
            {localScenario && (
                <>
                    <Typography variant="h4" sx={{ textAlign: 'center', m: 1}}>{localScenario.name}</Typography>
                    {localScenario.steps?.map((step, index) => (
                        renderStep(step, index)
                    ))}
                </>
            )}
        </Box>
    );

}

ScenarioComponent.propTypes = {
    scenario: PropTypes.object,
    isRunningProp: PropTypes.bool,
    updateProgress: PropTypes.func,
};
