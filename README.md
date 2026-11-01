# The Sweet Spot

AI-powered group outing planner that uses taste science to find the perfect restaurant, bar, or activity where everyone's happy.

**Live:** [the-sweet-spot-rosy.vercel.app](https://the-sweet-spot-rosy.vercel.app)

**Built with:** Next.js, React, TypeScript, Supabase, Tailwind CSS, Framer Motion, Vercel, Qloo API, Google Places API

---

## Inspiration

Every friend group has the same problem. You want to go out, but nobody can agree on where. One person wants sushi, another wants cocktails, someone's vegan, and the last one just wants good vibes. You spend more time arguing in the group chat than actually going out. We built The Sweet Spot to kill that problem for good.

## What it does

The Sweet Spot is a social taste-matching platform that finds the one place your entire group will love. Every user takes a quick, visual taste quiz covering cuisines, drinks, music, ambiance, budgets, and dealbreakers. When you create a group and invite your crew, our engine analyzes everyone's overlapping preferences and generates a curated itinerary of restaurants, bars, and activities that hit the sweet spot for the whole group, not just the loudest person.

Beyond planning, it's a full social experience: add friends, message each other with WhatsApp-style features (view-once photos, starred and pinned messages), track your group chemistry score in real time, and get a Spotify Wrapped-style recap of your taste profile and outings.

## How we built it

1) Frontend: Next.js 14 App Router with React, TypeScript, and Tailwind CSS for a responsive, glassmorphic UI
2) Animations: Framer Motion for smooth page transitions, micro-interactions, and animated backgrounds
3) Auth & Database: Supabase for authentication (Google OAuth, email/password) and PostgreSQL for profiles, friendships, and notifications
4) AI/Taste Engine: Qloo's cultural taste API for intelligent venue and activity recommendations based on group preference overlap
5) Location: Google Places API for autocomplete and geo-aware suggestions
6) Deployment: Vercel with environment variables for seamless CI/CD

## Challenges we ran into

1) Group taste aggregation: Finding the intersection of everyone's preferences without defaulting to the lowest common denominator required creative scoring algorithms
2) OAuth token persistence: Google provider tokens don't survive page redirects in Supabase, so we engineered a short-lived httpOnly cookie bridge for secure token passing
3) Mobile responsiveness: Making a feature-rich app feel native on mobile with a glassmorphic design system that works across all screen sizes
4) Real-time feel: Creating a responsive, app-like experience with optimistic UI updates and localStorage caching while keeping Supabase as the source of truth

## Accomplishments we're proud of

1) A group chemistry algorithm that surfaces non-obvious shared preferences instead of just picking the most generic option
2) A full messaging system with view-once photos, pinned messages, and starred notes built entirely from scratch during a hackathon
3) A glassmorphic UI that feels like a polished consumer app, not a hackathon prototype
4) End-to-end flow from quiz to group to itinerary that works seamlessly on both mobile and desktop
5) Smart itinerary generation that balances cuisines, vibes, budgets, and travel constraints for an entire group in seconds

## What we learned

1) Taste is deeply personal but surprisingly predictable: small overlaps in preferences can reveal the perfect shared experience
2) Glassmorphic design requires careful layering of blur, transparency, and borders to feel premium without hurting readability
3) Building social features (messaging, friends, notifications) from scratch gives you deep appreciation for what WhatsApp engineers deal with daily

## What's next for The Sweet Spot

1) Real-time group polling: Live polls for date/time voting within groups
2) Taste evolution: Track how your preferences change over time
3) Restaurant partnerships: Direct reservation booking from generated itineraries
4) Expanding cities: More venue data and local recommendations worldwide

---

## Try it out

Open [the-sweet-spot-rosy.vercel.app](https://the-sweet-spot-rosy.vercel.app) to see the app.
