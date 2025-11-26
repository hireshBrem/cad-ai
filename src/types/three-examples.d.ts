declare module "three/examples/jsm/controls/OrbitControls" {
  import type { Camera, EventDispatcher } from "three";

  export class OrbitControls extends EventDispatcher {
    constructor(object: Camera, domElement?: HTMLElement);
    enabled: boolean;
    target: import("three").Vector3;
    minDistance: number;
    maxDistance: number;
    enableDamping: boolean;
    dampingFactor: number;
    update(): void;
    dispose(): void;
  }
}

declare module "three/examples/jsm/loaders/OBJLoader" {
  import type { Loader, LoadingManager, Material, Group } from "three";

  export interface OBJLoaderOptions {
    materials?: Material | Material[];
  }

  export class OBJLoader extends Loader {
    constructor(manager?: LoadingManager);
    parse(data: string | ArrayBuffer, path?: string): Group;
  }
}
