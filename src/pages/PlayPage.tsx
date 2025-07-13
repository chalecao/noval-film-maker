import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  ArrowLeft,
  Volume2,
  VolumeX,
  Settings,
  Maximize,
  BookOpen,
  Clock,
  AlertCircle,
  Loader2,
  RefreshCw
} from 'lucide-react';

interface Scene {
  id: string;
  chapterIndex: number;
  sceneIndex: number;
  title: string;
  description: string;
  imageUrl: string;
  audioUrl: string;
  animationCode: string;
  duration: number;
}

interface Chapter {
  id: string;
  title: string;
  scenes: Scene[];
}

const PlayPage: React.FC = () => {
  const navigate = useNavigate();
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [currentChapterIndex, setCurrentChapterIndex] = useState(0);
  const [currentSceneIndex, setCurrentSceneIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showControls, setShowControls] = useState(true);
  const [retryCount, setRetryCount] = useState(0);

  const audioRef = useRef<HTMLAudioElement>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const hideControlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 获取URL上的小说ID
  const getNovelIdFromUrl = () => {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('book');
  };

  // 获取章节数据
  const fetchChapters = async (retry = false) => {
    try {
      if (retry) {
        setError(null);
        setLoading(true);
      }

      const response = await fetch(`./assets/${getNovelIdFromUrl()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      // 验证数据结构
      if (!Array.isArray(data) || data.length === 0) {
        throw new Error('没有找到章节数据，请先上传小说并完成处理');
      }

      // 验证章节数据完整性
      const validChapters = data.filter(chapter =>
        chapter.id &&
        chapter.title &&
        Array.isArray(chapter.scenes) &&
        chapter.scenes.length > 0
      );

      if (validChapters.length === 0) {
        throw new Error('章节数据不完整，请重新处理小说');
      }

      // 验证场景数据完整性
      const processedChapters = validChapters.map(chapter => ({
        ...chapter,
        scenes: chapter.scenes.filter(scene =>
          scene.id &&
          scene.title &&
          scene.description &&
          typeof scene.duration === 'number' &&
          scene.duration > 0
        )
      })).filter(chapter => chapter.scenes.length > 0);

      if (processedChapters.length === 0) {
        throw new Error('场景数据不完整，请重新处理小说');
      }

      setChapters(processedChapters);
      setError(null);
      setRetryCount(0);

    } catch (error) {
      console.error('获取章节数据失败:', error);
      const errorMessage = error instanceof Error ? error.message : '获取数据失败';
      setError(errorMessage);
      setRetryCount(prev => prev + 1);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChapters();
  }, []);

  const currentChapter = chapters[currentChapterIndex];
  const currentScene = currentChapter?.scenes[currentSceneIndex];

  // 播放控制
  const togglePlay = async () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      try {
        // 现代浏览器需要用户交互后才能播放音频
        await audioRef.current.play();
      } catch (err) {
        console.error('播放被浏览器阻止:', err);
        // setError('请先与页面交互（如点击）后再播放');
      }
    }
    setIsPlaying(!isPlaying);
  };

  const nextScene = () => {
    if (currentChapter && currentSceneIndex < currentChapter.scenes.length - 1) {
      setCurrentSceneIndex(currentSceneIndex + 1);
      setProgress(0);
    } else if (currentChapterIndex < chapters.length - 1) {
      setCurrentChapterIndex(currentChapterIndex + 1);
      setCurrentSceneIndex(0);
      setProgress(0);
    } else {
      // 播放完毕
      setIsPlaying(false);
      audioRef.current.pause();
      setProgress(100);
    }
  };

  const prevScene = () => {
    if (currentSceneIndex > 0) {
      setCurrentSceneIndex(currentSceneIndex - 1);
      setProgress(0);
    } else if (currentChapterIndex > 0) {
      setCurrentChapterIndex(currentChapterIndex - 1);
      const prevChapter = chapters[currentChapterIndex - 1];
      setCurrentSceneIndex(prevChapter.scenes.length - 1);
      setProgress(0);
    }
  };

  const jumpToChapter = (chapterIndex: number) => {
    if (chapterIndex >= 0 && chapterIndex < chapters.length) {
      setCurrentChapterIndex(chapterIndex);
      setCurrentSceneIndex(0);
      setProgress(0);
      setIsPlaying(false);
    }
  };

  const jumpToScene = (sceneIndex: number) => {
    if (currentChapter && sceneIndex >= 0 && sceneIndex < currentChapter.scenes.length) {
      setCurrentSceneIndex(sceneIndex);
      setProgress(0);
      setIsPlaying(false);
    }
  };

  // 进度控制
  useEffect(() => {
    if (isPlaying && currentScene) {
      progressIntervalRef.current = setInterval(() => {
        setProgress((prev) => {
          const newProgress = prev + (100 / currentScene.duration);
          if (newProgress >= 100) {
            nextScene();
            return 0;
          }
          return newProgress;
        });
      }, 1000);
    } else {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    }

    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, [isPlaying, currentScene]);

  // 控制栏自动隐藏
  useEffect(() => {
    const resetHideTimer = () => {
      setShowControls(true);
      if (hideControlsTimeoutRef.current) {
        clearTimeout(hideControlsTimeoutRef.current);
      }
      hideControlsTimeoutRef.current = setTimeout(() => {
        if (isPlaying) {
          setShowControls(false);
        }
      }, 3000);
    };

    resetHideTimer();
    return () => {
      if (hideControlsTimeoutRef.current) {
        clearTimeout(hideControlsTimeoutRef.current);
      }
    };
  }, [isPlaying, currentScene]);

  // 动态注入CSS动画
  useEffect(() => {
    if (currentScene?.animationCode) {
      const styleElement = document.createElement('style');
      styleElement.textContent = currentScene.animationCode;
      styleElement.id = `scene-animation-${currentScene.id}`;
      document.head.appendChild(styleElement);

      return () => {
        const existingStyle = document.getElementById(`scene-animation-${currentScene.id}`);
        if (existingStyle) {
          document.head.removeChild(existingStyle);
        }
      };
    }
  }, [currentScene]);

  // 键盘控制
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      switch (event.code) {
        case 'Space':
          event.preventDefault();
          togglePlay();
          break;
        case 'ArrowRight':
          event.preventDefault();
          nextScene();
          break;
        case 'ArrowLeft':
          event.preventDefault();
          prevScene();
          break;
        case 'KeyM':
          event.preventDefault();
          setIsMuted(!isMuted);
          break;
        case 'KeyF':
          event.preventDefault();
          setIsFullscreen(!isFullscreen);
          break;
        case 'Escape':
          if (isFullscreen) {
            setIsFullscreen(false);
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => {
      document.removeEventListener('keydown', handleKeyPress);
    };
  }, [isPlaying, isMuted, isFullscreen]);

  // 加载状态
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 flex items-center justify-center">
        <div className="text-center text-white">
          <Loader2 className="h-16 w-16 mx-auto mb-4 text-purple-400 animate-spin" />
          <h2 className="text-2xl font-bold mb-2">加载章节数据中...</h2>
          <p className="text-gray-400">请稍候，正在获取您的小说场景</p>
        </div>
      </div>
    );
  }

  // 错误状态
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 flex items-center justify-center">
        <div className="text-center text-white max-w-md mx-auto px-6">
          <AlertCircle className="h-16 w-16 mx-auto mb-4 text-red-400" />
          <h2 className="text-2xl font-bold mb-4">获取数据失败</h2>
          <p className="text-gray-300 mb-6 leading-relaxed">{error}</p>

          <div className="space-y-4">
            <button
              onClick={() => fetchChapters(true)}
              disabled={loading}
              className="flex items-center space-x-2 px-6 py-3 bg-purple-500 hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors mx-auto"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              <span>重试</span>
            </button>

            <button
              onClick={() => navigate('/try')}
              className="flex items-center space-x-2 px-6 py-3 bg-gray-600 hover:bg-gray-700 rounded-lg transition-colors mx-auto"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>返回上传页面</span>
            </button>
          </div>

          {retryCount > 0 && (
            <p className="text-sm text-gray-500 mt-4">
              已重试 {retryCount} 次
            </p>
          )}
        </div>
      </div>
    );
  }

  // 无数据状态
  if (!currentScene) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 flex items-center justify-center">
        <div className="text-center text-white max-w-md mx-auto px-6">
          <BookOpen className="h-16 w-16 mx-auto mb-4 text-gray-400" />
          <h2 className="text-2xl font-bold mb-4">暂无播放内容</h2>
          <p className="text-gray-400 mb-6 leading-relaxed">
            没有找到可播放的场景数据。请确保已成功上传小说并完成AI处理流程。
          </p>
          <button
            onClick={() => navigate('/try')}
            className="flex items-center space-x-2 px-6 py-3 bg-purple-500 hover:bg-purple-600 rounded-lg transition-colors mx-auto"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>返回上传页面</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`relative min-h-screen bg-black overflow-hidden ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}
      onMouseMove={() => setShowControls(true)}
    >
      {/* 场景背景 */}
      <div className="absolute inset-0">
        <motion.img
          key={currentScene.id}
          src={currentScene.imageUrl}
          alt={currentScene.title}
          className="w-full h-full object-cover scene-animation"
          initial={{ opacity: 0, scale: 1.1 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1 }}
          onError={(e) => {
            // 图片加载失败时使用默认背景
            const target = e.target as HTMLImageElement;
            target.src = 'https://images.pexels.com/photos/531880/pexels-photo-531880.jpeg?auto=compress&cs=tinysrgb&w=800';
          }}
        />
        <div className="absolute inset-0 bg-black/30"></div>
      </div>

      {/* 场景内容 */}
      <div className="z-10 h-full w-full flex flex-col absolute">
        {/* 顶部信息栏 */}
        <AnimatePresence>
          {showControls && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="p-6 bg-gradient-to-b from-black/60 to-transparent"
            >
              <div className="flex items-center justify-between">
                <button
                  onClick={() => navigate('/')}
                  className="flex items-center space-x-2 px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm transition-all duration-300"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>返回</span>
                </button>

                <div className="text-center">
                  <h1 className="text-xl font-bold text-white mb-1">
                    {currentChapter?.title}
                  </h1>
                  <p className="text-sm text-gray-300">
                    场景 {currentSceneIndex + 1} / {currentChapter?.scenes.length}
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setIsMuted(!isMuted)}
                    className="p-2 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm transition-all duration-300"
                  >
                    {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                  </button>
                  <button
                    onClick={() => setIsFullscreen(!isFullscreen)}
                    className="p-2 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm transition-all duration-300"
                  >
                    <Maximize className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 中央场景描述 */}
        <div className="flex-1 flex items-center justify-center p-6">
          <motion.div
            key={currentScene.id}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center max-w-4xl"
          >
            <h2 className="text-4xl md:text-6xl font-bold text-white mb-6 drop-shadow-lg">
              {currentScene.title}
            </h2>
            <p className="text-lg md:text-xl text-gray-200 leading-relaxed drop-shadow-md">
              {currentScene.description}
            </p>
          </motion.div>
        </div>

        {/* 底部控制栏 */}
        <AnimatePresence>
          {showControls && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="p-6 bg-gradient-to-t from-black/60 to-transparent absolute w-full bottom-0"
            >
              {/* 进度条 */}
              <div className="mb-4">
                <div className="w-full bg-white/20 rounded-full h-1 mb-2">
                  <div
                    className="bg-purple-500 h-1 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-xs text-gray-300">
                  <span className="flex items-center space-x-1">
                    <Clock className="h-3 w-3" />
                    <span>{Math.floor((currentScene.duration * progress) / 100)}s</span>
                  </span>
                  <span>{currentScene.duration}s</span>
                </div>
              </div>

              {/* 播放控制 */}
              <div className="flex items-center justify-center space-x-6 mb-4">
                <button
                  onClick={prevScene}
                  disabled={currentChapterIndex === 0 && currentSceneIndex === 0}
                  className="p-3 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                >
                  <SkipBack className="h-5 w-5" />
                </button>

                <button
                  onClick={togglePlay}
                  className="p-4 rounded-full bg-purple-500 hover:bg-purple-600 transition-all duration-300 transform hover:scale-105"
                >
                  {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
                </button>

                <button
                  onClick={nextScene}
                  disabled={
                    currentChapterIndex === chapters.length - 1 &&
                    currentSceneIndex === currentChapter.scenes.length - 1
                  }
                  className="p-3 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                >
                  <SkipForward className="h-5 w-5" />
                </button>
              </div>

              {/* 章节导航 */}
              <div className="flex justify-center space-x-2 overflow-x-auto pb-2">
                {chapters.map((chapter, index) => (
                  <button
                    key={chapter.id}
                    onClick={() => jumpToChapter(index)}
                    className={`px-3 py-1 rounded-full text-xs whitespace-nowrap transition-all duration-300 ${index === currentChapterIndex
                      ? 'bg-purple-500 text-white'
                      : 'bg-white/10 text-gray-300 hover:bg-white/20'
                      }`}
                  >
                    第{index + 1}章
                  </button>
                ))}
              </div>

              {/* 场景导航 */}
              {currentChapter && currentChapter.scenes.length > 1 && (
                <div className="flex justify-center space-x-1 mt-2 overflow-x-auto">
                  {currentChapter.scenes.map((scene, index) => (
                    <button
                      key={scene.id}
                      onClick={() => jumpToScene(index)}
                      className={`w-2 h-2 rounded-full transition-all duration-300 ${index === currentSceneIndex
                        ? 'bg-purple-400'
                        : 'bg-white/30 hover:bg-white/50'
                        }`}
                      title={scene.title}
                    />
                  ))}
                </div>
              )}

              {/* 键盘快捷键提示 */}
              <div className="text-center mt-4">
                <p className="text-xs text-gray-500">
                  空格键：播放/暂停 | ←→：切换场景 | M：静音 | F：全屏 | ESC：退出全屏
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 音频元素 */}
      {currentScene.audioUrl && (
        <audio
          ref={audioRef}
          src={currentScene.audioUrl}
          muted={isMuted}
          autoPlay={isPlaying}
          onError={() => {
            console.warn('音频加载失败:', currentScene.audioUrl);
          }}
        />
      )}
    </div>
  );
};

export default PlayPage;