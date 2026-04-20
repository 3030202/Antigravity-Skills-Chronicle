<div align="center">

# 🌌 Antigravity: Skills Chronicle

**ChronicleCore 系統傾力打造，專為管理 AI 技能與專家網路所設計的頂級管理層。**

[![VS Code](https://img.shields.io/badge/VS%20Code-Extension-007ACC?style=for-the-badge&logo=visual-studio-code&logoColor=white)](https://marketplace.visualstudio.com/items?itemName=ChronicleCore.antigravity-skills-chronicle)
[![Brand](https://img.shields.io/badge/Brand-ChronicleCore-B91C1C?style=for-the-badge)](https://buymeacoffee.com/zaious)

<p align="center">
  <a href="README.md">English</a> | <b>繁體中文</b>
</p>

</div>

---

*透過充滿奢華科技感的視覺儀表板，輕鬆管理您的 AI 擴充技能、自動化工作流與系統鐵律。*

## [#] 核心功能 (Key Features)

| 功能模組 | 說明 |
|---------|-------------|
| **🌌 星圖拓撲 (Star Map)** | 透過 d3-force 物理引擎，動態呈現代理人與技能的知識關聯網路 |
| **📁 技能管理 (Dashboard)** | 集中檢視並管理 `.agent/skills/` 目錄下的所有專家與工具 |
| **⚖️ 流程指揮 (Workflows)** | 組織並觸發位於 `.agent/workflows/` 的自動化標準作業程序 (SOP) |
| **🛡️ 鐵律審查 (Rules)** | 查閱並檢核本機 (`.agent/rules/`) 與全域 (`GEMINI.md`) 的行為法則 |
| **🕰️ 記憶解析 (Archive)** | 將難以讀取的 `.pb` 原始日誌，轉譯為可全文檢索的 Markdown 知識庫 |
| **📊 IDE 原生整合** | 駐留於 VS Code 狀態列，即時反應系統與工作流的運作總量 |

---

## [1] 知識星圖核心 (Intelligence Star Map)

![Star Map](https://raw.githubusercontent.com/Zaious/Antigravity-Skills-Chronicle/main/introduce/v2-star-map.png)

停止在資料夾迷宮中盲目尋找，開始在知識星系中導航。**引力星圖**是一個動態的力導向拓撲圖，將您的代理人、技能與外部資料之間的錯綜複雜關聯視覺化。底層由 `d3-force` 驅動，呈現自然且充滿生命力的排版宇宙。

---

## [2] 歷史解析與深度檢索 (Conversation Archive)

![History Archive](https://raw.githubusercontent.com/Zaious/Antigravity-Skills-Chronicle/main/introduce/v2-archive.png)

> **🚀 V2.1.0 重大修復**：原生繞過介面對歸檔對話檢索的數量限制。系統現在直接掃描本機目錄中的 `.pb` 實體檔案，徹底消除先前的 JSON 解析崩潰問題，保證 100% 完整提取所有歷史對話至深層檔案庫中。

Claude 產生的原始對話預設儲存為無法輕易閱讀的 `.pb` (Protobuf) 檔案。**歷史解析樞紐 (Activity Hub)** 完美解決了這個痛點。它能夠即時解密並將這些死寂的檔案轉化為人類可讀的 Markdown 格式，自動同步匯出至 `~/.gemini/antigravity/.search_cache/`。這賦予了系統深層全文檢索的能力，讓過去的每一句對話都成為隨時待命的知識金礦。

---

## [3] 系統指揮中樞 (Metrics Dashboard)

![Terminal Overview](https://raw.githubusercontent.com/Zaious/Antigravity-Skills-Chronicle/main/introduce/v2-dashboard.png)

猶如 ChronicleCore 環境的總控制台，**系統儀表板 (System Dashboard)** 提供技能、工作流與鐵律規則的高維度總量監控。

---

## [4] 上下文與資產監控 (Context & Asset Monitoring)

![Activity Monitor](https://raw.githubusercontent.com/Zaious/Antigravity-Skills-Chronicle/main/introduce/v2-context-monitor.png)

透過**心跳監控 (Activity Monitor)** 掌握系統的 Context Length 與運算活躍度，並在單一整合視窗中管理所有資源的**全域路徑配置**。

---

## [5] 協作流程自動化 (Workflow Orchestration Hub)

![Workflows](https://raw.githubusercontent.com/Zaious/Antigravity-Skills-Chronicle/main/introduce/v2-workflows.png)

組織並觸發複雜的跨代理人自動化儀式。透過**工作流 (Workflows)** 模組，您可以直接預覽詳細的 SOP 檔案、觸發命令腳本，並檢視下一步的自動化串接路徑。

---

## [6] 專家技能深度剖析 (Deep Skill Inspection)

Antigravity 提供從底層元數據到同步記憶的專家技能全生命週期拆解。

![Skill Files](https://raw.githubusercontent.com/Zaious/Antigravity-Skills-Chronicle/main/introduce/v2-skill-files.png)
*1. 內部架構分析：檢視技能的 Metadata 與行為限制條件。*

![Skill Config](https://raw.githubusercontent.com/Zaious/Antigravity-Skills-Chronicle/main/introduce/v2-skill-config.png)
*2. 結構配置驗證：即時檢核代理人人格與角色 Schema 參數。*

![Skill Memo](https://raw.githubusercontent.com/Zaious/Antigravity-Skills-Chronicle/main/introduce/v2-skill-memo.png)
*3. 記憶同步節點：為每位代理人保留持久、加密的安全上下文儲存區。*

---

## [7] 行為鐵律與審判體系 (Rules Inspector)

![Rules View](https://raw.githubusercontent.com/Zaious/Antigravity-Skills-Chronicle/main/introduce/v2-rules.png)

將不可侵犯的鐵律跨越兩個維度進行管理。**規則審查台 (Rules Inspector)** 讓您能夠瀏覽並設定位於 `.agent/rules/` 下的專案專屬限制，同時與掌管著整個系統生態的無上法典 `~/.gemini/antigravity/GEMINI.md` 進行全局校準。

---

## [8] 原生智慧整合 (Native Intelligence Layer)

![Status Bar](https://raw.githubusercontent.com/Zaious/Antigravity-Skills-Chronicle/main/introduce/v2-statusbar.png)
![Sidebar Menu](https://raw.githubusercontent.com/Zaious/Antigravity-Skills-Chronicle/main/introduce/v2-sidebar.png)

完美無縫地融合進 VS Code 的**狀態列 (StatusBar)** 與**活動列 (Activity Bar)** 中。獲取即時的系統指標，並以前所未有的速度取用技能拓撲，絕對不打斷您的神經開發心流。

---

## [9] 編年史手冊與後勤資源 (Chronicle Manual)

![Manual Hub](https://raw.githubusercontent.com/Zaious/Antigravity-Skills-Chronicle/main/introduce/v2-manual.png)

**編年史手冊 (Chronicle Manual)** 樞紐提供了模組規格書、行動日誌與最高維護指引。

### 🌟 贊助黃金時代 (Golden Era Support)
成為**黃金贊助者 (Golden Supporter)**，共同推進系統進化：
- 解鎖專屬的 **「午夜純金 (Midnight Gold)」** 高規 UI 主題
- 於您的控制面板鑲嵌 **「執政官徽章 (Sovereign Badge)」**

---

## 📦 資料導出與存儲路徑 (Data & Export Locations)

真正的代理人系統應由人類緊握資料主權。Antigravity 的所有資產與導出結果，皆保存在以下預設路徑：

**🏠 專案級本地端 (Local Workspace)**
- **專家技能**: `.agent/skills/`
- **協作流程**: `.agent/workflows/`
- **專案鐵律**: `.agent/rules/`
- **原始對話**: `.gemini/conversations/`

**🌍 全域組態 (User Profile)**
- **無上法典 (Global Rules)**: `~/.gemini/antigravity/GEMINI.md`
- **全域資產庫 (Global Assets)**: `~/.gemini/antigravity/`
- **解析知識匣 (Chronicle Exports)**: `~/.gemini/antigravity/.search_cache/`
  - *透過知識檢索樞紐解析出的所有對話歷史，皆會轉化為 Markdown 格式存放於此。*

---

<div align="center">

**Made with ❤️ by ChronicleCore / 編年史記工作室**

</div>
