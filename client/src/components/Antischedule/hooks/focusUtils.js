import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

export function calculateRemainingTime(checkedTime, tz = null) {
  if (!checkedTime) return 0;
  if (tz == null) tz = dayjs.tz.guess();
  const target = dayjs(checkedTime).tz(tz);
  const now = dayjs().tz(tz);
  const targetSec = target.hour() * 3600 + target.minute() * 60 + target.second();
  const nowSec = now.hour() * 3600 + now.minute() * 60 + now.second();
  return Math.abs(nowSec - targetSec);
}

export function findNextInterval(intervals, tz = null) {
  if (tz == null) tz = dayjs.tz.guess();
  const now = dayjs().tz(tz);
  return intervals.find((i) => dayjs(i.end).tz(tz).isAfter(now)) || null;
}

export function checkIsTaskStart(task, tz = null) {
  if (tz == null) tz = dayjs.tz.guess();
  const start = dayjs(task.start).tz(tz);
  const now = dayjs().tz(tz);
  const startSec = start.hour() * 3600 + start.minute() * 60 + start.second();
  const nowSec = now.hour() * 3600 + now.minute() * 60 + now.second();
  return nowSec >= startSec;
}

export function calculateTaskDuration(task) {
  const start = dayjs(task.start);
  const end = dayjs(task.deadline);
  const startSec = start.hour() * 3600 + start.minute() * 60 + start.second();
  const endSec = end.hour() * 3600 + end.minute() * 60 + end.second();
  let duration = endSec - startSec;
  if (duration < 0) duration += 24 * 3600;
  return duration;
}

export function divideTaskWithBreaks(task, settings) {
  const intervalDuration = settings?.workIntervalDuration;
  const breakDuration = settings?.breakDuration;
  const additionalBreakDuration = settings?.additionalBreakDuration;

  const intervals = [];
  let remainingTime = calculateTaskDuration(task);
  const taskStart = dayjs(task.start);
  let current = dayjs().hour(taskStart.hour()).minute(taskStart.minute()).second(taskStart.second());

  let id = -1;
  let breakId = 0;
  let type = 'work';
  let currentBreak = breakDuration;
  let newDuration = 0;

  while (remainingTime > 0) {
    id++;
    const intervalStart = current;
    switch (type) {
      case 'work':
        if (remainingTime >= intervalDuration) {
          newDuration = intervalDuration;
          remainingTime -= intervalDuration;
        } else {
          newDuration = remainingTime;
          remainingTime = 0;
        }
        current = current.add(newDuration, 'second');
        intervals.push({
          id,
          duration: newDuration,
          type: 'work',
          isOnBreak: false,
          start: intervalStart.toISOString(),
          end: current.toISOString(),
        });
        type = 'break';
        continue;
      case 'break':
        if (remainingTime < currentBreak) {
          if (intervals.length > 0 && intervals[intervals.length - 1].type === 'work') {
            const last = intervals.length - 1;
            intervals[last].duration += remainingTime;
            intervals[last].end = current.add(remainingTime, 'second').toISOString();
            remainingTime = 0;
          } else {
            current = current.add(remainingTime, 'second');
            intervals.push({
              id,
              duration: remainingTime,
              type: 'work',
              isOnBreak: false,
              start: intervalStart.toISOString(),
              end: current.toISOString(),
            });
            remainingTime = 0;
          }
          type = 'work';
          continue;
        }
        if (breakId === 2 && remainingTime > additionalBreakDuration + 5) {
          currentBreak = additionalBreakDuration;
          breakId = 0;
        }
        breakId++;
        current = current.add(currentBreak, 'second');
        intervals.push({
          id,
          duration: currentBreak,
          type: 'break',
          isOnBreak: true,
          start: intervalStart.toISOString(),
          end: current.toISOString(),
        });
        remainingTime -= currentBreak;
        currentBreak = breakDuration;
        type = 'work';
        continue;
      default:
        break;
    }
  }

  if (intervals.length > 0 && intervals[intervals.length - 1].type === 'break') {
    const lastDur = intervals[intervals.length - 1].duration;
    const lastEnd = dayjs(intervals[intervals.length - 1].end);
    const lastStart = dayjs(intervals[intervals.length - 1].start);
    intervals.pop();
    if (lastDur === breakDuration) {
      intervals[intervals.length - 1].duration += breakDuration;
      intervals[intervals.length - 1].end = lastEnd;
    } else {
      const newBreakEnd = lastStart.add(breakDuration, 'second');
      intervals.push({
        id,
        duration: breakDuration,
        type: 'break',
        isOnBreak: true,
        start: lastStart.toISOString(),
        end: newBreakEnd.toISOString(),
      });
      const lastWorkDur = lastDur - breakDuration;
      const lastWorkEnd = newBreakEnd.add(lastWorkDur, 'second');
      intervals.push({
        id: id + 1,
        duration: lastWorkDur,
        type: 'work',
        isOnBreak: false,
        start: newBreakEnd.toISOString(),
        end: lastWorkEnd.toISOString(),
      });
    }
  }

  if (intervals.length > 0 && intervals[intervals.length - 1].duration < 1) {
    intervals.pop();
  }

  return intervals;
}

export function isTaskInPast(task, tz = null) {
  if (tz == null) tz = dayjs.tz.guess();
  if (!task || !task.deadline) return false;
  const now = dayjs().tz(tz);
  const end = dayjs(task.deadline).tz(tz);
  const endMin = end.hour() * 60 + (end.minute() - 1);
  const nowMin = now.hour() * 60 + now.minute();
  return endMin <= nowMin;
}

export function findNextTask(list, skipped) {
  const filtered = list?.filter((t) => !skipped.includes(t.id)) || [];
  return filtered.find((t) => !isTaskInPast(t)) || null;
}
