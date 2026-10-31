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
  SearchCode
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
    opisRadova: ''
  });

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
        opisRadova: k.opis_radova
      })));
    }
  };

  const sacuvajRucnogKorisnika = async (e) => {
    e.preventDefault();
    if (!noviKorisnikRucno.ime || !noviKorisnikRucno.modelVozila) {
      alert('Unesite bar ime klijenta i model vozila!');
      return;
    }

    // Validacija po broju šasije (VIN) ako je unet
    if (noviKorisnikRucno.brojSasije.trim()) {
      const postojiPoSasiji = bazaKorisnika.some(k => 
        k.brojSasije && k.brojSasije.trim().toLowerCase() === noviKorisnikRucno.brojSasije.trim().toLowerCase()
      );

      if (postojiPoSasiji) {
        alert('Automobil sa unetim brojem šasije već postoji u bazi!');
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
      opis_radova: noviKorisnikRucno.opisRadova
    };

    const { error } = await supabase.from('baza_korisnika').insert([noviZapis]);
    if (error) {
      console.error('Greška pri upisu korisnika:', error);
      alert('Greška pri čuvanju korisnika u bazu!');
    } else {
      alert('Korisnik i vozilo uspešno sačuvani u bazu!');
      setNoviKorisnikRucno({ ime: '', prezime: '', telefon: '', modelVozila: '', brojSasije: '', registracija: '', opisRadova: '' });
      ucitajBazuKorisnika();
    }
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
  const [noviArtikal, setNoviArtikal] = useState({ sifra: '', naziv: '', nabavnaCena: '', prodajnaCena: '', kolicina: '' });

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

  // --- KALKULACIJA CENA ---
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

  const dodajArtikal = async (e) => {
    e.preventDefault();
    if (!noviArtikal.naziv || !noviArtikal.prodajnaCena) return;

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
    ime: '',
    prezime: '',
    telefon: '',
    modelVozila: '',
    brojSasije: '',
    registracija: '',
    include_vat: true,
    work_description: '',
    stavke: [],
    napomena: '',
    sacuvajKorisnikaUBazu: true,
    vremePocetka: '09:00',
    vremeKraje: '10:30',
    dizalica: 'Dizalica 1'
  });
  const [stavkaPretraga, setStavkaPretraga] = useState('');
  const [odabraniMagacinArtikal, setOdabraniMagacinArtikal] = useState(null);
  const [stavkaKolicina, setStavkaKolicina] = useState(1);
  const [ručniNaziv, setRučniNaziv] = useState('');
  const [ručniCena, setRučniCena] = useState('');
  const [ručniKolicina, setRučniKolicina] = useState(1);
  const [aktivniNalogZaStampu, setAktivniNalogZaStampu] = useState(null);

  // Funkcija za pretragu korisnika po broju šasije (VIN)
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
        registracija: pronadjeni.registracija || ''
      }));
      alert('Podaci klijenta, vozila i registracija uspešno preuzeti iz baze!');
    } else {
      alert('Nije pronađen nijedan automobil sa unetim brojem šasije u bazi.');
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
        ime: rn.ime,
        prezime: rn.prezime,
        telefon: rn.telefon,
        modelVozila: rn.model_vozila,
        brojSasije: rn.broj_sasije,
        registracija: rn.registracija,
        include_vat: rn.include_vat !== false,
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
      include_vat: trenutniNalog.include_vat,
      work_description: trenutniNalog.work_description,
      stavke: trenutniNalog.stavke
    };

    const { error } = await supabase.from('radni_nalozi').insert([noviNalog]);

    if (error) {
      console.error('Greška:', error);
      alert('Greška pri čuvanju radnog naloga u bazu!');
      return;
    }

    // Sačuvaj u bazu korisnika ako je čekirano
    if (trenutniNalog.sacuvajKorisnikaUBazu) {
      let vecPostojiPoSasiji = false;
      if (trenutniNalog.brojSasije.trim()) {
        vecPostojiPoSasiji = bazaKorisnika.some(k => 
          k.brojSasije && k.brojSasije.trim().toLowerCase() === trenutniNalog.brojSasije.trim().toLowerCase()
        );
      }

      if (!vecPostojiPoSasiji) {
        const noviKorisnikZapis = {
          ime: trenutniNalog.ime,
          prezime: trenutniNalog.prezime,
          telefon: trenutniNalog.telefon,
          model_vozila: trenutniNalog.modelVozila,
          broj_sasije: trenutniNalog.brojSasije,
          registracija: trenutniNalog.registracija,
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
      klijent: `${trenutniNalog.ime} ${trenutniNalog.prezime}`.trim(),
      auto: trenutniNalog.modelVozila,
      opis: trenutniNalog.work_description || 'Servis po radnom nalogu',
      cena: ukupnaCenaNaloga,
      zavrseno: false,
      nije_se_pojavio: false,
      dizalica: trenutniNalog.dizalica || 'Dizalica 1'
    };

    await supabase.from('termini').insert([noviTerminAutomatski]);
    ucitajTermine();

    alert('Radni nalog uspešno sačuvan, korisnik upisan u bazu i termin dodat u kalendar!');
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
      include_vat: true,
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

  // --- STANJE I FUNKCIJE: KALENDAR (Dizalice) ---
  const [trenutniDatum, setTrenutniDatum] = useState(new Date());
  const [zakazanaVozila, setZakazanaVozila] = useState({});
  const [prikaziModalDana, setPrikaziModalDana] = useState(false);
  const [izabraniDatumZaPregled, setIzabraniDatumZaPregled] = useState('');
  
  const [noviTermin, setNoviTermin] = useState({ 
    vremePocetka: '09:00', 
    vremeZavrsetka: '10:00', 
    klijent: '', 
    auto: '', 
    opis: '', 
    cena: '', 
    dizalica: 'Dizalica 1' 
  });

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
          vremePocetka: t.vreme_pocetka || t.vreme || '09:00',
          vremeZavrsetka: t.vreme_zavrsetka || '10:00',
          klijent: t.klijent,
          auto: t.auto,
          opis: t.opis,
          cena: t.cena,
          zavrseno: t.zavrseno,
          nije_se_pojavio: t.nije_se_pojavio || false,
          dizalica: t.dizalica || 'Dizalica 1'
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
    setNoviTermin({ vremePocetka: '09:00', vremeZavrsetka: '10:00', klijent: '', auto: '', opis: '', cena: '', dizalica: dizalicaName });
    setPrikaziModalDana(true);
  };

  const sacuvajTermin = async (e) => {
    e.preventDefault();
    if (!noviTermin.klijent || !izabraniDatumZaPregled) return;

    const novi = {
      datum: izabraniDatumZaPregled,
      vreme_pocetka: noviTermin.vremePocetka,
      vreme_zavrsetka: noviTermin.vremeZavrsetka,
      klijent: noviTermin.klijent,
      auto: noviTermin.auto,
      opis: noviTermin.opis,
      cena: Number(noviTermin.cena) || 0,
      zavrseno: false,
      nije_se_pojavio: false,
      dizalica: noviTermin.dizalica || 'Dizalica 1'
    };

    const { error } = await supabase.from('termini').insert([novi]);
    if (error) {
      console.error('Greška pri čuvanju termina:', error);
      alert('Greška pri čuvanju termina u bazu!');
    } else {
      ucitajTermine();
      setNoviTermin({ vremePocetka: '09:00', vremeZavrsetka: '10:00', klijent: '', auto: '', opis: '', cena: '', dizalica: noviTermin.dizalica });
    }
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

  // --- PREUZIMANJE EXCEL / CSV IZVEŠTAJA SA KALENDARA ---
  const preuzmiExcelIzvestaj = () => {
    const lista = zakazanaVozila[izabraniDatumZaPregled] || [];
    if (lista.length === 0) {
      alert('Nema zakazanih poslova za izabrani datum!');
      return;
    }

    let csvContent = "data:text/csv;charset=utf-8,\uFEFF";
    csvContent += "Datum,Dizalica,Vreme pocetka,Vreme zavrsetka,Klijent,Vozilo,Opis radova,Cena (RSD),Status\r\n";

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
        `"${t.auto || ''}"`,
        `"${t.opis || ''}"`,
        t.cena || 0,
        `"${statusStr}"`
      ].join(",");
      csvContent += red + "\r\n";
    });

    csvContent += `\r\n,,, , , ,UKUPNO NAPLAĆENO:,${ukupnoPazar} RSD\r\n`;

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

      {/* SADRŽAJ STRANICA */}
      <main className="flex-1 p-6 max-w-7xl mx-auto w-full">
        
        {/* 0. BAZA KORISNIKA MODUL */}
        {activeTab === 'baza-korisnika' && (
          <div className="space-y-6">
            <div className="bg-slate-800 border border-slate-700 p-6 rounded-xl shadow-lg space-y-4">
              <h3 className="text-lg font-bold text-white flex items-center space-x-2">
                <Users className="text-blue-400" size={20} />
                <span>Ručni unos novog korisnika i vozila u bazu (Validacija po broju šasije)</span>
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
                <div className="sm:col-span-2 lg:col-span-3">
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Opis radova na vozilu</label>
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
                      <th className="py-3 px-4">Broj šasije (VIN)</th>
                      <th className="py-3 px-4">Opis radova</th>
                      <th className="py-3 px-4 text-right">Akcija</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700">
                    {korisniciFiltrirani.map(k => (
                      <tr key={k.id} className="hover:bg-slate-750 transition">
                        <td className="py-3 px-4 font-bold text-white">{k.ime} {k.prezime}</td>
                        <td className="py-3 px-4 text-slate-300">{k.telefon || '/'}</td>
                        <td className="py-3 px-4 text-blue-400 font-semibold">{k.modelVozila}</td>
                        <td className="py-3 px-4 text-slate-300 font-mono">{k.registracija || '/'}</td>
                        <td className="py-3 px-4 text-slate-400 font-mono text-xs">{k.brojSasije || '/'}</td>
                        <td className="py-3 px-4 text-slate-300">{k.opisRadova || '/'}</td>
                        <td className="py-3 px-4 text-right">
                          <button onClick={() => obrisiKorisnikaIzBaze(k.id)} className="text-red-400 hover:text-red-300 p-1">
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
          </div>
        )}

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

            <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden shadow-lg">
              <div className="px-6 py-4 border-b border-slate-700 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h3 className="font-semibold text-white">Stanje na lageru (Samo pregled)</h3>
                  <p className="text-xs text-slate-400">Za izmene i kalkulaciju cena koristite modul "Kalkulacija cena"</p>
                </div>
                <div className="relative w-full md:w-72">
                  <Search size={16} className="absolute left-3 top-2.5 text-slate-400" />
                  <input 
                    type="text"
                    value={magacinPretraga}
                    onChange={(e) => setMagacinPretraga(e.target.value)}
                    placeholder="Pretraga po šifri, nazivu ili ceni..."
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                  {magacinPretraga && (
                    <button 
                      onClick={() => setMagacinPretraga('')}
                      className="absolute right-2.5 top-2 text-slate-400 hover:text-white"
                    >
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
                    {magacinFiltriran.length === 0 && (
                      <tr>
                        <td colSpan="5" className="text-center py-6 text-slate-400 text-sm">
                          {magacinPretraga ? 'Nije pronađen nijedan artikal za uneti pojam pretrage.' : 'Magacin je prazan.'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* MODUL KALKULACIJA CENA */}
        {activeTab === 'kalkulacija' && (
          <div className="space-y-6">
            {!kalkulacijaOtkljucana ? (
              <div className="bg-slate-800 border border-slate-700 p-8 rounded-2xl max-w-md mx-auto space-y-6 shadow-xl my-12">
                <div className="text-center space-y-2">
                  <div className="bg-blue-600/20 text-blue-400 border border-blue-500/30 w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3">
                    <Lock size={24} />
                  </div>
                  <h3 className="text-xl font-bold text-white">Zaštićen modul</h3>
                  <p className="text-xs text-slate-400">Unesite šifru za pristup kalkulaciji cena i izmeni stanja</p>
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
                  <button 
                    type="submit"
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2.5 rounded-xl text-sm transition shadow-lg shadow-blue-600/25"
                  >
                    Otključaj modul
                  </button>
                </form>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="bg-slate-800 border border-slate-700 p-6 rounded-xl shadow-lg space-y-4">
                  <div className="flex justify-between items-center border-b border-slate-700 pb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-white flex items-center space-x-2">
                        <Calculator size={20} className="text-blue-400" />
                        <span>Kalkulacija cena i izmena artikala</span>
                      </h3>
                      <p className="text-xs text-slate-400">Pretražite artikal po šifri ili nazivu da biste izmenili nabavnu cenu, prodajnu cenu ili količinu.</p>
                    </div>
                    <button 
                      onClick={() => { setKalkulacijaOtkljucana(false); setKalkulacijaUnesenaSifra(''); }}
                      className="text-xs bg-slate-900 border border-slate-700 text-slate-400 hover:text-white px-3 py-1.5 rounded-lg transition hover:bg-slate-950"
                    >
                      Zaključaj ponovo
                    </button>
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
                      placeholder="Unesite šifru ili naziv artikla..."
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
                        <span className="text-xs bg-blue-500/10 text-blue-400 px-3 py-1 rounded-full border border-blue-500/20">Modul Kalkulacija</span>
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
                        <button type="submit" className="bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2.5 rounded-xl text-sm font-semibold flex items-center space-x-2 transition shadow-lg shadow-emerald-600/20">
                          <Save size={16} />
                          <span>Sačuvaj izmene</span>
                        </button>
                      </div>
                    </form>
                  ) : kalkulacijaPretraga ? (
                    <p className="text-xs text-amber-400">Nije pronađen artikal sa unetom šifrom ili nazivom.</p>
                  ) : null}
                </div>

                <div className="bg-slate-800 border border-slate-700 p-6 rounded-xl shadow-lg space-y-4">
                  <div className="border-b border-slate-700 pb-3">
                    <h4 className="text-base font-semibold text-white flex items-center space-x-2">
                      <Plus size={18} className="text-blue-400" />
                      <span>Dodaj novi artikal u magacin</span>
                    </h4>
                    <p className="text-xs text-slate-400 mt-1">Šifra artikla se sama automatski dodeljuje redom (1, 2, 3...)</p>
                  </div>
                  <form onSubmit={dodajArtikal} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-1">
                    <div>
                      <label className="text-xs font-semibold text-slate-300 block mb-1">Naziv artikla *</label>
                      <input 
                        type="text" 
                        placeholder="Npr. Filter ulja Golf 7" 
                        value={noviArtikal.naziv}
                        onChange={e => setNoviArtikal({...noviArtikal, naziv: e.target.value})}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-300 block mb-1">Nabavna cena (RSD) *</label>
                      <input 
                        type="number" 
                        placeholder="0" 
                        value={noviArtikal.nabavnaCena}
                        onChange={e => setNoviArtikal({...noviArtikal, nabavnaCena: e.target.value})}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-300 block mb-1">Prodajna cena (RSD) *</label>
                      <input 
                        type="number" 
                        placeholder="0" 
                        value={noviArtikal.prodajnaCena}
                        onChange={e => setNoviArtikal({...noviArtikal, prodajnaCena: e.target.value})}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-300 block mb-1">Količina na stanju</label>
                      <div className="flex space-x-2">
                        <input 
                          type="number" 
                          placeholder="0" 
                          value={noviArtikal.kolicina}
                          onChange={e => setNoviArtikal({...noviArtikal, kolicina: e.target.value})}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                        />
                        <button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl font-medium flex items-center justify-center transition shadow-md shrink-0" title="Sačuvaj novi artikal">
                          <Plus size={18} />
                        </button>
                      </div>
                    </div>
                  </form>
                </div>
              </div>
            )}
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

                    {/* Broj šasije sa dugmetom za automatsko povlačenje */}
                    <div>
                      <label className="text-xs text-slate-400 block mb-1">Broj šasije (VIN)</label>
                      <div className="flex space-x-2">
                        <input 
                          type="text" 
                          value={trenutniNalog.brojSasije}
                          onChange={e => setTrenutniNalog({...trenutniNalog, brojSasije: e.target.value})}
                          placeholder="WAUZZZ..."
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 uppercase font-mono"
                        />
                        <button 
                          type="button" 
                          onClick={dohvatiKorisnikaPoSasiji}
                          className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-2 rounded-lg text-xs font-semibold flex items-center space-x-1 shrink0 transition"
                          title="Pronađi klijenta po broju šasije u bazi"
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
                      <label className="text-xs text-slate-400 block mb-1">Registarska oznaka</label>
                      <input 
                        type="text" 
                        value={trenutniNalog.registracija}
                        onChange={e => setTrenutniNalog({...trenutniNalog, registracija: e.target.value})}
                        placeholder="BG-000-XX"
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 uppercase font-mono"
                      />
                    </div>

                    <div>
                      <label className="text-xs text-slate-400 block mb-1">Opis radova na vozilu</label>
                      <textarea 
                        rows={3}
                        value={trenutniNalog.work_description || ''}
                        onChange={e => setTrenutniNalog({...trenutniNalog, work_description: e.target.value})}
                        placeholder="Unesite opis obavljenih radova i servisa..."
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 resize-none"
                      />
                    </div>

                    {/* Parametri za zakazivanje i bazu */}
                    <div className="pt-3 border-t border-slate-700 space-y-3">
                      <p className="text-xs font-bold text-blue-400 uppercase tracking-wider">Zakazivanje i Baza</p>
                      
                      <div>
                        <label className="text-xs text-slate-400 block mb-1">Datum</label>
                        <input 
                          type="date"
                          value={trenutniNalog.datum}
                          onChange={e => setTrenutniNalog({...trenutniNalog, datum: e.target.value})}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-xs text-slate-400 block mb-1">Vreme početka (24h)</label>
                          <input 
                            type="time"
                            value={trenutniNalog.vremePocetka}
                            onChange={e => setTrenutniNalog({...trenutniNalog, vremePocetka: e.target.value})}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-slate-400 block mb-1">Vreme kraja (24h)</label>
                          <input 
                            type="time"
                            value={trenutniNalog.vremeKraje}
                            onChange={e => setTrenutniNalog({...trenutniNalog, vremeKraje: e.target.value})}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-xs text-slate-400 block mb-1">Izaberi dizalicu</label>
                        <select 
                          value={trenutniNalog.dizalica}
                          onChange={e => setTrenutniNalog({...trenutniNalog, dizalica: e.target.value})}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
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
                          className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 bg-slate-900 border-slate-700"
                        />
                        <span className="text-xs font-semibold text-slate-200">Sačuvaj korisnika u bazu</span>
                      </label>
                    </div>

                    <div className="pt-2 border-t border-slate-700/80">
                      <label className="flex items-center space-x-2.5 cursor-pointer">
                        <input 
                          type="checkbox"
                          checked={trenutniNalog.include_vat !== false}
                          onChange={e => setTrenutniNalog({...trenutniNalog, include_vat: e.target.checked})}
                          className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 bg-slate-900 border-slate-700"
                        />
                        <span className="text-xs font-semibold text-slate-200">Obračunaj PDV (+20% na cenu)</span>
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

                      {trenutniNalog.stavke.length > 0 && (() => {
                        const osnovnaCena = trenutniNalog.stavke.reduce((acc, curr) => acc + (curr.cena * curr.kolicina), 0);
                        const pdvIznos = trenutniNalog.include_vat !== false ? osnovnaCena * 0.20 : 0;
                        const ukupnoZaUplatu = osnovnaCena + pdvIznos;

                        return (
                          <div className="flex justify-between items-center pt-4 border-t border-slate-700">
                            <div className="space-y-0.5">
                              <p className="text-xs text-slate-400">
                                Osnovica: <span className="text-slate-200 font-semibold">{osnovnaCena.toLocaleString()} RSD</span>
                                {trenutniNalog.include_vat !== false && <span> | PDV (20%): <span className="text-slate-200 font-semibold">{pdvIznos.toLocaleString()} RSD</span></span>}
                              </p>
                              <div className="text-lg font-bold text-white">
                                Ukupno za uplatu: <span className="text-emerald-400">{ukupnoZaUplatu.toLocaleString()} RSD</span>
                                {trenutniNalog.include_vat === false && <span className="text-xs font-normal text-slate-400 ml-2">(Bez PDV-a)</span>}
                              </div>
                            </div>
                            <button onClick={sacuvajRadniNalog} className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2.5 rounded-lg font-semibold flex items-center space-x-2 transition shadow">
                              <Save size={16} />
                              <span>Sačuvaj nalog, bazu i kalendar</span>
                            </button>
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
                    <p className="text-xs text-slate-400">Pregled svih izveštaja sačuvanih u Supabase bazi</p>
                  </div>
                  <div className="relative w-full md:w-80">
                    <Search size={16} className="absolute left-3 top-3 text-slate-400" />
                    <input 
                      type="text"
                      value={naloziPretraga}
                      onChange={(e) => setNaloziPretraga(e.target.value)}
                      placeholder="Pretraga po broju, klijentu, vozilu..."
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
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
                      {radniNalozi
                        .filter(rn => {
                          const term = naloziPretraga.toLowerCase();
                          return (
                            rn.broj.toLowerCase().includes(term) ||
                            (rn.ime && rn.ime.toLowerCase().includes(term)) ||
                            (rn.prezime && rn.prezime.toLowerCase().includes(term)) ||
                            (rn.modelVozila && rn.modelVozila.toLowerCase().includes(term)) ||
                            (rn.registracija && rn.registracija.toLowerCase().includes(term)) ||
                            (rn.telefon && rn.telefon.toLowerCase().includes(term))
                          );
                        })
                        .map(rn => {
                          const osnovnaCena = (rn.stavke || []).reduce((acc, curr) => acc + (curr.cena * curr.kolicina), 0);
                          const ukupnoCena = rn.include_vat !== false ? osnovnaCena * 1.20 : osnovnaCena;
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
              <p className="text-xs text-slate-400">Prikaz radnog vremena (24h) po dizalicama</p>
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

            {/* MODAL ZA PREGLED DANA */}
            {prikaziModalDana && (
              <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50 p-4">
                <div className="bg-slate-800 border border-slate-700 p-6 rounded-2xl max-w-6xl w-full space-y-6 shadow-2xl max-h-[90vh] overflow-y-auto">
                  
                  <div className="flex justify-between items-center border-b border-slate-700 pb-4">
                    <div>
                      <h4 className="font-bold text-xl text-white flex items-center space-x-2">
                        <CalendarIcon className="text-blue-400" />
                        <span>Raspored po dizalicama za datum: {izabraniDatumZaPregled}</span>
                      </h4>
                      <p className="text-xs text-slate-400 mt-0.5">Evidentirano vreme početka i završetka radova (24h)</p>
                    </div>
                    <div className="flex items-center space-x-3">
                      <button 
                        onClick={preuzmiExcelIzvestaj}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl text-xs font-semibold flex items-center space-x-2 transition shadow"
                      >
                        <Download size={16} />
                        <span>Preuzmi Excel izveštaj</span>
                      </button>
                      <button onClick={() => setPrikaziModalDana(false)} className="text-slate-400 hover:text-white bg-slate-900 p-2 rounded-xl border border-slate-700">
                        <X size={18} />
                      </button>
                    </div>
                  </div>

                  {(() => {
                    const lista = zakazanaVozila[izabraniDatumZaPregled] || [];
                    const zavrseniLista = lista.filter(t => t.zavrseno);
                    const propusteniLista = lista.filter(t => t.nije_se_pojavio);
                    const ukupniPazarDana = zavrseniLista.reduce((acc, curr) => acc + (Number(curr.cena) || 0), 0);

                    return (
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-slate-900 p-4 rounded-xl border border-slate-700">
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
                          <div className="bg-red-600/20 p-3 rounded-xl border border-red-600/30 text-red-400">
                            <XCircle size={24} />
                          </div>
                          <div>
                            <p className="text-xs text-slate-400">Nisu se pojavili</p>
                            <p className="text-xl font-bold text-red-400">{propusteniLista.length}</p>
                          </div>
                        </div>

                        <div className="flex items-center space-x-3">
                          <div className="bg-purple-600/20 p-3 rounded-xl border border-purple-600/30 text-purple-400">
                            <CheckCircle2 size={24} />
                          </div>
                          <div>
                            <p className="text-xs text-slate-400">Status dana</p>
                            <p className="text-sm font-bold text-purple-300 mt-1">
                              {lista.length > 0 && zavrseniLista.length + propusteniLista.length === lista.length ? 'Sve obrađeno ✓' : 'U toku radova...'}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* 3 DIZALICE - KOLONE */}
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

                            <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                              {listaZaDizalicu.length === 0 ? (
                                <p className="text-xs text-slate-500 italic text-center py-8">Nema zakazivanja na ovoj dizalici.</p>
                              ) : (
                                listaZaDizalicu.map((t) => (
                                  <div key={t.id} className={`p-3 rounded-xl border text-xs space-y-1.5 transition-all ${t.zavrseno ? 'bg-emerald-950/20 border-emerald-800/40 opacity-75' : t.nije_se_pojavio ? 'bg-red-950/20 border-red-800/40 opacity-75' : 'bg-slate-900 border-slate-800'}`}>
                                    <div className="flex justify-between items-center">
                                      <span className="font-bold text-blue-400 flex items-center space-x-1">
                                        <Clock size={12} />
                                        <span>{t.vremePocetka} - {t.vremeZavrsetka}</span>
                                      </span>
                                      <div className="flex items-center space-x-1">
                                        <button
                                          onClick={() => toggleZavrsenTermin(izabraniDatumZaPregled, t.id)}
                                          className={`p-1 rounded border transition-colors ${t.zavrseno ? 'bg-emerald-600 text-white border-emerald-500' : 'bg-slate-800 text-slate-400 border-slate-700'}`}
                                          title="Označi kao završeno"
                                        >
                                          <CheckCircle size={14} />
                                        </button>
                                        <button
                                          onClick={() => toggleNijeSePojavio(izabraniDatumZaPregled, t.id)}
                                          className={`p-1 rounded border transition-colors ${t.nije_se_pojavio ? 'bg-red-600 text-white border-red-500' : 'bg-slate-800 text-slate-400 border-slate-700'}`}
                                          title="Korisnik se nije pojavio"
                                        >
                                          <XCircle size={14} />
                                        </button>
                                        <button
                                          onClick={() => obrisiTermin(izabraniDatumZaPregled, t.id)}
                                          className="p-1 bg-slate-800 hover:bg-red-600/20 text-slate-400 hover:text-red-400 rounded border border-slate-700 transition-colors"
                                          title="Obriši termin"
                                        >
                                          <Trash2 size={14} />
                                        </button>
                                      </div>
                                    </div>
                                    <div className={`font-semibold ${t.zavrseno ? 'text-emerald-300 line-through' : t.nije_se_pojavio ? 'text-red-300 line-through' : 'text-white'}`}>{t.klijent} - {t.auto}</div>
                                    {t.opis && <div className="text-slate-400">{t.opis}</div>}
                                    {t.nije_se_pojavio && <div className="text-red-400 font-bold uppercase text-[10px]">Korisnik se nije pojavio</div>}
                                    {t.cena > 0 && <div className="text-emerald-400 font-semibold">{Number(t.cena).toLocaleString()} RSD</div>}
                                  </div>
                                ))
                              )}
                            </div>
                          </div>

                          <button
                            onClick={() => setNoviTermin(prev => ({ ...prev, dizalica: dizalicaName }))}
                            className={`mt-4 w-full py-2.5 px-3 rounded-xl text-xs font-semibold transition-all flex items-center justify-center space-x-1.5 ${noviTermin.dizalica === dizalicaName ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20' : 'bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800'}`}
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
                      <span>Novi termin za: <strong className="text-blue-400">{noviTermin.dizalica}</strong> (Datum: {izabraniDatumZaPregled})</span>
                    </h5>

                    <form onSubmit={sacuvajTermin} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-8 gap-3">
                      <div className="lg:col-span-1">
                        <label className="text-[10px] text-slate-400 block mb-1">Dizalica</label>
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
                      <div className="lg:col-span-1">
                        <label className="text-[10px] text-slate-400 block mb-1">Početak (24h)</label>
                        <input
                          type="time"
                          value={noviTermin.vremePocetka}
                          onChange={e => setNoviTermin({...noviTermin, vremePocetka: e.target.value})}
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white"
                          required
                        />
                      </div>
                      <div className="lg:col-span-1">
                        <label className="text-[10px] text-slate-400 block mb-1">Kraj (24h)</label>
                        <input
                          type="time"
                          value={noviTermin.vremeZavrsetka}
                          onChange={e => setNoviTermin({...noviTermin, vremeZavrsetka: e.target.value})}
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white"
                          required
                        />
                      </div>
                      <div className="lg:col-span-1">
                        <label className="text-[10px] text-slate-400 block mb-1">Klijent *</label>
                        <input
                          type="text"
                          placeholder="Petar Petrović"
                          value={noviTermin.klijent}
                          onChange={e => setNoviTermin({...noviTermin, klijent: e.target.value})}
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500"
                          required
                        />
                      </div>
                      <div className="lg:col-span-1">
                        <label className="text-[10px] text-slate-400 block mb-1">Model vozila</label>
                        <input
                          type="text"
                          placeholder="Audi A4"
                          value={noviTermin.auto}
                          onChange={e => setNoviTermin({...noviTermin, auto: e.target.value})}
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500"
                        />
                      </div>
                      <div className="lg:col-span-1">
                        <label className="text-[10px] text-slate-400 block mb-1">Cena (RSD)</label>
                        <input
                          type="number"
                          placeholder="12000"
                          value={noviTermin.cena}
                          onChange={e => setNoviTermin({...noviTermin, cena: e.target.value})}
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500"
                        />
                      </div>
                      <div className="lg:col-span-1">
                        <label className="text-[10px] text-slate-400 block mb-1">Opis / Radovi</label>
                        <input
                          type="text"
                          placeholder="Mali servis"
                          value={noviTermin.opis}
                          onChange={e => setNoviTermin({...noviTermin, opis: e.target.value})}
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500"
                        />
                      </div>
                      <div className="lg:col-span-1 flex items-end">
                        <button
                          type="submit"
                          className="w-full bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium py-2 px-3 rounded-xl transition-colors shadow-lg shadow-blue-600/20 flex items-center justify-center space-x-1"
                        >
                          <Plus size={16} />
                          <span>Zakaži</span>
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
      {aktivniNalogZaStampu && (() => {
        const imaPdv = aktivniNalogZaStampu.include_vat !== false;
        const osnova = (aktivniNalogZaStampu.stavke || []).reduce((acc, curr) => acc + (curr.cena * curr.kolicina), 0);
        const pdvIznos = imaPdv ? osnova * 0.20 : 0;
        const ukupnoZaUplatu = osnova + pdvIznos;

        return (
          <div className="fixed inset-0 bg-black/85 flex items-center justify-center z-50 p-2 sm:p-6 overflow-y-auto print:p-0 print:bg-white">
            <div className="bg-white text-slate-900 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl relative print:shadow-none print:max-w-none print:w-full print:h-auto print:max-h-none overflow-hidden">
              
              <div className="sticky top-0 bg-slate-900 text-white p-4 px-6 flex justify-between items-center z-10 print:hidden border-b border-slate-800">
                <div className="flex items-center space-x-3">
                  <Printer className="text-blue-400" size={20} />
                  <h4 className="font-bold text-base text-white">Pregled radnog naloga</h4>
                </div>
                <div className="flex items-center space-x-3">
                  <button 
                    onClick={() => window.print()}
                    className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2 rounded-xl text-sm font-semibold flex items-center space-x-2 transition shadow-lg shadow-blue-600/30"
                  >
                    <Printer size={16} />
                    <span>Štampaj / Sačuvaj PDF</span>
                  </button>
                  <button 
                    onClick={() => setAktivniNalogZaStampu(null)} 
                    className="bg-slate-800 hover:bg-red-600/20 hover:text-red-400 text-slate-400 p-2 rounded-xl border border-slate-700 transition"
                    title="Zatvori (Esc)"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              <div className="p-8 sm:p-10 overflow-y-auto flex-1 space-y-6 bg-white">
                <div className="flex justify-between items-start border-b-2 border-blue-900 pb-6">
                  <div>
                    <h2 className="text-3xl font-black tracking-tight text-blue-900">NB AUTO SERVIS</h2>
                    <p className="text-xs text-slate-600 mt-1">Sremčica, Beograd | Tel: +381 60 0716698</p>
                    <p className="text-xs text-slate-600">Profesionalni auto servis i dijagnostika</p>
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
                    <p><span className="font-semibold text-slate-600">Ime i prezime:</span> <span className="text-slate-900 font-bold">{aktivniNalogZaStampu.ime} {aktivniNalogZaStampu.prezime}</span></p>
                    <p><span className="font-semibold text-slate-600">Kontakt telefon:</span> <span className="text-slate-900">{aktivniNalogZaStampu.telefon || '+381 60 0716698'}</span></p>
                    <p><span className="font-semibold text-slate-600">Model vozila:</span> <span className="text-slate-900">{aktivniNalogZaStampu.modelVozila || '/'}</span></p>
                    <p><span className="font-semibold text-slate-600">Registarska oznaka:</span> <span className="text-slate-900 font-mono">{aktivniNalogZaStampu.registracija || '/'}</span></p>
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
                      <th className="py-3 px-3 text-right">Cena (RSD)</th>
                      <th className="py-3 px-3 text-right">Ukupno (RSD)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {(aktivniNalogZaStampu.stavke || []).map((s, index) => (
                      <tr key={s.id || index} className="hover:bg-slate-50">
                        <td className="py-3 px-3 text-slate-500">{index + 1}</td>
                        <td className="py-3 px-3 font-mono text-xs text-blue-800 font-semibold">{s.sifra || 'USLUGA'}</td>
                        <td className="py-3 px-3 font-medium text-slate-900">{s.naziv}</td>
                        <td className="py-3 px-3 text-center">{s.kolicina}</td>
                        <td className="py-3 px-3 text-right">{s.cena ? s.cena.toLocaleString() : 0}</td>
                        <td className="py-3 px-3 text-right font-semibold text-slate-900">{(s.kolicina * s.cena).toLocaleString()}</td>
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

                <div className="flex justify-end pt-6 border-t-2 border-slate-300">
                  <div className="w-full max-w-xs space-y-2 text-right">
                    <div className="flex justify-between text-sm text-slate-600">
                      <span>Osnovica (Delovi + Usluge):</span>
                      <span className="font-semibold">{osnova.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})} RSD</span>
                    </div>
                    {imaPdv ? (
                      <div className="flex justify-between text-sm text-slate-600">
                        <span>PDV (20%):</span>
                        <span className="font-semibold">{pdvIznos.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})} RSD</span>
                      </div>
                    ) : (
                      <div className="text-xs text-slate-500 italic">
                        (PDV nije obračunat)
                      </div>
                    )}
                    <div className="flex justify-between text-base font-bold text-slate-900 pt-2 border-t border-slate-300">
                      <span>{imaPdv ? 'Ukupno (Bruto sa PDV):' : 'Ukupno za uplatu:'}</span>
                      <span className="text-xl text-blue-900">{ukupnoZaUplatu.toLocaleString()} RSD</span>
                    </div>
                  </div>
                </div>

                <div className="pt-16 flex justify-between text-xs text-slate-600">
                  <div>
                    <p className="font-semibold">Potpis primurske stranke / klijenta:</p>
                    <div className="mt-12 border-t border-slate-400 w-56"></div>
                  </div>
                  <div className="text-center">
                    <p className="font-semibold">Ovlašćeno lice - NB Auto Servis</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Tel: +381 60 0716698</p>
                    <div className="mt-8 border-t border-slate-400 w-56"></div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        );
      })()}
    </div>
  );
}
