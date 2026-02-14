import React, { ReactNode, useState, useEffect, useCallback, memo } from 'react';
import { createRoot } from 'react-dom/client';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowRight, User, Layout, Cpu, Star, X, MessageSquare, Send, ChevronLeft, FlaskConical, RotateCcw, Upload
} from 'lucide-react';

// --- 1. 全局视觉层 (确保蓝色光斑跟随) ---
const GlobalVisualLayer = memo(() => {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  useEffect(() => {
    const move = (e: MouseEvent) => setMousePos({ x: e.clientX, y: e.clientY });
    window.addEventListener('mousemove', move);
    return () => window.removeEventListener('mousemove', move);
  }, []);

  return (
    <>
      <div className="fixed inset-0 z-[-10] bg-[#000510] overflow-hidden">
        <div style={{ width: '100%', height: '100%', filter: 'blur(80px) saturate(1.8)' }}>
          <div className="absolute w-[120vw] h-[120vw] top-[-10%] left-[-10%] rounded-full bg-[radial-gradient(circle,rgba(0,100,255,0.4)_0%,transparent_60%)]" />
        </div>
      </div>
      <motion.div animate={{ x: mousePos.x - 80, y: mousePos.y - 80 }} className="fixed inset-0 z-[100] pointer-events-none w-40 h-40 rounded-full bg-blue-500/10 blur-2xl" />
    </>
  );
});

// --- 2. 新增：实验室投稿模态框 ---
const UploadModal = ({ isOpen, onClose, defaultGroup }: { isOpen: boolean, onClose: () => void, defaultGroup: string }) => {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    media_url: '',
    group_type: defaultGroup || 'ai'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/upload-post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        alert("项目数据已成功同步至实验室终端。");
        onClose();
        window.location.reload(); 
      }
    } catch (err) {
      console.error("部署失败:", err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center bg-black/80 backdrop-blur-md p-6">
      <motion.div 
        initial={{ opacity: 0, y: 50, scale: 0.95 }} 
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className="card-glass p-8 md:p-12 rounded-[3rem] max-w-2xl w-full space-y-8 relative border border-blue-500/20 shadow-[0_0_50px_rgba(0,100,255,0.1)]"
      >
        <button onClick={onClose} className="absolute top-8 right-8 text-gray-400 hover:text-white transition-colors"><X size={24}/></button>
        
        <div>
          <h2 className="text-4xl font-serif tracking-tight text-white italic">数据投稿 <span className="text-blue-500">/</span> DEPLOY</h2>
          <p className="text-gray-500 text-[10px] mt-2 tracking-[0.3em] font-mono uppercase">Initiating New Project Sequence</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-[0.2em] text-blue-400 font-bold">Project Title / 项目标题</label>
            <input 
              required
              placeholder="输入存档名称..."
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 outline-none focus:border-blue-500 transition-all text-white font-light placeholder:text-gray-700"
              onChange={e => setFormData({...formData, title: e.target.value})}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-[0.2em] text-blue-400 font-bold">Assignment / 所属部门</label>
              <select 
                className="w-full bg-[#0a0f1d] border border-white/10 rounded-2xl px-6 py-4 outline-none text-white appearance-none cursor-pointer hover:border-blue-500/50 transition-all"
                value={formData.group_type}
                onChange={e => setFormData({...formData, group_type: e.target.value})}
              >
                <option value="ai">Light AI Unit</option>
                <option value="anime">Animation Unit</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-[0.2em] text-blue-400 font-bold">Visual Asset / 图片链接</label>
              <input 
                required
                placeholder="HTTPS://IMAGE-HOST.COM/..."
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 outline-none focus:border-blue-500 text-white font-mono text-xs"
                onChange={e => setFormData({...formData, media_url: e.target.value})}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-[0.2em] text-blue-400 font-bold">Technical Brief / 核心说明</label>
            <textarea 
              required
              rows={3}
              placeholder="描述项目核心逻辑或视觉理念..."
              className="w-full bg-white/5 border border-white/10 rounded-3xl px-6 py-4 outline-none focus:border-blue-500 text-white resize-none font-light leading-relaxed"
              onChange={e => setFormData({...formData, content: e.target.value})}
            />
          </div>

          <button type="submit" className="w-full py-5 bg-blue-600 rounded-full font-serif uppercase tracking-[0.3em] hover:bg-blue-500 hover:shadow-[0_0_30px_rgba(0,100,255,0.4)] transition-all text-xs font-bold">
            Execute Upload / 执行同步
          </button>
        </form>
      </motion.div>
    </div>
  );
};

// --- 3. 评论与评分交互组件 ---
const InteractionSection = ({ targetId, targetType }: { targetId: string | number, targetType: string }) => {
  const [detail, setDetail] = useState<{avgRating: number, comments: any[]}>({ avgRating: 5.0, comments: [] });
  const [newComment, setNewComment] = useState("");

  // 1. 获取数据逻辑
  const refresh = useCallback(async () => {
    try {
      // 必须带上 /api 前缀走代理
      const res = await fetch(`/api/detail/${targetType}/${targetId}`);
      if (res.ok) {
        const data = await res.json();
        setDetail({ 
          avgRating: data.avgRating ? parseFloat(data.avgRating) : 5.0, 
          comments: data.comments || [] 
        });
      }
    } catch (err) {
      console.error("刷新交互数据失败:", err);
    }
  }, [targetId, targetType]);

  useEffect(() => { refresh(); }, [refresh]);

  // 2. 评分逻辑
  const handleRate = async (val: number) => {
    try {
      const res = await fetch('/api/rate', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ 
          target_id: targetId, 
          target_type: targetType, 
          rating: val 
        }) 
      });
      if (res.ok) refresh();
    } catch (err) {
      console.error("评分提交失败:", err);
    }
  };

  // 3. 评论逻辑 (修正与增强)
  const handleComment = async () => {
    if (!newComment.trim()) return;
    
    // 确保发送的字段名与后端 server.js 接收的完全一致
    const body: any = { 
      content: newComment, 
      user_name: '匿名研究员' 
    };
    
    // 逻辑分流：确保 ID 准确传达
    if (targetType === 'member') {
      body.member_id = targetId;
    } else if (targetType === 'post') {
      body.post_id = targetId;
    } else if (targetType === 'gallery') {
      // ✅ 关键：这里必须叫 gallery_group，后端插入语句也要有这一列
      body.gallery_group = targetId;
    }

    try {
      const res = await fetch('/api/comments', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify(body) 
      });
      
      if (res.ok) {
        setNewComment(""); 
        // 关键：给数据库一点点写入时间后再刷新，或者直接刷新
        setTimeout(() => refresh(), 100); 
      } else {
        const errData = await res.json();
        console.error("服务器返回错误:", errData.error);
      }
    } catch (err) {
      console.error("网络提交失败:", err);
    }
  };

  return (
    <div className="mt-24 pt-12 border-t border-white/10 space-y-12 text-left">
      <div className="flex flex-col md:flex-row gap-12">
        {/* 左侧：评分区域 */}
        <div className="flex-1 space-y-4">
          <h4 className="flex items-center gap-2 text-blue-400 font-bold uppercase tracking-widest text-xs">
            <Star size={14}/> 深度评分
          </h4>
          <div className="flex items-center gap-2">
            {[1,2,3,4,5].map(s => (
              <Star 
                key={s} 
                size={28} 
                className={`cursor-pointer transition-all ${s <= Math.round(detail.avgRating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-600'} hover:scale-110`} 
                onClick={() => handleRate(s)}
              />
            ))}
            <span className="text-3xl font-mono ml-4 text-white">
              {typeof detail.avgRating === 'number' ? detail.avgRating.toFixed(1) : "5.0"}
            </span>
          </div>
        </div>

        {/* 右侧：评论区 */}
        <div className="flex-[2] space-y-6">
          <h4 className="flex items-center gap-2 text-blue-400 font-bold uppercase tracking-widest text-xs">
            <MessageSquare size={14}/> 交流日志
          </h4>
          
          <div className="flex gap-2">
            <input 
              value={newComment} 
              onChange={e => setNewComment(e.target.value)} 
              onKeyDown={(e) => e.key === 'Enter' && handleComment()}
              placeholder="输入观测结论..." 
              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm outline-none focus:border-blue-500 text-white" 
            />
            <button 
              onClick={handleComment} 
              className="p-2 bg-blue-600 rounded-xl hover:bg-blue-500 transition-all text-white"
            >
              <Send size={20}/>
            </button>
          </div>

          <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
            {detail.comments.length > 0 ? (
              detail.comments.map((c: any) => (
                <div key={c.id} className="p-4 rounded-xl bg-white/[0.03] border border-white/5 group">
                  <div className="flex justify-between text-[10px] text-blue-500/60 mb-1 font-mono uppercase">
                    <span>{c.user_name}</span>
                    <span>{new Date(c.created_at).toLocaleDateString()}</span>
                  </div>
                  <p className="text-sm font-light text-gray-300 group-hover:text-white transition-colors">
                    {c.content}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-xs text-gray-600 italic font-light">暂无观测记录...</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
// --- 4. 独立档案页面 (成员/作品) ---
// --- 4. 独立档案页面 (已修复：支持视频与图片自适应切换) ---
const ProfilePage = ({ item, type, onBack }: { item: any, type: 'member' | 'post', onBack: () => void }) => {
  
  // 辅助函数：统一处理媒体资源路径
  const getMediaUrl = (url: string) => {
    if (!url) return '';
    // 如果是 http 开头的外部链接则保持原样，否则加上 /api 前缀走代理
    return url.startsWith('http') ? url : `/api${url}`;
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }} 
      animate={{ opacity: 1, x: 0 }} 
      exit={{ opacity: 0 }} 
      className="min-h-screen pt-32 px-12 pb-40 max-w-5xl mx-auto"
    >
      {/* 返回按钮 */}
      <button 
        onClick={onBack} 
        className="flex items-center gap-2 text-blue-400 mb-12 hover:gap-4 transition-all text-xs font-bold uppercase tracking-widest"
      >
        <ChevronLeft size={16}/> Back
      </button>

      <div className="flex flex-col md:flex-row gap-16 items-start mb-20 text-left">
        {/* 媒体展示区域 */}
        <div className="w-full md:w-2/3">
          {type === 'member' ? (
            // 成员头像：使用 getMediaUrl 处理路径
            <img 
              src={getMediaUrl(item.avatar_url)} 
              className="w-64 h-64 rounded-full border-8 border-blue-500/10 shadow-2xl object-cover" 
              alt={item.name}
            />
          ) : (
            // 作品详情：判断是视频还是图片，并补全 /api 前缀
            <div className="rounded-3xl border border-white/10 overflow-hidden bg-black shadow-2xl aspect-video flex items-center justify-center">
              {item.media_type === 'video' ? (
                <video 
                  src={getMediaUrl(item.media_url)} 
                  controls 
                  autoPlay 
                  className="w-full h-full object-contain"
                />
              ) : (
                <img 
                  src={getMediaUrl(item.media_url)} 
                  className="w-full h-full object-cover" 
                  alt={item.title}
                />
              )}
            </div>
          )}
        </div>

        {/* 文字详情区域 */}
        <div className="flex-1 space-y-8">
          <h2 className="text-6xl font-serif tracking-tighter text-white">
            {item.name || item.title}
          </h2>
          
          <div className="space-y-8">
            <div>
              <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.4em] mb-4">
                {type === 'member' ? 'Self Introduction / 自我介绍' : 'Project Detail / 项目详情'}
              </h4>
              <p className="text-xl text-gray-300 italic font-light leading-relaxed">
                "{item.intro || item.content || '数据尚未同步。'}"
              </p>
            </div>

            {type === 'member' && (
              <div>
                <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.4em] mb-4">
                  Mission Scope / 工作职责
                </h4>
                <p className="text-lg text-gray-400 font-light leading-relaxed">
                  {item.work_detail || '负责核心逻辑架构与视觉美学的数字化迭代。'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 评论与交互区 */}
      <InteractionSection targetId={item.id} targetType={type} />
    </motion.div>
  );
};
// --- 5. 九宫格展示页面 (纠正参数名以匹配 App 调用) ---
// --- 5. 九宫格展示页面 (完整版：补全样式与逻辑) ---
const GalleryGridPage = ({ items, group, onBack }: { items: any[], group: string, onBack: () => void }) => {
  
  // 辅助函数：统一处理本地与外部链接
  const getMediaUrl = (url: string) => {
    if (!url) return '';
    // 如果是数据库存的 /uploads/xxx，补全为 /api/uploads/xxx 走 Vite 代理
    return url.startsWith('http') ? url : `/api${url}`;
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      exit={{ opacity: 0 }} 
      className="min-h-screen pt-32 px-12 pb-40 max-w-6xl mx-auto"
    >
      {/* 返回按钮 */}
      <div className="flex justify-start mb-12">
        <button 
          onClick={onBack} 
          className="flex items-center gap-2 text-blue-400 hover:gap-4 transition-all text-xs font-bold uppercase tracking-widest"
        >
          <ChevronLeft size={16}/> Back to {group} Unit
        </button>
      </div>

      {/* 标题区域 */}
      <div className="text-left mb-20">
        <h2 className="text-7xl md:text-8xl font-serif italic text-white leading-none uppercase tracking-tighter">
          {group} <span className="text-blue-500">/</span> Matrix
        </h2>
        <p className="text-gray-500 font-mono text-xs mt-4 tracking-[0.3em]">
          VISUAL DATASET GRID _ TOTAL {items.length} ASSETS
        </p>
      </div>

      {/* 九宫格矩阵 */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {items.map((item) => (
          <motion.div 
            key={item.id} 
            whileHover={{ scale: 1.05, zIndex: 10 }}
            className="aspect-square rounded-[2rem] overflow-hidden border border-white/10 bg-white/5 shadow-2xl group"
          >
            {/* 核心修改点：处理图片路径 */}
            <img 
              src={getMediaUrl(item.image_url)} 
              className="w-full h-full object-cover grayscale-[0.5] group-hover:grayscale-0 transition-all duration-700" 
              alt="Gallery item"
              loading="lazy"
            />
          </motion.div>
        ))}
      </div>

      {/* 底部交互区：targetType 设为 gallery，以便获取该小组全量评论 */}
      <div className="mt-40 border-t border-white/5 pt-20">
        <div className="max-w-4xl">
          <h3 className="text-2xl font-serif italic text-white mb-8">Unit Discussion / 单元讨论区</h3>
          <InteractionSection targetId={group} targetType="gallery" />
        </div>
      </div>
    </motion.div>
  );
};
// --- 5. 小组详情主页 (增强版：支持多媒体 + 自动切换九宫格布局) ---
// --- 5. 小组详情主页 (已纠正类型并优化布局) ---
const TeamPage = ({ group, onBack, onSelectItem }: { 
  group: string, 
  onBack: () => void, 
  onSelectItem: (item: any, type: 'member' | 'post' | 'gallery_group') => void 
}) => {
  const [data, setData] = useState<{members: any[], posts: any[]} | null>(null);
  const [gallery, setGallery] = useState<any[]>([]); 
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  // 1. 获取小组基础数据 (通过代理转发到 3001)
  useEffect(() => { 
    fetch(`/api/team/${group}`)
      .then(res => res.json())
      .then(setData)
      .catch(err => console.error("数据链路同步失败:", err));
  }, [group]);

  // 2. 获取九宫格数据 (修正路径，移除 localhost:3001)
  useEffect(() => {
    fetch(`/api/gallery/${group}`)
      .then(res => res.json())
      .then(setGallery)
      .catch(err => console.error("Gallery 数据加载失败:", err));
  }, [group]);

  if (!data) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-blue-400 font-mono animate-pulse tracking-[0.5em]">
        SYNCHRONIZING {group.toUpperCase()} UNIT DATA...
      </div>
    </div>
  );

  const isGridLayout = data.posts.length > 4;

  // 处理媒体 URL 的辅助函数
  const getMediaUrl = (url: string) => {
    if (!url) return '';
    // 如果是本地路径则增加 /api 前缀，如果是外部 http 链接则保持不变
    return url.startsWith('http') ? url : `/api${url}`;
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="min-h-screen pt-32 px-12 pb-40 max-w-6xl mx-auto text-left">

      {/* 头部区域 */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-24">
        <div>
          <button onClick={onBack} className="flex items-center gap-2 text-blue-400 mb-6 hover:gap-4 transition-all text-xs font-bold uppercase tracking-widest">
            <ChevronLeft size={16}/> Back to Hub
          </button>
          <h2 className="text-8xl md:text-[10rem] font-serif uppercase tracking-tighter italic leading-none">
            {group} Unit
          </h2>
        </div>
        
        <button 
          onClick={() => setIsUploadOpen(true)}
          className="group flex items-center gap-3 px-8 py-4 rounded-full border border-blue-500/30 bg-blue-500/5 text-blue-400 hover:bg-blue-600 hover:text-white transition-all duration-500 shadow-[0_0_20px_rgba(0,100,255,0.05)]"
        >
          <Upload size={18} className="group-hover:-translate-y-1 transition-transform"/>
          <span className="text-xs font-bold uppercase tracking-widest">Deploy Data</span>
        </button>
      </div>

      <UploadModal isOpen={isUploadOpen} onClose={() => setIsUploadOpen(false)} defaultGroup={group} />
      
      {/* 成员区域 */}
      <section className="space-y-12 mb-40">
        <h3 className="text-[10px] font-bold tracking-[0.6em] text-gray-500 uppercase border-b border-white/5 pb-4">
          Operators / 实验室研究员
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {data.members.map(m => (
            <div key={m.id} onClick={() => onSelectItem(m, 'member')} className="p-8 rounded-[2.5rem] bg-white/5 border border-white/10 flex items-center gap-8 cursor-pointer hover:border-blue-500/50 transition-all group backdrop-blur-xl">
              <img src={getMediaUrl(m.avatar_url)} className="w-24 h-24 rounded-full border-4 border-white/5 group-hover:scale-110 transition-transform object-cover" alt={m.name} />
              <div>
                <h4 className="text-3xl font-serif text-white">{m.name}</h4>
                <p className="text-blue-400 text-xs tracking-widest uppercase">{m.role}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Collection 区域 - 影像集封面入口 */}
      {gallery.length > 0 && (
        <section className="space-y-12 mb-40">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h3 className="text-[10px] font-bold tracking-[0.6em] text-gray-500 uppercase">
              Collection / 影像集存档
            </h3>
            <span className="text-[8px] font-mono text-blue-500 tracking-widest uppercase">
              {gallery.length} Assets Loaded
            </span>
          </div>
          
          <motion.div
            whileHover={{ scale: 1.01 }}
            onClick={() => onSelectItem(gallery, 'gallery_group')} 
            className="relative w-full aspect-[21/9] rounded-[3rem] overflow-hidden border border-blue-500/20 cursor-pointer group shadow-2xl"
          >
            <img
              src={getMediaUrl(gallery[0].image_url)} 
              className="w-full h-full object-cover brightness-50 group-hover:brightness-75 transition-all duration-1000"
              alt="Gallery Cover"
            />
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="text-5xl font-serif italic mb-4 text-white">View Collection</div>
              <div className="px-6 py-2 rounded-full border border-blue-500/50 text-blue-400 text-[10px] tracking-[0.4em] uppercase">
                进入九宫格矩阵 / {gallery.length} 张观测图
              </div>
            </div>
          </motion.div>
        </section>
      )}

      {/* Production 区域 */}
      <section className="space-y-20">
        <div className="flex justify-between items-center border-b border-white/5 pb-4">
          <h3 className="text-[10px] font-bold tracking-[0.6em] text-gray-500 uppercase">
            Production / 数字化产出
          </h3>
          <span className="text-[8px] font-mono text-blue-500 tracking-widest">
            {isGridLayout ? "MATRIX VIEW ENABLED" : "LIST VIEW ENABLED"}
          </span>
        </div>

        {isGridLayout ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
             {data.posts.map(p => (
               <motion.div 
                 key={p.id} 
                 whileHover={{ scale: 1.02 }}
                 onClick={() => onSelectItem(p, 'post')}
                 className="aspect-square rounded-[2rem] bg-white/5 border border-white/10 overflow-hidden relative group cursor-pointer shadow-lg"
               >
                 {p.media_type === 'video' ? (
                   <video src={getMediaUrl(p.media_url)} className="w-full h-full object-cover" autoPlay muted loop playsInline />
                 ) : (
                   <img src={getMediaUrl(p.media_url)} className="w-full h-full object-cover" alt={p.title} />
                 )}
               </motion.div>
             ))}
          </div>
        ) : (
          <div className="space-y-16">
            {data.posts.map(p => (
              <div key={p.id} onClick={() => onSelectItem(p, 'post')} className="rounded-[3rem] bg-white/5 border border-white/10 overflow-hidden flex flex-col md:flex-row h-auto md:h-[400px] cursor-pointer hover:border-blue-500/30 transition-all group shadow-2xl text-left">
                <div className="md:w-1/2 overflow-hidden relative bg-black">
                  {p.media_type === 'video' ? (
                    <video src={getMediaUrl(p.media_url)} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" autoPlay muted loop playsInline />
                  ) : (
                    <img src={getMediaUrl(p.media_url)} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt={p.title} />
                  )}
                </div>
                <div className="p-12 flex flex-col justify-center gap-4 flex-1">
                  <h5 className="text-4xl font-serif text-white leading-tight">{p.title}</h5>
                  <p className="text-gray-400 line-clamp-3 font-light leading-relaxed italic">
                    "{p.content || '项目底层逻辑已封包。'}"
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </motion.div>
  );
};
// --- 6. 主 App 控制中心 ---
// --- 7. 主 App 控制中心 (已修复类型报错与页面分流逻辑) ---
const App = () => {
  // 核心修复：在 subType 的联合类型中增加了 'gallery_group'
  const [view, setView] = useState<{
    page: string, 
    subItem?: any, 
    subType?: 'member' | 'post' | 'gallery_group' 
  }>({ page: 'welcome' });

  return (
    <div className="relative min-h-screen text-white font-sans overflow-x-hidden selection:bg-blue-500">
      <GlobalVisualLayer />
      <AnimatePresence mode="wait">
        
        {/* 1. 欢迎页面 */}
        {view.page === 'welcome' && (
          <motion.main key="welcome" exit={{ opacity: 0, scale: 1.05 }} className="fixed inset-0 flex flex-col items-center justify-center text-center p-6">
            <h1 className="text-9xl md:text-[14rem] font-serif mb-6 tracking-tighter italic">璃心<span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-red-600">燃点</span></h1>
            <p className="text-gray-400 font-serif tracking-[0.4em] mb-12 text-sm uppercase">Glass Heart Ignition Studio</p>
            <button onClick={() => setView({page: 'hub'})} className="px-16 py-6 rounded-full border border-white/20 bg-white/5 backdrop-blur-2xl hover:bg-white hover:text-black transition-all group flex items-center gap-6 font-serif uppercase tracking-widest text-sm">ENTER STUDIO <ArrowRight className="group-hover:translate-x-3 transition-all"/></button>
          </motion.main>
        )}

        {/* 2. 导航枢纽 (Hub) */}
        {view.page === 'hub' && (
          <motion.main key="hub" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="pt-48 px-12 max-w-5xl mx-auto flex flex-col gap-8 pb-40">
            {[
              { id: 'overview', title: '实验室总览', sub: 'Laboratory Overview', icon: <FlaskConical size={36}/> },
              { id: 'anime', title: '动漫制作组', sub: 'Animation Unit', icon: <RotateCcw size={36}/> },
              { id: 'ai', title: '擎光AI组', sub: 'Light AI Unit', icon: <Cpu size={36}/> }
            ].map(item => (
              <div key={item.id} onClick={() => setView({page: item.id})} className="p-20 rounded-[4rem] border border-white/5 bg-white/[0.01] backdrop-blur-3xl cursor-pointer hover:border-blue-500/40 transition-all flex flex-col items-center gap-6 group text-center relative overflow-hidden">
                <div className="p-4 rounded-full bg-white/5 text-blue-400 group-hover:scale-110 transition-all">{item.icon}</div>
                <div><h3 className="text-6xl font-serif mb-2">{item.title}</h3><p className="text-gray-500 font-mono tracking-widest text-xs uppercase">{item.sub}</p></div>
              </div>
            ))}
          </motion.main>
        )}

        {/* 3. 总览页面 */}
        {view.page === 'overview' && (
          <motion.div key="overview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-screen pt-32 px-12 max-w-5xl mx-auto text-center">
            <button onClick={() => setView({page: 'hub'})} className="flex items-center gap-2 text-blue-400 mb-20 mx-auto text-xs font-bold uppercase"><ChevronLeft size={16}/> Back</button>
            <p className="text-3xl md:text-5xl font-serif leading-relaxed italic text-gray-200">璃心燃点实验室是创意的孵化器。我们要做的不仅是艺术，更是艺术与技术的聚变。</p>
          </motion.div>
        )}

        {/* 4. 小组主页 (展示成员、作品列表以及影像集入口) */}
        {(view.page === 'anime' || view.page === 'ai') && !view.subItem && (
          <TeamPage 
            key={view.page}
            group={view.page} 
            onBack={() => setView({page: 'hub'})} 
            // 此时 type 可以接收 'member' | 'post' | 'gallery_group'
            onSelectItem={(item, type) => setView({page: view.page, subItem: item, subType: type})} 
          />
        )}

        {/* 5. 详情页渲染分流逻辑 */}
        {view.subItem && (
          view.subType === 'gallery_group' ? (
            // 情况 A: 如果点击的是影像集入口，进入九宫格矩阵页
            <GalleryGridPage 
              key="gallery-page"
              items={view.subItem} 
              group={view.page} 
              onBack={() => setView({page: view.page})} 
            />
          ) : (
            // 情况 B: 如果点击的是成员或单个作品，进入档案详情页
            <ProfilePage 
              key="profile-page"
              item={view.subItem} 
              // 使用类型断言安全地将状态传给 ProfilePage
              type={view.subType as 'member' | 'post'} 
              onBack={() => setView({page: view.page})} 
            />
          )
        )}
      </AnimatePresence>
    </div>
  );
};

const root = createRoot(document.getElementById('root')!);
root.render(<App />);
