export interface Status {
    status: 'ready' | 'syncing' | 'unavailable';
    blocks_to_sync?: number;
}
