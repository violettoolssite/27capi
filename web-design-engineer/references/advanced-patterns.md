# Advanced Reference: Component Patterns & Code Templates

This file contains advanced patterns and code templates to reference when implementing specific tasks.

## Responsive Slide Engine

For building fixed-size presentations that auto-fit to any viewport.

```css
* { margin: 0; padding: 0; box-sizing: border-box; }
body { 
  background: #000; 
  display: flex; 
  align-items: center; 
  justify-content: center;
  height: 100vh;
  overflow: hidden;
  font-family: system-ui, sans-serif;
}
.stage {
  width: 1920px;
  height: 1080px;
  position: relative;
  transform-origin: center center;
}
.slide {
  position: absolute;
  inset: 0;
  display: none;
  padding: 80px;
}
.slide.active { display: flex; }
.controls {
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 12px;
  z-index: 1000;
}
.controls button {
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  background: rgba(255,255,255,0.15);
  color: white;
  cursor: pointer;
  font-size: 14px;
}
.slide-counter {
  position: fixed;
  bottom: 20px;
  right: 20px;
  color: rgba(255,255,255,0.6);
  font-size: 14px;
}
```

```javascript
function scaleStage() {
  const stage = document.querySelector('.stage');
  const scaleX = window.innerWidth / 1920;
  const scaleY = window.innerHeight / 1080;
  const scale = Math.min(scaleX, scaleY);
  stage.style.transform = `scale(${scale})`;
}
window.addEventListener('resize', scaleStage);
scaleStage();

let current = parseInt(localStorage.getItem('slideIndex') || '0');
const slides = document.querySelectorAll('.slide');

function showSlide(n) {
  current = Math.max(0, Math.min(n, slides.length - 1));
  slides.forEach((s, i) => s.classList.toggle('active', i === current));
  localStorage.setItem('slideIndex', current);
  document.querySelector('.slide-counter').textContent = `${current + 1} / ${slides.length}`;
}

document.addEventListener('keydown', e => {
  if (e.key === 'ArrowRight' || e.key === ' ') showSlide(current + 1);
  if (e.key === 'ArrowLeft') showSlide(current - 1);
});

showSlide(current);
```

## Device Simulation Frames

### iPhone Frame

```jsx
const IPhoneFrame = ({ children, title = "App" }) => (
  <div style={{
    width: 390, height: 844, borderRadius: 48,
    border: '12px solid #1a1a1a', overflow: 'hidden',
    position: 'relative', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', background: '#fff'
  }}>
    <div style={{
      height: 54, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 24px', fontSize: 14, fontWeight: 600
    }}>
      <span>9:41</span>
      <div style={{
        width: 126, height: 34, background: '#1a1a1a', borderRadius: 20,
        position: 'absolute', left: '50%', transform: 'translateX(-50%)', top: 8
      }} />
      <span>⚡ 📶</span>
    </div>
    <div style={{ height: 'calc(100% - 54px)', overflow: 'auto' }}>
      {children}
    </div>
    <div style={{
      position: 'absolute', bottom: 8, left: '50%', transform: 'translateX(-50%)',
      width: 134, height: 5, background: '#1a1a1a', borderRadius: 3
    }} />
  </div>
);
```

### Browser Window Frame

```jsx
const BrowserFrame = ({ children, url = "https://example.com" }) => (
  <div style={{
    borderRadius: 12, overflow: 'hidden',
    boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', border: '1px solid #e5e5e5'
  }}>
    <div style={{
      background: '#f5f5f5', padding: '12px 16px', display: 'flex', alignItems: 'center',
      gap: 12, borderBottom: '1px solid #e5e5e5'
    }}>
      <div style={{ display: 'flex', gap: 8 }}>
        <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#ff5f57' }} />
        <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#febc2e' }} />
        <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#28c840' }} />
      </div>
      <div style={{
        flex: 1, background: '#fff', borderRadius: 6, padding: '6px 12px',
        fontSize: 13, color: '#666', border: '1px solid #e0e0e0'
      }}>
        {url}
      </div>
    </div>
    <div style={{ background: '#fff' }}>
      {children}
    </div>
  </div>
);
```

## Animation Timeline Engine

```jsx
const useTime = (duration = 5000) => {
  const [time, setTime] = React.useState(0);
  const [playing, setPlaying] = React.useState(true);
  const frameRef = React.useRef();
  const startRef = React.useRef();

  React.useEffect(() => {
    if (!playing) return;
    const animate = (timestamp) => {
      if (!startRef.current) startRef.current = timestamp;
      const elapsed = (timestamp - startRef.current) % duration;
      setTime(elapsed / duration);
      frameRef.current = requestAnimationFrame(animate);
    };
    frameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameRef.current);
  }, [playing, duration]);

  return { time, playing, setPlaying };
};

const Easing = {
  linear: t => t,
  easeInOut: t => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
  easeOut: t => 1 - Math.pow(1 - t, 3),
  easeIn: t => t * t * t,
  spring: t => 1 - Math.pow(Math.E, -6 * t) * Math.cos(8 * t)
};

const interpolate = (t, from, to, easing = Easing.easeInOut) => {
  const progress = easing(Math.max(0, Math.min(1, t)));
  return from + (to - from) * progress;
};
```

## Color System Best Practices

Use oklch to define a harmonious color system:

```css
:root {
  --primary-h: 250;
  --primary: oklch(0.55 0.25 var(--primary-h));
  --primary-light: oklch(0.75 0.15 var(--primary-h));
  --primary-dark: oklch(0.35 0.2 var(--primary-h));
  
  --gray-50: oklch(0.98 0.002 250);
  --gray-100: oklch(0.96 0.004 250);
  --gray-200: oklch(0.92 0.006 250);
  --gray-300: oklch(0.87 0.008 250);
  --gray-400: oklch(0.71 0.01 250);
  --gray-500: oklch(0.55 0.014 250);
  --gray-600: oklch(0.45 0.014 250);
  --gray-700: oklch(0.37 0.014 250);
  --gray-800: oklch(0.27 0.014 250);
  --gray-900: oklch(0.21 0.014 250);
}
```

## Dark Mode Toggle

```jsx
const ThemeProvider = ({ children }) => {
  const [dark, setDark] = React.useState(
    window.matchMedia('(prefers-color-scheme: dark)').matches
  );

  const theme = dark ? {
    bg: '#0a0a0b', surface: '#18181b', border: '#27272a',
    text: '#fafafa', textMuted: '#a1a1aa', primary: '#3b82f6'
  } : {
    bg: '#ffffff', surface: '#f4f4f5', border: '#e4e4e7',
    text: '#18181b', textMuted: '#71717a', primary: '#2563eb'
  };

  return (
    <ThemeContext.Provider value={{ theme, dark, setDark }}>
      <div style={{ background: theme.bg, color: theme.text, minHeight: '100vh' }}>
        {children}
      </div>
    </ThemeContext.Provider>
  );
};
```

## Data Visualization with Chart.js

```html
<canvas id="myChart" width="800" height="400"></canvas>
<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
<script>
  const ctx = document.getElementById('myChart').getContext('2d');
  new Chart(ctx, {
    type: 'line',
    data: {
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
      datasets: [{
        label: 'Revenue',
        data: [12, 19, 3, 5, 2, 3],
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
        fill: true
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } },
      scales: {
        y: { beginAtZero: true, grid: { color: '#f0f0f0' } },
        x: { grid: { display: false } }
      }
    }
  });
</script>
```
