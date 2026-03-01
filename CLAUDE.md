# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**file-download-board** — A file download board web application. The project is in its initial setup phase (not yet initialized with code).

## Planned Tech Stack

- **Framework**: Next.js (App Router)
- **Language**: TypeScript
- **UI**: React with Server Components
- **Styling**: TBD (likely Tailwind CSS)
- **Skills installed**: `next-best-practices` (vercel-labs/next-skills), `vercel-react-best-practices` (vercel-labs/agent-skills)

## Project Status

- Development level: Dynamic (fullstack with backend/auth capabilities)
- PDCA pipeline phase: 1 (Schema/Planning)
- No application code exists yet — project needs initialization

## Architecture Notes

When initializing, follow these patterns based on the installed skills:

- Use Next.js App Router (`app/` directory) with React Server Components for data fetching
- Prefer Server Components by default; use `'use client'` only when client interactivity is needed
- Follow Vercel best practices for bundling, performance, and rendering optimization

## Memo

- 모든 답변과 추론과정은 한국어로 작성한다.
- 항상 CLAUDE.md 파일을 먼저 확인하고, 그 내용을 바탕으로 답변하며, 필요한경우 항상 최신화로 업데이트 상태를 유지한다.
- 코드 생성시, 항상 CLAUDE.md의 내용을 참고하여 생성한다.
- 코드 생성시, 항상 최신화된 코드를 생성한다.
- 코드 작업을 마치면 항상 린트체크, 타입체크, 빌드체크를 수행한다.
- 커밋메시지 작성시에는 접두사를 제외한 메세지 본문은 한국어로 작성한다.
- 린트 체크는 경고도 무시하지말고 해결하려고 최대한 시도한다.
