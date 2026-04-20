# 跨專案代筆草稿導出協議: Antigravity V2.0.0 Release

> 🔹 **System**: ChronicleCore 專家系統 (HQ)
> 🏷️ **Type**: Handoff Document
> **Session**: Antigravity: Skills Chronicle V2.0.0 大改版與資料治理

## 1. 任務脈絡 (Context Summarization) - by [書記官 pm-scribe]
**核心解決問題**：
將 Antigravity VS Code Extension 從單純的「檔案檢視器」進化為具備「實體資產統治」與「深度關聯探索」的 V2.0.0 旗艦版本，並解決專案目錄結構混亂的問題。

**起點與終點**：
*   **起點**：V1.2.x 具備基礎的 Markdown 讀取與簡單的 Dagre 靜態樹狀圖。專案根目錄混雜了給使用者的 Markdown 文件與給開發者的工具。
*   **終點 (V2.0.0 達成)**：
    1.  **引力星圖 (Star Map Topology)**：捨棄靜態結構，導入物理引擎讓複雜關聯自然展開。
    2.  **深層全文檢索 (Deep Full-Text Search)**：於擴充套件層攔截並解析歷史，提供秒級的全文快取搜尋。
    3.  **資產統治 (Asset Governance)**：實作全域備份 (Batch Export)，實現資料主權。
    4.  **VS Code 深度整合**：成功註冊 Activity Bar 與 TreeView。
    5.  **架構分離**：將 `public-assets/` 與範例庫統合至 `public/`，透過 `.vscodeignore` 擋煞，確保 Marketplace 安裝檔 (`.vsix`) 極致輕量 (5.98MB)。

## 2. 技術決策萃取 (Technical & Strategic Insight) - by [樞機師 architect-system]
**硬核乾貨與挑戰**：
1.  **UI 拓撲圖的底層替換 (Dagre -> D3 Force)**：
    *   *雷點*：Dagre 排版對於 1對多 的知識圖譜顯得過於僵硬且佔用垂直空間。
    *   *破局*：果斷引入 `d3-force` 物理引擎，在 React 組件掛載前以 Web Worker 或先期引擎預先計算 300 次 tick (`simulation.tick()`)，實現「一渲染即穩定」的動態有機排版，解決了載入時節點亂飛的 UX 災難。
2.  **VS Code Extension API 緩存陷阱**：
    *   *雷點*：在 `package.json` 註冊了新的 `viewsContainers` 與 `views` 後，即便重新編譯，VS Code 仍無情地報錯 `No view is registered with id...`。
    *   *破局*：辨識出這是 VS Code Contribution Cache 的底層機制。透過提醒使用者執行 `Developer: Reload Window` 強制重載 UI 註冊表，避免在代碼層面作無效且崩潰的除錯。
3.  **Extension Bundle vs Open Source Repo 的權衡 (Monorepo-lite)**：
    *   *決策*：面臨將核心代碼全數移入子目錄 (`extension/`) 以徹底隔離的誘惑時，考量到這會破壞 VS Code 原生的 F5 `.vscode/launch.json` 預設行為與 NPM script 習慣。最終選擇保持根目錄開發，但將展示資產獨立為 `public/`，利用 `.vscodeignore` 作為物理防護罩。此 Trade-off 同時滿足了開發流暢度與套件包裝瘦身。
4.  **對話歷史的全域自動定位 (Context-Aware UI)**：
    *   *痛點*：使用者在不同專案切換時，歷史觀測站總是無腦展開清單的第一筆，難以對焦當下工作區。
    *   *解法*：將擴充套件後端的 `vscode.workspace.name` 注入為 Payload，送給 React 前端進行過濾，實現「開啟即顯示當前進度」的魔鬼細節。

## 3. 平台定調建議 (Platform Targeting) - by [造浪者 consultant-marketing]
**社群受眾與平台建議**：

*   **X (Twitter) / Threads - [視覺衝擊與工具炫耀]**：
    *   *切角*：AI Agent 不該只是個聊天框。「我們把知識庫變成了一座可以看見引力的星系」。強調「資料主權」跟「全域備份」。
*   **GitHub / Medium / 技術論壇 - [硬核架構與防雷教學]**：
    *   *切角*：「開發 VS Code Extension 你一定會踩的坑：打包體積與 UI 快取」。分享我們如何透過目錄治理與 Ignore 策略，讓一個具備 React Frontend 與 Node Backend 的複雜套件，打包後不到 6MB。

## 4. Raw Draft (生肉素材庫)
*(供後續代筆專家渲染使用)*
*   打包成果：`antigravity-skills-chronicle-2.0.0.vsix (2669 files, 5.98MB)`
*   核心 Commit：`feat(v2.0.0): Release V2.0.0 - Star Map Topology, Global History active project sync, Public Directory Restructure, and Activity Bar Integration`
*   引力引擎核心設定：`forceSimulation().force('charge', forceManyBody().strength(-3000))`
*   底層快取刷新指令：`Developer: Reload Window`
