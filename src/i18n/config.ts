const zhConfig = {
    agent: {
        script: '编剧Agent',
        scriptDesc: '智能分析小说内容，按章节生成专业剧本',
        director: '导演Agent',
        directorDesc: '设计关键场景、动画效果和镜头语言',
        production: '制作Agent',
        productionDesc: '生成场景图片、语音素材和动画代码',
        editor: '剪辑Agent',
        editorDesc: '检查连贯性，确保场景完整和质量',
        upload: '上传Agent',
        uploadDesc: '上传场景图片、语音素材和动画代码',
        complete: '完成Agent',
        completeDesc: '上传场景图片、语音素材和动画代码',
        image: '生成图片Tools',
        audio: '生成音频Tools',
        effect: '生成特效Tools',
        try: '立即体验',
        try1: '试一下',
        ai: 'AI驱动的创作革命',
        slogonHead: '将文字',
        slogonBody: ['变', '成', '电', '影'],
        slogonDesc: '基于先进AI技术的小说动画生成系统，让每一个故事都成为视觉盛宴',
        bookshelf: '查看书架',
        free: '开源免费',
        professional: '专业品质',
        workflow: '工作流',
        workflowStatus: 'AI工作流执行中',
        workflowDesc: '四个专业AI Agent协同工作，将您的小说转化为精美的动画场景',
        personalities: '核心特性',
        personalities1: '智能分析',
        personalities1desc: '智能分析小说内容，提取关键情节和人物关系',
        personalities2: '自动生成',
        personalities2desc: '自动生成场景图片、语音素材和动画代码',
        personalities3: '专业编辑',
        personalities3desc: '专业编辑检查连贯性，确保场景完整和质量',
        startTry: '开始您的创作之旅',
        startTryDesc: '上传您的小说，让AI为您创造视觉奇迹',
        slogon: '让每个故事都成为视觉盛宴',
        returnHome: '返回首页',
        uploadDesc1:'支持txt格式，AI将为您创造视觉奇迹',
        uploadDesc2: '上传您的小说，AI将为您创造视觉奇迹',
    }
}
const enConfig = {
    agent: {
        script: 'Script Agent',
        scriptDesc: 'Auto analyze noval content, generate script by chapter',
        director: 'Director Agent',
        directorDesc: 'Design key scene、animation effect and camera language',
        production: 'Production Agent',
        productionDesc: 'Generate scene image、voice material and animation code',
        editor: 'Editor Agent',
        editorDesc: 'Check continuity, ensure scene complete and quality',
        upload: 'Upload Agent',
        uploadDesc: 'Upload scene image、voice material and animation code',
        complete: 'Complete Agent',
        completeDesc: 'Upload scene image、voice material and animation code',
        image: 'Generate image Tools',
        audio: 'Generate audio Tools',
        effect: 'Generate effect Tools',
        try: 'Try Now',
        try1: 'Try Now',
        ai: 'AI Driven Creative Revolution',
        slogonHead: 'Turn Text',
        slogonBody: ['Turn', 'Into', 'Video', 'Film'],
        slogonDesc: 'Based on advanced AI technology, let every story become a visual feast',
        bookshelf: 'Bookshelf',
        free: 'Free',
        professional: 'Professional',
        workflow: 'Workflow',
        workflowStatus: 'Workflow working',
        workflowDesc: 'Four professional AI Agent work together, turn your novel into a visual feast',
        personalities: 'Main Personalities',
        personalities1: 'Intelligent Analysis',
        personalities1desc: 'Intelligent analysis noval content, extract key plot and character relationship',
        personalities2: 'Automatic Generation',
        personalities2desc: 'Automatic generation scene image、voice material and animation code',
        personalities3: 'Professional Editing',
        personalities3desc: 'Professional editing check continuity, ensure scene complete and quality',
        startTry: 'Start your creative journey',
        startTryDesc: 'Upload your noval, let AI create visual magic',
        slogon: 'Let every story become a visual feast',
        returnHome: 'Return Home',
        uploadDesc1: 'Support txt format, AI will create visual magic',
        uploadDesc2: 'Upload your noval, AI will create visual magic',
    }
};
export const getBrowserLang = function () {
    let browserLang = navigator.language
        ? navigator.language
        : navigator?.browserLanguage;
    let defaultBrowserLang = "";
    if (
        browserLang.toLowerCase() === "us" ||
        browserLang.toLowerCase() === "en" ||
        browserLang.toLowerCase() === "en_us"
    ) {
        defaultBrowserLang = "en_US";
    } else {
        defaultBrowserLang = "zh_CN";
    }
    return defaultBrowserLang;
};

export const labels = getBrowserLang() === "zh_CN" ? zhConfig : enConfig;
