export interface DataRecord {
  id: number;
  nama: string;
  nominal: number;
  alamat: string;
  tanggal: string;
  status: 'Sudah Kundangan' | 'Belum Kundangan';
}

const names = [
  "Budi Santoso", "Siti Aminah", "Agus Setiawan", "Dewi Lestari", "Eko Prasetyo",
  "Rina Wijaya", "Andi Pratama", "Maya Sari", "Hendra Kurniawan", "Lani Cahyani",
  "Taufik Hidayat", "Indah Permata", "Rizky Ramadhan", "Siska Putri", "Doni Saputra",
  "Ani Suryani", "Fajar Nugraha", "Yanti Rahayu", "Bambang Susilo", "Ratna Sari",
  "Dedi Irawan", "Linda Waty", "Aris Munandar", "Novi Anggraini", "Guntur Wibowo",
  "Mega Utami", "Rian Hidayat", "Santi Rahmawati", "Yuda Pratama", "Dian Kusuma",
  "Aditya Nugroho", "Fitri Handayani", "Iwan Setiawan", "Wulan Sari", "Joko Susilo",
  "Sri Wahyuni", "Ahmad Fauzi", "Eni Lestari", "Rudi Hermawan", "Tini Kartini",
  "Arif Rahman", "Yulia Putri", "Zainal Abidin", "Desi Ratnasari", "Hadi Saputra",
  "Nining Ningsih", "Eka Saputra", "Ratih Purwasih", "Anton Wijaya", "Sari Indah"
];

const cities = [
  "Jakarta", "Surabaya", "Bandung", "Medan", "Semarang",
  "Makassar", "Palembang", "Tangerang", "Depok", "Bekasi",
  "Bogor", "Malang", "Yogyakarta", "Solo", "Denpasar"
];

const statuses = ["Sudah Kundangan", "Belum Kundangan"] as const;

export const generateSampleData = (count: number): DataRecord[] => {
  return Array.from({ length: count }, (_, i) => {
    const nameIndex = i % names.length;
    const cityIndex = Math.floor(Math.random() * cities.length);
    const statusIndex = Math.floor(Math.random() * statuses.length);
    
    return {
      id: i + 1,
      nama: names[nameIndex] + (i >= names.length ? ` ${Math.floor(i / names.length) + 1}` : ""),
      nominal: Math.floor(Math.random() * 900000) + 100000, // 100k to 1M
      alamat: `Jl. ${names[Math.floor(Math.random() * names.length)].split(' ')[0]} No. ${Math.floor(Math.random() * 100) + 1}, ${cities[cityIndex]}`,
      tanggal: new Date(2024, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1).toISOString(),
      status: statuses[statusIndex]
    };
  });
};
