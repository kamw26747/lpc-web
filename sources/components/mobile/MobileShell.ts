// 移动端外壳（仅 <1024px 可见）
//
// 职责：
//   · 底部 4 标签栏：角色 / 部位 / 已选 / 导出
//   · 把当前标签写到 <body data-mobile-tab="...">，由 CSS 完成内容切片显隐
//   · 亮/暗主题切换（持久化到 localStorage，首屏由 index.html 内联脚本无闪应用）
//   · 非「角色」标签时，在停靠条上方提供一个"点开预览"的按钮
//
// 两条设计约束（勿轻易改动）：
//   1. **不新增 DOM 包裹层**：桌面端 CSS 大量依赖
//      `#mithril-filters > div > .box:nth-child(N)`，插入包裹 div 会同时破坏两端。
//      因此标签切换走「属性 + CSS 可见性」，而非重构 view 结构。
//   2. **AnimationPreview 全局只能挂一份**：离屏画布与预览画布都是模块级单例，
//      复制组件会互相争抢渲染结果。预览"常驻"靠同一个 #preview-column 的 CSS 换位。

import m from "mithril";
import { t } from "../../utils/i18n.ts";
import type { MobileTab, State } from "../../state/state.ts";

const TABS: readonly MobileTab[] = ["preview", "parts", "selected", "export"];

/** 标签图标（纯文本，避免额外资源；后续可换 SVG）。 */
const TAB_ICONS: Record<MobileTab, string> = {
  preview: "🧍",
  parts: "🧩",
  selected: "✓",
  export: "⇩",
};

const THEME_KEY = "lpc.mobileTheme";
type Theme = "light" | "dark";

function readTheme(): Theme {
  return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
}

function applyTheme(theme: Theme): void {
  document.documentElement.dataset.theme = theme;
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch {
    /* ignore */
  }
}

/** 把当前标签同步到 <body>，CSS 据此显隐内容切片。 */
function syncBodyTab(tab: MobileTab): void {
  document.body.dataset.mobileTab = tab;
}

export const MobileShell: m.Component<{ state: State }> = {
  oncreate(vnode) {
    syncBodyTab(vnode.attrs.state.mobileTab);
  },
  onupdate(vnode) {
    syncBodyTab(vnode.attrs.state.mobileTab);
  },
  view(vnode) {
    const { state } = vnode.attrs;

    const go = (tab: MobileTab) => {
      state.mobileTab = tab;
      syncBodyTab(tab);
      m.redraw();
    };

    const theme = readTheme();

    return [
      // 主题切换（移动端顶部右侧）
      m(
        "button.m-theme-toggle",
        {
          type: "button",
          "aria-label": t("mobile.theme.switch"),
          title: t("mobile.theme.switch"),
          onclick: () => {
            applyTheme(theme === "dark" ? "light" : "dark");
            m.redraw();
          },
        },
        theme === "dark" ? "☀" : "☾",
      ),

      // 停靠条点开按钮：非「角色」标签时覆盖在停靠条上
      state.mobileTab !== "preview"
        ? m("button.m-dock-tap", {
            type: "button",
            "aria-label": t("mobile.dock.expand"),
            onclick: () => go("preview"),
          })
        : null,

      // 底部标签栏
      m(
        "nav.m-tabbar",
        { role: "tablist" },
        TABS.map((tab) =>
          m(
            "button.m-tab",
            {
              type: "button",
              role: "tab",
              "aria-selected": String(state.mobileTab === tab),
              class: state.mobileTab === tab ? "is-active" : "",
              onclick: () => go(tab),
            },
            [
              m("span.m-tab__icon", { "aria-hidden": "true" }, TAB_ICONS[tab]),
              m("span.m-tab__label", t(`mobile.tab.${tab}`)),
            ],
          ),
        ),
      ),
    ];
  },
};
