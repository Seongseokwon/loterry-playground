import type { DrawConditions, LottoNumber } from "./types";

export const ARCHIVE_LIMIT = 50;

const DB_NAME = "lotto-play-ground";
const STORE_NAME = "saved-sets";
const DB_VERSION = 2;

export type SavedSetNumbers = [LottoNumber, LottoNumber, LottoNumber, LottoNumber, LottoNumber, LottoNumber];

export interface SavedSet {
  id: string;
  numbers: SavedSetNumbers;
  conditions: DrawConditions;
  conditionLabels: string[];
  label: string;
  memo: string;
  targetRound: number;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
  presetId?: string;
}

export type SavedSetInput = Omit<SavedSet, "id" | "createdAt" | "updatedAt" | "deletedAt">;

export type SaveSetResult =
  | { status: "saved"; item: SavedSet; removed?: SavedSet }
  | { status: "limit"; oldest: SavedSet };

export class StorageUnavailableError extends Error {
  constructor() {
    super("이 브라우저에서는 보관함을 사용할 수 없습니다.");
    this.name = "StorageUnavailableError";
  }
}

export function isStorageAvailable() {
  return typeof window !== "undefined" && typeof window.indexedDB !== "undefined";
}

function createId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function openDatabase(): Promise<IDBDatabase> {
  if (!isStorageAvailable()) return Promise.reject(new StorageUnavailableError());

  return new Promise((resolve, reject) => {
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (event) => {
      const database = request.result;
      const transaction = request.transaction;
      const store = database.objectStoreNames.contains(STORE_NAME)
        ? transaction?.objectStore(STORE_NAME)
        : database.createObjectStore(STORE_NAME, { keyPath: "id" });

      if (event.oldVersion < 2 && store) {
        const cursorRequest = store.openCursor();
        cursorRequest.onsuccess = () => {
          const cursor = cursorRequest.result;
          if (!cursor) return;

          const value = cursor.value as SavedSet;
          if (!value.updatedAt) cursor.update({ ...value, updatedAt: value.createdAt });
          cursor.continue();
        };
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("보관함을 열 수 없습니다."));
  });
}

function requestResult<T>(request: IDBRequest<T>) {
  return new Promise<T>((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("보관함 요청에 실패했습니다."));
  });
}

function transactionComplete(transaction: IDBTransaction) {
  return new Promise<void>((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error("보관함 저장에 실패했습니다."));
    transaction.onabort = () => reject(transaction.error ?? new Error("보관함 저장이 취소되었습니다."));
  });
}

function normalizeInput(input: SavedSetInput): SavedSet {
  const numbers = [...new Set(input.numbers)].filter((number) => Number.isInteger(number) && number >= 1 && number <= 45).sort((a, b) => a - b);
  if (numbers.length !== 6) throw new TypeError("보관함에는 중복 없는 1~45 번호 6개만 저장할 수 있습니다.");
  const now = new Date().toISOString();

  return {
    ...input,
    id: createId(),
    numbers: numbers as SavedSetNumbers,
    conditionLabels: [...input.conditionLabels],
    label: input.label.trim().slice(0, 80) || "저장한 번호",
    memo: input.memo.trim().slice(0, 200),
    targetRound: Math.max(1, Math.trunc(input.targetRound)),
    createdAt: now,
    updatedAt: now,
  };
}

export async function getSavedSets(): Promise<SavedSet[]> {
  if (!isStorageAvailable()) return [];
  const database = await openDatabase();
  try {
    const transaction = database.transaction(STORE_NAME, "readonly");
    const items = await requestResult(transaction.objectStore(STORE_NAME).getAll()) as SavedSet[];
    return items.filter((item) => !item.deletedAt).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  } finally {
    database.close();
  }
}

export async function saveSavedSet(input: SavedSetInput, options: { replaceOldest?: boolean } = {}): Promise<SaveSetResult> {
  const current = await getSavedSets();
  const oldest = current[current.length - 1];
  if (oldest && current.length >= ARCHIVE_LIMIT && !options.replaceOldest) return { status: "limit", oldest };

  const item = normalizeInput(input);
  const database = await openDatabase();
  try {
    const transaction = database.transaction(STORE_NAME, "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    if (oldest && current.length >= ARCHIVE_LIMIT && options.replaceOldest) {
      const now = new Date().toISOString();
      store.put({ ...oldest, updatedAt: now, deletedAt: now });
    }
    store.put(item);
    await transactionComplete(transaction);
    return { status: "saved", item, removed: oldest && current.length >= ARCHIVE_LIMIT ? oldest : undefined };
  } finally {
    database.close();
  }
}

export async function deleteSavedSet(id: string) {
  if (!isStorageAvailable()) throw new StorageUnavailableError();
  const database = await openDatabase();
  try {
    const transaction = database.transaction(STORE_NAME, "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    const item = await requestResult(store.get(id)) as SavedSet | undefined;
    if (item) {
      const now = new Date().toISOString();
      store.put({ ...item, updatedAt: now, deletedAt: now });
    }
    await transactionComplete(transaction);
  } finally {
    database.close();
  }
}
