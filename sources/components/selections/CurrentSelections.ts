// Current selections component
import m from "mithril";
import { t } from "../../utils/i18n.ts";
import type { CurrentSelectionsModel } from "../../models/current-selections.ts";

export const CurrentSelections: m.Component<{
  createModel: () => CurrentSelectionsModel;
}> = {
  view(vnode) {
    // Only called when the node is actually rendered
    // Currently it is shown by default, so it is called in each redraw
    const model = vnode.attrs.createModel();
    if (model.kind === "loading") {
      return m("div", [
        m("h3.title.is-5", t("selections.title")),
        m("p.is-size-7.has-text-grey", t("common.loadingItems")),
      ]);
    }

    if (model.kind === "empty") {
      return m("div", [
        m("h3.title.is-5", t("selections.title")),
        m("p.has-text-grey", t("selections.none")),
      ]);
    }

    return m("div", [
      m("h3.title.is-5", t("selections.title")),
      m(
        "div.tags",
        model.items.map((item) => {
          return m(
            "span.tag.is-medium",
            {
              key: item.key,
              class: item.isCompatible ? "is-info" : "is-warning",
              title: item.tooltip,
            },
            [
              m("span", item.name),
              !item.isCompatible ? m("span.ml-1", "⚠️") : null,
              m("button.delete.is-small", {
                onclick: item.remove,
              }),
            ],
          );
        }),
      ),
    ]);
  },
};
