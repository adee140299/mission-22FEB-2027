# 🎯 Target: 22 Feb 2027 — Mission Calendar

A habit and milestone countdown calendar built with pure **HTML, CSS, and Vanilla JavaScript**. Designed to help you stay focused, maintain relentless discipline, and cross off every single day with a bold red marker until **February 22, 2027**.

---

## ✨ Features

- **❌ Bold Red Marker Cross:** Click any day to slash it with an authentic red marker cross (`✕`) when you finish your daily mission.
- **🎯 22 February 2027 Target Countdown:** Live tracker showing exactly how many days remain until your deadline.
- **🔒 Target Boundary Protection:** Any date beyond 22 Feb 2027 is locked to keep your focus strictly on the goal.
- **🔥 Streaks & Progress Analytics:**
  - Current unbroken streak counter
  - Best streak record
  - Total days completed
  - Overall mission completion percentage bar
- **📅 Dual Calendar Views:**
  - **Month View:** Classic monthly calendar with smooth navigation, "Today" quick jump, and "Go to Feb 2027" shortcut.
  - **Wall Roadmap (All Months):** Master wall grid displaying every month leading up to 22 Feb 2027 so you can see your entire journey at a glance.
- **📝 Daily Tasks & Reflection Notes:** Click the pencil icon (`✎`) on any date to break down specific sub-tasks or journal your daily thoughts.
- **🔊 Felt-Tip Marker Audio FX:** Satisfying synthesized marker stroke sound when crossing off days (works completely offline, toggleable).
- **🎉 Confetti Celebration:** Instant celebratory burst whenever you mark today complete!
- **🌓 Dark & Light Modes:** Automatically detects your system preference, with a one-click manual toggle.
- **💾 LocalStorage & Zero-Loss Backup:**
  - Progress is automatically saved in your browser's local storage.
  - One-click **Backup** (JSON export) and **Restore** (JSON import) to transfer your progress between computers and mobile devices.

---

## 🚀 How to Run Locally

You don't need to install any frameworks or dependencies:

1. Double click [`index.html`](file:///Users/pradeepkumaryadav/Desktop/22%20FEB/index.html) in your file explorer to open it in any browser (Chrome, Safari, Edge, Firefox).
2. Alternatively, run a lightweight local server:
   ```bash
   npx serve .
   # or
   python3 -m http.server 8000
   ```
   Then open `http://localhost:8000`.

---

## 🐙 How to Push to GitHub & Host on GitHub Pages (Free)

Follow these simple steps in your terminal to publish your calendar live on the internet:

### 1. Initialize Git and Commit
```bash
git init
git add .
git commit -m "feat: complete target 22 feb 2027 calendar website"
```

### 2. Create a New Repository on GitHub
1. Go to [github.com/new](https://github.com/new).
2. Name your repository (e.g., `target-22feb-calendar` or `mission-2027`).
3. Leave it **Public** (or Private if you have GitHub Pro Pages), and do not initialize with README.
4. Click **Create repository**.

### 3. Connect and Push to GitHub
Copy the commands shown on GitHub:
```bash
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git push -u origin main
```
*(Replace `YOUR_USERNAME` and `YOUR_REPO_NAME` with your actual GitHub username and repository name).*

### 4. Enable GitHub Pages (Free Hosting)
1. On your GitHub repository page, click **Settings** (top tabs).
2. In the left sidebar, click **Pages** (under the "Code and automation" section).
3. Under **Branch**, select `main` from the dropdown and leave the folder as `/(root)`.
4. Click **Save**.
5. Within 1–2 minutes, GitHub will give you a live URL like:
   `https://YOUR_USERNAME.github.io/YOUR_REPO_NAME/`

You can bookmark this URL on your phone or laptop and cross off your days every single day!

---

## 📱 Mobile Friendly
This web app is fully responsive and supports touch screens. On iPhone (Safari) or Android (Chrome), you can tap **Share** > **Add to Home Screen** to use it just like a native app.

