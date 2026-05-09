export function Footer() {
  return (
    <footer className="border-t border-[var(--color-border)] mt-8">
      <div className="mx-auto w-full max-w-[960px] px-4 sm:px-6 py-4 text-xs text-[var(--color-muted-foreground)] space-y-1">
        <p>
          Contenu original © Ministère de l'Intérieur. Traduction arabe et application : Rami Hanna,
          CC BY-SA 4.0. Application non officielle.
        </p>
        <p dir="rtl" lang="ar">
          المحتوى الأصلي © وزارة الداخلية الفرنسية. الترجمة العربية والتطبيق: رامي حنا، رخصة CC
          BY-SA 4.0. تطبيق غير رسمي.
        </p>
      </div>
    </footer>
  );
}
