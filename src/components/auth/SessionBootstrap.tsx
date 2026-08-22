'use client';

import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import {
  beginSessionRestore,
  fetchCurrentUser,
  noSessionToRestore,
} from '@/features/auth/authSlice';
import { fetchOrgMetadata, fetchSystemMetadata } from '@/features/meta/metaSlice';
import { hasStoredSession } from '@/services/api';

/**
 * Restores the session once per page load and keeps derived caches in step.
 *
 * Runs above the route tree so both the auth and dashboard layouts can read a
 * settled `status` instead of each deciding independently whether to call
 * `/auth/me` — which is what previously caused duplicate requests on boot.
 */
export function SessionBootstrap() {
  const dispatch = useAppDispatch();
  const status = useAppSelector((state) => state.auth.status);
  const activeOrgId = useAppSelector((state) => state.auth.activeOrgId);

  // Boot: restore a stored session, or settle as signed out.
  useEffect(() => {
    if (status !== 'idle') return;
    if (!hasStoredSession()) {
      dispatch(noSessionToRestore());
      return;
    }
    dispatch(beginSessionRestore());
    void dispatch(fetchCurrentUser());
  }, [dispatch, status]);

  // System metadata is immutable and fetched once, after sign-in.
  useEffect(() => {
    if (status !== 'authenticated') return;
    void dispatch(fetchSystemMetadata());
  }, [dispatch, status]);

  // Org-scoped metadata is re-fetched whenever the tenant context changes.
  useEffect(() => {
    if (status !== 'authenticated' || !activeOrgId) return;
    void dispatch(fetchOrgMetadata());
  }, [dispatch, status, activeOrgId]);

  return null;
}
