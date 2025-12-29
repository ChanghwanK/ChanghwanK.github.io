/**
 * Implement Gatsby's Browser APIs in this file.
 *
 * See: https://www.gatsbyjs.com/docs/reference/config-files/gatsby-browser/
 */

const { defineCustomElements: deckDeckGoHighlightElement } = require("@deckdeckgo/highlight-code/dist/loader")

deckDeckGoHighlightElement()
