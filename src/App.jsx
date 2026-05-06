import { useState, useEffect, useMemo } from 'react';
import './index.css';

const API_URL = 'https://api.freeapi.app/api/v1/public/meals';

function getIngredients(meal) {
  const list = [];
  for (let i = 1; i <= 20; i++) {
    const ing = meal[`strIngredient${i}`];
    const measure = meal[`strMeasure${i}`];
    if (ing && ing.trim()) list.push({ ingredient: ing.trim(), measure: measure?.trim() || '' });
  }
  return list;
}

function App() {
  const [meals, setMeals] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [selectedMeal, setSelectedMeal] = useState(null);
  const [scrolled, setScrolled] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem('meals-theme') || 'light');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('meals-theme', theme);
  }, [theme]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const fetchMeals = async (p) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}?page=${p}&limit=9`);
      const json = await res.json();
      if (!json.success) throw new Error(json.message || 'Failed to fetch');
      setMeals(json.data.data);
      setTotalPages(json.data.totalPages);
      setTotalItems(json.data.totalItems);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchMeals(page); }, [page]);

  const categories = useMemo(() => {
    const set = new Set(meals.map(m => m.strCategory).filter(Boolean));
    return ['all', ...Array.from(set).sort()];
  }, [meals]);

  const filtered = useMemo(() => {
    return meals.filter((m) => {
      const q = search.toLowerCase();
      const matchesSearch = !q || m.strMeal.toLowerCase().includes(q) || m.strArea?.toLowerCase().includes(q) || m.strCategory?.toLowerCase().includes(q);
      const matchesCat = categoryFilter === 'all' || m.strCategory === categoryFilter;
      return matchesSearch && matchesCat;
    });
  }, [meals, search, categoryFilter]);

  const pageNumbers = useMemo(() => {
    const pages = [];
    let start = Math.max(1, page - 2);
    let end = Math.min(totalPages, page + 2);
    if (end - start < 4) {
      if (start === 1) end = Math.min(totalPages, start + 4);
      else start = Math.max(1, end - 4);
    }
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  }, [page, totalPages]);

  return (
    <>
      <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
        <div className="nav-brand">TastyBites<span>Meals & Recipes</span></div>
        <div className="nav-right">
          <span className="nav-stats">{totalItems} recipes</span>
          <button className="theme-toggle" onClick={() => setTheme(t => t === 'light' ? 'dark' : 'light')} aria-label="Toggle theme">
            {theme === 'light' ? (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
            )}
          </button>
        </div>
      </nav>

      <section className="hero">
        <h1>Taste <span className="script">the</span> Sweetness</h1>
        <p>Handcrafted delights for every occasion. Explore meals and recipes from around the world.</p>
      </section>

      <div className="controls">
        <div className="search-box">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" x2="16.65" y1="21" y2="16.65"/></svg>
          <input type="text" placeholder="Search meals, cuisine, or category..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select className="category-select" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
          {categories.map(c => <option key={c} value={c}>{c === 'all' ? 'All Categories' : c}</option>)}
        </select>
      </div>

      {isLoading && (
        <div className="loading-container">
          <div className="spinner"></div>
          <span>Loading recipes...</span>
        </div>
      )}

      {error && (
        <div className="empty-state">
          <h2>Something went wrong</h2>
          <p>{error}</p>
          <button className="retry-btn" onClick={() => fetchMeals(page)}>Try Again</button>
        </div>
      )}

      {!isLoading && !error && (
        <>
          <div className="meals-grid">
            {filtered.map((meal) => (
              <MealCard key={meal.id} meal={meal} onSelect={() => setSelectedMeal(meal)} />
            ))}
            {filtered.length === 0 && (
              <div className="empty-state">
                <h2>No meals found</h2>
                <p>Try adjusting your search or category filter.</p>
              </div>
            )}
          </div>

          <div className="pagination">
            <button className="page-btn" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
            </button>
            {pageNumbers.map((n) => (
              <button key={n} className={`page-btn ${n === page ? 'active' : ''}`} onClick={() => setPage(n)}>{n}</button>
            ))}
            <button className="page-btn" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
          </div>
        </>
      )}

      {selectedMeal && <MealModal meal={selectedMeal} onClose={() => setSelectedMeal(null)} />}
    </>
  );
}

function MealCard({ meal, onSelect }) {
  const tags = meal.strTags ? meal.strTags.split(',').map(t => t.trim()).filter(Boolean).slice(0, 3) : [];

  return (
    <div className="meal-card" onClick={onSelect}>
      <div className="card-img-wrap">
        <img src={meal.strMealThumb} alt={meal.strMeal} loading="lazy" />
        {meal.strArea && <span className="card-area-badge">{meal.strArea}</span>}
      </div>
      <div className="card-content">
        {meal.strCategory && <div className="card-category">{meal.strCategory}</div>}
        <div className="card-title">{meal.strMeal}</div>
        {tags.length > 0 && (
          <div className="card-tags">
            {tags.map(t => <span key={t} className="card-tag">{t}</span>)}
          </div>
        )}
        <button className="card-btn" onClick={(e) => { e.stopPropagation(); onSelect(); }}>
          View Details
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
        </button>
      </div>
    </div>
  );
}

function MealModal({ meal, onClose }) {
  const ingredients = getIngredients(meal);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
  }, [onClose]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <img className="modal-img" src={meal.strMealThumb} alt={meal.strMeal} />
          <button className="modal-close" onClick={onClose}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" x2="6" y1="6" y2="18"/><line x1="6" x2="18" y1="6" y2="18"/></svg>
          </button>
        </div>
        <div className="modal-body">
          <div className="modal-meta">
            {meal.strCategory && <span className="modal-badge">{meal.strCategory}</span>}
            {meal.strArea && <span className="modal-badge modal-badge-area">{meal.strArea}</span>}
          </div>
          <h2 className="modal-title">{meal.strMeal}</h2>

          {ingredients.length > 0 && (
            <>
              <div className="modal-section-title">Ingredients</div>
              <div className="ingredients-grid">
                {ingredients.map((item, i) => (
                  <div key={i} className="ingredient-item">
                    <span className="dot"></span>
                    <strong>{item.ingredient}</strong>
                    {item.measure && <span>— {item.measure}</span>}
                  </div>
                ))}
              </div>
            </>
          )}

          <div className="modal-section-title">Instructions</div>
          <p className="modal-instructions">{meal.strInstructions}</p>

          {meal.strYoutube && (
            <a className="modal-youtube" href={meal.strYoutube} target="_blank" rel="noopener noreferrer">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>
              Watch on YouTube
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
