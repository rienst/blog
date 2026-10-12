module.exports = {
  siteMetadata: {
    title: 'Rien Stenekes',
  },
  pathPrefix: '/blog',
  trailingSlash: 'never',
  graphqlTypegen: true,
  plugins: [
    'gatsby-plugin-postcss',
    {
      resolve: 'gatsby-source-filesystem',
      options: {
        name: 'content',
        path: `${__dirname}/src/content`,
      },
    },
    {
      resolve: 'gatsby-transformer-remark',
      options: {
        plugins: ['gatsby-remark-prismjs'],
      },
    },
  ],
}
