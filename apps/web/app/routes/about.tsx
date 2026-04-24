import type { MetaFunction, LoaderFunctionArgs } from "react-router";
import { useLoaderData } from "react-router";
import { sanityClient } from "@ddb/sanity/client";
import { pageBySlugQuery } from "@ddb/sanity/queries/page";
import type { PageDocument } from "@ddb/sanity/types";
import { BlockRenderer } from "~/components/BlockRenderer";

export const loader = async (_: LoaderFunctionArgs) => {
  const page = await sanityClient().fetch<PageDocument | null>(
    pageBySlugQuery,
    { slug: "about" }
  );
  return { page };
};

export const meta: MetaFunction<typeof loader> = ({ data }) => [
  { title: data?.page?.seo?.title ?? "About – Deur Den Bocht" },
  {
    name: "description",
    content: data?.page?.seo?.description,
  },
];

export default function About() {
  const { page } = useLoaderData<typeof loader>();

  if (!page?.blocks?.length) {
    return null;
  }

  return <BlockRenderer blocks={page.blocks} />;
}
