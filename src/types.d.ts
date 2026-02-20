declare module "turndown-plugin-gfm" {
  import TurndownService from "turndown";

  export function gfm(service: TurndownService): void;
  export function tables(service: TurndownService): void;
  export function strikethrough(service: TurndownService): void;
  export function taskListItems(service: TurndownService): void;

  const plugin: {
    gfm: typeof gfm;
    tables: typeof tables;
    strikethrough: typeof strikethrough;
    taskListItems: typeof taskListItems;
  };

  export default plugin;
}

