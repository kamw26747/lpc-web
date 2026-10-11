/**
 * 轻量 i18n 运行时（零依赖）
 *
 * 上游项目没有 UI 多语言框架（`lang/` 目录只有一份中文 README），
 * 因此本项目自行引入：只需 `t(key)` 取值，缺失时回退英文、再回退 key 本身。
 *
 * 用法：
 *   import { t, setLocale, initI18n } from "../utils/i18n.ts";
 *   initI18n({ en, "zh-CN": zhCN }, "zh-CN");   // 在 main.ts 里调用一次
 *   m("span", t("filters.license.title"))
 */

export type Locale = "zh-CN" | "en";

import { ITEM_ZH, VARIANT_ZH } from "../i18n/glossary.ts";

type Catalog = Record<string, string>;

const catalogs: Record<string, Catalog> = {};
const FALLBACK: Locale = "en";
const STORAGE_KEY = "lpc.locale";

let current: Locale = "zh-CN";

export function registerCatalog(locale: string, catalog: Catalog): void {
  catalogs[locale] = catalog;
}

export function getLocale(): Locale {
  return current;
}

export function setLocale(locale: Locale): void {
  current = locale;
  try {
    localStorage.setItem(STORAGE_KEY, locale);
  } catch {
    /* 隐私模式等场景忽略 */
  }
  document.documentElement?.setAttribute?.("lang", locale);
}

/** 启动时调用一次：注册词条并恢复上次语言。 */
export function initI18n(
  all: Record<string, Catalog>,
  defaultLocale: Locale = "zh-CN",
): void {
  for (const [loc, cat] of Object.entries(all)) registerCatalog(loc, cat);
  let saved: string | null = null;
  try {
    saved = localStorage.getItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
  current = (saved as Locale) ?? defaultLocale;
  document.documentElement?.setAttribute?.("lang", current);
}

function interpolate(template: string, params?: Record<string, string | number>): string {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (_, k) =>
    k in params ? String(params[k]) : `{${k}}`,
  );
}

/** 取词条并插值。查找顺序：当前语言 → 英文 → key 本身。 */
export function t(key: string, params?: Record<string, string | number>): string {
  const hit = catalogs[current]?.[key] ?? catalogs[FALLBACK]?.[key] ?? key;
  return interpolate(hit, params);
}

/** 动画名：优先取词条，缺失时回退到上游的英文 label（保证不丢信息）。 */
export function tAnim(value: string, fallback: string): string {
  const key = `anim.${value}`;
  const hit = catalogs[current]?.[key] ?? catalogs[FALLBACK]?.[key];
  return hit ?? fallback;
}

/** 体型名：同上。 */
export function tBody(value: string, fallback: string): string {
  const key = `body.${value}`;
  const hit = catalogs[current]?.[key] ?? catalogs[FALLBACK]?.[key];
  return hit ?? fallback;
}

/**
 * 分类名（导航树）：按英文段名查表，缺失时回退原值。
 * 分类名来自 `sheet_definitions/` 的目录段（共 109 个），
 * 中文词条以 `category.<段名>` 形式仅存在于 zh-CN（英文侧刻意不建条目，
 * 以完整保留上游原始英文命名）。
 */
export function tCat(segment: string, fallback: string): string {
  const key = `category.${segment}`;
  const hit = catalogs[current]?.[key] ?? catalogs[FALLBACK]?.[key];
  return hit ?? fallback;
}

/** 开发期校验：找出两套词条之间的键差异。 */
export function diffCatalogs(a: Catalog, b: Catalog): { missingInB: string[]; missingInA: string[] } {
  const ka = new Set(Object.keys(a));
  const kb = new Set(Object.keys(b));
  return {
    missingInB: [...ka].filter((k) => !kb.has(k)).sort(),
    missingInA: [...kb].filter((k) => !ka.has(k)).sort(),
  };
}

/**
 * 素材名（`sheet_definitions` 的 `name`，如 "Afro" / "Long straight"）→ 中文。
 *
 * 词表见 `sources/i18n/glossary.ts`（649 条，覆盖上游全部素材）。
 * 中文只在 zh-CN 生效；切回 en 时直接返回原名，与上游完全一致。
 */
export function tItem(name: string): string {
  if (!name || current !== "zh-CN") return name;
  return ITEM_ZH[name] ?? name;
}

/**
 * 变体 / 配色名（`variants` 取值与调色板色名，如 "navy" / "light brown"）→ 中文。
 *
 * `fallback` 传上游原本的显示形式（`capitalize(variant.replaceAll("_", " "))`），
 * 缺失时回退，保证不丢信息。
 */
export function tVariant(value: string, fallback: string): string {
  if (!value || current !== "zh-CN") return fallback;
  return VARIANT_ZH[value] ?? fallback;
}

/**
 * 搜索匹配用的素材名文本：中文环境下把中英两套名字拼在一起，
 * 这样「长发」「Long straight」都能搜到同一项。
 */
export function itemSearchText(name: string): string {
  const zh = ITEM_ZH[name];
  return zh && zh !== name ? `${name} ${zh}` : name;
}

/** 变体搜索文本：同上。 */
export function variantSearchText(value: string): string {
  const zh = VARIANT_ZH[value];
  return zh && zh !== value ? `${value} ${zh}` : value;
}

/**
 * 「已选」面板里的显示名。
 *
 * 上游把它拼成 `Base (variant | recolor)`（见 hash.ts 的 buildNewSelection），
 * 这里分别翻译基名与括号内的变体/配色，并保留原有的结构。
 */
export function tSelectionName(name: string): string {
  if (!name || current !== "zh-CN") return name;
  const idx = name.indexOf(" (");
  if (idx === -1 || !name.endsWith(")")) return tItem(name);
  const base = tItem(name.slice(0, idx));
  const inner = name.slice(idx + 2, -1);
  const parts = inner.split("|").map((s) => s.trim());
  const zhParts = parts.map((part) => {
    const toks = part.split(" ");
    const last = toks[toks.length - 1];
    const hit = VARIANT_ZH[part] ?? VARIANT_ZH[last];
    if (!hit) return part;
    return VARIANT_ZH[part] ? hit : `${toks.slice(0, -1).join(" ")} ${hit}`;
  });
  return `${base}（${zhParts.join(" | ")}）`;
}
