// This file has been moved to separate hooks:
// - useUploadToIPFS: frontend/hooks/useUploadToIPFS.ts
// - useMintDatacoin: frontend/hooks/useMintDatacoin.ts
//
// Re-export for backwards compatibility
export { useUploadToIPFS } from '../hooks/useUploadToIPFS';
export { useMintDatacoin } from '../hooks/useMintDatacoin';
export type { UploadToIPFSState } from '../hooks/useUploadToIPFS';
export type { MintDatacoinState } from '../hooks/useMintDatacoin';
