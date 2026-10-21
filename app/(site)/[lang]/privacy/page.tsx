import type { Metadata } from "next";
import TextPage from "@/components/TextPage";
import { COMPANY, LEGAL_UPDATED } from "@/lib/company";
import { privacy } from "@/lib/content";
import type { Lang } from "@/lib/i18n";
import { t } from "@/lib/i18n";

export async function generateMetadata({ params }: { params: Promise<{ lang: Lang }> }): Promise<Metadata> {
  const { lang } = await params;
  return { title: t(lang).nav.privacy };
}
export default async function Privacy({ params }: { params: Promise<{ lang: Lang }> }) {
  const { lang } = await params;
  return <TextPage title={t(lang).nav.privacy} note={`${lang === "ar" ? "آخر تحديث" : "Last updated"}: ${LEGAL_UPDATED}`} sections={privacy(lang, { legalName: COMPANY.legalName, cr: COMPANY.crNumber })} />;
}
