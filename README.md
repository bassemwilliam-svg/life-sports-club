# Life Sports Club — Digital Transformation Demo

A high-fidelity clickable demo of the proposed website, mobile app, watch app, member portal, admin console, and event experiences for [Life Sports Club](https://lifesportsclub.com), prepared by **Genesis Creations**.

**Live demo:** https://bassemwilliam-svg.github.io/life-sports-club/

## What's in here

This is a static, dependency-free HTML/CSS/JS prototype that demonstrates every workstream in the Genesis Creations proposal, plus the additional features added during scoping.

### Pages

| Page | Purpose |
|------|---------|
| `index.html` | Homepage — full-bleed hero, live activity cards, STEM event banner, featured programs, mobile + watch CTA, testimonials |
| `programs.html` | 20+ sports grouped into 7 categories (Team, Racket, Aquatic, Fitness, Martial, Individual, Mind) with filterable chips |
| `program-detail.html` | Individual sport page with schedule, coach card, family bundle calculator, sticky booking sidebar |
| `quiz.html` | "Find your sport" 60-second matchmaking quiz |
| `events.html` | Events hub with calendar strip, featured event, upcoming grid, past gallery |
| `event-stem.html` | Cinematic STEM Robotics event landing page — animated traffic light, live countdown, age-track switcher |
| `facilities.html` | Interactive 3D isometric club map with hover-driven facility tour |
| `membership.html` | 3 tiers, comparison table, trust strip |
| `login.html` | Keycloak-style SSO mock with biometric prompt |
| `member-portal.html` | Member dashboard — QR card, Life Points, streak, family management, bookings, recent activity |
| `app.html` | iOS / Android mobile app preview — 14 screens in a phone frame |
| `admin.html` | Admin console — KPI tiles, drag-drop media upload, publish-to-web-and-app flow |
| `news.html` | News & stories with featured article, social Moments grid, newsletter signup |

### Features demonstrated

- **Full-bleed photo backdrops** with brand-coherent dark + neon-green palette (`#44D62C`)
- **Interactive 3D club map** matching the existing LSC site aesthetic
- **Apple-watch-style mockup** with live heart-rate animation in the Mobile App CTA
- **Live training & connected devices** mobile screens (Apple Watch, Garmin, Fitbit, Samsung Health)
- **Per-session coach-share consent** for biometric data
- **Cross-page guided onboarding tour** (11 steps, localStorage-persisted)
- **EN / AR toggle** with full RTL support, persistent across pages
- **Mobile hamburger drawer** at < 900px
- **Member portal** with smooth-scroll dashboard nav
- **Admin Media Portal** with drag-drop upload and "Publish to Web + App" flow
- All 17 photographic assets generated via Gemini (Nano Banana Pro)

### Stack

Pure HTML + CSS + vanilla JS. No build step. No framework. Loads instantly on any laptop, tablet, or phone — open `index.html` in any modern browser.

The production build (post-engagement) targets Next.js 14 + React Native + NestJS + AWS — see the technical proposal for the full stack.

## Running locally

```bash
git clone https://github.com/bassemwilliam-svg/life-sports-club.git
cd life-sports-club
open index.html
```

Or just double-click `index.html` in Finder.

## Genesis Creations

Cairo · Dubai · genesiscreations.co
