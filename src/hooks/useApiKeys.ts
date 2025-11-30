'use client';

import { useState } from 'react';

export function useApiKeys() {
  // Initialize state directly from environment variables
  const [openAIKey, setOpenAIKey] = useState(
    process.env.NEXT_PUBLIC_OPENAI_API_KEY || ''
  );
  const [kittyCADKey, setKittyCADKey] = useState(
    process.env.NEXT_PUBLIC_KITTYCAD_API_KEY || ''
  );
  const [showOpenAIKey, setShowOpenAIKey] = useState(false);
  const [showKittyCADKey, setShowKittyCADKey] = useState(false);

  return {
    openAIKey,
    kittyCADKey,
    setOpenAIKey,
    setKittyCADKey,
    showOpenAIKey,
    showKittyCADKey,
    setShowOpenAIKey,
    setShowKittyCADKey,
  };
}
