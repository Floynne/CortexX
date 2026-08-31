// === НАСТРОЙКА ДОСТУПА ===
const ACCESS_PASSWORD = 'YOUR_SECRET_PASSWORD'; // <-- Твой пароль для входа
const COOKIE_NAME = 'floynne_session_token';
const COOKIE_VALUE = 'floynne_auth_verified_ok';

export default async function middleware(request) {
  const url = new URL(request.url);

  // Ограничиваем доступ ТОЛЬКО к корню (/) и index.html
  if (url.pathname !== '/' && url.pathname !== '/index.html') {
    return; // Пропускаем любые другие страницы (blog.html, hello.html, стили и т.д.)
  }

  // 1. Проверяем, есть ли уже авторизационная cookie
  const cookieHeader = request.headers.get('cookie') || '';
  if (cookieHeader.includes(`${COOKIE_NAME}=${COOKIE_VALUE}`)) {
    return; // Успешно авторизован — отдаем настоящий index.html
  }

  // 2. Обработка запроса авторизации (POST запрос с формы)
  if (request.method === 'POST') {
    try {
      const body = await request.json();
      if (body.password === ACCESS_PASSWORD) {
        return new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Set-Cookie': `${COOKIE_NAME}=${COOKIE_VALUE}; Path=/; Max-Age=2592000; HttpOnly; SameSite=Strict; Secure`,
          },
        });
      } else {
        return new Response(JSON.stringify({ success: false, error: 'ОШИБКА: КЛЮЧ ДОСТУПА НЕВЕРЕН' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    } catch {
      return new Response(JSON.stringify({ error: 'Bad Request' }), { status: 400 });
    }
  }

  // 3. Если не авторизован — отдаем красивый экран блокировки
  return new Response(getLockscreenHTML(), {
    status: 401,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
    },
  });
}

// === HTML-ШАБЛОН СТРАНИЦЫ БЛОКИРОВКИ ===
function getLockscreenHTML() {
  return `<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Floynne | Restricted Area</title>
    <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;500;700&family=Inter:wght@300;400;600&display=swap" rel="stylesheet">
    <style>
        :root {
            --bg-color: #030303;
            --surface-color: #0c0c0c;
            --text-primary: #ffffff;
            --text-secondary: #888888;
            --accent: #00f0ff;
            --accent-glow: rgba(0, 240, 255, 0.4);
            --error: #ff3366;
            --transition: 0.3s cubic-bezier(0.25, 1, 0.5, 1);
        }

        * { margin: 0; padding: 0; box-sizing: border-box; }

        body {
            background-color: var(--bg-color);
            color: var(--text-primary);
            font-family: 'Inter', sans-serif;
            min-height: 100vh;
            display: flex;
            justify-content: center;
            align-items: center;
            overflow: hidden;
            position: relative;
            padding: 20px;
        }

        .bg-glow {
            position: absolute;
            width: 45vw;
            height: 45vw;
            background: radial-gradient(circle, var(--accent-glow) 0%, transparent 65%);
            filter: blur(120px);
            opacity: 0.35;
            z-index: 1;
            animation: float 8s infinite alternate ease-in-out;
        }

        @keyframes float {
            0% { transform: translate(-30px, -30px); }
            100% { transform: translate(30px, 30px); }
        }

        .lock-container {
            background: var(--surface-color);
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-radius: 20px;
            padding: 45px 35px;
            width: 100%;
            max-width: 440px;
            text-align: center;
            position: relative;
            z-index: 10;
            box-shadow: 0 20px 50px rgba(0, 0, 0, 0.8);
            backdrop-filter: blur(15px);
            animation: popIn 0.6s cubic-bezier(0.16, 1, 0.3, 1);
        }

        @keyframes popIn {
            0% { opacity: 0; transform: translateY(20px) scale(0.96); }
            100% { opacity: 1; transform: translateY(0) scale(1); }
        }

        .logo {
            font-family: 'Space Grotesk', sans-serif;
            font-size: 1.8rem;
            font-weight: 700;
            letter-spacing: 2px;
            margin-bottom: 20px;
        }

        .accent { color: var(--accent); }

        .status-badge {
            display: inline-block;
            font-size: 0.75rem;
            text-transform: uppercase;
            letter-spacing: 1.5px;
            color: var(--accent);
            border: 1px solid var(--accent);
            padding: 5px 14px;
            border-radius: 20px;
            margin-bottom: 20px;
            background: rgba(0, 240, 255, 0.05);
        }

        p.desc {
            color: var(--text-secondary);
            font-size: 0.9rem;
            line-height: 1.5;
            margin-bottom: 30px;
        }

        .cyber-input {
            width: 100%;
            background: #050505;
            border: 1px solid #222;
            color: #fff;
            padding: 16px 20px;
            margin-bottom: 15px;
            border-radius: 12px;
            font-family: 'Space Grotesk', sans-serif;
            font-size: 1.1rem;
            text-align: center;
            letter-spacing: 3px;
            outline: none;
            transition: var(--transition);
        }

        .cyber-input:focus {
            border-color: var(--accent);
            box-shadow: 0 0 20px rgba(0, 240, 255, 0.2);
        }

        .btn-enter {
            width: 100%;
            background: var(--text-primary);
            color: var(--bg-color);
            border: none;
            padding: 16px;
            border-radius: 30px;
            font-family: 'Space Grotesk', sans-serif;
            font-weight: 700;
            font-size: 0.95rem;
            text-transform: uppercase;
            letter-spacing: 1px;
            cursor: pointer;
            transition: var(--transition);
            box-shadow: 0 0 20px rgba(255, 255, 255, 0.1);
        }

        .btn-enter:hover {
            background: var(--accent);
            box-shadow: 0 0 30px var(--accent-glow);
            transform: translateY(-2px);
        }

        .btn-enter:active {
            transform: translateY(0);
        }

        .error-msg {
            color: var(--error);
            font-size: 0.85rem;
            font-family: 'Space Grotesk', sans-serif;
            margin-top: 15px;
            display: none;
            letter-spacing: 0.5px;
        }

        .public-link {
            display: inline-block;
            margin-top: 25px;
            color: var(--text-secondary);
            font-size: 0.8rem;
            text-decoration: none;
            text-transform: uppercase;
            letter-spacing: 1px;
            transition: var(--transition);
        }

        .public-link:hover {
            color: var(--accent);
        }

        .shake {
            animation: shake 0.4s ease;
        }

        @keyframes shake {
            0%, 100% { transform: translateX(0); }
            20%, 60% { transform: translateX(-8px); }
            40%, 80% { transform: translateX(8px); }
        }
    </style>
</head>
<body>
    <div class="bg-glow"></div>

    <div class="lock-container" id="card">
        <div class="logo">FLOYNNE<span class="accent">.</span></div>
        <div class="status-badge">Private Access Only</div>
        
        <p class="desc">Главная страница защищена. Введите секретный ключ доступа для авторизации.</p>

        <form id="authForm" onsubmit="handleLogin(event)">
            <input type="password" id="password" class="cyber-input" placeholder="••••••••" autofocus required>
            <button type="submit" class="btn-enter" id="submitBtn">Войти</button>
            <div id="error" class="error-msg"></div>
        </form>

        <a href="/blog.html" class="public-link">Перейти в блог / статьи ↗</a>
    </div>

    <script>
        async function handleLogin(e) {
            e.preventDefault();
            const passwordInput = document.getElementById('password');
            const errorEl = document.getElementById('error');
            const cardEl = document.getElementById('card');
            const submitBtn = document.getElementById('submitBtn');

            errorEl.style.display = 'none';
            submitBtn.innerText = 'ПРОВЕРКА...';
            submitBtn.style.opacity = '0.7';

            try {
                const res = await fetch('/', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ password: passwordInput.value })
                });

                const data = await res.json();

                if (res.ok && data.success) {
                    submitBtn.innerText = 'ДОСТУП РАЗРЕШЕН';
                    submitBtn.style.background = '#00ff66';
                    submitBtn.style.boxShadow = '0 0 30px rgba(0, 255, 102, 0.4)';
                    setTimeout(() => {
                        window.location.reload();
                    }, 400);
                } else {
                    errorEl.innerText = data.error || 'Ошибка доступа';
                    errorEl.style.display = 'block';
                    cardEl.classList.add('shake');
                    passwordInput.value = '';
                    passwordInput.focus();
                    setTimeout(() => cardEl.classList.remove('shake'), 400);
                    submitBtn.innerText = 'Войти';
                    submitBtn.style.opacity = '1';
                }
            } catch (err) {
                errorEl.innerText = 'Ошибка соединения с сервером';
                errorEl.style.display = 'block';
                submitBtn.innerText = 'Войти';
                submitBtn.style.opacity = '1';
            }
        }
    </script>
</body>
</html>`;
}
