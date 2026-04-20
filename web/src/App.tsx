import { useState, useEffect, memo, useMemo } from 'react';
import { Hexagon, RefreshCw, Folder, FileText, Layers, Box, Zap, Scale, Terminal, HelpCircle, Save, Share2, ChevronRight, Clock, Activity, Pin, Trash2, Upload, Package, X, Plus, DownloadCloud, Network, List } from 'lucide-react';
import { useVSCodeApi } from './hooks/useVSCodeApi';
import { Skill, Workflow, Rule, FileNode, Conversation } from './types';
import { FileTree } from './components/FileExplorer/FileTree';
import { FilePreview } from './components/FileExplorer/FilePreview';

import { ReactFlow, Controls, Background, MarkerType, useNodesState, useEdgesState } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { forceSimulation, forceLink, forceManyBody, forceCenter, forceCollide } from 'd3-force';

type ViewMode = 'dashboard' | 'history' | 'skills' | 'workflows' | 'rules' | 'connectivity' | 'help';
type Lang = 'en' | 'tw' | 'cn' | 'jp' | 'kr';

const getForceLayoutedElements = (nodes: any[], edges: any[]) => {
    const simulationNodes = nodes.map(n => ({ ...n, x: 0, y: 0 }));
    // forceLink modifies source/target to object references, so deep copy edges for simulation
    const simulationEdges = edges.map(e => ({ ...e, source: e.source, target: e.target }));

    const simulation = forceSimulation(simulationNodes)
        .force('link', forceLink(simulationEdges).id((d: any) => d.id).distance(250))
        .force('charge', forceManyBody().strength(-3000))
        .force('center', forceCenter(0, 0))
        .force('collide', forceCollide().radius(120).iterations(3))
        .stop();

    // Pre-calculate the layout statically to ensure stable graph on render
    for (let i = 0; i < 300; ++i) {
        simulation.tick();
    }

    const positionedNodes = simulationNodes.map(node => {
        const orig = nodes.find(n => n.id === node.id);
        if (!orig) return node;
        return {
            ...orig,
            position: { x: node.x - 90, y: node.y - 30 } // Center node position (180x60 width/height)
        };
    });

    return { nodes: positionedNodes, edges };
};

const CoreLogo = () => (
    <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-8 h-8">
        {/* 加粗的幾何外框 - 建立護盾輪廓 */}
        <path d="M16 2.5L5 8.5V23.5L16 29.5L27 23.5V8.5L16 2.5Z" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-40" />

        {/* 抽象核心：將雙 C 合併為一個具備「連鎖感」的 S 型幾何結構 */}
        {/* 頂部粗弧度 */}
        <path d="M10 16C10 12.6863 12.6863 10 16 10C19.3137 10 22 12.6863 22 16" stroke="white" strokeWidth="4.5" strokeLinecap="round" />
        {/* 底部粗弧度 (不透明度調整以增加層次) */}
        <path d="M10 16C10 19.3137 12.6863 22 16 22C19.3137 22 22 19.3137 22 16" stroke="white" strokeWidth="4.5" strokeLinecap="round" className="opacity-60" />

        {/* 抽象時間軸：單一且堅硬的實線 (Primary Diagonal) */}
        <path d="M25 7L7 25" stroke="white" strokeWidth="3" strokeLinecap="round" />

        {/* 中心點 */}
        <circle cx="16" cy="16" r="2" fill="white" className="animate-pulse" />
    </svg>
);

const I18N: Record<Lang, any> = {
    en: { dashboard: 'Terminal', history: 'Activity', skills: 'Skills', workflows: 'Workflows', rules: 'Rules', connect: 'Connectivity', help: 'Manual', files: 'Files', config: 'Configuration', memo: 'Memo', selectItem: 'Await Command', helpTitle: 'Chronicle Manual', helpDesc: 'Hospitality & Operation Hub.', intro: 'V2.1.0 Standard: Search, Asset Governance & Stability.', s1: '1. Deep Search: Full-text indexing and caching.', s2: '2. Star Map: Force-directed topology for complex knowledge networks.', s3: '3. Asset Governance: Physical state persistence and batch export.', s4: '4. Critical Fix (V2.1): Natively bypassed UI limits on archived conversation retrieval, eliminating core crash.', saved: 'Synced', lastSync: 'Last Modified', project: 'Project', recent: 'Recent', recentTip: 'Global 20', tagged: 'Tagged', pin: 'Pin', unpin: 'Unpin', delete: 'Delete', deleteConfirm: 'Confirm Deletion?', addNote: 'Add Note', editTags: 'Edit Tags', uploadAvatar: 'Upload Avatar', uploadCover: 'Upload Cover', openFull: 'Open Full View', continueTerm: 'Continue in Terminal', reveal: 'Reveal in Explorer', sysOverview: 'ChronicleCore System Overview', lspStandby: 'LSP STANDBY', lspComingSoon: 'LSP COMING SOON', officialLib: 'Official Library', skillHub: 'Skill Hub', skillHubDesc: 'Browse and download official skills, rulesets, and workflow orchestrations to expand your ChronicleCore system. Updates deployed directly from the A1 Sentinel Framework.', viewRepo: 'View Repository', govProtocol: 'Governance Protocol', batchExport: 'Batch Export', batchExportDesc: 'Execute a full system sweep. Intercepts all encrypted conversation nodes and materializes them as synchronized Markdown archives across all registered project sectors.', execProtocol: 'Execute Protocol', globalPathConf: 'Global Path Configuration', relativeTo: 'Relative to ~/.gemini/antigravity/', preferLocal: 'Prefer Local Configs', skillsFolder: 'Skills Folder', workflowsFolder: 'Workflows Folder', pathNote: 'Note: Antigravity official is continuously adjusting the global path, please check for updates.', saveConfig: 'Save Configuration', activityMonitor: 'Activity Monitor', activityDesc: 'Context Length & Engagement (Last 12H)', confirmExport: 'Execute full Chronicle extraction?\nThis will parse all recorded conversations to markdown.' },
    tw: { dashboard: '總覽', history: '歷史觀測站', skills: '技能模組', workflows: '工作流程', rules: '規則規範', connect: '連通圖譜', help: '操作規劃', files: '檔案', config: '配置', memo: '備忘', selectItem: '等待指令', helpTitle: '編年史操作規劃', helpDesc: '款待與連通性中心。', intro: 'V2.1.0 標準: 深層檢索、資產統治與防崩潰機制。', s1: '1. 深層檢索: 歷史對話全文增量快取搜索。', s2: '2. 引力星圖: 物理引擎驅動的有機星圖拓撲。', s3: '3. 資產統治: 實體化備份、持久化索引與模組管理。', s4: '4. 核心修復 (V2.1): 原生繞過介面限制對話提取數量，徹底消除點擊過期歷史記錄導致的核心崩潰。', saved: '已同步', lastSync: '最後修改', project: '專案', recent: '最近', recentTip: '全域 20 筆', tagged: '標籤', pin: '置頂', unpin: '取消置頂', delete: '刪除', deleteConfirm: '確認刪除此記錄？', addNote: '加入備註', editTags: '編輯標籤', uploadAvatar: '上傳頭像', uploadCover: '上傳封面', openFull: '開啟全文視圖', continueTerm: '在終端續聊', reveal: '在檔案總管中顯示', sysOverview: 'ChronicleCore 系統總覽', lspStandby: 'LSP 待命', lspComingSoon: 'LSP 即將推出', officialLib: '官方資料庫', skillHub: '技能中樞', skillHubDesc: '瀏覽並下載官方技能、規則集與工作流程，以擴展您的 ChronicleCore 系統。更新由 A1 Sentinel 架構直接部署。', viewRepo: '檢視存放庫', govProtocol: '統治協定', batchExport: '全域備份', batchExportDesc: '執行全系統掃描。攔截所有加密對話節點，並將其具象化為 Markdown 檔案，同步至所有註冊專案中。', execProtocol: '執行協定', globalPathConf: '全域路徑配置', relativeTo: '相對於 ~/.gemini/antigravity/', preferLocal: '過濾同名 / 優先使用本地配置', skillsFolder: '技能資料夾', workflowsFolder: '工作流程資料夾', pathNote: '備註：目前 Antigravity 官方持續在調整全域路徑，請大家時時注意最新資訊。', saveConfig: '儲存配置', activityMonitor: '活動監控站', activityDesc: '上下文長度與活躍度 (過去十二小時)', confirmExport: '確定執行全系統對話萃取嗎？\n這將會解析所有歷史記錄並寫入 markdown 實體檔案。' },
    cn: { dashboard: '总览', history: '历史观测站', skills: '技能模块', workflows: '工作流程', rules: '规则规范', connect: '连通图谱', help: '操作规划', files: '档案', config: '配置', memo: '备忘', selectItem: '等待指令', helpTitle: '编年史操作规划', helpDesc: '款待与连通性中心。', intro: 'V2.1.0 标准: 深层检索、资产统治与防崩溃保护。', s1: '1. 深层检索: 历史对话全文增量缓存搜索。', s2: '2. 引力星图: 物理引擎驱动的有机星图拓扑。', s3: '3. 资产统治: 实体化备份、持久化索引与模块管理。', s4: '4. 核心修复 (V2.1): 原生绕过界面限制对话提取数量，彻底消除点击过期历史记录导致的核心崩溃。', saved: '已同步', lastSync: '最后修改', project: '项目', recent: '最近', recentTip: '全局 20 笔', tagged: '标签', pin: '置顶', unpin: '取消置顶', delete: '删除', deleteConfirm: '确认删除此记录？', addNote: '加入备注', editTags: '编辑标签', uploadAvatar: '上传头像', uploadCover: '上传封面', openFull: '开启全文视图', continueTerm: '在终端续聊', reveal: '在资源管理器中显示', sysOverview: 'ChronicleCore 系统总览', lspStandby: 'LSP 待命', lspComingSoon: 'LSP 即将推出', officialLib: '官方数据库', skillHub: '技能中枢', skillHubDesc: '浏览并下载官方技能、规则集与工作流程，以扩展您的 ChronicleCore 系统。更新由 A1 Sentinel 架构直接部署。', viewRepo: '检视代码库', govProtocol: '统治协议', batchExport: '全局备份', batchExportDesc: '执行全系统扫描。拦截所有加密对话节点，并将其具象化为 Markdown 文件，同步至所有注册项目中。', execProtocol: '执行协议', globalPathConf: '全局路径配置', relativeTo: '相对于 ~/.gemini/antigravity/', preferLocal: '过滤同名 / 优先使用本地配置', skillsFolder: '技能文件夹', workflowsFolder: '工作流程文件夹', pathNote: '备注：目前 Antigravity 官方持续在调整全局路径，请大家时时注意最新资讯。', saveConfig: '保存配置', activityMonitor: '活动监控站', activityDesc: '上下文长度与活跃度 (过去十二小时)', confirmExport: '确定执行全系统对话萃取吗？\n这将会解析所有历史记录并写入 markdown 实体文件。' },
    jp: { dashboard: 'ダッシュボード', history: 'アクティビティ', skills: 'スキル', workflows: 'ワークフロー', rules: 'ルール', connect: '接続性', help: 'マニュアル', files: 'ファイル', config: '構成', memo: 'メモ', selectItem: '待機中', helpTitle: 'クロニクルマニュアル', helpDesc: 'ホスピタリティ＆コネクティビティ。', intro: 'V2.1.0 規格: 検索と資産のガバナンスとクラッシュ保護', s1: 'ディープサーチ: 履歴の全文インデックス検索。', s2: 'スターマップ: 物理演算による知識ネットワークのトポロジー。', s3: 'アセット管理: 状態の永続化と一括エクスポート。', s4: '4. 重要な修正 (V2.1): アーカイブされた会話取得の UI 制限をネイティブに回避し、クラッシュを排除しました。', saved: '保存済み', lastSync: '最終更新', project: 'プロジェクト', recent: '最近', recentTip: 'グローバル20件', tagged: 'タグ', pin: '固定', unpin: '固定解除', delete: '削除', deleteConfirm: '削除してもよろしいですか？', addNote: 'メモ追加', editTags: 'タグ編輯', uploadAvatar: 'アバター', uploadCover: 'カバー', openFull: '全文を表示', continueTerm: 'ターミナルで続行', reveal: 'エクスプローラーで表示', sysOverview: 'ChronicleCore システム概要', lspStandby: 'LSP 待機中', lspComingSoon: 'LSP 近日公開', officialLib: '公式ライブラリ', skillHub: 'スキルハブ', skillHubDesc: '公式スキル、ルール、ワークフローをダウンロードします。', viewRepo: 'リポジトリを表示', govProtocol: 'ガバナンスプロトコル', batchExport: '一括エクスポート', batchExportDesc: '履歴をバックアップしてエクスポートします。', execProtocol: 'プロトコルを実行', globalPathConf: 'グローバルパス構成', relativeTo: '~/.gemini/antigravity/ 相対', preferLocal: 'ローカル構成を優先', skillsFolder: 'スキル フォルダー', workflowsFolder: 'ワークフロー フォルダー', pathNote: 'グローバルパスは調整中です。最新情報をご確認ください。', saveConfig: '構成を保存', activityMonitor: 'アクティビティモニター', activityDesc: 'コンテキストの長さとエンゲージメント（過去12時間）', confirmExport: 'すべてのログを抽出しますか？' },
    kr: { dashboard: '대시보드', history: '활동 로그', skills: '스킬', workflows: '워크플로우', rules: '규칙', connect: '연결성', help: '매뉴얼', files: '파일', config: '구성', memo: '메모', selectItem: '항목 대기중', helpTitle: '연대기 매뉴얼', helpDesc: '환대와 연결 중심지.', intro: 'V2.1.0 표준: 검색, 자산 거버넌스 및 크래시 방지.', s1: '딥 서치: 모든 연대기 기록의 전체 텍스트 인덱싱.', s2: '스타 맵: 복잡한 지식 네트워크를 위한 물리 지향 토폴로지.', s3: '자산 거버넌스: 물리적 상태 지속성 및 일괄 내보내기.', s4: '4. 핵심 수정 (V2.1): 보관된 대화 검색의 UI 제한을 기본적으로 우회하여 코어 크래시를 제거했습니다.', saved: '저장됨', lastSync: '최종 수정', project: '프로젝트', recent: '최근', recentTip: '글로벌 20개', tagged: '태그', pin: '고정', unpin: '고정 해제', delete: '삭제', deleteConfirm: '삭제하시겠습니까?', addNote: '메모 추가', editTags: '태그 편집', uploadAvatar: '아바타', uploadCover: '커버', openFull: '전체 보기', continueTerm: '터미널에서 계속', reveal: '탐색기에서 열기', sysOverview: 'ChronicleCore 시스템 개요', lspStandby: 'LSP 대기', lspComingSoon: 'LSP 출시 예정', officialLib: '공식 라이브러리', skillHub: '스킬 허브', skillHubDesc: '공식 스킬, 규칙 및 워크플로우를 찾아 다운로드합니다.', viewRepo: '저장소 보기', govProtocol: '거버넌스 프로토콜', batchExport: '일괄 내보내기', batchExportDesc: '전체 시스템 대화를 백업하고 내보냅니다.', execProtocol: '프로토콜 실행', globalPathConf: '글로벌 경로 구성', relativeTo: '~/.gemini/antigravity/ 상대 경로', preferLocal: '로컬 구성 선호', skillsFolder: '스킬 폴더', workflowsFolder: '워크플로우 폴더', pathNote: '참고: 글로벌 경로는 지속적으로 조정 중입니다. 최신 정보를 확인하세요.', saveConfig: '구성 저장', activityMonitor: '활동 모니터', activityDesc: '컨텍스트 길이 및 참여도 (지난 12시간)', confirmExport: '모든 대화를 추출하시겠습니까?' }
};

function App() {
    const { postMessage, lastMessage } = useVSCodeApi();
    const [skills, setSkills] = useState<Skill[]>([]);
    const [workflows, setWorkflows] = useState<Workflow[]>([]);
    const [rules, setRules] = useState<Rule[]>([]);
    const [connections, setConnections] = useState<any[]>([]);
    const [activeSkills, setActiveSkills] = useState<string[]>([]);

    const [activeView, setActiveView] = useState<ViewMode>('dashboard');
    const [lang, setLang] = useState<Lang>('tw');
    const [loading, setLoading] = useState(true);
    const [isSupporter, setIsSupporter] = useState(false);

    const [selectedSkillPath, setSelectedSkillPath] = useState<string | null>(null);
    const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null);
    const [selectedRule, setSelectedRule] = useState<Rule | null>(null);

    // History States
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
    const [conversationPreviewMarkdown, setConversationPreviewMarkdown] = useState<string>('');
    const [activeProjectFilter, setActiveProjectFilter] = useState<string>(''); // For accordion
    const [activeTagFilter, setActiveTagFilter] = useState<string>(''); // For filtering history

    const [searchQuery, setSearchQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [searchMatchedIds, setSearchMatchedIds] = useState<string[] | null>(null);
    const [hasAttemptedSearch, setHasAttemptedSearch] = useState(false);

    const handleSearch = () => {
        if (!searchQuery.trim()) {
            setSearchMatchedIds(null);
            return;
        }
        if (!hasAttemptedSearch) {
            if (!window.confirm('此操作將完整解析所有歷史對話為實體 .md 檔案以供檢索 (建立快取)，需要等待一段時間，是否繼續？')) {
                return;
            }
            setHasAttemptedSearch(true);
        }
        setIsSearching(true);
        postMessage('searchConversations', { query: searchQuery });
    };

    const [selectedFile, setSelectedFile] = useState<FileNode | null>(null);
    const [fileContent, setFileContent] = useState<string>('');
    const [skillTab, setSkillTab] = useState<'files' | 'config' | 'memo'>('files');

    const [memoContent, setMemoContent] = useState<string>('');
    const [isSavingMemo, setIsSavingMemo] = useState(false);
    const [systemStatus, setSystemStatus] = useState<any>({ lspConnected: false, csrfActive: false });


    const t = I18N[lang];
    const selectedSkill = skills.find(s => s.path === selectedSkillPath) || null;

    useEffect(() => { refreshAll(false); }, []);

    const refreshAll = (isManual = false) => {
        setLoading(true);
        postMessage('getSkills');
        postMessage('getWorkflows');
        postMessage('getRules');
        postMessage('getConversations', { showToast: isManual });
        postMessage('getConnectivity');
        postMessage('getActivity');
        postMessage('getSupporterStatus');
        postMessage('getSystemStatus');
    };

    useEffect(() => {
        if (!lastMessage) return;
        switch (lastMessage.command) {
            case 'updateSkills': setSkills(lastMessage.payload); break;
            case 'updateWorkflows': setWorkflows(lastMessage.payload); break;
            case 'updateRules': setRules(lastMessage.payload); break;
            case 'updateConnectivity': setConnections(lastMessage.payload); break;
            case 'updateActivity': setActiveSkills(lastMessage.payload); break;
            case 'updateConversations': {
                const isObjectPayload = !Array.isArray(lastMessage.payload);
                const convs = isObjectPayload ? lastMessage.payload.conversations : lastMessage.payload;
                const activeProjectName = isObjectPayload ? lastMessage.payload.activeProjectName : '';

                setConversations(convs);
                // Auto expand the top project
                if (convs.length > 0 && !activeProjectFilter) {
                    const matchedProject = convs.find((c: Conversation) => c.projectName === activeProjectName);
                    setActiveProjectFilter(matchedProject ? matchedProject.projectName : convs[0].projectName);
                }
                setLoading(false);
                break;
            }
            case 'updateConversationPreview':
                if (selectedConversation && lastMessage.payload.id === selectedConversation.id) {
                    setConversationPreviewMarkdown(lastMessage.payload.markdown);
                }
                break;
            case 'searchConversationsResult':
                setIsSearching(false);
                setSearchMatchedIds(lastMessage.payload);
                break;
            case 'updateSkillFiles':
                setSkills(prev => prev.map(s => s.path === lastMessage.payload.path ? { ...s, files: lastMessage.payload.files } : s));
                break;
            case 'fileContent':
                if (activeView === 'skills' && selectedFile && lastMessage.payload.path === selectedFile.path) {
                    setFileContent(lastMessage.payload.content);
                }
                break;
            case 'updateMemo':
                if (activeView === 'skills' && selectedSkill && lastMessage.payload.path === selectedSkill.path) {
                    setMemoContent(lastMessage.payload.content || '');
                }
                break;
            case 'supporterStatus':
                setIsSupporter(lastMessage.payload);
                break;
            case 'updateSystemStatus':
                setSystemStatus(lastMessage.payload);
                break;
            case 'updateGlobalConfig':
                setGlobalConfig(lastMessage.payload);
                break;
        }
    }, [lastMessage, selectedFile, activeView, selectedSkillPath, selectedSkill]);

    // Lazy Load Files on Selection
    useEffect(() => {
        if (activeView === 'skills' && selectedSkillPath && selectedSkill && (!selectedSkill.files || selectedSkill.files.length === 0)) {
            postMessage('getSkillFiles', { path: selectedSkillPath });
        }
    }, [selectedSkillPath, activeView, selectedSkill]);

    useEffect(() => {
        if (activeView === 'skills' && selectedSkill && skillTab === 'memo') {
            postMessage('getMemo', { path: selectedSkill.path });
        }
    }, [selectedSkillPath, skillTab, activeView, selectedSkill]);

    const handleMemoChange = (val: string) => {
        setMemoContent(val);
        setIsSavingMemo(true);
        const timer = setTimeout(() => {
            if (selectedSkill) {
                postMessage('saveMemo', { path: selectedSkill.path, content: val });
                setIsSavingMemo(false);
            }
        }, 1000);
        return () => clearTimeout(timer);
    };

    // Lazy Load Conversation Previews
    useEffect(() => {
        if (activeView === 'history' && selectedConversation && !conversationPreviewMarkdown) {
            postMessage('getConversationPreview', { id: selectedConversation.id, metadata: selectedConversation });
        }
    }, [selectedConversation, activeView, conversationPreviewMarkdown]);

    const [globalConfig, setGlobalConfig] = useState({ skills: 'global_skills', workflows: 'global_workflows', rules: 'rules', filterHomonyms: false });

    // Deduplication Logic
    const filteredSkills = useMemo<Skill[]>(() => {
        if (!globalConfig.filterHomonyms) return skills;
        const locals = skills.filter(s => s.source === 'local');
        const globals = skills.filter(s => s.source === 'global');
        return [...locals, ...globals.filter(g => !locals.some(l => l.name === g.name))];
    }, [skills, globalConfig.filterHomonyms]);

    const filteredWorkflows = useMemo<Workflow[]>(() => {
        if (!globalConfig.filterHomonyms) return workflows;
        const locals = workflows.filter(w => w.source === 'local');
        const globals = workflows.filter(w => w.source === 'global');
        return [...locals, ...globals.filter(g => !locals.some(l => l.name === g.name))];
    }, [workflows, globalConfig.filterHomonyms]);

    const filteredRules = useMemo<Rule[]>(() => {
        if (!globalConfig.filterHomonyms) return rules;
        const locals = rules.filter(r => r.source === 'local');
        const globals = rules.filter(r => r.source === 'global');
        return [...locals, ...globals.filter(g => !locals.some(l => l.name === g.name))];
    }, [rules, globalConfig.filterHomonyms]);

    return (
        <div className={`flex h-screen bg-[#0a0a0c] text-zinc-100 font-sans overflow-hidden select-none ${isSupporter ? 'theme-midnight-gold' : ''}`}>

            {/* 🌌 Antigravity: Skills Chronicle Nav Rail */}
            <div className="w-[72px] border-r border-white-[0.03] flex flex-col items-center py-6 gap-8 bg-[#0d0d10] z-20 shrink-0">
                <div className="relative">
                    <div className="p-2.5 bg-gradient-to-br from-red-600 to-red-950 rounded-2xl shadow-red-glow">
                        <CoreLogo />
                    </div>
                    <div className="absolute -inset-1 bg-zinc-500/10 blur-lg rounded-full animate-pulse" />
                </div>

                <div className="flex flex-col gap-5 w-full items-center">
                    <NavIcon active={activeView === 'dashboard'} icon={<Terminal size={22} />} label={t.dashboard} onClick={() => setActiveView('dashboard')} />
                    <NavIcon active={activeView === 'history'} icon={<Clock size={22} />} label={t.history} onClick={() => setActiveView('history')} />
                    <div className="w-8 h-px bg-white/5 my-1" />
                    <NavIcon active={activeView === 'skills'} icon={<Layers size={22} />} label={t.skills} onClick={() => setActiveView('skills')} />
                    <NavIcon active={activeView === 'workflows'} icon={<Zap size={22} />} label={t.workflows} onClick={() => setActiveView('workflows')} />
                    <NavIcon active={activeView === 'rules'} icon={<Scale size={22} />} label={t.rules} onClick={() => setActiveView('rules')} />
                    <NavIcon active={activeView === 'help'} icon={<HelpCircle size={22} />} label={t.help} onClick={() => setActiveView('help')} />
                    <div className="w-8 h-px bg-white/5 my-1" />
                    <NavIcon active={activeView === 'connectivity'} icon={<Share2 size={22} />} label={t.connect} onClick={() => setActiveView('connectivity')} />
                </div>

                <div className="flex-1" />

                <div className="flex flex-col gap-2 mb-6 w-full px-3">
                    <LangMiniBtn active={lang === 'en'} label="EN" onClick={() => setLang('en')} />
                    <LangMiniBtn active={lang === 'tw'} label="繁" onClick={() => setLang('tw')} />
                    <LangMiniBtn active={lang === 'cn'} label="简" onClick={() => setLang('cn')} />
                    <LangMiniBtn active={lang === 'jp'} label="JP" onClick={() => setLang('jp')} />
                    <LangMiniBtn active={lang === 'kr'} label="KR" onClick={() => setLang('kr')} />
                </div>
            </div>

            {/* 🟡 List Sidebar (V8.2 Unified Style) */}
            {activeView !== 'help' && activeView !== 'connectivity' && activeView !== 'dashboard' && (
                <div className="w-80 border-r border-white/5 flex flex-col bg-[#0b0b0d] shrink-0 relative z-10">
                    <div className="h-20 border-b border-white/5 flex items-center px-6 shrink-0 justify-between bg-[#1a1a1c]/50">
                        <div className="flex flex-col">
                            <span className="text-[10px] uppercase font-black tracking-[0.3em] text-red-600/50">ChronicleCore</span>
                            <span className="font-black text-xs text-zinc-400 tracking-widest uppercase">{t[activeView]}</span>
                        </div>
                        <RefreshCw size={14} className={`cursor-pointer text-zinc-600 hover:text-white transition-all ${loading ? 'animate-spin' : ''}`} onClick={() => refreshAll(true)} />
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
                        {activeView === 'skills' && filteredSkills.sort((a: Skill, b: Skill) => (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0)).map((skill: Skill) => (
                            <ListItem
                                key={skill.path}
                                active={selectedSkillPath === skill.path}
                                label={skill.name}
                                source={skill.source}
                                isActiveSkill={activeSkills.includes(skill.name)}
                                isBroken={skill.isBroken}
                                isEmpty={skill.isEmpty}
                                pinned={skill.isPinned}
                                onAction={(action: string) => action === 'pin' && postMessage('togglePin', { path: skill.path })}
                                onClick={() => { setSelectedSkillPath(skill.path); setSelectedFile(null); setSelectedWorkflow(null); setSelectedRule(null); }}
                            />
                        ))}
                        {activeView === 'workflows' && filteredWorkflows.sort((a: Workflow, b: Workflow) => (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0)).map((wf: Workflow) => (
                            <ListItem
                                key={wf.path}
                                active={selectedWorkflow?.path === wf.path}
                                label={wf.name}
                                source={wf.source}
                                isBroken={wf.isBroken}
                                isEmpty={wf.isEmpty}
                                pinned={wf.isPinned}
                                onAction={(action: string) => action === 'pin' && postMessage('togglePin', { path: wf.path })}
                                onClick={() => { setSelectedWorkflow(wf); setSelectedSkillPath(null); setSelectedRule(null); }}
                            />
                        ))}
                        {activeView === 'rules' && rules.sort((a: Rule, b: Rule) => (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0)).map((rule: Rule) => (
                            <ListItem
                                key={rule.path}
                                active={selectedRule?.path === rule.path}
                                label={rule.name}
                                source={rule.source}
                                isBroken={rule.isBroken}
                                isEmpty={rule.isEmpty}
                                pinned={rule.isPinned}
                                onAction={(action: string) => action === 'pin' && postMessage('togglePin', { path: rule.path })}
                                onClick={() => { setSelectedRule(rule); setSelectedSkillPath(null); setSelectedWorkflow(null); }}
                            />
                        ))}
                        {activeView === 'history' && (
                            <div className="flex flex-col gap-2">
                                {/* Search Input */}
                                <div className="px-2 mb-2">
                                    <input
                                        type="text"
                                        placeholder="SEARCH CHRONICLE..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') handleSearch();
                                            if (e.key === 'Escape') { setSearchQuery(''); setSearchMatchedIds(null); }
                                        }}
                                        className="w-full bg-black/40 border border-white/5 rounded-lg px-3 py-2 text-[10px] font-black uppercase tracking-widest text-zinc-300 focus:border-red-500/50 outline-none transition-colors"
                                    />
                                    {isSearching && <div className="text-[8px] text-red-500 uppercase tracking-widest animate-pulse mt-1 ml-1">Extracting & Scanning...</div>}
                                </div>
                                {/* Tag Filter */}
                                {conversations.length > 0 && (
                                    <div className="flex flex-wrap gap-1 px-2 mb-2">
                                        {Array.from(new Set(conversations.flatMap(c => c.tags || []))).sort().map(tag => (
                                            <button
                                                key={tag}
                                                onClick={() => setActiveTagFilter(activeTagFilter === tag ? '' : tag)}
                                                className={`px-2 py-0.5 text-[9px] font-black uppercase tracking-widest rounded transition-all border ${activeTagFilter === tag ? 'bg-red-900/40 text-red-500 border-red-500/20' : 'bg-white/5 text-zinc-500 border-transparent hover:bg-white/10 hover:text-zinc-300'}`}
                                            >
                                                {tag}
                                            </button>
                                        ))}
                                    </div>
                                )}

                                {Array.from(new Set(conversations.map(c => c.projectName))).sort().map(project => {
                                    const projConvs = conversations.filter(c =>
                                        c.projectName === project
                                        && (!activeTagFilter || (c.tags && c.tags.includes(activeTagFilter)))
                                        && (!searchMatchedIds || searchMatchedIds.includes(c.id))
                                    );
                                    if (projConvs.length === 0) return null;
                                    const isExpanded = activeProjectFilter === project;
                                    return (
                                        <div key={project} className="flex flex-col gap-1">
                                            <button
                                                onClick={() => setActiveProjectFilter(isExpanded ? '' : project)}
                                                className="flex items-center justify-between px-2 py-1.5 text-[10px] font-black uppercase tracking-wider text-zinc-500 hover:text-zinc-300 rounded hover:bg-white/5 transition-colors"
                                            >
                                                <div className="flex items-center gap-2">
                                                    <Folder size={12} className={isExpanded ? 'text-red-500' : ''} />
                                                    {project}
                                                </div>
                                                <div className="bg-white/5 px-1.5 py-0.5 rounded text-[8px]">{projConvs.length}</div>
                                            </button>

                                            {isExpanded && (
                                                <div className="flex flex-col gap-1 pl-2 border-l border-white/5 ml-2 mt-1 mb-2">
                                                    {projConvs.map(conv => (
                                                        <HistoryListItem
                                                            key={conv.id}
                                                            conversation={conv}
                                                            active={selectedConversation?.id === conv.id}
                                                            onClick={() => { setSelectedConversation(conv); setConversationPreviewMarkdown(''); }}
                                                        />
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                        {loading && <div className="p-8 text-center text-zinc-700 font-mono text-[10px] uppercase tracking-widest loading-text">Synchronizing...</div>}
                    </div>
                </div>
            )}

            {/* 🟢 Main Content (V8.2 Pure Stability - De-AI Aesthetic) */}
            <div className="flex-1 flex flex-col min-w-0 relative overflow-hidden bg-[#0a0a0c]">
                {/* Atmospheric Glows */}
                <div className="fixed top-0 right-0 bottom-0 w-1/2 bg-gradient-to-l from-red-900/[0.02] to-transparent pointer-events-none z-0" />

                <div className="w-full h-full flex flex-col items-center overflow-y-auto scrollbar-hide z-10">
                    <div className="w-full max-w-[1100px] min-h-full flex flex-col py-12 px-6">
                        {activeView === 'history' ? (
                            <ConversationView
                                conversation={selectedConversation}
                                previewMarkdown={conversationPreviewMarkdown}
                                t={t}
                                postMessage={postMessage}
                                setConversations={setConversations}
                                setSelectedConversation={setSelectedConversation}
                            />
                        ) : activeView === 'skills' && selectedSkill ? (
                            <SkillDetailView
                                skill={selectedSkill} activeTab={skillTab} setActiveTab={setSkillTab}
                                selectedFile={selectedFile} fileContent={fileContent} handleFileSelect={(f: any) => { setSelectedFile(f); if (f.type === 'file') postMessage('readFile', { path: f.path }); }}
                                t={t} memoContent={memoContent} handleMemoChange={handleMemoChange} isSavingMemo={isSavingMemo}
                                postMessage={postMessage}
                            />
                        ) : activeView === 'workflows' && selectedWorkflow ? (
                            <SimpleMarkdownView item={selectedWorkflow} updateItem={setSelectedWorkflow} icon={<Zap size={32} />} title={t.workflows} postMessage={postMessage} />
                        ) : activeView === 'rules' && selectedRule ? (
                            <SimpleMarkdownView item={selectedRule} updateItem={setSelectedRule} icon={<Scale size={32} />} title={t.rules} postMessage={postMessage} />
                        ) : activeView === 'connectivity' ? (
                            <ConnectivityView connections={connections} skills={filteredSkills} t={t} />
                        ) : activeView === 'help' ? (
                            <HelpView t={t} isSupporter={isSupporter} postMessage={postMessage} />
                        ) : activeView === 'dashboard' ? (
                            <DashboardView t={t} skills={filteredSkills} workflows={filteredWorkflows} rules={filteredRules} systemStatus={systemStatus} postMessage={postMessage} globalConfig={globalConfig} activeSkills={activeSkills} />
                        ) : (
                            <EmptyState t={t} />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

// --- V7 Components ---

// --- V8.0 Components (The Sanctuary) ---

function DashboardView({ t, skills, workflows, rules, systemStatus, postMessage, globalConfig, activeSkills }: any): JSX.Element {
    const [localConfig, setLocalConfig] = useState(globalConfig);

    useEffect(() => {
        postMessage('getGlobalConfig');
    }, []);

    useEffect(() => {
        setLocalConfig(globalConfig);
    }, [globalConfig]);

    const handleSaveConfig = () => {
        postMessage('saveGlobalConfig', localConfig);
    };

    return (
        <div className="flex-1 flex flex-col items-center">
            <header className="w-full mb-12 flex items-center justify-between">
                <div className="flex items-center gap-6">
                    <div className="p-4 bg-red-950/40 rounded-2xl text-red-600 shadow-xl shadow-red-900/10"><Activity size={32} /></div>
                    <div>
                        <h1 className="text-4xl font-black text-white tracking-tighter uppercase">{t.dashboard}</h1>
                        <p className="text-zinc-500 text-lg uppercase tracking-widest font-bold text-[10px] mt-1 opacity-50">{t.sysOverview}</p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 px-4 py-2 bg-white/2 border border-white/5 rounded-xl">
                        <div className={`w-2 h-2 ${systemStatus?.lspConnected ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]' : 'bg-red-500'} rounded-full`} />
                        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
                            {systemStatus?.lspConnected ? t.lspStandby : t.lspComingSoon}
                        </span>
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-3 gap-6 w-full mb-10">
                <StatsCard icon={<Layers size={20} />} label={t.skills} count={skills.length} color="text-red-500" />
                <StatsCard icon={<Zap size={20} />} label={t.workflows} count={workflows.length} color="text-red-500" />
                <StatsCard icon={<Scale size={20} />} label={t.rules} count={rules.length} color="text-red-500" />
            </div>

            <div className="grid grid-cols-2 gap-6 w-full h-auto mb-12">
                <div className="bg-gradient-to-br from-red-950/20 to-transparent rounded-[2rem] border border-white/5 p-10 flex flex-col justify-between group hover:border-red-900/20 transition-all cursor-pointer shadow-4xl relative overflow-hidden min-h-[300px]" onClick={() => postMessage('openExternal', 'https://github.com/Zaious/Antigravity-Skills-Chronicle')}>
                    <div className="absolute right-0 bottom-0 opacity-5 group-hover:opacity-10 transition-opacity translate-x-10 translate-y-10">
                        <Package size={300} className="text-white" />
                    </div>
                    <div>
                        <div className="text-[10px] font-black uppercase tracking-[0.4em] text-amber-500/50 mb-4">{t.officialLib}</div>
                        <h2 className="text-4xl font-black text-white tracking-tighter leading-tight mb-4">{t.skillHub}</h2>
                        <p className="text-zinc-500 text-sm leading-relaxed max-w-md">
                            {t.skillHubDesc}
                        </p>
                    </div>
                    <div className="flex items-center gap-4 text-xs font-black uppercase tracking-widest text-zinc-600 group-hover:text-red-500 transition-colors mt-8">
                        {t.viewRepo} <ChevronRight size={14} />
                    </div>
                </div>

                <div className="bg-gradient-to-br from-zinc-900/50 to-transparent rounded-[2rem] border border-white/5 p-10 flex flex-col justify-between group hover:border-white/10 transition-all cursor-pointer shadow-4xl relative overflow-hidden min-h-[300px]"
                    onClick={() => { postMessage('batchExportConversations'); }}>
                    <div className="absolute right-0 bottom-0 opacity-5 group-hover:opacity-10 transition-opacity translate-x-10 translate-y-10">
                        <DownloadCloud size={300} className="text-white" />
                    </div>
                    <div>
                        <div className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-500 mb-4">{t.govProtocol}</div>
                        <h2 className="text-4xl font-black text-white tracking-tighter leading-tight mb-4">{t.batchExport}</h2>
                        <p className="text-zinc-400 text-sm leading-relaxed max-w-md">
                            {t.batchExportDesc}
                        </p>
                    </div>
                    <div className="flex items-center gap-4 text-xs font-black uppercase tracking-widest text-zinc-500 group-hover:text-white transition-colors mt-8">
                        {t.execProtocol} <ChevronRight size={14} />
                    </div>
                </div>
            </div>

            {/* Global Path Configuration */}
            <div className="w-full bg-[#0b0b0d] rounded-[2rem] border border-white/5 p-10 shadow-4xl mb-12 relative overflow-hidden">
                <div className="flex items-center justify-between gap-4 mb-8">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-zinc-800/50 rounded-xl text-zinc-400"><Folder size={20} /></div>
                        <div>
                            <h2 className="text-xl font-black text-white tracking-tighter uppercase">{t.globalPathConf}</h2>
                            <p className="text-zinc-600 text-[10px] font-bold uppercase tracking-widest mt-1">{t.relativeTo}</p>
                        </div>
                    </div>

                    <label className="flex items-center gap-3 cursor-pointer group px-4 py-2 bg-white/5 rounded-xl border border-white/5 hover:bg-red-900/20 hover:border-red-500/20 transition-all">
                        <input
                            type="checkbox"
                            checked={localConfig.filterHomonyms || false}
                            onChange={(e) => setLocalConfig({ ...localConfig, filterHomonyms: e.target.checked })}
                            className="bg-black border border-white/10 rounded cursor-pointer h-4 w-4 checked:bg-red-500 focus:ring-0 focus:ring-offset-0"
                        />
                        <span className="text-[10px] font-black text-zinc-400 group-hover:text-red-400 transition-colors tracking-widest uppercase">{t.preferLocal}</span>
                    </label>
                </div>

                <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-zinc-600">{t.skillsFolder}</label>
                        <input
                            type="text"
                            value={localConfig.skills || ''}
                            onChange={(e) => setLocalConfig({ ...localConfig, skills: e.target.value })}
                            className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-xs font-mono text-zinc-300 focus:border-red-500/50 outline-none transition-colors"
                            placeholder="global_skills"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-zinc-600">{t.workflowsFolder}</label>
                        <input
                            type="text"
                            value={localConfig.workflows || ''}
                            onChange={(e) => setLocalConfig({ ...localConfig, workflows: e.target.value })}
                            className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-xs font-mono text-zinc-300 focus:border-red-500/50 outline-none transition-colors"
                            placeholder="global_workflows"
                        />
                    </div>
                </div>

                <div className="mt-8 flex items-center justify-between">
                    <div className="flex items-start gap-3 max-w-2xl">
                        <div className="mt-1 text-amber-500"><Activity size={12} /></div>
                        <p className="text-[10px] text-amber-500/80 uppercase font-bold tracking-wider leading-relaxed">
                            {t.pathNote}
                        </p>
                    </div>
                    <button
                        onClick={handleSaveConfig}
                        className="px-6 py-3 bg-white/5 hover:bg-white/10 text-white border border-white/5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 hover:border-white/20"
                    >
                        <Save size={14} /> {t.saveConfig}
                    </button>
                </div>
            </div >

            {/* Activity Monitor */}
            <div className="w-full bg-[#0b0b0d] rounded-[2rem] border border-white/5 p-10 shadow-4xl mb-12 relative overflow-hidden">
                <div className="flex items-center gap-4 mb-8">
                    <div className="p-3 bg-red-900/20 rounded-xl text-red-500"><Activity size={20} /></div>
                    <div>
                        <h2 className="text-xl font-black text-white tracking-tighter uppercase">{t.activityMonitor}</h2>
                        <p className="text-zinc-600 text-[10px] font-bold uppercase tracking-widest mt-1">{t.activityDesc}</p>
                    </div>
                </div>

                {activeSkills && activeSkills.length > 0 ? (
                    <div className="flex flex-col gap-2 border-l border-white/5 pl-4 ml-6">
                        {activeSkills.map((act: any, idx: number) => (
                            <div key={idx} className="flex justify-between items-center py-2 border-b border-white/5 last:border-0 hover:pl-2 transition-all">
                                <div className="text-xs font-black uppercase tracking-widest text-zinc-300 flex items-center gap-3">
                                    <div className="w-1.5 h-1.5 rounded-full bg-red-500 opacity-50 shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
                                    {act.name}
                                </div>
                                <div className="flex items-center gap-6">
                                    <div className="text-[10px] text-zinc-500 font-mono tracking-widest opacity-80 uppercase">{new Date(act.lastActive).toLocaleTimeString()}</div>
                                    <div className="text-xs font-black text-red-400 tracking-wider bg-red-950/40 px-3 py-1.5 rounded-lg border border-red-900/30 w-32 text-center">
                                        {act.tokens.toLocaleString()} TOKENS
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-700 text-center py-12 flex flex-col items-center gap-4">
                        <Activity size={32} className="opacity-20" />
                        No Recent Activity / Core Idle
                    </div>
                )}
            </div>
        </div >
    );
}

function StatsCard({ icon, label, count, color }: any) {
    return (
        <div className="bg-[#0b0b0d] p-8 rounded-3xl border border-white/5 flex items-center gap-6 group hover:border-white/10 transition-all shadow-2xl">
            <div className={`p-4 bg-white/2 rounded-2xl ${color} shadow-inner-glow group-hover:scale-110 transition-transform`}>{icon}</div>
            <div>
                <div className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-700 mb-1 group-hover:text-zinc-500 transition-colors">{label}</div>
                <div className="text-3xl font-black text-white tracking-tighter">{count}</div>
            </div>
        </div>
    );
}

function SkillDetailView({ skill, activeTab, setActiveTab, selectedFile, fileContent, handleFileSelect, t, memoContent, handleMemoChange, isSavingMemo, postMessage, updateSkill }: any) {
    const bgStyle = skill?.cover ? { backgroundImage: `url(${skill.cover})` } : { background: 'rgba(255,255,255,0.02)' };
    const [isAddingTag, setIsAddingTag] = useState(false);
    const [newTag, setNewTag] = useState('');

    const handleAddTag = () => {
        if (!newTag.trim()) {
            setIsAddingTag(false);
            return;
        }
        const tag = newTag.trim();
        const updatedTags = [...(skill.tags || []), tag].filter((v, i, a) => a.indexOf(v) === i);
        const updatedSkill = { ...skill, tags: updatedTags };

        postMessage('saveSkillMetadata', { name: skill.name, metadata: { tags: updatedTags, memo: memoContent } });
        updateSkill(updatedSkill);

        setNewTag('');
        setIsAddingTag(false);
    };

    const handleRemoveTag = (tagToRemove: string) => {
        const updatedTags = (skill.tags || []).filter((tg: string) => tg !== tagToRemove);
        const updatedSkill = { ...skill, tags: updatedTags };

        postMessage('saveSkillMetadata', { name: skill.name, metadata: { tags: updatedTags, memo: memoContent } });
        updateSkill(updatedSkill);
    };

    const handleMediaUpload = (type: 'avatar' | 'cover', file: File) => {
        const reader = new FileReader();
        reader.onload = () => {
            const base64 = reader.result as string;
            postMessage('uploadSkillMedia', { skillPath: skill.path, type, data: base64 });
        };
        reader.readAsDataURL(file);
    };

    if (!skill) return null;

    return (
        <div className="flex flex-col">
            {/* V8.4 Stability & Cyber Amber Alert Banner */}
            {(skill.isBroken || skill.isEmpty) && (
                <div className="mb-6 mx-2 p-6 rounded-[2rem] bg-red-500/5 border border-red-500/10 backdrop-blur-3xl flex items-center justify-between shadow-2xl shadow-red-500/5 active-slide-in">
                    <div className="flex items-center gap-6">
                        <div className="p-3 bg-red-500/10 rounded-2xl text-red-500 shadow-xl"><Zap size={24} /></div>
                        <div>
                            <h3 className="text-lg font-black text-red-500/80 uppercase tracking-tighter">INTEGRITY ADVISORY</h3>
                            <p className="text-[10px] text-red-500/30 uppercase font-black tracking-[0.4em] mt-1">
                                {skill.isBroken ? "CORRUPTED CHRONICLE NODE (ENCODING/YAML)" : "EMPTY CHRONICLE NODE (NO ASSETS)"}
                            </p>
                        </div>
                    </div>
                    <div className="px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.3em] text-red-600 bg-red-500/5 border border-red-500/20 animate-pulse">
                        BLOCKING SYNC
                    </div>
                </div>
            )}

            {/* V8.3 Standardized Hero - Physical Style */}
            <div className="relative h-72 rounded-[2rem] overflow-hidden border border-white/5 mb-10 group bg-[#111114]">
                <div className="absolute inset-0 opacity-10" style={bgStyle} />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0c] via-transparent to-transparent" />

                {/* Cover Upload Trigger */}
                <label className="absolute top-4 left-4 z-20 px-4 py-2 bg-black/60 text-white text-[9px] font-black uppercase tracking-widest rounded-lg opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer flex items-center gap-2 hover:bg-black/80">
                    <input type="file" accept="image/png,image/jpeg" className="hidden" onChange={(e) => e.target.files?.[0] && handleMediaUpload('cover', e.target.files[0])} />
                    <Upload size={12} /> {t.uploadCover}
                </label>

                <div className="absolute bottom-8 inset-x-10 flex items-center gap-8 z-10">
                    <div className="relative shrink-0 group/avatar">
                        <div className="w-32 h-32 rounded-3xl overflow-hidden border border-white/10 shadow-inner-glow bg-black relative z-10">
                            {skill.avatar ? (
                                <img src={skill.avatar} className="w-full h-full object-cover grayscale opacity-90 group-hover:grayscale-0 transition-all duration-700" alt="Avatar" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-zinc-900 text-zinc-700 font-bold text-3xl uppercase tracking-tighter border border-white/5">
                                    {skill.name?.charAt(0) || '?'}
                                </div>
                            )}
                        </div>
                        <label className="absolute inset-0 z-20 flex items-center justify-center bg-black/60 opacity-0 group-hover/avatar:opacity-100 transition-opacity cursor-pointer rounded-3xl">
                            <input type="file" accept="image/png,image/jpeg" className="hidden" onChange={(e) => e.target.files?.[0] && handleMediaUpload('avatar', e.target.files[0])} />
                            <Upload size={20} className="text-white" />
                        </label>
                    </div>

                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-4 mb-3">
                            <h1 className="text-4xl font-black text-white tracking-tighter leading-tight">{skill.name}</h1>
                            <span className="text-[10px] font-black text-zinc-400 bg-white/5 px-4 py-1.5 rounded-full border border-white/10 tracking-widest uppercase">{skill.source}</span>
                        </div>
                        <div className="max-h-24 overflow-y-auto scrollbar-hide mb-4">
                            <p className="text-zinc-400 text-xl font-medium leading-relaxed tracking-tight">
                                {skill.description || 'Identity data encrypted.'}
                            </p>
                        </div>
                        {/* Tags Display */}
                        <div className="flex flex-wrap items-center gap-2">
                            {skill.tags && skill.tags.map((tag: string) => (
                                <div key={tag} className="flex items-center gap-1 px-2 py-1 text-[10px] font-black uppercase tracking-widest bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 rounded border border-white/10 transition-colors group">
                                    <span>{tag}</span>
                                    <button className="opacity-0 group-hover:opacity-100 transition-opacity text-zinc-500 hover:text-red-500" onClick={() => handleRemoveTag(tag)}><X size={10} /></button>
                                </div>
                            ))}
                            {isAddingTag ? (
                                <div className="flex items-center shrink-0">
                                    <input
                                        autoFocus
                                        type="text"
                                        value={newTag}
                                        onChange={(e) => setNewTag(e.target.value)}
                                        onBlur={handleAddTag}
                                        onKeyDown={(e) => { if (e.key === 'Enter') handleAddTag(); if (e.key === 'Escape') setIsAddingTag(false); }}
                                        className="px-2 py-1 text-[10px] font-black uppercase tracking-widest bg-black text-white rounded border border-red-500/50 outline-none w-24"
                                        placeholder="NEW TAG..."
                                    />
                                </div>
                            ) : (
                                <button
                                    onClick={() => setIsAddingTag(true)}
                                    className="px-2 py-1 flex items-center gap-1 text-[10px] font-black uppercase tracking-widest hover:bg-white/10 text-zinc-500 hover:text-white rounded border border-transparent hover:border-white/10 transition-all"
                                >
                                    <Plus size={10} /> Add Tag
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                <div className="absolute top-10 right-12 text-right">
                    <div className="text-[10px] uppercase font-black tracking-[0.4em] text-zinc-700 mb-2">{t.lastSync}</div>
                    <div className="text-[11px] font-black text-zinc-500 flex items-center justify-end gap-3 bg-white/2 px-4 py-2 rounded-xl border border-white/5 shadow-sm">
                        <Clock size={14} className="text-zinc-600" />
                        <span className="font-mono">{skill.lastModified ? new Date(skill.lastModified).toLocaleDateString() : '---'}</span>
                    </div>
                </div>
            </div>

            {/* Sanctuary Tabs */}
            <div className="flex gap-4 mb-8">
                {['files', 'config', 'memo'].map((tab: any) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`flex items-center gap-3 px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-[0.3em] transition-all duration-500 border relative overflow-hidden ${activeTab === tab ? 'bg-red-800 text-white border-red-700/50 shadow-2xl shadow-red-900/40 scale-105 z-10' : 'bg-white/5 text-zinc-600 border-white/5 hover:bg-white/10 hover:text-zinc-300'}`}
                    >
                        {tab === 'files' && <Folder size={16} />}
                        {tab === 'config' && <Box size={16} />}
                        {tab === 'memo' && <FileText size={16} />}
                        {t[tab]}
                    </button>
                ))}
                <div className="flex-1" />
                <button
                    onClick={() => postMessage('revealInExplorer', { path: skill.path })}
                    className="flex items-center gap-3 px-8 py-4 rounded-2xl bg-white/2 text-zinc-500 border border-white/5 hover:bg-white/5 hover:text-zinc-300 font-black text-xs uppercase tracking-[0.2em] transition-all"
                >
                    <Folder size={16} /> {t.reveal}
                </button>
            </div>

            {/* Sanctuary Content Panels - V8.3 Standard Width & Physical Style */}
            <div className="bg-[#0b0b0d] rounded-[2rem] border border-white/5 shadow-4xl min-h-[650px] overflow-hidden relative w-full">
                {activeTab === 'files' && (
                    <div className="h-full flex flex-col">
                        <div className="px-10 py-5 border-b border-white/5 flex items-center justify-between bg-black/10">
                            <div className="flex items-center gap-4">
                                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-700">File Matrix</span>
                                <div className="h-4 w-px bg-white/5" />
                                <div className="text-[10px] font-mono text-zinc-600 truncate max-w-lg tracking-wider">{skill.path}</div>
                            </div>
                            <Activity size={14} className="text-zinc-700" />
                        </div>
                        <div className="flex-1 flex overflow-hidden">
                            <div className="w-[300px] border-r border-white/5 bg-black/5 p-6 overflow-y-auto custom-scrollbar">
                                <FileTree files={skill.files} onSelect={handleFileSelect} />
                            </div>
                            <div className="flex-1 bg-black/10 h-[600px] overflow-hidden">
                                <FilePreview file={selectedFile ? { ...selectedFile, content: fileContent } : null} />
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'config' && (
                    <div className="p-12">
                        <div className="mb-10 p-6 rounded-2xl bg-zinc-900/50 border border-white/5">
                            <h3 className="text-xs font-black text-zinc-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                                <Box size={14} className="text-zinc-600" /> Chronicle Node Schema
                            </h3>
                            <p className="text-[10px] text-zinc-600 uppercase font-bold leading-relaxed">
                                This reflects the metadata extracted from the SKILL.md YAML frontmatter. It defines the core identity and behavioral constraints of the Role.
                            </p>
                        </div>
                        <div className="w-full">
                            <table className="w-full text-left border-collapse">
                                <tbody className="divide-y divide-white/5">
                                    {Object.entries(skill.meta || {}).filter(([k]) => k !== 'name' && k !== 'description' && typeof skill.meta[k] !== 'object').map(([k, v]) => (
                                        <tr key={k} className="group transition-all hover:bg-white/[0.01]">
                                            <td className="py-6 pr-12 w-1/3">
                                                <div className="text-[10px] uppercase font-black tracking-[0.4em] text-zinc-700 group-hover:text-zinc-500 transition-colors">{k}</div>
                                            </td>
                                            <td className="py-6">
                                                <div className="text-sm font-bold text-zinc-400 group-hover:text-zinc-200 transition-colors">{String(v)}</div>
                                            </td>
                                        </tr>
                                    ))}
                                    {Object.entries(skill.meta || {}).filter(([_, v]) => typeof v === 'object' && v !== null).map(([k, v]: [string, any]) => (
                                        <tr key={k}>
                                            <td colSpan={2} className="py-10">
                                                <div className="flex items-center gap-4 mb-8">
                                                    <div className="h-px flex-1 bg-white/5" />
                                                    <div className="text-[10px] uppercase font-black tracking-[0.5em] text-zinc-700">{k}</div>
                                                    <div className="h-px flex-1 bg-white/5" />
                                                </div>
                                                <div className="grid grid-cols-2 gap-4">
                                                    {Object.entries(v).map(([sk, sv]: [string, any]) => (
                                                        <div key={sk} className="p-6 rounded-2xl bg-black/5 border border-white/5 hover:border-white/10 transition-all group">
                                                            <div className="text-[9px] uppercase font-black tracking-widest text-zinc-700 mb-2 group-hover:text-zinc-600">{sk}</div>
                                                            <div className="text-xs font-bold text-zinc-500 group-hover:text-zinc-300">{String(sv)}</div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === 'memo' && (
                    <div className="p-12 h-full flex flex-col gap-10">
                        <div className="flex justify-between items-center p-8 rounded-2xl bg-white/[0.01] border border-white/5 shadow-inner-glow">
                            <div className="flex items-center gap-6">
                                <div className="p-4 bg-white/5 rounded-2xl text-zinc-500"><FileText size={24} /></div>
                                <div>
                                    <h3 className="text-lg font-black text-white uppercase tracking-tighter">Synchronized Memory</h3>
                                    <p className="text-[9px] text-zinc-700 uppercase font-black tracking-[0.4em] mt-1">Encrypted AGP local persistence node.</p>
                                </div>
                            </div>
                            <div className={`px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.3em] flex items-center gap-3 border transition-all duration-700 ${isSavingMemo ? 'text-yellow-600 bg-yellow-400/5 border-yellow-500/20' : 'text-zinc-600 bg-white/2 border-white/5'}`}>
                                {isSavingMemo ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />} {isSavingMemo ? 'TRANSMITTING' : 'SYNCHRONIZED'}
                            </div>
                        </div>
                        <textarea
                            value={memoContent}
                            onChange={(e) => handleMemoChange(e.target.value)}
                            className="flex-1 w-full bg-black/10 border border-white/5 rounded-2xl p-12 text-zinc-400 font-mono text-base leading-relaxed focus:outline-none focus:border-white/10 transition-all resize-none placeholder-zinc-800"
                            placeholder="// Enter encrypted notations..."
                        />
                    </div>
                )}
            </div>
        </div>
    );
}

const ConversationView = memo(({ conversation, previewMarkdown, postMessage, setConversations, setSelectedConversation }: any) => {
    const [isAddingTag, setIsAddingTag] = useState(false);
    const [newTag, setNewTag] = useState('');

    const handleAddTag = () => {
        if (!newTag.trim()) {
            setIsAddingTag(false);
            return;
        }
        const tag = newTag.trim();
        const updatedTags = [...(conversation.tags || []), tag].filter((v, i, a) => a.indexOf(v) === i);
        const updatedConversation = { ...conversation, tags: updatedTags };

        setSelectedConversation(updatedConversation);
        setConversations((prev: any) => prev.map((c: any) => c.id === conversation.id ? updatedConversation : c));
        postMessage('saveConversationMetadata', { id: conversation.id, metadata: updatedConversation });

        setNewTag('');
        setIsAddingTag(false);
    };

    const handleRemoveTag = (tagToRemove: string) => {
        const updatedTags = (conversation.tags || []).filter((tg: string) => tg !== tagToRemove);
        const updatedConversation = { ...conversation, tags: updatedTags };

        setSelectedConversation(updatedConversation);
        setConversations((prev: any) => prev.map((c: any) => c.id === conversation.id ? updatedConversation : c));
        postMessage('saveConversationMetadata', { id: conversation.id, metadata: updatedConversation });
    };

    return (
        <div className="flex-1 w-full flex flex-col items-center overflow-auto custom-scrollbar">
            {conversation ? (
                <div className="w-full max-w-5xl px-8 py-10 fade-in">
                    {/* Header & Tactical Buttons */}
                    <div className="flex items-start justify-between mb-8">
                        <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-2">
                                <span className="px-2 py-0.5 text-[9px] font-black uppercase tracking-widest bg-zinc-800 text-zinc-400 rounded-sm border border-white/5">
                                    {conversation.projectName}
                                </span>
                                <span className="text-xs text-zinc-500 font-mono tracking-wider">
                                    ID: {conversation.id.slice(0, 8)}
                                </span>
                            </div>
                            <h1 className="text-3xl font-black tracking-tight text-white/90">
                                {conversation.summary}
                            </h1>
                        </div>

                        <div className="flex gap-2">
                            <button
                                onClick={() => postMessage('saveConversation', { id: conversation.id, metadata: conversation })}
                                className="flex items-center gap-2 px-4 py-2 bg-red-900/20 hover:bg-red-900/40 text-red-500 hover:text-red-400 rounded-lg border border-red-500/20 transition-all text-xs font-bold shadow-lg shadow-red-900/10"
                            >
                                <Save size={14} />
                                Export
                            </button>
                        </div>
                    </div>

                    {/* Tags display (Notion-like) */}
                    <div className="flex flex-wrap items-center gap-2 mb-8">
                        {conversation.tags && conversation.tags.map((tag: string) => (
                            <div key={tag} className="flex items-center gap-1 px-2 py-1 text-[10px] font-black uppercase tracking-widest bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded border border-white/10 transition-colors group">
                                <span>{tag}</span>
                                <button className="opacity-0 group-hover:opacity-100 transition-opacity text-zinc-500 hover:text-red-500" onClick={() => handleRemoveTag(tag)}><X size={10} /></button>
                            </div>
                        ))}
                        {isAddingTag ? (
                            <div className="flex items-center shrink-0">
                                <input
                                    autoFocus
                                    type="text"
                                    value={newTag}
                                    onChange={(e) => setNewTag(e.target.value)}
                                    onBlur={handleAddTag}
                                    onKeyDown={(e) => { if (e.key === 'Enter') handleAddTag(); if (e.key === 'Escape') setIsAddingTag(false); }}
                                    className="px-2 py-1 text-[10px] font-black uppercase tracking-widest bg-black text-white rounded border border-red-500/50 outline-none w-24"
                                    placeholder="NEW TAG..."
                                />
                            </div>
                        ) : (
                            <button
                                onClick={() => setIsAddingTag(true)}
                                className="px-2 py-1 flex items-center gap-1 text-[10px] font-black uppercase tracking-widest hover:bg-white/10 text-zinc-500 hover:text-white rounded border border-transparent hover:border-white/10 transition-all"
                            >
                                <Plus size={10} /> Add Tag
                            </button>
                        )}
                    </div>

                    {/* Preview Content */}
                    <div className="bg-[#0b0b0d] rounded-2xl border border-white/5 shadow-4xl p-8 min-h-[500px]">
                        {previewMarkdown ? (
                            <SimpleMarkdownView
                                item={{ name: 'Markdown Preview', content: previewMarkdown, path: '' }}
                                icon={<FileText size={16} />}
                                title="Conversation Preview"
                                postMessage={postMessage}
                            />
                        ) : (
                            <div className="w-full h-full min-h-[400px] flex items-center justify-center text-zinc-600 flex-col gap-4">
                                <RefreshCw size={24} className="animate-spin opacity-50" />
                                <div className="text-[10px] uppercase font-black tracking-widest text-zinc-500">Extracting Chronicle Data...</div>
                            </div>
                        )}
                    </div>

                </div>
            ) : (
                <div className="m-auto flex flex-col items-center gap-4 text-center opacity-50">
                    <div className="w-20 h-20 rounded-3xl bg-white/[0.02] border border-white/[0.05] flex items-center justify-center">
                        <Clock size={32} className="text-zinc-600" />
                    </div>
                    <div className="text-sm font-black uppercase tracking-[0.2em] text-zinc-500">
                        Select a record to observe
                    </div>
                </div>
            )}
        </div>
    );
});

const ConnectivityView = memo(({ connections, skills, t }: any) => {
    const [viewMode, setViewMode] = useState<'starmap' | 'list'>('starmap');

    const { nodes: initialNodes, edges: initialEdges } = useMemo(() => {
        const nodeSet = new Set<string>();
        connections.forEach((c: any) => {
            nodeSet.add(c.from);
            nodeSet.add(c.to);
        });

        const rawNodes = Array.from(nodeSet).map(id => {
            const isSkill = id.includes('@') || (skills && skills.some((s: any) => s.name === id));
            return {
                id,
                data: { label: id.replace('.md', '') },
                type: 'default',
                style: {
                    background: isSkill ? '#451a03' : '#450a0a',
                    color: isSkill ? '#fcd34d' : '#f87171',
                    border: '1px solid ' + (isSkill ? '#b45309' : '#991b1b'),
                    borderRadius: '12px',
                    fontSize: '10px',
                    fontWeight: 900,
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    padding: '16px 20px',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
                    width: 180,
                    textAlign: 'center'
                }
            };
        });

        const rawEdges = connections.map((c: any, i: number) => ({
            id: `e-${c.from}-${c.to}-${i}`,
            source: c.from,
            target: c.to,
            type: 'smoothstep',
            animated: c.type === 'workflow-workflow',
            markerEnd: { type: MarkerType.ArrowClosed, color: c.type === 'workflow-workflow' ? '#ef4444' : '#f59e0b' },
            style: { stroke: c.type === 'workflow-workflow' ? '#ef4444' : '#f59e0b', strokeWidth: 2 }
        }));

        return getForceLayoutedElements(rawNodes, rawEdges);
    }, [connections, skills]);

    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

    useEffect(() => {
        setNodes(initialNodes);
        setEdges(initialEdges);
    }, [initialNodes, initialEdges]);

    return (
        <div className="flex-1 p-6 md:p-12 overflow-hidden flex flex-col h-full w-full max-w-7xl mx-auto">
            <header className="mb-8 shrink-0 flex items-start justify-between">
                <div>
                    <div className="flex items-center gap-4 mb-3">
                        <div className="p-4 bg-red-950/40 rounded-2xl text-red-600 shadow-xl shadow-red-900/10"><Share2 size={32} /></div>
                        <h1 className="text-4xl font-black text-white tracking-tighter uppercase">{t.connect}</h1>
                    </div>
                    <p className="text-zinc-500 text-lg">Visual map of inter-skill signals and workflow triggers.</p>
                </div>
                {/* View Mode Toggle */}
                <div className="flex bg-black/40 p-1.5 rounded-2xl border border-white/5 shadow-inner">
                    <button
                        onClick={() => setViewMode('starmap')}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'starmap' ? 'bg-red-900/40 text-red-400 border border-red-500/20 shadow-lg' : 'text-zinc-500 hover:text-zinc-300 border border-transparent'}`}
                    >
                        <Network size={14} /> Star Map
                    </button>
                    <button
                        onClick={() => setViewMode('list')}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'list' ? 'bg-zinc-800 text-white border border-white/10 shadow-lg' : 'text-zinc-500 hover:text-zinc-300 border border-transparent'}`}
                    >
                        <List size={14} /> Linear List
                    </button>
                </div>
            </header>

            <div className={`flex-1 relative border border-white/5 rounded-[2rem] overflow-hidden shadow-4xl bg-black min-h-[500px] ${viewMode === 'list' && 'overflow-y-auto custom-scrollbar p-12 bg-black/10'}`}>
                {connections.length > 0 ? (
                    viewMode === 'starmap' ? (
                        <ReactFlow
                            nodes={nodes}
                            edges={edges}
                            onNodesChange={onNodesChange}
                            onEdgesChange={onEdgesChange}
                            fitView
                            attributionPosition="bottom-right"
                            minZoom={0.1}
                        >
                            <Background color="#fff" gap={32} size={1} className="opacity-5" />
                            <Controls className="bg-zinc-900 border-white/10 fill-zinc-400" />
                        </ReactFlow>
                    ) : (
                        <div className="relative z-10 flex flex-col gap-10 items-center justify-start w-full">
                            {/* Decorative Grid for List view */}
                            <div className="absolute inset-0 opacity-[0.02] pointer-events-none" style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '32px 32px' }} />

                            <div className="w-full flex flex-col gap-8 items-center max-w-4xl pt-8 z-10">
                                {/* Workflow -> Workflow */}
                                {connections.filter((c: any) => c.type === 'workflow-workflow').length > 0 && (
                                    <div className="w-full mb-4">
                                        <div className="text-center text-[10px] font-black uppercase tracking-[0.4em] text-red-500 mb-6">Workflow Chain</div>
                                        <div className="flex flex-wrap gap-6 justify-center">
                                            {connections.filter((c: any) => c.type === 'workflow-workflow').map((c: any, i: number) => (
                                                <div key={`${c.from}-${c.to}-${i}`} className="flex items-center gap-4 bg-white/[0.02] p-4 rounded-2xl border border-white/5 shadow-inner-glow group transition-all duration-500 hover:border-red-500/20 backdrop-blur-sm">
                                                    <div className="px-3 py-1.5 bg-red-950/40 border border-red-500/20 rounded-lg text-red-400 font-bold text-[9px] uppercase tracking-wider flex items-center gap-2"><Zap size={10} />{c.from.replace('.md', '')}</div>
                                                    <div className="w-8 h-px bg-white/10 relative"><div className="absolute -right-1 -top-[7px]"><ChevronRight size={14} className="text-white/20" /></div></div>
                                                    <div className="px-3 py-1.5 bg-red-950/20 border border-red-500/10 rounded-lg text-red-300 font-bold text-[10px] uppercase tracking-widest">{c.to.replace('.md', '')}</div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Workflow -> Skill */}
                                {connections.filter((c: any) => c.type === 'workflow-skill').length > 0 && (
                                    <div className="w-full">
                                        <div className="text-center text-[10px] font-black uppercase tracking-[0.4em] text-amber-500 mb-6">Expert Triggers</div>
                                        <div className="flex flex-wrap gap-6 justify-center">
                                            {connections.filter((c: any) => c.type === 'workflow-skill').map((c: any, i: number) => (
                                                <div key={`${c.from}-${c.to}-${i}`} className="flex items-center gap-4 bg-white/[0.02] p-4 rounded-2xl border border-white/5 shadow-inner-glow group transition-all duration-500 hover:border-amber-500/20 backdrop-blur-sm">
                                                    <div className="px-3 py-1.5 bg-red-950/40 border border-red-500/20 rounded-lg text-red-400 font-bold text-[9px] uppercase tracking-wider flex items-center gap-2"><Zap size={10} />{c.from.replace('.md', '')}</div>
                                                    <div className="w-8 h-px bg-white/10 relative"><div className="absolute -right-1 -top-[7px]"><ChevronRight size={14} className="text-white/20" /></div></div>
                                                    <div className="px-3 py-1.5 bg-amber-950/40 border border-amber-500/20 rounded-lg text-amber-300 font-bold text-[10px] uppercase tracking-widest flex items-center gap-2"><Layers size={10} />{c.to}</div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )
                ) : (
                    <div className="flex flex-col items-center justify-center gap-6 py-20 h-full opacity-10 select-none">
                        <Share2 size={48} />
                        <div className="text-[10px] font-black uppercase tracking-[0.5em] italic">No active neural bridges</div>
                    </div>
                )}
            </div>
        </div>
    );
});

function SimpleMarkdownView({ item, icon, title, postMessage, updateItem }: any) {
    const [isAddingTag, setIsAddingTag] = useState(false);
    const [newTag, setNewTag] = useState('');

    const handleAddTag = () => {
        if (!newTag.trim()) {
            setIsAddingTag(false);
            return;
        }
        const tag = newTag.trim();
        const updatedTags = [...(item.tags || []), tag].filter((v: any, i: any, a: any) => a.indexOf(v) === i);
        const updatedItem = { ...item, tags: updatedTags };

        // Currently only Skills and Workflows have physical metadata saving supported. We map both correctly or fallback to workflow
        const command = title.toLowerCase() === 'workflows' ? 'saveWorkflowMetadata' : 'saveSkillMetadata';
        postMessage(command, { name: item.name, metadata: { tags: updatedTags } });
        if (updateItem) updateItem(updatedItem);

        setNewTag('');
        setIsAddingTag(false);
    };

    const handleRemoveTag = (tagToRemove: string) => {
        const updatedTags = (item.tags || []).filter((tg: string) => tg !== tagToRemove);
        const updatedItem = { ...item, tags: updatedTags };

        const command = title.toLowerCase() === 'workflows' ? 'saveWorkflowMetadata' : 'saveSkillMetadata';
        postMessage(command, { name: item.name, metadata: { tags: updatedTags } });
        if (updateItem) updateItem(updatedItem);
    };

    return (
        <div className="flex-1 p-12 overflow-auto custom-scrollbar">
            <div className="max-w-5xl mx-auto">
                <header className="mb-12">
                    <div className="flex items-center gap-4 mb-3">
                        <div className="p-4 bg-red-950/40 rounded-2xl text-red-600 shadow-xl shadow-red-900/10">{icon}</div>
                        <h1 className="text-4xl font-black text-white tracking-tighter uppercase">{title}</h1>
                    </div>
                    <div className="flex items-center gap-6">
                        <p className="text-zinc-500 text-lg">{item.name}</p>
                        {/* Tags Display */}
                        <div className="flex flex-wrap items-center gap-2">
                            {item.tags && item.tags.map((tag: string) => (
                                <div key={tag} className="flex items-center gap-1 px-2 py-1 text-[10px] font-black uppercase tracking-widest bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 rounded border border-white/10 transition-colors group">
                                    <span>{tag}</span>
                                    <button className="opacity-0 group-hover:opacity-100 transition-opacity text-zinc-500 hover:text-red-500" onClick={() => handleRemoveTag(tag)}><X size={10} /></button>
                                </div>
                            ))}
                            {isAddingTag ? (
                                <div className="flex items-center shrink-0">
                                    <input
                                        autoFocus
                                        type="text"
                                        value={newTag}
                                        onChange={(e) => setNewTag(e.target.value)}
                                        onBlur={handleAddTag}
                                        onKeyDown={(e) => { if (e.key === 'Enter') handleAddTag(); if (e.key === 'Escape') setIsAddingTag(false); }}
                                        className="px-2 py-1 text-[10px] font-black uppercase tracking-widest bg-black text-white rounded border border-red-500/50 outline-none w-24"
                                        placeholder="NEW TAG..."
                                    />
                                </div>
                            ) : (
                                <button
                                    onClick={() => setIsAddingTag(true)}
                                    className="px-2 py-1 flex items-center gap-1 text-[10px] font-black uppercase tracking-widest hover:bg-white/10 text-zinc-500 hover:text-white rounded border border-transparent hover:border-white/10 transition-all"
                                >
                                    <Plus size={10} /> Add Tag
                                </button>
                            )}
                        </div>
                    </div>
                </header>
                <div className="bg-[#1a1a1e] rounded-2xl border border-white/5 p-8 shadow-2xl relative group">
                    <button
                        onClick={() => postMessage('revealInExplorer', { path: item.path })}
                        className="absolute top-6 right-6 p-3 rounded-xl bg-white/5 text-zinc-500 border border-white/10 opacity-30 group-hover:opacity-100 transition-all hover:bg-red-900/20 hover:text-red-500 hover:border-red-900/50"
                        title="Reveal in Explorer"
                    >
                        <Folder size={16} />
                    </button>
                    <pre className="text-zinc-300 font-mono text-sm whitespace-pre-wrap">{item.content}</pre>
                </div>
            </div>
        </div>
    );
}

const EmptyState = ({ t }: any) => (
    <div className="flex-1 flex flex-col items-center justify-center text-zinc-800 select-none">
        <div className="w-32 h-32 rounded-[2.5rem] bg-zinc-900 border border-white/5 flex items-center justify-center mb-8 relative shadow-2xl">
            <Terminal size={48} className="opacity-20 text-zinc-400" />
            <div className="absolute -inset-1 bg-zinc-500/5 blur-2xl rounded-full" />
        </div>
        <p className="text-zinc-600 text-xs uppercase font-black tracking-[0.5em]">{t.selectItem}</p>
    </div>
);

function HelpView({ t, isSupporter, postMessage }: any) {
    return (
        <div className="flex-1 overflow-auto p-16 bg-[#0a0a0c] flex flex-col items-center custom-scrollbar">
            <div className="max-w-3xl w-full">
                <div className="flex items-center gap-6 mb-12">
                    <div className="p-5 bg-gradient-to-br from-red-700 to-red-900 rounded-3xl shadow-red-glow"><Hexagon className="w-16 h-16 text-white" /></div>
                    <div>
                        <h1 className="text-5xl font-black text-white mb-2 tracking-tighter uppercase">{t.helpTitle}</h1>
                        <p className="text-zinc-500 text-xl font-medium">{t.helpDesc}</p>
                    </div>
                </div>
                <div className="space-y-12">
                    <section className="bg-zinc-900/50 p-8 rounded-3xl border border-white/5">
                        <p className="text-zinc-300 leading-relaxed font-medium text-lg italic mb-6">"{t.intro}"</p>
                        <div className="space-y-5 text-zinc-400 text-sm">
                            <p className="flex items-start gap-4">
                                <span className="text-red-700 font-black">●</span>
                                <span>{t.s1}</span>
                            </p>
                            <p className="flex items-start gap-4">
                                <span className="text-red-700 font-black">●</span>
                                <span>{t.s2}</span>
                            </p>
                            <p className="flex items-start gap-4">
                                <span className="text-red-700 font-black">●</span>
                                <span>{t.s3}</span>
                            </p>
                            <p className="flex items-start gap-4">
                                <span className="text-red-700 font-black">●</span>
                                <span>{t.s4}</span>
                            </p>
                        </div>
                    </section>

                    <section className={`p-8 rounded-3xl border transition-all duration-700 relative overflow-hidden group mt-12 ${isSupporter ? 'bg-gradient-to-br from-amber-600/20 to-amber-900/10 border-amber-500/40 shadow-2xl shadow-amber-500/10' : 'bg-gradient-to-br from-amber-900/10 to-transparent border-amber-500/10'}`}>
                        <div className={`absolute top-0 right-0 p-8 transition-all duration-1000 ${isSupporter ? 'opacity-30 scale-125' : 'opacity-10 group-hover:scale-110'}`}>
                            <Layers size={80} className="text-amber-500" />
                        </div>
                        <h3 className="text-xl font-black text-amber-500 uppercase tracking-widest mb-4 flex items-center gap-3">
                            Golden Era Support
                            {isSupporter && <span className="text-[10px] px-3 py-1 bg-amber-500 text-black rounded-full animate-pulse shadow-amber-glow">ACTIVATED</span>}
                        </h3>
                        <p className="text-zinc-400 text-sm leading-relaxed mb-6 max-w-md">
                            {isSupporter
                                ? "Your soul is encoded as a Golden Supporter. The Midnight Gold theme and Supporter Badge are now active across the Chronicle."
                                : "Fuel the evolution of the ChronicleCore ecosystem. Supporters receive the Golden Supporter Badge and exclusive Midnight Gold UI theme."
                            }
                        </p>
                        <div className="flex flex-col gap-4">
                            {!isSupporter && (
                                <>
                                    <a href="https://buymeacoffee.com/zaious" target="_blank" className="w-fit px-8 py-3 bg-amber-600 hover:bg-amber-500 text-black font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-xl shadow-amber-900/20 active:scale-95">
                                        Support via BMC
                                    </a>
                                    <div className="flex gap-2">
                                        <input id="golden-key-input" placeholder="Enter Golden Key..." className="bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-xs font-mono focus:outline-none focus:border-amber-500/50 flex-1 text-amber-200" />
                                        <button onClick={() => {
                                            const input = document.getElementById('golden-key-input') as HTMLInputElement;
                                            postMessage('validateKey', { key: input.value });
                                        }} className="px-6 py-3 bg-white/5 hover:bg-white/10 text-amber-500 border border-white/5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">Unlock</button>
                                    </div>
                                </>
                            )}
                        </div>
                    </section>
                </div>
            </div>
        </div>
    )
}

function NavIcon({ active, icon, onClick, label }: any) {
    return (
        <div className="group relative flex items-center justify-center w-full">
            <button onClick={onClick} className={`p-3 rounded-2xl transition-all duration-300 relative ${active ? 'bg-red-800 text-white shadow-red-glow scale-110' : 'text-zinc-700 hover:text-zinc-200 hover:bg-white/[0.03]'}`}>
                {icon}
                {active && <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-1.5 h-6 bg-red-800 rounded-r-full shadow-[0_0_10px_rgb(153,27,27)]" />}
            </button>
            <div className="absolute left-20 px-3 py-2 bg-[#1a1a1e] text-[10px] font-black uppercase tracking-widest rounded-lg opacity-0 group-hover:opacity-100 transition-all pointer-events-none whitespace-nowrap z-50 border border-white/10 shadow-2xl translate-x-2 group-hover:translate-x-0 bg-black/90 backdrop-blur-xl">
                {label}
            </div>
        </div>
    );
}

function LangMiniBtn({ active, label, onClick }: any) {
    return (
        <button onClick={onClick} className={`w-full py-1 text-[9px] font-black rounded transition-all ${active ? 'bg-red-800 text-white shadow-lg' : 'bg-white/5 text-zinc-700 hover:text-zinc-300'}`}>
            {label}
        </button>
    )
}

function HistoryListItem({ active, conversation, onClick }: { active: boolean, conversation: Conversation, onClick: () => void }) {
    const date = new Date(conversation.createdTime);
    const timeStr = `${date.getMonth() + 1}/${date.getDate()} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;

    return (
        <div onClick={onClick} className={`group relative flex flex-col gap-1 px-4 py-3 rounded-xl cursor-pointer text-sm transition-all duration-300 border ${active ? 'bg-white/[0.04] text-white border-white/10 shadow-xl' : 'hover:bg-white/[0.02] text-zinc-500 hover:text-zinc-300 border-transparent'}`}>
            <div className="flex items-center gap-3">
                <div className={`flex-1 truncate font-bold tracking-tight uppercase ${active ? 'text-white' : 'text-zinc-400 group-hover:text-zinc-300'}`}>
                    {conversation.summary}
                </div>
            </div>

            <div className="flex items-center justify-between text-[10px] text-zinc-600 mt-1">
                <div className="font-mono tracking-wider opacity-70">
                    {conversation.id.slice(0, 8)}
                </div>
                <div>{timeStr}</div>
            </div>

            {conversation.tags && conversation.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1.5">
                    {conversation.tags.map((tag: string) => (
                        <span key={tag} className="px-1 py-0.5 text-[7px] font-black uppercase tracking-widest bg-zinc-800/50 text-zinc-500 rounded border border-white/5">{tag}</span>
                    ))}
                </div>
            )}

            {active && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 rounded-r-full bg-red-800 shadow-[0_0_10px_#991b1b]" />
            )}
        </div>
    );
}

function ListItem({ active, label, snippet, source, isActiveSkill, isBroken, isEmpty, onClick, pinned, tags, onAction, isDeleting }: any) {
    const isAlert = isBroken || isEmpty;
    return (
        <div onClick={onClick} className={`group relative flex flex-col gap-1 px-4 py-3 rounded-xl cursor-pointer text-sm transition-all duration-300 border ${active ? 'bg-white/[0.04] text-white border-white/10 shadow-xl' : 'hover:bg-white/[0.02] text-zinc-500 hover:text-zinc-300 border-transparent'} ${isAlert ? 'border-red-500/30 bg-red-500/[0.02]' : ''}`}>
            <div className="flex items-center gap-3">
                <div className={`flex-1 truncate font-bold tracking-tight uppercase ${isAlert ? 'text-red-400/80 group-hover:text-red-400' : ''}`}>
                    {label && label !== '---' ? label : (snippet ? `[${snippet.slice(0, 15)}...]` : 'UNTITLED CHRONICLE')}
                </div>

                <div className="flex items-center gap-2">
                    {pinned && <Pin size={10} className="text-red-500 fill-red-500/20" />}
                    {isActiveSkill && (
                        <div className="relative w-2 h-2">
                            <div className="absolute inset-0 bg-white/40 rounded-full animate-ping opacity-75" />
                            <div className="relative bg-zinc-300 w-2 h-2 rounded-full shadow-silver-glow" />
                        </div>
                    )}
                    {isAlert ? (
                        <span className="text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded border border-amber-500/20 text-amber-500 bg-amber-500/5 shadow-[0_0_10px_rgba(245,158,11,0.1)] pulse-subtle">{isBroken ? 'FAIL' : 'EMPT'}</span>
                    ) : (
                        <span className={`text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded border ${source === 'local' ? 'bg-zinc-800/50 text-zinc-400 border-white/5' : 'bg-red-900/20 text-red-400 border-red-900/20'}`}>{source === 'local' ? 'LOC' : 'GLB'}</span>
                    )}

                    {onAction && (
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={(e) => { e.stopPropagation(); onAction('pin'); }} className={`p-1 rounded hover:bg-white/10 ${pinned ? 'text-red-500' : 'text-zinc-600'}`}><Pin size={12} /></button>
                            <button onClick={(e) => { e.stopPropagation(); onAction('delete'); }} className={`p-1 rounded hover:bg-white/10 ${isDeleting ? 'text-white bg-red-800' : 'text-zinc-600 hover:text-red-400'}`}><Trash2 size={12} /></button>
                        </div>
                    )}
                </div>
            </div>

            {(label || snippet) && (
                <div className="text-[10px] text-zinc-500 line-clamp-2 group-hover:text-zinc-400 transition-colors lowercase italic leading-relaxed mt-0.5">
                    {label === snippet ? '' : snippet}
                </div>
            )}

            {tags && tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1">
                    {tags.map((tag: string) => (
                        <span key={tag} className="px-1 py-0.5 text-[7px] font-black uppercase tracking-widest bg-zinc-800/50 text-zinc-500 rounded border border-white/5">{tag}</span>
                    ))}
                </div>
            )}

            {active && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 rounded-r-full" style={{ background: isAlert ? '#f59e0b' : '#991b1b', boxShadow: `0 0 10px ${isAlert ? '#f59e0b' : '#991b1b'}` }} />
            )}
        </div>
    );
}


export default App;
