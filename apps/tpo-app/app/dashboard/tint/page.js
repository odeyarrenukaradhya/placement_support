'use client';

import { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api';

export default function TPOTintPage() {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [formData, setFormData] = useState({ title: '', category: 'aptitude', file_url: '' });

  useEffect(() => {
    apiFetch('/tint').then(setMaterials).finally(() => setLoading(false));
  }, []);

  const handleUpload = async (e) => {
    e.preventDefault();
    try {
      const newMaterial = await apiFetch('/tint', {
        method: 'POST',
        body: JSON.stringify(formData),
      });
      setMaterials([newMaterial, ...materials]);
      setShowUpload(false);
      setFormData({ title: '', category: 'aptitude', file_url: '' });
    } catch (err) {
      alert('Upload failed');
    }
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900">Training & Interview Notes Toolkit (TINT)</h2>
        <button 
          onClick={() => setShowUpload(!showUpload)}
          className="bg-green-600 text-white px-4 py-2 rounded shadow hover:bg-green-700"
        >
          {showUpload ? 'Cancel' : 'Upload Material'}
        </button>
      </div>

      {showUpload && (
        <form onSubmit={handleUpload} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-8 space-y-4 max-w-xl">
          <h3 className="font-semibold text-lg text-black">New Material Details</h3>
          <div>
            <label className="block text-sm font-medium text-gray-700">Title</label>
            <input 
              type="text" required className="w-full border rounded-md p-2" 
              value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Category</label>
            <select 
              className="w-full border rounded-md p-2"
              value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}
            >
              <option value="aptitude">Aptitude</option>
              <option value="logical">Logical Reasoning</option>
              <option value="verbal">Verbal</option>
              <option value="interview">Interview Preparation</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">File URL (S3/Drive)</label>
            <input 
              type="url" required className="w-full border rounded-md p-2" 
              value={formData.file_url} onChange={e => setFormData({...formData, file_url: e.target.value})}
            />
          </div>
          <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded font-bold">Save Material</button>
        </form>
      )}

      {loading ? <p>Loading materials...</p> : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {['aptitude', 'logical', 'verbal', 'interview'].map(cat => (
            <div key={cat} className="space-y-4">
              <h3 className="text-sm font-bold uppercase text-gray-500 tracking-wider mb-2 border-b pb-1">{cat}</h3>
              {materials.filter(m => m.category === cat).map(m => (
                <div key={m.id} className="bg-white p-4 rounded border shadow-sm flex justify-between items-center">
                  <span className="font-medium text-gray-800">{m.title}</span>
                  <a href={m.file_url} target="_blank" className="text-blue-600 hover:underline text-sm">Link</a>
                </div>
              ))}
              {materials.filter(m => m.category === cat).length === 0 && (
                <p className="text-xs text-gray-400 italic">No materials yet.</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
