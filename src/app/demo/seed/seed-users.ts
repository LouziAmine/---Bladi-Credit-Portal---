import { UserEntity } from '../core/entities';

const DEMO_PASSWORD = 'demo123';

type Row = [number, string, string, number | null, number | null, string];

const ROWS: Row[] = [
  [1, 'admin', 'Administrateur', null, null, '4355399b-ae41-476c-819d-5a584306befc'],
  [2, 'amine.louzi', 'Amine Louzi', 1, 1, '66ef86d6-76ec-4e21-8511-7b00b423277a'],
  [3, 'sara.bennani', 'Sara Bennani', 1, 1, '45df6518-e1fe-4db6-8249-bad5dad74788'],
  [4, 'youssef.elamrani', 'Youssef El Amrani', 2, 2, '2df4b955-9509-4373-aedf-5caff92ed9fe'],
  [5, 'nadia.chraibi', 'Nadia Chraibi', 2, 2, 'a310f767-7476-4870-a1c6-2f83e8978988'],
  [6, 'karim.tazi', 'Karim Tazi', 6, 2, '0283a6f2-8f25-4571-8fac-5e707fa8a4eb'],
  [7, 'hind.berrada', 'Hind Berrada', 6, 2, '5f8b2970-3ab8-4015-a364-6460d7872e6a'],
  [8, 'hamza.idrissi', 'Hamza Idrissi', 2, 3, '626ac578-8f3e-4298-8a63-ef7b07c5558c'],
  [9, 'leila.fassi', 'Leila Fassi', 6, 3, '917be30e-d1d9-4e9a-b4bc-4663b22a418a'],
  [10, 'omar.benjelloun', 'Omar Benjelloun', 4, 5, '3b69836d-9933-40c5-861d-773ff226bc85'],
  [11, 'meryem.alaoui', 'Meryem Alaoui', 4, 5, '210733b7-3f5c-4648-9ca3-83c43dd8bc20'],
  [12, 'zineb.kabbaj', 'Zineb Kabbaj', 3, 5, '4c592531-24dd-48cb-953d-e741edb7d631'],
  [13, 'rachid.sekkat', 'Rachid Sekkat', 3, 5, '8f7830fa-f929-456a-9b1f-bd494f835eb1'],
  [14, 'othmane.bourhim', 'Othmane Bourhim', 3, 5, '76c8e2d4-8ab7-4e90-a9ab-2e159eaba0b1'],
  [15, 'fatimazahra.berrada', 'Fatima Zahra Berrada', 5, 5, 'a4d9b956-bb6f-4980-997a-d4bccb8ce968'],
  [16, 'anas.moujahid', 'Anas Moujahid', 5, 5, 'fa594f66-bd3b-48cb-aac5-ca1d2c42fdb5'],
  [17, 'younes.ouazzani', 'Younes Ouazzani', 7, 5, '06e6dd81-9334-47eb-bf87-a361b5a67a23'],
  [18, 'ikram.sabri', 'Ikram Sabri', 7, 5, 'ce6b7be9-1062-460e-8f34-f006ca8e1400'],
  [19, 'khalid.squalli', 'Khalid Squalli', 8, 5, '97e42b67-cee1-42d8-b66b-a3e016f8073d'],
  [20, 'samira.ghazi', 'Samira Ghazi', 8, 5, 'b3b8aa9d-9fbc-45a1-92f1-b09dea8931fc'],
  [21, 'abdellah.chakir', 'Abdellah Chakir', 9, 5, '91b9ca90-d3e6-4f71-a093-8dc36984505d'],
  [22, 'widad.naciri', 'Widad Naciri', 9, 5, 'e04fce6f-297a-44a0-8427-c5e298902e71'],
  [23, 'imane.bouzidi', 'Imane Bouzidi', 10, 6, '43329234-f926-4c02-b2ea-7f4482f4d29e'],
  [24, 'yassine.rifai', 'Yassine Rifai', 10, 6, '9d3ee029-64d0-4773-8798-a24c82b7938e'],
  [25, 'salma.idrissi', 'Salma Idrissi', 10, 7, '0e6bcca6-3bdc-4a0e-a4f0-19b8bc3e5297'],
  [26, 'hicham.naciri', 'Hicham Naciri', 10, 7, 'f87cfd5b-0981-44b8-851e-93372677749e'],
];

export const SEED_USERS: UserEntity[] = ROWS.map(([id, username, fullName, gradeId, teamId, publicId]) => ({
  id,
  publicId,
  username,
  password: username === 'admin' ? 'admin123' : DEMO_PASSWORD,
  role: 'MANAGER',
  fullName,
  email: `${username}@bladi-credit.ma`,
  gradeId,
  teamId,
}));
