import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { 
  Package, 
  FileText, 
  Calendar as CalendarIcon, 
  Receipt, 
  QrCode, 
  Plus, 
  Trash2, 
  Printer, 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle2, 
  User, 
  Car, 
  Save,
  ArrowRight,
  Clock,
  X,
  CheckCircle,
  DollarSign,
  FolderOpen,
  LogOut,
  Lock
} from 'lucide-react';

export default function App() {
  // --- STANJE ZA AUTENTIFIKACIJU (LOGIN) ---
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loginForma, setLoginForma] = useState({ username: '', password: '' });
  const [loginGreska, setLoginGreska] = useState('');

  const [activeTab, setActiveTab] = useState('magacin');
  const [podTabNalog, setPodTabNalog] = useState('novi');

  // --- STANJE I FUNKCIJE: MAGACIN ---
  const [magacin, setMagacin] = useState([]);
  const [noviArtikal, setNoviArtikal] = useState({ sifra: '', naziv: '', nabavnaCena: '', prodajnaCena: '', kolicina: '' });

  useEffect(() => {
    if (isLoggedIn) {
      ucitajSvePodatke();
    }
  }, [isLoggedIn]);

  const handleLogin = (e) => {
    e.preventDefault();
    if (loginForma.username.trim() === 'admin' && loginForma.password === 'admin123') {
      setIsLoggedIn(true);
      setLoginGreska('');
      setLoginForma({ username: '', password: '' });
    } else {
      setLoginGreska('Pogrešno korisničko ime ili lozinka!');
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
  };

  const ucitajSvePodatke = () => {
    ucitajMagacin();
    ucitajRadneNaloge();
    ucitajPredracune();
    ucitajTermine();
  };

  const ucitajMagacin = async () => {
    const { data, error } = await supabase.from('magacin').select('*');
    if (error) {
      console.error('Greška pri učitavanju magacina:', error);
    } else if (data) {
      setMagacin(data.map(art => ({
        id: art.id,
        sifra: art.sifra,
        naziv: art.naziv,
        nabavnaCena: art.nabavna_cena,
        prodajnaCena: art.prodajna_cena,
        kolicina: art.kolicina
      })));
    }
  };

  const dodajArtikal = async (e) => {
    e.preventDefault();
    if (!noviArtikal.naziv || !noviArtikal.prodajnaCena) return;

    const noviRed = {
      sifra: noviArtikal.sifra || `ART-${Date.now().toString().slice(-4)}`,
      naziv: noviArtikal.naziv,
      nabavna_cena: Number(noviArtikal.nabavnaCena) || 0,
      prodajna_cena: Number(noviArtikal.prodajnaCena) || 0,
      kolicina: Number(noviArtikal.kolicina) || 0
    };

    const { data, error } = await supabase.from('magacin').insert([noviRed]).select();

    if (error) {
      console.error('Greška pri upisu u bazu:', error);
      alert('Greška pri čuvanju artikla u bazu!');
    } else if (data && data.length > 0) {
      setMagacin([...magacin, {
        id: data[0].id,
        sifra: data[0].sifra,
        naziv: data[0].naziv,
        nabavnaCena: data[0].nabavna_cena,
        prodajnaCena: data[0].prodajna_cena,
        kolicina: data[0].kolicina
      }]);
      setNoviArtikal({ sifra: '', naziv: '', nabavnaCena: '', prodajnaCena: '', kolicina: '' });
    }
  };

  const obrisiArtikal = async (id) => {
    const { error } = await supabase.from('magacin').delete().eq('id', id);
    if (error) console.error('Greška pri brisanju:', error);
    else setMagacin(magacin.filter(a => a.id !== id));
  };

  const izmeniArtikalPolje = async (id, polje, vrednost) => {
    const azuriraniMagacin = magacin.map(art => {
      if (art.id === id) {
        return { ...art, [polje]: polje === 'naziv' || polje === 'sifra' ? vrednost : Number(vrednost) };
      }
      return art;
    });
    setMagacin(azuriraniMagacin);

    const artZaIzmenu = azuriraniMagacin.find(a => a.id === id);
    if (artZaIzmenu) {
      await supabase.from('magacin').update({
        sifra: artZaIzmenu.sifra,
        naziv: artZaIzmenu.naziv,
        nabavna_cena: artZaIzmenu.nabavnaCena,
        prodajna_cena: artZaIzmenu.prodajnaCena,
        kolicina: artZaIzmenu.kolicina
      }).eq('id', id);
    }
  };

  const ukupnaNabavnaVrednost = magacin.reduce((acc, curr) => acc + (curr.nabavnaCena * curr.kolicina), 0);
  const ukupnaProdajnaVrednost = magacin.reduce((acc, curr) => acc + (curr.prodajnaCena * curr.kolicina), 0);
  const ukupnaProcjenjenaZarada = ukupnaProdajnaVrednost - ukupnaNabavnaVrednost;

  // --- STANJE I FUNKCIJE: RADNI NALOG ---
  const [radniNalozi, setRadniNalozi] = useState([]);
  const [trenutniNalog, setTrenutniNalog] = useState({
    broj: 'RN-2026-001',
    datum: new Date().toISOString().split('T')[0],
    ime: '',
    prezime: '',
    telefon: '',
    modelVozila: '',
    brojSasije: '',
    registracija: '',
    stavke: [],
    napomena: ''
  });
  const [stavkaPretraga, setStavkaPretraga] = useState('');
  const [odabraniMagacinArtikal, setOdabraniMagacinArtikal] = useState(null);
  const [stavkaKolicina, setStavkaKolicina] = useState(1);
  const [ručniNaziv, setRučniNaziv] = useState('');
  const [ručniCena, setRučniCena] = useState('');
  const [ručniKolicina, setRučniKolicina] = useState(1);
  const [aktivniNalogZaStampu, setAktivniNalogZaStampu] = useState(null);

  const ucitajRadneNaloge = async () => {
    const { data, error } = await supabase.from('radni_nalozi').select('*').order('id', { ascending: false });
    if (error) {
      console.error('Greška pri učitavanju naloga:', error);
    } else if (data) {
      setRadniNalozi(data.map(rn => ({
        id: rn.id,
        broj: rn.broj,
        datum: rn.datum,
        ime: rn.ime,
        prezime: rn.prezime,
        telefon: rn.telefon,
        modelVozila: rn.model_vozila,
        brojSasije: rn.broj_sasije,
        registracija: rn.registracija,
        stavke: rn.stavke || []
      })));
    }
  };

  const dodajStavkuIzMagacina = () => {
    if (!odabraniMagacinArtikal) return;
    const art = magacin.find(a => a.id === Number(odabraniMagacinArtikal));
    if (!art || art.kolicina < stavkaKolicina) {
      alert('Nema dovoljno artikla na stanju!');
      return;
    }

    izmeniArtikalPolje(art.id, 'kolicina', art.kolicina - stavkaKolicina);

    const novaStavka = {
      id: Date.now(),
      tip: 'magacin',
      magacinId: art.id,
      sifra: art.sifra,
      naziv: art.naziv,
      cena: art.prodajnaCena,
      kolicina: stavkaKolicina
    };
    setTrenutniNalog({ ...trenutniNalog, stavke: [...trenutniNalog.stavke, novaStavka] });
    setOdabraniMagacinArtikal(null);
    setStavkaKolicina(1);
    setStavkaPretraga('');
  };

  const dodajRucnuStavku = () => {
    if (!ručniNaziv || !ručniCena) return;
    const novaStavka = {
      id: Date.now(),
      tip: 'rucno',
      sifra: 'USLUGA',
      naziv: ručniNaziv,
      cena: Number(ručniCena),
      kolicina: Number(ručniKolicina) || 1
    };
    setTrenutniNalog({ ...trenutniNalog, stavke: [...trenutniNalog.stavke, novaStavka] });
    setRučniNaziv('');
    setRučniCena('');
    setRučniKolicina(1);
  };

  const ukloniStavkuSaNaloga = (stavkaId) => {
    const stavkaZaUklanjanje = trenutniNalog.stavke.find(s => s.id === stavkaId);
    if (stavkaZaUklanjanje && stavkaZaUklanjanje.tip === 'magacin') {
      const art = magacin.find(a => a.id === stavkaZaUklanjanje.magacinId);
      if (art) {
        izmeniArtikalPolje(art.id, 'kolicina', art.kolicina + stavkaZaUklanjanje.kolicina);
      }
    }
    setTrenutniNalog({
      ...trenutniNalog,
      stavke: trenutniNalog.stavke.filter(s => s.id !== stavkaId)
    });
  };

  const sacuvajRadniNalog = async () => {
    if (!trenutniNalog.ime || trenutniNalog.stavke.length === 0) {
      alert('Unesite podatke klijenta i bar jednu stavku!');
      return;
    }

    const noviNalog = {
      broj: trenutniNalog.broj,
      datum: trenutniNalog.datum,
      ime: trenutniNalog.ime,
      prezime: trenutniNalog.prezime,
      telefon: trenutniNalog.telefon,
      model_vozila: trenutniNalog.modelVozila,
      broj_sasije: trenutniNalog.brojSasije,
      registracija: trenutniNalog.registracija,
      stavke: trenutniNalog.stavke
    };

    const { error } = await supabase.from('radni_nalozi').insert([noviNalog]);

    if (error) {
      console.error('Greška:', error);
      alert('Greška pri čuvanju radnog naloga u bazu!');
    } else {
      alert('Radni nalog uspešno sačuvan u bazu!');
      ucitajRadneNaloge();
      setTrenutniNalog({
        broj: `RN-2026-${String(radniNalozi.length + 2).padStart(3, '0')}`,
        datum: new Date().toISOString().split('T')[0],
        ime: '',
        prezime: '',
        telefon: '',
        modelVozila: '',
        brojSasije: '',
        registracija: '',
        stavke: [],
        napomena: ''
      });
      setPodTabNalog('arhiva');
    }
  };

  // --- STANJE I FUNKCIJE: KALENDAR ---
  const [trenutniDatum, setTrenutniDatum] = useState(new Date());
  const [zakazanaVozila, setZakazanaVozila] = useState({});
  const [prikaziModalDana, setPrikaziModalDana] = useState(false);
  const [izabraniDatumZaPregled, setIzabraniDatumZaPregled] = useState('');
  const [noviTermin, setNoviTermin] = useState({ vreme: '09:00', klijent: '', auto: '', opis: '', cena: '' });

  const ucitajTermine = async () => {
    const { data, error } = await supabase.from('termini').select('*');
    if (error) {
      console.error('Greška pri učitavanju termina:', error);
    } else if (data) {
      const grupissani = {};
      data.forEach(t => {
        const datumKey = t.datum;
        if (!grupissani[datumKey]) grupissani[datumKey] = [];
        grupissani[datumKey].push({
          id: t.id,
          vreme: t.vreme,
          klijent: t.klijent,
          auto: t.auto,
          opis: t.opis,
          cena: t.cena,
          zavrseno: t.zavrseno
        });
      });
      setZakazanaVozila(grupissani);
    }
  };

  const promeniMesec = (korak) => {
    const novi = new Date(trenutniDatum);
    novi.setMonth(novi.getMonth() + korak);
    setTrenutniDatum(novi);
  };

  const godina = trenutniDatum.getFullYear();
  const mesec = trenutniDatum.getMonth();
  const naziviMjeseca = ['Januar', 'Februar', 'Mart', 'April', 'Maj', 'Jun', 'Jul', 'Avgust', 'Septembar', 'Oktobar', 'Novembar', 'Decembar'];

  const daniUmesecu = new Date(godina, mesec + 1, 0).getDate();
  const prviDanUmesecu = (() => {
    let d = new Date(godina, mesec, 1).getDay();
    return d === 0 ? 6 : d - 1;
  })();

  const otvoriPregledDana = (danStr) => {
    setIzabraniDatumZaPregled(danStr);
    setNoviTermin({ vreme: '09:00', klijent: '', auto: '', opis: '', cena: '' });
    setPrikaziModalDana(true);
  };

  const sacuvajTermin = async (e) => {
    e.preventDefault();
    if (!noviTermin.klijent || !izabraniDatumZaPregled) return;

    const novi = {
      datum: izabraniDatumZaPregled,
      vreme: noviTermin.vreme,
      klijent: noviTermin.klijent,
      auto: noviTermin.auto,
      opis: noviTermin.opis,
      cena: Number(noviTermin.cena) || 0,
      zavrseno: false
    };

    const { error } = await supabase.from('termini').insert([novi]);
    if (error) {
      console.error('Greška pri čuvanju termina:', error);
    } else {
      ucitajTermine();
      setNoviTermin({ vreme: '09:00', klijent: '', auto: '', opis: '', cena: '' });
    }
  };

  const toggleZavrsenTermin = async (datumStr, terminId) => {
    const postojeci = zakazanaVozila[datumStr] || [];
    const t = postojeci.find(x => x.id === terminId);
    if (!t) return;

    const { error } = await supabase.from('termini').update({ zavrseno: !t.zavrseno }).eq('id', terminId);
    if (error) console.error(error);
    else ucitajTermine();
  };

  const obrisiTermin = async (datumStr, terminId) => {
    const { error } = await supabase.from('termini').delete().eq('id', terminId);
    if (error) console.error(error);
    else ucitajTermine();
  };

  // --- STANJE I FUNKCIJE: PREDRAČUN ---
  const [predracuni, setPredracuni] = useState([]);
  const [trenutniPredracun, setTrenutniPredracun] = useState({
    broj: 'PR-2026-001',
    datum: new Date().toISOString().split('T')[0],
    nazivFirme: '',
    pib: '',
    maticniBroj: '',
    adresa: '',
    imeKlijenta: '',
    modelVozila: '',
    stavke: []
  });
  const [prStavkaNaziv, setPrStavkaNaziv] = useState('');
  const [prStavkaCena, setPrStavkaCena] = useState('');
  const [prStavkaKolicina, setPrStavkaKolicina] = useState(1);
  const [aktivniPredracunZaStampu, setAktivniPredracunZaStampu] = useState(null);

  const ucitajPredracune = async () => {
    const { data, error } = await supabase.from('predracuni').select('*').order('id', { ascending: false });
    if (error) {
      console.error('Greška pri učitavanju predračuna:', error);
    } else if (data) {
      setPredracuni(data.map(p => ({
        id: p.id,
        broj: p.broj,
        datum: p.datum,
        nazivFirme: p.naziv_firme,
        pib: p.pib,
        maticniBroj: p.maticni_broj,
        adresa: p.adresa,
        imeKlijenta: p.ime_klijenta,
        modelVozila: p.model_vozila,
        stavke: p.stavke || []
      })));
    }
  };

  const dodajStavkuPredracuna = () => {
    if (!prStavkaNaziv || !prStavkaCena) return;
    const nova = {
      id: Date.now(),
      naziv: prStavkaNaziv,
      cena: Number(prStavkaCena),
      kolicina: Number(prStavkaKolicina) || 1
    };
    setTrenutniPredracun({ ...trenutniPredracun, stavke: [...trenutniPredracun.stavke, nova] });
    setPrStavkaNaziv('');
    setPrStavkaCena('');
    setPrStavkaKolicina(1);
  };

  const sacuvajPredracun = async () => {
    if (!trenutniPredracun.nazivFirme || trenutniPredracun.stavke.length === 0) {
      alert('Unesite naziv firme i bar jednu stavku predračuna!');
      return;
    }

    const noviPR = {
      broj: trenutniPredracun.broj,
      datum: trenutniPredracun.datum,
      naziv_firme: trenutniPredracun.nazivFirme,
      pib: trenutniPredracun.pib,
      maticni_broj: trenutniPredracun.maticniBroj,
      adresa: trenutniPredracun.adresa,
      ime_klijenta: trenutniPredracun.imeKlijenta,
      model_vozila: trenutniPredracun.modelVozila,
      stavke: trenutniPredracun.stavke
    };

    const { error } = await supabase.from('predracuni').insert([noviPR]);
    if (error) {
      console.error('Greška:', error);
      alert('Greška pri sačuvavanju predračuna u bazu!');
    } else {
      alert('Predračun uspešno sačuvan!');
      ucitajPredracune();
      setTrenutniPredracun({
        broj: `PR-2026-${String(predracuni.length + 2).padStart(3, '0')}`,
        datum: new Date().toISOString().split('T')[0],
        nazivFirme: '',
        pib: '',
        maticniBroj: '',
        adresa: '',
        imeKlijenta: '',
        modelVozila: '',
        stavke: []
      });
    }
  };

  const prebaciPredracunUNalog = (pr) => {
    setTrenutniNalog({
      ...trenutniNalog,
      ime: pr.imeKlijenta || pr.nazivFirme,
      modelVozila: pr.modelVozila,
      stavke: pr.stavke.map(s => ({ ...s, tip: 'rucno', sifra: 'PRED' }))
    });
    setActiveTab('radni-nalog');
    setPodTabNalog('novi');
  };

  // --- STANJE: ČITAČ SAOBRAĆAJNE ---
  const [prikaziSkener, setPrikaziSkener] = useState(false);

  const simulirajSkeniranje = () => {
    setTrenutniNalog({
      ...trenutniNalog,
      ime: 'Marko',
      prezime: 'Marković',
      telefon: '064/123-4567',
      modelVozila: 'Volkswagen Golf 7 1.6 TDI',
      brojSasije: 'WVWZZZAUZFW123456',
      registracija: 'BG-1234-AB'
    });
    setPrikaziSkener(false);
  };

  // --- PRIKAZ LOGIN EKRANA AKO KORISNIK NIJE ULOGOVAN ---
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 font-sans">
        <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl max-w-md w-full space-y-6 shadow-2xl">
          <div className="text-center space-y-2">
            <div className="bg-blue-600 text-white font-black tracking-wider w-12 h-12 rounded-2xl flex items-center justify-center mx-auto text-xl shadow-lg shadow-blue-600/30 mb-4">
              NB
            </div>
            <h2 className="text-2xl font-bold text-white tracking-tight">Prijava na sistem</h2>
            <p className="text-xs text-slate-400">Unesite pristupne podatke za NB CRM sistem</p>
          </div>

          {loginGreska && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-xs p-3 rounded-xl text-center">
              {loginGreska}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Korisničko ime / Email</label>
              <div className="relative">
                <User size={16} className="absolute left-3 top-3 text-slate-500" />
                <input 
                  type="text" 
                  value={loginForma.username}
                  onChange={e => setLoginForma({...loginForma, username: e.target.value})}
                  placeholder="admin"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 transition"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Lozinka</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-3 text-slate-500" />
                <input 
                  type="password" 
                  value={loginForma.password}
                  onChange={e => setLoginForma({...loginForma, password: e.target.value})}
                  placeholder="••••••••"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 transition"
                  required
                />
              </div>
            </div>

            <button 
              type="submit" 
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2.5 rounded-xl text-sm transition shadow-lg shadow-blue-600/25 mt-2"
            >
              Prijavi se
            </button>
          </form>

          <p className="text-[11px] text-slate-500 text-center">
            Podaci za test: <span className="text-slate-400 font-mono">admin</span> / <span className="text-slate-400 font-mono">admin123</span>
          </p>
        </div>
      </div>
    );
  }

  // --- GLAVNA APLIKACIJA NAKON LOGINA ---
  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans">
      {/* GLAVNI MENI */}
      <header className="bg-slate-950 border-b border-slate-800 px-6 py-4 flex items-center justify-between shadow-md">
        <div className="flex items-center space-x-3">
          <div className="bg-blue-600 p-2 rounded-xl text-white font-black tracking-wider shadow-lg shadow-blue-600/30">
            NB
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white">NB CRM sistem</h1>
            <p className="text-xs text-slate-400">Upravljanje autoservisom i magacinom</p>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <nav className="flex space-x-2 bg-slate-900 p-1 rounded-xl border border-slate-800">
            <button 
              onClick={() => setActiveTab('magacin')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'magacin' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
            >
              <Package size={16} />
              <span>Magacin</span>
            </button>
            <button 
              onClick={() => setActiveTab('radni-nalog')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'radni-nalog' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
            >
              <FileText size={16} />
              <span>Radni nalog</span>
            </button>
            <button 
              onClick={() => setActiveTab('kalendar')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'kalendar' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
            >
              <CalendarIcon size={16} />
              <span>Kalendar</span>
            </button>
            <button 
              onClick={() => setActiveTab('predracun')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'predracun' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
            >
              <Receipt size={16} />
              <span>Predračun</span>
            </button>
          </nav>

          <button 
            onClick={handleLogout}
            title="Odjavi se"
            className="flex items-center space-x-1.5 bg-slate-900 hover:bg-red-600/20 hover:text-red-400 border border-slate-800 text-slate-400 px-3 py-2 rounded-xl text-xs font-semibold transition"
          >
            <LogOut size={16} />
            <span className="hidden sm:inline">Odjavi se</span>
          </button>
        </div>
      </header>

      {/* SADRŽAJ STRANICA */}
      <main className="flex-1 p-6 max-w-7xl mx-auto w-full">
        
        {/* 1. MAGACIN MODUL */}
        {activeTab === 'magacin' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-slate-800 border border-slate-700 p-4 rounded-xl">
                <p className="text-sm text-slate-400">Ukupna nabavna vrednost</p>
                <p className="text-2xl font-bold text-slate-200 mt-1">{ukupnaNabavnaVrednost.toLocaleString()} RSD</p>
              </div>
              <div className="bg-slate-800 border border-slate-700 p-4 rounded-xl">
                <p className="text-sm text-slate-400">Ukupna prodajna vrednost</p>
                <p className="text-2xl font-bold text-blue-400 mt-1">{ukupnaProdajnaVrednost.toLocaleString()} RSD</p>
              </div>
              <div className="bg-slate-800 border border-slate-700 p-4 rounded-xl">
                <p className="text-sm text-slate-400">Procenjena zarada (marža)</p>
                <p className="text-2xl font-bold text-emerald-400 mt-1">{ukupnaProcjenjenaZarada.toLocaleString()} RSD</p>
              </div>
            </div>

            <div className="bg-slate-800 border border-slate-700 p-5 rounded-xl shadow-lg">
              <h3 className="text-lg font-semibold mb-4 text-white">Dodaj novi artikal u magacin</h3>
              <form onSubmit={dodajArtikal} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                <input 
                  type="text" 
                  placeholder="Šifra (opciono)" 
                  value={noviArtikal.sifra}
                  onChange={e => setNoviArtikal({...noviArtikal, sifra: e.target.value})}
                  className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                />
                <input 
                  type="text" 
                  placeholder="Naziv artikla *" 
                  value={noviArtikal.naziv}
                  onChange={e => setNoviArtikal({...noviArtikal, naziv: e.target.value})}
                  className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                />
                <input 
                  type="number" 
                  placeholder="Nabavna cena (RSD) *" 
                  value={noviArtikal.nabavnaCena}
                  onChange={e => setNoviArtikal({...noviArtikal, nabavnaCena: e.target.value})}
                  className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                />
                <input 
                  type="number" 
                  placeholder="Prodajna cena (RSD) *" 
                  value={noviArtikal.prodajnaCena}
                  onChange={e => setNoviArtikal({...noviArtikal, prodajnaCena: e.target.value})}
                  className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                />
                <div className="flex space-x-2">
                  <input 
                    type="number" 
                    placeholder="Količina" 
                    value={noviArtikal.kolicina}
                    onChange={e => setNoviArtikal({...noviArtikal, kolicina: e.target.value})}
                    className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white w-full focus:outline-none focus:border-blue-500"
                  />
                  <button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg font-medium flex items-center justify-center transition">
                    <Plus size={18} />
                  </button>
                </div>
              </form>
            </div>

            <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden shadow-lg">
              <div className="px-6 py-4 border-b border-slate-700 flex justify-between items-center">
                <h3 className="font-semibold text-white">Stanje na lageru</h3>
                <span className="text-xs text-slate-400">Izmene se automatski čuvaju u bazi</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-900 text-slate-400 text-xs uppercase tracking-wider border-b border-slate-700">
                      <th className="py-3 px-4">Šifra</th>
                      <th className="py-3 px-4">Naziv</th>
                      <th className="py-3 px-4">Nabavna cena</th>
                      <th className="py-3 px-4">Prodajna cena</th>
                      <th className="py-3 px-4">Količina</th>
                      <th className="py-3 px-4 text-right">Akcija</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700 text-sm">
                    {magacin.map(art => (
                      <tr key={art.id} className="hover:bg-slate-750 transition">
                        <td className="py-3 px-4">
                          <input 
                            type="text" 
                            value={art.sifra} 
                            onChange={(e) => izmeniArtikalPolje(art.id, 'sifra', e.target.value)}
                            className="bg-transparent border-b border-transparent hover:border-slate-500 focus:border-blue-500 focus:outline-none w-24 text-white"
                          />
                        </td>
                        <td className="py-3 px-4">
                          <input 
                            type="text" 
                            value={art.naziv} 
                            onChange={(e) => izmeniArtikalPolje(art.id, 'naziv', e.target.value)}
                            className="bg-transparent border-b border-transparent hover:border-slate-500 focus:border-blue-500 focus:outline-none w-full text-white font-medium"
                          />
                        </td>
                        <td className="py-3 px-4 text-slate-300">
                          <input 
                            type="number" 
                            value={art.nabavnaCena} 
                            onChange={(e) => izmeniArtikalPolje(art.id, 'nabavnaCena', e.target.value)}
                            className="bg-transparent border-b border-transparent hover:border-slate-500 focus:border-blue-500 focus:outline-none w-24 text-white"
                          /> RSD
                        </td>
                        <td className="py-3 px-4 text-blue-400 font-semibold">
                          <input 
                            type="number" 
                            value={art.prodajnaCena} 
                            onChange={(e) => izmeniArtikalPolje(art.id, 'prodajnaCena', e.target.value)}
                            className="bg-transparent border-b border-transparent hover:border-slate-500 focus:border-blue-500 focus:outline-none w-24 text-blue-400 font-semibold"
                          /> RSD
                        </td>
                        <td className="py-3 px-4">
                          <input 
                            type="number" 
                            value={art.kolicina} 
                            onChange={(e) => izmeniArtikalPolje(art.id, 'kolicina', e.target.value)}
                            className={`bg-transparent border-b border-transparent hover:border-slate-500 focus:border-blue-500 focus:outline-none w-16 font-bold ${art.kolicina <= 2 ? 'text-red-400' : 'text-white'}`}
                          />
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button onClick={() => obrisiArtikal(art.id)} className="text-red-400 hover:text-red-300 p-1 rounded transition">
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 2. RADNI NALOG MODUL */}
        {activeTab === 'radni-nalog' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center bg-slate-800 p-4 rounded-xl border border-slate-700">
              <div className="flex space-x-2">
                <button 
                  onClick={() => setPodTabNalog('novi')}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${podTabNalog === 'novi' ? 'bg-blue-600 text-white' : 'bg-slate-900 text-slate-400 hover:text-white'}`}
                >
                  Novi radni nalog
                </button>
                <button 
                  onClick={() => setPodTabNalog('arhiva')}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition flex items-center space-x-2 ${podTabNalog === 'arhiva' ? 'bg-blue-600 text-white' : 'bg-slate-900 text-slate-400 hover:text-white'}`}
                >
                  <FolderOpen size={16} />
                  <span>Arhiva naloga ({radniNalozi.length})</span>
                </button>
              </div>

              {podTabNalog === 'novi' && (
                <button 
                  onClick={() => setPrikaziSkener(true)}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center space-x-2 shadow transition"
                >
                  <QrCode size={16} />
                  <span>Čitač saobraćajne dozvole</span>
                </button>
              )}
            </div>

            {podTabNalog === 'novi' && (
              <>
                {prikaziSkener && (
                  <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
                    <div className="bg-slate-800 border border-slate-700 p-6 rounded-2xl max-w-md w-full space-y-4 shadow-2xl">
                      <div className="flex justify-between items-center">
                        <h4 className="font-bold text-lg text-white flex items-center space-x-2">
                          <QrCode className="text-emerald-400" />
                          <span>Skeniranje saobraćajne dozvole</span>
                        </h4>
                        <button onClick={() => setPrikaziSkener(false)} className="text-slate-400 hover:text-white">✕</button>
                      </div>
                      <p className="text-sm text-slate-300">Postavite saobraćajnu dozvolu ispred čitača ili kliknite dugme ispod za simulaciju.</p>
                      <div className="bg-slate-900 border-2 border-dashed border-slate-700 rounded-xl p-8 text-center space-y-2">
                        <div className="animate-pulse text-emerald-400 text-sm font-semibold">Čitanje podataka u toku...</div>
                      </div>
                      <div className="flex space-x-3">
                        <button onClick={simulirajSkeniranje} className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white py-2 rounded-lg font-medium text-sm transition">
                          Simuliraj uspešno čitanje
                        </button>
                        <button onClick={() => setPrikaziSkener(false)} className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg text-sm transition">
                          Otkaži
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="bg-slate-800 border border-slate-700 p-5 rounded-xl space-y-4">
                    <h4 className="font-semibold text-white border-b border-slate-700 pb-2 flex items-center space-x-2">
                      <User size={16} className="text-blue-400" />
                      <span>Podaci o klijentu i vozilu</span>
                    </h4>
                    <div>
                      <label className="text-xs text-slate-400 block mb-1">Ime klijenta</label>
                      <input 
                        type="text" 
                        value={trenutniNalog.ime}
                        onChange={e => setTrenutniNalog({...trenutniNalog, ime: e.target.value})}
                        placeholder="Npr. Petar"
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-400 block mb-1">Prezime klijenta</label>
                      <input 
                        type="text" 
                        value={trenutniNalog.prezime}
                        onChange={e => setTrenutniNalog({...trenutniNalog, prezime: e.target.value})}
                        placeholder="Npr. Petrović"
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-400 block mb-1">Telefon</label>
                      <input 
                        type="text" 
                        value={trenutniNalog.telefon}
                        onChange={e => setTrenutniNalog({...trenutniNalog, telefon: e.target.value})}
                        placeholder="06x/xxx-xxxx"
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-400 block mb-1">Model vozila</label>
                      <input 
                        type="text" 
                        value={trenutniNalog.modelVozila}
                        onChange={e => setTrenutniNalog({...trenutniNalog, modelVozila: e.target.value})}
                        placeholder="Audi A4 2.0 TDI"
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-400 block mb-1">Broj šasije (VIN)</label>
                      <input 
                        type="text" 
                        value={trenutniNalog.brojSasije}
                        onChange={e => setTrenutniNalog({...trenutniNalog, brojSasije: e.target.value})}
                        placeholder="WAUZZZ..."
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-400 block mb-1">Registarska oznaka</label>
                      <input 
                        type="text" 
                        value={trenutniNalog.registracija}
                        onChange={e => setTrenutniNalog({...trenutniNalog, registracija: e.target.value})}
                        placeholder="BG-000-XX"
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div className="lg:col-span-2 space-y-6">
                    <div className="bg-slate-800 border border-slate-700 p-5 rounded-xl space-y-4">
                      <h4 className="font-semibold text-white flex items-center space-x-2">
                        <Package size={16} className="text-blue-400" />
                        <span>Dodaj deo iz magacina</span>
                      </h4>
                      <div className="flex flex-col sm:flex-row gap-3">
                        <div className="relative flex-1">
                          <Search size={16} className="absolute left-3 top-3 text-slate-400" />
                          <input 
                            type="text"
                            placeholder="Kucajte naziv ili šifru..."
                            value={stavkaPretraga}
                            onChange={(e) => setStavkaPretraga(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                          />
                        </div>
                        <select 
                          value={odabraniMagacinArtikal || ''} 
                          onChange={e => setOdabraniMagacinArtikal(e.target.value)}
                          className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 flex-1"
                        >
                          <option value="">-- Izaberite iz rezultata --</option>
                          {magacin
                            .filter(a => a.naziv.toLowerCase().includes(stavkaPretraga.toLowerCase()) || a.sifra.toLowerCase().includes(stavkaPretraga.toLowerCase()))
                            .map(art => (
                              <option key={art.id} value={art.id}>
                                {art.naziv} ({art.prodajnaCena} RSD, Stanje: {art.kolicina})
                              </option>
                            ))}
                        </select>
                        <input 
                          type="number" 
                          min="1" 
                          value={stavkaKolicina} 
                          onChange={e => setStavkaKolicina(Number(e.target.value))}
                          className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white w-20 text-center"
                        />
                        <button 
                          onClick={dodajStavkuIzMagacina}
                          className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
                        >
                          Dodaj
                        </button>
                      </div>
                    </div>

                    <div className="bg-slate-800 border border-slate-700 p-5 rounded-xl space-y-4">
                      <h4 className="font-semibold text-white flex items-center space-x-2">
                        <FileText size={16} className="text-emerald-400" />
                        <span>Ručni unos stavke / usluge</span>
                      </h4>
                      <div className="flex flex-col sm:flex-row gap-3">
                        <input 
                          type="text" 
                          placeholder="Naziv usluge / dela" 
                          value={ručniNaziv}
                          onChange={e => setRučniNaziv(e.target.value)}
                          className="flex-2 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white w-full"
                        />
                        <input 
                          type="number" 
                          placeholder="Cena (RSD)" 
                          value={ručniCena}
                          onChange={e => setRučniCena(e.target.value)}
                          className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white w-32"
                        />
                        <input 
                          type="number" 
                          min="1" 
                          value={ručniKolicina}
                          onChange={e => setRučniKolicina(e.target.value)}
                          className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white w-20 text-center"
                        />
                        <button 
                          onClick={dodajRucnuStavku}
                          className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
                        >
                          Dodaj uslugu
                        </button>
                      </div>
                    </div>

                    <div className="bg-slate-800 border border-slate-700 p-5 rounded-xl space-y-4">
                      <h4 className="font-semibold text-white">Stavke na radnom nalogu ({trenutniNalog.stavke.length})</h4>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="bg-slate-900 text-slate-400 text-xs uppercase border-b border-slate-700">
                              <th className="py-2 px-3">Šifra</th>
                              <th className="py-2 px-3">Naziv</th>
                              <th className="py-2 px-3">Količina</th>
                              <th className="py-2 px-3">Cena</th>
                              <th className="py-2 px-3">Ukupno</th>
                              <th className="py-2 px-3 text-right">Akcija</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-700 text-sm">
                            {trenutniNalog.stavke.map(s => (
                              <tr key={s.id} className="hover:bg-slate-750">
                                <td className="py-2 px-3 text-slate-400 text-xs">{s.sifra}</td>
                                <td className="py-2 px-3 font-medium text-white">{s.naziv}</td>
                                <td className="py-2 px-3">{s.kolicina}</td>
                                <td className="py-2 px-3">{s.cena} RSD</td>
                                <td className="py-2 px-3 text-blue-400 font-semibold">{s.kolicina * s.cena} RSD</td>
                                <td className="py-2 px-3 text-right">
                                  <button onClick={() => ukloniStavkuSaNaloga(s.id)} className="text-red-400 hover:text-red-300">
                                    <Trash2 size={15} />
                                  </button>
                                </td>
                              </tr>
                            ))}
                            {trenutniNalog.stavke.length === 0 && (
                              <tr>
                                <td colSpan="6" className="text-center py-4 text-slate-400 text-sm">Nema dodatih stavki na nalogu.</td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>

                      {trenutniNalog.stavke.length > 0 && (
                        <div className="flex justify-between items-center pt-4 border-t border-slate-700">
                          <div className="text-lg font-bold text-white">
                            Ukupno za uplatu: <span className="text-emerald-400">{trenutniNalog.stavke.reduce((acc, curr) => acc + (curr.cena * curr.kolicina), 0).toLocaleString()} RSD</span>
                          </div>
                          <button onClick={sacuvajRadniNalog} className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2.5 rounded-lg font-semibold flex items-center space-x-2 transition shadow">
                            <Save size={16} />
                            <span>Sačuvaj radni nalog u bazu</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </>
            )}

            {podTabNalog === 'arhiva' && (
              <div className="bg-slate-800 border border-slate-700 p-6 rounded-xl space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-white">Arhiva sačuvanih radnih naloga (Iz Baze)</h3>
                  <p className="text-xs text-slate-400">Pregled svih izveštaja sačuvanih u Supabase bazi</p>
                </div>

                <div className="overflow-x-auto border border-slate-700 rounded-xl">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="bg-slate-900 text-slate-400 text-xs uppercase border-b border-slate-700">
                        <th className="py-3 px-4">Broj naloga</th>
                        <th className="py-3 px-4">Datum</th>
                        <th className="py-3 px-4">Klijent</th>
                        <th className="py-3 px-4">Vozilo / Registracija</th>
                        <th className="py-3 px-4">Ukupno (RSD)</th>
                        <th className="py-3 px-4 text-right">Akcija</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700">
                      {radniNalozi.map(rn => {
                        const ukupnoCena = (rn.stavke || []).reduce((acc, curr) => acc + (curr.cena * curr.kolicina), 0);
                        return (
                          <tr key={rn.id} className="hover:bg-slate-750 transition">
                            <td className="py-3 px-4 font-bold text-blue-400">{rn.broj}</td>
                            <td className="py-3 px-4 text-slate-300">{rn.datum}</td>
                            <td className="py-3 px-4 font-medium text-white">{rn.ime} {rn.prezime} ({rn.telefon})</td>
                            <td className="py-3 px-4 text-slate-300">{rn.modelVozila} [{rn.registracija || 'N/A'}]</td>
                            <td className="py-3 px-4 font-semibold text-emerald-400">{ukupnoCena.toLocaleString()} RSD</td>
                            <td className="py-3 px-4 text-right">
                              <button 
                                onClick={() => setAktivniNalogZaStampu(rn)}
                                className="bg-slate-900 hover:bg-blue-600 text-slate-200 hover:text-white px-3 py-1.5 rounded-lg border border-slate-700 flex items-center space-x-1.5 ml-auto text-xs font-semibold transition shadow"
                              >
                                <Printer size={14} />
                                <span> Štampaj</span>
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {radniNalozi.length === 0 && (
                  <div className="bg-slate-900 border border-slate-700 rounded-xl p-8 text-center text-slate-400 text-sm">
                    Još uvek nema sačuvanih radnih naloga u bazi.
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* 3. KALENDAR MODUL */}
        {activeTab === 'kalendar' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-center bg-slate-800 p-4 rounded-xl border border-slate-700 gap-4">
              <div className="flex items-center space-x-4">
                <h3 className="text-xl font-bold text-white">{naziviMjeseca[mesec]} {godina}.</h3>
                <div className="flex space-x-1">
                  <button onClick={() => promeniMesec(-1)} className="bg-slate-700 hover:bg-slate-600 p-2 rounded-lg text-white transition">
                    <ChevronLeft size={16} />
                  </button>
                  <button onClick={() => promeniMesec(1)} className="bg-slate-700 hover:bg-slate-600 p-2 rounded-lg text-white transition">
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
              <p className="text-xs text-slate-400">Termini i pazar se čuvaju u bazi podataka</p>
            </div>

            <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden p-4">
              <div className="grid grid-cols-7 gap-2 mb-2 text-center">
                {['Pon', 'Uto', 'Sre', 'Čet', 'Pet', 'Sub', 'Ned'].map((d, i) => (
                  <div key={i} className="text-xs font-bold text-slate-400 uppercase py-2">{d}</div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-2">
                {Array.from({ length: prviDanUmesecu }).map((_, i) => (
                  <div key={`prazno-${i}`} className="h-32 bg-slate-900/40 rounded-xl border border-slate-800/50 opacity-40"></div>
                ))}

                {Array.from({ length: daniUmesecu }).map((_, i) => {
                  const danBroj = i + 1;
                  const mesecStr = String(mesec + 1).padStart(2, '0');
                  const danStrPrav = String(danBroj).padStart(2, '0');
                  const datumKljuč = `${godina}-${mesecStr}-${danStrPrav}`;
                  const terminiZaDan = zakazanaVozila[datumKljuč] || [];
                  const zavrseniBroj = terminiZaDan.filter(t => t.zavrseno).length;

                  return (
                    <div 
                      key={datumKljuč}
                      onClick={() => otvoriPregledDana(datumKljuč)}
                      className="h-32 bg-slate-900 border border-slate-700/80 hover:border-blue-500 rounded-xl p-2 flex flex-col justify-between cursor-pointer transition group relative overflow-y-auto"
                    >
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-bold text-slate-300 group-hover:text-blue-400">{danBroj}</span>
                        {terminiZaDan.length > 0 && (
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${zavrseniBroj === terminiZaDan.length ? 'bg-emerald-600 text-white' : 'bg-blue-600 text-white'}`}>
                            {zavrseniBroj}/{terminiZaDan.length}
                          </span>
                        )}
                      </div>
                      
                      <div className="space-y-1 overflow-y-auto flex-1 my-1">
                        {terminiZaDan.slice(0, 2).map(t => (
                          <div key={t.id} className={`rounded p-1 text-[11px] truncate flex items-center space-x-1 ${t.zavrseno ? 'bg-emerald-950/60 border border-emerald-800/60 text-emerald-200' : 'bg-blue-950/80 border border-blue-800/80 text-blue-200'}`}>
                            {t.zavrseno ? <CheckCircle size={10} className="text-emerald-400 shrink-0" /> : <Clock size={10} className="shrink-0" />}
                            <span className="truncate">{t.klijent}</span>
                          </div>
                        ))}
                        {terminiZaDan.length > 2 && (
                          <div className="text-[10px] text-slate-400 text-center font-medium">
                            + još {terminiZaDan.length - 2}...
                          </div>
                        )}
                        {terminiZaDan.length === 0 && (
                          <div className="text-[11px] text-slate-600 italic text-center mt-4">Slobodno</div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {prikaziModalDana && (
              <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50 p-4">
                <div className="bg-slate-800 border border-slate-700 p-6 rounded-2xl max-w-4xl w-full space-y-6 shadow-2xl max-h-[90vh] overflow-y-auto">
                  
                  <div className="flex justify-between items-center border-b border-slate-700 pb-4">
                    <div>
                      <h4 className="font-bold text-xl text-white flex items-center space-x-2">
                        <CalendarIcon className="text-blue-400" />
                        <span>Izveštaj i raspored za dan: {izabraniDatumZaPregled}</span>
                      </h4>
                      <p className="text-xs text-slate-400 mt-0.5">Status se automatski sinhronizuje sa bazom</p>
                    </div>
                    <button onClick={() => setPrikaziModalDana(false)} className="text-slate-400 hover:text-white bg-slate-900 p-2 rounded-xl border border-slate-700">
                      <X size={18} />
                    </button>
                  </div>

                  {(() => {
                    const lista = zakazanaVozila[izabraniDatumZaPregled] || [];
                    const zavrseniLista = lista.filter(t => t.zavrseno);
                    const ukupniPazarDana = zavrseniLista.reduce((acc, curr) => acc + (Number(curr.cena) || 0), 0);

                    return (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-900 p-4 rounded-xl border border-slate-700">
                        <div className="flex items-center space-x-3">
                          <div className="bg-emerald-600/20 p-3 rounded-xl border border-emerald-600/30 text-emerald-400">
                            <DollarSign size={24} />
                          </div>
                          <div>
                            <p className="text-xs text-slate-400">Naplaćeni pazar (Danas)</p>
                            <p className="text-xl font-bold text-emerald-400">{ukupniPazarDana.toLocaleString()} RSD</p>
                          </div>
                        </div>

                        <div className="flex items-center space-x-3">
                          <div className="bg-blue-600/20 p-3 rounded-xl border border-blue-600/30 text-blue-400">
                            <Car size={24} />
                          </div>
                          <div>
                            <p className="text-xs text-slate-400">Odrađeno vozila</p>
                            <p className="text-xl font-bold text-white">{zavrseniLista.length} / {lista.length}</p>
                          </div>
                        </div>

                        <div className="flex items-center space-x-3">
                          <div className="bg-purple-600/20 p-3 rounded-xl border border-purple-600/30 text-purple-400">
                            <CheckCircle2 size={24} />
                          </div>
                          <div>
                            <p className="text-xs text-slate-400">Status dana</p>
                            <p className="text-sm font-bold text-purple-300 mt-1">
                              {lista.length > 0 && zavrseniLista.length === lista.length ? 'Sve završeno ✓' : 'U toku radova...'}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  <div className="space-y-3">
                    <h5 className="font-semibold text-sm text-slate-300">Evidencija vozila i status naplate:</h5>
                    {(zakazanaVozila[izabraniDatumZaPregled] || []).length > 0 ? (
                      <div className="overflow-x-auto border border-slate-700 rounded-xl">
                        <table className="w-full text-left border-collapse text-sm">
                          <thead>
                            <tr className="bg-slate-900 text-slate-400 text-xs uppercase border-b border-slate-700">
                              <th className="py-3 px-4 text-center">Gotovo / Naplaćeno</th>
                              <th className="py-3 px-4">Vreme</th>
                              <th className="py-3 px-4">Klijent</th>
                              <th className="py-3 px-4">Vozilo</th>
                              <th className="py-3 px-4">Opis radova</th>
                              <th className="py-3 px-4">Cena</th>
                              <th className="py-3 px-4 text-right">Akcija</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-700">
                            {zakazanaVozila[izabraniDatumZaPregled].map(t => (
                              <tr key={t.id} className={`hover:bg-slate-750 transition ${t.zavrseno ? 'bg-emerald-950/20' : ''}`}>
                                <td className="py-3 px-4 text-center">
                                  <button 
                                    onClick={() => toggleZavrsenTermin(izabraniDatumZaPregled, t.id)}
                                    className={`p-2 rounded-lg border transition flex items-center justify-center mx-auto ${t.zavrseno ? 'bg-emerald-600 border-emerald-500 text-white shadow-lg shadow-emerald-600/30' : 'bg-slate-900 border-slate-700 text-slate-500 hover:text-slate-300'}`}
                                  >
                                    <CheckCircle2 size={18} />
                                  </button>
                                </td>
                                <td className="py-3 px-4 font-bold text-blue-400 flex items-center space-x-1 pt-4">
                                  <Clock size={14} />
                                  <span>{t.vreme}</span>
                                </td>
                                <td className={`py-3 px-4 font-medium ${t.zavrseno ? 'text-emerald-300 line-through' : 'text-white'}`}>{t.klijent}</td>
                                <td className="py-3 px-4 text-slate-300">{t.auto || '/'}</td>
                                <td className="py-3 px-4 text-slate-300 text-xs">{t.opis || '/'}</td>
                                <td className="py-3 px-4 text-emerald-400 font-semibold">{t.cena ? `${Number(t.cena).toLocaleString()} RSD` : '/'}</td>
                                <td className="py-3 px-4 text-right">
                                  <button 
                                    onClick={() => obrisiTermin(izabraniDatumZaPregled, t.id)} 
                                    className="text-red-400 hover:text-red-300 p-1.5 bg-slate-900 rounded-lg border border-slate-700 transition"
                                  >
                                    <Trash2 size={15} />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="bg-slate-900/60 border border-slate-700/60 rounded-xl p-6 text-center text-slate-400 text-sm">
                        Nema zakazanih termina za ovaj datum.
                      </div>
                    )}
                  </div>

                  <div className="bg-slate-900 border border-slate-700 p-5 rounded-xl space-y-4">
                    <h5 className="font-semibold text-sm text-white flex items-center space-x-2">
                      <Plus size={16} className="text-blue-400" />
                      <span>Zakaži novi termin za ovaj dan</span>
                    </h5>

                    <form onSubmit={sacuvajTermin} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-slate-400 block mb-1">Vreme *</label>
                        <input 
                          type="time" 
                          value={noviTermin.vreme}
                          onChange={e => setNoviTermin({...noviTermin, vreme: e.target.value})}
                          className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="text-xs text-slate-400 block mb-1">Ime i prezime klijenta *</label>
                        <input 
                          type="text" 
                          placeholder="Npr. Petar Petrović"
                          value={noviTermin.klijent}
                          onChange={e => setNoviTermin({...noviTermin, klijent: e.target.value})}
                          className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="text-xs text-slate-400 block mb-1">Model vozila</label>
                        <input 
                          type="text" 
                          placeholder="Npr. Audi A4 2.0 TDI"
                          value={noviTermin.auto}
                          onChange={e => setNoviTermin({...noviTermin, auto: e.target.value})}
                          className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-slate-400 block mb-1">Cena (RSD)</label>
                        <input 
                          type="number" 
                          placeholder="Npr. 12000"
                          value={noviTermin.cena}
                          onChange={e => setNoviTermin({...noviTermin, cena: e.target.value})}
                          className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="text-xs text-slate-400 block mb-1">Šta se radi / Opis radova</label>
                        <input 
                          type="text" 
                          placeholder="Npr. Mali servis, zamena pločica..."
                          value={noviTermin.opis}
                          onChange={e => setNoviTermin({...noviTermin, opis: e.target.value})}
                          className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                        />
                      </div>

                      <div className="sm:col-span-2 pt-2 flex justify-end">
                        <button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2 rounded-lg font-medium text-sm transition flex items-center space-x-2 shadow">
                          <Plus size={16} />
                          <span>Dodaj termin u raspored</span>
                        </button>
                      </div>
                    </form>
                  </div>

                </div>
              </div>
            )}
          </div>
        )}

        {/* 4. PREDRAČUN MODUL */}
        {activeTab === 'predracun' && (
          <div className="space-y-6">
            <div className="bg-slate-800 border border-slate-700 p-5 rounded-xl space-y-4">
              <h3 className="text-lg font-semibold text-white">Kreiranje predračuna / ponude</h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Naziv firme *</label>
                  <input 
                    type="text" 
                    placeholder="Naziv pravnog lica" 
                    value={trenutniPredracun.nazivFirme}
                    onChange={e => setTrenutniPredracun({...trenutniPredracun, nazivFirme: e.target.value})}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">PIB</label>
                  <input 
                    type="text" 
                    placeholder="PIB firme" 
                    value={trenutniPredracun.pib}
                    onChange={e => setTrenutniPredracun({...trenutniPredracun, pib: e.target.value})}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Matični broj</label>
                  <input 
                    type="text" 
                    placeholder="Matični broj" 
                    value={trenutniPredracun.maticniBroj}
                    onChange={e => setTrenutniPredracun({...trenutniPredracun, maticniBroj: e.target.value})}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Adresa</label>
                  <input 
                    type="text" 
                    placeholder="Ulica i broj, Grad" 
                    value={trenutniPredracun.adresa}
                    onChange={e => setTrenutniPredracun({...trenutniPredracun, adresa: e.target.value})}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Kontakt osoba / klijent</label>
                  <input 
                    type="text" 
                    placeholder="Ime klijenta" 
                    value={trenutniPredracun.imeKlijenta}
                    onChange={e => setTrenutniPredracun({...trenutniPredracun, imeKlijenta: e.target.value})}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Model vozila</label>
                  <input 
                    type="text" 
                    placeholder="Model vozila" 
                    value={trenutniPredracun.modelVozila}
                    onChange={e => setTrenutniPredracun({...trenutniPredracun, modelVozila: e.target.value})}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-slate-700">
                <input 
                  type="text" 
                  placeholder="Naziv stavke / dela / usluge *" 
                  value={prStavkaNaziv}
                  onChange={e => setPrStavkaNaziv(e.target.value)}
                  className="flex-2 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white w-full"
                />
                <input 
                  type="number" 
                  placeholder="Cena (RSD) *" 
                  value={prStavkaCena}
                  onChange={e => setPrStavkaCena(e.target.value)}
                  className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white w-32"
                />
                <input 
                  type="number" 
                  min="1" 
                  value={prStavkaKolicina}
                  onChange={e => setPrStavkaKolicina(e.target.value)}
                  className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white w-20 text-center"
                />
                <button 
                  onClick={dodajStavkuPredracuna}
                  className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
                >
                  Dodaj stavku
                </button>
              </div>

              <div className="overflow-x-auto pt-2">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-900 text-slate-400 text-xs uppercase border-b border-slate-700">
                      <th className="py-2 px-3">Naziv</th>
                      <th className="py-2 px-3">Količina</th>
                      <th className="py-2 px-3">Cena</th>
                      <th className="py-2 px-3">Ukupno</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700 text-sm">
                    {trenutniPredracun.stavke.map(s => (
                      <tr key={s.id}>
                        <td className="py-2 px-3 text-white font-medium">{s.naziv}</td>
                        <td className="py-2 px-3">{s.kolicina}</td>
                        <td className="py-2 px-3">{s.cena} RSD</td>
                        <td className="py-2 px-3 text-blue-400 font-semibold">{s.kolicina * s.cena} RSD</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {trenutniPredracun.stavke.length > 0 && (
                <div className="flex justify-between items-center pt-4 border-t border-slate-700">
                  <div className="text-lg font-bold text-white">
                    Ukupan predračun: <span className="text-emerald-400">{trenutniPredracun.stavke.reduce((acc, curr) => acc + (curr.cena * curr.kolicina), 0).toLocaleString()} RSD</span>
                  </div>
                  <button onClick={sacuvajPredracun} className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2.5 rounded-lg font-semibold flex items-center space-x-2 transition shadow">
                    <Save size={16} />
                    <span>Sačuvaj predračun u bazu</span>
                  </button>
                </div>
              )}
            </div>

            <div className="bg-slate-800 border border-slate-700 p-5 rounded-xl space-y-4">
              <h4 className="font-semibold text-white">Sačuvani predračuni (Iz Baze)</h4>
              <div className="space-y-3">
                {predracuni.map(pr => (
                  <div key={pr.id} className="bg-slate-900 border border-slate-700 p-4 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div>
                      <div className="font-bold text-white flex items-center space-x-2">
                        <span>{pr.broj}</span>
                        <span className="text-slate-400 text-sm">- {pr.nazivFirme} (PIB: {pr.pib || 'N/A'}, M.B: {pr.maticniBroj || 'N/A'})</span>
                      </div>
                      <div className="text-xs text-slate-400 mt-1">Adresa: {pr.adresa || 'N/A'} | Datum: {pr.datum} | Stavki: {pr.stavke.length}</div>
                    </div>
                    
                    <div className="flex space-x-2">
                      <button 
                        onClick={() => setAktivniPredracunZaStampu(pr)}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition shadow"
                      >
                        <Printer size={14} />
                        <span>Pregled i štampa</span>
                      </button>
                      <button 
                        onClick={() => prebaciPredracunUNalog(pr)}
                        className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition shadow"
                      >
                        <span>Pretvori u nalog</span>
                        <ArrowRight size={14} />
                      </button>
                    </div>
                  </div>
                ))}
                {predracuni.length === 0 && (
                  <p className="text-sm text-slate-400 text-center py-4">Nema sačuvanih predračuna u bazi.</p>
                )}
              </div>
            </div>

            {/* MODAL ZA ŠTAMPU PREDRAČUNA */}
            {aktivniPredracunZaStampu && (
              <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
                <div className="bg-white text-slate-900 p-8 rounded-2xl max-w-2xl w-full space-y-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
                  
                  <div className="flex justify-between items-center border-b pb-4 print:hidden">
                    <h4 className="font-bold text-lg text-slate-800">Pregled dokumenta predračuna</h4>
                    <div className="flex space-x-2">
                      <button 
                        onClick={() => window.print()}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center space-x-2"
                      >
                        <Printer size={16} />
                        <span>Štampaj / Sačuvaj PDF</span>
                      </button>
                      <button onClick={() => setAktivniPredracunZaStampu(null)} className="text-slate-500 hover:text-slate-800 p-2">
                        <X size={20} />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-6 p-2">
                    <div className="flex justify-between items-start border-b pb-6">
                      <div>
                        <h2 className="text-2xl font-black tracking-tight text-blue-900">NB AUTO SERVIS</h2>
                        <p className="text-xs text-slate-600 mt-1">Sremčica, Beograd | Tel: 06x/xxx-xxx</p>
                        <p className="text-xs text-slate-600">Specijalizovani auto servis i dijagnostika</p>
                      </div>
                      <div className="text-right">
                        <h3 className="text-xl font-bold text-slate-800">PREDRAČUN</h3>
                        <p className="text-sm font-semibold text-blue-700 mt-1">{aktivniPredracunZaStampu.broj}</p>
                        <p className="text-xs text-slate-500 mt-0.5">Datum: {aktivniPredracunZaStampu.datum}</p>
                      </div>
                    </div>

                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-sm space-y-1">
                      <p className="font-bold text-slate-800 mb-2">Podaci o klijentu / pravnom licu:</p>
                      <p><span className="font-semibold">Naziv firme:</span> {aktivniPredracunZaStampu.nazivFirme}</p>
                      <p><span className="font-semibold">PIB:</span> {aktivniPredracunZaStampu.pib || '/'}</p>
                      <p><span className="font-semibold">Matični broj:</span> {aktivniPredracunZaStampu.maticniBroj || '/'}</p>
                      <p><span className="font-semibold">Adresa:</span> {aktivniPredracunZaStampu.adresa || '/'}</p>
                      {aktivniPredracunZaStampu.imeKlijenta && <p><span className="font-semibold">Kontakt osoba:</span> {aktivniPredracunZaStampu.imeKlijenta}</p>}
                      {aktivniPredracunZaStampu.modelVozila && <p><span className="font-semibold">Vozilo:</span> {aktivniPredracunZaStampu.modelVozila}</p>}
                    </div>

                    <table className="w-full text-left border-collapse text-sm">
                      <thead>
                        <tr className="bg-slate-100 border-b border-slate-300 text-slate-700 text-xs uppercase">
                          <th className="py-2.5 px-3">R.br</th>
                          <th className="py-2.5 px-3">Naziv usluge / dela</th>
                          <th className="py-2.5 px-3 text-center">Količina</th>
                          <th className="py-2.5 px-3 text-right">Cena (RSD)</th>
                          <th className="py-2.5 px-3 text-right">Ukupno (RSD)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {aktivniPredracunZaStampu.stavke.map((s, index) => (
                          <tr key={s.id}>
                            <td className="py-2.5 px-3 text-slate-500">{index + 1}</td>
                            <td className="py-2.5 px-3 font-medium text-slate-800">{s.naziv}</td>
                            <td className="py-2.5 px-3 text-center">{s.kolicina}</td>
                            <td className="py-2.5 px-3 text-right">{s.cena.toLocaleString()}</td>
                            <td className="py-2.5 px-3 text-right font-semibold text-slate-900">{(s.kolicina * s.cena).toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    <div className="flex justify-end pt-4 border-t border-slate-300">
                      <div className="text-right space-y-1">
                        <p className="text-sm text-slate-600">Ukupan iznos za uplatu:</p>
                        <p className="text-2xl font-black text-blue-900">
                          {aktivniPredracunZaStampu.stavke.reduce((acc, curr) => acc + (curr.cena * curr.kolicina), 0).toLocaleString()} RSD
                        </p>
                      </div>
                    </div>

                    <div className="pt-12 flex justify-between text-xs text-slate-600">
                      <div>
                        <p>Napomena: Predračun važi 7 dana od dana izdavanja.</p>
                      </div>
                      <div className="text-center pt-4 border-t border-slate-400 w-48">
                        M.P. / Potpis ovlašćenog lica
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* MODAL ZA ŠTAMPU RADNOG NALOGA */}
      {aktivniNalogZaStampu && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-white text-slate-900 p-8 rounded-2xl max-w-2xl w-full space-y-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            
            <div className="flex justify-between items-center border-b pb-4 print:hidden">
              <h4 className="font-bold text-lg text-slate-800">Pregled radnog naloga</h4>
              <div className="flex space-x-2">
                <button 
                  onClick={() => window.print()}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center space-x-2"
                >
                  <Printer size={16} />
                  <span>Štampaj / Sačuvaj PDF</span>
                </button>
                <button onClick={() => setAktivniNalogZaStampu(null)} className="text-slate-500 hover:text-slate-800 p-2">
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="space-y-6 p-2">
              <div className="flex justify-between items-start border-b pb-6">
                <div>
                  <h2 className="text-2xl font-black tracking-tight text-blue-900">NB AUTO SERVIS</h2>
                  <p className="text-xs text-slate-600 mt-1">Sremčica, Beograd | Tel: 06x/xxx-xxx</p>
                  <p className="text-xs text-slate-600">Profesionalni auto servis i dijagnostika</p>
                </div>
                <div className="text-right">
                  <h3 className="text-xl font-bold text-slate-800">RADNI NALOG</h3>
                  <p className="text-sm font-semibold text-blue-700 mt-1">{aktivniNalogZaStampu.broj}</p>
                  <p className="text-xs text-slate-500 mt-0.5">Datum: {aktivniNalogZaStampu.datum}</p>
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-sm space-y-1.5">
                <p className="font-bold text-slate-800 mb-2">Podaci o klijentu i vozilu:</p>
                <p><span className="font-semibold">Ime i prezime:</span> {aktivniNalogZaStampu.ime} {aktivniNalogZaStampu.prezime}</p>
                <p><span className="font-semibold">Kontakt telefon:</span> {aktivniNalogZaStampu.telefon || '/'}</p>
                <p><span className="font-semibold">Model vozila:</span> {aktivniNalogZaStampu.modelVozila || '/'}</p>
                <p><span className="font-semibold">Registarska oznaka:</span> {aktivniNalogZaStampu.registracija || '/'}</p>
                <p><span className="font-semibold">Broj šasije (VIN):</span> {aktivniNalogZaStampu.brojSasije || '/'}</p>
              </div>

              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-300 text-slate-700 text-xs uppercase">
                    <th className="py-2.5 px-3">R.br</th>
                    <th className="py-2.5 px-3">Šifra / Naziv dela ili usluge</th>
                    <th className="py-2.5 px-3 text-center">Količina</th>
                    <th className="py-2.5 px-3 text-right">Cena (RSD)</th>
                    <th className="py-2.5 px-3 text-right">Ukupno (RSD)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {(aktivniNalogZaStampu.stavke || []).map((s, index) => (
                    <tr key={s.id || index}>
                      <td className="py-2.5 px-3 text-slate-500">{index + 1}</td>
                      <td className="py-2.5 px-3 font-medium text-slate-800">{s.naziv} <span className="text-xs text-slate-400">({s.sifra})</span></td>
                      <td className="py-2.5 px-3 text-center">{s.kolicina}</td>
                      <td className="py-2.5 px-3 text-right">{s.cena.toLocaleString()}</td>
                      <td className="py-2.5 px-3 text-right font-semibold text-slate-900">{(s.kolicina * s.cena).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="flex justify-end pt-4 border-t border-slate-300">
                <div className="text-right space-y-1">
                  <p className="text-sm text-slate-600">Ukupan iznos radnog naloga:</p>
                  <p className="text-2xl font-black text-blue-900">
                    {(aktivniNalogZaStampu.stavke || []).reduce((acc, curr) => acc + (curr.cena * curr.kolicina), 0).toLocaleString()} RSD
                  </p>
                </div>
              </div>

              <div className="pt-12 flex justify-between text-xs text-slate-600">
                <div>
                  <p>Potpis primurske stranke / klijenta:</p>
                  <div className="mt-8 border-t border-slate-400 w-48"></div>
                </div>
                <div className="text-center">
                  <p>Ovlašćeno lice - NB Auto Servis</p>
                  <div className="mt-8 border-t border-slate-400 w-48"></div>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
