// Advanced Tools component - Custom file upload with z-position
import m from "mithril";
import { t } from "../../utils/i18n.ts";
import type { State } from "../../state/state.ts";
import { CollapsibleSection } from "../CollapsibleSection.ts";

export const AdvancedTools: m.Component<{ state: State; slice?: string }> = {
  view(vnode) {
    const { state } = vnode.attrs;
    const handleFileUpload = (e: Event) => {
      const target = e.target as HTMLInputElement;
      const file = target.files?.[0];
      if (!file) return;

      const img = new Image();
      img.onload = () => {
        state.customUploadedImage = img;
        m.redraw();
      };
      img.src = URL.createObjectURL(file);
    };

    const handleZPosChange = (e: Event) => {
      const target = e.target as HTMLInputElement;
      const value = parseInt(target.value, 10);
      state.customImageZPos = isNaN(value) ? 0 : value;
      m.redraw();
    };

    const clearCustomImage = () => {
      state.customUploadedImage = null;
      state.customImageZPos = 0;
      const fileInput = document.getElementById(
        "customFileInput",
      ) as HTMLInputElement | null;
      if (fileInput) fileInput.value = "";
      m.redraw();
    };

    return m(
      CollapsibleSection,
      {
        title: t("advanced.title"),
        defaultOpen: false,
        slice: vnode.attrs.slice,
      },
      [
        m("div.field", [
          m("label.label", t("advanced.customUpload")),
          m("div.control", [
            m("input.input[type=file]#customFileInput", {
              accept: "image/*",
              onchange: handleFileUpload,
            }),
          ]),
          m(
            "p.help",
            "Upload a local image file to overlay on the spritesheet",
          ),
        ]),
        m("div.field", [
          m("label.label", t("advanced.zPosition")),
          m("div.control", [
            m("input.input[type=number]", {
              value: state.customImageZPos,
              oninput: handleZPosChange,
              placeholder: "0",
            }),
          ]),
          m("p.help", [
            "Layer order: ",
            m("code", "0=shadow"),
            ", ",
            m("code", "10=body"),
            ", ",
            m("code", "70=arms"),
            ", ",
            m("code", "110=beard"),
          ]),
        ]),
        state.customUploadedImage &&
          m("div.field", [
            m("div.control", [
              m(
                "button.button.is-small.is-warning",
                {
                  onclick: clearCustomImage,
                },
                "Clear Custom Image",
              ),
            ]),
          ]),
      ],
    );
  },
};
