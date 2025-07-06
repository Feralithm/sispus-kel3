const express = require('express');
const fs = require('fs');
const router = express.Router();
const path = require('path');

const usersPath = path.join(__dirname, '../data/users.json');
const booksPath = path.join(__dirname, '../data/books.json');
const loansPath = path.join(__dirname, '../data/loans.json');

// Helper untuk load dan simpan file JSON
const readJSON = (filePath) => JSON.parse(fs.readFileSync(filePath, 'utf-8'));
const writeJSON = (filePath, data) => fs.writeFileSync(filePath, JSON.stringify(data, null, 2));

// Register
router.post('/register', (req, res) => {
  const { username, password, name } = req.body;
  const users = readJSON(usersPath);

  // Cek apakah username sudah dipakai
  const existingUser = users.find(u => u.username === username);
  if (existingUser) {
    return res.status(400).json({ message: 'Username sudah digunakan' });
  }

  const newUser = {
    id: `u${Date.now()}`,
    username,
    password,
    name
  };

  users.push(newUser);
  writeJSON(usersPath, users);

  res.status(201).json({ message: 'Registrasi berhasil', user: newUser });
});


// Login
router.post('/login', (req, res) => {
  const { username, password } = req.body;
  const users = readJSON(usersPath);
  const user = users.find(u => u.username === username && u.password === password);
  if (!user) return res.status(401).json({ message: 'Login gagal' });
  res.json({ message: 'Login berhasil', user });
});

// Ambil semua buku
router.get('/books', (req, res) => {
  const books = readJSON(booksPath);
  res.json(books);
});


// Pencarian buku
router.get('/books/search', (req, res) => {
  const { q } = req.query;
  const books = readJSON(booksPath);
  const results = books.filter(b =>
    b.title.toLowerCase().includes(q.toLowerCase()) ||
    b.author.toLowerCase().includes(q.toLowerCase())
  );
  res.json(results);
});

// Peminjaman buku
router.post('/loans', (req, res) => {
  const { userId, bookId } = req.body;
  const books = readJSON(booksPath);
  const loans = readJSON(loansPath);

  const book = books.find(b => b.id === bookId);
  if (!book) return res.status(404).json({ message: 'Buku tidak ditemukan' });
  if (book.stock <= 0) return res.status(400).json({ message: 'Stok buku habis' });

  // kurangi stok
  book.stock--;
  writeJSON(booksPath, books);

  const loan = {
    id: Date.now().toString(),
    userId,
    bookId,
    borrowDate: new Date().toISOString(),
    returnDate: null
  };
  loans.push(loan);
  writeJSON(loansPath, loans);

  res.json({
  message: 'Buku berhasil dipinjam',
  loan,
  book: {
    id: book.id,
    title: book.title,
    author: book.author,
    stock: book.stock
  }
});

});

// Pengembalian buku
router.post('/loans/return', (req, res) => {
  const { userId, bookId } = req.body;
  const books = readJSON(booksPath);
  const loans = readJSON(loansPath);

  const loan = loans.find(l => l.userId === userId && l.bookId === bookId && l.returnDate === null);
  if (!loan) return res.status(404).json({ message: 'Peminjaman tidak ditemukan' });

  loan.returnDate = new Date().toISOString();
  writeJSON(loansPath, loans);

  const book = books.find(b => b.id === bookId);
  book.stock++;
  writeJSON(booksPath, books);

  res.json({ message: 'Buku berhasil dikembalikan', loan });
});

// Lihat profil user + histori pinjam
router.get('/profile/:userId', (req, res) => {
  const { userId } = req.params;
  const users = readJSON(usersPath);
  const loans = readJSON(loansPath);
  const books = readJSON(booksPath);

  const user = users.find(u => u.id === userId);
  if (!user) return res.status(404).json({ message: 'User tidak ditemukan' });

  const history = loans
    .filter(l => l.userId === userId)
    .map(l => {
      const book = books.find(b => b.id === l.bookId);
      return {
        bookId: l.bookId,
        bookTitle: book?.title || 'Buku tidak ditemukan',
        bookAuthor: book?.author || 'Tidak diketahui',
        borrowDate: l.borrowDate,
        returnDate: l.returnDate
      };
    });

  res.json({ user, history });
});


module.exports = router;
