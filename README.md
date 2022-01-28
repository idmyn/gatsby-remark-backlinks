# @idmyn/gatsby-remark-backlinks

## Installation

`npm install @idmyn/gatsby-remark-backlinks`

## Usage

You'll want to load this plugin after a remark wikilinks plugin like
`@idmyn/gatsby-remark-wiki-link`

``` javascript
// gatsby-config.js
module.exports = {
  plugins: [
    {
      resolve: 'gatsby-transformer-remark',
      options: {
        plugins: [{
          resolve: "@idmyn/gatsby-remark-wiki-link",
          options: {
            pageResolver: (name) => [name.replace(/ /g, '-').toLowerCase()],
            hrefTemplate: (permalink) => `/${permalink}`
          }
        }],
      }
    },
    {
      resolve: `@idmyn/gatsby-remark-backlinks`,
    },
  ],
};
```
