// 本文件由 tools/style-presets.py 生成，请勿手工编辑（改 tools/style-presets.py 的 PRESETS）。
//
// 两条硬约束驱动了这里的数据结构：
//   1. 所有预设/随机池素材都经离线校验（tools/style-presets.py verify，CI 门禁）：
//      **上游 hash 解析器可解析** 且 **许可纯净**（按「该体型实际用到的图层目录」判定，
//      见 manifests/license-manifest.json）。否则用户一键套装后导出的图会混入
//      CC-BY-SA/GPL 素材，破坏商用前提。
//   2. 预设以「上游 URL hash 参数」表达，直接交给 loadSelectionsFromHash，
//      复用官方的别名/兼容性解析逻辑，不另造一套选装代码。

import type { CatalogReader } from "../state/catalog.ts";
import type { State } from "../state/state.ts";
import { createHashStringFromParams, loadSelectionsFromHash } from "../state/hash.ts";

export type StylePreset = {
  /** 词条 key 后缀，取自 style.<id> */
  readonly id: string;
  readonly params: Record<string, string>;
};

/** 随机池条目：素材名 + 该素材可用的配色（空数组表示无配色维度）。 */
export type RandomChoice = { readonly item: string; readonly colors: readonly string[] };

/** 13 套风格预设（全部为可商用素材，无 copyleft 传染）。 */
export const STYLE_PRESETS: readonly StylePreset[] = [
  { id: "knight", params: {"sex": "male", "body": "Body_Color_light", "head": "Human_Male", "hair": "Short_Topknot_black", "armour": "Plate", "arms": "Armour", "legs": "Armour", "shoes": "Armour", "hat": "Norman_helm", "weapon": "Arming_Sword_steel", "shield": "Heater_Shield_Base", "cape": "Solid", "neck": "Cape_Clip"} },
  { id: "mage", params: {"sex": "female", "body": "Body_Color_light", "head": "Human_Female", "hair": "Long_straight_black", "clothes": "Sara_Tunic_navy", "hat": "Celestial_Wizard_Hat_blue", "weapon": "Gnarled_staff_brass", "belt": "Robe_Belt_teal", "cape": "Solid"} },
  { id: "ranger", params: {"sex": "male", "body": "Body_Color_light", "head": "Human_Male", "hair": "Long_tied_brown", "clothes": "Sleeveless_striped_green", "legs": "Pants", "shoes": "Basic_Boots", "hat": "Hood", "cape": "Tattered", "weapon": "Crossbow_crossbow", "quiver": "Quiver_quiver"} },
  { id: "rogue", params: {"sex": "male", "body": "Body_Color_light", "head": "Human_Male", "hair": "Short_Topknot_black", "clothes": "Sleeveless_black", "legs": "Leggings", "shoes": "Basic_Boots", "facial_mask": "Plain_Mask_dark", "weapon": "Dagger_dagger", "belt": "Leather_Belt_leather"} },
  { id: "noble", params: {"sex": "female", "body": "Body_Color_light", "head": "Human_Female", "hair": "Half_up_blonde", "jacket": "Tabard_navy", "vest": "Bodice_purple", "legs": "Formal_Pants", "shoes": "Revised_Shoes_black", "neck": "Cravat", "cape": "Solid"} },
  { id: "farmer", params: {"sex": "male", "body": "Body_Color_light", "head": "Human_Male", "hair": "Plain_sandy", "clothes": "Shortsleeve", "overalls": "Overalls_leather", "legs": "Pants", "shoes": "Basic_Shoes", "hat": "Leather_Cap_brown", "weapon": "Watering_Can"} },
  { id: "undead", params: {"sex": "male", "body": "Skeleton", "head": "Skeleton", "clothes": "Longsleeve_2_black", "legs": "Pants", "shoes": "Basic_Boots", "weapon": "Mace_mace"} },
  { id: "elf", params: {"sex": "female", "body": "Body_Color_light", "head": "Human_Female", "ears": "Medium_Elven_Ears", "hair": "Long_straight_blonde", "clothes": "Tunic_green", "legs": "Leggings", "shoes": "Basic_Boots", "cape": "Solid", "weapon": "Simple_staff_simple"} },
  { id: "pirate", params: {"sex": "male", "body": "Body_Color_light", "head": "Human_Male", "hair": "Long_straight_black", "hat": "Bicorne_Athwart_Captain_black", "bandana": "Bandana", "clothes": "Longsleeve_2_white", "legs": "Long_Pants_navy", "shoes": "Basic_Boots", "weapon": "Rapier_rapier", "facial_eyes": "Eyepatch_Right_black", "prosthesis_hand": "Hook_Hand", "prosthesis_leg": "Peg_leg"} },
  { id: "ninja", params: {"sex": "male", "body": "Body_Color_light", "head": "Human_Male", "hair": "High_ponytail_black", "facial_mask": "Plain_Mask_dark", "clothes": "Sleeveless_black", "legs": "Leggings", "sash": "Sash_black", "weapon": "Katana_katana", "socks": "Tabi_Socks"} },
  { id: "barbarian", params: {"sex": "male", "body": "Body_Color_light", "head": "Human_Male", "hair": "Xlong_brown", "hat": "Barbarian", "armour": "Leather", "shoulders": "Pauldrons", "legs": "Pants", "shoes": "Basic_Boots", "weapon": "Axe"} },
  { id: "king", params: {"sex": "male", "body": "Body_Color_light", "head": "Human_Male_Elderly", "hair": "Long_center_part_white", "jacket": "Tabard_purple", "cape": "Solid", "legs": "Formal_Pants", "shoes": "Revised_Shoes_black", "belt": "Leather_Belt_white", "neck": "Jabot"} },
  { id: "villager", params: {"sex": "female", "body": "Body_Color_light", "head": "Human_Female", "hair": "Long_straight_blonde", "clothes": "Blouse_pink", "legs": "Plain_skirt", "shoes": "Basic_Shoes", "apron": "Apron_brown"} },
];

/** 肤色候选（男女体型均可用且许可纯净）。 */
export const BODY_COLORS: readonly string[] = ["light", "amber", "olive", "taupe", "bronze", "brown", "lavender", "pale_green"];

/** 随机搭配候选池。 */
export const RANDOM_POOL: Record<string, readonly RandomChoice[]> = {
  apron: [
    { item: "Apron", colors: ["black", "blue", "brown", "charcoal", "forest", "gray", "green", "lavender", "maroon", "navy", "orange", "purple", "red", "rose", "sky", "tan", "teal", "white", "yellow"] },
  ],
  armour: [
    { item: "Leather", colors: ["black", "blue", "brown", "charcoal", "forest", "gray", "green", "lavender", "maroon", "navy", "orange", "purple", "red", "rose", "sky", "tan", "teal", "white", "yellow"] },
    { item: "Legion", colors: ["brass", "bronze", "copper", "gold", "iron", "silver", "steel"] },
    { item: "Plate", colors: ["brass", "bronze", "copper", "gold", "iron", "silver", "steel"] },
  ],
  belt: [
    { item: "Belly belt", colors: ["brown", "charcoal", "tan", "white"] },
    { item: "Double Belt", colors: ["brown", "charcoal", "tan", "white"] },
    { item: "Leather Belt", colors: ["brown", "charcoal", "tan", "white"] },
    { item: "Leather Belt Alt", colors: ["leather"] },
    { item: "Loose Belt", colors: ["brown", "charcoal", "tan", "white"] },
    { item: "Robe Belt", colors: ["teal", "white"] },
  ],
  cape: [
    { item: "Solid", colors: ["black", "blue", "brown", "charcoal", "forest", "gray", "green", "lavender", "maroon", "navy", "orange", "purple", "red", "rose", "sky", "tan", "teal", "white", "yellow"] },
    { item: "Tattered", colors: ["black", "blue", "brown", "charcoal", "forest", "gray", "green", "lavender", "maroon", "navy", "orange", "purple", "red", "rose", "sky", "tan", "teal", "white", "yellow"] },
  ],
  clothes: [
    { item: "Cardigan", colors: ["black", "blue", "brown", "charcoal", "forest", "gray", "green", "lavender", "maroon", "navy", "orange", "purple", "red", "rose", "sky", "tan", "teal", "white", "yellow"] },
    { item: "Longsleeve", colors: ["black", "blue", "brown", "charcoal", "forest", "gray", "green", "lavender", "maroon", "navy", "orange", "purple", "red", "rose", "sky", "tan", "teal", "white", "yellow"] },
    { item: "Longsleeve 2", colors: ["black", "blue", "brown", "charcoal", "forest", "gray", "green", "lavender", "maroon", "navy", "orange", "purple", "red", "rose", "sky", "tan", "teal", "white", "yellow"] },
    { item: "Longsleeve 2 Buttoned", colors: ["black", "blue", "brown", "charcoal", "forest", "gray", "green", "lavender", "maroon", "navy", "orange", "purple", "red", "rose", "sky", "tan", "teal", "white", "yellow"] },
    { item: "Longsleeve 2 Scoop", colors: ["black", "blue", "brown", "charcoal", "forest", "gray", "green", "lavender", "maroon", "navy", "orange", "purple", "red", "rose", "sky", "tan", "teal", "white", "yellow"] },
    { item: "Longsleeve 2 VNeck", colors: ["black", "blue", "brown", "charcoal", "forest", "gray", "green", "lavender", "maroon", "navy", "orange", "purple", "red", "rose", "sky", "tan", "teal", "white", "yellow"] },
    { item: "Longsleeve Polo", colors: ["black", "blue", "brown", "charcoal", "forest", "gray", "green", "lavender", "maroon", "navy", "orange", "purple", "red", "rose", "sky", "tan", "teal", "white", "yellow"] },
    { item: "Original Sleeveless", colors: ["black", "blue", "brown", "charcoal", "forest", "gray", "green", "lavender", "maroon", "navy", "orange", "purple", "red", "rose", "sky", "tan", "teal", "white", "yellow"] },
    { item: "Scoop", colors: ["black", "blue", "brown", "charcoal", "forest", "gray", "green", "lavender", "maroon", "navy", "orange", "purple", "red", "rose", "sky", "tan", "teal", "white", "yellow"] },
    { item: "Shortsleeve", colors: ["black", "blue", "brown", "charcoal", "forest", "gray", "green", "lavender", "maroon", "navy", "orange", "purple", "red", "rose", "sky", "tan", "teal", "white", "yellow"] },
    { item: "Shortsleeve Cardigan", colors: ["black", "blue", "brown", "charcoal", "forest", "gray", "green", "lavender", "maroon", "navy", "orange", "purple", "red", "rose", "sky", "tan", "teal", "white", "yellow"] },
    { item: "Shortsleeve Polo", colors: ["black", "blue", "brown", "charcoal", "forest", "gray", "green", "lavender", "maroon", "navy", "orange", "purple", "red", "rose", "sky", "tan", "teal", "white", "yellow"] },
    { item: "Sleeveless", colors: ["black", "blue", "brown", "charcoal", "forest", "gray", "green", "lavender", "maroon", "navy", "orange", "purple", "red", "rose", "sky", "tan", "teal", "white", "yellow"] },
    { item: "Sleeveless 2", colors: ["black", "blue", "brown", "charcoal", "forest", "gray", "green", "lavender", "maroon", "navy", "orange", "purple", "red", "rose", "sky", "tan", "teal", "white", "yellow"] },
    { item: "Sleeveless 2 Buttoned", colors: ["black", "blue", "brown", "charcoal", "forest", "gray", "green", "lavender", "maroon", "navy", "orange", "purple", "red", "rose", "sky", "tan", "teal", "white", "yellow"] },
    { item: "Sleeveless 2 Cardigan", colors: ["black", "blue", "brown", "charcoal", "forest", "gray", "green", "lavender", "maroon", "navy", "orange", "purple", "red", "rose", "sky", "tan", "teal", "white", "yellow"] },
    { item: "Sleeveless 2 Polo", colors: ["black", "blue", "brown", "charcoal", "forest", "gray", "green", "lavender", "maroon", "navy", "orange", "purple", "red", "rose", "sky", "tan", "teal", "white", "yellow"] },
    { item: "Sleeveless 2 Scoop", colors: ["black", "blue", "brown", "charcoal", "forest", "gray", "green", "lavender", "maroon", "navy", "orange", "purple", "red", "rose", "sky", "tan", "teal", "white", "yellow"] },
    { item: "Sleeveless 2 VNeck", colors: ["black", "blue", "brown", "charcoal", "forest", "gray", "green", "lavender", "maroon", "navy", "orange", "purple", "red", "rose", "sky", "tan", "teal", "white", "yellow"] },
    { item: "TShirt", colors: ["black", "blue", "brown", "charcoal", "forest", "gray", "green", "lavender", "maroon", "navy", "orange", "purple", "red", "rose", "sky", "tan", "teal", "white", "yellow"] },
    { item: "TShirt Buttoned", colors: ["black", "blue", "brown", "charcoal", "forest", "gray", "green", "lavender", "maroon", "navy", "orange", "purple", "red", "rose", "sky", "tan", "teal", "white", "yellow"] },
    { item: "TShirt Scoop", colors: ["black", "blue", "brown", "charcoal", "forest", "gray", "green", "lavender", "maroon", "navy", "orange", "purple", "red", "rose", "sky", "tan", "teal", "white", "yellow"] },
    { item: "TShirt VNeck", colors: ["black", "blue", "brown", "charcoal", "forest", "gray", "green", "lavender", "maroon", "navy", "orange", "purple", "red", "rose", "sky", "tan", "teal", "white", "yellow"] },
  ],
  hair: [
    { item: "Bangs bun", colors: ["black", "blonde", "brown", "chestnut", "dark_brown", "ginger", "gray", "light_brown", "platinum", "raven", "red", "sandy", "strawberry", "violet", "white"] },
    { item: "Bob", colors: ["black", "blonde", "brown", "chestnut", "dark_brown", "ginger", "gray", "light_brown", "platinum", "raven", "red", "sandy", "strawberry", "violet", "white"] },
    { item: "Bob side part", colors: ["black", "blonde", "brown", "chestnut", "dark_brown", "ginger", "gray", "light_brown", "platinum", "raven", "red", "sandy", "strawberry", "violet", "white"] },
    { item: "Braid", colors: ["black", "blonde", "brown", "chestnut", "dark_brown", "ginger", "gray", "light_brown", "platinum", "raven", "red", "sandy", "strawberry", "violet", "white"] },
    { item: "Buzzcut", colors: ["black", "blonde", "brown", "chestnut", "dark_brown", "ginger", "gray", "light_brown", "platinum", "raven", "red", "sandy", "strawberry", "violet", "white"] },
    { item: "Cornrows", colors: ["black", "blonde", "brown", "chestnut", "dark_brown", "ginger", "gray", "light_brown", "platinum", "raven", "red", "sandy", "strawberry", "violet", "white"] },
    { item: "Cowlick", colors: ["black", "blonde", "brown", "chestnut", "dark_brown", "ginger", "gray", "light_brown", "platinum", "raven", "red", "sandy", "strawberry", "violet", "white"] },
    { item: "Curly long", colors: ["black", "blonde", "brown", "chestnut", "dark_brown", "ginger", "gray", "light_brown", "platinum", "raven", "red", "sandy", "strawberry", "violet", "white"] },
    { item: "Curly short", colors: ["black", "blonde", "brown", "chestnut", "dark_brown", "ginger", "gray", "light_brown", "platinum", "raven", "red", "sandy", "strawberry", "violet", "white"] },
    { item: "Curly short 2", colors: ["black", "blonde", "brown", "chestnut", "dark_brown", "ginger", "gray", "light_brown", "platinum", "raven", "red", "sandy", "strawberry", "violet", "white"] },
    { item: "Curtains", colors: ["black", "blonde", "brown", "chestnut", "dark_brown", "ginger", "gray", "light_brown", "platinum", "raven", "red", "sandy", "strawberry", "violet", "white"] },
    { item: "Curtains long", colors: ["black", "blonde", "brown", "chestnut", "dark_brown", "ginger", "gray", "light_brown", "platinum", "raven", "red", "sandy", "strawberry", "violet", "white"] },
    { item: "Dreadlocks long", colors: ["black", "blonde", "brown", "chestnut", "dark_brown", "ginger", "gray", "light_brown", "platinum", "raven", "red", "sandy", "strawberry", "violet", "white"] },
    { item: "Dreadlocks short", colors: ["black", "blonde", "brown", "chestnut", "dark_brown", "ginger", "gray", "light_brown", "platinum", "raven", "red", "sandy", "strawberry", "violet", "white"] },
    { item: "Flat top fade", colors: ["black", "blonde", "brown", "chestnut", "dark_brown", "ginger", "gray", "light_brown", "platinum", "raven", "red", "sandy", "strawberry", "violet", "white"] },
    { item: "Flat top straight", colors: ["black", "blonde", "brown", "chestnut", "dark_brown", "ginger", "gray", "light_brown", "platinum", "raven", "red", "sandy", "strawberry", "violet", "white"] },
    { item: "Half up", colors: ["black", "blonde", "brown", "chestnut", "dark_brown", "ginger", "gray", "light_brown", "platinum", "raven", "red", "sandy", "strawberry", "violet", "white"] },
    { item: "Halfmessy", colors: ["black", "blonde", "brown", "chestnut", "dark_brown", "ginger", "gray", "light_brown", "platinum", "raven", "red", "sandy", "strawberry", "violet", "white"] },
    { item: "High ponytail", colors: ["black", "blonde", "brown", "chestnut", "dark_brown", "ginger", "gray", "light_brown", "platinum", "raven", "red", "sandy", "strawberry", "violet", "white"] },
    { item: "Idol", colors: ["black", "blonde", "brown", "chestnut", "dark_brown", "ginger", "gray", "light_brown", "platinum", "raven", "red", "sandy", "strawberry", "violet", "white"] },
    { item: "Large Curls", colors: ["black", "blonde", "brown", "chestnut", "dark_brown", "ginger", "gray", "light_brown", "platinum", "raven", "red", "sandy", "strawberry", "violet", "white"] },
    { item: "Large Curls XLong", colors: ["black", "blonde", "brown", "chestnut", "dark_brown", "ginger", "gray", "light_brown", "platinum", "raven", "red", "sandy", "strawberry", "violet", "white"] },
    { item: "Lob", colors: ["black", "blonde", "brown", "chestnut", "dark_brown", "ginger", "gray", "light_brown", "platinum", "raven", "red", "sandy", "strawberry", "violet", "white"] },
    { item: "Long Topknot", colors: ["black", "blonde", "brown", "chestnut", "dark_brown", "ginger", "gray", "light_brown", "platinum", "raven", "red", "sandy", "strawberry", "violet", "white"] },
    { item: "Long Topknot 2", colors: ["black", "blonde", "brown", "chestnut", "dark_brown", "ginger", "gray", "light_brown", "platinum", "raven", "red", "sandy", "strawberry", "violet", "white"] },
    { item: "Long center part", colors: ["black", "blonde", "brown", "chestnut", "dark_brown", "ginger", "gray", "light_brown", "platinum", "raven", "red", "sandy", "strawberry", "violet", "white"] },
    { item: "Long messy", colors: ["black", "blonde", "brown", "chestnut", "dark_brown", "ginger", "gray", "light_brown", "platinum", "raven", "red", "sandy", "strawberry", "violet", "white"] },
    { item: "Long straight", colors: ["black", "blonde", "brown", "chestnut", "dark_brown", "ginger", "gray", "light_brown", "platinum", "raven", "red", "sandy", "strawberry", "violet", "white"] },
    { item: "Long tied", colors: ["black", "blonde", "brown", "chestnut", "dark_brown", "ginger", "gray", "light_brown", "platinum", "raven", "red", "sandy", "strawberry", "violet", "white"] },
    { item: "Natural", colors: ["black", "blonde", "brown", "chestnut", "dark_brown", "ginger", "gray", "light_brown", "platinum", "raven", "red", "sandy", "strawberry", "violet", "white"] },
    { item: "Page", colors: ["black", "blonde", "brown", "chestnut", "dark_brown", "ginger", "gray", "light_brown", "platinum", "raven", "red", "sandy", "strawberry", "violet", "white"] },
    { item: "Page2", colors: ["black", "blonde", "brown", "chestnut", "dark_brown", "ginger", "gray", "light_brown", "platinum", "raven", "red", "sandy", "strawberry", "violet", "white"] },
    { item: "Parted 3", colors: ["black", "blonde", "brown", "chestnut", "dark_brown", "ginger", "gray", "light_brown", "platinum", "raven", "red", "sandy", "strawberry", "violet", "white"] },
    { item: "Plain", colors: ["black", "blonde", "brown", "chestnut", "dark_brown", "ginger", "gray", "light_brown", "platinum", "raven", "red", "sandy", "strawberry", "violet", "white"] },
    { item: "Ponytail2", colors: ["black", "blonde", "brown", "chestnut", "dark_brown", "ginger", "gray", "light_brown", "platinum", "raven", "red", "sandy", "strawberry", "violet", "white"] },
    { item: "Princess", colors: ["black", "blonde", "brown", "chestnut", "dark_brown", "ginger", "gray", "light_brown", "platinum", "raven", "red", "sandy", "strawberry", "violet", "white"] },
    { item: "Relm Short", colors: ["black", "blonde", "brown", "chestnut", "dark_brown", "ginger", "gray", "light_brown", "platinum", "raven", "red", "sandy", "strawberry", "violet", "white"] },
    { item: "Relm XLong", colors: ["black", "blonde", "brown", "chestnut", "dark_brown", "ginger", "gray", "light_brown", "platinum", "raven", "red", "sandy", "strawberry", "violet", "white"] },
    { item: "Short Topknot", colors: ["black", "blonde", "brown", "chestnut", "dark_brown", "ginger", "gray", "light_brown", "platinum", "raven", "red", "sandy", "strawberry", "violet", "white"] },
    { item: "Short Topknot 2", colors: ["black", "blonde", "brown", "chestnut", "dark_brown", "ginger", "gray", "light_brown", "platinum", "raven", "red", "sandy", "strawberry", "violet", "white"] },
    { item: "Side Parted w/Bangs", colors: ["black", "blonde", "brown", "chestnut", "dark_brown", "ginger", "gray", "light_brown", "platinum", "raven", "red", "sandy", "strawberry", "violet", "white"] },
    { item: "Side Parted w/Bangs 2", colors: ["black", "blonde", "brown", "chestnut", "dark_brown", "ginger", "gray", "light_brown", "platinum", "raven", "red", "sandy", "strawberry", "violet", "white"] },
    { item: "Side Swoop", colors: ["black", "blonde", "brown", "chestnut", "dark_brown", "ginger", "gray", "light_brown", "platinum", "raven", "red", "sandy", "strawberry", "violet", "white"] },
    { item: "Single", colors: ["black", "blonde", "brown", "chestnut", "dark_brown", "ginger", "gray", "light_brown", "platinum", "raven", "red", "sandy", "strawberry", "violet", "white"] },
    { item: "Spiked", colors: ["black", "blonde", "brown", "chestnut", "dark_brown", "ginger", "gray", "light_brown", "platinum", "raven", "red", "sandy", "strawberry", "violet", "white"] },
    { item: "Spiked liberty2", colors: ["black", "blonde", "brown", "chestnut", "dark_brown", "ginger", "gray", "light_brown", "platinum", "raven", "red", "sandy", "strawberry", "violet", "white"] },
    { item: "Twists fade", colors: ["black", "blonde", "brown", "chestnut", "dark_brown", "ginger", "gray", "light_brown", "platinum", "raven", "red", "sandy", "strawberry", "violet", "white"] },
    { item: "Twists straight", colors: ["black", "blonde", "brown", "chestnut", "dark_brown", "ginger", "gray", "light_brown", "platinum", "raven", "red", "sandy", "strawberry", "violet", "white"] },
    { item: "Wavy", colors: ["black", "blonde", "brown", "chestnut", "dark_brown", "ginger", "gray", "light_brown", "platinum", "raven", "red", "sandy", "strawberry", "violet", "white"] },
    { item: "XLong Wavy", colors: ["black", "blonde", "brown", "chestnut", "dark_brown", "ginger", "gray", "light_brown", "platinum", "raven", "red", "sandy", "strawberry", "violet", "white"] },
    { item: "Xlong", colors: ["black", "blonde", "brown", "chestnut", "dark_brown", "ginger", "gray", "light_brown", "platinum", "raven", "red", "sandy", "strawberry", "violet", "white"] },
  ],
  hat: [
    { item: "Armet", colors: ["brass", "bronze", "copper", "gold", "iron", "silver", "steel"] },
    { item: "Barbarian", colors: ["brass", "bronze", "copper", "gold", "iron", "silver", "steel"] },
    { item: "Barbarian Viking", colors: ["brass", "bronze", "copper", "gold", "iron", "silver", "steel"] },
    { item: "Barbarian nasal", colors: ["brass", "bronze", "copper", "gold", "iron", "silver", "steel"] },
    { item: "Barbuta", colors: ["brass", "bronze", "copper", "gold", "iron", "silver", "steel"] },
    { item: "Bascinet", colors: ["brass", "bronze", "copper", "gold", "iron", "silver", "steel"] },
    { item: "Bicorne Athwart", colors: ["black", "blue", "brown", "charcoal", "forest", "gray", "green", "lavender", "maroon", "navy", "orange", "purple", "red", "rose", "sky", "tan", "teal", "white", "yellow"] },
    { item: "Bicorne Athwart Admiral", colors: ["black", "blue", "brown", "charcoal", "forest", "gray", "green", "lavender", "maroon", "navy", "orange", "purple", "red", "rose", "sky", "tan", "teal", "white", "yellow"] },
    { item: "Bicorne Athwart Captain", colors: ["black", "blue", "brown", "charcoal", "forest", "gray", "green", "lavender", "maroon", "navy", "orange", "purple", "red", "rose", "sky", "tan", "teal", "white", "yellow"] },
    { item: "Bicorne Athwart Commodore", colors: ["black", "blue", "brown", "charcoal", "forest", "gray", "green", "lavender", "maroon", "navy", "orange", "purple", "red", "rose", "sky", "tan", "teal", "white", "yellow"] },
    { item: "Bicorne Foreaft Commodore", colors: ["black", "blue", "brown", "charcoal", "forest", "gray", "green", "lavender", "maroon", "navy", "orange", "purple", "red", "rose", "sky", "tan", "teal", "white", "yellow"] },
    { item: "Bicorne foreaft", colors: ["black", "blue", "brown", "charcoal", "forest", "gray", "green", "lavender", "maroon", "navy", "orange", "purple", "red", "rose", "sky", "tan", "teal", "white", "yellow"] },
    { item: "Bonnie", colors: ["black", "blue", "brown", "charcoal", "forest", "gray", "green", "lavender", "maroon", "navy", "orange", "purple", "red", "rose", "sky", "tan", "teal", "white", "yellow"] },
    { item: "Bonnie Alt Tilt", colors: ["black", "blue", "brown", "charcoal", "forest", "gray", "green", "lavender", "maroon", "navy", "orange", "purple", "red", "rose", "sky", "tan", "teal", "white", "yellow"] },
    { item: "Cavalier", colors: ["black", "blue", "brown", "charcoal", "forest", "gray", "green", "lavender", "maroon", "navy", "orange", "purple", "red", "rose", "sky", "tan", "teal", "white", "yellow"] },
    { item: "Celestial Wizard Hat", colors: ["black", "blue", "brown", "charcoal", "forest", "gray", "green", "lavender", "maroon", "navy", "orange", "purple", "red", "rose", "sky", "tan", "teal", "white", "yellow"] },
    { item: "Celestial Wizard Moon Hat", colors: ["black", "blue", "brown", "charcoal", "forest", "gray", "green", "lavender", "maroon", "navy", "orange", "purple", "red", "rose", "sky", "tan", "teal", "white", "yellow"] },
    { item: "Close helm", colors: ["brass", "bronze", "copper", "gold", "iron", "silver", "steel"] },
    { item: "Greathelm", colors: ["brass", "bronze", "copper", "gold", "iron", "silver", "steel"] },
    { item: "Hood", colors: ["black", "blue", "brown", "charcoal", "forest", "gray", "green", "lavender", "maroon", "navy", "orange", "purple", "red", "rose", "sky", "tan", "teal", "white", "yellow"] },
    { item: "Kettle helm", colors: ["brass", "bronze", "copper", "gold", "iron", "silver", "steel"] },
    { item: "Leather Cap", colors: ["black", "blue", "brown", "charcoal", "forest", "gray", "green", "lavender", "maroon", "navy", "orange", "purple", "red", "rose", "sky", "tan", "teal", "white", "yellow"] },
    { item: "Legion", colors: ["brass", "bronze", "copper", "gold", "iron", "silver", "steel"] },
    { item: "Maximus", colors: ["brass", "bronze", "copper", "gold", "iron", "silver", "steel"] },
    { item: "Morion", colors: ["brass", "bronze", "copper", "gold", "iron", "silver", "steel"] },
    { item: "Nasal helm", colors: ["brass", "bronze", "copper", "gold", "iron", "silver", "steel"] },
    { item: "Norman helm", colors: ["brass", "bronze", "copper", "gold", "iron", "silver", "steel"] },
    { item: "Pointed helm", colors: ["brass", "bronze", "copper", "gold", "iron", "silver", "steel"] },
    { item: "Round bascinet", colors: ["brass", "bronze", "copper", "gold", "iron", "silver", "steel"] },
    { item: "Simple Armet", colors: ["brass", "bronze", "copper", "gold", "iron", "silver", "steel"] },
    { item: "Simple barbuta", colors: ["brass", "bronze", "copper", "gold", "iron", "silver", "steel"] },
    { item: "Simple sugarloaf helm", colors: ["brass", "bronze", "copper", "gold", "iron", "silver", "steel"] },
    { item: "Spangenhelm", colors: ["brass", "bronze", "copper", "gold", "iron", "silver", "steel"] },
    { item: "Sugarloaf greathelm", colors: ["brass", "bronze", "copper", "gold", "iron", "silver", "steel"] },
    { item: "Tricorne", colors: ["black", "blue", "brown", "charcoal", "forest", "gray", "green", "lavender", "maroon", "navy", "orange", "purple", "red", "rose", "sky", "tan", "teal", "white", "yellow"] },
    { item: "Tricorne Captain", colors: ["black", "blue", "brown", "charcoal", "forest", "gray", "green", "lavender", "maroon", "navy", "orange", "purple", "red", "rose", "sky", "tan", "teal", "white", "yellow"] },
    { item: "Tricorne Lieutenant", colors: ["black", "blue", "brown", "charcoal", "forest", "gray", "green", "lavender", "maroon", "navy", "orange", "purple", "red", "rose", "sky", "tan", "teal", "white", "yellow"] },
    { item: "Viking spangenhelm", colors: ["brass", "bronze", "copper", "gold", "iron", "silver", "steel"] },
  ],
  jacket: [
    { item: "Tabard", colors: ["black", "blue", "forest", "gray", "green", "lavender", "maroon", "navy", "orange", "purple", "red", "sky", "tan", "teal", "white", "yellow"] },
  ],
  legs: [
    { item: "Armour", colors: ["brass", "bronze", "copper", "gold", "iron", "silver", "steel"] },
    { item: "Cuffed Pants", colors: ["black", "blue", "brown", "charcoal", "forest", "gray", "green", "lavender", "maroon", "navy", "orange", "purple", "red", "rose", "sky", "tan", "teal", "white", "yellow"] },
    { item: "Formal Pants", colors: ["black", "blue", "brown", "charcoal", "forest", "gray", "green", "lavender", "maroon", "navy", "orange", "purple", "red", "rose", "sky", "tan", "teal", "white", "yellow"] },
    { item: "Hose", colors: ["black", "blue", "brown", "charcoal", "forest", "gray", "green", "lavender", "maroon", "navy", "orange", "purple", "red", "rose", "sky", "tan", "teal", "white", "yellow"] },
    { item: "Leggings", colors: ["black", "blue", "brown", "charcoal", "forest", "gray", "green", "lavender", "maroon", "navy", "orange", "purple", "red", "rose", "sky", "tan", "teal", "white", "yellow"] },
    { item: "Leggings 2", colors: ["black", "blue", "brown", "charcoal", "forest", "gray", "green", "lavender", "maroon", "navy", "orange", "purple", "red", "rose", "sky", "tan", "teal", "white", "yellow"] },
    { item: "Legion skirt", colors: ["black", "blue", "brown", "charcoal", "forest", "gray", "green", "lavender", "maroon", "navy", "orange", "purple", "red", "rose", "sky", "tan", "teal", "white", "yellow"] },
    { item: "Long Pants", colors: ["black", "blue", "brown", "charcoal", "forest", "gray", "green", "lavender", "maroon", "navy", "orange", "purple", "red", "rose", "sky", "tan", "teal", "white", "yellow"] },
    { item: "Pantaloons", colors: ["black", "blue", "brown", "charcoal", "forest", "gray", "green", "lavender", "maroon", "navy", "orange", "purple", "red", "rose", "sky", "tan", "teal", "white", "yellow"] },
    { item: "Pants", colors: ["black", "blue", "brown", "charcoal", "forest", "gray", "green", "lavender", "maroon", "navy", "orange", "purple", "red", "rose", "sky", "tan", "teal", "white", "yellow"] },
    { item: "Plain skirt", colors: ["black", "blue", "brown", "charcoal", "forest", "gray", "green", "lavender", "maroon", "navy", "orange", "purple", "red", "rose", "sky", "tan", "teal", "white", "yellow"] },
    { item: "Short Shorts", colors: ["black", "blue", "brown", "charcoal", "forest", "gray", "green", "lavender", "maroon", "navy", "orange", "purple", "red", "rose", "sky", "tan", "teal", "white", "yellow"] },
    { item: "Shorts", colors: ["black", "blue", "brown", "charcoal", "forest", "gray", "green", "lavender", "maroon", "navy", "orange", "purple", "red", "rose", "sky", "tan", "teal", "white", "yellow"] },
    { item: "Slit skirt", colors: ["black", "blue", "brown", "charcoal", "forest", "gray", "green", "lavender", "maroon", "navy", "orange", "purple", "red", "rose", "sky", "tan", "teal", "white", "yellow"] },
    { item: "Striped Formal Pants", colors: ["black", "blue", "brown", "charcoal", "forest", "gray", "green", "lavender", "maroon", "navy", "orange", "purple", "red", "rose", "sky", "tan", "teal", "white", "yellow"] },
  ],
  neck: [
    { item: "Bowtie 2", colors: ["black", "blue", "brown", "charcoal", "forest", "gray", "green", "lavender", "maroon", "navy", "orange", "purple", "red", "rose", "sky", "tan", "teal", "white", "yellow"] },
    { item: "Cape Clip", colors: ["black", "blue", "brown", "charcoal", "forest", "gray", "green", "lavender", "maroon", "navy", "orange", "purple", "red", "rose", "sky", "tan", "teal", "white", "yellow"] },
    { item: "Cape Tie", colors: ["black", "blue", "brown", "charcoal", "forest", "gray", "green", "lavender", "maroon", "navy", "orange", "purple", "red", "rose", "sky", "tan", "teal", "white", "yellow"] },
    { item: "Cravat", colors: ["black", "blue", "brown", "charcoal", "forest", "gray", "green", "lavender", "maroon", "navy", "orange", "purple", "red", "rose", "sky", "tan", "teal", "white", "yellow"] },
    { item: "Jabot", colors: ["black", "blue", "brown", "charcoal", "forest", "gray", "green", "lavender", "maroon", "navy", "orange", "purple", "red", "rose", "sky", "tan", "teal", "white", "yellow"] },
  ],
  quiver: [
    { item: "Quiver", colors: ["quiver"] },
  ],
  sash: [
    { item: "Narrow sash", colors: ["black", "blue", "brown", "charcoal", "forest", "gray", "green", "lavender", "maroon", "navy", "orange", "purple", "red", "rose", "sky", "tan", "teal", "white", "yellow"] },
    { item: "Obi", colors: ["black", "blue", "brown", "charcoal", "forest", "gray", "green", "lavender", "maroon", "navy", "orange", "purple", "red", "rose", "sky", "tan", "teal", "white", "yellow"] },
    { item: "Sash", colors: ["black", "blue", "brown", "charcoal", "forest", "gray", "green", "lavender", "maroon", "navy", "orange", "purple", "red", "rose", "sky", "tan", "teal", "white", "yellow"] },
  ],
  shield: [
    { item: "Crusader shield", colors: ["crusader"] },
    { item: "Heater Shield Base", colors: ["brown", "oak", "maple", "mahogany", "walnut", "tan", "coffee", "umber"] },
    { item: "Plus shield", colors: ["plus"] },
    { item: "Revised Heater Shield Base", colors: ["brown", "oak", "maple", "mahogany", "walnut", "tan", "coffee", "umber"] },
    { item: "Round Shield", colors: ["gold", "silver"] },
    { item: "Scutum shield", colors: ["scutum"] },
    { item: "Spartan Shield", colors: ["spartan"] },
    { item: "Two engrailed shield", colors: ["two_engrailed"] },
  ],
  shoes: [
    { item: "Armour", colors: ["brass", "bronze", "copper", "gold", "iron", "silver", "steel"] },
    { item: "Basic Boots", colors: ["black", "blue", "brown", "charcoal", "forest", "gray", "green", "lavender", "maroon", "navy", "orange", "purple", "red", "rose", "sky", "tan", "teal", "white", "yellow"] },
    { item: "Basic Shoes", colors: ["black", "blue", "brown", "charcoal", "forest", "gray", "green", "lavender", "maroon", "navy", "orange", "purple", "red", "rose", "sky", "tan", "teal", "white", "yellow"] },
    { item: "Folded Rim Boots", colors: ["black", "blue", "brown", "charcoal", "forest", "gray", "green", "lavender", "maroon", "navy", "orange", "purple", "red", "rose", "sky", "tan", "teal", "white", "yellow"] },
    { item: "Revised Boots", colors: ["black", "blue", "brown", "charcoal", "forest", "gray", "green", "lavender", "maroon", "navy", "orange", "purple", "red", "rose", "sky", "tan", "teal", "white", "yellow"] },
    { item: "Revised Shoes", colors: ["black", "blue", "brown", "charcoal", "forest", "gray", "green", "lavender", "maroon", "navy", "orange", "purple", "red", "rose", "sky", "tan", "teal", "white", "yellow"] },
    { item: "Rimmed Boots", colors: ["black", "blue", "brown", "charcoal", "forest", "gray", "green", "lavender", "maroon", "navy", "orange", "purple", "red", "rose", "sky", "tan", "teal", "white", "yellow"] },
    { item: "Sandals", colors: ["black", "blue", "brown", "charcoal", "forest", "gray", "green", "lavender", "maroon", "navy", "orange", "purple", "red", "rose", "sky", "tan", "teal", "white", "yellow"] },
    { item: "Sara Shoes", colors: ["black", "blue", "brown", "charcoal", "forest", "gray", "green", "lavender", "maroon", "navy", "orange", "purple", "red", "rose", "sky", "tan", "teal", "white", "yellow"] },
  ],
  shoulders: [
    { item: "Epaulets", colors: ["black", "blue", "brown", "charcoal", "forest", "gray", "green", "lavender", "maroon", "navy", "orange", "purple", "red", "rose", "sky", "tan", "teal", "white", "yellow"] },
    { item: "Legion", colors: ["brass", "bronze", "copper", "gold", "iron", "silver", "steel"] },
    { item: "Mantal", colors: ["black", "blue", "brown", "charcoal", "forest", "gray", "green", "lavender", "maroon", "navy", "orange", "purple", "red", "rose", "sky", "tan", "teal", "white", "yellow"] },
    { item: "Pauldrons", colors: ["black", "blue", "brown", "charcoal", "forest", "gray", "green", "lavender", "maroon", "navy", "orange", "purple", "red", "rose", "sky", "tan", "teal", "white", "yellow"] },
  ],
  socks: [
    { item: "Ankle Socks", colors: ["black", "blue", "brown", "charcoal", "forest", "gray", "green", "lavender", "maroon", "navy", "orange", "purple", "red", "rose", "sky", "tan", "teal", "white", "yellow"] },
    { item: "High Socks", colors: ["black", "blue", "brown", "charcoal", "forest", "gray", "green", "lavender", "maroon", "navy", "orange", "purple", "red", "rose", "sky", "tan", "teal", "white", "yellow"] },
    { item: "Tabi Socks", colors: ["black", "blue", "brown", "charcoal", "forest", "gray", "green", "lavender", "maroon", "navy", "orange", "purple", "red", "rose", "sky", "tan", "teal", "white", "yellow"] },
  ],
  weapon: [
    { item: "Arming Sword", colors: ["brass", "bronze", "copper", "gold", "iron", "silver", "steel"] },
    { item: "Axe", colors: ["brass", "bronze", "copper", "gold", "iron", "silver", "steel"] },
    { item: "Club", colors: ["club"] },
    { item: "Crossbow", colors: ["crossbow"] },
    { item: "Dagger", colors: ["dagger"] },
    { item: "Diamond staff", colors: ["brass", "bronze", "copper", "gold", "iron", "silver", "steel"] },
    { item: "Glowsword", colors: ["blue", "red"] },
    { item: "Gnarled staff", colors: ["brass", "bronze", "copper", "gold", "iron", "silver", "steel"] },
    { item: "Hammer", colors: ["brass", "bronze", "copper", "gold", "iron", "silver", "steel"] },
    { item: "Katana", colors: ["katana"] },
    { item: "Longsword", colors: ["longsword"] },
    { item: "Longsword alt", colors: ["longsword_alt"] },
    { item: "Loop staff", colors: ["brass", "bronze", "copper", "gold", "iron", "silver", "steel"] },
    { item: "Mace", colors: ["mace"] },
    { item: "Normal", colors: ["brass", "bronze", "copper", "gold", "iron", "silver", "steel"] },
    { item: "Pickaxe", colors: ["brass", "bronze", "copper", "gold", "iron", "silver", "steel"] },
    { item: "Rapier", colors: ["rapier"] },
    { item: "S staff", colors: ["brass", "bronze", "copper", "gold", "iron", "silver", "steel"] },
    { item: "Scimitar", colors: ["scimitar"] },
    { item: "Simple staff", colors: ["simple"] },
  ],
};

/** 把预设参数写入 state（复用上游 hash 解析，含别名与兼容性处理）。 */
export function applyStyleParams(
  catalog: CatalogReader,
  state: State,
  params: Record<string, string>,
): void {
  loadSelectionsFromHash(catalog, state, createHashStringFromParams(params));
}

function pick<T>(arr: readonly T[]): T | undefined {
  if (!arr.length) return undefined;
  return arr[Math.floor(Math.random() * arr.length)];
}

function pickChoice(choices: readonly RandomChoice[]): string | undefined {
  const c = pick(choices);
  if (!c) return undefined;
  const color = pick(c.colors);
  const base = c.item.replaceAll(" ", "_");
  return color ? `${base}_${color}` : base;
}

/** 生成一套随机搭配（只从「许可纯净且男女通用」的候选池里取）。 */
export function randomOutfitParams(): Record<string, string> {
  const sex = Math.random() < 0.5 ? "male" : "female";
  const params: Record<string, string> = { sex };

  const skin = pick(BODY_COLORS);
  if (skin) params.body = `Body_Color_${skin}`;
  params.head = sex === "male" ? "Human_Male" : "Human_Female";

  const groups: Array<[string, number]> = [
    ["hair", 1],
    ["clothes", 1],
    ["armour", 0.28],
    ["legs", 1],
    ["shoes", 1],
    ["hat", 0.45],
    ["weapon", 0.55],
    ["cape", 0.3],
    ["neck", 0.25],
    ["belt", 0.2],
    ["sash", 0.15],
    ["shoulders", 0.25],
    ["apron", 0.12],
    ["shield", 0.18],
    ["socks", 0.2],
    ["quiver", 0.12],
  ];

  for (const [group, prob] of groups) {
    if (Math.random() > prob) continue;
    // 盔甲与上衣互斥：穿盔甲时不再叠上衣（观感与层级都更合理）
    if (group === "armour" && params.clothes) delete params.clothes;
    const v = pickChoice(RANDOM_POOL[group] ?? []);
    if (v) params[group] = v;
  }
  if (!params.clothes && !params.armour) {
    const v = pickChoice(RANDOM_POOL.clothes ?? []);
    if (v) params.clothes = v;
  }
  return params;
}
