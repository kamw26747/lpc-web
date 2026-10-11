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

/** 开发期校验：找出两套词条之间的键差异。 */
export function diffCatalogs(a: Catalog, b: Catalog): { missingInB: string[]; missingInA: string[] } {
  const ka = new Set(Object.keys(a));
  const kb = new Set(Object.keys(b));
  return {
    missingInB: [...ka].filter((k) => !kb.has(k)).sort(),
    missingInA: [...kb].filter((k) => !ka.has(k)).sort(),
  };
}
