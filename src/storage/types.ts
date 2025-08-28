// src/storage/types.ts
export interface KVStore {
  get<T = unknown>(key: string): Promise<T | null>;
  set<T = unknown>(key: string, value: T, ttlSec?: number): Promise<void>;
  del(key: string): Promise<void>;
  incr(key: string, by?: number, ttlSec?: number): Promise<number>;
  keys(prefix: string): Promise<string[]>;
}

export interface DocStore {
  getDoc<T = unknown>(collection: string, id: string): Promise<T | null>;
  putDoc<T = unknown>(collection: string, id: string, doc: T): Promise<void>;
  listDocs<T = unknown>(
    collection: string,
    filter?: Partial<T>
  ): Promise<Array<{ id: string; doc: T }>>;
  deleteDoc(collection: string, id: string): Promise<void>;
}

export interface BlobStore {
  putBlob(path: string, data: Uint8Array | Buffer): Promise<void>;
  getBlob(path: string): Promise<Uint8Array | Buffer | null>;
  list(prefix: string): Promise<string[]>;
  delete(path: string): Promise<void>;
}
