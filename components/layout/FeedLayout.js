export default function FeedLayout({ children, className = '' }) {
  return (
    <div className={`mx-auto max-w-xl px-4 pb-24 md:pb-8 ${className}`}>
      {children}
    </div>
  )
}
