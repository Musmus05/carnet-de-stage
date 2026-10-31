import { getDictionary } from "@/lib/i18n/server";
import { ButtonLink } from "@/components/ui";

export default async function NotFound() {
  const { t } = await getDictionary();
  return (
    <main className="mx-auto grid min-h-dvh max-w-md place-content-center gap-5 px-4 text-center">
      <h1 className="font-serif text-3xl font-semibold">{t.common.notFound}</h1>
      <ButtonLink href="/" variant="secondary" className="justify-self-center">
        {t.common.backHome}
      </ButtonLink>
    </main>
  );
}
