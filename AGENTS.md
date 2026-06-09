<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# AI Agent Instructions for Voice-to-Book Writer

Welcome, future AI Agent! This file contains the foundational rules, technology stack, and project context for this application. Please read this entirely before modifying the codebase.

## 1. Project Goal
This is a **mobile-first, AI-powered voice-to-book writing assistant**. The user speaks into their device, and the AI translates their spoken words into structured book chapters and text blocks, allowing them to easily edit and rearrange the content.

## 2. Tech Stack
- **Framework**: Next.js (App Router)
- **Styling**: Tailwind CSS (Premium, vibrant, mobile-first design)
- **Database / Auth**: Supabase (PostgreSQL)
- **Language**: TypeScript

## 3. Database Architecture (Supabase)
We use a relational database structure. Expected core entities:
- `User`: The author.
- `Book`: A collection of chapters.
- `Chapter`: A section of a book.
- `TextBlock / AudioClip`: Individual paragraphs or transcribed voice notes belonging to a chapter.

*Note: Always use Supabase SSR helpers for Next.js App Router when querying data or handling authentication.*

## 4. Design & Aesthetics Requirements
- **Mobile-First**: The UI must be optimized for mobile screens first and foremost.
- **Premium Feel**: Use modern web design practices. Implement glassmorphism, smooth gradients, subtle micro-animations, and high-quality typography. The app should not look like a generic MVP.
- **Dark Mode**: Support a sleek dark mode by default or seamlessly via Tailwind's `dark:` classes.
- **Animations**: Use Framer Motion or Tailwind transitions for smooth interactions.

## 5. Development Workflow
- Run local server with `npm run dev`.
- Ensure all components are strongly typed with TypeScript.
- Follow SEO best practices (Semantic HTML, proper metadata) for public pages.
- When creating new features, prioritize interactive and responsive UI/UX over rigid layouts.
