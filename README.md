# 🎬 Vox3D Studio

> *Immersive 3D Animated Website — Freelance Client Project*

[![Built With](https://img.shields.io/badge/built%20with-Three.js%20%2B%20GSAP-blueviolet?style=flat)]()
[![Type](https://img.shields.io/badge/project-Freelance%20Client%20Work-FF4081?style=flat)]()
[![Design](https://img.shields.io/badge/design-3D%20Motion%20%26%20Animation-00C9A7?style=flat)]()
[![Status](https://img.shields.io/badge/status-delivered-brightgreen.svg)]()

---

<div align="center">

### ✦ A showcase of real-depth web craftsmanship ✦
*Every pixel moves. Every transition breathes. Every page tells a story.*

</div>

---

## 🎯 Project Overview

**Vox3D Studio** is a high-end, fully animated 3D website delivered as a **freelance project** for a client seeking a premium digital presence. This isn't a template — it's a handcrafted, motion-first web experience where **every single page transition is a cinematic animation**, and every element is orchestrated with precision timing and spatial depth.

This project represents the full spectrum of modern frontend engineering — blending **3D rendering, physics-based motion, scroll-driven storytelling, and seamless UX** into one cohesive experience.

> 💼 *Delivered as a freelance engagement — from concept to client handoff.*

---

## ✨ What Makes This Different

```
Most websites:     Static layout → click → new static layout
Vox3D Studio:      Living scene  → morph → next living scene
```

Every navigation event triggers a **choreographed 3D transition sequence** — pages don't load, they *transform*. The result is an experience that feels more like an interactive film than a website.

---

## 🌀 Animation & Motion System

### Page-to-Page Transitions
- Full 3D **scene morphing** between routes — no hard cuts, no flashes
- Camera flies through 3D space to arrive at the next page
- Elements **dissolve, scale, rotate, and reassemble** in 3D on each transition
- Custom **transition timeline engine** — every route has its own unique exit and entry choreography

### Scroll-Driven Storytelling
- Scroll position controls **camera trajectory** through 3D environments
- Elements **emerge from depth** as the user scrolls into sections
- Parallax layering with true Z-axis separation, not CSS tricks
- **Progress-based animation scrubbing** — scroll back and animations reverse perfectly

### Motion Design Highlights
```
✦  3D object rotations tied to cursor position (gyro-style tracking)
✦  Fluid mesh distortion on hover (shader-based)
✦  Particle systems that react to user interaction
✦  Staggered text reveals with kinetic typography
✦  Smooth spring physics on all interactive elements
✦  Ambient floating objects with procedural motion
```

---

## 🛠️ Tech Stack

```
3D Engine          →  Three.js (WebGL renderer)
Animation          →  GSAP (GreenSock) + ScrollTrigger
Shaders            →  GLSL (custom vertex & fragment shaders)
Page Routing       →  Next.js App Router / React Router
Transitions        →  Framer Motion + custom GSAP timelines
Styling            →  Tailwind CSS + CSS custom properties
3D Assets          →  Blender (modeled & exported as glTF/GLTF)
Post-processing    →  Three.js EffectComposer (bloom, DOF, chromatic aberration)
Performance        →  Lazy loading, texture compression, LOD meshes
Deployment         →  Vercel
```

---

## 📁 Project Structure

```
vox3d-studio/
├── app/
│   ├── page.jsx                  # Home — hero 3D scene
│   ├── about/page.jsx            # About — camera dive transition
│   ├── work/page.jsx             # Portfolio — 3D card carousel
│   ├── services/page.jsx         # Services — floating panels
│   └── contact/page.jsx          # Contact — particle space
├── components/
│   ├── canvas/                   # All Three.js scene components
│   │   ├── HeroScene.jsx
│   │   ├── TransitionManager.jsx
│   │   └── ParticleField.jsx
│   ├── transitions/              # Page transition orchestrators
│   │   ├── PageWrapper.jsx
│   │   └── useTransition.js
│   └── ui/                       # Non-3D UI elements
├── shaders/
│   ├── distortion.vert           # Custom vertex shaders
│   ├── glow.frag                 # Fragment shader — bloom effect
│   └── noise.glsl                # Procedural noise utilities
├── lib/
│   ├── gsap.config.js            # GSAP global setup
│   ├── three.utils.js            # Three.js helpers
│   └── animation.timelines.js    # Named transition timelines
├── public/
│   └── models/                   # Optimized .glb / .gltf assets
└── README.md
```

---

## ⚙️ Getting Started

### Prerequisites

- Node.js `v18+`
- A modern browser with **WebGL 2.0** support

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/your-username/vox3d-studio.git
cd vox3d-studio

# 2. Install dependencies
npm install

# 3. Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

> ⚠️ **Best experienced on desktop Chrome or Firefox with hardware acceleration enabled.**

---

## 🎥 Page Transition Map

```
HOME ──────────────────────────────────────────────────────
  Exit  : Hero mesh shatters into particles → fly into tunnel
  Enter : Particles converge → reassemble as next scene

ABOUT ─────────────────────────────────────────────────────
  Exit  : Camera pulls back into void, scene fades to black
  Enter : New scene lights up from center point outward

WORK ──────────────────────────────────────────────────────
  Exit  : Cards fold into origami and drop off canvas
  Enter : Projects unfurl from 3D stack in sequence

SERVICES ──────────────────────────────────────────────────
  Exit  : Floating elements spiral toward vanishing point
  Enter : Panels deploy from depth into position

CONTACT ───────────────────────────────────────────────────
  Exit  : Form dissolves into star field
  Enter : Stars contract into contact UI
```

---

## 🎨 Design Philosophy

This project was built on three design principles:

**1. Motion is meaning** — Every animation communicates something. Nothing moves for decoration alone. Transitions guide the user's mental model of where they are in the experience.

**2. Depth creates reality** — True 3D layering (not CSS `transform: translateZ`) makes the interface feel physically real. The user's cursor, scroll, and viewport become controllers of a live scene.

**3. Performance is non-negotiable** — WebGL is powerful but expensive. Every shader, every mesh, every texture was optimized. The experience runs at **60fps** on modern hardware without compromise.

---

## ⚡ Performance Optimizations

- **GLTF Draco compression** on all 3D models (up to 90% size reduction)
- **Texture atlasing** to minimize GPU draw calls
- **Frustum culling** — only render what's in camera view
- **Level of Detail (LOD)** meshes for complex objects
- **requestAnimationFrame** loop managed centrally to prevent conflicts
- **Code splitting** per route so 3D assets load only when needed
- **Preloading** next page assets during current page transitions

---

## 💼 Freelance Delivery Notes

| Item | Detail |
|---|---|
| Client Type | Creative studio / agency |
| Project Type | Full custom website — design + development |
| Deliverables | Source code, deployed URL, asset library, handoff docs |
| Timeline | Designed, built, and delivered end-to-end |
| Role | Solo — UI/UX Design + Frontend Development |

---

## 📸 Preview

> *(Add screen recordings, GIFs, or screenshots here)*

```
/docs/preview/hero-transition.gif
/docs/preview/scroll-animation.gif
/docs/preview/work-carousel.gif
```

> 🎬 *Live demo link: [vox3d-studio.vercel.app](https://vox3d-studio.vercel.app)*

---

## 📄 License

This codebase is shared for **portfolio and reference purposes**.
Client assets, brand elements, and proprietary content are excluded.
Not licensed for reuse or resale.

---

## 👤 Developer

**Kishore** — UI/UX Designer & Frontend Developer
[GitHub](https://github.com/your-username) · [LinkedIn](https://linkedin.com/in/your-profile) · [Portfolio](https://your-portfolio.com)

---

<div align="center">

**Vox3D Studio** — *Because static websites are a thing of the past.*

Crafted with obsessive attention to motion, depth, and detail. ✦

</div>
