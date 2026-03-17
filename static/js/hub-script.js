const recordDateLabels = {
    workday1: '第一個工作日',
    workday2: '第二個工作日',
    restday: '第一個休息日'
};

function selectMode(mode) {
    document.getElementById('addFlow').style.display = mode === 'add' ? 'block' : 'none';
    document.getElementById('viewFlow').style.display = mode === 'view' ? 'block' : 'none';
}

function isoDateToDDMMYYYY(isoDate) {
    if (!isoDate || !/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) {
        return '';
    }
    const parts = isoDate.split('-');
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

function setTodayDate() {
    const input = document.getElementById('recordRealDate');
    if (!input) return;
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    input.value = `${year}-${month}-${day}`;
}

function goToAdd(type) {
    const key = document.getElementById('recordDateKey').value;
    const realDateRaw = document.getElementById('recordRealDate').value;
    const realDate = isoDateToDDMMYYYY(realDateRaw);

    if (!key) {
        alert('請先選擇第x個xx日');
        return;
    }
    if (!realDate) {
        alert('請選擇實際日期');
        return;
    }

    const realDateMap = JSON.parse(localStorage.getItem('recordRealDates') || '{}');
    realDateMap[key] = realDate;
    localStorage.setItem('recordRealDates', JSON.stringify(realDateMap));

    const label = recordDateLabels[key] || key;
    const params = new URLSearchParams({ mode: 'add', record_date: key, record_date_label: label, real_date: realDate });

    if (type === 'food') {
        window.location.href = `/form?${params.toString()}`;
    } else {
        window.location.href = `/exercise?${params.toString()}`;
    }
}

function goToView(type) {
    const key = document.getElementById('viewDateKey').value;
    if (!key) {
        alert('請先選擇第x個xx日');
        return;
    }

    const label = recordDateLabels[key] || key;
    const realDateMap = JSON.parse(localStorage.getItem('recordRealDates') || '{}');
    const realDate = realDateMap[key] || '';
    const params = new URLSearchParams({ mode: 'view', record_date: key, record_date_label: label, real_date: realDate });

    if (type === 'food') {
        window.location.href = `/form?${params.toString()}`;
    } else {
        window.location.href = `/exercise?${params.toString()}`;
    }
}

async function logout() {
    if (!confirm('確定要登出嗎？')) return;
    try {
        const response = await fetch('/api/logout', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });
        const result = await response.json();
        if (result.success) {
            window.location.href = result.redirect || '/login';
        }
    } catch (e) {
        console.error('Logout error:', e);
        window.location.href = '/login';
    }
}

window.selectMode = selectMode;
window.goToAdd = goToAdd;
window.goToView = goToView;
window.setTodayDate = setTodayDate;
window.logout = logout;
