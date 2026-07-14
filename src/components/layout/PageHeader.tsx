interface PageHeaderProps {
  title: string
  rightElement?: React.ReactNode
}

export default function PageHeader({ title, rightElement }: PageHeaderProps) {
  return (
    <div className="flex items-center justify-between px-4 pt-4 pb-2">
      <h1 className="text-xl font-semibold text-white">{title}</h1>
      {rightElement && <div>{rightElement}</div>}
    </div>
  )
}
