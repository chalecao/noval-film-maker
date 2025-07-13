import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import TryPage from './pages/TryPage';
import PlayPage from './pages/PlayPage';
import BookshelfPage from './pages/BookshelfPage'; // 新增导入
import './index.css';

function App() {
  return (
    <Router basename="/tool/noval/">
      <div className="min-h-screen bg-gray-900">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/try" element={<TryPage />} />
          <Route path="/play" element={<PlayPage />} />
          <Route path="/bookshelf" element={<BookshelfPage />} /> {/* 新增路由 */}
        </Routes>
      </div>
    </Router>
  );
}

export default App;