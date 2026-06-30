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

  return (
    <>
      <link
        href="https://fonts.googleapis.com/css2?family=Archivo+Black&family=Outfit:wght@400;500;600;700&display=swap"
        rel="stylesheet"
      />
      <main
        style={{
          minHeight: '100vh',
          background: '#1A1410',
          fontFamily: "'Outfit', sans-serif",
          color: '#FFFBF5',
        }}
      >
        {/* Header */}
        <div
          style={{
            background: 'linear-gradient(180deg, #2A2018 0%, #1A1410 100%)',
            borderBottom: '3px solid #FF6B35',
            position: 'sticky',
            top: 0,
            zIndex: 10,
          }}
        >
          <div style={{ maxWidth: 640, margin: '0 auto', padding: '28px 20px 22px' }}>
            <p
              style={{
                color: '#FFC857',
                fontSize: 12,
                fontWeight: 600,
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                margin: '0 0 4px',
              }}
            >
              Menü
            </p>
            <h1
              style={{
                fontFamily: "'Archivo Black', sans-serif",
                fontSize: 32,
                lineHeight: 1.1,
                margin: 0,
                color: '#FFFBF5',
              }}
            >
              {restaurant.name}
            </h1>
          </div>
        </div>

        {/* Menü */}
        <div style={{ maxWidth: 640, margin: '0 auto', padding: '32px 20px 60px' }}>
          {Object.entries(grouped).map(([category, items]) => (
            <section key={category} style={{ marginBottom: 40 }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  marginBottom: 18,
                }}
              >
                <h2
                  style={{
                    fontFamily: "'Archivo Black', sans-serif",
                    fontSize: 18,
                    color: '#FF6B35',
                    margin: 0,
                    textTransform: 'uppercase',
                    letterSpacing: '0.03em',
                  }}
                >
                  {category}
                </h2>
                <div
                  style={{
                    flex: 1,
                    height: 2,
                    background:
                      'repeating-linear-gradient(90deg, #FFC857 0, #FFC857 6px, transparent 6px, transparent 12px)',
                  }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {items.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      background: '#2A2018',
                      borderRadius: 14,
                      padding: 16,
                      display: 'flex',
                      gap: 14,
                      border: '1px solid #3A2E22',
                    }}
                  >
                    {item.image_url && (
                      <img
                        src={item.image_url}
                        alt={item.title}
                        style={{
                          width: 76,
                          height: 76,
                          borderRadius: 10,
                          objectFit: 'cover',
                          flexShrink: 0,
                        }}
                      />
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h3
                        style={{
                          fontSize: 16,
                          fontWeight: 600,
                          margin: '0 0 4px',
                          color: '#FFFBF5',
                        }}
                      >
                        {item.title}
                      </h3>
                      {item.description && (
                        <p
                          style={{
                            fontSize: 13,
                            color: '#B8AFA3',
                            margin: '0 0 8px',
                            lineHeight: 1.4,
                          }}
                        >
                          {item.description}
                        </p>
                      )}
                      <p
                        style={{
                          fontSize: 16,
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
        </div>
      </main>
    </>
  )
}