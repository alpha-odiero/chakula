function PageHeader({ eyebrow, title, subtitle, children }) {
  return (
    <div className="page-header">
      <div className="container">
        {eyebrow && <p className="page-eyebrow">{eyebrow}</p>}
        <h1 className="page-title">{title}</h1>
        {subtitle && <p className="page-subtitle">{subtitle}</p>}
        {children}
      </div>
    </div>
  )
}

export default PageHeader