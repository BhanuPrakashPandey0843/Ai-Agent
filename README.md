# ✝️ FaithFrames — AI-Powered Christian Bible & Wallpaper App

<div align="center">

### A Premium Faith-Based Mobile Platform Built with React Native, Expo, Firebase & AI

*Read the Bible • Generate AI Wallpapers • Daily Devotionals • Quizzes • Prayer • Community*

<img src="https://img.shields.io/badge/React%20Native-0.74-blue?style=for-the-badge&logo=react" />
<img src="https://img.shields.io/badge/Expo-SDK%2051-000020?style=for-the-badge&logo=expo" />
<img src="https://img.shields.io/badge/Firebase-Backend-FFCA28?style=for-the-badge&logo=firebase" />
<img src="https://img.shields.io/badge/TypeScript-5.3-3178C6?style=for-the-badge&logo=typescript" />
<img src="https://img.shields.io/badge/AI-Wallpaper%20Generator-purple?style=for-the-badge" />
<img src="https://img.shields.io/badge/License-MIT-success?style=for-the-badge" />

</div>

---

## 🌟 About FaithFrames

**FaithFrames** is a beautifully designed **AI-powered Christian mobile application** that helps users deepen their faith through scripture, devotionals, prayer, quizzes, inspirational wallpapers, and community features.

The app combines a modern luxury UI with spiritual content, allowing believers to stay connected with God's Word every day.

Whether you're reading the Bible, completing a reading plan, generating AI Christian wallpapers, or sharing your testimony — FaithFrames provides one unified spiritual experience.

---

# ✨ Features

## 📖 Bible Experience

- Complete Old & New Testament reader.
- Beautiful dark & light themes.
- Chapter and verse navigation.
- Bookmarks and favorite verses.
- Personal Bible notes.
- Multiple Bible reading plans.
- Reading progress tracking.
- Continue reading from last position.

---

## 🤖 AI Christian Wallpaper Generator

Generate stunning Christian wallpapers using AI.

### Features

- AI-generated Bible verse wallpapers.
- Jesus-themed wallpapers.
- Cross wallpapers.
- Worship backgrounds.
- Nature + Scripture wallpapers.
- High-quality HD downloads.
- Share directly to social media.

---

## 🙏 Daily Spiritual Content

Stay spiritually connected every day.

- Daily Bible Verse.
- Daily Prayer.
- Daily Devotional.
- Inspirational Quotes.
- Faith Reflections.
- Prayer Journal.

---

## 📅 Bible Reading Plans

Three guided reading journeys:

- 🌅 **30 Days Faith Journey**
- 📘 **90 Days Bible Overview**
- 📖 **365 Days Bible Reading Plan**

Features include:

- Daily progress tracker.
- Completed day indicators.
- Reading summaries.
- Reflection prompts.
- Continue reading button.
- Streak tracking.

---

## 🧠 Interactive Quiz System

Test your Bible knowledge.

### Quiz Features

- Multiple categories.
- Difficulty levels.
- Instant scoring.
- Progress tracking.
- Leaderboard-ready architecture.
- Daily quiz challenges.

---

## ❤️ Community Features

FaithFrames isn't just a Bible app.

Users can:

- Share testimonies.
- Share faith posts.
- Upload worship moments.
- Encourage others.
- Join faith discussions.

---

## 🎨 Premium UI/UX

Designed with a luxury mobile experience.

- Elegant typography.
- Golden Christian theme.
- Fully responsive layouts.
- Dark Mode.
- Light Mode.
- Smooth animations.
- Modern cards and gradients.

---

# 📱 Screens Included

| Feature | Description |
|---------|-------------|
| 🏠 Home | Daily inspiration & featured content |
| 📖 Bible | Complete Bible reading experience |
| 📝 Notes | Personal Bible notes |
| 🔖 Bookmarks | Saved scriptures |
| 📅 Reading Plans | 30 / 90 / 365 day plans |
| 🎨 AI Wallpapers | Generate & browse wallpapers |
| 🙏 Prayer | Daily prayers |
| 💬 Community | Testimonies & posts |
| 🧠 Quiz | Bible quizzes |
| 👤 Profile | User profile & settings |

---

# 🏗️ Project Architecture

```text
FaithFrames/
│
├── 📱 app/                        # React Native Mobile App
│   ├── src/
│   ├── assets/
│   ├── firebase/
│   └── navigation/
│
├── 💻 FaithFrames Website/         # Next.js Admin Dashboard
│   └── my-app/
│
└── 📄 README.md
```

---

# 🔄 System Architecture

```text
             Admin Dashboard (Next.js)
                      │
                      │
        Firebase Authentication
                      │
         Firebase Firestore Database
                      │
      Cloud Storage + Cloudinary Images
                      │
          FaithFrames React Native App
                      │
   AI Wallpapers • Bible • Quiz • Community
```

---

# 🛠️ Tech Stack

## Mobile App

| Technology | Usage |
|------------|------|
| React Native | Cross-platform mobile development |
| Expo SDK 51 | Native runtime & development |
| TypeScript | Type-safe development |
| React Navigation | Navigation system |
| FlashList | High-performance lists |
| Firebase | Backend services |
| Async Storage | Local persistence |
| Axios | API communication |

---

## Backend & Cloud

| Service | Purpose |
|---------|---------|
| Firebase Authentication | User authentication |
| Firestore | Database |
| Firebase Storage | User uploads |
| Firebase Cloud Messaging | Push notifications |
| Cloudinary | Wallpaper hosting & optimization |

---

## AI & Media

- AI Wallpaper Generation
- Image Optimization
- Dynamic Image Transformations
- HD Wallpaper Delivery

---

## Design & UX

- Expo Linear Gradient
- React Native SVG
- Blur Effects
- Haptics
- Smooth Animations
- Dark & Light Theme Support

---

# 📂 Folder Structure

```text
app/
├── assets/
│   ├── fonts/
│   ├── icons/
│   └── wallpapers/
│
├── src/
│   ├── components/
│   ├── screens/
│   ├── navigation/
│   ├── hooks/
│   ├── services/
│   ├── context/
│   ├── utils/
│   └── theme/
│
├── firebase/
│   ├── firestore.rules
│   └── firestore.indexes.json
│
└── App.tsx
```

---

# 🚀 Getting Started

## Prerequisites

- Node.js 18+
- npm / Yarn
- Expo CLI
- Android Studio
- Firebase Project
- Cloudinary Account

---

## Installation

### Clone Repository

```bash
git clone https://github.com/BhanuPrakashPandey0843/Ai-Agent.git

cd Ai-Agent/app
```

### Install Dependencies

```bash
npm install
```

### Start Development Server

```bash
npm start
```

### Android

```bash
npm run android
```

### iOS

```bash
npm run ios
```

### Web

```bash
npm run web
```

---

# 📦 Build Commands

## Android APK / AAB

```bash
npm run build:android
```

## iOS Build

```bash
npm run build:ios
```

---

# 🔥 Firebase Setup

FaithFrames uses **one Firebase project** for both the mobile app and admin dashboard.

Enable:

- Authentication
- Firestore Database
- Cloud Storage
- Firebase Cloud Messaging

Deploy Rules

```bash
npm run deploy:firestore
```

---

# ☁️ Cloudinary Integration

Cloudinary powers the media pipeline.

### Used For

- Wallpaper Hosting.
- Automatic Image Compression.
- Image Transformations.
- HD Delivery.
- Faster Loading.

---

# 🎯 Core Functionalities

### User Authentication

- Email Authentication.
- Secure Login.
- Persistent Sessions.

### Bible Reader

- Old Testament.
- New Testament.
- Bookmarks.
- Notes.
- Reading History.

### AI Wallpapers

- Generate Wallpaper.
- Save Wallpaper.
- Download.
- Share.

### Quiz

- Bible Quiz.
- Daily Challenges.
- Score Tracking.

### Reading Plans

- Progress Tracking.
- Completed Days.
- Streaks.

### Community

- Testimonies.
- Faith Posts.
- Worship Sharing.

---

# 🌙 Theme Support

FaithFrames includes a complete design system.

### Light Theme

- Premium White UI.
- Golden Accent.
- Soft Shadows.

### Dark Theme

- Deep Charcoal Background.
- Golden Highlights.
- High Contrast Typography.

---

# 📸 Premium User Experience

FaithFrames focuses on:

- Elegant animations.
- Premium typography.
- Smooth navigation.
- Accessible design.
- Consistent spacing.
- Modern Christian aesthetics.

---

# 📈 Performance Optimizations

- FlashList for long lists.
- Lazy image loading.
- Optimized Firebase queries.
- Cached assets.
- Cloudinary image optimization.
- TypeScript for maintainability.

---

# 📚 Available Scripts

```bash
npm start               # Start Expo development server

npm run android         # Run Android development build

npm run ios             # Run iOS development build

npm run web             # Run web version

npm run build:android   # Create Android AAB

npm run build:ios       # Create iOS build

npm run clean           # Expo doctor + dependency fixes

npm run deploy:firestore # Deploy Firestore rules and indexes
```

---

# 👨‍💻 Developer

## Bhanu Prakash Pandey

**Software Developer | React Native | Java | MERN | Firebase | AI**

- 📧 Email: **bhanuprakashpandey0843@gmail.com**
- 💼 GitHub: **BhanuPrakashPandey0843**

---

# ⭐ Support the Project

If you like **FaithFrames**, consider giving this repository a ⭐ on GitHub.

It helps others discover the project and supports future development.

---

<div align="center">

## ✝️ "Your word is a lamp to my feet and a light to my path."

**Psalm 119:105**

Made with ❤️ and Faith by **Bhanu Prakash Pandey**

</div>