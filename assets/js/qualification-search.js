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
  const btnClose = modal?.querySelector('.modal__close');
  const openModal = (html) => {
    modalBody.innerHTML = html;
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  };
  const closeModal = () => {
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
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

  function renderCertificate(r) {
    const safe = (v) => v ?? '–';
    const year = r.year ?? (r.issueDate ? new Date(r.issueDate).getFullYear() : '');
    const director = r.director ?? 'Kim Nag Shin';
    const wm = r.watermark || './images/cert-watermark.png';

    return `
        <div class="certificate" id="certificate">
          <div class="certificate__ribbon" aria-hidden="true"></div>
          <div class="certificate__watermark" aria-hidden="true">
            <img src="${wm}" alt="">
          </div>

          <div class="certificate__header">
            <div class="certificate__brand">
              <div class="certificate__logo">
                <!-- 로고 이미지가 있으면 아래 주석 해제 -->
                <!-- <img src="./images/icqa-wordmark.png" alt="ICQA wordmark"> -->
                <span style="font: 900 12mm/1 'Playfair Display',serif; color: var(--cert-primary); letter-spacing:.02em;">ICQA</span>
              </div>
              <h3>INTERNATIONAL CIVIL QUALIFICATION ASSOCIATION</h3>
            </div>
          </div>

          <div class="certificate__body">
            <div class="certificate__title">CERTIFICATE OF ACHIEVEMENT</div>
            <div class="certificate__subtitle">THIS CERTIFICATE IS PROUDLY PRESENTED TO</div>
            <div class="certificate__name">${safe(r.name)}</div>

            <div class="certificate__grid">
              <div class="certificate__field">
                <div class="label">Student #</div>
                <div class="value">${safe(r.studentId)}</div>
              </div>
              <div class="certificate__field">
                <div class="label">Issue Date</div>
                <div class="value">${safe(r.issueDate)}</div>
              </div>
              <div class="certificate__field">
                <div class="label">Program</div>
                <div class="value">${safe(r.program)}</div>
              </div>
              <div class="certificate__field">
                <div class="label">Hours</div>
                <div class="value">${safe(r.hours)}</div>
              </div>
              <div class="certificate__field">
                <div class="label">Certificate Number</div>
                <div class="value">${safe(r.certificateId)}</div>
              </div>
              <div class="certificate__field">
                <div class="label">IQN</div>
                <div class="value">${safe(r.iqn)}</div>
              </div>
            </div>

            <div class="certificate__footer">
              <div class="certificate__sign">
                <div class="line"></div>
                <div class="label">${director}</div>
              </div>
              <div style="display:flex;align-items:center;gap:8mm" class="no-print">
                <button class="button ghost" id="btn-print">Print / Save PDF</button>
                <div class="certificate__seal">${safe(year)}</div>
              </div>
            </div>
          </div>
        </div>
      `;
  }

  function showCertificates(results) {
    let index = 0;
    function paint() {
      const html = `
        ${renderCertificate(results[index])}
        ${results.length > 1 ? `
          <div style="display:flex;justify-content:space-between;gap:.5rem;margin-top:.75rem" class="no-print">
            <button class="button" id="btn-prev" ${index === 0 ? 'disabled' : ''}>&larr; Prev</button>
            <div style="opacity:.8"> ${index + 1} / ${results.length} </div>
            <button class="button" id="btn-next" ${index === results.length - 1 ? 'disabled' : ''}>Next &rarr;</button>
          </div>` : ''
        }
      `;
      openModal(html);

      const btnPrint = document.getElementById('btn-print');
      btnPrint?.addEventListener('click', () => window.print());
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
