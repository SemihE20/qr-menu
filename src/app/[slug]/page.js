import { supabase } from '@/lib/supabase'
import { notFound } from 'next/navigation'

export default async function MenuPage({ params }) {
  const { slug } = await params

  const { data: restaurant } = await supabase
    .from('restaurants')
    .select('*')
    .eq('slug', slug)
    .single()

  if (!restaurant) return notFound()

  const { data: menuItems } = await supabase
    .from('menus')
    .select('*')
    .eq('restaurant_id', restaurant.id)
    .eq('is_available', true)
    .order('category')

  const grouped = menuItems.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = []
    acc[item.category].push(item)
    return acc
  }, {})

  const categoryList = Object.keys(grouped)

  return (
    <>
      <link
        href="https://fonts.googleapis.com/css2?family=Archivo+Black&family=Outfit:wght@400;500;600;700&display=swap"
        rel="stylesheet"
      />
      <main
        style={{
          minHeight: '100vh',
          background: '#15110D',
          fontFamily: "'Outfit', sans-serif",
          color: '#FFFBF5',
        }}
      >
        {/* Hero header */}
        <div
          style={{
            background: 'radial-gradient(120% 100% at 50% 0%, #2E2117 0%, #15110D 70%)',
            padding: '36px 20px 28px',
            textAlign: 'center',
            borderBottom: '1px solid #2E241A',
          }}
        >
          <img
            src="/logo.png"
            alt="Logo"
            style={{
              width: 76,
              height: 76,
              borderRadius: '50%',
              margin: '0 auto 14px',
              display: 'block',
              boxShadow: '0 0 0 3px #FF6B35',
            }}
          />
          <p
            style={{
              color: '#FFC857',
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              margin: '0 0 6px',
            }}
          >
            Lezzetin en çıtır hali
          </p>
          <h1
            style={{
              fontFamily: "'Archivo Black', sans-serif",
              fontSize: 'clamp(26px, 7vw, 34px)',
              lineHeight: 1.1,
              margin: 0,
            }}
          >
            {restaurant.name}
          </h1>
        </div>

        {/* Sticky category nav */}
        {categoryList.length > 1 && (
          <div
            style={{
              position: 'sticky',
              top: 0,
              zIndex: 20,
              background: 'rgba(21,17,13,0.95)',
              backdropFilter: 'blur(8px)',
              borderBottom: '1px solid #2E241A',
              overflowX: 'auto',
              WebkitOverflowScrolling: 'touch',
            }}
          >
            <div
              style={{
                display: 'flex',
                gap: 8,
                padding: '12px 16px',
                width: 'max-content',
              }}
            >
              {categoryList.map((cat) => (
                <a
                  key={cat}
                  href={`#${encodeURIComponent(cat)}`}
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: '#FFC857',
                    background: '#2A2018',
                    border: '1px solid #3A2E22',
                    borderRadius: 20,
                    padding: '8px 16px',
                    whiteSpace: 'nowrap',
                    textDecoration: 'none',
                  }}
                >
                  {cat}
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Menü içerik */}
        <div style={{ maxWidth: 720, margin: '0 auto', padding: '28px 16px 60px' }}>
          {categoryList.map((category) => (
            <section key={category} id={encodeURIComponent(category)} style={{ marginBottom: 36, scrollMarginTop: 64 }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  marginBottom: 14,
                }}
              >
                <h2
                  style={{
                    fontFamily: "'Archivo Black', sans-serif",
                    fontSize: 17,
                    color: '#FF6B35',
                    margin: 0,
                    textTransform: 'uppercase',
                    letterSpacing: '0.02em',
                  }}
                >
                  {category}
                </h2>
                <div style={{ flex: 1, height: 1, background: '#2E241A' }} />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {grouped[category].map((item) => (
                  <div
                    key={item.id}
                    style={{
                      background: '#1F1810',
                      borderRadius: 16,
                      padding: 14,
                      display: 'flex',
                      gap: 12,
                      border: '1px solid #2E241A',
                      alignItems: 'center',
                    }}
                  >
                    {item.image_url ? (
                      <img
                        src={item.image_url}
                        alt={item.title}
                        style={{
                          width: 64,
                          height: 64,
                          borderRadius: 12,
                          objectFit: 'cover',
                          flexShrink: 0,
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: 64,
                          height: 64,
                          borderRadius: 12,
                          flexShrink: 0,
                          background: '#2A2018',
                        }}
                      />
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h3
                        style={{
                          fontSize: 15,
                          fontWeight: 600,
                          margin: '0 0 3px',
                          color: '#FFFBF5',
                        }}
                      >
                        {item.title}
                      </h3>
                      {item.description && (
                        <p
                          style={{
                            fontSize: 12.5,
                            color: '#9C9085',
                            margin: '0 0 6px',
                            lineHeight: 1.4,
                          }}
                        >
                          {item.description}
                        </p>
                      )}
                      <p
                        style={{
                          fontSize: 15,
                          fontWeight: 700,
                          color: '#FFC857',
                          margin: 0,
                        }}
                      >
                        {item.price} ₺
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}

          {categoryList.length === 0 && (
            <p style={{ textAlign: 'center', color: '#9C9085', marginTop: 60 }}>
              Henüz menüde ürün yok.
            </p>
          )}
        </div>
      </main>
    </>
  )
}