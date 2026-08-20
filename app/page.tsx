"use client";

import { useState } from "react";

type Chemical = {
  id: number;
  name: string;
  aliases: string[];
  cas: string;
  note: string;
};

type ScoredChemical = Chemical & {
  matchType: string;
  matchLabel: string;
  isPriority: boolean;
  needsReview: boolean;
  advice: string;
  categoryDisplay: string;
};

type BatchResult = {
  query: string;
  results: ScoredChemical[];
  count: number;
  found: boolean;
};

const th: React.CSSProperties = {
  background: "#f8fafc", color: "#475569", fontWeight: 600, fontSize: 13,
  textAlign: "left", padding: "10px 14px", whiteSpace: "nowrap",
  borderBottom: "1px solid #e2e8f0",
};
const td: React.CSSProperties = {
  padding: "14px", fontSize: 13, color: "#1f2937",
  borderTop: "1px solid #f1f5f9", verticalAlign: "top", lineHeight: 1.5,
};

// 紧凑型专业查询表格
function ResultTable({ items }: { items: ScoredChemical[] }) {
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 820 }}>
        <thead>
          <tr>
            <th style={{ ...th, width: "26%" }}>品名</th>
            <th style={{ ...th, width: "18%" }}>CAS号 / 别名</th>
            <th style={{ ...th, width: "16%" }}>类别</th>
            <th style={{ ...th, width: "13%" }}>匹配方式</th>
            <th style={{ ...th, width: "27%" }}>判断建议</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, idx) => (
            <tr key={`${item.id}-${idx}`}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#f6faff")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
              {/* 品名 + 目录序号 */}
              <td style={td}>
                <div style={{ fontSize: 15, fontWeight: 600, color: "#182230", lineHeight: 1.4 }}>{item.name}</div>
                <div style={{ fontSize: 11, color: "#98a2b3", marginTop: 3 }}>目录序号 {item.id}</div>
              </td>
              {/* CAS + 别名 */}
              <td style={td}>
                {item.cas && <div style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace", fontSize: 13, color: "#344054" }}>{item.cas}</div>}
                {item.aliases.length > 0 && <div style={{ fontSize: 12, color: "#667085", marginTop: 3 }}>{item.aliases.join("；")}</div>}
              </td>
              {/* 类别标签 */}
              <td style={td}>
                {item.categoryDisplay && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                    {item.categoryDisplay.split(" / ").map((tag) => (
                      <span key={tag} style={{
                        display: "inline-block", fontSize: 11, padding: "3px 8px", borderRadius: 5,
                        fontWeight: 600, whiteSpace: "nowrap",
                        background: tag.includes("剧毒") ? "#fef2f2" : tag.includes("易制爆") ? "#fef3f2" : "#eff4ff",
                        color: tag.includes("剧毒") ? "#dc2626" : tag.includes("易制爆") ? "#d92d20" : "#3538cd",
                        border: `1px solid ${tag.includes("剧毒") ? "#fecaca" : tag.includes("易制爆") ? "#fecdca" : "#d1e0ff"}`
                      }}>{tag}</span>
                    ))}
                  </div>
                )}
              </td>
              {/* 匹配方式 */}
              <td style={td}>
                <span style={{
                  display: "inline-block", fontSize: 12, padding: "3px 8px", borderRadius: 5,
                  background: item.isPriority ? "#dcfce7" : "#f1f5f9",
                  color: item.isPriority ? "#15803d" : "#475569", fontWeight: 600, whiteSpace: "nowrap"
                }}>{item.isPriority ? "✓ " : ""}{item.matchLabel}</span>
              </td>
              {/* 判断建议 */}
              <td style={td}>
                {item.needsReview ? (
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "#b45309" }}>⚠ 需进一步核验</div>
                    <div style={{ fontSize: 11, color: "#98a2b3", marginTop: 2, lineHeight: 1.5 }}>涉及浓度或类属判断</div>
                  </div>
                ) : (
                  <div style={{ fontSize: 12, color: "#475569" }}>{item.advice}</div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// 分区块标题
function SectionHead({ color, title, desc }: { color: string; title: string; desc?: string }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ width: 4, height: 16, borderRadius: 2, background: color }} />
        <span style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>{title}</span>
      </div>
      {desc && <div style={{ fontSize: 12, color: "#6b7280", marginTop: 4, lineHeight: 1.6 }}>{desc}</div>}
    </div>
  );
}

// 判断查询词是否带规格/浓度/条件信息（方括号、＞、≤、含量等）
function hasSpecInfo(q: string): boolean {
  return /[\[［【\(（]|[＞＜≥≤]|含量|浓度|溶液|规格/.test(q);
}

function parseInput(text: string): string[] {
  return text
    .split(/[\n,，、;；\t]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export default function Home() {
  const [mode, setMode] = useState<"quick" | "batch">("quick");
  const [quickInput, setQuickInput] = useState("");
  const [input, setInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [results, setResults] = useState<BatchResult[]>([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);

  function addTags() {
    const items = parseInput(input);
    if (items.length === 0) return;
    setTags((prev) => {
      const merged = [...prev];
      for (const it of items) {
        if (!merged.includes(it) && merged.length < 50) merged.push(it);
      }
      return merged;
    });
    setInput("");
  }

  function removeTag(tag: string) {
    setTags((prev) => prev.filter((t) => t !== tag));
  }

  async function runSearch(items: string[]) {
    if (items.length === 0) return;
    setLoading(true);
    setSearched(true);
    try {
      const res = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ queries: items }),
      });
      const data = await res.json();
      setResults(data.data || []);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleSearch() {
    let items = [...tags];
    const pending = parseInput(input);
    for (const it of pending) {
      if (!items.includes(it) && items.length < 50) items.push(it);
    }
    if (items.length === 0) return;
    setTags(items);
    setInput("");
    await runSearch(items);
  }

  async function quickSearch(word?: string) {
    const q = (word ?? quickInput).trim();
    if (!q) return;
    setQuickInput(q);
    await runSearch([q]);
  }

  function exportCSV() {
    const header = ["查询词", "是否匹配目录", "匹配序号", "品名", "别名", "CAS号", "类别", "匹配方式", "是否优先匹配", "判断建议"];
    const rows: string[][] = [header];
    for (const r of results) {
      if (r.results.length === 0) {
        rows.push([r.query, "暂未检索到", "", "", "", "", "", "", "", "建议核对SDS、CAS号、成分及含量"]);
      } else {
        for (const item of r.results) {
          rows.push([r.query, "匹配到目录条目", String(item.id), item.name, item.aliases.join("；"), item.cas, item.categoryDisplay, item.matchLabel, item.isPriority ? "是" : "否", item.advice]);
        }
      }
    }
    const csv = "﻿" + rows.map((row) => row.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `危化品查询结果_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const foundCount = results.filter((r) => r.found).length;
  const judoCount = results.filter((r) => r.results.some((i) => i.note === "剧毒")).length;
  const totalCount = results.reduce((sum, r) => sum + r.count, 0);

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(180deg, #f0f5ff 0%, #f7f9fc 220px)", display: "flex", flexDirection: "column" }}>
      {/* 顶部导航 */}
      <header style={{
        background: "#fff", borderBottom: "1px solid #e8ecf1",
        position: "sticky", top: 0, zIndex: 50
      }}>
        <div style={{
          maxWidth: 1080, margin: "0 auto", padding: "0 20px", height: 60,
          display: "flex", alignItems: "center", justifyContent: "space-between"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <img src="/logo.png" alt="危化品查询" width={36} height={36} style={{ borderRadius: 8, display: "block" }} />
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: "#111827", lineHeight: 1.2 }}>危化品查询</div>
              <div style={{ fontSize: 11, color: "#9ca3af" }}>《危险化学品目录》快速查询工具</div>
            </div>
          </div>
          <nav style={{ display: "flex", gap: 24, fontSize: 14, color: "#4b5563" }}>
            <span style={{ color: "#2563eb", fontWeight: 600, cursor: "pointer" }}>批量查询</span>
            <span style={{ cursor: "pointer" }}>目录查询</span>
            <span style={{ cursor: "pointer" }}>查询说明</span>
            <span style={{ cursor: "pointer" }}>常见问题</span>
          </nav>
        </div>
      </header>

      <main style={{ flex: 1, width: "100%", maxWidth: 1080, margin: "0 auto", padding: "40px 20px 60px" }}>
        {/* 页头 */}
        <div style={{ textAlign: "center", marginBottom: 34 }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 14, flexWrap: "wrap",
            padding: "8px 18px", borderRadius: 999, marginBottom: 18,
            background: "#dbeafe", color: "#1d4ed8", fontSize: 13, fontWeight: 600
          }}>
            <span>数据依据：《危险化学品目录（2015版）》</span>
            <span style={{ color: "#93c5fd" }}>|</span>
            <span>支持 名称 / 别名 / CAS号 查询</span>
            <a href="#about-data" style={{ color: "#2563eb", textDecoration: "underline", fontWeight: 600 }}>数据来源</a>
            <a href="#about-data" style={{ color: "#2563eb", textDecoration: "underline", fontWeight: 600 }}>查询规则说明</a>
          </div>
          <h1 style={{ fontSize: 34, fontWeight: 800, color: "#111827", marginBottom: 12, letterSpacing: -0.5 }}>
            查询产品是否列入《危险化学品目录》
          </h1>
          <p style={{ fontSize: 15, color: "#6b7280", maxWidth: 620, margin: "0 auto", lineHeight: 1.7 }}>
            支持化学品名称、别名、CAS号批量查询，快速核对产品是否匹配目录条目。
          </p>
        </div>

        {/* 查询卡片 */}
        <div style={{
          background: "#fff", borderRadius: 16, padding: 24,
          boxShadow: "0 4px 24px rgba(17,24,39,0.08)", border: "1px solid #eef1f5"
        }}>

      {/* 模式切换 */}
      <div style={{ display: "flex", gap: 6, marginBottom: 20, background: "#f1f5f9", padding: 5, borderRadius: 10, width: "fit-content" }}>
        {(["quick", "batch"] as const).map((m) => (
          <button key={m} onClick={() => setMode(m)} style={{
            padding: "8px 22px", borderRadius: 8, border: "none", fontSize: 14, fontWeight: 600,
            cursor: "pointer", background: mode === m ? "#fff" : "transparent",
            color: mode === m ? "#1d4ed8" : "#64748b",
            boxShadow: mode === m ? "0 1px 4px rgba(0,0,0,0.08)" : "none"
          }}>
            {m === "quick" ? "快速查询" : "批量查询"}
          </button>
        ))}
      </div>

      {/* 快速查询 */}
      {mode === "quick" && (
        <div>
          <div style={{ display: "flex", gap: 10 }}>
            <input
              type="text"
              value={quickInput}
              onChange={(e) => setQuickInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && quickSearch()}
              placeholder="输入品名、别名或CAS号，例如：乙醇 / 酒精 / 64-17-5"
              style={{
                flex: 1, border: "1px solid #e5e7eb", borderRadius: 10,
                padding: "13px 16px", fontSize: 15, outline: "none",
                background: "#fbfcfe", color: "#111827", boxSizing: "border-box"
              }}
            />
            <button onClick={() => quickSearch()} disabled={loading} style={{
              padding: "13px 30px", borderRadius: 10, border: "none",
              background: loading ? "#9ca3af" : "#2563eb", color: "#fff",
              fontSize: 15, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", whiteSpace: "nowrap"
            }}>
              {loading ? "查询中…" : "立即查询"}
            </button>
          </div>

          {/* 常见查询 */}
          <div style={{ marginTop: 16, display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
            <span style={{ fontSize: 13, color: "#6b7280", fontWeight: 600 }}>常见查询：</span>
            {["甲醇", "乙醇", "硫磺", "丙酮", "汽油", "柴油", "油漆", "稀释剂"].map((w) => (
              <button key={w} onClick={() => quickSearch(w)} style={{
                padding: "5px 12px", borderRadius: 999, border: "1px solid #dbe3ec",
                background: "#fff", color: "#2563eb", fontSize: 13, fontWeight: 600, cursor: "pointer"
              }}>{w}</button>
            ))}
          </div>

          {/* 轻量风险提示 */}
          <div style={{ marginTop: 16, fontSize: 12.5, color: "#92400e", lineHeight: 1.7, display: "flex", alignItems: "baseline", gap: 6, flexWrap: "wrap" }}>
            <span>⚠ 未检索到目录条目，不代表产品一定不属于危险化学品。</span>
            <a href="#about-data" style={{ color: "#2563eb", textDecoration: "underline" }}>了解原因</a>
          </div>

          {/* 切换批量 */}
          <div style={{ marginTop: 14, fontSize: 13, color: "#6b7280" }}>
            批量核对多个产品？
            <button onClick={() => setMode("batch")} style={{
              border: "none", background: "transparent", color: "#2563eb",
              fontSize: 13, fontWeight: 600, cursor: "pointer", textDecoration: "underline", marginLeft: 4, padding: 0
            }}>切换至批量查询 →</button>
          </div>
        </div>
      )}

      {/* 批量查询 */}
      {mode === "batch" && (
        <div>
          {tags.length > 0 && (
            <div style={{
              display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 14,
              padding: "12px 14px", background: "#f8fafc", borderRadius: 10,
              border: "1px solid #e8ecf1"
            }}>
              {tags.map((tag) => (
                <span key={tag} style={{
                  display: "inline-flex", alignItems: "center", gap: 6,
                  background: "#eff6ff", color: "#1d4ed8", fontSize: 13, fontWeight: 600,
                  padding: "6px 10px", borderRadius: 6, border: "1px solid #bfdbfe"
                }}>
                  {tag}
                  <button onClick={() => removeTag(tag)} style={{
                    border: "none", background: "transparent", color: "#60a5fa",
                    cursor: "pointer", fontSize: 14, lineHeight: 1, padding: 0
                  }}>×</button>
                </span>
              ))}
              <button onClick={() => setTags([])} style={{
                marginLeft: "auto", border: "none", background: "transparent",
                color: "#9ca3af", fontSize: 12, cursor: "pointer"
              }}>清空</button>
            </div>
          )}

          <div style={{ fontSize: 15, fontWeight: 700, color: "#111827", marginBottom: 8 }}>
            输入产品名称、别名或CAS号，一行一个
          </div>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); addTags(); }
            }}
            placeholder={"例如：\n乙醇\n酒精\n64-17-5"}
            rows={4}
            style={{
              width: "100%", border: "1px solid #e5e7eb", borderRadius: 10,
              padding: "13px 15px", fontSize: 15, lineHeight: 1.7, outline: "none",
              resize: "vertical", fontFamily: "inherit", boxSizing: "border-box",
              background: "#fbfcfe", color: "#111827"
            }}
          />
          <div style={{ display: "flex", gap: 10, marginTop: 12, alignItems: "center" }}>
            <button onClick={handleSearch} disabled={loading} style={{
              padding: "11px 30px", borderRadius: 8, border: "none",
              background: loading ? "#9ca3af" : "#2563eb", color: "#fff",
              fontSize: 15, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer"
            }}>
              {loading ? "查询中…" : "批量查询"}
            </button>
            <button onClick={() => { setInput(""); setTags([]); }} style={{
              padding: "11px 12px", border: "none", background: "transparent",
              color: "#9ca3af", fontSize: 13, fontWeight: 600, cursor: "pointer"
            }}>
              清空
            </button>
            <span style={{ marginLeft: "auto", fontSize: 13, color: "#9ca3af" }}>
              支持Excel整列粘贴 · 最多50条
            </span>
          </div>

          <div style={{ marginTop: 16, fontSize: 12.5, color: "#92400e", lineHeight: 1.7, display: "flex", alignItems: "baseline", gap: 6, flexWrap: "wrap" }}>
            <span>⚠ 未检索到目录条目，不代表产品一定不属于危险化学品。</span>
            <a href="#about-data" style={{ color: "#2563eb", textDecoration: "underline" }}>了解原因</a>
          </div>
        </div>
      )}
        </div>
        {/* /查询卡片 */}

      {/* Summary */}
      {searched && results.length > 0 && (
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12,
          padding: "15px 18px", margin: "26px 0 18px", borderRadius: 12,
          background: "#fef2f2", border: "1px solid #fecaca", flexWrap: "wrap"
        }}>
          <p style={{ fontSize: 15, fontWeight: 600, color: "#111827", margin: 0 }}>
            查询完成：共 {results.length} 个产品，
            <span style={{ color: "#dc2626" }}>{foundCount} 个检索到相关目录结果</span>
            （合计 {totalCount} 条，其中 {judoCount} 个产品含剧毒条目）、
            {results.length - foundCount} 个暂未检索到
          </p>
          <button onClick={exportCSV} style={{
            padding: "8px 16px", borderRadius: 8, border: "1px solid #2563eb",
            background: "#fff", color: "#2563eb", fontSize: 13, fontWeight: 600,
            cursor: "pointer", whiteSpace: "nowrap"
          }}>
            导出 CSV
          </button>
        </div>
      )}

      {/* Results per query */}
      {searched && results.map((r) => {
        const priority = r.results.filter((i) => i.isPriority);
        const review = r.results.filter((i) => !i.isPriority && i.needsReview);
        const related = r.results.filter((i) => !i.isPriority && !i.needsReview);
        const hasExact = priority.length > 0;
        return (
          <div key={r.query} style={{
            marginBottom: 22, background: "#fff", borderRadius: 14,
            border: "1px solid #eef1f5", boxShadow: "0 2px 12px rgba(0,0,0,0.05)", overflow: "hidden"
          }}>
            {/* 卡片头 */}
            <div style={{
              display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap",
              padding: "13px 18px",
              background: r.found ? "#fef2f2" : "#f8fafc",
              borderBottom: `1px solid ${r.found ? "#fecaca" : "#e2e8f0"}`
            }}>
              <span style={{ fontSize: 16, fontWeight: 800, color: "#111827" }}>{r.query}</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: r.found ? "#dc2626" : "#64748b" }}>
                {r.found
                  ? (hasExact ? `✓ 检索到优先匹配，另附 ${related.length + review.length} 条相关结果` : `— 未检索到精确匹配，以下为 ${r.count} 条相关条目，请人工核对`)
                  : "— 暂未检索到对应目录条目"}
              </span>
            </div>

            <div style={{ padding: "18px" }}>
              {/* 规格差异提醒 */}
              {hasSpecInfo(r.query) && r.found && (
                <div style={{
                  marginBottom: 14, padding: "10px 14px", borderRadius: 8,
                  background: "#fffbeb", border: "1px solid #fde68a",
                  fontSize: 12.5, color: "#92400e", lineHeight: 1.6
                }}>
                  ⚠ 查询词包含规格/浓度信息，目录中可能存在多个不同规格的同名条目，请核对具体条件。
                </div>
              )}

              {/* 优先匹配 */}
              {priority.length > 0 && (
                <div style={{ marginBottom: 20 }}>
                  <div style={{ marginBottom: 10 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <span style={{ width: 4, height: 16, borderRadius: 2, background: "#16a34a" }} />
                      <span style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>找到 {priority.length} 条优先匹配结果</span>
                      <span style={{ fontSize: 12, color: "#667085" }}>搜索词：{r.query}</span>
                    </div>
                    <div style={{ fontSize: 12, color: "#667085", marginTop: 5, lineHeight: 1.6 }}>
                      相同 CAS 号可能对应不同浓度、形态或类属条件，请结合实际产品进一步判断。
                    </div>
                  </div>
                  <div style={{ borderRadius: 10, overflow: "hidden", border: "1px solid #e2e8f0" }}>
                    <ResultTable items={priority} />
                  </div>
                </div>
              )}

              {/* 需进一步判断 */}
              {review.length > 0 && (
                <div style={{ marginBottom: 20 }}>
                  <SectionHead color="#d97706" title="需结合成分 / 浓度进一步判断" desc="以下条目涉及混合物、浓度或类属判断，仅凭名称不能直接下结论。" />
                  <div style={{ borderRadius: 10, overflow: "hidden", border: "1px solid #e2e8f0" }}>
                    <ResultTable items={review} />
                  </div>
                </div>
              )}

              {/* 相关条目 */}
              {related.length > 0 && (
                <div>
                  <SectionHead color="#2563eb" title={`相关条目（名称包含“${r.query}”）`} desc="以下条目与查询词相关，供参考，非当前品名的直接结论。" />
                  <div style={{ borderRadius: 10, overflow: "hidden", border: "1px solid #e2e8f0" }}>
                    <ResultTable items={related} />
                  </div>
                </div>
              )}

              {/* 未找到 */}
              {!r.found && (
                <div style={{
                  padding: "12px 16px", borderRadius: 10, fontSize: 13, color: "#64748b",
                  background: "#f8fafc", border: "1px dashed #e2e8f0", lineHeight: 1.7
                }}>
                  未检索到不代表一定不属于危险化学品，建议继续核对 SDS、CAS号、主要成分及含量。
                </div>
              )}
            </div>
          </div>
        );
      })}

      {/* 还是无法判断 */}
      {searched && results.length > 0 && (
        <div style={{
          marginTop: 34, padding: 26, borderRadius: 14,
          background: "linear-gradient(135deg, #1e3a8a, #1e40af)", color: "#fff",
          display: "flex", alignItems: "center", gap: 28, flexWrap: "wrap"
        }}>
          <div style={{ flex: 1, minWidth: 260 }}>
            <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 10 }}>还是无法判断？</h3>
            <p style={{ fontSize: 14, color: "#c7d2fe", lineHeight: 1.8, marginBottom: 16 }}>
              商品名、混合物、类属条目等情况，仅凭名称可能无法准确判断。<br/>
              <b style={{ color: "#fff" }}>提供 产品名称 + CAS号 + SDS，我们帮你进一步核对。</b>
            </p>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 10,
              background: "rgba(255,255,255,0.12)", padding: "10px 18px", borderRadius: 10,
              fontSize: 15, fontWeight: 700, letterSpacing: 0.5
            }}>
              <span style={{ fontSize: 18 }}>📞</span>
              <a href="tel:13670159841" style={{ color: "#fff", textDecoration: "none" }}>136 7015 9841</a>
              <span style={{ fontSize: 12, color: "#c7d2fe", fontWeight: 500 }}>电话咨询</span>
            </div>
          </div>
          <div style={{ textAlign: "center" }}>
            <img src="/wechat-qr.png" alt="微信咨询二维码" width={132} height={132}
              style={{ borderRadius: 10, display: "block", background: "#fff", padding: 6 }} />
            <div style={{ fontSize: 12, color: "#c7d2fe", marginTop: 8 }}>扫码加微信咨询</div>
          </div>
        </div>
      )}

      {/* 数据来源 / 查询规则说明 */}
      <div id="about-data" style={{ marginTop: 44, scrollMarginTop: 80 }}>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: "#111827", marginBottom: 18, textAlign: "center" }}>
          数据来源与查询规则说明
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 14 }}>
          {[
            ["数据来源", "《危险化学品目录（2015版）》，由应急管理部等部门联合发布，目录序号 1–2828。"],
            ["查询范围", "同时匹配品名、别名、CAS号。输入任一信息命中即返回对应目录条目。"],
            ["别名与CAS号", "数据包含目录中的别名与CAS号，输入商品常用别名或CAS号均可查询。"],
            ["类属条目", "部分条目为类属条目（如“含易燃溶剂的合成树脂、油漆”等），需结合具体成分判断。"],
            ["混合物", "混合物通常不能仅凭名称直接判断，需结合SDS、各成分及含量、CAS号进一步核验。"],
            ["数据更新", "数据以2015版目录为准整理，如后续目录调整，以应急管理部门最新公布为准。"],
          ].map(([t, d]) => (
            <div key={t} style={{
              background: "#fff", borderRadius: 12, padding: 18,
              border: "1px solid #eef1f5", boxShadow: "0 2px 10px rgba(0,0,0,0.04)"
            }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#1d4ed8", marginBottom: 8 }}>{t}</div>
              <div style={{ fontSize: 13, color: "#4b5563", lineHeight: 1.8 }}>{d}</div>
            </div>
          ))}
        </div>
      </div>
      </main>

      {/* 页脚 */}
      <footer style={{ background: "#0f172a", color: "#94a3b8", marginTop: "auto" }}>
        <div style={{
          maxWidth: 1080, margin: "0 auto", padding: "32px 20px",
          display: "flex", justifyContent: "space-between", alignItems: "center",
          flexWrap: "wrap", gap: 16, fontSize: 13
        }}>
          <div>
            <div style={{ color: "#e2e8f0", fontWeight: 700, marginBottom: 6, fontSize: 14 }}>危化品查询</div>
            <div>依据《危险化学品目录（2015版）》核对（目录序号 1–2828）</div>
          </div>
          <div style={{ textAlign: "right", lineHeight: 1.8 }}>
            <div>本工具结果仅供参考，具体认定以应急管理部门最新目录为准</div>
            <div style={{ color: "#64748b" }}>© 2026 危化品查询工具</div>
          </div>
        </div>
      </footer>
    </div>
  );
}
