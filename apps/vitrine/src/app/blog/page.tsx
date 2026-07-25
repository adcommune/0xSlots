import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { clampDescription, getPosts } from "@/lib/blog";
import { title as siteTitle, siteUrl, studio } from "@/lib/site";

// Keep in step with REVALIDATE in lib/blog.ts.
export const revalidate = 60;

const description =
  "Writing on Harberger-taxed property, collective ownership and what gets built on 0xSlots.";

export const metadata: Metadata = {
  title: "Writing",
  description,
  alternates: { canonical: "/blog" },
  openGraph: {
    type: "website",
    siteName: siteTitle,
    url: "/blog",
    title: `Writing — ${siteTitle}`,
    description,
  },
  twitter: {
    card: "summary_large_image",
    title: `Writing — ${siteTitle}`,
    description,
  },
};

function formatDate(value: string | null | undefined): string | null {
  if (!value) return null;
  return new Date(value).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default async function BlogIndexPage() {
  const posts = await getPosts();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Blog",
    name: `${siteTitle} — Writing`,
    description,
    url: `${siteUrl}/blog`,
    publisher: { "@type": "Organization", name: siteTitle, url: siteUrl },
    blogPost: posts.map((post) => ({
      "@type": "BlogPosting",
      headline: post.title,
      url: `${siteUrl}/blog/${post.slug}`,
      datePublished: post.publishedAt ?? undefined,
      dateModified: post.updatedAt ?? undefined,
    })),
  };

  return (
    <>
      <SiteHeader />
      <script
        type="application/ld+json"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD injection
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
        }}
      />
      <main className="mx-auto max-w-6xl px-4 py-16 md:px-6 md:py-24">
        <p className="eyebrow">Writing</p>
        <h1 className="display mt-4 text-4xl md:text-6xl">
          Notes on property
          <br />
          you cannot hoard
        </h1>
        <p className="mt-6 max-w-xl leading-relaxed text-slate">
          {description} Published from{" "}
          <a
            href={studio.url}
            target="_blank"
            rel="noreferrer"
            className="text-ink underline decoration-rule underline-offset-2 transition-colors hover:text-claim"
          >
            {studio.name}
          </a>
          .
        </p>

        {posts.length === 0 ? (
          <p className="mt-16 border-2 border-dashed border-vacant p-8 text-center font-mono text-[11px] uppercase tracking-[0.16em] text-slate">
            No articles published yet
          </p>
        ) : (
          <ul className="mt-16 border-t-2 border-ink">
            {posts.map((post) => {
              const date = formatDate(post.publishedAt);
              return (
                <li key={post.id} className="border-b-2 border-ink">
                  <Link
                    href={`/blog/${post.slug}`}
                    className="group flex flex-col gap-3 py-7 transition-colors hover:bg-chalk md:flex-row md:items-baseline md:gap-10"
                  >
                    <div className="flex shrink-0 items-center gap-3 md:w-44">
                      {date && (
                        <time
                          dateTime={post.publishedAt ?? undefined}
                          className="font-mono text-[11px] uppercase tracking-[0.16em] text-slate"
                        >
                          {date}
                        </time>
                      )}
                      {post.featured && (
                        <span className="border border-claim px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.16em] text-claim">
                          Pinned
                        </span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <h2 className="display-tight text-xl transition-colors group-hover:text-claim md:text-2xl">
                        {post.title}
                      </h2>
                      {post.excerpt && (
                        <p className="mt-2 max-w-2xl leading-relaxed text-slate">
                          {clampDescription(post.excerpt, 180)}
                        </p>
                      )}
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </main>
      <SiteFooter />
    </>
  );
}
