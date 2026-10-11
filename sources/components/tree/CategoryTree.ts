import m from "mithril";
import { t } from "../../utils/i18n.ts";
import type { CategoryTreeModel } from "../../models/category-tree.ts";
import { BodyTypeSelector } from "./BodyTypeSelector.ts";
import { TreeNode } from "./TreeNode.ts";

function renderLoadingHost() {
  return m("div.box.has-background-light.category-tree-panel", [
    m("div.category-tree-loading-host", [
      m(
        "div.category-tree-loading-overlay",
        { "aria-busy": "true", "aria-live": "polite" },
        m("span.loading", { "aria-label": t("tree.loadingIndex") }),
      ),
      m("h3.title.is-5.mb-3", t("tree.available")),
      m("p.has-text-grey.is-size-7", t("tree.loadingIndexEllipsis")),
    ]),
  ]);
}

export const CategoryTree: m.Component<{
  createModel: () => CategoryTreeModel;
}> = {
  view(vnode) {
    const model = vnode.attrs.createModel();
    if (model.isLoading) return renderLoadingHost();

    return m("div.box.has-background-light.category-tree-panel", [
      m(
        "div.is-flex.is-justify-content-space-between.is-align-items-center.mb-3",
        [
          m("h3.title.is-5.mb-0", t("tree.available")),
          m("div.buttons.mb-0", [
            m(
              "button.button.is-danger.is-small",
              { onclick: model.reset },
              "Reset all",
            ),
            m(
              "button.button.is-small",
              { onclick: model.collapseAll },
              "Collapse All",
            ),
            m(
              "button.button.is-small",
              {
                disabled: !model.liteReady,
                title: model.liteReady ? undefined : t("common.loadingItems"),
                onclick: model.expandSelected,
              },
              "Expand Selected",
            ),
            m(
              "button.button.is-small",
              {
                class: model.compactDisplay ? "is-link" : "",
                onclick: model.toggleCompactDisplay,
              },
              "CompactDisplay",
            ),
          ]),
        ],
      ),
      m("div.mb-3", [
        m(
          "label.checkbox",
          {
            title:
              "When enabled, changing body color will automatically update all compatible items (heads, ears, noses, etc.) to the same color variant",
          },
          [
            m("input[type=checkbox]", {
              id: "match-body-color-checkbox",
              "aria-describedby": "match-body-color-label",
              checked: model.matchBodyColorEnabled,
              onchange: (event: Event) => {
                model.setMatchBodyColor(
                  (event.target as HTMLInputElement).checked,
                );
              },
            }),
            " Match body color",
          ],
        ),
        m(
          "p.is-size-7.has-text-grey.mt-1.ml-4",
          { id: "match-body-color-label" },
          "Auto-update heads, ears, and other items when body color changes",
        ),
      ]),
      m("div", [
        m(BodyTypeSelector, { model: model.bodyTypes }),
        model.roots.map((root) =>
          m(TreeNode, {
            key: root.key,
            createModel: root.createModel,
          }),
        ),
      ]),
    ]);
  },
};
