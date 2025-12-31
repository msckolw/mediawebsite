import React from "react"

let Login = React.lazy(() => import('./pages/Login'))
let AdminPanel = React.lazy(() => import('./pages/AdminPanel'))
let ArticleDetail = React.lazy(() => import('./pages/ArticleDetail'))
let ABC = React.lazy(() => import('./pages/ArticleByCategory'))
let SourcePage = React.lazy(() => import('./pages/SourcePage'))
let PrivacyPolicy = React.lazy(() => import('./pages/PrivacyPolicy'))
let TermsConditions = React.lazy(() => import('./pages/TermsConditions'))
let AboutUs = React.lazy(() => import('./pages/AboutUs'))
let MediaBiasDetails = React.lazy(() => import('./pages/MediaBiasDetails'))
let ContactUs = React.lazy(() => import('./pages/ContactUs'))
let Bookmarks = React.lazy(() => import('./pages/Bookmarks'))

export const routes = [
    {path: "/login", element: <Login />},
    {path: "/admin", element: <AdminPanel />},
    {path: "/article/:id", element: <ArticleDetail />},
    {path: "/category/:cat", element: <ABC />},
    {path: "/source/:id", element: <SourcePage />},
    {path: "/privacy-policy", element: <PrivacyPolicy />},
    {path: "/terms-conditions", element: <TermsConditions />},
    {path: "/about", element: <AboutUs />},
    {path: "/media-bias-details", element: <MediaBiasDetails />},
    {path: "/contact", element: <ContactUs />},
    {path: "/bookmarks", element: <Bookmarks />}
]