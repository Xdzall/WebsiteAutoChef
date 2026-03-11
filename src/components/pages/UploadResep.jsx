import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import "./UploadResep.css";
import { Plus, X, Save, Activity, ChefHat, LogOut, UtensilsCrossed } from "lucide-react";

const UploadResep = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem("token"));
  const [loginEmail, setLoginEmail]       = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError]       = useState("");
  const [isLoggingIn, setIsLoggingIn]     = useState(false);

  const [formMode, setFormMode]             = useState(id ? "update" : "create");
  const [allRecipes, setAllRecipes]         = useState([]);
  const [selectedRecipeId, setSelectedRecipeId] = useState(id || "");

  const [name, setName]             = useState("");
  const [cookingTime, setCookingTime] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [countryId, setCountryId]   = useState("");
  const [image, setImage]           = useState(null);
  const [preview, setPreview]       = useState(null);

  const [isNewCategoryMode, setIsNewCategoryMode] = useState(false);
  const [newCategory, setNewCategory]             = useState("");
  const [isNewCountryMode, setIsNewCountryMode]   = useState(false);
  const [newCountry, setNewCountry]               = useState("");

  const [categories, setCategories]       = useState([]);
  const [countries, setCountries]         = useState([]);
  const [allIngredients, setAllIngredients] = useState([]);
  const [allUnits, setAllUnits]           = useState([]);

  const [showModal, setShowModal]   = useState(false);
  const [modalType, setModalType]   = useState("");
  const [newIngredientName, setNewIngredientName] = useState("");
  const [newUnitData, setNewUnitData] = useState({
    name_unit: "", abbreviation: "", type_unit: "mass", conversion_to_grams: ""
  });

  const [selectedIngredientIdForNutrition, setSelectedIngredientIdForNutrition] = useState(null);
  const [nutritionData, setNutritionData] = useState({
    calories: "", protein_grams: "", carbohydrates_grams: "", fats_grams: "", fiber_grams: "", weight_per_piece: ""
  });

  const [ingredientsList, setIngredientsList] = useState([
    { ingredient_id: "", amount: "", unit_id: "", notes: "" }
  ]);
  const [stepsList, setStepsList]   = useState([""]);
  const [loading, setLoading]       = useState(false);
  const [message, setMessage]       = useState("");

  const resetForm = () => {
    setName(""); setCookingTime(""); setCategoryId(""); setCountryId("");
    setIsNewCategoryMode(false); setNewCategory("");
    setIsNewCountryMode(false);  setNewCountry("");
    setImage(null); setPreview(null);
    setIngredientsList([{ ingredient_id: "", amount: "", unit_id: "", notes: "" }]);
    setStepsList([""]);
    setSelectedRecipeId("");
    setMessage("");
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setLoginError("");
    try {
      const response = await axios.post("http://100.120.18.38:8080/api/login", {
        email: loginEmail, password: loginPassword,
      });
      const token = response.data.token || response.data.access_token;
      if (token) {
        localStorage.setItem("token", token);
        setIsAuthenticated(true);
      } else {
        setLoginError("Login berhasil tapi token tidak ditemukan dari server.");
      }
    } catch (error) {
      setLoginError("Login gagal! Pastikan Email dan Password benar.");
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    setIsAuthenticated(false);
    resetForm();
  };

  const fetchData = async () => {
    try {
      const token   = localStorage.getItem("token");
      const headers = { "ngrok-skip-browser-warning": "true", Authorization: `Bearer ${token}` };
      const baseUrl = "http://100.120.18.38:8080/api";
      const [catRes, countryRes, ingRes, unitRes, recipeRes] = await Promise.all([
        axios.get(`${baseUrl}/categories`,   { headers }),
        axios.get(`${baseUrl}/countries`,    { headers }),
        axios.get(`${baseUrl}/ingredients`,  { headers }),
        axios.get(`${baseUrl}/units`,        { headers }),
        axios.get(`${baseUrl}/recipes-list`, { headers }),
      ]);
      if (Array.isArray(catRes.data))     setCategories(catRes.data);
      if (Array.isArray(countryRes.data)) setCountries(countryRes.data);
      if (Array.isArray(ingRes.data))     setAllIngredients(ingRes.data);
      if (Array.isArray(unitRes.data))    setAllUnits(unitRes.data);
      if (recipeRes.data && Array.isArray(recipeRes.data.data)) setAllRecipes(recipeRes.data.data);
    } catch (error) {
      console.error("Gagal load data master:", error);
    }
  };

  useEffect(() => { if (isAuthenticated) fetchData(); }, [isAuthenticated]);

  useEffect(() => {
    if (formMode === "update" && selectedRecipeId !== "") {
      const fetchRecipeDetails = async () => {
        try {
          const token   = localStorage.getItem("token");
          const headers = { "ngrok-skip-browser-warning": "true", Authorization: `Bearer ${token}` };
          const { data } = await axios.get(`http://100.120.18.38:8080/api/recipes/${selectedRecipeId}`, { headers });
          const r = data.data;
          setName(r.nama_resep || "");
          setCookingTime(r.waktu_masak || "");
          setCategoryId(r.kategori || "");
          setCountryId(r.country_id || r.negara_id || r.negara || "");
          if (r.url_gambar) setPreview(r.url_gambar);
          setIngredientsList(r.bahan?.length
            ? r.bahan.map(b => ({ ingredient_id: b.id_bahan, amount: b.detail_bahan.jumlah, unit_id: b.detail_bahan.unit_id, notes: b.detail_bahan.catatan || "" }))
            : [{ ingredient_id: "", amount: "", unit_id: "", notes: "" }]);
          setStepsList(r.langkah_langkah?.length
            ? r.langkah_langkah.map(l => l.instruksi)
            : [""]);
        } catch (error) {
          console.error("Gagal mengambil data resep:", error);
        }
      };
      fetchRecipeDetails();
    }
  }, [formMode, selectedRecipeId]);

  const openModal = (type) => {
    setModalType(type); setShowModal(true);
    setNewIngredientName("");
    setNewUnitData({ name_unit: "", abbreviation: "", type_unit: "mass", conversion_to_grams: "" });
    setNutritionData({ calories: "", protein_grams: "", carbohydrates_grams: "", fats_grams: "", fiber_grams: "" });
  };

  const handleOpenNutritionModal = (ingredientId) => {
    const selected = allIngredients.find(i => i.id === parseInt(ingredientId));
    if (selected?.nutrition) {
      setNutritionData({
        calories:             selected.nutrition.calories             || "",
        protein_grams:        selected.nutrition.protein_grams        || "",
        carbohydrates_grams:  selected.nutrition.carbohydrates_grams  || "",
        fats_grams:           selected.nutrition.fats_grams           || "",
        fiber_grams:          selected.nutrition.fiber_grams          || "",
        weight_per_piece:     selected.nutrition.weight_per_piece     || "",
      });
    } else {
      setNutritionData({ calories: "", protein_grams: "", carbohydrates_grams: "", fats_grams: "", fiber_grams: "", weight_per_piece: "" });
    }
    setSelectedIngredientIdForNutrition(ingredientId);
    setModalType('nutrition');
    setShowModal(true);
  };

  const handleSaveMasterData = async () => {
    const token  = localStorage.getItem("token");
    const config = { headers: { Authorization: `Bearer ${token}` } };
    const baseUrl = "http://100.120.18.38:8080/api";
    try {
      if (modalType === 'ingredient') {
        const res = await axios.post(`${baseUrl}/ingredients`, { name_ingredients: newIngredientName }, config);
        if (nutritionData.calories !== "")
          await axios.post(`${baseUrl}/ingredients/${res.data.data.id}/nutrition`, nutritionData, config);
        alert("Bahan berhasil ditambahkan!");
      } else if (modalType === 'unit') {
        await axios.post(`${baseUrl}/units`, newUnitData, config);
        alert("Unit berhasil ditambahkan!");
      } else if (modalType === 'nutrition') {
        await axios.post(`${baseUrl}/ingredients/${selectedIngredientIdForNutrition}/nutrition`, nutritionData, config);
        alert("Nutrisi berhasil diperbarui!");
      }
      fetchData();
      setShowModal(false);
    } catch (error) {
      console.error("Gagal simpan master data:", error);
      alert("Gagal menyimpan. Cek kembali koneksi atau data.");
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    setImage(file);
    if (file) setPreview(URL.createObjectURL(file));
  };

  const handleIngredientChange = (index, field, value) => {
    const n = [...ingredientsList]; n[index][field] = value; setIngredientsList(n);
  };
  const addIngredientRow    = () => setIngredientsList([...ingredientsList, { ingredient_id: "", amount: "", unit_id: "", notes: "" }]);
  const removeIngredientRow = (i) => setIngredientsList(ingredientsList.filter((_, idx) => idx !== i));

  const handleStepChange = (i, value) => {
    const n = [...stepsList]; n[i] = value; setStepsList(n);
  };
  const addStepRow    = () => setStepsList([...stepsList, ""]);
  const removeStepRow = (i) => setStepsList(stepsList.filter((_, idx) => idx !== i));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formMode === "update" && !selectedRecipeId) {
      alert("Pilih resep yang ingin diupdate terlebih dahulu!"); return;
    }
    setLoading(true); setMessage("");
    const isEdit   = formMode === "update" && selectedRecipeId !== "";
    const formData = new FormData();
    if (isEdit) formData.append("_method", "PUT");
    formData.append("name_recipe",            name);
    formData.append("cooking_time_minutes",   cookingTime);
    if (isNewCategoryMode) formData.append("new_category", newCategory);
    else                   formData.append("category_id",  categoryId);
    if (isNewCountryMode) formData.append("new_country", newCountry);
    else                  formData.append("country_id",  countryId);
    if (image) formData.append("image", image);
    formData.append("ingredients", JSON.stringify(ingredientsList));
    formData.append("steps",       JSON.stringify(stepsList));
    try {
      const token = localStorage.getItem("token");
      const url   = isEdit
        ? `http://100.120.18.38:8080/api/recipes/${selectedRecipeId}`
        : `http://100.120.18.38:8080/api/recipes`;
      await axios.post(url, formData, {
        headers: { "Content-Type": "multipart/form-data", Authorization: `Bearer ${token}` }
      });
      setMessage(isEdit ? "✅ Resep berhasil diperbarui!" : "✅ Resep berhasil disimpan!");
      if (!isEdit) resetForm();
      fetchData();
    } catch (error) {
      console.error("Error upload:", error);
      setMessage("❌ Gagal menyimpan resep. Cek data input.");
    } finally {
      setLoading(false);
    }
  };

  /* ─── LOGIN PAGE ─────────────────────────────── */
  if (!isAuthenticated) {
    return (
      <div className="input-bahan-container" style={{ justifyContent: 'center' }}>
        <div className="login-card">
          <div className="login-logo">Auto<span>Chef</span> 🍳</div>
          <p className="login-subtitle">Masuk ke panel admin untuk mengelola resep</p>

          {loginError && <div className="login-error">{loginError}</div>}

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label>Email Admin</label>
              <input type="email" value={loginEmail}
                onChange={e => setLoginEmail(e.target.value)} required placeholder="admin@autochef.id" />
            </div>
            <div>
              <label>Password</label>
              <input type="password" value={loginPassword}
                onChange={e => setLoginPassword(e.target.value)} required placeholder="••••••••" />
            </div>
            <button type="submit" className="search-button" disabled={isLoggingIn} style={{ marginTop: '8px' }}>
              {isLoggingIn ? "Memeriksa..." : "Masuk ke Dashboard"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  /* ─── MAIN FORM ──────────────────────────────── */
  return (
    <div className="input-bahan-container">
      <div className="input-box">

        {/* Header */}
        <div className="page-header">
          <div className="page-header-left">
            <span className="page-badge"><ChefHat size={11} /> Admin Panel</span>
            <h2>Kelola <span>Resep</span></h2>
          </div>
          <button className="logout-btn" onClick={handleLogout}>
            <LogOut size={13} style={{ marginRight: 5, verticalAlign: 'middle' }} />
            Logout
          </button>
        </div>

        {/* Mode Toggle */}
        <div className="mode-toggle-bar" style={{ marginBottom: '24px' }}>
          <label>
            <input type="radio" checked={formMode === "create"} onChange={() => { setFormMode("create"); resetForm(); }} />
            <Plus size={13} /> Buat Baru
          </label>
          <label>
            <input type="radio" checked={formMode === "update"} onChange={() => setFormMode("update")} />
            <Save size={13} /> Update Resep
          </label>
        </div>

        {/* Status Message */}
        {message && (
          <div className={`status-message ${message.includes("Gagal") || message.includes("❌") ? "error" : "success"}`}
            style={{ marginBottom: '20px' }}>
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>

          {/* Update Dropdown */}
          {formMode === "update" && (
            <div className="update-recipe-panel">
              <label>Pilih Resep yang akan diedit</label>
              <select value={selectedRecipeId} onChange={e => setSelectedRecipeId(e.target.value)}>
                <option value="">— Pilih Resep —</option>
                {allRecipes.map(r => <option key={r.id} value={r.id}>{r.nama_resep}</option>)}
              </select>
            </div>
          )}

          {/* Nama Resep */}
          <div>
            <label>Nama Resep</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)}
              required placeholder="Cth: Nasi Goreng Spesial" />
          </div>

          {/* Category + Country */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label style={{ margin: 0 }}>Kategori</label>
                <span className="new-mode-toggle" onClick={() => setIsNewCategoryMode(!isNewCategoryMode)}>
                  {isNewCategoryMode ? "← Pilih Lama" : "+ Buat Baru"}
                </span>
              </div>
              {isNewCategoryMode
                ? <input type="text" value={newCategory} onChange={e => setNewCategory(e.target.value)} placeholder="Nama kategori baru" />
                : <select value={categoryId} onChange={e => setCategoryId(e.target.value)}>
                    <option value="">— Pilih —</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name_category}</option>)}
                  </select>
              }
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label style={{ margin: 0 }}>Negara Asal</label>
                <span className="new-mode-toggle" onClick={() => setIsNewCountryMode(!isNewCountryMode)}>
                  {isNewCountryMode ? "← Pilih Lama" : "+ Buat Baru"}
                </span>
              </div>
              {isNewCountryMode
                ? <input type="text" value={newCountry} onChange={e => setNewCountry(e.target.value)} placeholder="Nama negara baru" />
                : <select value={countryId} onChange={e => setCountryId(e.target.value)}>
                    <option value="">— Pilih —</option>
                    {countries.map(c => <option key={c.id} value={c.id}>{c.name_country}</option>)}
                  </select>
              }
            </div>
          </div>

          {/* Waktu Masak */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div>
              <label>Waktu Masak</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input type="number" value={cookingTime} onChange={e => setCookingTime(e.target.value)}
                  style={{ width: '100px' }} placeholder="30" />
                <span style={{ color: 'var(--muted)', fontSize: '0.85rem', whiteSpace: 'nowrap' }}>menit</span>
              </div>
            </div>
          </div>

          <hr />

          {/* Bahan-bahan */}
          <div>
            <div className="section-label">
              <UtensilsCrossed size={13} /> Bahan-bahan
            </div>

            {ingredientsList.map((ing, index) => {
              const ingData    = allIngredients.find(i => i.id === parseInt(ing.ingredient_id));
              const hasNutr    = ingData?.nutrition;
              return (
                <div key={index} className="ingredient-row">
                  {/* Ingredient select + Add */}
                  <div style={{ flex: 2.5, display: 'flex', gap: '2px' }}>
                    <select value={ing.ingredient_id}
                      onChange={e => handleIngredientChange(index, 'ingredient_id', e.target.value)}
                      style={{ borderRadius: '6px 0 0 6px', flex: 1 }} required>
                      <option value="">— Pilih Bahan —</option>
                      {allIngredients.map(item => (
                        <option key={item.id} value={item.id}>
                          {item.name_ingredients} {item.nutrition ? "✅" : "⚠️"}
                        </option>
                      ))}
                    </select>
                    <button type="button" className="icon-btn icon-btn-green"
                      style={{ borderRadius: '6px 0 0 6px' }} onClick={() => openModal('ingredient')} title="Tambah Bahan Baru">
                      <Plus size={14} />
                    </button>
                    {ing.ingredient_id && (
                      <button type="button"
                        className={`icon-btn ${hasNutr ? 'icon-btn-gray' : 'icon-btn-orange'}`}
                        style={{ borderRadius: '0 6px 6px 0' }}
                        onClick={() => handleOpenNutritionModal(ing.ingredient_id)}
                        title={hasNutr ? "Edit Nutrisi" : "Isi Nutrisi"}>
                        <Activity size={14} />
                      </button>
                    )}
                  </div>

                  {/* Amount */}
                  <input type="number" placeholder="Jml" value={ing.amount}
                    onChange={e => handleIngredientChange(index, 'amount', e.target.value)}
                    style={{ width: '70px', flex: '0 0 70px' }} required />

                  {/* Unit select + Add */}
                  <div style={{ flex: 1.2, display: 'flex', gap: '2px' }}>
                    <select value={ing.unit_id}
                      onChange={e => handleIngredientChange(index, 'unit_id', e.target.value)}
                      style={{ borderRadius: '6px 0 0 6px', flex: 1 }} required>
                      <option value="">Unit</option>
                      {allUnits.map(u => <option key={u.id} value={u.id}>{u.name_unit}</option>)}
                    </select>
                    <button type="button" className="icon-btn icon-btn-cyan"
                      style={{ borderRadius: '0 6px 6px 0' }}
                      onClick={() => openModal('unit')} title="Tambah Unit Baru">
                      <Plus size={14} />
                    </button>
                  </div>

                  {ingredientsList.length > 1 && (
                    <button type="button" className="icon-btn icon-btn-red"
                      onClick={() => removeIngredientRow(index)}>
                      <X size={14} />
                    </button>
                  )}
                </div>
              );
            })}

            <button type="button" className="add-row-btn" onClick={addIngredientRow}>
              <Plus size={12} /> Tambah Baris Bahan
            </button>
          </div>

          <hr />

          {/* Langkah Memasak */}
          <div>
            <div className="section-label">
              <ChefHat size={13} /> Langkah Memasak
            </div>

            {stepsList.map((step, index) => (
              <div key={index} className="step-row">
                <div className="step-number">{index + 1}</div>
                <textarea value={step}
                  onChange={e => handleStepChange(index, e.target.value)}
                  placeholder={`Instruksi langkah ke-${index + 1}…`}
                  style={{ flex: 1 }} required />
                {stepsList.length > 1 && (
                  <button type="button" className="icon-btn icon-btn-red"
                    style={{ marginTop: '8px' }} onClick={() => removeStepRow(index)}>
                    <X size={14} />
                  </button>
                )}
              </div>
            ))}

            <button type="button" className="add-row-btn" onClick={addStepRow}>
              <Plus size={12} /> Tambah Langkah
            </button>
          </div>

          <hr />

          {/* Upload Foto */}
          <div>
            <label>Foto Masakan</label>
            <label className="image-upload-area" htmlFor="foto-upload">
              {preview
                ? <img src={preview} alt="Preview" className="image-preview" />
                : <div style={{ color: 'var(--muted)', fontSize: '0.88rem' }}>
                    <div style={{ fontSize: '2rem', marginBottom: '8px' }}>🖼️</div>
                    Klik untuk unggah foto masakan
                  </div>
              }
              <input id="foto-upload" type="file" accept="image/*" onChange={handleImageChange} />
            </label>
          </div>

          <button type="submit" className="search-button" disabled={loading} style={{ marginTop: '8px' }}>
            {loading
              ? "Menyimpan…"
              : formMode === "update"
                ? <><Save size={16} /> Simpan Perubahan Resep</>
                : <><ChefHat size={16} /> Simpan Resep Lengkap</>
            }
          </button>

        </form>
      </div>

      {/* ─── MODAL ─────────────────────────────── */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h4>
                {modalType === 'ingredient' && "✏️ Tambah Bahan & Nutrisi"}
                {modalType === 'nutrition'  && "📊 Isi Data Nutrisi Bahan"}
                {modalType === 'unit'       && "📏 Tambah Unit Baru"}
              </h4>
              <button className="modal-close-btn" onClick={() => setShowModal(false)}><X size={16} /></button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

              {(modalType === 'ingredient' || modalType === 'nutrition') && (
                <>
                  {modalType === 'ingredient' && (
                    <div>
                      <label>Nama Bahan</label>
                      <input type="text" value={newIngredientName}
                        onChange={e => setNewIngredientName(e.target.value)}
                        placeholder="Cth: Tepung Almond" />
                    </div>
                  )}
                  <div style={{ marginTop: modalType === 'ingredient' ? '10px' : '0' }}>
                    <label style={{ fontWeight: 700, color: 'var(--dark)', marginBottom: '10px' }}>
                      Informasi Nutrisi per 100g <span style={{ fontWeight: 400, color: 'var(--muted)' }}>(Opsional)</span>
                    </label>
                    <div className="nutrition-grid">
                      {[
                        ['calories',            'Kalori (kcal)'],
                        ['protein_grams',       'Protein (g)'],
                        ['carbohydrates_grams', 'Karbohidrat (g)'],
                        ['fats_grams',          'Lemak (g)'],
                        ['fiber_grams',         'Serat (g)'],
                        ['weight_per_piece',    'Berat 1 Pcs (gram)'],
                      ].map(([key, placeholder]) => (
                        <div key={key} className="nutrition-input-wrap">
                          <label>{placeholder}</label>
                          <input type="number" step="0.01" placeholder="0"
                            value={nutritionData[key]}
                            onChange={e => setNutritionData({ ...nutritionData, [key]: e.target.value })} />
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {modalType === 'unit' && (
                <>
                  {[
                    ['name_unit',    'Nama Unit',  'text', 'Cth: Sendok Makan'],
                    ['abbreviation', 'Singkatan',  'text', 'Cth: sdm'],
                  ].map(([key, lbl, type, ph]) => (
                    <div key={key}>
                      <label>{lbl}</label>
                      <input type={type} value={newUnitData[key]}
                        onChange={e => setNewUnitData({ ...newUnitData, [key]: e.target.value })}
                        placeholder={ph} />
                    </div>
                  ))}
                  <div>
                    <label>Tipe Unit</label>
                    <select value={newUnitData.type_unit}
                      onChange={e => setNewUnitData({ ...newUnitData, type_unit: e.target.value })}>
                      <option value="weight">⚖️ Massa (Berat/Weight)</option>
                      <option value="volume">🧪 Volume (Liter/Volume)</option>
                      <option value="quantity">🔢 Pcs (Jumlah/Quantity)</option>
                    </select>
                  </div>
                </>
              )}

              <button className="modal-save-btn" onClick={handleSaveMasterData}>
                <Save size={15} /> Simpan ke Database
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UploadResep;