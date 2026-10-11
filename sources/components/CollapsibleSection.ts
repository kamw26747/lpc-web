// Reusable CollapsibleSection component
import m from "mithril";

export type CollapsibleSectionAttrs = {
  title: string;
  defaultOpen?: boolean;
  boxClass?: string;
  onToggle?: (isCollapsed: boolean) => void;
  id?: string;
  /**
   * 移动端「标签切片」归属：空格分隔的标识（如 `"parts selected"`）。
   * 渲染为根元素上的 `data-slice`，由移动端 CSS 按当前标签显隐。
   * 用**属性**而非包裹元素，避免破坏桌面端依赖 nth-child 的选择器。
   */
  slice?: string;
};

type CollapsibleSectionState = { isCollapsed: boolean };

export const CollapsibleSection: m.Component<
  CollapsibleSectionAttrs,
  CollapsibleSectionState
> = {
  oninit(vnode) {
    const { defaultOpen = true } = vnode.attrs;
    vnode.state.isCollapsed = !defaultOpen;
  },
  view(vnode) {
    const { title, boxClass = "box", onToggle, id, slice } = vnode.attrs;
    const { isCollapsed } = vnode.state;

    const toggleCollapse = () => {
      vnode.state.isCollapsed = !vnode.state.isCollapsed;

      // Call callback if provided
      // The hack to handle the canvas state from within mithril is here:
      if (onToggle) {
        onToggle(vnode.state.isCollapsed);
      }
    };

    return m(`div.${boxClass}`, { id, "data-slice": slice }, [
      // Collapsible header
      m(
        "div",
        {
          onclick: toggleCollapse,
          class: "collapsible-header",
        },
        [
          m("span", {
            class: isCollapsed ? "tree-arrow collapsed" : "tree-arrow expanded",
          }),
          m("h3.title.is-5.mb-0", { class: "collapsible-title" }, title),
        ],
      ),

      // Collapsible content
      !isCollapsed &&
        m("div", { class: "collapsible-content" }, vnode.children),
    ]);
  },
};
