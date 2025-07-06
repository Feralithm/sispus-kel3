const express = require('express');
const path = require('path');
const userRoutes = require('./routes/userRoutes');
const adminRoutes = require('./routes/adminRoutes');
const fileUpload = require('express-fileupload');

const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(fileUpload());
app.use('/img', express.static('img'));
app.use(express.static(path.join(__dirname, 'public')));

// API routes
app.use('/api', userRoutes);
app.use('/api/admin', adminRoutes);

app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'public/login.html'));
});

app.listen(PORT, () => {
  console.log(`Server jalan di http://localhost:${PORT}`);
});
