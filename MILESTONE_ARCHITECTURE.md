# Milestone Architecture

> 🏛️ **Type**: Supreme Asset Constitution (最高資產憲法)
> **Scope**: 專案目錄結構與階層定義
> **Last Updated**: 2026-02-21

本文件定義了 `Antigravity-Agent-UI` 專案的資料夾拓撲結構，與各目錄/檔案的角色定位。這是系統中**唯一的事實來源 (Single Source of Truth, SSOT)**。任何結構設計皆須符合本憲法。

---

## 總體拓撲 (Global Topology)

```text
Antigravity-Agent-UI/
│
├── .agent/                 # [Runtime] 使用者本地的 ChronicleCore 專家、流程與規則設定 (供擴充套件讀取)
├── .gemini/conversations/  # [Runtime] 對話歷史紀錄的保存位置
│
├── docs/                   # [SSOT] 知識中心與戰略規劃
│   ├── project_brief.md    # 核心願景、模組定義與產品靈魂
│   ├── plans/              # 開發計劃與藍圖
│   │   └── ROADMAP.md      # P1-P4 執行路徑
│   └── archive/            # 封存遺產 (所有被淘汰的文件歸置於此)
│
├── src/                    # [Backend] VS Code Extension 核心邏輯 (Node.js/TypeScript)
├── web/                    # [Frontend] 擴充套件內的 Webview Dashboard (React + Vite)
├── public-assets/          # [Asset] 用於 README 或外部宣傳的靜態資源 (圖檔、Icon 等)
│
├── package.json            # 擴充套件的依賴與設定
├── README.md               # [Marketing] 對外的市場宣傳入口與 VS Code Marketplace 展板
├── MILESTONE_ARCHITECTURE.md # (本文件) 拓撲憲法
└── AGENTS.md               # 本專案的專家名冊與協作權限定義
```

## 職責解耦原則 (Decoupling Principles)

1.  **UI vs Logic**: 所有畫面的渲染邏輯都必須封裝在 `web/` 內。VS Code Extension (`src/`) 僅負責提供資料 (API) 或接收指令，不直接渲染 HTML (除了必要的 Webview 外殼)。
2.  **Marketing vs Documentation**: 對外行銷的敘事 (Copywriting) 集中於根目錄的 `README.md`。內部的設計討論、系統原理與規劃則放在 `docs/` 下。
3.  **No Ghost Files**: 嚴禁在根目錄建立含義不明的文件 (例如 `plan_v2.txt`, `temp_notes.md`)。若未納入上方拓撲圖，則視為違法，必須將其刪除或移至 `docs/archive/`。
