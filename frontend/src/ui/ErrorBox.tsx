interface ErrorBoxProps {
  message: string
}

export function ErrorBox({ message }: ErrorBoxProps) {
  return (
    <div className="rounded-lg border border-rose-900/60 bg-rose-950/40 px-4 py-3 text-sm text-rose-200">
      {message}
    </div>
  )
}