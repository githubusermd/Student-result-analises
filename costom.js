// ---------- Utilities ----------
    const $ = (q, s=document) => s.querySelector(q);
    const $$ = (q, s=document) => Array.from(s.querySelectorAll(q));

    const SCALE = [
      { min: 80, grade: 'A+', point: 5.0 },
      { min: 70, grade: 'A',  point: 4.0 },
      { min: 60, grade: 'A-', point: 3.5 },
      { min: 50, grade: 'B',  point: 3.0 },
      { min: 40, grade: 'C',  point: 2.0 },
      { min: 33, grade: 'D',  point: 1.0 },
      { min: 0,  grade: 'F',  point: 0.0 },
    ];

    function gradeFromMarks(m){
      for(const s of SCALE){ if(m >= s.min) return { grade: s.grade, point: s.point }; }
      return { grade: 'F', point: 0 };
    }

    function fmt(n, d=2){ return Number(n).toFixed(d); }

    function uid(){ return Math.random().toString(36).slice(2,9); }

    // ---------- Entry Table ----------
    const entryBody = $('#entry-body');

    function addRow(sub='', marks='', credit=''){
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td class="idx"></td>
        <td><input placeholder="Subject name" value="${sub}"/></td>
        <td><input type="number" min="0" max="100" placeholder="0-100" value="${marks}"/></td>
        <td><input type="number" min="0" step="0.5" placeholder="e.g., 3" value="${credit}"/></td>
        <td class="g">—</td>
        <td class="p">—</td>
        <td class="no-print"><button class="btn small danger btn-del">Del</button></td>
      `;
      entryBody.appendChild(tr);
      refreshIndex();
    }

    function refreshIndex(){
      $$('#entry-body tr').forEach((tr,i)=> tr.querySelector('.idx').textContent = i+1);
    }

    $('#btn-add-row').addEventListener('click', ()=> addRow());
    $('#btn-clear-rows').addEventListener('click', ()=> { entryBody.innerHTML=''; refreshIndex(); showKPI(0,0,0,'—'); $('#btn-save').disabled = true; $('#calc-preview').innerHTML = '<span class="note">সাবজেক্ট যোগ করে Calculate চাপুন…</span>'; });

    entryBody.addEventListener('click', e=>{
      if(e.target.classList.contains('btn-del')){
        e.target.closest('tr').remove();
        refreshIndex();
      }
    });

    // Seed sample rows
    addRow('Mathematics', 78, 3);
    addRow('Physics', 65, 3);
    addRow('English', 72, 2);

    // ---------- Calculation ----------
    function collectEntry(){
      const subjects = [];
      let anyInvalid = false;
      $$('#entry-body tr').forEach(tr=>{
        const [nameI, markI, credI] = tr.querySelectorAll('input');
        const name = nameI.value.trim();
        const marks = Number(markI.value);
        const credit = credI.value === '' ? null : Number(credI.value);
        if(!name || isNaN(marks) || marks<0 || marks>100){ anyInvalid = true; }
        const gp = gradeFromMarks(marks);
        tr.querySelector('.g').textContent = gp.grade;
        tr.querySelector('.p').textContent = gp.point.toFixed(2);
        subjects.push({ name, marks, credit, grade: gp.grade, point: gp.point });
      });
      return { subjects, anyInvalid };
    }

    function calcGPA(subjects){
      if(subjects.length===0) return { gpa: 0, total:0, avg:0, failed:false };
      let total = subjects.reduce((s,v)=> s + v.marks, 0);
      let avg = total / subjects.length;
      let failed = subjects.some(s=> s.point === 0);

      const hasCredits = subjects.every(s=> s.credit !== null && !isNaN(s.credit));
      let gpa = 0;
      if(hasCredits){
        let tw = subjects.reduce((s,v)=> s + (v.point * v.credit), 0);
        let cw = subjects.reduce((s,v)=> s + v.credit, 0);
        gpa = cw ? tw / cw : 0;
      } else {
        gpa = subjects.reduce((s,v)=> s + v.point, 0) / subjects.length;
      }
      return { gpa, total, avg, failed };
    }

    function showKPI(total, avg, gpa, status){
      $('#k-total').textContent = total;
      $('#k-avg').textContent = fmt(avg);
      $('#k-gpa').textContent = fmt(gpa);
      $('#k-status').innerHTML = status === '—' ? '—' : `<span class="badge ${status==='Pass'?'pass':'fail'}">${status}</span>`;
    }

    function renderPreview(meta, subjects, stats){
      const rows = subjects.map((s,i)=>`
        <tr>
          <td>${i+1}</td>
          <td>${s.name}</td>
          <td>${s.marks}</td>
          <td>${s.credit ?? '-'}</td>
          <td>${s.grade}</td>
          <td>${fmt(s.point)}</td>
        </tr>
      `).join('');

      const status = stats.failed ? '<span class="badge fail">Fail</span>' : '<span class="badge pass">Pass</span>';

      $('#calc-preview').innerHTML = `
        <div class="row" style="margin-top:8px;">
          <div class="grid-2">
            <div class="kpi">
              <div class="item"><div class="h">Name</div><div class="v">${meta.name || '—'}</div></div>
              <div class="item"><div class="h">Roll</div><div class="v">${meta.id || '—'}</div></div>
              <div class="item"><div class="h">Semester</div><div class="v">${meta.sem || '—'}</div></div>
              <div class="item"><div class="h">Section</div><div class="v">${meta.sec || '—'}</div></div>
            </div>
          </div>
          <div class="grid-2">
            <div class="kpi">
              <div class="item"><div class="h">Total</div><div class="v">${stats.total}</div></div>
              <div class="item"><div class="h">Average</div><div class="v">${fmt(stats.avg)}</div></div>
              <div class="item"><div class="h">GPA</div><div class="v">${fmt(stats.gpa)}</div></div>
              <div class="item"><div class="h">Status</div><div class="v">${status}</div></div>
            </div>
          </div>
        </div>
        <div style="overflow:auto;margin-top:10px;">
          <table>
            <thead>
              <tr>
                <th style="width:50px;">#</th>
                <th>Subject</th>
                <th style="width:110px;">Marks</th>
                <th style="width:90px;">Credit</th>
                <th style="width:90px;">Grade</th>
                <th style="width:90px;">Point</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
      `;
    }

    $('#btn-calc').addEventListener('click', ()=>{
      const meta = {
        name: $('#st-name').value.trim(), id: $('#st-id').value.trim(),
        sem: $('#st-sem').value.trim(), sec: $('#st-sec').value.trim()
      };
      const { subjects, anyInvalid } = collectEntry();
      if(subjects.length === 0){ alert('কমপক্ষে ১টি সাবজেক্ট যোগ করুন।'); return; }
      if(anyInvalid){ alert('সাবজেক্ট নাম/মার্কস সঠিকভাবে দিন (0-100)।'); return; }
      const stats = calcGPA(subjects);
      const status = stats.failed ? 'Fail' : 'Pass';
      showKPI(stats.total, stats.avg, stats.gpa, status);
      renderPreview(meta, subjects, stats);
      $('#btn-save').disabled = false;
      lastCalc = { id: uid(), meta, subjects, stats };
    });

    // ---------- Save to Class (LocalStorage) ----------
    let lastCalc = null;
    const KEY = 'sra_students_v1';

    function loadClass(){
      try { return JSON.parse(localStorage.getItem(KEY)) || []; }
      catch { return []; }
    }
    function saveClass(arr){ localStorage.setItem(KEY, JSON.stringify(arr)); }

    function recomputeRanks(list){
      // rank by GPA desc then total desc
      list.sort((a,b)=> (b.stats.gpa - a.stats.gpa) || (b.stats.total - a.stats.total));
      list.forEach((s,i)=> s.rank = i+1);
      return list;
    }

    function summarizeClass(list){
      const n = list.length || 0;
      const avgG = n ? (list.reduce((s,v)=> s + v.stats.gpa, 0)/n) : 0;
      const topper = list[0] ? `${list[0].meta.name} (${fmt(list[0].stats.gpa)})` : '—';
      // hardest subject: lowest average marks across all entries
      const subjMap = new Map();
      list.forEach(s=> s.subjects.forEach(x=>{
        if(!subjMap.has(x.name)) subjMap.set(x.name, []);
        subjMap.get(x.name).push(x.marks);
      }));
      let hard = '—', hardAvg = 101;
      subjMap.forEach((arr, name)=>{
        const a = arr.reduce((s,v)=> s+v,0)/arr.length;
        if(a < hardAvg){ hardAvg = a; hard = name; }
      });
      return { n, avgG, topper, hard };
    }

    function renderClass(list){
      const q = $('#search').value.trim().toLowerCase();
      const sort = $('#sortBy').value;
      let view = [...list];
      if(q){ view = view.filter(s=> `${s.meta.name} ${s.meta.id}`.toLowerCase().includes(q)); }
      if(sort==='name') view.sort((a,b)=> a.meta.name.localeCompare(b.meta.name));
      if(sort==='gpa') view.sort((a,b)=> b.stats.gpa - a.stats.gpa);
      if(sort==='total') view.sort((a,b)=> b.stats.total - a.stats.total);
      if(sort==='rank') view.sort((a,b)=> a.rank - b.rank);

      $('#class-body').innerHTML = view.map(s=>`
        <tr data-id="${s.id}">
          <td>${s.rank ?? '—'}</td>
          <td>${s.meta.name}</td>
          <td>${s.meta.id}</td>
          <td>${fmt(s.stats.gpa)}</td>
          <td>${s.stats.total}</td>
          <td>${s.stats.failed ? '<span class="badge fail">Fail</span>' : '<span class="badge pass">Pass</span>'}</td>
          <td class="no-print">
            <button class="btn small" data-act="view">View</button>
            <button class="btn small warn" data-act="edit">Edit</button>
            <button class="btn small danger" data-act="del">Delete</button>
          </td>
        </tr>
      `).join('');

      const { n, avgG, topper, hard } = summarizeClass(list);
      $('#m-stu').textContent = n;
      $('#m-gpa').textContent = fmt(avgG);
      $('#m-top').textContent = topper;
      $('#m-hard').textContent = hard;
    }

    $('#btn-save').addEventListener('click', ()=>{
      if(!lastCalc){ alert('আগে Calculate করুন।'); return; }
      const list = recomputeRanks([ lastCalc, ...loadClass() ]);
      saveClass(list);
      renderClass(list);
      alert('ক্লাস লিস্টে সেভ হয়েছে!');
      $('#btn-save').disabled = true;
    });

    // table actions
    $('#tbl-class').addEventListener('click', (e)=>{
      const btn = e.target.closest('button'); if(!btn) return;
      const tr = e.target.closest('tr'); const id = tr?.dataset.id; if(!id) return;
      let list = loadClass();
      const ix = list.findIndex(x=> x.id===id);
      if(ix<0) return;
      const act = btn.dataset.act;
      if(act==='del'){
        if(confirm('এই স্টুডেন্ট ডিলিট করবেন?')){
          list.splice(ix,1); list = recomputeRanks(list); saveClass(list); renderClass(list);
        }
      } else if(act==='view'){
        const s = list[ix]; lastCalc = s; renderPreview(s.meta, s.subjects, s.stats); showKPI(s.stats.total, s.stats.avg, s.stats.gpa, s.stats.failed?'Fail':'Pass');
        window.scrollTo({ top: $('#reportCard').offsetTop - 60, behavior: 'smooth' });
      } else if(act==='edit'){
        const s = list[ix]; // load into entry
        $('#st-name').value = s.meta.name; $('#st-id').value = s.meta.id; $('#st-sem').value = s.meta.sem; $('#st-sec').value = s.meta.sec;
        entryBody.innerHTML = '';
        s.subjects.forEach(x=> addRow(x.name, x.marks, x.credit ?? ''));
        lastCalc = null; $('#btn-save').disabled = true;
        window.scrollTo({ top: $('#entryCard').offsetTop - 60, behavior: 'smooth' });
      }
    });

    $('#search').addEventListener('input', ()=> renderClass(loadClass()));
    $('#sortBy').addEventListener('change', ()=> renderClass(loadClass()));

    // ---------- Export / Print / Reset ----------
    $('#btn-print').addEventListener('click', ()=> window.print());

    $('#btn-export-csv').addEventListener('click', ()=>{
      const list = loadClass();
      if(list.length===0){ alert('কোনো ডেটা নেই।'); return; }
      const rows = [
        ['Rank','Name','Roll','Semester','Section','GPA','Total','Status','Subjects'],
        ...list.map(s=> [ s.rank, s.meta.name, s.meta.id, s.meta.sem, s.meta.sec, fmt(s.stats.gpa), s.stats.total, s.stats.failed?'Fail':'Pass', s.subjects.map(x=> `${x.name}:${x.marks}`).join('|') ])
      ];
      const csv = rows.map(r=> r.map(v=> `"${String(v).replaceAll('"','""')}"`).join(',')).join('\n');
      const blob = new Blob([csv], {type:'text/csv;charset=utf-8;'});
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob); a.download = 'class_results.csv'; a.click(); URL.revokeObjectURL(a.href);
    });

    $('#btn-reset').addEventListener('click', ()=>{
      if(confirm('সকল সেভকৃত ডেটা মুছে ফেলবেন?')){
        localStorage.removeItem(KEY); renderClass([]);
      }
    });

    // ---------- Init ----------
    renderClass(loadClass());