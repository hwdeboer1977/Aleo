// --- Configuration ---
const MAX_RECORD_GROUP_SIZE = 5;

// --- Types ---
export type AleoRecord = {
  id: string;
  owner: string;
  program_id: string;
  spent: boolean;
  recordName: string;
  data: {
    microcredits: string; // e.g., "1000000u64.private"
  };
};

export type RecordMap = Map<number, AleoRecord[]>;

// --- Helper ---
const parseValue = (rec: AleoRecord): number =>
  Number(rec.data.microcredits.replace("u64.private", "")) || 0;

// --- Main Function ---
export function getBestMerge(
  recordsMap: RecordMap,
  target: number
): {
  selected: AleoRecord[];
  updatedMap: RecordMap;
} {
  // 1. Exact match shortcut
  if (target && recordsMap.has(target)) {
    return {
      selected: [recordsMap.get(target)![0]],
      updatedMap: new Map(recordsMap),
    };
  }

  // 2. Flatten and sort all records
  const allRecords: AleoRecord[] = Array.from(recordsMap.values()).flat();
  const sortedRecords = allRecords.slice().sort((a, b) => parseValue(a) - parseValue(b));

  // 3. Brute-force search with limit on group size
  let bestSubset: AleoRecord[] = [];
  let bestTotal = Infinity;

  const n = sortedRecords.length;

  for (let size = 1; size <= MAX_RECORD_GROUP_SIZE; size++) {
    const combine = (start = 0, path: AleoRecord[] = [], sum = 0) => {
      if (path.length > size) return;
      if (sum >= target && path.length <= size) {
        if (
          bestSubset.length === 0 ||
          path.length < bestSubset.length ||
          (path.length === bestSubset.length && sum < bestTotal)
        ) {
          bestSubset = [...path];
          bestTotal = sum;
        }
        return;
      }

      for (let i = start; i < n; i++) {
        const rec = sortedRecords[i];
        const val = parseValue(rec);
        if (sum + val > bestTotal) continue; // pruning
        path.push(rec);
        combine(i + 1, path, sum + val);
        path.pop();
      }
    };

    combine();
    if (bestSubset.length > 0) break; // Found the smallest valid group size
  }

  const selected: AleoRecord[] = bestSubset;

  // 4. Rebuild updated map
  const selectedIds = new Set(selected.map((r) => r.id));
  const updatedMap: RecordMap = new Map();

  for (const [key, group] of recordsMap.entries()) {
    const filtered = group.filter((rec) => !selectedIds.has(rec.id));
    if (filtered.length > 0) {
      updatedMap.set(key, filtered);
    }
  }

  return { selected, updatedMap };
}
