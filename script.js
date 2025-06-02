let families = JSON.parse(localStorage.getItem('families')) || [
    'Nhân', 'Minh', 'Phi', 'Hoài', 'An', 'Nam', 'Ngọc', 'Tuân', 'Quyên',
    'Nhuận', 'Thông', 'Tự', 'Khoa', 'Vinh'
];
let expenses = JSON.parse(localStorage.getItem('expenses')) || [
    { item: 'Ăn uống', cost: 4000000, date: '2025-05-15', payer: 'Nhân' },
    { item: 'đi nhà đèm', cost: 2000000, date: '2025-05-16', payer: 'Minh' },
    { item: 'hạng 1', cost: 3000000, date: '2025-05-16', payer: 'Phi' },
    { item: 'đánh bài', cost: 1500000, date: '2025-05-16', payer: 'Hoài' }
];
let participantsData = JSON.parse(localStorage.getItem('participantsData')) || [
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], // Ăn uống
    [2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2], // đi nhà đèm
    [2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], // hạng 1
    [0, 2, 2, 2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2]  // đánh bài
];
let resultsData = JSON.parse(localStorage.getItem('resultsData')) || [];
let editMode = { expense: false, family: false };

// Load data from localStorage
function loadData() {
    try {
        // Clear localStorage to ensure default data is used (temporary for debugging)
    
        const expenseBody = document.getElementById('expenseBody');
        if (!expenseBody) {
            console.error('expenseBody element not found');
            return;
        }
        expenseBody.innerHTML = '';
        expenses.forEach((exp, index) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${index + 1}</td>
                <td><input type="text" class="item" value="${exp.item || ''}" required><span class="edit-icon" onclick="editExpense(${index})">✎</span><span class="delete-icon" onclick="deleteExpense(${index})">✖</span></td>
                <td><input type="number" class="cost" value="${exp.cost || 0}" required></td>
                <td><input type="date" class="date" value="${exp.date || '2025-05-15'}" required></td>
                <td><select class="payer" onchange="updatePayer(${index})" required>${families.map(f => `<option value="${f}" ${f === exp.payer ? 'selected' : ''}>${f}</option>`).join('')}</select></td>
            `;
            expenseBody.appendChild(row);
        });
        updateFamilyTable();
        updateResultTable();
        updatePayerSelect();
    } catch (e) {
        console.error('Lỗi khi tải dữ liệu:', e);
        resetData();
    }
}

// Tab switching
function openTab(event, tabName) {
    const tabcontent = document.getElementsByClassName("tabcontent");
    for (let i = 0; i < tabcontent.length; i++) {
        tabcontent[i].style.display = "none";
    }
    const tablinks = document.getElementsByClassName("tablink");
    for (let i = 0; i < tablinks.length; i++) {
        tablinks[i].className = tablinks[i].className.replace(" active", "");
    }
    const tab = document.getElementById(tabName);
    if (tab) {
        tab.style.display = "block";
        event.currentTarget.className += " active";
        // Force update for "Gia đình tham gia" tab
        if (tabName === 'Tab2') {
            updateFamilyTable();
        }
        saveData();
    } else {
        console.error(`Tab with ID ${tabName} not found`);
    }
}

// Show popup for adding new expense
function addExpense() {
    const popup = document.getElementById('addExpensePopup');
    const payerSelect = document.getElementById('popupPayer');
    payerSelect.innerHTML = families.map(f => `<option value="${f}">${f}</option>`).join('');
    document.getElementById('popupDate').value = new Date().toISOString().split('T')[0];
    popup.style.display = 'block';
}

// Save new expense from popup
function saveNewExpense() {
    const item = document.getElementById('popupItem').value;
    const cost = parseInt(document.getElementById('popupCost').value) || 0;
    const date = document.getElementById('popupDate').value;
    const payer = document.getElementById('popupPayer').value;

    if (item && cost && date && payer) {
        const tbody = document.getElementById('expenseBody');
        const rowCount = tbody.rows.length + 1;
        const newRow = document.createElement('tr');
        newRow.innerHTML = `
            <td>${rowCount}</td>
            <td><input type="text" class="item" value="${item}" required><span class="edit-icon" onclick="editExpense(${rowCount - 1})">✎</span><span class="delete-icon" onclick="deleteExpense(${rowCount - 1})">✖</span></td>
            <td><input type="number" class="cost" value="${cost}" required></td>
            <td><input type="date" class="date" value="${date}" required></td>
            <td><select class="payer" onchange="updatePayer(${rowCount - 1})" required>${families.map(f => `<option value="${f}" ${f === payer ? 'selected' : ''}>${f}</option>`).join('')}</select></td>
        `;
        tbody.appendChild(newRow);
        expenses.push({ item, cost, date, payer });
        participantsData.push(new Array(families.length).fill(0));
        saveData();
        updateFamilyTable();
        closePopup();
        alert('Hạng mục mới đã được thêm!');
    } else {
        alert('Vui lòng điền đầy đủ thông tin!');
    }
}

// Close popup
function closePopup() {
    const popup = document.getElementById('addExpensePopup');
    popup.style.display = 'none';
    document.getElementById('popupItem').value = '';
    document.getElementById('popupCost').value = '';
    document.getElementById('popupDate').value = '';
    document.getElementById('popupPayer').value = '';
}

// Add family
function addFamily() {
    const newFamily = prompt("Nhập tên gia đình mới:");
    if (newFamily && !families.includes(newFamily)) {
        families.push(newFamily);
        participantsData.forEach(data => data.push(0));
        updateFamilyTable();
        updateExpensePayers();
        updateResultTable();
        saveData();
    }
}

// Update family table
function updateFamilyTable() {
    const familyHead = document.getElementById('familyTableHead');
    const familyBody = document.getElementById('familyBody');

    if (!familyHead || !familyBody) {
        console.error('familyTableHead or familyBody element not found');
        return;
    }

    const headerRow = familyHead.rows[0];
    headerRow.innerHTML = '<th>Hạng mục</th>';
    families.forEach((family, index) => {
        const th = document.createElement('th');
        th.innerHTML = `${family}<span class="edit-icon" onclick="editFamily(${index})" style="display:${editMode.family ? 'inline' : 'none'};">✎</span><span class="delete-icon" onclick="deleteFamily(${index})" style="display:${editMode.family ? 'inline' : 'none'};">✖</span>`;
        headerRow.appendChild(th);
    });

    familyBody.innerHTML = '';
    expenses.forEach((expense, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${expense.item}</td>
            ${families.map((_, i) => {
                const participantCount = participantsData[index] ? participantsData[index][i] || 0 : 0;
                return `<td><input type="number" class="participants" value="${participantCount}" required></td>`;
            }).join('')}
        `;
        familyBody.appendChild(row);
    });
    saveData();
}

// Update payer select in expenses
function updateExpensePayers() {
    const expenseRows = document.querySelectorAll('#expenseBody tr');
    expenseRows.forEach((row, index) => {
        const select = row.querySelector('.payer');
        select.innerHTML = families.map(f => `<option value="${f}" ${f === expenses[index].payer ? 'selected' : ''}>${f}</option>`).join('');
    });
    updatePayerSelect();
}

function updatePayerSelect() {
    const select = document.getElementById('popupPayer');
    if (select) {
        select.innerHTML = families.map(f => `<option value="${f}">${f}</option>`).join('');
        select.value = families[0]; // Default to first family
    }
}

// Update payer value
function updatePayer(index) {
    const row = document.querySelectorAll('#expenseBody tr')[index];
    expenses[index].payer = row.querySelector('.payer').value;
    saveData();
}

// Update participant data
function updateParticipants() {
    const rows = document.querySelectorAll('#familyBody tr');
    participantsData = [];
    rows.forEach(row => {
        const participants = Array.from(row.querySelectorAll('.participants')).map(p => parseInt(p.value) || 0);
        participantsData.push(participants);
    });
    saveData();
    alert('Dữ liệu số người tham gia đã được lưu!');
}

// Update result table structure
function updateResultTable() {
    const resultHead = document.getElementById('resultTableHead');
    if (!resultHead) {
        console.error('resultTableHead element not found');
        return;
    }
    resultHead.rows[0].innerHTML = `
        <th>Hạng mục</th>
        <th>Tổng chi phí (VNĐ)</th>
        <th>Tổng người</th>
        <th>Số tiền/đầu người (VNĐ)</th>
        <th>Người đại diện chi tiền</th>
    `;
}

// Toggle edit mode
function toggleEditMode(type) {
    editMode[type] = !editMode[type];
    const button = document.querySelector(`#${type === 'expense' ? 'Tab1' : 'Tab2'} .setting-btn`);
    button.classList.toggle('selected', editMode[type]);
    const icons = document.querySelectorAll(`#${type === 'expense' ? 'expenseBody' : 'familyTableHead'} .edit-icon, #${type === 'expense' ? 'expenseBody' : 'familyTableHead'} .delete-icon`);
    icons.forEach(icon => {
        icon.style.display = editMode[type] ? 'inline' : 'none';
    });
    if (type === 'expense') {
        document.querySelectorAll('#expenseBody td').forEach(td => {
            td.style.position = editMode['expense'] ? 'relative' : 'static';
        });
    } else {
        document.querySelectorAll('#familyTableHead th').forEach(th => {
            th.style.position = editMode['family'] ? 'relative' : 'static';
        });
    }
}

// Edit expense
function editExpense(index) {
    const row = document.querySelectorAll('#expenseBody tr')[index];
    expenses[index] = {
        item: row.querySelector('.item').value,
        cost: parseInt(row.querySelector('.cost').value) || 0,
        date: row.querySelector('.date').value,
        payer: row.querySelector('.payer').value
    };
    saveData();
    updateFamilyTable();
}

// Delete expense
function deleteExpense(index) {
    if (confirm('Bạn có chắc muốn xóa hạng mục này?')) {
        expenses.splice(index, 1);
        participantsData.splice(index, 1);
        document.querySelectorAll('#expenseBody tr')[index].remove();
        document.querySelectorAll('#expenseBody tr').forEach((tr, i) => {
            tr.cells[0].textContent = i + 1;
        });
        saveData();
        updateFamilyTable();
    }
}

// Edit family
function editFamily(index) {
    const newName = prompt("Nhập tên mới cho gia đình:", families[index]);
    if (newName && newName !== families[index] && !families.includes(newName)) {
        const oldName = families[index];
        families[index] = newName;
        expenses.forEach(exp => {
            if (exp.payer === oldName) exp.payer = newName;
        });
        participantsData.forEach(data => {
            const value = data[index];
            data.splice(index, 1);
            data.push(value);
        });
        updateFamilyTable();
        updateExpensePayers();
        saveData();
    }
}

// Delete family
function deleteFamily(index) {
    if (confirm('Bạn có chắc muốn xóa gia đình này?')) {
        if (families.length > 1) {
            const familyToDelete = families[index];
            families.splice(index, 1);
            expenses.forEach(exp => {
                if (exp.payer === familyToDelete) exp.payer = families[0];
            });
            participantsData.forEach(data => data.splice(index, 1));
            updateFamilyTable();
            updateExpensePayers();
            saveData();
        } else {
            alert('Phải giữ ít nhất một gia đình!');
        }
    }
}

// Calculate and show results
function calculate() {
    const rows = document.querySelectorAll('#familyBody tr');
    const resultBody = document.getElementById('resultBody');
    const resultFooter = document.getElementById('resultFooter');
    resultBody.innerHTML = '';
    resultFooter.innerHTML = '';

    participantsData = [];
    let totalCost = 0;
    rows.forEach((row, index) => {
        const participants = Array.from(row.querySelectorAll('.participants')).map(p => parseInt(p.value) || 0);
        const totalPeople = participants.reduce((a, b) => a + b, 0);
        const perPerson = totalPeople > 0 ? Math.floor(expenses[index].cost / totalPeople) : 0;
        const resultRow = document.createElement('tr');
        resultRow.innerHTML = `
            <td>${expenses[index].item}</td>
            <td>${expenses[index].cost.toLocaleString('vi-VN')}</td>
            <td>${totalPeople}</td>
            <td>${perPerson.toLocaleString('vi-VN')}</td>
            <td>${expenses[index].payer}</td>
        `;
        resultBody.appendChild(resultRow);

        participantsData.push(participants);
        totalCost += expenses[index].cost;
    });

    const footerRow = document.createElement('tr');
    footerRow.innerHTML = `
        <td colspan="4">Tổng chi phí</td>
        <td>${totalCost.toLocaleString('vi-VN')} VNĐ</td>
    `;
    resultFooter.appendChild(footerRow);

    const summaryList = document.getElementById('summaryList');
    summaryList.innerHTML = '';
    const refundList = document.getElementById('refundList');
    refundList.innerHTML = '';

    const paidTotals = {};
    const shareTotals = {};
    families.forEach(family => {
        paidTotals[family] = 0;
        shareTotals[family] = 0;
    });

    expenses.forEach(exp => {
        paidTotals[exp.payer] = (paidTotals[exp.payer] || 0) + exp.cost;
    });

    resultsData = [];
    rows.forEach((row, index) => {
        const participants = Array.from(row.querySelectorAll('.participants')).map(p => parseInt(p.value) || 0);
        const totalPeople = participants.reduce((a, b) => a + b, 0);
        const perPerson = totalPeople > 0 ? Math.floor(expenses[index].cost / totalPeople) : 0;
        resultsData.push({ expense: expenses[index], totalPeople, perPerson });

        families.forEach((family, i) => {
            const share = participants[i] * perPerson;
            shareTotals[family] = (shareTotals[family] || 0) + share;
        });
    });

    const summaryTable = document.createElement('table');
    summaryTable.style.width = '100%';
    summaryTable.style.borderCollapse = 'collapse';
    summaryTable.innerHTML = `
        <thead>
            <tr>
                <th>Gia đình đã chi</th>
                <th>Số tiền</th>
                <th>Còn thiếu</th>
                <th>Hoàn lại</th>
            </tr>
        </thead>
        <tbody id="summaryBody"></tbody>
    `;
    summaryList.appendChild(summaryTable);

    const summaryBody = document.getElementById('summaryBody');
    let totalPaid = 0;
    let totalShared = 0;
    families.forEach(family => {
        const paid = paidTotals[family] || 0;
        const shared = shareTotals[family] || 0;
        const stillOwe = shared - paid;
        const refund = paid - shared;

        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${family}</td>
            <td>${paid.toLocaleString('vi-VN')} VNĐ</td>
            <td>${stillOwe > 0 ? stillOwe.toLocaleString('vi-VN') : '0'} VNĐ</td>
            <td>${refund > 0 ? refund.toLocaleString('vi-VN') : '0'} VNĐ</td>
        `;
        summaryBody.appendChild(row);

        totalPaid += paid;
        totalShared += shared;
    });

    const totalRow = document.createElement('tr');
    totalRow.innerHTML = `
        <td>Tổng cộng</td>
        <td>${totalPaid.toLocaleString('vi-VN')} VNĐ</td>
        <td>${(totalShared - totalPaid > 0 ? totalShared - totalPaid : 0).toLocaleString('vi-VN')} VNĐ</td>
        <td>${(totalPaid - totalShared > 0 ? totalPaid - totalShared : 0).toLocaleString('vi-VN')} VNĐ</td>
    `;
    summaryBody.appendChild(totalRow);

    refundList.innerHTML = '';

    openTab({ currentTarget: document.querySelector('.tablink:last-child') }, 'Tab3');
    saveData();
}

// Filter results by date range
function filterResults() {
    const startDate = new Date(document.getElementById('startDate').value);
    const endDate = new Date(document.getElementById('endDate').value);
    if (!startDate || !endDate || startDate > endDate) {
        alert('Vui lòng chọn khoảng thời gian hợp lệ!');
        return;
    }

    const resultBody = document.getElementById('resultBody');
    const resultFooter = document.getElementById('resultFooter');
    resultBody.innerHTML = '';
    resultFooter.innerHTML = '';

    const filteredResults = resultsData.filter(result => {
        const expenseDate = new Date(result.expense.date);
        return expenseDate >= startDate && expenseDate <= endDate;
    });

    const filteredIndices = resultsData.map((result, index) => {
        const expenseDate = new Date(result.expense.date);
        return expenseDate >= startDate && expenseDate <= endDate ? index : -1;
    }).filter(index => index !== -1);

    let totalCost = 0;
    filteredResults.forEach((result, idx) => {
        const originalIndex = filteredIndices[idx];
        const participants = participantsData[originalIndex];
        const resultRow = document.createElement('tr');
        resultRow.innerHTML = `
            <td>${result.expense.item}</td>
            <td>${result.expense.cost.toLocaleString('vi-VN')}</td>
            <td>${result.totalPeople}</td>
            <td>${result.perPerson.toLocaleString('vi-VN')}</td>
            <td>${result.expense.payer}</td>
        `;
        resultBody.appendChild(resultRow);
        totalCost += result.expense.cost;
    });

    const footerRow = document.createElement('tr');
    footerRow.innerHTML = `
        <td colspan="4">Tổng chi phí</td>
        <td>${totalCost.toLocaleString('vi-VN')} VNĐ</td>
    `;
    resultFooter.appendChild(footerRow);

    const summaryList = document.getElementById('summaryList');
    summaryList.innerHTML = '';
    const refundList = document.getElementById('refundList');
    refundList.innerHTML = '';

    const paidTotals = {};
    const shareTotals = {};
    families.forEach(family => {
        paidTotals[family] = 0;
        shareTotals[family] = 0;
    });

    filteredResults.forEach(result => {
        paidTotals[result.expense.payer] = (paidTotals[result.expense.payer] || 0) + result.expense.cost;
    });

    filteredResults.forEach((result, idx) => {
        const originalIndex = filteredIndices[idx];
        const participants = participantsData[originalIndex];
        families.forEach((family, i) => {
            const share = participants[i] * result.perPerson;
            shareTotals[family] = (shareTotals[family] || 0) + share;
        });
    });

    const summaryTable = document.createElement('table');
    summaryTable.style.width = '100%';
    summaryTable.style.borderCollapse = 'collapse';
    summaryTable.innerHTML = `
        <thead>
            <tr>
                <th>Gia đình đã chi</th>
                <th>Số tiền</th>
                <th>Còn thiếu</th>
                <th>Hoàn lại</th>
            </tr>
        </thead>
        <tbody id="summaryBody"></tbody>
    `;
    summaryList.appendChild(summaryTable);

    const summaryBody = document.getElementById('summaryBody');
    let totalPaid = 0;
    let totalShared = 0;
    families.forEach(family => {
        const paid = paidTotals[family] || 0;
        const shared = shareTotals[family] || 0;
        const stillOwe = shared - paid;
        const refund = paid - shared;

        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${family}</td>
            <td>${paid.toLocaleString('vi-VN')} VNĐ</td>
            <td>${stillOwe > 0 ? stillOwe.toLocaleString('vi-VN') : '0'} VNĐ</td>
            <td>${refund > 0 ? refund.toLocaleString('vi-VN') : '0'} VNĐ</td>
        `;
        summaryBody.appendChild(row);

        totalPaid += paid;
        totalShared += shared;
    });

    const totalRow = document.createElement('tr');
    totalRow.innerHTML = `
        <td>Tổng cộng</td>
        <td>${totalPaid.toLocaleString('vi-VN')} VNĐ</td>
        <td>${(totalShared - totalPaid > 0 ? totalShared - totalPaid : 0).toLocaleString('vi-VN')} VNĐ</td>
        <td>${(totalPaid - totalShared > 0 ? totalPaid - totalShared : 0).toLocaleString('vi-VN')} VNĐ</td>
    `;
    summaryBody.appendChild(totalRow);

    refundList.innerHTML = '';

    saveData();
}

// Reset data
function resetData() {
    if (confirm('Bạn có chắc muốn reset dữ liệu? Tất cả dữ liệu sẽ bị xóa!')) {
        families = [
            'Nhân', 'Minh', 'Phi', 'Hoài', 'An', 'Nam', 'Ngọc', 'Tuân', 'Quyên',
            'Nhuận', 'Thông', 'Tự', 'Khoa', 'Vinh'
        ];
        expenses = [
            { item: 'Ăn uống', cost: 4000000, date: '2025-05-15', payer: 'Nhân' },
            { item: 'đi nhà đèm', cost: 2000000, date: '2025-05-16', payer: 'Minh' },
            { item: 'hạng 1', cost: 3000000, date: '2025-05-16', payer: 'Phi' },
            { item: 'đánh bài', cost: 1500000, date: '2025-05-16', payer: 'Hoài' }
        ];
        participantsData = [
            [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
            [2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
            [2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
            [0, 2, 2, 2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2]
        ];
        resultsData = [];
        localStorage.clear();
        loadData();
        updateFamilyTable();
        updateResultTable();
        document.getElementById('resultBody').innerHTML = '';
        document.getElementById('summaryList').innerHTML = '';
        document.getElementById('refundList').innerHTML = '';
        alert('Dữ liệu đã được reset!');
    }
}

// Save data to localStorage
function saveData() {
    localStorage.setItem('expenses', JSON.stringify(expenses));
    localStorage.setItem('families', JSON.stringify(families));
    localStorage.setItem('participantsData', JSON.stringify(participantsData));
    localStorage.setItem('resultsData', JSON.stringify(resultsData));
}


// Initial load
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM fully loaded, running loadData');
    loadData();
    updatePayerSelect();
});
// Đổ danh sách gia đình vào select người chi trong Tab Thêm hạng mục
document.addEventListener('DOMContentLoaded', () => {
    const newPayerSelect = document.getElementById('newPayer');
    if (newPayerSelect && typeof families !== 'undefined') {
        newPayerSelect.innerHTML = families.map(f => `<option value="${f}">${f}</option>`).join('');
    }
});

function handleNewExpense(event) {
    event.preventDefault();

    const item = document.getElementById('newItem').value.trim();
    const cost = parseInt(document.getElementById('newCost').value);
    const payer = document.getElementById('newPayer').value;
    const datetime = document.getElementById('newDatetime').value;

    if (!item || isNaN(cost) || !payer || !datetime) {
        alert("Vui lòng điền đầy đủ thông tin!");
        return;
    }

    const date = datetime.split("T")[0];

    // Thêm mục mới
    expenses.push({ item, cost, date, payer });
    participantsData.push(new Array(families.length).fill(0));

    saveData();               // Lưu đúng từ biến JS
    updateFamilyTable();      
    updateExpensePayers();    
    updateResultTable();      
    loadData();               // Vẽ lại bảng ở Tab Mục chi tiêu

    document.getElementById('newExpenseForm').reset();
    alert("Hạng mục mới đã được thêm!");
}
window.addEventListener('DOMContentLoaded', () => {
    const now = new Date();
    const localISOTime = now.toISOString().slice(0, 16);
    const datetimeInput = document.getElementById('newDatetime');
    if (datetimeInput) {
        datetimeInput.value = localISOTime;
    }
});
