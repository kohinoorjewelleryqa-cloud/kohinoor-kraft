import type { Metadata } from "next";
import TextPage from "@/components/TextPage";
import { getCatalog } from "@/lib/catalog";
import { COMPANY, LEGAL_UPDATED } from "@/lib/company";
import { terms } from "@/lib/content";
import type { Lang } from "@/lib/i18n";
import { t } from "@/lib/i18n";

export async function generateMetadata({ params }: { params: Promise<{ lang: Lang }> }): Promise<Metadata> {
  const { lang } = await params;
  return { title: t(lang).nav.terms };
}
export default async function Terms({ params }: { params: Promise<{ lang: Lang }> }) {
  const { lang } = await params;
  const { settings } = await getCatalog();
  return <TextPage title={t(lang).nav.terms} note={`${lang === "ar" ? "آخر تحديث" : "Last updated"}: ${LEGAL_UPDATED}`} sections={terms(lang, { legalName: COMPANY.legalName, cr: COMPANY.crNumber, advance: settings.advance_pct })} />;
}
