// CSS Modules
declare module "*.module.css" {
  const styles: { readonly [key: string]: string }
  export = styles
}

// Plain CSS imports (side-effect only)
declare module "*.css" {
  const content: undefined
  export = content
}

// DeckDeckGo highlight code loader
declare module "@deckdeckgo/highlight-code/dist/loader" {
  export function defineCustomElements(win?: Window): Promise<void>
}
