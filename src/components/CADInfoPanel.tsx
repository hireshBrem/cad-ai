'use client';

import { XIcon, DownloadIcon } from 'lucide-react';
import { downloadSTEPFile } from '@/lib/utils';
import type { RefObject } from 'react';

interface Tab {
  name: string;
  jobId?: string;
  cadJob?: {
    status: string;
    outputs?: {
      [key: string]: string;
    };
  };
}

interface CADInfoPanelProps {
  activeTab: Tab | null;
  cadJobError: string | null;
  isOpen: boolean;
  onClose: () => void;
  menuRef: RefObject<HTMLDivElement | null>;
}

export default function CADInfoPanel({
  activeTab,
  cadJobError,
  isOpen,
  onClose,
  menuRef,
}: CADInfoPanelProps) {
  if (!isOpen || !activeTab) return null;

  const infoFields = [
    { label: 'Name', value: activeTab.name },
    { label: 'Job ID', value: activeTab.jobId },
  ].filter((field) => field.value);

  return (
    <div
      ref={menuRef}
      className="absolute top-14 right-0 z-20 w-96 rounded-2xl border border-gray-200 bg-white shadow-xl backdrop-blur-sm"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
        <h3 className="text-lg font-semibold text-gray-900">Design Details</h3>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
          aria-label="Close CAD info panel"
        >
          <XIcon className="h-5 w-5" />
        </button>
      </div>

      {/* Content */}
      <div className="space-y-6 px-6 py-4">
        {/* Name Field */}
        {infoFields.map((field) => {
          if (field.label === 'Name') {
            return (
              <div key={field.label} className="space-y-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500">
                  {field.label}
                </label>
                <p className="rounded-lg bg-gray-50 px-3 py-2.5 font-medium text-gray-900 break-all">
                  {field.value}
                </p>
              </div>
            );
          }
        })}

        {/* Download Button */}
        {activeTab.cadJob?.outputs?.['source.step'] && (
          <button
            onClick={() =>
              downloadSTEPFile(
                activeTab.cadJob?.outputs?.['source.step'] ?? '',
                activeTab?.jobId
              )
            }
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-900 hover:bg-gray-800 text-white font-medium rounded-2xl transition-colors duration-200"
          >
            <DownloadIcon className="w-4 h-4" />
            <span>Export as STEP</span>
          </button>
        )}

        {/* Error Message */}
        {cadJobError && (
          <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2.5">
            <p className="text-sm text-red-700">{cadJobError}</p>
          </div>
        )}
      </div>
    </div>
  );
}
