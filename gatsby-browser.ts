// 글자가 쓰인 유니코드 구간의 woff2만 내려받는 dynamic subset이다. 한글 전체(수 MB)를 한 번에 받지 않는다.
import "pretendard/dist/web/variable/pretendardvariable-dynamic-subset.css"
import "./src/styles/theme.css"
import "./src/styles/global.css"
import "katex/dist/katex.min.css"
import { applyTheme, getStoredTheme } from "./src/utils/theme"
import { setupCodeCopyButtons } from "./src/utils/code-copy"

export const onClientEntry = () => {
  applyTheme(getStoredTheme())
  setupCodeCopyButtons()
}
