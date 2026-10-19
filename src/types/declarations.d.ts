// PNG 이미지를 가져오면 Gatsby가 빌드한 파일의 URL을 반환한다.
declare module "*.png" {
  const url: string
  export default url
}

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
