// 风格预设：一键换整套装扮（含随机）
//
// 设计要点：
//   · 预设数据在 models/style-presets.ts，全部经离线校验（可解析 + 许可纯净）。
//   · 应用方式是「构造上游 URL hash 参数 → loadSelectionsFromHash」，
//     复用官方解析逻辑；不直接写 state.selections，避免绕过别名与兼容性处理。
//   · 渲染位置在 FiltersPanel 内部（不是新增顶层 box），以免破坏桌面端
//     `#mithril-filters > div > .box:nth-child(N)` 这类结构选择器。
import m from "mithril";
import type { CatalogReader } from "../state/catalog.ts";
import type { State } from "../state/state.ts";
import { t } from "../utils/i18n.ts";
import {
  STYLE_PRESETS,
  applyStyleParams,
  randomOutfitParams,
} from "../models/style-presets.ts";

type StylePresetsAttrs = {
  catalog: CatalogReader;
  state: State;
  /** 移动端标签切片（默认归入「部位」标签）。 */
  slice?: string;
};

type StylePresetsState = {
  /** 最近应用的预设名，用于给出即时反馈 */
  lastApplied: string | null;
  /** 反馈文字 */
  feedback: string | null;
  timer: number | null;
};

export const StylePresets: m.Component<StylePresetsAttrs, StylePresetsState> = {
  oninit(vnode) {
    vnode.state.lastApplied = null;
    vnode.state.feedback = null;
    vnode.state.timer = null;
  },
  onremove(vnode) {
    if (vnode.state.timer) window.clearTimeout(vnode.state.timer);
  },
  view(vnode) {
    const { catalog, state } = vnode.attrs;

    const flash = (text: string) => {
      vnode.state.feedback = text;
      if (vnode.state.timer) window.clearTimeout(vnode.state.timer);
      vnode.state.timer = window.setTimeout(() => {
        vnode.state.feedback = null;
        m.redraw();
      }, 2600);
    };

    const apply = (params: Record<string, string>, label: string) => {
      try {
        applyStyleParams(catalog, state, params);
        vnode.state.lastApplied = label;
        flash(t("style.applied", { name: label }));
      } catch (err) {
        console.error("Failed to apply style preset:", err);
        flash(String(err));
      }
      m.redraw();
    };

    return m("div.style-presets", { "data-slice": vnode.attrs.slice ?? "parts" }, [
      m("div.style-presets-head", [
        m("span.style-presets-title", t("style.title")),
        m("span.style-presets-hint", t("style.hint")),
      ]),
      m(
        "div.style-presets-chips",
        [
          m(
            "button.style-preset.style-preset--random",
            {
              type: "button",
              title: t("style.randomHint"),
              onclick: () => apply(randomOutfitParams(), t("style.random")),
            },
            ["🎲 ", t("style.random")],
          ),
          ...STYLE_PRESETS.map((preset) =>
            m(
              "button.style-preset",
              {
                type: "button",
                class: vnode.state.lastApplied === t(`style.${preset.id}`) ? "is-active" : "",
                onclick: () => apply(preset.params, t(`style.${preset.id}`)),
              },
              t(`style.${preset.id}`),
            ),
          ),
        ],
      ),
      m("p.style-presets-note", t("style.safe")),
      vnode.state.feedback
        ? m("p.style-presets-feedback", vnode.state.feedback)
        : null,
    ]);
  },
};
