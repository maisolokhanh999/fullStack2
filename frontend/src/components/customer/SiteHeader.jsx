export default function SiteHeader({ children, isOpen = false }) {
  return <header className={`site-header${isOpen ? ' is-open' : ''}`}>{children}</header>
}
