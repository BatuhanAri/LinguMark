<div align="center">
  <img src="public/icons/logo.png" alt="LinguMark Logo" width="120" />
  <h1>🌍 LinguMark</h1>
  <p><strong>Your Personal Language Learning Companion directly inside your Browser.</strong></p>
  
  [![Manifest](https://img.shields.io/badge/Manifest-V3-success.svg)](#)
  [![Vite](https://img.shields.io/badge/Vite-5.4-646CFF.svg?logo=vite&logoColor=white)](#)
  [![Tailwind](https://img.shields.io/badge/Tailwind_CSS-4.0-38B2AC.svg?logo=tailwind-css&logoColor=white)](#)
  [![Firebase](https://img.shields.io/badge/Firebase-Auth-FFCA28.svg?logo=firebase&logoColor=black)](#)
</div>

<br />

## 📖 What is LinguMark?

**LinguMark** is a modern, lightweight, and incredibly powerful Google Chrome Extension built for seamless language learning. Instead of constantly switching tabs to look up words or managing clunky spreadsheets for vocabulary, LinguMark allows you to translate, save, and learn words **without ever leaving your current webpage.**

Whether you are reading articles, watching news, or researching topics, you can select an unknown word, right-click, and instantly add it to your personal dictionary. LinguMark then turns your saved vocabulary into gamified learning modules using Spaced Repetition algorithms.

## 🚀 Core Features

### 🌟 Smart Context & Multi-Language Support
* **Decoupled Architecture:** Your native language (UI) and your studied language are completely separate.
* **Auto-Detection:** Powered by the Google Translate API, LinguMark automatically detects the source language of highlighted words.
* **In-Page Translation:** Right-click highlighted words directly on any webpage to see their meaning instantly without opening new tabs.

### 🔬 Web Röntgen (Premium)
An advanced webpage scanning and complexity analysis tool. 
* **Analyze Web Pages:** Instantly scans the webpage you are reading and highlights words based on their CEFR difficulty levels (A1, A2, B1, B2, C1, C2).
* **Smart Filtering:** You decide which levels you want to focus on (e.g., "Only highlight B2 and C1 words for me").

### 📚 Oxford CEFR Vocabulary Library (Premium)
Don't want to collect words one by one? 
* **Curated Database:** Access a pre-built English vocabulary library categorized by CEFR levels.
* **One-Click Inject:** Inject thousands of highly curated, essential words directly into your personal dictionary with a single click.

### 🎮 The Learning Center Dashboard
A dedicated, full-page dashboard designed with stunning UI/UX (Glassmorphism, Dark Mode) to help you memorize your vocabulary:
* **Flashcards:** Classic flashcard system for quick memory checks.
* **Typing Practice:** Test your spelling and typing speed.
* **Matching Game:** Interactive drag & drop or click-to-match vocabulary games.
* **Spaced Repetition (Remember Module):** A scientifically proven algorithm that schedules your reviews right when you are about to forget them.
* **Native Text-To-Speech (Web Speech API):** Listen to the native pronunciations of your vocabulary inside the Dashboard.

### 💎 SaaS Monetization & Seamless Onboarding
* **Firebase Authentication:** Secure user login and registration.
* **Premium Soft-Lock:** A robust premium subscription gating mechanism seamlessly integrated with Firebase Firestore.
* **Interactive Onboarding:** A completely interactive, multi-step "Learning by Doing" wizard that welcomes new users and teaches them exactly how to use the extension. Includes dynamic i18n support.

---

## 🏗️ Architecture & Storage
* **Unlimited Local Storage:** Built entirely on `chrome.storage.local` combined with the `unlimitedStorage` permission. LinguMark handles massive datasets (10,000+ words) effortlessly without performance hiccups.
* **Non-Intrusive UI:** Uses sleek, non-intrusive superscript `L` badges on web pages to indicate saved words without breaking the website's original layout.
* **Optimized Context Menus:** Context menu optimized to appear exclusively for single-word selections to prevent visual clutter and accidental additions.

---

## 🛠️ Built With

LinguMark is engineered for speed, security, and aesthetics using the latest web technologies:

* **[Vite](https://vitejs.dev/)** - Next Generation Frontend Tooling
* **[Tailwind CSS v4](https://tailwindcss.com/)** - Utility-first CSS framework for rapid, modern UI development
* **Vanilla JavaScript (ES6+)** - Zero-dependency, blazing-fast core logic
* **Google Chrome Manifest V3** - The modern security and performance standard for Chrome Extensions
* **Firebase** - Backend as a Service (Authentication & Firestore DB)

---

## ⚙️ Installation for Development

To run this extension locally or contribute to the development:

1. **Prerequisites:** Ensure you have [Node.js](https://nodejs.org/) installed on your machine.
2. **Clone the repository:** Clone this project to your local environment and navigate into the directory.
3. **Install Dependencies:**
   ```bash
   npm install
   ```
4. **Build the Extension:**
   ```bash
   npm run build
   ```
   *(Note: LinguMark uses a custom postbuild script to clean up `crossorigin` attributes for strict Chrome Extension CSP compliance).*
5. **Load into Chrome:**
   * Open your Chrome browser and navigate to `chrome://extensions/`.
   * Enable **"Developer Mode"** via the toggle on the top right.
   * Click **"Load unpacked"** and select the `dist` folder generated by the build process.

---

## 🤝 Contributing
Contributions, issues, and feature requests are welcome! Feel free to check the issues page.

## 📜 License
This project is licensed under the MIT License - see the LICENSE file for details.
