import chemicals from "../../data/chemicals.json";

export type Chemical = {
  id: number;
  name: string;
  aliases: string[];
  cas: string;
  note: string;
  tags?: string[];  // 附加标签：易制爆 / 易制毒（第X类）
};

export type MatchType =
  | "cas-exact"      // CAS 精确匹配
  | "name-exact"     // 品名精确匹配
  | "alias-exact"    // 别名精确匹配
  | "name-contains"  // 品名包含匹配
  | "alias-contains" // 别名包含匹配
  | "cas-contains";  // CAS 包含匹配

export type ScoredChemical = Chemical & {
  matchType: MatchType;
  matchLabel: string;
  isPriority: boolean;   // 是否优先匹配（精确命中）
  needsReview: boolean;  // 是否需进一步人工判断（混合物/类属/浓度）
  advice: string;        // 判断建议
  categoryDisplay: string; // 类别展示（剧毒 / 易制爆 / 易制毒 等叠加）
};

// 是否为 2828 油漆涂料子条目
function is2828Item(item: Chemical): boolean {
  return item.id >= 2828001 && item.id <= 2828999;
}

// 生成类别展示文本：note（剧毒）+ tags（易制爆/易制毒）用 / 连接
function buildCategory(item: Chemical): string {
  const parts: string[] = [];
  if (item.note === "剧毒") parts.push("剧毒");
  if (item.tags) parts.push(...item.tags);
  // 2828 子条目统一标注易燃液体（2828品类均属易燃液体类）
  if (is2828Item(item)) parts.push("易燃液体");
  return parts.join(" / ");
}

const data = chemicals as Chemical[];

const MATCH_LABEL: Record<MatchType, string> = {
  "cas-exact": "CAS 精确匹配",
  "name-exact": "品名精确匹配",
  "alias-exact": "别名精确匹配",
  "name-contains": "名称包含匹配",
  "alias-contains": "别名包含匹配",
  "cas-contains": "CAS 包含匹配",
};

// 相关性优先级（越小越靠前）
const MATCH_ORDER: Record<MatchType, number> = {
  "cas-exact": 1,
  "name-exact": 2,
  "alias-exact": 3,
  "name-contains": 4,
  "alias-contains": 5,
  "cas-contains": 6,
};

// 判断是否为混合物/类属/含浓度条件的条目
function needsReview(item: Chemical): boolean {
  const text = item.name + (item.aliases?.join("") || "");
  return /混合物|类属|含量|浓度|溶液|按质量|闭杯闪点|稀释剂|减敏|制品/.test(text);
}

function makeAdvice(matchType: MatchType, review: boolean): string {
  if (review) return "涉及混合物/浓度/类属，需进一步核验";
  if (matchType === "cas-exact") return "可优先核对该条目";
  if (matchType === "name-exact" || matchType === "alias-exact") return "可作为优先参考";
  return "仅名称相关，谨慎判断";
}

// 2828 子条目：把完整危险性类别说明拼进建议，便于直接查看
function makeAdviceFull(item: Chemical, matchType: MatchType, review: boolean): string {
  const base = makeAdvice(matchType, review);
  if (is2828Item(item) && item.note) return `${base}；${item.note}`;
  return base;
}

// 标点归一化：中文标点 → 英文标点，去掉所有空白，便于用户输入中文标点也能匹配
function normalizePunct(s: string): string {
  const map: Record<string, string> = {
    "，": ",", "、": ",",
    "。": ".", "．": ".", "·": ".",
    "－": "-", "–": "-", "—": "-", "﹣": "-", "−": "-",
    "（": "(", "）": ")", "［": "[", "］": "]",
    "【": "[", "】": "]", "％": "%", "：": ":", "；": ";",
    "＋": "+", "／": "/",
  };
  return s
    .toLowerCase()
    .replace(/[，、。．·－–—﹣−（）［］【】％：；＋／]/g, (c) => map[c] ?? c)
    .replace(/\s+/g, "");
}

export function searchChemicals(query: string): ScoredChemical[] {
  const q = normalizePunct(query.trim());
  if (!q) return [];

  // 去掉方括号标注，如“乙醇[无水]”→“乙醇”，用于提升精确匹配命中率
  const strip = (s: string) => normalizePunct(s).replace(/\s*[\[［【\(（][^\]］】\)）]*[\]］】\)）]\s*/g, "").trim();
  const qStripped = strip(query);

  const results: ScoredChemical[] = [];

  for (const item of data) {
    let matchType: MatchType | null = null;
    const name = normalizePunct(item.name);
    const nameStripped = strip(item.name);
    const cas = normalizePunct(item.cas || "");
    const aliases = (item.aliases || []).map((a) => normalizePunct(a));

    // 按优先级判断匹配方式（命中即取最高优先级）
    if (cas && cas === q) matchType = "cas-exact";
    else if (name === q || (qStripped && nameStripped === qStripped)) matchType = "name-exact";
    else if (aliases.some((a) => a === q)) matchType = "alias-exact";
    else if (name.includes(q)) matchType = "name-contains";
    else if (aliases.some((a) => a.includes(q))) matchType = "alias-contains";
    else if (cas && cas.includes(q)) matchType = "cas-contains";

    if (!matchType) continue;

    const review = needsReview(item);
    const isPriority = matchType.endsWith("-exact");
    results.push({
      ...item,
      matchType,
      matchLabel: MATCH_LABEL[matchType],
      isPriority,
      needsReview: review,
      advice: makeAdviceFull(item, matchType, review),
      categoryDisplay: buildCategory(item),
    });
  }

  // 按相关性排序：先匹配方式优先级，再按序号
  results.sort((a, b) => {
    const o = MATCH_ORDER[a.matchType] - MATCH_ORDER[b.matchType];
    return o !== 0 ? o : a.id - b.id;
  });

  return results.slice(0, 50);
}

