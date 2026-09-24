import React from "react"

let Login = React.lazy(() => import('./pages/Login'))
let AdminPanel = React.lazy(() => import('./pages/AdminPanel'))
let ArticleDetail = React.lazy(() => import('./pages/ArticleDetail'))
let ABC = React.lazy(() => import('./pages/ArticleByCategory'))
let SourcePage = React.lazy(() => import('./pages/SourcePage'))
let PrivacyPolicy = React.lazy(() => import('./pages/PrivacyPolicy'))
let TermsConditions = React.lazy(() => import('./pages/TermsConditions'))
let RefundPolicy = React.lazy(() => import('./pages/RefundPolicy'))
let DeleteAccount = React.lazy(() => import('./pages/DeleteAccount'))
let CopyrightClaims = React.lazy(() => import('./pages/CopyrightClaims'))
let AboutUs = React.lazy(() => import('./pages/AboutUs'))
let MediaBiasDetails = React.lazy(() => import('./pages/MediaBiasDetails'))
let ContactUs = React.lazy(() => import('./pages/ContactUs'))
let Bookmarks = React.lazy(() => import('./pages/Bookmarks'))
let Donate = React.lazy(() => import('./pages/Donate'))
let DonateStatus = React.lazy(() => import('./pages/DonateStatus'))

export const routes = [
    {path: "/login", element: <Login />},
    {path: "/admin", element: <AdminPanel />},
    {path: "/article/:id", element: <ArticleDetail />},
    {path: "/category/:cat", element: <ABC />},
    {path: "/source/:id", element: <SourcePage />},
    // Privacy Policy - multiple aliases for PhonePe compliance
    {path: "/privacy-policy", element: <PrivacyPolicy />},
    {path: "/privacy", element: <PrivacyPolicy />},
    {path: "/privacypolicy", element: <PrivacyPolicy />},
    // Terms & Conditions - multiple aliases for PhonePe compliance
    {path: "/terms-conditions", element: <TermsConditions />},
    {path: "/terms-and-conditions", element: <TermsConditions />},
    {path: "/terms", element: <TermsConditions />},
    {path: "/termsandconditions", element: <TermsConditions />},
    {path: "/terms-of-use", element: <TermsConditions />},
    // Refund Policy - multiple aliases for PhonePe compliance
    {path: "/refund-policy", element: <RefundPolicy />},
    {path: "/refund", element: <RefundPolicy />},
    {path: "/refundpolicy", element: <RefundPolicy />},
    {path: "/cancellation-policy", element: <RefundPolicy />},
    {path: "/delete-account", element: <DeleteAccount />},
    {path: "/copyright-claims", element: <CopyrightClaims />},
    {path: "/about", element: <AboutUs />},
    {path: "/media-bias-details", element: <MediaBiasDetails />},
    {path: "/contact", element: <ContactUs />},
    {path: "/bookmarks", element: <Bookmarks />},
    // Donate / Payment
    {path: "/donate", element: <Donate />},
    {path: "/donate/status", element: <DonateStatus />}
]