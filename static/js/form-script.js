let selectedDate = '';
let selectedDateLabel = '';
let selectedRealDate = '';
let pageMode = 'add';

let imageRows = [];
let imageRowIdSeed = 1;
let foodRowIdSeed = 1;
let pendingImageProcesses = 0;
let currentMealBundles = [];
let editingMealRecordId = null;
let editingMealDraft = null;
let editPhotoRowIdSeed = 1;
let editFoodRowIdSeed = 1;

const recordDateLabels = {
    workday1: '第一個工作日',
    workday2: '第二個工作日',
    restday: '第一個休息日'
};

function getQueryParams() {
    return new URLSearchParams(window.location.search);
}

function createFoodRow() {
    return { id: foodRowIdSeed++, food: '', amount: '' };
}

function addImageRow() {
    imageRows.push({ id: imageRowIdSeed++, imageData: '', foodRows: [createFoodRow()] });
    renderMealRows();
}

function removeImageRow(imageRowId) {
    imageRows = imageRows.filter(r => r.id !== imageRowId);
    renderMealRows();
}

function addFoodDetailRow(imageRowId) {
    const row = imageRows.find(r => r.id === imageRowId);
    if (!row) return;
    row.foodRows.push(createFoodRow());
    renderMealRows();
}

function removeFoodDetailRow(imageRowId, foodRowId) {
    const row = imageRows.find(r => r.id === imageRowId);
    if (!row) return;
    row.foodRows = row.foodRows.filter(fr => fr.id !== foodRowId);
    if (row.foodRows.length === 0) row.foodRows.push(createFoodRow());
    renderMealRows();
}

function updateFoodField(imageRowId, foodRowId, field, value) {
    const row = imageRows.find(r => r.id === imageRowId);
    if (!row) return;
    const foodRow = row.foodRows.find(fr => fr.id === foodRowId);
    if (!foodRow) return;
    foodRow[field] = value;
}

function handleImageInputChange(input, imageRowId) {
    const row = imageRows.find(r => r.id === imageRowId);
    if (!row) return;

    const file = input.files && input.files[0];
    if (!file) return;

    pendingImageProcesses += 1;

    compressImageFile(file, 960, 960, 0.68, 380000)
        .then(function(dataUrl) {
            row.imageData = dataUrl;
            renderMealRows();
        })
        .catch(function(err) {
            console.error('Image compression failed, fallback to original file:', err);
            const reader = new FileReader();
            reader.onload = function(e) {
                row.imageData = e.target.result;
                renderMealRows();
            };
            reader.readAsDataURL(file);
        })
        .finally(function() {
            pendingImageProcesses = Math.max(0, pendingImageProcesses - 1);
        });
}

function compressImageFile(file, maxWidth, maxHeight, quality, targetMaxLength) {
    return new Promise(function(resolve, reject) {
        const reader = new FileReader();
        reader.onerror = reject;
        reader.onload = function(e) {
            const img = new Image();
            img.onerror = reject;
            img.onload = function() {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                if (!ctx) return reject(new Error('Canvas context unavailable'));

                let targetW = img.width;
                let targetH = img.height;
                let scale = Math.min(maxWidth / targetW, maxHeight / targetH, 1);
                targetW = Math.max(1, Math.round(targetW * scale));
                targetH = Math.max(1, Math.round(targetH * scale));

                const renderAtSize = function(w, h) {
                    canvas.width = w;
                    canvas.height = h;
                    ctx.clearRect(0, 0, w, h);
                    ctx.drawImage(img, 0, 0, w, h);
                };

                renderAtSize(targetW, targetH);

                // Prefer WebP for much smaller payloads; fallback to JPEG if needed.
                let out = canvas.toDataURL('image/webp', quality);
                let q = quality;
                while (out.length > targetMaxLength && q > 0.4) {
                    q -= 0.08;
                    out = canvas.toDataURL('image/webp', q);
                }

                while (out.length > targetMaxLength && targetW > 480 && targetH > 480) {
                    targetW = Math.round(targetW * 0.86);
                    targetH = Math.round(targetH * 0.86);
                    renderAtSize(targetW, targetH);
                    q = Math.min(q, 0.58);
                    out = canvas.toDataURL('image/webp', q);
                }

                if (out.length > targetMaxLength) {
                    // Final fallback for compatibility/size balance.
                    out = canvas.toDataURL('image/jpeg', 0.55);
                }

                resolve(out);
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    });
}

function renderMealRows() {
    const tbody = document.getElementById('mealRowsBody');
    if (!tbody) return;

    if (imageRows.length === 0) {
        tbody.innerHTML = '<tr><td colspan="3" style="text-align:center; color:#666; padding:16px;">尚未添加圖片列</td></tr>';
        return;
    }

    tbody.innerHTML = imageRows.map(function(row) {
        const previewHtml = row.imageData
            ? `<img src="${row.imageData}" alt="食物圖片" class="meal-image-preview">`
            : '<div class="meal-image-placeholder">未上傳</div>';

        const foodRowsHtml = row.foodRows.map(function(fr) {
            return `
                <tr>
                    <td>
                        <input type="text" value="${escapeHtml(fr.food)}" oninput="updateFoodField(${row.id}, ${fr.id}, 'food', this.value)" placeholder="例如：白飯、煎蛋、奶茶" class="food-cell-input">
                    </td>
                    <td>
                        <input type="text" value="${escapeHtml(fr.amount)}" oninput="updateFoodField(${row.id}, ${fr.id}, 'amount', this.value)" placeholder="例如：半碗、1份、300ml" class="food-cell-input">
                    </td>
                    <td style="width: 74px; text-align:center;">
                        <button type="button" class="mini-btn mini-btn-danger" onclick="removeFoodDetailRow(${row.id}, ${fr.id})">刪除</button>
                    </td>
                </tr>
            `;
        }).join('');

        return `
            <tr>
                <td>
                    <div class="meal-image-cell">
                        ${previewHtml}
                        <input type="file" class="meal-file-input" accept="image/*" onchange="handleImageInputChange(this, ${row.id})">
                    </div>
                </td>
                <td>
                    <table class="inner-food-table">
                        <thead>
                            <tr><th>食物</th><th>份量</th><th>操作</th></tr>
                        </thead>
                        <tbody>${foodRowsHtml}</tbody>
                    </table>
                    <button type="button" class="mini-btn mini-btn-primary" onclick="addFoodDetailRow(${row.id})">+ 新增食物列</button>
                </td>
                <td style="vertical-align: top;">
                    <button type="button" class="mini-btn mini-btn-danger" onclick="removeImageRow(${row.id})">刪除此列</button>
                </td>
            </tr>
        `;
    }).join('');
}

function buildPhotoDescription(row) {
    return row.foodRows
        .filter(fr => fr.food.trim() || fr.amount.trim())
        .map(fr => `食物：${fr.food.trim() || '(未填)'}；份量：${fr.amount.trim() || '(未填)'}`)
        .join('\n');
}

function parsePhotoDescriptionToFoodRows(description) {
    const lines = String(description || '').split('\n').map(s => s.trim()).filter(Boolean);
    const rows = [];

    lines.forEach(function(line) {
        const match = line.match(/^食物：(.*?)[；;]份量：(.*)$/);
        if (match) {
            rows.push({ id: editFoodRowIdSeed++, food: (match[1] || '').trim(), amount: (match[2] || '').trim() });
        } else {
            rows.push({ id: editFoodRowIdSeed++, food: line, amount: '' });
        }
    });

    if (!rows.length) rows.push({ id: editFoodRowIdSeed++, food: '', amount: '' });
    return rows;
}

function ensureEditingDraftPhotos() {
    if (!editingMealDraft) return;
    if (!Array.isArray(editingMealDraft.photos)) editingMealDraft.photos = [];
    if (!editingMealDraft.photos.length) {
        editingMealDraft.photos.push({
            id: editPhotoRowIdSeed++,
            photo_data: '',
            foodRows: [{ id: editFoodRowIdSeed++, food: '', amount: '' }]
        });
    }
}

function buildInlineMealPhotoEditorHtml() {
    ensureEditingDraftPhotos();
    if (!editingMealDraft || !editingMealDraft.photos) return '';

    const rowsHtml = editingMealDraft.photos.map(function(photo) {
        const foodRowsHtml = (photo.foodRows || []).map(function(fr) {
            return `
                <tr>
                    <td><input type="text" value="${escapeHtml(fr.food || '')}" oninput="updateMealEditFoodField(${photo.id}, ${fr.id}, 'food', this.value)" style="width:100%; padding:6px; border:1px solid #d1d5db; border-radius:6px;"></td>
                    <td><input type="text" value="${escapeHtml(fr.amount || '')}" oninput="updateMealEditFoodField(${photo.id}, ${fr.id}, 'amount', this.value)" style="width:100%; padding:6px; border:1px solid #d1d5db; border-radius:6px;"></td>
                    <td style="width:64px;"><button type="button" class="mini-btn mini-btn-danger" onclick="removeMealEditFoodRow(${photo.id}, ${fr.id})">刪除</button></td>
                </tr>
            `;
        }).join('');

        return `
            <div style="border:1px solid #e2e8f0; border-radius:8px; padding:8px; margin-bottom:8px;">
                <div style="display:flex; gap:8px; align-items:flex-start; flex-wrap:wrap;">
                    <div style="width:140px; min-width:140px;">
                        ${photo.photo_data ? `<img src="${photo.photo_data}" alt="食物照片" style="width:140px; border-radius:8px; border:1px solid #ddd;">` : '<div style="width:140px; height:105px; border:1px dashed #cbd5e1; border-radius:8px; display:flex; align-items:center; justify-content:center; color:#64748b; font-size:12px;">未上傳</div>'}
                        <input type="file" class="meal-file-input" accept="image/*" onchange="handleMealEditImageInputChange(this, ${photo.id})" style="margin-top:6px; width:140px;">
                    </div>
                    <div style="flex:1; min-width:260px;">
                        <table style="width:100%; border-collapse:collapse;">
                            <thead>
                                <tr>
                                    <th style="text-align:left; font-size:12px; color:#475569;">食物</th>
                                    <th style="text-align:left; font-size:12px; color:#475569;">份量</th>
                                    <th style="text-align:left; font-size:12px; color:#475569;">操作</th>
                                </tr>
                            </thead>
                            <tbody>${foodRowsHtml}</tbody>
                        </table>
                        <div style="display:flex; gap:8px; margin-top:6px;">
                            <button type="button" class="mini-btn mini-btn-primary" onclick="addMealEditFoodRow(${photo.id})">+ 新增食物列</button>
                            <button type="button" class="mini-btn mini-btn-danger" onclick="removeMealEditPhotoRow(${photo.id})">刪除此照片列</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    return `
        <div>
            <label style="font-size:12px; color:#475569;">圖片與食物描述</label>
            <div style="font-size:12px; color:#92400e; margin:2px 0 4px 0; padding:5px 8px; border-left:3px solid #f59e0b; background:#fffbeb; border-radius:6px; line-height:1.35;">
                <strong>提示：</strong>若為<strong>包裝食品</strong>，請拍照上傳<strong>食物包裝</strong>及<strong>營養成分表</strong>
            </div>
            <div style="margin-top:2px;">${rowsHtml}</div>
            <button type="button" class="mini-btn mini-btn-primary" onclick="addMealEditPhotoRow()">+ 新增圖片列</button>
        </div>
    `;
}

function confirmMealDate() {
    const selectedRadio = document.querySelector('input[name="recordDate"]:checked');
    if (!selectedRadio) {
        alert('請選擇記錄日期');
        return;
    }

    selectedDate = selectedRadio.value;
    selectedDateLabel = recordDateLabels[selectedDate] || selectedDate;

    document.getElementById('dateSection').style.display = 'none';
    document.getElementById('mealEntrySection').style.display = 'block';
    document.getElementById('mealListSection').style.display = 'block';
    document.getElementById('mealEntryTitle').textContent = `添加${selectedDateLabel}的飲食記錄`;
    updateMealTypeAvailability([]);

    if (imageRows.length === 0) addImageRow();
    loadMealRecords();
}

function normalizeMealTime(rawValue) {
    const v = (rawValue || '').trim();
    if (!v) return '';
    const match = v.match(/^(\d{1,2}):(\d{2})$/);
    if (!match) return null;
    const hh = Number(match[1]);
    const mm = Number(match[2]);
    if (hh < 0 || hh > 23 || mm < 0 || mm > 59) return null;
    return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
}

function getMealTimeValue() {
    const picker = document.getElementById('mealTimePicker');
    const text = document.getElementById('mealTimeText');
    const pickerValue = picker ? picker.value : '';
    const textValue = text ? text.value : '';
    return normalizeMealTime((textValue || pickerValue || '').trim());
}

function setCurrentMealTime() {
    const picker = document.getElementById('mealTimePicker');
    if (!picker) return;
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    picker.value = `${hh}:${mm}`;
}

function saveMealRecord() {
    const saveBtn = document.getElementById('saveMealBtn');
    const originalBtnText = saveBtn ? saveBtn.textContent : '';

    function setSavingState(saving) {
        if (!saveBtn) return;
        saveBtn.disabled = saving;
        saveBtn.style.opacity = saving ? '0.7' : '1';
        saveBtn.style.cursor = saving ? 'wait' : 'pointer';
        saveBtn.textContent = saving ? '保存中...' : originalBtnText;
    }

    try {
        if (!selectedDate) {
            alert('請先選擇記錄日期');
            return;
        }

        if (pendingImageProcesses > 0) {
            alert('圖片仍在處理中，請稍候再保存');
            return;
        }

        const mealType = document.getElementById('mealType').value;
        const mealTime = getMealTimeValue();
        const mealLocation = document.getElementById('mealLocation').value;
        const mealAmount = document.getElementById('mealAmount').value;
        const additionalDescription = document.getElementById('additionalDescription').value.trim();

        if (!mealType) {
            alert('請選擇餐次');
            return;
        }
        if (mealTime === null) {
            alert('用餐時間請使用 HH:MM（例如 08:30）');
            return;
        }
        if (imageRows.length === 0) {
            alert('請至少添加一列圖片與描述');
            return;
        }

        const photos = [];
        for (const row of imageRows) {
            if (!row.imageData) {
                alert('每一列都需要上傳圖片');
                return;
            }
            const description = buildPhotoDescription(row);
            if (!description) {
                alert('每張圖片請至少填寫一項食物或份量');
                return;
            }
            photos.push({ photo_data: row.imageData, description: description });
        }

        const payload = {
            record_date: selectedDate,
            record_date_label: selectedDateLabel,
            meal_type: mealType,
            meal_time: mealTime,
            location: mealLocation,
            eating_amount: mealAmount,
            additional_description: additionalDescription,
            is_snack: false,
            snack_type: '',
            snack_name: '',
            snack_amount: '',
            photos: photos
        };

        const payloadLength = JSON.stringify(payload).length;
        if (payloadLength > 2_200_000) {
            alert('本次上傳資料過大，請減少圖片數量或重新上傳圖片後再試');
            return;
        }

        setSavingState(true);

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 60000);

        fetch('/api/save-meal-record', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
            signal: controller.signal
        })
            .then(r => r.json())
            .then(result => {
                clearTimeout(timeoutId);
                if (!result.success) {
                    alert('保存失敗：' + (result.message || '未知錯誤'));
                    setSavingState(false);
                    return;
                }
                const viewParams = new URLSearchParams({
                    mode: 'view',
                    record_date: selectedDate || '',
                    record_date_label: selectedDateLabel || '',
                    real_date: selectedRealDate || ''
                });
                window.location.href = `/form?${viewParams.toString()}`;
            })
            .catch(err => {
                clearTimeout(timeoutId);
                console.error('Save meal record error:', err);
                if (err && err.name === 'AbortError') {
                    alert('保存超時，請減少圖片數量或重試');
                } else {
                    alert('保存失敗，請稍後重試');
                }
                setSavingState(false);
            });
    } catch (error) {
        console.error('Unexpected save meal record error:', error);
        alert('添加記錄時發生錯誤，請重新整理後再試');
        if (saveBtn) {
            saveBtn.disabled = false;
            saveBtn.style.opacity = '1';
            saveBtn.style.cursor = 'pointer';
            saveBtn.textContent = originalBtnText;
        }
    }
}

function loadMealRecords() {
    if (!selectedDate) return;
    fetch(`/api/get-meal-records?record_date=${encodeURIComponent(selectedDate)}`)
        .then(r => r.json())
        .then(result => {
            if (!result.success) {
                const msg = result.message || '讀取失敗';
                document.getElementById('mealItems').innerHTML = `<p style="color:#b91c1c; font-size:14px;">${escapeHtml(msg)}</p>`;
                updateMealTypeAvailability([]);
                return;
            }
            currentMealBundles = result.records || [];
            updateMealTypeAvailability(currentMealBundles);
            renderMealList(result.records || [], pageMode === 'view');
        })
        .catch(err => {
            console.error('Load meal records error:', err);
            document.getElementById('mealItems').innerHTML = '<p style="color:#b91c1c; font-size:14px;">讀取失敗，請稍後重試</p>';
            updateMealTypeAvailability([]);
        });
}

function updateMealTypeAvailability(records) {
    const mealTypeSelect = document.getElementById('mealType');
    if (!mealTypeSelect) return;

    const takenMealTypes = new Set((records || []).map(function(bundle) {
        return bundle && bundle.meal_record ? bundle.meal_record.meal_type : '';
    }).filter(Boolean));

    Array.from(mealTypeSelect.options).forEach(function(opt) {
        if (!opt.value) return;

        const baseLabel = opt.dataset.baseLabel || opt.textContent.replace('（已記錄）', '');
        opt.dataset.baseLabel = baseLabel;

        const isTaken = takenMealTypes.has(opt.value);
        opt.disabled = isTaken;
        opt.style.color = isTaken ? '#9ca3af' : '';
        opt.textContent = isTaken ? `${baseLabel}（已記錄）` : baseLabel;
    });

    if (mealTypeSelect.value && takenMealTypes.has(mealTypeSelect.value)) {
        mealTypeSelect.value = '';
    }
}

function getSelectedDayDateText() {
    const dateText = selectedRealDate ? `（${selectedRealDate}）` : '';
    return `${selectedDateLabel || selectedDate || ''}${dateText}`;
}

function mealTimeToMinutes(mealTime) {
    const raw = String(mealTime || '').trim();
    if (!raw) return Number.POSITIVE_INFINITY;
    const timePart = raw.slice(0, 5);
    const match = timePart.match(/^(\d{1,2}):(\d{2})$/);
    if (!match) return Number.POSITIVE_INFINITY;
    const hh = Number(match[1]);
    const mm = Number(match[2]);
    if (hh < 0 || hh > 23 || mm < 0 || mm > 59) return Number.POSITIVE_INFINITY;
    return hh * 60 + mm;
}

function renderMealList(records, showActions) {
    const container = document.getElementById('mealItems');
    const title = document.getElementById('mealListTitle');
    if (!container) return;

    const sortedRecords = [...(records || [])].sort(function(a, b) {
        const aRecord = a && a.meal_record ? a.meal_record : {};
        const bRecord = b && b.meal_record ? b.meal_record : {};
        const aMinutes = mealTimeToMinutes(aRecord.meal_time);
        const bMinutes = mealTimeToMinutes(bRecord.meal_time);
        if (aMinutes !== bMinutes) return aMinutes - bMinutes;
        return Number(aRecord.id || 0) - Number(bRecord.id || 0);
    });

    if (title) {
        const dayDateText = getSelectedDayDateText();
        title.textContent = dayDateText ? `${dayDateText}的飲食記錄` : '飲食記錄';
    }

    if (!sortedRecords.length) {
        container.innerHTML = '<p style="color:#999; font-size:14px;">暫無記錄</p>';
        return;
    }

    const dayDateText = getSelectedDayDateText();

    container.innerHTML = sortedRecords.map(function(bundle, idx) {
        const record = bundle.meal_record || {};
        const photos = bundle.photos || [];
        const isEditing = showActions && editingMealRecordId === record.id;

        const photosHtml = photos.map(function(p) {
            return `
                <div style="display:flex; gap:10px; margin-top:8px; align-items:flex-start; flex-wrap:wrap;">
                    <img src="${p.photo_data || ''}" alt="食物照片" style="width:140px; border-radius:8px; border:1px solid #ddd;">
                    <div style="flex:1; min-width:220px; white-space:pre-wrap; color:#555;">${escapeHtml(p.description || '')}</div>
                </div>
            `;
        }).join('');

        const editFormHtml = isEditing
            ? `
                <div style="margin-top:10px; padding:10px; border:1px dashed #cbd5e1; border-radius:8px; background:#fff; display:grid; gap:8px;">
                    <div>
                        <label style="font-size:12px; color:#475569;">餐次</label>
                        <select onchange="updateMealEditField('meal_type', this.value)" style="width:100%; padding:8px; border:1px solid #d1d5db; border-radius:6px;">
                            ${buildSelectOptions(['早餐','上午加餐','午餐','下午加餐','晚餐','晚上加餐'], editingMealDraft ? editingMealDraft.meal_type : record.meal_type)}
                        </select>
                    </div>
                    <div>
                        <label style="font-size:12px; color:#475569;">用餐時間</label>
                        <input type="time" value="${escapeHtml((editingMealDraft ? editingMealDraft.meal_time : (record.meal_time || '')) || '')}" onchange="updateMealEditField('meal_time', this.value)" style="width:100%; padding:8px; border:1px solid #d1d5db; border-radius:6px;">
                    </div>
                    <div>
                        <label style="font-size:12px; color:#475569;">用餐地點</label>
                        <select onchange="updateMealEditField('location', this.value)" style="width:100%; padding:8px; border:1px solid #d1d5db; border-radius:6px;">
                            ${buildSelectOptions(['家','工作單位','餐廳/外賣','其他'], editingMealDraft ? editingMealDraft.location : record.location)}
                        </select>
                    </div>
                    <div>
                        <label style="font-size:12px; color:#475569;">進食情況</label>
                        <select onchange="updateMealEditField('eating_amount', this.value)" style="width:100%; padding:8px; border:1px solid #d1d5db; border-radius:6px;">
                            ${buildSelectOptions(['全部吃完','剩餘一些','只吃少量'], editingMealDraft ? editingMealDraft.eating_amount : record.eating_amount)}
                        </select>
                    </div>
                    <div>
                        <label style="font-size:12px; color:#475569;">補充描述</label>
                        <textarea rows="2" oninput="updateMealEditField('additional_description', this.value)" style="width:100%; padding:8px; border:1px solid #d1d5db; border-radius:6px; resize:vertical;">${escapeHtml((editingMealDraft ? editingMealDraft.additional_description : (record.additional_description || '')) || '')}</textarea>
                    </div>
                    ${buildInlineMealPhotoEditorHtml()}
                    <div style="display:flex; gap:8px;">
                        <button type="button" class="mini-btn mini-btn-primary" onclick="saveInlineMealEdit(${record.id})">保存</button>
                        <button type="button" class="mini-btn" style="background:#9ca3af; color:white;" onclick="cancelInlineMealEdit()">取消</button>
                    </div>
                </div>
            `
            : '';

        const actionHtml = showActions
            ? `
                <div style="display:flex; gap:8px; margin-top:10px;">
                    <button type="button" class="mini-btn mini-btn-primary" onclick="startInlineMealEdit(${record.id})">${isEditing ? '編輯中' : '編輯'}</button>
                    <button class="mini-btn mini-btn-danger" onclick="deleteMealRecord(${record.id})">刪除</button>
                </div>
            `
            : '';

        const readOnlyCardHtml = `
            <div style="font-weight:700; color:var(--text); margin-bottom:6px;">${idx + 1}. ${record.meal_type || '(未填)'}</div>
            <div style="font-size:13px; color:#666;">記錄日期：${dayDateText || '(未填)'}</div>
            <div style="font-size:13px; color:#666;">用餐時間：${record.meal_time || '(未填)'}</div>
            <div style="font-size:13px; color:#666;">用餐地點：${record.location || '(未填)'}</div>
            <div style="font-size:13px; color:#666;">進食情況：${record.eating_amount || '(未填)'}</div>
            <div style="font-size:13px; color:#666; margin-top:6px; white-space:pre-wrap;">補充描述：${escapeHtml(record.additional_description || '(無)')}</div>
            <div style="margin-top:8px;">${photosHtml || '<span style="color:#999;">無圖片</span>'}</div>
            ${actionHtml}
        `;

        const editingCardHtml = `
            <div style="font-weight:700; color:var(--text); margin-bottom:6px;">${idx + 1}. 編輯餐次記錄</div>
            ${editFormHtml}
        `;

        return `
            <div style="border:1px solid var(--border); border-radius:8px; padding:12px; margin-bottom:12px; background:#fafafa;">
                ${isEditing ? editingCardHtml : readOnlyCardHtml}
            </div>
        `;
    }).join('');
}

function buildSelectOptions(options, selectedValue) {
    const selected = selectedValue || '';
    const optionItems = ['<option value="">請選擇</option>'];
    options.forEach(function(opt) {
        const isSelected = opt === selected ? ' selected' : '';
        optionItems.push(`<option value="${escapeHtml(opt)}"${isSelected}>${escapeHtml(opt)}</option>`);
    });
    return optionItems.join('');
}

function startInlineMealEdit(id) {
    const bundle = currentMealBundles.find(function(b) {
        return b && b.meal_record && b.meal_record.id === id;
    });
    if (!bundle || !bundle.meal_record) return;

    const r = bundle.meal_record;
    const photos = Array.isArray(bundle.photos) ? bundle.photos : [];
    editingMealRecordId = id;
    editingMealDraft = {
        meal_type: r.meal_type || '',
        meal_time: r.meal_time || '',
        location: r.location || '',
        eating_amount: r.eating_amount || '',
        additional_description: r.additional_description || '',
        photos: photos.map(function(p) {
            return {
                id: editPhotoRowIdSeed++,
                photo_data: p.photo_data || '',
                foodRows: parsePhotoDescriptionToFoodRows(p.description || '')
            };
        })
    };
    ensureEditingDraftPhotos();
    renderMealList(currentMealBundles, pageMode === 'view');
}

function cancelInlineMealEdit() {
    editingMealRecordId = null;
    editingMealDraft = null;
    renderMealList(currentMealBundles, pageMode === 'view');
}

function updateMealEditField(field, value) {
    if (!editingMealDraft) return;
    editingMealDraft[field] = value;
}

function addMealEditPhotoRow() {
    if (!editingMealDraft) return;
    ensureEditingDraftPhotos();
    editingMealDraft.photos.push({
        id: editPhotoRowIdSeed++,
        photo_data: '',
        foodRows: [{ id: editFoodRowIdSeed++, food: '', amount: '' }]
    });
    renderMealList(currentMealBundles, pageMode === 'view');
}

function removeMealEditPhotoRow(photoRowId) {
    if (!editingMealDraft || !Array.isArray(editingMealDraft.photos)) return;
    editingMealDraft.photos = editingMealDraft.photos.filter(function(p) { return p.id !== photoRowId; });
    ensureEditingDraftPhotos();
    renderMealList(currentMealBundles, pageMode === 'view');
}

function addMealEditFoodRow(photoRowId) {
    if (!editingMealDraft || !Array.isArray(editingMealDraft.photos)) return;
    const row = editingMealDraft.photos.find(function(p) { return p.id === photoRowId; });
    if (!row) return;
    if (!Array.isArray(row.foodRows)) row.foodRows = [];
    row.foodRows.push({ id: editFoodRowIdSeed++, food: '', amount: '' });
    renderMealList(currentMealBundles, pageMode === 'view');
}

function removeMealEditFoodRow(photoRowId, foodRowId) {
    if (!editingMealDraft || !Array.isArray(editingMealDraft.photos)) return;
    const row = editingMealDraft.photos.find(function(p) { return p.id === photoRowId; });
    if (!row || !Array.isArray(row.foodRows)) return;
    row.foodRows = row.foodRows.filter(function(fr) { return fr.id !== foodRowId; });
    if (!row.foodRows.length) row.foodRows.push({ id: editFoodRowIdSeed++, food: '', amount: '' });
    renderMealList(currentMealBundles, pageMode === 'view');
}

function updateMealEditFoodField(photoRowId, foodRowId, field, value) {
    if (!editingMealDraft || !Array.isArray(editingMealDraft.photos)) return;
    const row = editingMealDraft.photos.find(function(p) { return p.id === photoRowId; });
    if (!row || !Array.isArray(row.foodRows)) return;
    const fr = row.foodRows.find(function(item) { return item.id === foodRowId; });
    if (!fr) return;
    fr[field] = value;
}

function handleMealEditImageInputChange(input, photoRowId) {
    if (!editingMealDraft || !Array.isArray(editingMealDraft.photos)) return;
    const row = editingMealDraft.photos.find(function(p) { return p.id === photoRowId; });
    if (!row) return;

    const file = input.files && input.files[0];
    if (!file) return;

    pendingImageProcesses += 1;
    compressImageFile(file, 960, 960, 0.68, 380000)
        .then(function(dataUrl) {
            row.photo_data = dataUrl;
            renderMealList(currentMealBundles, pageMode === 'view');
        })
        .catch(function(err) {
            console.error('Edit image compression failed, fallback to original:', err);
            const reader = new FileReader();
            reader.onload = function(e) {
                row.photo_data = e.target.result;
                renderMealList(currentMealBundles, pageMode === 'view');
            };
            reader.readAsDataURL(file);
        })
        .finally(function() {
            pendingImageProcesses = Math.max(0, pendingImageProcesses - 1);
        });
}

function saveInlineMealEdit(id) {
    if (!editingMealDraft) return;

    if (pendingImageProcesses > 0) {
        alert('圖片仍在處理中，請稍候再保存');
        return;
    }

    const normalizedMealTime = normalizeMealTime(editingMealDraft.meal_time || '');
    if (normalizedMealTime === null) {
        alert('用餐時間請使用 HH:MM（例如 08:30）');
        return;
    }
    if (!editingMealDraft.meal_type) {
        alert('請選擇餐次');
        return;
    }

    ensureEditingDraftPhotos();
    const editPhotos = [];
    for (const p of editingMealDraft.photos) {
        if (!p.photo_data) {
            alert('每一列都需要上傳圖片');
            return;
        }
        const description = buildPhotoDescription(p);
        if (!description) {
            alert('每張圖片請至少填寫一項食物或份量');
            return;
        }
        editPhotos.push({ photo_data: p.photo_data, description: description });
    }

    fetch(`/api/update-meal-record/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            meal_type: editingMealDraft.meal_type,
            meal_time: normalizedMealTime,
            location: editingMealDraft.location,
            eating_amount: editingMealDraft.eating_amount,
            additional_description: editingMealDraft.additional_description,
            photos: editPhotos
        })
    })
        .then(r => r.json())
        .then(result => {
            if (!result.success) {
                alert('更新失敗：' + (result.message || '未知錯誤'));
                return;
            }
            editingMealRecordId = null;
            editingMealDraft = null;
            loadMealRecords();
        })
        .catch(err => {
            console.error('Update meal record error:', err);
            alert('更新失敗');
        });
}

function deleteMealRecord(id) {
    if (!confirm('確定要刪除這筆飲食記錄嗎？')) return;

    fetch(`/api/delete-meal-record/${id}`, { method: 'DELETE' })
        .then(r => r.json())
        .then(result => {
            if (!result.success) {
                alert('刪除失敗：' + (result.message || '未知錯誤'));
                return;
            }
            loadMealRecords();
        })
        .catch(err => {
            console.error('Delete meal record error:', err);
            alert('刪除失敗');
        });
}

function resetMealForm() {
    imageRows = [];
    document.getElementById('mealType').value = '';
    document.getElementById('mealTimePicker').value = '';
    const mealTimeText = document.getElementById('mealTimeText');
    if (mealTimeText) mealTimeText.value = '';
    document.getElementById('mealLocation').value = '';
    document.getElementById('mealAmount').value = '';
    document.getElementById('additionalDescription').value = '';
    addImageRow();
}

function finishMealDay() {
    if (!selectedDate) {
        alert('請先選擇記錄日期');
        return;
    }

    if (!confirm('確定完成今日飲食記錄嗎？')) return;

    fetch('/api/complete-daily-record', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ record_date: selectedDate })
    })
        .then(r => r.json())
        .then(result => {
            if (!result.success) {
                alert('完成失敗：' + (result.message || '未知錯誤'));
                return;
            }
            alert('今日飲食記錄已完成');
        })
        .catch(err => {
            console.error('Complete daily record error:', err);
            alert('操作失敗，請稍後重試');
        });
}

function initPageMode() {
    const params = getQueryParams();
    const mode = params.get('mode') || 'add';
    pageMode = mode;
    selectedDate = params.get('record_date') || '';
    selectedDateLabel = params.get('record_date_label') || (recordDateLabels[selectedDate] || '');
    selectedRealDate = params.get('real_date') || '';

    if (mode === 'view') {
        document.getElementById('dateSection').style.display = 'none';
        document.getElementById('mealEntrySection').style.display = 'none';
        document.getElementById('mealListSection').style.display = 'block';
        const title = document.getElementById('mealListTitle');
        if (title) {
            const realDateText = selectedRealDate ? `（${selectedRealDate}）` : '';
            title.textContent = `${selectedDateLabel || selectedDate}${realDateText}的飲食記錄`;
        }
        loadMealRecords();
        return;
    }

    if (selectedDate) {
        document.getElementById('dateSection').style.display = 'none';
        document.getElementById('mealEntrySection').style.display = 'block';
        document.getElementById('mealListSection').style.display = 'block';
        const realDateText = selectedRealDate ? `（${selectedRealDate}）` : '';
        document.getElementById('mealEntryTitle').textContent = `添加${selectedDateLabel}${realDateText}的飲食記錄`;
        addImageRow();
        loadMealRecords();
    }
}

function setupMealTimeInputs() {
    const picker = document.getElementById('mealTimePicker');
    const text = document.getElementById('mealTimeText');
    if (!picker) return;

    picker.addEventListener('change', function() {
        if (text && picker.value) {
            text.value = picker.value;
        }
    });

    if (text) {
        text.addEventListener('blur', function() {
            const normalized = normalizeMealTime(text.value);
            if (normalized) {
                text.value = normalized;
                picker.value = normalized;
            }
        });
    }
}

function escapeHtml(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function escapeJs(str) {
    return String(str).replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n').replace(/\r/g, '');
}

// FAQ modal
const modal = document.getElementById('faqModal');
const helpBtn = document.getElementById('helpBtn');
const closeBtn = document.querySelector('.close');

if (helpBtn) {
    helpBtn.addEventListener('click', function() {
        if (modal) modal.style.display = 'block';
    });
}

if (closeBtn) {
    closeBtn.addEventListener('click', function() {
        if (modal) modal.style.display = 'none';
    });
}

window.addEventListener('click', function(event) {
    if (event.target === modal) modal.style.display = 'none';
});

window.confirmMealDate = confirmMealDate;
window.addImageRow = addImageRow;
window.removeImageRow = removeImageRow;
window.addFoodDetailRow = addFoodDetailRow;
window.removeFoodDetailRow = removeFoodDetailRow;
window.updateFoodField = updateFoodField;
window.handleImageInputChange = handleImageInputChange;
window.saveMealRecord = saveMealRecord;
window.resetMealForm = resetMealForm;
window.finishMealDay = finishMealDay;
window.startInlineMealEdit = startInlineMealEdit;
window.cancelInlineMealEdit = cancelInlineMealEdit;
window.updateMealEditField = updateMealEditField;
window.addMealEditPhotoRow = addMealEditPhotoRow;
window.removeMealEditPhotoRow = removeMealEditPhotoRow;
window.addMealEditFoodRow = addMealEditFoodRow;
window.removeMealEditFoodRow = removeMealEditFoodRow;
window.updateMealEditFoodField = updateMealEditFoodField;
window.handleMealEditImageInputChange = handleMealEditImageInputChange;
window.saveInlineMealEdit = saveInlineMealEdit;
window.deleteMealRecord = deleteMealRecord;
window.setCurrentMealTime = setCurrentMealTime;

setupMealTimeInputs();
initPageMode();
