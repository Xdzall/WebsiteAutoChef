import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./InputBahan.css"; 

const UploadResep = () => {
  const navigate = useNavigate();

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
  const [allIngredients, setAllIngredients] = useState([]); // List semua bahan dari DB
  const [allUnits, setAllUnits] = useState([]);             // List semua satuan dari DB

  // 3. STATE DINAMIS (Bahan & Langkah)
  // Format: [{ ingredient_id: "", amount: "", unit_id: "", notes: "" }]
  const [ingredientsList, setIngredientsList] = useState([
    { ingredient_id: "", amount: "", unit_id: "", notes: "" }
  ]);
  
  // Format: ["Potong ayam", "Rebus air"]
  const [stepsList, setStepsList] = useState([""]);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  // 4. FETCH DATA
  useEffect(() => {
    const fetchData = async () => {
      try {
        const headers = { "ngrok-skip-browser-warning": "true" };
        const baseUrl = "http://localhost:8080/api"; // Sesuaikan URL

        // Ambil Categories
        const catRes = await axios.get(`${baseUrl}/categories`, { headers });
        if (Array.isArray(catRes.data)) setCategories(catRes.data);

        // Ambil Countries
        const countryRes = await axios.get(`${baseUrl}/countries`, { headers });
        if (Array.isArray(countryRes.data)) setCountries(countryRes.data);

        // Ambil Ingredients (Bahan)
        const ingRes = await axios.get(`${baseUrl}/ingredients`, { headers });
        if (Array.isArray(ingRes.data)) setAllIngredients(ingRes.data);

        // Ambil Units (Satuan)
        const unitRes = await axios.get(`${baseUrl}/units`, { headers });
        if (Array.isArray(unitRes.data)) setAllUnits(unitRes.data);

      } catch (error) {
        console.error("Gagal load data:", error);
      }
    };
    fetchData();
  }, []);

  // --- LOGIC HANDLE GAMBAR ---
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    setImage(file);
    if (file) setPreview(URL.createObjectURL(file));
  };

  // --- LOGIC DINAMIS BAHAN ---
  const handleIngredientChange = (index, field, value) => {
    const newIngredients = [...ingredientsList];
    newIngredients[index][field] = value;
    setIngredientsList(newIngredients);
  };

  const addIngredientRow = () => {
    setIngredientsList([...ingredientsList, { ingredient_id: "", amount: "", unit_id: "", notes: "" }]);
  };

  const removeIngredientRow = (index) => {
    const newIngredients = ingredientsList.filter((_, i) => i !== index);
    setIngredientsList(newIngredients);
  };

  // --- LOGIC DINAMIS LANGKAH ---
  const handleStepChange = (index, value) => {
    const newSteps = [...stepsList];
    newSteps[index] = value;
    setStepsList(newSteps);
  };

  const addStepRow = () => {
    setStepsList([...stepsList, ""]);
  };

  const removeStepRow = (index) => {
    const newSteps = stepsList.filter((_, i) => i !== index);
    setStepsList(newSteps);
  };

  // --- SUBMIT ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const formData = new FormData();
    formData.append("name_recipe", name);
    formData.append("cooking_time_minutes", cookingTime);
    
    // Kirim Category/Country
    if (isNewCategoryMode) formData.append("new_category", newCategory);
    else formData.append("category_id", categoryId);

    if (isNewCountryMode) formData.append("new_country", newCountry);
    else formData.append("country_id", countryId);
    
    if (image) formData.append("image", image);

    // KIRIM ARRAY SEBAGAI JSON STRING
    formData.append("ingredients", JSON.stringify(ingredientsList));
    formData.append("steps", JSON.stringify(stepsList));

    try {
      await axios.post("http://localhost:8080/api/recipes", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setMessage("Resep Lengkap berhasil disimpan!");
      // Reset Form (Bisa dipisah jadi function reset)
      setName(""); setIngredientsList([{ ingredient_id: "", amount: "", unit_id: "", notes: "" }]); setStepsList([""]); setImage(null); setPreview(null);
    } catch (error) {
      console.error("Error upload:", error);
      setMessage("Gagal upload. Cek data input.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="input-bahan-container">
      <div className="input-box" style={{ maxWidth: '800px' }}> {/* Lebarkan sedikit */}
        <h2>Upload Resep Lengkap</h2>
        {message && <p style={{ color: message.includes("Gagal") ? "red" : "green" }}>{message}</p>}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          
          {/* 1. INFORMASI UMUM (Sama seperti sebelumnya) */}
          <div style={{ textAlign: 'left' }}>
            <label>Nama Resep:</label>
            <input type="text" className="search-input" value={name} onChange={(e) => setName(e.target.value)} required style={{width: '100%'}} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            {/* Kategori */}
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
            {/* Negara */}
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

          {/* 2. BAGIAN BAHAN-BAHAN (INGREDIENTS) */}
          <div style={{ textAlign: 'left' }}>
            <label style={{fontWeight:'bold'}}>Bahan-bahan:</label>
            {ingredientsList.map((ing, index) => (
                <div key={index} style={{ display: 'flex', gap: '5px', marginBottom: '10px', alignItems: 'center' }}>
                    {/* Pilih Bahan */}
                    <select 
                        value={ing.ingredient_id} 
                        onChange={(e) => handleIngredientChange(index, 'ingredient_id', e.target.value)}
                        style={{ flex: 2, padding: '8px', borderRadius: '5px' }}
                        required
                    >
                        <option value="">-- Pilih Bahan --</option>
                        {allIngredients.map(item => <option key={item.id} value={item.id}>{item.name_ingredients}</option>)}
                    </select>

                    {/* Jumlah */}
                    <input 
                        type="number" 
                        placeholder="Jml" 
                        value={ing.amount} 
                        onChange={(e) => handleIngredientChange(index, 'amount', e.target.value)}
                        style={{ flex: 1, padding: '8px', width: '60px' }}
                        required
                    />

                    {/* Satuan */}
                    <select 
                        value={ing.unit_id} 
                        onChange={(e) => handleIngredientChange(index, 'unit_id', e.target.value)}
                        style={{ flex: 1, padding: '8px' }}
                        required
                    >
                        <option value="">Unit</option>
                        {allUnits.map(u => <option key={u.id} value={u.id}>{u.name_unit}</option>)}
                    </select>

                    {/* Tombol Hapus */}
                    {ingredientsList.length > 1 && (
                        <button type="button" onClick={() => removeIngredientRow(index)} style={{background:'red', color:'white', border:'none', padding:'5px 10px'}}>X</button>
                    )}
                </div>
            ))}
            <button type="button" onClick={addIngredientRow} style={{fontSize:'12px', padding:'5px'}}>+ Tambah Bahan Lain</button>
          </div>

          <hr style={{margin: '20px 0', border: '1px solid #eee'}}/>

          {/* 3. BAGIAN LANGKAH-LANGKAH (STEPS) */}
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
                        <button type="button" onClick={() => removeStepRow(index)} style={{background:'red', color:'white', border:'none', height:'30px'}}>X</button>
                    )}
                </div>
            ))}
            <button type="button" onClick={addStepRow} style={{fontSize:'12px', padding:'5px'}}>+ Tambah Langkah</button>
          </div>

          <hr style={{margin: '20px 0', border: '1px solid #eee'}}/>

          {/* 4. GAMBAR & SUBMIT */}
          <div style={{ textAlign: 'left' }}>
            <label>Foto Masakan:</label>
            <input type="file" onChange={handleImageChange} style={{ marginTop: '5px' }} />
            {preview && <img src={preview} alt="Preview" style={{ marginTop: '10px', maxWidth: '200px', borderRadius: '8px' }} />}
          </div>

          <button type="submit" className="search-button" disabled={loading}>
            {loading ? "Menyimpan..." : "Simpan Resep Lengkap"}
          </button>

        </form>
      </div>
    </div>
  );
};

export default UploadResep;