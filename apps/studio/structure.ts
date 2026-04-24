import type { StructureBuilder } from "sanity/structure";

export const structure = (S: StructureBuilder) =>
  S.list()
    .title("Content")
    .items([
      // Pages — page builder
      S.listItem()
        .title("Pages")
        .schemaType("page")
        .child(S.documentTypeList("page").title("Pages")),

      S.divider(),

      // CMS content
      S.listItem()
        .title("Event editions")
        .schemaType("edition")
        .child(S.documentTypeList("edition").title("Editions")),

      S.listItem()
        .title("Site configuration")
        .schemaType("siteConfig")
        .child(
          S.documentTypeList("siteConfig")
            .title("Site configuration")
        ),

      S.listItem()
        .title("Sponsors")
        .schemaType("sponsor")
        .child(S.documentTypeList("sponsor").title("Sponsors")),

      S.listItem()
        .title("Pricing tiers")
        .schemaType("pricingTier")
        .child(S.documentTypeList("pricingTier").title("Pricing tiers")),

      S.listItem()
        .title("Schedule")
        .schemaType("scheduleItem")
        .child(S.documentTypeList("scheduleItem").title("Schedule items")),

      S.listItem()
        .title("FAQ items")
        .schemaType("faqItem")
        .child(S.documentTypeList("faqItem").title("FAQ items")),

      S.listItem()
        .title("Feature cards")
        .schemaType("featureCard")
        .child(S.documentTypeList("featureCard").title("Feature cards")),

      S.listItem()
        .title("Benefit items")
        .schemaType("benefitItem")
        .child(S.documentTypeList("benefitItem").title("Benefit items")),
    ]);
