import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import ReactFlow, {
  Node,
  Edge,
  addEdge,
  Connection,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  MiniMap,
} from 'react-flow-renderer';
import {
  Upload,
  ArrowLeft,
  FileText,
  Loader2,
  CheckCircle,
  AlertCircle,
  BookOpen,
  Brain,
  Wand2,
  Scissors,
  Play
} from 'lucide-react';
import { labels } from '../i18n/config';

interface ProcessingStatus {
  stage: string;
  progress: number;
  message: string;
  isComplete: boolean;
}

const TryPage: React.FC = () => {
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState<ProcessingStatus | null>(null);
  const [showFlow, setShowFlow] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [books, setBooks] = useState<Array<{ name: string; path: string }>>([]);  // 新增书籍状态

  // Agent节点配置
  const agentNodes = [
    { id: 'upload', label: '文件上传', icon: Upload, color: '#6366f1', position: { x: 100, y: 50 } },
    { id: 'script', label: '编导Agent', icon: BookOpen, color: '#3b82f6', position: { x: 300, y: 50 } },
    { id: 'director', label: '导演Agent', icon: Brain, color: '#8b5cf6', position: { x: 300, y: 150 } },
    { id: 'production', label: '制作Agent', icon: Wand2, color: '#10b981', position: { x: 300, y: 250 } },
    { id: 'editor', label: '剪辑Agent', icon: Scissors, color: '#f59e0b', position: { x: 500, y: 150 } },
    { id: 'complete', label: '完成', icon: CheckCircle, color: '#ef4444', position: { x: 500, y: 250 } }
  ];

  const initialNodes: Node[] = agentNodes.map(node => ({
    id: node.id,
    type: 'default',
    position: node.position,
    data: {
      label: (
        <div className="flex items-center space-x-2 px-4 py-2">
          <node.icon className="h-4 w-4" />
          <span className="text-sm font-medium">{node.label}</span>
        </div>
      )
    },
    style: {
      background: node.color,
      color: 'white',
      border: 'none',
      borderRadius: '12px',
      fontSize: '12px',
      opacity: 0.3
    }
  }));

  const initialEdges: Edge[] = [
    { id: 'e1-2', source: 'upload', target: 'script', animated: false, style: { stroke: '#6366f1', strokeWidth: 2, opacity: 0.3 } },
    { id: 'e2-3', source: 'script', target: 'director', animated: false, style: { stroke: '#3b82f6', strokeWidth: 2, opacity: 0.3 } },
    { id: 'e3-4', source: 'director', target: 'production', animated: false, style: { stroke: '#8b5cf6', strokeWidth: 2, opacity: 0.3 } },
    { id: 'e4-5', source: 'production', target: 'editor', animated: false, style: { stroke: '#10b981', strokeWidth: 2, opacity: 0.3 } },
    { id: 'e5-6', source: 'editor', target: 'complete', animated: false, style: { stroke: '#f59e0b', strokeWidth: 2, opacity: 0.3 } },
    { id: 'e5-3', source: 'editor', target: 'director', animated: false, style: { stroke: '#f472b6', strokeWidth: 2, opacity: 0.3 } }
  ];

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onConnect = useCallback((params: Connection) => setEdges((eds) => addEdge(params, eds)), [setEdges]);

  // 更新节点状态
  const updateNodeStatus = (nodeId: string, status: 'active' | 'completed' | 'inactive') => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === nodeId) {
          let opacity = 0.3;
          let animated = false;

          if (status === 'active') {
            opacity = 1;
            animated = true;
          } else if (status === 'completed') {
            opacity = 1;
          }

          return {
            ...node,
            style: {
              ...node.style,
              opacity,
              boxShadow: status === 'active' ? '0 0 20px rgba(99, 102, 241, 0.5)' : 'none'
            }
          };
        }
        return node;
      })
    );

    // 更新边的状态
    setEdges((eds) =>
      eds.map((edge) => {
        const shouldAnimate =
          (edge.source === 'upload' && (nodeId === 'script' || nodeId === 'director' || nodeId === 'production' || nodeId === 'editor' || nodeId === 'complete')) ||
          (edge.source === 'script' && (nodeId === 'director' || nodeId === 'production' || nodeId === 'editor' || nodeId === 'complete')) ||
          (edge.source === 'director' && (nodeId === 'production' || nodeId === 'editor' || nodeId === 'complete')) ||
          (edge.source === 'production' && (nodeId === 'editor' || nodeId === 'complete')) ||
          (edge.source === 'editor' && nodeId === 'complete');

        return {
          ...edge,
          animated: shouldAnimate && status === 'active',
          style: {
            ...edge.style,
            opacity: shouldAnimate ? 1 : 0.3
          }
        };
      })
    );
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = event.target.files?.[0];
    if (uploadedFile && uploadedFile.type === 'text/plain') {
      setFile(uploadedFile);
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const droppedFile = event.dataTransfer.files[0];
    if (droppedFile && droppedFile.type === 'text/plain') {
      setFile(droppedFile);
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  const fetchBooks = async () => {
    try {
      const books = localStorage.getItem('books') || '[]';
      const response = await fetch('/assets/books/all.json');
      const data = await response.json();
      // 过滤 file 中存在的书籍
      const filteredBooks = data.filter((book: string) => book?.name?.includes(file?.name));
      // 合并本地和服务器数据
      const mergedBooks = [...JSON.parse(books), ...filteredBooks];
      // 保存到localStorage
      localStorage.setItem('books', JSON.stringify(mergedBooks));
      console.log('mergedBooks', mergedBooks);
      setBooks(mergedBooks);
    } catch (error) {
      console.error('获取书籍列表失败:', error);
    }
  };

  const processNovel = async () => {
    if (!file) return;

    setIsProcessing(true);
    setShowFlow(true);
    updateNodeStatus('upload', 'completed');

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('http://localhost:8000/process-novel', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('处理失败');
      }

      // 监听处理进度
      const eventSource = new EventSource('http://localhost:8000/processing-status');
      eventSource.onmessage = (event) => {
        console.log('Received event:', event.data);
        const status = JSON.parse(event.data);
        setProcessingStatus(status);

        // 根据处理阶段更新节点状态
        switch (status.stage) {
          case 'splitting':
          case 'scripting':
            updateNodeStatus('script', 'active');
            break;
          case 'designing':
            updateNodeStatus('script', 'completed');
            updateNodeStatus('director', 'active');
            break;
          case 'generating':
            updateNodeStatus('director', 'completed');
            updateNodeStatus('production', 'active');
            break;
          case 'editing':
            updateNodeStatus('production', 'completed');
            updateNodeStatus('editor', 'active');
            break;
          case 'finalizing':
          case 'completed':
            updateNodeStatus('editor', 'completed');
            updateNodeStatus('complete', 'active');
            break;
        }

        if (status.isComplete) {
          eventSource.close();
          fetchBooks();
        }
      };

    } catch (error) {
      console.error('处理错误:', error);
      setIsProcessing(false);
      setProcessingStatus({
        stage: 'error',
        progress: 0,
        message: '处理失败，请重试',
        isComplete: false
      });
    }
  };

  // 新增获取书籍数据逻辑
  useEffect(() => {

    fetchBooks();
  }, []);  // 组件挂载时加载

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 text-white">
      {/* Header */}
      <header className="p-6 border-b border-white/10">
        <div className="flex items-center justify-between mx-auto">
          <button
            onClick={() => navigate('/')}
            className="flex items-center space-x-2 px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 transition-all duration-300"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>{labels.agent.returnHome}</span>
          </button>

          <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            AI小说动画生成器
          </h1>

          <div className="w-24"></div>
        </div>
      </header>

      <div className="flex flex-row">
        <div className="mt-8 p-6 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20">
          <div className="font-bold mb-6 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            我的小说书架
          </div>
          <div className="grid grid-cols-1 overflow-auto" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '16px' }}>
            {books.map((book, index) => (
              <motion.div
                key={book.name}
                className="relative p-4 cursor-pointer"
                style={{
                  width: '130px',
                  height: '160px',
                  background: `linear-gradient(160deg,#f0e6d6 85%, #d0c6b6 100%)`,
                  borderRadius: '4px 12px 12px 4px',
                  boxShadow: '-5px 5px 15px rgba(0,0,0,0.2)',
                  perspective: '1000px'
                }}
                onClick={() => navigate(`/play?book=${encodeURIComponent(book.path)}`)}
              >
                {/* 书脊侧边 */}
                <div className="absolute inset-y-0 left-0 w-2 bg-gradient-to-b from-[#c0b6a6] to-[#a09686] rounded-l-4" />

                {/* 书本内容区域 */}
                <div className="h-full px-4 pt-8 flex flex-col justify-between">
                  <div className="text-center">
                    <BookOpen className="mx-auto h-6 w-6 text-[#6b5b4b] mb-2 opacity-80" />
                  </div>
                  <p className="font-medium text-sm text-[#332d26] truncate">
                    {book.name}
                  </p>
                  <p className="text-xs text-[#6b5b4b] text-center mt-auto">查看动画</p>
                </div>
              </motion.div>
            ))}
            {books?.length == 0 ? (
              <div className="col-span-4 text-center text-gray-400">
                <p>暂无小说，请上传您的小说文件</p>
              </div>
            ) : null}
          </div>
        </div>

        <div className="container mx-auto px-6 mt-8">
          <AnimatePresence mode="wait">
            {!showFlow ? (
              <motion.div
                key="upload"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="max-w-2xl mx-auto"
              >
                {/* Upload Section */}
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20 mb-8">
                  <div className="text-center mb-8">
                    <FileText className="mx-auto h-16 w-16 text-blue-400 mb-4" />
                    <h2 className="text-3xl font-bold mb-4">{labels.agent.upload}</h2>
                    <p className="text-gray-300">{labels.agent.uploadDesc1}</p>
                  </div>

                  <div
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    className="border-2 border-dashed border-blue-400/50 rounded-xl p-12 text-center hover:border-blue-400 transition-colors cursor-pointer"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="mx-auto h-12 w-12 text-blue-400 mb-4" />
                    <p className="text-lg mb-2">{labels.agent.uploadDesc2}</p>
                    <p className="text-sm text-gray-400">{labels.agent.uploadDesc1}</p>

                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".txt"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </div>

                  {file && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-6 p-4 bg-green-500/20 border border-green-500/30 rounded-lg"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <CheckCircle className="h-5 w-5 text-green-400" />
                          <div>
                            <p className="font-medium">{file.name}</p>
                            <p className="text-sm text-gray-400">
                              {(file.size / 1024).toFixed(1)} KB
                            </p>
                          </div>
                        </div>

                        <button
                          onClick={processNovel}
                          disabled={isProcessing}
                          className="flex items-center space-x-2 px-6 py-3 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105"
                        >
                          {isProcessing ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" />
                              <span>处理中...</span>
                            </>
                          ) : (
                            <>
                              <Play className="h-4 w-4" />
                              <span>开始生成</span>
                            </>
                          )}
                        </button>
                      </div>
                    </motion.div>
                  )}
                </div>

                {/* Instructions */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {[
                    {
                      icon: BookOpen,
                      title: "准备小说",
                      description: "上传txt格式的小说文件，确保章节分明"
                    },
                    {
                      icon: Brain,
                      title: "AI分析",
                      description: "AI智能分析内容，生成专业剧本和场景"
                    },
                    {
                      icon: Play,
                      title: "观看动画",
                      description: "享受AI生成的精美动画和沉浸式体验"
                    }
                  ].map((step, index) => {
                    const Icon = step.icon;
                    return (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="p-6 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10"
                      >
                        <Icon className="h-8 w-8 text-purple-400 mb-4" />
                        <h3 className="text-lg font-semibold mb-2">{step.title}</h3>
                        <p className="text-gray-400 text-sm">{step.description}</p>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="flow"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="h-[600px] bg-white/5 backdrop-blur-sm rounded-2xl border border-white/20 overflow-hidden"
              >
                {/* Flow Header */}
                <div className="p-6 border-b border-white/10">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-bold mb-2">AI Agent 工作流程</h2>
                      <p className="text-gray-400">实时查看AI处理进度</p>
                    </div>

                    {processingStatus && (
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <p className="text-sm text-gray-400">当前阶段</p>
                          <p className="font-semibold">{processingStatus.message}</p>
                        </div>
                        <div className="w-16 h-16 relative">
                          <svg className="w-16 h-16 transform -rotate-90">
                            <circle
                              cx="32"
                              cy="32"
                              r="28"
                              stroke="currentColor"
                              strokeWidth="4"
                              fill="none"
                              className="text-gray-700"
                            />
                            <circle
                              cx="32"
                              cy="32"
                              r="28"
                              stroke="currentColor"
                              strokeWidth="4"
                              fill="none"
                              strokeDasharray={`${2 * Math.PI * 28}`}
                              strokeDashoffset={`${2 * Math.PI * 28 * (1 - processingStatus.progress / 100)}`}
                              className="text-purple-400 transition-all duration-300"
                            />
                          </svg>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-sm font-bold">{processingStatus.progress}%</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* React Flow */}
                <div className="h-[500px]">
                  <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    onConnect={onConnect}
                    fitView
                    attributionPosition="bottom-left"
                  >
                    <Controls className="bg-white/10 border-white/20" />
                    <Background color="#ffffff" gap={20} size={1} className="opacity-10" />
                    <MiniMap
                      className="bg-white/10 border border-white/20 rounded-lg"
                      nodeColor="#8b5cf6"
                      maskColor="rgba(0, 0, 0, 0.2)"
                    />
                  </ReactFlow>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Status Messages */}
          {processingStatus && processingStatus.stage === 'error' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-2xl mx-auto mt-8 p-4 bg-red-500/20 border border-red-500/30 rounded-lg"
            >
              <div className="flex items-center space-x-3">
                <AlertCircle className="h-5 w-5 text-red-400" />
                <div>
                  <p className="font-medium text-red-300">处理失败</p>
                  <p className="text-sm text-red-400">{processingStatus.message}</p>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TryPage;