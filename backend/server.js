const express = require('express');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const connectDB = require('./config/db');
const authRoutes = require ('./routes/authRoutes');
const opportunityRoutes = require('./routes/opportunityRoutes');
const tagRoutes = require('./routes/tagRoutes');
const userRoutes = require('./routes/userRoutes');
const contactRoutes = require('./routes/contactRoutes');
const adminRoutes = require('./routes/adminRoutes');
const cors = require('cors');

dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(__dirname, '.env') });

if (!process.env.JWT_SECRET) {
  console.warn('Warning: JWT_SECRET is not set. Using development fallback secret. Set JWT_SECRET in backend/.env for production.');
  process.env.JWT_SECRET = 'development_jwt_secret';
}

const createAdminUser = async () => {
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;
  const adminName = process.env.ADMIN_NAME || 'Administrator';

  if (!adminEmail || !adminPassword) {
    console.warn('Admin user not created: ADMIN_EMAIL or ADMIN_PASSWORD is missing in backend/.env');
    return;
  }

  const existingAdmin = await User.findOne({ role: 'admin' });
  if (existingAdmin) {
    console.log('Admin user already exists:', existingAdmin.email);
    return;
  }

  const existingUser = await User.findOne({ email: adminEmail });
  if (existingUser) {
    console.warn(`Admin user was not created because the email ${adminEmail} already exists as a non-admin account.`);
    return;
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(adminPassword, salt);

  const adminUser = new User({
    name: adminName,
    email: adminEmail,
    password: hashedPassword,
    role: 'admin',
    isVerified: true,
  });

  await adminUser.save();
  console.log(`Created admin user: ${adminEmail}`);
};

const startServer = async () => {
  await connectDB();
  await createAdminUser();

  const app = express();
  app.use(express.json());
  app.use(express.urlencoded({extended: true}));
  app.use(cors());

  // Serve static files from the React app (works both before/after monorepo split)
  const distCandidates = [
    path.join(__dirname, 'frontend/dist'),          
    path.join(__dirname, '../frontend/dist')         
  ];
  const distPath = distCandidates.find(p => fs.existsSync(p)) || distCandidates[0];
  app.use(express.static(distPath));

  app.use('/api/auth', authRoutes);

  app.use('/api/opportunities', opportunityRoutes);

  app.use('/api/tags', tagRoutes);

  app.use('/api/user', userRoutes);

  app.use('/api/contact', contactRoutes);

  app.use('/api/admin', adminRoutes);

  app.use((req, res, next) => {
    if (
      req.method === 'GET' &&
      !req.path.startsWith('/api') &&
      !req.path.includes('.')
    ) {
      const indexCandidates = [
        path.join(__dirname, 'frontend/dist', 'index.html'),
        path.join(__dirname, '../frontend/dist', 'index.html')
      ];
      const indexPath = indexCandidates.find(p => fs.existsSync(p)) || indexCandidates[0];
      res.sendFile(indexPath);
    } else {
      next();
    }
  });

  const port = process.env.PORT || 5000;

  app.listen(port, () => {
      console.log(`Server running at http://localhost:${port}`);
  });
};

startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

