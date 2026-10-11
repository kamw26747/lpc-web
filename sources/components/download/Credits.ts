import m from "mithril";
import { t } from "../../utils/i18n.ts";
import type { CreditsModel } from "../../models/credits.ts";
import { CollapsibleSection } from "../CollapsibleSection.ts";

const CreditsContent: m.Component<{
  createModel: () => CreditsModel;
}> = {
  view(vnode) {
    const model = vnode.attrs.createModel();
    if (model.kind === "loading") {
      return m(
        "div.loading-shell-credits",
        m("p.has-text-grey", t("credits.loading")),
      );
    }
    if (model.kind === "empty") {
      return m("p.has-text-grey", t("credits.none"));
    }

    return [
      m(
        "div.content.has-background-light.p-3",
        model.credits.map((credit) =>
          m("div.mb-3", { key: credit.key }, [
            m("strong.is-size-6", credit.fileName),
            credit.notes ? m("p.is-size-7", credit.notes) : null,
            m("p.is-size-7", [
              m("strong", t("credits.licenses")),
              credit.licenses.join(", "),
            ]),
            m("p.is-size-7", [
              m("strong", t("credits.authors")),
              credit.authors.join(", "),
            ]),
          ]),
        ),
      ),
      m("div.buttons.mt-3", [
        m(
          "button.button.is-small",
          { onclick: model.downloadTxt },
          "Download TXT",
        ),
        m(
          "button.button.is-small",
          { onclick: model.downloadCsv },
          "Download CSV",
        ),
      ]),
    ];
  },
};

export const Credits: m.Component<{
  createModel: () => CreditsModel;
  /** 移动端标签切片归属（见 CollapsibleSection.slice）。 */
  slice?: string;
}> = {
  view(vnode) {
    return m(
      CollapsibleSection,
      {
        title: t("credits.title"),
        defaultOpen: true,
        boxClass: "box",
        id: "credits-section",
        slice: vnode.attrs.slice,
      },
      [
        m("p.is-size-7.mb-2", [
          "You must credit the authors of this artwork. ",
          m(
            "a",
            {
              href: "https://github.com/liberatedpixelcup/Universal-LPC-Spritesheet-Character-Generator/blob/master/README.md",
              target: "_blank",
            },
            "Detailed attribution instructions",
          ),
        ]),
        m("p.is-size-7.mb-3", [
          "License information for all spritesheets in this generator is available ",
          m(
            "a",
            {
              href: "https://github.com/liberatedpixelcup/Universal-LPC-Spritesheet-Character-Generator/raw/refs/heads/master/CREDITS.csv",
              target: "_blank",
            },
            "here",
          ),
        ]),
        m(CreditsContent, { createModel: vnode.attrs.createModel }),
      ],
    );
  },
};
