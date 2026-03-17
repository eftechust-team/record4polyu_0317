// Exercise Recording Script
let selectedDate = '';
let selectedDateLabel = '';
let exerciseRecords = [];
const exerciseDateOptions = [
    { value: 'workday1', label: '第一個工作日' },
    { value: 'workday2', label: '第二個工作日' },
    { value: 'restday', label: '第一個休息日' }
];
const completedExerciseDates = new Set();
let pageMode = 'add';
let selectedRealDate = '';
let editingExerciseRecordId = null;
let editingExerciseDraft = null;
let currentExerciseViewRecords = [];
let pendingAdjustmentNotes = null;

// Time block selection state
let selectedTimeBlocks = [];
let isDragging = false;
let dragStartBlock = null;
let lastDragBlock = null;
let dragMode = 'replace'; // 'replace' for first selection, 'add' for additional selections
let dragMoved = false; // Track if mouse has moved during drag
let dragRangeStart = null; // Track the start of current drag range
let dragRangeEnd = null; // Track the end of current drag range

// Color map for different exercise types (一級分類)
const exerciseColors = {
    '睡眠 / 靜止': '#374151',
    '自我照護':    '#ec4899',
    '家務勞動':    '#f59e0b',
    '學習/辦公':   '#3b82f6',
    '交通':        '#8b5cf6',
    '步行/跑步':   '#10b981',
    '體育鍛煉':    '#ef4444',
    '運動項目':    '#f97316',
    '休閒娛樂':    '#a78bfa',
    '宗教/志願活動': '#14b8a6'
};

function getExerciseColor(type) {
    const normalized = String(type || '').trim();
    if (normalized === '睡眠 / 靜止' || normalized === '睡覺/靜止') {
        return '#374151';
    }
    return exerciseColors[normalized] || '#9ca3af';
}

// Sub-options (二級具體活動) for each 一級 category
const activitySubOptions = {
    '睡眠 / 靜止': [
        '睡覺',
        '午休/躺著休息',
        '靜坐發呆、聽音樂',
        '靜坐冥想/打坐'
    ],
    '自我照護': [
        '洗漱：刷牙、洗臉、洗手等',
        '洗澡/淋浴',
        '穿衣、脫衣',
        '上廁所',
        '吃飯（坐著吃）',
        '邊站邊吃/邊走邊吃',
        '化妝、護膚、整理儀容',
        '做頭髮（吹頭、造型）',
        '其他自我照護活動（請說明）'
    ],
    '家務勞動': [
        '做飯、備菜、切菜、炒菜',
        '洗碗、收拾廚房',
        '打掃衛生（掃地、拖地、擦桌子）',
        '整理房間、收拾雜物',
        '洗衣服（機洗/手洗）、晾衣服、收衣服',
        '換床單、鋪床',
        '搬動傢俱/搬箱子',
        '購物（買菜/超市購物，步行為主）',
        '照顧小孩（餵奶、哄睡、洗澡、抱/背小孩）',
        '陪小孩玩耍（走/跑/抱著孩子）',
        '照顧老人/失能者（日常照護、協助移動）',
        '照顧寵物（餵食、遛狗、給寵物洗澡）',
        '其他家務/家庭活動（請說明）'
    ],
    '學習/辦公': [
        '坐著上課、聽講、記筆記',
        '坐著自習、寫作業、閱讀',
        '使用電腦/鍵盤打字、線上會議（坐著）',
        '辦公桌前工作（文書、資料處理）',
        '站立式辦公/站著開會',
        '參加會議/講座（以坐為主）',
        '輕體力工作（如實驗室輕操作、店員收銀、文秘類站立工作等）',
        '其他學習/辦公活動（請說明：____）'
    ],
    '交通': [
        '開車/騎摩托車',
        '乘坐汽車/網約車/計程車（乘客）',
        '乘坐公交/地鐵/火車/長途汽車',
        '騎自行車（通勤/代步）',
        '騎電動車/電助力車（通勤）',
        '步行通勤',
        '接送小孩/家人出行（駕駛或陪同）',
        '其他交通方式（請說明：）'
    ],
    '步行/跑步': [
        '輕鬆步行（散步、逛街、在家走動）',
        '中等速度步行（趕路、快走、遛狗）',
        '快速步行/健走（專門為了鍛煉走路）',
        '爬樓梯（上樓為主）',
        '一邊走路一邊背/提東西',
        '慢跑/慢速跑步',
        '快跑/衝刺',
        '其他步行/跑步活動（請說明）'
    ],
    '體育鍛煉': [
        '健身房器械有氧（跑步機、橢圓機、動感單車等）',
        '健身房力量訓練（舉鐵、器械、自由重量）',
        '自重訓練（俯臥撐、仰臥起坐、深蹲、平板支撐等）',
        '健身操/有氧操/跳操課（含 HIIT、Tabata）',
        '瑜伽/普拉提',
        '居家跟練視頻鍛煉（Keep、小紅書/視頻平臺跟練）',
        '拉伸/柔韌練習',
        '其他體育鍛煉（請說明：）'
    ],
    '運動項目': [
        '籃球',
        '足球',
        '羽毛球',
        '乒乓球',
        '網球/匹克球',
        '排球/沙灘排球',
        '游泳',
        '跳繩',
        '武術/跆拳道/拳擊/搏擊類',
        '舞蹈',
        '騎行運動',
        '登山/徒步/野外遠足',
        '輪滑/滑板',
        '其他運動項目（請說明）'
    ],
    '休閒娛樂': [
        '看電視/追劇（坐著或躺著）',
        '玩手機/刷短視頻/流覽社交媒體',
        '上網/玩電腦（非工作學習）',
        '打遊戲（坐著為主）',
        '主動體感遊戲/體感 VR',
        '閱讀書報/小說（非學業/工作）',
        '桌遊、棋牌、打牌、打麻將（坐著）',
        '聽音樂/播客（坐著）',
        '聚會聊天（以坐為主）',
        '旅遊觀光',
        '其他休閒娛樂活動（請說明）'
    ],
    '宗教/志願活動': [
        '其他宗教/志願活動（請說明）'
    ]
};

function updateSubOptions() {
    const typeSelect = document.getElementById('exerciseType');
    const intensitySelect = document.getElementById('exerciseIntensity');
    const selectedType = typeSelect.value;
    intensitySelect.innerHTML = '<option value="">請選擇具體活動</option>';
    if (selectedType && activitySubOptions[selectedType]) {
        activitySubOptions[selectedType].forEach(function(opt) {
            const o = document.createElement('option');
            o.value = opt;
            o.textContent = opt;
            intensitySelect.appendChild(o);
        });
    }
}

function confirmExerciseDate() {
    const selectedRadio = document.querySelector('input[name="exerciseDate"]:checked');
    
    if (!selectedRadio) {
        alert('請選擇記錄日期');
        return;
    }
    
    selectedDate = selectedRadio.value;
    const labels = {
        'workday1': '第一個工作日',
        'workday2': '第二個工作日',
        'restday': '第一個休息日'
    };
    selectedDateLabel = labels[selectedDate];
    
    // Hide date section, show exercise entry section
    document.getElementById('dateSection').style.display = 'none';
    document.getElementById('exerciseEntrySection').style.display = 'block';
    document.getElementById('timelineSection').style.display = 'block';
    
    // Update the exercise entry title with the selected date
    document.getElementById('exerciseEntryTitle').textContent = `添加${selectedDateLabel}的活動記錄`;
    
    // Initialize time block selector
    initializeTimeBlockSelector();
    
    // Load existing records for this date
    loadExerciseRecords();
}

function initializeTimeBlockSelector() {
    const selector = document.getElementById('timeBlockSelector');
    selector.innerHTML = '';
    
    // Generate time blocks from 00:00 to 23:45 (every 15 minutes)
    for (let hour = 0; hour < 24; hour++) {
        for (let minute = 0; minute < 60; minute += 15) {
            const timeStr = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
            const block = document.createElement('div');
            block.className = 'time-block';
            block.dataset.time = timeStr;
            block.textContent = timeStr;
            
            // Check if this time slot is already filled
            const isFilled = isTimeSlotFilled(timeStr);
            
            if (isFilled) {
                // Already filled - grey out and disable
                block.style.cssText = `
                    padding: 8px 4px;
                    border: 1px solid #ccc;
                    border-radius: 4px;
                    text-align: center;
                    cursor: not-allowed;
                    font-size: 11px;
                    background: #d3d3d3;
                    color: #666;
                    user-select: none;
                    opacity: 0.6;
                `;
                block.dataset.filled = 'true';
            } else {
                // Not filled - selectable
                block.style.cssText = `
                    padding: 8px 4px;
                    border: 1px solid #ddd;
                    border-radius: 4px;
                    text-align: center;
                    cursor: pointer;
                    font-size: 11px;
                    background: white;
                    user-select: none;
                    transition: all 0.2s;
                `;
                
                // Mouse events for selection
                block.addEventListener('mousedown', function(e) {
                    e.preventDefault();
                    isDragging = true;
                    dragMoved = false;
                    dragStartBlock = this;
                    lastDragBlock = this;
                    dragRangeStart = null;
                    dragRangeEnd = null;
                    
                    // Determine if this is an additional selection or replacement
                    dragMode = selectedTimeBlocks.length > 0 ? 'add' : 'replace';
                });
                
                block.addEventListener('mouseenter', function() {
                    if (isDragging && !this.dataset.filled) {
                        dragMoved = true;
                        handleDragOver(this);
                    }
                });
                
                block.addEventListener('mouseup', function() {
                    if (isDragging && !dragMoved && dragStartBlock === this) {
                        // Single click - toggle this block
                        if (dragMode === 'replace') {
                            // Replacing mode: clear other selections first
                            const blocks = document.querySelectorAll('.time-block:not([data-filled])');
                            blocks.forEach(b => {
                                const idx = selectedTimeBlocks.indexOf(b.dataset.time);
                                if (idx !== -1) {
                                    selectedTimeBlocks.splice(idx, 1);
                                    b.style.background = 'white';
                                    b.style.color = 'black';
                                    b.style.borderColor = '#ddd';
                                }
                            });
                        }
                        // Toggle the clicked block
                        toggleTimeBlock(this, false);
                    }
                    isDragging = false;
                    dragMoved = false;
                    dragStartBlock = null;
                    lastDragBlock = null;
                    dragRangeStart = null;
                    dragRangeEnd = null;
                });
                
                // No need for additional mouseup - handled by global listener above
                
                // Touch events for mobile
                block.addEventListener('touchstart', function(e) {
                    e.preventDefault();
                    isDragging = true;
                    dragMoved = false;
                    dragStartBlock = this;
                    lastDragBlock = this;
                    dragRangeStart = null;
                    dragRangeEnd = null;
                    
                    // Determine if this is an additional selection or replacement
                    dragMode = selectedTimeBlocks.length > 0 ? 'add' : 'replace';
                });
                
                block.addEventListener('touchmove', function(e) {
                    if (isDragging && !this.dataset.filled) {
                        dragMoved = true;
                        const touch = e.touches[0];
                        const element = document.elementFromPoint(touch.clientX, touch.clientY);
                        if (element && element.classList.contains('time-block') && !element.dataset.filled) {
                            handleDragOver(element);
                        }
                    }
                });
                
                block.addEventListener('touchend', function(e) {
                    if (isDragging && !dragMoved && dragStartBlock === this) {
                        // Single tap - toggle this block
                        if (dragMode === 'replace') {
                            // Replacing mode: clear other selections first
                            const blocks = document.querySelectorAll('.time-block:not([data-filled])');
                            blocks.forEach(b => {
                                const idx = selectedTimeBlocks.indexOf(b.dataset.time);
                                if (idx !== -1) {
                                    selectedTimeBlocks.splice(idx, 1);
                                    b.style.background = 'white';
                                    b.style.color = 'black';
                                    b.style.borderColor = '#ddd';
                                }
                            });
                        }
                        toggleTimeBlock(this, false);
                    }
                    isDragging = false;
                    dragMoved = false;
                    dragStartBlock = null;
                    lastDragBlock = null;
                    dragRangeStart = null;
                    dragRangeEnd = null;
                });
            }
            
            selector.appendChild(block);
        }
    }
    
    // Add global mouseup listener
    document.addEventListener('mouseup', function() {
        isDragging = false;
        dragMoved = false;
        dragStartBlock = null;
        lastDragBlock = null;
        dragRangeStart = null;
        dragRangeEnd = null;
    });
    
    // Add final time 24:00 for display purposes
    updateTimelineBlocks();
}

function isTimeSlotFilled(timeStr) {
    // Check if any exercise record covers this time slot
    for (const record of exerciseRecords) {
        const startMin = timeToMinutes(record.startTime);
        const endMin = timeToMinutes(record.endTime);
        const currentMin = timeToMinutes(timeStr);
        if (currentMin >= startMin && currentMin < endMin) {
            // Auto-filled placeholders should be editable (re-selectable) by users.
            if (record.type === '無運動' || record.type === '睡眠 / 靜止') {
                continue;
            }
            return true;
        }
    }
    return false;
}

function handleDragOver(block) {
    if (!dragStartBlock) return;
    
    const blocks = document.querySelectorAll('.time-block:not([data-filled])');
    const startIdx = Array.from(blocks).indexOf(dragStartBlock);
    const currentIdx = Array.from(blocks).indexOf(block);
    
    // Determine the range (from min to max index)
    const minIdx = Math.min(startIdx, currentIdx);
    const maxIdx = Math.max(startIdx, currentIdx);
    
    // If in 'replace' mode, clear all selections first
    if (dragMode === 'replace') {
        blocks.forEach(b => {
            const idx = selectedTimeBlocks.indexOf(b.dataset.time);
            if (idx !== -1) {
                selectedTimeBlocks.splice(idx, 1);
                b.style.background = 'white';
                b.style.color = 'black';
                b.style.borderColor = '#ddd';
            }
        });
    } else if (dragMode === 'add') {
        // In 'add' mode with existing selections, handle forward/backward adjustments
        if (dragRangeStart !== null && dragRangeEnd !== null) {
            const prevMin = Math.min(dragRangeStart, dragRangeEnd);
            const prevMax = Math.max(dragRangeStart, dragRangeEnd);
            
            // Deselect blocks that were in previous range but not in new range
            for (let i = prevMin; i <= prevMax; i++) {
                if (i < minIdx || i > maxIdx) {
                    const blockToDeselect = blocks[i];
                    const idx = selectedTimeBlocks.indexOf(blockToDeselect.dataset.time);
                    if (idx !== -1) {
                        selectedTimeBlocks.splice(idx, 1);
                        blockToDeselect.style.background = 'white';
                        blockToDeselect.style.color = 'black';
                        blockToDeselect.style.borderColor = '#ddd';
                    }
                }
            }
        }
    }
    
    // Select all blocks in the range from minIdx to maxIdx
    for (let i = minIdx; i <= maxIdx; i++) {
        const blockInRange = blocks[i];
        if (!blockInRange.dataset.filled) {
            const time = blockInRange.dataset.time;
            if (selectedTimeBlocks.indexOf(time) === -1) {
                selectedTimeBlocks.push(time);
            }
            blockInRange.style.background = '#3b82f6';
            blockInRange.style.color = 'white';
            blockInRange.style.borderColor = '#2563eb';
        }
    }
    
    // Update drag range tracking
    dragRangeStart = startIdx;
    dragRangeEnd = currentIdx;
    
    lastDragBlock = block;
    updateSelectedTimeDisplay();
}

function selectBlock(block) {
    const time = block.dataset.time;
    if (selectedTimeBlocks.indexOf(time) === -1) {
        selectedTimeBlocks.push(time);
        block.style.background = '#3b82f6';
        block.style.color = 'white';
        block.style.borderColor = '#2563eb';
    }
    updateSelectedTimeDisplay();
}

function deselectBlock(block) {
    const time = block.dataset.time;
    const index = selectedTimeBlocks.indexOf(time);
    if (index !== -1) {
        selectedTimeBlocks.splice(index, 1);
        block.style.background = 'white';
        block.style.color = 'black';
        block.style.borderColor = '#ddd';
    }
    updateSelectedTimeDisplay();
}

function toggleTimeBlock(block, shouldDeselect) {
    const time = block.dataset.time;
    const index = selectedTimeBlocks.indexOf(time);
    
    if (index === -1) {
        selectedTimeBlocks.push(time);
        block.style.background = '#3b82f6';
        block.style.color = 'white';
        block.style.borderColor = '#2563eb';
    } else {
        selectedTimeBlocks.splice(index, 1);
        block.style.background = 'white';
        block.style.color = 'black';
        block.style.borderColor = '#ddd';
    }
    
    updateSelectedTimeDisplay();
}

function updateSelectedTimeDisplay() {
    const display = document.getElementById('selectedTimeDisplay');
    
    if (selectedTimeBlocks.length === 0) {
        display.textContent = '未選擇';
        return;
    }
    
    // Sort selected blocks
    selectedTimeBlocks.sort();
    
    // Find continuous ranges
    const ranges = [];
    let rangeStart = selectedTimeBlocks[0];
    let rangeEnd = selectedTimeBlocks[0];
    
    for (let i = 1; i < selectedTimeBlocks.length; i++) {
        const current = selectedTimeBlocks[i];
        const prev = selectedTimeBlocks[i - 1];
        
        // Check if continuous (15 minutes apart)
        if (timeToMinutes(current) - timeToMinutes(prev) === 15) {
            rangeEnd = current;
        } else {
            ranges.push({ start: rangeStart, end: addMinutes(rangeEnd, 15) });
            rangeStart = current;
            rangeEnd = current;
        }
    }
    
    // Add the last range
    ranges.push({ start: rangeStart, end: addMinutes(rangeEnd, 15) });
    
    // Display ranges
    display.textContent = ranges.map(r => `${r.start}-${r.end}`).join(', ');
}

function clearTimeSelection() {
    selectedTimeBlocks = [];
    
    // Reset all blocks
    const blocks = document.querySelectorAll('.time-block');
    blocks.forEach(block => {
        if (block.dataset.filled === 'true') {
            block.style.background = '#d3d3d3';
            block.style.color = '#666';
            block.style.borderColor = '#ccc';
            block.style.opacity = '0.6';
        } else {
            block.style.background = 'white';
            block.style.color = 'black';
            block.style.borderColor = '#ddd';
        }
    });
    
    updateSelectedTimeDisplay();
}

function addMinutes(timeStr, minutes) {
    const totalMinutes = timeToMinutes(timeStr) + minutes;
    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    
    if (hours >= 24) return '24:00';
    
    return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
}

async function addExerciseRecord() {
    const saveBtn = document.getElementById('saveExerciseBtn');
    const originalBtnText = saveBtn ? saveBtn.textContent : '';
    const setSavingState = function(saving) {
        if (!saveBtn) return;
        saveBtn.disabled = saving;
        saveBtn.style.opacity = saving ? '0.7' : '1';
        saveBtn.style.cursor = saving ? 'wait' : 'pointer';
        saveBtn.textContent = saving ? '保存中...' : originalBtnText;
    };

    try {
        const type = document.getElementById('exerciseType').value;
        const intensity = document.getElementById('exerciseIntensity').value;
        const description = document.getElementById('exerciseDescription').value;
        
        if (selectedTimeBlocks.length === 0) {
            alert('請選擇活動時間');
            return;
        }
        
        if (!type) {
            alert('請選擇活動類型');
            return;
        }
        
        selectedTimeBlocks.sort();
        const ranges = [];
        let rangeStart = selectedTimeBlocks[0];
        let rangeEnd = selectedTimeBlocks[0];
        
        for (let i = 1; i < selectedTimeBlocks.length; i++) {
            const current = selectedTimeBlocks[i];
            const prev = selectedTimeBlocks[i - 1];
            
            if (timeToMinutes(current) - timeToMinutes(prev) === 15) {
                rangeEnd = current;
            } else {
                ranges.push({ start: rangeStart, end: addMinutes(rangeEnd, 15) });
                rangeStart = current;
                rangeEnd = current;
            }
        }
        ranges.push({ start: rangeStart, end: addMinutes(rangeEnd, 15) });

        setSavingState(true);
        
        for (const range of ranges) {
            const record = {
                id: Date.now() + Math.random(),
                startTime: range.start,
                endTime: range.end,
                type: type,
                intensity: intensity,
                description: description,
                recordDate: selectedDate
            };
            
            exerciseRecords.push(record);
            await saveExerciseRecord(record);
        }
        
        clearExerciseForm();
        updateTimelineBlocks();
        updateExerciseList();
        initializeTimeBlockSelector();
        const listSection = document.getElementById('timelineSection');
        if (listSection) {
            listSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
        setSavingState(false);
    } catch (error) {
        console.error('Unexpected add exercise record error:', error);
        alert('添加記錄時發生錯誤，請重新整理後再試');
        setSavingState(false);
    }
}

function updateTimelineBlocks() {
    const timelineBlocks = document.getElementById('timelineBlocks');
    const legend = document.getElementById('timelineLegend');
    
    // Clear existing blocks
    timelineBlocks.innerHTML = '';
    legend.innerHTML = '';
    
    // Track used types for legend
    const usedTypes = new Set();
    
    // Create time map (0:00 to 23:59 in full day)
    const timeMap = {};
    for (let hour = 0; hour < 24; hour++) {
        for (let minute = 0; minute < 60; minute += 15) {
            const timeStr = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
            timeMap[timeStr] = null;
        }
    }
    
    // Fill time map with exercise records
    exerciseRecords.forEach(record => {
        const startMinutes = timeToMinutes(record.startTime);
        const endMinutes = timeToMinutes(record.endTime);
        
        for (let m = startMinutes; m < endMinutes; m += 15) {
            const hour = Math.floor(m / 60);
            const minute = m % 60;
            const timeStr = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
            
            if (timeMap[timeStr] !== undefined) {
                timeMap[timeStr] = {
                    type: record.type,
                    intensity: record.intensity,
                    description: record.description,
                    startTime: record.startTime,
                    endTime: record.endTime
                };
                usedTypes.add(record.type);
            }
        }
    });
    
    // Create visual blocks for the timeline (1440 minutes in a day, 96 15-minute blocks)
    const blocks = Object.entries(timeMap);
    
    blocks.forEach(([time, data]) => {
        const block = document.createElement('div');
        block.style.cssText = `
            flex: 1;
            height: 100%;
            border: none;
            cursor: pointer;
            transition: all 0.2s;
            border-right: 1px solid #d1d5db;
            position: relative;
        `;
        
        if (data) {
            const color = getExerciseColor(data.type);
            block.style.backgroundColor = color;
            block.title = `${data.type}\n${data.startTime}-${data.endTime}\n${data.intensity}${data.description ? '\n' + data.description : ''}`;
            
            // Add click handler to show details
            block.addEventListener('click', function() {
                showActionDetails(data);
            });
            
            block.addEventListener('mouseenter', function() {
                this.style.opacity = '0.8';
            });
            
            block.addEventListener('mouseleave', function() {
                this.style.opacity = '1';
            });
        } else {
            block.style.backgroundColor = '#e5e7eb';
        }
        
        timelineBlocks.appendChild(block);
    });
    
    // Add legend items
    usedTypes.forEach(type => {
        const legendItem = document.createElement('div');
        legendItem.style.display = 'flex';
        legendItem.style.alignItems = 'center';
        legendItem.style.gap = '6px';
        
        const colorBox = document.createElement('div');
        colorBox.style.width = '16px';
        colorBox.style.height = '16px';
        colorBox.style.backgroundColor = getExerciseColor(type);
        colorBox.style.borderRadius = '3px';
        colorBox.style.border = '1px solid rgba(0,0,0,0.1)';
        
        const label = document.createElement('span');
        label.textContent = type;
        label.style.color = 'var(--text)';
        
        legendItem.appendChild(colorBox);
        legendItem.appendChild(label);
        legend.appendChild(legendItem);
    });
}

function showActionDetails(actionData) {
    document.getElementById('actionDetailsTime').textContent = `${actionData.startTime} - ${actionData.endTime}`;
    document.getElementById('actionDetailsType').textContent = actionData.type;
    document.getElementById('actionDetailsIntensity').textContent = actionData.intensity;
    document.getElementById('actionDetailsDescription').textContent = actionData.description || '(無)';
    
    const modal = document.getElementById('actionDetailsModal');
    modal.style.display = 'flex';
}

function closeActionDetailsModal() {
    document.getElementById('actionDetailsModal').style.display = 'none';
}

function updateTimeline() {
    updateTimelineBlocks();
}

function updateExerciseList() {
    const exerciseItems = document.getElementById('exerciseItems');
    exerciseItems.innerHTML = '';
    
    if (exerciseRecords.length === 0) {
        exerciseItems.innerHTML = '<p style="color: #999; font-size: 14px;">暫無活動記錄</p>';
        return;
    }
    
    // Group records by exercise type
    const groupedByType = {};
    exerciseRecords.forEach(record => {
        if (!groupedByType[record.type]) {
            groupedByType[record.type] = [];
        }
        groupedByType[record.type].push(record);
    });
    
    // Display grouped records
    Object.entries(groupedByType).forEach(([type, records]) => {
        const item = document.createElement('div');
        item.style.border = '1px solid var(--border)';
        item.style.borderRadius = '8px';
        item.style.padding = '12px';
        item.style.marginBottom = '10px';
        item.style.backgroundColor = '#fafafa';
        
        const color = getExerciseColor(type);
        item.style.borderLeft = `4px solid ${color}`;
        
        // Sort records by start time
        records.sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));
        
        let htmlContent = `
            <div style="display: flex; justify-content: space-between; align-items: start;">
                <div style="flex: 1;">
                    <div style="font-weight: 600; color: var(--text); margin-bottom: 8px; font-size: 15px;">
                        ${type}
                    </div>
        `;
        
        records.forEach(record => {
            const descDisplay = record.description ? `${record.description}` : '';
            const intensityDisplay = type === '睡眠 / 靜止' ? '' : `<span style="min-width: 50px;">${record.intensity}</span>`;
            htmlContent += `
                    <div style="font-size: 13px; color: #666; margin-bottom: 6px; display: flex; gap: 12px; align-items: center;">
                        <span style="min-width: 70px;">${record.startTime}-${record.endTime}</span>
                        ${intensityDisplay}
                        <span>${descDisplay}</span>
                    </div>
            `;
        });
        
        htmlContent += `
                </div>
                <button onclick="deleteExerciseRecordsByType('${type}')" style="background: #ef4444; color: white; border: none; padding: 6px 12px; border-radius: 6px; cursor: pointer; font-size: 12px; white-space: nowrap; margin-left: 10px; height: fit-content;">刪除</button>
            </div>
        `;
        
        item.innerHTML = htmlContent;
        exerciseItems.appendChild(item);
    });
}

function deleteExerciseRecord(recordId) {
    if (!confirm('確定要刪除此活動記錄嗎？')) {
        return;
    }
    
    exerciseRecords = exerciseRecords.filter(r => r.id !== recordId);
    updateTimelineBlocks();
    updateExerciseList();
    
    // Refresh time block selector to reflect deleted record
    initializeTimeBlockSelector();
    
    // TODO: Delete from backend
}

function deleteExerciseRecordsByType(type) {
    const count = exerciseRecords.filter(r => r.type === type).length;
    if (!confirm(`確定要刪除${count}條${type}的活動記錄嗎？`)) {
        return;
    }
    
    exerciseRecords = exerciseRecords.filter(r => r.type !== type);
    updateTimelineBlocks();
    updateExerciseList();
    
    // Refresh time block selector to reflect deleted records
    initializeTimeBlockSelector();
}

function timeToMinutes(timeStr) {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
}

function clearExerciseForm() {
    clearTimeSelection();
    document.getElementById('exerciseType').value = '';
    updateSubOptions();
    document.getElementById('exerciseDescription').value = '';
}

async function saveExerciseRecord(record) {
    try {
        const response = await fetch('/api/save-exercise-record', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                record_date: selectedDate,
                record_date_label: selectedDateLabel,
                start_time: record.startTime,
                end_time: record.endTime,
                exercise_type: record.type,
                intensity: record.intensity,
                description: record.description
            })
        });
        
        const result = await response.json();
        
        if (!result.success) {
            console.error('Save exercise record error:', result.message);
            alert('保存失敗：' + result.message);
        }
    } catch (error) {
        console.error('Save exercise record error:', error);
        alert('保存失敗，請檢查網絡連接');
    }
}

async function loadExerciseRecords() {
    try {
        const response = await fetch(`/api/get-exercise-records?record_date=${selectedDate}`);
        const result = await response.json();
        
        if (result.success && result.records) {
            exerciseRecords = result.records.map(r => ({
                id: r.id,
                startTime: r.start_time,
                endTime: r.end_time,
                type: r.exercise_type,
                intensity: r.intensity,
                description: r.description || '',
                recordDate: r.record_date,
                comparedStatus: r.activity_level || ''
            }));
            
            updateTimelineBlocks();
            updateExerciseList();
            if (pageMode === 'view') {
                renderExerciseViewList(result.records || []);
            } else {
                // Refresh the time block selector so already-saved slots show as grey immediately
                initializeTimeBlockSelector();
            }
        }
    } catch (error) {
        console.error('Load exercise records error:', error);
    }
}

function getComparedStatusText() {
    const statusMap = JSON.parse(localStorage.getItem('exerciseComparedStatus') || '{}');
    return statusMap[selectedDate] || '(未記錄)';
}

function escapeHtml(str) {
    return String(str || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function normalizeTimeValue(timeText) {
    const raw = String(timeText || '').trim();
    if (!raw) return '';
    return raw.slice(0, 5);
}

function minutesToTimeString(totalMinutes) {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

function buildExerciseSchedule(records) {
    const sorted = [...(records || [])].sort(function(a, b) {
        return timeToMinutes(normalizeTimeValue(a.start_time)) - timeToMinutes(normalizeTimeValue(b.start_time));
    });

    const segments = [];
    let currentEndMinutes = 0;

    sorted.forEach(function(record) {
        const startMinutes = timeToMinutes(normalizeTimeValue(record.start_time));
        const endMinutes = timeToMinutes(normalizeTimeValue(record.end_time));

        if (startMinutes > currentEndMinutes) {
            segments.push({
                isGap: true,
                start_time: minutesToTimeString(currentEndMinutes),
                end_time: minutesToTimeString(startMinutes),
                exercise_type: '睡眠 / 靜止',
                intensity: '睡覺',
                description: ''
            });
        }

        segments.push({
            ...record,
            isGap: false,
            hasOverlap: startMinutes < currentEndMinutes,
            start_minutes: startMinutes,
            end_minutes: endMinutes
        });

        if (endMinutes > currentEndMinutes) {
            currentEndMinutes = endMinutes;
        }
    });

    if (currentEndMinutes < 1440) {
        segments.push({
            isGap: true,
            start_time: minutesToTimeString(currentEndMinutes),
            end_time: '24:00',
            exercise_type: '睡眠 / 靜止',
            intensity: '睡覺',
            description: ''
        });
    }

    return segments;
}

function hasExerciseOverlap(startTime, endTime, ignoreRecordId) {
    const draftStart = timeToMinutes(normalizeTimeValue(startTime));
    const draftEnd = timeToMinutes(normalizeTimeValue(endTime));

    return (currentExerciseViewRecords || []).some(function(record) {
        if (!record || record.id === ignoreRecordId) {
            return false;
        }
        const recordStart = timeToMinutes(normalizeTimeValue(record.start_time));
        const recordEnd = timeToMinutes(normalizeTimeValue(record.end_time));
        return draftStart < recordEnd && draftEnd > recordStart;
    });
}

function buildExerciseTypeOptions(selectedValue) {
    const selected = selectedValue || '';
    const opts = ['<option value="">請選擇活動類型</option>'];
    Object.keys(exerciseColors).forEach(function(type) {
        const selectedAttr = type === selected ? ' selected' : '';
        opts.push(`<option value="${escapeHtml(type)}"${selectedAttr}>${escapeHtml(type)}</option>`);
    });
    return opts.join('');
}

function buildHourOptions(selectedHour) {
    const opts = [];
    for (let h = 0; h <= 23; h++) {
        const hStr = String(h).padStart(2, '0');
        const sel = hStr === selectedHour ? ' selected' : '';
        opts.push('<option value="' + hStr + '"' + sel + '>' + hStr + '</option>');
    }
    return opts.join('');
}

function buildMinuteOptions(selectedMinute) {
    return ['00', '15', '30', '45'].map(function(m) {
        const sel = m === selectedMinute ? ' selected' : '';
        return '<option value="' + m + '"' + sel + '>' + m + '</option>';
    }).join('');
}

function updateExerciseEditTimeField(fieldName, part, value) {
    if (!editingExerciseDraft) return;
    const current = normalizeTimeValue(editingExerciseDraft[fieldName] || '00:00');
    const parts = current.split(':');
    const h = parts[0] || '00';
    const m = parts[1] || '00';
    editingExerciseDraft[fieldName] = (part === 'hour' ? value : h) + ':' + (part === 'minute' ? value : m);
}

function updateDayActivityLevel(level) {
    const statusMap = JSON.parse(localStorage.getItem('exerciseComparedStatus') || '{}');
    statusMap[selectedDate] = level;
    localStorage.setItem('exerciseComparedStatus', JSON.stringify(statusMap));
    renderExerciseViewList(currentExerciseViewRecords);
}

function updateDayActivityLevelReason(reason) {
    const statusMap = JSON.parse(localStorage.getItem('exerciseComparedStatus') || '{}');
    const current = statusMap[selectedDate] || '';
    const actLevels = ['少於平常', '平常', '多於平常'];
    let level = '';
    for (let i = 0; i < actLevels.length; i++) {
        if (current.startsWith(actLevels[i])) { level = actLevels[i]; break; }
    }
    if (!level) return;
    statusMap[selectedDate] = level + (reason ? '（' + reason + '）' : '');
    localStorage.setItem('exerciseComparedStatus', JSON.stringify(statusMap));
}

function renderExerciseViewList(records) {
    const container = document.getElementById('exerciseViewItems');
    const title = document.getElementById('exerciseViewTitle');
    if (!container) return;
    const sortedRecords = [...(records || [])].sort(function(a, b) {
        return timeToMinutes(normalizeTimeValue(a.start_time)) - timeToMinutes(normalizeTimeValue(b.start_time));
    });
    currentExerciseViewRecords = sortedRecords;
    const scheduleSegments = buildExerciseSchedule(sortedRecords);

    const realDateText = selectedRealDate ? `（${selectedRealDate}）` : '';
    const dayDateText = `${selectedDateLabel || selectedDate || ''}${realDateText}`;

    if (title) {
        title.textContent = dayDateText ? `${dayDateText}的活動記錄詳情` : '活動記錄詳情';
    }

    if (!sortedRecords || sortedRecords.length === 0) {
        container.innerHTML = '<p style="color:#999; font-size:14px;">暫無活動記錄</p>';
        return;
    }

    // Show adjustment banner if a previous save caused auto-adjustments
    const adjustmentBannerHtml = (pendingAdjustmentNotes && pendingAdjustmentNotes.length > 0)
        ? '<div style="margin-bottom:12px; color:#92400e; background:#fffbeb; border:1px solid #fcd34d; border-radius:8px; padding:10px 12px; font-size:13px;">'
          + '<strong>以下記錄因本次編輯自動調整：</strong>'
          + '<ul style="margin:6px 0 0 16px; padding:0;">'
          + pendingAdjustmentNotes.map(function(n) { return '<li>' + n + '</li>'; }).join('')
          + '</ul></div>'
        : '';
    pendingAdjustmentNotes = null;

    const comparedText = getComparedStatusText();
    const actLevels = ['少於平常', '平常', '多於平常'];
    let currentDayLevel = '';
    let currentDayReason = '';
    if (comparedText && comparedText !== '(未記錄)') {
        for (let i = 0; i < actLevels.length; i++) {
            if (comparedText.startsWith(actLevels[i])) {
                currentDayLevel = actLevels[i];
                const reasonMatch = comparedText.match(/（(.+)）/);
                if (reasonMatch) currentDayReason = reasonMatch[1];
                break;
            }
        }
    }
    const actLevelOpts = (['<option value=""' + (!currentDayLevel ? ' selected' : '') + '>請選擇</option>']
        .concat(actLevels.map(function(l) {
            return '<option value="' + escapeHtml(l) + '"' + (l === currentDayLevel ? ' selected' : '') + '>' + escapeHtml(l) + '</option>';
        }))).join('');

    const hasOverlap = scheduleSegments.some(function(segment) {
        return !segment.isGap && segment.hasOverlap;
    });

    const headerHtml = `
        <div style="border:1px solid var(--border); border-radius:10px; padding:12px; background:#f8fafc; margin-bottom:12px;">
            <div style="font-size:13px; color:#475569;">記錄日期：${dayDateText || '(未填)'}</div>
            <div style="display:flex; align-items:center; flex-wrap:wrap; gap:6px; margin-top:6px;">
                <span style="font-size:13px; color:#475569;">與平時相比的活動量：</span>
                <select onchange="updateDayActivityLevel(this.value)" style="padding:4px 8px; border:1px solid #d1d5db; border-radius:6px; font-size:13px;">${actLevelOpts}</select>
                ${currentDayLevel && currentDayLevel !== '平常' ? `<input type="text" value="${escapeHtml(currentDayReason)}" placeholder="原因（可選）" oninput="updateDayActivityLevelReason(this.value)" style="padding:4px 8px; border:1px solid #d1d5db; border-radius:6px; font-size:13px; width:140px;">` : ''}
            </div>
            <div style="font-size:13px; color:#64748b; margin-top:8px;">以下按時間順序顯示全天活動；未記錄時段已自動顯示為「睡眠 / 靜止」。</div>
            ${hasOverlap ? '<div style="margin-top:8px; color:#b91c1c; font-size:13px; font-weight:600;">注意：目前有活動時間重疊，請先修改重疊時段。</div>' : ''}
        </div>
    `;

    renderViewTimeline(sortedRecords);

    container.innerHTML = adjustmentBannerHtml + headerHtml + scheduleSegments.map(function(r, idx) {
        const isEditing = editingExerciseRecordId === r.id;
        const draft = editingExerciseDraft || {};
        const isGap = !!r.isGap;
        const displayType = r.exercise_type || '(未填)';
        const displayIntensity = r.intensity || '(未填)';
        const displayDescription = r.description || '(無)';
        const accentColor = getExerciseColor(displayType);

        const editFormHtml = isEditing
            ? (function() {
                const sParts = (normalizeTimeValue(draft.start_time) || '00:00').split(':');
                const sHour = sParts[0] || '00';
                const sMin = ['00','15','30','45'].includes(sParts[1]) ? sParts[1] : '00';
                const eParts = (normalizeTimeValue(draft.end_time) || '00:00').split(':');
                const eHour = eParts[0] || '00';
                const eMin = ['00','15','30','45'].includes(eParts[1]) ? eParts[1] : '00';
                return `
                <div style="margin-top:10px; padding:10px; border:1px dashed #cbd5e1; border-radius:8px; background:#fff; display:grid; gap:8px;">
                    <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px;">
                        <div>
                            <label style="font-size:12px; color:#475569;">開始時間</label>
                            <div style="display:flex; align-items:center; gap:4px;">
                                <select onchange="updateExerciseEditTimeField('start_time','hour',this.value)" style="flex:1; padding:8px; border:1px solid #d1d5db; border-radius:6px;">${buildHourOptions(sHour)}</select>
                                <span style="font-size:14px;">:</span>
                                <select onchange="updateExerciseEditTimeField('start_time','minute',this.value)" style="flex:1; padding:8px; border:1px solid #d1d5db; border-radius:6px;">${buildMinuteOptions(sMin)}</select>
                            </div>
                        </div>
                        <div>
                            <label style="font-size:12px; color:#475569;">結束時間</label>
                            <div style="display:flex; align-items:center; gap:4px;">
                                <select onchange="updateExerciseEditTimeField('end_time','hour',this.value)" style="flex:1; padding:8px; border:1px solid #d1d5db; border-radius:6px;">${buildHourOptions(eHour)}</select>
                                <span style="font-size:14px;">:</span>
                                <select onchange="updateExerciseEditTimeField('end_time','minute',this.value)" style="flex:1; padding:8px; border:1px solid #d1d5db; border-radius:6px;">${buildMinuteOptions(eMin)}</select>
                            </div>
                        </div>
                    </div>
                    <div>
                        <label style="font-size:12px; color:#475569;">活動類型</label>
                        <select onchange="updateExerciseEditField('exercise_type', this.value)" style="width:100%; padding:8px; border:1px solid #d1d5db; border-radius:6px;">
                            ${buildExerciseTypeOptions(draft.exercise_type)}
                        </select>
                    </div>
                    <div>
                        <label style="font-size:12px; color:#475569;">具體活動</label>
                        <textarea rows="2" oninput="updateExerciseEditField('intensity', this.value)" style="width:100%; padding:8px; border:1px solid #d1d5db; border-radius:6px; resize:vertical;">${escapeHtml(draft.intensity || '')}</textarea>
                    </div>
                    <div>
                        <label style="font-size:12px; color:#475569;">補充描述</label>
                        <textarea rows="2" oninput="updateExerciseEditField('description', this.value)" style="width:100%; padding:8px; border:1px solid #d1d5db; border-radius:6px; resize:vertical;">${escapeHtml(draft.description || '')}</textarea>
                    </div>
                    <div style="display:flex; gap:8px;">
                        <button type="button" class="mini-btn mini-btn-primary" onclick="saveInlineExerciseEdit(${r.id})">保存</button>
                        <button type="button" class="mini-btn" style="background:#9ca3af; color:white;" onclick="cancelInlineExerciseEdit()">取消</button>
                    </div>
                </div>
                `;
            })()
            : '';

        return `
            <div style="border:1px solid var(--border); border-left:4px solid ${accentColor}; border-radius:8px; padding:12px; margin-bottom:10px; background:${isGap ? '#f8fafc' : '#fafafa'};">
                ${isEditing ? `
                    <div style="font-weight:700; color:var(--text); margin-bottom:6px;">${idx + 1}. 編輯活動記錄</div>
                    ${editFormHtml}
                ` : `
                    <div style="display:flex; justify-content:space-between; gap:12px; align-items:flex-start; flex-wrap:wrap;">
                        <div style="flex:1; min-width:220px;">
                            <div style="font-weight:700; color:var(--text); margin-bottom:6px;">${idx + 1}. ${r.start_time} - ${r.end_time}</div>
                            <div style="font-size:14px; color:#334155; font-weight:600;">${displayType}</div>
                            <div style="font-size:13px; color:#475569; margin-top:4px;">具體活動：${displayIntensity}</div>
                            <div style="font-size:13px; color:#64748b; margin-top:4px; white-space:pre-wrap;">補充描述：${displayDescription}</div>
                            ${isGap ? '<div style="font-size:12px; color:#0f766e; margin-top:8px;">未記錄時間已補為「睡眠 / 靜止」</div>' : ''}
                            ${(!isGap && r.hasOverlap) ? '<div style="font-size:12px; color:#b91c1c; margin-top:8px; font-weight:600;">此時段與其他活動重疊，請修改。</div>' : ''}
                        </div>
                        <div style="display:flex; gap:8px; flex-wrap:wrap; align-self:center;">
                            ${isGap ? '<button type="button" class="mini-btn mini-btn-primary" onclick="goToExerciseAddPage()">新增活動</button>' : `<button class="mini-btn mini-btn-primary" onclick="startInlineExerciseEdit(${r.id})">編輯</button><button class="mini-btn mini-btn-danger" onclick="deleteExerciseRecordById(${r.id})">刪除</button>`}
                        </div>
                    </div>
                `}
            </div>
        `;
    }).join('');
}

function startInlineExerciseEdit(id) {
    const record = (currentExerciseViewRecords || []).find(function(item) {
        return item && item.id === id;
    });
    if (!record) return;

    editingExerciseRecordId = id;
    editingExerciseDraft = {
        start_time: normalizeTimeValue(record.start_time),
        end_time: normalizeTimeValue(record.end_time),
        exercise_type: record.exercise_type || '',
        intensity: record.intensity || '',
        description: record.description || ''
    };
    renderExerciseViewList(currentExerciseViewRecords);
}

function updateExerciseEditField(field, value) {
    if (!editingExerciseDraft) return;
    editingExerciseDraft[field] = value;
}

function cancelInlineExerciseEdit() {
    editingExerciseRecordId = null;
    editingExerciseDraft = null;
    renderExerciseViewList(currentExerciseViewRecords);
}

async function saveInlineExerciseEdit(id) {
    if (!editingExerciseDraft) return;

    const payload = {
        start_time: normalizeTimeValue(editingExerciseDraft.start_time),
        end_time: normalizeTimeValue(editingExerciseDraft.end_time),
        exercise_type: String(editingExerciseDraft.exercise_type || '').trim(),
        intensity: String(editingExerciseDraft.intensity || '').trim(),
        description: String(editingExerciseDraft.description || '').trim()
    };

    if (!payload.start_time || !payload.end_time || !payload.exercise_type) {
        alert('請完整填寫開始時間、結束時間和活動類型');
        return;
    }

    if (timeToMinutes(payload.end_time) <= timeToMinutes(payload.start_time)) {
        alert('結束時間需要晚於開始時間');
        return;
    }

    const newStart = timeToMinutes(payload.start_time);
    const newEnd = timeToMinutes(payload.end_time);

    // Find all records that overlap with the new time range (excluding the one being edited)
    const conflicting = (currentExerciseViewRecords || []).filter(function(record) {
        if (!record || !record.id || record.id === id) return false;
        const rStart = timeToMinutes(normalizeTimeValue(record.start_time));
        const rEnd = timeToMinutes(normalizeTimeValue(record.end_time));
        return rStart < newEnd && rEnd > newStart;
    });

    const adjustmentNotes = [];
    const toDelete = [];
    const toUpdate = [];

    conflicting.forEach(function(record) {
        const rStart = timeToMinutes(normalizeTimeValue(record.start_time));
        const rEnd = timeToMinutes(normalizeTimeValue(record.end_time));
        const oldStartStr = normalizeTimeValue(record.start_time);
        const oldEndStr = normalizeTimeValue(record.end_time);
        const typeName = escapeHtml(record.exercise_type || '(未命名)');

        if (rStart >= newStart && rEnd <= newEnd) {
            // Fully consumed by the new range: delete
            toDelete.push(record.id);
            adjustmentNotes.push('「' + typeName + '」（' + oldStartStr + '–' + oldEndStr + '）因完全重疊已被刪除');
        } else if (rStart < newStart) {
            // B's tail extends into A: trim B's end to newStart
            toUpdate.push({ record: record, start_time: minutesToTimeString(rStart), end_time: minutesToTimeString(newStart) });
            adjustmentNotes.push('「' + typeName + '」（' + oldStartStr + '–' + oldEndStr + '）已調整為 ' + minutesToTimeString(rStart) + '–' + minutesToTimeString(newStart));
        } else {
            // B's head is inside A: push B's start to newEnd
            toUpdate.push({ record: record, start_time: minutesToTimeString(newEnd), end_time: minutesToTimeString(rEnd) });
            adjustmentNotes.push('「' + typeName + '」（' + oldStartStr + '–' + oldEndStr + '）已調整為 ' + minutesToTimeString(newEnd) + '–' + minutesToTimeString(rEnd));
        }
    });

    try {
        for (let i = 0; i < toDelete.length; i++) {
            const resp = await fetch('/api/delete-exercise-record/' + toDelete[i], { method: 'DELETE' });
            if (!resp.ok) throw new Error('刪除衝突記錄失敗');
        }
        for (let i = 0; i < toUpdate.length; i++) {
            const adj = toUpdate[i];
            const resp = await fetch('/api/update-exercise-record/' + adj.record.id, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    start_time: adj.start_time,
                    end_time: adj.end_time,
                    exercise_type: adj.record.exercise_type || '',
                    intensity: adj.record.intensity || '',
                    description: adj.record.description || ''
                })
            });
            if (!resp.ok) throw new Error('調整衝突記錄失敗');
        }
        const response = await fetch('/api/update-exercise-record/' + id, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const result = await response.json();
        if (!result.success) {
            alert('更新失敗：' + (result.message || '未知錯誤'));
            return;
        }
    } catch (e) {
        alert('保存時發生錯誤：' + e.message);
        return;
    }

    editingExerciseRecordId = null;
    editingExerciseDraft = null;
    if (adjustmentNotes.length > 0) {
        pendingAdjustmentNotes = adjustmentNotes;
    }
    loadExerciseRecords();
}

function goToExerciseAddPage() {
    const params = new URLSearchParams({
        mode: 'add',
        record_date: selectedDate || '',
        record_date_label: selectedDateLabel || '',
        real_date: selectedRealDate || ''
    });
    window.location.href = `/exercise?${params.toString()}`;
}

async function deleteExerciseRecordById(id) {
    if (!confirm('確定要刪除此活動記錄嗎？')) return;

    const response = await fetch(`/api/delete-exercise-record/${id}`, { method: 'DELETE' });
    const result = await response.json();
    if (!result.success) {
        alert('刪除失敗：' + (result.message || '未知錯誤'));
        return;
    }
    loadExerciseRecords();
}

function escapeForJs(str) {
    return String(str).replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n').replace(/\r/g, '');
}

async function finishExerciseDay() {
    if (exerciseRecords.length === 0) {
        alert('請至少添加一條活動記錄');
        return;
    }
    
    // Calculate and fill time gaps automatically
    const timeGaps = calculateTimeGaps();
    const autoFillHint = document.getElementById('autoFillHint');
    if (autoFillHint) {
        autoFillHint.style.display = 'none';
    }
    
    if (timeGaps.length > 0) {
        // Auto-fill gaps with "睡眠 / 靜止"
        for (const gap of timeGaps) {
            const record = {
                id: Date.now() + Math.random(),
                startTime: gap.start,
                endTime: gap.end,
                type: '睡眠 / 靜止',
                intensity: '睡覺',
                description: '',
                recordDate: selectedDate
            };
            exerciseRecords.push(record);
            await saveExerciseRecord(record);
        }
        
        updateTimelineBlocks();
        updateExerciseList();
        
        // Refresh time block selector to show newly filled slots as grey
        initializeTimeBlockSelector();

        if (autoFillHint) {
            autoFillHint.style.display = 'block';
        }
    }
    
    // Show activity level modal
    document.getElementById('activityLevelModal').style.display = 'flex';
}

function cancelActivityLevel() {
    document.getElementById('activityLevelModal').style.display = 'none';
    document.getElementById('activityLevel').value = '';
    document.getElementById('activityReason').value = '';
    document.getElementById('reasonSection').style.display = 'none';
}

function confirmActivityLevel() {
    const activityLevel = document.getElementById('activityLevel').value;
    
    if (!activityLevel) {
        alert('請選擇活動量');
        return;
    }
    
    if (activityLevel !== '平常') {
        const reason = document.getElementById('activityReason').value.trim();
        if (!reason) {
            alert('請填寫原因');
            return;
        }
    }

    const reasonText = document.getElementById('activityReason').value.trim();
    const statusMap = JSON.parse(localStorage.getItem('exerciseComparedStatus') || '{}');
    statusMap[selectedDate] = activityLevel + (reasonText ? `（${reasonText}）` : '');
    localStorage.setItem('exerciseComparedStatus', JSON.stringify(statusMap));
    
    // Close modal and reset fields
    document.getElementById('activityLevelModal').style.display = 'none';
    document.getElementById('activityLevel').value = '';
    document.getElementById('activityReason').value = '';
    document.getElementById('reasonSection').style.display = 'none';

    // Show summary page (frontend only for now)
    showExerciseSummary();
}

function showExerciseSummary() {
    if (selectedDate) {
        completedExerciseDates.add(selectedDate);
    }

    const dateText = selectedDateLabel || '第x個xx日';
    const realDateText = selectedRealDate ? `（${selectedRealDate}）` : '（dd/mm/yyyy）';
    document.getElementById('summaryDateLabel').textContent = `${dateText}${realDateText}`;
    renderSummaryTimeline();

    document.getElementById('exerciseEntrySection').style.display = 'none';
    document.getElementById('timelineSection').style.display = 'none';
    document.getElementById('summarySection').style.display = 'block';
}

function renderViewTimeline(records) {
    const blocksContainer = document.getElementById('viewTimelineBlocks');
    const legendContainer = document.getElementById('viewTimelineLegend');
    if (!blocksContainer || !legendContainer) return;

    blocksContainer.innerHTML = '';
    legendContainer.innerHTML = '';

    const timeMap = {};
    for (let hour = 0; hour < 24; hour++) {
        for (let minute = 0; minute < 60; minute += 15) {
            const timeStr = String(hour).padStart(2, '0') + ':' + String(minute).padStart(2, '0');
            timeMap[timeStr] = null;
        }
    }

    const usedTypes = new Set();
    (records || []).forEach(function(record) {
        const type = record.exercise_type || '';
        if (!type) return;
        const startMinutes = timeToMinutes(normalizeTimeValue(record.start_time));
        const endMinutes = timeToMinutes(normalizeTimeValue(record.end_time));
        for (let m = startMinutes; m < endMinutes; m += 15) {
            const h = Math.floor(m / 60);
            const min = m % 60;
            const timeStr = String(h).padStart(2, '0') + ':' + String(min).padStart(2, '0');
            if (timeMap[timeStr] !== undefined) {
                timeMap[timeStr] = type;
                usedTypes.add(type);
            }
        }
    });

    Object.keys(timeMap).forEach(function(time) {
        const block = document.createElement('div');
        const type = timeMap[time];
        block.style.cssText = 'flex:1; height:100%; border-right:1px solid #d1d5db; background:' + (type ? getExerciseColor(type) : '#ffffff') + ';';
        if (type) block.title = time + ' ' + type;
        blocksContainer.appendChild(block);
    });

    Array.from(usedTypes).forEach(function(type) {
        const item = document.createElement('div');
        item.style.cssText = 'display:flex; align-items:center; gap:6px;';
        item.innerHTML = '<span style="width:12px; height:12px; border-radius:3px; display:inline-block; background:' + getExerciseColor(type) + ';"></span><span style="color:#333;">' + escapeHtml(type) + '</span>';
        legendContainer.appendChild(item);
    });
}

function renderSummaryTimeline() {
    const blocksContainer = document.getElementById('summaryTimelineBlocks');
    const legendContainer = document.getElementById('summaryTimelineLegend');
    if (!blocksContainer || !legendContainer) return;

    blocksContainer.innerHTML = '';
    legendContainer.innerHTML = '';

    const timeMap = {};
    for (let hour = 0; hour < 24; hour++) {
        for (let minute = 0; minute < 60; minute += 15) {
            const timeStr = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
            timeMap[timeStr] = null;
        }
    }

    const usedTypes = new Set();
    exerciseRecords.forEach(record => {
        const startMinutes = timeToMinutes(record.startTime);
        const endMinutes = timeToMinutes(record.endTime);
        for (let m = startMinutes; m < endMinutes; m += 15) {
            const hour = Math.floor(m / 60);
            const minute = m % 60;
            const timeStr = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
            if (timeMap[timeStr] !== undefined) {
                timeMap[timeStr] = record.type;
                usedTypes.add(record.type);
            }
        }
    });

    Object.keys(timeMap).forEach(time => {
        const block = document.createElement('div');
        const type = timeMap[time];
        block.style.cssText = `
            flex: 1;
            height: 100%;
            border-right: 1px solid #d1d5db;
            background: ${type ? getExerciseColor(type) : '#ffffff'};
        `;
        if (type) {
            block.title = `${time} ${type}`;
        }
        blocksContainer.appendChild(block);
    });

    Array.from(usedTypes).forEach(type => {
        const item = document.createElement('div');
        item.style.cssText = 'display:flex; align-items:center; gap:6px;';
        item.innerHTML = `
            <span style="width:12px; height:12px; border-radius:3px; display:inline-block; background:${getExerciseColor(type)};"></span>
            <span style="color:#333;">${type}</span>
        `;
        legendContainer.appendChild(item);
    });
}

function goHomeFromSummary() {
    window.location.href = '/hub';
}

function returnToExerciseEditing() {
    document.getElementById('summarySection').style.display = 'none';
    document.getElementById('exerciseEntrySection').style.display = 'block';
    document.getElementById('timelineSection').style.display = 'block';
}

function continueNextExerciseDay() {
    const remainingDays = exerciseDateOptions.filter(opt => !completedExerciseDates.has(opt.value));
    if (remainingDays.length === 0) {
        alert('所有天數均已完成！');
        return;
    }

    // Reset for next day selection
    selectedDate = '';
    selectedDateLabel = '';
    exerciseRecords = [];
    
    // Clear radio button selections
    const radios = document.querySelectorAll('input[name="exerciseDate"]');
    radios.forEach(radio => {
        radio.checked = false;
    });

    // Show date selection section, hide others
    document.getElementById('summarySection').style.display = 'none';
    document.getElementById('dateSection').style.display = 'block';
    document.getElementById('exerciseEntrySection').style.display = 'none';
    document.getElementById('timelineSection').style.display = 'none';
}

async function markNoExercise() {
    if (!confirm('確定將所有未記錄的時間填充為"睡眠 / 靜止"嗎？')) {
        return;
    }
    
    // Calculate time gaps
    const timeGaps = calculateTimeGaps();
    
    if (timeGaps.length === 0) {
        alert('全天都已有活動記錄，無需填充！');
        return;
    }
    
    // Add "睡眠 / 靜止" records for each gap
    for (const gap of timeGaps) {
        const record = {
            id: Date.now() + Math.random(),
            startTime: gap.start,
            endTime: gap.end,
            type: '睡眠 / 靜止',
            intensity: '睡覺',
            description: '',
            recordDate: selectedDate
        };
        
        exerciseRecords.push(record);
        await saveExerciseRecord(record);
    }
    
    alert(`已填充 ${timeGaps.length} 個時間段為"睡眠 / 靜止"！`);
    updateTimelineBlocks();
    updateExerciseList();
    
    // Refresh time block selector to show newly filled slots as grey
    initializeTimeBlockSelector();
}

function calculateTimeGaps() {
    // Sort existing records by start time
    const sortedRecords = [...exerciseRecords].sort((a, b) => {
        return timeToMinutes(a.startTime) - timeToMinutes(b.startTime);
    });

    const gaps = [];
    let currentMinutes = 0; // start of day in minutes

    for (const record of sortedRecords) {
        const recordStartMin = timeToMinutes(record.startTime);
        const recordEndMin   = timeToMinutes(record.endTime);
        if (currentMinutes < recordStartMin) {
            // Found a gap — convert back to HH:MM
            const gs = currentMinutes, ge = recordStartMin;
            gaps.push({
                start: `${String(Math.floor(gs/60)).padStart(2,'0')}:${String(gs%60).padStart(2,'0')}`,
                end:   `${String(Math.floor(ge/60)).padStart(2,'0')}:${String(ge%60).padStart(2,'0')}`
            });
        }
        // Advance past this record (take the furthest end seen so far)
        if (recordEndMin > currentMinutes) {
            currentMinutes = recordEndMin;
        }
    }

    // Check if there's a gap at the end of the day
    if (currentMinutes < 1440) {
        const gs = currentMinutes;
        gaps.push({
            start: `${String(Math.floor(gs/60)).padStart(2,'0')}:${String(gs%60).padStart(2,'0')}`,
            end: '24:00'
        });
    }

    return gaps;
}

async function logout() {
    if (confirm('確定要登出嗎？')) {
        try {
            const response = await fetch('/api/logout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });
            const result = await response.json();
            if (result.success) {
                window.location.href = result.redirect || '/login';
            }
        } catch (error) {
            console.error('Logout error:', error);
            window.location.href = '/login';
        }
    }
}

// Activity level modal logic
document.addEventListener('DOMContentLoaded', function() {
    const activityLevelSelect = document.getElementById('activityLevel');
    const reasonSection = document.getElementById('reasonSection');
    
    if (activityLevelSelect) {
        activityLevelSelect.addEventListener('change', function() {
            if (this.value && this.value !== '平常') {
                reasonSection.style.display = 'block';
            } else {
                reasonSection.style.display = 'none';
            }
        });
    }

    const exerciseTypeSelect = document.getElementById('exerciseType');
    if (exerciseTypeSelect) {
        exerciseTypeSelect.addEventListener('change', updateSubOptions);
    }

    const params = new URLSearchParams(window.location.search);
    pageMode = params.get('mode') || 'add';
    selectedDate = params.get('record_date') || '';
    selectedDateLabel = params.get('record_date_label') || selectedDateLabel;
    selectedRealDate = params.get('real_date') || '';

    if (pageMode === 'view') {
        document.getElementById('dateSection').style.display = 'none';
        document.getElementById('exerciseEntrySection').style.display = 'none';
        document.getElementById('timelineSection').style.display = 'none';
        document.getElementById('summarySection').style.display = 'none';
        document.getElementById('exerciseViewSection').style.display = 'block';
        if (selectedDate) {
            loadExerciseRecords();
        } else {
            document.getElementById('exerciseViewItems').innerHTML = '<p style="color:#999; font-size:14px;">請先從入口頁選擇第x個xx日</p>';
        }
        return;
    }

    if (selectedDate) {
        document.getElementById('dateSection').style.display = 'none';
        document.getElementById('exerciseEntrySection').style.display = 'block';
        document.getElementById('timelineSection').style.display = 'block';
        const realDateText = selectedRealDate ? `（${selectedRealDate}）` : '';
        document.getElementById('exerciseEntryTitle').textContent = `添加${selectedDateLabel}${realDateText}的活動記錄`;
        initializeTimeBlockSelector();
        loadExerciseRecords();
    }
});
