import type { CatalogReader } from "../state/catalog.ts";
import {
  isItemAnimationCompatible,
  isItemLicenseCompatible,
} from "../state/filters.ts";
import type { State } from "../state/state.ts";
import { t, tAnim, tSelectionName } from "../utils/i18n.ts";

export type CurrentSelectionItemModel = {
  readonly key: string;
  readonly name: string;
  readonly isCompatible: boolean;
  readonly tooltip: string;
  remove(): void;
};

export type CurrentSelectionsModel =
  | { readonly kind: "loading" }
  | { readonly kind: "empty" }
  | {
      readonly kind: "ready";
      readonly items: readonly CurrentSelectionItemModel[];
    };

export const currentSelectionsModelFactory = {
  create(catalog: CatalogReader, state: State): CurrentSelectionsModel {
    if (!catalog.isLiteReady()) return { kind: "loading" };

    const selections = Object.entries(state.selections);
    if (selections.length === 0) return { kind: "empty" };

    const creditsReady = catalog.isCreditsReady();
    return {
      kind: "ready",
      items: selections.map(([key, selection]) => {
        const licenseCompatible = isItemLicenseCompatible(
          catalog,
          state,
          selection.itemId,
        );
        const animationCompatible = isItemAnimationCompatible(
          catalog,
          state,
          selection.itemId,
        );
        const isCompatible = licenseCompatible && animationCompatible;
        const meta = catalog.getItemMerged(selection.itemId).unwrapOr(null);
        const licenses = new Set<string>();
        for (const credit of meta?.credits ?? []) {
          for (const license of credit.licenses) licenses.add(license.trim());
        }

        const licensesText = !creditsReady
          ? t("tooltip.licenseLoading")
          : licenses.size > 0
            ? t("tooltip.licenses", { list: Array.from(licenses).join(", ") })
            : t("tooltip.noLicenseInfo");
        const supportedAnimations = meta?.animations ?? [];
        const animationsText =
          supportedAnimations.length > 0
            ? t("tooltip.animations", {
                list: supportedAnimations.map((a) => tAnim(a, a)).join(", "),
              })
            : t("tooltip.noAnimationInfo");
        const incompatibility = !isCompatible
          ? `${t("tooltip.incompatible", {
              items: [
                !licenseCompatible ? t("tooltip.issueLicenses") : null,
                !animationCompatible ? t("tooltip.issueAnimations") : null,
              ]
                .filter(Boolean)
                .join(t("tooltip.and")),
            })}\n`
          : "";

        return {
          key,
          name: tSelectionName(selection.name),
          isCompatible,
          tooltip: `${incompatibility}${licensesText}\n${animationsText}`,
          remove: () => {
            delete state.selections[key];
          },
        };
      }),
    };
  },
};
