<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  radius: number
  hue: number
  alpha: number
  drift: number
}

const canvasRef = ref<HTMLCanvasElement | null>(null)
const pointer = { x: 0, y: 0, active: false }
let animationFrameId = 0
let particles: Particle[] = []
let lastFrameTime = 0

function randomBetween(min: number, max: number) {
  return Math.random() * (max - min) + min
}

function createParticles() {
  const width = window.innerWidth
  const height = window.innerHeight
  const count = Math.min(90, Math.max(55, Math.floor((width * height) / 24)))

  particles = Array.from({ length: count }, () => ({
    x: randomBetween(0, width),
    y: randomBetween(0, height),
    vx: randomBetween(-1.1, 1.1),
    vy: randomBetween(-1.1, 1.1),
    radius: randomBetween(1.8, 4.8),
    hue: randomBetween(180, 320),
    alpha: randomBetween(0.55, 1),
    drift: randomBetween(0.25, 1.7),
  }))
}

function resizeCanvas() {
  const canvas = canvasRef.value
  if (!canvas) return

  const dpr = window.devicePixelRatio || 1
  const width = window.innerWidth
  const height = window.innerHeight

  canvas.width = Math.floor(width * dpr)
  canvas.height = Math.floor(height * dpr)
  canvas.style.width = `${width}px`
  canvas.style.height = `${height}px`

  const ctx = canvas.getContext('2d')
  if (!ctx) return

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'

  createParticles()
}

function handlePointerMove(event: PointerEvent) {
  pointer.x = event.clientX
  pointer.y = event.clientY
  pointer.active = true
}

function handlePointerLeave() {
  pointer.active = false
}

function handleVisibilityChange() {
  if (document.hidden) {
    window.cancelAnimationFrame(animationFrameId)
  } else {
    animationFrameId = window.requestAnimationFrame(drawParticles)
  }
}

function drawParticles(timestamp = 0) {
  const canvas = canvasRef.value
  if (!canvas) return

  const ctx = canvas.getContext('2d')
  if (!ctx) return

  if (lastFrameTime && timestamp - lastFrameTime < 16) {
    animationFrameId = window.requestAnimationFrame(drawParticles)
    return
  }
  lastFrameTime = timestamp

  const width = window.innerWidth
  const height = window.innerHeight

  ctx.clearRect(0, 0, width, height)

  const backgroundGlow = ctx.createRadialGradient(
    width * 0.5,
    height * 0.22,
    20,
    width * 0.5,
    height * 0.22,
    width * 0.95
  )
  backgroundGlow.addColorStop(0, 'rgba(168,85,247,0.22)')
  backgroundGlow.addColorStop(0.3, 'rgba(34,211,238,0.13)')
  backgroundGlow.addColorStop(0.7, 'rgba(58,92,255,0.07)')
  backgroundGlow.addColorStop(1, 'rgba(4,9,21,0)')
  ctx.fillStyle = backgroundGlow
  ctx.fillRect(0, 0, width, height)

  for (let i = 0; i < particles.length; i += 1) {
    const particle = particles[i]

    particle.x += particle.vx + Math.sin((particle.y + i) * 0.02) * 0.15 * particle.drift
    particle.y += particle.vy + Math.cos((particle.x + i) * 0.02) * 0.15 * particle.drift

    if (particle.x <= 0 || particle.x >= width) particle.vx *= -1
    if (particle.y <= 0 || particle.y >= height) particle.vy *= -1

    particle.x = Math.min(Math.max(particle.x, 0), width)
    particle.y = Math.min(Math.max(particle.y, 0), height)

    if (pointer.active) {
      const dx = particle.x - pointer.x
      const dy = particle.y - pointer.y
      const distance = Math.hypot(dx, dy)

      if (distance < 180) {
        const force = (180 - distance) / 180
        particle.x += (dx / (distance || 1)) * force * 3.2
        particle.y += (dy / (distance || 1)) * force * 3.2
      }
    }

    const glow = ctx.createRadialGradient(
      particle.x,
      particle.y,
      0,
      particle.x,
      particle.y,
      particle.radius * 7
    )
    glow.addColorStop(0, `hsla(${particle.hue}, 100%, 72%, ${particle.alpha})`)
    glow.addColorStop(0.35, `hsla(${particle.hue}, 100%, 65%, ${Math.min(particle.alpha, 0.7)})`)
    glow.addColorStop(1, `hsla(${particle.hue}, 100%, 50%, 0)`)

    ctx.beginPath()
    ctx.fillStyle = glow
    ctx.arc(particle.x, particle.y, particle.radius * 7, 0, Math.PI * 2)
    ctx.fill()

    ctx.beginPath()
    ctx.fillStyle = `hsla(${particle.hue}, 100%, 75%, ${particle.alpha})`
    ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2)
    ctx.fill()
  }

  for (let i = 0; i < particles.length; i += 1) {
    for (let j = i + 1; j < particles.length; j += 1) {
      const a = particles[i]
      const b = particles[j]
      const dx = a.x - b.x
      const dy = a.y - b.y
      const distance = Math.hypot(dx, dy)

      if (distance > 130) continue

      const alpha = (1 - distance / 130) * 0.7
      ctx.beginPath()
      ctx.strokeStyle = `hsla(${(a.hue + b.hue) / 2}, 100%, 70%, ${alpha})`
      ctx.lineWidth = 1.1
      ctx.moveTo(a.x, a.y)
      ctx.lineTo(b.x, b.y)
      ctx.stroke()
    }
  }

  animationFrameId = window.requestAnimationFrame(drawParticles)
}

onMounted(() => {
  resizeCanvas()
  animationFrameId = window.requestAnimationFrame(drawParticles)

  window.addEventListener('resize', resizeCanvas)
  window.addEventListener('pointermove', handlePointerMove, { passive: true })
  window.addEventListener('pointerleave', handlePointerLeave)
  document.addEventListener('visibilitychange', handleVisibilityChange)
})

onUnmounted(() => {
  window.cancelAnimationFrame(animationFrameId)
  window.removeEventListener('resize', resizeCanvas)
  window.removeEventListener('pointermove', handlePointerMove)
  window.removeEventListener('pointerleave', handlePointerLeave)
  document.removeEventListener('visibilitychange', handleVisibilityChange)
})
</script>

<template>
  <canvas ref="canvasRef" class="particle-canvas" aria-hidden="true" />
</template>
