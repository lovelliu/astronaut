import rss, { pagesGlobToRssItems } from '@astrojs/rss'

const postImportResult = pagesGlobToRssItems(import.meta.glob('./posts/*.md', { eager: true }))
const posts = Object.values(postImportResult)

export const get = () => rss({
  title: 'Lovell Liu',
  description: 'Lovell Liu‘s blog',
  site: import.meta.env.SITE,
  items: posts.map((post: any) => ({
    link: post.url,
    title: post.frontmatter.title,
    pubDate: post.frontmatter.date,
  })),
  customData: '<language>zh-cn</language>',
  stylesheet: '/styles.xsl',
})
