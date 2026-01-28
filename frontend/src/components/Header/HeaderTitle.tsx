interface HeaderTitleProps {
  title: string
  subtitle?: string
}

export function HeaderTitle({ title, subtitle }: HeaderTitleProps) {
  return (
    <div>
      <h1 className="text-lg font-semibold">{title}</h1>
      {subtitle && (
        <p className="text-xs text-muted-foreground">{subtitle}</p>
      )}
    </div>
  )
}
