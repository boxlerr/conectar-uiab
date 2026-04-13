# SEO Audit Framework

Run this audit on any page or the entire site to identify SEO issues.

## 1. Technical SEO (CRITICAL)
- [ ] All pages return 200 status (no broken links, no redirect chains)
- [ ] XML sitemap exists and is submitted to Search Console
- [ ] robots.txt is properly configured (not blocking important pages)
- [ ] Site loads over HTTPS with valid certificate
- [ ] Canonical URLs set on all pages (`<link rel="canonical">`)
- [ ] No duplicate content issues (www vs non-www, trailing slashes)

## 2. Page Speed (CRITICAL)
- [ ] Core Web Vitals pass: LCP < 2.5s, FID < 100ms, CLS < 0.1
- [ ] Images optimized: WebP format, responsive srcset, lazy loading
- [ ] CSS/JS minified and compressed (gzip/brotli)
- [ ] Fonts: preload critical fonts, use `font-display: swap`
- [ ] No render-blocking resources in critical path

## 3. On-Page SEO (HIGH)
- [ ] Unique `<title>` per page (50-60 chars, keyword near start)
- [ ] Unique `<meta description>` per page (150-160 chars, compelling)
- [ ] One `<h1>` per page containing primary keyword
- [ ] Heading hierarchy: h1 > h2 > h3 (no skipping levels)
- [ ] Internal linking: descriptive anchor text, no "click here"
- [ ] Images: descriptive alt text, relevant filenames

## 4. Structured Data
- [ ] Organization schema on homepage
- [ ] BreadcrumbList on category/detail pages
- [ ] LocalBusiness schema if applicable
- [ ] FAQ schema for FAQ sections
- Test with Google Rich Results Test

## 5. Content Quality
- [ ] Content provides unique value (not thin/duplicate)
- [ ] Natural language — avoid AI writing tells:
  - No overuse of: "delve", "leverage", "foster", "crucial", "Moreover"
  - Avoid em dash (—) overuse
  - Vary sentence structure and length
  - Use specific examples over generic statements
- [ ] Content answers user intent for target keywords
- [ ] Regular content updates (freshness signal)

## 6. Mobile & Accessibility
- [ ] Mobile-responsive design (passes Google Mobile-Friendly Test)
- [ ] Touch targets ≥ 44x44px
- [ ] Font size ≥ 16px on mobile (no zoom needed)
- [ ] No horizontal scroll on mobile
- [ ] Proper viewport meta tag

## 7. Next.js Specific
- Use `generateMetadata()` for dynamic pages
- Use `metadata` export for static pages
- Set `openGraph` and `twitter` card metadata
- Use `next/image` for automatic optimization
- Implement `sitemap.ts` for dynamic sitemap generation
