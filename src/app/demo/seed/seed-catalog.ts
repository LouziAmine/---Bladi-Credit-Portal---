import { ActivitySectorEntity, DocumentSuggestionEntity, EnterpriseType } from '../core/entities';

const SEED_DATE = '2026-01-01T09:00:00.000Z';

const SECTOR_ROWS: [string, string][] = [
  ['Agriculture, sylviculture et pêche', 'b7c0f462-e290-4837-bddc-6556720cc2a0'],
  ['Industrie agroalimentaire', '12e06fb9-1746-4043-946b-89d1e91d53a1'],
  ['Textile et habillement', '062bb7eb-70b4-4b74-b3bf-14037b2e76d0'],
  ['Cuir et chaussures', 'f70be8e1-2885-4e0d-98ef-033fdb8108d3'],
  ['Industrie chimique et parachimique', '3abc06cb-0e1a-40fb-9019-9f222338714a'],
  ['Industrie métallurgique et mécanique', 'ce8c77e6-b997-4909-9721-f5d66a58c7b1'],
  ['Industrie électrique et électronique', 'd4fbf0d6-ed8a-4866-9f02-e832b72003b0'],
  ['Automobile et aéronautique', 'f0a5c139-91ad-4878-9d9b-64c213203d5b'],
  ['Bâtiment et travaux publics (BTP)', 'e203de3b-c53e-490e-9118-0f0cdea4d963'],
  ['Immobilier', '74386a50-e4cb-4005-942b-8d4d5392b0f6'],
  ['Commerce', 'da3d84c3-fccb-48b8-80e4-168e94e4769a'],
  ['Transport et logistique', 'e1725a00-d268-41b3-a081-01e4bd5ab5cb'],
  ['Tourisme et hôtellerie', '4844a71c-ed81-4017-baf0-8d720a692fa0'],
  ["Technologies de l'information", 'e9244de8-f2a2-42b0-8c54-8ba80e885a64'],
  ['Télécommunications', '7e89472e-b3f0-4acf-8070-5af10f979e95'],
  ['Services financiers', '4065ffa8-e777-44e0-9d9a-411eaa7a493f'],
  ['Éducation', 'd6214572-95cb-4166-bedb-e3723d6364b1'],
  ['Santé', '75c733be-9729-4ea9-91ec-cbe2e75cb575'],
  ['Énergie et mines', '72802e1d-8f42-4530-a7fc-e165d2eb12ff'],
  ['Artisanat', '65c8d628-1035-457a-af98-66ff2e7ed672'],
  ['Autres services', '72de6ba3-e0e5-4d21-87dd-77043a41dbc6'],
];

export const SEED_ACTIVITY_SECTORS: ActivitySectorEntity[] = SECTOR_ROWS.map(([name, publicId], i) => ({
  id: i + 1,
  publicId,
  name,
  createdAt: SEED_DATE,
}));

type SugRow = [EnterpriseType | null, string | null, string, string, 'ENTERPRISE' | 'CSP'];

const SUGGESTION_ROWS: SugRow[] = [
  [null, null, 'CIN du dirigeant', '26ffdfc0-ebb3-42ab-af5c-cf1e733e20b6', 'ENTERPRISE'],
  [null, null, 'Justificatif de domicile du siège social', 'e3ef5cfc-e997-40d5-a9bd-1de8356418dc', 'ENTERPRISE'],
  [null, null, "RIB de l'entreprise", '2967c9a9-cab1-4954-9714-41889fddf6d2', 'ENTERPRISE'],
  [null, null, "Devis / facture proforma de l'objet du financement", '7243aa9d-c513-40f1-a96e-94d0ef21da9d', 'ENTERPRISE'],
  ['AUTO_ENTREPRENEUR', null, "Attestation d'inscription au régime auto-entrepreneur", 'a35d2a7f-94f6-469c-bc49-25a96bda5cc7', 'ENTERPRISE'],
  ['AUTO_ENTREPRENEUR', null, 'Relevés bancaires (3 derniers mois)', '4a0cf57c-dae7-484b-a1c2-e0857a0659e8', 'ENTERPRISE'],
  ['AUTO_ENTREPRENEUR', null, "Prévisionnel d'activité", '6fc0a611-ec6d-4a4c-a935-055d99d74b3c', 'ENTERPRISE'],
  ['TPE', null, 'Extrait du Registre de Commerce (modèle J, < 3 mois)', '8b577016-3b08-4ab7-84d0-83b0a86290ec', 'ENTERPRISE'],
  ['TPE', null, 'Statuts de la société', '53b77de2-4ae2-41c7-92b9-fa7981c354a9', 'ENTERPRISE'],
  ['TPE', null, "Dernier avis d'imposition / attestation fiscale", '0724514f-44b5-4b26-a13a-ead91922ae20', 'ENTERPRISE'],
  ['TPE', null, 'Relevés bancaires (6 derniers mois)', 'ee4b6764-8e40-4615-9794-e7a53c136d21', 'ENTERPRISE'],
  ['TPE', null, 'Business plan / plan de financement', '919ee6dc-b860-4e32-8134-056bfebfd413', 'ENTERPRISE'],
  ['PME', null, 'Liasse fiscale certifiée (3 derniers exercices)', '7f7e3845-4a8c-4926-976d-09d015aaa78f', 'ENTERPRISE'],
  ['PME', null, 'Attestation de régularité fiscale', '9b904994-13ca-493e-ad67-ae570d9073a1', 'ENTERPRISE'],
  ['PME', null, 'Attestation CNSS', 'e5f7824f-2677-45eb-a354-661c75cb9ed7', 'ENTERPRISE'],
  ['PME', null, 'Relevés bancaires (12 derniers mois)', 'b17505d8-1266-4321-918b-b1e2c476dad8', 'ENTERPRISE'],
  ['PME', null, "PV d'assemblée générale autorisant l'emprunt", '8037796c-268c-4d70-be36-ecbf12492af6', 'ENTERPRISE'],
  ['PME', null, 'Garanties proposées', '6c11fe1a-9b14-4be4-a11a-fda77edb5f83', 'ENTERPRISE'],
  ['ETI', null, 'États financiers certifiés par un commissaire aux comptes', '98ef3bb4-80f3-47d8-9796-cf0bf4702dbb', 'ENTERPRISE'],
  ['ETI', null, 'Rapport du commissaire aux comptes', '52f2e6bd-c8ed-4a33-89ce-dc3fec5c0c3f', 'ENTERPRISE'],
  ['ETI', null, 'Organigramme du groupe / bénéficiaires effectifs', '8752c990-54c9-4662-9fc4-2c795a0bd419', 'ENTERPRISE'],
  ['ETI', null, 'Tableau des engagements bancaires existants', '40e233ed-2fbb-45db-aaba-b7bd8fd693b5', 'ENTERPRISE'],
  ['GE', null, 'États financiers consolidés', 'e308d0eb-fdbc-43f2-90f4-00a9ea93e4f4', 'ENTERPRISE'],
  ['GE', null, 'Rapport annuel / rapport de gestion', 'b85b8eb0-f9b3-4a2e-8622-63dc49b7cdcb', 'ENTERPRISE'],
  ['GE', null, 'Structure actionnariale complète', 'c894333d-da0e-426c-bfe3-508d1002fce1', 'ENTERPRISE'],
  ['GE', null, 'Convention de crédit / pool bancaire existant', 'a5026893-8bde-4d0b-9b1a-5eaebbe18db6', 'ENTERPRISE'],
  [null, null, "Attestation d'assurance décès-invalidité (ADI) de la caution", '9224d677-5a61-4005-84c4-a76c8b4be963', 'ENTERPRISE'],
  [null, null, "Police d'assurance dommages / multirisque sur les garanties réelles", '440c5c4c-44c4-48ce-a21d-aaff8d1a4c8e', 'ENTERPRISE'],
  [null, null, "Attestation de délégation d'assurance (assureur externe)", '03255ddb-7722-484b-a3f4-fab9f105b2e5', 'ENTERPRISE'],
  [null, 'FONC', 'CIN', '92dc0561-df12-4bb6-bcfb-d5f2b0fa24e0', 'CSP'],
  [null, 'FONC', 'Demande de financement', 'c8e5da96-4fd5-4ac0-933c-d427f7c603ce', 'CSP'],
  [null, 'FONC', 'Devis notaire', 'fe84d1a4-eddf-45d7-ba07-c724bbcf9adb', 'CSP'],
  [null, 'FONC', 'Certificat de propriété', '15b34c00-2520-46ba-8a43-7dd95a61c73a', 'CSP'],
  [null, 'FONC', 'Attestation de travail', '09b15d23-cf7c-4c02-8585-de15b381dacb', 'CSP'],
  [null, 'FONC', 'Attestation de salaire', '6b9b23cd-bab5-4c8d-93f0-89b7a3d81b8b', 'CSP'],
  [null, 'FONC', 'Bulletin de paie (3 derniers mois)', '5957632a-7e96-4b25-98d0-681b9b6138b2', 'CSP'],
  [null, 'FONC', 'Relevés bancaires (6 derniers mois)', '339dbec2-2d75-4ad8-bacb-69e62e4b7ad9', 'CSP'],
];

export const SEED_DOCUMENT_SUGGESTIONS: DocumentSuggestionEntity[] = SUGGESTION_ROWS.map(
  ([enterpriseType, cspCode, label, publicId, clientScope], i) => ({
    id: i + 1,
    publicId,
    enterpriseType,
    cspCode,
    label,
    createdAt: SEED_DATE,
    clientScope,
  }),
);
