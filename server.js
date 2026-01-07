const express = require('express');
const bodyParser = require('body-parser');
const PDFDocument = require('pdfkit');
const db = require('./database');
const path = require('path');

const app = express();
// Vercel environment variables ko use karega
const port = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(express.static('public'));

// LOGIN
app.post('/login', async (req, res) => {
  try {
    const user = await db.Admin.findOne({ username: req.body.username, password: req.body.password });
    res.json({ success: !!user });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET MENU
app.get('/menu', async (req, res) => {
  try {
    const items = await db.Menu.find();
    res.json(items);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ADD MENU ITEM
app.post('/add-menu-item', async (req, res) => {
  try {
    const newItem = await db.Menu.create(req.body);
    res.json({ success: true, id: newItem._id });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// DELETE MENU ITEM
app.delete('/menu/:id', async (req, res) => {
  try {
    await db.Menu.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GENERATE BILL
app.post('/generate-bill', async (req, res) => {
  try {
    const lastBill = await db.Bill.findOne({ billNumber: { $exists: true } }).sort({ billNumber: -1 });
    const billNumber = lastBill && lastBill.billNumber ? lastBill.billNumber + 1 : 1;
    const newBill = await db.Bill.create({
      billNumber,
      customer_phone: req.body.customerPhone,
      items: req.body.items,
      total: req.body.total
    });
    res.json({ success: true, billId: newBill._id });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// BILLS HISTORY
app.get('/bills', async (req, res) => {
  try {
    const bills = await db.Bill.find().sort({ date: -1 });
    res.json(bills);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// DELETE BILL
app.delete('/bills/:id', async (req, res) => {
  try {
    await db.Bill.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PRINT BILL (Vercel Optimized)
app.get('/print-bill/:id', async (req, res) => {
  try {
    const bill = await db.Bill.findById(req.params.id);
    if (!bill) return res.status(404).send('Bill not found');

    const doc = new PDFDocument({ size: [226, 600], margin: 10 });
    res.setHeader('Content-Type', 'application/pdf');
    doc.pipe(res);

    doc.font('Helvetica-Bold').fontSize(14).text('OM SAI FAMILY RESTAURANT', { align: 'center' });
    doc.font('Helvetica').fontSize(8).text('Veg & Non-Veg | Free Wi-Fi', { align: 'center' });
    doc.text('Bypass Road, Samudrapur', { align: 'center' });
    doc.fontSize(10).text('-----------------------------------', { align: 'center' });

    doc.fontSize(9).text(`Bill No: ${bill.billNumber}`);
    doc.text(`Phone: ${bill.customer_phone}`);

    // INDIAN TIME FORMATTING
    const dateStr = new Date(bill.date).toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
    doc.text(`Date: ${dateStr}`);
    
    doc.text('-----------------------------------');

    bill.items.forEach(item => {
      doc.text(`${item.name} x${item.quantity}  Rs. ${(item.price * item.quantity).toFixed(2)}`);
    });

    doc.text('-----------------------------------');
    doc.fontSize(11).font('Helvetica-Bold').text(`TOTAL: Rs. ${bill.total.toFixed(2)}`, { align: 'right' });
    doc.moveDown(1);
    doc.font('Helvetica').fontSize(8).text('Thank you, visit again!', { align: 'center' });
    
    doc.end();
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// IMPORTANT FOR VERCEL
if (process.env.NODE_ENV !== 'production') {
  app.listen(port, () => console.log(`Server running on port ${port}`));
}


module.exports = app;
 
