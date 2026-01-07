
const mongoose = require('mongoose');

// TODO: <db_password> ki jagah apna asli password likhein
const mongoURI = 'mongodb+srv://laxmandandekar:laxman12@cluster0.wyogtgj.mongodb.net/omsairam_new_db?appName=Cluster0';

mongoose.connect(mongoURI)
  .then(() => console.log('MongoDB Atlas Connected!'))
  .catch(err => console.error('Connection Error:', err));

const Admin = mongoose.model('Admin', new mongoose.Schema({
  username: { type: String, unique: true },
  password: { type: String }
}));

const Menu = mongoose.model('Menu', new mongoose.Schema({
  name: String,
  price: Number
}));

const Bill = mongoose.model('Bill', new mongoose.Schema({
  billNumber: { type: Number, unique: true },
  customer_phone: String,
  items: Array,
  total: Number,
  date: { type: Date, default: Date.now }
}));

// Default Admin Create
const initAdmin = async () => {
  const exists = await Admin.findOne({ username: 'admin' });
  if (!exists) await Admin.create({ username: 'admin', password: 'password' });
};
initAdmin();

module.exports = { Admin, Menu, Bill };