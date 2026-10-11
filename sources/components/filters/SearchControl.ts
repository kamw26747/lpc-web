// Search control component
import m from "mithril";
import { t } from "../../utils/i18n.ts";
import type { SearchControlModel } from "../../models/search-control.ts";

export const SearchControl: m.Component<{
  createModel: () => SearchControlModel;
}> = {
  view(vnode) {
    const model = vnode.attrs.createModel();
    return m("div.field", [
      m("label.label", t("common.search")),
      m("input.input[type=search][placeholder=Search]", {
        value: model.value,
        disabled: model.disabled,
        title: model.title,
        oninput: (e: Event) => {
          model.setValue((e.target as HTMLInputElement).value);
        },
      }),
    ]);
  },
};
