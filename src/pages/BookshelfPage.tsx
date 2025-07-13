import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

interface Book {
    name: string;
    path: string;
    cover?: string;
    author?: string;
}

const BookshelfPage: React.FC = () => {
    const navigate = useNavigate();
    const [books, setBooks] = useState<Book[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // 获取书籍数据
    useEffect(() => {
        const fetchBooks = async () => {
            try {
                const response = await fetch('./assets/books/all.json');
                const data = await response.json();
                setBooks(data);
                setLoading(false);
            } catch (err) {
                setError('加载书架失败，请重试');
                setLoading(false);
            }
        };
        fetchBooks();
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 flex items-center justify-center">
                <div className="text-center text-white">
                    <div className="w-8 h-8 border-4 border-t-purple-400 border-solid rounded-full animate-spin mx-auto mb-4"></div>
                    <p>加载书架中...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 flex items-center justify-center">
                <div className="text-center text-white max-w-md px-6">
                    <p className="text-red-400 mb-4">{error}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="px-6 py-2 bg-purple-500 rounded-full hover:bg-purple-600 transition-colors"
                    >
                        重试
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 text-white">
            {/* 头部导航 */}
            <header className="p-6 border-b border-white/10">
                <div className="flex items-center justify-between mx-auto">
                    <button
                        onClick={() => navigate('/')}
                        className="flex items-center space-x-2 px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 transition-all duration-300"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        <span>返回首页</span>
                    </button>

                    <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                        小说电影书架
                    </h1>

                    <div className="w-24"></div>
                </div>
            </header>

            {/* 瀑布流书架 */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-8 p-8">
                {books.map((book, index) => (
                    <motion.div
                        key={book.name}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1, duration: 0.3 }}
                        className="relative cursor-pointer group"
                        onClick={() => navigate(`/play?book=${encodeURIComponent(book.path)}`)}
                    >
                        {/* 书本卡片 */}
                        <div style={{
                            background: `linear-gradient(160deg,#f0e6d6 85%, #d0c6b6 100%)`,
                            borderRadius: '4px 12px 12px 4px',
                            boxShadow: '-5px 5px 15px rgba(0,0,0,0.2)',
                            height: '220px',
                            padding: '1.5rem',
                            position: 'relative'
                        }}>
                            {/* 书脊侧边 */}
                            <div className="absolute inset-y-0 left-0 w-2 bg-gradient-to-b from-[#c0b6a6] to-[#a09686] rounded-l-4" />

                            {/* 书本内容 */}
                            <div className="h-full flex flex-col justify-between">
                                <div className="text-center">
                                    {book.cover ? (
                                        <img src={book.cover} alt={book.name} className="mx-auto h-30 w-20 object-cover rounded" />
                                    ) : (
                                        <div className="mx-auto h-12 w-12 bg-gray-200 rounded" />
                                    )}
                                </div>
                                <p className="font-medium text-sm text-[#332d26] text-center truncate mt-auto">{book.name}</p>
                                <p className="text-xs text-[#6b5b4b] text-center mt-auto">{book.author || '未知作者'}</p>
                            </div>
                        </div>

                        {/* 悬停阴影 */}
                        <motion.div
                            className="absolute inset-0"
                            initial={{ opacity: 0 }}
                            whileHover={{ opacity: 1 }}
                            transition={{ duration: 0.3 }}
                        >
                            <div className="w-full h-full rounded-2xl shadow-2xl shadow-purple-500/20" />
                        </motion.div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
};

export default BookshelfPage;
