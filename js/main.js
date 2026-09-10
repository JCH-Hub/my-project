const CATEGORY_ALL = "전체";

function showTab(tabName) {
  document.getElementById("detail").hidden = true;
  document.querySelectorAll(".tab-button").forEach((button) => {
    const isActive = button.dataset.tab === tabName;
    button.classList.toggle("active", isActive);
    button.setAttribute("aria-selected", String(isActive));
  });

  document.querySelectorAll(".tab-panel").forEach((panel) => {
    panel.hidden = panel.dataset.panel !== tabName;
  });

  if (window.location.hash !== `#${tabName}`) {
    history.replaceState(null, "", `#${tabName}`);
  }
}

function showDetail(title, eyebrow, description, items, returnTab) {
  document.querySelectorAll(".tab-panel").forEach((panel) => { panel.hidden = true; });
  document.getElementById("detail").hidden = false;
  document.getElementById("detail-content").innerHTML = `
    <span class="detail-eyebrow">${eyebrow}</span>
    <h1>${title}</h1>
    <p class="detail-description">${description}</p>
    <ul class="detail-points">${items.map((item) => `<li>${item}</li>`).join("")}</ul>
    <div class="detail-actions">
      <a class="btn-primary" href="#support" data-tab-target="support">이 상품 상담하기</a>
    </div>
  `;
  document.getElementById("detail-back").onclick = () => showTab(returnTab);
  document.querySelector('.detail-actions [data-tab-target="support"]').addEventListener("click", () => showTab("support"));
  history.replaceState(null, "", `#detail-${returnTab}`);
}

async function loadProducts() {
  const res = await fetch("data/products.json");
  return res.json();
}

async function loadIndustries() {
  const res = await fetch("data/industries.json");
  return res.json();
}

function renderIndustries(industries) {
  const list = document.getElementById("industry-list");
  list.innerHTML = industries.map((industry) => `
    <button type="button" class="industry-card industry-select" data-industry-id="${industry.id}">
      <strong>${industry.name}</strong>
      <span>${industry.description}</span>
    </button>
  `).join("");

  const renderServices = (industry) => {
    document.querySelectorAll(".industry-select").forEach((button) => {
      button.classList.toggle("active", button.dataset.industryId === industry.id);
    });
    const services = document.getElementById("industry-services");
    services.innerHTML = `
      <h3>${industry.name} 상품 안내</h3>
      <p class="section-lead">${industry.description}</p>
      <div class="industry-service-grid">
        ${industry.services.map((service, index) => `
          <button type="button" class="industry-service-card" data-service-index="${index}">
            <strong>${service}</strong><span>상세 상품 설명 보기</span>
          </button>
        `).join("")}
      </div>
    `;
    services.querySelectorAll(".industry-service-card").forEach((card) => {
      card.addEventListener("click", () => {
        const service = industry.services[Number(card.dataset.serviceIndex)];
        showDetail(service, industry.name, `${industry.name} 사업장에 필요한 ${service} 관련 기업 솔루션입니다.`, [
          "사업장 규모와 운영 환경에 맞춘 구성 상담",
          "네트워크·통신·보안 상품 연계 가능",
          "설치 및 이용 조건은 상담을 통해 안내"
        ], "industries");
      });
    });
  };

  list.querySelectorAll(".industry-select").forEach((button) => {
    button.addEventListener("click", () => {
      renderServices(industries.find((industry) => industry.id === button.dataset.industryId));
    });
  });
  renderServices(industries[0]);
}

function renderFilters(products, activeCategory, onSelect) {
  const categories = [CATEGORY_ALL, ...new Set(products.map(p => p.category))];
  const el = document.getElementById("product-filters");
  el.innerHTML = "";
  categories.forEach(cat => {
    const btn = document.createElement("button");
    btn.textContent = cat;
    btn.className = cat === activeCategory ? "active" : "";
    btn.addEventListener("click", () => onSelect(cat));
    el.appendChild(btn);
  });
}

function cardHtml(p) {
  return `
    <a href="#detail" class="product-card ${p.status} detail-link" data-product-id="${p.id}">
      <span class="badge ${p.status}">${p.status === "active" ? "판매중" : "기존 가입자용"}</span>
      <h4>${p.name}</h4>
      <p>${p.description}</p>
      <div class="price">${p.price}</div>
    </a>
  `;
}

function renderProducts(products, activeCategory) {
  const list = document.getElementById("product-list");
  const filtered = activeCategory === CATEGORY_ALL
    ? products
    : products.filter(p => p.category === activeCategory);

  // 그룹 키: 전체보기는 대분류(category)로, 특정 카테고리 선택 시엔 소그룹(group)으로 묶는다.
  const groupKeyOf = (p) => activeCategory === CATEGORY_ALL ? p.category : (p.group || null);

  const order = [];
  const groups = new Map();
  filtered.forEach(p => {
    const key = groupKeyOf(p);
    if (!groups.has(key)) { groups.set(key, []); order.push(key); }
    groups.get(key).push(p);
  });

  list.innerHTML = order.map(key => `
    ${key ? `<h3 class="group-title">${key}</h3>` : ""}
    <div class="product-grid">
      ${groups.get(key).map(cardHtml).join("")}
    </div>
  `).join("");
  list.querySelectorAll(".product-card").forEach((card) => {
    const product = products.find((item) => item.id === card.dataset.productId);
    card.addEventListener("click", (event) => {
      event.preventDefault();
      showDetail(product.name, `${product.category} · ${product.group || "기업상품"}`, product.description, [
        `상태: ${product.status === "active" ? "신규 가입 가능" : "기존 가입자 유지"}`,
        `요금: ${product.price}`,
        "사업장 환경과 이용 목적에 맞춰 구성 상담"
      ], "products");
    });
  });
}

async function init() {
  try {
    const industries = await loadIndustries();
    renderIndustries(industries);
  } catch (err) {
    document.getElementById("industry-list").innerHTML =
      `<p class="loading">업종 정보를 불러오지 못했습니다.</p>`;
    console.error(err);
  }

  try {
    const products = await loadProducts();
    let activeCategory = CATEGORY_ALL;

    const update = (cat) => {
      activeCategory = cat;
      renderFilters(products, activeCategory, update);
      renderProducts(products, activeCategory);
    };

    update(CATEGORY_ALL);
  } catch (err) {
    document.getElementById("product-list").innerHTML =
      `<p class="loading">상품 정보를 불러오지 못했습니다. (로컬 서버로 실행했는지 확인해주세요)</p>`;
    console.error(err);
  }
}

document.querySelectorAll(".tab-button").forEach((button) => {
  button.addEventListener("click", () => showTab(button.dataset.tab));
});

document.querySelectorAll(".tab-link").forEach((link) => {
  link.addEventListener("click", () => {
    showTab(link.dataset.tabTarget);
    const interest = link.dataset.interest;
    const interestInput = document.querySelector('input[name="interest"]');
    if (interestInput && interest) interestInput.value = interest;
  });
});

const initialTab = ["industries", "products", "support"].includes(window.location.hash.slice(1))
  ? window.location.hash.slice(1)
  : "industries";
showTab(initialTab);

init();
