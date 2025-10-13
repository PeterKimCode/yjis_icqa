(async function () {
  const FORM = document.getElementById('verify-form');
  if (!FORM) return;

  // 데이터 로딩
  let REGISTRY = [];
  try {
    const res = await fetch('./data/registry.json', { cache: 'no-store' });
    if (res.ok) REGISTRY = await res.json();
  } catch (_) {}

  // 모달 헬퍼(기존 있으면 재사용)
  const modal = document.getElementById('result-modal');
  const modalBody = document.getElementById('result-body');
  const modalActions = modal?.querySelector('.modal__actions');
  const HTML2CANVAS_SRC = 'https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js';
  let html2canvasPromise;
  const btnClose = modal?.querySelector('.modal__close');
  const openModal = (html, actionsHtml = '') => {
    if (modalBody) {
      modalBody.innerHTML = html;
      modalBody.scrollTop = 0;
    }
    if (modalActions) {
      modalActions.innerHTML = actionsHtml;
    }
    modal?.classList.add('is-open');
    modal?.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  };
  const closeModal = () => {
    modal?.classList.remove('is-open');
    modal?.setAttribute('aria-hidden', 'true');
    if (modalBody) modalBody.innerHTML = '';
    if (modalActions) modalActions.innerHTML = '';
    document.body.style.overflow = '';
  };
  btnClose?.addEventListener('click', closeModal);
  modal?.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
  });

  // 유틸 + 에러 헬퍼
  const norm = (s) => (s || '').toString().trim().toLowerCase();
  const setErr = (el, msg) => {
    const p = document.getElementById(el.id === 'field-iqn' ? 'err-iqn' : 'err-name');
    if (msg) {
      el.setAttribute('aria-invalid', 'true');
      p.textContent = msg;
      p.hidden = false;
    } else {
      el.removeAttribute('aria-invalid');
      p.textContent = '';
      p.hidden = true;
    }
  };
  const iqnOk = (v) => /^([a-z]{2,4}-?)?\d{3,}$/i.test(v); // 예시 규칙

  const loadHtml2Canvas = () => {
    if (window.html2canvas) return Promise.resolve(window.html2canvas);
    if (!html2canvasPromise) {
      html2canvasPromise = new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = HTML2CANVAS_SRC;
        script.async = true;
        script.onload = () => {
          if (window.html2canvas) {
            resolve(window.html2canvas);
          } else {
            html2canvasPromise = undefined;
            reject(new Error('html2canvas unavailable'));
          }
        };
        script.onerror = () => {
          html2canvasPromise = undefined;
          reject(new Error('Failed to load html2canvas'));
        };
        document.head.appendChild(script);
      });
    }
    return html2canvasPromise;
  };

  const toSafeFilename = (value, fallback = 'certificate') => {
    const base = (value ?? fallback).toString().trim() || fallback;
    return base.replace(/[\\/:*?"<>|]+/g, '_').replace(/\s+/g, '_');
  };

  async function exportCertificateAsPng(element, record) {
    const html2canvas = await loadHtml2Canvas();
    const canvas = await html2canvas(element, {
      scale: 2,
      backgroundColor: '#ffffff',
      useCORS: true,
      logging: false,
    });
    const link = document.createElement('a');
    const nameHint = record?.certificateId || record?.iqn || record?.name || 'certificate';
    link.download = `${toSafeFilename(nameHint)}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  }

  function renderCertificateFixedA4(r){
    const safe = (v)=> v ?? '–';
    const year = r.year ?? (r.issueDate ? new Date(r.issueDate).getFullYear() : '');
    const director = r.director ?? 'Kim Nag Shin';
    const signature = r.signature || './images/cert-signature.svg';
    const wm = r.watermark || './images/cert-watermark.png';

    return `
      <div class="cert-stage">
        <div class="cert-canvas" id="certificate">
          <div class="cert-wm" aria-hidden="true">
            <img src="${wm}" alt="">
          </div>

          <div class="cert-header">
            <div class="cert-brand">
              <div class="logo">
                <!-- <img src="./images/icqa-wordmark.png" alt="ICQA"> -->
                <span style="font:900 12mm/1 'Playfair Display',serif; color:#0ea5e9">ICQA</span>
              </div>
              <h3>INTERNATIONAL CIVIL QUALIFICATION ASSOCIATION</h3>
            </div>
          </div>

          <div class="cert-title">CERTIFICATE OF ACHIEVEMENT</div>
          <div class="cert-sub">THIS CERTIFICATE IS PROUDLY PRESENTED TO</div>
          <div class="cert-name">${safe(r.name)}</div>

          <div class="cert-grid">
            <div class="cert-field"><div class="label">Student #</div><div class="value">${safe(r.studentId)}</div></div>
            <div class="cert-field"><div class="label">Issue Date</div><div class="value">${safe(r.issueDate)}</div></div>
            <div class="cert-field"><div class="label">Program</div><div class="value">${safe(r.program)}</div></div>
            <div class="cert-field"><div class="label">Hours</div><div class="value">${safe(r.hours)}</div></div>
            <div class="cert-field"><div class="label">Certificate Number</div><div class="value">${safe(r.certificateId)}</div></div>
            <div class="cert-field"><div class="label">IQN</div><div class="value">${safe(r.iqn)}</div></div>
          </div>

          <div class="cert-footer">
            <div class="cert-sign">
              <div class="image" aria-hidden="true">
                <img src="${signature}" alt="">
              </div>
              <div class="line"></div>
              <div class="label">${safe(director)}</div>
            </div>
            <div class="cert-seal">${safe(year)}</div>
          </div>
        </div>
      </div>
    `;
  }

  function showCertificates(results){
    let index = 0;
    const buildActions = () => `
      <button class="button ghost" type="button" id="btn-print">Print</button>
      <button class="button ghost" type="button" id="btn-save">Save PNG</button>
    `;
    const buildNav = () => {
      if (results.length <= 1) return '';
      return `
        <div class="cert-nav no-print">
          <button class="button" id="btn-prev" ${index===0?'disabled':''}>&larr; Prev</button>
          <div class="cert-nav__count">${index+1} / ${results.length}</div>
          <button class="button" id="btn-next" ${index===results.length-1?'disabled':''}>Next &rarr;</button>
        </div>
      `;
    };
    function paint(){
      const record = results[index];
      const html = `
        ${renderCertificateFixedA4(record)}
        ${buildNav()}
      `;
      openModal(html, buildActions());

      document.getElementById('btn-print')?.addEventListener('click', () => window.print());

      const btnSave = document.getElementById('btn-save');
      btnSave?.addEventListener('click', async () => {
        if (!modalBody) return;
        const certEl = modalBody.querySelector('.cert-canvas');
        if (!certEl) return;
        const original = btnSave.textContent;
        btnSave.disabled = true;
        btnSave.textContent = 'Saving…';
        btnSave.setAttribute('aria-busy', 'true');
        try {
          await exportCertificateAsPng(certEl, record);
        } catch (err) {
          alert('Unable to save certificate image. Please try again.');
        } finally {
          btnSave.disabled = false;
          btnSave.textContent = original;
          btnSave.removeAttribute('aria-busy');
        }
      });

      document.getElementById('btn-prev')?.addEventListener('click', () => {
        index = Math.max(0, index - 1);
        paint();
      });
      document.getElementById('btn-next')?.addEventListener('click', () => {
        index = Math.min(results.length - 1, index + 1);
        paint();
      });
    }
    paint();
  }

  FORM.addEventListener('submit', function (e) {
    e.preventDefault();

    const iqnEl = document.getElementById('field-iqn');
    const nameEl = document.getElementById('field-name');
    const iqn = norm(iqnEl.value);
    const name = norm(nameEl.value);

    // ✅ 둘 다 필수
    if (!iqn || !name) {
      setErr(iqnEl, !iqn ? 'Enter IQN.' : '');
      setErr(nameEl, !name ? 'Enter Name.' : '');
      (!iqn ? iqnEl : nameEl).focus();
      return;
    }

    // IQN 형식 체크
    if (!iqnOk(iqn)) {
      setErr(iqnEl, 'Invalid IQN format. (ex: IQN-0001)');
      iqnEl.focus();
      return;
    }
    setErr(iqnEl, '');
    setErr(nameEl, '');

    // ✅ AND 매치(둘 다 부분일치해야 함)
    const results = REGISTRY.filter((row) => {
      const ri = norm(row.iqn);
      const rn = norm(row.name);
      return ri.includes(iqn) && rn.includes(name);
    });

    if (!results.length) {
      openModal('<p>No matching records for BOTH IQN and Name.</p>');
      return;
    }

    showCertificates(results);
  });
})();
