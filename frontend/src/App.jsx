import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './hooks/useAuth.jsx';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import OpportunitiesPage from './pages/OpportunitiesPage';
import OpportunityDetailPage from './pages/OpportunityDetailPage';
import ProfilePage from './pages/ProfilePage';
import MyApplicationsPage from './pages/MyApplicationsPage';
import MyOpportunitiesPage from './pages/MyOpportunitiesPage';
import SavedOpportunitiesPage from './pages/SavedOpportunitiesPage';
import CreateOpportunityPage from './pages/CreateOpportunityPage';
import EditOpportunityPage from './pages/EditOpportunityPage';
import AboutPage from './pages/AboutPage';
import ContactPage from './pages/ContactPage';
import NotFoundPage from './pages/NotFoundPage';
import SignInPage from './pages/SignInPage';
import SignUpPage from './pages/SignUpPage';
import EmailVerificationPage from './pages/EmailVerificationPage';
import AdminDashboard from './pages/AdminDashboard';
import UsersList from './pages/admin/UsersList';
import OpportunitiesList from './pages/admin/OpportunitiesList';
import AdminRoute from './components/AdminRoute';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/signin" element={<SignInPage />} />
            <Route path="/signup" element={<SignUpPage />} />
            <Route path="/verify-email" element={<EmailVerificationPage />} />
            <Route path="/opportunities" element={<OpportunitiesPage />} />
            <Route path="/opportunities/:id" element={<OpportunityDetailPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/my-applications" element={<MyApplicationsPage />} />
            <Route path="/my-opportunities" element={<MyOpportunitiesPage />} />
            <Route path="/saved" element={<SavedOpportunitiesPage />} />
            <Route path="/create-opportunity" element={<CreateOpportunityPage />} />
            <Route path="/edit-opportunity/:id" element={<EditOpportunityPage />} />
            <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
            <Route path="/admin/users" element={<AdminRoute><UsersList /></AdminRoute>} />
            <Route path="/admin/opportunities" element={<AdminRoute><OpportunitiesList /></AdminRoute>} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Layout>
      </Router>
    </AuthProvider>
  );
}

export default App;