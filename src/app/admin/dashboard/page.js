'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function DashboardPage() {
  const [restaurant, setRestaurant] = useState(null)
  const [menuItems, setMenuItems] = useState([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  // Form state
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

    // Görsel varsa önce onu yükle
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

      const { data: urlData } = supabase.storage
        .from('menu-images')
        .getPublicUrl(fileName)

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
      menuItems.map((item) =>
        item.id === id ? { ...item, is_available: !current } : item
      )
    )
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/admin/login')
  }

  if (loading) return <div className="p-8">Yükleniyor...</div>

  if (!restaurant) {
    return (
      <div className="p-8">
        <p>Bu kullanıcıya bağlı bir restoran bulunamadı.</p>
        <button onClick={handleLogout} className="mt-4 text-orange-500">
          Çıkış Yap
        </button>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-3xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold text-gray-800">{restaurant.name} - Panel</h1>
          <button
            onClick={handleLogout}
            className="text-sm text-red-500 hover:underline"
          >
            Çıkış Yap
          </button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6 space-y-8">
        {/* Yeni Ürün Ekle Formu */}
        <section className="bg-white rounded-xl shadow-sm p-5">
          <h2 className="font-semibold text-gray-800 mb-4">Yeni Ürün Ekle</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input
              type="text"
              placeholder="Ürün Adı"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
            />
            <input
              type="text"
              placeholder="Kategori (örn: Burgerler)"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
            />
            <input
              type="number"
              placeholder="Fiyat"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
            />
            <input
              type="text"
              placeholder="Açıklama"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
            />
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setImageFile(e.target.files[0])}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm md:col-span-2"
            />
          </div>
          <button
            onClick={handleAddItem}
            disabled={uploading}
            className="mt-4 bg-orange-500 hover:bg-orange-600 text-white font-semibold px-5 py-2 rounded-lg text-sm disabled:opacity-50"
          >
            {uploading ? 'Yükleniyor...' : 'Ekle'}
          </button>
        </section>

        {/* Mevcut Ürünler */}
        <section>
          <h2 className="font-semibold text-gray-800 mb-4">Menü Ürünleri ({menuItems.length})</h2>
          <div className="space-y-3">
            {menuItems.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-xl shadow-sm p-4 flex justify-between items-center"
              >
                <div className="flex items-center gap-3">
                  {item.image_url && (
                    <img
                      src={item.image_url}
                      alt={item.title}
                      className="w-12 h-12 rounded-lg object-cover"
                    />
                  )}
                  <div>
                    <p className="font-semibold text-gray-800">{item.title}</p>
                    <p className="text-sm text-gray-500">{item.category} · {item.price} ₺</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleToggleAvailable(item.id, item.is_available)}
                    className={`text-xs px-3 py-1 rounded-full ${
                      item.is_available
                        ? 'bg-green-100 text-green-600'
                        : 'bg-gray-100 text-gray-400'
                    }`}
                  >
                    {item.is_available ? 'Aktif' : 'Pasif'}
                  </button>
                  <button
                    onClick={() => handleDeleteItem(item.id)}
                    className="text-red-400 hover:text-red-600 text-sm"
                  >
                    Sil
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  )
}