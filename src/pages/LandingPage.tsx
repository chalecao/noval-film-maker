import React, { useState, useEffect, useCallback } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Upload,
  ArrowLeft,
  FileText,
  Loader2,
  CheckCircle,
  AlertCircle,
  Play,
  Github,
  ArrowRight,
  Sparkles,
  Brain,
  Wand2,
  Film,
  Scissors,
  BookOpen,
  Zap,
  Star,
  PaintBucket,
  BookAudio,
  ChevronDown
} from 'lucide-react';
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
import { labels } from '../i18n/config'

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const { scrollY } = useScroll();
  const y1 = useTransform(scrollY, [0, 300], [0, -50]);
  const y2 = useTransform(scrollY, [0, 300], [0, -100]);

  const agentSteps = [
    {
      icon: BookOpen,
      title: "编导Agent",
      description: "智能分析小说内容，按章节生成专业剧本",
      color: "from-blue-500 to-cyan-500",
      status: 'splitting',
    },
    {
      icon: Brain,
      title: "导演Agent",
      description: "设计关键场景、动画效果和镜头语言",
      color: "from-purple-500 to-pink-500",
      status: 'designing',
    },
    {
      icon: Wand2,
      title: "制作Agent",
      description: "生成场景图片、语音素材和动画代码",
      color: "from-green-500 to-emerald-500",
      status: 'generating'
    },
    {
      icon: Scissors,
      title: "剪辑Agent",
      description: "检查连贯性，确保场景完整和质量",
      color: "from-orange-500 to-red-500",
      status: 'editing'
    }
  ];

  // Agent节点配置
  const agentNodes = [
    { id: 'upload', label: '文件上传', icon: Upload, color: '#6366f1', position: { x: 100, y: 50 } },
    { id: 'script', label: '编导Agent', icon: BookOpen, color: '#3b82f6', position: { x: 300, y: 50 } },
    { id: 'director', label: '导演Agent', icon: Brain, color: '#8b5cf6', position: { x: 300, y: 150 } },
    { id: 'production', label: '制作Agent', icon: Wand2, color: '#10b981', position: { x: 300, y: 250 } },
    { id: 'editor', label: '剪辑Agent', icon: Scissors, color: '#f59e0b', position: { x: 530, y: 150 } },
    { id: 'complete', label: '完成', icon: CheckCircle, color: '#ef4444', position: { x: 530, y: 250 } },
    { id: 'imageTool', label: '绘画Agent', icon: PaintBucket, color: '#10b981', position: { x: 100, y: 350 } },
    { id: 'audioTool', label: '音频Agent', icon: BookAudio, color: '#10b981', position: { x: 270, y: 350 } },
    { id: 'effectTool', label: '特效Agent', icon: Film, color: '#10b981', position: { x: 440, y: 350 } },

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
    { id: 'e4-7', source: 'production', target: 'imageTool', animated: false, style: { stroke: '#10b981', strokeWidth: 2, opacity: 0.3 } },
    { id: 'e4-8', source: 'production', target: 'audioTool', animated: false, style: { stroke: '#10b981', strokeWidth: 2, opacity: 0.3 } },
    { id: 'e4-9', source: 'production', target: 'effectTool', animated: false, style: { stroke: '#10b981', strokeWidth: 2, opacity: 0.3 } },
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
  const updateStatus = (status: string) => {
    // 根据处理阶段更新节点状态
    switch (status) {
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
        updateNodeStatus('imageTool', 'active');
        updateNodeStatus('audioTool', 'active');
        updateNodeStatus('effectTool', 'active');
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
  }

  useEffect(() => {
    updateStatus(agentSteps[0].status);
    const interval = setInterval(() => {
      setCurrentStep((prev) => {
        const nextStep = (prev + 1) % agentSteps.length;
        updateStatus(agentSteps[nextStep].status);
        return nextStep;
      });
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 text-white overflow-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-black/20 backdrop-blur-md border-b border-white/10">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center space-x-2"
          >
            <Film className="h-8 w-8 text-purple-400" />
            <span className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              NovelAI Studio
            </span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center space-x-4"
          >
            <button
              onClick={() => window.open('https://github.com/your-repo/novel-animation-system', '_blank')}
              className="flex items-center space-x-2 px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 transition-all duration-300"
            >
              <Github className="h-4 w-4" />
              <span>GitHub</span>
            </button>
            <button
              onClick={() => navigate('/try')}
              className="flex items-center space-x-2 px-6 py-2 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 transition-all duration-300 transform hover:scale-105"
            >
              <Play className="h-4 w-4" />
              <span>立即体验</span>
            </button>
          </motion.div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center px-6">
        <motion.div style={{ y: y1 }} className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-10 w-72 h-72 bg-purple-500/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-pink-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-2000"></div>
        </motion.div>

        <div className="relative z-10 text-center max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="mb-8"
          >
            <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 mb-6">
              <Sparkles className="h-4 w-4 text-yellow-400" />
              <span className="text-sm">AI驱动的创作革命</span>
            </div>

            <h1 className="text-6xl md:text-8xl font-bold mb-6 leading-tight">
              <span className="bg-gradient-to-r from-white via-purple-200 to-pink-200 bg-clip-text text-transparent">
                将文字
              </span>
              <br />
              <span className="flex md:inline-flex gap-2">
                {['变', '成', '电', '影'].map((char, index) => (
                  <motion.span
                    key={char}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: (4 - index) * 0.3,                // 动画持续0.3秒
                      delay: index * 0.3,           // 每个字延迟递增0.2秒（逐个出现）
                      repeat: 1,             // 无限循环
                      ease: "easeInOut"             // 缓动函数使动画更平滑
                    }}
                    className="bg-gradient-to-r from-purple-400 via-pink-400 to-red-400 bg-clip-text text-transparent"
                  >
                    {char}
                  </motion.span>
                ))}
              </span>
            </h1>

            <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed">
              基于先进AI技术的小说动画生成系统，让每一个故事都成为视觉盛宴
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6 mb-12"
          >
            <button
              onClick={() => navigate('/try')}
              className="group flex items-center space-x-3 px-8 py-4 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 transition-all duration-300 transform hover:scale-105 shadow-2xl shadow-purple-500/25"
            >
              <Play className="h-5 w-5" />
              <span className="text-lg font-semibold">开始创作</span>
              <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </button>

            <button
              onClick={() => navigate('/bookshelf')}
              className="flex items-center space-x-3 px-8 py-4 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 transition-all duration-300"
            >
              <BookOpen className="h-6 w-6" />
              <span>查看书架</span>
              <ArrowRight className="h-6 w-6 group-hover:translate-x-1 transition-transform" />
            </button>

            {/* <button
              onClick={() => window.open('https://github.com/your-repo/novel-animation-system', '_blank')}
              className="flex items-center space-x-3 px-8 py-4 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 transition-all duration-300"
            >
              <Github className="h-5 w-5" />
              <span className="text-lg">查看源码</span>
            </button> */}
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.6 }}
            className="flex items-center justify-center space-x-8 text-sm text-gray-400"
          >
            <div className="flex items-center space-x-2">
              <Zap className="h-4 w-4 text-yellow-400" />
              <span>AI驱动</span>
            </div>
            <div className="flex items-center space-x-2">
              <Star className="h-4 w-4 text-blue-400" />
              <span>开源免费</span>
            </div>
            <div className="flex items-center space-x-2">
              <Film className="h-4 w-4 text-green-400" />
              <span>专业品质</span>
            </div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1 }}
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
        >
          <ChevronDown className="h-8 w-8 text-white/60 animate-bounce" />
        </motion.div>
      </section >

      {/* Agent Workflow Section */}
      < section className="py-20 px-6 relative" >
        <motion.div style={{ y: y2 }} className="absolute inset-0">
          <div className="absolute top-0 left-1/4 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl"></div>
        </motion.div>

        <div className="relative z-10 max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-5xl font-bold mb-6 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              AI Agent 工作流
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto">
              四个专业AI Agent协同工作，将您的小说转化为精美的动画场景
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {agentSteps.map((step, index) => {
              const Icon = step.icon;
              const isActive = currentStep === index;

              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className={`relative p-6 rounded-2xl backdrop-blur-sm border transition-all duration-500 ${isActive
                    ? 'bg-white/10 border-white/30 scale-105'
                    : 'bg-white/5 border-white/10 hover:bg-white/10'
                    }`}
                >
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-r ${step.color} flex items-center justify-center mb-4 mx-auto`}>
                    <Icon className="h-8 w-8 text-white" />
                  </div>

                  <h3 className="text-xl font-bold mb-3 text-center">{step.title}</h3>
                  <p className="text-gray-400 text-center leading-relaxed">{step.description}</p>

                  {isActive && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full flex items-center justify-center"
                    >
                      <Sparkles className="h-3 w-3 text-white" />
                    </motion.div>
                  )}
                </motion.div>
              );
            })}
          </div>
          <div className="mt-16 h-[500px]">
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              fitView
              attributionPosition="bottom-left"
              nodesDraggable={false}        // 禁止节点拖动
              edgesConnectable={false}      // 禁止边连接操作
              nodesConnectable={false}      // 禁止节点作为连接端点
              edgesEditable={false}         // 禁止边编辑（调整端点/删除）
              nodesDeletable={false}        // 禁止节点删除
              edgesDeletable={false}
              panningEnabled={false}
              zoomingEnabled={false}
              zoomOnScroll={false}
            >
              <Background color="#ffffff" gap={20} size={1} className="opacity-10" />
            </ReactFlow>
          </div>
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="mt-16 text-center"
          >
            <div className="inline-flex items-center space-x-4 px-6 py-3 rounded-full bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30">
              <div className="flex space-x-1">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className={`w-2 h-2 rounded-full bg-purple-400 animate-pulse`}
                    style={{ animationDelay: `${i * 0.2}s` }}
                  ></div>
                ))}
              </div>
              <span className="text-purple-300">AI正在工作中...</span>
            </div>
          </motion.div>
        </div>
      </section >

      {/* Features Section */}
      < section className="py-20 px-6 bg-black/20" >
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-5xl font-bold mb-6 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              核心特性
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: Brain,
                title: "智能分析",
                description: "深度理解小说内容，提取关键情节和人物关系",
                color: "from-blue-500 to-cyan-500"
              },
              {
                icon: Wand2,
                title: "自动生成",
                description: "AI自动生成场景图片、语音和动画效果",
                color: "from-purple-500 to-pink-500"
              },
              {
                icon: Film,
                title: "电影级品质",
                description: "专业的视觉效果和流畅的动画体验",
                color: "from-green-500 to-emerald-500"
              }
            ].map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="p-8 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-all duration-300"
                >
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-r ${feature.color} flex items-center justify-center mb-6`}>
                    <Icon className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold mb-4">{feature.title}</h3>
                  <p className="text-gray-400 leading-relaxed">{feature.description}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section >

      {/* CTA Section */}
      < section className="py-20 px-6" >
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-5xl font-bold mb-6 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              开始您的创作之旅
            </h2>
            <p className="text-xl text-gray-400 mb-8">
              上传您的小说，让AI为您创造视觉奇迹
            </p>

            <button
              onClick={() => navigate('/try')}
              className="group inline-flex items-center space-x-3 px-12 py-4 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 transition-all duration-300 transform hover:scale-105 shadow-2xl shadow-purple-500/25 text-lg font-semibold"
            >
              <Play className="h-6 w-6" />
              <span>立即开始</span>
              <ArrowRight className="h-6 w-6 group-hover:translate-x-1 transition-transform" />
            </button>
          </motion.div>
        </div>
      </section >

      {/* Footer */}
      < footer className="py-8 px-6 border-t border-white/10" >
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center space-x-2 mb-4 md:mb-0">
            <Film className="h-6 w-6 text-purple-400" />
            <span className="text-lg font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              NovelAI Studio
            </span>
          </div>
          <div className="text-gray-400 text-sm">
            © 2025 - Present NovelAI Studio. 让每个故事都成为视觉盛宴.
          </div>
        </div>
      </footer >
    </div >
  );
};

export default LandingPage;