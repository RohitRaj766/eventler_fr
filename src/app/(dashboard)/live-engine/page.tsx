'use client';

import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { fetchScheduleChanges, addRealtimeScheduleChange } from '@/features/liveEngine/liveEngineSlice';
import { socketService } from '@/services/socket';
import { SchedulePropagationTimeline } from '@/features/liveEngine/components/SchedulePropagationTimeline';

export default function LiveEnginePage() {
  const dispatch = useAppDispatch();
  const { scheduleChanges } = useAppSelector((state) => state.liveEngine);
  const { activeProgramTree } = useAppSelector((state) => state.program);

  useEffect(() => {
    if (activeProgramTree?.programId) {
      dispatch(fetchScheduleChanges(activeProgramTree.programId));
      socketService.connect();
      socketService.joinProgramRoom(activeProgramTree.programId);

      socketService.onTimelineUpdated((payload) => {
        if (payload?.changeLog) {
          dispatch(addRealtimeScheduleChange(payload.changeLog));
        }
      });

      return () => {
        socketService.leaveProgramRoom(activeProgramTree.programId);
      };
    }
  }, [dispatch, activeProgramTree]);

  return (
    <div className="space-y-6">
      <SchedulePropagationTimeline
        changes={scheduleChanges}
        activeProgramTree={activeProgramTree}
      />
    </div>
  );
}
