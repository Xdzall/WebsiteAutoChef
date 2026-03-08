import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom"; 
import "./InputBahan.css"; 
import { Plus, X, Save, Activity } from "lucide-react";

const UploadResep = () => {
  const navigate = useNavigate();
  const { id } = useParams(); 

  // --- FITUR BARU: STATE LOGIN ---
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem("token"));
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // --- FITUR BARU: MODE FORM & DROPDOWN RESEP ---
  const [formMode, setFormMode] = useState(id ? "update" : "create");
  const [allRecipes, setAllRecipes] = useState([]); // Menyimpan daftar semua resep
  const [selectedRecipeId, setSelectedRecipeId] = useState(id || ""); // Menyimpan ID resep yang dipilih untuk diupdate

  // 1. Data Resep Utama
  const [name, setName] = useState("");
  const [cookingTime, setCookingTime] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [countryId, setCountryId] = useState("");
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);

  // Mode Baru Category/Country
  const [isNewCategoryMode, setIsNewCategoryMode] = useState(false);
  const [newCategory, setNewCategory] = useState("");
  const [isNewCountryMode, setIsNewCountryMode] = useState(false);
  const [newCountry, setNewCountry] = useState("");

  // 2. Data Master (Dropdown)
  const [categories, setCategories] = useState([]);
  const [countries, setCountries] = useState([]);
  const [allIngredients, setAllIngredients] = useState([]); 
  const [allUnits, setAllUnits] = useState([]);             

  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState(""); 
  
  const [newIngredientName, setNewIngredientName] = useState("");
  const [newUnitData, setNewUnitData] = useState({
    name_unit: "", abbreviation: "", type_unit: "mass", conversion_to_grams: ""
  });

  const [selectedIngredientIdForNutrition, setSelectedIngredientIdForNutrition] = useState(null);
  const [nutritionData, setNutritionData] = useState({
    calories: "", protein_grams: "", carbohydrates_grams: "", fats_grams: "", fiber_grams: "", weight_per_piece: ""
  });

  // 3. STATE DINAMIS (Bahan & Langkah)
  const [ingredientsList, setIngredientsList] = useState([
    { ingredient_id: "", amount: "", unit_id: "", notes: "" }
  ]);
  const [stepsList, setStepsList] = useState([""]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  // FUNGSI RESET FORM (Membersihkan form saat ganti ke Mode "Buat Baru")
  const resetForm = () => {
    setName(""); setCookingTime(""); setCategoryId(""); setCountryId("");
    setIsNewCategoryMode(false); setNewCategory("");
    setIsNewCountryMode(false); setNewCountry("");
    setImage(null); setPreview(null);
    setIngredientsList([{ ingredient_id: "", amount: "", unit_id: "", notes: "" }]);
    setStepsList([""]);
    setSelectedRecipeId("");
    setMessage("");
  };

  // --- FITUR BARU: FUNGSI LOGIN ---
  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setLoginError("");
    try {
      const response = await axios.post("http://100.120.18.38:8080/api/login", {
        email: loginEmail,
        password: loginPassword,
      });

      // Sesuaikan 'token' atau 'access_token' dengan nama key JSON dari API Laravel-mu
      const token = response.data.token || response.data.access_token;

      if (token) {
        localStorage.setItem("token", token);
        setIsAuthenticated(true); // Ini akan otomatis mengubah tampilan ke Form Resep
      } else {
        setLoginError("Login berhasil tapi token tidak ditemukan dari server.");
      }
    } catch (error) {
      setLoginError("Login gagal! Pastikan Email dan Password benar.");
      console.error("Login error:", error);
    } finally {
      setIsLoggingIn(false);
    }
  };

   const handleLogout = () => {
    localStorage.removeItem("token");
    setIsAuthenticated(false);
    resetForm();
  };

  // 4. FETCH DATA MASTER & DAFTAR RESEP
  const fetchData = async () => {
    try {
      const token = localStorage.getItem("token");
      const headers = { "ngrok-skip-browser-warning": "true", Authorization: `Bearer ${token}` };
      const baseUrl = "http://100.120.18.38:8080/api"; 

      // Ambil data master
      const catRes = await axios.get(`${baseUrl}/categories`, { headers });
      if (Array.isArray(catRes.data)) setCategories(catRes.data);

      const countryRes = await axios.get(`${baseUrl}/countries`, { headers });
      if (Array.isArray(countryRes.data)) setCountries(countryRes.data);

      const ingRes = await axios.get(`${baseUrl}/ingredients`, { headers });
      if (Array.isArray(ingRes.data)) setAllIngredients(ingRes.data);

      const unitRes = await axios.get(`${baseUrl}/units`, { headers });
      if (Array.isArray(unitRes.data)) setAllUnits(unitRes.data);

      // --- FITUR BARU: Ambil List Semua Resep untuk Dropdown ---
      const recipeRes = await axios.get(`${baseUrl}/recipes-list`, { headers });
      if (recipeRes.data && Array.isArray(recipeRes.data.data)) {
        setAllRecipes(recipeRes.data.data);
      }

    } catch (error) {
      console.error("Gagal load data master:", error);
    }
  };

  useEffect(() => {
    // Hanya fetch data master JIKA user sudah berhasil login (isAuthenticated = true)
    if (isAuthenticated) {
      fetchData();
    }
  }, [isAuthenticated]); // <-- Tambahkan dependency ini

  // --- FITUR BARU: FETCH DETAIL RESEP SAAT DROPDOWN DIPILIH ---
  useEffect(() => {
    if (formMode === "update" && selectedRecipeId !== "") {
      const fetchRecipeDetails = async () => {
        try {
          const token = localStorage.getItem("token");
          const headers = { "ngrok-skip-browser-warning": "true", Authorization: `Bearer ${token}` };
          const response = await axios.get(`http://100.120.18.38:8080/api/recipes/${selectedRecipeId}`, { headers });
          const data = response.data.data;

          setName(data.nama_resep || "");
          setCookingTime(data.waktu_masak || "");
          setCategoryId(data.kategori || ""); 
          setCountryId(data.country_id || data.negara_id || data.negara || ""); // Sesuaikan dgn API

          if (data.url_gambar) setPreview(data.url_gambar);

          if (data.bahan && data.bahan.length > 0) {
            const formattedBahan = data.bahan.map(b => ({
              ingredient_id: b.id_bahan,
              amount: b.detail_bahan.jumlah,
              unit_id: b.detail_bahan.unit_id, 
              notes: b.detail_bahan.catatan || ""
            }));
            setIngredientsList(formattedBahan);
          } else {
            setIngredientsList([{ ingredient_id: "", amount: "", unit_id: "", notes: "" }]);
          }

          if (data.langkah_langkah && data.langkah_langkah.length > 0) {
            const formattedSteps = data.langkah_langkah.map(l => l.instruksi);
            setStepsList(formattedSteps);
          } else {
            setStepsList([""]);
          }
        } catch (error) {
          console.error("Gagal mengambil data resep untuk diedit:", error);
        }
      };
      
      fetchRecipeDetails();
    }
  }, [formMode, selectedRecipeId]);

  // Modal Handlers (Master Data)
  const openModal = (type) => {
    setModalType(type); setShowModal(true);
    setNewIngredientName(""); setNewUnitData({ name_unit: "", abbreviation: "", type_unit: "mass", conversion_to_grams: "" });
    setNutritionData({ calories: "", protein_grams: "", carbohydrates_grams: "", fats_grams: "", fiber_grams: "" });
  };

  const handleOpenNutritionModal = (ingredientId) => {
    const selected = allIngredients.find(i => i.id === parseInt(ingredientId));
    if (selected && selected.nutrition) {
      setNutritionData({
        calories: selected.nutrition.calories || "", 
        protein_grams: selected.nutrition.protein_grams || "",
        carbohydrates_grams: selected.nutrition.carbohydrates_grams || "", 
        fats_grams: selected.nutrition.fats_grams || "",
        fiber_grams: selected.nutrition.fiber_grams || "",
        weight_per_piece: selected.nutrition.weight_per_piece || ""
      });
    } else {
      setNutritionData({ calories: "", protein_grams: "", carbohydrates_grams: "", fats_grams: "", fiber_grams: "", weight_per_piece: "" });
    }
    setSelectedIngredientIdForNutrition(ingredientId);
    setModalType('nutrition'); setShowModal(true);
  };

  const handleSaveMasterData = async () => {
    const token = localStorage.getItem("token"); 
    const config = { headers: { Authorization: `Bearer ${token}` } };
    const baseUrl = "http://100.120.18.38:8080/api";

    try {
      if (modalType === 'ingredient') {
        const response = await axios.post(`${baseUrl}/ingredients`, { name_ingredients: newIngredientName }, config);
        const newIngredientId = response.data.data.id;
        if (nutritionData.calories !== "") {
          await axios.post(`${baseUrl}/ingredients/${newIngredientId}/nutrition`, nutritionData, config);
        }
        alert("Bahan (beserta nutrisinya) berhasil ditambahkan!");
        fetchData(); setShowModal(false);
      } 
      else if (modalType === 'unit') {
        await axios.post(`${baseUrl}/units`, newUnitData, config);
        alert("Unit berhasil ditambahkan!");
        fetchData(); setShowModal(false);
      }
      else if (modalType === 'nutrition') {
        await axios.post(`${baseUrl}/ingredients/${selectedIngredientIdForNutrition}/nutrition`, nutritionData, config);
        alert("Nutrisi untuk bahan ini berhasil diperbarui!");
        fetchData(); setShowModal(false);
      }
    } catch (error) {
      console.error("Gagal simpan master data:", error);
      alert("Gagal menyimpan. Cek kembali koneksi atau data input Anda.");
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0]; setImage(file);
    if (file) setPreview(URL.createObjectURL(file));
  };

  const handleIngredientChange = (index, field, value) => {
    const newIngredients = [...ingredientsList]; newIngredients[index][field] = value; setIngredientsList(newIngredients);
  };

  const addIngredientRow = () => setIngredientsList([...ingredientsList, { ingredient_id: "", amount: "", unit_id: "", notes: "" }]);
  const removeIngredientRow = (index) => setIngredientsList(ingredientsList.filter((_, i) => i !== index));

  const handleStepChange = (index, value) => {
    const newSteps = [...stepsList]; newSteps[index] = value; setStepsList(newSteps);
  };

  const addStepRow = () => setStepsList([...stepsList, ""]);
  const removeStepRow = (index) => setStepsList(stepsList.filter((_, i) => i !== index));

  // SUBMIT (POST / PUT DINAMIS)
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formMode === "update" && !selectedRecipeId) {
      alert("Pilih resep yang ingin diupdate terlebih dahulu!");
      return;
    }

    setLoading(true);
    setMessage("");

    const formData = new FormData();
    const isEdit = (formMode === "update" && selectedRecipeId !== "");
    
    if (isEdit) formData.append("_method", "PUT");
    
    formData.append("name_recipe", name);
    formData.append("cooking_time_minutes", cookingTime);
    if (isNewCategoryMode) formData.append("new_category", newCategory); else formData.append("category_id", categoryId);
    if (isNewCountryMode) formData.append("new_country", newCountry); else formData.append("country_id", countryId);
    if (image) formData.append("image", image);
    formData.append("ingredients", JSON.stringify(ingredientsList));
    formData.append("steps", JSON.stringify(stepsList));

    try {
      const targetUrl = isEdit 
        ? `http://100.120.18.38:8080/api/recipes/${selectedRecipeId}` 
        : `http://100.120.18.38:8080/api/recipes`;

        const token = localStorage.getItem("token");

      await axios.post(targetUrl, formData, { headers: { "Content-Type": "multipart/form-data", "Authorization": `Bearer ${token}` } });
      
      setMessage(isEdit ? "Resep berhasil diperbarui!" : "Resep Lengkap berhasil disimpan!");
      
      if (!isEdit) resetForm();
      fetchData(); // Refresh list resep di dropdown
    } catch (error) {
      console.error("Error upload:", error);
      setMessage("Gagal menyimpan resep. Cek data input.");
    } finally {
      setLoading(false);
    }
  };

  // --- FITUR BARU: TAMPILKAN FORM LOGIN JIKA BELUM AUTHENTICATED ---
  if (!isAuthenticated) {
    return (
      <div className="input-bahan-container" style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="input-box" style={{ maxWidth: '400px', width: '100%', padding: '30px' }}>
          <h2>Login Admin</h2>
          <p style={{ marginBottom: '20px', color: '#666' }}>Silakan masuk untuk mengelola data resep.</p>

          {loginError && <p style={{ color: "red", fontWeight: "bold", marginBottom: '15px' }}>{loginError}</p>}

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <div style={{ textAlign: 'left' }}>
              <label>Email Admin:</label>
              <input
                type="email"
                className="search-input"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                required
                style={{ width: '100%' }}
              />
            </div>
            
            <div style={{ textAlign: 'left' }}>
              <label>Password:</label>
              <input
                type="password"
                className="search-input"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                required
                style={{ width: '100%' }}
              />
            </div>

            <button type="submit" className="search-button" disabled={isLoggingIn} style={{ marginTop: '10px' }}>
              {isLoggingIn ? "Memeriksa..." : "Masuk"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="input-bahan-container">
      <div className="input-box" style={{ maxWidth: '900px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2>Kelola Resep</h2>
          <button 
            onClick={handleLogout} 
            style={{ background: 'red', color: 'white', border: 'none', padding: '8px 15px', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}
          >
            Logout
          </button>
        </div>
        
        {/* --- PILIHAN RADIO BUTTON UNTUK MODE --- */}
        <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', marginBottom: '20px', padding: '10px', background: '#f8f9fa', borderRadius: '8px' }}>
          <label style={{ cursor: 'pointer', fontWeight: 'bold' }}>
            <input 
              type="radio" 
              checked={formMode === "create"} 
              onChange={() => { setFormMode("create"); resetForm(); }} 
              style={{ marginRight: '5px' }}
            /> 
            Buat Resep Baru
          </label>
          <label style={{ cursor: 'pointer', fontWeight: 'bold' }}>
            <input 
              type="radio" 
              checked={formMode === "update"} 
              onChange={() => setFormMode("update")} 
              style={{ marginRight: '5px' }}
            /> 
            Update Resep
          </label>
        </div>

        {message && <p style={{ color: message.includes("Gagal") ? "red" : "green", fontWeight: 'bold' }}>{message}</p>}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          
          {/* --- JIKA UPDATE, TAMPILKAN DROPDOWN PILIH RESEP --- */}
          {formMode === "update" && (
            <div style={{ textAlign: 'left', background: '#fff3cd', padding: '10px', borderRadius: '5px', border: '1px solid #ffeeba' }}>
              <label style={{ color: '#856404', fontWeight: 'bold' }}>Pilih Resep yang akan diedit:</label>
              <select 
                value={selectedRecipeId} 
                onChange={(e) => setSelectedRecipeId(e.target.value)} 
                style={{ width: '100%', padding: '10px', marginTop: '5px', borderRadius: '5px', border: '1px solid #ccc' }}
              >
                <option value="">-- Pilih Resep --</option>
                {allRecipes.map(r => (
                  <option key={r.id} value={r.id}>{r.nama_resep}</option>
                ))}
              </select>
            </div>
          )}

          {/* INFO UMUM */}
          <div style={{ textAlign: 'left' }}>
            <label>Nama Resep:</label>
            <input type="text" className="search-input" value={name} onChange={(e) => setName(e.target.value)} required style={{width: '100%'}} />
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
             <div style={{ textAlign: 'left' }}>
                <div style={{display:'flex', justifyContent:'space-between'}}><label>Kategori:</label> <small onClick={()=>setIsNewCategoryMode(!isNewCategoryMode)} style={{cursor:'pointer', color:'blue'}}>{isNewCategoryMode ? "Pilih Lama" : "Buat Baru"}</small></div>
                {isNewCategoryMode ? 
                    <input type="text" className="search-input" value={newCategory} onChange={(e)=>setNewCategory(e.target.value)} style={{width:'100%'}} placeholder="Kategori Baru"/> :
                    <select className="search-input" value={categoryId} onChange={(e)=>setCategoryId(e.target.value)} style={{width:'100%', background:'white'}}>
                        <option value="">- Pilih -</option>
                        {Array.isArray(categories) && categories.map(c => <option key={c.id} value={c.id}>{c.name_category}</option>)}
                    </select>
                }
            </div>
            <div style={{ textAlign: 'left' }}>
                <div style={{display:'flex', justifyContent:'space-between'}}><label>Negara:</label> <small onClick={()=>setIsNewCountryMode(!isNewCountryMode)} style={{cursor:'pointer', color:'blue'}}>{isNewCountryMode ? "Pilih Lama" : "Buat Baru"}</small></div>
                {isNewCountryMode ? 
                    <input type="text" className="search-input" value={newCountry} onChange={(e)=>setNewCountry(e.target.value)} style={{width:'100%'}} placeholder="Negara Baru"/> :
                    <select className="search-input" value={countryId} onChange={(e)=>setCountryId(e.target.value)} style={{width:'100%', background:'white'}}>
                        <option value="">- Pilih -</option>
                        {Array.isArray(countries) && countries.map(c => <option key={c.id} value={c.id}>{c.name_country}</option>)}
                    </select>
                }
            </div>
          </div>

           <div style={{ textAlign: 'left' }}>
            <label>Waktu Masak (menit):</label>
            <input type="number" className="search-input" value={cookingTime} onChange={(e)=>setCookingTime(e.target.value)} style={{width:'100px'}} />
          </div>

          <hr style={{margin: '20px 0', border: '1px solid #eee'}}/>

          {/* BAHAN-BAHAN */}
          <div style={{ textAlign: 'left' }}>
            <label style={{fontWeight:'bold'}}>Bahan-bahan:</label>
            {ingredientsList.map((ing, index) => {
                const selectedIngData = allIngredients.find(item => item.id === parseInt(ing.ingredient_id));
                const hasNutrition = selectedIngData && selectedIngData.nutrition;

                return (
                <div key={index} style={{ display: 'flex', gap: '5px', marginBottom: '10px', alignItems: 'center' }}>
                    <div style={{flex: 2, display: 'flex', gap: '2px'}}>
                        <select 
                            value={ing.ingredient_id} 
                            onChange={(e) => handleIngredientChange(index, 'ingredient_id', e.target.value)}
                            style={{ width: '100%', padding: '8px', borderRadius: '5px 0 0 5px', border: '1px solid #ccc' }}
                            required
                        >
                            <option value="">-- Pilih Bahan --</option>
                            {allIngredients.map(item => (
                                <option key={item.id} value={item.id}>
                                    {item.name_ingredients} {item.nutrition ? "✅" : "⚠️(No Nutrition)"}
                                </option>
                            ))}
                        </select>
                        
                        <button 
                            type="button" 
                            onClick={() => openModal('ingredient')}
                            title="Tambah Bahan Baru ke Database"
                            style={{background: '#28a745', color: 'white', border: 'none', borderRadius: '0', cursor: 'pointer', width: '30px'}}
                        >
                            <Plus size={16} />
                        </button>

                        {ing.ingredient_id && (
                          <button 
                              type="button" 
                              onClick={() => handleOpenNutritionModal(ing.ingredient_id)}
                              title={hasNutrition ? "Edit Nutrisi Bahan Ini" : "Isi Nutrisi Bahan Ini"}
                              style={{background: hasNutrition ? '#6c757d' : '#FF6B00', color: 'white', border: 'none', borderRadius: '0 5px 5px 0', cursor: 'pointer', width: '30px'}}
                          >
                              <Activity size={16} />
                          </button>
                        )}
                    </div>

                    <input 
                        type="number" 
                        placeholder="Jml" 
                        value={ing.amount} 
                        onChange={(e) => handleIngredientChange(index, 'amount', e.target.value)}
                        style={{ flex: 0.5, padding: '8px', minWidth: '60px' }}
                        required
                    />

                    <div style={{flex: 1, display: 'flex', gap: '2px'}}>
                        <select 
                            value={ing.unit_id} 
                            onChange={(e) => handleIngredientChange(index, 'unit_id', e.target.value)}
                            style={{ width: '100%', padding: '8px', borderRadius: '5px 0 0 5px', border: '1px solid #ccc' }}
                            required
                        >
                            <option value="">Unit</option>
                            {allUnits.map(u => <option key={u.id} value={u.id}>{u.name_unit}</option>)}
                        </select>
                        <button 
                            type="button" 
                            onClick={() => openModal('unit')}
                            title="Tambah Unit Baru ke Database"
                            style={{background: '#17a2b8', color: 'white', border: 'none', borderRadius: '0 5px 5px 0', cursor: 'pointer', width: '30px'}}
                        >
                             <Plus size={16} />
                        </button>
                    </div>

                    {ingredientsList.length > 1 && (
                        <button type="button" onClick={() => removeIngredientRow(index)} style={{background:'red', color:'white', border:'none', padding:'5px 10px', borderRadius:'5px'}}>
                            <X size={16} />
                        </button>
                    )}
                </div>
            )})}
            <button type="button" onClick={addIngredientRow} style={{fontSize:'12px', padding:'5px 10px', marginTop: '5px'}}>+ Tambah Baris Bahan</button>
          </div>

          <hr style={{margin: '20px 0', border: '1px solid #eee'}}/>

          {/* LANGKAH-LANGKAH */}
          <div style={{ textAlign: 'left' }}>
            <label style={{fontWeight:'bold'}}>Langkah Memasak:</label>
            {stepsList.map((step, index) => (
                <div key={index} style={{ display: 'flex', gap: '5px', marginBottom: '10px' }}>
                    <span style={{paddingTop: '5px', fontWeight:'bold'}}>{index + 1}.</span>
                    <textarea 
                        value={step} 
                        onChange={(e) => handleStepChange(index, e.target.value)}
                        placeholder={`Instruksi langkah ke-${index+1}`}
                        style={{ flex: 1, padding: '8px', minHeight: '50px' }}
                        required
                    />
                    {stepsList.length > 1 && (
                        <button type="button" onClick={() => removeStepRow(index)} style={{background:'red', color:'white', border:'none', borderRadius: '5px', width: '30px', height: 'fit-content', padding: '5px'}}>
                            <X size={16} />
                        </button>
                    )}
                </div>
            ))}
            <button type="button" onClick={addStepRow} style={{fontSize:'12px', padding:'5px 10px'}}>+ Tambah Langkah</button>
          </div>

          {/* GAMBAR */}
          <div style={{ textAlign: 'left', marginTop: '20px' }}>
            <label>Foto Masakan:</label>
            <input type="file" onChange={handleImageChange} style={{ marginTop: '5px' }} />
            {preview && <img src={preview} alt="Preview" style={{ marginTop: '10px', maxWidth: '200px', borderRadius: '8px' }} />}
          </div>

          {/* TOMBOL SUBMIT DINAMIS */}
          <button type="submit" className="search-button" disabled={loading} style={{marginTop: '20px'}}>
            {loading ? "Menyimpan..." : (formMode === "update" ? "Simpan Perubahan Resep" : "Simpan Resep Lengkap")}
          </button>

        </form>
      </div>

      {/* --- MODAL POPUP (TETAP SAMA) --- */}
      {showModal && (
        <div className="modal-overlay" style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999
        }}>
          <div className="modal-content" style={{ background: 'white', padding: '20px', borderRadius: '10px', width: '90%', maxWidth: '400px' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                <h4>
                  {modalType === 'ingredient' && "Tambah Bahan & Nutrisi"}
                  {modalType === 'nutrition' && "Isi Nutrisi Bahan"}
                  {modalType === 'unit' && "Tambah Unit Baru"}
                </h4>
                <button onClick={() => setShowModal(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}><X size={20}/></button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', textAlign: 'left' }}>
              
              {(modalType === 'ingredient' || modalType === 'nutrition') && (
                <>
                  {modalType === 'ingredient' && (
                    <div>
                      <label>Nama Bahan:</label>
                      <input 
                        type="text" 
                        value={newIngredientName} 
                        onChange={(e) => setNewIngredientName(e.target.value)}
                        placeholder="Contoh: Tepung Almond"
                        style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '5px' }}
                      />
                    </div>
                  )}

                  <div style={{ marginTop: modalType === 'ingredient' ? '15px' : '0' }}>
                    <label style={{fontWeight: 'bold'}}>Informasi Nutrisi per 100g (Opsional)</label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '5px' }}>
                      <input type="number" step="0.01" placeholder="Kalori (kcal)" value={nutritionData.calories} onChange={(e) => setNutritionData({...nutritionData, calories: e.target.value})} style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '5px' }} />
                      <input type="number" step="0.01" placeholder="Protein (g)" value={nutritionData.protein_grams} onChange={(e) => setNutritionData({...nutritionData, protein_grams: e.target.value})} style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '5px' }} />
                      <input type="number" step="0.01" placeholder="Karbohidrat (g)" value={nutritionData.carbohydrates_grams} onChange={(e) => setNutritionData({...nutritionData, carbohydrates_grams: e.target.value})} style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '5px' }} />
                      <input type="number" step="0.01" placeholder="Lemak (g)" value={nutritionData.fats_grams} onChange={(e) => setNutritionData({...nutritionData, fats_grams: e.target.value})} style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '5px' }} />
                      <input type="number" step="0.01" placeholder="Serat (g)" value={nutritionData.fiber_grams} onChange={(e) => setNutritionData({...nutritionData, fiber_grams: e.target.value})} style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '5px' }} />
                      <input type="number" step="0.01" placeholder="Berat 1 Buah/Pcs/Ekor (Gram)" value={nutritionData.weight_per_piece} onChange={(e) => setNutritionData({...nutritionData, weight_per_piece: e.target.value})} style={{ padding: '8px', border: '1px solid #28a745', borderRadius: '5px', backgroundColor: '#e9ecef' }} title="Isi khusus untuk bahan yang memakai satuan kuantitas seperti Buah/Siung/Ekor"/>
                    </div>
                  </div>
                </>
              )}

              {modalType === 'unit' && (
                <>
                  <div>
                    <label>Nama Unit:</label>
                    <input 
                        type="text" value={newUnitData.name_unit} 
                        onChange={(e) => setNewUnitData({...newUnitData, name_unit: e.target.value})}
                        placeholder="Contoh: Sendok Makan"
                        style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '5px' }}
                    />
                  </div>
                  <div>
                    <label>Singkatan:</label>
                    <input 
                        type="text" value={newUnitData.abbreviation} 
                        onChange={(e) => setNewUnitData({...newUnitData, abbreviation: e.target.value})}
                        placeholder="Contoh: sdm"
                        style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '5px' }}
                    />
                  </div>
                  <div>
                    <label>Tipe:</label>
                      <select 
                          value={newUnitData.type_unit}
                          onChange={(e) => setNewUnitData({...newUnitData, type_unit: e.target.value})}
                          style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '5px' }}
                      >
                          <option value="weight">Massa (Berat/Weight)</option>
                          <option value="volume">Volume (Liter/Volume)</option>
                          <option value="quantity">Pcs (Jumlah/Quantity)</option>
                      </select>
                  </div>
                </>
              )}

              <button 
                onClick={handleSaveMasterData}
                style={{ marginTop: '15px', padding: '10px', background: '#FF6B00', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '5px' }}
              >
                <Save size={16} /> Simpan ke Database
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default UploadResep;