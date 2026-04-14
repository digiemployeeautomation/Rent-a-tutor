import ScrollReveal from '@/components/ui/ScrollReveal'

export default function FeedCard({ children, className = '', delay = 0, onClick }) {
  return (
    <ScrollReveal delay={delay}>
      <div
        onClick={onClick}
        className={`bg-white rounded-2xl p-5 shadow-sm border border-gray-100 transition-transform duration-200 hover:scale-[1.01] ${onClick ? 'cursor-pointer' : ''} ${className}`}
      >
        {children}
      </div>
    </ScrollReveal>
  )
}
