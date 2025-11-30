import { useState, useEffect } from 'react';

const CAD_JOB_ID_REGEX =
  /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
const TERMINAL_CAD_STATUSES = new Set([
  'completed',
  'failed',
  'rejected',
  'cancelled',
  'canceled',
]);

const isTerminalCadStatus = (status?: string | number) => {
  if (!status || typeof status !== 'string') return false;
  return TERMINAL_CAD_STATUSES.has(status.trim().toLowerCase());
};

interface UseCADJobProps {
  jobId?: string;
  cadJobStatus?: string;
  kittyCADKey: string;
  refreshTabs: () => void;
}

export function useCADJob({ jobId, cadJobStatus, kittyCADKey, refreshTabs }: UseCADJobProps) {
  const [cadJobError, setCadJobError] = useState<string | null>(null);

  // Fetch CAD file when jobId changes
  useEffect(() => {
    if (!jobId || !CAD_JOB_ID_REGEX.test(jobId)) {
      return;
    }

    const handleCADfile = async () => {
      setCadJobError(null);

      try {
        const response = await fetch(`/api/cad-proxy?cadId=${encodeURIComponent(jobId)}`, {
          body: JSON.stringify({ kittyCADKey }),
          headers: {
            'Content-Type': 'application/json',
          },
          method: 'POST',
          credentials: 'include',
          mode: 'cors',
          cache: 'no-store',
          redirect: 'follow',
        });
        const clonedResponse = response.clone();
        let payload: unknown;

        try {
          payload = await response.json();
        } catch {
          payload = await clonedResponse.text();
        }

        if (!response.ok) {
          const errorMessage = typeof payload === 'string' ? payload : JSON.stringify(payload);
          console.log(errorMessage);
        }
      } catch (error) {
        console.error('Failed to fetch CAD job', error);
        if (error instanceof Error) {
          setCadJobError(error.message);
        } else {
          setCadJobError('Unknown error fetching CAD job.');
        }
      }
    };

    handleCADfile();
  }, [jobId, cadJobStatus, kittyCADKey]);

  // Poll for CAD job status updates
  useEffect(() => {
    if (!jobId || !CAD_JOB_ID_REGEX.test(jobId)) {
      return;
    }

    if (isTerminalCadStatus(cadJobStatus)) {
      refreshTabs();
      return;
    }

    refreshTabs();
    const intervalId = setInterval(() => {
      refreshTabs();
    }, 3000);

    return () => clearInterval(intervalId);
  }, [jobId, cadJobStatus, refreshTabs]);

  return { cadJobError, setCadJobError };
}
