'use client';

import { XIcon, EyeIcon, EyeOffIcon } from 'lucide-react';
import type { RefObject } from 'react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  openAIKey: string;
  setOpenAIKey: (key: string) => void;
  showOpenAIKey: boolean;
  setShowOpenAIKey: (show: boolean) => void;
  kittyCADKey: string;
  setKittyCADKey: (key: string) => void;
  showKittyCADKey: boolean;
  setShowKittyCADKey: (show: boolean) => void;
  menuRef: RefObject<HTMLDivElement | null>;
}

export default function SettingsModal({
  isOpen,
  onClose,
  openAIKey,
  setOpenAIKey,
  showOpenAIKey,
  setShowOpenAIKey,
  kittyCADKey,
  setKittyCADKey,
  showKittyCADKey,
  setShowKittyCADKey,
  menuRef,
}: SettingsModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div
        ref={menuRef}
        className="w-full max-w-md rounded-2xl border border-gray-200 bg-white shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <h3 className="text-lg font-semibold text-gray-900">Settings</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
            aria-label="Close settings"
          >
            <XIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-4 px-6 py-4">
          {/* OpenAI API Key */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500">
              OpenAI API Key
            </label>
            <div className="relative">
              <input
                type={showOpenAIKey ? 'text' : 'password'}
                placeholder="sk-..."
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 pr-10 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
                value={openAIKey}
                onChange={(e) => setOpenAIKey(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowOpenAIKey(!showOpenAIKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                aria-label={showOpenAIKey ? 'Hide API key' : 'Show API key'}
              >
                {showOpenAIKey ? (
                  <EyeOffIcon className="w-4 h-4" />
                ) : (
                  <EyeIcon className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* KittyCAD API Key */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500">
              KittyCAD API Key
            </label>
            <div className="relative">
              <input
                type={showKittyCADKey ? 'text' : 'password'}
                placeholder="Enter your KittyCAD API key"
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 pr-10 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
                value={kittyCADKey}
                onChange={(e) => setKittyCADKey(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowKittyCADKey(!showKittyCADKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                aria-label={showKittyCADKey ? 'Hide API key' : 'Show API key'}
              >
                {showKittyCADKey ? (
                  <EyeOffIcon className="w-4 h-4" />
                ) : (
                  <EyeIcon className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
