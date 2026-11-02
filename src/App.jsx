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
  Lock,
  Calculator,
  Users,
  XCircle,
  Download,
  SearchCode,
  Edit,
  History,
  Gauge
} from 'lucide-react';

export default function App() {
  // --- STANJE ZA AUTENTIFIKACIJU (LOGIN) ---
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loginForma, setLoginForma] = useState({ username: '', password: '' });
  const [loginGreska, setLoginGreska] = useState('');

  const [activeTab, setActiveTab] = useState('baza-korisnika');
  const [podTabNalog, setPodTabNalog] = useState('novi');

  // --- STANJE I FUNKCIJE: BAZA KORISNIKA ---
  const [bazaKorisnika, setBazaKorisnika] = useState([]);
  const [korisnikPretraga, setKorisnikPretraga] = useState('');
  const [noviKorisnikRucno, setNoviKorisnikRucno] = useState({
    ime: '',
    prezime: '',
    telefon: '',
    modelVozila: '',
    brojSasije: '',
    registracija: '',
    kilometraza: '',
    opisRadova: ''
  });

  const [istorijaKorisnikaModal, setIstorijaKorisnikaModal] = useState(null);
  const [uredjivanjeKorisnikaModal, setUredjivanjeKorisnikaModal] = useState(null);

  const ucitajBazuKorisnika = async () => {
    const { data, error } = await supabase.from('baza_korisnika').select('*').order('id', { ascending: false });
    if (error) {
      console.error('Greška pri učitavanju baze korisnika:', error);
    } else if (data) {
      setBazaKorisnika(data.map(k => ({
        id: k.id,
        ime: k.ime,
        prezime: k.prezime,
        telefon: k.telefon,
        modelVozila: k.model_vozila,
        brojSasije: k.broj_sasije,
        registracija: k.registracija,
        kilometraza: k.kilometraza || '',
        opisRadova: k.opis_radova || ''
      })));
    }
  };

  const sacuvajRucnogKorisnika = async (e) => {
    e.preventDefault();
    if (!noviKorisnikRucno.ime || !noviKorisnikRucno.modelVozila) {
      alert('Unesite bar ime klijenta i model vozila!');
      return;
    }

    if (noviKorisnikRucno.brojSasije.trim() !== '') {
      const postojiPoSasiji = bazaKorisnika.some(k => 
        k.brojSasije && k.brojSasije.trim().toLowerCase() === noviKorisnikRucno.brojSasije.trim().toLowerCase()
      );

      if (postojiPoSasiji) {
        alert('Auto sa unetim brojem šasije već postoji u bazi!');
        return;
      }
    }

    const noviZapis = {
      ime: noviKorisnikRucno.ime,
      prezime: noviKorisnikRucno.prezime,
      telefon: noviKorisnikRucno.telefon,
      model_vozila: noviKorisnikRucno.modelVozila,
      broj_sasije: noviKorisnikRucno.brojSasije,
      registracija: noviKorisnikRucno.registracija,
      kilometraza: noviKorisnikRucno.kilometraza,
      opis_radova: noviKorisnikRucno.opisRadova
    };

    const { error } = await supabase.from('baza_korisnika').insert([noviZapis]);
    if (error) {
      console.error('Greška pri upisu korisnika:', error);
      alert('Greška pri čuvanju korisnika u bazu!');
    } else {
      alert('Korisnik i vozilo uspešno sačuvani u bazu!');
      setNoviKorisnikRucno({ ime: '', prezime: '', telefon: '', modelVozila: '', brojSasije: '', registracija: '', kilometraza: '', opisRadova: '' });
      ucitajBazuKorisnika();
    }
  };

  // PROPAGACIJA IZMENA KORISNIKA NA OSTALE TABELE (RADNE NALOGE I TERMINE)
  const sacuvajIzmenjenogKorisnika = async (e) => {
    e.preventDefault();
    if (!uredjivanjeKorisnikaModal) return;

    const stariVin = (bazaKorisnika.find(k => k.id === uredjivanjeKorisnikaModal.id)?.brojSasije || '').trim().toLowerCase();
    const noviVin = (uredjivanjeKorisnikaModal.brojSasije || '').trim();

    // 1. Ažuriranje u bazi korisnika
    const { error } = await supabase.from('baza_korisnika').update({
      ime: uredjivanjeKorisnikaModal.ime,
      prezime: uredjivanjeKorisnikaModal.prezime,
      telefon: uredjivanjeKorisnikaModal.telefon,
      model_vozila: uredjivanjeKorisnikaModal.modelVozila,
      broj_sasije: noviVin,
      registracija: uredjivanjeKorisnikaModal.registracija,
      kilometraza: uredjivanjeKorisnikaModal.kilometraza,
      opis_radova: uredjivanjeKorisnikaModal.opisRadova
    }).eq('id', uredjivanjeKorisnikaModal.id);

    if (error) {
      console.error('Greška pri izmeni korisnika:', error);
      alert('Greška pri ažuriranju korisnika u bazi!');
      return;
    }

    // 2. Automatska propagacija na radne naloge (po starom VIN-u ili ID-ju)
    for (const rn of radniNalozi) {
      if ((rn.brojSasije && rn.brojSasije.trim().toLowerCase() === stariVin) || (stariVin === '' && rn.ime === uredjivanjeKorisnikaModal.ime)) {
        await supabase.from('radni_nalozi').update({
          ime: uredjivanjeKorisnikaModal.ime,
          prezime: uredjivanjeKorisnikaModal.prezime,
          telefon: uredjivanjeKorisnikaModal.telefon,
          model_vozila: uredjivanjeKorisnikaModal.modelVozila,
          broj_sasije: noviVin,
          registracija: uredjivanjeKorisnikaModal.registracija,
          kilometraza: uredjivanjeKorisnikaModal.kilometraza
        }).eq('id', rn.id);
      }
    }

    // 3. Automatska propagacija na termine u kalendaru
    for (const datumStr of Object.keys(zakazanaVozila)) {
      const listaTermina = zakazanaVozila[datumStr];
      for (const t of listaTermina) {
        if ((t.brojSasije && t.brojSasije.trim().toLowerCase() === stariVin) || t.klijent.includes(bazaKorisnika.find(k => k.id === uredjivanjeKorisnikaModal.id)?.ime || '')) {
          const novoImeKlijenta = `${uredjivanjeKorisnikaModal.ime} ${uredjivanjeKorisnikaModal.prezime}`.trim();
          await supabase.from('termini').update({
            klijent: novoImeKlijenta,
            telefon: uredjivanjeKorisnikaModal.telefon,
            auto: uredjivanjeKorisnikaModal.modelVozila,
            registracija: uredjivanjeKorisnikaModal.registracija,
            broj_sasije: noviVin,
            kilometraza: uredjivanjeKorisnikaModal.kilometraza
          }).eq('id', t.id);
        }
      }
    }

    alert('Korisnik uspešno izmenjen i izmene su automatski propagirane na radne naloge i kalendar!');
    setUredjivanjeKorisnikaModal(null);
    ucitajSvePodatke();
  };

  const obrisiKorisnikaIzBaze = async (id) => {
    const { error } = await supabase.from('baza_korisnika').delete().eq('id', id);
    if (error) console.error(error);
    else ucitajBazuKorisnika();
  };

  const korisniciFiltrirani = bazaKorisnika.filter(k => {
    const term = korisnikPretraga.toLowerCase();
    return (
      (k.ime && k.ime.toLowerCase().includes(term)) ||
      (k.prezime && k.prezime.toLowerCase().includes(term)) ||
      (k.telefon && k.telefon.toLowerCase().includes(term)) ||
      (k.modelVozila && k.modelVozila.toLowerCase().includes(term)) ||
      (k.registracija && k.registracija.toLowerCase().includes(term)) ||
      (k.brojSasije && k.brojSasije.toLowerCase().includes(term))
    );
  });

  // --- STANJE I FUNKCIJE: MAGACIN ---
  const [magacin, setMagacin] = useState([]);
  const [magacinPretraga, setMagacinPretraga] = useState('');
  const [noviArtikal, setNoviArtikal] = useState({ naziv: '', nabavnaCena: '', prodajnaCena: '', kolicina: '' });

  const magacinFiltriran = magacin.filter(art => {
    const term = magacinPretraga.toLowerCase();
    return (
      art.sifra.toString().toLowerCase().includes(term) ||
      art.naziv.toLowerCase().includes(term) ||
      art.nabavnaCena.toString().includes(term) ||
      art.prodajnaCena.toString().includes(term) ||
      art.kolicina.toString().includes(term)
    );
  });

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
    ucitajBazuKorisnika();
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

  // --- KALKULACIJA CENA I UNOS NOVOG ARTIKLA ---
  const [kalkulacijaPretraga, setKalkulacijaPretraga] = useState('');
  const [izabraniArtikalKalkulacija, setIzabraniArtikalKalkulacija] = useState(null);
  const [kalkulacijaOtkljucana, setKalkulacijaOtkljucana] = useState(false);
  const [kalkulacijaUnesenaSifra, setKalkulacijaUnesenaSifra] = useState('');
  const [kalkulacijaSifraGreska, setKalkulacijaSifraGreska] = useState('');

  const proveriKalkulacijaSifru = (e) => {
    e.preventDefault();
    if (kalkulacijaUnesenaSifra === 'admin123') {
      setKalkulacijaOtkljucana(true);
      setKalkulacijaSifraGreska('');
    } else {
      setKalkulacijaSifraGreska('Pogrešna šifra za pristup kalkulaciji cena!');
    }
  };

  const dodajNoviArtikalUmagacin = async (e) => {
    e.preventDefault();
    if (!noviArtikal.naziv || !noviArtikal.prodajnaCena) {
      alert('Unesite naziv artikla i prodajnu cenu!');
      return;
    }

    const sledecaSifra = magacin.length > 0 ? Math.max(...magacin.map(item => Number(item.sifra) || 0)) + 1 : 1;

    const noviRed = {
      sifra: sledecaSifra.toString(),
      naziv: noviArtikal.naziv,
      nabavna_cena: Number(noviArtikal.nabavnaCena) || 0,
      prodajna_cena: Number(noviArtikal.prodajnaCena) || 0,
      kolicina: Number(noviArtikal.kolicina) || 0
    };

    const { data, error } = await supabase.from('magacin').insert([noviRed]).select();

    if (error) {
      console.error('Greška pri upisu u bazu:', error);
      alert('Greška pri čuvanju artikla u magacin!');
    } else if (data && data.length > 0) {
      alert('Artikal uspešno dodat u magacin!');
      setNoviArtikal({ naziv: '', nabavnaCena: '', prodajnaCena: '', kolicina: '' });
      ucitajMagacin();
    }
  };

  const sacuvajKalkulacijuIzmene = async (e) => {
    e.preventDefault();
    if (!izabraniArtikalKalkulacija) return;

    const azuriraniMagacin = magacin.map(art => 
      art.id === izabraniArtikalKalkulacija.id ? izabraniArtikalKalkulacija : art
    );
    setMagacin(azuriraniMagacin);

    const { error } = await supabase.from('magacin').update({
      nabavna_cena: izabraniArtikalKalkulacija.nabavnaCena,
      prodajna_cena: izabraniArtikalKalkulacija.prodajnaCena,
      kolicina: izabraniArtikalKalkulacija.kolicina
    }).eq('id', izabraniArtikalKalkulacija.id);

    if (error) {
      console.error('Greška pri ažuriranju kalkulacije:', error);
      alert('Greška pri čuvanju izmena u bazi!');
    } else {
      alert('Uspešno sačuvane izmene za artikal: ' + izabraniArtikalKalkulacija.naziv);
      setIzabraniArtikalKalkulacija(null);
      setKalkulacijaPretraga('');
    }
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
  const [naloziPretraga, setNaloziPretraga] = useState('');
  const [trenutniNalog, setTrenutniNalog] = useState({
    broj: 'RN-2026-001',
    datum: new Date().toISOString().split('T')[0],
    tipKlijenta: 'privatno',
    nazivFirme: '',
    pib: '',
    maticniBroj: '',
    adresaFirme: '',
    ime: '',
    prezime: '',
    telefon: '',
    modelVozila: '',
    brojSasije: '',
    registracija: '',
    kilometraza: '',
    include_vat: true,
    sakrijCenu: false,
    work_description: '',
    stavke: [],
    napomena: '',
    sacuvajKorisnikaUBazu: true,
    vremePocetka: '09:00',
    vremeKraje: '10:30',
    dizalica: 'Dizalica 1'
  });

  const [uredjivanjeNalogaModal, setUredjivanjeNalogaModal] = useState(null);
  const [editStavkaPretraga, setEditStavkaPretraga] = useState('');
  const [editOdabraniMagacinArtikal, setEditOdabraniMagacinArtikal] = useState(null);
  const [editStavkaKolicina, setEditStavkaKolicina] = useState(1);
  const [editRucniNaziv, setEditRucniNaziv] = useState('');
  const [editRucniCena, setEditRucniCena] = useState('');
  const [editRucniKolicina, setEditRucniKolicina] = useState(1);

  const [stavkaPretraga, setStavkaPretraga] = useState('');
  const [odabraniMagacinArtikal, setOdabraniMagacinArtikal] = useState(null);
  const [stavkaKolicina, setStavkaKolicina] = useState(1);
  const [ručniNaziv, setRučniNaziv] = useState('');
  const [ručniCena, setRučniCena] = useState('');
  const [ručniKolicina, setRučniKolicina] = useState(1);
  const [aktivniNalogZaStampu, setAktivniNalogZaStampu] = useState(null);

  const dohvatiKorisnikaPoSasiji = () => {
    if (!trenutniNalog.brojSasije.trim()) {
      alert('Unesite broj šasije (VIN) da biste pretražili bazu!');
      return;
    }
    const pronadjeni = bazaKorisnika.find(k => 
      k.brojSasije && k.brojSasije.trim().toLowerCase() === trenutniNalog.brojSasije.trim().toLowerCase()
    );

    if (pronadjeni) {
      setTrenutniNalog(prev => ({
        ...prev,
        ime: pronadjeni.ime || '',
        prezime: pronadjeni.prezime || '',
        telefon: pronadjeni.telefon || '',
        modelVozila: pronadjeni.modelVozila || '',
        registracija: pronadjeni.registracija || '',
        kilometraza: pronadjeni.kilometraza || ''
      }));
      alert('Podaci klijenta, vozila, registracija i kilometraža uspešno preuzeti iz baze!');
    } else {
      alert('Nije pronađen nijedan korisnik sa unetim brojem šasije u bazi.');
    }
  };

  const ucitajRadneNaloge = async () => {
    const { data, error } = await supabase.from('radni_nalozi').select('*').order('id', { ascending: false });
    if (error) {
      console.error('Greška pri učitavanju naloga:', error);
    } else if (data) {
      setRadniNalozi(data.map(rn => ({
        id: rn.id,
        broj: rn.broj,
        datum: rn.datum,
        tipKlijenta: rn.tip_klijenta || 'privatno',
        nazivFirme: rn.naziv_firme || '',
        pib: rn.pib || '',
        maticniBroj: rn.maticni_broj || '',
        adresaFirme: rn.adresa_firme || '',
        ime: rn.ime,
        prezime: rn.prezime,
        telefon: rn.telefon,
        modelVozila: rn.model_vozila,
        brojSasije: rn.broj_sasije,
        registracija: rn.registracija,
        kilometraza: rn.kilometraza || '',
        include_vat: rn.include_vat !== false,
        sakrijCenu: rn.sakrij_cenu || false,
        work_description: rn.work_description || '',
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

  const dodajStavkuIzMagacinaUEdit = () => {
    if (!editOdabraniMagacinArtikal) return;
    const art = magacin.find(a => a.id === Number(editOdabraniMagacinArtikal));
    if (!art || art.kolicina < editStavkaKolicina) {
      alert('Nema dovoljno artikla na stanju!');
      return;
    }

    izmeniArtikalPolje(art.id, 'kolicina', art.kolicina - editStavkaKolicina);

    const novaStavka = {
      id: Date.now(),
      tip: 'magacin',
      magacinId: art.id,
      sifra: art.sifra,
      naziv: art.naziv,
      cena: art.prodajnaCena,
      kolicina: editStavkaKolicina
    };
    setUredjivanjeNalogaModal({
      ...uredjivanjeNalogaModal,
      stavke: [...uredjivanjeNalogaModal.stavke, novaStavka]
    });
    setEditOdabraniMagacinArtikal(null);
    setEditStavkaKolicina(1);
    setEditStavkaPretraga('');
  };

  const dodajRucnuStavkuUEdit = () => {
    if (!editRucniNaziv || !editRucniCena) return;
    const novaStavka = {
      id: Date.now(),
      tip: 'rucno',
      sifra: 'USLUGA',
      naziv: editRucniNaziv,
      cena: Number(editRucniCena),
      kolicina: Number(editRucniKolicina) || 1
    };
    setUredjivanjeNalogaModal({
      ...uredjivanjeNalogaModal,
      stavke: [...uredjivanjeNalogaModal.stavke, novaStavka]
    });
    setEditRucniNaziv('');
    setEditRucniCena('');
    setEditRucniKolicina(1);
  };

  const ukloniStavkuUEdit = (stavkaId) => {
    const stavkaZaUklanjanje = uredjivanjeNalogaModal.stavke.find(s => s.id === stavkaId);
    if (stavkaZaUklanjanje && stavkaZaUklanjanje.tip === 'magacin') {
      const art = magacin.find(a => a.id === stavkaZaUklanjanje.magacinId);
      if (art) {
        izmeniArtikalPolje(art.id, 'kolicina', art.kolicina + stavkaZaUklanjanje.kolicina);
      }
    }
    setUredjivanjeNalogaModal({
      ...uredjivanjeNalogaModal,
      stavke: uredjivanjeNalogaModal.stavke.filter(s => s.id !== stavkaId)
    });
  };

  const izmeniStavkuUEditPolje = (stavkaId, polje, vrednost) => {
    setUredjivanjeNalogaModal({
      ...uredjivanjeNalogaModal,
      stavke: uredjivanjeNalogaModal.stavke.map(s => {
        if (s.id === stavkaId) {
          return { ...s, [polje]: polje === 'naziv' ? vrednost : Number(vrednost) };
        }
        return s;
      })
    });
  };

  const sacuvajRadniNalog = async () => {
    if ((trenutniNalog.tipKlijenta === 'privatno' && !trenutniNalog.ime) || (trenutniNalog.tipKlijenta === 'firma' && !trenutniNalog.nazivFirme) || trenutniNalog.stavke.length === 0) {
      alert('Unesite podatke klijenta/firme i bar jednu stavku!');
      return;
    }

    const noviNalog = {
      broj: trenutniNalog.broj,
      datum: trenutniNalog.datum,
      tip_klijenta: trenutniNalog.tipKlijenta,
      naziv_firme: trenutniNalog.nazivFirme,
      pib: trenutniNalog.pib,
      maticni_broj: trenutniNalog.maticniBroj,
      adresa_firme: trenutniNalog.adresaFirme,
      ime: trenutniNalog.ime,
      prezime: trenutniNalog.prezime,
      telefon: trenutniNalog.telefon,
      model_vozila: trenutniNalog.modelVozila,
      broj_sasije: trenutniNalog.brojSasije,
      registracija: trenutniNalog.registracija,
      kilometraza: trenutniNalog.kilometraza,
      include_vat: trenutniNalog.include_vat,
      sakrij_cenu: trenutniNalog.sakrijCenu,
      work_description: trenutniNalog.work_description,
      stavke: trenutniNalog.stavke
    };

    const { error } = await supabase.from('radni_nalozi').insert([noviNalog]);

    if (error) {
      console.error('Greška:', error);
      alert('Greška pri čuvanju radnog naloga u bazu!');
      return;
    }

    if (trenutniNalog.sacuvajKorisnikaUBazu) {
      const vecPostojiPoSasiji = trenutniNalog.brojSasije.trim() !== '' && bazaKorisnika.some(k => 
        k.brojSasije && k.brojSasije.trim().toLowerCase() === trenutniNalog.brojSasije.trim().toLowerCase()
      );

      if (!vecPostojiPoSasiji) {
        const noviKorisnikZapis = {
          ime: trenutniNalog.tipKlijenta === 'firma' ? trenutniNalog.nazivFirme : trenutniNalog.ime,
          prezime: trenutniNalog.tipKlijenta === 'firma' ? '(Firma)' : trenutniNalog.prezime,
          telefon: trenutniNalog.telefon,
          model_vozila: trenutniNalog.modelVozila,
          broj_sasije: trenutniNalog.brojSasije,
          registracija: trenutniNalog.registracija,
          kilometraza: trenutniNalog.kilometraza,
          opis_radova: trenutniNalog.work_description
        };
        await supabase.from('baza_korisnika').insert([noviKorisnikZapis]);
        ucitajBazuKorisnika();
      }
    }

    const osnovnaCenaNaloga = trenutniNalog.stavke.reduce((acc, curr) => acc + (curr.cena * curr.kolicina), 0);
    const ukupnaCenaNaloga = trenutniNalog.include_vat !== false ? osnovnaCenaNaloga * 1.20 : osnovnaCenaNaloga;

    const noviTerminAutomatski = {
      datum: trenutniNalog.datum,
      vreme_pocetka: trenutniNalog.vremePocetka || '09:00',
      vreme_zavrsetka: trenutniNalog.vremeKraje || '10:30',
      klijent: trenutniNalog.tipKlijenta === 'firma' ? trenutniNalog.nazivFirme : `${trenutniNalog.ime} ${trenutniNalog.prezime}`.trim(),
      telefon: trenutniNalog.telefon,
      auto: trenutniNalog.modelVozila,
      registracija: trenutniNalog.registracija,
      broj_sasije: trenutniNalog.brojSasije,
      kilometraza: trenutniNalog.kilometraza,
      opis: trenutniNalog.work_description || 'Servis po radnom nalogu',
      cena: ukupnaCenaNaloga,
      zavrseno: false,
      nije_se_pojavio: false,
      dizalica: trenutniNalog.dizalica || 'Dizalica 1',
      stavke: trenutniNalog.stavke
    };

    await supabase.from('termini').insert([noviTerminAutomatski]);
    ucitajTermine();

    alert('Radni nalog uspešno sačuvan, korisnik upisan u bazu i termin dodat u kalendar!');
    ucitajRadneNaloge();
    setTrenutniNalog({
      broj: `RN-2026-${String(radniNalozi.length + 2).padStart(3, '0')}`,
      datum: new Date().toISOString().split('T')[0],
      tipKlijenta: 'privatno',
      nazivFirme: '',
      pib: '',
      maticniBroj: '',
      adresaFirme: '',
      ime: '',
      prezime: '',
      telefon: '',
      modelVozila: '',
      brojSasije: '',
      registracija: '',
      kilometraza: '',
      include_vat: true,
      sakrijCenu: false,
      work_description: '',
      stavke: [],
      napomena: '',
      sacuvajKorisnikaUBazu: true,
      vremePocetka: '09:00',
      vremeKraje: '10:30',
      dizalica: 'Dizalica 1'
    });
    setPodTabNalog('arhiva');
  };

  const sacuvajIzmenjeniRadniNalog = async (e) => {
    e.preventDefault();
    if (!uredjivanjeNalogaModal) return;

    const { error } = await supabase.from('radni_nalozi').update({
      tip_klijenta: uredjivanjeNalogaModal.tipKlijenta,
      naziv_firme: uredjivanjeNalogaModal.nazivFirme,
      pib: uredjivanjeNalogaModal.pib,
      maticni_broj: uredjivanjeNalogaModal.maticniBroj,
      adresa_firme: uredjivanjeNalogaModal.adresaFirme,
      ime: uredjivanjeNalogaModal.ime,
      prezime: uredjivanjeNalogaModal.prezime,
      telefon: uredjivanjeNalogaModal.telefon,
      model_vozila: uredjivanjeNalogaModal.modelVozila,
      broj_sasije: uredjivanjeNalogaModal.brojSasije,
      registracija: uredjivanjeNalogaModal.registracija,
      kilometraza: uredjivanjeNalogaModal.kilometraza,
      include_vat: uredjivanjeNalogaModal.include_vat,
      sakrij_cenu: uredjivanjeNalogaModal.sakrijCenu,
      work_description: uredjivanjeNalogaModal.work_description,
      stavke: uredjivanjeNalogaModal.stavke
    }).eq('id', uredjivanjeNalogaModal.id);

    if (error) {
      console.error('Greška pri izmeni radnog naloga:', error);
      alert('Greška pri ažuriranju radnog naloga u bazi!');
    } else {
      alert('Radni nalog uspešno izmenjen i ažuriran!');
      setUredjivanjeNalogaModal(null);
      ucitajRadneNaloge();
    }
  };

  // --- STANJE I FUNKCIJE: KALENDAR ---
  const [trenutniDatum, setTrenutniDatum] = useState(new Date());
  const [zakazanaVozila, setZakazanaVozila] = useState({});
  const [prikaziModalDana, setPrikaziModalDana] = useState(false);
  const [izabraniDatumZaPregled, setIzabraniDatumZaPregled] = useState('');
  
  const [noviTermin, setNoviTermin] = useState({ 
    vremePocetka: '09:00', 
    vremeZavrsetka: '10:00', 
    klijent: '', 
    telefon: '',
    auto: '', 
    registracija: '',
    brojSasije: '',
    kilometraza: '',
    opis: '', 
    dizalica: 'Dizalica 1',
    stavke: []
  });

  const [kalendarStavkaPretraga, setKalendarStavkaPretraga] = useState('');
  const [kalendarOdabraniMagacinArtikal, setKalendarOdabraniMagacinArtikal] = useState(null);
  const [kalendarStavkaKolicina, setKalendarStavkaKolicina] = useState(1);
  const [kalendarRucniNaziv, setKalendarRucniNaziv] = useState('');
  const [kalendarRucniCena, setKalendarRucniCena] = useState('');
  const [kalendarRucniKolicina, setKalendarRucniKolicina] = useState(1);

  const dodajStavkuUKalendarTermin = () => {
    if (!kalendarOdabraniMagacinArtikal) return;
    const art = magacin.find(a => a.id === Number(kalendarOdabraniMagacinArtikal));
    if (!art || art.kolicina < kalendarStavkaKolicina) {
      alert('Nema dovoljno artikla na stanju!');
      return;
    }

    izmeniArtikalPolje(art.id, 'kolicina', art.kolicina - kalendarStavkaKolicina);

    const novaStavka = {
      id: Date.now(),
      tip: 'magacin',
      magacinId: art.id,
      sifra: art.sifra,
      naziv: art.naziv,
      cena: art.prodajnaCena,
      kolicina: kalendarStavkaKolicina
    };
    setNoviTermin({ ...noviTermin, stavke: [...noviTermin.stavke, novaStavka] });
    setKalendarOdabraniMagacinArtikal(null);
    setKalendarStavkaKolicina(1);
    setKalendarStavkaPretraga('');
  };

  const dodajRucnuStavkuUKalendarTermin = () => {
    if (!kalendarRucniNaziv || !kalendarRucniCena) return;
    const novaStavka = {
      id: Date.now(),
      tip: 'rucno',
      sifra: 'USLUGA',
      naziv: kalendarRucniNaziv,
      cena: Number(kalendarRucniCena),
      kolicina: Number(kalendarRucniKolicina) || 1
    };
    setNoviTermin({ ...noviTermin, stavke: [...noviTermin.stavke, novaStavka] });
    setKalendarRucniNaziv('');
    setKalendarRucniCena('');
    setKalendarRucniKolicina(1);
  };

  const ukloniStavkuIzKalendarTermina = (stavkaId) => {
    const stavkaZaUklanjanje = noviTermin.stavke.find(s => s.id === stavkaId);
    if (stavkaZaUklanjanje && stavkaZaUklanjanje.tip === 'magacin') {
      const art = magacin.find(a => a.id === stavkaZaUklanjanje.magacinId);
      if (art) {
        izmeniArtikalPolje(art.id, 'kolicina', art.kolicina + stavkaZaUklanjanje.kolicina);
      }
    }
    setNoviTermin({
      ...noviTermin,
      stavke: noviTermin.stavke.filter(s => s.id !== stavkaId)
    });
  };

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
          vremePocetka: t.vreme_pocetka || '09:00',
          vremeZavrsetka: t.vreme_zavrsetka || '10:00',
          klijent: t.klijent,
          telefon: t.telefon || '',
          auto: t.auto,
          registracija: t.registracija || '',
          brojSasije: t.broj_sasije || '',
          kilometraza: t.kilometraza || '',
          opis: t.opis,
          cena: t.cena,
          zavrseno: t.zavrseno,
          nije_se_pojavio: t.nije_se_pojavio || false,
          dizalica: t.dizalica || 'Dizalica 1',
          stavke: t.stavke || []
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

  const otvoriPregledDana = (danStr, dizalicaName = 'Dizalica 1') => {
    setIzabraniDatumZaPregled(danStr);
    setNoviTermin({ vremePocetka: '09:00', vremeZavrsetka: '10:00', klijent: '', telefon: '', auto: '', registracija: '', brojSasije: '', kilometraza: '', opis: '', dizalica: dizalicaName, stavke: [] });
    setPrikaziModalDana(true);
  };

  const sacuvajTermin = async (e) => {
    e.preventDefault();
    if (!noviTermin.klijent || !izabraniDatumZaPregled) return;

    const izracunataCena = noviTermin.stavke.reduce((acc, curr) => acc + (curr.cena * curr.kolicina), 0);

    const novi = {
      datum: izabraniDatumZaPregled,
      vreme_pocetka: noviTermin.vremePocetka,
      vreme_zavrsetka: noviTermin.vremeZavrsetka,
      klijent: noviTermin.klijent,
      telefon: noviTermin.telefon,
      auto: noviTermin.auto,
      registracija: noviTermin.registracija,
      broj_sasije: noviTermin.brojSasije,
      kilometraza: noviTermin.kilometraza,
      opis: noviTermin.opis,
      cena: izracunataCena,
      zavrseno: false,
      nije_se_pojavio: false,
      dizalica: noviTermin.dizalica || 'Dizalica 1',
      stavke: noviTermin.stavke
    };

    const { error } = await supabase.from('termini').insert([novi]);
    if (error) {
      console.error('Greška pri čuvanju termina:', error);
      alert('Greška pri čuvanju termina u bazu!');
      return;
    }

    const unetiVin = noviTermin.brojSasije ? noviTermin.brojSasije.trim().toLowerCase() : '';
    
    if (unetiVin !== '') {
      const postojeciKorisnik = bazaKorisnika.find(k => 
        k.brojSasije && k.brojSasije.trim().toLowerCase() === unetiVin
      );

      if (postojeciKorisnik) {
        const noviOpisZaBazu = postojeciKorisnik.opisRadova 
          ? `${postojeciKorisnik.opisRadova}\n[${izabraniDatumZaPregled}] ${noviTermin.opis} (${izracunataCena} RSD)` 
          : `[${izabraniDatumZaPregled}] ${noviTermin.opis} (${izracunataCena} RSD)`;

        await supabase.from('baza_korisnika').update({
          opis_radova: noviOpisZaBazu,
          telefon: noviTermin.telefon || postojeciKorisnik.telefon,
          kilometraza: noviTermin.kilometraza || postojeciKorisnik.kilometraza
        }).eq('id', postojeciKorisnik.id);

        ucitajBazuKorisnika();
      } else {
        const deloviImena = noviTermin.klijent.split(' ');
        const imeKlijenta = deloviImena[0] || '';
        const prezimeKlijenta = deloviImena.slice(1).join(' ') || '';

        const noviKorisnikZapis = {
          ime: imeKlijenta,
          prezime: prezimeKlijenta,
          telefon: noviTermin.telefon || '',
          model_vozila: noviTermin.auto,
          broj_sasije: noviTermin.brojSasije,
          registracija: noviTermin.registracija,
          kilometraza: noviTermin.kilometraza,
          opis_radova: `[${izabraniDatumZaPregled}] ${noviTermin.opis} (${izracunataCena} RSD)`
        };

        await supabase.from('baza_korisnika').insert([noviKorisnikZapis]);
        ucitajBazuKorisnika();
      }
    }

    ucitajTermine();
    alert('Termin uspešno zakazan, cena i stavke sačuvane u istoriju klijenta i kalendar!');
    setNoviTermin({ vremePocetka: '09:00', vremeZavrsetka: '10:00', klijent: '', telefon: '', auto: '', registracija: '', brojSasije: '', kilometraza: '', opis: '', dizalica: noviTermin.dizalica, stavke: [] });
  };

  const toggleZavrsenTermin = async (datumStr, terminId) => {
    const postojeci = zakazanaVozila[datumStr] || [];
    const t = postojeci.find(x => x.id === terminId);
    if (!t) return;

    const noviZavrseno = !t.zavrseno;
    const { error } = await supabase.from('termini').update({ 
      zavrseno: noviZavrseno, 
      nije_se_pojavio: noviZavrseno ? false : t.nije_se_pojavio 
    }).eq('id', terminId);

    if (error) console.error(error);
    else ucitajTermine();
  };

  const toggleNijeSePojavio = async (datumStr, terminId) => {
    const postojeci = zakazanaVozila[datumStr] || [];
    const t = postojeci.find(x => x.id === terminId);
    if (!t) return;

    const noviNijeSePojavio = !t.nije_se_pojavio;
    const { error } = await supabase.from('termini').update({ 
      nije_se_pojavio: noviNijeSePojavio,
      zavrseno: noviNijeSePojavio ? false : t.zavrseno 
    }).eq('id', terminId);

    if (error) console.error(error);
    else ucitajTermine();
  };

  const obrisiTermin = async (datumStr, terminId) => {
    const { error } = await supabase.from('termini').delete().eq('id', terminId);
    if (error) console.error(error);
    else ucitajTermine();
  };

  const preuzmiExcelIzvestaj = () => {
    const lista = zakazanaVozila[izabraniDatumZaPregled] || [];
    if (lista.length === 0) {
      alert('Nema zakazanih poslova za izabrani datum!');
      return;
    }

    let csvContent = "data:text/csv;charset=utf-8,\uFEFF";
    csvContent += "Datum,Dizalica,Vreme pocetka,Vreme zavrsetka,Klijent,Telefon,Vozilo,Registracija,Broj sasije,Kilometraza,Opis radova,Cena (RSD),Status\r\n";

    let ukupnoPazar = 0;

    lista.forEach(t => {
      let statusStr = "U toku";
      if (t.zavrseno) {
        statusStr = "Završeno i naplaćeno";
        ukupnoPazar += Number(t.cena) || 0;
      } else if (t.nije_se_pojavio) {
        statusStr = "Korisnik se nije pojavio";
      }

      const red = [
        izabraniDatumZaPregled,
        `"${t.dizalica || 'Dizalica 1'}"`,
        t.vremePocetka,
        t.vremeZavrsetka,
        `"${t.klijent}"`,
        `"${t.telefon || ''}"`,
        `"${t.auto || ''}"`,
        `"${t.registracija || ''}"`,
        `"${t.brojSasije || ''}"`,
        `"${t.kilometraza || ''}"`,
        `"${t.opis || ''}"`,
        t.cena || 0,
        `"${statusStr}"`
      ].join(",");
      csvContent += red + "\r\n";
    });

    csvContent += `\r\n,,, , , , , , , ,UKUPNO NAPLAĆENO:,${ukupnoPazar} RSD\r\n`;

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `izvestaj_servisa_${izabraniDatumZaPregled}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
      tipKlijenta: 'firma',
      nazivFirme: pr.nazivFirme,
      pib: pr.pib,
      maticniBroj: pr.maticniBroj,
      adresaFirme: pr.adresa,
      modelVozila: pr.modelVozila,
      stavke: pr.stavke.map(s => ({ ...s, tip: 'rucno', sifra: 'PRED' }))
    });
    setActiveTab('radni-nalog');
    setPodTabNalog('novi');
  };

  const [prikaziSkener, setPrikaziSkener] = useState(false);

  const simulirajSkeniranje = () => {
    setTrenutniNalog({
      ...trenutniNalog,
      ime: 'Marko',
      prezime: 'Marković',
      telefon: '064/123-4567',
      modelVozila: 'Volkswagen Golf 7 1.6 TDI',
      brojSasije: 'WVWZZZAUZFW123456',
      registracija: 'BG-1234-AB',
      kilometraza: '185000'
    });
    setPrikaziSkener(false);
  };

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

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans">
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
              onClick={() => setActiveTab('baza-korisnika')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'baza-korisnika' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
            >
              <Users size={16} />
              <span>Baza korisnika</span>
            </button>
            <button 
              onClick={() => setActiveTab('magacin')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'magacin' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
            >
              <Package size={16} />
              <span>Magacin</span>
            </button>
            <button 
              onClick={() => setActiveTab('kalkulacija')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'kalkulacija' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
            >
              <Calculator size={16} />
              <span>Kalkulacija cena</span>
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

      <main className="flex-1 p-6 max-w-7xl mx-auto w-full">
        
        {/* BAZA KORISNIKA MODUL */}
        {activeTab === 'baza-korisnika' && (
          <div className="space-y-6">
            <div className="bg-slate-800 border border-slate-700 p-6 rounded-xl shadow-lg space-y-4">
              <h3 className="text-lg font-bold text-white flex items-center space-x-2">
                <Users className="text-blue-400" size={20} />
                <span>Ručni unos novog korisnika i vozila u bazu (Sa validacijom po broju šasije)</span>
              </h3>

              <form onSubmit={sacuvajRucnogKorisnika} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Ime klijenta *</label>
                  <input 
                    type="text" 
                    placeholder="Petar"
                    value={noviKorisnikRucno.ime}
                    onChange={e => setNoviKorisnikRucno({...noviKorisnikRucno, ime: e.target.value})}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Prezime klijenta</label>
                  <input 
                    type="text" 
                    placeholder="Petrović"
                    value={noviKorisnikRucno.prezime}
                    onChange={e => setNoviKorisnikRucno({...noviKorisnikRucno, prezime: e.target.value})}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Telefon</label>
                  <input 
                    type="text" 
                    placeholder="064/123-456"
                    value={noviKorisnikRucno.telefon}
                    onChange={e => setNoviKorisnikRucno({...noviKorisnikRucno, telefon: e.target.value})}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Model vozila *</label>
                  <input 
                    type="text" 
                    placeholder="Audi A4 2.0 TDI"
                    value={noviKorisnikRucno.modelVozila}
                    onChange={e => setNoviKorisnikRucno({...noviKorisnikRucno, modelVozila: e.target.value})}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Broj šasije (VIN)</label>
                  <input 
                    type="text" 
                    placeholder="WAUZZZ..."
                    value={noviKorisnikRucno.brojSasije}
                    onChange={e => setNoviKorisnikRucno({...noviKorisnikRucno, brojSasije: e.target.value})}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 uppercase font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Registarska oznaka</label>
                  <input 
                    type="text" 
                    placeholder="BG-1234-AB"
                    value={noviKorisnikRucno.registracija}
                    onChange={e => setNoviKorisnikRucno({...noviKorisnikRucno, registracija: e.target.value})}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 uppercase font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Kilometraža (km)</label>
                  <div className="relative">
                    <Gauge size={16} className="absolute left-3 top-3 text-slate-500" />
                    <input 
                      type="text" 
                      placeholder="npr. 185000"
                      value={noviKorisnikRucno.kilometraza}
                      onChange={e => setNoviKorisnikRucno({...noviKorisnikRucno, kilometraza: e.target.value})}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 font-mono"
                    />
                  </div>
                </div>
                <div className="sm:col-span-2">
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Početni opis radova na vozilu</label>
                  <input 
                    type="text" 
                    placeholder="Mali servis, zamena pločica..."
                    value={noviKorisnikRucno.opisRadova}
                    onChange={e => setNoviKorisnikRucno({...noviKorisnikRucno, opisRadova: e.target.value})}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div className="sm:col-span-2 lg:col-span-3 flex justify-end">
                  <button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2.5 rounded-xl text-sm font-semibold flex items-center space-x-2 transition shadow">
                    <Save size={16} />
                    <span>Sačuvaj korisnika u bazu</span>
                  </button>
                </div>
              </form>
            </div>

            <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden shadow-lg p-6 space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h3 className="font-bold text-white text-base">Evidentirani korisnici i vozila ({bazaKorisnika.length})</h3>
                  <p className="text-xs text-slate-400">Pretraga po klijentu, vozilu, registraciji ili broju šasije</p>
                </div>
                <div className="relative w-full md:w-80">
                  <Search size={16} className="absolute left-3 top-3 text-slate-400" />
                  <input 
                    type="text"
                    value={korisnikPretraga}
                    onChange={(e) => setKorisnikPretraga(e.target.value)}
                    placeholder="Pretraga..."
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="bg-slate-900 text-slate-400 text-xs uppercase border-b border-slate-700">
                      <th className="py-3 px-4">Klijent</th>
                      <th className="py-3 px-4">Telefon</th>
                      <th className="py-3 px-4">Model vozila</th>
                      <th className="py-3 px-4">Reg. oznaka</th>
                      <th className="py-3 px-4">Kilometraža</th>
                      <th className="py-3 px-4">Broj šasije (VIN)</th>
                      <th className="py-3 px-4 text-right">Akcije</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700">
                    {korisniciFiltrirani.map(k => (
                      <tr key={k.id} className="hover:bg-slate-750 transition">
                        <td className="py-3 px-4 font-bold text-white">{k.ime} {k.prezime}</td>
                        <td className="py-3 px-4 text-slate-300">{k.telefon || '/'}</td>
                        <td className="py-3 px-4 text-blue-400 font-semibold">{k.modelVozila}</td>
                        <td className="py-3 px-4 text-slate-300 font-mono">{k.registracija || '/'}</td>
                        <td className="py-3 px-4 text-slate-300 font-mono">{k.kilometraza ? `${k.kilometraza} km` : '/'}</td>
                        <td className="py-3 px-4 text-slate-400 font-mono text-xs">{k.brojSasije || '/'}</td>
                        <td className="py-3 px-4 text-right flex items-center justify-end space-x-2">
                          <button 
                            onClick={() => setUredjivanjeKorisnikaModal({...k})} 
                            className="bg-slate-900 hover:bg-amber-600 text-slate-200 hover:text-white px-3 py-1.5 rounded-lg border border-slate-700 text-xs font-semibold transition"
                          >
                            <Edit size={14} className="inline mr-1" />
                            <span>Izmeni</span>
                          </button>
                          <button 
                            onClick={() => setIstorijaKorisnikaModal(k)} 
                            className="bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1 border border-blue-500/30 transition"
                          >
                            <History size={14} />
                            <span>Istorija</span>
                          </button>
                          <button onClick={() => obrisiKorisnikaIzBaze(k.id)} className="text-red-400 hover:text-red-300 p-1.5" title="Obriši korisnika">
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {korisniciFiltrirani.length === 0 && (
                      <tr>
                        <td colSpan="7" className="text-center py-6 text-slate-400 text-sm">Nema pronađenih korisnika u bazi.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* MODAL ZA IZMENU KORISNIKA */}
            {uredjivanjeKorisnikaModal && (
              <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
                <div className="bg-slate-800 border border-slate-700 p-6 rounded-2xl max-w-xl w-full space-y-6 shadow-2xl">
                  <div className="flex justify-between items-center border-b border-slate-700 pb-4">
                    <h4 className="font-bold text-lg text-white flex items-center space-x-2">
                      <Edit className="text-blue-400" />
                      <span>Izmena podataka o korisniku i vozilu</span>
                    </h4>
                    <button onClick={() => setUredjivanjeKorisnikaModal(null)} className="text-slate-400 hover:text-white bg-slate-900 p-2 rounded-xl border border-slate-700">
                      <X size={18} />
                    </button>
                  </div>

                  <form onSubmit={sacuvajIzmenjenogKorisnika} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs text-slate-400 block mb-1">Ime</label>
                        <input 
                          type="text"
                          value={uredjivanjeKorisnikaModal.ime}
                          onChange={e => setUredjivanjeKorisnikaModal({...uredjivanjeKorisnikaModal, ime: e.target.value})}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
                          required
                        />
                      </div>
                      <div>
                        <label className="text-xs text-slate-400 block mb-1">Prezime</label>
                        <input 
                          type="text"
                          value={uredjivanjeKorisnikaModal.prezime}
                          onChange={e => setUredjivanjeKorisnikaModal({...uredjivanjeKorisnikaModal, prezime: e.target.value})}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-slate-400 block mb-1">Telefon</label>
                        <input 
                          type="text"
                          value={uredjivanjeKorisnikaModal.telefon}
                          onChange={e => setUredjivanjeKorisnikaModal({...uredjivanjeKorisnikaModal, telefon: e.target.value})}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-slate-400 block mb-1">Model vozila</label>
                        <input 
                          type="text"
                          value={uredjivanjeKorisnikaModal.modelVozila}
                          onChange={e => setUredjivanjeKorisnikaModal({...uredjivanjeKorisnikaModal, modelVozila: e.target.value})}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
                          required
                        />
                      </div>
                      <div>
                        <label className="text-xs text-slate-400 block mb-1">Registracija</label>
                        <input 
                          type="text"
                          value={uredjivanjeKorisnikaModal.registracija}
                          onChange={e => setUredjivanjeKorisnikaModal({...uredjivanjeKorisnikaModal, registracija: e.target.value})}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white font-mono uppercase"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-slate-400 block mb-1">Kilometraža (km)</label>
                        <input 
                          type="text"
                          value={uredjivanjeKorisnikaModal.kilometraza}
                          onChange={e => setUredjivanjeKorisnikaModal({...uredjivanjeKorisnikaModal, kilometraza: e.target.value})}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white font-mono"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="text-xs text-slate-400 block mb-1">Broj šasije (VIN)</label>
                        <input 
                          type="text"
                          value={uredjivanjeKorisnikaModal.brojSasije}
                          onChange={e => setUredjivanjeKorisnikaModal({...uredjivanjeKorisnikaModal, brojSasije: e.target.value})}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white font-mono uppercase"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="text-xs text-slate-400 block mb-1">Opis radova / beleške</label>
                        <textarea 
                          rows={3}
                          value={uredjivanjeKorisnikaModal.opisRadova}
                          onChange={e => setUredjivanjeKorisnikaModal({...uredjivanjeKorisnikaModal, opisRadova: e.target.value})}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white resize-none"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end space-x-3 pt-4 border-t border-slate-700">
                      <button type="button" onClick={() => setUredjivanjeKorisnikaModal(null)} className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-xl text-sm font-semibold transition">
                        Otkaži
                      </button>
                      <button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-xl text-sm font-semibold transition shadow">
                        Sačuvaj izmene
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {istorijaKorisnikaModal && (
              <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
                <div className="bg-slate-800 border border-slate-700 p-6 rounded-2xl max-w-4xl w-full space-y-6 shadow-2xl max-h-[90vh] overflow-y-auto">
                  <div className="flex justify-between items-center border-b border-slate-700 pb-4">
                    <div>
                      <h4 className="font-bold text-lg text-white flex items-center space-x-2">
                        <History className="text-blue-400" />
                        <span>Istorija radova za klijenta: {istorijaKorisnikaModal.ime} {istorijaKorisnikaModal.prezime}</span>
                      </h4>
                      <p className="text-xs text-slate-400 mt-1">Vozilo: <strong className="text-blue-400">{istorijaKorisnikaModal.modelVozila}</strong> | Šasija: {istorijaKorisnikaModal.brojSasije || 'N/A'} | Reg: {istorijaKorisnikaModal.registracija || 'N/A'}</p>
                    </div>
                    <button onClick={() => setIstorijaKorisnikaModal(null)} className="text-slate-400 hover:text-white bg-slate-900 p-2 rounded-xl border border-slate-700">
                      <X size={18} />
                    </button>
                  </div>

                  <div className="space-y-4">
                    {istorijaKorisnikaModal.opisRadova && (
                      <div className="bg-slate-900 border border-blue-500/30 p-4 rounded-xl space-y-1">
                        <h5 className="font-bold text-xs text-blue-400 uppercase">Beleške i istorija servisa:</h5>
                        <p className="text-sm text-white whitespace-pre-wrap">{istorijaKorisnikaModal.opisRadova}</p>
                      </div>
                    )}

                    <h5 className="font-semibold text-sm text-slate-300">Povezani radni nalozi iz arhive:</h5>
                    <div className="space-y-3">
                      {radniNalozi
                        .filter(rn => 
                          (istorijaKorisnikaModal.brojSasije && rn.brojSasije && rn.brojSasije.trim().toLowerCase() === istorijaKorisnikaModal.brojSasije.trim().toLowerCase()) ||
                          (rn.registracija && istorijaKorisnikaModal.registracija && rn.registracija.trim().toLowerCase() === istorijaKorisnikaModal.registracija.trim().toLowerCase()) ||
                          (rn.ime && rn.ime.toLowerCase().includes(istorijaKorisnikaModal.ime.toLowerCase()))
                        )
                        .map(rn => {
                          const osnovnaC = (rn.stavke || []).reduce((acc, curr) => acc + (curr.cena * curr.kolicina), 0);
                          const ukupnoC = rn.include_vat !== false ? osnovnaC * 1.20 : osnovnaC;
                          return (
                            <div key={rn.id} className="bg-slate-900 border border-slate-700 p-4 rounded-xl space-y-2">
                              <div className="flex justify-between items-center">
                                <span className="font-bold text-blue-400">{rn.broj} (Datum: {rn.datum})</span>
                                <span className="text-emerald-400 font-semibold">{ukupnoC.toLocaleString()} RSD</span>
                              </div>
                              <p className="text-xs text-slate-300">Kilometraža: <strong className="font-mono text-white">{rn.kilometraza ? `${rn.kilometraza} km` : 'N/A'}</strong></p>
                              {rn.work_description && <p className="text-xs text-slate-400">Opis radova: {rn.work_description}</p>}
                              <div className="text-xs text-slate-400 border-t border-slate-800 pt-2">
                                Stavke na nalogu: {(rn.stavke || []).map(s => `${s.naziv} (${s.kolicina}x)`).join(', ')}
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button onClick={() => setIstorijaKorisnikaModal(null)} className="bg-slate-700 hover:bg-slate-600 text-white px-5 py-2 rounded-xl text-sm font-semibold transition">
                      Zatvori
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* MAGACIN MODUL */}
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

            <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden shadow-lg">
              <div className="px-6 py-4 border-b border-slate-700 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h3 className="font-semibold text-white">Stanje na lageru</h3>
                  <p className="text-xs text-slate-400">Za dodavanje i izmene koristite modul "Kalkulacija cena"</p>
                </div>
                <div className="relative w-full md:w-72">
                  <Search size={16} className="absolute left-3 top-2.5 text-slate-400" />
                  <input 
                    type="text"
                    value={magacinPretraga}
                    onChange={(e) => setMagacinPretraga(e.target.value)}
                    placeholder="Pretraga po šifri, nazivu..."
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                  {magacinPretraga && (
                    <button onClick={() => setMagacinPretraga('')} className="absolute right-2.5 top-2 text-slate-400 hover:text-white">
                      <X size={14} />
                    </button>
                  )}
                </div>
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
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700 text-sm">
                    {magacinFiltriran.map(art => (
                      <tr key={art.id} className="hover:bg-slate-750 transition">
                        <td className="py-3 px-4 font-mono text-slate-400">{art.sifra}</td>
                        <td className="py-3 px-4 font-medium text-white">{art.naziv}</td>
                        <td className="py-3 px-4 text-slate-300">{art.nabavnaCena} RSD</td>
                        <td className="py-3 px-4 text-blue-400 font-semibold">{art.prodajnaCena} RSD</td>
                        <td className={`py-3 px-4 font-bold ${art.kolicina <= 2 ? 'text-red-400' : 'text-white'}`}>
                          {art.kolicina}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* KALKULACIJA CENA I UNOS NOVOG ARTIKLA MODUL */}
        {activeTab === 'kalkulacija' && (
          <div className="space-y-6">
            {!kalkulacijaOtkljucana ? (
              <div className="bg-slate-800 border border-slate-700 p-8 rounded-2xl max-w-md mx-auto space-y-6 shadow-xl my-12">
                <div className="text-center space-y-2">
                  <div className="bg-blue-600/20 text-blue-400 border border-blue-500/30 w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3">
                    <Lock size={24} />
                  </div>
                  <h3 className="text-xl font-bold text-white">Zaštićen modul</h3>
                  <p className="text-xs text-slate-400">Unesite šifru za pristup unosu artikala i kalkulaciji cena</p>
                </div>

                {kalkulacijaSifraGreska && (
                  <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-xs p-3 rounded-xl text-center">
                    {kalkulacijaSifraGreska}
                  </div>
                )}

                <form onSubmit={proveriKalkulacijaSifru} className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">Unesite šifru</label>
                    <input 
                      type="password"
                      placeholder="••••••••"
                      value={kalkulacijaUnesenaSifra}
                      onChange={e => setKalkulacijaUnesenaSifra(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                      required
                    />
                  </div>
                  <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2.5 rounded-xl text-sm transition shadow-lg shadow-blue-600/25">
                    Otključaj modul
                  </button>
                </form>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="bg-slate-800 border border-slate-700 p-6 rounded-xl shadow-lg space-y-4">
                  <div className="flex justify-between items-center border-b border-slate-700 pb-4">
                    <h3 className="text-lg font-semibold text-white flex items-center space-x-2">
                      <Plus className="text-emerald-400" size={20} />
                      <span>Unos novog proizvoda / dela u magacin</span>
                    </h3>
                    <button onClick={() => { setKalkulacijaOtkljucana(false); setKalkulacijaUnesenaSifra(''); }} className="text-xs bg-slate-900 border border-slate-700 text-slate-400 hover:text-white px-3 py-1.5 rounded-lg transition">
                      Zaključaj ponovo
                    </button>
                  </div>

                  <form onSubmit={dodajNoviArtikalUmagacin} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="sm:col-span-2">
                      <label className="text-xs font-semibold text-slate-300 block mb-1">Naziv artikla / dela *</label>
                      <input 
                        type="text"
                        placeholder="npr. Filter ulja Mann W712/94"
                        value={noviArtikal.naziv}
                        onChange={e => setNoviArtikal({...noviArtikal, naziv: e.target.value})}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-300 block mb-1">Nabavna cena (RSD)</label>
                      <input 
                        type="number"
                        placeholder="0"
                        value={noviArtikal.nabavnaCena}
                        onChange={e => setNoviArtikal({...noviArtikal, nabavnaCena: e.target.value})}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-300 block mb-1">Prodajna cena (RSD) *</label>
                      <input 
                        type="number"
                        placeholder="0"
                        value={noviArtikal.prodajnaCena}
                        onChange={e => setNoviArtikal({...noviArtikal, prodajnaCena: e.target.value})}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-300 block mb-1">Početna količina</label>
                      <input 
                        type="number"
                        placeholder="1"
                        value={noviArtikal.kolicina}
                        onChange={e => setNoviArtikal({...noviArtikal, kolicina: e.target.value})}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div className="sm:col-span-2 lg:col-span-4 flex justify-end pt-2">
                      <button type="submit" className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2.5 rounded-xl text-sm font-semibold flex items-center space-x-2 transition shadow">
                        <Save size={16} />
                        <span>Dodaj artikal u magacin</span>
                      </button>
                    </div>
                  </form>
                </div>

                <div className="bg-slate-800 border border-slate-700 p-6 rounded-xl shadow-lg space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold text-white flex items-center space-x-2">
                      <Calculator size={20} className="text-blue-400" />
                      <span>Kalkulacija cena i izmena postojećih artikala</span>
                    </h3>
                    <p className="text-xs text-slate-400">Pretražite artikal po šifri ili nazivu za izmenu cena ili stanja.</p>
                  </div>

                  <div className="relative">
                    <Search size={18} className="absolute left-3 top-3 text-slate-500" />
                    <input 
                      type="text"
                      value={kalkulacijaPretraga}
                      onChange={(e) => {
                        const val = e.target.value;
                        setKalkulacijaPretraga(val);
                        const pronadjeni = magacin.find(i => i.sifra.toLowerCase() === val.toLowerCase() || i.naziv.toLowerCase().includes(val.toLowerCase()));
                        setIzabraniArtikalKalkulacija(pronadjeni || null);
                      }}
                      placeholder="Unesite šifru ili naziv artikla za izmenu..."
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  {izabraniArtikalKalkulacija ? (
                    <form onSubmit={sacuvajKalkulacijuIzmene} className="bg-slate-900 border border-blue-500/40 p-6 rounded-xl space-y-4 mt-4">
                      <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                        <div>
                          <h4 className="font-bold text-white text-base">{izabraniArtikalKalkulacija.naziv}</h4>
                          <p className="text-xs text-blue-400 font-mono">Šifra: {izabraniArtikalKalkulacija.sifra}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="text-xs font-semibold text-slate-300 block mb-1">Nabavna cena (RSD)</label>
                          <input 
                            type="number"
                            value={izabraniArtikalKalkulacija.nabavnaCena}
                            onChange={(e) => setIzabraniArtikalKalkulacija({...izabraniArtikalKalkulacija, nabavnaCena: Number(e.target.value)})}
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-slate-300 block mb-1">Prodajna cena (RSD)</label>
                          <input 
                            type="number"
                            value={izabraniArtikalKalkulacija.prodajnaCena}
                            onChange={(e) => setIzabraniArtikalKalkulacija({...izabraniArtikalKalkulacija, prodajnaCena: Number(e.target.value)})}
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-slate-300 block mb-1">Količina</label>
                          <input 
                            type="number"
                            value={izabraniArtikalKalkulacija.kolicina}
                            onChange={(e) => setIzabraniArtikalKalkulacija({...izabraniArtikalKalkulacija, kolicina: Number(e.target.value)})}
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                          />
                        </div>
                      </div>

                      <div className="flex justify-end pt-2">
                        <button type="submit" className="bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2.5 rounded-xl text-sm font-semibold flex items-center space-x-2 transition shadow">
                          <Save size={16} />
                          <span>Sačuvaj izmene</span>
                        </button>
                      </div>
                    </form>
                  ) : null}
                </div>
              </div>
            )}
          </div>
        )}

        {/* RADNI NALOG MODUL */}
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
                        <h4 className="font-bold text-lg text-white">Skeniranje saobraćajne dozvole</h4>
                        <button onClick={() => setPrikaziSkener(false)} className="text-slate-400 hover:text-white">✕</button>
                      </div>
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
                      <label className="text-xs text-slate-400 block mb-1">Tip klijenta</label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setTrenutniNalog({...trenutniNalog, tipKlijenta: 'privatno'})}
                          className={`py-2 px-3 rounded-lg text-xs font-semibold transition ${trenutniNalog.tipKlijenta === 'privatno' ? 'bg-blue-600 text-white' : 'bg-slate-900 text-slate-400 border border-slate-700'}`}
                        >
                          Privatno lice
                        </button>
                        <button
                          type="button"
                          onClick={() => setTrenutniNalog({...trenutniNalog, tipKlijenta: 'firma'})}
                          className={`py-2 px-3 rounded-lg text-xs font-semibold transition ${trenutniNalog.tipKlijenta === 'firma' ? 'bg-blue-600 text-white' : 'bg-slate-900 text-slate-400 border border-slate-700'}`}
                        >
                          Firma / Pravno lice
                        </button>
                      </div>
                    </div>

                    {trenutniNalog.tipKlijenta === 'firma' && (
                      <div className="bg-slate-900 border border-blue-500/30 p-3 rounded-xl space-y-3">
                        <p className="text-xs font-bold text-blue-400 uppercase">Podaci o firmi</p>
                        <div>
                          <label className="text-xs text-slate-400 block mb-1">Naziv firme *</label>
                          <input 
                            type="text" 
                            value={trenutniNalog.nazivFirme}
                            onChange={e => setTrenutniNalog({...trenutniNalog, nazivFirme: e.target.value})}
                            placeholder="Naziv firme DOO"
                            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-xs text-slate-400 block mb-1">PIB</label>
                            <input 
                              type="text" 
                              value={trenutniNalog.pib}
                              onChange={e => setTrenutniNalog({...trenutniNalog, pib: e.target.value})}
                              placeholder="100000000"
                              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white font-mono"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-slate-400 block mb-1">Matični broj</label>
                            <input 
                              type="text" 
                              value={trenutniNalog.maticniBroj}
                              onChange={e => setTrenutniNalog({...trenutniNalog, maticniBroj: e.target.value})}
                              placeholder="20000000"
                              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white font-mono"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="text-xs text-slate-400 block mb-1">Adresa firme</label>
                          <input 
                            type="text" 
                            value={trenutniNalog.adresaFirme}
                            onChange={e => setTrenutniNalog({...trenutniNalog, adresaFirme: e.target.value})}
                            placeholder="Ulica i broj, Grad"
                            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white"
                          />
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="text-xs text-slate-400 block mb-1">Broj šasije (VIN)</label>
                      <div className="flex space-x-2">
                        <input 
                          type="text" 
                          value={trenutniNalog.brojSasije}
                          onChange={e => setTrenutniNalog({...trenutniNalog, brojSasije: e.target.value})}
                          placeholder="WAUZZZ..."
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white uppercase font-mono"
                        />
                        <button 
                          type="button" 
                          onClick={dohvatiKorisnikaPoSasiji}
                          className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-2 rounded-lg text-xs font-semibold flex items-center space-x-1 shrink-0 transition"
                        >
                          <SearchCode size={16} />
                          <span>Pronađi</span>
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="text-xs text-slate-400 block mb-1">Ime klijenta</label>
                      <input 
                        type="text" 
                        value={trenutniNalog.ime}
                        onChange={e => setTrenutniNalog({...trenutniNalog, ime: e.target.value})}
                        placeholder="Petar"
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-400 block mb-1">Prezime klijenta</label>
                      <input 
                        type="text" 
                        value={trenutniNalog.prezime}
                        onChange={e => setTrenutniNalog({...trenutniNalog, prezime: e.target.value})}
                        placeholder="Petrović"
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-400 block mb-1">Telefon</label>
                      <input 
                        type="text" 
                        value={trenutniNalog.telefon}
                        onChange={e => setTrenutniNalog({...trenutniNalog, telefon: e.target.value})}
                        placeholder="06x/xxx-xxxx"
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-400 block mb-1">Model vozila</label>
                      <input 
                        type="text" 
                        value={trenutniNalog.modelVozila}
                        onChange={e => setTrenutniNalog({...trenutniNalog, modelVozila: e.target.value})}
                        placeholder="Audi A4 2.0 TDI"
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-400 block mb-1">Registarska oznaka</label>
                      <input 
                        type="text" 
                        value={trenutniNalog.registracija}
                        onChange={e => setTrenutniNalog({...trenutniNalog, registracija: e.target.value})}
                        placeholder="BG-000-XX"
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white uppercase font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-400 block mb-1">Kilometraža (km)</label>
                      <div className="relative">
                        <Gauge size={16} className="absolute left-3 top-3 text-slate-500" />
                        <input 
                          type="text" 
                          value={trenutniNalog.kilometraza}
                          onChange={e => setTrenutniNalog({...trenutniNalog, kilometraza: e.target.value})}
                          placeholder="npr. 185000"
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-sm text-white font-mono"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs text-slate-400 block mb-1">Opis radova na vozilu</label>
                      <textarea 
                        rows={3}
                        value={trenutniNalog.work_description || ''}
                        onChange={e => setTrenutniNalog({...trenutniNalog, work_description: e.target.value})}
                        placeholder="Opis radova..."
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white resize-none"
                      />
                    </div>

                    <div className="pt-3 border-t border-slate-700 space-y-3">
                      <p className="text-xs font-bold text-blue-400 uppercase">Zakazivanje i Baza</p>
                      <div>
                        <label className="text-xs text-slate-400 block mb-1">Datum</label>
                        <input style={{ colorScheme: "dark" }} 
                          type="date"
                          value={trenutniNalog.datum}
                          onChange={e => setTrenutniNalog({...trenutniNalog, datum: e.target.value})}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-xs text-slate-400 block mb-1">Početak</label>
                          <input 
                            type="text"
                            maxLength={5}
                            value={trenutniNalog.vremePocetka}
                            onChange={e => setTrenutniNalog({...trenutniNalog, vremePocetka: e.target.value})}
                            placeholder="09:00"
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white font-mono text-center"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-slate-400 block mb-1">Kraj</label>
                          <input 
                            type="text"
                            maxLength={5}
                            value={trenutniNalog.vremeKraje}
                            onChange={e => setTrenutniNalog({...trenutniNalog, vremeKraje: e.target.value})}
                            placeholder="10:30"
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white font-mono text-center"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-xs text-slate-400 block mb-1">Izaberi dizalicu</label>
                        <select 
                          value={trenutniNalog.dizalica}
                          onChange={e => setTrenutniNalog({...trenutniNalog, dizalica: e.target.value})}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
                        >
                          <option value="Dizalica 1">Dizalica 1</option>
                          <option value="Dizalica 2">Dizalica 2</option>
                          <option value="Dizalica 3">Dizalica 3</option>
                        </select>
                      </div>
                      <label className="flex items-center space-x-2.5 cursor-pointer pt-1">
                        <input 
                          type="checkbox"
                          checked={trenutniNalog.sacuvajKorisnikaUBazu}
                          onChange={e => setTrenutniNalog({...trenutniNalog, sacuvajKorisnikaUBazu: e.target.checked})}
                          className="w-4 h-4 rounded text-blue-600 bg-slate-900 border-slate-700"
                        />
                        <span className="text-xs font-semibold text-slate-200">Sačuvaj korisnika u bazu</span>
                      </label>
                    </div>

                    <div className="pt-2 border-t border-slate-700 space-y-2">
                      <label className="flex items-center space-x-2.5 cursor-pointer">
                        <input 
                          type="checkbox"
                          checked={trenutniNalog.include_vat !== false}
                          onChange={e => setTrenutniNalog({...trenutniNalog, include_vat: e.target.checked})}
                          className="w-4 h-4 rounded text-blue-600 bg-slate-900 border-slate-700"
                        />
                        <span className="text-xs font-semibold text-slate-200">Obračunaj PDV (+20%)</span>
                      </label>

                      <label className="flex items-center space-x-2.5 cursor-pointer">
                        <input 
                          type="checkbox"
                          checked={trenutniNalog.sakrijCenu}
                          onChange={e => setTrenutniNalog({...trenutniNalog, sakrijCenu: e.target.checked})}
                          className="w-4 h-4 rounded text-blue-600 bg-slate-900 border-slate-700"
                        />
                        <span className="text-xs font-semibold text-amber-300">Sakrij cenu na štampi radnog naloga</span>
                      </label>
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
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-sm text-white"
                          />
                        </div>
                        <select 
                          value={odabraniMagacinArtikal || ''} 
                          onChange={e => setOdabraniMagacinArtikal(e.target.value)}
                          className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white flex-1"
                        >
                          <option value="">-- Izaberite artikal --</option>
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
                        <button onClick={dodajStavkuIzMagacina} className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition">
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
                        <button onClick={dodajRucnuStavku} className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition">
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
                          </tbody>
                        </table>
                      </div>

                      {trenutniNalog.stavke.length > 0 && (() => {
                        const osnovnaCena = trenutniNalog.stavke.reduce((acc, curr) => acc + (curr.cena * curr.kolicina), 0);
                        const pdvIznos = trenutniNalog.include_vat !== false ? osnovnaCena * 0.20 : 0;
                        const ukupnoZaUplatu = osnovnaCena + pdvIznos;

                        return (
                          <div className="flex flex-col sm:flex-row justify-between items-center pt-4 border-t border-slate-700 gap-4">
                            <div className="space-y-0.5">
                              <p className="text-xs text-slate-400">
                                Osnovica: <span className="text-slate-200 font-semibold">{osnovnaCena.toLocaleString()} RSD</span>
                                {trenutniNalog.include_vat !== false && <span> | PDV (20%): <span className="text-slate-200 font-semibold">{pdvIznos.toLocaleString()} RSD</span></span>}
                              </p>
                              <div className="text-lg font-bold text-white">
                                Ukupno za uplatu: <span className="text-emerald-400">{ukupnoZaUplatu.toLocaleString()} RSD</span>
                              </div>
                            </div>
                            
                            <div className="flex items-center space-x-3">
                              {/* DUGME ZA DIREKTNU ŠTAMPU BEZ ČUVANJA (SADA NA NOVI RADNI NALOG) */}
                              <button 
                                onClick={() => setAktivniNalogZaStampu(trenutniNalog)} 
                                className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2.5 rounded-lg font-semibold flex items-center space-x-2 transition shadow text-sm"
                              >
                                <Printer size={16} />
                                <span>Štampaj bez čuvanja</span>
                              </button>

                              <button onClick={sacuvajRadniNalog} className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-lg font-semibold flex items-center space-x-2 transition shadow text-sm">
                                <Save size={16} />
                                <span>Sačuvaj nalog, bazu i kalendar</span>
                              </button>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                </div>
              </>
            )}

            {podTabNalog === 'arhiva' && (
              <div className="bg-slate-800 border border-slate-700 p-6 rounded-xl space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-bold text-white">Arhiva sačuvanih radnih naloga ({radniNalozi.length})</h3>
                    <p className="text-xs text-slate-400">Pregled i editovanje svih izveštaja sačuvanih u Supabase bazi</p>
                  </div>
                  <div className="relative w-full md:w-80">
                    <Search size={16} className="absolute left-3 top-3 text-slate-400" />
                    <input 
                      type="text"
                      value={naloziPretraga}
                      onChange={(e) => setNaloziPretraga(e.target.value)}
                      placeholder="Pretraga po broju, klijentu..."
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-xs text-white"
                    />
                  </div>
                </div>

                <div className="overflow-x-auto border border-slate-700 rounded-xl">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="bg-slate-900 text-slate-400 text-xs uppercase border-b border-slate-700">
                        <th className="py-3 px-4">Broj naloga</th>
                        <th className="py-3 px-4">Datum</th>
                        <th className="py-3 px-4">Klijent / Firma</th>
                        <th className="py-3 px-4">Vozilo / Reg / KM</th>
                        <th className="py-3 px-4">Ukupno (RSD)</th>
                        <th className="py-3 px-4 text-right">Akcije</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700">
                      {radniNalozi
                        .filter(rn => {
                          const term = naloziPretraga.toLowerCase();
                          return (
                            rn.broj.toLowerCase().includes(term) ||
                            (rn.ime && rn.ime.toLowerCase().includes(term)) ||
                            (rn.prezime && rn.prezime.toLowerCase().includes(term)) ||
                            (rn.nazivFirme && rn.nazivFirme.toLowerCase().includes(term)) ||
                            (rn.modelVozila && rn.modelVozila.toLowerCase().includes(term)) ||
                            (rn.registracija && rn.registracija.toLowerCase().includes(term))
                          );
                        })
                        .map(rn => {
                          const osnovnaCena = (rn.stavke || []).reduce((acc, curr) => acc + (curr.cena * curr.kolicina), 0);
                          const ukupnoCena = rn.include_vat !== false ? osnovnaCena * 1.20 : osnovnaCena;
                          const nazivKlijentaPrikaz = rn.tipKlijenta === 'firma' ? rn.nazivFirme : `${rn.ime} ${rn.prezime}`;
                          return (
                            <tr key={rn.id} className="hover:bg-slate-750 transition">
                              <td className="py-3 px-4 font-bold text-blue-400">{rn.broj}</td>
                              <td className="py-3 px-4 text-slate-300">{rn.datum}</td>
                              <td className="py-3 px-4 font-medium text-white">{nazivKlijentaPrikaz} ({rn.telefon})</td>
                              <td className="py-3 px-4 text-slate-300">{rn.modelVozila} [{rn.registracija || 'N/A'}] | <span className="font-mono text-xs text-blue-300">{rn.kilometraza ? `${rn.kilometraza} km` : 'N/A'}</span></td>
                              <td className="py-3 px-4 font-semibold text-emerald-400">{ukupnoCena.toLocaleString()} RSD</td>
                              <td className="py-3 px-4 text-right space-x-2">
                                <button 
                                  onClick={() => setUredjivanjeNalogaModal({...rn})}
                                  className="bg-slate-900 hover:bg-amber-600 text-slate-200 hover:text-white px-3 py-1.5 rounded-lg border border-slate-700 text-xs font-semibold transition"
                                >
                                  <Edit size={14} className="inline mr-1" />
                                  <span>Izmeni</span>
                                </button>
                                <button 
                                  onClick={() => setAktivniNalogZaStampu(rn)}
                                  className="bg-slate-900 hover:bg-blue-600 text-slate-200 hover:text-white px-3 py-1.5 rounded-lg border border-slate-700 text-xs font-semibold transition"
                                >
                                  <Printer size={14} className="inline mr-1" />
                                  <span>Štampaj</span>
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {uredjivanjeNalogaModal && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-slate-800 border border-slate-700 p-6 rounded-2xl max-w-4xl w-full space-y-6 shadow-2xl max-h-[92vh] overflow-y-auto">
              <div className="flex justify-between items-center border-b border-slate-700 pb-4">
                <h4 className="font-bold text-lg text-white flex items-center space-x-2">
                  <Edit className="text-blue-400" />
                  <span>Izmena radnog naloga i stavki: {uredjivanjeNalogaModal.broj}</span>
                </h4>
                <button onClick={() => setUredjivanjeNalogaModal(null)} className="text-slate-400 hover:text-white bg-slate-900 p-2 rounded-xl border border-slate-700">
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={sacuvajIzmenjeniRadniNalog} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Tip klijenta</label>
                    <select
                      value={uredjivanjeNalogaModal.tipKlijenta}
                      onChange={e => setUredjivanjeNalogaModal({...uredjivanjeNalogaModal, tipKlijenta: e.target.value})}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
                    >
                      <option value="privatno">Privatno lice</option>
                      <option value="firma">Firma / Pravno lice</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Datum</label>
                    <input style={{ colorScheme: "dark" }} 
                      type="date"
                      value={uredjivanjeNalogaModal.datum}
                      onChange={e => setUredjivanjeNalogaModal({...uredjivanjeNalogaModal, datum: e.target.value})}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
                    />
                  </div>
                </div>

                {uredjivanjeNalogaModal.tipKlijenta === 'firma' && (
                  <div className="bg-slate-900 border border-blue-500/30 p-4 rounded-xl space-y-3">
                    <p className="text-xs font-bold text-blue-400 uppercase">Podaci o firmi</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-slate-400 block mb-1">Naziv firme</label>
                        <input 
                          type="text" 
                          value={uredjivanjeNalogaModal.nazivFirme}
                          onChange={e => setUredjivanjeNalogaModal({...uredjivanjeNalogaModal, nazivFirme: e.target.value})}
                          className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-slate-400 block mb-1">PIB</label>
                        <input 
                          type="text" 
                          value={uredjivanjeNalogaModal.pib}
                          onChange={e => setUredjivanjeNalogaModal({...uredjivanjeNalogaModal, pib: e.target.value})}
                          className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white font-mono"
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Ime klijenta</label>
                    <input 
                      type="text"
                      value={uredjivanjeNalogaModal.ime}
                      onChange={e => setUredjivanjeNalogaModal({...uredjivanjeNalogaModal, ime: e.target.value})}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Prezime</label>
                    <input 
                      type="text"
                      value={uredjivanjeNalogaModal.prezime}
                      onChange={e => setUredjivanjeNalogaModal({...uredjivanjeNalogaModal, prezime: e.target.value})}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Telefon</label>
                    <input 
                      type="text"
                      value={uredjivanjeNalogaModal.telefon}
                      onChange={e => setUredjivanjeNalogaModal({...uredjivanjeNalogaModal, telefon: e.target.value})}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Model vozila</label>
                    <input 
                      type="text"
                      value={uredjivanjeNalogaModal.modelVozila}
                      onChange={e => setUredjivanjeNalogaModal({...uredjivanjeNalogaModal, modelVozila: e.target.value})}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Registracija</label>
                    <input 
                      type="text"
                      value={uredjivanjeNalogaModal.registracija}
                      onChange={e => setUredjivanjeNalogaModal({...uredjivanjeNalogaModal, registracija: e.target.value})}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white font-mono uppercase"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Kilometraža (km)</label>
                    <input 
                      type="text"
                      value={uredjivanjeNalogaModal.kilometraza}
                      onChange={e => setUredjivanjeNalogaModal({...uredjivanjeNalogaModal, kilometraza: e.target.value})}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white font-mono"
                    />
                  </div>
                </div>

                <div className="bg-slate-900 border border-slate-700 p-4 rounded-xl space-y-4">
                  <h5 className="font-semibold text-sm text-white">Izmena stavki i cena na nalogu</h5>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-sm">
                      <thead>
                        <tr className="bg-slate-950 text-slate-400 text-xs uppercase border-b border-slate-800">
                          <th className="py-2 px-3">Naziv dela / usluge</th>
                          <th className="py-2 px-3 w-20 text-center">Količina</th>
                          <th className="py-2 px-3 w-28 text-right">Cena (RSD)</th>
                          <th className="py-2 px-3 w-28 text-right">Ukupno</th>
                          <th className="py-2 px-3 w-16 text-right">Akcija</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800">
                        {uredjivanjeNalogaModal.stavke.map(s => (
                          <tr key={s.id}>
                            <td className="py-2 px-3">
                              <input 
                                type="text"
                                value={s.naziv}
                                onChange={e => izmeniStavkuUEditPolje(s.id, 'naziv', e.target.value)}
                                className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-white"
                              />
                            </td>
                            <td className="py-2 px-3">
                              <input 
                                type="number"
                                min="1"
                                value={s.kolicina}
                                onChange={e => izmeniStavkuUEditPolje(s.id, 'kolicina', e.target.value)}
                                className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-white text-center"
                              />
                            </td>
                            <td className="py-2 px-3">
                              <input 
                                type="number"
                                value={s.cena}
                                onChange={e => izmeniStavkuUEditPolje(s.id, 'cena', e.target.value)}
                                className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-white text-right"
                              />
                            </td>
                            <td className="py-2 px-3 text-right font-semibold text-blue-400">
                              {(s.kolicina * s.cena).toLocaleString()} RSD
                            </td>
                            <td className="py-2 px-3 text-right">
                              <button type="button" onClick={() => ukloniStavkuUEdit(s.id)} className="text-red-400 hover:text-red-300 p-1">
                                <Trash2 size={16} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-800">
                    <div className="flex space-x-2">
                      <select 
                        value={editOdabraniMagacinArtikal || ''} 
                        onChange={e => setEditOdabraniMagacinArtikal(e.target.value)}
                        className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-white flex-1"
                      >
                        <option value="">-- Dodaj iz magacina --</option>
                        {magacin.map(art => (
                          <option key={art.id} value={art.id}>
                            {art.naziv} ({art.prodajnaCena} RSD)
                          </option>
                        ))}
                      </select>
                      <input 
                        type="number" 
                        min="1" 
                        value={editStavkaKolicina} 
                        onChange={e => setEditStavkaKolicina(Number(e.target.value))}
                        className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-white w-16 text-center"
                      />
                      <button type="button" onClick={dodajStavkuIzMagacinaUEdit} className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-lg text-xs font-semibold">
                        Dodaj
                      </button>
                    </div>

                    <div className="flex space-x-2">
                      <input 
                        type="text"
                        placeholder="Naziv ručne usluge"
                        value={editRucniNaziv}
                        onChange={e => setEditRucniNaziv(e.target.value)}
                        className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-white flex-1"
                      />
                      <input 
                        type="number"
                        placeholder="Cena"
                        value={editRucniCena}
                        onChange={e => setEditRucniCena(e.target.value)}
                        className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-white w-24"
                      />
                      <button type="button" onClick={dodajRucnuStavkuUEdit} className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-lg text-xs font-semibold">
                        Usluga
                      </button>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-xs text-slate-400 block mb-1">Opis radova</label>
                  <textarea 
                    rows={3}
                    value={uredjivanjeNalogaModal.work_description}
                    onChange={e => setUredjivanjeNalogaModal({...uredjivanjeNalogaModal, work_description: e.target.value})}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white resize-none"
                  />
                </div>

                <div className="flex space-x-4 pt-2">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input 
                      type="checkbox"
                      checked={uredjivanjeNalogaModal.include_vat !== false}
                      onChange={e => setUredjivanjeNalogaModal({...uredjivanjeNalogaModal, include_vat: e.target.checked})}
                      className="w-4 h-4 rounded text-blue-600 bg-slate-900 border-slate-700"
                    />
                    <span className="text-xs font-semibold text-slate-200">Obračunaj PDV (+20%)</span>
                  </label>

                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input 
                      type="checkbox"
                      checked={uredjivanjeNalogaModal.sakrijCenu}
                      onChange={e => setUredjivanjeNalogaModal({...uredjivanjeNalogaModal, sakrijCenu: e.target.checked})}
                      className="w-4 h-4 rounded text-blue-600 bg-slate-900 border-slate-700"
                    />
                    <span className="text-xs font-semibold text-amber-300">Sakrij cenu na štampi</span>
                  </label>
                </div>

                <div className="flex justify-end space-x-3 pt-4 border-t border-slate-700">
                  <button type="button" onClick={() => setUredjivanjeNalogaModal(null)} className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-xl text-sm font-semibold transition">
                    Otkaži
                  </button>
                  <button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-xl text-sm font-semibold transition shadow">
                    Sačuvaj izmene
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* KALENDAR MODUL */}
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
              <p className="text-xs text-slate-400">Prikaz radnog vremena po dizalicama</p>
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
                          <div key={t.id} className={`rounded p-1 text-[11px] truncate flex items-center space-x-1 ${t.zavrseno ? 'bg-emerald-950/60 border border-emerald-800/60 text-emerald-200' : t.nije_se_pojavio ? 'bg-red-950/60 border border-red-800/60 text-red-200' : 'bg-blue-950/80 border border-blue-800/80 text-blue-200'}`}>
                            {t.zavrseno ? <CheckCircle size={10} className="text-emerald-400 shrink-0" /> : t.nije_se_pojavio ? <XCircle size={10} className="text-red-400 shrink-0" /> : <Clock size={10} className="shrink-0" />}
                            <span className="truncate">{t.vremePocetka}-{t.vremeZavrsetka} | {t.klijent}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {prikaziModalDana && (
              <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50 p-4">
                <div className="bg-slate-800 border border-slate-700 p-6 rounded-2xl max-w-6xl w-full space-y-6 shadow-2xl max-h-[92vh] overflow-y-auto">
                  
                  <div className="flex justify-between items-center border-b border-slate-700 pb-4">
                    <div>
                      <h4 className="font-bold text-xl text-white flex items-center space-x-2">
                        <CalendarIcon className="text-blue-400" />
                        <span>Raspored po dizalicama za datum: {izabraniDatumZaPregled}</span>
                      </h4>
                      <p className="text-xs text-slate-400 mt-0.5">Evidentirano vreme početka i završetka radova</p>
                    </div>
                    <div className="flex items-center space-x-3">
                      <button onClick={preuzmiExcelIzvestaj} className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl text-xs font-semibold flex items-center space-x-2 transition shadow">
                        <Download size={16} />
                        <span>Preuzmi Excel izveštaj</span>
                      </button>
                      <button onClick={() => setPrikaziModalDana(false)} className="text-slate-400 hover:text-white bg-slate-900 p-2 rounded-xl border border-slate-700">
                        <X size={18} />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {['Dizalica 1', 'Dizalica 2', 'Dizalica 3'].map((dizalicaName) => {
                      const listaZaDizalicu = (zakazanaVozila[izabraniDatumZaPregled] || []).filter(
                        t => (t.dizalica || 'Dizalica 1') === dizalicaName
                      );

                      return (
                        <div key={dizalicaName} className="bg-slate-950 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between shadow-inner">
                          <div className="space-y-3">
                            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                              <h5 className="font-bold text-base text-blue-400 flex items-center space-x-2">
                                <Car size={16} />
                                <span>{dizalicaName}</span>
                              </h5>
                              <span className="text-xs bg-slate-900 border border-slate-800 text-slate-300 px-2 py-0.5 rounded-full font-medium">
                                {listaZaDizalicu.length} termina
                              </span>
                            </div>

                            <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                              {listaZaDizalicu.length === 0 ? (
                                <p className="text-xs text-slate-500 italic text-center py-6">Nema zakazivanja.</p>
                              ) : (
                                listaZaDizalicu.map((t) => (
                                  <div key={t.id} className={`p-3 rounded-xl border text-xs space-y-1.5 transition-all ${t.zavrseno ? 'bg-emerald-950/20 border-emerald-800/40 opacity-75' : t.nije_se_pojavio ? 'bg-red-950/20 border-red-800/40 opacity-75' : 'bg-slate-900 border-slate-800'}`}>
                                    <div className="flex justify-between items-center">
                                      <span className="font-bold text-blue-400 flex items-center space-x-1">
                                        <Clock size={12} />
                                        <span>{t.vremePocetka} - {t.vremeZavrsetka}</span>
                                      </span>
                                      <div className="flex items-center space-x-1">
                                        <button onClick={() => toggleZavrsenTermin(izabraniDatumZaPregled, t.id)} className={`p-1 rounded border ${t.zavrseno ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400'}`} title="Završeno">
                                          <CheckCircle size={14} />
                                        </button>
                                        <button onClick={() => toggleNijeSePojavio(izabraniDatumZaPregled, t.id)} className={`p-1 rounded border ${t.nije_se_pojavio ? 'bg-red-600 text-white' : 'bg-slate-800 text-slate-400'}`} title="Nije se pojavio">
                                          <XCircle size={14} />
                                        </button>
                                        <button onClick={() => obrisiTermin(izabraniDatumZaPregled, t.id)} className="p-1 bg-slate-800 text-slate-400 hover:text-red-400 rounded border" title="Obriši">
                                          <Trash2 size={14} />
                                        </button>
                                      </div>
                                    </div>
                                    <div className={`font-semibold ${t.zavrseno ? 'text-emerald-300 line-through' : t.nije_se_pojavio ? 'text-red-300 line-through' : 'text-white'}`}>{t.klijent} ({t.telefon || 'N/A'}) - {t.auto}</div>
                                    <div className="text-slate-400 font-mono text-[11px]">Reg: {t.registracija || 'N/A'} | Šasija: {t.brojSasije || 'N/A'} | KM: {t.kilometraza || 'N/A'}</div>
                                    {t.stavke && t.stavke.length > 0 && (
                                      <div className="text-slate-300 text-[11px] border-t border-slate-800 pt-1">
                                        Stavke: {t.stavke.map(s => `${s.naziv} (${s.kolicina}x)`).join(', ')}
                                      </div>
                                    )}
                                    {t.opis && <div className="text-slate-400">{t.opis}</div>}
                                    {t.cena > 0 && <div className="text-emerald-400 font-semibold">{Number(t.cena).toLocaleString()} RSD</div>}
                                  </div>
                                ))
                              )}
                            </div>
                          </div>

                          <button
                            onClick={() => setNoviTermin(prev => ({ ...prev, dizalica: dizalicaName }))}
                            className={`mt-4 w-full py-2 px-3 rounded-xl text-xs font-semibold transition-all flex items-center justify-center space-x-1.5 ${noviTermin.dizalica === dizalicaName ? 'bg-blue-600 text-white shadow' : 'bg-slate-900 border border-slate-800 text-slate-300'}`}
                          >
                            <Plus size={14} />
                            <span>Izaberi za unos ({dizalicaName})</span>
                          </button>
                        </div>
                      );
                    })}
                  </div>

                  <div className="bg-slate-950 border border-slate-800 p-5 rounded-2xl space-y-4">
                    <h5 className="font-bold text-sm text-white flex items-center space-x-2">
                      <Plus className="text-blue-400" size={16} />
                      <span>Zakazivanje novog termina za: <strong className="text-blue-400">{noviTermin.dizalica}</strong> (Datum: {izabraniDatumZaPregled})</span>
                    </h5>

                    <form onSubmit={sacuvajTermin} className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                          <label className="text-xs text-slate-400 block mb-1">Izaberi dizalicu</label>
                          <select
                            value={noviTermin.dizalica}
                            onChange={e => setNoviTermin({...noviTermin, dizalica: e.target.value})}
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white"
                          >
                            <option value="Dizalica 1">Dizalica 1</option>
                            <option value="Dizalica 2">Dizalica 2</option>
                            <option value="Dizalica 3">Dizalica 3</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-xs text-slate-400 block mb-1">Vreme početka</label>
                          <input
                            type="text"
                            maxLength={5}
                            value={noviTermin.vremePocetka}
                            onChange={e => setNoviTermin({...noviTermin, vremePocetka: e.target.value})}
                            placeholder="09:00"
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white font-mono text-center"
                            required
                          />
                        </div>
                        <div>
                          <label className="text-xs text-slate-400 block mb-1">Vreme završetka</label>
                          <input
                            type="text"
                            maxLength={5}
                            value={noviTermin.vremeZavrsetka}
                            onChange={e => setNoviTermin({...noviTermin, vremeZavrsetka: e.target.value})}
                            placeholder="10:00"
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white font-mono text-center"
                            required
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                          <label className="text-xs text-slate-400 block mb-1">Klijent (Ime i prezime) *</label>
                          <input
                            type="text"
                            placeholder="Ime i prezime"
                            value={noviTermin.klijent}
                            onChange={e => setNoviTermin({...noviTermin, klijent: e.target.value})}
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white"
                            required
                          />
                        </div>
                        <div>
                          <label className="text-xs text-slate-400 block mb-1">Broj telefona klijenta</label>
                          <input
                            type="text"
                            placeholder="06x/xxx-xxxx"
                            value={noviTermin.telefon}
                            onChange={e => setNoviTermin({...noviTermin, telefon: e.target.value})}
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-slate-400 block mb-1">Model vozila</label>
                          <input
                            type="text"
                            placeholder="Audi A4"
                            value={noviTermin.auto}
                            onChange={e => setNoviTermin({...noviTermin, auto: e.target.value})}
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                          <label className="text-xs text-slate-400 block mb-1">Registracija</label>
                          <input
                            type="text"
                            placeholder="BG-000-XX"
                            value={noviTermin.registracija}
                            onChange={e => setNoviTermin({...noviTermin, registracija: e.target.value})}
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white uppercase font-mono"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-slate-400 block mb-1">Broj šasije (VIN)</label>
                          <input
                            type="text"
                            placeholder="VIN broj"
                            value={noviTermin.brojSasije}
                            onChange={e => setNoviTermin({...noviTermin, brojSasije: e.target.value})}
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white uppercase font-mono"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-slate-400 block mb-1">Kilometraža</label>
                          <input
                            type="text"
                            placeholder="km"
                            value={noviTermin.kilometraza}
                            onChange={e => setNoviTermin({...noviTermin, kilometraza: e.target.value})}
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white font-mono"
                          />
                        </div>
                      </div>

                      {/* DODAVANJE DELOVA I USLUGA NA KALENDARU */}
                      <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-3">
                        <h6 className="font-semibold text-xs text-blue-400 uppercase">Dodavanje delova iz magacina i usluga za ovaj termin</h6>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="flex space-x-2">
                            <select 
                              value={kalendarOdabraniMagacinArtikal || ''} 
                              onChange={e => setKalendarOdabraniMagacinArtikal(e.target.value)}
                              className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white flex-1"
                            >
                              <option value="">-- Izaberi deo iz magacina --</option>
                              {magacin.map(art => (
                                <option key={art.id} value={art.id}>
                                  {art.naziv} ({art.prodajnaCena} RSD, Stanje: {art.kolicina})
                                </option>
                              ))}
                            </select>
                            <input 
                              type="number" 
                              min="1" 
                              value={kalendarStavkaKolicina} 
                              onChange={e => setKalendarStavkaKolicina(Number(e.target.value))}
                              className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-2 text-xs text-white w-16 text-center"
                            />
                            <button type="button" onClick={dodajStavkuUKalendarTermin} className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-2 rounded-lg text-xs font-semibold">
                              Dodaj
                            </button>
                          </div>

                          <div className="flex space-x-2">
                            <input 
                              type="text"
                              placeholder="Naziv usluge"
                              value={kalendarRucniNaziv}
                              onChange={e => setKalendarRucniNaziv(e.target.value)}
                              className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white flex-1"
                            />
                            <input 
                              type="number"
                              placeholder="Cena"
                              value={kalendarRucniCena}
                              onChange={e => setKalendarRucniCena(e.target.value)}
                              className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white w-24"
                            />
                            <button type="button" onClick={dodajRucnuStavkuUKalendarTermin} className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-2 rounded-lg text-xs font-semibold">
                              Usluga
                            </button>
                          </div>
                        </div>

                        {noviTermin.stavke.length > 0 && (
                          <div className="overflow-x-auto pt-2">
                            <table className="w-full text-left border-collapse text-xs">
                              <thead>
                                <tr className="bg-slate-950 text-slate-400 border-b border-slate-800">
                                  <th className="py-1.5 px-2">Naziv</th>
                                  <th className="py-1.5 px-2 w-16 text-center">Količina</th>
                                  <th className="py-1.5 px-2 w-24 text-right">Cena</th>
                                  <th className="py-1.5 px-2 w-24 text-right">Ukupno</th>
                                  <th className="py-1.5 px-2 w-12 text-right">Akcija</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-800">
                                {noviTermin.stavke.map(s => (
                                  <tr key={s.id}>
                                    <td className="py-1.5 px-2 text-white font-medium">{s.naziv}</td>
                                    <td className="py-1.5 px-2 text-center">{s.kolicina}</td>
                                    <td className="py-1.5 px-2 text-right">{s.cena} RSD</td>
                                    <td className="py-1.5 px-2 text-right font-semibold text-blue-400">{s.kolicina * s.cena} RSD</td>
                                    <td className="py-1.5 px-2 text-right">
                                      <button type="button" onClick={() => ukloniStavkuIzKalendarTermina(s.id)} className="text-red-400 hover:text-red-300">
                                        <Trash2 size={14} />
                                      </button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="text-xs text-slate-400 block mb-1">Opis radova / napomena</label>
                        <textarea
                          rows={2}
                          placeholder="Unesite napomenu ili opis radova..."
                          value={noviTermin.opis}
                          onChange={e => setNoviTermin({...noviTermin, opis: e.target.value})}
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white resize-none"
                        />
                      </div>

                      <div className="flex justify-between items-center pt-2">
                        <div className="text-base font-bold text-white">
                          Ukupna cena: <span className="text-emerald-400">{noviTermin.stavke.reduce((acc, curr) => acc + (curr.cena * curr.kolicina), 0).toLocaleString()} RSD</span>
                        </div>
                        <button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold py-2.5 px-6 rounded-xl transition shadow-lg shadow-blue-600/20 flex items-center space-x-2">
                          <Plus size={16} />
                          <span>Zakaži termin i upis u bazu</span>
                        </button>
                      </div>
                    </form>
                  </div>

                </div>
              </div>
            )}
          </div>
        )}

        {/* PREDRAČUN MODUL */}
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
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">PIB</label>
                  <input 
                    type="text" 
                    placeholder="PIB" 
                    value={trenutniPredracun.pib}
                    onChange={e => setTrenutniPredracun({...trenutniPredracun, pib: e.target.value})}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Matični broj</label>
                  <input 
                    type="text" 
                    placeholder="Matični broj" 
                    value={trenutniPredracun.maticniBroj}
                    onChange={e => setTrenutniPredracun({...trenutniPredracun, maticniBroj: e.target.value})}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Adresa</label>
                  <input 
                    type="text" 
                    placeholder="Adresa" 
                    value={trenutniPredracun.adresa}
                    onChange={e => setTrenutniPredracun({...trenutniPredracun, adresa: e.target.value})}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-slate-700">
                <input 
                  type="text" 
                  placeholder="Naziv stavke / dela / usluge" 
                  value={prStavkaNaziv}
                  onChange={e => setPrStavkaNaziv(e.target.value)}
                  className="flex-2 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white w-full"
                />
                <input 
                  type="number" 
                  placeholder="Cena (RSD)" 
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
                <button onClick={dodajStavkuPredracuna} className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition">
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
              <h4 className="font-semibold text-white">Sačuvani predračuni</h4>
              <div className="space-y-3">
                {predracuni.map(pr => (
                  <div key={pr.id} className="bg-slate-900 border border-slate-700 p-4 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div>
                      <div className="font-bold text-white flex items-center space-x-2">
                        <span>{pr.broj}</span>
                        <span className="text-slate-400 text-sm">- {pr.nazivFirme}</span>
                      </div>
                      <div className="text-xs text-slate-400 mt-1">Datum: {pr.datum} | Stavki: {pr.stavke.length}</div>
                    </div>
                    <div className="flex space-x-2">
                      <button onClick={() => setAktivniPredracunZaStampu(pr)} className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition">
                        <Printer size={14} />
                        <span>Pregled i štampa</span>
                      </button>
                      <button onClick={() => prebaciPredracunUNalog(pr)} className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition">
                        <span>Pretvori u nalog</span>
                        <ArrowRight size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* MODAL ZA ŠTAMPU RADNOG NALOGA */}
      {aktivniNalogZaStampu && (() => {
        const imaPdv = aktivniNalogZaStampu.include_vat !== false;
        const sakrijCeneNaStampi = aktivniNalogZaStampu.sakrijCenu === true;
        const osnova = (aktivniNalogZaStampu.stavke || []).reduce((acc, curr) => acc + (curr.cena * curr.kolicina), 0);
        const pdvIznos = imaPdv ? osnova * 0.20 : 0;
        const ukupnoZaUplatu = osnova + pdvIznos;
        const jeFirma = aktivniNalogZaStampu.tipKlijenta === 'firma';

        return (
          <div className="fixed inset-0 bg-black/85 flex items-center justify-center z-50 p-2 sm:p-6 overflow-y-auto print:p-0 print:bg-white">
            <div className="bg-white text-slate-900 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl relative print:shadow-none print:max-w-none print:w-full print:h-auto overflow-hidden">
              <div className="sticky top-0 bg-slate-900 text-white p-4 px-6 flex justify-between items-center z-10 print:hidden border-b border-slate-800">
                <div className="flex items-center space-x-3">
                  <Printer className="text-blue-400" size={20} />
                  <h4 className="font-bold text-base text-white">Pregled radnog naloga</h4>
                </div>
                <div className="flex items-center space-x-3">
                  <button onClick={() => window.print()} className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2 rounded-xl text-sm font-semibold flex items-center space-x-2 transition shadow">
                    <Printer size={16} />
                    <span>Štampaj / Sačuvaj PDF</span>
                  </button>
                  <button onClick={() => setAktivniNalogZaStampu(null)} className="text-slate-400 hover:text-white p-2">
                    <X size={20} />
                  </button>
                </div>
              </div>

              <div className="p-8 sm:p-10 overflow-y-auto flex-1 space-y-6 bg-white">
                <div className="flex justify-between items-start border-b-2 border-blue-900 pb-6">
                  <div>
                    <h2 className="text-3xl font-black tracking-tight text-blue-900">NB AUTO SERVIS</h2>
                    <p className="text-xs text-slate-600 mt-1">Sremčica, Beograd | Tel: +381 60 0716698</p>
                  </div>
                  <div className="text-right">
                    <h3 className="text-2xl font-bold text-slate-800">RADNI NALOG</h3>
                    <p className="text-base font-bold text-blue-700 mt-1">{aktivniNalogZaStampu.broj}</p>
                    <p className="text-xs text-slate-500 mt-0.5">Datum: {aktivniNalogZaStampu.datum}</p>
                  </div>
                </div>

                <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 text-sm space-y-2">
                  <p className="font-bold uppercase tracking-wide text-xs text-blue-900 mb-2">Podaci o klijentu i vozilu:</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {jeFirma ? (
                      <>
                        <p><span className="font-semibold text-slate-600">Naziv firme:</span> <span className="text-slate-900 font-bold">{aktivniNalogZaStampu.nazivFirme}</span></p>
                        <p><span className="font-semibold text-slate-600">PIB / Matični broj:</span> <span className="text-slate-900 font-mono">{aktivniNalogZaStampu.pib} / {aktivniNalogZaStampu.maticniBroj}</span></p>
                        <p className="sm:col-span-2"><span className="font-semibold text-slate-600">Adresa firme:</span> <span className="text-slate-900">{aktivniNalogZaStampu.adresaFirme || '/'}</span></p>
                      </>
                    ) : (
                      <p><span className="font-semibold text-slate-600">Ime i prezime:</span> <span className="text-slate-900 font-bold">{aktivniNalogZaStampu.ime} {aktivniNalogZaStampu.prezime}</span></p>
                    )}
                    <p><span className="font-semibold text-slate-600">Model vozila:</span> <span className="text-slate-900">{aktivniNalogZaStampu.modelVozila || '/'}</span></p>
                    <p><span className="font-semibold text-slate-600">Registarska oznaka:</span> <span className="text-slate-900 font-mono">{aktivniNalogZaStampu.registracija || '/'}</span></p>
                    <p><span className="font-semibold text-slate-600">Kilometraža:</span> <span className="text-slate-900 font-mono">{aktivniNalogZaStampu.kilometraza ? `${aktivniNalogZaStampu.kilometraza} km` : '/'}</span></p>
                    <p className="sm:col-span-2"><span className="font-semibold text-slate-600">Broj šasije (VIN):</span> <span className="text-slate-900 font-mono">{aktivniNalogZaStampu.brojSasije || '/'}</span></p>
                  </div>
                </div>

                <table className="w-full text-left border-collapse text-sm mt-4">
                  <thead>
                    <tr className="bg-slate-100 border-b-2 border-slate-300 text-slate-700 text-xs uppercase">
                      <th className="py-3 px-3">R.br</th>
                      <th className="py-3 px-3">Šifra / Usluga</th>
                      <th className="py-3 px-3">Naziv dela ili usluge</th>
                      <th className="py-3 px-3 text-center">Količina</th>
                      {!sakrijCeneNaStampi && (
                        <>
                          <th className="py-3 px-3 text-right">Cena (RSD)</th>
                          <th className="py-3 px-3 text-right">Ukupno (RSD)</th>
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {(aktivniNalogZaStampu.stavke || []).map((s, index) => (
                      <tr key={s.id || index} className="hover:bg-slate-50">
                        <td className="py-3 px-3 text-slate-500">{index + 1}</td>
                        <td className="py-3 px-3 font-mono text-xs text-blue-800 font-semibold">{s.sifra || 'USLUGA'}</td>
                        <td className="py-3 px-3 font-medium text-slate-900">{s.naziv}</td>
                        <td className="py-3 px-3 text-center">{s.kolicina}</td>
                        {!sakrijCeneNaStampi && (
                          <>
                            <td className="py-3 px-3 text-right">{s.cena ? s.cena.toLocaleString() : 0}</td>
                            <td className="py-3 px-3 text-right font-semibold text-slate-900">{(s.kolicina * s.cena).toLocaleString()}</td>
                          </>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>

                {aktivniNalogZaStampu.work_description && (
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-sm space-y-1">
                    <p className="font-bold uppercase tracking-wide text-xs text-blue-900 mb-1">Opis radova / izvršene usluge:</p>
                    <p className="text-slate-800 whitespace-pre-wrap leading-relaxed">{aktivniNalogZaStampu.work_description}</p>
                  </div>
                )}

                {!sakrijCeneNaStampi && (
                  <div className="flex justify-end pt-6 border-t-2 border-slate-300">
                    <div className="w-full max-w-xs space-y-2 text-right">
                      <div className="flex justify-between text-sm text-slate-600">
                        <span>Osnovica:</span>
                        <span className="font-semibold">{osnova.toLocaleString()} RSD</span>
                      </div>
                      {imaPdv && (
                        <div className="flex justify-between text-sm text-slate-600">
                          <span>PDV (20%):</span>
                          <span className="font-semibold">{pdvIznos.toLocaleString()} RSD</span>
                        </div>
                      )}
                      <div className="flex justify-between text-base font-bold text-slate-900 pt-2 border-t border-slate-300">
                        <span>Ukupno za uplatu:</span>
                        <span className="text-xl text-blue-900">{ukupnoZaUplatu.toLocaleString()} RSD</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
