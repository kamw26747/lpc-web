// Filters Panel - combines Controls, LicenseFilters, AnimationFilters, CurrentSelections, and CategoryTree
import m from "mithril";
import { t } from "../utils/i18n.ts";
import { SearchControl } from "./filters/SearchControl.ts";
import { LicenseFilters } from "./filters/LicenseFilters.ts";
import { AnimationFilters } from "./filters/AnimationFilters.ts";
import { CurrentSelections } from "./selections/CurrentSelections.ts";
import { CategoryTree } from "./tree/CategoryTree.ts";
import { CollapsibleSection } from "./CollapsibleSection.ts";
import type { CurrentSelectionsModel } from "../models/current-selections.ts";
import type { SearchControlModel } from "../models/search-control.ts";
import type { LicenseFiltersModel } from "../models/license-filters.ts";
import type { AnimationFiltersModel } from "../models/animation-filters.ts";
import type { CategoryTreeModel } from "../models/category-tree.ts";

type FiltersPanelAttrs = {
  createSearchControlModel: () => SearchControlModel;
  createLicenseFiltersModel: () => LicenseFiltersModel;
  createAnimationFiltersModel: () => AnimationFiltersModel;
  createCurrentSelectionsModel: () => CurrentSelectionsModel;
  createCategoryTreeModel: () => CategoryTreeModel;
  /** 移动端标签切片归属（空格分隔，见 CollapsibleSection.slice）。 */
  slice?: string;
};

export const FiltersPanel: m.Component<FiltersPanelAttrs> = {
  view(vnode) {
    const {
      createSearchControlModel,
      createLicenseFiltersModel,
      createAnimationFiltersModel,
      createCurrentSelectionsModel,
      createCategoryTreeModel,
    } = vnode.attrs;
    return m(
      CollapsibleSection,
      {
        title: t("panel.filters"),
        defaultOpen: true,
        slice: vnode.attrs.slice,
      },
      [
        m(
          "div.mb-4",
          { "data-slice": "parts" },
          m(SearchControl, { createModel: createSearchControlModel }),
        ),
        // Responsive wrapper for License and Animation filters
        m("div.columns.is-multiline.m-0", { "data-slice": "parts" }, [
          m(
            "div.column.is-half-desktop.is-12-mobile",
            {
              class: "filters-column",
            },
            m(LicenseFilters, { createModel: createLicenseFiltersModel }),
          ),
          m(
            "div.column.is-half-desktop.is-12-mobile",
            {
              class: "filters-column",
            },
            m(AnimationFilters, { createModel: createAnimationFiltersModel }),
          ),
        ]),
        m(
          "div.mb-4",
          { "data-slice": "selected" },
          m(CurrentSelections, {
            createModel: createCurrentSelectionsModel,
          }),
        ),
        m(CategoryTree, {
          createModel: createCategoryTreeModel,
        }),
      ],
    );
  },
};
