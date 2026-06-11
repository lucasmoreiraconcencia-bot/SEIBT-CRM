// Cabeçalho padrão das páginas: título condensado estilo transmissão esportiva
// + faixa tricolor (assinatura vintage Copa 2002) + subtítulo opcional.
export function PageHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <header className="mb-5">
      <h1 className="title-page">{title}</h1>
      <div className="ribbon mt-1.5" />
      {subtitle && <p className="mt-2 text-sm text-white/55">{subtitle}</p>}
    </header>
  );
}
