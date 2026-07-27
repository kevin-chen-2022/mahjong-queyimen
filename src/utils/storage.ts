import type { HandRecord, HandLengthFilter } from '../types';
import { parseHandInput } from './mahjong';

const STORAGE_KEY = '麻将缺一门数据库';

// ========== 剪贴板工具函数（三层降级） ==========

// 写入剪贴板：优先 Clipboard API → execCommand → 返回文本供手动复制
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch { /* 降级 */ }
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.left = '-9999px';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}

// 读取剪贴板：优先 Clipboard API → 返回 null 由调用方用文本框兜底
export async function readFromClipboard(): Promise<string | null> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      return await navigator.clipboard.readText();
    }
  } catch { /* 降级 */ }
  return null;
}

// 生成唯一ID
function genId(): string {
  return `h_${Date.now()}_${Math.floor(Math.random() * 1000000)}`;
}

// 读取数据库
export function loadAllRecords(): HandRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as HandRecord[];
  } catch {
    return [];
  }
}

// 保存数据库（覆盖写）
function saveAllRecords(records: HandRecord[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

// 判断数据库是否存在
export function databaseExists(): boolean {
  return localStorage.getItem(STORAGE_KEY) !== null;
}

// 计算手牌文本对应的牌数
function handTextLength(handText: string): number {
  const tiles = parseHandInput(handText);
  return tiles ? tiles.length : 0;
}

// 按筛选条件过滤
export function filterRecords(records: HandRecord[], filter: HandLengthFilter): HandRecord[] {
  if (filter === 'all') return records;
  const targetLen = filter as number;
  return records.filter(r => handTextLength(r.handText) === targetLen);
}

// 查找是否已存在相同 handText 的记录
export function findRecordByText(records: HandRecord[], handText: string): HandRecord | null {
  return records.find(r => r.handText === handText) ?? null;
}

// 新增记录
export function addRecord(handText: string, description: string): HandRecord {
  const records = loadAllRecords();
  const now = Date.now();
  const record: HandRecord = {
    id: genId(),
    handText,
    description,
    createdAt: now,
    updatedAt: now,
  };
  records.push(record);
  saveAllRecords(records);
  return record;
}

// 更新记录
export function updateRecord(id: string, handText: string, description: string): HandRecord | null {
  const records = loadAllRecords();
  const idx = records.findIndex(r => r.id === id);
  if (idx === -1) return null;
  records[idx] = {
    ...records[idx],
    handText,
    description,
    updatedAt: Date.now(),
  };
  saveAllRecords(records);
  return records[idx];
}

// 按描述文本搜索
export function searchRecordsByDescription(records: HandRecord[], keyword: string): HandRecord[] {
  if (!keyword.trim()) return records;
  const lowerKeyword = keyword.toLowerCase();
  return records.filter(r => r.description.toLowerCase().includes(lowerKeyword));
}

// 删除记录
export function deleteRecord(id: string): boolean {
  const records = loadAllRecords();
  const idx = records.findIndex(r => r.id === id);
  if (idx === -1) return false;
  records.splice(idx, 1);
  saveAllRecords(records);
  return true;
}

// === 导入导出 ===

const EXPORT_FORMAT_VERSION = 1;

interface ExportData {
  version: number;
  records: HandRecord[];
}

// 校验单条记录是否合法
export function validateRecord(record: unknown): record is HandRecord {
  if (!record || typeof record !== 'object') return false;
  const r = record as Record<string, unknown>;
  if (typeof r.handText !== 'string' || !r.handText.trim()) return false;
  const tiles = parseHandInput(r.handText);
  if (!tiles || tiles.length === 0) return false;
  if (typeof r.description !== 'string') return false;
  return true;
}

// 导出整个数据库为 JSON 字符串
export function exportDatabase(): string {
  const records = loadAllRecords();
  const data: ExportData = {
    version: EXPORT_FORMAT_VERSION,
    records,
  };
  return JSON.stringify(data, null, 2);
}

// 从 JSON 字符串导入数据库（追加模式，重复则跳过）
export interface ImportResult {
  success: number;
  skipped: number;
  invalid: number;
  firstNewRecordId: string | null;
}

export function importDatabase(jsonStr: string): ImportResult {
  const result: ImportResult = {
    success: 0,
    skipped: 0,
    invalid: 0,
    firstNewRecordId: null,
  };

  try {
    const parsed = JSON.parse(jsonStr);
    if (!parsed || typeof parsed !== 'object') return result;
    const data = parsed as Partial<ExportData>;

    let recordsToImport: HandRecord[] = [];
    if (Array.isArray(data.records)) {
      recordsToImport = data.records as HandRecord[];
    } else if (Array.isArray(parsed)) {
      recordsToImport = parsed as HandRecord[];
    } else {
      return result;
    }

    const existingRecords = loadAllRecords();
    const existingTexts = new Set(existingRecords.map(r => r.handText));
    const newRecords: HandRecord[] = [];
    const now = Date.now();

    for (const raw of recordsToImport) {
      if (!validateRecord(raw)) {
        result.invalid++;
        continue;
      }
      if (existingTexts.has(raw.handText)) {
        result.skipped++;
        continue;
      }
      const newRecord: HandRecord = {
        id: genId(),
        handText: raw.handText,
        description: raw.description || '',
        createdAt: now,
        updatedAt: now,
      };
      newRecords.push(newRecord);
      existingTexts.add(raw.handText);
      if (result.success === 0) {
        result.firstNewRecordId = newRecord.id;
      }
      result.success++;
    }

    if (newRecords.length > 0) {
      saveAllRecords([...existingRecords, ...newRecords]);
    }

    return result;
  } catch {
    return result;
  }
}

// 单条记录导出为 JSON 字符串
export function exportSingleRecord(record: HandRecord): string {
  return JSON.stringify({
    version: EXPORT_FORMAT_VERSION,
    records: [record],
  }, null, 2);
}

// 单条记录导入（从剪贴板）
export function importSingleRecord(jsonStr: string): { record: HandRecord | null; isDuplicate: boolean } {
  try {
    const parsed = JSON.parse(jsonStr);
    let candidate: HandRecord | null = null;

    if (parsed && typeof parsed === 'object' && Array.isArray((parsed as ExportData).records)) {
      const records = (parsed as ExportData).records;
      if (records.length > 0 && validateRecord(records[0])) {
        candidate = records[0];
      }
    } else if (validateRecord(parsed)) {
      candidate = parsed as HandRecord;
    }

    if (!candidate) {
      return { record: null, isDuplicate: false };
    }

    const existingRecords = loadAllRecords();
    const duplicate = existingRecords.some(r => r.handText === candidate!.handText);
    if (duplicate) {
      return { record: null, isDuplicate: true };
    }

    const now = Date.now();
    const newRecord: HandRecord = {
      id: genId(),
      handText: candidate.handText,
      description: candidate.description || '',
      createdAt: now,
      updatedAt: now,
    };
    saveAllRecords([...existingRecords, newRecord]);
    return { record: newRecord, isDuplicate: false };
  } catch {
    return { record: null, isDuplicate: false };
  }
}
