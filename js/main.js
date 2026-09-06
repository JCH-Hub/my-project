const CATEGORY_ALL = "전체";

async function loadProducts() {
  const res = await fetch("data/products.json");
  return res.json();
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
    <div class="product-card ${p.status}">
      <span class="badge ${p.status}">${p.status === "active" ? "판매중" : "기존 가입자용"}</span>
      <h4>${p.name}</h4>
      <p>${p.description}</p>
      <div class="price">${p.price}</div>
    </div>
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
}

async function init() {
  const products = await loadProducts();
  let activeCategory = CATEGORY_ALL;

  const update = (cat) => {
    activeCategory = cat;
    renderFilters(products, activeCategory, update);
    renderProducts(products, activeCategory);
  };

  update(CATEGORY_ALL);
}

init().catch(err => {
  document.getElementById("product-list").innerHTML =
    `<p class="loading">상품 정보를 불러오지 못했습니다. (로컬 서버로 실행했는지 확인해주세요)</p>`;
  console.error(err);
});

document.getElementById("contact-form").addEventListener("submit", (e) => {
  e.preventDefault();
  alert("상담 신청이 접수되었습니다. (실제 전송 로직은 아직 연결되지 않았습니다)");
  e.target.reset();
});
