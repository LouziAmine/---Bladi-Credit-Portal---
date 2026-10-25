import { GradeEntity, TeamEntity } from '../core/entities';

export const SEED_GRADES: GradeEntity[] = [
  { id: 1, code: 'CHARGE_AFFAIRES', name: "Chargé d'affaires", publicId: '9c923891-2e05-4570-985e-872a547c5005' },
  { id: 2, code: 'CHARGE_INVESTISSEMENT', name: "Chargé d'investissement", publicId: '13bde841-ed2c-466b-ba4b-564a7070ccf8' },
  { id: 3, code: 'ANALYSTE', name: 'Analyste', publicId: '9683c0fe-7658-452a-ae0d-5cf1242c2db2' },
  { id: 4, code: 'RESP_DEPT', name: 'Responsable Département', publicId: '982cc879-eccf-40ea-b54e-019c5d0687db' },
  { id: 5, code: 'RESP_DIR', name: 'Responsable Direction', publicId: '2b02f46c-60ce-491b-8a05-75c149015f4e' },
  { id: 6, code: 'DIRECTEUR', name: 'Directeur', publicId: '12c5d10f-c714-436b-9bfc-d15fa3b8ff91' },
  { id: 7, code: 'SUPPORT_ADMIN', name: 'Support Administratif', publicId: '5419cb98-52c9-4602-89bb-621053f714af' },
  { id: 8, code: 'DECIDEUR', name: 'Décideur', publicId: '23bccb58-04d1-43b4-a410-9652edb02aa9' },
  { id: 9, code: 'SUPERVISEUR', name: 'Superviseur', publicId: '74f62b53-3a48-46a4-a577-2236e4fcc92e' },
  { id: 10, code: 'GESTIONNAIRE', name: 'Gestionnaire', publicId: 'bc6c0b30-4230-4f17-ae97-36d50971d81c' },
];

export const SEED_TEAMS: TeamEntity[] = [
  { id: 1, code: 'RESEAU', name: 'Réseau', publicId: '7199b2a8-b926-4b6b-8133-8f0729a4176e' },
  { id: 2, code: 'PPIF_PME', name: "Plateforme d'instruction PPIF PME", publicId: '98eaf7a1-bf42-4ce9-842b-6540d40ba1f8' },
  { id: 3, code: 'PPIF_GE', name: "Plateforme d'instruction PPIF GE", publicId: '9860fff5-461f-4bce-9140-e071ee5680f1' },
  { id: 4, code: 'BKGR', name: "Plateforme d'instruction BKGR", publicId: '100dfff7-135d-4e29-9ec5-13e8dc333e35' },
  { id: 5, code: 'PAE', name: 'PAE (Pôle Analyse et Engagements)', publicId: '1035adc1-14e3-4901-ac24-0c0569b24d89' },
  { id: 6, code: 'OGS_GARANTIES', name: 'OGS Garanties', publicId: '45bb8b97-40d2-44f3-a8c4-e1d2c2745ff3' },
  { id: 7, code: 'OGS_MEG', name: 'OGS Mise en gestion', publicId: '80086f2c-2d5f-4fc9-8b91-4075ce964ba7' },
];
