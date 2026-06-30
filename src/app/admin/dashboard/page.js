'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

const colors = {
  bg: '#15110D',
  card: '#1F1810',
  border: '#2E241A',
  orange: '#FF6B35',
  gold: '#FFC857',
  cream: '#FFFBF5',
  muted: '#9C9085',
}

const emptyForm = { title: '', description: '', price: '', category: '' }

const categories = [
  'Burgerler',
  'Wraplar',
  'Kumrular',
  'Patso',
  'Tostlar',
  'Izgaralar',
  'Çorbalar',
  'Pilavlar',
  'İçecekler',
]

export default function DashboardPage() {
  const [restaurant, setRestaurant] = useState(null)
  const [menuItems, setMenuItems] = useState([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  const [form, setForm] = useState(emptyForm)
  const [imageFile, setImageFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [formOpen, setFormOpen] = useState(false)

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

  function startEdit(item) {
    setEditingId(item.id)
    setForm({
      title: item.title,
      description: item.description || '',
      price: String(item.price),
      category: item.category,
    })
    setImageFile(null)
    setFormOpen(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function cancelEdit() {
    setEditingId(null)
    setForm(emptyForm)
    setImageFile(null)
    setFormOpen(false)
  }

  async function uploadImageIfNeeded() {
    if (!imageFile) return null
    const fileExt = imageFile.name.split('.').pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`

    const { error: uploadError } = await supabase.storage
      .from('menu-images')
      .upload(fileName, imageFile)

    if (uploadError) {
      alert('Görsel yüklenemedi: ' + uploadError.message)
      return undefined
    }

    const { data: urlData } = supabase.storage.from('menu-images').getPublicUrl(fileName)
    return urlData.publicUrl
  }

  async function handleSave() {
    if (!form.title || !form.price || !form.category) {
      alert('Lütfen başlık, fiyat ve kategori doldur!')
      return
    }

    setUploading(true)
    const imageUrl = await uploadImageIfNeeded()

    if (imageUrl === undefined) {
      setUploading(false)
      return
    }

    if (editingId) {
      const updateData = {
        title: form.title,
        description: form.description,
        price: parseFloat(form.price),
        category: form.category,
      }
      if (imageUrl) updateData.image_url = imageUrl

      const { data, error } = await supabase
        .from('menus')
        .update(updateData)
        .eq('id', editingId)
        .select()

      setUploading(false)

      if (error) {
        alert('Hata: ' + error.message)
        return
      }

      setMenuItems(menuItems.map((item) => (item.id === editingId ? data[0] : item)))
      cancelEdit()
    } else {
      const { data, error } = await supabase
        .from('menus')
        .insert({
          restaurant_id: restaurant.id,
          title: form.title,
          description: form.description,
          price: parseFloat(form.price),
          category: form.category,
          image_url: imageUrl,
        })
        .select()

      setUploading(false)

      if (error) {
        alert('Hata: ' + error.message)
        return
      }

      setMenuItems([...menuItems, data[0]])
      setForm(emptyForm)
      setImageFile(null)
      setFormOpen(false)
    }
  }

  async function handleDeleteItem(id) {
    if (!confirm('Bu ürünü silmek istediğine emin misin?')) return
    await supabase.from('menus').delete().eq('id', id)
    setMenuItems(menuItems.filter((item) => item.id !== id))
    if (editingId === id) cancelEdit()
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
    background: colors.bg,
    border: `1px solid ${colors.border}`,
    borderRadius: 10,
    padding: '13px 14px',
    fontSize: 15,
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
      <main style={{ minHeight: '100vh', background: colors.bg, fontFamily: "'Outfit', sans-serif", paddingBottom: 100 }}>
        {/* Header */}
        <div style={{ borderBottom: `2px solid ${colors.orange}`, background: colors.card, position: 'sticky', top: 0, zIndex: 30 }}>
          <div
            style={{
              maxWidth: 720,
              margin: '0 auto',
              padding: '16px 16px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <h1
              style={{
                fontFamily: "'Archivo Black', sans-serif",
                fontSize: 16,
                color: colors.cream,
                margin: 0,
                minWidth: 0,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {restaurant.name}
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
                flexShrink: 0,
              }}
            >
              Çıkış
            </button>
          </div>
        </div>

        <div style={{ maxWidth: 720, margin: '0 auto', padding: '16px 16px 0' }}>
          {/* Yeni ürün butonu (form kapalıyken) */}
          {!formOpen && (
            <button
              onClick={() => setFormOpen(true)}
              style={{
                width: '100%',
                background: colors.orange,
                color: '#1A1410',
                fontWeight: 700,
                fontSize: 15,
                padding: '14px',
                borderRadius: 12,
                border: 'none',
                cursor: 'pointer',
                marginBottom: 20,
              }}
            >
              + Yeni ürün ekle
            </button>
          )}

          {/* Ürün Formu */}
          {formOpen && (
            <section
              style={{
                background: colors.card,
                borderRadius: 16,
                padding: 18,
                marginBottom: 24,
                border: `1px solid ${editingId ? colors.gold : colors.border}`,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <h2
                  style={{
                    fontFamily: "'Archivo Black', sans-serif",
                    fontSize: 14,
                    color: editingId ? colors.gold : colors.orange,
                    margin: 0,
                    textTransform: 'uppercase',
                    letterSpacing: '0.03em',
                  }}
                >
                  {editingId ? 'Ürünü düzenle' : 'Yeni ürün ekle'}
                </h2>
                <button
                  onClick={cancelEdit}
                  style={{ background: 'none', border: 'none', color: colors.muted, fontSize: 13, cursor: 'pointer' }}
                >
                  Vazgeç
                </button>
              </div>

              {editingId && (
                <div style={{ marginBottom: 10, fontSize: 12, color: colors.muted }}>
                  Yeni görsel seçmezsen mevcut görsel korunur.
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <input
                  type="text"
                  placeholder="Ürün adı"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  style={inputStyle}
                />
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  style={{ ...inputStyle, color: form.category ? colors.cream : colors.muted }}
                >
                  <option value="" disabled>
                    Kategori seç
                  </option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat} style={{ background: colors.bg, color: colors.cream }}>
                      {cat}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  placeholder="Fiyat"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  style={inputStyle}
                />
                <input
                  type="text"
                  placeholder="Açıklama"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  style={inputStyle}
                />
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setImageFile(e.target.files[0])}
                  style={{ ...inputStyle, color: colors.muted }}
                />
              </div>
              <button
                onClick={handleSave}
                disabled={uploading}
                style={{
                  width: '100%',
                  marginTop: 14,
                  background: editingId ? colors.gold : colors.orange,
                  color: '#1A1410',
                  fontWeight: 700,
                  fontSize: 15,
                  padding: '13px',
                  borderRadius: 10,
                  border: 'none',
                  cursor: 'pointer',
                  opacity: uploading ? 0.6 : 1,
                }}
              >
                {uploading ? 'Kaydediliyor...' : editingId ? 'Güncelle' : 'Ekle'}
              </button>
            </section>
          )}

          {/* Ürün Listesi */}
          <h2
            style={{
              fontFamily: "'Archivo Black', sans-serif",
              fontSize: 13,
              color: colors.gold,
              margin: '0 0 14px',
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
                  borderRadius: 14,
                  padding: 12,
                  border: `1px solid ${editingId === item.id ? colors.gold : colors.border}`,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                  {item.image_url ? (
                    <img
                      src={item.image_url}
                      alt={item.title}
                      style={{ width: 50, height: 50, borderRadius: 10, objectFit: 'cover', flexShrink: 0 }}
                    />
                  ) : (
                    <div style={{ width: 50, height: 50, borderRadius: 10, background: colors.bg, flexShrink: 0 }} />
                  )}
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <p style={{ fontWeight: 600, color: colors.cream, margin: '0 0 2px', fontSize: 14 }}>
                      {item.title}
                    </p>
                    <p style={{ fontSize: 13, color: colors.muted, margin: 0 }}>
                      {item.category} · {item.price} ₺
                    </p>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={() => handleToggleAvailable(item.id, item.is_available)}
                    style={{
                      flex: 1,
                      fontSize: 13,
                      padding: '9px',
                      borderRadius: 8,
                      border: 'none',
                      cursor: 'pointer',
                      background: item.is_available ? 'rgba(99,153,34,0.18)' : 'rgba(156,144,133,0.15)',
                      color: item.is_available ? '#97C459' : colors.muted,
                    }}
                  >
                    {item.is_available ? 'Aktif' : 'Pasif'}
                  </button>
                  <button
                    onClick={() => startEdit(item)}
                    style={{
                      flex: 1,
                      fontSize: 13,
                      padding: '9px',
                      borderRadius: 8,
                      border: `1px solid ${colors.border}`,
                      background: 'none',
                      color: colors.gold,
                      cursor: 'pointer',
                    }}
                  >
                    Düzenle
                  </button>
                  <button
                    onClick={() => handleDeleteItem(item.id)}
                    style={{
                      flex: 1,
                      fontSize: 13,
                      padding: '9px',
                      borderRadius: 8,
                      border: `1px solid ${colors.border}`,
                      background: 'none',
                      color: '#E24B4A',
                      cursor: 'pointer',
                    }}
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