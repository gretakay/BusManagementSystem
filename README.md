# 遊覽車點名系統

依據 [需求規格書](./遊覽車點名系統_需求規格書.md) 建置。

## 技術棧

- Next.js 14(App Router)+ TypeScript,部署於 Vercel
- Firebase Firestore + Authentication
- Firebase Cloud Functions(排程自動封存)
- Tailwind CSS

## 本機開發設定

### 1. 建立 Firebase 專案

到 [Firebase Console](https://console.firebase.google.com/) 建立專案,啟用:

- **Authentication**:啟用 Email/Password 登入方式
- **Firestore Database**:建立資料庫(正式環境模式)

### 2. 取得憑證,設定環境變數

複製 `.env.local.example` 為 `.env.local`,填入:

- `NEXT_PUBLIC_FIREBASE_*`:Firebase Console > 專案設定 > 一般 > 新增網頁應用程式
- `FIREBASE_ADMIN_*`:Firebase Console > 專案設定 > 服務帳戶 > 產生新的私密金鑰(下載 JSON,填入對應欄位;`FIREBASE_ADMIN_PRIVATE_KEY` 若含換行請以 `\n` 轉義後放同一行)
- `ENCRYPTION_KEY`:執行 `openssl rand -base64 32` 產生 32-byte 金鑰,用於手機號碼等敏感欄位的應用層加密

### 3. 安裝依賴、啟動開發伺服器

```bash
npm install
npm run dev
```

### 4. 部署 Firestore Security Rules 與排程 Cloud Function

```bash
npm install -g firebase-tools   # 若尚未安裝
firebase login
cp .firebaserc.example .firebaserc   # 填入你的 Firebase 專案 ID
firebase deploy --only firestore:rules,firestore:indexes,functions
```

### 5. 建立第一個總負責人帳號(globalSuperLead)

1. 先讓該使用者在 `/login` 頁面之前,於 Firebase Authentication 主控台手動建立帳號(或串接前端註冊流程,目前尚未實作註冊 UI)
2. 執行 bootstrap 腳本,將該帳號設為總負責人:

```bash
npm run bootstrap:superlead -- someone@example.com
```

之後即可用該帳號登入,建立行程、車輛,並以 email 指派其他人為領隊/副領隊/小組長。

## 專案結構

```
src/app                     Next.js 頁面(App Router)
src/app/api                 後端 API routes(Admin SDK,處理敏感欄位加密與角色寫入)
src/lib/firebase            Firebase client/admin SDK 初始化
src/lib/auth                權限驗證(session.ts 供 API route 用、AuthProvider.tsx 供前端用)
src/lib/crypto.ts           手機號碼等敏感欄位的 AES-256-GCM 加密/解密
src/types                   資料模型型別定義
functions                   Firebase Cloud Functions(180 天自動封存排程)
firestore.rules             Firestore Security Rules
scripts/bootstrapSuperLead.ts  建立第一個總負責人帳號的腳本
```

## 權限模型

角色資訊存放於 Firestore `roles/{uid}` 文件,而非 Auth custom claims,以便隨時調整領隊指派而不需使用者重新登入。詳見 `src/types/role.ts` 與 `firestore.rules` 的註解。

## 第一階段(MVP)已實作功能

- 行程建立/列表、車輛建立與領隊指派
- 人員逐筆新增 + Excel/CSV 批次匯入(以報名序號 Upsert)
- 排車(逐一調整)+ 排車總覽(含超載提示)
- 點名:自訂場次、清單勾選(已到/未到/請假)、QR 掃描 + 手動點名可混用、記錄來源與操作人員
- 總覽儀表板(依角色顯示可見車輛的即時完成度)
- 未到者一鍵撥打本人/緊急聯絡人電話
- 封存排程(Cloud Function,180 天)+ 手動解除封存
- 操作紀錄(AuditLog)寫入

## 尚未實作(規格書 Phase 2 / 3,已留型別與資料夾骨架)

- 廣播訊息(`src/types/broadcast.ts` 已定義型別,尚無 UI/API)
- 排車拖曳介面、批次條件分派(`src/app/(dashboard)/trips/[tripId]/seating/page.tsx` 內有 TODO 註記)
- PDF/Excel 點名結果匯出
- AuditLog 查詢 UI

## 已知限制

- 目前沒有真實 Firebase 專案可供本次對話測試,`npm run build` 可驗證程式碼可編譯,但登入、Firestore 讀寫等功能需你自行申請 Firebase 專案並填入 `.env.local` 後才能實際驗證。
