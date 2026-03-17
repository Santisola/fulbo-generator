/// <reference lib="webworker" />

import { Serwist } from "serwist";
import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST!,
  skipWaiting: true,
  clientsClaim: true,
  runtimeCaching: [...defaultCache],
});

serwist.addEventListeners();

export {};
