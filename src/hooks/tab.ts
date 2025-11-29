'use client';

import { useCallback, useEffect, useMemo, useState } from "react";
import { CADTab } from "@/types/app";
import { addJob, getJobs, removeJobByIndex } from "@/lib/redis";

const MAX_TABS = 8;
const DEFAULT_JOB_ID = "default";

export function useTabs({ kittyCADKey }: { kittyCADKey: string }) {
  const [tabs, setTabs] = useState<CADTab[]>([]);
  const [activeTabId, setActiveTabId] = useState<string>("");

    const refreshTabs = useCallback(async () => {
        const jobs = await getJobs();
        const jobList = jobs && jobs.length > 0 ? jobs : [DEFAULT_JOB_ID];

        const jobDetails = await Promise.all(
        jobList.map(async (job) => {
            if (job === DEFAULT_JOB_ID) {
            return { job, cadJob: undefined };
            }

            try {
            const response = await fetch(
                `/api/cad-proxy?cadId=${encodeURIComponent(job)}`,
                {
                    method: 'POST',
                    body: JSON.stringify({ kittyCADKey }),
                }
            );
            const cadJobData = await response.json();
            return { job, cadJob: cadJobData };
            } catch (error) {
            console.error(`Failed to load CAD job ${job}`, error);
            return { job, cadJob: undefined };
            }
        })
        );

        let nextTabsSnapshot: CADTab[] = [];

        setTabs((prevTabs) => {
        const jobBuckets = new Map<string, CADTab[]>();

        for (const tab of prevTabs) {
            const bucket = jobBuckets.get(tab.jobId) ?? [];
            bucket.push(tab);
            jobBuckets.set(tab.jobId, bucket);
        }

        const tabsData: CADTab[] = jobDetails.map((detail, index) => {
            const bucket = jobBuckets.get(detail.job);
            const existingTab = bucket?.shift();

            if (existingTab) {
            return {
                ...existingTab,
                cadJob: detail.cadJob ?? existingTab.cadJob,
            };
            }

            return {
            tabId: crypto.randomUUID(),
            jobId: detail.job,
            name:
                detail.job === DEFAULT_JOB_ID
                ? `Untitled ${index + 1}`
                : `CAD ${detail.job.slice(0, 4)}`,
            cadJob: detail.cadJob,
            };
        });

        if (tabsData.length === 0) {
            tabsData.push({
            tabId: crypto.randomUUID(),
            jobId: DEFAULT_JOB_ID,
            name: "Untitled 1",
            });
        }

        nextTabsSnapshot = tabsData;
        return tabsData;
        });

        setActiveTabId((prevActiveId) => {
        if (nextTabsSnapshot.some((tab) => tab.tabId === prevActiveId)) {
            return prevActiveId;
        }
        return nextTabsSnapshot[0]?.tabId ?? "";
        });
    }, [kittyCADKey]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      refreshTabs();
    });
    return () => clearTimeout(timeoutId);
  }, [refreshTabs]);

  const createNewTab = useCallback(async () => {
    if (tabs.length >= MAX_TABS) {
      return;
    }

    const newTabId = crypto.randomUUID();
    const newTab: CADTab = {
      tabId: newTabId,
      jobId: DEFAULT_JOB_ID,
      name: `Untitled ${tabs.length + 1}`,
    };

    setTabs([...tabs, newTab]);
    setActiveTabId(newTabId);
    await addJob(DEFAULT_JOB_ID);
  }, [tabs]);

  const deleteTab = useCallback(
    async (tabId: string) => {
      if (tabs.length === 1) return;

      const tabIndex = tabs.findIndex((tab) => tab.tabId === tabId);
      const newTabs = tabs.filter((tab) => tab.tabId !== tabId);
      setTabs(newTabs);

      if (tabIndex !== -1) {
        await removeJobByIndex(tabIndex);
      }

      if (activeTabId === tabId && newTabs[0]) {
        setActiveTabId(newTabs[0].tabId);
      }
    },
    [tabs, activeTabId]
  );

  const activeTab = useMemo(
    () => tabs.find((tab) => tab.tabId === activeTabId) ?? tabs[0],
    [tabs, activeTabId]
  );

  return {
    tabs,
    activeTab,
    activeTabId,
    setActiveTabId,
    createNewTab,
    deleteTab,
    refreshTabs,
    maxTabs: MAX_TABS,
    isAtMaxTabs: tabs.length >= MAX_TABS,
  };
}
