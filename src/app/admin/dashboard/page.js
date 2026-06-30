'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

const colors = {
  bg: '#1A1410',
  card: '#2A2018',
  border: '#3A2E22',
  orange: '#FF6B35',
  gold: '#FFC857',
  cream: '#FFFBF5',
  muted: '#B8AFA3',
}

export default function DashboardPage() {
  const [restaurant, setRestaurant] = useState(null)
  const [menuItems, setMenuItems] = useState([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [category, setCategory] = useState('')
  const [imageFile, setImageFile] = useState(null)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    checkUserAndLoad()
  }, [])

  async function checkUserAndLoad() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/admin/login')
      return
    }

    const { data: rest } = await supabase
      .from('restaurants')
      .select('*')
      .eq('user_id', user.id)
      .single()

    setRestaurant(rest)

    if (rest) {
      const { data: items } = await supabase
        .from('menus')
        .select('*')
        .eq('restaurant_id', rest.id)
        .order('category')
      setMenuItems(items || [])
    }
    setLoading(false)
  }

  async function handleAddItem() {
    if (!title || !price || !category) {
      alert('Lütfen başlık, fiyat ve kategori doldur!')
      return
    }

    setUploading(true)
    let imageUrl = null

    if (imageFile) {
      const fileExt = imageFile.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from('menu-images')
        .upload(fileName, imageFile)

      if (uploadError) {
        alert('Görsel yüklenemedi: ' + uploadError.message)
        setUploading(false)
        return
      }

      const { data: urlData } = supabase.storage.from('menu-images').getPublicUrl(fileName)
      imageUrl = urlData.publicUrl
    }

    const { data, error } = await supabase
      .from('menus')
      .insert({
        restaurant_id: restaurant.id,
        title,
        description,
        price: parseFloat(price),
        category,
        image_url: imageUrl,
      })
      .select()

    setUploading(false)

    if (error) {
      alert('Hata: ' + error.message)
      return
    }

    setMenuItems([...menuItems, data[0]])
    setTitle('')
    setDescription('')
    setPrice('')
    setCategory('')
    setImageFile(null)
  }

  async function handleDeleteItem(id) {
    if (!confirm('Bu ürünü silmek istediğine emin misin?')) return
    await supabase.from('menus').delete().eq('id', id)
    setMenuItems(menuItems.filter((item) => item.id !== id))
  }

  async function handleToggleAvailable(id, current) {
    await supabase.from('menus').update({ is_available: !current }).eq('id', id)
    setMenuItems(
      menuItems.map((item) => (item.id === id ? { ...item, is_available: !current } : item))
    )
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/admin/login')
  }

  const inputStyle = {
    background: '#1A1410',
    border: `1px solid ${colors.border}`,
    borderRadius: 10,
    padding: '11px 14px',
    fontSize: 14,
    color: colors.cream,
    outline: 'none',
    fontFamily: "'Outfit', sans-serif",
    width: '100%',
    boxSizing: 'border-box',
  }

  if (loading)
    return (
      <div style={{ background: colors.bg, minHeight: '100vh', color: colors.cream, padding: 40 }}>
        Yükleniyor...
      </div>
    )

  if (!restaurant) {
    return (
      <div style={{ background: colors.bg, minHeight: '100vh', color: colors.cream, padding: 40 }}>
        <p>Bu kullanıcıya bağlı bir restoran bulunamadı.</p>
        <button onClick={handleLogout} style={{ marginTop: 16, color: colors.orange, background: 'none', border: 'none', cursor: 'pointer' }}>
          Çıkış yap
        </button>
      </div>
    )
  }

  return (
    <>
      <link
        href="https://fonts.googleapis.com/css2?family=Archivo+Black&family=Outfit:wght@400;500;600;700&display=swap"
        rel="stylesheet"
      />
      <main style={{ minHeight: '100vh', background: colors.bg, fontFamily: "'Outfit', sans-serif" }}>
        {/* Header */}
        <div style={{ borderBottom: `3px solid ${colors.orange}`, background: colors.card }}>
          <div
            style={{
              maxWidth: 720,
              margin: '0 auto',
              padding: '20px 20px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <h1
              style={{
                fontFamily: "'Archivo Black', sans-serif",
                fontSize: 20,
                color: colors.cream,
                margin: 0,
              }}
            >
              {restaurant.name} <span style={{ color: colors.gold }}>· panel</span>
            </h1>
            <button
              onClick={handleLogout}
              style={{
                background: 'none',
                border: `1px solid ${colors.border}`,
                color: colors.muted,
                fontSize: 13,
                padding: '8px 14px',
                borderRadius: 8,
                cursor: 'pointer',
              }}
            >
              Çıkış yap
            </button>
          </div>
        </div>

        <div style={{ maxWidth: 720, margin: '0 auto', padding: '28px 20px 60px' }}>
          {/* Yeni Ürün Formu */}
          <section
            style={{
              background: colors.card,
              borderRadius: 16,
              padding: 22,
              marginBottom: 32,
              border: `1px solid ${colors.border}`,
            }}
          >
            <h2
              style={{
                fontFamily: "'Archivo Black', sans-serif",
                fontSize: 15,
                color: colors.orange,
                margin: '0 0 16px',
                textTransform: 'uppercase',
                letterSpacing: '0.03em',
              }}
            >
              Yeni ürün ekle
            </h2>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 10,
              }}
            >
              <input
                type="text"
                placeholder="Ürün adı"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                style={inputStyle}
              />
              <input
                type="text"
                placeholder="Kategori (örn: Burgerler)"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                style={inputStyle}
              />
              <input
                type="number"
                placeholder="Fiyat"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                style={inputStyle}
              />
              <input
                type="text"
                placeholder="Açıklama"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                style={inputStyle}
              />
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setImageFile(e.target.files[0])}
                style={{ ...inputStyle, gridColumn: '1 / -1', color: colors.muted }}
              />
            </div>
            <button
              onClick={handleAddItem}
              disabled={uploading}
              style={{
                marginTop: 16,
                background: colors.orange,
                color: '#1A1410',
                fontWeight: 700,
                fontSize: 14,
                padding: '11px 22px',
                borderRadius: 10,
                border: 'none',
                cursor: 'pointer',
                opacity: uploading ? 0.6 : 1,
              }}
            >
              {uploading ? 'Yükleniyor...' : 'Ekle'}
            </button>
          </section>

          {/* Ürün Listesi */}
          <h2
            style={{
              fontFamily: "'Archivo Black', sans-serif",
              fontSize: 15,
              color: colors.gold,
              margin: '0 0 16px',
              textTransform: 'uppercase',
              letterSpacing: '0.03em',
            }}
          >
            Menü ürünleri ({menuItems.length})
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {menuItems.map((item) => (
              <div
                key={item.id}
                style={{
                  background: colors.card,
                  borderRadius: 12,
                  padding: 14,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  border: `1px solid ${colors.border}`,
                  gap: 12,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                  {item.image_url && (
                    <img
                      src={item.image_url}
                      alt={item.title}
                      style={{ width: 48, height: 48, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }}
                    />
                  )}
                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontWeight: 600, color: colors.cream, margin: '0 0 2px', fontSize: 14 }}>
                      {item.title}
                    </p>
                    <p style={{ fontSize: 13, color: colors.muted, margin: 0 }}>
                      {item.category} · {item.price} ₺
                    </p>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                  <button
                    onClick={() => handleToggleAvailable(item.id, item.is_available)}
                    style={{
                      fontSize: 12,
                      padding: '5px 12px',
                      borderRadius: 20,
                      border: 'none',
                      cursor: 'pointer',
                      background: item.is_available ? 'rgba(99,153,34,0.2)' : 'rgba(184,175,163,0.15)',
                      color: item.is_available ? '#97C459' : colors.muted,
                    }}
                  >
                    {item.is_available ? 'Aktif' : 'Pasif'}
                  </button>
                  <button
                    onClick={() => handleDeleteItem(item.id)}
                    style={{ color: '#E24B4A', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13 }}
                  >
                    Sil
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </>
  )
}