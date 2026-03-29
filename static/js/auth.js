/* auth.js — DjangoPilot auth pages */

// ── Particle canvas (matches landing page) ──────────────────────
(function initParticles() {
    const canvas = document.getElementById('particles-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let W, H, particles = [];

    function resize() {
        W = canvas.width = window.innerWidth;
        H = canvas.height = window.innerHeight;
    }

    function randRange(a, b) { return a + Math.random() * (b - a); }

    function createParticles(n) {
        particles = [];
        for (let i = 0; i < n; i++) {
            particles.push({
                x: randRange(0, W),
                y: randRange(0, H),
                r: randRange(0.5, 1.8),
                dx: randRange(-0.2, 0.2),
                dy: randRange(-0.25, -0.05),
                alpha: randRange(0.2, 0.7),
            });
        }
    }

    function draw() {
        ctx.clearRect(0, 0, W, H);
        particles.forEach(p => {
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(79, 142, 255, ${p.alpha})`;
            ctx.fill();

            p.x += p.dx;
            p.y += p.dy;

            if (p.y < -5) { p.y = H + 5; p.x = randRange(0, W); }
            if (p.x < 0) p.x = W;
            if (p.x > W) p.x = 0;
        });
        requestAnimationFrame(draw);
    }

    window.addEventListener('resize', () => { resize(); createParticles(80); });
    resize();
    createParticles(80);
    draw();
})();

// ── Password visibility toggle ──────────────────────────────────
document.querySelectorAll('.input-toggle').forEach(btn => {
    btn.addEventListener('click', () => {
        const wrapper = btn.closest('.input-wrapper');
        const input = wrapper.querySelector('input');
        if (!input) return;
        const isPassword = input.type === 'password';
        input.type = isPassword ? 'text' : 'password';
        btn.innerHTML = isPassword
            ? `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>`
            : `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>`;
    });
});

// ── Password strength meter ─────────────────────────────────────
const pwField = document.getElementById('password');
const pwFill  = document.getElementById('pw-fill');
const pwLabel = document.getElementById('pw-label');

if (pwField && pwFill && pwLabel) {
    const labels = ['Too short', 'Weak', 'Fair', 'Strong', 'Very strong'];

    pwField.addEventListener('input', () => {
        const val = pwField.value;
        let score = 0;
        if (val.length >= 8)  score++;
        if (/[A-Z]/.test(val)) score++;
        if (/[0-9]/.test(val)) score++;
        if (/[^A-Za-z0-9]/.test(val)) score++;

        pwFill.setAttribute('data-strength', val.length === 0 ? '0' : score);
        pwFill.style.width = val.length === 0 ? '0%' : `${score * 25}%`;
        pwLabel.textContent = val.length === 0 ? 'Enter a password' : labels[score] || 'Very strong';
    });
}

// ── Confirm password match highlight ───────────────────────────
const confirmField = document.getElementById('confirm-password');

if (pwField && confirmField) {
    function checkMatch() {
        if (!confirmField.value) {
            confirmField.classList.remove('error', 'success');
            return;
        }
        const match = confirmField.value === pwField.value;
        confirmField.classList.toggle('error', !match);
        confirmField.classList.toggle('success', match);
    }
    confirmField.addEventListener('input', checkMatch);
    pwField.addEventListener('input', checkMatch);
}

// ── Nav scroll effect (reuse landing style) ─────────────────────
window.addEventListener('scroll', () => {
    const nav = document.querySelector('.auth-nav');
    if (nav) {
        nav.style.background = window.scrollY > 10
            ? 'rgba(8, 12, 20, 0.95)'
            : 'rgba(8, 12, 20, 0.7)';
    }
});