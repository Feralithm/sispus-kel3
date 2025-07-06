const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();

const usersPath = path.join(__dirname, '../data/users.json');
const booksPath = path.join(__dirname, '../data/books.json');
const loansPath = path.join(__dirname, '../data/loans.json');

const readJSON = (filePath) => JSON.parse(fs.readFileSync(filePath, 'utf-8'));
const writeJSON = (filePath, data) => fs.writeFileSync(filePath, JSON.stringify(data, null, 2));

// Middleware cek admin
function isAdmin(req, res, next) {
  const users = readJSON(usersPath);
  const { userId } = req.body;
  const user = users.find(u => u.id === userId && u.role === 'admin');
  if (!user) return res.status(403).json({ message: 'Akses hanya untuk admin' });
  next();
}

// Tambah buku (hanya admin)
router.post('/books', (req, res) => {
  const { title, author, stock } = req.body;
  const books = readJSON(booksPath);

  if (!req.files || !req.files.image) {
    return res.status(400).json({ message: 'Gambar buku wajib diunggah' });
  }

  const imageFile = req.files.image;
  const imageName = Date.now() + '_' + imageFile.name;
  const uploadPath = path.join(__dirname, '../public/img', imageName);

  imageFile.mv(uploadPath, (err) => {
    if (err) return res.status(500).json({ message: 'Gagal upload gambar' });

    const newBook = {
      id: 'b' + Date.now(),
      title,
      author,
      stock: parseInt(stock),
      image: '/img/' + imageName
    };

    books.push(newBook);
    writeJSON(booksPath, books);

    res.status(201).json({ message: 'Buku berhasil ditambahkan', book: newBook });
  });
});


// Lihat semua peminjaman (hanya admin)
router.get('/loans', (req, res) => {
  const loans = readJSON(loansPath);
  const books = readJSON(booksPath);
  const users = readJSON(usersPath);

  const result = loans.map(loan => {
    const book = books.find(b => b.id === loan.bookId);
    const user = users.find(u => u.id === loan.userId);
    return {
      ...loan,
      bookTitle: book?.title || 'Tidak ditemukan',
      bookAuthor: book?.author || 'Tidak ditemukan',
      username: user?.username || 'Tidak ditemukan',
    };
  });

  res.json(result);
});

router.get('/users', (req, res) => {
  const users = readJSON(usersPath);
  const userList = users.filter(u => u.role !== 'admin');
  res.json(userList);
});


module.exports = router;
