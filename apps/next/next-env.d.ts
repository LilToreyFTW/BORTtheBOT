/// <reference types="next" />
/// <reference types="next/image-types/global" />

// # ADDED: Audio file type declarations for imports from web app
declare module "*.mp3" {
  const src: string;
  export default src;
}

declare module "*.wav" {
  const src: string;
  export default src;
}

declare module "*.ogg" {
  const src: string;
  export default src;
}
