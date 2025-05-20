let families = [];
let expenses = [];
let participantsData = [];
let resultsData = [];
let editMode = { expense: false, family: false };

const { createClient } = Supabase;
const supabaseUrl = 'https://your-project-id.supabase.co'; // Thay bằng URL của bạn
const supabaseKey = 'your-anon-key'; // Thay bằng Anon Key của bạn
const supabase = createClient(supabaseUrl, supabaseKey);

document.addEventListener('DOMContentLoaded', async () => {
    console.log('DOM fully loaded, running initial load');
    await loadFamiliesFromSupabase();
    await loadDataFromSupabase();
    updatePayerSelect();

    // Thêm realtime sync
    supabase
        .channel('expenses-channel')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'expenses' }, (payload) => {
            console.log('Dữ liệu chi tiêu thay đổi:', payload);
            loadDataFromSupabase();
        })
        .subscribe();

    supabase
        .channel('participants-channel')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'participants' }, (payload) => {
            console.log('Dữ liệu participants thay đổi:', payload);
            loadDataFromSupabase();
        })
        .subscribe();

    supabase
        .channel('families-channel')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'families' }, (payload) => {
            console.log('Dữ liệu gia đình thay đổi:', payload);
            loadFamiliesFromSupabase();
            loadDataFromSupabase();
        })
        .subscribe();

    // Đặt giá trị mặc định cho datetime
    const now = new Date();
    const localISOTime = now.toISOString().slice(0, 16);
    const datetimeInput = document.getElementById('newDatetime');
    if (datetimeInput) {
        datetimeInput.value = localISOTime;
    }
});

async function loadFamiliesFromSupabase() {
    const { data, error } = await supabase
        .from('families')
        .select('name')
        .order('id', { ascending: true });

    if (error) {
        console.error('Lỗi khi tải danh sách gia đình:', error);
        return;
    }

    families = data.map(item => item.name);
    updatePayerSelect();
}

async function loadDataFromSupabase() {
    const { data: expensesData, error: expensesError } = await supabase
        .from('expenses')
        .select('*')
        .order('created_at', { ascending: true });

    if (expensesError) {
        console.error('Lỗi khi tải dữ liệu chi tiêu:', expensesError);
        return;
    }

    expenses = expensesData || [];

    const { data: participantsDataRaw, error: participantsError } = await supabase
        .from('participants')
        .select('expense_id, participant_counts')
        .order('expense_id', { ascending: true });

    if (participantsError) {
        console.error('Lỗi khi tải dữ liệu participants:', participantsError);
        return;
    }

    participantsData = expenses.map(exp => {
        const participantEntry = participantsDataRaw.find(p => p.expense_id === exp.id);
        return participantEntry ? participantEntry.participant_counts : new Array(families.length).fill(0);
    });

    const expenseBody = document.getElementById('expenseBody');
    if (!expenseBody) {
        console.error('expenseBody element not found');
        return;
    }

    expenseBody.innerHTML = '';
    if (expenses.length === 0) {
        expenseBody.innerHTML = '<tr><td colspan="5">Chưa có hạng mục chi tiêu nào.</td></tr>';
    } else {
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
    }

    updateFamilyTable();
    updateResultTable();
}

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
        if (tabName === 'Tab2') {
            updateFamilyTable();
        }
    } else {
        console.error(`Tab with ID ${tabName} not found`);
    }
}

async function addFamily() {
    const newFamily = prompt("Nhập tên gia đình mới:");
    if (newFamily && !families.includes(newFamily)) {
        const { error } = await supabase
            .from('families')
            .insert([{ name: newFamily }]);

        if (error) {
            console.error('Lỗi khi thêm gia đình:', error);
            alert("Có lỗi xảy ra khi thêm gia đình!");
            return;
        }

        await loadFamiliesFromSupabase();
        participantsData.forEach(data => data.push(0));
        updateFamilyTable();
        updateExpensePayers();
        updateResultTable();
    }
}

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
    if (expenses.length === 0) {
        familyBody.innerHTML = '<tr><td colspan="' + (families.length + 1) + '">Chưa có hạng mục chi tiêu nào.</td></tr>';
    } else {
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
}

function updateExpensePayers() {
    const expenseRows = document.querySelectorAll('#expenseBody tr');
    expenseRows.forEach((row, index) => {
        const select = row.querySelector('.payer');
        select.innerHTML = families.map(f => `<option value="${f}" ${f === expenses[index].payer ? 'selected' : ''}>${f}</option>`).join('');
    });
    updatePayerSelect();
}

function updatePayerSelect() {
    const select = document.getElementById('newPayer');
    if (select) {
        select.innerHTML = families.map(f => `<option value="${f}">${f}</option>`).join('');
        select.value = families[0]; // Default to first family
    }
}

async function updatePayer(index) {
    const row = document.querySelectorAll('#expenseBody tr')[index];
    const updatedPayer = row.querySelector('.payer').value;

    const { error } = await supabase
        .from('expenses')
        .update({ payer: updatedPayer })
        .eq('id', expenses[index].id);

    if (error) {
        console.error('Lỗi khi cập nhật người chi:', error);
        alert("Có lỗi xảy ra khi cập nhật người chi!");
        return;
    }

    await loadDataFromSupabase();
}

async function updateParticipants() {
    const rows = document.querySelectorAll('#familyBody tr');
    participantsData = [];
    const updates = [];

    rows.forEach((row, index) => {
        const participants = Array.from(row.querySelectorAll('.participants')).map(p => parseInt(p.value) || 0);
        participantsData.push(participants);
        updates.push({
            expense_id: expenses[index].id,
            participant_counts: participants
        });
    });

    for (const update of updates) {
        const { error } = await supabase
            .from('participants')
            .upsert({ expense_id: update.expense_id, participant_counts: update.participant_counts });

        if (error) {
            console.error('Lỗi khi cập nhật participants:', error);
            alert("Có lỗi xảy ra khi cập nhật participants!");
            return;
        }
    }

    alert('Dữ liệu số người tham gia đã được lưu!');
}

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

async function editExpense(index) {
    const row = document.querySelectorAll('#expenseBody tr')[index];
    const updatedExpense = {
        item: row.querySelector('.item').value,
        cost: parseInt(row.querySelector('.cost').value) || 0,
        date: row.querySelector('.date').value,
        payer: row.querySelector('.payer').value
    };

    const { error } = await supabase
        .from('expenses')
        .update(updatedExpense)
        .eq('id', expenses[index].id);

    if (error) {
        console.error('Lỗi khi sửa dữ liệu:', error);
        alert("Có lỗi xảy ra khi sửa dữ liệu!");
        return;
    }

    await loadDataFromSupabase();
}

async function deleteExpense(index) {
    if (confirm('Bạn có chắc muốn xóa hạng mục này?')) {
        const { error } = await supabase
            .from('expenses')
            .delete()
            .eq('id', expenses[index].id);

        if (error) {
            console.error('Lỗi khi xóa dữ liệu:', error);
            alert("Có lỗi xảy ra khi xóa dữ liệu!");
            return;
        }

        await loadDataFromSupabase();
    }
}

async function editFamily(index) {
    const newName = prompt("Nhập tên mới cho gia đình:", families[index]);
    if (newName && newName !== families[index] && !families.includes(newName)) {
        const oldName = families[index];
        const { error: updateFamilyError } = await supabase
            .from('families')
            .update({ name: newName })
            .eq('name', oldName);

        if (updateFamilyError) {
            console.error('Lỗi khi sửa gia đình:', updateFamilyError);
            alert("Có lỗi xảy ra khi sửa gia đình!");
            return;
        }

        const { error: updateExpensesError } = await supabase
            .from('expenses')
            .update({ payer: newName })
            .eq('payer', oldName);

        if (updateExpensesError) {
            console.error('Lỗi khi cập nhật người chi:', updateExpensesError);
            alert("Có lỗi xảy ra khi cập nhật người chi!");
            return;
        }

        await loadFamiliesFromSupabase();
        await loadDataFromSupabase();
        updateFamilyTable();
        updateExpensePayers();
    }
}

async function deleteFamily(index) {
    if (confirm('Bạn có chắc muốn xóa gia đình này?')) {
        if (families.length > 1) {
            const familyToDelete = families[index];
            const { error: deleteFamilyError } = await supabase
                .from('families')
                .delete()
                .eq('name', familyToDelete);

            if (deleteFamilyError) {
                console.error('Lỗi khi xóa gia đình:', deleteFamilyError);
                alert("Có lỗi xảy ra khi xóa gia đình!");
                return;
            }

            const { error: updateExpensesError } = await supabase
                .from('expenses')
                .update({ payer: families[0] })
                .eq('payer', familyToDelete);

            if (updateExpensesError) {
                console.error('Lỗi khi cập nhật người chi:', updateExpensesError);
                alert("Có lỗi xảy ra khi cập nhật người chi!");
                return;
            }

            participantsData.forEach(data => data.splice(index, 1));
            await loadFamiliesFromSupabase();
            await loadDataFromSupabase();
            updateFamilyTable();
            updateExpensePayers();
        } else {
            alert('Phải giữ ít nhất một gia đình!');
        }
    }
}

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
}

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
}

async function resetData() {
    if (confirm('Bạn có chắc muốn reset dữ liệu? Tất cả dữ liệu sẽ bị xóa!')) {
        const { error } = await supabase
            .from('expenses')
            .delete()
            .neq('id', 0); // Xóa tất cả bản ghi

        if (error) {
            console.error('Lỗi khi reset dữ liệu:', error);
            alert("Có lỗi xảy ra khi reset dữ liệu!");
            return;
        }

        expenses = [];
        participantsData = [];
        resultsData = [];
        await loadDataFromSupabase();
        document.getElementById('resultBody').innerHTML = '';
        document.getElementById('summaryList').innerHTML = '';
        document.getElementById('refundList').innerHTML = '';
        alert('Dữ liệu đã được reset!');
    }
}