import type { MetaFunction, LoaderFunctionArgs } from "react-router";
import { useLoaderData } from "react-router";
import { sanityClient } from "@ddb/sanity/client";
import { pageBySlugQuery } from "@ddb/sanity/queries/page";
import type { PageDocument } from "@ddb/sanity/types";
import { BlockRenderer } from "~/components/BlockRenderer";

export const loader = async (_: LoaderFunctionArgs) => {
  const page = await sanityClient().fetch<PageDocument | null>(
    pageBySlugQuery,
    { slug: "home" }
  );
  return { page };
};

export const meta: MetaFunction<typeof loader> = ({ data }) => [
  { title: data?.page?.seo?.title ?? "Deur Den Bocht – Motorcycle Rally" },
  {
    name: "description",
    content:
      data?.page?.seo?.description ??
      "The ultimate motorcycle rally experience.",
  },
];

export default function Home() {
  const { page } = useLoaderData<typeof loader>();

  if (!page?.blocks?.length) {
    return null;
  }

  return <BlockRenderer blocks={page.blocks} />;
}
