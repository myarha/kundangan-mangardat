import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  ArrowUpDown, 
  MapPin, 
  Users,
  CheckCircle2,
  XCircle,
  Filter,
  RefreshCw,
  Plus,
  Calendar,
  Wallet,
  User,
  X
} from 'lucide-react';
import { DataRecord } from './data/sampleData';
import { cn } from './lib/utils';
import { supabase } from './lib/supabase';

// Memoized Table Row for performance
// Memoized Table Row Content for performance
const TableRowContent = React.memo(({ item, toggleStatus, formatCurrency }: { 
  item: DataRecord; 
  toggleStatus: (id: number) => void; 
  formatCurrency: (v: number) => string 
}) => {
  return (
    <>
      <td className="px-6 py-3 text-sm font-mono text-slate-400">#{item.id.toString().padStart(3, '0')}</td>
      <td className="px-6 py-3">
        <span className="text-sm font-bold text-slate-700 group-hover:text-rose-600 transition-colors break-words whitespace-normal min-w-[120px] block" title={item.nama}>
          {item.nama}
        </span>
      </td>
      <td className="px-6 py-3 text-sm font-black text-slate-900 whitespace-nowrap">{formatCurrency(item.nominal)}</td>
      <td className="px-6 py-3">
        <div className="flex items-start gap-2 text-sm text-slate-500">
          <div className="w-6 h-6 rounded-lg bg-rose-50 flex items-center justify-center shrink-0 mt-0.5">
            <MapPin size={12} className="text-rose-400" />
          </div>
          <span className="break-words whitespace-normal max-w-[250px] leading-relaxed" title={item.alamat}>
            {item.alamat}
          </span>
        </div>
      </td>
      <td className="px-6 py-3">
        <button 
          onClick={() => toggleStatus(item.id)}
          className={cn(
            "inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-wider shadow-sm transition-all active:scale-95 border",
            item.status === 'Sudah Kundangan' 
              ? "bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100" 
              : "bg-rose-50 text-rose-700 border-rose-100 hover:bg-rose-100"
          )}
        >
          {item.status === 'Sudah Kundangan' ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
          {item.status}
        </button>
      </td>
    </>
  );
});

// Memoized Mobile Card Content for performance
const MobileCardContent = React.memo(({ item, toggleStatus, formatCurrency }: { 
  item: DataRecord; 
  toggleStatus: (id: number) => void; 
  formatCurrency: (v: number) => string 
}) => {
  return (
    <div className="p-3 flex flex-col gap-2 hover:bg-rose-50/40 transition-all border-b border-slate-100 last:border-0 group">
      <div className="flex justify-between items-start gap-4">
        <div className="flex flex-col min-w-0 flex-1">
          <span className="text-[10px] font-mono text-slate-400 mb-0.5">#{item.id.toString().padStart(3, '0')}</span>
          <h3 className="font-bold text-slate-900 group-hover:text-rose-600 transition-colors break-words whitespace-normal leading-tight">
            {item.nama}
          </h3>
        </div>
        <button 
          onClick={() => toggleStatus(item.id)}
          className={cn(
            "shrink-0 inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider shadow-sm transition-all active:scale-95 border",
            item.status === 'Sudah Kundangan' 
              ? "bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100" 
              : "bg-rose-50 text-rose-700 border-rose-100 hover:bg-rose-100"
          )}
        >
          {item.status === 'Sudah Kundangan' ? <CheckCircle2 size={10} /> : <XCircle size={10} />}
          {item.status}
        </button>
      </div>
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="text-sm font-black text-rose-600 shrink-0">{formatCurrency(item.nominal)}</div>
        <div className="flex items-start gap-1.5 text-xs text-slate-500">
          <MapPin size={12} className="text-rose-300 shrink-0 mt-0.5" />
          <span className="break-words whitespace-normal leading-relaxed">{item.alamat}</span>
        </div>
      </div>
    </div>
  );
});

export default function App() {
  const [data, setData] = useState<DataRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: keyof DataRecord; direction: 'asc' | 'desc' } | null>(null);
  const [dataLimit, setDataLimit] = useState<number | 'all'>(50);
  
  // Custom Modal State
  const [modalConfig, setModalConfig] = useState<{ isOpen: boolean; id: number | null; name: string; nextStatus: string }>({
    isOpen: false,
    id: null,
    name: '',
    nextStatus: ''
  });

  // Fetch data from Supabase
  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: kundangan, error } = await supabase
        .from('kundangan')
        .select('*')
        .order('id', { ascending: true });

      if (error) throw error;
      setData(kundangan || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      // Fallback to empty if error
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Subscribe to real-time changes on the 'kundangan' table
    const channel = supabase
      .channel('realtime-kundangan')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'kundangan' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setData((prev) => {
              // Prevent duplicates if the local user already added it
              if (prev.some(item => item.id === payload.new.id)) return prev;
              return [...prev, payload.new as DataRecord];
            });
          } else if (payload.eventType === 'UPDATE') {
            setData((prev) =>
              prev.map((item) =>
                item.id === payload.new.id ? (payload.new as DataRecord) : item
              )
            );
          } else if (payload.eventType === 'DELETE') {
            setData((prev) => prev.filter((item) => item.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const filteredData = useMemo(() => {
    let result = [...data];

    if (search) {
      const lowerSearch = search.toLowerCase();
      result = result.filter(
        item => 
          item.nama.toLowerCase().includes(lowerSearch) || 
          item.alamat.toLowerCase().includes(lowerSearch) ||
          item.id.toString().includes(lowerSearch) ||
          item.status.toLowerCase().includes(lowerSearch)
      );
    }

    if (sortConfig) {
      result.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }

    return result;
  }, [data, search, sortConfig]);

  const displayedData = useMemo(() => {
    if (dataLimit === 'all') return filteredData;
    return filteredData.slice(0, dataLimit);
  }, [filteredData, dataLimit]);

  const stats = useMemo(() => {
    return {
      sudah: data.filter(item => item.status === 'Sudah Kundangan').length,
      belum: data.filter(item => item.status === 'Belum Kundangan').length
    };
  }, [data]);

  const handleSort = (key: keyof DataRecord) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const toggleStatus = (id: number) => {
    const item = data.find(i => i.id === id);
    if (!item) return;

    const newStatus = item.status === 'Sudah Kundangan' ? 'Belum Kundangan' : 'Sudah Kundangan';
    setModalConfig({
      isOpen: true,
      id,
      name: item.nama,
      nextStatus: newStatus
    });
  };

  const confirmToggle = async () => {
    if (modalConfig.id === null) return;

    try {
      const { error } = await supabase
        .from('kundangan')
        .update({ status: modalConfig.nextStatus })
        .eq('id', modalConfig.id);

      if (error) throw error;

      setData(prevData => prevData.map(item => {
        if (item.id === modalConfig.id) {
          return {
            ...item,
            status: modalConfig.nextStatus as any
          };
        }
        return item;
      }));
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Gagal memperbarui status. Pastikan koneksi internet stabil.');
    } finally {
      setModalConfig(prev => ({ ...prev, isOpen: false }));
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(value);
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-rose-50/50 via-slate-50 to-slate-50 text-slate-900 font-sans">
      {/* Custom Modal */}
      <AnimatePresence>
        {modalConfig.isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setModalConfig(prev => ({ ...prev, isOpen: false }))}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl border border-slate-100"
            >
              <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mb-6 mx-auto">
                <Filter size={32} />
              </div>
              <h3 className="text-xl font-black text-center text-slate-900 mb-2">Konfirmasi Perubahan</h3>
              <p className="text-sm text-slate-500 text-center mb-8 leading-relaxed">
                Apakah Anda yakin ingin mengubah status <span className="font-bold text-slate-900">"{modalConfig.name}"</span> menjadi <span className="font-bold text-rose-600">"{modalConfig.nextStatus}"</span>?
              </p>
              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={() => setModalConfig(prev => ({ ...prev, isOpen: false }))}
                  className="px-6 py-3 rounded-2xl text-sm font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 transition-all"
                >
                  Batal
                </button>
                <button 
                  onClick={confirmToggle}
                  className="px-6 py-3 rounded-2xl text-sm font-bold text-white bg-rose-600 hover:bg-rose-700 shadow-lg shadow-rose-200 transition-all active:scale-95"
                >
                  Ya, Ubah
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Header Section */}
      <header className="sticky top-0 z-30 bg-white border-b border-slate-200 px-4 py-6 shadow-sm">
        <div className="max-w-6xl mx-auto flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-2xl font-black tracking-tight text-slate-900 leading-tight">Data Tamu Kundangan Mang Ardat</h1>
              <p className="text-[10px] font-black text-rose-500/80 italic tracking-[0.2em] uppercase mt-0.5 flex items-center gap-1.5">
                <span className="w-4 h-[1px] bg-rose-200"></span>
                Salam Lambat Sugih
                <span className="w-4 h-[1px] bg-rose-200"></span>
              </p>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <span className="text-sm text-slate-500 font-medium">Daftar tamu aktif</span>
                <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-black rounded-full uppercase tracking-wider">
                  Total: {data.length}
                </span>
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-black rounded-full uppercase tracking-wider">
                  Sudah: {stats.sudah}
                </span>
                <span className="px-2 py-0.5 bg-red-100 text-red-700 text-[10px] font-black rounded-full uppercase tracking-wider">
                  Belum: {stats.belum}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative group w-full sm:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-rose-500 transition-colors" size={20} />
                <input 
                  type="text" 
                  placeholder="Cari nama atau alamat..." 
                  className="pl-10 pr-10 py-3 bg-slate-100 border-2 border-transparent rounded-xl text-sm w-full focus:border-rose-500/20 focus:bg-white transition-all outline-none shadow-inner"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                {search && (
                  <button 
                    onClick={() => setSearch('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-200 rounded-full text-slate-400 hover:text-rose-600 transition-all"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
              <button 
                onClick={fetchData}
                className="p-3 bg-slate-100 hover:bg-rose-50 rounded-xl transition-all text-slate-400 hover:text-rose-600 border-2 border-transparent hover:border-rose-100 shrink-0 shadow-sm active:scale-95"
                title="Refresh Data"
              >
                <RefreshCw size={20} className={cn(loading && "animate-spin")} />
              </button>
            </div>
            
            <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-xl w-full sm:w-auto">
              <Filter size={16} className="ml-2 text-slate-400" />
              <div className="flex gap-1 w-full sm:w-auto">
                {[50, 100, 'all'].map((limit) => (
                  <button
                    key={limit}
                    onClick={() => setDataLimit(limit as any)}
                    className={cn(
                      "flex-1 sm:flex-none px-4 py-1.5 rounded-lg text-xs font-black transition-all",
                      dataLimit === limit 
                        ? "bg-white text-rose-600 shadow-sm" 
                        : "text-slate-500 hover:text-slate-700"
                    )}
                  >
                    {limit === 'all' ? 'Semua' : limit}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Responsive Container */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xl shadow-slate-200/50 overflow-hidden min-h-[400px] relative">
          
          {loading && data.length === 0 && (
            <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] z-10 flex items-center justify-center">
              <div className="flex flex-col items-center gap-3">
                <RefreshCw size={40} className="text-rose-600 animate-spin" />
                <p className="text-sm font-bold text-slate-500">Memuat data dari cloud...</p>
              </div>
            </div>
          )}
          
          {/* Desktop Table View (Hidden on small screens) */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-6 py-5 text-xs font-black text-slate-400 uppercase tracking-widest cursor-pointer hover:text-rose-600 transition-colors" onClick={() => handleSort('id')}>
                    <div className="flex items-center gap-2">No <ArrowUpDown size={14} /></div>
                  </th>
                  <th className="px-6 py-5 text-xs font-black text-slate-400 uppercase tracking-widest cursor-pointer hover:text-rose-600 transition-colors" onClick={() => handleSort('nama')}>
                    <div className="flex items-center gap-2">Nama Tamu <ArrowUpDown size={14} /></div>
                  </th>
                  <th className="px-6 py-5 text-xs font-black text-slate-400 uppercase tracking-widest cursor-pointer hover:text-rose-600 transition-colors" onClick={() => handleSort('nominal')}>
                    <div className="flex items-center gap-2">Nominal <ArrowUpDown size={14} /></div>
                  </th>
                  <th className="px-6 py-5 text-xs font-black text-slate-400 uppercase tracking-widest cursor-pointer hover:text-rose-600 transition-colors" onClick={() => handleSort('alamat')}>
                    <div className="flex items-center gap-2">Alamat <ArrowUpDown size={14} /></div>
                  </th>
                  <th className="px-6 py-5 text-xs font-black text-slate-400 uppercase tracking-widest cursor-pointer hover:text-rose-600 transition-colors" onClick={() => handleSort('status')}>
                    <div className="flex items-center gap-2">Status <ArrowUpDown size={14} /></div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {displayedData.length <= 50 ? (
                  <AnimatePresence mode="popLayout">
                    {displayedData.map((item) => (
                      <motion.tr 
                        layout
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        key={item.id}
                        className="hover:bg-rose-50/40 transition-all duration-200 group border-b border-slate-100 last:border-0"
                      >
                        <TableRowContent 
                          item={item} 
                          toggleStatus={toggleStatus} 
                          formatCurrency={formatCurrency} 
                        />
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                ) : (
                  displayedData.map((item) => (
                    <tr 
                      key={item.id}
                      className="hover:bg-rose-50/40 transition-all duration-200 group border-b border-slate-100 last:border-0"
                    >
                      <TableRowContent 
                        item={item} 
                        toggleStatus={toggleStatus} 
                        formatCurrency={formatCurrency} 
                      />
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile List View (Visible only on small screens) */}
          <div className="md:hidden divide-y divide-slate-100">
            {displayedData.length <= 50 ? (
              <AnimatePresence mode="popLayout">
                {displayedData.map((item) => (
                  <motion.div 
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    key={item.id}
                  >
                    <MobileCardContent 
                      item={item} 
                      toggleStatus={toggleStatus} 
                      formatCurrency={formatCurrency} 
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            ) : (
              displayedData.map((item) => (
                <MobileCardContent 
                  key={item.id} 
                  item={item} 
                  toggleStatus={toggleStatus} 
                  formatCurrency={formatCurrency} 
                />
              ))
            )}
          </div>

          {/* Empty State */}
          {!loading && filteredData.length === 0 && (
            <div className="py-24 flex flex-col items-center justify-center text-slate-400">
              <Search size={64} className="mb-4 opacity-10" />
              <p className="text-xl font-bold">Data tidak ditemukan</p>
              <button 
                onClick={() => setSearch('')}
                className="mt-4 px-6 py-2 bg-rose-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-rose-200 hover:bg-rose-700 transition-all"
              >
                Reset Pencarian
              </button>
            </div>
          )}

          {/* Simple Footer Info */}
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              Menampilkan {displayedData.length} dari {filteredData.length} hasil
            </div>
            {filteredData.length > (dataLimit === 'all' ? Infinity : dataLimit) && (
              <div className="text-[10px] font-black text-rose-500 uppercase tracking-widest animate-pulse">
                Gunakan filter untuk melihat lebih banyak
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
