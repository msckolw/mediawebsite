import React from "react"

let Login = React.lazy(() => import('./pages/Login'))
let AdminPanel = React.lazy(() => import('./pages/AdminPanel'))
let ArticleDetail = React.lazy(() => import('./pages/ArticleDetail'))
let ABC = React.lazy(() => import('./pages/ArticleByCategory'))
let SourcePage = React.lazy(() => import('./pages/SourcePage'))

export const routes = [
    {path: "/login", element: <Login />},
    {path: "/admin", element: <AdminPanel />},
    {path: "/article/:id", element: <ArticleDetail />},
    {path: "/category/:cat", element: <ABC />},
    {path: "/source/:id", element: <SourcePage />}
]