(() => {
  'use strict';

  const SITE = {
    leasingEmail: 'leasing@shopsformiles.com'
  };

  // Replace these sample statuses and rates before public launch.
  const spaces = Array.from({ length: 28 }, (_, index) => {
    const number = index + 1;
    const status = [1, 2, 5, 8, 13, 17].includes(number)
      ? 'available'
      : [3, 9, 18, 24].includes(number)
        ? 'coming-soon'
        : 'leased';

    return {
      number,
      name: `Shop ${String(number).padStart(2, '0')}`,
      cluster: Math.ceil(number / 4),
      status,
      rate: status === 'available' ? 'Contact for rate' : status === 'coming-soon' ? 'Join waitlist' : 'Currently leased',
      details: ['2 garage bays', 'Private office', `Restroom group ${Math.ceil(number / 4)}`]
    };
  });

  const businesses = [
    { icon: 'fa-wrench', name: 'Your Plumbing Company', shop: 'Future tenant page', copy: 'Service area, emergency availability, specialties, hours, and customer contact information.', tags: ['Plumbing', 'Service', 'Contractor'] },
    { icon: 'fa-car-rear', name: 'Your Auto Business', shop: 'Future tenant page', copy: 'Repairs, detailing, restoration, storage, performance work, or collector-car services.', tags: ['Automotive', 'Storage', 'Detailing'] },
    { icon: 'fa-hammer', name: 'Your Trade Business', shop: 'Future tenant page', copy: 'Show customers what you do and give your business a professional home on the campus website.', tags: ['Trades', 'Fabrication', 'Local'] }
  ];

  const statusLabels = {
    'available': 'Available now',
    'coming-soon': 'Coming soon',
    'leased': 'Leased'
  };

  const cards = document.getElementById('spaceCards');
  const filter = document.getElementById('statusFilter');
  const spaceSelect = document.getElementById('space');

  const renderSpaces = (value = 'all') => {
    const filtered = spaces.filter(space => value === 'all' || space.status === value);
    cards.innerHTML = filtered.map(space => `
      <div class="col-md-6 col-xl-4">
        <article class="space-card">
          <div class="space-visual">
            <span class="status-badge status-${space.status}">${statusLabels[space.status]}</span>
            <i class="fa-solid fa-warehouse building-icon" aria-hidden="true"></i>
          </div>
          <div class="space-body">
            <div class="d-flex justify-content-between align-items-start gap-3">
              <div><p class="small text-uppercase text-muted fw-bold mb-1">Cluster ${space.cluster}</p><h3 class="h4 fw-bold mb-0">${space.name}</h3></div>
              <span class="small fw-bold text-nowrap">${space.rate}</span>
            </div>
            <div class="space-meta">
              <span><i class="fa-solid fa-door-open"></i>${space.details[0]}</span>
              <span><i class="fa-solid fa-briefcase"></i>${space.details[1]}</span>
              <span><i class="fa-solid fa-restroom"></i>${space.details[2]}</span>
              <span><i class="fa-solid fa-road"></i>Direct drive access</span>
            </div>
            <a class="btn btn-outline-dark rounded-pill w-100 ${space.status === 'leased' ? 'disabled' : ''}" href="#contact" ${space.status === 'leased' ? 'aria-disabled="true" tabindex="-1"' : `data-space="${space.name}"`}>
              ${space.status === 'available' ? 'Ask about this shop' : space.status === 'coming-soon' ? 'Join the waitlist' : 'Currently leased'}
            </a>
          </div>
        </article>
      </div>`).join('');

    cards.querySelectorAll('[data-space]').forEach(link => {
      link.addEventListener('click', () => { spaceSelect.value = link.dataset.space; });
    });
  };

  const populateSpaceSelect = () => {
    spaces.filter(space => space.status !== 'leased').forEach(space => {
      const option = document.createElement('option');
      option.value = space.name;
      option.textContent = `${space.name} — ${statusLabels[space.status]}`;
      spaceSelect.appendChild(option);
    });
  };

  const renderBusinesses = () => {
    document.getElementById('businessCards').innerHTML = businesses.map(business => `
      <div class="col-md-6 col-lg-4">
        <article class="business-card">
          <div class="d-flex gap-3 align-items-start mb-3">
            <div class="business-logo"><i class="fa-solid ${business.icon}"></i></div>
            <div><p class="small text-uppercase text-muted fw-bold mb-1">${business.shop}</p><h3 class="h5 fw-bold mb-0">${business.name}</h3></div>
          </div>
          <p class="text-secondary">${business.copy}</p>
          <div class="tags">${business.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}</div>
        </article>
      </div>`).join('');
  };

  const renderCampus = () => {
    const holder = document.getElementById('campusBuildings');
    const positions = [];

    // Top and bottom rows: 8 each.
    for (let i = 0; i < 8; i += 1) positions.push({ left: 8 + i * 11.9, top: 5, rotate: 0 });
    for (let i = 0; i < 8; i += 1) positions.push({ left: 8 + i * 11.9, top: 88, rotate: 0 });
    // Left and right columns: 6 each.
    for (let i = 0; i < 6; i += 1) positions.push({ left: 2, top: 20 + i * 12.2, rotate: 90 });
    for (let i = 0; i < 6; i += 1) positions.push({ left: 90, top: 20 + i * 12.2, rotate: 90 });

    holder.innerHTML = spaces.map((space, index) => {
      const p = positions[index];
      return `<button class="campus-building ${space.status}" style="left:${p.left}%;top:${p.top}%;transform:translate(-50%,-50%) rotate(${p.rotate}deg)" title="${space.name}: ${statusLabels[space.status]}" aria-label="${space.name}, ${statusLabels[space.status]}">${space.number}</button>`;
    }).join('');
  };

  filter.addEventListener('change', event => renderSpaces(event.target.value));

  document.getElementById('interestForm').addEventListener('submit', event => {
    event.preventDefault();
    const form = event.currentTarget;
    if (!form.checkValidity()) {
      form.classList.add('was-validated');
      return;
    }

    const data = new FormData(form);
    const subject = encodeURIComponent(`Shops for Miles interest — ${data.get('business')}`);
    const body = encodeURIComponent([
      `Name: ${data.get('name')}`,
      `Business / use: ${data.get('business')}`,
      `Email: ${data.get('email')}`,
      `Phone: ${data.get('phone') || 'Not provided'}`,
      `Timeline: ${data.get('timeline')}`,
      `Preferred shop: ${data.get('space') || 'Any available shop'}`,
      '',
      'Space needs:',
      data.get('message') || 'Not provided'
    ].join('\n'));

    window.location.href = `mailto:${SITE.leasingEmail}?subject=${subject}&body=${body}`;
    bootstrap.Toast.getOrCreateInstance(document.getElementById('formToast')).show();
  });

  const nav = document.getElementById('mainNav');
  const updateNav = () => nav.classList.toggle('scrolled', window.scrollY > 30);
  window.addEventListener('scroll', updateNav, { passive: true });
  updateNav();

  document.getElementById('year').textContent = new Date().getFullYear();
  populateSpaceSelect();
  renderSpaces();
  renderBusinesses();
  renderCampus();
})();
