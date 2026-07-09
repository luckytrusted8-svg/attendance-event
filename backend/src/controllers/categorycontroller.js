const prisma = require('../config/db');

/**
 * GET /api/categories
 * Daftar kategori event (dipakai untuk dropdown "Kategori Event" saat membuat/edit event).
 * Tidak memerlukan login karena juga bisa dipakai untuk filter di halaman publik.
 */
async function listCategories(req, res) {
  try {
    const categories = await prisma.category.findMany({ orderBy: { name: 'asc' } });
    return res.json({ success: true, data: categories });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server.', error: err.message });
  }
}

/**
 * POST /api/categories
 * Menambah kategori baru (khusus Admin Level 1) — dipicu dari tombol [+] di form Buat Event.
 */
async function createCategory(req, res) {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Nama kategori wajib diisi.' });
    }
    const existing = await prisma.category.findUnique({ where: { name: name.trim() } });
    if (existing) {
      return res.status(409).json({ success: false, message: 'Kategori ini sudah ada.' });
    }
    const category = await prisma.category.create({ data: { name: name.trim() } });
    return res.status(201).json({ success: true, message: 'Kategori berhasil ditambahkan.', data: category });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server.', error: err.message });
  }
}

/**
 * DELETE /api/categories/:id
 * Menghapus kategori (khusus Admin Level 1). Event yang sudah memakai kategori ini
 * tidak ikut terhapus — field category pada event tersebut hanya jadi teks bebas yang tidak lagi ada di daftar.
 */
async function deleteCategory(req, res) {
  try {
    const id = Number(req.params.id);
    await prisma.category.delete({ where: { id } });
    return res.json({ success: true, message: 'Kategori berhasil dihapus.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server.', error: err.message });
  }
}

module.exports = { listCategories, createCategory, deleteCategory };