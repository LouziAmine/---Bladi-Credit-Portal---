const FIRST_NAMES = [
  'Youssef', 'Karim', 'Mehdi', 'Hamza', 'Omar', 'Anas', 'Othmane', 'Yassine', 'Reda', 'Ayoub', 'Hicham', 'Rachid',
  'Nabil', 'Soufiane', 'Adil', 'Fatima Zahra', 'Salma', 'Meryem', 'Khadija', 'Nadia', 'Imane', 'Houda', 'Sanaa',
  'Loubna', 'Ghita', 'Kawtar', 'Hajar', 'Siham', 'Zineb', 'Asmae',
];
const LAST_NAMES = [
  'Benali', 'El Amrani', 'Alaoui', 'Bennani', 'Tazi', 'Berrada', 'Chraibi', 'Fassi', 'Idrissi', 'Kettani',
  'Lahlou', 'Sebti', 'Benjelloun', 'Ouazzani', 'Sekkat', 'Kabbaj', 'Naciri', 'Bouzidi', 'El Mansouri', 'Ziani',
  'Haddad', 'Belkadi', 'Rifai', 'Mouline', 'Guessous', 'Squalli', 'Benkirane', 'Lamrani', 'Tahiri', 'Filali',
];
const COMPANY_STEMS = [
  'Tissages de l\'Atlas', 'Oasis Agro Souss', 'Menara Logistique', 'Riad Céramiques', 'Tanger Med Composants',
  'Argane Cosmétiques', 'Sahara Solaire', 'Doukkala Laiterie', 'Rif Matériaux', 'Bouregreg Imprimerie',
  'Ifrane Menuiserie', 'Saïss Conserves', 'Chaouia Transports', 'Tadla Agrumes', 'Gharb Emballages',
  'Zagora Palmeraie', 'Oriental Plasturgie', 'Essaouira Pêche', 'Kasbah Hôtellerie', 'Draa Mécanique',
];
const LEGAL_FORMS = ['SARL', 'SA', 'SARL AU'];
const CITIES = [
  { name: 'Casablanca', code: 'CASA' }, { name: 'Rabat', code: 'RABAT' }, { name: 'Tanger', code: 'TANGER' },
  { name: 'Marrakech', code: 'MKECH' }, { name: 'Fès', code: 'FES' }, { name: 'Agadir', code: 'AGADIR' },
  { name: 'Oujda', code: 'OUJDA' }, { name: 'Meknès', code: 'MEKNES' },
];
const SECTORS = ['Textile', 'Agroalimentaire', 'Logistique', 'BTP', 'Industrie', 'Commerce', 'Tourisme', 'Énergie'];

const pick = <T>(list: readonly T[]): T => list[Math.floor(Math.random() * list.length)];
const digits = (n: number): string => Array.from({ length: n }, () => Math.floor(Math.random() * 10)).join('');
const slug = (s: string): string => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
  .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

export interface Person {
  firstName: string;
  lastName: string;
  fullName: string;
  username: string;
  email: string;
  phone: string;
}

export function person(domain = 'bladi-credit.ma'): Person {
  const firstName = pick(FIRST_NAMES);
  const lastName = pick(LAST_NAMES);
  const login = `${slug(firstName).replace(/-/g, '')}.${slug(lastName).replace(/-/g, '')}`;
  return {
    firstName, lastName, fullName: `${firstName} ${lastName}`,
    username: login,
    email: `${login}@${domain}`,
    phone: `0${pick(['6', '7'])}${digits(8)}`,
  };
}

export interface Company {
  name: string;
  city: string;
  sector: string;
  registrationNumber: string;
  ice: string;
  contact: Person;
  contactEmail: string;
}

export function company(): Company {
  const city = pick(CITIES);
  const stem = pick(COMPANY_STEMS);
  const name = `${stem} ${city.name} ${pick(LEGAL_FORMS)}`;
  const domain = `${slug(stem).replace(/-(de|l)-/g, '-')}-${slug(city.name)}.ma`;
  const contact = person(domain);
  return {
    name, city: city.name, sector: pick(SECTORS),
    registrationNumber: `RC-${city.code}-${digits(6)}`,
    ice: `00${digits(13)}`,
    contact,
    contactEmail: contact.email,
  };
}
