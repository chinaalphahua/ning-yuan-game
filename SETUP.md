# 手把手设置：Supabase + 本地环境

按下面顺序做，做完即可在本地跑通注册、每 20 题灵魂伴侣和聊天。

---

## 第一步：注册 / 登录 Supabase

1. 打开浏览器，访问 **https://supabase.com**
2. 点击右上角 **Start your project**（或 Sign in）
3. 用 GitHub 或邮箱注册并登录

---

## 第二步：新建项目

1. 登录后进入 Dashboard，点击 **New Project**
2. **Organization**：选默认或你已有的
3. **Name**：填 `ningyuan`（或任意名）
4. **Database Password**：自己设一个强密码，**记下来**（后面不会再用到，除非重置 DB）
5. **Region**：选离你近的（如 Singapore 或 Northeast Asia）
6. 点击 **Create new project**，等 1～2 分钟项目建好

---

## 第三步：执行建表 SQL

1. 在项目左侧菜单点 **SQL Editor**
2. 点 **New query**
3. 打开你本地的 **ningyuan** 项目，找到文件 **supabase/schema.sql**，用编辑器打开，**全选并复制**全部内容
4. 回到 Supabase 的 SQL Editor，把复制的内容**粘贴**进输入框
5. 点击右下角 **Run**（或 Ctrl/Cmd + Enter）
6. 若成功，会显示 “Success. No rows returned”；若有报错，把红色报错信息记下来（多半是表已存在，可忽略或先删表再跑）

---

## 第四步：拿到三个环境变量

1. 在 Supabase 项目左侧点 **Project Settings**（齿轮图标）
2. 左侧再点 **API**
3. 在 **Project URL** 下：
   - 复制 **Project URL**，例如 `https://xxxx.supabase.co`  
   - 后面会填到 `NEXT_PUBLIC_SUPABASE_URL`
4. 在 **Project API keys** 下：
   - **anon public**：点右侧复制，填到 `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role**：点 “Reveal” 再复制，填到 `SUPABASE_SERVICE_ROLE_KEY`  
   - **注意**：`service_role` 不要泄露、不要提交到 Git，只在本地和服务器环境使用

---

## 第五步：在本地建 `.env.local`

1. 打开终端，进入项目目录：
   ```bash
   cd /Users/xiehuamac/ningyuan
   ```
2. 复制一份示例环境文件（若已有 `.env.local` 可跳过）：
   ```bash
   cp .env.example .env.local
   ```
3. 用 VS Code / Cursor 打开 **.env.local**，按下面格式把第四步拿到的值填进去（把 `xxx` 换成你复制的真实值）：
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://你的项目ID.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6...（一长串）
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6...（另一长串）
   ```
4. 保存文件（不要有多余空格或引号，每行一个变量）

---

## 第六步：开启 Supabase 邮箱登录（可选）

当前注册接口用 **Admin API** 创建用户并自动视为已验证，一般无需邮箱验证即可登录。若你希望用 Supabase 自带的邮箱确认：

1. 在 Supabase 左侧点 **Authentication** → **Providers**
2. 确认 **Email** 已开启
3. 在 **Authentication** → **URL Configuration** 里，**Site URL** 可先填 `http://localhost:3000`（本地开发）

不改这里也可以先跑通注册与登录。

---

## 第七步：本地跑起来并自测

1. 在项目根目录执行：
   ```bash
   npm run dev
   ```
2. 浏览器打开 **http://localhost:3000**
3. 玩到第 20 题会弹出「灵魂伴侣」层；点 **登录 | 注册**，用邮箱 + 密码注册一个账号
4. 若注册成功并自动登录，再玩到第 20 题应看到真实匹配（或“暂无匹配”）；点 **我的连接** 进入 `/chat` 页

若某一步报错，把**哪一步、界面或终端的报错原文**记下来，便于排查。

---

## 小结检查清单

- [ ] Supabase 账号已注册并登录  
- [ ] 已新建项目并记下 Database 密码  
- [ ] 已在 SQL Editor 中执行 `supabase/schema.sql`  
- [ ] 已在 Project Settings → API 中复制 **Project URL**、**anon**、**service_role**  
- [ ] 已在项目根目录创建 `.env.local` 并填入上述三个变量  
- [ ] 已执行 `npm run dev` 并在浏览器中测试注册与灵魂伴侣层  

全部打勾后，灵魂伴侣与「我的连接」聊天功能即可在本地正常使用。
