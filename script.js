let families = JSON.parse(localStorage.getItem('families')) || ['Nhà Nguyễn', 'Nhà Trần', 'Nhà Lê'];
let expenses = JSON.parse(localStorage.getItem('expenses')) || [{ item: 'Ăn uống', cost: 4000000, date: '2025-05-15', payer: 'Nhà Nguyễn' }];
let participantsData = JSON.parse(localStorage.getItem('participantsData')) || [];
let resultsData = JSON.parse(localStorage.getItem('resultsData')) || [];
let editMode = { expense: false, family: false };

// Load data from localStorage
function loadData() {
    try {
        const expenseBody = document.getElementById('expenseBody');
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
    document.getElementById(tabName).style.display = "block";
    event.currentTarget.className += " active";
    saveData();
}

// Add expense
function addExpense() {
    const tbody = document.getElementById('expenseBody');
    const newRow = document.createElement('tr');
    const rowCount = tbody.rows.length + 1;
    const today = new Date().toISOString().split('T')[0];
    newRow.innerHTML = `
        <td>${rowCount}</td>
        <td><input type="text" class="item" value="Hạng mục mới" required><span class="edit-icon" style="display:none;">✎</span><span class="delete-icon" style="display:none;">✖</span></td>
        <td><input type="number" class="cost" value="0" required></td>
        <td><input type="date" class="date" value="${today}" required></td>
        <td><select class="payer" onchange="updatePayer(${rowCount - 1})" required>${families.map(f => `<option value="${f}">${f}</option>`).join('')}</select></td>
    `;
    tbody.appendChild(newRow);
    expenses.push({ item: 'Hạng mục mới', cost: 0, date: today, payer: families[0] });
    updateFamilyTable();
    saveData();
}

// Add family
function addFamily() {
    const newFamily = prompt("Nhập tên gia đình mới (ví dụ: Nhà Phạm):");
    if (newFamily && !families.includes(newFamily)) {
        families.push(newFamily);
        updateFamilyTable();
        updateExpensePayers();
        updateResultTable();
        saveData();
    }
}

// Update family table
function updateFamilyTable() {
    const familyHead = document.getElementById('familyTableHead').rows[0];
    familyHead.innerHTML = '<th>Hạng mục</th>';
    families.forEach((family, index) => {
        const th = document.createElement('th');
        th.innerHTML = `${family}<span class="edit-icon" onclick="editFamily(${index})" style="display:none;">✎</span><span class="delete-icon" onclick="deleteFamily(${index})" style="display:none;">✖</span>`;
        familyHead.appendChild(th);
    });

    const familyBody = document.getElementById('familyBody');
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
}

// Update payer select in expenses
function updateExpensePayers() {
    const expenseRows = document.querySelectorAll('#expenseBody tr');
    expenseRows.forEach((row, index) => {
        const select = row.querySelector('.payer');
        select.innerHTML = families.map(f => `<option value="${f}" ${f === expenses[index].payer ? 'selected' : ''}>${f}</option>`).join('');
    });
}

// Update payer value
function updatePayer(index) {
    const row = document.querySelectorAll('#expenseBody tr')[index];
    expenses[index].payer = row.querySelector('.payer').value;
    saveData();
}

// Update result table structure
function updateResultTable() {
    const resultHead = document.getElementById('resultTableHead').rows[0];
    resultHead.innerHTML = `
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
        // Update STT
        document.querySelectorAll('#expenseBody tr').forEach((tr, i) => {
            tr.cells[0].textContent = i + 1;
        });
        updateFamilyTable();
        saveData();
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

    // Calculate paid totals
    expenses.forEach(exp => {
        paidTotals[exp.payer] = (paidTotals[exp.payer] || 0) + exp.cost;
    });

    // Calculate share totals
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

    // Display summary
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

    // Refund list (optional, can be removed if not needed)
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

    // Calculate paid totals for filtered results
    filteredResults.forEach(result => {
        paidTotals[result.expense.payer] = (paidTotals[result.expense.payer] || 0) + result.expense.cost;
    });

    // Calculate share totals for filtered results
    filteredResults.forEach((result, idx) => {
        const originalIndex = filteredIndices[idx];
        const participants = participantsData[originalIndex];
        families.forEach((family, i) => {
            const share = participants[i] * result.perPerson;
            shareTotals[family] = (shareTotals[family] || 0) + share;
        });
    });

    // Display summary
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

    // Refund list (optional, can be removed if not needed)
    refundList.innerHTML = '';

    saveData();
}

// Reset data
function resetData() {
    if (confirm('Bạn có chắc muốn reset dữ liệu? Tất cả dữ liệu sẽ bị xóa!')) {
        families = ['Nhà Nguyễn', 'Nhà Trần', 'Nhà Lê'];
        expenses = [{ item: 'Ăn uống', cost: 4000000, date: '2025-05-15', payer: 'Nhà Nguyễn' }];
        participantsData = [];
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
    expenses = Array.from(document.querySelectorAll('#expenseBody tr')).map(row => ({
        item: row.querySelector('.item').value,
        cost: parseInt(row.querySelector('.cost').value) || 0,
        date: row.querySelector('.date').value,
        payer: row.querySelector('.payer').value
    }));
    localStorage.setItem('expenses', JSON.stringify(expenses));
    localStorage.setItem('families', JSON.stringify(families));
    localStorage.setItem('participantsData', JSON.stringify(participantsData));
    localStorage.setItem('resultsData', JSON.stringify(resultsData));
}

// Initial load
document.addEventListener('DOMContentLoaded', loadData);