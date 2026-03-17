// --- 2. VIEW TOGGLING ---
function toggleView(view) {
    document.getElementById('loginSection').classList.toggle('hidden', view === 'register');
    document.getElementById('registerSection').classList.toggle('hidden', view !== 'register');
    document.querySelectorAll('.error-msg').forEach(el => el.style.display = 'none');
}

// --- 3. LOGIN LOGIC ---
const loginForm = document.getElementById('loginForm');
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = document.getElementById('loginBtn');
        const errorMsg = document.getElementById('loginError');
        const inputId = document.getElementById('loginId').value.trim();

        btn.disabled = true;
        btn.textContent = '檢查中...';
        errorMsg.style.display = 'none';

        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ participant_id: inputId })
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || '登入失敗');
            }

            // Success - redirect
            window.location.href = result.redirect || '/hub';

        } catch (err) {
            console.error("Login Error:", err);
            errorMsg.textContent = err.message || "登入發生錯誤";
            errorMsg.style.display = 'block';
            btn.disabled = false;
            btn.textContent = '登入';
        }
    });
}

// --- 4. REGISTER LOGIC ---
const registerForm = document.getElementById('registerForm');
if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = document.getElementById('regBtn');
        const errorMsg = document.getElementById('registerError');

        const formData = new FormData(e.target);
        const newUser = {
            name: formData.get('name'),
            participant_id: formData.get('participant_id').trim(),
            gender: formData.get('gender'),
            age: parseInt(formData.get('age'))
        };

        btn.disabled = true;
        btn.textContent = '註冊中...';
        errorMsg.style.display = 'none';

        try {
            const response = await fetch('/api/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(newUser)
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || '註冊失敗');
            }

            // Success
            alert('註冊成功！');
            window.location.href = result.redirect || '/hub';

        } catch (err) {
            console.error("Register Error:", err);
            errorMsg.textContent = err.message || '註冊失敗，請稍後再試';
            errorMsg.style.display = 'block';
            btn.disabled = false;
            btn.textContent = '註冊並登入';
        }
    });
}