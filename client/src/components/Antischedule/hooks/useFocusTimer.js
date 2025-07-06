import { useState, useRef, useEffect } from 'react';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

export default function useFocusTimer(initialState = {}) {
  const [timerState, setTimerState] = useState({
    remainingTime: initialState.remainingTime || 1500,
    isOnBreak: initialState.isOnBreak || false,
    currentIntervalIndex: initialState.currentIntervalIndex || 0,
    currentIntervalEndDate: initialState.currentIntervalEndDate || null,
    currentIntervalDuration: initialState.currentIntervalDuration || 25 * 60,
  });

  const timerRef = useRef(null);
  const callbackRef = useRef(null);

  const updateTimerState = (updates) => {
    setTimerState((prev) => ({ ...prev, ...updates }));
  };

  const calculateRemainingTime = (checkedTime, tz) => {
    if (!checkedTime) return 0;
    if (!tz) tz = dayjs.tz.guess();
    const target = dayjs(checkedTime).tz(tz);
    const now = dayjs().tz(tz);
    const targetSec = target.hour()*3600 + target.minute()*60 + target.second();
    const nowSec = now.hour()*3600 + now.minute()*60 + now.second();
    return Math.abs(nowSec - targetSec);
  };

  const startTimer = (endDate, tz, onFinish) => {
    if (!endDate) return;
    if (!tz) tz = dayjs.tz.guess();

    stopTimer();
    callbackRef.current = onFinish;

    const tick = () => {
      const remaining = calculateRemainingTime(endDate, tz);
      updateTimerState({ remainingTime: remaining });

      const isFinished = dayjs().tz(tz).isAfter(dayjs(endDate).tz(tz));
      if (isFinished) {
        stopTimer();
        if (typeof callbackRef.current === 'function') {
          callbackRef.current();
        }
        return;
      }

      timerRef.current = requestAnimationFrame(tick);
    };

    timerRef.current = requestAnimationFrame(tick);
  };

  const stopTimer = () => {
    if (timerRef.current) {
      cancelAnimationFrame(timerRef.current);
      timerRef.current = null;
    }
  };

  useEffect(() => () => stopTimer(), []);

  const formatRemainingTime = (time) => {
    const hours = Math.floor(time / 3600);
    const minutes = Math.floor((time % 3600) / 60);
    const seconds = time % 60;
    let result = '';
    if (hours > 0) result += `${hours < 10 ? `0${hours}` : hours}:`;
    result += `${minutes < 10 ? `0${minutes}` : minutes}:${seconds < 10 ? `0${seconds}` : seconds}`;
    return result;
  };

  const progress = (timerState.remainingTime / timerState.currentIntervalDuration) * 100;

  return { timerState, updateTimerState, startTimer, stopTimer, formatRemainingTime, progress };
}
